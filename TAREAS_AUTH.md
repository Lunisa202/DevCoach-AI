# DevCoach AI — Tareas Extra: Autenticación JWT

> Estas tareas son un bloque nuevo que **no modifica** las tareas existentes (1.x – 11.x).
> Se numeran como **A.1** (backend) y **A.2** (frontend) para no generar conflictos.
> Deben completarse **antes** de la tarea 9.1 (RepoInput), ya que el frontend necesita
> el sistema de rutas protegidas para poder integrar las páginas.

---

## Rama de trabajo

| Módulo | Rama | Tareas |
|--------|------|--------|
| Backend | `feature/backend/auth` | A.1 |
| Frontend | `feature/frontend/auth` | A.2 |

---

## A.1 — Backend: Endpoints de autenticación JWT

### Qué hace concretamente

Agrega dos endpoints nuevos al backend FastAPI:

- `POST /api/auth/register` — crea un usuario nuevo, devuelve token + datos
- `POST /api/auth/login` — valida credenciales, devuelve token + datos

Las contraseñas se guardan **hasheadas con bcrypt** (nunca en texto claro).
El token es un **JWT** firmado con una clave secreta definida en variables de entorno.

### Nueva tabla en Supabase

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,      -- bcrypt hash, nunca en claro
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Asociación con entidades existentes

Cada usuario es dueño de sus proyectos. La relación es:

```
users (1) ──< projects (N) ──< tickets (N) ──< reviews (N)
```

`tickets` y `reviews` ya están asociados a `users` **indirectamente** a través de
`project_id` y `ticket_id`. No hace falta agregar `user_id` a esas tablas.

**Migración sobre la tabla `projects` existente:**

```sql
-- Agregar columna user_id a projects
ALTER TABLE projects
  ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;

-- Índice para acelerar consultas "dame los proyectos de este usuario"
CREATE INDEX idx_projects_user_id ON projects(user_id);
```

⚠️ Si ya hay filas en `projects` (datos de prueba), hay que borrarlas antes de agregar
la columna `NOT NULL`, o agregarla primero como `NULLABLE` y luego migrar los datos.

**Impacto en `db_service.py`:**

- `create_project()` recibe `user_id` como parámetro adicional y lo incluye en el INSERT
- `get_tickets_by_project()` no cambia — el `project_id` ya identifica unívocamente al dueño
- Agregar `get_projects_by_user(user_id)` para que el frontend pueda listar proyectos del usuario autenticado

**Cómo llega el `user_id` al endpoint:**

El frontend **nunca manda `user_id` en el body** — sería fácil de falsificar.
El backend lo extrae del JWT en el header `Authorization: Bearer <token>`:

```python
# En app/api/projects.py — dependencia de FastAPI
from fastapi import Depends
from app.services.auth_service import get_current_user

@router.post("")
async def create_project(
    request: ProjectCreate,
    current_user: dict = Depends(get_current_user),  # extrae user del JWT
):
    user_id = current_user["id"]
    project = await db.create_project(
        repo_url=request.repo_url,
        archivos_seleccionados=request.archivos_seleccionados,
        user_id=user_id,  # ← viene del token, no del body
    )
```

`get_current_user` es una dependencia de FastAPI que:
1. Lee el header `Authorization: Bearer <token>`
2. Decodifica el JWT con `auth_service.decode_access_token()`
3. Consulta la tabla `users` para obtener el registro completo
4. Devuelve el dict del usuario, o lanza 401 si el token es inválido/expirado

### Nuevas dependencias en `requirements.txt`

```
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

### Nuevas variables de entorno (`.env` y `.env.example`)

```
JWT_SECRET_KEY=reemplazar-con-clave-larga-y-aleatoria
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
```

### Archivos a crear

```
backend/app/
├── models/
│   └── user.py           ← UserCreate, UserLogin, UserResponse, TokenResponse
├── services/
│   └── auth_service.py   ← hash_password, verify_password, create_token, decode_token, get_current_user
└── api/
    └── auth.py           ← Router con /register y /login
