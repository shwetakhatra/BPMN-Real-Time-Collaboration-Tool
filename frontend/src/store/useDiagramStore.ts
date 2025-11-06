// src/store/useDiagramStore.ts
import { create } from "zustand";
import type { User, ChatMessage, ActivityLog } from "@/types/socket";

interface DiagramStore {
  username: string | null;
  users: User[];
  chat: ChatMessage[];
  activityLogs: ActivityLog[];
  unreadMessageCount: number;
  xml: string;
  locks: Record<string, string>; // element_id -> username
  editingElements: Record<string, string>; // element_id -> username
  setUsername: (username: string | null) => void;
  setUsers: (users: User[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  addActivityLog: (log: ActivityLog) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  setXml: (xml: string) => void;
  setLocks: (locks: Record<string, string>) => void;
  updateLock: (elementId: string, username: string | null) => void;
  setEditingElement: (elementId: string | null, username: string | null) => void;
}

// Initialize username from localStorage if available
const getInitialUsername = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("username");
  }
  return null;
};

export const useDiagramStore = create<DiagramStore>((set) => ({
  username: getInitialUsername(),
  users: [],
  chat: [],
  activityLogs: [],
  unreadMessageCount: 0,
  xml: "",
  locks: {},
  editingElements: {},
  setUsername: (username) => {
    set({ username });
    if (username) {
      localStorage.setItem("username", username);
    } else {
      localStorage.removeItem("username");
    }
  },
  setUsers: (users) => set({ users }),
  addChatMessage: (msg) => set((state) => ({ chat: [...state.chat, msg] })),
  setChatMessages: (messages) => set({ chat: messages }),
  incrementUnreadCount: () => set((state) => ({ unreadMessageCount: state.unreadMessageCount + 1 })),
  resetUnreadCount: () => set({ unreadMessageCount: 0 }),
  addActivityLog: (log) => set((state) => ({ activityLogs: [...state.activityLogs, log] })),
  setActivityLogs: (logs) => set({ activityLogs: logs }),
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
  setEditingElement: (elementId, username) =>
    set((state) => {
      const newEditing = { ...state.editingElements };
      if (elementId && username) {
        newEditing[elementId] = username;
      } else if (elementId) {
        delete newEditing[elementId];
      }
      return { editingElements: newEditing };
    }),
}));
