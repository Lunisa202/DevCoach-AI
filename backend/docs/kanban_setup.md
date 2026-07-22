# Kanban de Jira — Setup para el equipo

Este documento explica cómo conectar tu Kiro con el tablero Kanban de Jira del proyecto (DevCoach AI, key `DA`) para que puedas ver y actualizar las tareas desde el chat, y para que el hook `PostTaskExec` mueva automáticamente las tarjetas a "Listo" cuando marques una tarea del spec como completada.

## Qué te da esto

- Preguntarle a Kiro cosas como "listame mis tickets abiertos en Jira" o "movele DA-15 a en curso" y que las ejecute directamente.
- Que cuando termines una tarea del spec en `.kiro/specs/devcoach-ai/tasks.md` y Kiro la marque como completada, la tarjeta correspondiente se mueva sola a "Listo" en el board.

## Requisitos previos

1. Tener cuenta de Atlassian con acceso al site `https://genesismoralesc1.atlassian.net`. Si Génesis todavía no te invitó, avisale con tu email.
2. Tener `uv` instalado (trae `uvx`, que es lo que el MCP usa para arrancar):

   **Windows / cualquiera con Python:**
   ```
   pip install uv
   ```

   **macOS (con Homebrew):**
   ```
   brew install uv
   ```

   **Linux (o macOS sin Homebrew):**
   ```
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

   Verificá con `uvx --version` que responda.

## Paso 1 — Generar tu API token de Atlassian

Cada persona usa su propio token, nunca el de otra.

1. Andá a https://id.atlassian.com/manage-profile/security/api-tokens
2. Click en **Create API token**
3. Nombre sugerido: `Kiro MCP DevCoach`
4. **Copiá el token** (solo se muestra una vez)

## Paso 2 — Crear tu archivo de configuración MCP a nivel usuario

⚠️ **NO** pongas el token en el `.kiro/settings/mcp.json` del proyecto — ese archivo se sube al repo. Va en el archivo de tu perfil de usuario.

### Windows

Ruta completa: `C:\Users\<tu-usuario>\.kiro\settings\mcp.json`

Podés crearlo así:

```cmd
mkdir "%USERPROFILE%\.kiro\settings"
notepad "%USERPROFILE%\.kiro\settings\mcp.json"
```

O si preferís PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.kiro\settings"
notepad "$env:USERPROFILE\.kiro\settings\mcp.json"
```

Notepad va a preguntarte si querés crear el archivo — decí que sí, pegá el JSON del bloque de abajo, guardá y cerrá.

### macOS

Ruta completa: `~/.kiro/settings/mcp.json` (equivale a `/Users/<tu-usuario>/.kiro/settings/mcp.json`)

Desde la terminal:
```bash
mkdir -p ~/.kiro/settings
touch ~/.kiro/settings/mcp.json
open -a "TextEdit" ~/.kiro/settings/mcp.json
```

O si tenés VS Code / Kiro instalado con el CLI `code`:
```bash
mkdir -p ~/.kiro/settings
code ~/.kiro/settings/mcp.json
```

Pegá el JSON del bloque de abajo y guardá.

### Linux

Ruta completa: `~/.kiro/settings/mcp.json` (equivale a `/home/<tu-usuario>/.kiro/settings/mcp.json`)

Desde la terminal:
```bash
mkdir -p ~/.kiro/settings
nano ~/.kiro/settings/mcp.json    # o vim, o code
```

Pegá el contenido del bloque de abajo y guardá (`Ctrl+O`, `Enter`, `Ctrl+X` en nano).

