import React from "react";
import { useDiagramStore } from "@/store/useDiagramStore";

interface UserSidebarProps {
  onClose?: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ onClose }) => {
  const users = useDiagramStore((state) => state.users);
  const currentUsername = useDiagramStore((state) => state.username);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || name.slice(0, 2).toUpperCase();
  };

  const colorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 70% 45%)`;
  };

  return (
    <div className="p-3 md:p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-semibold">Active Users</h2>
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
      <ul className="space-y-1.5 md:space-y-2 flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <li className="text-sm text-gray-500 text-center py-4">No active users</li>
        ) : (
          users.map((u, idx) => {
            const isSelf = currentUsername && u.username === currentUsername;
            const bg = colorFromName(u.username);
            return (
              <li
                key={idx}
                className={`flex items-center gap-2 md:gap-3 p-2 rounded-md ${isSelf ? "bg-blue-50" : "bg-gray-100"}`}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: bg }}
                  aria-hidden
                >
                  {getInitials(u.username)}
                </span>
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  <span className="text-xs md:text-sm truncate">
                    {u.username}
                    {isSelf && <span className="text-blue-600 ml-1">(you)</span>}
                  </span>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default UserSidebar;
