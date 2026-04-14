import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Users, UserPlus, Edit, Trash2, Search, Filter, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import TableFilters from '../ui/table-filters';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  ultimoAcceso: string;
}

export default function GestionUsuarios() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    rol: '',
    password: ''
  });

  const usuarios: Usuario[] = [
    { id: '1', nombre: 'Juan Pérez', email: 'funcionario@financiera.edu.co', rol: 'Funcionario', estado: 'Activo', ultimoAcceso: '2026-03-23 14:30' },
    { id: '2', nombre: 'María González', email: 'contabilidad@financiera.edu.co', rol: 'Contabilidad', estado: 'Activo', ultimoAcceso: '2026-03-23 15:20' },
    { id: '3', nombre: 'Carlos Ruiz', email: 'tesoreria@financiera.edu.co', rol: 'Tesorería', estado: 'Activo', ultimoAcceso: '2026-03-23 13:45' },
    { id: '4', nombre: 'Ana López', email: 'auditoria@financiera.edu.co', rol: 'Auditoría', estado: 'Activo', ultimoAcceso: '2026-03-23 12:15' },
    { id: '5', nombre: 'Pedro Martínez', email: 'direccion-financiera@financiera.edu.co', rol: 'Dirección Financiera', estado: 'Activo', ultimoAcceso: '2026-03-23 15:30' },
    { id: '6', nombre: 'Laura Sánchez', email: 'rectoria@financiera.edu.co', rol: 'Rectoría', estado: 'Activo', ultimoAcceso: '2026-03-23 11:00' },
    { id: '7', nombre: 'Diego Torres', email: 'funcionario2@financiera.edu.co', rol: 'Funcionario', estado: 'Inactivo', ultimoAcceso: '2026-03-20 09:30' }
  ];

  const handleCreateUser = () => {
    if (!newUser.nombre || !newUser.email || !newUser.rol || !newUser.password) {
      toast.error('Error', { description: 'Todos los campos son obligatorios' });
      return;
    }

    toast.success('¡Usuario creado exitosamente!', {
      description: `${newUser.nombre} ha sido agregado al sistema`
    });

    setShowNewUserDialog(false);
    setNewUser({ nombre: '', email: '', rol: '', password: '' });
  };

  const handleToggleUserStatus = (usuario: Usuario) => {
    const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
    toast.success(`Usuario ${nuevoEstado.toLowerCase()}`, {
      description: `${usuario.nombre} ahora está ${nuevoEstado.toLowerCase()}`
    });
  };

  const usuariosFiltrados = usuarios.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1">Gestión de Usuarios</h1>
              <p className="text-red-100 text-sm">
                Administrar usuarios del sistema financiero
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewUserDialog(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-red-900 font-semibold shadow-lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </motion.div>

      {/* Búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, email o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 border-slate-300 focus:border-red-600 focus:ring-red-600"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Usuarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-800">
              <span>Usuarios del Sistema ({usuariosFiltrados.length})</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 border">
                {usuarios.filter(u => u.estado === 'Activo').length} Activos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Nombre</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700">Rol</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Último Acceso</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario, index) => (
                    <motion.tr
                      key={usuario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-medium text-slate-800">{usuario.nombre}</TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {usuario.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          <Shield className="w-3 h-3 mr-1" />
                          {usuario.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={usuario.estado === 'Activo' 
                          ? 'bg-green-100 text-green-700 border-green-200 border' 
                          : 'bg-slate-100 text-slate-700 border-slate-200 border'
                        }>
                          {usuario.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">{usuario.ultimoAcceso}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleUserStatus(usuario)}
                            className={usuario.estado === 'Activo' 
                              ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }
                          >
                            {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Nuevo Usuario */}
      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Ingrese los datos del nuevo usuario del sistema financiero
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Nombre Completo</Label>
              <Input
                placeholder="Ej: Juan Pérez"
                value={newUser.nombre}
                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Correo Electrónico</Label>
              <Input
                type="email"
                placeholder="usuario@financiera.edu.co"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Rol</Label>
              <Select
                value={newUser.rol}
                onValueChange={(value) => setNewUser({ ...newUser, rol: value })}
              >
                <SelectTrigger className="border-slate-300 focus:border-blue-600 focus:ring-blue-600">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funcionario">Funcionario</SelectItem>
                  <SelectItem value="Contabilidad">Contabilidad</SelectItem>
                  <SelectItem value="Tesorería">Tesorería</SelectItem>
                  <SelectItem value="Auditoría">Auditoría</SelectItem>
                  <SelectItem value="Dirección Financiera">Dirección Financiera</SelectItem>
                  <SelectItem value="Rectoría">Rectoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Contraseña Inicial</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewUserDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
