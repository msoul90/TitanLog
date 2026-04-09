# IronLog

App de fitness para registrar entrenamientos de fuerza, sesiones HIIT y composición corporal.
Frontend en TypeScript con Vite, backend/auth en Supabase y despliegue automático en GitHub Pages.

---

## Funcionalidades

- Gym diario con ejercicios, peso, series y repeticiones.
- Detección automática de récord personal (PR).
- HIIT con temporizador, rondas, duración, RPE y ejercicios por sesión.
- Composición corporal: peso, % grasa y % músculo con historial.
- Progreso: racha, días entrenados, PRs y exportación.
- Calendario mensual con detalle por día (Gym + HIIT).
- Guías de ejercicios con buscador y modal de ayuda.
- Perfiles, tema oscuro/claro y sincronización por usuario.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript 5 |
| Build/Dev server | Vite 8 |
| Backend/Auth | Supabase JS v2 |
| Testing | Vitest + happy-dom |
| Estilos | CSS propio (`css/app.css`) |
| Deploy | GitHub Pages + GitHub Actions |

---

## Estructura del proyecto

```text
.
├── src/
│   ├── app.ts
│   ├── calendar.ts
│   ├── db.ts
│   ├── guides.ts
│   ├── gym.ts
│   ├── hiit.ts
│   ├── main.ts
│   ├── progress.ts
│   ├── types.ts
│   └── __tests__/
│       ├── app.test.ts
│       ├── calendar.test.ts
│       ├── db.test.ts
│       ├── guides.test.ts
│       ├── gym.test.ts
│       ├── hiit.test.ts
│       ├── main.test.ts
│       ├── progress.test.ts
│       └── types.test.ts
├── css/
│   └── app.css
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── _site/                    # salida de build para Pages
└── .github/workflows/deploy.yml
```

---

## Desarrollo local

### Requisitos

- Node.js 18+ (recomendado 20+).
- Proyecto de Supabase activo.

### 1) Instalar dependencias

```bash
npm install
```

### 2) Configurar Supabase

En `src/db.ts` reemplaza estos placeholders:

```ts
const SUPABASE_URL: string = 'https://TU_PROJECT_ID.supabase.co';
const SUPABASE_ANON: string = 'TU_ANON_PUBLIC_KEY';
```

Valores en Supabase: `Settings -> API`.

### 3) Levantar en modo desarrollo

```bash
npm run dev
```

Vite abrirá la app en `http://localhost:5173` (o el puerto disponible que indique consola).

### 4) Build de producción

```bash
npm run build
```

La salida queda en `_site/` (configurado en `vite.config.ts`).

---

## Pruebas

```bash
npm test
npm run test:watch
npm run test:coverage
```

La suite actual cubre módulos de Gym, HIIT, calendario, progreso, guías, db, tipos y bootstrap principal.

---

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm run build` | Build de producción a `_site/` |
| `npm run clean` | Elimina `_site/` |
| `npm run type-check` | Verifica tipos TypeScript |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige lint automáticamente |
| `npm test` | Ejecuta tests una vez |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con cobertura |
| `npm run deploy` | Publica `_site/` con gh-pages |

---

## Deploy en GitHub Pages

El workflow `deploy.yml` publica automáticamente al hacer push a `main`.

### Secrets requeridos

Configura estos secrets en el repo:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

El workflow inyecta esos valores en `src/db.ts`, ejecuta build y publica `_site/` en Pages.

> Nota: la base pública para Pages está en `vite.config.ts` (`base: '/TitanLog/'`).

---

## Modelo de datos (Supabase)

Tablas requeridas:

- `profiles`
- `gym_sessions`
- `body_metrics`
- `hiit_sessions`

Activa RLS y aplica políticas para aislar datos por usuario (`auth.uid() = user_id`).
