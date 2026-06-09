import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { Badge } from '../../../share/badge';
import { Download, FileSpreadsheet, FileText, History, CalendarRange, FileBarChart2, Filter, Sparkles, Clock3, Database, RefreshCw } from 'lucide-react';
import { reportesFinancieroService, type ExportarReportePayload, type ReporteGenerado } from '../../../services/financiero';
import { toast } from 'sonner';

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

export default function ReportesConsolidadosReal() {
  const [tipoReporte, setTipoReporte] = useState('consolidado_facturas');
  const [formato, setFormato] = useState<'Excel' | 'PDF'>('Excel');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<ReporteGenerado[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const data = await reportesFinancieroService.listarGenerados({ ordering: '-fecha_generacion' });
      setHistorial(data.slice(0, 10));
    } catch {
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    void cargarHistorial();
  }, []);

  const payload = useMemo<ExportarReportePayload>(() => ({
    tipo_reporte: tipoReporte,
    formato,
    filtros: {
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      estado: estado !== 'todos' ? estado : undefined,
    },
  }), [tipoReporte, formato, fechaInicio, fechaFin, estado]);

  const tituloReporte = useMemo(() => {
    if (tipoReporte === 'facturas_pagadas') return 'Facturas Pagadas';
    if (tipoReporte === 'facturas_en_proceso') return 'Facturas en Proceso';
    return 'Consolidado de Facturas';
  }, [tipoReporte]);

  const aplicarRangoRapido = (dias: number) => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - dias);

    setFechaFin(fin.toISOString().slice(0, 10));
    setFechaInicio(inicio.toISOString().slice(0, 10));
  };

  const exportar = async () => {
    setLoading(true);
    try {
      const blob = await reportesFinancieroService.exportar(payload);
      const extension = formato === 'Excel' ? 'xlsx' : 'pdf';
      downloadBlob(blob, `${tipoReporte}_${new Date().toISOString().slice(0, 10)}.${extension}`);
      toast.success(`Reporte ${formato} generado correctamente.`);
      await cargarHistorial();
    } catch (e: any) {
      toast.error(e?.message || 'No fue posible generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileBarChart2 className="w-8 h-8 text-amber-300" />
              Reportes Consolidados
            </h1>
            <p className="text-rose-100 text-sm mt-1">Motor de exportación trazable para análisis financiero, auditoría y cierres institucionales con filtros rápidos y salida lista para uso.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/15 text-white border border-white/25">Histórico dinámico</Badge>
            <Badge className="bg-white/15 text-white border border-white/25">Excel / PDF</Badge>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Tipo seleccionado</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{tituloReporte}</p>
            <p className="text-xs text-slate-600 mt-1">Reporte activo para generar</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Formato de salida</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{formato}</p>
            <p className="text-xs text-slate-600 mt-1">Compatible con análisis y distribución</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-amber-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Histórico reciente</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{historial.length} reportes</p>
            <p className="text-xs text-slate-600 mt-1">Generados y trazados en backend</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-rose-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Rango activo</p>
            <p className="text-sm font-semibold text-slate-900 mt-2">{fechaInicio || '—'} {fechaFin ? `→ ${fechaFin}` : ''}</p>
            <p className="text-xs text-slate-600 mt-1">Ventana de análisis para la exportación</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-rose-700" />
            Generador avanzado de reportes
          </CardTitle>
          <CardDescription>Configura alcance, estado y ventana temporal. Luego exporta en el formato óptimo para tu comité o cierre.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center gap-2">
            <p className="text-xs text-slate-600 mr-2">Rangos rápidos:</p>
            <Button size="sm" variant="outline" onClick={() => aplicarRangoRapido(7)}>7 días</Button>
            <Button size="sm" variant="outline" onClick={() => aplicarRangoRapido(30)}>30 días</Button>
            <Button size="sm" variant="outline" onClick={() => aplicarRangoRapido(90)}>90 días</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFechaInicio('');
                setFechaFin('');
              }}
            >
              Limpiar fechas
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consolidado_facturas">Consolidado de Facturas</SelectItem>
                  <SelectItem value="facturas_pagadas">Facturas Pagadas</SelectItem>
                  <SelectItem value="facturas_en_proceso">Facturas en Proceso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={formato} onValueChange={(value) => setFormato(value as 'Excel' | 'PDF')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Recibida">Recibida</SelectItem>
                  <SelectItem value="Autorizada">Autorizada</SelectItem>
                  <SelectItem value="Pago Aplicado">Pago Aplicado</SelectItem>
                  <SelectItem value="Pagada">Pagada</SelectItem>
                  <SelectItem value="Rechazada por Rectoría">Rechazada por Rectoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CalendarRange className="w-4 h-4 text-slate-500" />Fecha Inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><CalendarRange className="w-4 h-4 text-slate-500" />Fecha Fin</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>

            <div className="flex items-end">
              <Button className="w-full bg-rose-700 hover:bg-rose-800 text-white" onClick={exportar} disabled={loading}>
                {loading ? <Clock3 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {loading ? 'Generando...' : 'Generar y Descargar'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-rose-50 p-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">Reporte activo: <span className="font-semibold text-slate-800">{tituloReporte}</span> · Formato <span className="font-semibold text-slate-800">{formato}</span></p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-slate-700">Estado: {estado === 'todos' ? 'Sin filtro' : estado}</Badge>
              <Badge variant="outline" className="text-slate-700">{fechaInicio || 'Sin fecha inicio'} · {fechaFin || 'Sin fecha fin'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-slate-900"><History className="w-5 h-5 text-rose-700" />Histórico de Reportes</CardTitle>
            <Button size="sm" variant="outline" onClick={() => void cargarHistorial()} disabled={loadingHistorial}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingHistorial ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
          <CardDescription>Últimos reportes generados con fecha y volumen de registros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingHistorial && <p className="text-sm text-slate-500">Cargando historial...</p>}
          {!loadingHistorial && historial.length === 0 && <p className="text-sm text-slate-500">Sin reportes generados recientemente.</p>}
          {historial.map((r) => (
            <div key={r.id} className="border rounded-xl p-3 bg-gradient-to-br from-white to-slate-50 flex items-center justify-between gap-2 hover:shadow-sm transition-shadow">
              <div>
                <p className="font-semibold text-sm text-slate-800">{r.nombre_reporte}</p>
                <p className="text-xs text-slate-500">{new Date(r.fecha_generacion).toLocaleString('es-CO')} · {r.cantidad_registros || 0} registros</p>
              </div>
              <div className="flex items-center gap-2 text-slate-600 rounded-lg bg-white border border-slate-200 px-2 py-1">
                {r.formato === 'Excel' ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                <span className="text-xs">{r.formato}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-emerald-50/70 border-emerald-100 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Exportación basada en datos reales del backend financiero.
        </div>
        <div className="rounded-xl border bg-amber-50/70 border-amber-100 p-3 text-xs text-amber-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Ideal para comités, auditoría y cierres mensuales.
        </div>
        <div className="rounded-xl border bg-blue-50/70 border-blue-100 p-3 text-xs text-blue-800 flex items-center gap-2">
          <CalendarRange className="w-4 h-4" />
          Usa filtros de fecha y estado para reportes más precisos.
        </div>
      </div>
    </div>
  );
}
