import React from "react";
import { Button } from "@/components/ui/button"; // optional if you use shadcn
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faBrain, faRotateRight, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { useDiagramStore } from "@/store/useDiagramStore";
import { socket } from "@/services/socket";

const Toolbar = () => {
  const setUsername = useDiagramStore((s) => s.setUsername);
  const setUsers = useDiagramStore((s) => s.setUsers);

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    setUsername(null);
    setUsers([]);
    localStorage.removeItem("username");
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 border-t border-gray-200 bg-white shadow-sm overflow-x-auto">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <button className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors whitespace-nowrap">
          <FontAwesomeIcon icon={faFloppyDisk} size="sm" />
          <span className="hidden sm:inline">Save Version</span>
        </button>
        <button className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors whitespace-nowrap">
          <FontAwesomeIcon icon={faBrain} size="sm" />
          <span className="hidden sm:inline">AI Summary</span>
        </button>
        <button className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors whitespace-nowrap">
          <FontAwesomeIcon icon={faRotateRight} size="sm" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
      <button
        onClick={handleLeave}
        className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors whitespace-nowrap flex-shrink-0"
      >
        <FontAwesomeIcon icon={faSignOut} size="sm" />
        <span>Leave</span>
        <span className="hidden sm:inline"> Session</span>
      </button>
    </div>
  );
};

export default Toolbar;
