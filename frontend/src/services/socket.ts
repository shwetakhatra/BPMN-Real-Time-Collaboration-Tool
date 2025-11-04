// src/services/socket.ts
import io from "socket.io-client";

const username = "Shweta"; // You can later make this dynamic

export const socket = io("http://127.0.0.1:8000", {
  transports: ["websocket"],
  auth: { username },
});

socket.on("connect", () => {
  console.log("✅ Connected to backend:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from backend");
});
