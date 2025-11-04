import React from "react";
import Layout from "./components/Layout";
import Toolbar from "./components/Toolbar";
import UserSidebar from "./components/UserSidebar";
import ChatSidebar from "./components/ChatSidebar";
import DiagramCanvas from "./components/DiagramCanvas";

const App = () => {
  return (
    <Layout left={<UserSidebar />} right={<ChatSidebar />} bottom={<Toolbar />}>
      <DiagramCanvas />
    </Layout>
  );
};

export default App;
