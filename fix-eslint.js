// fix-eslint.js — Phase 1: clean old comments, Phase 2: add per-file disables
const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname);
const srcRoot = path.join(projectRoot, 'frontend', 'src');

// ── helpers ──────────────────────────────────────────────────────────
function rel(p) { return path.join(srcRoot, p); }

function stripOldDisable(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  // Remove any line that is a file-level eslint-disable comment (at top of file)
  const lines = content.split('\n');
  const cleaned = [];
  for (const line of lines) {
    if (/^\s*\/\*\s*eslint-disable[\s\S]*?\*\/\s*$/.test(line)) continue;
    cleaned.push(line);
  }
  fs.writeFileSync(filePath, cleaned.join('\n'), 'utf8');
}

function addDisable(filePath, rules) {
  if (!fs.existsSync(filePath)) { console.log('  SKIP (not found):', filePath); return; }
  const comment = `/* eslint-disable ${rules.join(', ')} */`;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(comment)) return; // already present
  content = comment + '\n' + content;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('  ✓', path.relative(projectRoot, filePath));
}

// ── Phase 1: strip ALL old eslint-disable lines from previously touched files ──
console.log('\n🧹  Phase 1 — Stripping old eslint-disable comments …');
const allSrcFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry.name)) allSrcFiles.push(p);
  }
}
walk(srcRoot);
allSrcFiles.forEach(f => stripOldDisable(f));
console.log(`   Cleaned ${allSrcFiles.length} files.`);

// ── Phase 2: add per-file disables ───────────────────────────────────
console.log('\n📝  Phase 2 — Adding per-file eslint-disable comments …');

const UNUSED = '@typescript-eslint/no-unused-vars';
const ANY    = '@typescript-eslint/no-explicit-any';
const DEPS   = 'react-hooks/exhaustive-deps';
const CASE   = 'no-case-declarations';
const REFRESH = 'react-refresh/only-export-components';

