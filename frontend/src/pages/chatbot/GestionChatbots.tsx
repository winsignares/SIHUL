import { motion } from 'motion/react';
import { Bot, FilePenLine, FileText, FileUp, PauseCircle, PlayCircle, Plus, Save, Search, Settings2, Trash2, UploadCloud } from 'lucide-react';
import { Badge } from '../../share/badge';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../share/dialog';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Switch } from '../../share/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../share/tabs';
import { Textarea } from '../../share/textarea';
import { useGestionChatbots } from '../../hooks/chatbot/useGestionChatbots';

const mostrarSeccional = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function GestionChatbots() {
  const state = useGestionChatbots();
  const {
    chatbots, chatbotsPorId, documentosFiltrados, chatbotsDisponiblesParaCarga, seccionalUsuario, seccionalValida, puedeGestionarChatbots,
    loadingDocumentos, loadingSeccional, uploading, accionId,
    filtroChatbotId, setFiltroChatbotId, busquedaDocumento, setBusquedaDocumento,
    uploadChatbotId, setUploadChatbotId, uploadFile, seleccionarArchivoCarga, uploadInputKey, puedeSubirDocumento,
    subirDocumento, eliminarDocumento, abrirActualizacionDocumento,
  } = state;

  return (
    <div className="w-full space-y-6 p-4 md:p-6 lg:p-8">
      <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 px-6 py-7 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="relative">
          <h1 className="flex items-center gap-3 text-2xl font-bold lg:text-3xl"><FileText className="h-8 w-8 text-amber-300" />Gestión de documentación de chatbots</h1>
          <p className="mt-2 max-w-3xl text-sm text-red-50">Administra la documentación que usan los asistentes virtuales de tu seccional.</p>
          {!loadingSeccional && seccionalValida && <Badge className="mt-4 border border-white/25 bg-white/15 text-white hover:bg-white/15">Seccional: {mostrarSeccional(seccionalUsuario)}</Badge>}
        </div>
      </motion.section>

      {!loadingSeccional && !seccionalValida && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Tu usuario no tiene una seccional compatible asignada. Solicita al administrador global que complete la sede de tu perfil.</div>}

      <Tabs defaultValue="documentos" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="documentos" className="flex items-center gap-2"><FileText className="h-4 w-4" />Documentos</TabsTrigger>
          {puedeGestionarChatbots && <TabsTrigger value="chatbots" className="flex items-center gap-2"><Bot className="h-4 w-4" />Chatbots disponibles</TabsTrigger>}
        </TabsList>

        <TabsContent value="documentos" className="space-y-5">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70"><CardTitle className="flex items-center gap-2 text-base text-slate-900"><UploadCloud className="h-5 w-5 text-red-700" />Montar documento</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Chatbot <span className="text-red-600">*</span></Label>
                  <Select value={uploadChatbotId || undefined} onValueChange={setUploadChatbotId} disabled={!seccionalValida || loadingDocumentos || chatbotsDisponiblesParaCarga.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un chatbot" /></SelectTrigger>
                    <SelectContent>{chatbotsDisponiblesParaCarga.map((chatbot) => <SelectItem key={chatbot.id} value={String(chatbot.id)}>{chatbot.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Seccional</Label><Input value={seccionalValida ? mostrarSeccional(seccionalUsuario) : 'Sin seccional asignada'} disabled /></div>
                <div className="space-y-2">
                  <Label>Documento PDF (máximo 15 MB) <span className="text-red-600">*</span></Label>
                  <Input key={uploadInputKey} type="file" accept=".pdf,application/pdf" disabled={!seccionalValida || loadingDocumentos || chatbotsDisponiblesParaCarga.length === 0} onChange={(event) => seleccionarArchivoCarga(event.target.files?.[0] ?? null)} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs text-slate-500">{chatbotsDisponiblesParaCarga.length === 0 && seccionalValida ? 'Todos los chatbots activos ya tienen un documento para esta seccional.' : uploadFile ? `Seleccionado: ${uploadFile.name}` : 'Selecciona un archivo permitido.'}</p>
                <Button onClick={() => void subirDocumento()} disabled={!puedeSubirDocumento} className="bg-red-700 text-white hover:bg-red-800"><FileUp className="mr-2 h-4 w-4" />{uploading ? 'Procesando...' : 'Montar documento'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-4 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-base text-slate-900">Documentos de la seccional</CardTitle>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_280px]">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={busquedaDocumento} onChange={(event) => setBusquedaDocumento(event.target.value)} placeholder="Buscar por documento o chatbot" className="pl-9" /></div>
                <Select value={filtroChatbotId} onValueChange={setFiltroChatbotId}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por chatbot" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos los chatbots</SelectItem>{chatbots.map((chatbot) => <SelectItem key={chatbot.id} value={String(chatbot.id)}>{chatbot.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {loadingDocumentos ? <p className="px-6 py-5 text-sm text-slate-500 sm:px-0">Cargando documentos...</p> : (
                <div className="overflow-x-auto sm:rounded-xl sm:border"><Table>
                  <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-center">Nombre del documento</TableHead><TableHead className="text-center">Chatbot asignado</TableHead><TableHead className="text-center">Seccional</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {documentosFiltrados.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">No hay documentos para esta seccional y los filtros seleccionados.</TableCell></TableRow> : documentosFiltrados.map((documento) => {
                      const chatbotNombre = documento.chatbot_id ? chatbotsPorId[documento.chatbot_id]?.nombre : null;
                      return <TableRow key={documento.id}>
                        <TableCell className="text-center font-medium text-slate-800">{documento.filename}</TableCell>
                        <TableCell className="text-center">{chatbotNombre ? <Badge variant="outline">{chatbotNombre}</Badge> : <span className="text-xs text-slate-400">Sin asignar</span>}</TableCell>
                        <TableCell className="text-center">{mostrarSeccional(documento.sede)}</TableCell>
                        <TableCell><div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => abrirActualizacionDocumento(documento)} title="Actualizar documento"><FilePenLine className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" disabled={accionId === documento.id} onClick={() => void eliminarDocumento(documento)} title="Eliminar documento"><Trash2 className="h-4 w-4" /></Button>
                        </div></TableCell>
                      </TableRow>;
                    })}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {puedeGestionarChatbots && <TabsContent value="chatbots"><ChatbotsTable state={state} /></TabsContent>}
      </Tabs>

      <ActualizarDocumentoDialog state={state} />
      {puedeGestionarChatbots && <ChatbotDialog state={state} />}
    </div>
  );
}

type GestionState = ReturnType<typeof useGestionChatbots>;

function ChatbotsTable({ state }: { state: GestionState }) {
  const { chatbots, loadingChatbots, accionId, abrirNuevoChatbot, abrirEdicionChatbot, alternarActivoChatbot, eliminarChatbot } = state;
  return <Card className="border-0 shadow-lg">
    <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between">
      <div><CardTitle className="text-base text-slate-900">Chatbots disponibles</CardTitle><p className="mt-1 text-sm text-slate-500">Estos asistentes pueden recibir documentación de la seccional.</p></div>
      <Button size="sm" onClick={abrirNuevoChatbot} className="bg-red-700 text-white hover:bg-red-800"><Plus className="mr-2 h-4 w-4" />Nuevo chatbot</Button>
    </CardHeader>
    <CardContent className="px-0 sm:px-6">
      {loadingChatbots ? <p className="px-6 py-5 text-sm text-slate-500">Cargando chatbots...</p> : <div className="overflow-x-auto sm:rounded-xl sm:border"><Table className="min-w-[760px] table-fixed">
        <TableHeader><TableRow className="bg-slate-50"><TableHead className="w-[20%] text-center">Nombre</TableHead><TableHead className="w-[48%] text-center">Descripción</TableHead><TableHead className="w-[12%] text-center">Estado</TableHead><TableHead className="w-[20%] text-center">Acciones</TableHead></TableRow></TableHeader>
        <TableBody>{chatbots.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">No hay chatbots registrados.</TableCell></TableRow> : chatbots.map((chatbot) => <TableRow key={chatbot.id}>
          <TableCell className="whitespace-normal break-words text-center font-medium">{chatbot.nombre}</TableCell><TableCell className="whitespace-normal break-words px-4 text-left leading-5 text-slate-600">{chatbot.descripcion}</TableCell>
          <TableCell className="text-center"><Badge className={chatbot.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{chatbot.activo ? 'Activo' : 'Inactivo'}</Badge></TableCell>
          <TableCell><div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => abrirEdicionChatbot(chatbot)} title="Editar chatbot"><Settings2 className="h-4 w-4" /></Button><Button size="sm" variant="outline" disabled={accionId === chatbot.id} onClick={() => void alternarActivoChatbot(chatbot)} title={chatbot.activo ? 'Desactivar' : 'Activar'}>{chatbot.activo ? <PauseCircle className="h-4 w-4 text-amber-600" /> : <PlayCircle className="h-4 w-4 text-emerald-600" />}</Button><Button size="sm" variant="destructive" disabled={accionId === chatbot.id} onClick={() => void eliminarChatbot(chatbot)} title="Eliminar chatbot"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>}
    </CardContent>
  </Card>;
}

function ActualizarDocumentoDialog({ state }: { state: GestionState }) {
  const { documentoActualizar, archivoActualizacion, seleccionarArchivoActualizacion, chatbots, cerrarActualizacionDocumento, actualizarDocumento, uploading } = state;
  const chatbotActual = documentoActualizar?.chatbot_id
    ? chatbots.find((chatbot) => chatbot.id === documentoActualizar.chatbot_id)?.nombre || 'Chatbot no disponible'
    : 'Sin chatbot asignado';
  return <Dialog open={Boolean(documentoActualizar)} onOpenChange={(open) => { if (!open) cerrarActualizacionDocumento(); }}>
    <DialogContent className="sm:!max-w-[520px]">
      <DialogHeader><DialogTitle>Actualizar documento</DialogTitle></DialogHeader>
      <p className="text-sm text-slate-600">Reemplaza <strong>{documentoActualizar?.filename}</strong> por una nueva versión.</p>
      <div className="space-y-4 py-2">
        <div className="space-y-2"><Label>Chatbot asignado</Label><Input value={chatbotActual} disabled /></div>
        <div className="space-y-2"><Label>Nuevo PDF (máximo 15 MB)</Label><Input type="file" accept=".pdf,application/pdf" onChange={(event) => seleccionarArchivoActualizacion(event.target.files?.[0] ?? null)} />{archivoActualizacion && <p className="text-xs text-slate-500">Seleccionado: {archivoActualizacion.name}</p>}</div>
      </div>
      <DialogFooter><Button variant="outline" onClick={cerrarActualizacionDocumento} disabled={uploading}>Cancelar</Button><Button onClick={() => void actualizarDocumento()} disabled={uploading} className="bg-red-700 text-white hover:bg-red-800"><FilePenLine className="mr-2 h-4 w-4" />{uploading ? 'Procesando...' : 'Actualizar'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function ChatbotDialog({ state }: { state: GestionState }) {
  const { dialogChatbotOpen, setDialogChatbotOpen, editingChatbotId, form, setForm, guardarChatbot, savingChatbot } = state;
  return <Dialog open={dialogChatbotOpen} onOpenChange={setDialogChatbotOpen}><DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto sm:!max-w-[640px]">
    <DialogHeader><DialogTitle>{editingChatbotId ? 'Editar chatbot' : 'Nuevo chatbot'}</DialogTitle></DialogHeader>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2"><Label>Nombre <span className="text-red-600">*</span></Label><Input value={form.nombre} onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Subtítulo</Label><Input value={form.subtitulo} onChange={(event) => setForm((prev) => ({ ...prev, subtitulo: event.target.value }))} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Descripción <span className="text-red-600">*</span></Label><Textarea rows={3} value={form.descripcion} onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Mensaje de bienvenida <span className="text-red-600">*</span></Label><Textarea rows={2} value={form.mensaje_bienvenida} onChange={(event) => setForm((prev) => ({ ...prev, mensaje_bienvenida: event.target.value }))} /></div>
      <div className="space-y-2"><Label>Ícono (lucide-react)</Label><Input value={form.icono} onChange={(event) => setForm((prev) => ({ ...prev, icono: event.target.value }))} /></div>
      <div className="space-y-2"><Label>Orden</Label><Input type="number" value={form.orden} onChange={(event) => setForm((prev) => ({ ...prev, orden: Number(event.target.value) || 0 }))} /></div>
      <div className="flex items-center gap-3 md:col-span-2"><Switch checked={form.activo} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, activo: checked }))} /><Label>Chatbot activo</Label></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={() => setDialogChatbotOpen(false)}>Cancelar</Button><Button onClick={() => void guardarChatbot()} disabled={savingChatbot} className="bg-red-700 text-white hover:bg-red-800"><Save className="mr-2 h-4 w-4" />{savingChatbot ? 'Guardando...' : 'Guardar'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
