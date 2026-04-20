#!/usr/bin/env python3
"""Ollama 요청/응답 로깅 프록시 — 프론트엔드와 Ollama 사이에서 실행"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error
from datetime import datetime

OLLAMA_URL  = "http://localhost:11434"
PROXY_PORT  = 11435

CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
GRAY   = "\033[90m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


class ProxyHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # 기본 로그 억제

    def do_GET(self):     self._proxy()
    def do_POST(self):    self._proxy()
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _proxy(self):
        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length) if length else b""

        if self.path == "/api/chat" and body:
            try:
                req_data  = json.loads(body)
                model     = req_data.get("model", "?")
                messages  = req_data.get("messages", [])
                user_msgs = [m for m in messages if m["role"] == "user"]
                last_user = user_msgs[-1]["content"] if user_msgs else ""
                ts = datetime.now().strftime("%H:%M:%S")
                print(f"\n{BOLD}{CYAN}━━━ 요청 [{ts}]  모델: {model} ━━━{RESET}")
                print(f"{YELLOW}[USER 마지막 메시지]{RESET}")
                print(last_user[:600] + ("..." if len(last_user) > 600 else ""))
            except Exception:
                pass

        req = urllib.request.Request(
            OLLAMA_URL + self.path,
            data=body or None,
            method=self.command,
            headers={"Content-Type": "application/json"} if body else {},
        )

        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                resp_body = resp.read()

                if self.path == "/api/chat" and resp_body:
                    try:
                        resp_data = json.loads(resp_body)
                        content   = resp_data.get("message", {}).get("content", "")
                        ts = datetime.now().strftime("%H:%M:%S")
                        print(f"\n{BOLD}{GREEN}━━━ 응답 [{ts}] ━━━{RESET}")
                        try:
                            parsed = json.loads(content)
                            print(json.dumps(parsed, ensure_ascii=False, indent=2))
                        except Exception:
                            print(content[:1000])
                        print(f"{GRAY}{'─'*50}{RESET}")
                    except Exception:
                        pass

                self.send_response(resp.status)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(resp_body)

        except urllib.error.URLError as e:
            print(f"{RED}Ollama 연결 실패: {e}{RESET}")
            self.send_response(502)
            self.end_headers()
            self.wfile.write(b'{"error":"proxy failed"}')


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PROXY_PORT), ProxyHandler)
    print(f"{BOLD}{CYAN}Ollama 프록시 시작  포트 {PROXY_PORT} → Ollama {OLLAMA_URL}{RESET}")
    print(f"{GRAY}프론트엔드 요청/응답이 여기 출력됩니다. Ctrl+C로 종료.{RESET}\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}프록시 종료{RESET}")
