import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)

class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "users_online" in data
        assert isinstance(data["users_online"], int)

class TestUsersEndpoint:
    def test_list_users(self, client):
        response = client.get("/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)


class TestSummaryEndpoint:
    def test_summary_endpoint_valid_xml(self, client):
        xml_content = """<?xml version="1.0" encoding="UTF-8"?>
                            <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
                            <bpmn:process id="Process_1" name="Test Process">
                                <bpmn:startEvent id="StartEvent_1"/>
                                <bpmn:task id="Task_1" name="Test Task"/>
                                <bpmn:endEvent id="EndEvent_1"/>
                            </bpmn:process>
                            </bpmn:definitions>"""

        response = client.post(
            "/api/summary",
            json={"xml": xml_content}
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert isinstance(data["summary"], str)

    def test_summary_endpoint_missing_xml(self, client):
        response = client.post(
            "/api/summary",
            json={}
        )
        assert response.status_code == 422  # Validation error

