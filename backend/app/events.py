import asyncio
import datetime
from app.services.user_manager import user_manager
from app.services.diagram_state import diagram_state
from app.models import DiagramUpdatePayload, LockPayload, ChatMessagePayload, CursorPositionPayload, EditingPayload
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
            
            # Send current diagram to new connection
            if diagram_state.xml:
                await sio.emit("diagram_update", {"xml": diagram_state.xml}, to=sid, namespace="/")
            
            # Send current locks to new connection
            if diagram_state.locks:
                await sio.emit("locks_update", diagram_state.locks, to=sid, namespace="/")
            
            await log_and_broadcast(sio, f"{username} connected")
        except Exception as e:
            print(f"Connection error: {e}", flush=True)
            import traceback
            traceback.print_exc()

    @sio.event(namespace="/")
    async def disconnect(sid):
        username = user_manager.remove_user(sid)
        
        # Unlock all elements locked by this user
        elements_to_unlock = [
            element_id for element_id, locked_by in diagram_state.locks.items()
            if locked_by == username
        ]
        for element_id in elements_to_unlock:
            del diagram_state.locks[element_id]
        
        # Broadcast updated locks if any were removed
        if elements_to_unlock:
            await sio.emit("locks_update", diagram_state.locks, namespace="/")
        
        all_users = list(user_manager.online_users.values())
        users = list(dict.fromkeys(all_users))
        await sio.emit("user_update", users, namespace="/")
        await log_and_broadcast(sio, f"{username} disconnected")

    @sio.event(namespace="/")
    async def update_diagram(sid, data):
        try:
            payload = DiagramUpdatePayload(**data)
            user = user_manager.get_username(sid)
            
            # Verify diagram_state is an instance, not a module
            if not hasattr(diagram_state, 'save_version'):
                print(f"ERROR: diagram_state is a module, not an instance! Type: {type(diagram_state)}", flush=True)
                return
            
            # Update the diagram state
            diagram_state.xml = payload.xml
            diagram_state.save_version()
            
            # Broadcast to all other clients (excluding the sender)
            await sio.emit("diagram_update", {"xml": diagram_state.xml}, skip_sid=sid, namespace="/")
            await log_and_broadcast(sio, f"{user} updated diagram", skip_sid=sid)
        except Exception as e:
            print(f"Error in update_diagram: {e}", flush=True)
            import traceback
            traceback.print_exc()

    @sio.event(namespace="/")
    async def lock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        diagram_state.locks[payload.element_id] = user
        # Broadcast to all clients (excluding sender)
        await sio.emit("element_locked", {"element_id": payload.element_id, "locked_by": user}, skip_sid=sid, namespace="/")
        await sio.emit("locks_update", diagram_state.locks, skip_sid=sid, namespace="/")

    @sio.event(namespace="/")
    async def unlock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        if payload.element_id in diagram_state.locks:
            del diagram_state.locks[payload.element_id]
        # Broadcast to all clients (excluding sender)
        await sio.emit("element_unlocked", {"element_id": payload.element_id}, skip_sid=sid, namespace="/")
        await sio.emit("locks_update", diagram_state.locks, skip_sid=sid, namespace="/")

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

    @sio.event(namespace="/")
    async def cursor_move(sid, data):
        payload = CursorPositionPayload(**data)
        user = user_manager.get_username(sid)
        # Broadcast cursor position to all other clients
        await sio.emit("cursor_update", {
            "username": user,
            "x": payload.x,
            "y": payload.y
        }, skip_sid=sid, namespace="/")

    @sio.event(namespace="/")
    async def user_editing(sid, data):
        try:
            payload = EditingPayload(**data)
            user = user_manager.get_username(sid)
            print(f"[Backend] user_editing: {user} editing {payload.element_id}", flush=True)
            # Broadcast editing status to all other clients (exclude sender to avoid duplicate)
            await sio.emit("editing_update", {
                "username": user,
                "element_id": payload.element_id
            }, skip_sid=sid, namespace="/")
            print(f"[Backend] Broadcasted editing_update to all clients (skip_sid={sid})", flush=True)
        except Exception as e:
            print(f"[Backend] Error in user_editing: {e}", flush=True)
            import traceback
            traceback.print_exc()
