import { useEffect, useRef, useCallback, RefObject } from "react";
import { BpmnModelerWrapper } from "../bpmn";
import { INITIAL_XML, MODELER_INIT_DELAY, CONTAINER_CHECK_INTERVAL, SAVE_DEBOUNCE_DELAY } from "@/utils/diagramUtils";
import { socket } from "@/services/socket";
import { useDiagramStore } from "@/store/useDiagramStore";
import { SOCKET_EVENTS } from "@/constants";

interface UseBpmnModelerOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  xml: string;
  onSave?: (xml: string) => void;
  onSelectionChange?: (elementId: string | null) => void;
}

export const useBpmnModeler = ({
  containerRef,
  xml,
  onSave,
  onSelectionChange,
}: UseBpmnModelerOptions) => {
  const modelerRef = useRef<BpmnModelerWrapper | null>(null);
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const xmlRef = useRef(xml);
  const { username, setXml, setEditingElement } = useDiagramStore();
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentEditingElementRef = useRef<string | null>(null);

  useEffect(() => {
    xmlRef.current = xml;
  }, [xml]);

  const loadDiagram = useCallback(async (xmlString: string, skipUpdate = false) => {
    if (!modelerRef.current || !xmlString) return;
    
    try {
      isUpdatingRef.current = true;
      await modelerRef.current.importXML(xmlString);
      const canvas = modelerRef.current.getCanvas();
      
      if (!skipUpdate) {
        canvas?.zoom("fit-viewport");
        setXml(xmlString);
      }
      
      xmlRef.current = xmlString;
    } catch {
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
      const exportedXml = await modelerRef.current.exportXML();
      if (exportedXml && exportedXml !== xmlRef.current) {
        setXml(exportedXml);
        xmlRef.current = exportedXml;
        socket.emit(SOCKET_EVENTS.UPDATE_DIAGRAM, { xml: exportedXml });
        onSave?.(exportedXml);
      }
    } catch {
      // Failed to export diagram
    }
  }, [setXml, onSave]);

  const debouncedSave = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(saveDiagram, SAVE_DEBOUNCE_DELAY);
  }, [saveDiagram]);

  const exportXML = useCallback(async (): Promise<string | null> => {
    if (!modelerRef.current) return null;
    try {
      return await modelerRef.current.exportXML();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || modelerRef.current) return;

    const checkContainer = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(checkContainer, CONTAINER_CHECK_INTERVAL);
        return;
      }

      modelerRef.current = new BpmnModelerWrapper({
        container: containerRef.current,
      });

      setTimeout(() => {
        const initialXml = xmlRef.current || INITIAL_XML;
        loadDiagram(initialXml, false);
        if (!xmlRef.current) setXml(initialXml);

        if (!modelerRef.current) return;
        
        const eventBus = modelerRef.current.getEventBus();
        if (!eventBus) return;
        
        const changeHandler = () => {
          if (!isUpdatingRef.current) debouncedSave();
        };
        eventBus.on("commandStack.changed", changeHandler);

        const selectionHandler = () => {
          if (!socket?.connected || !username) return;
          
          const selection = modelerRef.current?.getSelection();
          const selectedElements = selection?.get();
          const selectedElement = selectedElements?.[0];
          
          if (editingTimeoutRef.current) {
            clearTimeout(editingTimeoutRef.current);
          }
          
          if (selectedElement?.id) {
            const elementId = selectedElement.id;
            
            if (currentEditingElementRef.current && currentEditingElementRef.current !== elementId) {
              socket.emit(SOCKET_EVENTS.USER_EDITING, { element_id: null });
              setEditingElement(currentEditingElementRef.current, null);
            }
            
            editingTimeoutRef.current = setTimeout(() => {
              if (socket?.connected && username) {
                socket.emit(SOCKET_EVENTS.USER_EDITING, { element_id: elementId });
                setEditingElement(elementId, username);
                currentEditingElementRef.current = elementId;
                onSelectionChange?.(elementId);
              }
            }, 500);
          } else {
            if (currentEditingElementRef.current) {
              socket.emit(SOCKET_EVENTS.USER_EDITING, { element_id: null });
              setEditingElement(currentEditingElementRef.current, null);
              currentEditingElementRef.current = null;
              onSelectionChange?.(null);
            }
          }
        };
        
        eventBus.on("selection.changed", selectionHandler);
      }, MODELER_INIT_DELAY);
    };

    checkContainer();

    return () => {
      if (modelerRef.current) {
        const eventBus = modelerRef.current.getEventBus();
        if (eventBus) {
          eventBus.off("commandStack.changed");
          eventBus.off("selection.changed");
        }
      }
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (editingTimeoutRef.current) clearTimeout(editingTimeoutRef.current);
      modelerRef.current?.destroy();
      modelerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    modeler: modelerRef.current,
    loadDiagram,
    exportXML,
  };
};

