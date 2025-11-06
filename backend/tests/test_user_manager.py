import pytest
from app.services.user_manager import UserManager


class TestUserManager:
    def setup_method(self):
        self.manager = UserManager()

    def test_add_user(self):
        self.manager.add_user("sid1", "shweta")
        assert "sid1" in self.manager.online_users
        assert self.manager.online_users["sid1"] == "shweta"
        assert "shweta" in self.manager.username_to_sid
        assert "sid1" in self.manager.username_to_sid["shweta"]

    def test_add_multiple_users(self):
        self.manager.add_user("sid1", "shweta")
        self.manager.add_user("sid2", "mohit")
        self.manager.add_user("sid3", "shweta")

        assert len(self.manager.online_users) == 3
        assert len(self.manager.username_to_sid["shweta"]) == 2
        assert len(self.manager.username_to_sid["mohit"]) == 1

    def test_remove_user(self):
        self.manager.add_user("sid1", "shweta")
        username = self.manager.remove_user("sid1")

        assert username == "shweta"
        assert "sid1" not in self.manager.online_users
        assert "shweta" not in self.manager.username_to_sid

    def test_get_username(self):
        """Test getting username by socket ID"""
        self.manager.add_user("sid1", "shweta")
        assert self.manager.get_username("sid1") == "shweta"

    def test_list_users(self):
        """Test listing all unique users"""
        self.manager.add_user("sid1", "shweta")
        self.manager.add_user("sid2", "mohit")
        self.manager.add_user("sid3", "shweta")

        users = self.manager.list_users()
        assert len(users) == 2
        assert "shweta" in users
        assert "mohit" in users

