from datetime import datetime, timezone
from threading import Lock
from typing import Dict, List, Any

class DiagramState:
    """
    Thread-safe in-memory storage for diagram state using shared dictionary pattern.
    All state is persisted in memory and shared across all connections.
    """
    def __init__(self):
        self._lock = Lock()
        self._state: Dict[str, Any] = {
            "xml": "<bpmn:definitions xmlns:bpmn='http://www.omg.org/spec/BPMN/20100524/MODEL'></bpmn:definitions>",
            "locks": {},  # element_id -> username
            "logs": [],   # [{"timestamp": str, "message": str}]
            "versions": [],  # [{"timestamp": str, "xml": str}]
            "chat": [],   # [{"timestamp": str, "username": str, "message": str}]
            "last_updated": None
        }

    @property
    def xml(self) -> str:
        """Get current diagram XML"""
        with self._lock:
            return self._state["xml"]

    @xml.setter
    def xml(self, value: str):
        """Set current diagram XML"""
        with self._lock:
            self._state["xml"] = value
            self._state["last_updated"] = datetime.now(timezone.utc).isoformat()

    @property
    def locks(self) -> Dict[str, str]:
        """Get all element locks"""
        with self._lock:
            return self._state["locks"].copy()

    def lock_element(self, element_id: str, username: str):
        """Lock an element"""
        with self._lock:
            self._state["locks"][element_id] = username

    def unlock_element(self, element_id: str):
        """Unlock an element"""
        with self._lock:
            self._state["locks"].pop(element_id, None)

    def clear_locks_by_user(self, username: str) -> List[str]:
        """Clear all locks for a user, returns list of unlocked element IDs"""
        with self._lock:
            unlocked = [
                element_id for element_id, locked_by 
                in self._state["locks"].items() 
                if locked_by == username
            ]
            for element_id in unlocked:
                self._state["locks"].pop(element_id, None)
            return unlocked

    @property
    def logs(self) -> List[Dict[str, str]]:
        """Get activity logs"""
        with self._lock:
            return self._state["logs"].copy()

    def add_log(self, message: str) -> Dict[str, str]:
        """Add a log entry"""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message
        }
        with self._lock:
            self._state["logs"].append(entry)
            if len(self._state["logs"]) > 50:
                self._state["logs"].pop(0)
        return entry

    @property
    def versions(self) -> List[Dict[str, Any]]:
        """Get diagram versions"""
        with self._lock:
            return self._state["versions"].copy()

    def save_version(self):
        """Save current diagram as a version"""
        version = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "xml": self._state["xml"]
        }
        with self._lock:
            self._state["versions"].append(version)
            if len(self._state["versions"]) > 50:
                self._state["versions"].pop(0)

    @property
    def chat(self) -> List[Dict[str, str]]:
        """Get chat messages"""
        with self._lock:
            return self._state["chat"].copy()

    def add_chat_message(self, username: str, message: str) -> Dict[str, str]:
        """Add a chat message"""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "username": username,
            "message": message
        }
        with self._lock:
            self._state["chat"].append(entry)
            if len(self._state["chat"]) > 100:
                self._state["chat"].pop(0)
        return entry

    def get_state(self) -> Dict[str, Any]:
        """Get complete state snapshot"""
        with self._lock:
            return {
                "xml": self._state["xml"],
                "locks": self._state["locks"].copy(),
                "logs": self._state["logs"].copy(),
                "versions": self._state["versions"].copy(),
                "chat": self._state["chat"].copy(),
                "last_updated": self._state["last_updated"]
            }

    def get_last_updated(self) -> str:
        """Get last update timestamp"""
        with self._lock:
            return self._state["last_updated"]

    def reset(self):
        """Reset diagram state to initial blank state"""
        blank_xml = """<?xml version="1.0" encoding="UTF-8"?>
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
</bpmn:definitions>"""
        with self._lock:
            self._state["xml"] = blank_xml
            self._state["locks"] = {}
            self._state["logs"] = []
            self._state["versions"] = []
            self._state["chat"] = []
            self._state["last_updated"] = None

diagram_state = DiagramState()
