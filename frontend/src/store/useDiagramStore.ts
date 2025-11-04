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
  setUsername: (username: string | null) => void;
  setUsers: (users: User[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setXml: (xml: string) => void;
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  username: null,
  users: [],
  chat: [],
  xml: "",
  setUsername: (username) => set({ username }),
  setUsers: (users) => set({ users }),
  addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })),
  setXml: (xml) => set({ xml }),
}));
