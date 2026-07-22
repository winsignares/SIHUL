# Frontend SIHUL — estructura y stack (`frontend/`)

React 19.1.1 + TypeScript + Vite 7. No es Next.js: el enrutamiento es explícito (`react-router-dom` v7), no basado en archivos.

## Stack de UI

- Radix UI (primitives) + Tailwind CSS v4 + `lucide-react` (iconos) + `class-variance-authority`/`tailwind-merge` (patrón tipo shadcn).
- `recharts` (gráficos), `motion` (animaciones), `sonner` (toasts).
- `jspdf` / `html2canvas` / `xlsx` — exportación de reportes.

## Estructura (`frontend/src/`)

```
assets/       → imágenes y CSS global (globals.css)
components/   → common/, espacios/, horarios/, notificaciones/
config/       → componentRoutes.ts (mapeo componente → ruta/ícono)
context/      → AuthContext.tsx, UserContext.tsx, ThemeContext.tsx,
                NotificacionesContext.tsx, roleUtils.ts, financialRoleUtils.ts
core/         → apiClient.ts, endpoints.ts, backendUrl.ts, errorHandler.ts,
                sessionCache.ts, apiActivity.ts
hooks/        → organizados por dominio (ver HOOKS_INDICE.md)
layouts/      → AdminDashboard.tsx (layout compartido con sidebar)
models/       → tipos TS por dominio (academica, auth, chatbot, dashboard,
                espacios, financiero, horarios, prestamos, recursos,
                reporte, shared, users)
pages/        → páginas por dominio (ver PAGINAS_INDICE.md)
router/       → AppRouter.tsx (única fuente de rutas)
services/     → clientes API por dominio (ver SERVICES_INDICE.md)
utils/, share/ → utilidades varias
```

## Documentos relacionados en esta carpeta

- [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md) — `AuthContext`, `componentRoutes.ts`, `AppRouter.tsx`.
- [PAGINAS_INDICE.md](PAGINAS_INDICE.md) — páginas por dominio.
- [HOOKS_INDICE.md](HOOKS_INDICE.md) — hooks por dominio, patrón de cache, hooks transversales.
- [SERVICES_INDICE.md](SERVICES_INDICE.md) — clientes API por dominio, `core/` base, deuda técnica legacy.
- [RESPONSIVE_UPDATES.md](RESPONSIVE_UPDATES.md) — migración a diseño responsive (hook `useIsMobile`, 39 páginas actualizadas).
- [RESUMEN_NOTIFICACIONES.md](RESUMEN_NOTIFICACIONES.md) — implementación del sistema de notificaciones en el frontend (contexto, polling, endpoints consumidos).
