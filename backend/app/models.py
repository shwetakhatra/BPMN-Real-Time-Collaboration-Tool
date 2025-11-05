from pydantic import BaseModel

class DiagramUpdatePayload(BaseModel):
    xml: str

class LockPayload(BaseModel):
    element_id: str

class ChatMessagePayload(BaseModel):
    message: str

class CursorPositionPayload(BaseModel):
    x: float
    y: float

class EditingPayload(BaseModel):
    element_id: str | None = None