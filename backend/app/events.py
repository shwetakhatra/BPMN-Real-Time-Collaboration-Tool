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
            current_xml = diagram_state.xml
            if current_xml:
                await sio.emit("diagram_update", {"xml": current_xml}, to=sid, namespace="/")
            
            # Send current locks to new connection
            current_locks = diagram_state.locks
            if current_locks:
                await sio.emit("locks_update", current_locks, to=sid, namespace="/")
            
            # Send existing chat messages to new connection
            current_chat = diagram_state.chat
            if current_chat:
                await sio.emit("chat_history", current_chat, to=sid, namespace="/")
            
            # Send existing activity logs to new connection
            current_logs = diagram_state.logs
            if current_logs:
                await sio.emit("activity_log", current_logs, to=sid, namespace="/")
            
            await log_and_broadcast(sio, f"{username} connected")
        except Exception as e:
            print(f"Connection error: {e}", flush=True)
            import traceback
            traceback.print_exc()

    @sio.event(namespace="/")
    async def disconnect(sid):
        username = user_manager.remove_user(sid)
        
        # Unlock all elements locked by this user
        elements_to_unlock = diagram_state.clear_locks_by_user(username)
        
        # Broadcast updated locks if any were removed
        if elements_to_unlock:
            await sio.emit("locks_update", diagram_state.locks, namespace="/")
        
        all_users = list(user_manager.online_users.values())
        users = list(dict.fromkeys(all_users))
        await sio.emit("user_update", users, namespace="/")
        await log_and_broadcast(sio, f"{username} disconnected")
        
        # Reset diagram state when all users leave
        if len(user_manager.online_users) == 0:
            diagram_state.reset()
            await log_and_broadcast(sio, "Diagram reset - all users disconnected")

    @sio.event(namespace="/")
    async def update_diagram(sid, data):
        try:
            payload = DiagramUpdatePayload(**data)
            user = user_manager.get_username(sid)
            
            # Update the diagram state in shared memory
            diagram_state.xml = payload.xml
            diagram_state.save_version()
            
            # Broadcast to all other clients (excluding the sender)
            current_xml = diagram_state.xml
            await sio.emit("diagram_update", {"xml": current_xml}, skip_sid=sid, namespace="/")
            await log_and_broadcast(sio, f"{user} updated diagram", skip_sid=sid)
        except Exception as e:
            print(f"Error in update_diagram: {e}", flush=True)
            import traceback
            traceback.print_exc()

    @sio.event(namespace="/")
    async def lock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        diagram_state.lock_element(payload.element_id, user)
        # Broadcast to all clients (excluding sender)
        await sio.emit("element_locked", {"element_id": payload.element_id, "locked_by": user}, skip_sid=sid, namespace="/")
        await sio.emit("locks_update", diagram_state.locks, skip_sid=sid, namespace="/")

    @sio.event(namespace="/")
    async def unlock_element(sid, data):
        payload = LockPayload(**data)
        user = user_manager.get_username(sid)
        diagram_state.unlock_element(payload.element_id)
        # Broadcast to all clients (excluding sender)
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
        all_users = list(user_manager.online_users.values())
        users = list(dict.fromkeys(all_users))
        await sio.emit("user_update", users, to=sid, namespace="/")

    @sio.event(namespace="/")
    async def sync_diagram(sid):
        """Sync diagram state for all users"""
        current_xml = diagram_state.xml
        if current_xml:
            # Broadcast current diagram to all users
            await sio.emit("diagram_update", {"xml": current_xml}, namespace="/")
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
