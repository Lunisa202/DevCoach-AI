# Kanban de Jira — Setup para el equipo

Este documento explica cómo conectar tu Kiro con el tablero Kanban de Jira del proyecto (DevCoach AI, key `DA`) para que puedas ver y actualizar las tareas desde el chat, y para que el hook `PostTaskExec` mueva automáticamente las tarjetas a "Listo" cuando marques una tarea del spec como completada.

## Qué te da esto

- Preguntarle a Kiro cosas como "listame mis tickets abiertos en Jira" o "movele DA-15 a en curso" y que las ejecute directamente.
- Que cuando termines una tarea del spec en `.kiro/specs/devcoach-ai/tasks.md` y Kiro la marque como completada, la tarjeta correspondiente se mueva sola a "Listo" en el board.

## Requisitos previos

1. Tener cuenta de Atlassian con acceso al site `https://genesismoralesc1.atlassian.net`. Si Génesis todavía no te invitó, avisale con tu email.
2. Tener `uv` instalado (trae `uvx`, que es lo que el MCP usa para arrancar). Si no lo tenés:
   ```
   pip install uv
   ```

## Paso 1 — Generar tu API token de Atlassian

Cada persona usa su propio token, nunca el de otra.

1. Andá a https://id.atlassian.com/manage-profile/security/api-tokens
2. Click en **Create API token**
3. Nombre sugerido: `Kiro MCP DevCoach`
4. **Copiá el token** (solo se muestra una vez)

## Paso 2 — Crear tu archivo de configuración MCP a nivel usuario

⚠️ **NO** pongas el token en el `.kiro/settings/mcp.json` del proyecto — ese archivo se sube al repo. Va en el archivo de tu perfil de usuario.

### Windows

Ruta: `C:\Users\<tu-usuario>\.kiro\settings\mcp.json`

Si la carpeta no existe, creala:
```
mkdir "C:\Users\<tu-usuario>\.kiro\settings"
```

### macOS / Linux

Ruta: `~/.kiro/settings/mcp.json`

Si la carpeta no existe:
```
mkdir -p ~/.kiro/settings
```

### Contenido del archivo

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

1. **Paleta de comandos**: Ctrl+Shift+P → buscá "MCP" → ejecutá "Reconnect MCP servers" (o el nombre equivalente en tu versión).
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

## Cómo funciona el hook automático

El archivo `.kiro/hooks/update-kanban-on-task-complete.json` está en el repo y se activa solo cuando abrís el proyecto en Kiro. Se dispara con el evento `PostTaskExec`: cada vez que Kiro marca una tarea del spec (`.kiro/specs/devcoach-ai/tasks.md`) como completada, este hook:

1. Detecta qué número de tarea se completó (ej: `2.4`)
2. Busca en Jira una tarjeta cuyo título empiece con `2.4 —`
3. La transiciona al estado "Listo" (transition_id 41)

Si el MCP de Atlassian no está configurado en tu Kiro local (paso 2 no hecho), el hook simplemente no hace nada — no te molesta ni rompe nada.

## Preguntas frecuentes

**¿Puedo compartir un solo token para todo el equipo?**
No es buena práctica. Cada uno con el suyo. Si alguien deja el proyecto, revoca solo su token sin romper a los demás.

**¿Y si trabajo desde otra máquina?**
Tenés que crear el archivo `mcp.json` en cada máquina donde uses Kiro. No se sincroniza.

**¿Qué pasa si mi token se filtra?**
Andá a https://id.atlassian.com/manage-profile/security/api-tokens, revocalo, generá uno nuevo, y actualizá tu `mcp.json`.

**¿El hook puede pisarme una tarjeta que ya moví manualmente?**
Puede — el hook solo transiciona a "Listo" cuando detecta una tarea completada en el spec. Si ya estaba en "En curso" o "En revisión", la pone en "Listo". Los checkpoints (tareas tipo "6 — Checkpoint", "8 — Checkpoint", etc.) están explícitamente excluidos.
