import React, { useState } from "react";
import { useDiagramStore } from "@/store/useDiagramStore";
import Button from "./ui/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

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
          <Button
            variant="icon"
            onClick={onClose}
            icon={faTimes}
            iconSize="sm"
            className="md:hidden"
            aria-label="Close sidebar"
          />
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
        <Button
          variant="primary"
          icon={faPaperPlane}
          iconSize="sm"
          onClick={sendMessage}
          disabled={!message.trim()}
          className="px-4 md:px-5 text-sm font-medium"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
