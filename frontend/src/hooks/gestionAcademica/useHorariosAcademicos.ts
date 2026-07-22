import { useEffect, useMemo, useState } from 'react';
import { db } from '../../services/database';
import { periodoActivoService } from '../../services/periodos/periodoActivoAPI';
import { useNotification } from '../../share/notificationBanner';
import type { Asignatura, EspacioFisico, Facultad, Grupo, HorarioAcademico, Programa, Usuario } from '../../models';

export const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type HorarioAsignado = {
  id: string;
  asignaturaNombre: string;
  espacioNombre: string;
  docente: string;
  docenteId?: string;
  horaInicio: string;
  horaFin: string;
  diaSemana: string;
};

type HorarioGrupo = {
  programaId: string;
  semestre: number;
  grupoNombre: string;
  asignaturas: HorarioAsignado[];
};

const normalizeDia = (value: string): string => {
  const lower = value.toLowerCase();
  if (lower.includes('lun')) return 'Lunes';
  if (lower.includes('mar')) return 'Martes';
  if (lower.includes('mi')) return 'Miércoles';
  if (lower.includes('jue')) return 'Jueves';
  if (lower.includes('vie')) return 'Viernes';
  if (lower.includes('sab') || lower.includes('sáb')) return 'Sábado';
  if (lower.includes('dom')) return 'Domingo';
  return value;
};

const parseHour = (value: string): number => Number((value || '00:00').slice(0, 2));

