import { useEffect, useRef, useCallback, RefObject } from "react";
import { socket } from "@/services/socket";
import { useDiagramStore } from "@/store/useDiagramStore";
import { getColorFromUsername } from "@/utils/colorUtils";
import { CURSOR_UPDATE_DELAY } from "@/utils/diagramUtils";
import type { SocketEvents } from "@/types/socket";

interface UseRemoteCursorsOptions {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const useRemoteCursors = ({ containerRef }: UseRemoteCursorsOptions) => {
  const { username } = useDiagramStore();
  const cursorElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createCursorElement = useCallback((username: string, color: string): HTMLDivElement => {
    const cursorEl = document.createElement("div");
    cursorEl.className = "remote-cursor";
    cursorEl.setAttribute("data-username", username);
    cursorEl.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -100%);
      transition: left 0.05s linear, top 0.05s linear;
    `;
    
    const cursorDot = document.createElement("div");
    cursorDot.style.cssText = `
      width: 14px;
      height: 14px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transform: translate(-50%, -50%);
    `;
    
    const nameLabel = document.createElement("div");
    nameLabel.className = "cursor-name";
    nameLabel.style.cssText = `
      background: ${color};
      color: white;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      margin-top: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transform: translateX(-50%);
    `;
    nameLabel.textContent = username;
    
    cursorEl.appendChild(cursorDot);
    cursorEl.appendChild(nameLabel);
    return cursorEl;
  }, []);

  const updateRemoteCursor = useCallback((data: SocketEvents["cursor_update"]) => {
    if (!containerRef.current || !username || data.username === username) return;
    
    let cursorEl = cursorElementsRef.current.get(data.username);
    const userColor = getColorFromUsername(data.username);
    
    if (!cursorEl) {
      cursorEl = createCursorElement(data.username, userColor);
      containerRef.current.appendChild(cursorEl);
      cursorElementsRef.current.set(data.username, cursorEl);
    } else {
      const cursorDot = cursorEl.querySelector("div:first-child") as HTMLElement;
      const nameLabel = cursorEl.querySelector(".cursor-name") as HTMLElement;
      if (cursorDot) cursorDot.style.background = userColor;
      if (nameLabel) {
        nameLabel.style.background = userColor;
        nameLabel.textContent = data.username;
      }
    }
    
    cursorEl.style.left = `${data.x}px`;
    cursorEl.style.top = `${data.y}px`;
  }, [username, containerRef, createCursorElement]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!socket?.connected || !username || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
    }
    
    mouseMoveTimeoutRef.current = setTimeout(() => {
      if (socket?.connected) {
        socket.emit("cursor_move", { x, y });
      }
    }, CURSOR_UPDATE_DELAY);
  }, [socket, username, containerRef]);

  useEffect(() => {
    if (!containerRef.current || !socket || !username) return;

    const onCursorUpdate = (data: SocketEvents["cursor_update"]) => {
      updateRemoteCursor(data);
    };

    const sendInitialStatus = () => {
      if (socket?.connected) {
        setTimeout(() => {
          if (socket?.connected) socket.emit("get_users");
        }, 500);
      }
    };

    const onUserUpdate = () => {
      const currentUsers = useDiagramStore.getState().users;
      const userNames = new Set(currentUsers.map((u) => u.username));
      
      cursorElementsRef.current.forEach((cursorEl, cursorUsername) => {
        if (!userNames.has(cursorUsername)) {
          cursorEl.remove();
          cursorElementsRef.current.delete(cursorUsername);
        }
      });
    };

    const attachListeners = () => {
      if (socket) {
        socket.off("cursor_update", onCursorUpdate);
        socket.off("user_update", onUserUpdate);
        socket.on("cursor_update", onCursorUpdate);
        socket.on("user_update", onUserUpdate);
      }
    };

    if (socket) attachListeners();

    if (socket?.connected) sendInitialStatus();
    if (socket) socket.once("connect", sendInitialStatus);

    const handleSocketReady = () => attachListeners();
    window.addEventListener("socket-ready", handleSocketReady);

    containerRef.current.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("socket-ready", handleSocketReady);
      
      if (socket) {
        socket.off("cursor_update", onCursorUpdate);
        socket.off("user_update", onUserUpdate);
      }
      
      cursorElementsRef.current.forEach((cursorEl) => cursorEl.remove());
      cursorElementsRef.current.clear();
      
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, [socket, username, handleMouseMove, updateRemoteCursor, containerRef]);
};

