// src/store/useDiagramStore.ts
import { create } from "zustand";

interface User {
  username: string;
}

interface ChatMessage {
  username: string;
  message: string;
}

interface DiagramStore {
  username: string | null;
  users: User[];
  chat: ChatMessage[];
  xml: string;
  locks: Record<string, string>; // element_id -> username
  setUsername: (username: string | null) => void;
  setUsers: (users: User[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setXml: (xml: string) => void;
  setLocks: (locks: Record<string, string>) => void;
  updateLock: (elementId: string, username: string | null) => void;
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  username: null,
  users: [],
  chat: [],
  xml: "",
  locks: {},
  setUsername: (username) => set({ username }),
  setUsers: (users) => set({ users }),
  addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })),
  setXml: (xml) => set({ xml }),
  setLocks: (locks) => set({ locks }),
  updateLock: (elementId, username) =>
    set((state) => {
      const newLocks = { ...state.locks };
      if (username) {
        newLocks[elementId] = username;
      } else {
        delete newLocks[elementId];
      }
      return { locks: newLocks };
    }),
}));
