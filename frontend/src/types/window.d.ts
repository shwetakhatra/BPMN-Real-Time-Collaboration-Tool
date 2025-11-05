// Window extensions for global functions
declare global {
  interface Window {
    exportDiagramXML?: () => Promise<string | null>;
    syncDiagram?: () => void;
  }
}

export {};

