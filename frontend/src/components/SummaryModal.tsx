import React from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Z_INDEX } from "@/constants";

interface SummaryModalProps {
  summary: string;
  onClose: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ summary, onClose }) => {
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ zIndex: Z_INDEX.MODAL }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faBrain} className="text-purple-500" />
            Diagram Summary
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
      </div>
    </div>
  );

  // Render modal at document body level using portal to ensure it's always on top
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  
  return null;
};

export default SummaryModal;

