import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { FilaVaciaTabla } from '../../../components/common/FilaVaciaTabla';
import { Plus, Edit, Trash2, Building2, Search, Users, BookOpen, MapPin, Boxes, Power, PowerOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useMemo } from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';

import { useFacultadesPrograms } from '../hooks/useFacultadesPrograms';

import Asignaturas from './Asignaturas';
import EspaciosFisicos from './EspaciosFisicos';
import EstadoRecursos from './EstadoRecursos';
import GestionRecursos from './GestionRecursos';
import Grupos from './Grupos';
import Sedes from './Sedes';

import { FacultadModales } from '../components/facultades/FacultadModales';
import { ProgramaModales } from '../components/facultades/ProgramaModales';
import { AsignaturasProgramaModales } from '../components/facultades/AsignaturasProgramaModales';
export default function FacultadesPrograms() {
  const isMobile = useIsMobile();

  const hook = useFacultadesPrograms();
  const {
    searchTerm, setSearchTerm,
    activeTab, setActiveTab,
    setShowCreateFacultad,
    setShowCreatePrograma,
    selectedProgramaForAsignaturas,
    selectedFacultadFilter, setSelectedFacultadFilter,
    reloadKey,
    openEditFacultad,
    openDeleteFacultad,
    toggleFacultadActiva,
    openEditPrograma,
    openDeletePrograma,
    toggleProgramaActivo,
    openAsignaturasModal,
    paginatedFacultades,
    totalFilteredFacultades,
    currentFacultadPage,
    totalFacultadPages,
    facultadPageNumbers,
    goToFacultadPage,
    goToNextFacultadPage,
    goToPrevFacultadPage,
    hasPrevFacultadPageWindow,
    hasNextFacultadPageWindow,
    goToPrevFacultadPageWindow,
    goToNextFacultadPageWindow,
    paginatedProgramas,
    totalFilteredProgramas,
    currentProgramaPage,
    totalProgramaPages,
    programaPageNumbers,
    goToProgramaPage,
    goToNextProgramaPage,
    goToPrevProgramaPage,
    hasPrevProgramaPageWindow,
    hasNextProgramaPageWindow,
    goToPrevProgramaPageWindow,
    goToNextProgramaPageWindow,
    pageSize,
    getProgramasCount,
    getFacultadNombre,
    activeFacultades,
    loading
  } = hook;

  const firstFacultadItemIndex = totalFilteredFacultades === 0 ? 0 : (currentFacultadPage - 1) * pageSize + 1;
  const lastFacultadItemIndex = Math.min(currentFacultadPage * pageSize, totalFilteredFacultades);
  const firstProgramaItemIndex = totalFilteredProgramas === 0 ? 0 : (currentProgramaPage - 1) * pageSize + 1;
  const lastProgramaItemIndex = Math.min(currentProgramaPage * pageSize, totalFilteredProgramas);

  // Generar lista de semestres una sola vez
  const semestresList = useMemo(() => {
    if (!selectedProgramaForAsignaturas) return [];
    return Array.from(
      { length: selectedProgramaForAsignaturas.semestres },
      (_, i) => i + 1
    );
  }, [selectedProgramaForAsignaturas]);

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Centro Institucional</h1>
          <p className="text-slate-600">Gestiona la estructura académica completa de la universidad</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sedes')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'sedes'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <MapPin className="w-5 h-5 inline mr-2" />
          Sedes
        </button>
        <button
          onClick={() => setActiveTab('facultades')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'facultades'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Building2 className="w-5 h-5 inline mr-2" />
          Facultades
        </button>
        <button
          onClick={() => setActiveTab('programas')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'programas'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Programas Académicos
        </button>
        <button
          onClick={() => setActiveTab('asignaturas')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'asignaturas'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <BookOpen className="w-5 h-5 inline mr-2" />
          Asignaturas
        </button>
        <button
          onClick={() => setActiveTab('grupos')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'grupos'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Grupos
        </button>
        <button
          onClick={() => setActiveTab('espacios')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'espacios'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <MapPin className="w-5 h-5 inline mr-2" />
          Espacios Físicos
        </button>
        <button
          onClick={() => setActiveTab('recursos')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'recursos'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Boxes className="w-5 h-5 inline mr-2" />
          Estado de Recursos
        </button>
        <button
          onClick={() => setActiveTab('gestion-recursos')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'gestion-recursos'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Boxes className="w-5 h-5 inline mr-2" />
          Gestión de Recursos
        </button>
      </div>

      {/* Content */}
      {activeTab === 'sedes' ? (
        <Sedes key={reloadKey} />
      ) : activeTab === 'asignaturas' ? (
        <Asignaturas key={reloadKey} />
      ) : activeTab === 'grupos' ? (
        <Grupos key={reloadKey} />
      ) : activeTab === 'espacios' ? (
        <EspaciosFisicos key={reloadKey} />
      ) : activeTab === 'recursos' ? (
        <EstadoRecursos key={reloadKey} />
      ) : activeTab === 'gestion-recursos' ? (
        <GestionRecursos key={reloadKey} />
      ) : (
        <>
          {/* Search and Actions - Solo para Facultades y Programas */}
          {/* Header con botón */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-900 text-lg font-semibold">
                {activeTab === 'facultades' ? 'Gestión de Facultades' : 'Gestión de Programas'}
              </h2>
            </div>
            <Button
              onClick={() => activeTab === 'facultades' ? setShowCreateFacultad(true) : setShowCreatePrograma(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'facultades' ? 'Nueva Facultad' : 'Nuevo Programa'}
            </Button>
          </div>

          {/* Filtros en Card */}
          <Card className="mb-6 border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Label className="text-slate-700 mb-2 block">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder={`Buscar ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro de Facultad (solo en Programas) */}
                {activeTab === 'programas' && (
                  <div className="w-64">
                    <Label className="text-slate-700 mb-2 block">Facultad</Label>
                    <Select value={selectedFacultadFilter} onValueChange={setSelectedFacultadFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las facultades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las facultades</SelectItem>
                        {activeFacultades.map(f => (
                          <SelectItem key={f.id} value={f.id?.toString() || ''}>{f.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-0">
              {activeTab === 'facultades' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Programas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalFilteredFacultades === 0 ? (
                      <FilaVaciaTabla colSpan={4} cargando={loading} mensajeCargando="Cargando facultades..." mensajeVacio="No se encontraron facultades" />
                    ) : (
                      paginatedFacultades.map((facultad) => (
                        <TableRow key={facultad.id}>
                          <TableCell className="text-slate-900">{facultad.nombre}</TableCell>
                          <TableCell className="text-slate-600">
                            {facultad.id ? getProgramasCount(facultad.id) : 0} programa(s)
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={facultad.activa ? 'default' : 'secondary'}
                              className={facultad.activa ? 'bg-green-600' : 'bg-slate-400'}
                            >
                              {facultad.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditFacultad(facultad)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleFacultadActiva(facultad)}
                                className={facultad.activa
                                  ? "border-orange-600 text-orange-600 hover:bg-orange-50"
                                  : "border-green-600 text-green-600 hover:bg-green-50"
                                }
                              >
                                {facultad.activa ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteFacultad(facultad)}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Facultad</TableHead>
                      <TableHead>Semestres</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totalFilteredProgramas === 0 ? (
                      <FilaVaciaTabla colSpan={5} cargando={loading} mensajeCargando="Cargando programas..." mensajeVacio="No se encontraron programas" />
                    ) : (
                      paginatedProgramas.map((programa) => (
                        <TableRow key={programa.id}>
                          <TableCell className="text-slate-900">{programa.nombre}</TableCell>
                          <TableCell className="text-slate-600">{getFacultadNombre(programa.facultadId)}</TableCell>
                          <TableCell className="text-slate-600">{programa.semestres || 0} semestres</TableCell>
                          <TableCell>
                            <Badge
                              variant={programa.activo ? 'default' : 'secondary'}
                              className={programa.activo ? 'bg-green-600' : 'bg-slate-400'}
                            >
                              {programa.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAsignaturasModal(programa)}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                                title="Gestionar asignaturas"
                              >
                                <BookOpen className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditPrograma(programa)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleProgramaActivo(programa)}
                                className={programa.activo
                                  ? "border-orange-600 text-orange-600 hover:bg-orange-50"
                                  : "border-green-600 text-green-600 hover:bg-green-50"
                                }
                              >
                                {programa.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeletePrograma(programa)}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {activeTab === 'facultades' && totalFilteredFacultades > 0 && (
            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Mostrando {firstFacultadItemIndex}-{lastFacultadItemIndex} de {totalFilteredFacultades} facultades
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={goToPrevFacultadPage}
                      disabled={currentFacultadPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={goToPrevFacultadPageWindow}
                        disabled={!hasPrevFacultadPageWindow}
                        className="px-2"
                        title="Ver números de página anteriores"
                        aria-label="Grupo anterior de páginas"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-1 flex-wrap">
                        {facultadPageNumbers.map((pageNumber) => (
                          <Button
                            key={pageNumber}
                            type="button"
                            variant={pageNumber === currentFacultadPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToFacultadPage(pageNumber)}
                            className={pageNumber === currentFacultadPage ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={goToNextFacultadPageWindow}
                        disabled={!hasNextFacultadPageWindow}
                        className="px-2"
                        title="Ver números de página siguientes"
                        aria-label="Grupo siguiente de páginas"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={goToNextFacultadPage}
                      disabled={currentFacultadPage >= totalFacultadPages}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'programas' && totalFilteredProgramas > 0 && (
            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Mostrando {firstProgramaItemIndex}-{lastProgramaItemIndex} de {totalFilteredProgramas} programas
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={goToPrevProgramaPage}
                      disabled={currentProgramaPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={goToPrevProgramaPageWindow}
                        disabled={!hasPrevProgramaPageWindow}
                        className="px-2"
                        title="Ver números de página anteriores"
                        aria-label="Grupo anterior de páginas"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-1 flex-wrap">
                        {programaPageNumbers.map((pageNumber) => (
                          <Button
                            key={pageNumber}
                            type="button"
                            variant={pageNumber === currentProgramaPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToProgramaPage(pageNumber)}
                            className={pageNumber === currentProgramaPage ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={goToNextProgramaPageWindow}
                        disabled={!hasNextProgramaPageWindow}
                        className="px-2"
                        title="Ver números de página siguientes"
                        aria-label="Grupo siguiente de páginas"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={goToNextProgramaPage}
                      disabled={currentProgramaPage >= totalProgramaPages}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ==================== MODALES FACULTADES ==================== */}

      {/* Modal: Crear Facultad */}
      <FacultadModales hook={hook} />

      {/* ==================== MODALES PROGRAMAS ==================== */}

      {/* Modal: Crear Programa */}
      <ProgramaModales hook={hook} />

      {/* Modal: Gestionar Asignaturas del Programa */}
      <AsignaturasProgramaModales hook={hook} semestresList={semestresList} />
    </div>
  );
}