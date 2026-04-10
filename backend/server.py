from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import websockets
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Set
import uuid
from datetime import datetime, timezone
import subprocess
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'auto_platform')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app
app = FastAPI()

# NestJS backend URL - runs on 3001, FastAPI proxies from 8001
NESTJS_URL = "http://localhost:3001"

# Admin panel paths
ADMIN_BUILD_DIR = ROOT_DIR.parent / 'admin' / 'dist'

# NestJS process management
nestjs_process: Optional[subprocess.Popen] = None

async def start_nestjs():
    """Start NestJS backend in background"""
    global nestjs_process
    
    try:
        # Check if already running
        async with httpx.AsyncClient() as http:
            try:
                response = await http.get(f"{NESTJS_URL}/api/services/categories", timeout=2.0)
                if response.status_code < 500:
                    logging.info("NestJS is already running")
                    return True
            except:
                pass
        
        logging.info("Starting NestJS backend...")
        
        # Check if dist exists
        dist_main = ROOT_DIR / 'dist' / 'main.js'
        if not dist_main.exists():
            logging.error(f"NestJS dist not found at {dist_main}")
            return False
        
        # Start NestJS on port 3001
        env = os.environ.copy()
        env['PORT'] = '3001'
        env['MONGO_URL'] = mongo_url
        env['DB_NAME'] = db_name
        env['JWT_ACCESS_SECRET'] = os.environ.get('JWT_ACCESS_SECRET', 'auto_service_jwt_secret_key_2025_very_secure')
        
        nestjs_process = subprocess.Popen(
            ['node', 'dist/main.js'],
            cwd=ROOT_DIR,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        
        # Wait for NestJS to be ready
        for i in range(60):
            await asyncio.sleep(1)
            try:
                async with httpx.AsyncClient() as http:
                    response = await http.get(f"{NESTJS_URL}/api/services/categories", timeout=2.0)
                    if response.status_code < 500:
                        logging.info("NestJS backend started successfully")
                        return True
            except:
                # Check if process is still running
                if nestjs_process.poll() is not None:
                    output = nestjs_process.stdout.read().decode() if nestjs_process.stdout else ""
                    logging.error(f"NestJS crashed: {output}")
                    return False
        
        logging.warning("NestJS startup timeout")
        return False
        
    except Exception as e:
        logging.error(f"Failed to start NestJS: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Start NestJS on FastAPI startup"""
    asyncio.create_task(start_nestjs())

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global nestjs_process
    client.close()
    
    if nestjs_process:
        nestjs_process.terminate()
        try:
            nestjs_process.wait(timeout=5)
        except:
            nestjs_process.kill()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# HTTP client for proxying
http_client = httpx.AsyncClient(timeout=30.0)

# Serve admin panel static files
@app.get("/api/admin-panel")
@app.get("/api/admin-panel/")
async def admin_panel_index():
    """Serve admin panel index.html"""
    index_path = ADMIN_BUILD_DIR / 'index.html'
    if index_path.exists():
        return FileResponse(index_path, media_type='text/html')
    raise HTTPException(status_code=404, detail="Admin panel not built. Run 'npm run build' in /app/admin")

@app.get("/api/admin-panel/{path:path}")
async def admin_panel_static(path: str):
    """Serve admin panel static files"""
    # Try exact path first
    file_path = ADMIN_BUILD_DIR / path
    
    if file_path.exists() and file_path.is_file():
        # Determine content type
        suffix = file_path.suffix.lower()
        media_types = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.ico': 'image/x-icon',
        }
        media_type = media_types.get(suffix, 'application/octet-stream')
        return FileResponse(file_path, media_type=media_type)
    
    # For SPA routing - serve index.html for non-file requests
    index_path = ADMIN_BUILD_DIR / 'index.html'
    if index_path.exists():
        return FileResponse(index_path, media_type='text/html')
    
    raise HTTPException(status_code=404, detail="File not found")

# Proxy all /api/* requests (except admin-panel and realtime) to NestJS
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_nestjs(request: Request, path: str):
    """Proxy all API requests to NestJS backend"""
    
    # Skip admin-panel routes (handled above)
    if path.startswith('admin-panel'):
        raise HTTPException(status_code=404)
    
    # Handle realtime endpoints locally (not proxy to NestJS)
    if path.startswith('realtime/'):
        realtime_path = path[9:]  # Remove 'realtime/' prefix
        
        if realtime_path == 'status':
            return {
                "connected": True,
                "mode": "polling",
                "eventsCount": len(event_store),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        if realtime_path == 'events':
            since = request.query_params.get('since')
            limit = int(request.query_params.get('limit', '20'))
            events = event_store[:limit]
            if since:
                events = [e for e in events if e["timestamp"] > since]
            return {
                "events": events,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "connected": True
            }
        
        if realtime_path == 'emit' and request.method == 'POST':
            event_type = request.query_params.get('event_type', 'test')
            body = await request.body()
            try:
                data = json.loads(body) if body else {}
            except:
                data = {}
            event = add_event(event_type, data)
            return {"success": True, "event": event}
    
    # Build target URL
    target_url = f"{NESTJS_URL}/api/{path}"
    
    # Get query params
    if request.query_params:
        target_url += f"?{request.query_params}"
    
    # Get headers (excluding host)
    headers = dict(request.headers)
    headers.pop('host', None)
    headers.pop('content-length', None)
    
    # Get body
    body = await request.body()
    
    try:
        # Make request to NestJS
        response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )
        
        # Build response headers
        response_headers = dict(response.headers)
        response_headers.pop('content-length', None)
        response_headers.pop('content-encoding', None)
        response_headers.pop('transfer-encoding', None)
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get('content-type', 'application/json'),
        )
        
    except httpx.ConnectError:
        # NestJS not ready yet - try to start it
        asyncio.create_task(start_nestjs())
        raise HTTPException(
            status_code=503,
            detail="Backend is starting up, please try again in a few seconds"
        )
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        raise HTTPException(status_code=502, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    nestjs_healthy = False
    
    try:
        response = await http_client.get(f"{NESTJS_URL}/api/services/categories", timeout=2.0)
        nestjs_healthy = response.status_code < 500
    except:
        pass
    
    return {
        "status": "ok",
        "nestjs": "healthy" if nestjs_healthy else "starting",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ============ REAL-TIME EVENTS STORAGE ============
# In-memory event store for polling-based real-time
event_store: list = []
event_store_max = 100

def add_event(event_type: str, data: dict):
    """Add event to store"""
    global event_store
    event = {
        "id": str(uuid.uuid4()),
        "type": event_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    event_store.insert(0, event)
    event_store = event_store[:event_store_max]
    return event

# Real-time polling endpoint
@app.get("/api/realtime/events")
async def get_realtime_events(since: Optional[str] = None, limit: int = 20):
    """Get recent events for polling-based real-time"""
    events = event_store[:limit]
    
    if since:
        # Filter events after the given timestamp
        events = [e for e in events if e["timestamp"] > since]
    
    return {
        "events": events,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "connected": True
    }

# Connection status endpoint
@app.get("/api/realtime/status")
async def realtime_status():
    """Check real-time connection status"""
    return {
        "connected": True,
        "mode": "polling",
        "eventsCount": len(event_store),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Simulate event endpoint (for testing/demo)
@app.post("/api/realtime/emit")
async def emit_event(event_type: str, data: dict = {}):
    """Emit a test event (admin only)"""
    event = add_event(event_type, data)
    return {"success": True, "event": event}

# WebSocket proxy to NestJS
NESTJS_WS_URL = "ws://localhost:3001/realtime"

# Store active WebSocket connections
active_websockets: Set[WebSocket] = set()

@app.websocket("/realtime")
async def websocket_proxy(websocket: WebSocket):
    """Proxy WebSocket connections to NestJS"""
    await websocket.accept()
    active_websockets.add(websocket)
    
    try:
        # Get token from query params
        token = websocket.query_params.get('token', '')
        
        # Connect to NestJS WebSocket
        async with websockets.connect(
            f"{NESTJS_WS_URL}?token={token}",
            extra_headers={'Authorization': f'Bearer {token}'} if token else {},
        ) as nestjs_ws:
            
            async def forward_to_client():
                """Forward messages from NestJS to client"""
                try:
                    async for message in nestjs_ws:
                        await websocket.send_text(message)
                except Exception as e:
                    logger.debug(f"Forward to client ended: {e}")
            
            async def forward_to_nestjs():
                """Forward messages from client to NestJS"""
                try:
                    while True:
                        data = await websocket.receive_text()
                        await nestjs_ws.send(data)
                except WebSocketDisconnect:
                    pass
                except Exception as e:
                    logger.debug(f"Forward to NestJS ended: {e}")
            
            # Run both directions concurrently
            await asyncio.gather(
                forward_to_client(),
                forward_to_nestjs(),
                return_exceptions=True
            )
                
    except websockets.exceptions.ConnectionClosedError:
        pass
    except Exception as e:
        logger.error(f"WebSocket proxy error: {e}")
    finally:
        active_websockets.discard(websocket)

# Socket.IO fallback endpoint for polling
@app.api_route("/realtime/{path:path}", methods=["GET", "POST"])
async def socketio_fallback(request: Request, path: str):
    """Proxy Socket.IO polling requests to NestJS"""
    target_url = f"{NESTJS_URL}/realtime/{path}"
    
    if request.query_params:
        target_url += f"?{request.query_params}"
    
    headers = dict(request.headers)
    headers.pop('host', None)
    headers.pop('content-length', None)
    
    body = await request.body()
    
    try:
        response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )
        
        response_headers = dict(response.headers)
        response_headers.pop('content-length', None)
        response_headers.pop('content-encoding', None)
        response_headers.pop('transfer-encoding', None)
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get('content-type'),
        )
    except Exception as e:
        logger.error(f"Socket.IO proxy error: {e}")
        raise HTTPException(status_code=502, detail=str(e))

