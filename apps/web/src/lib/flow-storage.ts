import { openDB, type IDBPDatabase } from "idb";

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  timestamp: number;
  model: string;
  seed?: number;
  duration?: number;
  isBlurred?: boolean;
  isUpscaled?: boolean;
}

export interface FlowState {
  images: GeneratedImage[];
  updatedAt: number;
}

const DB_NAME = "zenith-flow-db";
const DB_VERSION = 2;
const STATE_STORE = "flowState";
const STATE_KEY = "current";

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Clean up old stores
      if (db.objectStoreNames.contains("sessions")) {
        db.deleteObjectStore("sessions");
      }
      // Create new simple store
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
    },
  });

  return dbInstance;
}

export async function loadFlowState(): Promise<FlowState | null> {
  try {
    const db = await getDB();
    const state = await db.get(STATE_STORE, STATE_KEY);
    return state || null;
  } catch (e) {
    console.error("Failed to load flow state:", e);
    return null;
  }
}

export async function saveFlowState(images: GeneratedImage[]): Promise<void> {
  try {
    const db = await getDB();
    const state: FlowState = {
      images,
      updatedAt: Date.now(),
    };
    await db.put(STATE_STORE, state, STATE_KEY);
  } catch (e) {
    console.error("Failed to save flow state:", e);
  }
}

export async function clearFlowState(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STATE_STORE, STATE_KEY);
  } catch (e) {
    console.error("Failed to clear flow state:", e);
  }
}

// Flow input settings storage (keep in localStorage - small data)
export interface FlowInputSettings {
  aspectRatioIndex: number;
  resolutionIndex: number;
  prompt: string;
}

const FLOW_INPUT_SETTINGS_KEY = "zenith-flow-input-settings";

export function loadFlowInputSettings(): FlowInputSettings {
  try {
    const data = localStorage.getItem(FLOW_INPUT_SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return {
    aspectRatioIndex: 0,
    resolutionIndex: 0,
    prompt: "",
  };
}

export function saveFlowInputSettings(settings: FlowInputSettings) {
  localStorage.setItem(FLOW_INPUT_SETTINGS_KEY, JSON.stringify(settings));
}
