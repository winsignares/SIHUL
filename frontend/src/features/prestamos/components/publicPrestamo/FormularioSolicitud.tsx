import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
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
    AlertCircle,
    Loader2
} from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import type { usePublicPrestamo } from '../../hooks/usePublicPrestamo';
import { RepeticionSolicitud } from './RepeticionSolicitud';

type PublicPrestamo = ReturnType<typeof usePublicPrestamo>;

/** Formulario público de solicitud de préstamo de un espacio. */
export function FormularioSolicitud(props: Pick<PublicPrestamo, 'formData' | 'errors' | 'handleChange' | 'sedes' | 'sedeSeleccionada' | 'handleSedeChange' | 'loadingEspacios' | 'espaciosDisponibles' | 'tiposActividad' | 'handleRecaptchaChange' | 'handleSubmit' | 'submitting' | 'recaptchaToken' | 'repeatOption' | 'setRepeatOption' | 'repeatOptions' | 'intervalo' | 'setIntervalo' | 'intervaloMaximoPeriodo' | 'customPeriod' | 'setCustomPeriod' | 'diasSemana' | 'toggleDiaSemana' | 'finRepeticionTipo' | 'setFinRepeticionTipo' | 'finRepeticionFecha' | 'setFinRepeticionFecha' | 'finRepeticionMaxFecha' | 'finRepeticionOcurrencias' | 'setFinRepeticionOcurrencias' | 'ocurrenciasMaximoPeriodo' | 'recurrenceSummary'>) {
    const {
        formData,
        errors,
        handleChange,
        sedes,
        sedeSeleccionada,
        handleSedeChange,
        loadingEspacios,
        espaciosDisponibles,
        tiposActividad,
        handleRecaptchaChange,
        handleSubmit,
        submitting,
        recaptchaToken
    } = props;

    return (
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
                                    <SelectItem key={sede.id} value={String(sede.id)}>
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

                {/* Repetición */}
                <RepeticionSolicitud {...props} />

                {/* reCAPTCHA */}
                <div className="space-y-2">
                    <Label>Verificación de seguridad</Label>
                    <div className="flex flex-col items-start gap-2">
                        <ReCAPTCHA
                            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                            onChange={handleRecaptchaChange}
                        />
                        {errors.recaptcha && (
                            <p className="text-xs text-red-600 dark:text-red-400">{errors.recaptcha}</p>
                        )}
                    </div>
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
                        disabled={submitting || !recaptchaToken}
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
    );
}
