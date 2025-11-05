import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faBrain, faRotateRight, faSignOut, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useDiagramStore } from "@/store/useDiagramStore";
import { socket } from "@/services/socket";
import Button from "./ui/Button";

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

  const handleSaveVersion = async () => {
    const exportXML = (window as any).exportDiagramXML;
    if (!exportXML) {
      console.error("Export function not available");
      return;
    }

    try {
      const xml = await exportXML();
      if (!xml) {
        alert("Failed to export diagram");
        return;
      }

      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bpmn-diagram-${new Date().toISOString().split("T")[0]}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to save version", err);
      alert("Failed to export diagram");
    }
  };

  const handleAISummary = async () => {
    const exportXML = (window as any).exportDiagramXML;
    if (!exportXML) {
      console.error("Export function not available");
      return;
    }

    setIsLoading(true);
    try {
      const xml = await exportXML();
      if (!xml) {
        alert("Failed to get diagram XML");
        setIsLoading(false);
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ xml }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to get summary: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setSummary(data.summary || "Unable to generate summary");
    } catch (err) {
      console.error("Failed to get AI summary", err);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
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
          onClick={() => {
            const syncDiagram = (window as any).syncDiagram;
            if (syncDiagram && !isRefreshing) {
              setIsRefreshing(true);
              syncDiagram();
              setTimeout(() => setIsRefreshing(false), 1000);
            }
          }}
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
      
      {summary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faBrain} className="text-purple-500" />
                Diagram Summary
              </h3>
              <button
                onClick={() => setSummary(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </div>
            <div className="flex justify-end p-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setSummary(null)}
                className="px-4 py-2"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
