import React from "react";

interface LayoutProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ left, right, bottom, children }) => {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900">
      {left && <aside className="w-64 border-r border-gray-200">{left}</aside>}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">{children}</div>
        {bottom && <footer className="border-t border-gray-200">{bottom}</footer>}
      </main>
      {right && <aside className="w-80 border-l border-gray-200">{right}</aside>}
    </div>
  );
};

export default Layout;
