import { useState } from 'react';
import ExcelJS from 'exceljs';
import { db } from '../../services/database';
import { useNotification } from '../../share/notificationBanner';

export interface HorarioImportado {
    programa: string;
    asignatura: string;
    grupo: string;
    docente: string;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    cantidadEstudiantes: number;
    recursosRequeridos: string[];
}

export interface ResultadoAsignacion {
    horario: HorarioImportado;
    espacioAsignado: string;
    espacioId: string;
    exito: boolean;
    razon?: string;
}

const descargarArchivo = async (buffer: BlobPart, fileName: string, mimeType: string) => {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
};

const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values.map((value) => value.replace(/^"|"$/g, ''));
};

const parseCsvToObjects = async (file: File): Promise<Record<string, string>[]> => {
    const content = await file.text();
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) return [];

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        return headers.reduce<Record<string, string>>((acc, header, index) => {
            acc[header] = values[index] ?? '';
            return acc;
        }, {});
    });
};

const parseWorksheetToObjects = (worksheet: ExcelJS.Worksheet): Record<string, string>[] => {
    const rows = worksheet.getSheetValues();
    const normalizedRows = rows
        .slice(1)
        .filter((row): row is ExcelJS.CellValue[] => Array.isArray(row))
        .map((row) => row.slice(1).map((value) => (value == null ? '' : String(value).trim())));

    if (normalizedRows.length === 0) return [];

    const headers = normalizedRows[0];
    return normalizedRows
        .slice(1)
        .filter((row) => row.some((value) => value !== ''))
        .map((row) =>
            headers.reduce<Record<string, string>>((acc, header, index) => {
                acc[header] = row[index] ?? '';
                return acc;
            }, {})
        );
};

