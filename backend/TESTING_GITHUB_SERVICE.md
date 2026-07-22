# Testing Guide — Tarea 3.1: GitHub Service

> Archivo de referencia para probar `app/services/github_service.py` cuando llegues a casa.

---

## Pre-requisitos

```bash
cd backend
pip install -r requirements.txt   # ya tiene httpx
```

Opcional pero recomendado: crear un archivo `.env` con tu token:
```
GITHUB_TOKEN=ghp_tu_token_aqui
```

Sin token funciona para repos públicos, pero con límite de 60 peticiones/hora.

---

## Script de prueba rápida

Crea un archivo `test_github_manual.py` en la carpeta `backend/`:

```python
"""Test manual del GitHubService — correr desde backend/"""
import asyncio
from app.services.github_service import (
    GitHubService,
    RepoNotFoundError,
    GitHubTimeoutError,
    RateLimitExceededError,
)

# Cambia esto por tu token real si quieres (o déjalo vacío)
TOKEN = ""


async def main():
    github = GitHubService(token=TOKEN)

    print("=" * 60)
    print("CASO 1: Repo válido y público")
    print("=" * 60)
    try:
        result = await github.validate_repo("Lunisa202", "DevCoach-AI")
        print(f"  ✅ validate_repo → {result}")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 2: Repo que NO existe")
    print("=" * 60)
    try:
        await github.validate_repo("Lunisa202", "repo-que-no-existe-xyz-123")
        print("  ❌ Debería haber lanzado error pero no lo hizo")
    except RepoNotFoundError as e:
        print(f"  ✅ Lanzó RepoNotFoundError: {e}")
    except Exception as e:
        print(f"  ⚠️ Error inesperado: {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 3: Owner inválido")
    print("=" * 60)
    try:
        await github.validate_repo("usuario-imposible-$$$", "repo")
        print("  ❌ Debería haber lanzado error")
    except RepoNotFoundError as e:
        print(f"  ✅ Lanzó RepoNotFoundError: {e}")
    except Exception as e:
        print(f"  ⚠️ Error: {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 4: Obtener rama por defecto")
    print("=" * 60)
    try:
        branch = await github.get_default_branch("Lunisa202", "DevCoach-AI")
        print(f"  ✅ Rama por defecto: '{branch}'")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 5: Obtener árbol de archivos")
    print("=" * 60)
    try:
        tree = await github.get_tree("Lunisa202", "DevCoach-AI")
        print(f"  ✅ Total de archivos: {len(tree)}")
        print(f"  Primeros 5:")
        for f in tree[:5]:
            print(f"    - {f['path']} ({f['size']} bytes)")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 6: Descargar contenido de un archivo")
    print("=" * 60)
    try:
        content = await github.get_file_content("Lunisa202", "DevCoach-AI", "README.md")
        print(f"  ✅ README.md descargado: {len(content)} caracteres")
        print(f"  Primeros 100 chars: {content[:100]}")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 7: Archivo que NO existe en el repo")
    print("=" * 60)
    try:
        await github.get_file_content("Lunisa202", "DevCoach-AI", "no_existe.xyz")
        print("  ❌ Debería haber lanzado error")
    except RepoNotFoundError as e:
        print(f"  ✅ Lanzó RepoNotFoundError: {e}")
    except Exception as e:
        print(f"  ⚠️ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("CASO 8: Obtener último commit con diff")
    print("=" * 60)
    try:
        commit = await github.get_last_commit("Lunisa202", "DevCoach-AI")
        print(f"  ✅ Último commit:")
        print(f"     SHA: {commit['sha'][:12]}...")
        print(f"     Mensaje: {commit['message'][:80]}")
        print(f"     Archivos cambiados: {len(commit['files'])}")
        for f in commit['files'][:3]:
            print(f"       - {f['filename']} ({f['status']})")
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")

    print()
    print("=" * 60)
    print("RESUMEN DE EXCEPCIONES ESPERADAS")
    print("=" * 60)
    print("""
    | Situación                    | Excepción esperada       |
    |------------------------------|--------------------------|
    | Repo no existe               | RepoNotFoundError        |
    | Repo privado                 | RepoNotFoundError        |
    | Archivo no existe            | RepoNotFoundError        |
    | GitHub no responde en 10s    | GitHubTimeoutError       |
    | Se acabaron las peticiones   | RateLimitExceededError   |
    | Error de red (sin internet)  | GitHubServiceError       |
    """)


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Cómo correr

```bash
cd backend
python test_github_manual.py
```

---

## Resultado esperado (ejemplo)

```
============================================================
CASO 1: Repo válido y público
============================================================
  ✅ validate_repo → True

============================================================
CASO 2: Repo que NO existe
============================================================
  ✅ Lanzó RepoNotFoundError: No se encontró: /repos/Lunisa202/repo-que-no-existe-xyz-123

============================================================
CASO 3: Owner inválido
============================================================
  ✅ Lanzó RepoNotFoundError: No se encontró: /repos/usuario-imposible-$$$/repo

...
```

---

## Qué verificar

1. **Caso 1** debe dar `True` — el repo del equipo existe y es público.
2. **Caso 2 y 3** deben lanzar `RepoNotFoundError` — repos/owners inválidos.
3. **Caso 4** debe devolver `"main"` (o la rama por defecto del repo).
4. **Caso 5** debe listar archivos del repo (la cantidad depende de la rama por defecto en el remoto).
5. **Caso 6** debe mostrar el contenido del README.
6. **Caso 7** debe lanzar `RepoNotFoundError` para un archivo inexistente.
7. **Caso 8** debe mostrar info del último commit con archivos cambiados.

---

## Notas

- Si ves `RateLimitExceededError`, espera 1 hora o agrega tu token al `.env`.
- Si ves errores de conexión, revisa tu internet.
- El árbol de archivos de la rama `main` del remoto puede tener pocos archivos (LICENSE, README) porque el código está en `development`. Eso es normal.
