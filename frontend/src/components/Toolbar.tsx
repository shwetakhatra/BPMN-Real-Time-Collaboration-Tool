import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faBrain, faRotateRight, faSignOut } from "@fortawesome/free-solid-svg-icons";
import { useDiagramStore } from "@/store/useDiagramStore";
import { socket } from "@/services/socket";
import Button from "./ui/Button";
import SummaryModal from "./SummaryModal";

const Toolbar = () => {
  const setUsername = useDiagramStore((s) => s.setUsername);
  const setUsers = useDiagramStore((s) => s.setUsers);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    setUsername(null);
    setUsers([]);
    localStorage.removeItem("username");
  };

  const downloadXML = (xml: string) => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bpmn-diagram-${new Date().toISOString().split("T")[0]}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveVersion = async () => {
    const exportXML = (window as any).exportDiagramXML;
    if (!exportXML) return;

    try {
      const xml = await exportXML();
      if (!xml) {
        alert("Failed to export diagram");
        return;
      }
      downloadXML(xml);
    } catch {
      alert("Failed to export diagram");
    }
  };

  const handleAISummary = async () => {
    const exportXML = (window as any).exportDiagramXML;
    if (!exportXML) return;

    setIsLoading(true);
    try {
      const xml = await exportXML();
      if (!xml) {
        alert("Failed to get diagram XML");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml }),
      });

      if (!response.ok) throw new Error(`Failed to get summary: ${response.status}`);
      
      const data = await response.json();
      setSummary(data.summary || "Unable to generate summary");
    } catch {
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    const syncDiagram = (window as any).syncDiagram;
    if (syncDiagram && !isRefreshing) {
      setIsRefreshing(true);
      syncDiagram();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 border-t border-gray-200 bg-white shadow-sm overflow-x-auto">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <Button
          variant="primary"
          icon={faFloppyDisk}
          onClick={handleSaveVersion}
        >
          <span className="hidden sm:inline">Export XML</span>
        </Button>
        <Button
          variant="secondary"
          icon={faBrain}
          onClick={handleAISummary}
          loading={isLoading}
          loadingText="Loading..."
        >
          <span className="hidden sm:inline">AI Summary</span>
        </Button>
        <Button
          variant="gray"
          icon={faRotateRight}
          iconSpin={isRefreshing}
          onClick={handleRefresh}
          disabled={isRefreshing}
          loadingText="Syncing..."
        >
          <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Refresh"}</span>
        </Button>
      </div>
      <Button
        variant="danger"
        icon={faSignOut}
        onClick={handleLeave}
        className="flex-shrink-0"
      >
        Leave
      </Button>
      
      {summary && <SummaryModal summary={summary} onClose={() => setSummary(null)} />}
    </div>
  );
};

export default Toolbar;
