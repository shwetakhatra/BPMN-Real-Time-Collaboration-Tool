from pydantic import BaseModel

class DiagramUpdatePayload(BaseModel):
    xml: str

class LockPayload(BaseModel):
    element_id: str

class ChatMessagePayload(BaseModel):
    message: str
