from datetime import datetime, timezone

class DiagramState:
    def __init__(self):
        self.xml = "<bpmn:definitions xmlns:bpmn='http://www.omg.org/spec/BPMN/20100524/MODEL'></bpmn:definitions>"
        self.locks = {}         # element_id -> username
        self.logs = []          # [{"timestamp": str, "message": str}]
        self.versions = []      # [{"timestamp": str, "xml": str}]
        self.chat = []          # [{"timestamp": str, "username": str, "message": str}]

    def add_log(self, message: str):
        entry = {"timestamp": datetime.now(timezone.utc).isoformat(), "message": message}
        self.logs.append(entry)
        if len(self.logs) > 50:
            self.logs.pop(0)
        return entry

    def save_version(self):
        self.versions.append({"timestamp": datetime.now(timezone.utc).isoformat(), "xml": self.xml})
        if len(self.versions) > 50:
            self.versions.pop(0)

diagram_state = DiagramState()
