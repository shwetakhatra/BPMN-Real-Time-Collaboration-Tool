import React, { useEffect } from "react";
import Layout from "./components/Layout";
import Toolbar from "./components/Toolbar";
import UserSidebar from "./components/UserSidebar";
import ChatSidebar from "./components/ChatSidebar";
import DiagramCanvas from "./components/DiagramCanvas";
import JoinForm from "./components/JoinForm";
import { useDiagramStore } from "@/store/useDiagramStore";
import { socket } from "@/services/socket";

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
      if (Array.isArray(users)) {
        let userList = users.length === 0 
          ? [] 
          : typeof (users as any)[0] === "string"
            ? (users as string[]).map((u) => ({ username: u }))
            : (users as { username: string }[]);
        
        const seen = new Set<string>();
        userList = userList.filter(user => {
          if (seen.has(user.username)) {
            return false;
          }
          seen.add(user.username);
          return true;
        });
        
        setUsers(userList);
      }
    };
    
    const onReceiveChat = (entry: { username: string; message: string; timestamp?: string }) => {
      addChatMessage(entry);
      // Increment unread count if message is from another user
      if (entry.username !== username) {
        incrementUnreadCount();
      }
    };

    const onChatHistory = (messages: { username: string; message: string; timestamp?: string }[]) => {
      setChatMessages(messages);
      // Reset unread count when loading chat history (sidebar is open)
      resetUnreadCount();
    };
    
    const attachListeners = () => {
      if (!socket) return;
      
      socket.off("user_update");
      socket.off("receive_chat");
      socket.off("chat_history");
      socket.on("user_update", onUsers);
      socket.on("receive_chat", onReceiveChat);
      socket.on("chat_history", onChatHistory);
      
      if (socket.connected) {
        socket.emit("get_users");
      }
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
