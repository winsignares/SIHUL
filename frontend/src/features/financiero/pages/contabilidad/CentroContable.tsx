import { motion } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Building2, Landmark, RefreshCw } from 'lucide-react';
import { useCentroContable } from '../../hooks/contabilidad/useCentroContable';
import type { TabKey } from '../../hooks/contabilidad/centroContableUtils';
import { PestanaCuentas } from '../../components/centroContable/PestanaCuentas';
import { PestanaCentros } from '../../components/centroContable/PestanaCentros';
import { DialogoCuenta } from '../../components/centroContable/DialogoCuenta';
import { DialogoCentro } from '../../components/centroContable/DialogoCentro';

export default function CentroContable() {
  const centroContable = useCentroContable();
  const { activeTab, setActiveTab, fetchCuentas, fetchCentros } = centroContable;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-700 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Landmark className="w-8 h-8 text-amber-300" />
              Centro Contable & Costos
            </h1>
            <p className="text-red-100 text-sm">
              Portal maestro para administrar cuentas contables y centros de costo con trazabilidad completa.
            </p>
          </div>
          <Button onClick={() => { void fetchCuentas(); void fetchCentros(); }} className="bg-white/15 border border-white/30 hover:bg-white/25 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-3">
            <CardTitle className="text-slate-900">Gestión contable centralizada</CardTitle>
            <TabsList className="grid w-full max-w-3xl grid-cols-2">
              <TabsTrigger value="cuentas" className="gap-2">
                <Landmark className="w-4 h-4" />
                Cuentas contables
              </TabsTrigger>
              <TabsTrigger value="centros" className="gap-2">
                <Building2 className="w-4 h-4" />
                Centros de costo
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="cuentas" className="space-y-5">
              <PestanaCuentas {...centroContable} />
            </TabsContent>

            <TabsContent value="centros" className="space-y-5">
              <PestanaCentros {...centroContable} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <DialogoCuenta {...centroContable} />

      <DialogoCentro {...centroContable} />
    </div>
  );
}
