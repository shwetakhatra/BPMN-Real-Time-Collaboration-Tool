import asyncio
from app.services.user_manager import user_manager
from app.services.diagram_state import diagram_state
from app.models import DiagramUpdatePayload, LockPayload, ChatMessagePayload, CursorPositionPayload, EditingPayload
from app.utils import log_and_broadcast
from socketio import AsyncServer

def get_username_from_request(sid, environ, auth):
    username = (auth or {}).get("username") or environ.get("HTTP_USERNAME")
    if not username:
        from urllib.parse import parse_qs
        qs = parse_qs(environ.get("QUERY_STRING", ""))
        username = qs.get("username", [None])[0]
    return username or f"User-{sid[:5]}"

async def send_initial_state(sio, sid):
    all_users = list(dict.fromkeys(user_manager.online_users.values()))
    await sio.emit("user_update", all_users, to=sid, namespace="/")
    await sio.emit("user_update", all_users, namespace="/")
    
    if diagram_state.xml:
        await sio.emit("diagram_update", {"xml": diagram_state.xml}, to=sid, namespace="/")
    if diagram_state.locks:
        await sio.emit("locks_update", diagram_state.locks, to=sid, namespace="/")
    if diagram_state.chat:
        await sio.emit("chat_history", diagram_state.chat, to=sid, namespace="/")
    if diagram_state.logs:
        await sio.emit("activity_log", diagram_state.logs, to=sid, namespace="/")

def register_events(sio: AsyncServer):
    @sio.event(namespace="/")
    async def connect(sid, environ, auth=None):
        try:
            username = get_username_from_request(sid, environ, auth)
            
            if sid in user_manager.online_users:
                user_manager.remove_user(sid)
            
            user_manager.add_user(sid, username)
            await asyncio.sleep(0.1)
            await send_initial_state(sio, sid)
            await log_and_broadcast(sio, f"{username} connected")
        except Exception:
            pass

    @sio.event(namespace="/")
    async def disconnect(sid):
        username = user_manager.remove_user(sid)
        
        elements_to_unlock = diagram_state.clear_locks_by_user(username)
        if elements_to_unlock:
            await sio.emit("locks_update", diagram_state.locks, namespace="/")
        
        all_users = list(dict.fromkeys(user_manager.online_users.values()))
        await sio.emit("user_update", all_users, namespace="/")
        await log_and_broadcast(sio, f"{username} disconnected")
        
        if len(user_manager.online_users) == 0:
            diagram_state.reset()
            await log_and_broadcast(sio, "Diagram reset - all users disconnected")

    @sio.event(namespace="/")
    async def update_diagram(sid, data):
        try:
            payload = DiagramUpdatePayload(**data)
            user = user_manager.get_username(sid)
            diagram_state.xml = payload.xml
            diagram_state.save_version()
            await sio.emit("diagram_update", {"xml": diagram_state.xml}, skip_sid=sid, namespace="/")
            await log_and_broadcast(sio, f"{user} updated diagram", skip_sid=sid)
        except Exception:
            pass

    @sio.event(namespace="/")
    async def lock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        diagram_state.lock_element(payload.element_id, user)
        await sio.emit("element_locked", {"element_id": payload.element_id, "locked_by": user}, skip_sid=sid, namespace="/")
        await sio.emit("locks_update", diagram_state.locks, skip_sid=sid, namespace="/")

    @sio.event(namespace="/")
    async def unlock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        diagram_state.unlock_element(payload.element_id)
        await sio.emit("element_unlocked", {"element_id": payload.element_id}, skip_sid=sid, namespace="/")
        await sio.emit("locks_update", diagram_state.locks, skip_sid=sid, namespace="/")

    @sio.event(namespace="/")
    async def get_activity_log(sid):
        await sio.emit("activity_log", diagram_state.logs, to=sid, namespace="/")

    @sio.event(namespace="/")
    async def get_versions(sid):
        await sio.emit("diagram_versions", diagram_state.versions, to=sid)

    @sio.event(namespace="/")
    async def get_users(sid):
        users = list(dict.fromkeys(user_manager.online_users.values()))
        await sio.emit("user_update", users, to=sid, namespace="/")

    @sio.event(namespace="/")
    async def sync_diagram(sid):
        if diagram_state.xml:
            await sio.emit("diagram_update", {"xml": diagram_state.xml}, namespace="/")
            user = user_manager.get_username(sid)
            await log_and_broadcast(sio, f"{user} synced diagram for all users")

    @sio.event(namespace="/")
    async def send_chat(sid, data):
        payload = ChatMessagePayload(**data)
        user = user_manager.get_username(sid)
        entry = diagram_state.add_chat_message(user, payload.message)
        await sio.emit("receive_chat", entry, namespace="/")

    @sio.event(namespace="/")
    async def cursor_move(sid, data):
        payload = CursorPositionPayload(**data)
        await sio.emit("cursor_update", {
            "username": user_manager.get_username(sid),
            "x": payload.x,
            "y": payload.y
        }, skip_sid=sid, namespace="/")

    @sio.event(namespace="/")
    async def user_editing(sid, data):
        try:
            payload = EditingPayload(**data)
            await sio.emit("editing_update", {
                "username": user_manager.get_username(sid),
                "element_id": payload.element_id
            }, skip_sid=sid, namespace="/")
        except Exception:
            pass
