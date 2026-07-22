# Guía de Pruebas — GitHub Service (Tarea 3.1)

## Archivo: `backend/app/services/github_service.py`

---

## Pre-requisitos para probar

```bash
cd backend

# 1. Activar entorno virtual
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

# 2. Instalar dependencias (si no lo has hecho)
pip install -r requirements.txt

# 3. (Opcional) Configurar token en .env para evitar rate limit
# Sin token: 60 peticiones/hora
# Con token: 5000 peticiones/hora
# El token NO necesita ningún permiso — es solo para subir el rate limit
```

---

## Script de prueba completo

Crea un archivo `test_github_service.py` en `backend/` y correlo con `python test_github_service.py`:

```python
"""Script para probar todos los métodos del GitHubService."""
import asyncio
from app.services.github_service import (
    GitHubService,
    RepoNotFoundError,
    GitHubTimeoutError,
    RateLimitExceededError,
)


async def test_all():
    # Cambia esto si quieres usar tu token (mejora el rate limit)
    TOKEN = ""  # o "ghp_tu_token_aqui"
    
    github = GitHubService(token=TOKEN)
    
    print("=" * 60)
    print("PRUEBAS DE ÉXITO (happy path)")
    print("=" * 60)
    
    # --- TEST 1: validate_repo con repo público ---
    print("\n[TEST 1] validate_repo — repo público existente")
    try:
        result = await github.validate_repo("Lunisa202", "DevCoach-AI")
        print(f"  ✅ Resultado: {result}")
        assert result is True, "Debería retornar True"
    except Exception as e:
        print(f"  ❌ FALLÓ: {e}")

    # --- TEST 2: get_default_branch ---
    print("\n[TEST 2] get_default_branch")
    try:
        branch = await github.get_default_branch("Lunisa202", "DevCoach-AI")
        print(f"  ✅ Rama por defecto: '{branch}'")
        assert isinstance(branch, str) and len(branch) > 0
    except Exception as e:
        print(f"  ❌ FALLÓ: {e}")

    # --- TEST 3: get_tree ---
    print("\n[TEST 3] get_tree — lista de archivos")
    try:
        tree = await github.get_tree("Lunisa202", "DevCoach-AI")
        print(f"  ✅ Archivos encontrados: {len(tree)}")
        for f in tree[:5]:
            print(f"     - {f['path']} ({f['size']} bytes)")
        assert isinstance(tree, list)
        assert len(tree) > 0, "El repo debería tener al menos un archivo"
        # Cada item debe tener 'path', 'size', 'type'
        assert "path" in tree[0]
        assert "size" in tree[0]
    except Exception as e:
        print(f"  ❌ FALLÓ: {e}")

    # --- TEST 4: get_file_content ---
    print("\n[TEST 4] get_file_content — leer README.md")
    try:
        content = await github.get_file_content("Lunisa202", "DevCoach-AI", "README.md")
        print(f"  ✅ Contenido ({len(content)} chars): '{content[:50]}...'")
        assert isinstance(content, str)
        assert len(content) > 0, "El README no debería estar vacío"
    except Exception as e:
        print(f"  ❌ FALLÓ: {e}")

    # --- TEST 5: get_last_commit ---
    print("\n[TEST 5] get_last_commit — último commit con diff")
    try:
        commit = await github.get_last_commit("Lunisa202", "DevCoach-AI")
        print(f"  ✅ SHA: {commit['sha'][:10]}...")
        print(f"     Mensaje: {commit['message'][:60]}")
        print(f"     Archivos cambiados: {len(commit['files'])}")
        assert "sha" in commit
        assert "message" in commit
        assert "files" in commit
        assert isinstance(commit["files"], list)
    except Exception as e:
        print(f"  ❌ FALLÓ: {e}")

    print("\n")
    print("=" * 60)
    print("PRUEBAS DE ERROR (casos de fallo esperados)")
    print("=" * 60)

    # --- TEST 6: repo que no existe ---
    print("\n[TEST 6] validate_repo — repo inexistente")
    try:
        await github.validate_repo("Lunisa202", "este-repo-no-existe-xyz123")
        print("  ❌ FALLÓ: debería haber lanzado RepoNotFoundError")
    except RepoNotFoundError as e:
        print(f"  ✅ Error esperado: {e}")
    except Exception as e:
        print(f"  ⚠️  Error inesperado: {type(e).__name__}: {e}")

    # --- TEST 7: archivo que no existe ---
    print("\n[TEST 7] get_file_content — archivo inexistente")
    try:
        await github.get_file_content("Lunisa202", "DevCoach-AI", "no_existe.xyz")
        print("  ❌ FALLÓ: debería haber lanzado RepoNotFoundError")
    except RepoNotFoundError as e:
        print(f"  ✅ Error esperado: {e}")
    except Exception as e:
        print(f"  ⚠️  Error inesperado: {type(e).__name__}: {e}")

    # --- TEST 8: owner que no existe ---
    print("\n[TEST 8] validate_repo — usuario inexistente")
    try:
        await github.validate_repo("usuario-que-no-existe-abc999", "repo")
        print("  ❌ FALLÓ: debería haber lanzado RepoNotFoundError")
    except RepoNotFoundError as e:
        print(f"  ✅ Error esperado: {e}")
    except Exception as e:
        print(f"  ⚠️  Error inesperado: {type(e).__name__}: {e}")

    print("\n")
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print("Si ves todos ✅ arriba, el servicio funciona correctamente.")
    print("Si ves ❌ en los tests de éxito, algo está mal.")
    print("Si ves ❌ en los tests de error, el manejo de errores tiene un bug.")
    print("\nNOTA: Si ves RateLimitExceededError en TODOS los tests,")
    print("significa que se agotaron las 60 peticiones/hora del rate limit")
    print("anónimo. Solución: agrega tu token de GitHub al script.")


if __name__ == "__main__":
    asyncio.run(test_all())
```

