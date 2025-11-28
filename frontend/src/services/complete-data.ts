// ============================================
// DATOS COMPLETOS ADICIONALES PARA EL SISTEMA
// ============================================

import { db } from './database';
import type { Usuario } from '../models/models';

/**
 * Función para agregar datos completos adicionales al sistema
 * Esto incluye más horarios, préstamos, recursos, docentes y ocupaciones
 */
export function addCompleteData() {
  console.log('📦 Agregando datos completos al sistema...');

  // ============================================
  // DOCENTES ADICIONALES
  // ============================================

  const docentesAdicionales: Omit<Usuario, 'id'>[] = [
    {
      nombre: 'Dr. Carlos Alberto Pérez',
      email: 'carlos.perez@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor-docente',
      permisos: [
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Dra. Ana María González',
      email: 'ana.gonzalez@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor-docente',
      permisos: [
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Mg. Jorge Luis Ramírez',
      email: 'jorge.ramirez@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor-docente',
      permisos: [
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Dra. Patricia Mendoza',
      email: 'patricia.mendoza@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor-docente',
      permisos: [
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Mg. Fernando Silva',
      email: 'fernando.silva@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor-docente',
      permisos: [
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Dr. Ricardo Morales',
      email: 'ricardo.morales@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor-docente',
      permisos: [
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Dra. Claudia Rojas',
      email: 'claudia.rojas@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor-docente',
      permisos: [
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  // Agregar docentes al sistema
  let docentesAgregados = 0;
  docentesAdicionales.forEach(docente => {
    const usuarios = db.getUsuarios();
    const existe = usuarios.find(u => u.email === docente.email);
    if (!existe) {
      db.createUsuario(docente);
      docentesAgregados++;
    }
  });

  console.log(`✅ Se agregaron ${docentesAgregados} docentes al sistema`);

  // Obtener datos existentes
  const facultades = db.getFacultades();
  const programas = db.getProgramas();
  const asignaturas = db.getAsignaturas();
  const grupos = db.getGrupos();
  const espacios = db.getEspacios();
  const periodos = db.getPeriodos();

  if (facultades.length === 0 || programas.length === 0) {
    console.log('⚠️  Faltan datos básicos. Ejecuta primero initializeDatabase()');
    return;
  }

  // ============================================
  // HORARIOS ACADÉMICOS COMPLETOS
  // ============================================

  const horariosAdicionales = [
    // Horarios para Ingeniería de Sistemas - Grupo A (Semestre 1)
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Cálculo Diferencial')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-101')?.id || '',
      diaSemana: 'lunes' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Algoritmos y Programación')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'LAB-301')?.id || '',
      diaSemana: 'lunes' as const,
      horaInicio: '09:00',
      horaFin: '11:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Introducción a la Ingeniería')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-102')?.id || '',
      diaSemana: 'martes' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Cálculo Diferencial')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-101')?.id || '',
      diaSemana: 'miercoles' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Algoritmos y Programación')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'LAB-301')?.id || '',
      diaSemana: 'jueves' as const,
      horaInicio: '09:00',
      horaFin: '11:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Inglés I')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-105')?.id || '',
      diaSemana: 'viernes' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },

    // Horarios para Ingeniería de Sistemas - Grupo B (Semestre 1)
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Cálculo Diferencial')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-103')?.id || '',
      diaSemana: 'lunes' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Algoritmos y Programación')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'LAB-302')?.id || '',
      diaSemana: 'martes' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Introducción a la Ingeniería')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-104')?.id || '',
      diaSemana: 'miercoles' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Cálculo Diferencial')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-103')?.id || '',
      diaSemana: 'jueves' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'INSI-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Inglés I')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'A-106')?.id || '',
      diaSemana: 'viernes' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },

    // Horarios para Derecho - Grupo A (Semestre 3)
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Constitucional')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-201')?.id || '',
      diaSemana: 'lunes' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Civil')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-202')?.id || '',
      diaSemana: 'martes' as const,
      horaInicio: '09:00',
      horaFin: '11:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Penal')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-203')?.id || '',
      diaSemana: 'miercoles' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Constitucional')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-201')?.id || '',
      diaSemana: 'jueves' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Argumentación Jurídica')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-204')?.id || '',
      diaSemana: 'viernes' as const,
      horaInicio: '09:00',
      horaFin: '11:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },

    // Horarios para Derecho - Grupo B (Semestre 3)
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Constitucional')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-205')?.id || '',
      diaSemana: 'lunes' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Civil')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-206')?.id || '',
      diaSemana: 'martes' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Penal')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-207')?.id || '',
      diaSemana: 'miercoles' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Constitucional')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-205')?.id || '',
      diaSemana: 'jueves' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'DERE-B')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Argumentación Jurídica')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'B-208')?.id || '',
      diaSemana: 'viernes' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },

    // Horarios para Administración de Empresas - Grupo A (Semestre 5)
    {
      grupoId: grupos.find(g => g.codigo === 'ADIN-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Finanzas Corporativas')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'C-301')?.id || '',
      diaSemana: 'lunes' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'ADIN-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Mercadeo Estratégico')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'C-302')?.id || '',
      diaSemana: 'martes' as const,
      horaInicio: '09:00',
      horaFin: '11:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'ADIN-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Gestión del Talento Humano')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'C-303')?.id || '',
      diaSemana: 'miercoles' as const,
      horaInicio: '14:00',
      horaFin: '16:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'ADIN-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Contabilidad Gerencial')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'C-304')?.id || '',
      diaSemana: 'jueves' as const,
      horaInicio: '07:00',
      horaFin: '09:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: grupos.find(g => g.codigo === 'ADIN-A')?.id || '',
      asignaturaId: asignaturas.find(a => a.nombre === 'Finanzas Corporativas')?.id || '',
      espacioId: espacios.find(e => e.codigo === 'C-301')?.id || '',
      diaSemana: 'viernes' as const,
      horaInicio: '09:00',
      horaFin: '11:00',
      periodoId: periodos[0]?.id || '',
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  // Agregar horarios al sistema
  let horariosAgregados = 0;
  horariosAdicionales.forEach(horario => {
    if (horario.grupoId && horario.espacioId && horario.periodoId) {
      db.createHorario(horario);
      horariosAgregados++;
    }
  });

  console.log(`✅ Se agregaron ${horariosAgregados} horarios académicos`);

  // ============================================
  // ASIGNATURAS ADICIONALES SIN HORARIOS
  // ============================================

  // Asignaturas para Ingeniería de Sistemas - Semestre 2 (SIN HORARIOS - para crear)
  const asignaturasParaCrear = [
    {
      codigo: 'INSI-202',
      nombre: 'Cálculo Integral',
      programaId: programas.find(p => p.codigo === 'INSI')?.id || '',
      creditos: 4,
      horasSemana: 6,
      semestre: 2,
      tipo: 'teorica' as const,
      recursosRequeridos: [
        { tipo: 'proyector', cantidad: 1, especificaciones: 'HD' },
        { tipo: 'tablero', cantidad: 1, especificaciones: 'Acrílico' }
      ],
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'INSI-203',
      nombre: 'Estructuras de Datos',
      programaId: programas.find(p => p.codigo === 'INSI')?.id || '',
      creditos: 4,
      horasSemana: 6,
      semestre: 2,
      tipo: 'teorico-practica' as const,
      recursosRequeridos: [
        { tipo: 'computador', cantidad: 30, especificaciones: 'i5, 8GB RAM' },
        { tipo: 'software', cantidad: 1, especificaciones: 'IDE de programación' }
      ],
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'INSI-204',
      nombre: 'Inglés II',
      programaId: programas.find(p => p.codigo === 'INSI')?.id || '',
      creditos: 2,
      horasSemana: 4,
      semestre: 2,
      tipo: 'teorica' as const,
      recursosRequeridos: [
        { tipo: 'proyector', cantidad: 1, especificaciones: 'HD' },
        { tipo: 'audio', cantidad: 1, especificaciones: 'Sistema de sonido' }
      ],
      activa: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  // Agregar asignaturas para poder crear horarios
  let asignaturasAgregadas = 0;
  asignaturasParaCrear.forEach(asignatura => {
    const existente = asignaturas.find(a => a.codigo === asignatura.codigo);
    if (!existente && asignatura.programaId) {
      db.createAsignatura(asignatura);
      asignaturasAgregadas++;
    }
  });

  console.log(`✅ Se agregaron ${asignaturasAgregadas} asignaturas adicionales para crear horarios`);

  // ============================================
  // GRUPOS ADICIONALES SIN HORARIOS
  // ============================================

  const gruposParaCrear = [
    {
      codigo: 'INSI-C',
      nombre: 'Grupo C',
      asignaturaId: asignaturas.find(a => a.nombre === 'Cálculo Diferencial')?.id || '',
      programaId: programas.find(p => p.codigo === 'INSI')?.id || '',
      periodoId: periodos[0]?.id || '',
      semestre: 1,
      docente: 'Mg. Jorge Luis Ramírez',
      cantidadEstudiantes: 28,
      modalidad: 'presencial' as const,
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'DERE-C',
      nombre: 'Grupo C',
      asignaturaId: asignaturas.find(a => a.nombre === 'Derecho Constitucional')?.id || '',
      programaId: programas.find(p => p.codigo === 'DERE')?.id || '',
      periodoId: periodos[0]?.id || '',
      semestre: 3,
      docente: 'Dra. Patricia Mendoza',
      cantidadEstudiantes: 35,
      modalidad: 'presencial' as const,
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  // Agregar grupos sin horarios para crear
  let gruposAgregados = 0;
  gruposParaCrear.forEach(grupo => {
    const existente = grupos.find(g => g.codigo === grupo.codigo);
    if (!existente && grupo.asignaturaId && grupo.programaId && grupo.periodoId) {
      db.createGrupo(grupo);
      gruposAgregados++;
    }
  });

  console.log(`✅ Se agregaron ${gruposAgregados} grupos sin horarios para crear`);

  // ============================================
  // PRÉSTAMOS DE ESPACIOS ADICIONALES
  // ============================================

  const usuarios = db.getUsuarios();
  const prestamosAdicionales = [
    {
      espacioId: espacios.find(e => e.codigo === 'AUD-001')?.id || '',
      solicitanteId: usuarios.find(u => u.email === 'docente@unilibre.edu.co')?.id || '',
      motivo: 'Conferencia sobre Innovación Tecnológica',
      fechaSolicitud: '2025-01-15',
      horaInicio: '09:00',
      horaFin: '11:00',
      estado: 'aprobado' as const,
      observaciones: 'Requiere proyector 4K y sistema de sonido',
      recursosSolicitados: ['Proyector 4K', 'Micrófono inalámbrico', 'Sistema de sonido'],
      fechaCreacion: new Date().toISOString()
    },
    {
      espacioId: espacios.find(e => e.codigo === 'SAL-001')?.id || '',
      solicitanteId: usuarios.find(u => u.email === 'admin@unilibre.edu.co')?.id || '',
      motivo: 'Reunión Consejo Académico',
      fechaSolicitud: '2025-01-16',
      horaInicio: '14:00',
      horaFin: '17:00',
      estado: 'aprobado' as const,
      observaciones: 'Reunión mensual de consejo',
      recursosSolicitados: ['Proyector HD', 'Laptop para presentaciones'],
      fechaCreacion: new Date().toISOString()
    },
    {
      espacioId: espacios.find(e => e.codigo === 'LAB-301')?.id || '',
      solicitanteId: usuarios.find(u => u.email === 'docente@unilibre.edu.co')?.id || '',
      motivo: 'Taller de Programación Avanzada',
      fechaSolicitud: '2025-01-17',
      horaInicio: '08:00',
      horaFin: '12:00',
      estado: 'pendiente' as const,
      observaciones: 'Requiere acceso a internet de alta velocidad',
      recursosSolicitados: ['Computadores', 'Proyector HD'],
      fechaCreacion: new Date().toISOString()
    },
    {
      espacioId: espacios.find(e => e.codigo === 'A-101')?.id || '',
      solicitanteId: usuarios.find(u => u.email === 'estudiante@unilibre.edu.co')?.id || '',
      motivo: 'Proyecto de Investigación - Grupo de Estudio',
      fechaSolicitud: '2025-01-18',
      horaInicio: '16:00',
      horaFin: '18:00',
      estado: 'rechazado' as const,
      observaciones: 'Espacio no disponible en ese horario',
      recursosSolicitados: ['Proyector HD'],
      fechaCreacion: new Date().toISOString()
    },
    {
      espacioId: espacios.find(e => e.codigo === 'B-201')?.id || '',
      solicitanteId: usuarios.find(u => u.email === 'autorizado@unilibre.edu.co')?.id || '',
      motivo: 'Simposio de Derecho Internacional',
      fechaSolicitud: '2025-01-19',
      horaInicio: '10:00',
      horaFin: '13:00',
      estado: 'aprobado' as const,
      observaciones: 'Evento interdisciplinario',
      recursosSolicitados: ['Proyector HD', 'Micrófono de solapa', 'Atril'],
      fechaCreacion: new Date().toISOString()
    }
  ];

  let prestamosAgregados = 0;
  prestamosAdicionales.forEach(prestamo => {
    if (prestamo.espacioId && prestamo.solicitanteId) {
      try {
        db.createPrestamo(prestamo);
        prestamosAgregados++;
      } catch (error) {
        // Préstamo ya existe o error
      }
    }
  });

  console.log(`✅ Se agregaron ${prestamosAgregados} préstamos de espacios adicionales`);

  // ============================================
  // ACTUALIZAR GRUPOS CON DOCENTES
  // ============================================

  // Asignar docentes a los grupos existentes
  const gruposConDocentes = [
    { codigo: 'INSI-A', docente: 'Dr. Carlos Alberto Pérez' },
    { codigo: 'INSI-B', docente: 'Dra. Ana María González' },
    { codigo: 'DERE-A', docente: 'Dr. Ricardo Morales' },
    { codigo: 'DERE-B', docente: 'Dra. Claudia Rojas' },
    { codigo: 'ADIN-A', docente: 'Mg. Fernando Silva' }
  ];

  let gruposActualizados = 0;
  gruposConDocentes.forEach(item => {
    const grupo = grupos.find(g => g.codigo === item.codigo);
    if (grupo) {
      db.updateGrupo(grupo.id, { docente: item.docente });
      gruposActualizados++;
    }
  });

  console.log(`✅ Se actualizaron ${gruposActualizados} grupos con docentes asignados`);

  console.log('🎉 Datos completos agregados exitosamente!');
}