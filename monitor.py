#!/usr/bin/env python3

import subprocess
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from datetime import datetime
import time
import requests


SITE_URL = "https://codexium.it/"
EXPECT_STATUS = 200
CHECK_TIMEOUT = 10

COMPOSE_PATH = "/home/codexium/codexium/docker-compose.yml"

LOG_FILE = "/var/log/codexium_monitor.log"

# === TELEGRAM ===
TELEGRAM_TOKEN = "7678873173:AAFW9AEzzUALRUxkC_eq7mFWVBYXrjw3JfQ"
CHAT_ID = "5087859058"
# ===================================
  

def send_telegram(msg):
    """Sending a notification to Telegram"""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": msg,
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, data=payload, timeout=5)
    except Exception:
        pass


def log(msg, send_tg=False):
    t = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"{t} - {msg}"
    print(line)

    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except:
        pass

    if send_tg:
        send_telegram(line)


def check_site():
    try:
        req = Request(SITE_URL, headers={"User-Agent": "CodexiumMonitor"})
        with urlopen(req, timeout=CHECK_TIMEOUT) as r:
            return True, r.status
    except HTTPError as e:
        return False, e.code
    except URLError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)


def run_command(cmd):
    try:
        result = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 255, "", str(e)


def main():
    ok, status = check_site()

    if ok and status == EXPECT_STATUS:
        log(f"OK: the site is available (HTTP {status})")
        return 0

    # === Сайт упал ===
    log(f"ERROR: The site is NOT working (result={status}).", send_tg=True)
    log("Restarting containers...", send_tg=True)

    down_cmd = ["docker", "compose", "-f", COMPOSE_PATH, "down"]
    up_cmd   = ["docker", "compose", "-f", COMPOSE_PATH, "up", "-d"]

    code1, out1, err1 = run_command(down_cmd)
    log(f"docker compose down → code={code1}, err={err1}", send_tg=True)

    time.sleep(3)

    code2, out2, err2 = run_command(up_cmd)
    log(f"docker compose up -d → code={code2}, err={err2}", send_tg=True)

    # Ждём перезапуска контейнеров
    time.sleep(10)

    ok2, status2 = check_site()
    if ok2 and status2 == EXPECT_STATUS:
        log("RECOVERED: The site has been restored after the restart.", send_tg=True)
    else:
        log(f"STILL DOWN: The site is still unavailable (result={status2})", send_tg=True)

    return 0
  

if __name__ == "__main__":
    sys.exit(main())
