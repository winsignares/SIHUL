// ============================================
// SISTEMA DE BASE DE DATOS LOCAL
// Simula una base de datos real usando localStorage
// ============================================

import type {
  Usuario, Facultad, Programa, PeriodoAcademico, Asignatura,
  Grupo, EspacioFisico, HorarioAcademico, PrestamoEspacio,
  RecursoAudiovisual, PrestamoRecurso, Notificacion, MensajeChat, Sede, Docente
} from '../models';

// Tablas de la base de datos
const TABLES = {
  sedes: 'db_sedes',
  usuarios: 'db_usuarios',
  facultades: 'db_facultades',
  programas: 'db_programas',
  periodos: 'db_periodos',
  asignaturas: 'db_asignaturas',
  grupos: 'db_grupos',
  espacios: 'db_espacios',
  horarios: 'db_horarios',
  prestamosEspacios: 'db_prestamos_espacios',
  recursosAudiovisuales: 'db_recursos_audiovisuales',
  prestamosRecursos: 'db_prestamos_recursos',
  notificaciones: 'db_notificaciones',
  mensajes: 'db_mensajes',
  docentes: 'db_docentes',
  sesion: 'db_sesion_activa'
} as const;

class Database {
  // ============================================
  // MÉTODOS GENÉRICOS CRUD
  // ============================================

  private getTable<T>(tableName: string): T[] {
    const data = localStorage.getItem(tableName);
    return data ? JSON.parse(data) : [];
  }