---

## Resultado esperado (cuando todo funciona bien)

```
============================================================
PRUEBAS DE ÉXITO (happy path)
============================================================

[TEST 1] validate_repo — repo público existente
  ✅ Resultado: True

[TEST 2] get_default_branch
  ✅ Rama por defecto: 'main'

[TEST 3] get_tree — lista de archivos
  ✅ Archivos encontrados: N
     - LICENSE (1071 bytes)
     - README.md (14 bytes)
     ...

[TEST 4] get_file_content — leer README.md
  ✅ Contenido (14 chars): '# DevCoach-AI...'

[TEST 5] get_last_commit — último commit con diff
  ✅ SHA: 22bb7e4310...
     Mensaje: Add MIT License to the project
     Archivos cambiados: 1

============================================================
PRUEBAS DE ERROR (casos de fallo esperados)
============================================================

[TEST 6] validate_repo — repo inexistente
  ✅ Error esperado: No se encontró: /repos/Lunisa202/este-repo-no-existe-xyz123

[TEST 7] get_file_content — archivo inexistente
  ✅ Error esperado: No se encontró: /repos/Lunisa202/DevCoach-AI/contents/no_existe.xyz

[TEST 8] validate_repo — usuario inexistente
  ✅ Error esperado: No se encontró: /repos/usuario-que-no-existe-abc999/repo
```

---

## Cómo obtener un GitHub Token (si quieres evitar rate limit)

1. Ir a https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Nombre: "DevCoach-AI-dev"
4. Expiración: 30 días (o lo que quieras)
5. **NO marques ningún permiso** (no se necesita ninguno para repos públicos)
6. Click "Generate token"
7. Copia el token (`ghp_...`) y ponlo en `backend/.env`:
   ```
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
   ```

---

## Errores posibles y qué significan

| Error | Causa | Solución |
|-------|-------|----------|
| `RateLimitExceededError` | Más de 60 peticiones/hora sin token | Agrega un GITHUB_TOKEN al .env |
| `GitHubTimeoutError` | GitHub no respondió en 10s | Problemas de red. Reintentar. |
| `RepoNotFoundError` en un repo que SÍ existe | Puede ser que el repo sea privado | Verificar que sea público |
| `ModuleNotFoundError: httpx` | Falta instalar dependencias | `pip install -r requirements.txt` |

---

## Qué probé yo antes de commitear

- ✅ `validate_repo` con repo público → retorna True
- ✅ `get_default_branch` → retorna "main"
- ✅ `get_tree` → retorna lista de archivos con path y size
- ✅ `get_file_content` → decodifica Base64 correctamente
- ✅ `get_last_commit` → retorna sha, message, y lista de files
- ✅ Repo inexistente → lanza `RepoNotFoundError`
- ✅ Sin token funciona (rate limit bajo pero funcional)
