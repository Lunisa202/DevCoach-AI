"""Helper to bootstrap sys.path and .env for standalone scripts."""

import sys
from pathlib import Path

# Add backend/ to sys.path so `app.*` imports work
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load .env from backend/
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")
