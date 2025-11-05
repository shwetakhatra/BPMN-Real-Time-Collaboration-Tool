import io from "socket.io-client";

export let socket: ReturnType<typeof io> | null = null;

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function initSocket(username: string) {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
  
  socket = io(API_URL, {
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
