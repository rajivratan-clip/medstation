/**
 * Central analytics event tracker for operational, clinical, product, and AI intelligence.
 * Events follow a strict taxonomy and schema. Persisted to localStorage; downloadable as JSON.
 */

const STORAGE_KEY = "cdp_analytics_events";
const SESSION_KEY = "cdp_session_id";
const MAX_STORED_EVENTS = 2000;

/** Global event schema — mandatory for all events. */
export interface IntelligenceEvent {
  event_id: string;
  event_type: string;
  timestamp: number;
  user_id: string;
  session_id: string;
  page: string;
  encounter_id?: string;
  patient_id?: string;
  metadata?: Record<string, unknown>;
}

type TrackingContext = {
  userId: string;
  sessionId: string;
  page: string;
  encounterId?: string;
  patientId?: string;
};

const defaultContext: TrackingContext = {
  userId: "anonymous",
  sessionId: "",
  page: "unknown",
};

function generateEventId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateEventId().replace(/^evt_/, "sess_");
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

function loadFromStorage(): IntelligenceEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IntelligenceEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(events: IntelligenceEvent[]) {
  try {
    const toStore = events.slice(-MAX_STORED_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[Analytics] localStorage save failed:", e);
    }
  }
}

export type TrackOptions = {
  encounterId?: string;
  patientId?: string;
};

class EventTracker {
  private events: IntelligenceEvent[] = loadFromStorage();
  private context: TrackingContext = { ...defaultContext };

  /**
   * Set current user, page, and optional encounter/patient for subsequent track() calls.
   * Session ID is created on first use and persisted in sessionStorage.
   */
  setContext(userId: string, page: string, options?: { encounterId?: string; patientId?: string }) {
    this.context = {
      userId,
      sessionId: getOrCreateSessionId(),
      page,
      encounterId: options?.encounterId,
      patientId: options?.patientId,
    };
  }

  getSessionId(): string {
    return this.context.sessionId || getOrCreateSessionId();
  }

  /**
   * Track an event. Builds a full IntelligenceEvent and persists to localStorage.
   */
  track(eventType: string, metadata: Record<string, unknown> = {}, options?: TrackOptions) {
    const sessionId = this.context.sessionId || getOrCreateSessionId();
    if (!this.context.sessionId) this.context.sessionId = sessionId;

    const event: IntelligenceEvent = {
      event_id: generateEventId(),
      event_type: eventType,
      timestamp: Date.now(),
      user_id: this.context.userId,
      session_id: sessionId,
      page: this.context.page,
      ...(options?.encounterId ?? this.context.encounterId
        ? { encounter_id: options?.encounterId ?? this.context.encounterId }
        : {}),
      ...(options?.patientId ?? this.context.patientId
        ? { patient_id: options?.patientId ?? this.context.patientId }
        : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };

    this.events.push(event);
    saveToStorage(this.events);

    if (import.meta.env.DEV) {
      console.log("[Analytics]", eventType, metadata);
    }

    return event;
  }

  getEvents(): IntelligenceEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  exportJSON(): string {
    return JSON.stringify(this.events, null, 2);
  }

  downloadAsFile(filename?: string) {
    const name =
      filename ||
      `cdp-analytics-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`;
    const blob = new Blob([this.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const eventTracker = new EventTracker();

if (typeof window !== "undefined") {
  (window as unknown as { __cdpEventTracker: typeof eventTracker }).__cdpEventTracker =
    eventTracker;
}
