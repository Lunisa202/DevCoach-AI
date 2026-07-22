# Ejemplos de prueba — Endpoints de IA

Esta guía contiene ejemplos JSON listos para pegar en Swagger (`http://127.0.0.1:8000/docs`) y probar cada agente de IA. Cada endpoint tiene un escenario "positivo" y uno "negativo" para ver cómo reaccionan los agentes ante buena y mala calidad de código/respuestas.

## Prerequisitos

1. Backend corriendo:
   ```
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
2. Archivo `.env` con `AI_PROVIDER=gemini` o `AI_PROVIDER=groq` y su respectiva API key configurada
3. Abrir en el navegador: http://127.0.0.1:8000/docs

Todos los endpoints están bajo el tag **AI Debug** con prefijo `/api/ai-test/`.

---

## 1. Verificar provider activo

**GET** `/api/ai-test/provider`

Sin body. Devuelve qué provider está configurado (`GeminiProvider` o `GroqProvider`).

Respuesta esperada:
```json
{ "provider": "GeminiProvider", "ok": true }
```

---

## 2. Code_Reviewer — Analizar código

**POST** `/api/ai-test/code-reviewer`

### Escenario A: Código con problemas evidentes (debería detectar debilidades)

```json
{
  "files": {
    "utils.py": "def calc(x, y, op):\n    if op == '+':\n        return x + y\n    if op == '-':\n        return x - y\n    if op == '*':\n        return x * y\n    if op == '/':\n        return x / y\n\ndef read_file(path):\n    f = open(path)\n    data = f.read()\n    return data\n",
    "user_service.py": "users = []\n\ndef add_user(name, email, age):\n    users.append({'name': name, 'email': email, 'age': age})\n    print('User added:', name)\n\ndef get_user(email):\n    for u in users:\n        if u['email'] == email:\n            return u\n    return None\n"
  }
}
```

**Qué debe detectar:**
- Fuga de recursos en `read_file` (falta `with` o `close()`)
- División por cero no manejada
- Operadores no válidos ignorados silenciosamente
- Estado global mutable (`users`)
- Falta de validación de inputs
- Uso de `print` en vez de logging

### Escenario B: Código bien escrito (debería detectar más fortalezas que debilidades)

```json
{
  "files": {
    "calculator.py": "from typing import Literal\nimport logging\n\nlogger = logging.getLogger(__name__)\n\nOperator = Literal['+', '-', '*', '/']\n\n\ndef calc(x: float, y: float, op: Operator) -> float:\n    \"\"\"Perform a binary arithmetic operation.\n\n    Raises:\n        ValueError: If op is unknown or if dividing by zero.\n    \"\"\"\n    if op == '+':\n        return x + y\n    if op == '-':\n        return x - y\n    if op == '*':\n        return x * y\n    if op == '/':\n        if y == 0:\n            raise ValueError('Division by zero is not allowed')\n        return x / y\n    raise ValueError(f'Unknown operator: {op}')\n\n\ndef read_file(path: str) -> str:\n    \"\"\"Read a text file and return its content.\"\"\"\n    logger.debug('Reading file: %s', path)\n    with open(path, encoding='utf-8') as f:\n        return f.read()\n"
  }
}
```

**Qué debe detectar:**
- Uso de type hints
- Manejo correcto de recursos con `with`
- Validación explícita de división por cero
- Docstrings descriptivos
- Uso de `logging` en lugar de `print`

---

## 3. Ticket_Generator — Generar 3 tickets

**POST** `/api/ai-test/ticket-generator`

### Escenario A: Review con muchas debilidades

```json
{
  "review": {
    "fortalezas": [
      "Código simple y fácil de leer",
      "Nombres de funciones descriptivos",
      "Separación básica entre lógica y almacenamiento"
    ],
    "debilidades": [
      "La función calc no maneja división por cero",
      "read_file nunca cierra el archivo (fuga de recursos)",
      "Se usa una lista global 'users' — no es thread-safe",
      "No hay validación de inputs (email, age)",
      "Se usan prints en vez de logging estructurado",
      "Búsqueda O(n) en get_user por lista, debería ser dict O(1)"
    ]
  }
}
```

**Qué debe generar:** exactamente 3 tickets, priorizando las debilidades más impactantes (probablemente fuga de recursos y división por cero como prioridad alta).

### Escenario B: Review con pocas debilidades menores

```json
{
  "review": {
    "fortalezas": [
      "Código con type hints y docstrings completos",
      "Buen manejo de recursos con context managers",
      "Uso consistente de logging",
      "Validaciones explícitas en cada operación"
    ],
    "debilidades": [
      "Algunos nombres de variables podrían ser más descriptivos",
      "Falta agregar tests unitarios para casos edge"
    ]
  }
}
```

**Qué debe generar:** 3 tickets pero de baja/media prioridad, más orientados a mejoras opcionales.

---

## 4. Tech_Lead — Generar preguntas de entrevista

**POST** `/api/ai-test/tech-lead`

### Escenario A: Ticket resuelto con diff no trivial

```json
{
  "ticket": {
    "titulo": "Manejar la división por cero en el módulo calc",
    "descripcion": "Implementar una validación en la función de división dentro del módulo calc para prevenir errores no controlados en tiempo de ejecución. Se debe lanzar una excepción específica o retornar un resultado controlado al recibir un divisor igual a cero.",
    "prioridad": "alta",
    "dificultad": "fácil",
    "tiempo_estimado_minutos": 45
  },
  "diff": "diff --git a/utils.py b/utils.py\n@@ -5,4 +5,8 @@ def calc(x, y, op):\n     if op == '/':\n+        if y == 0:\n+            raise ValueError('Division by zero')\n         return x / y\n+    raise ValueError(f'Unknown operator: {op}')\n"
}
```

**Qué debe generar:** 2-3 preguntas específicas sobre la decisión (por qué ValueError, por qué acá y no en otro nivel, cómo se comporta con floats muy chicos, etc.).

### Escenario B: Ticket de refactor con diff más complejo

```json
{
  "ticket": {
    "titulo": "Migrar user_service de lista global a diccionario indexado",
    "descripcion": "Cambiar la estructura de almacenamiento de usuarios de una lista global a un diccionario indexado por email, para mejorar el rendimiento de get_user de O(n) a O(1) y eliminar el estado global mutable.",
    "prioridad": "media",
    "dificultad": "media",
    "tiempo_estimado_minutos": 90
  },
  "diff": "diff --git a/user_service.py b/user_service.py\n@@ -1,12 +1,20 @@\n-users = []\n+from threading import Lock\n \n-def add_user(name, email, age):\n-    users.append({'name': name, 'email': email, 'age': age})\n-    print('User added:', name)\n \n-def get_user(email):\n-    for u in users:\n-        if u['email'] == email:\n-            return u\n-    return None\n+class UserRepository:\n+    def __init__(self):\n+        self._users: dict[str, dict] = {}\n+        self._lock = Lock()\n+\n+    def add(self, name: str, email: str, age: int) -> None:\n+        with self._lock:\n+            if email in self._users:\n+                raise ValueError(f'User already exists: {email}')\n+            self._users[email] = {'name': name, 'email': email, 'age': age}\n+\n+    def get(self, email: str) -> dict | None:\n+        return self._users.get(email)\n"
}
```

**Qué debe generar:** preguntas sobre decisiones de diseño más elaboradas (por qué una clase, por qué el Lock, cómo migrar callers existentes, etc.).

---

## 5. Evaluator — Evaluar respuestas de la entrevista

**POST** `/api/ai-test/evaluator`

Este es el más rico para probar. Podés ver cómo el Evaluator distingue entre respuestas sólidas y respuestas vacías.

### Escenario A: Respuestas buenas (debería aprobar → `aprobado: true`)

```json
{
  "ticket": {
    "titulo": "Manejar la división por cero en el módulo calc",
    "descripcion": "Implementar una validación en la función de división dentro del módulo calc para prevenir errores no controlados en tiempo de ejecución. Se debe lanzar una excepción específica o retornar un resultado controlado al recibir un divisor igual a cero.",
    "prioridad": "alta",
    "dificultad": "fácil",
    "tiempo_estimado_minutos": 45
  },
  "diff": "diff --git a/utils.py b/utils.py\n@@ -5,4 +5,8 @@ def calc(x, y, op):\n     if op == '/':\n+        if y == 0:\n+            raise ValueError('Division by zero')\n         return x / y\n",
  "questions": [
    "Veo que lanzaste un `ValueError` explícito. ¿Por qué elegiste esta excepción en lugar de permitir o relanzar el `ZeroDivisionError` nativo de Python, y qué impacto tiene este cambio en los clientes que ya consumen la función?",
    "¿Qué pasaría si en un futuro la función soporta división entera `//` o módulo `%` con `y = 0`? ¿Consideraste abstraer la validación de división por cero o por qué decidiste acoplarla únicamente al operador `/`?",
    "¿Cómo se comporta tu validación si `y` es un número flotante `0.0` o un valor extremadamente cercano a cero (por ejemplo, `1e-15`)? ¿Consideraste el uso de tolerancias para flotantes o tipos de datos no numéricos?"
  ],
  "answers": [
    "Elegí ValueError porque semánticamente representa un argumento inválido, que es exactamente el caso. ZeroDivisionError es más específico de la operación aritmética, pero ValueError comunica mejor la intención de validación de input al llamador. El impacto es que los clientes que hacían try/except ZeroDivisionError tendrían que actualizarse, pero como la función es interna del módulo calc, revisé y no hay callers rotos. En un caso público lo hubiera documentado con un warning previo.",
    "Buen punto, no lo abstraje porque hoy solo tenemos '/'. Si mañana entra '//' o '%', extraería la validación a un helper _guard_zero_divisor(y) y lo aplicaría en las tres ramas. Preferí evitar la abstracción prematura y esperar a tener el segundo caso concreto antes de generalizar, para no diseñar sobre suposiciones.",
    "Para y == 0.0 el chequeo funciona porque Python compara int y float por valor numérico. Para valores muy chicos como 1e-15 el chequeo pasa y la división produce inf, que no está cubierto. Si el dominio requiere tolerancia numérica, agregaría un parámetro epsilon y compararía con abs(y) < epsilon, pero eso no estaba en el ticket. Para tipos no numéricos, hoy fallaría con TypeError en la comparación, lo cual es aceptable como fail-fast."
  ]
}
```

### Escenario B: Respuestas vagas (debería rechazar → `aprobado: false`)

```json
{
  "ticket": {
    "titulo": "Manejar la división por cero en el módulo calc",
    "descripcion": "Implementar una validación en la función de división dentro del módulo calc para prevenir errores no controlados en tiempo de ejecución. Se debe lanzar una excepción específica o retornar un resultado controlado al recibir un divisor igual a cero.",
    "prioridad": "alta",
    "dificultad": "fácil",
    "tiempo_estimado_minutos": 45
  },
  "diff": "diff --git a/utils.py b/utils.py\n@@ -5,4 +5,8 @@ def calc(x, y, op):\n     if op == '/':\n+        if y == 0:\n+            raise ValueError('Division by zero')\n         return x / y\n",
  "questions": [
    "Veo que lanzaste un `ValueError` explícito. ¿Por qué elegiste esta excepción en lugar de permitir o relanzar el `ZeroDivisionError` nativo de Python, y qué impacto tiene este cambio en los clientes que ya consumen la función?",
    "¿Qué pasaría si en un futuro la función soporta división entera `//` o módulo `%` con `y = 0`? ¿Consideraste abstraer la validación de división por cero o por qué decidiste acoplarla únicamente al operador `/`?",
    "¿Cómo se comporta tu validación si `y` es un número flotante `0.0` o un valor extremadamente cercano a cero (por ejemplo, `1e-15`)? ¿Consideraste el uso de tolerancias para flotantes o tipos de datos no numéricos?"
  ],
  "answers": [
    "Porque sí, es lo que hice.",
    "No sé, no lo pensé.",
    "Debería funcionar bien creo."
  ]
}
```

### Escenario C: Respuestas parciales (caso borde, resultado depende del criterio del modelo)

Respuestas que abordan una parte de la pregunta pero ignoran otras. Sirve para ver qué tan estricto es el Evaluator.

```json
{
  "ticket": {
    "titulo": "Manejar la división por cero en el módulo calc",
    "descripcion": "Implementar una validación en la función de división dentro del módulo calc para prevenir errores no controlados en tiempo de ejecución.",
    "prioridad": "alta",
    "dificultad": "fácil",
    "tiempo_estimado_minutos": 45
  },
  "diff": "diff --git a/utils.py b/utils.py\n@@ -5,4 +5,8 @@ def calc(x, y, op):\n     if op == '/':\n+        if y == 0:\n+            raise ValueError('Division by zero')\n         return x / y\n",
  "questions": [
    "¿Por qué elegiste ValueError y no ZeroDivisionError?",
    "¿Cómo se comporta tu código si `y` es `0.0` o un flotante muy cercano a cero?"
  ],
  "answers": [
    "ValueError me pareció más adecuado porque comunica que el input es inválido, no que la operación matemática falló.",
    "No probé con 0.0, asumo que funciona igual."
  ]
}
```

---

## Cómo interpretar los resultados

- **Code_Reviewer:** debería identificar problemas reales y no inventar cosas que no están. Si dice cosas genéricas ("agregar tests") pero no menciona los problemas puntuales del código, ajustar el prompt.
- **Ticket_Generator:** siempre devuelve exactamente 3 tickets. Verificar que la prioridad y dificultad sean coherentes con el problema.
- **Tech_Lead:** las preguntas deben ser específicas al diff, no genéricas ("¿por qué hiciste esto?"). Deben referenciar decisiones concretas del código.
- **Evaluator:** el feedback debe justificar la decisión con referencia a las respuestas concretas del desarrollador, no ser vago.

---

## Cambiar de provider

Editar `backend/.env`:

```
AI_PROVIDER=gemini   # o groq
```

El servidor con `--reload` se reinicia solo. También podés verificar con `GET /api/ai-test/provider`.

## Reportar problemas

Si un agente devuelve un error de tipo `ValueError: ...doesn't match expected schema`, guardá el input JSON que usaste y el mensaje de error completo. Suele deberse a que el LLM devolvió texto extra alrededor del JSON o inventó un campo que no correspondía.