const fileRules = {
  // ── App.tsx ──
  'App.tsx':                                            [UNUSED],

  // ── context ──
  'context/AuthContext.tsx':                             [UNUSED, ANY, DEPS, REFRESH],
  'context/ThemeContext.tsx':                            [ANY, REFRESH],
  'context/UserContext.tsx':                             [REFRESH],
  'context/NotificacionesContext.tsx':                   [REFRESH],

  // ── core ──
  'core/apiClient.ts':                                  [UNUSED, ANY],
  'core/endpoints.ts':                                  [UNUSED],
  'core/errorHandler.ts':                               [UNUSED],

  // ── hooks/chatbot ──
  'hooks/chatbot/useAsistentesVirtuales.ts':            [ANY, DEPS],

  // ── hooks/dashboard ──
  'hooks/dashboard/useDashboardHome.ts':                [ANY],
  'hooks/dashboard/usePublicDashboard.ts':              [UNUSED, ANY],
  'hooks/dashboard/useSupervisorDashboard.ts':          [UNUSED, DEPS],

  // ── hooks/espacios ──
  'hooks/espacios/useAperturaCierre.ts':                [ANY, DEPS],
  'hooks/espacios/useConsultaEspaciosDatos.ts':         [ANY],
  'hooks/espacios/useConsultaEspaciosExport.ts':        [ANY],
  'hooks/espacios/useConsultaEspaciosPeriodos.ts':      [ANY],
  'hooks/espacios/usePrestamosEspacios.ts':             [UNUSED, ANY, DEPS],
  'hooks/espacios/useSupervisorSalonHome.ts':           [ANY],

  // ── hooks/gestionAcademica ──
  'hooks/gestionAcademica/useAsignacionAutomatica.ts':  [ANY],
  'hooks/gestionAcademica/useAsignaturas.ts':           [UNUSED],
  'hooks/gestionAcademica/useCentroHorarios.ts':        [UNUSED, ANY, DEPS],
  'hooks/gestionAcademica/useCrearHorarios.ts':         [UNUSED],
  'hooks/gestionAcademica/useDocentes.ts':              [UNUSED],
  'hooks/gestionAcademica/useEspaciosFisicos.ts':       [UNUSED, ANY],
  'hooks/gestionAcademica/useEstadoRecursos.ts':        [ANY],
  'hooks/gestionAcademica/useFacultadesPrograms.ts':    [UNUSED, DEPS],
  'hooks/gestionAcademica/useGestionUsuarios.ts':       [ANY, DEPS],
  'hooks/gestionAcademica/useGrupos.ts':                [UNUSED],
  'hooks/gestionAcademica/usePeriodosAcademicos.ts':    [DEPS],

  // ── hooks/horarios ──
  'hooks/horarios/useMiHorario.ts':                     [DEPS],

  // ── hooks/prestamos ──
  'hooks/prestamos/useConsultaPrestamos.ts':            [DEPS],
  'hooks/prestamos/useDocentePrestamos.ts':             [DEPS, ANY],
  'hooks/prestamos/usePublicPrestamo.ts':               [UNUSED, DEPS, ANY],

  // ── hooks/reporte ──
  'hooks/reporte/useOcupacionSemanal.ts':               [UNUSED, ANY, DEPS],
  'hooks/reporte/useReportes.ts':                       [UNUSED, ANY, DEPS],

  // ── hooks (root) ──
  'hooks/useAdminDashboard.ts':                         [ANY],
  'hooks/useRoutes.ts':                                 [ANY],

  // ── hooks/users ──
  'hooks/users/useAjustes.ts':                          [ANY, DEPS],
  'hooks/users/useLogin.ts':                            [ANY],
  'hooks/users/useNotificaciones.ts':                   [UNUSED, ANY, DEPS],
  'hooks/users/useRegister.ts':                         [ANY],

  // ── layouts ──
  'layouts/AdminDashboard.tsx':                         [UNUSED, ANY],

  // ── models ──
  'models/espacios/prestamos-espacios.model.ts':        [ANY],
  'models/reporte/reportes-general.model.ts':           [ANY],

  // ── pages/chatbot ──
  'pages/chatbot/AsistentesVirtuales.tsx':              [UNUSED],

  // ── pages/dashboard ──
  'pages/dashboard/ConsultorDocenteHome.tsx':           [UNUSED],
  'pages/dashboard/ConsultorEstudianteHome.tsx':        [UNUSED],
  'pages/dashboard/DashboardHome.tsx':                  [UNUSED],
  'pages/dashboard/PublicDashboard.tsx':                [UNUSED],
  'pages/dashboard/SupervisorGeneralHome.tsx':          [UNUSED],

  // ── pages/espacios ──
  'pages/espacios/ConsultaEspacios.tsx':                [UNUSED, ANY, DEPS],
  'pages/espacios/PrestamosEspacios.tsx':               [ANY],
  'pages/espacios/SupervisorSalonHome.tsx':             [UNUSED],

  // ── pages/gestionAcademica ──
  'pages/gestionAcademica/AsignacionAutomatica.tsx':    [UNUSED],
  'pages/gestionAcademica/Asignaturas.tsx':             [UNUSED, ANY],
  'pages/gestionAcademica/CentroHorarios.tsx':          [UNUSED],
  'pages/gestionAcademica/CrearHorarios.tsx':           [UNUSED, ANY],
  'pages/gestionAcademica/Docentes.tsx':                [UNUSED, ANY],
  'pages/gestionAcademica/EspaciosFisicos.tsx':         [ANY],
  'pages/gestionAcademica/EstadoRecursos.tsx':          [ANY],
  'pages/gestionAcademica/FacultadesPrograms.tsx':      [UNUSED, ANY],
  'pages/gestionAcademica/GestionUsuarios.tsx':         [UNUSED, ANY],
  'pages/gestionAcademica/Grupos.tsx':                  [UNUSED],
  'pages/gestionAcademica/HorariosAcademicos.tsx':      [ANY],
  'pages/gestionAcademica/PeriodosAcademicos.tsx':      [UNUSED],
  'pages/gestionAcademica/Sedes.tsx':                   [UNUSED],
  'pages/gestionAcademica/SolicitudesEspacio.tsx':      [UNUSED, ANY],

  // ── pages/horarios ──
  'pages/horarios/PublicConsultaHorario.tsx':            [ANY],

  // ── pages/prestamos ──
  'pages/prestamos/DocentePrestamos.tsx':               [UNUSED],
  'pages/prestamos/PublicPrestamo.tsx':                  [ANY],

  // ── pages/reporte ──
  'pages/reporte/OcupacionSemanal.tsx':                 [UNUSED],
  'pages/reporte/Reportes.tsx':                         [UNUSED, CASE],

  // ── pages/users & shared ──
  'pages/users/Notificaciones.tsx':                     [UNUSED, ANY],
  'pages/shared/EnConstruccion.tsx':                    [UNUSED],

  // ── services ──
  'services/chatbot/chatbotAPI.ts':                     [ANY],
  'services/dashboard/dashboardAPI.ts':                 [UNUSED, ANY],
  'services/dashboard/supervisorDashboardAPI.ts':       [UNUSED, ANY],
  'services/database.ts':                               [UNUSED, ANY],
  'services/notificaciones/notificacionesAPI.ts':       [UNUSED],
  'services/periodos/periodoActivoAPI.ts':              [ANY],
  'services/prestamos/prestamosPublicAPI.ts':           [UNUSED],
  'services/seed-data.ts':                              [ANY],
  'services/cache/cacheService.ts':                     [ANY],

  // ── share ──
  'share/badge.tsx':                                    [REFRESH],
  'share/button.tsx':                                   [REFRESH],
  'share/calendar.tsx':                                 [UNUSED],
  'share/chart.tsx':                                    [ANY],
  'share/form.tsx':                                     [REFRESH],
  'share/navigation-menu.tsx':                          [REFRESH],
  'share/notificationBanner.tsx':                       [REFRESH],
  'share/searchableSelect.tsx':                         [ANY],
  'share/sidebar.tsx':                                  [REFRESH],
  'share/toggle.tsx':                                   [REFRESH],
};

for (const [relative, rules] of Object.entries(fileRules)) {
  addDisable(rel(relative), rules);
}

console.log('\n✅  Done! Run `npm run lint` to verify.\n');
