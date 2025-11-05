import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
from app.services.user_manager import user_manager
from app.services.diagram_summary import analyze_bpmn_diagram
from app.events import register_events

# CORS origins - allow environment variable or default to wildcard for development
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",") if os.getenv("CORS_ORIGINS") else ["*"]

# Socket.IO & FastAPI setup
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=cors_origins)
app = FastAPI(title="BPMN Realtime Collaboration API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

asgi_app = socketio.ASGIApp(sio, app)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "users_online": len(user_manager.list_users())}

# Users list endpoint (fallback/diagnostics)
@app.get("/users")
async def list_users():
    return {"users": user_manager.list_users()}

# AI Summary endpoint
class DiagramSummaryRequest(BaseModel):
    xml: str

@app.post("/api/summary")
async def get_diagram_summary(request: DiagramSummaryRequest):
    """Generate a summary of the BPMN diagram"""
    try:
        analysis = analyze_bpmn_diagram(request.xml)
        return analysis
    except Exception as e:
        return {"summary": f"Error generating summary: {str(e)}", "error": True}

# Register all Socket.IO events
register_events(sio)

if __name__ == "__main__":
    import os
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:asgi_app", host=host, port=port, reload=os.getenv("ENV") != "production")
