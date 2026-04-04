from typing import Any

from fastapi import HTTPException, status


class WebRTCSignalService:
    @staticmethod
    def validate_incoming(payload: dict[str, Any]) -> dict[str, Any]:
        kind = payload.get('type')
        if kind not in {'offer', 'ice_candidate'}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Invalid signaling message type')
        return payload

    @staticmethod
    def make_answer(offer_sdp: str) -> dict[str, Any]:
        return {'type': 'answer', 'sdp': offer_sdp}


webrtc_signal_service = WebRTCSignalService()
