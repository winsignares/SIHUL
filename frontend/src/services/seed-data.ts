// ============================================
// DATOS INICIALES DEL SISTEMA
// Se cargan automáticamente al iniciar la aplicación
// ============================================

import { db } from './database';
import type { Usuario } from '../models';
import { addCompleteData } from './complete-data';

export function initializeDatabase(): void {
  // Solo inicializar si no hay datos
  const isInitialized = db.isInitialized();

  if (isInitialized) {
    console.log('✅ Base de datos ya inicializada');
    // Verificar y agregar usuarios faltantes
    agregarUsuariosFaltantes();
    return;
  }

  console.log('🔄 Inicializando base de datos con datos de ejemplo...');
  cargarDatosIniciales();
}

function cargarDatosIniciales(): void {

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
      accesoTodosProgramas: true,
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
      nombre: 'Laura Martínez Gómez',
      email: 'estudiante@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-A', 'DERE-B'], // Grupos asignados al estudiante
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Roberto Sánchez Torres',
      email: 'docente@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor_docente',
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
      nombre: 'Pedro González Ramírez',
      email: 'supervisor@unilibre.edu.co',
      password: 'super123',
      rol: 'supervisor_general',
      permisos: [
        { componenteId: 'cronograma', permiso: 'ver' },
        { componenteId: 'apertura-cierre', permiso: 'editar' },
        { componenteId: 'estado-recursos', permiso: 'ver' },
        { componenteId: 'espacios', permiso: 'ver' },
        { componenteId: 'reportes', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    // Estudiantes adicionales para los grupos
    {
      nombre: 'Ana María Rodríguez',
      email: 'ana.rodriguez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Carlos Eduardo López',
      email: 'carlos.lopez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Diana Patricia Morales',
      email: 'diana.morales@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Javier Andrés Hernández',
      email: 'javier.hernandez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'María Fernanda Castro',
      email: 'maria.castro@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['DERE-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Luis Alberto Ramírez',
      email: 'luis.ramirez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['DERE-A', 'DERE-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Sandra Milena Torres',
      email: 'sandra.torres@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['DERE-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Jorge Enrique Vargas',
      email: 'jorge.vargas@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['ADIN-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Paula Andrea Gómez',
      email: 'paula.gomez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['ADIN-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  usuarios.forEach(u => db.createUsuario(u));

  // Agregar datos completos
  addCompleteData();

  console.log('✅ Base de datos inicializada exitosamente');
  console.log('📊 Datos creados:');
  console.log(`  - ${usuarios.length} usuarios`);
}

// ============================================
// FUNCIÓN PARA REINICIALIZAR LA BASE DE DATOS
// ============================================
export function reinicializarBaseDatos(): void {
  console.log('🔄 Reinicializando base de datos...');
  db.clearDatabase();
  cargarDatosIniciales();
  console.log('✅ Base de datos reinicializada. Por favor recarga la página.');
}

// Exponer función globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).reinicializarDB = reinicializarBaseDatos;
  console.log('💡 Función disponible: reinicializarDB() - Reinicia completamente la base de datos');
}

// ============================================
// FUNCIÓN AUXILIAR: AGREGAR USUARIOS FALTANTES
// ============================================
function agregarUsuariosFaltantes(): void {
  const usuariosActuales = db.getUsuarios();

  // Usuarios que deben existir
  const usuariosRequeridos: Omit<Usuario, 'id'>[] = [
    {
      nombre: 'Laura Martínez Gómez',
      email: 'estudiante@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-A', 'DERE-B'], // Grupos asignados al estudiante
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Roberto Sánchez Torres',
      email: 'docente@unilibre.edu.co',
      password: 'doc123',
      rol: 'consultor_docente',
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
      nombre: 'Pedro González Ramírez',
      email: 'supervisor@unilibre.edu.co',
      password: 'super123',
      rol: 'supervisor_general',
      permisos: [
        { componenteId: 'cronograma', permiso: 'ver' },
        { componenteId: 'apertura-cierre', permiso: 'editar' },
        { componenteId: 'estado-recursos', permiso: 'ver' },
        { componenteId: 'espacios', permiso: 'ver' },
        { componenteId: 'reportes', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    // Estudiantes adicionales para los grupos
    {
      nombre: 'Ana María Rodríguez',
      email: 'ana.rodriguez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Carlos Eduardo López',
      email: 'carlos.lopez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Diana Patricia Morales',
      email: 'diana.morales@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Javier Andrés Hernández',
      email: 'javier.hernandez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['INSI-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'María Fernanda Castro',
      email: 'maria.castro@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['DERE-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Luis Alberto Ramírez',
      email: 'luis.ramirez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['DERE-A', 'DERE-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Sandra Milena Torres',
      email: 'sandra.torres@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['DERE-B'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Jorge Enrique Vargas',
      email: 'jorge.vargas@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['ADIN-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    },
    {
      nombre: 'Paula Andrea Gómez',
      email: 'paula.gomez@unilibre.edu.co',
      password: 'est123',
      rol: 'consultor_estudiante',
      permisos: [
        { componenteId: 'horarios', permiso: 'ver' },
        { componenteId: 'notificaciones', permiso: 'ver' },
        { componenteId: 'mensajeria', permiso: 'ver' },
        { componenteId: 'ajustes', permiso: 'ver' }
      ],
      programasRestringidos: [],
      gruposAsignados: ['ADIN-A'],
      activo: true,
      fechaCreacion: new Date().toISOString()
    }
  ];

  // Agregar solo los usuarios que no existen
  let usuariosAgregados = 0;
  usuariosRequeridos.forEach(usuarioRequerido => {
    const existe = usuariosActuales.find(u => u.email === usuarioRequerido.email);
    if (!existe) {
      db.createUsuario(usuarioRequerido);
      usuariosAgregados++;
      console.log(`✅ Usuario agregado: ${usuarioRequerido.nombre} (${usuarioRequerido.email})`);
    }
  });

  if (usuariosAgregados > 0) {
    console.log(`📊 Se agregaron ${usuariosAgregados} usuarios nuevos al sistema`);
  } else {
    console.log('✅ Todos los usuarios ya existen en el sistema');
  }
}
