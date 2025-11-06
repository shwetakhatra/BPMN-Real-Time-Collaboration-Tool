import React, { useState, useEffect } from "react";
import { useDiagramStore } from "@/store/useDiagramStore";
import { initSocket, socket } from "@/services/socket";
import Button from "./ui/Button";

const JoinForm: React.FC = () => {
  const [input, setInput] = useState("");
  const setUsername = useDiagramStore((s) => s.setUsername);
  const setUsers = useDiagramStore((s) => s.setUsers);

  useEffect(() => {
    const saved = localStorage.getItem("username");
    if (saved) {
      setInput(saved);
    }
  }, []);

  const join = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = input.trim();
    if (!name) return;
    setUsername(name);
    initSocket(name);
    setUsers([{ username: name }]);
    setTimeout(() => {
      if (socket?.connected) {
        socket.emit("get_users");
      }
    }, 300);
  };

  const isDisabled = !input.trim();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center text-gray-800">
          Join the session
        </h1>
        <form onSubmit={join} className="space-y-4">
          <div>
            <input
              className="w-full border border-gray-300 p-3 sm:p-3.5 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
              minLength={1}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={isDisabled}
            fullWidth
            className="py-2.5 sm:py-3 text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
          >
            Join
          </Button>
        </form>
      </div>
    </div>
  );
};

export default JoinForm;


