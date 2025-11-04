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
  users: User[];
  chat: ChatMessage[];
  xml: string;
  setUsers: (users: User[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setXml: (xml: string) => void;
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  users: [],
  chat: [],
  xml: "",
  setUsers: (users) => set({ users }),
  addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })),
  setXml: (xml) => set({ xml }),
}));
