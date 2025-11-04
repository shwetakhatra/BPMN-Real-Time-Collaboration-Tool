import React, { useEffect } from "react";
import { io } from "socket.io-client";
import { useDiagramStore } from "./store";
import type { DiagramState } from "./store";

const socket = io("http://localhost:8000", {
  transports: ["websocket"],
  extraHeaders: { username: "Shweta" },
});

function App() {
  const setUsers = useDiagramStore((state: DiagramState) => state.setUsers);
  const setXml = useDiagramStore((state: DiagramState) => state.setXml);

  useEffect(() => {
    socket.on("connect", () => console.log("✅ Connected to backend!"));
    socket.on("user_update", (users) => setUsers(users));
    socket.on("diagram_update", (data) => setXml(data.xml));

    return () => {
      socket.off("connect");
      socket.off("user_update");
      socket.off("diagram_update");
    };
  }, [setUsers, setXml]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">BPMN Realtime Collaboration</h1>
      <p>Users online: {useDiagramStore((state: DiagramState) => state.users.length)}</p>
      <textarea
        className="w-full h-64 mt-4 p-2 border rounded"
        value={useDiagramStore((state: DiagramState) => state.xml)}
        readOnly
      />
    </div>
  );
}

export default App;
