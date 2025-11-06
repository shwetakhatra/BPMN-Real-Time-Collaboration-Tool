import { useEffect } from "react";
import { socket } from "@/services/socket";
import { SOCKET_EVENTS } from "@/constants";
import type { SocketEvents } from "@/types/socket";

interface UseSocketListenersOptions {
  onUsersUpdate?: (users: SocketEvents["user_update"]) => void;
  onChatMessage?: (message: SocketEvents["receive_chat"]) => void;
  onChatHistory?: (messages: SocketEvents["chat_history"]) => void;
  enabled?: boolean;
}

/**
 * Reusable hook for managing socket event listeners
 */
export const useSocketListeners = ({
  onUsersUpdate,
  onChatMessage,
  onChatHistory,
  enabled = true,
}: UseSocketListenersOptions) => {
  useEffect(() => {
    if (!enabled || !socket) return;

    const attachListeners = () => {
      if (!socket) return;

      if (onUsersUpdate) {
        socket.off(SOCKET_EVENTS.USER_UPDATE, onUsersUpdate);
        socket.on(SOCKET_EVENTS.USER_UPDATE, onUsersUpdate);
      }

      if (onChatMessage) {
        socket.off(SOCKET_EVENTS.RECEIVE_CHAT, onChatMessage);
        socket.on(SOCKET_EVENTS.RECEIVE_CHAT, onChatMessage);
      }

      if (onChatHistory) {
        socket.off(SOCKET_EVENTS.CHAT_HISTORY, onChatHistory);
        socket.on(SOCKET_EVENTS.CHAT_HISTORY, onChatHistory);
      }

      if (socket.connected && onUsersUpdate) {
        socket.emit(SOCKET_EVENTS.GET_USERS);
      }
    };

    if (socket.connected) {
      attachListeners();
    } else {
      const readyHandler = () => attachListeners();
      window.addEventListener("socket-ready", readyHandler, { once: true });
      return () => window.removeEventListener("socket-ready", readyHandler);
    }

    return () => {
      if (socket) {
        if (onUsersUpdate) socket.off(SOCKET_EVENTS.USER_UPDATE, onUsersUpdate);
        if (onChatMessage) socket.off(SOCKET_EVENTS.RECEIVE_CHAT, onChatMessage);
        if (onChatHistory) socket.off(SOCKET_EVENTS.CHAT_HISTORY, onChatHistory);
      }
    };
  }, [enabled, onUsersUpdate, onChatMessage, onChatHistory]);
};

