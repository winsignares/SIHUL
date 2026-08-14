import { motion } from 'framer-motion';
import {
  Bot,
  FileText,
  FileUp,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
  Settings2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
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

const formatFecha = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function GestionChatbots() {
  const {
    chatbots,
    chatbotsPorId,
    sedes,
    documentos,
    loadingChatbots,
    loadingDocumentos,
    savingChatbot,
    uploading,
    accionId,

    dialogChatbotOpen,
    setDialogChatbotOpen,
    editingChatbotId,
    form,
    setForm,
    abrirNuevoChatbot,
    abrirEdicionChatbot,
    guardarChatbot,
    alternarActivoChatbot,
    eliminarChatbot,

    filtroChatbotId,
    setFiltroChatbotId,
    filtroSede,
    setFiltroSede,

    uploadChatbotId,
    setUploadChatbotId,
    uploadSede,
    setUploadSede,
    uploadFile,
    setUploadFile,
    subirDocumento,
    eliminarDocumento,
  } = useGestionChatbots();

  return (
    <div className="w-full space-y-4 p-4 sm:space-y-6 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900 via-red-800 to-red-950 p-4 text-white shadow-xl sm:rounded-3xl sm:p-6"
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="relative space-y-2">
          <h1 className="flex items-center gap-3 text-xl font-bold sm:text-2xl lg:text-3xl">
            <Settings2 className="h-6 w-6 shrink-0 text-amber-300 sm:h-8 sm:w-8" />
            Gestión de Chatbots
          </h1>
          <p className="max-w-3xl text-sm text-red-100">
            Crea y administra los chatbots institucionales, y sube o elimina los documentos que usa cada uno
            para responder — filtrados por chatbot y por sede/seccional.
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="chatbots" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="chatbots" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chatbots
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB CHATBOTS ================= */}
        <TabsContent value="chatbots">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-slate-900">Chatbots registrados</CardTitle>
              <Button size="sm" onClick={abrirNuevoChatbot} className="w-full bg-red-900 text-white hover:bg-red-950 sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo chatbot
              </Button>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {loadingChatbots ? (
                <p className="px-6 text-sm text-slate-500 sm:px-0">Cargando chatbots...</p>
              ) : (
                <div className="overflow-hidden sm:rounded-xl sm:border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-center">Nombre</TableHead>
                        <TableHead className="text-center">Subtítulo</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Orden</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chatbots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-7 text-center text-slate-500">
                            No hay chatbots registrados todavía.
                          </TableCell>
                        </TableRow>
                      ) : (
                        chatbots.map((chatbot) => {
                          const isProcessing = accionId === chatbot.id;
                          return (
                            <TableRow key={chatbot.id}>
                              <TableCell className="text-center font-medium text-slate-800">{chatbot.nombre}</TableCell>
                              <TableCell className="text-center text-slate-600">{chatbot.subtitulo || '—'}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={chatbot.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                                  {chatbot.activo ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{chatbot.orden ?? 0}</TableCell>
                              <TableCell>
                                <div className="flex justify-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => abrirEdicionChatbot(chatbot)} title="Editar chatbot">
                                    <Settings2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isProcessing}
                                    onClick={() => void alternarActivoChatbot(chatbot)}
                                    title={chatbot.activo ? 'Desactivar' : 'Activar'}
                                    className={chatbot.activo ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}
                                  >
                                    {chatbot.activo ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={isProcessing}
                                    onClick={() => void eliminarChatbot(chatbot)}
                                    title="Eliminar chatbot"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB DOCUMENTOS ================= */}
        <TabsContent value="documentos" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <UploadCloud className="h-5 w-5 text-red-900" />
                Subir documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Chatbot <span className="text-red-600">*</span></Label>
                  <Select value={uploadChatbotId || undefined} onValueChange={setUploadChatbotId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un chatbot" /></SelectTrigger>
                    <SelectContent>
                      {chatbots.map((chatbot) => (
                        <SelectItem key={chatbot.id} value={String(chatbot.id)}>{chatbot.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sede / Seccional <span className="text-red-600">*</span></Label>
                  <Select value={uploadSede || undefined} onValueChange={setUploadSede}>
                    <SelectTrigger><SelectValue placeholder="Selecciona una sede" /></SelectTrigger>
                    <SelectContent>
                      {sedes.map((sede) => (
                        <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Archivo (.pdf, .txt, .md, .csv) <span className="text-red-600">*</span></Label>
                  <Input
                    type="file"
                    accept=".pdf,.txt,.md,.csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                  {uploadFile && (
                    <p className="text-xs text-slate-500">Seleccionado: {uploadFile.name}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => void subirDocumento()} disabled={uploading} className="bg-red-900 text-white hover:bg-red-950">
                  <FileUp className="mr-2 h-4 w-4" />
                  {uploading ? 'Subiendo y procesando...' : 'Subir documento'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-slate-900">Documentos cargados</CardTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select value={filtroChatbotId} onValueChange={setFiltroChatbotId}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por chatbot" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los chatbots</SelectItem>
                    {chatbots.map((chatbot) => (
                      <SelectItem key={chatbot.id} value={String(chatbot.id)}>{chatbot.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroSede} onValueChange={setFiltroSede}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por sede" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sedes</SelectItem>
                    {sedes.map((sede) => (
                      <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {loadingDocumentos ? (
                <p className="px-6 text-sm text-slate-500 sm:px-0">Cargando documentos...</p>
              ) : (
                <div className="overflow-hidden sm:rounded-xl sm:border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-center">Archivo</TableHead>
                        <TableHead className="text-center">Chatbot</TableHead>
                        <TableHead className="text-center">Sede</TableHead>
                        <TableHead className="text-center">Cargado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-7 text-center text-slate-500">
                            No hay documentos para los filtros seleccionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        documentos.map((documento) => {
                          const isProcessing = accionId === documento.id;
                          const chatbotNombre = documento.chatbot_id
                            ? chatbotsPorId[documento.chatbot_id]?.nombre
                            : null;
                          return (
                            <TableRow key={documento.id}>
                              <TableCell className="text-center font-medium text-slate-800">{documento.filename}</TableCell>
                              <TableCell className="text-center">
                                {chatbotNombre ? (
                                  <Badge variant="outline" className="text-slate-700">{chatbotNombre}</Badge>
                                ) : (
                                  <span className="text-xs text-slate-400">Sin asignar</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center capitalize">{documento.sede.replace('_', ' ')}</TableCell>
                              <TableCell className="text-center text-slate-500">{formatFecha(documento.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={isProcessing}
                                    onClick={() => void eliminarDocumento(documento)}
                                    title="Eliminar documento"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogChatbotOpen} onOpenChange={setDialogChatbotOpen}>
        <DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto sm:!max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              {editingChatbotId ? 'Editar chatbot' : 'Nuevo chatbot'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nombre <span className="text-red-600">*</span></Label>
              <Input value={form.nombre} onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Agente Biblioteca" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Subtítulo</Label>
              <Input value={form.subtitulo} onChange={(e) => setForm((prev) => ({ ...prev, subtitulo: e.target.value }))} placeholder="Asistente de servicios bibliotecarios" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descripción <span className="text-red-600">*</span></Label>
              <Textarea rows={3} value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Mensaje de bienvenida <span className="text-red-600">*</span></Label>
              <Textarea rows={2} value={form.mensaje_bienvenida} onChange={(e) => setForm((prev) => ({ ...prev, mensaje_bienvenida: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ícono (lucide-react)</Label>
              <Input value={form.icono} onChange={(e) => setForm((prev) => ({ ...prev, icono: e.target.value }))} placeholder="Bot" />
            </div>
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input
                type="number"
                value={form.orden}
                onChange={(e) => setForm((prev) => ({ ...prev, orden: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.activo} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, activo: checked }))} />
              <Label className="!mb-0">Chatbot activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogChatbotOpen(false)}>Cancelar</Button>
            <Button onClick={() => void guardarChatbot()} disabled={savingChatbot} className="bg-red-900 text-white hover:bg-red-950">
              <Save className="mr-2 h-4 w-4" />
              {savingChatbot ? 'Guardando...' : editingChatbotId ? 'Guardar cambios' : 'Crear chatbot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
