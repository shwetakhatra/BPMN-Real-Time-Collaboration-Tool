from app.services.log_event import log_event

async def broadcast_event(sio, event: str, payload: dict, skip_sid=None):
    await sio.emit(event, payload, skip_sid=skip_sid)

async def log_and_broadcast(sio, message: str, event=None, payload=None, skip_sid=None):
    await log_event(message)
    if event and payload:
        await broadcast_event(sio, event, payload, skip_sid)
