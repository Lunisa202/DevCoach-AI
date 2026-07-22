"""Manual test for Code_Reviewer agent.

Run from backend/: python scripts/try_code_reviewer.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _setup  # noqa: F401 - sets sys.path and loads .env

import asyncio
import json

from app.ai.providers.base import get_provider
from app.ai.agents.code_reviewer import analyze_code


SAMPLE_FILES = {
    "utils.py": """
def calc(x, y, op):
    if op == "+":
        return x + y
    if op == "-":
        return x - y
    if op == "*":
        return x * y
    if op == "/":
        return x / y

def read_file(path):
    f = open(path)
    data = f.read()
    return data
""",
    "user_service.py": """
users = []

def add_user(name, email, age):
    users.append({"name": name, "email": email, "age": age})
    print("User added:", name)

def get_user(email):
    for u in users:
        if u["email"] == email:
            return u
    return None
""",
}


async def main():
    provider = get_provider()
    print(f"Provider: {type(provider).__name__}")
    print("Analyzing sample code...\n")

    result = await analyze_code(provider, SAMPLE_FILES)

    print("=" * 60)
    print("FORTALEZAS:")
    for f in result.fortalezas:
        print(f"  - {f}")
    print()
    print("DEBILIDADES:")
    for d in result.debilidades:
        print(f"  - {d}")
    print("=" * 60)
    print("\nFull JSON:")
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
