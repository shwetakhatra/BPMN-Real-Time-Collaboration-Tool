import React, { useState } from "react";
import { useDiagramStore } from "@/store/useDiagramStore";

interface ChatSidebarProps {
  onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onClose }) => {
  const chat = useDiagramStore((state) => state.chat);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (!message.trim()) return;
    // TODO: emit to backend
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full p-3 md:p-4">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-semibold">Chat</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md hover:bg-gray-200 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 md:mb-4 min-h-0">
        {chat.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No messages yet</div>
        ) : (
          chat.map((msg, idx) => (
            <div key={idx} className="text-xs md:text-sm bg-gray-100 p-2 md:p-3 rounded-lg">
              <strong className="text-blue-600">{msg.username}: </strong>
              <span className="text-gray-800">{msg.message}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 p-2 md:p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="px-4 md:px-5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          onClick={sendMessage}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
