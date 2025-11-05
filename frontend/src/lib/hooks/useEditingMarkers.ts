import { useEffect, useRef, useCallback } from "react";
import { useDiagramStore } from "@/store/useDiagramStore";
import { getColorFromUsername } from "@/utils/colorUtils";
import { BpmnModelerWrapper } from "../bpmn";
import type { OverlayConfig } from "@/types/bpmn";

interface UseEditingMarkersOptions {
  modeler: BpmnModelerWrapper | null;
}

export const useEditingMarkers = ({ modeler }: UseEditingMarkersOptions) => {
  const { username } = useDiagramStore();
  const editingOverlaysRef = useRef<Map<string, string>>(new Map());

  const createEditingMarker = useCallback((color: string): string => {
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
  }, []);

  const updateEditingMarkers = useCallback(() => {
    if (!modeler || !username) return;
    
    const overlays = modeler.getOverlays();
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
        const overlayConfig: OverlayConfig = {
          position: { top: -10, right: -10 },
          html: createEditingMarker(color)
        };
        const overlayId = overlays?.add(elementId, overlayConfig);
        
        if (overlayId) {
          editingOverlaysRef.current.set(elementId, overlayId);
        }
      } catch {
        // Failed to add overlay
      }
    });
  }, [username, modeler, createEditingMarker]);

  useEffect(() => {
    const unsubscribe = useDiagramStore.subscribe((state) => {
      if (state.editingElements) {
        updateEditingMarkers();
      }
    });
    
    return unsubscribe;
  }, [updateEditingMarkers]);

  useEffect(() => {
    if (modeler) {
      const timeoutId = setTimeout(() => updateEditingMarkers(), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [modeler, updateEditingMarkers]);

  useEffect(() => {
    return () => {
      if (modeler) {
        const overlays = modeler.getOverlays();
        editingOverlaysRef.current.forEach((overlayId) => {
          try {
            overlays?.remove?.(overlayId);
          } catch {
            // Ignore
          }
        });
        editingOverlaysRef.current.clear();
      }
    };
  }, [modeler]);

  return {
    updateEditingMarkers,
  };
};

