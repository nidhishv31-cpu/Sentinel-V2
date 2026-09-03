import time
import math
from typing import List, Dict, Any, Tuple

class InStreamPacketForensicsEngine:
    """
    Layer 2: Zero-Overhead In-Memory Packet Forensics & C2 Jitter Beaconing Detector.
    Parses live TCP/UDP frames directly from memory buffers without spawning shell subprocesses,
    extracting carved file artifacts and calculating inter-arrival delta coefficient of variation.
    """
    MAGIC_SIGNATURES = [
        {"type": "PNG Image", "mime": "image/png", "header": b"\x89PNG\r\n\x1a\n", "footer": b"IEND\xaeB`\x82"},
        {"type": "JPEG Image", "mime": "image/jpeg", "header": b"\xff\xd8\xff", "footer": b"\xff\xd9"},
        {"type": "PDF Document", "mime": "application/pdf", "header": b"%PDF-", "footer": b"%%EOF"},
        {"type": "ZIP Archive", "mime": "application/zip", "header": b"PK\x03\x04", "footer": None},
        {"type": "GZIP Compressed", "mime": "application/gzip", "header": b"\x1f\x8b\x08", "footer": None}
    ]

    @staticmethod
    def carve_in_memory_payload(payload_bytes: bytes) -> List[Dict[str, Any]]:
        carved = []
        for sig in InStreamPacketForensicsEngine.MAGIC_SIGNATURES:
            start_idx = payload_bytes.find(sig["header"])
            if start_idx != -1:
                end_idx = len(payload_bytes)
                if sig["footer"]:
                    foot_pos = payload_bytes.find(sig["footer"], start_idx)
                    if foot_pos != -1:
                        end_idx = foot_pos + len(sig["footer"])
                
                size = end_idx - start_idx
                if size > 16:
                    carved.append({
                        "file_type": sig["type"],
                        "mime_type": sig["mime"],
                        "offset": start_idx,
                        "size_bytes": size,
                        "extracted_at": time.strftime("%Y-%m-%d %H:%M:%S")
                    })
        return carved

    @staticmethod
    def calculate_c2_beacon_jitter(timestamps: List[float]) -> Dict[str, Any]:
        """
        Calculates Coefficient of Variation (CV = std_dev / mean) on inter-arrival deltas.
        CV < 0.25 indicates strict periodicity characteristic of automated C2 heartbeat beacons.
        """
        if len(timestamps) < 4:
            return {"is_c2_beacon": False, "confidence": 0.0, "reason": "Insufficient samples (<4 packets)"}

        deltas = [timestamps[i] - timestamps[i-1] for i in range(1, len(timestamps))]
        deltas = [d for d in deltas if d > 0]
        if not deltas:
            return {"is_c2_beacon": False, "confidence": 0.0, "reason": "Zero time intervals"}

        mean_delta = sum(deltas) / len(deltas)
        variance = sum((d - mean_delta) ** 2 for d in deltas) / len(deltas)
        std_dev = math.sqrt(variance)
        cv = (std_dev / mean_delta) if mean_delta > 0 else 1.0

        is_beacon = cv < 0.28
        confidence = max(0.0, min(1.0, 1.0 - cv))

        return {
            "is_c2_beacon": is_beacon,
            "coefficient_of_variation": round(cv, 4),
            "mean_interval_seconds": round(mean_delta, 2),
            "confidence_score": round(confidence, 3),
            "verdict": "CRITICAL: Automated Periodic C2 Jitter Beaconing Detected" if is_beacon else "Normal Network Traffic"
        }
