import datetime
from app.services import user_manager, diagram_state
from app.models import DiagramUpdatePayload, LockPayload, ChatMessagePayload
from app.utils import log_and_broadcast
from socketio import AsyncServer

async def register_events(sio: AsyncServer):
    @sio.event(namespace="/")
    async def connect(sid, environ):
        username = environ.get("HTTP_USERNAME", f"User-{sid[:5]}")
        user_manager.add_user(sid, username)
        await sio.emit("user_update", user_manager.list_users())
        await log_and_broadcast(sio, f"{username} connected")

    @sio.event(namespace="/")
    async def disconnect(sid):
        username = user_manager.remove_user(sid)
        await sio.emit("user_update", user_manager.list_users())
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
    async def send_chat(sid, data):
        payload = ChatMessagePayload(**data)
        user = user_manager.get_username(sid)
        entry = {"timestamp": datetime.utcnow().isoformat(), "username": user, "message": payload.message}
        diagram_state.chat.append(entry)
        if len(diagram_state.chat) > 100:
            diagram_state.chat.pop(0)
        await sio.emit("receive_chat", entry)
