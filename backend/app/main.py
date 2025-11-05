from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
from app.services.user_manager import user_manager
from app.services.diagram_summary import analyze_bpmn_diagram
from app.events import register_events

# Socket.IO & FastAPI setup
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = FastAPI(title="BPMN Realtime Collaboration API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        print(f"Error in get_diagram_summary: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return {"summary": f"Error generating summary: {str(e)}", "error": True}

# Register all Socket.IO events
register_events(sio)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:asgi_app", host="127.0.0.1", port=8000, reload=True)
