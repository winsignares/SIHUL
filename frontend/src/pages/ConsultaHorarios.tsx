import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Input } from '../share/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Badge } from '../share/badge';
import { Button } from '../share/button';
import { Search, Clock, MapPin, User, Calendar, BookOpen, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface Horario {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  asignatura: string;
  docente: string;
  grupo: string;
  programa: string;
  facultad: string;
  espacio: string;
}

export default function ConsultaHorarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocente, setFilterDocente] = useState('todos');
  const [filterPrograma, setFilterPrograma] = useState('todos');
  const [filterFacultad, setFilterFacultad] = useState('todos');
  const [filterEspacio, setFilterEspacio] = useState('todos');

  const PERIODO_FIJO = '2025-1';

  const horarios: Horario[] = [
    { id: '1', dia: 'Lunes', horaInicio: '07:00', horaFin: '09:00', asignatura: 'Programación I', docente: 'Dr. Juan Pérez', grupo: 'INSI-A', programa: 'Ingeniería de Sistemas', facultad: 'Ingeniería', espacio: 'Aula 101' },
    { id: '2', dia: 'Lunes', horaInicio: '09:00', horaFin: '11:00', asignatura: 'Cálculo I', docente: 'Dra. María López', grupo: 'INSI-A', programa: 'Ingeniería de Sistemas', facultad: 'Ingeniería', espacio: 'Aula 101' },
    { id: '3', dia: 'Martes', horaInicio: '07:00', horaFin: '09:00', asignatura: 'Bases de Datos', docente: 'Dr. Juan Pérez', grupo: 'INSI-B', programa: 'Ingeniería de Sistemas', facultad: 'Ingeniería', espacio: 'Lab 301' },
    { id: '4', dia: 'Miércoles', horaInicio: '14:00', horaFin: '16:00', asignatura: 'Gestión Empresarial', docente: 'Mg. Carlos Ruiz', grupo: 'ADEM-A', programa: 'Administración', facultad: 'Ciencias Económicas', espacio: 'Aula 205' },
    { id: '5', dia: 'Jueves', horaInicio: '09:00', horaFin: '11:00', asignatura: 'Contabilidad I', docente: 'Dra. Ana Torres', grupo: 'CONT-A', programa: 'Contaduría', facultad: 'Ciencias Económicas', espacio: 'Aula 110' },
    { id: '6', dia: 'Viernes', horaInicio: '14:00', horaFin: '16:00', asignatura: 'Derecho Civil', docente: 'Dr. Luis Ramírez', grupo: 'DERE-A', programa: 'Derecho', facultad: 'Derecho', espacio: 'Aula 302' }
  ];

  const docentes = ['todos', ...new Set(horarios.map(h => h.docente))];
  const programas = ['todos', ...new Set(horarios.map(h => h.programa))];
  const facultades = ['todos', ...new Set(horarios.map(h => h.facultad))];
  const espacios = ['todos', ...new Set(horarios.map(h => h.espacio))];

  const filteredHorarios = horarios.filter(h => {
    const matchesSearch = h.asignatura.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.docente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.programa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.espacio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDocente = filterDocente === 'todos' || h.docente === filterDocente;
    const matchesPrograma = filterPrograma === 'todos' || h.programa === filterPrograma;
    const matchesFacultad = filterFacultad === 'todos' || h.facultad === filterFacultad;
    const matchesEspacio = filterEspacio === 'todos' || h.espacio === filterEspacio;
    return matchesSearch && matchesDocente && matchesPrograma && matchesFacultad && matchesEspacio;
  });

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 dark:text-slate-100 mb-2">Consulta de Horarios Académicos</h1>
            <p className="text-slate-600 dark:text-slate-400">Consulta los horarios de clases por espacio, docente o programa</p>
          </div>
          <Badge className="bg-blue-600 text-white px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            Periodo {PERIODO_FIJO}
          </Badge>
        </div>
      </motion.div>

      {/* Filtros */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-slate-900 dark:text-slate-100">Filtros de Búsqueda</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por asignatura, docente, grupo o espacio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros específicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filterEspacio} onValueChange={setFilterEspacio}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por espacio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los espacios</SelectItem>
                {espacios.filter(e => e !== 'todos').map(espacio => (
                  <SelectItem key={espacio} value={espacio}>{espacio}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDocente} onValueChange={setFilterDocente}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por docente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los docentes</SelectItem>
                {docentes.filter(d => d !== 'todos').map(docente => (
                  <SelectItem key={docente} value={docente}>{docente}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPrograma} onValueChange={setFilterPrograma}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los programas</SelectItem>
                {programas.filter(p => p !== 'todos').map(programa => (
                  <SelectItem key={programa} value={programa}>{programa}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterFacultad} onValueChange={setFilterFacultad}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por facultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las facultades</SelectItem>
                {facultades.filter(f => f !== 'todos').map(facultad => (
                  <SelectItem key={facultad} value={facultad}>{facultad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estadísticas de resultados */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400">
              Mostrando <span className="text-blue-600 dark:text-blue-400">{filteredHorarios.length}</span> de {horarios.length} horarios
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterDocente('todos');
                setFilterPrograma('todos');
                setFilterFacultad('todos');
                setFilterEspacio('todos');
              }}
              className="border-slate-300 dark:border-slate-600"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Horarios Grid */}
      <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4">
        {dias.map(dia => {
          const clasesDelDia = filteredHorarios.filter(h => h.dia === dia);
          return (
            <motion.div
              key={dia}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">
                  <CardTitle className="text-white">{dia}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 min-h-[300px]">
                  {clasesDelDia.length > 0 ? (
                    clasesDelDia.map(horario => (
                      <motion.div
                        key={horario.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950 dark:to-violet-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <Clock className="w-4 h-4" />
                          <span>{horario.horaInicio} - {horario.horaFin}</span>
                        </div>
                        <p className="text-slate-900 dark:text-slate-100">{horario.asignatura}</p>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <User className="w-4 h-4" />
                          <span className="text-sm">{horario.docente}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{horario.espacio}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-sm">{horario.grupo}</span>
                        </div>
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-700">
                          {horario.programa}
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400 dark:text-slate-500">
                      <Calendar className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm text-center">Sin clases programadas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
