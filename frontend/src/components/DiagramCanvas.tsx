import React, { useEffect, useRef, useCallback } from "react";
import { socket } from "@/services/socket";
import { useDiagramStore } from "@/store/useDiagramStore";
import { useBpmnModeler } from "@/lib/hooks/useBpmnModeler";
import { useRemoteCursors } from "@/lib/hooks/useRemoteCursors";
import { useEditingMarkers } from "@/lib/hooks/useEditingMarkers";
import type { SocketEvents } from "@/types/socket";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-js.css";

const DiagramCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { xml, setXml, username, setEditingElement } = useDiagramStore();
  const xmlRef = useRef(xml);

  useEffect(() => {
    xmlRef.current = xml;
  }, [xml]);

  const { modeler, loadDiagram, exportXML } = useBpmnModeler({
    containerRef,
    xml,
  });

  useRemoteCursors({ containerRef });

  const { updateEditingMarkers } = useEditingMarkers({ modeler });

  const syncDiagram = useCallback(() => {
    if (!socket?.connected) return;
    socket.emit("sync_diagram");
  }, []);

  useEffect(() => {
    const onDiagramUpdate = (data: SocketEvents["diagram_update"]) => {
      if (!data?.xml || data.xml === xmlRef.current) return;
      loadDiagram(data.xml, true);
    };

    const onEditingUpdate = (data: SocketEvents["editing_update"]) => {
      if (!data || data.username === username) return;
      
      if (data.element_id) {
        setEditingElement(data.element_id, data.username);
      } else {
        const editingElements = useDiagramStore.getState().editingElements;
        Object.entries(editingElements).forEach(([elementId, editorUsername]) => {
          if (editorUsername === data.username) {
            setEditingElement(elementId, null);
          }
        });
      }
      setTimeout(() => updateEditingMarkers(), 100);
    };

    const attachListeners = () => {
      if (socket) {
        socket.off("diagram_update", onDiagramUpdate);
        socket.off("editing_update", onEditingUpdate);
        socket.on("diagram_update", onDiagramUpdate);
        socket.on("editing_update", onEditingUpdate);
      }
    };

    if (socket) attachListeners();

    const handleSocketReady = () => attachListeners();
    window.addEventListener("socket-ready", handleSocketReady);

    return () => {
      if (socket) {
        socket.off("diagram_update", onDiagramUpdate);
        socket.off("editing_update", onEditingUpdate);
      }
      window.removeEventListener("socket-ready", handleSocketReady);
    };
  }, [socket, loadDiagram, username, setEditingElement, updateEditingMarkers]);

  useEffect(() => {
    if (modeler) {
      setTimeout(() => updateEditingMarkers(), 500);
    }
  }, [xml, modeler, updateEditingMarkers]);

  useEffect(() => {
    window.exportDiagramXML = exportXML;
    window.syncDiagram = syncDiagram;
    return () => {
      delete window.exportDiagramXML;
      delete window.syncDiagram;
    };
  }, [exportXML, syncDiagram]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <div ref={containerRef} className="w-full h-full bjs-container" />
    </div>
  );
};

export default DiagramCanvas;
