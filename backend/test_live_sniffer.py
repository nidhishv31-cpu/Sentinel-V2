import os
import sys
import unittest
from fastapi.testclient import TestClient

from main import app
from engine_live_sniffer import LivePacketSniffer, live_sniffer_engine

class TestLiveSnifferAndForensics(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_interface_enumeration(self):
        interfaces = LivePacketSniffer.list_interfaces()
        self.assertIsInstance(interfaces, list)
        self.assertGreater(len(interfaces), 0)
        self.assertIn("name", interfaces[0])
        self.assertIn("ipv4", interfaces[0])
        print(f"[OK] Interfaces discovered: {len(interfaces)} interfaces")

    def test_02_shannon_entropy_calculation(self):
        # Plain text
        plain_entropy = LivePacketSniffer.calculate_shannon_entropy(b"GET /api/v1/telemetry HTTP/1.1\r\nHost: example.com\r\n\r\n")
        # Uniform pseudo-random bytes (high entropy)
        high_entropy_bytes = bytes([i % 256 for i in range(256)])
        high_entropy = LivePacketSniffer.calculate_shannon_entropy(high_entropy_bytes)
        # Low entropy (repeated byte)
        zero_entropy = LivePacketSniffer.calculate_shannon_entropy(b"AAAAAAAAAAAAAAAAAAAAAAAAAAAA")

        self.assertLess(plain_entropy, 5.0)
        self.assertGreater(high_entropy, 7.8)
        self.assertEqual(zero_entropy, 0.0)
        print(f"[OK] Shannon Entropy: Plain={plain_entropy} bits/B | High={high_entropy} bits/B | Zero={zero_entropy}")

    def test_03_ja3_fingerprinting(self):
        # Known Cobalt Strike parameters
        ciphers = [49195, 49199, 49196, 49200, 52393, 52392]
        extensions = [0, 23, 65281, 10, 11, 35, 16, 5, 13]
        curves = [29, 23, 24]
        point_formats = [0]
        
        ja3_res = LivePacketSniffer.compute_ja3_fingerprint(ciphers, extensions, curves, point_formats, 771)
        self.assertIn("ja3_hash", ja3_res)
        self.assertIn("ja4_hash", ja3_res)
        self.assertIn("threat_attribution", ja3_res)
        print(f"[OK] JA3 Hash: {ja3_res['ja3_hash']} | JA4: {ja3_res['ja4_hash']} -> Attribution: {ja3_res['threat_attribution']['tool']}")

    def test_04_yara_heuristic_artifact_inspection(self):
        # 1. Clean PNG image
        png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 40
        clean_res = LivePacketSniffer.inspect_carved_artifact("logo.png", "PNG Image", png_bytes)
        self.assertEqual(clean_res["severity"], "CLEAN")

        # 2. Malicious Windows PE Executable
        pe_bytes = b"MZ\x90\x00\x03\x00\x00\x00PE\x00\x00" + b"\x90" * 100
        pe_res = LivePacketSniffer.inspect_carved_artifact("payload.exe", "PE Binary", pe_bytes)
        self.assertEqual(pe_res["severity"], "MALICIOUS")
        self.assertIn("Executable Windows PE Binary", pe_res["heuristic_flags"][0])

        # 3. Suspicious PDF with embedded JavaScript
        pdf_bytes = b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /JavaScript 3 0 R >>\nendobj"
        pdf_res = LivePacketSniffer.inspect_carved_artifact("invoice.pdf", "PDF Document", pdf_bytes)
        self.assertEqual(pdf_res["severity"], "SUSPICIOUS")
        self.assertIn("Embedded JavaScript", pdf_res["heuristic_flags"][0])
        print(f"[OK] YARA Heuristics: PNG={clean_res['severity']}, PE={pe_res['severity']}, PDF={pdf_res['severity']}")

    def test_05_stream_reassembly(self):
        stream_id = live_sniffer_engine.record_packet_for_stream(
            "192.168.1.45:51234", "104.244.42.1:80", "HTTP", "GET /login HTTP/1.1\r\nHost: target\r\n\r\n", is_client=True
        )
        live_sniffer_engine.record_packet_for_stream(
            "104.244.42.1:80", "192.168.1.45:51234", "HTTP", "HTTP/1.1 200 OK\r\nServer: Sentinel\r\n\r\n", is_client=False
        )
        stream_data = live_sniffer_engine.get_stream_conversation(stream_id)
        self.assertIsNotNone(stream_data)
        self.assertEqual(len(stream_data["dialogue"]), 2)
        self.assertEqual(stream_data["dialogue"][0]["direction"], "client_to_server")
        self.assertEqual(stream_data["dialogue"][1]["direction"], "server_to_client")
        print(f"[OK] Stream Reassembly: Stream #{stream_id} with {len(stream_data['dialogue'])} dialogue turns")

    def test_06_fastapi_rest_endpoints(self):
        # 1. GET /api/live-capture/interfaces
        res = self.client.get("/api/live-capture/interfaces")
        self.assertEqual(res.status_code, 200)
        self.assertIn("interfaces", res.json())

        # 2. POST /api/live-capture/start
        res = self.client.post("/api/live-capture/start", json={"interface": "Ethernet0", "bpf_filter": "tcp port 443"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "capturing")

        # 3. POST /api/live-capture/stop
        res = self.client.post("/api/live-capture/stop")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "stopped")

        # 4. POST /api/live-capture/inspect-carved
        res = self.client.post("/api/live-capture/inspect-carved", json={
            "filename": "suspicious.pdf",
            "file_type": "PDF Document",
            "hex_data": "255044462d312e370a2f4a617661536372697074"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["severity"], "SUSPICIOUS")
        print("[OK] All Live Capture FastAPI REST endpoints verified (200 OK)")

if __name__ == "__main__":
    unittest.main()
