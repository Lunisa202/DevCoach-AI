export type Priority = 'alta' | 'media' | 'baja'
export type Difficulty = 'fácil' | 'intermedio' | 'avanzado'
export type ColumnId = 'todo' | 'review' | 'done'

export type Attempt = {
  id: string
  date: string
  score: number
  feedback: string
  concepts: string[]
}

export type Ticket = {
  id: string
  title: string
  description: string
  priority: Priority
  difficulty: Difficulty
  estimate: string
  status: ColumnId
  file: string
  attempts: Attempt[]
}

export type Project = {
  id: string
  name: string
  repo: string
  owner: string
  date: string
  completed: number
  total: number
  language: string
}

export type FileNode = {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

export const user = {
  name: 'Lucía Fernández',
  email: 'lucia.fernandez@devmail.com',
  initials: 'LF',
}

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'next-commerce',
    repo: 'lucia/next-commerce',
    owner: 'lucia',
    date: 'Hace 2 horas',
    completed: 1,
    total: 3,
    language: 'TypeScript',
  },
  {
    id: 'p2',
    name: 'api-gateway',
    repo: 'acme/api-gateway',
    owner: 'acme',
    date: 'Ayer',
    completed: 3,
    total: 3,
    language: 'Go',
  },
  {
    id: 'p3',
    name: 'ml-toolkit',
    repo: 'lucia/ml-toolkit',
    owner: 'lucia',
    date: 'Hace 3 días',
    completed: 0,
    total: 3,
    language: 'Python',
  },
  {
    id: 'p4',
    name: 'design-system',
    repo: 'acme/design-system',
    owner: 'acme',
    date: 'Hace 1 semana',
    completed: 2,
    total: 3,
    language: 'TypeScript',
  },
]

export const tickets: Ticket[] = [
  {
    id: 't1',
    title: 'Extraer lógica de fetching a un custom hook',
    description:
      'El componente ProductList mezcla la obtención de datos con el renderizado. Extrae la lógica a un hook useProducts reutilizable con manejo de estados de carga y error.',
    priority: 'alta',
    difficulty: 'intermedio',
    estimate: '45 min',
    status: 'todo',
    file: 'src/components/ProductList.tsx',
    attempts: [],
  },
  {
    id: 't2',
    title: 'Eliminar renders innecesarios en el carrito',
    description:
      'El contexto del carrito provoca re-renders en toda la app. Memoiza el value del provider y separa el estado que cambia con frecuencia.',
    priority: 'media',
    difficulty: 'avanzado',
    estimate: '1.5 h',
    status: 'todo',
    file: 'src/context/CartContext.tsx',
    attempts: [],
  },
  {
    id: 't3',
    title: 'Añadir validación de tipos al endpoint de checkout',
    description:
      'El endpoint /api/checkout confía en el body sin validar. Añade validación con un esquema y devuelve errores 400 descriptivos.',
    priority: 'alta',
    difficulty: 'intermedio',
    estimate: '1 h',
    status: 'review',
    file: 'src/app/api/checkout/route.ts',
    attempts: [
      {
        id: 'a1',
        date: '24 jul, 14:32',
        score: 6.5,
        feedback:
          'Buena implementación del esquema, pero faltó cubrir el caso de campos anidados y el manejo de errores es demasiado genérico.',
        concepts: ['Validación de esquemas', 'Manejo de errores HTTP'],
      },
    ],
  },
  {
    id: 't4',
    title: 'Documentar utilidades de formato de moneda',
    description:
      'Las funciones en lib/currency.ts no tienen tipos ni documentación. Añade JSDoc y tipos explícitos de retorno.',
    priority: 'baja',
    difficulty: 'fácil',
    estimate: '20 min',
    status: 'done',
    file: 'src/lib/currency.ts',
    attempts: [
      {
        id: 'a2',
        date: '23 jul, 10:15',
        score: 9.0,
        feedback:
          'Excelente. Documentación clara, tipos precisos y ejemplos de uso incluidos. Dominio sólido del tema.',
        concepts: [],
      },
    ],
  },
]

export const fileTree: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        name: 'components',
        path: 'src/components',
        type: 'folder',
        children: [
          { name: 'ProductList.tsx', path: 'src/components/ProductList.tsx', type: 'file' },
          { name: 'ProductCard.tsx', path: 'src/components/ProductCard.tsx', type: 'file' },
          { name: 'Header.tsx', path: 'src/components/Header.tsx', type: 'file' },
          { name: 'Cart.tsx', path: 'src/components/Cart.tsx', type: 'file' },
        ],
      },
      {
        name: 'context',
        path: 'src/context',
        type: 'folder',
        children: [
          { name: 'CartContext.tsx', path: 'src/context/CartContext.tsx', type: 'file' },
          { name: 'AuthContext.tsx', path: 'src/context/AuthContext.tsx', type: 'file' },
        ],
      },
      {
        name: 'lib',
        path: 'src/lib',
        type: 'folder',
        children: [
          { name: 'currency.ts', path: 'src/lib/currency.ts', type: 'file' },
          { name: 'api.ts', path: 'src/lib/api.ts', type: 'file' },
          { name: 'utils.ts', path: 'src/lib/utils.ts', type: 'file' },
        ],
      },
      { name: 'app', path: 'src/app', type: 'folder', children: [
        { name: 'page.tsx', path: 'src/app/page.tsx', type: 'file' },
        { name: 'layout.tsx', path: 'src/app/layout.tsx', type: 'file' },
      ] },
    ],
  },
  {
    name: 'public',
    path: 'public',
    type: 'folder',
    children: [
      { name: 'logo.svg', path: 'public/logo.svg', type: 'file' },
      { name: 'favicon.ico', path: 'public/favicon.ico', type: 'file' },
    ],
  },
  { name: 'package.json', path: 'package.json', type: 'file' },
  { name: 'README.md', path: 'README.md', type: 'file' },
  { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file' },
]

export const interviewQuestions = [
  {
    id: 'q1',
    text: '¿Por qué es preferible extraer la lógica de fetching a un custom hook en lugar de dejarla en el componente?',
  },
  {
    id: 'q2',
    text: 'En tu implementación, ¿cómo manejarías el caso en el que el componente se desmonta antes de que termine la petición?',
  },
  {
    id: 'q3',
    text: '¿Qué diferencia hay entre usar useEffect con SWR o React Query para este tipo de fetching?',
  },
]

export const columns: { id: ColumnId; label: string }[] = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'review', label: 'En revisión' },
  { id: 'done', label: 'Completado' },
]