export function useAsignacionAutomatica() {
    const { notification, showNotification } = useNotification();
    const [archivo, setArchivo] = useState<File | null>(null);
    const [horariosImportados, setHorariosImportados] = useState<HorarioImportado[]>([]);
    const [procesando, setProcesando] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [resultados, setResultados] = useState<ResultadoAsignacion[]>([]);
    const [etapa, setEtapa] = useState<'carga' | 'revision' | 'procesando' | 'completado'>('carga');

    // Estados para las acciones de usuario
    const [asignacionesConfirmadas, setAsignacionesConfirmadas] = useState<Set<number>>(new Set());
    const [asignacionesRechazadas, setAsignacionesRechazadas] = useState<Set<number>>(new Set());
    const [horarioSeleccionado, setHorarioSeleccionado] = useState<ResultadoAsignacion | null>(null);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    // Estados para horario completo por grupo
    const [mostrarHorarioCompleto, setMostrarHorarioCompleto] = useState(false);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('');
    const [horariosGrupoSeleccionado, setHorariosGrupoSeleccionado] = useState<ResultadoAsignacion[]>([]);

    // Manejo de archivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension === 'xlsx' || extension === 'csv') {
                setArchivo(file);
                procesarArchivo(file);
            } else {
                showNotification('Por favor suba un archivo Excel (.xlsx) o CSV', 'error');
            }
        }
    };

    // Procesar archivo Excel/CSV
    const procesarArchivo = async (file: File) => {
        try {
            const extension = file.name.split('.').pop()?.toLowerCase();
            let jsonData: Record<string, string>[] = [];

            if (extension === 'csv') {
                jsonData = await parseCsvToObjects(file);
            } else {
                const data = await file.arrayBuffer();
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(data);
                const worksheet = workbook.worksheets[0];
                if (!worksheet) {
                    throw new Error('El archivo no contiene hojas para procesar.');
                }
                jsonData = parseWorksheetToObjects(worksheet);
            }

            console.log('📄 Datos crudos del Excel:', jsonData);

            // Mapear datos del archivo a nuestro formato
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const horariosParseados: HorarioImportado[] = jsonData.map((row: any) => {
                const horario = {
                    programa: row['Programa'] || row['programa'] || '',
                    asignatura: row['Asignatura'] || row['asignatura'] || '',
                    grupo: row['Grupo'] || row['grupo'] || '',
                    docente: row['Docente'] || row['docente'] || '',
                    diaSemana: normalizarDia(row['Día'] || row['dia'] || row['Dia'] || ''),
                    horaInicio: row['Hora Inicio'] || row['hora_inicio'] || row['HoraInicio'] || '',
                    horaFin: row['Hora Fin'] || row['hora_fin'] || row['HoraFin'] || '',
                    cantidadEstudiantes: parseInt(row['Cantidad Estudiantes'] || row['Estudiantes'] || row['estudiantes'] || row['cantidadEstudiantes'] || '30'),
                    recursosRequeridos: parseRecursos(row['Recursos'] || row['recursos'] || '')
                };
                console.log('✓ Horario parseado:', horario);
                return horario;
            });

            setHorariosImportados(horariosParseados);
            setEtapa('revision');

            // Resumen de grupos
            const grupos = [...new Set(horariosParseados.map(h => h.grupo))];
            const programas = [...new Set(horariosParseados.map(h => h.programa))];

            showNotification(`✅ ${horariosParseados.length} horarios cargados. 📚 ${programas.length} programa(s). 👥 ${grupos.length} grupo(s)`, 'success');
        } catch (error) {
            console.error('Error al procesar archivo:', error);
            showNotification('Error al procesar el archivo. Verifique el formato.', 'error');
        }
    };

    // Normalizar días de la semana
    const normalizarDia = (dia: string): string => {
        const diaLower = dia.toLowerCase().trim();
        const mapa: { [key: string]: string } = {
            'lunes': 'lunes',
            'martes': 'martes',
            'miércoles': 'miercoles',
            'miercoles': 'miercoles',
            'jueves': 'jueves',
            'viernes': 'viernes',
            'sábado': 'sabado',
            'sabado': 'sabado'
        };
        return mapa[diaLower] || diaLower;
    };

    // Parsear recursos desde string
    const parseRecursos = (recursosStr: string): string[] => {
        if (!recursosStr) return [];
        return recursosStr.split(',').map(r => r.trim()).filter(r => r);
    };

    // Algoritmo de asignación automática
    const iniciarAsignacionAutomatica = async () => {
        setProcesando(true);
        setEtapa('procesando');
        setProgreso(0);

        const espacios = db.getEspacios();
        const resultadosTemp: ResultadoAsignacion[] = [];

        for (let i = 0; i < horariosImportados.length; i++) {
            const horario = horariosImportados[i];
            setProgreso(((i + 1) / horariosImportados.length) * 100);

            // Buscar espacio compatible
            const espacioCompatible = encontrarEspacioCompatible(horario, espacios, resultadosTemp);

            if (espacioCompatible) {
                // Crear horario en el sistema
                const asignacionExitosa = crearHorarioEnSistema(horario, espacioCompatible.id);

                resultadosTemp.push({
                    horario,
                    espacioAsignado: espacioCompatible.nombre,
                    espacioId: espacioCompatible.id,
                    exito: asignacionExitosa,
                    razon: asignacionExitosa ? 'Asignado correctamente' : 'Error al crear horario'
                });
            } else {
                resultadosTemp.push({
                    horario,
                    espacioAsignado: 'N/A',
                    espacioId: '',
                    exito: false,
                    razon: 'No se encontró espacio compatible'
                });
            }
        }

        setResultados(resultadosTemp);
        setEtapa('completado');
        setProcesando(false);

        const exitosos = resultadosTemp.filter(r => r.exito).length;
        const fallidos = resultadosTemp.length - exitosos;

        if (fallidos === 0) {
            showNotification(`🎉 ¡Asignación completada! ${exitosos} horarios asignados correctamente`, 'success');
        } else {
            showNotification(`⚠️ Asignación completada con advertencias: ${exitosos} exitosos, ${fallidos} fallidos`, 'warning');
        }
    };

    // Encontrar espacio compatible
    const encontrarEspacioCompatible = (
        horario: HorarioImportado,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        espacios: any[],
        asignacionesPrevias: ResultadoAsignacion[]
    ) => {
        // Ordenar espacios por capacidad (ascendente) para optimizar uso
        const espaciosOrdenados = [...espacios].sort((a, b) => a.capacidad - b.capacidad);

        for (const espacio of espaciosOrdenados) {
            // 1. Verificar estado del espacio
            if (espacio.estado !== 'Disponible') {
                continue;
            }

            // 2. Verificar capacidad (con margen del 10%)
            const capacidadMinima = Math.ceil(horario.cantidadEstudiantes * 0.9);
            if (espacio.capacidad < capacidadMinima) {
                continue;
            }

            // 3. Verificar recursos (modo flexible)
            if (horario.recursosRequeridos.length > 0) {
                const recursosEspacio = espacio.recursos || [];

                // Modo flexible: si el espacio tiene al menos 50% de los recursos requeridos, lo considera compatible
                const recursosCoincidentes = horario.recursosRequeridos.filter((recursoReq: string) => {
                    return recursosEspacio.some((recursoEsp: string) => {
                        const req = recursoReq.toLowerCase().trim();
                        const esp = recursoEsp.toLowerCase().trim();
                        // Coincidencia parcial más flexible
                        return esp.includes(req) || req.includes(esp) ||
                            (req.includes('computador') && (esp.includes('pc') || esp.includes('computador') || esp.includes('computadora'))) ||
                            (req.includes('proyector') && esp.includes('video')) ||
                            (req.includes('pizarra') && (esp.includes('tablero') || esp.includes('pizarra')));
                    });
                });

                const porcentajeCoincidencia = (recursosCoincidentes.length / horario.recursosRequeridos.length) * 100;

                // Si tiene menos del 30% de recursos, rechazar
                if (porcentajeCoincidencia < 30) {
                    continue;
                }
            }

            // 4. Verificar conflictos de horario
            const tieneConflicto = asignacionesPrevias.some(asig =>
                asig.espacioId === espacio.id &&
                asig.horario.diaSemana.toLowerCase() === horario.diaSemana.toLowerCase() &&
                hayConflictoHorario(
                    asig.horario.horaInicio,
                    asig.horario.horaFin,
                    horario.horaInicio,
                    horario.horaFin
                )
            );
            if (tieneConflicto) {
                continue;
            }

            // Espacio compatible encontrado
            return espacio;
        }

        return null;
    };

    // Verificar conflicto de horario
    const hayConflictoHorario = (
        inicio1: string,
        fin1: string,
        inicio2: string,
        fin2: string
    ): boolean => {
        const [h1i, m1i] = inicio1.split(':').map(Number);
        const [h1f, m1f] = fin1.split(':').map(Number);
        const [h2i, m2i] = inicio2.split(':').map(Number);
        const [h2f, m2f] = fin2.split(':').map(Number);

        const min1i = h1i * 60 + m1i;
        const min1f = h1f * 60 + m1f;
        const min2i = h2i * 60 + m2i;
        const min2f = h2f * 60 + m2f;

        return !(min1f <= min2i || min2f <= min1i);
    };

    // Crear horario en el sistema
    const crearHorarioEnSistema = (horario: HorarioImportado, espacioId: string): boolean => {
        try {
            // Buscar el programa correspondiente
            const programas = db.getProgramas();
            let programa = programas.find(p =>
                p.nombre.toLowerCase().includes(horario.programa.toLowerCase()) ||
                horario.programa.toLowerCase().includes(p.nombre.toLowerCase())
            );

            // Si no existe el programa, crearlo automáticamente
            if (!programa) {
                // Buscar o crear facultad
                const facultades = db.getFacultades();
                let facultad = facultades[0]; // Usar la primera facultad por defecto

                if (!facultad) {
                    // Si no hay facultades, crear una por defecto
                    facultad = db.createFacultad({
                        nombre: 'Facultad de Ingeniería',
                        codigo: 'ING-' + Date.now().toString().slice(-4),
                        decano: 'Por Asignar',
                        email: 'facultad@unilibre.edu.co',
                        telefono: '000-0000',
                        activa: true,
                        fechaCreacion: new Date().toISOString()
                    });
                }

                // Buscar docenteId por nombre antes de crear el programa
                const docentes = db.getDocentes();
                const docenteObj = docentes.find(d => d.nombre.trim().toLowerCase() === horario.docente.trim().toLowerCase());
                // Crear el programa
                programa = db.createPrograma({
                    nombre: horario.programa,
                    codigo: horario.programa.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4),
                    facultadId: facultad.id,
                    director: docenteObj ? docenteObj.nombre : 'Por Asignar',
                    modalidad: 'presencial',
                    activo: true,
                    fechaCreacion: new Date().toISOString(),
                    nivel: 'pregrado', // valor por defecto, ajustar si es necesario
                    semestres: 10, // valor por defecto, ajustar si es necesario
                });
            }

            // Buscar o crear el grupo
            let grupo = db.getGrupos().find(g =>
                g.nombre === horario.grupo && g.programaId === programa!.id
            );

            if (!grupo) {
                // Buscar o crear período académico
                let periodo = db.getPeriodos()[0];
                if (!periodo) {
                    periodo = db.createPeriodo({
                        nombre: '2025-1',
                        codigo: '2025-1',
                        fechaInicio: '2025-01-15',
                        fechaFin: '2025-05-30',
                        activo: true,
                        fechaCreacion: new Date().toISOString()
                    });
                }

                // Crear grupo
                grupo = db.createGrupo({
                    nombre: horario.grupo,
                    programaId: programa.id,
                    semestre: 1,
                    periodoId: periodo.id,
                    cantidadEstudiantes: horario.cantidadEstudiantes,
                    codigo: horario.grupo + '-' + Date.now().toString().slice(-4),
                    asignaturaId: '',
                    modalidad: 'presencial',
                    activo: true,
                    fechaCreacion: new Date().toISOString()
                });
            }

            // Buscar docenteId por nombre
            const docentes = db.getDocentes();
            const docenteObj = docentes.find(d => d.nombre.trim().toLowerCase() === horario.docente.trim().toLowerCase());
            // Crear el horario académico con campos extendidos
            db.createHorario({
                grupoId: grupo.id,
                espacioId: espacioId,
                periodoId: grupo.periodoId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                diaSemana: horario.diaSemana as any,
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                activo: true,
                fechaCreacion: new Date().toISOString(),
                // Campos extendidos (guardados como propiedades adicionales)
                asignatura: horario.asignatura,
                docente: horario.docente,
                docenteId: docenteObj ? docenteObj.id : undefined,
                grupo: horario.grupo,
                programaId: programa.id,
                semestre: 1
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            return true;
        } catch (error) {
            console.error('❌ Error al crear horario:', error);
            return false;
        }
    };

    // Descargar plantilla Excel
    const descargarPlantilla = () => {
        // Plantilla ejemplo: Horario completo de un grupo (Lunes a Viernes)
        const plantilla = [
            // Información del Grupo - Lunes
            {
                'Facultad': 'Ingeniería',
                'Programa': 'Ingeniería de Sistemas',
                'Semestre': 1,
                'Grupo': 'INSI-A',
                'Cantidad Estudiantes': 35,
                'Día': 'Lunes',
                'Hora Inicio': '08:00',
                'Hora Fin': '10:00',
                'Asignatura': 'Programación I',
                'Docente': 'Juan Pérez',
                'Recursos': 'computador, proyector'
            },
            // ... más datos de ejemplo si se desea
        ];

        void (async () => {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Horario Grupo');

            worksheet.columns = [
                { header: 'Facultad', key: 'Facultad', width: 15 },
                { header: 'Programa', key: 'Programa', width: 25 },
                { header: 'Semestre', key: 'Semestre', width: 10 },
                { header: 'Grupo', key: 'Grupo', width: 10 },
                { header: 'Cantidad Estudiantes', key: 'Cantidad Estudiantes', width: 18 },
                { header: 'Día', key: 'Día', width: 12 },
                { header: 'Hora Inicio', key: 'Hora Inicio', width: 12 },
                { header: 'Hora Fin', key: 'Hora Fin', width: 12 },
                { header: 'Asignatura', key: 'Asignatura', width: 20 },
                { header: 'Docente', key: 'Docente', width: 20 },
                { header: 'Recursos', key: 'Recursos', width: 30 },
            ];

            plantilla.forEach((row) => worksheet.addRow(row));
            const buffer = await workbook.xlsx.writeBuffer();
            await descargarArchivo(
                buffer as BlobPart,
                'plantilla_horario_grupo_unispace.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            showNotification('✅ Plantilla descargada - Horario completo por grupo', 'success');
        })().catch(() => {
            showNotification('Error al generar la plantilla de horario.', 'error');
        });
    };

    // Reiniciar proceso
    const reiniciar = () => {
        setArchivo(null);
        setHorariosImportados([]);
        setResultados([]);
        setEtapa('carga');
        setProgreso(0);
        setAsignacionesConfirmadas(new Set());
        setAsignacionesRechazadas(new Set());
    };

    // Confirmar asignación
    const confirmarAsignacion = (index: number) => {
        const nuevasConfirmadas = new Set(asignacionesConfirmadas);
        nuevasConfirmadas.add(index);
        setAsignacionesConfirmadas(nuevasConfirmadas);

        // Remover de rechazadas si estaba
        const nuevasRechazadas = new Set(asignacionesRechazadas);
        nuevasRechazadas.delete(index);
        setAsignacionesRechazadas(nuevasRechazadas);

        showNotification('✅ Asignación confirmada correctamente', 'success');
    };

    // Rechazar asignación
    const rechazarAsignacion = (index: number, resultado: ResultadoAsignacion) => {
        const nuevasRechazadas = new Set(asignacionesRechazadas);
        nuevasRechazadas.add(index);
        setAsignacionesRechazadas(nuevasRechazadas);

        // Remover de confirmadas si estaba
        const nuevasConfirmadas = new Set(asignacionesConfirmadas);
        nuevasConfirmadas.delete(index);
        setAsignacionesConfirmadas(nuevasConfirmadas);

        // Eliminar el horario de la base de datos si existe
        if (resultado.exito && resultado.espacioId) {
            const horarios = db.getHorarios();
            const horarioAEliminar = horarios.find(h =>
                h.espacioId === resultado.espacioId &&
                h.diaSemana === resultado.horario.diaSemana &&
                h.horaInicio === resultado.horario.horaInicio
            );
            if (horarioAEliminar) {
                db.deleteHorario(horarioAEliminar.id);
            }
        }

        showNotification('❌ Asignación rechazada', 'info');
    };

    // Ver calendario del horario
    const verCalendarioHorario = (resultado: ResultadoAsignacion) => {
        setHorarioSeleccionado(resultado);
        setMostrarCalendario(true);
    };

    // Capitalizar primera letra
    const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Agrupar resultados por grupo
    const gruposUnicos = [...new Set(resultados.filter(r => r.exito).map(r => r.horario.grupo))];

    // Ver horario completo de un grupo
    const verHorarioCompleto = (grupo: string) => {
        const horariosDelGrupo = resultados.filter(r => r.exito && r.horario.grupo === grupo);
        setGrupoSeleccionado(grupo);
        setHorariosGrupoSeleccionado(horariosDelGrupo);
        setMostrarHorarioCompleto(true);
    };

    // Confirmar TODO el grupo
    const confirmarGrupoCompleto = () => {
        const nuevasConfirmadas = new Set(asignacionesConfirmadas);
        horariosGrupoSeleccionado.forEach((_, index) => {
            const globalIndex = resultados.findIndex(r => r === horariosGrupoSeleccionado[index]);
            if (globalIndex !== -1) {
                nuevasConfirmadas.add(globalIndex);
            }
        });
        setAsignacionesConfirmadas(nuevasConfirmadas);
        setMostrarHorarioCompleto(false);
        showNotification(`✅ Horario completo del grupo ${grupoSeleccionado} confirmado`, 'success');
    };

    // Rechazar TODO el grupo
    const rechazarGrupoCompleto = () => {
        const nuevasRechazadas = new Set(asignacionesRechazadas);
        horariosGrupoSeleccionado.forEach((resultado, index) => {
            const globalIndex = resultados.findIndex(r => r === horariosGrupoSeleccionado[index]);
            if (globalIndex !== -1) {
                nuevasRechazadas.add(globalIndex);

                // Eliminar el horario de la base de datos
                if (resultado.exito && resultado.espacioId) {
                    const horarios = db.getHorarios();
                    const horarioAEliminar = horarios.find(h =>
                        h.espacioId === resultado.espacioId &&
                        h.diaSemana === resultado.horario.diaSemana &&
                        h.horaInicio === resultado.horario.horaInicio
                    );
                    if (horarioAEliminar) {
                        db.deleteHorario(horarioAEliminar.id);
                    }
                }
            }
        });
        setAsignacionesRechazadas(nuevasRechazadas);
        setMostrarHorarioCompleto(false);
        showNotification(`❌ Horario completo del grupo ${grupoSeleccionado} rechazado`, 'info');
    };

    // Generar horas del día (6am - 11pm)
    const generarHoras = () => {
        const horas = [];
        for (let i = 6; i <= 23; i++) {
            horas.push(`${i.toString().padStart(2, '0')}:00`);
        }
        return horas;
    };

    // Verificar si hay clase en un día y hora específicos
    const obtenerClaseEnHora = (dia: string, hora: string) => {
        return horariosGrupoSeleccionado.find(h => {
            const diaHorario = h.horario.diaSemana.toLowerCase();
            const horaInicio = h.horario.horaInicio;
            const horaFin = h.horario.horaFin;

            // Convertir horas a minutos para comparación
            const [hInicioH, hInicioM] = horaInicio.split(':').map(Number);
            const [hFinH, hFinM] = horaFin.split(':').map(Number);
            const [horaActualH, horaActualM] = hora.split(':').map(Number);

            const inicioMin = hInicioH * 60 + hInicioM;
            const finMin = hFinH * 60 + hFinM;
            const actualMin = horaActualH * 60 + horaActualM;

            return diaHorario === dia.toLowerCase() && actualMin >= inicioMin && actualMin < finMin;
        });
    };

    return {
        archivo,
        horariosImportados,
        procesando,
        progreso,
        resultados,
        etapa,
        asignacionesConfirmadas,
        asignacionesRechazadas,
        horarioSeleccionado,
        mostrarCalendario,
        mostrarHorarioCompleto,
        grupoSeleccionado,
        horariosGrupoSeleccionado,
        handleFileChange,
        iniciarAsignacionAutomatica,
        descargarPlantilla,
        reiniciar,
        confirmarAsignacion,
        rechazarAsignacion,
        verCalendarioHorario,
        verHorarioCompleto,
        confirmarGrupoCompleto,
        rechazarGrupoCompleto,
        setMostrarCalendario,
        setMostrarHorarioCompleto,
        generarHoras,
        obtenerClaseEnHora,
        capitalize,
        gruposUnicos,
        notification
    };
}