  private setTable<T>(tableName: string, data: T[]): void {
    localStorage.setItem(tableName, JSON.stringify(data));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // CREATE
  create<T extends { id: string }>(tableName: string, item: Omit<T, 'id'>): T {
    const table = this.getTable<T>(tableName);
    const newItem = { ...item, id: this.generateId() } as T;
    table.push(newItem);
    this.setTable(tableName, table);
    return newItem;
  }

  // READ ALL
  getAll<T>(tableName: string): T[] {
    return this.getTable<T>(tableName);
  }

  // READ ONE
  getById<T extends { id: string }>(tableName: string, id: string): T | undefined {
    const table = this.getTable<T>(tableName);
    return table.find(item => item.id === id);
  }

  // READ WITH FILTER
  find<T>(tableName: string, predicate: (item: T) => boolean): T[] {
    const table = this.getTable<T>(tableName);
    return table.filter(predicate);
  }

  // READ ONE WITH FILTER
  findOne<T>(tableName: string, predicate: (item: T) => boolean): T | undefined {
    const table = this.getTable<T>(tableName);
    return table.find(predicate);
  }

  // UPDATE
  update<T extends { id: string }>(tableName: string, id: string, updates: Partial<T>): T | null {
    const table = this.getTable<T>(tableName);
    const index = table.findIndex(item => item.id === id);

    if (index === -1) return null;

    table[index] = { ...table[index], ...updates };
    this.setTable(tableName, table);
    return table[index];
  }

  // DELETE
  delete(tableName: string, id: string): boolean {
    const table = this.getTable(tableName);
    const filtered = table.filter((item: any) => item.id !== id);

    if (filtered.length === table.length) return false;

    this.setTable(tableName, filtered);
    return true;
  }

  // DELETE MULTIPLE
  deleteMany(tableName: string, predicate: (item: any) => boolean): number {
    const table = this.getTable(tableName);
    const filtered = table.filter(item => !predicate(item));
    const deletedCount = table.length - filtered.length;

    if (deletedCount > 0) {
      this.setTable(tableName, filtered);
    }

    return deletedCount;
  }

  // ============================================
  // MÉTODOS ESPECÍFICOS POR TABLA
  // ============================================

  // SEDES
  getSedes(): Sede[] {
    return this.getAll<Sede>(TABLES.sedes);
  }

  getSedeById(id: string): Sede | undefined {
    return this.getById<Sede>(TABLES.sedes, id);
  }

  createSede(sede: Omit<Sede, 'id'>): Sede {
    return this.create<Sede>(TABLES.sedes, sede);
  }

  updateSede(id: string, updates: Partial<Sede>): Sede | null {
    return this.update<Sede>(TABLES.sedes, id, updates);
  }

  deleteSede(id: string): boolean {
    return this.delete(TABLES.sedes, id);
  }

  // USUARIOS
  getUsuarios(): Usuario[] {
    return this.getAll<Usuario>(TABLES.usuarios);
  }

  getUsuarioByEmail(email: string): Usuario | undefined {
    return this.findOne<Usuario>(TABLES.usuarios, u => u.email === email);
  }

  createUsuario(usuario: Omit<Usuario, 'id'>): Usuario {
    return this.create<Usuario>(TABLES.usuarios, usuario);
  }

  updateUsuario(id: string, updates: Partial<Usuario>): Usuario | null {
    return this.update<Usuario>(TABLES.usuarios, id, updates);
  }

  deleteUsuario(id: string): boolean {
    return this.delete(TABLES.usuarios, id);
  }

  // FACULTADES
  getFacultades(): Facultad[] {
    return this.getAll<Facultad>(TABLES.facultades);
  }

  getFacultadById(id: string): Facultad | undefined {
    return this.getById<Facultad>(TABLES.facultades, id);
  }

  createFacultad(facultad: Omit<Facultad, 'id'>): Facultad {
    return this.create<Facultad>(TABLES.facultades, facultad);
  }

  updateFacultad(id: string, updates: Partial<Facultad>): Facultad | null {
    return this.update<Facultad>(TABLES.facultades, id, updates);
  }

  deleteFacultad(id: string): boolean {
    // También eliminar programas relacionados
    this.deleteMany(TABLES.programas, (p: Programa) => p.facultadId === id);
    return this.delete(TABLES.facultades, id);
  }

  // PROGRAMAS
  getProgramas(): Programa[] {
    return this.getAll<Programa>(TABLES.programas);
  }

  getProgramasByFacultad(facultadId: string): Programa[] {
    return this.find<Programa>(TABLES.programas, p => p.facultadId === facultadId);
  }

  getProgramaById(id: string): Programa | undefined {
    return this.getById<Programa>(TABLES.programas, id);
  }

  createPrograma(programa: Omit<Programa, 'id'>): Programa {
    return this.create<Programa>(TABLES.programas, programa);
  }

  updatePrograma(id: string, updates: Partial<Programa>): Programa | null {
    return this.update<Programa>(TABLES.programas, id, updates);
  }

  deletePrograma(id: string): boolean {
    // También eliminar asignaturas relacionadas
    this.deleteMany(TABLES.asignaturas, (a: Asignatura) => a.programaId === id);
    return this.delete(TABLES.programas, id);
  }

  // PERIODOS ACADÉMICOS
  getPeriodos(): PeriodoAcademico[] {
    return this.getAll<PeriodoAcademico>(TABLES.periodos);
  }

  getPeriodoActivo(): PeriodoAcademico | undefined {
    return this.findOne<PeriodoAcademico>(TABLES.periodos, p => p.activo);
  }

  createPeriodo(periodo: Omit<PeriodoAcademico, 'id'>): PeriodoAcademico {
    return this.create<PeriodoAcademico>(TABLES.periodos, periodo);
  }

  updatePeriodo(id: string, updates: Partial<PeriodoAcademico>): PeriodoAcademico | null {
    return this.update<PeriodoAcademico>(TABLES.periodos, id, updates);
  }

  deletePeriodo(id: string): boolean {
    return this.delete(TABLES.periodos, id);
  }

  // ASIGNATURAS
  getAsignaturas(): Asignatura[] {
    return this.getAll<Asignatura>(TABLES.asignaturas);
  }

  getAsignaturasByPrograma(programaId: string): Asignatura[] {
    return this.find<Asignatura>(TABLES.asignaturas, a => a.programaId === programaId);
  }

  createAsignatura(asignatura: Omit<Asignatura, 'id'>): Asignatura {
    return this.create<Asignatura>(TABLES.asignaturas, asignatura);
  }

  updateAsignatura(id: string, updates: Partial<Asignatura>): Asignatura | null {
    return this.update<Asignatura>(TABLES.asignaturas, id, updates);
  }

  deleteAsignatura(id: string): boolean {
    return this.delete(TABLES.asignaturas, id);
  }

  // GRUPOS
  getGrupos(): Grupo[] {
    return this.getAll<Grupo>(TABLES.grupos);
  }

  getGruposByPeriodo(periodoId: string): Grupo[] {
    return this.find<Grupo>(TABLES.grupos, g => g.periodoId === periodoId);
  }

  createGrupo(grupo: Omit<Grupo, 'id'>): Grupo {
    return this.create<Grupo>(TABLES.grupos, grupo);
  }

  updateGrupo(id: string, updates: Partial<Grupo>): Grupo | null {
    return this.update<Grupo>(TABLES.grupos, id, updates);
  }

  deleteGrupo(id: string): boolean {
    return this.delete(TABLES.grupos, id);
  }

  // DOCENTES
  getDocentes(): any[] {
    return this.getAll<any>(TABLES.docentes);
  }

  getDocenteById(id: string): any | undefined {
    return this.getById<any>(TABLES.docentes, id);
  }

  createDocente(docente: any): any {
    return this.create<any>(TABLES.docentes, docente);
  }

  updateDocente(id: string, updates: any): any | null {
    return this.update<any>(TABLES.docentes, id, updates);
  }

  deleteDocente(id: string): boolean {
    return this.delete(TABLES.docentes, id);
  }

  // ESPACIOS FÍSICOS
  getEspacios(): EspacioFisico[] {
    return this.getAll<EspacioFisico>(TABLES.espacios);
  }

  getEspacioById(id: string): EspacioFisico | undefined {
    return this.getById<EspacioFisico>(TABLES.espacios, id);
  }

  createEspacio(espacio: Omit<EspacioFisico, 'id'>): EspacioFisico {
    return this.create<EspacioFisico>(TABLES.espacios, espacio);
  }

  updateEspacio(id: string, updates: Partial<EspacioFisico>): EspacioFisico | null {
    return this.update<EspacioFisico>(TABLES.espacios, id, updates);
  }

  deleteEspacio(id: string): boolean {
    return this.delete(TABLES.espacios, id);
  }

  // HORARIOS
  getHorarios(): HorarioAcademico[] {
    return this.getAll<HorarioAcademico>(TABLES.horarios);
  }

  getHorariosExtendidos(): any[] {
    const horarios = this.getAll<HorarioAcademico>(TABLES.horarios);
    const grupos = this.getGrupos();
    const asignaturas = this.getAsignaturas();
    const programas = this.getProgramas();
    const espacios = this.getEspacios();

    return horarios.map(horario => {
      const grupo = grupos.find(g => g.id === horario.grupoId);
      const asignatura = asignaturas.find(a => a.id === grupo?.asignaturaId);
      const programa = programas.find(p => p.id === grupo?.programaId);
      const espacio = espacios.find(e => e.id === horario.espacioId);

      return {
        ...horario,
        asignatura: asignatura?.nombre || 'Sin asignatura',
        docente: grupo?.docente || 'Sin docente',
        grupo: grupo?.codigo || 'Sin grupo',
        programaId: programa?.id || '',
        semestre: grupo?.semestre || 1,
        espacioCodigo: espacio?.codigo || '',
        espacioNombre: espacio?.nombre || ''
      };
    });
  }

  getHorariosByEspacio(espacioId: string): HorarioAcademico[] {
    return this.find<HorarioAcademico>(TABLES.horarios, h => h.espacioId === espacioId);
  }

  getHorariosByGrupo(grupoId: string): HorarioAcademico[] {
    return this.find<HorarioAcademico>(TABLES.horarios, h => h.grupoId === grupoId);
  }

  createHorario(horario: Omit<HorarioAcademico, 'id'>): HorarioAcademico {
    return this.create<HorarioAcademico>(TABLES.horarios, horario);
  }

  addHorario(horario: any): HorarioAcademico {
    // Alias para createHorario para compatibilidad
    return this.create<HorarioAcademico>(TABLES.horarios, horario);
  }

  updateHorario(id: string, updates: Partial<HorarioAcademico>): HorarioAcademico | null {
    return this.update<HorarioAcademico>(TABLES.horarios, id, updates);
  }

  deleteHorario(id: string): boolean {
    return this.delete(TABLES.horarios, id);
  }

  // Limpiar todos los horarios
  clearAllHorarios(): number {
    const horarios = this.getAll<HorarioAcademico>(TABLES.horarios);
    const count = horarios.length;
    this.setTable(TABLES.horarios, []);
    return count;
  }

  // PRÉSTAMOS DE ESPACIOS
  createPrestamo(prestamo: Omit<PrestamoEspacio, 'id'>): PrestamoEspacio {
    return this.create<PrestamoEspacio>(TABLES.prestamosEspacios, prestamo);
  }

  getPrestamosEspacios(): PrestamoEspacio[] {
    return this.getAll<PrestamoEspacio>(TABLES.prestamosEspacios);
  }

  updatePrestamoEspacio(id: string, updates: Partial<PrestamoEspacio>): PrestamoEspacio | null {
    return this.update<PrestamoEspacio>(TABLES.prestamosEspacios, id, updates);
  }

  // RECURSOS AUDIOVISUALES
  getRecursosAudiovisuales(): RecursoAudiovisual[] {
    return this.getAll<RecursoAudiovisual>(TABLES.recursosAudiovisuales);
  }

  createRecursoAudiovisual(recurso: Omit<RecursoAudiovisual, 'id'>): RecursoAudiovisual {
    return this.create<RecursoAudiovisual>(TABLES.recursosAudiovisuales, recurso);
  }

  updateRecursoAudiovisual(id: string, updates: Partial<RecursoAudiovisual>): RecursoAudiovisual | null {
    return this.update<RecursoAudiovisual>(TABLES.recursosAudiovisuales, id, updates);
  }

  deleteRecursoAudiovisual(id: string): boolean {
    return this.delete(TABLES.recursosAudiovisuales, id);
  }

  // PRÉSTAMOS DE RECURSOS
  getPrestamosRecursos(): PrestamoRecurso[] {
    return this.getAll<PrestamoRecurso>(TABLES.prestamosRecursos);
  }

  createPrestamoRecurso(prestamo: Omit<PrestamoRecurso, 'id'>): PrestamoRecurso {
    return this.create<PrestamoRecurso>(TABLES.prestamosRecursos, prestamo);
  }

  updatePrestamoRecurso(id: string, updates: Partial<PrestamoRecurso>): PrestamoRecurso | null {
    return this.update<PrestamoRecurso>(TABLES.prestamosRecursos, id, updates);
  }

  // NOTIFICACIONES
  getNotificaciones(): Notificacion[] {
    return this.getAll<Notificacion>(TABLES.notificaciones);
  }

  getNotificacionesByUsuario(usuarioId: string): Notificacion[] {
    return this.find<Notificacion>(TABLES.notificaciones, n => n.usuarioId === usuarioId);
  }

  createNotificacion(notificacion: Omit<Notificacion, 'id'>): Notificacion {
    return this.create<Notificacion>(TABLES.notificaciones, notificacion);
  }

  marcarNotificacionLeida(id: string): boolean {
    const result = this.update<Notificacion>(TABLES.notificaciones, id, { leida: true });
    return result !== null;
  }

  // MENSAJES
  getMensajes(): MensajeChat[] {
    return this.getAll<MensajeChat>(TABLES.mensajes);
  }

  getMensajesByUsuario(usuarioId: string): MensajeChat[] {
    return this.find<MensajeChat>(
      TABLES.mensajes,
      m => m.remitenteId === usuarioId || m.destinatarioId === usuarioId
    );
  }

  createMensaje(mensaje: Omit<MensajeChat, 'id'>): MensajeChat {
    return this.create<MensajeChat>(TABLES.mensajes, mensaje);
  }

  // SESIÓN
  setSesionActiva(usuario: Usuario): void {
    localStorage.setItem(TABLES.sesion, JSON.stringify(usuario));
  }

  getSesionActiva(): Usuario | null {
    const data = localStorage.getItem(TABLES.sesion);
    return data ? JSON.parse(data) : null;
  }

  cerrarSesion(): void {
    localStorage.removeItem(TABLES.sesion);
  }

  // LIMPIAR TODA LA BASE DE DATOS
  clearDatabase(): void {
    Object.values(TABLES).forEach(table => {
      localStorage.removeItem(table);
    });
  }

  // VERIFICAR SI LA BD ESTÁ INICIALIZADA
  isInitialized(): boolean {
    return localStorage.getItem(TABLES.usuarios) !== null;
  }
}

// Singleton
export const db = new Database();