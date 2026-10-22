import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lightbulb, PauseCircle, PlayCircle, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../share/badge';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../share/dialog';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Switch } from '../../share/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Textarea } from '../../share/textarea';
import { chatbotAdminAPI } from '../../services/chatbot/chatbotAdminAPI';
import type { ChatbotAgente, ConfigSeccionalesChatbot, PreguntaSugeridaChatbot } from '../../models/chatbot/chatbotAdmin.model';

type Borrador = { id: number | null; pregunta: string; orden: number; activo: boolean; seccional: string };

const TODAS = 'todas';

// apiClient lanza un objeto { message, status } (no una instancia de Error)
const mensajeDeError = (error: unknown, respaldo: string) => {
    if (error && typeof error === 'object' && 'message' in error) {
        const { message } = error as { message: unknown };
        if (typeof message === 'string' && message) return message;
    }
    return respaldo;
};

/**
 * Preguntas sugeridas: los atajos que el chat muestra bajo «Preguntas sugeridas».
 * Pueden ser generales (todas las seccionales) o de una seccional. Quien no es administrador
 * global escribe siempre para la seccional de su usuario y solo edita las suyas.
 */
export function PreguntasSugeridasTab({ chatbots }: { chatbots: ChatbotAgente[] }) {
    const [config, setConfig] = useState<ConfigSeccionalesChatbot | null>(null);
    const [agenteId, setAgenteId] = useState('');
    const [items, setItems] = useState<PreguntaSugeridaChatbot[]>([]);
    const [loading, setLoading] = useState(false);
    const [borrador, setBorrador] = useState<Borrador | null>(null);
    const [saving, setSaving] = useState(false);
    const [accionId, setAccionId] = useState<number | null>(null);

    const chatbotsActivos = useMemo(() => chatbots.filter((chatbot) => chatbot.activo), [chatbots]);
    const seccionalesPorId = useMemo(() => new Map((config?.seccionales ?? []).map((s) => [s.id, s.ciudad])), [config]);
    const puedeElegir = Boolean(config?.puede_elegir_seccional);
    const nombreSeccionalPropia = config?.seccional_propia ? seccionalesPorId.get(config.seccional_propia) : undefined;

    useEffect(() => {
        chatbotAdminAPI.obtenerSeccionales().then(setConfig).catch(() => setConfig(null));
    }, []);

    useEffect(() => {
        if (!agenteId && chatbotsActivos.length > 0) setAgenteId(String(chatbotsActivos[0].id));
    }, [agenteId, chatbotsActivos]);

    const cargar = useCallback(async () => {
        if (!agenteId) return;
        setLoading(true);
        try {
            setItems(await chatbotAdminAPI.listarPreguntasSugeridas(Number(agenteId)));
        } catch (error) {
            toast.error(mensajeDeError(error, 'No se pudieron cargar las preguntas sugeridas.'));
        } finally {
            setLoading(false);
        }
    }, [agenteId]);

    useEffect(() => { void cargar(); }, [cargar]);

    const esEditable = (item: PreguntaSugeridaChatbot) => puedeElegir || (item.seccional !== null && item.seccional === config?.seccional_propia);

    const abrirNueva = () => setBorrador({
        id: null,
        pregunta: '',
        orden: items.length + 1,
        activo: true,
        seccional: puedeElegir ? TODAS : String(config?.seccional_propia ?? ''),
    });

    const abrirEdicion = (item: PreguntaSugeridaChatbot) => setBorrador({
        id: item.id,
        pregunta: item.pregunta,
        orden: item.orden,
        activo: item.activo,
        seccional: item.seccional === null ? TODAS : String(item.seccional),
    });

    const guardar = async () => {
        if (!borrador || !agenteId) return;
        if (!borrador.pregunta.trim()) {
            toast.error('Escribe la pregunta.');
            return;
        }
        setSaving(true);
        try {
            const datos = {
                agente: Number(agenteId),
                pregunta: borrador.pregunta.trim(),
                orden: Math.max(0, Math.round(borrador.orden) || 0),
                activo: borrador.activo,
                ...(puedeElegir ? { seccional: borrador.seccional === TODAS ? null : Number(borrador.seccional) } : {}),
            };
            if (borrador.id) await chatbotAdminAPI.actualizarPreguntaSugerida(borrador.id, datos);
            else await chatbotAdminAPI.crearPreguntaSugerida(datos);
            toast.success(borrador.id ? 'Pregunta actualizada.' : 'Pregunta sugerida agregada.');
            setBorrador(null);
            await cargar();
        } catch (error) {
            toast.error(mensajeDeError(error, 'No fue posible guardar la pregunta.'));
        } finally {
            setSaving(false);
        }
    };

    const alternarActiva = async (item: PreguntaSugeridaChatbot) => {
        setAccionId(item.id);
        try {
            await chatbotAdminAPI.actualizarPreguntaSugerida(item.id, { activo: !item.activo });
            await cargar();
        } catch (error) {
            toast.error(mensajeDeError(error, 'No fue posible cambiar el estado.'));
        } finally {
            setAccionId(null);
        }
    };

    const eliminar = async (item: PreguntaSugeridaChatbot) => {
        if (!window.confirm('¿Eliminar esta pregunta sugerida?')) return;
        setAccionId(item.id);
        try {
            await chatbotAdminAPI.eliminarPreguntaSugerida(item.id);
            toast.success('Pregunta eliminada.');
            await cargar();
        } catch (error) {
            toast.error(mensajeDeError(error, 'No fue posible eliminar la pregunta.'));
        } finally {
            setAccionId(null);
        }
    };

    return <>
        <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base text-slate-900"><Lightbulb className="h-5 w-5 text-red-700" />Preguntas sugeridas</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">
                            Los atajos que el chat muestra a los usuarios. {puedeElegir ? 'Puedes dejarlas para todas las seccionales o para una sola.' : `Las que escribas se muestran solo en tu seccional${nombreSeccionalPropia ? ` (${nombreSeccionalPropia})` : ''}; las generales las administra el administrador.`}
                        </p>
                    </div>
                    <Button size="sm" onClick={abrirNueva} disabled={!agenteId} className="bg-red-700 text-white hover:bg-red-800"><Plus className="mr-2 h-4 w-4" />Nueva pregunta</Button>
                </div>
                <div className="max-w-sm space-y-2">
                    <Label>Chatbot</Label>
                    <Select value={agenteId || undefined} onValueChange={setAgenteId} disabled={chatbotsActivos.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Selecciona un chatbot" /></SelectTrigger>
                        <SelectContent>{chatbotsActivos.map((chatbot) => <SelectItem key={chatbot.id} value={String(chatbot.id)}>{chatbot.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
                {loading ? <p className="px-6 py-5 text-sm text-slate-500 sm:px-0">Cargando preguntas...</p> : (
                    <div className="overflow-x-auto sm:rounded-xl sm:border"><Table className="min-w-[680px]">
                        <TableHeader><TableRow className="bg-slate-50"><TableHead className="w-[48%] text-center">Pregunta</TableHead><TableHead className="text-center">Se muestra en</TableHead><TableHead className="text-center">Orden</TableHead><TableHead className="text-center">Usos</TableHead><TableHead className="text-center">Estado</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {items.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Este chatbot aún no tiene preguntas sugeridas para tu seccional.</TableCell></TableRow> : items.map((item) => {
                                const editable = esEditable(item);
                                return <TableRow key={item.id}>
                                    <TableCell className="whitespace-normal break-words text-left text-slate-800">{item.pregunta}</TableCell>
                                    <TableCell className="text-center">{item.seccional === null ? <Badge variant="outline">Todas las seccionales</Badge> : <Badge className="bg-red-50 text-red-800 hover:bg-red-50">{item.seccional_nombre ?? seccionalesPorId.get(item.seccional)}</Badge>}</TableCell>
                                    <TableCell className="text-center">{item.orden}</TableCell>
                                    <TableCell className="text-center">{item.contador_uso}</TableCell>
                                    <TableCell className="text-center"><Badge className={item.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{item.activo ? 'Activa' : 'Inactiva'}</Badge></TableCell>
                                    <TableCell><div className="flex justify-center gap-2">
                                        <Button size="sm" variant="outline" disabled={!editable} onClick={() => abrirEdicion(item)} title={editable ? 'Editar pregunta' : 'Solo la edita el administrador'}><Settings2 className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="outline" disabled={!editable || accionId === item.id} onClick={() => void alternarActiva(item)} title={item.activo ? 'Desactivar' : 'Activar'}>{item.activo ? <PauseCircle className="h-4 w-4 text-amber-600" /> : <PlayCircle className="h-4 w-4 text-emerald-600" />}</Button>
                                        <Button size="sm" variant="destructive" disabled={!editable || accionId === item.id} onClick={() => void eliminar(item)} title="Eliminar pregunta"><Trash2 className="h-4 w-4" /></Button>
                                    </div></TableCell>
                                </TableRow>;
                            })}
                        </TableBody>
                    </Table></div>
                )}
            </CardContent>
        </Card>

        <Dialog open={Boolean(borrador)} onOpenChange={(abierto) => { if (!abierto) setBorrador(null); }}>
            <DialogContent className="sm:!max-w-[560px]">
                <DialogHeader><DialogTitle>{borrador?.id ? 'Editar pregunta sugerida' : 'Nueva pregunta sugerida'}</DialogTitle></DialogHeader>
                {borrador && <div className="space-y-4 py-2">
                    <div className="space-y-2"><Label>Pregunta <span className="text-red-600">*</span></Label><Textarea rows={3} maxLength={300} placeholder="Ej.: ¿Cuál es el horario de atención de la biblioteca?" value={borrador.pregunta} onChange={(event) => setBorrador({ ...borrador, pregunta: event.target.value })} /></div>
                    <div className="space-y-2"><Label>Se muestra en</Label>
                        {puedeElegir ? <Select value={borrador.seccional} onValueChange={(valor) => setBorrador({ ...borrador, seccional: valor })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value={TODAS}>Todas las seccionales</SelectItem>{(config?.seccionales ?? []).map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.ciudad}</SelectItem>)}</SelectContent>
                        </Select> : <Input value={nombreSeccionalPropia ?? 'Sin seccional asignada'} disabled />}
                        {!puedeElegir && <p className="text-xs text-slate-500">Se guarda para la seccional de tu usuario.</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Orden</Label><Input type="number" min={0} value={borrador.orden} onChange={(event) => setBorrador({ ...borrador, orden: Number(event.target.value) })} /></div>
                        <div className="flex items-end gap-3 pb-2"><Switch checked={borrador.activo} onCheckedChange={(valor) => setBorrador({ ...borrador, activo: valor })} /><Label>Activa</Label></div>
                    </div>
                </div>}
                <DialogFooter><Button variant="outline" onClick={() => setBorrador(null)} disabled={saving}>Cancelar</Button><Button onClick={() => void guardar()} disabled={saving} className="bg-red-700 text-white hover:bg-red-800"><Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar'}</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </>;
}
