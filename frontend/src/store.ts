import { create } from "zustand";

interface User {
  id: string;
  username: string;
}

export interface DiagramState {
  xml: string;
  locks: Record<string, string>;
  users: User[];
  chat: { username: string; message: string }[];
  setUsers: (users: User[]) => void;
  setXml: (xml: string) => void;
  lockElement: (id: string, username: string) => void;
}

export const useDiagramStore = create<DiagramState>((set) => ({
  xml: "<bpmn:definitions></bpmn:definitions>",
  locks: {},
  users: [],
  chat: [],
  setUsers: (users) => set({ users }),
  setXml: (xml) => set({ xml }),
  lockElement: (id, username) =>
    set((state) => ({ locks: { ...state.locks, [id]: username } })),
}));
