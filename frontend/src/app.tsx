import React, { useEffect } from "react";
import Layout from "./components/Layout";
import Toolbar from "./components/Toolbar";
import UserSidebar from "./components/UserSidebar";
import ChatSidebar from "./components/ChatSidebar";
import DiagramCanvas from "./components/DiagramCanvas";
import JoinForm from "./components/JoinForm";
import { useDiagramStore } from "@/store/useDiagramStore";
import { socket } from "@/services/socket";
import { normalizeUsers } from "@/utils/userUtils";

const App = () => {
  const username = useDiagramStore((s) => s.username);
  const setUsers = useDiagramStore((s) => s.setUsers);
  const addChatMessage = useDiagramStore((s) => s.addChatMessage);
  const setChatMessages = useDiagramStore((s) => s.setChatMessages);
  const incrementUnreadCount = useDiagramStore((s) => s.incrementUnreadCount);
  const resetUnreadCount = useDiagramStore((s) => s.resetUnreadCount);

  useEffect(() => {
    if (!username) return;
    
    const onUsers = (users: { username: string }[] | string[]) => {
      setUsers(normalizeUsers(users));
    };
    
    const onReceiveChat = (entry: { username: string; message: string; timestamp?: string }) => {
      addChatMessage(entry);
      if (entry.username !== username) {
        incrementUnreadCount();
      }
    };

    const onChatHistory = (messages: { username: string; message: string; timestamp?: string }[]) => {
      setChatMessages(messages);
      resetUnreadCount();
    };
    
    const attachListeners = () => {
      if (!socket) return;
      socket.off("user_update").off("receive_chat").off("chat_history");
      socket.on("user_update", onUsers);
      socket.on("receive_chat", onReceiveChat);
      socket.on("chat_history", onChatHistory);
      
      if (socket.connected) socket.emit("get_users");
    };
    
    if (socket?.connected) {
      attachListeners();
    } else {
      const readyHandler = () => attachListeners();
      window.addEventListener("socket-ready", readyHandler, { once: true });
      return () => window.removeEventListener("socket-ready", readyHandler);
    }
    
    return () => {
      socket?.off("user_update", onUsers);
      socket?.off("receive_chat", onReceiveChat);
      socket?.off("chat_history", onChatHistory);
    };
  }, [username, setUsers, addChatMessage, setChatMessages, incrementUnreadCount, resetUnreadCount]);

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