```

#### `app/models/user.py`

```python
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str           # mínimo 8 caracteres (validar con Field)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
```

#### `app/services/auth_service.py` (responsabilidades)

- `hash_password(plain: str) → str` — bcrypt hash
- `verify_password(plain: str, hashed: str) → bool` — comparación segura
- `create_access_token(user_id: str) → str` — JWT con `exp` claim
- `decode_access_token(token: str) → dict` — verifica firma y expiración
- `get_current_user(token: str = Depends(...)) → dict` — dependencia de FastAPI; decodifica el JWT, consulta la tabla `users` y devuelve el usuario, o lanza 401 si el token es inválido o expirado

#### `app/api/auth.py` — contratos

**POST /api/auth/register**
```
Request:  { full_name, email, password }
Response 200: { access_token, token_type: "bearer", user: { id, full_name, email, created_at } }
Error 409:    Email ya registrado
Error 422:    Campos faltantes o inválidos (Pydantic lo maneja solo)
```

**POST /api/auth/login**
```
Request:  { email, password }
Response 200: { access_token, token_type: "bearer", user: { id, full_name, email, created_at } }
Error 401:    Credenciales incorrectas (mensaje genérico, no revelar si el email existe)
```

### Cómo saber que funciona

1. Ir a `http://localhost:8000/docs`
2. Llamar `POST /api/auth/register` con datos válidos → debe devolver token
3. Llamar `POST /api/auth/login` con las mismas credenciales → mismo resultado
4. Llamar `POST /api/auth/login` con contraseña incorrecta → debe devolver 401
5. Intentar registrar el mismo email dos veces → debe devolver 409

---

## A.2 — Frontend: Auth con Redux Toolkit + Axios + Protected Routes

### Qué hace concretamente

Implementa toda la capa de autenticación del frontend:

- **Redux Toolkit + Redux Persist**: almacena `access_token` y datos del usuario en `localStorage`, los restaura al recargar la página
- **Axios + interceptors**: cliente HTTP único para rutas autenticadas; detecta token expirado (401) y redirige a `/login` con toast "Sesión expirada"
- **Custom hooks**: `useAuth`, `useLogin`, `useRegister`, `useDarkMode` como interfaz entre componentes y el store
- **Protected Routes**: wrapper que redirige a `/login` si no hay token válido
- **LoginPage + RegisterPage**: dos páginas separadas en `/login` y `/register`, formularios validados con `react-hook-form`
- **Toasts informativos**: mensajes de éxito/error que duran 5 segundos usando `react-hot-toast`. Se usan en login, register, y estarán disponibles en toda la app para feedback del usuario (ej: "Repositorio validado", "Error al crear proyecto")
- **App Loader**: spinner con logo que se muestra al iniciar la app mientras Redux Persist restaura el estado
- **Redirect inteligente**: si ya estás logueado y visitás `/login` o `/register`, redirige a `/` automáticamente

### Diseño visual

- **Paleta de colores**: tonos serios — grises oscuros (`slate-900`, `slate-800`), blancos limpios, acento en índigo (`indigo-600`) para botones y focus states
- **Dark mode / Light mode**: botón toggle (sol/luna) en la esquina superior derecha, visible tanto en el login como en las páginas protegidas. Implementado con la clase `dark` de Tailwind en el `<html>` + `localStorage` para persistir la preferencia del usuario entre sesiones
- **Logo SVG**: icono personalizado de DevCoach AI — símbolo de código (`</>`) combinado con un elemento que evoca IA/coaching, monocromático y adaptable a ambos modos
- **Mensaje de bienvenida en LoginPage**: frase motivacional fija, por ejemplo _"Tu código habla. Nosotros te ayudamos a mejorarlo."_ o _"Crece con feedback real de un Tech Lead con IA."_
- **Layout de LoginPage**: dos columnas en desktop (panel izquierdo con logo + mensaje, panel derecho con formulario), una columna en mobile

### Nuevas dependencias

