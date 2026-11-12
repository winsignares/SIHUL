import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { AlertCircle, Edit, Loader2, Save, Search, Trash2, X as XIcon } from 'lucide-react';
import type { usePublicPrestamo } from '../../hooks/usePublicPrestamo';

type PublicPrestamo = ReturnType<typeof usePublicPrestamo>;

/** Consulta, edición y eliminación de las solicitudes del solicitante. */
export function MisSolicitudes({
    consultaCredenciales,
    setConsultaCredenciales,
    cargarMisSolicitudes,
    loadingSolicitudes,
    errors,
    modoEdicion,
    solicitudEditando,
    setSolicitudEditando,
    cancelarEdicionSolicitud,
    guardarEdicionSolicitud,
    misSolicitudes,
    iniciarEdicionSolicitud,
    eliminarSolicitud
}: Pick<PublicPrestamo, 'consultaCredenciales' | 'setConsultaCredenciales' | 'cargarMisSolicitudes' | 'loadingSolicitudes' | 'errors' | 'modoEdicion' | 'solicitudEditando' | 'setSolicitudEditando' | 'cancelarEdicionSolicitud' | 'guardarEdicionSolicitud' | 'misSolicitudes' | 'iniciarEdicionSolicitud' | 'eliminarSolicitud'>) {
    const getEstadoBadge = (estado: string) => {
        const estadoLower = estado.toLowerCase();
        if (estadoLower === 'pendiente') {
            return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
        }
        if (estadoLower === 'aprobado') {
            return <Badge className="bg-green-100 text-green-800 border-green-300">Aprobado</Badge>;
        }
        if (estadoLower === 'rechazado') {
            return <Badge className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
        }
        return <Badge variant="outline">{estado}</Badge>;
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 mt-6">
            <CardHeader>
                <CardTitle>Mis Solicitudes</CardTitle>
                <CardDescription>
                    Consulta, edita o elimina tus solicitudes con identificación y correo institucional
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                        placeholder="Identificación"
                        value={consultaCredenciales.identificacion}
                        onChange={(e) => setConsultaCredenciales(prev => ({ ...prev, identificacion: e.target.value }))}
                    />
                    <Input
                        placeholder="Correo institucional"
                        value={consultaCredenciales.correo}
                        onChange={(e) => setConsultaCredenciales(prev => ({ ...prev, correo: e.target.value }))}
                    />
                    <Button
                        onClick={() => cargarMisSolicitudes()}
                        disabled={loadingSolicitudes}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                        {loadingSolicitudes ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Consultando...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Consultar
                            </>
                        )}
                    </Button>
                </div>

                {errors.consulta && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.consulta}
                    </p>
                )}

                {modoEdicion && solicitudEditando && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-900/30">
                        <h3 className="text-slate-900 dark:text-slate-100">Editar Solicitud #{solicitudEditando.id}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    value={solicitudEditando.fecha}
                                    onChange={(e) => setSolicitudEditando({ ...solicitudEditando, fecha: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Hora Inicio</Label>
                                <Input
                                    type="time"
                                    value={solicitudEditando.hora_inicio.slice(0, 5)}
                                    onChange={(e) => setSolicitudEditando({ ...solicitudEditando, hora_inicio: `${e.target.value}:00` })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Hora Fin</Label>
                                <Input
                                    type="time"
                                    value={solicitudEditando.hora_fin.slice(0, 5)}
                                    onChange={(e) => setSolicitudEditando({ ...solicitudEditando, hora_fin: `${e.target.value}:00` })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Asistentes</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={solicitudEditando.asistentes}
                                    onChange={(e) => setSolicitudEditando({ ...solicitudEditando, asistentes: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Espacio</Label>
                                <Input value={solicitudEditando.espacio_nombre} disabled />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Textarea
                                rows={3}
                                value={solicitudEditando.motivo}
                                onChange={(e) => setSolicitudEditando({ ...solicitudEditando, motivo: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={cancelarEdicionSolicitud}>
                                <XIcon className="w-4 h-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button onClick={guardarEdicionSolicitud} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {misSolicitudes.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">No hay solicitudes para mostrar.</p>
                    ) : (
                        misSolicitudes.map((solicitud) => {
                            const puedeEditar = solicitud.estado.toLowerCase() === 'pendiente' || solicitud.estado.toLowerCase() === 'rechazado';

                            return (
                                <div
                                    key={solicitud.id}
                                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-900/20"
                                >
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="space-y-1">
                                            <p className="text-slate-900 dark:text-slate-100">{solicitud.espacio_nombre}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {solicitud.fecha} | {solicitud.hora_inicio.slice(0, 5)} - {solicitud.hora_fin.slice(0, 5)}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{solicitud.tipo_actividad_nombre}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getEstadoBadge(solicitud.estado)}
                                            {puedeEditar && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-orange-600 text-orange-600 hover:bg-orange-50"
                                                        onClick={() => iniciarEdicionSolicitud(solicitud)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            if (window.confirm('¿Seguro que deseas eliminar esta solicitud?')) {
                                                                eliminarSolicitud(solicitud.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Motivo</p>
                                        <p className="text-sm text-slate-800 dark:text-slate-200">{solicitud.motivo}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
