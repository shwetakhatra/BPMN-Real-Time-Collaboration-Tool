import asyncio
import datetime
from app.services.user_manager import user_manager
from app.services import diagram_state
from app.models import DiagramUpdatePayload, LockPayload, ChatMessagePayload
from app.utils import log_and_broadcast
from socketio import AsyncServer

def register_events(sio: AsyncServer):
    @sio.event(namespace="/")
    async def connect(sid, environ, auth=None):
        try:
            from urllib.parse import parse_qs
            username = (auth or {}).get("username") or environ.get("HTTP_USERNAME")
            if not username:
                qs = parse_qs(environ.get("QUERY_STRING", ""))
                q_user = qs.get("username", [None])[0]
                if q_user:
                    username = q_user
            if not username:
                username = f"User-{sid[:5]}"
            
            if sid in user_manager.online_users:
                user_manager.remove_user(sid)
            
            user_manager.add_user(sid, username)
            await asyncio.sleep(0.1)
            
            all_users = list(user_manager.online_users.values())
            users = list(dict.fromkeys(all_users))
            await sio.emit("user_update", users, to=sid, namespace="/")
            await sio.emit("user_update", users, namespace="/")
            await log_and_broadcast(sio, f"{username} connected")
        except Exception as e:
            print(f"Connection error: {e}", flush=True)
            import traceback
            traceback.print_exc()

    @sio.event(namespace="/")
    async def disconnect(sid):
        username = user_manager.remove_user(sid)
        all_users = list(user_manager.online_users.values())
        users = list(dict.fromkeys(all_users))
        await sio.emit("user_update", users, namespace="/")
        await log_and_broadcast(sio, f"{username} disconnected")

    @sio.event(namespace="/")
    async def update_diagram(sid, data):
        payload = DiagramUpdatePayload(**data)
        user = user_manager.get_username(sid)
        diagram_state.xml = payload.xml
        diagram_state.save_version()
        await log_and_broadcast(sio, f"{user} updated diagram", "diagram_update", {"xml": diagram_state.xml}, skip_sid=sid)

    @sio.event(namespace="/")
    async def lock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        diagram_state.locks[payload.element_id] = user
        await log_and_broadcast(sio, f"{user} locked {payload.element_id}", "element_locked", {"element_id": payload.element_id, "locked_by": user}, skip_sid=sid)

    @sio.event(namespace="/")
    async def unlock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        if payload.element_id in diagram_state.locks:
            del diagram_state.locks[payload.element_id]
        await log_and_broadcast(sio, f"{user} unlocked {payload.element_id}", "element_unlocked", {"element_id": payload.element_id}, skip_sid=sid)

    @sio.event(namespace="/")
    async def get_activity_log(sid):
        await sio.emit("activity_log", diagram_state.logs, to=sid)

    @sio.event(namespace="/")
    async def get_versions(sid):
        await sio.emit("diagram_versions", diagram_state.versions, to=sid)

    @sio.event(namespace="/")
    async def get_users(sid):
        all_users = list(user_manager.online_users.values())
        users = list(dict.fromkeys(all_users))
        await sio.emit("user_update", users, to=sid, namespace="/")

    @sio.event(namespace="/")
    async def send_chat(sid, data):
        payload = ChatMessagePayload(**data)
        user = user_manager.get_username(sid)
        entry = {"timestamp": datetime.utcnow().isoformat(), "username": user, "message": payload.message}
        diagram_state.chat.append(entry)
        if len(diagram_state.chat) > 100:
            diagram_state.chat.pop(0)
        await sio.emit("receive_chat", entry)
