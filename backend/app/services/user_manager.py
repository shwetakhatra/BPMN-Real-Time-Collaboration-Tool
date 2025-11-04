class UserManager:
    def __init__(self):
        self.online_users = {}  # key: sid, value: username
        self.username_to_sid = {}  # key: username, value: list of sids

    def add_user(self, sid: str, username: str):
        self.online_users[sid] = username
        if username not in self.username_to_sid:
            self.username_to_sid[username] = []
        self.username_to_sid[username].append(sid)

    def remove_user(self, sid: str) -> str:
        username = self.online_users.pop(sid, f"User-{sid[:5]}")
        if username in self.username_to_sid:
            self.username_to_sid[username] = [s for s in self.username_to_sid[username] if s != sid]
            if not self.username_to_sid[username]:
                del self.username_to_sid[username]
        return username

    def get_username(self, sid: str) -> str:
        return self.online_users.get(sid, f"User-{sid[:5]}")

    def get_sids_by_username(self, username: str) -> list:
        """Get all socket IDs for a given username"""
        return self.username_to_sid.get(username, [])

    def list_users(self):
        # Return unique usernames only (preserves order, removes duplicates)
        all_users = list(self.online_users.values())
        return list(dict.fromkeys(all_users))

user_manager = UserManager()
