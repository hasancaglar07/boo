#!/usr/bin/env bash
set -euo pipefail

SETTINGS_PATH="/app/dashboard_settings.json"
LOG_PATH="/app/dashboard.log"

mkdir -p /app/book_outputs /app/multi_provider_logs /app/dashboard
touch "$LOG_PATH"

python3 - <<'PY'
import json
import os
from pathlib import Path

settings_path = Path("/app/dashboard_settings.json")

defaults = {
    "CODEFAST_API_KEY": "",
    "GEMINI_API_KEY": "",
    "OPENAI_API_KEY": "",
    "GROQ_API_KEY": "",
    "default_author": "Ihsan",
    "default_publisher": "Speedy Quick Publishing",
    "ollama_enabled": True,
    "ollama_base_url": "http://localhost:11434",
    "ollama_model": "llama3.2:1b",
    "cover_service": "auto",
    "cover_username": "",
    "cover_password": "",
}

truthy = {"1", "true", "yes", "on"}
falsy = {"0", "false", "no", "off"}

settings = defaults.copy()
if settings_path.exists():
    try:
        settings.update(json.loads(settings_path.read_text(encoding="utf-8")))
    except Exception:
        pass

env_map = {
    "CODEFAST_API_KEY": os.getenv("CODEFAST_API_KEY"),
    "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),
    "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
    "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
    "default_author": os.getenv("DEFAULT_AUTHOR"),
    "default_publisher": os.getenv("DEFAULT_PUBLISHER"),
    "ollama_base_url": os.getenv("OLLAMA_BASE_URL"),
    "ollama_model": os.getenv("OLLAMA_MODEL"),
    "cover_service": os.getenv("COVER_SERVICE"),
    "cover_username": os.getenv("COVER_USERNAME"),
    "cover_password": os.getenv("COVER_PASSWORD"),
}

for key, value in env_map.items():
    if value not in (None, ""):
        settings[key] = value

ollama_disabled = (os.getenv("OLLAMA_DISABLED") or "").strip().lower()
ollama_enabled = (os.getenv("OLLAMA_ENABLED") or "").strip().lower()
if ollama_disabled in truthy:
    settings["ollama_enabled"] = False
elif ollama_enabled in truthy:
    settings["ollama_enabled"] = True
elif ollama_enabled in falsy:
    settings["ollama_enabled"] = False

settings_path.write_text(
    json.dumps(settings, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
PY

exec python3 /app/dashboard_server.py
