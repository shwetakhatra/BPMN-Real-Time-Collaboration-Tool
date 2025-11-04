import React, { useState } from "react";

interface LayoutProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ left, right, bottom, children }) => {
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      {/* Left Sidebar - Hidden on mobile, collapsible on tablet */}
      {left && (
        <>
          {/* Mobile overlay */}
          {showLeftSidebar && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowLeftSidebar(false)}
            />
          )}
          <aside
            className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
              showLeftSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
          >
            {React.isValidElement(left) && React.cloneElement(left, { onClose: () => setShowLeftSidebar(false) })}
            {!React.isValidElement(left) && left}
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-hidden relative">{children}</div>
        {bottom && <footer className="border-t border-gray-200 bg-white z-10">{bottom}</footer>}
      </main>

      {/* Right Sidebar - Hidden on mobile, collapsible on tablet */}
      {right && (
        <>
          {/* Mobile overlay */}
          {showRightSidebar && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowRightSidebar(false)}
            />
          )}
          <aside
            className={`fixed md:static inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
              showRightSidebar ? "translate-x-0" : "translate-x-full md:translate-x-0"
            }`}
          >
            {React.isValidElement(right) && React.cloneElement(right, { onClose: () => setShowRightSidebar(false) })}
            {!React.isValidElement(right) && right}
          </aside>
        </>
      )}

      {/* Mobile Sidebar Toggle Buttons */}
      <div className="fixed bottom-24 sm:bottom-28 left-4 right-4 flex justify-between md:hidden z-30 pointer-events-none">
        {left && (
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="bg-white shadow-lg rounded-full p-3 border border-gray-200 pointer-events-auto hover:bg-gray-50 transition-colors"
            aria-label="Toggle users"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        )}
        {right && (
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className="bg-white shadow-lg rounded-full p-3 border border-gray-200 pointer-events-auto hover:bg-gray-50 transition-colors"
            aria-label="Toggle chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Layout;
