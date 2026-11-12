# Frontend SIHUL — estructura y stack (`frontend/`)

React 19.1.1 + TypeScript + Vite 7. No es Next.js: el enrutamiento es explícito (`react-router-dom` v7), no basado en archivos.

## Stack de UI

- Radix UI (primitives) + Tailwind CSS v4 + `lucide-react` (iconos) + `class-variance-authority`/`tailwind-merge` (patrón tipo shadcn).
- `recharts` (gráficos), `motion` (animaciones), `sonner` (toasts).
- `jspdf` / `html2canvas` / `xlsx` — exportación de reportes.

## Estructura (`frontend/src/`)

El código de cada dominio vive junto, en `features/`; lo transversal queda en la raíz de `src/`.

```
features/<dominio>/
  hooks/  components/  pages/  services/  models/
      → financiero, espacios, horarios, prestamos, reporte, chatbot,
        dashboard, users, permisos y gestionAcademica
        (gestionAcademica incluye los servicios de asignaturas, facultades,
        grupos, periodos y programas)
components/
  ui/       → componentes base (botón, tarjeta, tabla, diálogo, etc.)
  common/, public/, ErrorBoundary.tsx
assets/     → imágenes y CSS global (globals.css)
config/     → componentRoutes.ts (mapeo componente → ruta/ícono)
context/    → AuthContext, UserContext, ThemeContext, NotificacionesContext,
              roleUtils.ts, financialRoleUtils.ts
core/       → apiClient.ts, backendUrl.ts, errorHandler.ts, sessionCache.ts,
              apiActivity.ts
hooks/      → hooks transversales (useIsMobile, useSondeoVisible…)
layouts/    → AdminDashboard.tsx (layout compartido con sidebar)
models/     → index.ts (reexporta los tipos) y los modelos transversales
router/     → AppRouter.tsx (única fuente de rutas)
services/   → clientes transversales (auth, seccionales, sedes, componentes,
              notificaciones, recursos)
utils/
```

> Los documentos de hooks, páginas y servicios de esta carpeta se escribieron cuando el código estaba repartido por tipo: donde dicen `hooks/<dominio>/`, `pages/<dominio>/`, `services/<dominio>/` o `models/<dominio>/`, hoy es `features/<dominio>/hooks/`, `pages/`, `services/` o `models/`. Lo que antes estaba en `share/` está en `components/ui/` (lo propio de facturas, en `features/financiero/components/`).

## Documentos relacionados en esta carpeta

- [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md) — `AuthContext`, `componentRoutes.ts`, `AppRouter.tsx`.
- [PAGINAS_INDICE.md](PAGINAS_INDICE.md) — páginas por dominio.
- [HOOKS_INDICE.md](HOOKS_INDICE.md) — hooks por dominio, patrón de cache, hooks transversales.
- [SERVICES_INDICE.md](SERVICES_INDICE.md) — clientes API por dominio, `core/` base, deuda técnica legacy.
- [RESPONSIVE_UPDATES.md](RESPONSIVE_UPDATES.md) — migración a diseño responsive (hook `useIsMobile`, 39 páginas actualizadas).
- [RESUMEN_NOTIFICACIONES.md](RESUMEN_NOTIFICACIONES.md) — implementación del sistema de notificaciones en el frontend (contexto, polling, endpoints consumidos).