```bash
pnpm add @reduxjs/toolkit react-redux redux-persist axios react-hook-form react-hot-toast
```

### Archivos a crear

```
frontend/src/
├── store/
│   ├── index.ts              ← configureStore + persistStore + RootState export
│   └── slices/
│       └── authSlice.ts      ← estado: { token, user, isAuthenticated }
├── services/
│   ├── axiosClient.ts        ← instancia Axios con baseURL, interceptors (token + 401 redirect)
│   └── authService.ts        ← loginService(), registerService() → llaman a los endpoints
├── hooks/
│   ├── useAuth.ts            ← lee el estado del store (token, user, isAuthenticated)
│   ├── useLogin.ts           ← despacha loginAction, maneja loading/error
│   ├── useRegister.ts        ← despacha registerAction, maneja loading/error
│   └── useDarkMode.ts        ← toggle dark/light, persiste en localStorage
├── components/
│   ├── ProtectedRoute.tsx    ← redirige a /login si !isAuthenticated
│   ├── DevCoachLogo.tsx      ← SVG del logo (icono </> + elemento IA)
│   ├── DarkModeToggle.tsx    ← botón sol/luna en esquina superior derecha
│   ├── Spinner.tsx           ← spinner reutilizable (sm/md/lg) con label opcional
│   └── AppLoader.tsx         ← pantalla completa con logo + spinner (para PersistGate)
├── types/
│   └── auth.ts              ← User, TokenResponse, LoginFormData, RegisterFormData
└── pages/
    ├── LoginPage.tsx         ← formulario de login con react-hook-form
    └── RegisterPage.tsx      ← formulario de registro con react-hook-form
```

Archivo eliminado:
- `src/lib/api.ts` — reemplazado por `services/axiosClient.ts` (un solo punto de entrada HTTP)

---

### Detalle por capa

#### `store/slices/authSlice.ts`

Estado:
```ts
interface AuthState {
  token: string | null
  user: { id: string; full_name: string; email: string; created_at: string } | null
  isAuthenticated: boolean
}
```

Actions:
- `setCredentials(payload: { token, user })` — guarda token y user, marca autenticado
- `clearCredentials()` — limpia todo (logout o sesión expirada)

#### `store/index.ts`

- `persistReducer` con `storage` de `redux-persist` sobre `authSlice`
- `persistStore` exportado para el `PersistGate` en `main.tsx`
- Clave de persistencia: `"auth"`

#### `services/axiosClient.ts`

```ts
// Crea instancia con baseURL desde import.meta.env.VITE_API_URL
// Interceptor de request: agrega header Authorization: Bearer <token> si hay token en store
// Interceptor de response:
//   - Si status 401 → dispatch(clearCredentials()) + toast.error("Sesión expirada") + navigate("/login")
//   - Otros errores → relanza el error normalmente
```

⚠️ `src/lib/api.ts` fue eliminado — `axiosClient.ts` es ahora el único cliente HTTP.
El `authService.ts` usa axios directamente sin token (rutas públicas).
El `axiosClient.ts` agrega el token automáticamente para rutas protegidas.

#### `hooks/useAuth.ts`

```ts
// Retorna: { user, token, isAuthenticated }
// Lee directamente del store con useSelector
```

#### `hooks/useLogin.ts`

```ts
// Retorna: { login(data), isLoading, error }
// Internamente: llama authService.login() → dispatch(setCredentials()) → navigate("/")
```

#### `hooks/useRegister.ts`

```ts
// Retorna: { register(data), isLoading, error }
// Internamente: llama authService.register() → dispatch(setCredentials()) → navigate("/")
```

#### `components/ProtectedRoute.tsx`

```tsx
// Si isAuthenticated → renderiza <Outlet /> (React Router)
// Si !isAuthenticated → <Navigate to="/login" replace />
```

#### `pages/LoginPage.tsx` y `pages/RegisterPage.tsx`

Dos páginas separadas con rutas independientes:

