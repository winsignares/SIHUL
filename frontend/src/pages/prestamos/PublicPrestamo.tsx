import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Textarea } from '../../share/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { 
    CalendarDays, 
    Clock, 
    MapPin, 
    Users, 
    FileText, 
    Building2,
    Mail,
    Phone,
    CreditCard,
    User,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { usePublicPrestamo } from '../../hooks/prestamos/usePublicPrestamo';

export default function PublicPrestamo() {
    const {
        formData,
        loading,
        submitting,
        errors,
        showSuccess,
        successMessage,
        sedes,
        tiposActividad,
        espaciosDisponibles,
        sedeSeleccionada,
        loadingEspacios,
        handleChange,
        handleSedeChange,
        handleSubmit,
        setShowSuccess
    } = usePublicPrestamo();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-yellow-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-slate-900 dark:text-slate-100 mb-2">
                        Solicitud de Préstamo de Espacios
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Complete el formulario para solicitar el préstamo de un espacio físico
                    </p>
                </div>

                {/* Mensaje de éxito */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6"
                        >
                            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-green-900 dark:text-green-100 font-semibold mb-1">
                                                ¡Solicitud Enviada!
                                            </h3>
                                            <p className="text-green-700 dark:text-green-300 text-sm">
                                                {successMessage}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowSuccess(false)}
                                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Formulario */}
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle>Información del Solicitante</CardTitle>
                        <CardDescription>
                            Todos los campos son obligatorios
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Datos Personales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre Completo */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Nombre Completo
                                </label>
                                <Input
                                    value={formData.nombre_completo || ''}
                                    onChange={(e) => handleChange('nombre_completo', e.target.value)}
                                    placeholder="Ej: Juan Pérez García"
                                    className={errors.nombre_completo ? 'border-red-500' : ''}
                                />
                                {errors.nombre_completo && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.nombre_completo}
                                    </p>
                                )}
                            </div>

                            {/* Identificación */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Identificación
                                </label>
                                <Input
                                    value={formData.identificacion || ''}
                                    onChange={(e) => handleChange('identificacion', e.target.value)}
                                    placeholder="Ej: 1234567890"
                                    className={errors.identificacion ? 'border-red-500' : ''}
                                />
                                {errors.identificacion && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.identificacion}
                                    </p>
                                )}
                            </div>

                            {/* Correo Institucional */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Correo Institucional
                                </label>
                                <Input
                                    type="email"
                                    value={formData.correo_institucional || ''}
                                    onChange={(e) => handleChange('correo_institucional', e.target.value)}
                                    placeholder="ejemplo@unilibre.edu.co"
                                    className={errors.correo_institucional ? 'border-red-500' : ''}
                                />
                                {errors.correo_institucional && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.correo_institucional}
                                    </p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Teléfono
                                </label>
                                <Input
                                    type="tel"
                                    value={formData.telefono || ''}
                                    onChange={(e) => handleChange('telefono', e.target.value)}
                                    placeholder="Ej: 3001234567"
                                    className={errors.telefono ? 'border-red-500' : ''}
                                />
                                {errors.telefono && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.telefono}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Separador */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h3 className="text-slate-900 dark:text-slate-100 font-semibold mb-4">
                                Detalles del Préstamo
                            </h3>
                        </div>

                        {/* Fecha y Horas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Fecha */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4" />
                                    Fecha
                                </label>
                                <Input
                                    type="date"
                                    value={formData.fecha || ''}
                                    onChange={(e) => handleChange('fecha', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={errors.fecha ? 'border-red-500' : ''}
                                />
                                {errors.fecha && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.fecha}
                                    </p>
                                )}
                            </div>

                            {/* Hora Inicio */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Hora Inicio
                                </label>
                                <Input
                                    type="time"
                                    value={formData.hora_inicio || ''}
                                    onChange={(e) => handleChange('hora_inicio', e.target.value)}
                                    className={errors.hora_inicio ? 'border-red-500' : ''}
                                />
                                {errors.hora_inicio && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.hora_inicio}
                                    </p>
                                )}
                            </div>

                            {/* Hora Fin */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Hora Fin
                                </label>
                                <Input
                                    type="time"
                                    value={formData.hora_fin || ''}
                                    onChange={(e) => handleChange('hora_fin', e.target.value)}
                                    className={errors.hora_fin ? 'border-red-500' : ''}
                                />
                                {errors.hora_fin && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.hora_fin}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Sede y Espacio */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Sede */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Sede (Opcional - para filtrar)
                                </label>
                                <Select
                                    value={sedeSeleccionada?.toString()}
                                    onValueChange={(value) => handleSedeChange(value ? parseInt(value) : undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las sedes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las sedes</SelectItem>
                                        {sedes?.map((sede) => (
                                            <SelectItem key={sede.id} value={sede.id.toString()}>
                                                {sede.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Espacio */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Espacio
                                    {loadingEspacios && (
                                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                    )}
                                </label>
                                <Select
                                    value={formData.espacio_id?.toString()}
                                    onValueChange={(value) => handleChange('espacio_id', parseInt(value))}
                                    disabled={!formData.fecha || !formData.hora_inicio || !formData.hora_fin || loadingEspacios}
                                >
                                    <SelectTrigger className={errors.espacio_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={
                                            !formData.fecha || !formData.hora_inicio || !formData.hora_fin
                                                ? 'Primero seleccione fecha y horario'
                                                : espaciosDisponibles.length === 0
                                                    ? 'No hay espacios disponibles'
                                                    : 'Seleccione un espacio'
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {espaciosDisponibles?.map((espacio) => (
                                            <SelectItem key={espacio.id} value={espacio.id.toString()}>
                                                {espacio.nombre} - {espacio.tipo} (Cap: {espacio.capacidad}) - {espacio.sede}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.espacio_id && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.espacio_id}
                                    </p>
                                )}
                                {espaciosDisponibles.length > 0 && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {espaciosDisponibles.length} espacio(s) disponible(s)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tipo de Actividad y Asistentes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tipo de Actividad */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Tipo de Actividad
                                </label>
                                <Select
                                    value={formData.tipo_actividad_id?.toString()}
                                    onValueChange={(value) => handleChange('tipo_actividad_id', parseInt(value))}
                                >
                                    <SelectTrigger className={errors.tipo_actividad_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Seleccione el tipo de actividad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tiposActividad?.map((tipo) => (
                                            <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                                {tipo.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.tipo_actividad_id && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.tipo_actividad_id}
                                    </p>
                                )}
                            </div>

                            {/* Número de Asistentes */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Número de Asistentes
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.asistentes || ''}
                                    onChange={(e) => handleChange('asistentes', parseInt(e.target.value) || 1)}
                                    className={errors.asistentes ? 'border-red-500' : ''}
                                />
                                {errors.asistentes && (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.asistentes}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Motivo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Motivo del Préstamo
                            </label>
                            <Textarea
                                value={formData.motivo || ''}
                                onChange={(e) => handleChange('motivo', e.target.value)}
                                placeholder="Describa el motivo de la solicitud (mínimo 10 caracteres)"
                                rows={4}
                                className={errors.motivo ? 'border-red-500' : ''}
                            />
                            {errors.motivo && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.motivo}
                                </p>
                            )}
                        </div>

                        {/* Error general */}
                        {errors.submit && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.submit}
                                </p>
                            </div>
                        )}

                        {/* Botón Enviar */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Solicitud'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
