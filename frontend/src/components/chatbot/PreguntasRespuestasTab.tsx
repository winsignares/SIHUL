import { MessageSquarePlus, Paperclip, PauseCircle, PlayCircle, Plus, Save, Search, Settings2, Trash2, Undo2, X } from 'lucide-react';
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
import { useGestionPreguntasRespuestas } from '../../hooks/chatbot/useGestionPreguntasRespuestas';
import { ANEXO_ACCEPT, ANEXO_MAX_MB, ANEXO_MAX_POR_RESPUESTA, type ChatbotAgente } from '../../models/chatbot/chatbotAdmin.model';
import { AnexosRespuesta, formatearTamano } from './AnexosRespuesta';

type Estado = ReturnType<typeof useGestionPreguntasRespuestas>;

/**
 * Preguntas-respuestas oficiales de los chatbots: se muestran en dos columnas
 * (pregunta | respuesta) y el anexo o soporte va dentro de la columna de la respuesta.
 * Cuando un usuario hace esa pregunta en el chat, la respuesta incluye el enlace para
 * descargar el anexo.
 */
export function PreguntasRespuestasTab({ seccional, seccionalValida, chatbots }: {
    seccional: string;
    seccionalValida: boolean;
    chatbots: ChatbotAgente[];
}) {
    const state = useGestionPreguntasRespuestas({ seccional, seccionalValida, chatbots });
    const { items, itemsFiltrados, loading, filtroChatbotId, setFiltroChatbotId, busqueda, setBusqueda, accionId, abrirNueva, abrirEdicion, alternarActivo, eliminar, chatbotsActivos } = state;

    return <>
        <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base text-slate-900"><MessageSquarePlus className="h-5 w-5 text-red-700" />Preguntas y respuestas</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">Respuestas oficiales con su anexo o soporte (Word, PDF o Excel). Cuando alguien haga la pregunta, el chatbot responde con la explicación y el enlace para descargar el anexo.</p>
                    </div>
                    <Button size="sm" onClick={abrirNueva} disabled={!seccionalValida || chatbotsActivos.length === 0} className="bg-red-700 text-white hover:bg-red-800"><Plus className="mr-2 h-4 w-4" />Nueva pregunta</Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_280px]">
                    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por pregunta, respuesta o anexo" className="pl-9" /></div>
                    <Select value={filtroChatbotId} onValueChange={setFiltroChatbotId}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por chatbot" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Todos los chatbots</SelectItem>{chatbots.map((chatbot) => <SelectItem key={chatbot.id} value={String(chatbot.id)}>{chatbot.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
                {loading ? <p className="px-6 py-5 text-sm text-slate-500 sm:px-0">Cargando preguntas y respuestas...</p> : (
                    <div className="overflow-x-auto sm:rounded-xl sm:border"><Table className="min-w-[760px] table-fixed">
                        <TableHeader><TableRow className="bg-slate-50"><TableHead className="w-[38%] text-center">Pregunta</TableHead><TableHead className="w-[47%] text-center">Respuesta</TableHead><TableHead className="w-[15%] text-center">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {itemsFiltrados.length === 0 ? <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-500">{items.length === 0 ? 'No hay preguntas y respuestas registradas en esta seccional.' : 'Ninguna pregunta coincide con los filtros.'}</TableCell></TableRow> : itemsFiltrados.map((item) => (
                                <TableRow key={item.id} className={item.activo ? '' : 'opacity-60'}>
                                    <TableCell className="whitespace-normal break-words align-top">
                                        <p className="font-medium text-slate-800">{item.pregunta}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <Badge variant="outline" className="text-[10px] font-normal">{item.agente_nombre}</Badge>
                                            {!item.activo && <Badge className="bg-slate-100 text-[10px] text-slate-600">Inactiva</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-normal break-words align-top">
                                        <p className="whitespace-pre-line text-sm leading-5 text-slate-600">{item.respuesta}</p>
                                        <AnexosRespuesta anexos={item.anexos} titulo="Anexo / soporte" />
                                    </TableCell>
                                    <TableCell className="align-top"><div className="flex justify-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => abrirEdicion(item)} title="Editar"><Settings2 className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="outline" disabled={accionId === item.id} onClick={() => void alternarActivo(item)} title={item.activo ? 'Desactivar' : 'Activar'}>{item.activo ? <PauseCircle className="h-4 w-4 text-amber-600" /> : <PlayCircle className="h-4 w-4 text-emerald-600" />}</Button>
                                        <Button size="sm" variant="destructive" disabled={accionId === item.id} onClick={() => void eliminar(item)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                                    </div></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table></div>
                )}
            </CardContent>
        </Card>
        <PreguntaRespuestaDialog state={state} />
    </>;
}

function PreguntaRespuestaDialog({ state }: { state: Estado }) {
    const { dialogOpen, cerrarDialogo, editando, form, setForm, chatbotsActivos, anexosNuevos, anexosEliminar, totalAnexos, inputKey, saving, agregarArchivos, quitarArchivoNuevo, alternarEliminarAnexo, guardar } = state;
    const chatbotsSeleccionables = editando && !chatbotsActivos.some((c) => c.id === editando.agente)
        ? [...chatbotsActivos, { id: editando.agente, nombre: editando.agente_nombre } as ChatbotAgente]
        : chatbotsActivos;

    return <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) cerrarDialogo(); }}>
        <DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto sm:!max-w-[680px]">
            <DialogHeader><DialogTitle>{editando ? 'Editar pregunta y respuesta' : 'Nueva pregunta y respuesta'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <div className="space-y-2"><Label>Chatbot <span className="text-red-600">*</span></Label>
                    <Select value={form.agente || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, agente: value }))}>
                        <SelectTrigger><SelectValue placeholder="Selecciona un chatbot" /></SelectTrigger>
                        <SelectContent>{chatbotsSeleccionables.map((chatbot) => <SelectItem key={chatbot.id} value={String(chatbot.id)}>{chatbot.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Pregunta <span className="text-red-600">*</span></Label>
                        <Textarea rows={6} maxLength={1000} placeholder="Ej.: ¿Cómo hago para cancelar una matrícula?" value={form.pregunta} onChange={(event) => setForm((prev) => ({ ...prev, pregunta: event.target.value }))} />
                    </div>
                    <div className="space-y-2"><Label>Respuesta <span className="text-red-600">*</span></Label>
                        <Textarea rows={6} maxLength={5000} placeholder="Explicación que dará el chatbot." value={form.respuesta} onChange={(event) => setForm((prev) => ({ ...prev, respuesta: event.target.value }))} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Paperclip className="h-4 w-4" />Anexos / soporte (opcional)</Label>
                    <Input key={inputKey} type="file" multiple accept={ANEXO_ACCEPT} disabled={totalAnexos >= ANEXO_MAX_POR_RESPUESTA} onChange={(event) => agregarArchivos(event.target.files)} />
                    <p className="text-xs text-slate-500">Word (.doc, .docx), PDF o Excel (.xls, .xlsx), hasta {ANEXO_MAX_MB} MB cada uno y máximo {ANEXO_MAX_POR_RESPUESTA} por respuesta. {totalAnexos}/{ANEXO_MAX_POR_RESPUESTA}</p>

                    {(editando?.anexos.length ?? 0) > 0 && <ul className="space-y-1">
                        {editando!.anexos.map((anexo) => {
                            const quitar = anexosEliminar.includes(anexo.id);
                            return <li key={anexo.id} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${quitar ? 'border-red-200 bg-red-50 text-slate-400 line-through' : 'border-slate-200'}`}>
                                <span className="min-w-0 flex-1 truncate">{anexo.nombre}</span>
                                <span className="text-slate-400">{formatearTamano(anexo.tamano)}</span>
                                <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={() => alternarEliminarAnexo(anexo.id)} title={quitar ? 'Conservar' : 'Quitar anexo'}>{quitar ? <Undo2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-red-600" />}</Button>
                            </li>;
                        })}
                    </ul>}
                    {anexosNuevos.length > 0 && <ul className="space-y-1">
                        {anexosNuevos.map((archivo, index) => <li key={`${archivo.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs">
                            <Badge className="bg-emerald-600 text-[10px] text-white">Nuevo</Badge>
                            <span className="min-w-0 flex-1 truncate">{archivo.name}</span>
                            <span className="text-slate-500">{formatearTamano(archivo.size)}</span>
                            <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={() => quitarArchivoNuevo(index)} title="Quitar"><X className="h-3.5 w-3.5 text-red-600" /></Button>
                        </li>)}
                    </ul>}
                </div>

                <div className="flex items-center gap-3"><Switch checked={form.activo} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, activo: checked }))} /><Label>Activa (el chatbot la usa y entrega sus anexos)</Label></div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={cerrarDialogo} disabled={saving}>Cancelar</Button>
                <Button onClick={() => void guardar()} disabled={saving} className="bg-red-700 text-white hover:bg-red-800"><Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}
