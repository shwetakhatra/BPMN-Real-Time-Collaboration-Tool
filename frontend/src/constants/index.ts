// Z-index constants for consistent layering
export const Z_INDEX = {
  MODAL: 10100,
  SIDEBAR: 10050,
  SIDEBAR_OVERLAY: 10040,
  MOBILE_BUTTONS: 10030,
  BPMN_PALETTE: 1000,
  BPMN_CONTEXT_PAD: 100,
  EDITING_BADGE: 10001,
  REMOTE_CURSOR: 10000,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  SUMMARY: "/api/summary",
} as const;

// Socket event names
export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  USER_UPDATE: "user_update",
  GET_USERS: "get_users",
  CURSOR_UPDATE: "cursor_update",
  CURSOR_MOVE: "cursor_move",
  DIAGRAM_UPDATE: "diagram_update",
  UPDATE_DIAGRAM: "update_diagram",
  SYNC_DIAGRAM: "sync_diagram",
  RECEIVE_CHAT: "receive_chat",
  SEND_CHAT: "send_chat",
  CHAT_HISTORY: "chat_history",
  EDITING_UPDATE: "editing_update",
  USER_EDITING: "user_editing",
  LOCKS_UPDATE: "locks_update",
  ACTIVITY_LOG: "activity_log",
} as const;

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
} as const;

