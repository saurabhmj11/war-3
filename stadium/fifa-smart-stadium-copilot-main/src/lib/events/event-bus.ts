import { repository } from '@/lib/db/repository';
import { VolunteerCopilotService } from '@/lib/ai/volunteer-copilot';
import { EmergencyCopilotService } from '@/lib/ai/emergency-copilot';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';

export type EventTopic =
  | 'stadium.incident.created'
  | 'stadium.gate.congested'
  | 'stadium.simulation.act_triggered'
  | 'stadium.emergency.broadcast_requested';

export interface StadiumEvent<T = any> {
  eventId: string;
  topic: EventTopic;
  timestamp: string;
  payload: T;
}

type EventHandler<T = any> = (event: StadiumEvent<T>) => Promise<void>;

/**
 * Enterprise Event Bus simulating Google Cloud Pub/Sub & Eventarc.
 * Decouples high-velocity ingestion from asynchronous Vertex AI Gemini inference.
 */
class PubSubEventBus {
  private subscribers: Map<EventTopic, Set<EventHandler>> = new Map();

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

    console.log(`[Pub/Sub Eventarc Bus] Publishing event [${topic}] ID: ${eventId}`);

    // Execute subscribers asynchronously without blocking caller (Eventarc pattern)
    const handlers = this.subscribers.get(topic);
    if (handlers) {
      setTimeout(() => {
        handlers.forEach(async (handler) => {
          try {
            await handler(event);
          } catch (err) {
            console.error(`[Pub/Sub Worker Error] Topic: ${topic}, Event: ${eventId}`, err);
          }
        });
      }, 50); // Small async tick
    }

    return eventId;
  }

  // --- Register Serverless Worker Handlers ---
  private registerDefaultWorkers() {
    // Worker 1: Handle new unclassified incidents via Gemini Vision/Text
    this.subscribe('stadium.incident.created', async (event) => {
      const { description, photoUrl, reportedByUid, sector } = event.payload as any;
      console.log(`[Worker Service] Classifying incident from UID: ${reportedByUid}`);
      await VolunteerCopilotService.classifyAndReportIncident(description, photoUrl, reportedByUid, sector);
    });

    // Worker 2: Handle Gate Congestion Threshold exceeded
    this.subscribe('stadium.gate.congested', async (event) => {
      const { gateId, waitMinutes } = event.payload as any;
      console.log(`[Worker Service] Gate congestion detected at ${gateId} (${waitMinutes} mins). Evaluating What-If Rerouting...`);
      // Auto-trigger simulation evaluation
      await OperationsCopilotService.runWhatIfSimulation({
        stadiumId: 'metlife-ny-nj',
        interventionType: 'OPEN_AUXILIARY_GATE',
        targetGateId: 'gate-d',
        description: `Auto-mitigate bottleneck at ${gateId}`,
      });
    });
  }
}

// Export singleton event bus
export const eventBus = new PubSubEventBus();
