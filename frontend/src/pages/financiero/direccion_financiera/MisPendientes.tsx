import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { AlertCircle, Clock3, Eye, Search, Loader2, RefreshCw } from 'lucide-react';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { Input } from '../../../share/input';
import { useMisPendientes } from '../../../hooks/financiero/direccion_financiera';

export default function MisPendientes() {
  const {
    pendientes,
    cargando,
    error,
    search,
    detailOpen,
    selected,
    totalPendiente,
    criticos,
    promedioEspera,
    setSearch,
    setDetailOpen,
    abrirDetalle,
    recargar,
  } = useMisPendientes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Mis Pendientes de Cargue</h1>
            <p className="text-yellow-100">Facturas recibidas desde Tesoreria para cargue y validacion final</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-yellow-100">Total en cola</p>
            <p className="text-3xl font-bold">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-3xl font-bold text-slate-800">{cargando ? '-' : pendientes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Criticos (&gt; 3 dias)</p>
            <p className="text-3xl font-bold text-red-700">{cargando ? '-' : criticos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Promedio de espera</p>
            <p className="text-3xl font-bold text-amber-700">{cargando ? '-' : `${promedioEspera} dias`}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cola de Prioridades */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cola de Prioridades</CardTitle>
              <CardDescription>Filtra y abre el detalle para gestionar trazabilidad completa</CardDescription>
            </div>
            <Button onClick={recargar} variant="outline" size="sm" disabled={cargando}>
              <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              className="pl-9" 
              placeholder="Buscar por factura, proveedor o radicado" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          {/* Loading state */}
          {cargando ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" /> Cargando facturas...
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          ) : pendientes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay facturas pendientes de cargue</p>
              <p className="text-sm mt-1">Las facturas remitidas por Tesoreria apareceran aqui</p>
            </div>
          ) : (
            /* Lista de pendientes */
            <div className="space-y-3">
              {pendientes.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{item.numeroFactura}</p>
                      <p className="text-sm text-slate-600">{item.proveedor}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{item.numeroRadicado}</Badge>
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">{item.estado}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-800">${item.valorTotal.toLocaleString('es-CO')}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.areaSolicitante}</p>
                      <div className="inline-flex items-center gap-1 mt-2 text-xs text-slate-600">
                        <Clock3 className="w-3 h-3" />
                        {item.diasTranscurridos} dias
                      </div>
                    </div>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => abrirDetalle(item)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Ver detalle
                    </Button>
                  </div>
                  {(item.diasTranscurridos || 0) > 3 && (
                    <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-2 text-red-700 text-xs inline-flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Requiere atencion prioritaria por tiempo de permanencia.
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detalle */}
      <FacturaDetailModal
        factura={selected}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
        }}
      />
    </div>
  );
}
