import pytest
import threading
import time
from app.services.diagram_state import DiagramState


class TestDiagramState:
    def setup_method(self):
        self.state = DiagramState()

    def test_initial_xml(self):
        xml = self.state.xml
        assert isinstance(xml, str)
        assert "bpmn:definitions" in xml

    def test_set_xml(self):
        new_xml = "<bpmn:definitions><bpmn:process/></bpmn:definitions>"
        self.state.xml = new_xml
        assert self.state.xml == new_xml
        assert self.state.get_last_updated() is not None

    def test_lock_element(self):
        self.state.lock_element("element1", "alice")
        locks = self.state.locks
        assert locks["element1"] == "alice"

    def test_unlock_element(self):
        self.state.lock_element("element1", "alice")
        self.state.unlock_element("element1")
        locks = self.state.locks
        assert "element1" not in locks

    def test_save_version(self):
        """Test saving a diagram version"""
        self.state.xml = "<test>xml</test>"
        self.state.save_version()
        versions = self.state.versions
        assert len(versions) == 1
        assert versions[0]["xml"] == "<test>xml</test>"
        assert "timestamp" in versions[0]

    def test_add_chat_message(self):
        """Test adding a chat message"""
        message = self.state.add_chat_message("alice", "Hello!")
        assert message["username"] == "alice"
        assert message["message"] == "Hello!"
        assert "timestamp" in message
        assert len(self.state.chat) == 1

