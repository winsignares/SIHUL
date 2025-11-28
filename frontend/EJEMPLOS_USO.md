# EJEMPLOS DE USO - FRONTEND SIHUL

## 1. AUTENTICACIÓN Y PERMISOS

### Login
```tsx
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { login, loading, error } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login({
        correo: 'usuario@example.com',
        contrasena: 'password123'
      });
      // Redirige automáticamente a /dashboard
    } catch (err) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* ... form fields */}
    </form>
  );
}
```

### Verificar permisos
```tsx
import { useUser } from '../context/UserContext';

function GestionUsuarios() {
  const { usuario, hasPermiso, hasArea, hasAnyPermiso } = useUser();

  // Verificar un permiso específico
  if (!hasPermiso('crear_usuario')) {
    return <p>No tienes permiso para crear usuarios</p>;
  }

  // Verificar área
  if (!hasArea('administracion')) {
    return <p>No tienes acceso a esta área</p>;
  }

  // Verificar cualquiera de varios permisos
  const puedeEditar = hasAnyPermiso(['editar_usuario', 'administrador']);

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      {puedeEditar && <button>Editar</button>}
    </div>
  );
}
```

---

## 2. GESTIÓN DE USUARIOS Y ROLES

### Listar usuarios
```tsx
import { useUsuarios } from '../hooks/useUsuarios';

function ListaUsuarios() {
  const { usuarios, loading, error, deleteUsuario } = useUsuarios();

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map(usuario => (
          <tr key={usuario.id}>
            <td>{usuario.nombre}</td>
            <td>{usuario.correo}</td>
            <td>{usuario.rol_id}</td>
            <td>
              <button onClick={() => deleteUsuario(usuario.id)}>
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Crear usuario
```tsx
import { useUsuarios } from '../hooks/useUsuarios';

function CrearUsuario() {
  const { createUsuario, loading } = useUsuarios();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await createUsuario({
        nombre: formData.get('nombre') as string,
        correo: formData.get('correo') as string,
        contrasena: formData.get('contrasena') as string,
        rol_id: parseInt(formData.get('rol_id') as string),
        activo: true
      });
      alert('Usuario creado exitosamente');
    } catch (err) {
      alert('Error al crear usuario');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="nombre" placeholder="Nombre" required />
      <input name="correo" type="email" placeholder="Correo" required />
      <input name="contrasena" type="password" placeholder="Contraseña" required />
      <input name="rol_id" type="number" placeholder="Rol ID" />
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Usuario'}
      </button>
    </form>
  );
}
```

### Gestionar roles
```tsx
import { useRoles } from '../hooks/useRoles';