export function useHorariosAcademicos() {
  const { notification, showNotification } = useNotification();

  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
  const [docentes, setDocentes] = useState<Usuario[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [horarios, setHorarios] = useState<HorarioAcademico[]>([]);
  const [periodoActual, setPeriodoActual] = useState('Cargando...');

  const [facultadSeleccionada, setFacultadSeleccionada] = useState('');
  const [programaSeleccionado, setProgramaSeleccionado] = useState('');
  const [semestreSeleccionado, setSemestreSeleccionado] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAsignaturaDialog, setShowAddAsignaturaDialog] = useState(false);

  const [nuevoHorarioForm, setNuevoHorarioForm] = useState({
    facultadId: '',
    programaId: '',
    semestre: '',
  });

  const [nuevaAsignatura, setNuevaAsignatura] = useState({
    asignaturaId: '',
    dias: [] as string[],
    horaInicio: '',
    horaFin: '',
    docente: '',
    espacioId: '',
  });

  const loadData = () => {
    setFacultades(db.getFacultades());
    setProgramas(db.getProgramas());
    setAsignaturas(db.getAsignaturas());
    setEspacios(db.getEspacios());
    setGrupos(db.getGrupos());
    setHorarios(db.getHorarios());
    setDocentes(db.getUsuarios().filter((u) => String(u.rol).includes('docente')));
  };

  useEffect(() => {
    loadData();
    loadPeriodoActivo();
  }, []);

  const loadPeriodoActivo = async () => {
    try {
      const periodo = await periodoActivoService.getPeriodoActivo();
      setPeriodoActual(periodo?.nombre || 'Sin periodo activo');
    } catch (error) {
      console.error('Error al cargar período activo:', error);
      setPeriodoActual('Sin periodo activo');
    }
  };

  const programasFiltrados = useMemo(
    () => programas.filter((p) => !facultadSeleccionada || p.facultadId === facultadSeleccionada),
    [programas, facultadSeleccionada],
  );

  const semestresDisponibles = useMemo(
    () => Array.from(new Set(asignaturas.filter((a) => a.programaId === programaSeleccionado).map((a) => Number(a.semestre)))).filter(Boolean).sort((a, b) => a - b),
    [asignaturas, programaSeleccionado],
  );

  const gruposDisponibles = useMemo(
    () => grupos
      .filter((g) => g.programaId === programaSeleccionado && String(g.semestre) === semestreSeleccionado)
      .map((g) => g.codigo),
    [grupos, programaSeleccionado, semestreSeleccionado],
  );

  const asignaturasDelSemestre = useMemo(
    () => asignaturas.filter((a) => a.programaId === programaSeleccionado && String(a.semestre) === semestreSeleccionado),
    [asignaturas, programaSeleccionado, semestreSeleccionado],
  );

  const horarioActual: HorarioGrupo | null = useMemo(() => {
    if (!programaSeleccionado || !semestreSeleccionado || !grupoSeleccionado) return null;

    const grupo = grupos.find(
      (g) => g.programaId === programaSeleccionado && String(g.semestre) === semestreSeleccionado && g.codigo === grupoSeleccionado,
    );
    if (!grupo) return null;

    const asignadas = horarios
      .filter((h) => h.grupoId === grupo.id)
      .map((h) => {
        const asignatura = asignaturas.find((a) => a.id === (h.asignaturaId || grupo.asignaturaId));
        const espacio = espacios.find((e) => e.id === h.espacioId);
        const docente = docentes.find((d) => d.id === h.docenteId);
        return {
          id: h.id,
          asignaturaNombre: asignatura?.nombre || 'Asignatura',
          espacioNombre: espacio?.nombre || 'Espacio',
          docente: docente?.nombre || grupo.docente || 'Sin docente',
          docenteId: h.docenteId,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          diaSemana: normalizeDia(h.diaSemana),
        } as HorarioAsignado;
      });

    return {
      programaId: programaSeleccionado,
      semestre: Number(semestreSeleccionado),
      grupoNombre: grupoSeleccionado,
      asignaturas: asignadas,
    };
  }, [programaSeleccionado, semestreSeleccionado, grupoSeleccionado, grupos, horarios, asignaturas, espacios, docentes]);

  const mostrarHorario = Boolean(horarioActual);
  const horarioAMostrar = horarioActual;

  const handleFacultadChange = (value: string) => {
    setFacultadSeleccionada(value);
    setProgramaSeleccionado('');
    setSemestreSeleccionado('');
    setGrupoSeleccionado('');
  };

  const handleProgramaChange = (value: string) => {
    setProgramaSeleccionado(value);
    setSemestreSeleccionado('');
    setGrupoSeleccionado('');
  };

  const handleSemestreChange = (value: string) => {
    setSemestreSeleccionado(value);
    setGrupoSeleccionado('');
  };

  const handleOpenCreateDialog = () => {
    setNuevoHorarioForm({ facultadId: '', programaId: '', semestre: '' });
    setShowCreateDialog(true);
  };

  const handleCreateHorario = () => {
    if (!nuevoHorarioForm.programaId || !nuevoHorarioForm.semestre) {
      showNotification('Complete programa y semestre', 'warning');
      return;
    }

    const existentes = grupos
      .filter((g) => g.programaId === nuevoHorarioForm.programaId && String(g.semestre) === nuevoHorarioForm.semestre)
      .map((g) => g.codigo);

    const sufijos = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const base = `${nuevoHorarioForm.semestre}`;
    const nuevoCodigo = `${base}${sufijos[existentes.length] || 'Z'}`;

    const periodo = db.getPeriodoActivo() || db.getPeriodos()[0];
    if (!periodo) {
      showNotification('No hay período activo para crear horario', 'error');
      return;
    }

    db.createGrupo({
      codigo: nuevoCodigo,
      nombre: `Grupo ${nuevoCodigo}`,
      asignaturaId: '',
      programaId: nuevoHorarioForm.programaId,
      periodoId: periodo.id,
      semestre: Number(nuevoHorarioForm.semestre),
      docente: '',
      cantidadEstudiantes: 30,
      modalidad: 'presencial',
      activo: true,
      fechaCreacion: new Date().toISOString(),
    });

    loadData();
    setShowCreateDialog(false);
    setFacultadSeleccionada(nuevoHorarioForm.facultadId);
    setProgramaSeleccionado(nuevoHorarioForm.programaId);
    setSemestreSeleccionado(nuevoHorarioForm.semestre);
    setGrupoSeleccionado(nuevoCodigo);
    showNotification('Horario creado correctamente', 'success');
  };

  const handleOpenDeleteDialog = () => setShowDeleteDialog(true);

  const handleDeleteHorario = () => {
    if (!horarioActual) return;
    horarioActual.asignaturas.forEach((a) => db.deleteHorario(a.id));
    loadData();
    setShowDeleteDialog(false);
    showNotification('Horario eliminado', 'success');
  };

  const handleOpenAddAsignatura = () => {
    setNuevaAsignatura({ asignaturaId: '', dias: [], horaInicio: '', horaFin: '', docente: '', espacioId: '' });
    setShowAddAsignaturaDialog(true);
  };

  const handleAddAsignatura = () => {
    if (!horarioActual || !nuevaAsignatura.asignaturaId || !nuevaAsignatura.espacioId || !nuevaAsignatura.horaInicio || !nuevaAsignatura.horaFin || nuevaAsignatura.dias.length === 0) {
      showNotification('Complete todos los campos para asignar', 'warning');
      return;
    }

    const grupo = grupos.find((g) => g.programaId === horarioActual.programaId && String(g.semestre) === String(horarioActual.semestre) && g.codigo === horarioActual.grupoNombre);
    if (!grupo) return;

    const docente = docentes.find((d) => d.nombre === nuevaAsignatura.docente);

    nuevaAsignatura.dias.forEach((dia) => {
      db.createHorario({
        asignaturaId: nuevaAsignatura.asignaturaId,
        docenteId: docente?.id,
        grupoId: grupo.id,
        espacioId: nuevaAsignatura.espacioId,
        diaSemana: dia,
        horaInicio: nuevaAsignatura.horaInicio,
        horaFin: nuevaAsignatura.horaFin,
      });
    });

    loadData();
    setShowAddAsignaturaDialog(false);
    showNotification('Asignatura agregada al horario', 'success');
  };

  const handleDeleteAsignatura = (horarioId: string) => {
    db.deleteHorario(horarioId);
    loadData();
    showNotification('Asignatura eliminada', 'success');
  };

  const getHorarioGridData = () => {
    if (!horarioActual) return null;

    const franjasHorarias = Array.from({ length: 16 }, (_, i) => {
      const start = String(i + 6).padStart(2, '0');
      const end = String(i + 7).padStart(2, '0');
      return { texto: `${start}:00 - ${end}:00`, startHour: i + 6 };
    });

    const celdasOcupadas = new Map<string, { isStart: boolean; asignatura: HorarioAsignado }>();

    horarioActual.asignaturas.forEach((asig) => {
      const start = parseHour(asig.horaInicio);
      const end = parseHour(asig.horaFin);
      const day = normalizeDia(asig.diaSemana);

      for (let h = start; h < end; h++) {
        const idx = h - 6;
        if (idx >= 0 && idx < franjasHorarias.length) {
          celdasOcupadas.set(`${day}-${idx}`, { isStart: h === start, asignatura: asig });
        }
      }
    });

    return { franjasHorarias, celdasOcupadas };
  };

  const calcularFilasOcupadas = (asignatura: HorarioAsignado, franjasHorarias: Array<{ startHour: number }>) => {
    const diff = parseHour(asignatura.horaFin) - parseHour(asignatura.horaInicio);
    return Math.max(1, Math.min(diff, franjasHorarias.length));
  };

  return {
    facultades,
    programas,
    asignaturas,
    espacios,
    docentes,
    periodoActual,
    facultadSeleccionada,
    programaSeleccionado,
    semestreSeleccionado,
    grupoSeleccionado,
    setGrupoSeleccionado,
    horarioActual,
    showCreateDialog,
    setShowCreateDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showAddAsignaturaDialog,
    setShowAddAsignaturaDialog,
    nuevaAsignatura,
    setNuevaAsignatura,
    nuevoHorarioForm,
    setNuevoHorarioForm,
    gruposDisponibles,
    programasFiltrados,
    semestresDisponibles,
    asignaturasDelSemestre,
    horarioAMostrar,
    mostrarHorario,
    handleFacultadChange,
    handleProgramaChange,
    handleSemestreChange,
    handleOpenCreateDialog,
    handleCreateHorario,
    handleOpenDeleteDialog,
    handleDeleteHorario,
    handleOpenAddAsignatura,
    handleAddAsignatura,
    handleDeleteAsignatura,
    getHorarioGridData,
    calcularFilasOcupadas,
    notification,
  };
}
