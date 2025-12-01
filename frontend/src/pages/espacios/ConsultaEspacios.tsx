import { Input } from '../../share/input';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Search, MapPin, Users, Home, Grid3x3, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../share/tooltip';
import { useConsultaEspacios } from '../../hooks/espacios/useConsultaEspacios';

export default function ConsultaEspacios() {
  const {
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    vistaActual,
    setVistaActual,
    tiposEspacio,
    diasSemana,
    horas,
    filteredEspacios,
    estadisticas,
    getOcupacionPorHora
  } = useConsultaEspacios();

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Disponible</Badge>;
      case 'ocupado':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Ocupado</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Mantenimiento</Badge>;
      default:
        return null;
    }
  };

  const getCeldaOcupacion = (espacioId: string, dia: string, hora: number) => {
    const ocupacion = getOcupacionPorHora(espacioId, dia, hora);

    if (!ocupacion) {
      return (
        <TooltipProvider key={`${espacioId}-${dia}-${hora}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-12 border border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer rounded"></div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-green-700">Disponible</p>
              <p className="text-xs text-slate-600">{hora}:00 - {hora + 1}:00</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Si es la hora de inicio del bloque
    if (hora === ocupacion.horaInicio) {
      const colorClass = ocupacion.estado === 'ocupado'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-yellow-600 hover:bg-yellow-700 text-white';

      return (
        <TooltipProvider key={`${espacioId}-${dia}-${hora}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`h-12 border border-white ${colorClass} transition-all cursor-pointer rounded flex items-center justify-center p-1`}
                style={{
                  gridRow: `span 1`,
                }}
              >
                <span className="text-xs text-center truncate">{ocupacion.materia}</span>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{ocupacion.materia}</p>
              <p className="text-xs">{ocupacion.horaInicio}:00 - {ocupacion.horaFin}:00</p>
              <p className="text-xs">
                {ocupacion.estado === 'ocupado' ? 'Ocupado' : 'Mantenimiento'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Si está dentro del bloque pero no es la hora de inicio, no renderizar nada
    // (el bloque de la hora de inicio ya ocupa el espacio)
    return null;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Disponibilidad de Espacios</h1>
        <p className="text-slate-600 dark:text-slate-400">Consultas la disponibilidad de aulas, laboratorios y espacios</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Total Espaciosss</p>
                <p className="text-slate-900 dark:text-slate-100">{estadisticas.total}</p>
              </div>
              <Home className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Disponibles</p>
                <p className="text-slate-900 dark:text-slate-100">{estadisticas.disponibles}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Ocupados</p>
                <p className="text-slate-900 dark:text-slate-100">{estadisticas.ocupados}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Mantenimiento</p>
                <p className="text-slate-900 dark:text-slate-100">{estadisticas.mantenimiento}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={vistaActual === 'tarjetas' ? 'default' : 'outline'}
            onClick={() => setVistaActual('tarjetas')}
            className={vistaActual === 'tarjetas'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
            }
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Vista Tarjetas
          </Button>
          <Button
            variant={vistaActual === 'cronograma' ? 'default' : 'outline'}
            onClick={() => setVistaActual('cronograma')}
            className={vistaActual === 'cronograma'
              ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
              : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950'
            }
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Vista Cronograma
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar espacio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {tiposEspacio.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="ocupado">Ocupado</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Based on View */}
      {vistaActual === 'tarjetas' ? (
        /* Espacios Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEspacios.map(espacio => (
            <motion.div
              key={espacio.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow bg-white dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100 mb-2">{espacio.nombre}</CardTitle>
                      <Badge variant="outline" className="border-blue-600 text-blue-600">
                        {espacio.tipo}
                      </Badge>
                    </div>
                    {getEstadoBadge(espacio.estado)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>Capacidad: {espacio.capacidad} personas</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>{espacio.sede} - Edificio {espacio.edificio}</span>
                  </div>
                  {espacio.proximaClase && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                      <p className="text-slate-600 dark:text-slate-400">Próxima clase:</p>
                      <p className="text-blue-700 dark:text-blue-300">{espacio.proximaClase}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Cronograma View */
        <div className="space-y-6">
          {/* Leyenda */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-600 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Mantenimiento</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cronograma por Espacio */}
          {filteredEspacios.map((espacio) => (
            <motion.div
              key={espacio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">{espacio.nombre}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          {espacio.tipo}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-600">
                          Capacidad: {espacio.capacidad}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-600">
                          Edificio {espacio.edificio}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Header de días */}
                      <div className="grid grid-cols-6 gap-2 mb-2">
                        <div className="text-sm text-slate-600 dark:text-slate-400 p-2"></div>
                        {diasSemana.map((dia) => (
                          <div key={dia} className="text-sm text-center text-slate-900 dark:text-slate-100 p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded">
                            {dia}
                          </div>
                        ))}
                      </div>

                      {/* Grid de horarios */}
                      {horas.map((hora) => (
                        <div key={hora} className="grid grid-cols-6 gap-2 mb-1">
                          <div className="text-sm text-slate-600 dark:text-slate-400 p-2 flex items-center">
                            {hora}:00
                          </div>
                          {diasSemana.map((dia) => (
                            <div key={`${dia}-${hora}`}>
                              {getCeldaOcupacion(espacio.id, dia, hora)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
