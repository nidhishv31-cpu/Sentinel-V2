import unittest
import json
from fastapi.testclient import TestClient

from main import app
from engine_live_sniffer import LivePacketSniffer, live_sniffer_engine

class TestEnterpriseForensicsSuite(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_dns_tunneling_detection(self):
        # 1. Normal query
        normal = LivePacketSniffer.detect_dns_tunneling("google.com")
        self.assertFalse(normal["is_tunneling"])

        # 2. dnscat2 / C2 high-entropy hex encoded exfiltration query
        c2_query = "c2-exfil-4a8f3b9c1d0e4a7b2c9e8f1a2b3c4d5e6f7a8b9c.tunnel.threat-actor.xyz"
        c2_result = LivePacketSniffer.detect_dns_tunneling(c2_query)
        self.assertTrue(c2_result["is_tunneling"])
        self.assertEqual(c2_result["mitre"], "T1071.004")
        self.assertGreater(c2_result["entropy"], 3.5)
        print(f"[OK] DNS Tunneling: Normal={normal['is_tunneling']}, C2={c2_result['is_tunneling']} ({c2_result['reason']})")

    def test_02_packet_crafter_and_checksum(self):
        crafted = live_sniffer_engine.craft_and_inject_packet(
            src_ip="10.0.0.99",
            dst_ip="192.168.1.1",
            proto="TCP",
            src_port=55555,
            dst_port=443,
            flags="SYN,ECE",
            payload_text="SENTINEL_INJECT_PAYLOAD"
        )
        self.assertEqual(crafted["status"], "injected")
        self.assertIn("verified", crafted["ipv4_checksum"])
        self.assertIn("verified", crafted["transport_checksum"])
        self.assertEqual(crafted["packet"]["source"], "10.0.0.99:55555")
        print(f"[OK] Packet Crafter: Frame #{crafted['frame_id']} injected with checksums {crafted['ipv4_checksum']}")

    def test_03_stix_21_bundle_generation(self):
        indicators = [
            {"type": "ipv4-addr", "value": "185.220.101.5", "is_threat": True, "description": "Known Tor Exit Node C2"},
            {"type": "domain", "value": "beacon.darkside-ransomware.org", "is_threat": True, "description": "Ransomware C2 Resolver"},
            {"type": "ja3", "value": "7260840c83a54d5d93e789ee9e69c118", "is_threat": True, "description": "Cobalt Strike Malleable C2"},
            {"type": "file-sha256", "value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "is_threat": False}
        ]
        bundle = LivePacketSniffer.generate_stix21_bundle(indicators)
        self.assertEqual(bundle["type"], "bundle")
        self.assertEqual(bundle["spec_version"], "2.1")
        self.assertEqual(len(bundle["objects"]), 4)
        self.assertEqual(bundle["objects"][0]["type"], "indicator")
        self.assertIn("ipv4-addr:value", bundle["objects"][0]["pattern"])
        print(f"[OK] STIX 2.1 Exporter: Validated bundle with {len(bundle['objects'])} indicator objects")

    def test_04_ai_forensic_copilot_and_rules(self):
        malicious_pkt = {
            "id": 104,
            "source": "192.168.1.45:49152",
            "destination": "104.244.42.1:443",
            "protocol": "TLSv1.3",
            "isAnomaly": True,
            "entropy": 7.85
        }
        analysis = LivePacketSniffer.generate_packet_forensic_brief(malicious_pkt)
        self.assertEqual(analysis["threat_level"], "CRITICAL")
        self.assertIn("iptables", analysis["defensive_rules"])
        self.assertIn("DROP", analysis["defensive_rules"]["iptables"])
        self.assertIn("suricata_ids", analysis["defensive_rules"])
        self.assertIn("alert tlsv1.3", analysis["defensive_rules"]["suricata_ids"])
        self.assertEqual(len(analysis["mitre_tactics"]), 2)
        print(f"[OK] AI Copilot: Threat={analysis['threat_level']}, MITRE={analysis['mitre_tactics'][0]['id']}")

    def test_05_sslkeylogfile_ingestion(self):
        keylog = (
            "# SSLKEYLOGFILE - NSS Key Log Format\n"
            "CLIENT_RANDOM 3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcdef01 7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456\n"
            "CLIENT_RANDOM 11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899\n"
        )
        res = live_sniffer_engine.ingest_sslkeylogfile(keylog)
        self.assertEqual(res["status"], "keys_ingested")
        self.assertEqual(res["valid_keys_count"], 2)
        self.assertTrue(res["decryption_ready"])
        print(f"[OK] SSLKEYLOGFILE Ingestion: {res['valid_keys_count']} TLS pre-master secrets loaded")

    def test_06_fastapi_enterprise_endpoints(self):
        # 1. POST /api/live-capture/inject
        res = self.client.post("/api/live-capture/inject", json={
            "src_ip": "10.10.10.5",
            "dst_ip": "10.10.10.1",
            "protocol": "TCP",
            "src_port": 1337,
            "dst_port": 80,
            "flags": "SYN",
            "payload": "GET /test HTTP/1.1\r\n\r\n"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "injected")

        # 2. POST /api/live-capture/detect-dns-tunnel
        res = self.client.post("/api/live-capture/detect-dns-tunnel", json={"query": "long-tunnel-label-4a8f3b.exfil.org"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("is_tunneling", res.json())

        # 3. POST /api/live-capture/upload-keylog
        res = self.client.post("/api/live-capture/upload-keylog", json={
            "keylog_content": "CLIENT_RANDOM 01020304 05060708"
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("valid_keys_count", res.json())

        # 4. GET /api/live-capture/ioc-stix
        res = self.client.get("/api/live-capture/ioc-stix")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["type"], "bundle")

        # 5. POST /api/live-capture/copilot-analyze
        res = self.client.post("/api/live-capture/copilot-analyze", json={
            "packet": {"protocol": "TCP", "source": "1.2.3.4:80", "destination": "5.6.7.8:80", "entropy": 7.5}
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["threat_level"], "CRITICAL")
        print("[OK] All 5 New Enterprise FastAPI REST endpoints verified (200 OK)")

if __name__ == "__main__":
    unittest.main()
