// BPMN.js type definitions
import type { EventBus } from "diagram-js/lib/core/EventBus";
import type { Selection } from "diagram-js/lib/features/selection/Selection";
import type { Overlays } from "diagram-js/lib/features/overlays/Overlays";

export interface BpmnEventBus extends EventBus {
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler?: (...args: unknown[]) => void): void;
}

export interface BpmnSelection extends Selection {
  get(): BpmnElement[];
}

export interface BpmnElement {
  id: string;
  type: string;
  businessObject?: {
    id: string;
    name?: string;
    $type?: string;
  };
  [key: string]: unknown;
}

export interface BpmnOverlays extends Overlays {
  add(elementId: string, overlay: OverlayConfig): string | undefined;
  remove(overlayId: string): void;
}

export interface OverlayConfig {
  position: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  html: string;
}

