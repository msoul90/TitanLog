# IronLog

App de fitness para registrar entrenamientos, composición corporal y sesiones HIIT. Construida con TypeScript puro, Supabase como backend y desplegada en GitHub Pages.

---

## Funcionalidades

- **Gym** — Registro diario de ejercicios con peso, series y repeticiones. Detecta Records Personales (PR) automáticamente.
- **HIIT** — Gestión de sesiones de alta intensidad con rondas, duración, ejercicios y RPE.
- **Composición corporal** — Seguimiento de peso, % grasa y % masa muscular con historial visual.
- **Progreso** — Estadísticas de racha, días entrenados, total de PRs y gráficas de historial.
- **Calendario** — Vista mensual de sesiones registradas.
- **Guías de ejercicios** — Instrucciones, músculos trabajados y consejos para más de 60 ejercicios.
- **Temas** — Modo oscuro / claro persistente.
- **Perfiles de usuario** — Nombre y color de perfil personalizables.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript 5 |
| Backend / Auth | Supabase |
| Build | `tsc` (sin bundler) |
| Tests | Vitest + happy-dom |
| Deploy | GitHub Pages via GitHub Actions |
| Estilos | CSS propio (`css/app.css`) |
| Fuentes | Plus Jakarta Sans, Familjen Grotesk |

---

## Estructura del proyecto

```text
ironlog/
├── src/                      # Código fuente TypeScript
│   ├── __tests__/            # Pruebas unitarias
│   │   ├── app.test.ts       # Tests de validación, escaping y PRs
│   │   └── db.test.ts        # Tests de utilidades de fecha
│   ├── types.ts              # Definiciones de tipos globales
│   ├── db.ts                 # Supabase: auth, gym, HIIT, body metrics
│   ├── app.ts                # Estado global, utilidades, validación
│   ├── gym.ts                # Pantalla de gym y composición corporal
│   ├── hiit.ts               # Sesiones HIIT
│   ├── progress.ts           # Estadísticas y exportación de datos
│   ├── calendar.ts           # Vista de calendario
│   └── guides.ts             # Base de datos de guías de ejercicios
├── dist/                     # JS compilado (generado, ignorado en git)
├── css/
│   └── app.css               # Estilos de la app
├── index.html                # Punto de entrada
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── .github/
    └── workflows/
        └── deploy.yml        # CI/CD para GitHub Pages
```

---

## Desarrollo local

### Requisitos

- Node.js 16 o superior
- Una cuenta en [supabase.com](https://supabase.com) con un proyecto creado
- Extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) para VS Code (recomendado) o cualquier servidor HTTP local

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/ironlog.git
cd ironlog
npm install
```

### 2. Configurar Supabase

Edita [src/db.ts](src/db.ts) y reemplaza los placeholders con los valores de tu proyecto:

```typescript
const SUPABASE_URL: string = 'https://TU_PROJECT_ID.supabase.co';
const SUPABASE_ANON: string = 'TU_ANON_PUBLIC_KEY';
```

Los encuentras en: **supabase.com → tu proyecto → Settings → API**

> No subas estos valores a git. Para producción se inyectan via GitHub Secrets (ver sección Deploy).

### 3. Compilar

El proyecto usa `tsc` directamente, sin bundler. El resultado va a `dist/`.

```bash
# Compilar una vez
npm run build

# Modo watch: recompila automáticamente al guardar cualquier .ts
npm run dev
```

El `index.html` carga los scripts desde `dist/`, por lo que **siempre hay que compilar antes de abrir la app**.

### 4. Abrir en el navegador

Los módulos ES nativos requieren un servidor HTTP; no funcionan abriendo `index.html` con `file://`.

**Opción A — Live Server (VS Code):**

1. Instala la extensión Live Server
2. Click derecho sobre `index.html` → **Open with Live Server**
3. Se abre en `http://127.0.0.1:5500`

**Opción B — servidor de Node.js:**

```bash
npx serve .
# Abre http://localhost:3000
```

**Opción C — Python (si lo tienes instalado):**

```bash
python -m http.server 8080
# Abre http://localhost:8080
```

### 5. Flujo de trabajo típico

Abre dos terminales en paralelo:

