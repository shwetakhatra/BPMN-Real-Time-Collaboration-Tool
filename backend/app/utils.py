from app.services.log_event import log_event

async def broadcast_event(sio, event: str, payload: dict, skip_sid=None, namespace="/"):
    await sio.emit(event, payload, skip_sid=skip_sid, namespace=namespace)

async def log_and_broadcast(sio, message: str, event=None, payload=None, skip_sid=None):
    entry = await log_event(message)
    # Broadcast new activity log to all clients
    from socketio import AsyncServer
    if isinstance(sio, AsyncServer):
        await sio.emit("activity_log_update", entry, skip_sid=skip_sid, namespace="/")
    if event and payload:
        await broadcast_event(sio, event, payload, skip_sid)
