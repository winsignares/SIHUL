// ============================================
// DATOS INICIALES DEL SISTEMA
// Se cargan automáticamente al iniciar la aplicación
// ============================================

import { db } from './database';
import type { 
  Usuario, Facultad, Programa, PeriodoAcademico, 
  Asignatura, Grupo, EspacioFisico, HorarioAcademico,
  RecursoAudiovisual, Notificacion 
} from './models';

export function initializeDatabase(): void {
  // Si ya estaba inicializada, hacemos verificación incremental (migración ligera)
  if (db.isInitialized()) {
    const existentes = db.getUsuarios();

    // Usuarios que deben existir siempre (para nuevas versiones)
    const requiredUsers: Omit<Usuario, 'id'>[] = [
      {
        nombre: 'Laura Sánchez',
        email: 'docente@unilibre.edu.co',
        password: 'doc123',
        rol: 'consultorDocente',
        permisos: [
          { componenteId: 'dashboard', permiso: 'ver' },
          { componenteId: 'horarios', permiso: 'ver' },
          { componenteId: 'prestamos', permiso: 'editar' },
          { componenteId: 'notificaciones', permiso: 'ver' },
          { componenteId: 'chat', permiso: 'ver' },
          { componenteId: 'ajustes', permiso: 'ver' }
        ],
        programasRestringidos: [],
        activo: true,
        fechaCreacion: new Date().toISOString()
      },
      {
        nombre: 'Miguel Ortega',
        email: 'estudiante@unilibre.edu.co',
        password: 'est123',
        rol: 'consultorEstudiante',
        permisos: [
          { componenteId: 'dashboard', permiso: 'ver' },
          { componenteId: 'horarios', permiso: 'ver' },
          { componenteId: 'notificaciones', permiso: 'ver' },
          { componenteId: 'chat', permiso: 'ver' },
          { componenteId: 'ajustes', permiso: 'ver' }
        ],
        programasRestringidos: [],
        activo: true,
        fechaCreacion: new Date().toISOString()
      }
    ];

    let creados = 0;
    requiredUsers.forEach(u => {
      if (!existentes.some(e => e.email === u.email)) {
        db.createUsuario(u);
        creados++;
      }
    });
    if (creados > 0) {
      console.log(`🔄 Migración de usuarios aplicada. ${creados} usuario(s) añadidos.`);
    } else {
      console.log('✅ Base de datos ya inicializada (sin migraciones pendientes)');
    }
    return;
  }

  console.log('🔄 Inicializando base de datos con datos de ejemplo...');

  // ============================================
  // 1. USUARIOS
  // ============================================
  const usuarios: Omit<Usuario, 'id'>[] = [
    {
      nombre: 'Juan Carlos Martínez',
      email: 'admin@unilibre.edu.co',
      password: 'admin123',
      rol: 'admin',
      permisos: [
        { componenteId: 'dashboard', permiso: 'editar' },
        { componenteId: 'facultades', permiso: 'editar' },
        { componenteId: 'programas', permiso: 'editar' },
        { componenteId: 'periodos', permiso: 'editar' },
        { componenteId: 'grupos', permiso: 'editar' },
        { componenteId: 'asignaturas', permiso: 'editar' },
        { componenteId: 'espacios', permiso: 'editar' },
        { componenteId: 'horarios', permiso: 'editar' },
        { componenteId: 'prestamos', permiso: 'editar' },
        { componenteId: 'ocupacion', permiso: 'editar' },
        { componenteId: 'reportes', permiso: 'editar' },
        { componenteId: 'usuarios', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'editar' },
        { componenteId: 'chat', permiso: 'editar' },
        { componenteId: 'ajustes', permiso: 'editar' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'María García López',
      email: 'autorizado@unilibre.edu.co',
      password: 'auto123',
      rol: 'autorizado',
      permisos: [
        { componenteId: 'prestamos', permiso: 'editar' },
        { componenteId: 'recursos', permiso: 'editar' },
        { componenteId: 'ocupacion', permiso: 'ver' },
        { componenteId: 'reportes', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'chat', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Carlos Rodríguez Pérez',
      email: 'consultor@unilibre.edu.co',
      password: 'cons123',
      rol: 'consultor',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'espacios', permiso: 'ver' },
        { componenteId: 'ocupacion', permiso: 'ver' },
        { componenteId: 'reportes', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'chat', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Laura Sánchez',
      email: 'docente@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultorDocente',
      permisos: [
        { componenteId: 'dashboard', permiso: 'ver' },
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'prestamos', permiso: 'editar' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'chat', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Miguel Ortega',
      email: 'estudiante@unilibre.edu.co',
      password: 'est123',
      rol: 'consultorEstudiante',
      permisos: [
        { componenteId: 'dashboard', permiso: 'ver' },
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'chat', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  usuarios.forEach(u => db.createUsuario(u));

  // ============================================
  // 2. FACULTADES
  // ============================================
  const facultades: Omit<Facultad, 'id'>[] = [
    {
      codigo: 'FAC-ING',
      nombre: 'Facultad de Ingeniería',
      decano: 'Dr. Roberto Hernández',
      telefono: '3201234567',
      email: 'ingenieria@unilibre.edu.co',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'FAC-DER',
      nombre: 'Facultad de Derecho',
      decano: 'Dra. Ana María Torres',
      telefono: '3209876543',
      email: 'derecho@unilibre.edu.co',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'FAC-ADM',
      nombre: 'Facultad de Ciencias Administrativas',
      decano: 'Dr. Fernando Gómez',
      telefono: '3201112222',
      email: 'administracion@unilibre.edu.co',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'FAC-SAL',
      nombre: 'Facultad de Ciencias de la Salud',
      decano: 'Dra. Patricia Moreno',
      telefono: '3203334444',
      email: 'salud@unilibre.edu.co',
      activa: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  const facultadesCreadas = facultades.map(f => db.createFacultad(f));

  // ============================================
  // 3. PROGRAMAS
  // ============================================
  const programas: Omit<Programa, 'id'>[] = [
    // Ingeniería
    {
      codigo: 'ING-SIS',
      nombre: 'Ingeniería de Sistemas',
      facultadId: facultadesCreadas[0].id,
      director: 'Ing. Laura Martínez',
      modalidad: 'presencial',
      nivel: 'pregrado',
      creditos: 160,
      duracion: '10 semestres',
      semestres: 10,
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'ING-IND',
      nombre: 'Ingeniería Industrial',
      facultadId: facultadesCreadas[0].id,
      director: 'Ing. Carlos Ruiz',
      modalidad: 'presencial',
      nivel: 'pregrado',
      creditos: 155,
      duracion: '10 semestres',
      semestres: 10,
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    // Derecho
    {
      codigo: 'DER-001',
      nombre: 'Derecho',
      facultadId: facultadesCreadas[1].id,
      director: 'Dr. Miguel Ángel Vargas',
      modalidad: 'presencial',
      nivel: 'pregrado',
      creditos: 165,
      duracion: '10 semestres',
      semestres: 10,
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    // Administración
    {
      codigo: 'ADM-EMP',
      nombre: 'Administración de Empresas',
      facultadId: facultadesCreadas[2].id,
      director: 'Mg. Sandra Ospina',
      modalidad: 'presencial',
      nivel: 'pregrado',
      creditos: 140,
      duracion: '8 semestres',
      semestres: 8,
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'CONT-PUB',
      nombre: 'Contaduría Pública',
      facultadId: facultadesCreadas[2].id,
      director: 'Mg. Jorge Ramírez',
      modalidad: 'presencial',
      nivel: 'pregrado',
      creditos: 145,
      duracion: '9 semestres',
      semestres: 9,
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    // Salud
    {
      codigo: 'ENF-001',
      nombre: 'Enfermería',
      facultadId: facultadesCreadas[3].id,
      director: 'Enf. Gloria Medina',
      modalidad: 'presencial',
      nivel: 'pregrado',
      creditos: 150,
      duracion: '9 semestres',
      semestres: 9,
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  const programasCreados = programas.map(p => db.createPrograma(p));

  // ============================================
  // 4. PERIODOS ACADÉMICOS
  // ============================================
  const periodos: Omit<PeriodoAcademico, 'id'>[] = [
    {
      codigo: '2025-1',
      nombre: 'Periodo 2025-1',
      fechaInicio: '2025-02-01',
      fechaFin: '2025-06-30',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: '2024-2',
      nombre: 'Periodo 2024-2',
      fechaInicio: '2024-08-01',
      fechaFin: '2024-12-15',
      activo: false,
      fechaCreacion: new Date().toISOString()
    }
  ];

  const periodosCreados = periodos.map(p => db.createPeriodo(p));

  // ============================================
  // 5. ASIGNATURAS
  // ============================================
  const asignaturas: Omit<Asignatura, 'id'>[] = [
    // Ingeniería de Sistemas
    {
      codigo: 'SIS-101',
      nombre: 'Programación I',
      programaId: programasCreados[0].id,
      creditos: 4,
      horasSemana: 6,
      semestre: 1,
      tipo: 'teorico-practica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'SIS-102',
      nombre: 'Matemáticas Discretas',
      programaId: programasCreados[0].id,
      creditos: 3,
      horasSemana: 4,
      semestre: 1,
      tipo: 'teorica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'SIS-201',
      nombre: 'Programación II',
      programaId: programasCreados[0].id,
      creditos: 4,
      horasSemana: 6,
      semestre: 2,
      tipo: 'teorico-practica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'SIS-202',
      nombre: 'Base de Datos I',
      programaId: programasCreados[0].id,
      creditos: 4,
      horasSemana: 6,
      semestre: 3,
      tipo: 'teorico-practica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    // Ingeniería Industrial
    {
      codigo: 'IND-101',
      nombre: 'Introducción a la Ingeniería Industrial',
      programaId: programasCreados[1].id,
      creditos: 3,
      horasSemana: 4,
      semestre: 1,
      tipo: 'teorica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'IND-102',
      nombre: 'Cálculo Diferencial',
      programaId: programasCreados[1].id,
      creditos: 4,
      horasSemana: 6,
      semestre: 1,
      tipo: 'teorica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    // Derecho
    {
      codigo: 'DER-101',
      nombre: 'Introducción al Derecho',
      programaId: programasCreados[2].id,
      creditos: 3,
      horasSemana: 4,
      semestre: 1,
      tipo: 'teorica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'DER-102',
      nombre: 'Derecho Constitucional',
      programaId: programasCreados[2].id,
      creditos: 4,
      horasSemana: 6,
      semestre: 2,
      tipo: 'teorica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    // Administración de Empresas
    {
      codigo: 'ADM-101',
      nombre: 'Fundamentos de Administración',
      programaId: programasCreados[3].id,
      creditos: 3,
      horasSemana: 4,
      semestre: 1,
      tipo: 'teorica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'ADM-102',
      nombre: 'Microeconomía',
      programaId: programasCreados[3].id,
      creditos: 3,
      horasSemana: 4,
      semestre: 1,
      tipo: 'teorica',
      activa: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  const asignaturasCreadas = asignaturas.map(a => db.createAsignatura(a));

  // ============================================
  // 6. ESPACIOS FÍSICOS
  // ============================================
  const espacios: Omit<EspacioFisico, 'id'>[] = [
    {
      codigo: 'A-101',
      nombre: 'Aula 101',
      tipo: 'aula',
      sede: 'Sede Norte',
      piso: '1',
      capacidad: 40,
      recursos: ['Proyector', 'Aire Acondicionado', 'Internet', 'Pizarra Digital'],
      descripcion: 'Aula amplia con iluminación LED y conectividad Wi-Fi',
      estado: 'Disponible',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'A-102',
      nombre: 'Aula 102',
      tipo: 'aula',
      sede: 'Sede Norte',
      piso: '1',
      capacidad: 35,
      recursos: ['Proyector', 'Aire Acondicionado', 'Internet'],
      descripcion: 'Aula con iluminación natural',
      estado: 'Disponible',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'LAB-SIS-01',
      nombre: 'Laboratorio de Sistemas 1',
      tipo: 'laboratorio',
      sede: 'Sede Norte',
      piso: '2',
      capacidad: 30,
      recursos: ['Computadores', 'Proyector', 'Aire Acondicionado', 'Internet'],
      descripcion: 'Laboratorio equipado con software especializado para programación',
      estado: 'Disponible',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'LAB-SIS-02',
      nombre: 'Laboratorio de Sistemas 2',
      tipo: 'laboratorio',
      sede: 'Sede Centro',
      piso: '2',
      capacidad: 25,
      recursos: ['Computadores', 'Proyector', 'Internet'],
      descripcion: 'Laboratorio para prácticas de bases de datos',
      estado: 'Mantenimiento',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'AUD-PRIN',
      nombre: 'Auditorio Principal',
      tipo: 'auditorio',
      sede: 'Sede Norte',
      piso: '1',
      capacidad: 200,
      recursos: ['Proyector', 'Micrófono', 'Sonido', 'Videoconferencia', 'Aire Acondicionado'],
      descripcion: 'Auditorio principal equipado con sistema de sonido profesional e iluminación',
      estado: 'Disponible',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'SALA-PROF',
      nombre: 'Sala de Profesores',
      tipo: 'sala',
      sede: 'Sede Centro',
      piso: '3',
      capacidad: 20,
      recursos: ['Computadores', 'Internet', 'Aire Acondicionado'],
      descripcion: 'Sala exclusiva para profesores con zona de café',
      estado: 'Disponible',
      fechaCreacion: new Date().toISOString()
    }
  ];

  const espaciosCreados = espacios.map(e => db.createEspacio(e));

  // ============================================
  // 7. GRUPOS
  // ============================================
  const grupos: Omit<Grupo, 'id'>[] = [
    {
      codigo: 'SIS-101-A',
      asignaturaId: asignaturasCreadas[0].id,
      programaId: programasCreados[0].id,
      periodoId: periodosCreados[0].id,
      docente: 'Ing. Carlos Mendoza',
      cantidadEstudiantes: 35,
      modalidad: 'presencial',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'SIS-101-B',
      asignaturaId: asignaturasCreadas[0].id,
      programaId: programasCreados[0].id,
      periodoId: periodosCreados[0].id,
      docente: 'Ing. María López',
      cantidadEstudiantes: 32,
      modalidad: 'presencial',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'SIS-102-A',
      asignaturaId: asignaturasCreadas[1].id,
      programaId: programasCreados[0].id,
      periodoId: periodosCreados[0].id,
      docente: 'Dr. Pedro Ramírez',
      cantidadEstudiantes: 38,
      modalidad: 'presencial',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'IND-101-A',
      asignaturaId: asignaturasCreadas[4].id,
      programaId: programasCreados[1].id,
      periodoId: periodosCreados[0].id,
      docente: 'Ing. Ana Torres',
      cantidadEstudiantes: 30,
      modalidad: 'presencial',
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  const gruposCreados = grupos.map(g => db.createGrupo(g));

  // ============================================
  // 8. HORARIOS ACADÉMICOS
  // ============================================
  const horarios: Omit<HorarioAcademico, 'id'>[] = [
    // Programación I - Grupo A
    {
      grupoId: gruposCreados[0].id,
      espacioId: espaciosCreados[2].id, // Lab Sistemas 1
      periodoId: periodosCreados[0].id,
      diaSemana: 'lunes',
      horaInicio: '08:00',
      horaFin: '10:00',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: gruposCreados[0].id,
      espacioId: espaciosCreados[2].id,
      periodoId: periodosCreados[0].id,
      diaSemana: 'miercoles',
      horaInicio: '08:00',
      horaFin: '10:00',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    // Programación I - Grupo B
    {
      grupoId: gruposCreados[1].id,
      espacioId: espaciosCreados[3].id, // Lab Sistemas 2
      periodoId: periodosCreados[0].id,
      diaSemana: 'martes',
      horaInicio: '10:00',
      horaFin: '12:00',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: gruposCreados[1].id,
      espacioId: espaciosCreados[3].id,
      periodoId: periodosCreados[0].id,
      diaSemana: 'jueves',
      horaInicio: '10:00',
      horaFin: '12:00',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    // Matemáticas Discretas
    {
      grupoId: gruposCreados[2].id,
      espacioId: espaciosCreados[0].id, // Aula 101
      periodoId: periodosCreados[0].id,
      diaSemana: 'lunes',
      horaInicio: '14:00',
      horaFin: '16:00',
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      grupoId: gruposCreados[2].id,
      espacioId: espaciosCreados[0].id,
      periodoId: periodosCreados[0].id,
      diaSemana: 'miercoles',
      horaInicio: '14:00',
      horaFin: '16:00',
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  horarios.forEach(h => db.createHorario(h));

  // ============================================
  // 9. RECURSOS AUDIOVISUALES
  // ============================================
  const recursos: Omit<RecursoAudiovisual, 'id'>[] = [
    {
      codigo: 'PROY-001',
      nombre: 'Proyector Epson PowerLite',
      tipo: 'proyector',
      marca: 'Epson',
      modelo: 'PowerLite X41+',
      serial: 'EP2024001',
      estado: 'disponible',
      ubicacion: 'Almacén Audiovisuales',
      fechaAdquisicion: '2024-01-15',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'PROY-002',
      nombre: 'Proyector BenQ',
      tipo: 'proyector',
      marca: 'BenQ',
      modelo: 'MH535A',
      serial: 'BQ2024002',
      estado: 'disponible',
      ubicacion: 'Almacén Audiovisuales',
      fechaAdquisicion: '2024-02-20',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'CAM-001',
      nombre: 'Cámara Sony HD',
      tipo: 'camara',
      marca: 'Sony',
      modelo: 'HDR-CX405',
      serial: 'SN2024001',
      estado: 'disponible',
      ubicacion: 'Almacén Audiovisuales',
      fechaAdquisicion: '2024-03-10',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'MIC-001',
      nombre: 'Micrófono Inalámbrico Shure',
      tipo: 'microfono',
      marca: 'Shure',
      modelo: 'SM58',
      serial: 'SH2024001',
      estado: 'prestado',
      ubicacion: 'Auditorio Principal',
      fechaAdquisicion: '2023-11-05',
      fechaCreacion: new Date().toISOString()
    },
    {
      codigo: 'PC-001',
      nombre: 'Portátil Dell Latitude',
      tipo: 'computador',
      marca: 'Dell',
      modelo: 'Latitude 5420',
      serial: 'DL2024001',
      estado: 'disponible',
      ubicacion: 'Almacén Audiovisuales',
      fechaAdquisicion: '2024-01-20',
      fechaCreacion: new Date().toISOString()
    }
  ];

  recursos.forEach(r => db.createRecursoAudiovisual(r));

  // ============================================
  // 10. NOTIFICACIONES
  // ============================================
  const notificaciones: Omit<Notificacion, 'id'>[] = [
    {
      usuarioId: usuarios[0].email, // admin
      tipo: 'info',
      titulo: 'Bienvenido al Sistema',
      mensaje: 'El sistema de gestión académica ha sido inicializado correctamente.',
      leida: false,
      fecha: new Date().toISOString()
    },
    {
      usuarioId: usuarios[1].email, // autorizado
      tipo: 'advertencia',
      titulo: 'Préstamos Pendientes',
      mensaje: 'Tienes 3 solicitudes de préstamo pendientes de revisión.',
      leida: false,
      fecha: new Date().toISOString()
    },
    {
      usuarioId: usuarios[2].email, // consultor
      tipo: 'info',
      titulo: 'Nuevo Periodo Académico',
      mensaje: 'El periodo 2025-1 ha sido activado.',
      leida: false,
      fecha: new Date().toISOString()
    },
    {
      usuarioId: usuarios[3].email, // docente
      tipo: 'info',
      titulo: 'Horario publicado',
      mensaje: 'Tu horario para 2025-1 ha sido publicado.',
      leida: false,
      fecha: new Date().toISOString()
    },
    {
      usuarioId: usuarios[4].email, // estudiante
      tipo: 'info',
      titulo: 'Bienvenido estudiante',
      mensaje: 'Tu acceso a Unispace ha sido habilitado.',
      leida: false,
      fecha: new Date().toISOString()
    }
  ];

  notificaciones.forEach(n => db.createNotificacion(n));

  console.log('✅ Base de datos inicializada exitosamente');
  console.log('📊 Datos creados:');
  console.log(`  - ${usuarios.length} usuarios`);
  console.log(`  - ${facultades.length} facultades`);
  console.log(`  - ${programas.length} programas`);
  console.log(`  - ${periodos.length} periodos`);
  console.log(`  - ${asignaturas.length} asignaturas`);
  console.log(`  - ${grupos.length} grupos`);
  console.log(`  - ${espacios.length} espacios físicos`);
  console.log(`  - ${horarios.length} horarios`);
  console.log(`  - ${recursos.length} recursos audiovisuales`);
  console.log(`  - ${notificaciones.length} notificaciones`);
}
