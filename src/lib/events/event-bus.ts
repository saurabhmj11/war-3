import 'server-only';
import { VolunteerCopilotService } from '@/lib/ai/volunteer-copilot';
import { OperationsCopilotService } from '@/lib/ai/ops-copilot';

/**
 * Union of all publishable event topics in the stadium event bus.
 * Each topic maps to a specific operational domain:
 * - `stadium.incident.created` — volunteer or AI-reported incident
 * - `stadium.gate.congested` — threshold-triggered gate congestion alert
 * - `stadium.simulation.act_triggered` — admin demo sequence step
 * - `stadium.emergency.broadcast_requested` — security emergency broadcast
 */
export type EventTopic =
  | 'stadium.incident.created'
  | 'stadium.gate.congested'
  | 'stadium.simulation.act_triggered'
  | 'stadium.emergency.broadcast_requested';

/**
 * Typed envelope for all events flowing through the Pub/Sub bus.
 *
 * @template T - The shape of the event payload, specific to each topic.
 */
export interface StadiumEvent<T = unknown> {
  /** Unique event identifier in `evt-<timestamp>-<nonce>` format. */
  eventId: string;
  /** The topic this event was published to. */
  topic: EventTopic;
  /** ISO 8601 timestamp of when the event was published. */
  timestamp: string;
  /** Topic-specific payload data. */
  payload: T;
}

/** Async handler function signature for topic subscribers. */
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

  /**
   * Subscribes a handler to the given topic.
   *
   * @template T - The expected payload type for this topic.
   * @param topic - The event topic to listen to.
   * @param handler - Async function invoked for each published event.
   * @returns An unsubscribe function that removes this handler.
   */
  public subscribe<T>(topic: EventTopic, handler: EventHandler<T>): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler as EventHandler);
    return () => {
      this.subscribers.get(topic)?.delete(handler as EventHandler);
    };
  }

  /**
   * Publishes an event to all subscribers for the given topic.
   *
   * Handlers are invoked asynchronously after a 50 ms delay (fire-and-forget),
   * so the caller is never blocked by downstream AI inference. Errors in
   * handlers are caught and logged without propagating to the publisher.
   * The last 50 events are retained in `history` for audit retrieval.
   *
   * @template T - The shape of the event payload.
   * @param topic - The event topic to publish to.
   * @param payload - The event data to deliver to subscribers.
   * @returns The generated `eventId` string.
   */
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

  /**
   * Returns an immutable copy of the last 50 published events in
   * reverse-chronological order (most recent first).
   *
   * @returns A shallow copy of the internal event history array.
   */
  public getHistory(): StadiumEvent[] {
    return [...this.history];
  }

  /**
   * Registers the built-in serverless worker handlers that run in-process.
   *
   * In production these would be Cloud Run functions triggered via Pub/Sub
   * push subscriptions. Here they run in the same Node.js process for demo
   * simplicity while preserving the same decoupled async pattern.
   *
   * Workers registered:
   * - `stadium.incident.created` → AI incident classification
   * - `stadium.gate.congested` → What-If rerouting evaluation
   */
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
