import 'server-only';
import { VolunteerCopilotService } from '@/lib/ai/volunteer-copilot';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';

export type EventTopic =
  | 'stadium.incident.created'
  | 'stadium.gate.congested'
  | 'stadium.simulation.act_triggered'
  | 'stadium.emergency.broadcast_requested';

export interface StadiumEvent<T = unknown> {
  eventId: string;
  topic: EventTopic;
  timestamp: string;
  payload: T;
}

type EventHandler<T = unknown> = (event: StadiumEvent<T>) => Promise<void>;

/**
 * Pub/Sub Event Bus (in-process). Decouples high-velocity ingestion from
 * asynchronous Gemini inference, mirroring how Cloud Pub/Sub + Eventarc
 * would be wired in production.
 */
class PubSubEventBus {
  private subscribers: Map<EventTopic, Set<EventHandler>> = new Map();
  private history: StadiumEvent[] = [];

  constructor() {
    this.registerDefaultWorkers();
  }

  public subscribe<T>(topic: EventTopic, handler: EventHandler<T>): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler as EventHandler);
    return () => {
      this.subscribers.get(topic)?.delete(handler as EventHandler);
    };
  }

  public async publish<T>(topic: EventTopic, payload: T): Promise<string> {
    const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const event: StadiumEvent<T> = {
      eventId,
      topic,
      timestamp: new Date().toISOString(),
      payload,
    };
    this.history.unshift(event);
    if (this.history.length > 50) this.history.length = 50;

    console.log(`[Pub/Sub Eventarc Bus] Publishing event [${topic}] ID: ${eventId}`);
    const handlers = this.subscribers.get(topic);
    if (handlers) {
      // Fire-and-forget so the caller is never blocked by worker inference.
      setTimeout(() => {
        handlers.forEach(async (handler) => {
          try {
            await handler(event);
          } catch (err) {
            console.error(`[Pub/Sub Worker Error] Topic: ${topic}, Event: ${eventId}`, err);
          }
        });
      }, 50);
    }
    return eventId;
  }

  public getHistory(): StadiumEvent[] {
    return [...this.history];
  }

  // --- Register Serverless Worker Handlers ---
  private registerDefaultWorkers() {
    // Worker: Auto-classify new incidents via Gemini Vision/Text.
    // Note: the API route already classifies synchronously for instant UX feedback,
    // so this worker only kicks in for events published without a synchronous call.
    this.subscribe('stadium.incident.created', async (event) => {
      const { description, photoUrl, reportedByUid, sector } = event.payload as {
        description: string;
        photoUrl?: string;
        reportedByUid: string;
        sector: string;
      };
      console.log(`[Worker] Classifying incident from UID: ${reportedByUid}`);
      await VolunteerCopilotService.classifyAndReportIncident(description, photoUrl, reportedByUid, sector);
    });

    // Worker: Auto-evaluate What-If rerouting on gate congestion threshold.
    this.subscribe('stadium.gate.congested', async (event) => {
      const { gateId, waitMinutes } = event.payload as { gateId: string; waitMinutes: number };
      console.log(`[Worker] Gate congestion detected at ${gateId} (${waitMinutes} mins). Evaluating What-If...`);
      await OperationsCopilotService.runWhatIfSimulation({
        stadiumId: 'metlife-ny-nj',
        interventionType: 'OPEN_AUXILIARY_GATE',
        targetGateId: 'gate-d',
        description: `Auto-mitigate bottleneck at ${gateId}`,
      });
    });
  }
}

const globalWithBus = globalThis as unknown as { __stadiumEventBus?: PubSubEventBus };
export const eventBus: PubSubEventBus = globalWithBus.__stadiumEventBus ?? new PubSubEventBus();
if (process.env.NODE_ENV !== 'production') {
  globalWithBus.__stadiumEventBus = eventBus;
}