### Contenido del archivo (igual en Windows, macOS y Linux)

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://genesismoralesc1.atlassian.net",
        "JIRA_USERNAME": "tu-email-de-atlassian@ejemplo.com",
        "JIRA_API_TOKEN": "TU_TOKEN_ACA"
      },
      "disabled": false,
      "autoApprove": [
        "jira_search",
        "jira_get_issue",
        "jira_get_all_projects",
        "jira_get_project_issues",
        "jira_get_transitions",
        "jira_get_board_issues",
        "jira_get_agile_boards"
      ]
    }
  }
}
```

Reemplazá:
- `tu-email-de-atlassian@ejemplo.com` por tu email
- `TU_TOKEN_ACA` por el token que generaste en el paso 1

Guardá el archivo.

## Paso 3 — Reconectar el MCP en Kiro

Tenés dos opciones:

1. **Paleta de comandos**:
   - Windows / Linux: `Ctrl + Shift + P`
   - macOS: `Cmd + Shift + P`

   Buscá "MCP" → ejecutá "Reconnect MCP servers" (o el nombre equivalente en tu versión).
2. **Cerrar y abrir Kiro** — hace lo mismo pero más lento.

En el panel de MCP de Kiro (barra lateral izquierda) deberías ver:
- `git` — el que ya viene del workspace (para operaciones locales de git)
- `atlassian` — el nuevo, en estado "conectado" o similar

Si `atlassian` figura en error, revisá el log del panel: te va a decir si es problema del token, de `uvx` no instalado, o de conectividad.

## Paso 4 — Probar

Pedile a Kiro cualquiera de estas cosas para verificar:

- "Listame mis tickets abiertos en el proyecto DA"
- "Mostrame el ticket DA-15"
- "Qué tareas están en curso en el board de DevCoach AI"

Si Kiro responde con datos reales de Jira, todo listo.

## Cómo funcionan los hooks automáticos

Hay **dos hooks** en `.kiro/hooks/`, ambos versionados en el repo y activos solos cuando abrís el proyecto en Kiro:

### 1. `update-kanban-on-task-complete.json` — trigger `PostTaskExec`

Se dispara cuando Kiro **ejecuta y cierra una tarea en modo Spec**. Ejemplo típico: le pedís a Kiro "arrancá con la tarea 3.1", Kiro trabaja, la termina y marca el checkbox. En ese instante:

1. Detecta el número de tarea que acaba de completarse.
2. Busca en Jira la tarjeta cuyo título empiece con ese número (ej: `3.1 —`).
3. La transiciona al estado "Listo" (transition_id 41).

### 2. `update-kanban-on-tasks-md-save.json` — trigger `PostFileSave` (matcher `tasks.md`)

Cubre el caso de **edición manual**: alguien marca `[x]` a mano en el editor y guarda. En ese momento:

1. Corre `git diff HEAD -- .kiro/specs/devcoach-ai/tasks.md` para ver qué cambió.
2. Si algún checkbox pasó de `[ ]` a `[x]`, procesa esas tareas (una o varias).
3. Si el save no incluye completaciones nuevas (por ejemplo auto-save de una edición cualquiera), sale silencioso — no te molesta.
4. Si detecta más de 5 tareas completadas en el mismo save, pide confirmación antes de actualizar en masa (defensa contra un replace accidental).

### Reglas comunes a ambos hooks

- **Checkpoints ignorados** — las tareas tipo "6 — Checkpoint", "8 — Checkpoint" etc. son puntos de revisión de equipo, no work items. Nunca se marcan como Listo automáticamente.
- **Sin MCP, no hacen nada** — si tu Kiro no tiene el MCP de Atlassian configurado (paso 2 arriba), los hooks se saltan silenciosamente. No rompen tu flujo.
- **Solo tocan Jira** — nunca modifican archivos del proyecto ni hacen commits.
- **Solo se disparan hacia adelante** — un `[x]` que vuelve a `[ ]` (revert de una edición) se ignora.

## Preguntas frecuentes

**¿Puedo compartir un solo token para todo el equipo?**
No es buena práctica. Cada uno con el suyo. Si alguien deja el proyecto, revoca solo su token sin romper a los demás.

**¿Y si trabajo desde otra máquina?**
Tenés que crear el archivo `mcp.json` en cada máquina donde uses Kiro. No se sincroniza.

**¿Qué pasa si mi token se filtra?**
Andá a https://id.atlassian.com/manage-profile/security/api-tokens, revocalo, generá uno nuevo, y actualizá tu `mcp.json`.

**¿El hook puede pisarme una tarjeta que ya moví manualmente?**
Puede — los hooks solo transicionan a "Listo" cuando detectan una tarea completada en el spec. Si la tarjeta ya estaba en "En curso" o "En revisión", la pone en "Listo". Los checkpoints (tareas tipo "6 — Checkpoint", "8 — Checkpoint", etc.) están explícitamente excluidos.

**¿Qué pasa si guardo `tasks.md` muchas veces (auto-save)?**
Nada. El hook de `PostFileSave` compara con el estado commiteado en git. Si no hay checkboxes nuevos marcados, sale silencioso. Solo actúa cuando detecta una transición real de `[ ]` a `[x]`.

**¿Qué pasa si marco 10 tareas de un tirón con un find-replace?**
El hook pide confirmación antes de actualizar en masa (umbral: más de 5). Es un cortafuegos por si alguien ejecuta un replace accidental.

**¿Y si trabajo sin Kiro, solo con editor?**
El hook `PostFileSave` te cubre igual: cuando guardás `tasks.md` con el `[x]` puesto, el hook detecta el cambio y actualiza Jira. Solo necesitás tener Kiro abierto en el proyecto para que el hook esté activo — no hace falta usarlo para editar.
