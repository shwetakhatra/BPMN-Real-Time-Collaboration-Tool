import React, { useState, useEffect, useRef } from "react";
import { useDiagramStore } from "@/store/useDiagramStore";
import { socket } from "@/services/socket";
import Button from "./ui/Button";
import { faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

interface ChatSidebarProps {
  onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onClose }) => {
  const chat = useDiagramStore((state) => state.chat);
  const username = useDiagramStore((state) => state.username);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const sendMessage = () => {
    if (!message.trim() || !socket?.connected) return;
    socket.emit("send_chat", { message: message.trim() });
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full p-3 md:p-4">
      <div className="flex items-center justify-between mb-3 md:mb-4 pb-3 border-b border-gray-300">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 hover:text-gray-900 transition-colors cursor-default">
          Chat
        </h2>
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
        {/* Chat Messages Section */}
        <div className="space-y-2">
          {chat.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No messages yet</div>
          ) : (
            chat.map((msg, idx) => {
              const isOwnMessage = msg.username === username;
              return (
                <div
                  key={idx}
                  className={`text-xs md:text-sm p-2 md:p-3 rounded-lg ${
                    isOwnMessage
                      ? "bg-blue-500 text-white ml-4"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {!isOwnMessage && (
                        <strong className={`block mb-1 ${isOwnMessage ? "text-white" : "text-blue-600"}`}>
                          {msg.username}
                        </strong>
                      )}
                      <span>{msg.message}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 p-2 md:p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
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