**LoginPage (`/login`):**
- Formulario con `react-hook-form` (`mode: "onTouched"`)
- Campos: email + password
- Toast `"Sesión iniciada"` al éxito
- Link a `/register`: "¿No tenés cuenta? Registrate"
- Si ya está autenticado → `<Navigate to="/" replace />`

**RegisterPage (`/register`):**
- Campos: full_name + email + password + confirmPassword
- Validaciones: nombre min 2, password min 6 + 1 número + 1 mayúscula, confirmación coincide
- Toast `"Cuenta creada exitosamente"` al éxito
- Link a `/login`: "¿Ya tenés cuenta? Iniciá sesión"
- Si ya está autenticado → `<Navigate to="/" replace />`

**Ambas:**
- Errores inline en rojo bajo cada campo (sin borrar el valor)
- Spinner en el botón mientras `isSubmitting`
- Error del servidor debajo del botón via `setError("root", ...)`
- Layout dos columnas en desktop (logo + mensaje | formulario), una columna en mobile

#### `main.tsx` actualizado

```tsx
<Provider store={store}>
  <PersistGate loading={<AppLoader />} persistor={persistor}>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 5000, success: {...}, error: {...} }}
      />
      <App />
    </BrowserRouter>
  </PersistGate>
</Provider>
```

- `AppLoader` se muestra mientras Redux Persist rehidrata el estado
- `Toaster` con duración de 5 segundos — se usa en toda la app para feedback positivo/negativo:
  - `toast.success("Sesión iniciada")` — login exitoso
  - `toast.success("Cuenta creada exitosamente")` — register exitoso
  - `toast.error("Sesión expirada")` — interceptor 401 de axios
  - Disponible en futuras tareas para: "Repositorio validado", "Tickets generados", "Entrevista aprobada", etc.

#### Estructura de rutas en `App.tsx`

```
/login          → <LoginPage />           (pública, redirige a / si ya logueado)
/register       → <RegisterPage />        (pública, redirige a / si ya logueado)
/               → <ProtectedRoute>        (protegida)
                    <HomePage />           (placeholder hasta tarea 9.x)
/select         → <ProtectedRoute>
                    <FileSelectorPage />   (futura)
/dashboard      → <ProtectedRoute>
                    <DashboardPage />      (futura)
/interview/:id  → <ProtectedRoute>
                    <InterviewPage />      (futura)
*               → <Navigate to="/" />     (fallback)
```

### Cómo saber que funciona

1. Sin token → entrar a `/` redirige automáticamente a `/login`
2. Registrarse → redirige a `/` y el nombre del usuario aparece disponible via `useAuth()`
3. Recargar la página → sigue autenticado (Redux Persist restaura el token)
4. Esperar que el token expire (o borrarlo manualmente del localStorage) → la siguiente petición con Axios muestra el toast y redirige a `/login`
5. Hacer logout → limpia store y redirige a `/login`

---

## Impacto en tareas existentes

| Tarea | Cambio necesario |
|-------|-----------------|
| 1.3 Schema Supabase | Agregar tabla `users` + columna `user_id` en `projects` + índice |
| `db_service.create_project()` | Recibe `user_id` como parámetro y lo incluye en el INSERT |
| `db_service` | Agregar `get_projects_by_user(user_id)` para listar proyectos del usuario |
| `api/projects.py` | Todos los endpoints usan `Depends(get_current_user)` para autenticar |
| `api/tickets.py` | Ídem — verificar que el ticket pertenece a un proyecto del usuario |
| `api/interviews.py` | Ídem |
| 9.1 RepoInput | Puede usar `useAuth()` para mostrar el nombre del usuario autenticado. Puede usar `toast.success()` para feedback |
| 11.1 Routing | La configuración de rutas ya incluye `ProtectedRoute` — no hay que agregarlo después |
| `src/lib/api.ts` | **Eliminado** — reemplazado por `services/axiosClient.ts` |
| `main.tsx` | Actualizado con `Provider` + `PersistGate` (con `AppLoader`) + `Toaster` (5s) |
| Toasts | `react-hot-toast` disponible globalmente para mensajes positivos/negativos en toda la app |

