// src/services/socket.ts
import io from "socket.io-client";

export let socket: ReturnType<typeof io> | null = null;

export function initSocket(username: string) {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
  
  socket = io("http://127.0.0.1:8000", {
    transports: ["websocket"],
    auth: { username },
    query: { username },
  });

  socket.on("connect", () => {
    window.dispatchEvent(new CustomEvent("socket-ready"));
    setTimeout(() => {
      if (socket?.connected) {
        socket.emit("get_users");
      }
    }, 200);
  });

  socket.on("disconnect", () => {
    socket = null;
  });

  return socket;
}
