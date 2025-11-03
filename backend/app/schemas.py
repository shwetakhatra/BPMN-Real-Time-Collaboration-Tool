from pydantic import BaseModel

class DiagramUpdate(BaseModel):
    xml: str

class ElementLock(BaseModel):
    element_id: str

class UsernamePayload(BaseModel):
    username: str