function GestionRoles() {
  const { roles, createRol, updateRol, deleteRol, loading } = useRoles();

  const handleCreateRol = async () => {
    await createRol({
      nombre: 'Docente',
      descripcion: 'Profesor de la universidad'
    });
  };

  return (
    <div>
      <h2>Roles del Sistema</h2>
      <button onClick={handleCreateRol}>Crear Nuevo Rol</button>
      <ul>
        {roles.map(rol => (
          <li key={rol.id}>
            {rol.nombre} - {rol.descripcion}
            <button onClick={() => deleteRol(rol.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 3. HORARIOS

### Ver horario de docente
```tsx
import { horariosService } from '../services';
import { useEffect, useState } from 'react';

function HorarioDocente({ docenteId }: { docenteId: number }) {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHorarios = async () => {
      try {
        const data = await horariosService.getByProfesor(docenteId);
        setHorarios(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [docenteId]);

  if (loading) return <p>Cargando horario...</p>;

  return (
    <div>
      <h2>Mi Horario</h2>
      <table>
        <thead>
          <tr>
            <th>Día</th>
            <th>Hora Inicio</th>
            <th>Hora Fin</th>
            <th>Asignatura</th>
            <th>Espacio</th>
          </tr>
        </thead>
        <tbody>
          {horarios.map(h => (
            <tr key={h.id}>
              <td>{h.dia_semana}</td>
              <td>{h.hora_inicio}</td>
              <td>{h.hora_fin}</td>
              <td>{h.asignatura_nombre}</td>
              <td>{h.espacio_ubicacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Crear horario fusionado
```tsx
import { useHorariosFusionados } from '../hooks/useHorariosFusionados';

function CrearHorarioFusionado() {
  const { createHorarioFusionado, loading } = useHorariosFusionados();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await createHorarioFusionado({
        grupo1_id: parseInt(formData.get('grupo1_id') as string),
        grupo2_id: parseInt(formData.get('grupo2_id') as string),
        grupo3_id: formData.get('grupo3_id') ? parseInt(formData.get('grupo3_id') as string) : undefined,
        asignatura_id: parseInt(formData.get('asignatura_id') as string),
        espacio_id: parseInt(formData.get('espacio_id') as string),
        dia_semana: formData.get('dia_semana') as string,
        hora_inicio: formData.get('hora_inicio') as string,
        hora_fin: formData.get('hora_fin') as string,
        docente_id: formData.get('docente_id') ? parseInt(formData.get('docente_id') as string) : undefined,
        comentario: formData.get('comentario') as string || ''
      });
      
      alert('Horario fusionado creado');
    } catch (err) {
      alert('Error al crear horario fusionado');
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

---

## 4. ESPACIOS Y OCUPACIÓN

### Validar disponibilidad
```tsx
import { espaciosExtService } from '../services';
import { useState } from 'react';

function ValidarDisponibilidad() {
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loading, setLoading] = useState(false);

  const validar = async () => {
    setLoading(true);
    try {
      const result = await espaciosExtService.validarDisponibilidad({
        espacio_id: 1,
        fecha: '2025-11-20',
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00'
      });
      
      setDisponibilidad(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={validar} disabled={loading}>
        Validar Disponibilidad
      </button>

      {disponibilidad && (
        <div>
          {disponibilidad.disponible ? (
            <p style={{ color: 'green' }}>✓ Espacio disponible</p>
          ) : (
            <div>
              <p style={{ color: 'red' }}>✗ Espacio no disponible</p>
              <h4>Conflictos:</h4>
              <ul>
                {disponibilidad.conflictos.map((c, i) => (
                  <li key={i}>
                    {c.tipo}: {c.descripcion} ({c.hora_inicio} - {c.hora_fin})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Ver ocupación de espacios
```tsx
import { espaciosExtService } from '../services';
import { useEffect, useState } from 'react';

function OcupacionEspacios() {
  const [ocupacion, setOcupacion] = useState([]);

  useEffect(() => {
    const fetchOcupacion = async () => {
      const data = await espaciosExtService.getOcupacion({
        sede_id: 1,
        fecha_inicio: '2025-11-18',
        fecha_fin: '2025-11-22'
      });
      setOcupacion(data);
    };

    fetchOcupacion();
  }, []);

  return (
    <div>
      <h2>Ocupación Semanal</h2>
      {ocupacion.map(esp => (
        <div key={esp.espacio_id}>
          <h3>{esp.espacio_tipo} - {esp.espacio_ubicacion}</h3>
          <p>Ocupación: {esp.porcentaje_ocupacion}%</p>
          <ul>
            {esp.horarios.map((h, i) => (
              <li key={i}>
                {h.dia_semana}: {h.hora_inicio} - {h.hora_fin}
                {h.asignatura_nombre && ` (${h.asignatura_nombre})`}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

## 5. DASHBOARD Y ESTADÍSTICAS

```tsx
import { useDashboard } from '../hooks/useDashboard';

function DashboardHome() {
  const { estadisticas, loading, error, refetch } = useDashboard();

  if (loading) return <p>Cargando estadísticas...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!estadisticas) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card">
        <h3>Total Usuarios</h3>
        <p className="text-3xl">{estadisticas.total_usuarios}</p>
      </div>
      
      <div className="card">
        <h3>Total Espacios</h3>
        <p className="text-3xl">{estadisticas.total_espacios}</p>
      </div>
      
      <div className="card">
        <h3>Préstamos Pendientes</h3>
        <p className="text-3xl">{estadisticas.prestamos_pendientes}</p>
      </div>
      
      <div className="card">
        <h3>Ocupación Promedio</h3>
        <p className="text-3xl">{estadisticas.ocupacion_promedio}%</p>
      </div>

      <button onClick={refetch}>Actualizar</button>
    </div>
  );
}
```

---

## 6. NOTIFICACIONES

```tsx
import { useNotificaciones } from '../hooks/useNotificaciones';
import { useUser } from '../context/UserContext';

function Notificaciones() {
  const { usuario } = useUser();
  const { notificaciones, marcarLeida, loading } = useNotificaciones(usuario?.id || null, false);

  return (
    <div>
      <h2>Notificaciones</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <ul>
          {notificaciones.map(notif => (
            <li 
              key={notif.id}
              style={{ 
                fontWeight: notif.leida ? 'normal' : 'bold',
                cursor: 'pointer'
              }}
              onClick={() => !notif.leida && marcarLeida(notif.id)}
            >
              <h4>{notif.titulo}</h4>
              <p>{notif.mensaje}</p>
              <small>{notif.fecha_creacion}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 7. BÚSQUEDA GLOBAL

```tsx
import { useBusqueda } from '../hooks/useBusqueda';
import { useState } from 'react';

function BusquedaGlobal() {
  const { resultados, buscar, limpiar, loading } = useBusqueda();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length >= 2) {
      buscar(value);
    } else {
      limpiar();
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar..."
        value={query}
        onChange={handleSearch}
      />

      {loading && <p>Buscando...</p>}

      {resultados && (
        <div>
          <section>
            <h3>Espacios ({resultados.espacios.length})</h3>
            <ul>
              {resultados.espacios.map(e => (
                <li key={e.id}>{e.tipo} - {e.ubicacion}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Usuarios ({resultados.usuarios.length})</h3>
            <ul>
              {resultados.usuarios.map(u => (
                <li key={u.id}>{u.nombre} - {u.correo}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Horarios ({resultados.horarios.length})</h3>
            <ul>
              {resultados.horarios.map(h => (
                <li key={h.id}>{h.dia_semana} {h.hora_inicio}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
```

---

## 8. REPORTES

```tsx
import { reportesService } from '../services';
import { useState } from 'react';

function ReporteOcupacion() {
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);

  const generarReporte = async () => {
    setLoading(true);
    try {
      const data = await reportesService.getOcupacionEspacios({
        fecha_inicio: '2025-11-01',
        fecha_fin: '2025-11-30',
        sede_id: 1
      });
      setReporte(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={generarReporte} disabled={loading}>
        Generar Reporte
      </button>

      {reporte && (
        <div>
          <h2>Reporte de Ocupación</h2>
          <p>Período: {reporte.periodo.fecha_inicio} - {reporte.periodo.fecha_fin}</p>
          
          <table>
            <thead>
              <tr>
                <th>Espacio</th>
                <th>Tipo</th>
                <th>Horas Ocupadas</th>
                <th>Horas Disponibles</th>
                <th>% Ocupación</th>
                <th>Horarios</th>
                <th>Préstamos</th>
              </tr>
            </thead>
            <tbody>
              {reporte.espacios.map(e => (
                <tr key={e.espacio_id}>
                  <td>{e.espacio_id}</td>
                  <td>{e.espacio_tipo}</td>
                  <td>{e.total_horas_ocupadas}</td>
                  <td>{e.total_horas_disponibles}</td>
                  <td>{e.porcentaje_ocupacion}%</td>
                  <td>{e.horarios_count}</td>
                  <td>{e.prestamos_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## 9. PRÉSTAMOS

```tsx
import { useReservas } from '../hooks/useReservas';

function MisPrestamos({ usuarioId }: { usuarioId: number }) {
  const { reservas, createReserva, loading } = useReservas();
  
  // Filtrar préstamos del usuario
  const misPrestamos = reservas.filter(r => r.usuario_id === usuarioId);

  const solicitarPrestamo = async () => {
    await createReserva({
      espacio_id: 1,
      fecha: '2025-11-25',
      hora_inicio: '14:00:00',
      hora_fin: '16:00:00',
      motivo: 'Reunión de equipo'
    });
  };

  return (
    <div>
      <h2>Mis Préstamos</h2>
      <button onClick={solicitarPrestamo}>Solicitar Préstamo</button>
      
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Espacio</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {misPrestamos.map(p => (
            <tr key={p.id}>
              <td>{p.fecha}</td>
              <td>{p.hora_inicio} - {p.hora_fin}</td>
              <td>{p.espacio_id}</td>
              <td>{p.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 10. RUTAS PROTEGIDAS

```tsx
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

function ProtectedRoute({ 
  children, 
  requiredPermiso 
}: { 
  children: React.ReactNode; 
  requiredPermiso?: string;
}) {
  const { usuario, hasPermiso } = useUser();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermiso && !hasPermiso(requiredPermiso)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Uso en Router
<Route
  path="/dashboard/usuarios"
  element={
    <ProtectedRoute requiredPermiso="gestionar_usuarios">
      <GestionUsuarios />
    </ProtectedRoute>
  }
/>
```

---

Estos ejemplos cubren los casos de uso más comunes. Todos los servicios siguen el mismo patrón, por lo que puedes adaptarlos fácilmente a tus necesidades específicas.
