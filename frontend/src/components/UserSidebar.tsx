import React from "react";
import { useDiagramStore } from "@/store";

const UserSidebar = () => {
  const users = useDiagramStore((state) => state.users);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Active Users</h2>
      <ul className="space-y-2">
        {users.map((u, idx) => (
          <li
            key={idx}
            className="flex items-center gap-2 p-2 bg-gray-100 rounded-md"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {u.username}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSidebar;
