import React, { useEffect, useCallback } from "react";
import Layout from "./components/Layout";
import Toolbar from "./components/Toolbar";
import UserSidebar from "./components/UserSidebar";
import ChatSidebar from "./components/ChatSidebar";
import DiagramCanvas from "./components/DiagramCanvas";
import JoinForm from "./components/JoinForm";
import { useDiagramStore } from "@/store/useDiagramStore";
import { socket, initSocket } from "@/services/socket";
import { useSocketListeners } from "@/hooks/useSocketListeners";
import { normalizeUsers } from "@/utils/userUtils";
import type { SocketEvents } from "@/types/socket";

const App = () => {
  const username = useDiagramStore((s) => s.username);
  const setUsers = useDiagramStore((s) => s.setUsers);
  const addChatMessage = useDiagramStore((s) => s.addChatMessage);
  const setChatMessages = useDiagramStore((s) => s.setChatMessages);
  const incrementUnreadCount = useDiagramStore((s) => s.incrementUnreadCount);
  const resetUnreadCount = useDiagramStore((s) => s.resetUnreadCount);

  useEffect(() => {
    if (username && !socket?.connected) {
      initSocket(username);
      setUsers([{ username }]);
    }
  }, [username, setUsers]);

  const handleUsersUpdate = useCallback((users: SocketEvents["user_update"]) => {
    setUsers(normalizeUsers(users));
  }, [setUsers]);

  const handleChatMessage = useCallback((entry: SocketEvents["receive_chat"]) => {
    addChatMessage(entry);
    if (entry.username !== username) {
      incrementUnreadCount();
    }
  }, [username, addChatMessage, incrementUnreadCount]);

  const handleChatHistory = useCallback((messages: SocketEvents["chat_history"]) => {
    setChatMessages(messages);
    resetUnreadCount();
  }, [setChatMessages, resetUnreadCount]);

  useSocketListeners({
    onUsersUpdate: handleUsersUpdate,
    onChatMessage: handleChatMessage,
    onChatHistory: handleChatHistory,
    enabled: !!username,
  });

  if (!username) {
    return <JoinForm />;
  }

  return (
    <Layout left={<UserSidebar />} right={<ChatSidebar />} bottom={<Toolbar />}>
      <DiagramCanvas />
    </Layout>
  );
};

export default App;
