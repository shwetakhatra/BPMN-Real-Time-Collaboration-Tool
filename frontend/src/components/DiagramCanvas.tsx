import React, { useEffect, useRef, useCallback } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import type Canvas from "diagram-js/lib/core/Canvas";
import { socket } from "@/services/socket";
import { useDiagramStore } from "@/store/useDiagramStore";
import { INITIAL_XML, CURSOR_UPDATE_DELAY, SAVE_DEBOUNCE_DELAY, MODELER_INIT_DELAY, CONTAINER_CHECK_INTERVAL } from "@/utils/diagramUtils";
import { getColorFromUsername } from "@/utils/colorUtils";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-js.css";

const DiagramCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const { xml, setXml, username, setEditingElement } = useDiagramStore();
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const xmlRef = useRef(xml);
  const cursorElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editingOverlaysRef = useRef<Map<string, string>>(new Map()); // element_id -> overlay_id
  const currentEditingElementRef = useRef<string | null>(null);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Failed to load diagram
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
      // Failed to export diagram
    }
  }, [setXml]);

  const exportXML = useCallback(async (): Promise<string | null> => {
    if (!modelerRef.current) return null;
    try {
      const { xml: exportedXml } = await modelerRef.current.saveXML({ format: true });
      return exportedXml || null;
    } catch (err) {
      return null;
    }
  }, []);

  const debouncedSave = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(saveDiagram, SAVE_DEBOUNCE_DELAY);
  }, [saveDiagram]);


  const createEditingMarker = (color: string): string => {
    return `
      <div class="editing-marker" style="
        background: ${color};
        color: white;
        padding: 6px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    `;
  };

  const updateEditingMarkers = useCallback(() => {
    if (!modelerRef.current || !username) return;
    
    const overlays = modelerRef.current.get("overlays") as any;
    const editingElements = useDiagramStore.getState().editingElements;
    
    editingOverlaysRef.current.forEach((overlayId, elementId) => {
      if (!editingElements[elementId] || editingElements[elementId] === username) {
        try {
          overlays?.remove?.(overlayId);
          editingOverlaysRef.current.delete(elementId);
        } catch {
          // Overlay already removed
        }
      }
    });
    
    Object.entries(editingElements).forEach(([elementId, editorUsername]) => {
      if (editorUsername === username || editingOverlaysRef.current.has(elementId)) return;
      
      try {
        const color = getColorFromUsername(editorUsername);
        const overlayId = overlays?.add?.(elementId, {
          position: { top: -10, right: -10 },
          html: createEditingMarker(color)
        });
        
        if (overlayId) {
          editingOverlaysRef.current.set(elementId, overlayId);
        }
      } catch {
        // Failed to add overlay
      }
    });
  }, [username]);

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

    const onEditingUpdate = (data: { username: string; element_id: string | null }) => {
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

        const selectionHandler = () => {
          if (!socket?.connected || !username) return;
          
          const selection = modelerRef.current?.get("selection") as any;
          const selectedElement = selection?.get()?.[0];
          
          if (editingTimeoutRef.current) {
            clearTimeout(editingTimeoutRef.current);
          }
          
          if (selectedElement) {
            const elementId = selectedElement.id;
            
            if (currentEditingElementRef.current && currentEditingElementRef.current !== elementId) {
              socket.emit("user_editing", { element_id: null });
              setEditingElement(currentEditingElementRef.current, null);
            }
            
            editingTimeoutRef.current = setTimeout(() => {
              if (socket?.connected && username) {
                socket.emit("user_editing", { element_id: elementId });
                setEditingElement(elementId, username);
                currentEditingElementRef.current = elementId;
              }
            }, 500);
          } else {
            if (currentEditingElementRef.current) {
              socket.emit("user_editing", { element_id: null });
              setEditingElement(currentEditingElementRef.current, null);
              currentEditingElementRef.current = null;
            }
          }
        };
        
        eventBus.on("selection.changed", selectionHandler);
        
        // Cleanup on unmount
        return () => {
          eventBus.off("selection.changed", selectionHandler);
        };
      }, MODELER_INIT_DELAY);
    };

    checkContainer();

    return () => {
      if (modelerRef.current) {
        const eventBus = modelerRef.current.get("eventBus") as any;
        if (eventBus) {
          eventBus.off("commandStack.changed");
          eventBus.off("selection.changed");
        }
        
        // Clean up editing overlays
        const overlays = modelerRef.current.get("overlays") as any;
        editingOverlaysRef.current.forEach((overlayId) => {
          try {
            if (overlays?.remove) {
              overlays.remove(overlayId);
            }
          } catch (e) {
            // Ignore
          }
        });
        editingOverlaysRef.current.clear();
      }
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (editingTimeoutRef.current) clearTimeout(editingTimeoutRef.current);
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

  const syncDiagram = useCallback(() => {
    if (!socket?.connected) return;
    socket.emit("sync_diagram");
  }, [socket]);

  // Update editing markers when editing elements change
  useEffect(() => {
    const unsubscribe = useDiagramStore.subscribe((state) => {
      if (state.editingElements) {
        updateEditingMarkers();
      }
    });
    
    return unsubscribe;
  }, [updateEditingMarkers]);

  // Update markers after diagram loads
  useEffect(() => {
    if (modelerRef.current) {
      setTimeout(() => updateEditingMarkers(), 500);
    }
  }, [xml, updateEditingMarkers]);

  useEffect(() => {
    (window as any).exportDiagramXML = exportXML;
    (window as any).syncDiagram = syncDiagram;
    return () => {
      delete (window as any).exportDiagramXML;
      delete (window as any).syncDiagram;
    };
  }, [exportXML, syncDiagram]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <div ref={containerRef} className="w-full h-full bjs-container" />
    </div>
  );
};

export default DiagramCanvas;
