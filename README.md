# BPMN Real-Time Collaboration Tool

A collaborative BPMN (Business Process Model and Notation) diagram editor that enables multiple users to work together on process diagrams simultaneously. Built with React, TypeScript, FastAPI, and Socket.IO for seamless real-time collaboration.

## 📋 Description

This application provides a web-based BPMN diagram editor with real-time collaboration capabilities. Multiple users can join a session, edit diagrams together, see each other's cursors, communicate via chat, and track who is editing which elements. The tool uses WebSocket connections for instant synchronization and provides a responsive, intuitive interface for creating and editing BPMN diagrams.

### Key Highlights

- **Real-Time Collaboration**: Multiple users can edit diagrams simultaneously with live synchronization
- **Visual Feedback**: See other users' cursors and editing indicators in real-time
- **Session Persistence**: User sessions persist across page refreshes
- **Diagram Analysis**: Generate automated summaries of BPMN diagrams
- **Modern UI**: Responsive design that works on desktop and mobile devices
- **Thread-Safe Backend**: Thread-safe state management for concurrent operations

## ✨ Features

### Core Features

1. **Real-Time Diagram Editing**
   - Multiple users can edit the same BPMN diagram simultaneously
   - Changes are synchronized instantly across all connected clients
   - Debounced updates to prevent excessive network traffic

2. **User Presence & Awareness**
   - See all active users in the session
   - Real-time cursor tracking - see where other users are pointing
   - Visual indicators showing which user is editing which element
   - Color-coded user avatars for easy identification

3. **Element Locking & Editing Indicators**
   - Visual markers show when someone is editing a specific element
   - Automatic lock cleanup when users disconnect

4. **Chat System**
   - Real-time chat for team communication
   - Chat history preserved during the session
   - Unread message indicators

5. **Diagram Summary**
   - Generate automated summaries of BPMN diagrams based on element analysis

6. **Diagram Management**
   - Export diagrams as XML files
   - Manual diagram synchronization

7. **Session Management**
   - Persistent user sessions (survives page refresh)
   - State reset when all users disconnect

8. **Responsive Design**
   - Mobile-friendly interface
   - Collapsible sidebars on smaller screens

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

### Step 1: Clone the Repository

```bash
git clone https://github.com/shwetakhatra/BPMN-Real-Time-Collaboration-Tool.git
cd BPMN-Real-Time-Collaboration-Tool
```

### Step 2: Install Backend Dependencies

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 4: Install Root Dependencies (for running both servers)

```bash
cd ..
npm install
```

## 💻 Usage

### Development Mode

#### Option 1: Run Both Servers Together (Recommended)

From the root directory:

```bash
npm run dev
```

This will start both the backend (port 8000) and frontend (port 5173) servers concurrently.

#### Option 2: Run Servers Separately

**Backend Server:**
```bash
cd backend
python -m uvicorn app.main:asgi_app --host 127.0.0.1 --port 8000 --reload
```

**Frontend Server:**
```bash
cd frontend
npm run dev
```

### Accessing the Application

1. Open your browser and navigate to `http://localhost:5173` (or the port shown in the terminal)
2. Enter your username to join the session
3. Start collaborating on BPMN diagrams!

## 🏗️ Architecture

### Frontend

- **Framework**: React 19 with TypeScript
- **State Management**: Zustand for global state
- **BPMN Editor**: bpmn-js library
- **Real-Time Communication**: Socket.IO Client
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

### Backend

- **Framework**: FastAPI
- **WebSocket**: Socket.IO (AsyncServer)
- **State Management**: Thread-safe in-memory storage
- **API**: RESTful endpoints for health checks and diagram summary

## 🔧 Edge Cases Considered

### Connection & Disconnection

1. **Page Refresh**
   - User session persists using localStorage
   - Automatic reconnection on page load
   - State restoration from server

3. **Multiple Tabs**
   - Each tab maintains separate connection
   - User can have multiple sessions (identified by socket ID)
   - Proper cleanup on tab close

4. **Sudden Disconnection**
   - Automatic lock cleanup for disconnected users
   - User removal from active users list
   - State reset when all users disconnect

### Concurrent Editing

1. **Simultaneous Edits**
   - Last-write-wins conflict resolution

2. **Element Locking**
   - Visual indicators prevent editing conflicts

3. **State Synchronization**
   - Initial state sent to new connections

## 📁 Project Structure

```
BPMN-Real-Time-Collaboration-Tool/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── events.py            # Socket.IO event handlers
│   │   ├── models.py            # Pydantic models
│   │   ├── schemas.py           # Data schemas
│   │   ├── utils.py             # Utility functions
│   │   └── services/
│   │       ├── user_manager.py      # User session management
│   │       ├── diagram_state.py     # Thread-safe state storage
│   │       ├── diagram_summary.py   # Diagram analysis and summary generation
│   │       └── log_event.py         # Logging utilities
│   ├── requirements.txt         # Python dependencies
│   └── venv/                   # Virtual environment (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── app.tsx             # Main application component
│   │   ├── index.tsx           # Application entry point
│   │   ├── index.css           # Global styles
│   │   ├── components/         # React components
│   │   ├── lib/                # Library code
│   │   │   ├── bpmn.ts         # BPMN modeler wrapper
│   │   │   └── hooks/          # Custom React hooks
│   │   ├── hooks/              # Reusable hooks
│   │   ├── services/           # Services
│   │   ├── store/              # State management
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   └── constants/          # Constants
│   ├── package.json
│   ├── vite.config.mjs
│   └── tailwind.config.js
│
├── package.json                # Root package.json for running both servers
└── README.md                   
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **bpmn-js** - BPMN diagram editor
- **Socket.IO Client** - Real-time communication
- **Font Awesome** - Icons

### Backend
- **FastAPI** - Modern Python web framework
- **Socket.IO (python-socketio)** - WebSocket server
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Python 3.8+** - Programming language

## 🧪 Testing

### Backend Tests

Backend tests use **pytest** and cover services, API endpoints, and edge cases.

**Run Backend Tests:**
```bash
cd backend
pytest
```

### Frontend Tests

Frontend tests use **Vitest** and **React Testing Library** for component and utility testing.

**Run Frontend Tests:**
```bash
cd frontend
npm test
```

## 🔌 API Endpoints

### REST Endpoints

- `GET /health` - Health check endpoint
- `GET /users` - Get list of online users
- `POST /api/summary` - Generate summary of diagram

### WebSocket Events

#### Client → Server
- `connect` - User connects to session
- `disconnect` - User disconnects
- `update_diagram` - Update diagram XML
- `get_users` - Request user list
- `send_chat` - Send chat message
- `cursor_move` - Update cursor position
- `user_editing` - Indicate element being edited
- `sync_diagram` - Sync diagram to all users

#### Server → Client
- `user_update` - User list updated
- `diagram_update` - Diagram XML updated
- `receive_chat` - New chat message
- `chat_history` - Chat history
- `cursor_update` - Remote cursor position
- `editing_update` - Editing indicator update
- `locks_update` - Element locks updated
- `activity_log` - Activity log entry

---

**Note**: This is a prototype application. Thank you for reviewing this solution. I look forward to your feedback and the opportunity to discuss my solution.

