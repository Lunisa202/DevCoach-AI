export type Priority = "alta" | "media" | "baja";
export type Difficulty = "fácil" | "media" | "difícil";
export type TicketStatus = "todo" | "inreview" | "done";
export type InterviewMode = "chat" | "voice";

export interface Attempt {
  id: string;
  date: string;
  score: number;
  feedback: string;
  concepts: string[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  difficulty: Difficulty;
  estimatedTime: string;
  status: TicketStatus;
  attempts: Attempt[];
  tags: string[];
}

export interface Project {
  id: string;
  repoName: string;
  repoUrl: string;
  date: string;
  tickets: Ticket[];
  language: string;
}

export const currentUser = {
  name: "Alejandro Ruiz",
  email: "alex@devcoach.io",
  initials: "AR",
  avatarGradient: "from-indigo-500 to-violet-600",
};

export const mockProjects: Project[] = [
  {
    id: "p1",
    repoName: "auth-microservice",
    repoUrl: "github.com/alexr/auth-microservice",
    date: "2026-07-20",
    language: "TypeScript",
    tickets: [
      {
        id: "t1",
        title: "Implementar refresh token con rotación",
        description:
          "El sistema actual de autenticación no implementa rotación de refresh tokens, lo que representa un vector de ataque si un token es comprometido. Se debe implementar el patrón de rotación de tokens con familia de tokens.",
        priority: "alta",
        difficulty: "difícil",
        estimatedTime: "4-6h",
        status: "done",
        tags: ["seguridad", "JWT", "auth"],
        attempts: [
          {
            id: "a1",
            date: "2026-07-22",
            score: 87,
            feedback:
              "Buena comprensión del patrón, mejorar manejo de tokens revocados.",
            concepts: ["JWT rotation", "token family", "Redis TTL"],
          },
        ],
      },
      {
        id: "t2",
        title: "Agregar rate limiting por IP y usuario",
        description:
          "Los endpoints de login y registro son vulnerables a ataques de fuerza bruta. Implementar rate limiting con sliding window usando Redis para limitar intentos por IP y por usuario.",
        priority: "alta",
        difficulty: "media",
        estimatedTime: "2-3h",
        status: "inreview",
        tags: ["seguridad", "Redis", "middleware"],
        attempts: [
          {
            id: "a2",
            date: "2026-07-23",
            score: 64,
            feedback: "Algoritmo correcto pero faltó el edge case de headers proxy.",
            concepts: ["sliding window", "X-Forwarded-For", "Redis ZADD"],
          },
        ],
      },
      {
        id: "t3",
        title: "Migrar contraseñas a Argon2id",
        description:
          "Actualmente las contraseñas se hashean con bcrypt (10 rounds). Migrar a Argon2id que ofrece mejor resistencia contra ataques de hardware especializado, con estrategia de migración progresiva.",
        priority: "media",
        difficulty: "media",
        estimatedTime: "1-2h",
        status: "todo",
        tags: ["seguridad", "crypto", "migración"],
        attempts: [],
      },
    ],
  },
  {
    id: "p2",
    repoName: "ecommerce-api",
    repoUrl: "github.com/alexr/ecommerce-api",
    date: "2026-07-15",
    language: "Python",
    tickets: [
      {
        id: "t4",
        title: "Optimizar queries N+1 en listado de productos",
        description:
          "El endpoint /products genera consultas N+1 al cargar las relaciones de categorías e inventario. Implementar eager loading con select_related y prefetch_related para reducir de ~200 queries a ~3.",
        priority: "alta",
        difficulty: "media",
        estimatedTime: "2-3h",
        status: "done",
        tags: ["Django", "ORM", "performance"],
        attempts: [
          {
            id: "a3",
            date: "2026-07-17",
            score: 92,
            feedback: "Excelente comprensión de Django ORM y optimización de queries.",
            concepts: ["select_related", "prefetch_related", "query profiling"],
          },
        ],
      },
      {
        id: "t5",
        title: "Implementar caché de catálogo con Redis",
        description:
          "El catálogo de productos se consulta frecuentemente pero cambia pocas veces al día. Implementar caché con invalidación inteligente usando Redis y señales de Django.",
        priority: "media",
        difficulty: "media",
        estimatedTime: "3-4h",
        status: "done",
        tags: ["Redis", "caché", "Django signals"],
        attempts: [
          {
            id: "a4",
            date: "2026-07-18",
            score: 78,
            feedback: "Buena implementación, revisar estrategia de cache stampede.",
            concepts: ["cache aside", "write-through", "stampede prevention"],
          },
        ],
      },
      {
        id: "t6",
        title: "Agregar índices compuestos en base de datos",
        description:
          "Varias queries críticas de búsqueda y filtrado no tienen índices adecuados. Analizar slow query log e implementar índices compuestos para los patrones de acceso más frecuentes.",
        priority: "baja",
        difficulty: "fácil",
        estimatedTime: "1h",
        status: "done",
        tags: ["PostgreSQL", "índices", "performance"],
        attempts: [
          {
            id: "a5",
            date: "2026-07-19",
            score: 95,
            feedback: "Dominio completo del tema. Respuestas precisas y bien fundamentadas.",
            concepts: ["composite index", "EXPLAIN ANALYZE", "covering index"],
          },
        ],
      },
    ],
  },
  {
    id: "p3",
    repoName: "dashboard-react",
    repoUrl: "github.com/alexr/dashboard-react",
    date: "2026-07-10",
    language: "TypeScript",
    tickets: [
      {
        id: "t7",
        title: "Virtualize lista de 10k+ elementos",
        description:
          "El componente DataTable renderiza todos los elementos simultáneamente causando freezes en la UI con datasets grandes. Implementar virtualización con react-window.",
        priority: "alta",
        difficulty: "difícil",
        estimatedTime: "3-5h",
        status: "todo",
        tags: ["React", "performance", "virtualización"],
        attempts: [],
      },
      {
        id: "t8",
        title: "Memoizar componentes con useMemo y useCallback",
        description:
          "Análisis del Profiler de React muestra re-renders innecesarios en los componentes de filtros y gráficos. Aplicar memoización estratégica para reducir renders.",
        priority: "media",
        difficulty: "media",
        estimatedTime: "2-3h",
        status: "inreview",
        tags: ["React", "memoización", "Profiler"],
        attempts: [],
      },
      {
        id: "t9",
        title: "Implementar code splitting por rutas",
        description:
          "El bundle principal tiene 2.3MB sin minificar. Implementar lazy loading con React.lazy y Suspense para dividir el bundle por rutas y reducir el time-to-interactive.",
        priority: "baja",
        difficulty: "fácil",
        estimatedTime: "1-2h",
        status: "todo",
        tags: ["Vite", "code splitting", "performance"],
        attempts: [],
      },
    ],
  },
];

export const fileTree = [
  {
    type: "folder",
    name: "src",
    open: true,
    children: [
      {
        type: "folder",
        name: "controllers",
        open: false,
        children: [
          { type: "file", name: "authController.ts", size: "3.2 KB" },
          { type: "file", name: "userController.ts", size: "2.8 KB" },
          { type: "file", name: "tokenController.ts", size: "1.9 KB" },
        ],
      },
      {
        type: "folder",
        name: "middleware",
        open: false,
        children: [
          { type: "file", name: "authMiddleware.ts", size: "1.1 KB" },
          { type: "file", name: "rateLimiter.ts", size: "0.8 KB" },
          { type: "file", name: "errorHandler.ts", size: "0.6 KB" },
        ],
      },
      {
        type: "folder",
        name: "models",
        open: true,
        children: [
          { type: "file", name: "User.ts", size: "2.1 KB" },
          { type: "file", name: "Token.ts", size: "1.4 KB" },
          { type: "file", name: "Session.ts", size: "0.9 KB" },
        ],
      },
      {
        type: "folder",
        name: "services",
        open: false,
        children: [
          { type: "file", name: "authService.ts", size: "4.1 KB" },
          { type: "file", name: "cryptoService.ts", size: "1.3 KB" },
          { type: "file", name: "emailService.ts", size: "2.0 KB" },
        ],
      },
      { type: "file", name: "app.ts", size: "0.7 KB" },
      { type: "file", name: "server.ts", size: "0.4 KB" },
    ],
  },
  {
    type: "folder",
    name: "tests",
    open: false,
    children: [
      { type: "file", name: "auth.test.ts", size: "5.2 KB" },
      { type: "file", name: "token.test.ts", size: "3.8 KB" },
    ],
  },
  { type: "file", name: "package.json", size: "1.2 KB" },
  { type: "file", name: "tsconfig.json", size: "0.5 KB" },
  { type: "file", name: ".env.example", size: "0.3 KB" },
];

export const chatMessages = [
  {
    id: "m1",
    role: "bot" as const,
    content:
      "Hola Alejandro, soy tu Tech Lead virtual. Vamos a evaluar tu comprensión sobre el ticket de **refresh token con rotación**. ¿Estás listo para comenzar?",
    timestamp: "10:32",
  },
  {
    id: "m2",
    role: "user" as const,
    content: "Sí, listo para empezar.",
    timestamp: "10:32",
  },
  {
    id: "m3",
    role: "bot" as const,
    content:
      "Perfecto. Primera pregunta: ¿Qué problema específico resuelve la rotación de refresh tokens comparado con usar un único refresh token de larga duración?",
    timestamp: "10:33",
  },
  {
    id: "m4",
    role: "user" as const,
    content:
      "Si un atacante roba el refresh token, con rotación solo puede usarlo una vez antes de que sea invalidado. Cuando el token rotado se usa, el sistema detecta que el token anterior fue reusado y puede revocar toda la familia de tokens, protegiendo al usuario.",
    timestamp: "10:34",
  },
  {
    id: "m5",
    role: "bot" as const,
    content:
      "Excelente respuesta. Mencionas el concepto de \"familia de tokens\". ¿Cómo implementarías la detección de reutilización y qué harías si se detecta un refresh token ya utilizado?",
    timestamp: "10:34",
  },
];
