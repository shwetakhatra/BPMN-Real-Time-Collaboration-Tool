class UserManager:
    def __init__(self):
        self.online_users = {}  # key: sid, value: username

    def add_user(self, sid: str, username: str):
        self.online_users[sid] = username

    def remove_user(self, sid: str) -> str:
        return self.online_users.pop(sid, f"User-{sid[:5]}")

    def get_username(self, sid: str) -> str:
        return self.online_users.get(sid, f"User-{sid[:5]}")

    def list_users(self):
        return list(self.online_users.values())

user_manager = UserManager()
