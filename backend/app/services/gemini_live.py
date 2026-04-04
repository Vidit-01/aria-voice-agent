import asyncio
from typing import Any


class GeminiLiveRelay:
    async def relay(self, inbound: dict[str, Any]) -> list[dict[str, Any]]:
        event_type = inbound.get('type')
        if event_type == 'audio_chunk':
            return [{'type': 'audio_response', 'data': inbound.get('data'), 'timestamp_ms': inbound.get('timestamp_ms', 0)}]
        if event_type == 'video_frame':
            return []
        return [{'type': 'error', 'code': 'UNSUPPORTED_EVENT', 'message': f'Unsupported event: {event_type}'}]

    async def close(self) -> None:
        await asyncio.sleep(0)


gemini_live_relay = GeminiLiveRelay()
