import React, { useEffect, useRef } from "react";
import BpmnViewer from "bpmn-js/lib/NavigatedViewer";
import type Canvas from "diagram-js/lib/core/Canvas";
import { socket } from "../services/socket";
import { useDiagramStore } from "../store/useDiagramStore";

const DiagramCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewer | null>(null);
  const { xml, setXml } = useDiagramStore();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize BPMN Viewer
    viewerRef.current = new BpmnViewer({
      container: containerRef.current,
      height: "100%",
      width: "100%",
    });

    // Listen for diagram updates from server
    socket.on("diagram_update", (data: { xml: string }) => {
      if (data.xml && data.xml !== xml) {
        loadDiagram(data.xml);
        setXml(data.xml);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("diagram_update");
      viewerRef.current?.destroy();
    };
  }, [xml, setXml]);

  // Load BPMN XML
  const loadDiagram = async (xmlString: string) => {
    try {
      await viewerRef.current?.importXML(xmlString);
      const canvas = viewerRef.current?.get("canvas") as Canvas | undefined;
      canvas?.zoom("fit-viewport");
    } catch (err) {
      console.error("❌ Failed to load BPMN diagram", err);
    }
  };

  // Handle local diagram change event (optional for later real-time edits)
  const handleEdit = () => {
    const updatedXml = "<new xml here>"; // Example; real code will export XML from viewer
    socket.emit("diagram_edit", { xml: updatedXml });
  };

  return (
    <div className="relative flex-1 bg-white">
      <div ref={containerRef} className="w-full h-full" />
      <button
        className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md"
        onClick={handleEdit}
      >
        Test Edit
      </button>
    </div>
  );
};

export default DiagramCanvas;