```bash
# Terminal 1 — compilación en watch
npm run dev

# Terminal 2 — Live Server o serve
npx serve .
```

Cada vez que guardes un `.ts`, `tsc` recompila y el navegador recarga automáticamente (si usas Live Server).

---

## Pruebas

El proyecto usa [Vitest](https://vitest.dev) con entorno `happy-dom` para simular el DOM sin navegador.

### Ejecutar las pruebas

```bash
# Correr todas las pruebas una vez
npm test

# Modo watch: re-ejecuta al guardar
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

### Qué se prueba

| Archivo | Función | Casos cubiertos |
| --- | --- | --- |
| `db.test.ts` | `dk()` | Formato YYYY-MM-DD, ceros a la izquierda, bordes de año |
| `app.test.ts` | `escHtml()` | Escape de `<`, `>`, `&` y texto plano |
| `app.test.ts` | `validateExerciseInput()` | Nombre vacío/largo, peso negativo/inválido, series=0, reps vacías, formato de tiempo |
| `app.test.ts` | `isPR()` | Sin historial, nuevo PR, no supera máximo, iguala máximo, ignora fechas posteriores, case-insensitive |

### Estructura de un test

```typescript
// src/__tests__/app.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Supabase se mockea para aislar la lógica de negocio
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

import { validateExerciseInput } from '../app.js';

describe('validateExerciseInput', () => {
  it('retorna error cuando el nombre está vacío', () => {
    const errs = validateExerciseInput('', 80, 3, '10');
    expect(errs).toHaveLength(1);
  });
});
```

### Agregar nuevas pruebas

Crea archivos con extensión `.test.ts` dentro de `src/` o `src/__tests__/`. Vitest los detecta automáticamente según la configuración en [vitest.config.ts](vitest.config.ts).

---

## Deploy en GitHub Pages

El proyecto se despliega automáticamente al hacer push a `main` via GitHub Actions.

### Requisitos previos

**1. Habilitar GitHub Pages con Actions:**
> Repo → Settings → Pages → Source: **GitHub Actions**

**2. Agregar los secrets de Supabase:**
> Repo → Settings → Secrets and variables → Actions → New repository secret

| Secret | Valor |
| --- | --- |
| `SUPABASE_URL` | URL de tu proyecto (ej: `https://abc123.supabase.co`) |
| `SUPABASE_ANON_KEY` | Anon/public key de Supabase |

**3. Push a `main`** — el workflow compila el TypeScript, inyecta las credenciales y publica automáticamente.

---

## Base de datos (Supabase)

El proyecto requiere las siguientes tablas. Puedes crearlas desde el editor SQL de Supabase.

### `profiles`

| Columna | Tipo |
| --- | --- |
| `id` | uuid (FK → auth.users) |
| `name` | text |
| `color` | text |
| `created_at` | timestamptz |

### `gym_sessions`

| Columna | Tipo |
| --- | --- |
| `id` | uuid |
| `user_id` | uuid (FK → auth.users) |
| `date` | date |
| `exercises` | jsonb |
| `updated_at` | timestamptz |

### `body_metrics`

| Columna | Tipo |
| --- | --- |
| `id` | uuid |
| `user_id` | uuid (FK → auth.users) |
| `date` | date |
| `weight` | numeric |
| `weight_unit` | text |
| `fat_pct` | numeric |
| `muscle_pct` | numeric |

### `hiit_sessions`

| Columna | Tipo |
| --- | --- |
| `id` | uuid |
| `user_id` | uuid (FK → auth.users) |
| `date` | date |
| `name` | text |
| `rounds` | integer |
| `duration` | text |
| `notes` | text |
| `rpe` | integer |
| `exercises` | jsonb |
| `updated_at` | timestamptz |

Habilita **Row Level Security (RLS)** en todas las tablas con políticas que restrinjan el acceso a `auth.uid() = user_id`.

---

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run dev` | Compilación en modo watch |
| `npm run type-check` | Verifica tipos sin emitir archivos |
| `npm run clean` | Elimina la carpeta `dist/` |
| `npm run lint` | Analiza el código con ESLint |
| `npm run lint:fix` | Corrige errores de lint automáticamente |
| `npm test` | Ejecuta las pruebas una vez |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run test:coverage` | Pruebas con reporte de cobertura |
