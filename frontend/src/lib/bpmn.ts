import BpmnModeler from "bpmn-js/lib/Modeler";
import type Canvas from "diagram-js/lib/core/Canvas";
import type { BpmnEventBus, BpmnSelection, BpmnOverlays } from "@/types/bpmn";

export interface BpmnModelerConfig {
  container: HTMLElement;
}

export class BpmnModelerWrapper {
  private modeler: BpmnModeler;

  constructor(config: BpmnModelerConfig) {
    this.modeler = new BpmnModeler({
      container: config.container,
    });
  }

  getModeler(): BpmnModeler {
    return this.modeler;
  }

  async importXML(xml: string): Promise<void> {
    await this.modeler.importXML(xml);
  }

  async exportXML(): Promise<string> {
    const { xml } = await this.modeler.saveXML({ format: true });
    return xml || "";
  }

  getCanvas(): Canvas | undefined {
    return this.modeler.get("canvas") as Canvas | undefined;
  }

  getEventBus(): BpmnEventBus | undefined {
    return this.modeler.get("eventBus") as BpmnEventBus | undefined;
  }

  getSelection(): BpmnSelection | undefined {
    return this.modeler.get("selection") as BpmnSelection | undefined;
  }

  getOverlays(): BpmnOverlays | undefined {
    return this.modeler.get("overlays") as BpmnOverlays | undefined;
  }

  zoom(type: "fit-viewport" | number): void {
    const canvas = this.getCanvas();
    if (canvas) {
      canvas.zoom(type);
    }
  }

  destroy(): void {
    this.modeler.destroy();
  }
}

