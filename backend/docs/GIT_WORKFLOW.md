# DevCoach AI — Estrategia de Git

## Modelo de ramas

Usamos **Git Flow simplificado** adaptado a un equipo de 4 personas en una hackathon de 1 semana.

```
main (producción — solo releases estables)
│
└── development (integración — aquí se juntan los cambios de todos)
    │
    ├── feature/backend/{nombre-corto}   ← Camilo y Génesis
    ├── feature/frontend/{nombre-corto}  ← Carolina y Abner
    └── hotfix/{nombre-corto}            ← Correcciones urgentes
```

## Ramas principales

| Rama | Propósito | Quién mergea |
|------|-----------|-------------|
| `main` | Código listo para demo/producción. Solo recibe merges de `development` cuando el equipo confirma estabilidad. | Camilo (lead técnico) |
| `development` | Rama de integración. Todos los features se mergean aquí. Se despliega en un entorno de staging/preview. | Cualquiera vía PR |

## Ramas de feature

Cada tarea o grupo de tareas relacionadas se trabaja en una rama feature:

```
feature/backend/ai-provider        ← Tareas 2.1, 2.2, 2.3
feature/backend/agents             ← Tareas 2.4, 2.5, 2.6, 2.7
feature/backend/github-service     ← Tarea 3.1
feature/backend/db-service         ← Tareas 4.1, 5.1
feature/backend/api-endpoints      ← Tareas 7.1, 7.2, 7.3
feature/frontend/setup             ← Tarea 1.2
feature/frontend/repo-input        ← Tarea 9.1
feature/frontend/file-selector     ← Tarea 9.2
feature/frontend/dashboard         ← Tarea 9.3
feature/frontend/interview         ← Tareas 9.4, 9.5, 9.6, 9.7
feature/frontend/routing           ← Tareas 11.1, 11.2
```

## Reglas de trabajo

### Convenciones de commits

Usar **Conventional Commits** para claridad:

```
feat: add AI provider factory and Gemini/Groq implementations
fix: handle timeout in GitHub service validate_repo
docs: update README with setup instructions
refactor: extract URL validation to utility function
test: add unit tests for ticket state transitions
chore: configure CORS and environment validation
```

### Flujo de trabajo diario

1. **Antes de empezar**: `git pull origin development` en tu rama feature
2. **Trabajar**: hacer commits pequeños y frecuentes (no acumular un día entero)
3. **Al terminar una feature**: crear Pull Request hacia `development`
4. **Review rápido**: al menos 1 persona del equipo aprueba (puede ser una revisión rápida de 5 min dado el contexto hackathon)
5. **Merge**: squash merge para mantener el historial de `development` limpio

### Resolución de conflictos

- Si hay conflicto al mergear a `development`, la persona que hizo el PR lo resuelve
- Frontend y Backend rara vez se pisan (carpetas separadas), pero si ocurre: comunicación inmediata por el canal del equipo

### Política de main

- Solo se mergea `development` → `main` cuando:
  - El flujo completo funciona end-to-end
  - Antes del deploy final (Día 5-6)
  - Para el Demo Day

## Protecciones recomendadas (GitHub)

- `main`: protegida, requiere PR + 1 approval
- `development`: requiere PR (approval opcional en hackathon para no bloquear)
- Ramas feature: trabajo libre, push directo

## Entornos

| Rama | Entorno | Plataforma |
|------|---------|-----------|
| `main` | Producción | Vercel (frontend) + Render (backend) |
| `development` | Staging/Preview | Vercel preview deploys + Render (branch deploy o mismo servicio con env diferente) |

## Comandos útiles

```bash
# Crear tu rama de feature desde development
git checkout development
git pull origin development
git checkout -b feature/backend/ai-provider

# Subir tu rama
git push -u origin feature/backend/ai-provider

# Actualizar tu rama con los últimos cambios de development
git checkout feature/backend/mi-feature
git pull origin development

# Cuando terminas: push y crear PR en GitHub hacia development
git push origin feature/backend/mi-feature
# → Crear PR en GitHub: base=development ← compare=feature/backend/mi-feature
```
