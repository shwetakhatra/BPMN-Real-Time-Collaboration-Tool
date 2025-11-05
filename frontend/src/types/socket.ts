// Socket.IO event types
export interface SocketEvents {
  // Client -> Server
  update_diagram: { xml: string };
  sync_diagram: void;
  cursor_move: { x: number; y: number };
  user_editing: { element_id: string | null };
  send_chat: { message: string };
  get_users: void;
  get_activity_log: void;
  get_versions: void;
  lock_element: { element_id: string };
  unlock_element: { element_id: string };

  // Server -> Client
  diagram_update: { xml: string };
  cursor_update: { username: string; x: number; y: number };
  editing_update: { username: string; element_id: string | null };
  receive_chat: ChatMessage;
  chat_history: ChatMessage[];
  user_update: User[] | string[];
  locks_update: Record<string, string>;
  element_locked: { element_id: string; locked_by: string };
  element_unlocked: { element_id: string };
  activity_log: ActivityLog[];
  activity_log_update: ActivityLog;
  diagram_versions: unknown;
}

export interface ChatMessage {
  username: string;
  message: string;
  timestamp?: string;
}

export interface ActivityLog {
  timestamp: string;
  message: string;
}

export interface User {
  username: string;
}

export type SocketEventName = keyof SocketEvents;

