import { horarioFusionadoService, type horarioService } from '../../../horarios/services/horariosAPI';
import { grupoService } from '../../services/grupos/gruposAPI';
import type { HorarioFusionadoExtendido } from './centroHorariosTypes';

type HorariosExtendidosResponse = Awaited<ReturnType<typeof horarioService.listExtendidos>>;

/** Trae los horarios fusionados y completa cada uno con los datos de sus grupos y del horario base (por lotes de 5). */
export async function cargarHorariosFusionados(horarios: HorariosExtendidosResponse['horarios']): Promise<HorarioFusionadoExtendido[]> {
    // Cargar horarios fusionados - procesamiento por lotes para evitar saturación
    const fusionadosResponse = await horarioFusionadoService.list();
    const fusionadosConInfo: HorarioFusionadoExtendido[] = [];
    const BATCH_SIZE = 5; // Procesar máximo 5 horarios fusionados en paralelo

    for (let i = 0; i < fusionadosResponse.horarios_fusionados.length; i += BATCH_SIZE) {
        const batch = fusionadosResponse.horarios_fusionados.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(async (hf): Promise<HorarioFusionadoExtendido | null> => {
                if (!hf.grupo1_id || !hf.grupo2_id) {
                    console.warn(`Horario fusionado inválido (id=${hf.id ?? 'sin-id'}): grupo1_id/grupo2_id requeridos`);
                    return null;
                }

                try {
                    // Obtener información de los grupos
                    const [grupo1, grupo2, grupo3] = await Promise.all([
                        grupoService.get(hf.grupo1_id),
                        grupoService.get(hf.grupo2_id),
                        hf.grupo3_id ? grupoService.get(hf.grupo3_id) : Promise.resolve(null)
                    ]);

                    // Buscar información adicional de horarios
                    const horario1 = horarios.find(h => h.grupo_id === hf.grupo1_id && h.asignatura_id === hf.asignatura_id);
                    const periodoId = grupo1.periodo_id ?? grupo2.periodo_id ?? grupo3?.periodo_id ?? null;
                    
                    return {
                        id: hf.id as number,
                        grupo1_id: hf.grupo1_id,
                        grupo2_id: hf.grupo2_id,
                        grupo3_id: hf.grupo3_id ?? null,
                        grupo1_nombre: grupo1.nombre,
                        grupo2_nombre: grupo2.nombre,
                        grupo3_nombre: grupo3?.nombre || null,
                        periodo_id: periodoId,
                        periodo_nombre: null,
                        asignatura_id: hf.asignatura_id,
                        asignatura_nombre: horario1?.asignatura_nombre || 'N/A',
                        docente_id: horario1?.docente_id ?? null,
                        docente_nombre: horario1?.docente_nombre || 'N/A',
                        espacio_id: horario1?.espacio_id ?? hf.espacio_id,
                        espacio_nombre: horario1?.espacio_nombre || 'N/A',
                        dia_semana: hf.dia_semana,
                        hora_inicio: hf.hora_inicio,
                        hora_fin: hf.hora_fin,
                        cantidad_estudiantes: hf.cantidad_estudiantes ?? null,
                        comentario: hf.comentario ?? null
                    };
                } catch (error) {
                    console.warn(`Error cargando horario fusionado ${hf.id}:`, error);
                    return null;
                }
            })
        );
        fusionadosConInfo.push(...batchResults.filter((item): item is HorarioFusionadoExtendido => item !== null));
    }
    return fusionadosConInfo;
}
