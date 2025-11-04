import React from "react";
import { Button } from "@/components/ui/button"; // optional if you use shadcn
// Icons replaced with emoji to avoid external icon dependency

const Toolbar = () => {
  return (
    <div className="flex items-center gap-4 p-3 border-b bg-white shadow-sm">
      <button className="flex items-center gap-2 text-sm px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">
        <span aria-hidden>💾</span> Save Version
      </button>
      <button className="flex items-center gap-2 text-sm px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600">
        <span aria-hidden>🧠</span> AI Summary
      </button>
      <button className="flex items-center gap-2 text-sm px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">
        <span aria-hidden>🔄</span> Refresh
      </button>
    </div>
  );
};

export default Toolbar;
