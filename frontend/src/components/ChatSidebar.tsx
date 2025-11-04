import React, { useState } from "react";
import { useDiagramStore } from "@/store";

const ChatSidebar = () => {
  const chat = useDiagramStore((state) => state.chat);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (!message.trim()) return;
    // TODO: emit to backend
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {chat.map((msg, idx) => (
          <div key={idx} className="text-sm bg-gray-100 p-2 rounded">
            <strong>{msg.username}: </strong>{msg.message}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border p-2 rounded-l-md text-sm"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="px-3 bg-blue-500 text-white rounded-r-md"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