---

## Checklist antes de hacer PR

### Backend (A.1)
- [ ] Tabla `users` creada en Supabase ← pendiente: correr `002_add_users_auth.sql` en panel de Supabase
- [ ] Columna `user_id` agregada a tabla `projects` con FK a `users` + índice ← incluida en `002_add_users_auth.sql`
- [x] Variables JWT agregadas en `config.py` y `.env.example` (`JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`)
- [x] Nuevas dependencias en `requirements.txt` (`python-jose`, `passlib[bcrypt]`, `email-validator`)
- [x] `app/models/user.py` creado (`UserCreate`, `UserLogin`, `UserResponse`, `TokenResponse`)
- [x] `app/services/auth_service.py` creado (`hash_password`, `verify_password`, `create_access_token`, `decode_access_token`, `get_current_user`)
- [x] `app/services/db_service.py` actualizado (`create_user`, `get_user_by_email`, `get_user_by_id`, `create_project` recibe `user_id`)
- [x] `app/api/auth.py` creado (`POST /api/auth/register`, `POST /api/auth/login`)
- [x] `app/main.py` actualizado — router de auth registrado
- [x] `POST /register` devuelve token y datos de usuario
- [x] `POST /login` devuelve 401 con mensaje genérico si las credenciales son incorrectas
- [x] Las contraseñas nunca aparecen en logs ni en respuestas
- [x] `get_current_user` dependencia implementada
- [x] `Depends(get_current_user)` aplicado en todos los endpoints de `projects.py`, `tickets.py`, `interviews.py`
- [x] `create_project()` recibe y guarda `user_id` del token
- [x] Endpoints de projects/tickets/interviews devuelven 401 sin token válido
- [x] `backend/supabase/002_add_users_auth.sql` creado con tabla `users` + migración de `projects`

### Frontend (A.2)
- [x] Dependencias instaladas (`@reduxjs/toolkit`, `react-redux`, `redux-persist`, `axios`, `react-hook-form`, `react-hot-toast`)
- [x] `src/lib/api.ts` eliminado — reemplazado por `axiosClient.ts`
- [x] Store configurado con Redux Persist (clave `"auth"`, localStorage)
- [x] `authSlice.ts` con `setCredentials` y `clearCredentials`
- [x] `axiosClient.ts` con interceptors (token en request, 401 → toast + redirect en response)
- [x] `authService.ts` con `loginService()` y `registerService()`
- [x] `useDarkMode.ts` hook implementado (toggle clase `dark` en `<html>`, persiste en localStorage)
- [x] `DarkModeToggle.tsx` visible en login, register y páginas protegidas
- [x] `DevCoachLogo.tsx` SVG adaptable a light/dark
- [x] `ProtectedRoute.tsx` redirige a `/login` si `!isAuthenticated`
- [x] `LoginPage.tsx` en ruta `/login` — solo email + password + link a register
- [x] `RegisterPage.tsx` en ruta `/register` — nombre + email + password + confirmar + link a login
- [x] Si ya logueado → `/login` y `/register` redirigen a `/` automáticamente
- [x] Toasts de éxito: "Sesión iniciada" (login), "Cuenta creada exitosamente" (register)
- [x] `Spinner.tsx` componente reutilizable (sm/md/lg)
- [x] `AppLoader.tsx` pantalla completa con logo + spinner (PersistGate loading)
- [x] `Toaster` configurado con 5s de duración, disponible globalmente
- [x] `react-hook-form` muestra errores inline sin borrar el input
- [x] El botón de submit muestra loading/spinner mientras se hace el fetch
- [ ] Sin token → cualquier ruta protegida redirige a `/login` ← falta probar con backend conectado
- [ ] Con token expirado → toast "Sesión expirada" + redirect a `/login` ← falta probar con backend conectado
- [ ] Recargar página → sigue autenticado ← falta probar con backend conectado
