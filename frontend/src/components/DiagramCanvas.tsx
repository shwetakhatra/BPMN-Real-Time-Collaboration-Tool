import React, { useEffect, useRef, useCallback } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import type Canvas from "diagram-js/lib/core/Canvas";
import { socket } from "@/services/socket";
import { useDiagramStore } from "@/store/useDiagramStore";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-js.css";

const INITIAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const CURSOR_UPDATE_DELAY = 30;
const SAVE_DEBOUNCE_DELAY = 300;
const MODELER_INIT_DELAY = 300;
const CONTAINER_CHECK_INTERVAL = 100;

const DiagramCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const { xml, setXml, username } = useDiagramStore();
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const xmlRef = useRef(xml);
  const cursorElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    xmlRef.current = xml;
  }, [xml]);

  const loadDiagram = useCallback(async (xmlString: string, skipUpdate = false) => {
    if (!modelerRef.current || !xmlString) return;
    
    try {
      isUpdatingRef.current = true;
      await modelerRef.current.importXML(xmlString);
      const canvas = modelerRef.current.get("canvas") as Canvas | undefined;
      
      if (!skipUpdate) {
        canvas?.zoom("fit-viewport");
        setXml(xmlString);
      }
      
      xmlRef.current = xmlString;
    } catch (err) {
      console.error("Failed to load BPMN diagram", err);
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [setXml]);

  const saveDiagram = useCallback(async () => {
    if (!modelerRef.current || isUpdatingRef.current || !socket?.connected) return;

    try {
      const { xml: exportedXml } = await modelerRef.current.saveXML({ format: true });
      if (exportedXml && exportedXml !== xmlRef.current) {
        setXml(exportedXml);
        xmlRef.current = exportedXml;
        socket.emit("update_diagram", { xml: exportedXml });
      }
    } catch (err) {
      console.error("Failed to export BPMN diagram", err);
    }
  }, [setXml]);

  const debouncedSave = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(saveDiagram, SAVE_DEBOUNCE_DELAY);
  }, [saveDiagram]);

  const getColorFromUsername = useCallback((name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  }, []);

  const createCursorElement = useCallback((username: string, color: string): HTMLDivElement => {
    const cursorEl = document.createElement("div");
    cursorEl.className = "remote-cursor";
    cursorEl.setAttribute("data-username", username);
    cursorEl.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -100%);
      transition: left 0.05s linear, top 0.05s linear;
    `;
    
    const cursorDot = document.createElement("div");
    cursorDot.style.cssText = `
      width: 14px;
      height: 14px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      transform: translate(-50%, -50%);
    `;
    
    const nameLabel = document.createElement("div");
    nameLabel.className = "cursor-name";
    nameLabel.style.cssText = `
      background: ${color};
      color: white;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      margin-top: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transform: translateX(-50%);
    `;
    nameLabel.textContent = username;
    
    cursorEl.appendChild(cursorDot);
    cursorEl.appendChild(nameLabel);
    return cursorEl;
  }, []);

  const updateRemoteCursor = useCallback((data: { username: string; x: number; y: number }) => {
    if (!containerRef.current || !username || data.username === username) return;
    
    let cursorEl = cursorElementsRef.current.get(data.username);
    const userColor = getColorFromUsername(data.username);
    
    if (!cursorEl) {
      cursorEl = createCursorElement(data.username, userColor);
      containerRef.current.appendChild(cursorEl);
      cursorElementsRef.current.set(data.username, cursorEl);
    } else {
      const cursorDot = cursorEl.querySelector("div:first-child") as HTMLElement;
      const nameLabel = cursorEl.querySelector(".cursor-name") as HTMLElement;
      if (cursorDot) cursorDot.style.background = userColor;
      if (nameLabel) {
        nameLabel.style.background = userColor;
        nameLabel.textContent = data.username;
      }
    }
    
    cursorEl.style.left = `${data.x}px`;
    cursorEl.style.top = `${data.y}px`;
  }, [username, getColorFromUsername, createCursorElement]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!socket?.connected || !username || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
    }
    
    mouseMoveTimeoutRef.current = setTimeout(() => {
      if (socket?.connected) {
        socket.emit("cursor_move", { x, y });
      }
    }, CURSOR_UPDATE_DELAY);
  }, [socket, username]);

  useEffect(() => {
    const onDiagramUpdate = (data: { xml: string }) => {
      if (!data?.xml || data.xml === xmlRef.current) return;
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      loadDiagram(data.xml, true);
    };

    const attachListeners = () => {
      if (socket) {
        socket.off("diagram_update", onDiagramUpdate);
        socket.on("diagram_update", onDiagramUpdate);
      }
    };

    if (socket) attachListeners();

    const handleSocketReady = () => attachListeners();
    window.addEventListener("socket-ready", handleSocketReady);

    return () => {
      if (socket) socket.off("diagram_update", onDiagramUpdate);
      window.removeEventListener("socket-ready", handleSocketReady);
    };
  }, [socket, loadDiagram]);

  useEffect(() => {
    if (!containerRef.current) return;

    const checkContainer = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(checkContainer, CONTAINER_CHECK_INTERVAL);
        return;
      }

      modelerRef.current = new BpmnModeler({
        container: containerRef.current,
      });

      setTimeout(() => {
        const initialXml = xml || INITIAL_XML;
        loadDiagram(initialXml, false);
        if (!xml) setXml(initialXml);

        if (!modelerRef.current) return;
        
        const eventBus = modelerRef.current.get("eventBus") as any;
        const changeHandler = () => {
          if (!isUpdatingRef.current) debouncedSave();
        };
        eventBus.on("commandStack.changed", changeHandler);
      }, MODELER_INIT_DELAY);
    };

    checkContainer();

    return () => {
      if (modelerRef.current) {
        const eventBus = modelerRef.current.get("eventBus") as any;
        if (eventBus) eventBus.off("commandStack.changed");
      }
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      modelerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !socket || !username) return;

    const onCursorUpdate = (data: { username: string; x: number; y: number }) => {
      updateRemoteCursor(data);
    };

    const sendInitialStatus = () => {
      if (socket?.connected) {
        setTimeout(() => {
          if (socket?.connected) socket.emit("get_users");
        }, 500);
      }
    };

    const onUserUpdate = () => {
      const currentUsers = useDiagramStore.getState().users;
      const userNames = new Set(currentUsers.map((u: any) => u.username || u));
      
      cursorElementsRef.current.forEach((cursorEl, cursorUsername) => {
        if (!userNames.has(cursorUsername)) {
          cursorEl.remove();
          cursorElementsRef.current.delete(cursorUsername);
        }
      });
    };

    const attachListeners = () => {
      if (socket) {
        socket.off("cursor_update", onCursorUpdate);
        socket.off("user_update", onUserUpdate);
        socket.on("cursor_update", onCursorUpdate);
        socket.on("user_update", onUserUpdate);
      }
    };

    if (socket) attachListeners();

    if (socket?.connected) sendInitialStatus();
    if (socket) socket.once("connect", sendInitialStatus);

    const handleSocketReady = () => attachListeners();
    window.addEventListener("socket-ready", handleSocketReady);

    containerRef.current.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("socket-ready", handleSocketReady);
      
      if (socket) {
        socket.off("cursor_update", onCursorUpdate);
        socket.off("user_update", onUserUpdate);
      }
      
      cursorElementsRef.current.forEach((cursorEl) => cursorEl.remove());
      cursorElementsRef.current.clear();
      
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, [socket, username, handleMouseMove, updateRemoteCursor]);

  return (
    <div className="relative w-full h-full bg-white" style={{ overflow: "hidden", position: "relative" }}>
      <div 
        ref={containerRef} 
        className="w-full h-full bjs-container" 
        style={{ 
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "100%"
        }} 
      />
    </div>
  );
};

export default DiagramCanvas;
