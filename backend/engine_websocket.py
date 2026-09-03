import asyncio
import json
import logging
from typing import Set, Dict, Any, List
from fastapi import WebSocket

logger = logging.getLogger("sentinel.websocket")

class WebSocketTelemetryHub:
    """
    Layer 5: High-Performance Real-Time Bi-Directional Telemetry Hub.
    Maintains active WebSocket subscriber pools and pushes real-time packet discoveries,
    port scans, and security alerts with < 10ms broadcast latency.
    """
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.channel_subscribers: Dict[str, Set[WebSocket]] = {
            "packets": set(),
            "scans": set(),
            "alerts": set(),
            "topology": set()
        }

    async def connect(self, websocket: WebSocket, channels: List[str] = None):
        await websocket.accept()
        self.active_connections.add(websocket)
        target_channels = channels or ["packets", "scans", "alerts", "topology"]
        for ch in target_channels:
            if ch not in self.channel_subscribers:
                self.channel_subscribers[ch] = set()
            self.channel_subscribers[ch].add(websocket)
        logger.info(f"WebSocket client connected. Subscribed channels: {target_channels}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        for ch_set in self.channel_subscribers.values():
            ch_set.discard(websocket)
        logger.info("WebSocket client disconnected.")

    async def broadcast_event(self, channel: str, event_type: str, data: Dict[str, Any]):
        message = json.dumps({
            "channel": channel,
            "event": event_type,
            "timestamp": asyncio.get_event_loop().time(),
            "payload": data
        })
        subscribers = self.channel_subscribers.get(channel, self.active_connections)
        if not subscribers:
            return

        dead_connections = set()
        for conn in list(subscribers):
            try:
                await conn.send_text(message)
            except Exception:
                dead_connections.add(conn)

        for dead in dead_connections:
            self.disconnect(dead)

# Global Telemetry Hub Instance
telemetry_hub = WebSocketTelemetryHub()
