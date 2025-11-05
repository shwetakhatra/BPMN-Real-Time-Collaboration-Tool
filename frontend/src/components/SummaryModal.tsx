import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faTimes } from "@fortawesome/free-solid-svg-icons";
import Button from "./ui/Button";

interface SummaryModalProps {
  summary: string;
  onClose: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ summary, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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
        <div className="flex justify-end p-4 border-t">
          <Button variant="secondary" onClick={onClose} className="px-4 py-2">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;

