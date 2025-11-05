from app.services.diagram_state import diagram_state

async def log_event(message: str):
    entry = diagram_state.add_log(message)
    return entry
