"""
Script de migración — ejecuta archivos SQL contra Supabase.

USO:
    # Desde backend/, con venv activado:
    python migrate.py 001   # corre 001_initial_schema.sql
    python migrate.py 002   # corre 002_add_users_auth.sql

NOTA:
    Usa la SUPABASE_KEY del .env (anon key). Si el SQL incluye DDL
    (CREATE TABLE, ALTER TABLE), necesitás la service_role key en su lugar.
    Actualizá SUPABASE_KEY temporalmente con la service_role key para migraciones.
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("ERROR: SUPABASE_URL o SUPABASE_KEY no están en el .env")
    sys.exit(1)

client = create_client(url, key)

# Determinar qué migración correr
migration_num = sys.argv[1] if len(sys.argv) > 1 else "002"

migration_files = {
    "001": "supabase/001_initial_schema.sql",
    "002": "supabase/002_add_users_auth.sql",
    "003": "supabase/003_evaluacion_detallada.sql",
    "004": "supabase/004_user_api_key.sql",
    "005": "supabase/005_add_user_alias.sql",
}

if migration_num not in migration_files:
    print(f"ERROR: Migración '{migration_num}' no encontrada. Opciones: {list(migration_files.keys())}")
    sys.exit(1)

filepath = migration_files[migration_num]

# Leer el SQL con encoding UTF-8 (necesario por los acentos en español)
try:
    with open(filepath, encoding="utf-8") as f:
        sql = f.read()
except FileNotFoundError:
    print(f"ERROR: No se encontró el archivo {filepath}")
    sys.exit(1)

print(f"Ejecutando migración: {filepath}")

# Ejecutar via RPC de Supabase
try:
    result = client.rpc("exec_sql", {"query": sql}).execute()
    print("✓ Migración ejecutada correctamente")
except Exception as e:
    print(f"ERROR ejecutando migración: {e}")
    print("\nAlternativa: pegá el SQL directamente en Supabase → SQL Editor → Run")
    sys.exit(1)
