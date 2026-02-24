"""
Seeder de horarios para Sede Centro y Sede Principal.
"""

from datetime import time
from sedes.models import Sede
from espacios.models import TipoEspacio, EspacioFisico
from usuarios.models import Rol, Usuario
from asignaturas.models import Asignatura
from programas.models import Programa
from periodos.models import PeriodoAcademico
from grupos.models import Grupo
from horario.models import Horario


def create_horarios_sede_centro(stdout, style):
    """Crear horarios para la sede centro"""
    stdout.write('  → Creando horarios sede centro...')
    
    # Desconectar temporalmente la validación de horarios durante el seed
    from django.db.models.signals import pre_save
    from horario.signals import validar_horario
    pre_save.disconnect(validar_horario, sender=Horario)
    
    # Mapeo de días en español a formato consistente
    dias_map = {
        'LUNES': 'Lunes',
        'MARTES': 'Martes',
        'MIÉRCOLES': 'Miércoles',
        'MIERCOLES': 'Miércoles',
        'JUEVES': 'Jueves',
        'VIERNES': 'Viernes',
        'SÁBADO': 'Sábado',
        'SABADO': 'Sábado',
        'DOMINGO': 'Domingo'
    }
    
    # ═══════════════════════════════════════════════════════
    # HORARIOS ORGANIZADOS POR ESPACIO FÍSICO - SEDE CENTRO
    # ═══════════════════════════════════════════════════════
    # Formato: (grupo, materia, profesor, dia, hora_inicio, hora_fin, espacio)
    horarios_data = [
        # ── SALON 404NB (1 horarios) ──
        ('X DERECHO B', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'VIERNES', '06:00:00', '07:00:00', 'SALON 404NB'),
        ('V BACTERIOLOGÍA A', 'Electiva V', 'TATIANA POLO', 'LUNES', '08:00:00', '10:00:00', 'SALON 404NB')
        ('VIII DERECHO A', 'Procesal Civil, Especial y De Familia', 'TATIANA POLO', 'LUNES', '08:00:00', '10:00:00', 'SALON 404NB')
        

        # ── SALON 405NB (1 horarios) ──
        ('VII BACTERIOLOGÍA B', 'Electiva de profundización (B):', 'Miriam Linero', 'JUEVES', '16:00:00', '17:00:00', 'SALON 405NB'),

        # ── SALON 406NB (8 horarios) ──
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 1', 'LUNES', '16:00:00', '17:00:00', 'SALON 406NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 1', 'MARTES', '16:00:00', '17:00:00', 'SALON 406NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 1', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 406NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 1', 'JUEVES', '16:00:00', '17:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 1', 'LUNES', '14:00:00', '15:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MARTES', '14:00:00', '15:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 1', 'JUEVES', '14:00:00', '15:00:00', 'SALON 406NB'),

        # ── SALON 407NB (1 horarios) ──
        ('VII DERECHO A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'VIERNES', '06:00:00', '07:00:00', 'SALON 407NB'),


        # ── SALON 408NB (1 horarios) ──
        ('VII ADM. NEGOCIOS EN', 'OPTATIVA II . INNOVACIÓN Y TRANSFORMACIÓN DIGITAL EN EMPRESAS GLOBALES', 'Danilo Enrique Torres Pimiento', 'JUEVES', '07:00:00', '08:00:00', 'SALON 408NB'),

        # ── SALON 409NB (2 horarios) ──
        ('II ALIANZA SABATINO 2', 'Modalidad Sabatina', 'Profesor 1', 'SÁBADO', '08:00:00', '09:00:00', 'SALON 409NB'),
        ('VII DERECHO A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 409NB'),

        # ── SALON 410NB (7 horarios) ──
        ('II ALIANZA SABATINO 2', 'Modalidad Sabatina', 'Profesor 2', 'SÁBADO', '08:00:00', '09:00:00', 'SALON 410NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 2', 'LUNES', '14:00:00', '15:00:00', 'SALON 410NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 2', 'MARTES', '14:00:00', '15:00:00', 'SALON 410NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 2', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 410NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 2', 'JUEVES', '14:00:00', '15:00:00', 'SALON 410NB'),
        ('VI ADMIN NEGOCIOS CD', 'Finanzas internacionales', 'Winston Fontalvo Cerpa', 'LUNES', '18:00:00', '19:00:00', 'SALON 410NB'),
        ('VI ADMIN NEGOCIOS CD', 'Investigación de mercados', 'José Rafael Simancas Trujillo', 'LUNES', '19:00:00', '20:00:00', 'SALON 410NB'),

        # ── SALON 411NB (11 horarios) ──
        ('II ALIANZA SABATINO 2', 'Modalidad Sabatina', 'Profesor 3', 'SÁBADO', '08:00:00', '09:00:00', 'SALON 411NB'),
        ('I DERECHO AN', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'YADIRA GARCÍA', 'LUNES', '08:00:00', '09:00:00', 'SALON 411NB'),
        ('I DERECHO AN', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'LUNES', '10:00:00', '11:00:00', 'SALON 411NB'),
        ('I DERECHO B', 'TEORÍA ECONÓMICA', 'FRANCISCO POLO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 411NB'),
        ('VII DERECHO A', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'RICARDO MÉNDEZ', 'VIERNES', '18:00:00', '19:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'CONTRATOS', 'RAFAEL FIERRO', 'MARTES', '13:00:00', '14:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'CONTRATOS', 'RAFAEL FIERRO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'JUAN CARLOS DE LOS RÍOS', 'JUEVES', '06:00:00', '07:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'PROBATORIO', 'EDUARDO LASCANO', 'MARTES', '15:00:00', '16:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'MARTES', '10:00:00', '11:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'JUEVES', '08:00:00', '09:00:00', 'SALON 411NB'),

        # ── SALON 412NB (7 horarios) ──
        ('II ALIANZA SABATINO 2', 'Modalidad Sabatina', 'Profesor 4', 'SÁBADO', '08:00:00', '09:00:00', 'SALON 412NB'),
        ('VII DERECHO A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'JUEVES', '06:00:00', '07:00:00', 'SALON 412NB'),
        ('VII DERECHO B', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'JUAN CARLOS DE LOS RÍOS', 'LUNES', '10:00:00', '11:00:00', 'SALON 412NB'),
        ('VII DERECHO B', 'FILOSOFÍA DEL DERECHO', 'CRISTÓBAL ARTETA', 'LUNES', '08:00:00', '09:00:00', 'SALON 412NB'),
        ('VII DERECHO B', 'PROBATORIO', 'EDUARDO LASCANO', 'LUNES', '14:00:00', '15:00:00', 'SALON 412NB'),
        ('VIII DERECHO A', 'LABORAL ADMINISTRATIVO', 'FRANCISCO BUSTAMANTE', 'MARTES', '06:00:00', '07:00:00', 'SALON 412NB'),
        ('VIII DERECHO A', 'PROCESAL LABORAL', 'LILIA CEDEÑO', 'MARTES', '10:00:00', '11:00:00', 'SALON 412NB'),

        # ── SALON 413NB (7 horarios) ──
        ('IV ALIANZA SEMESTRAL 4', 'Modalidad Semestral', 'Profesor 1', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 413NB'),
        ('IV ALIANZA SEMESTRAL 4', 'Modalidad Semestral', 'Profesor 1', 'JUEVES', '11:00:00', '12:00:00', 'SALON 413NB'),
        ('II ALIANZA SABATINO 2', 'Modalidad Sabatina', 'Profesor 5', 'SÁBADO', '08:00:00', '09:00:00', 'SALON 413NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 3', 'LUNES', '14:00:00', '15:00:00', 'SALON 413NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 3', 'MARTES', '14:00:00', '15:00:00', 'SALON 413NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 3', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 413NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-Intensiva', 'Profesor 3', 'JUEVES', '14:00:00', '15:00:00', 'SALON 413NB'),

        # ── SALON 414NB (11 horarios) ──
        ('IV ALIANZA SEMESTRAL 4', 'Modalidad Semestral', 'Profesor 2', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 414NB'),
        ('IV ALIANZA SEMESTRAL 4', 'Modalidad Semestral', 'Profesor 2', 'JUEVES', '11:00:00', '12:00:00', 'SALON 414NB'),
        ('II ALIANZA SABATINO 2', 'Modalidad Sabatina', 'Profesor 6', 'SÁBADO', '08:00:00', '09:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'LUNES', '14:00:00', '15:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'LUNES', '16:00:00', '17:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MARTES', '14:00:00', '15:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MARTES', '16:00:00', '17:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'JUEVES', '14:00:00', '15:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-Intensiva', 'Profesor 1', 'JUEVES', '16:00:00', '17:00:00', 'SALON 414NB'),

        # ── SALON 415NB (3 horarios) ──
        ('III DERECHO D', 'CIVIL BIENES', 'BRENDA VALERO', 'VIERNES', '08:00:00', '09:00:00', 'SALON 415NB'),
        ('VIII DERECHO A', 'PROCESAL LABORAL', 'LILIA CEDEÑO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 415NB'),
        ('VIII DERECHO A', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 415NB'),

        # ── SALON 416NB (1 horarios) ──
        ('X DERECHO A', 'ÉTICA II', 'OONA HERNÁNDEZ', 'VIERNES', '08:00:00', '09:00:00', 'SALON 416NB'),

        # ── SALON 501NB (5 horarios) ──
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 2', 'LUNES', '14:00:00', '15:00:00', 'SALON 501NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 2', 'MARTES', '14:00:00', '15:00:00', 'SALON 501NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 2', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 501NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 2', 'JUEVES', '14:00:00', '15:00:00', 'SALON 501NB'),
        ('IV DERECHO A', 'Electiva IV', 'ALEXANDER GONZÁLEZ', 'LUNES', '08:00:00', '09:00:00', 'SALON 501NB'),

        # ── SALON 502NB (5 horarios) ──
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 3', 'LUNES', '14:00:00', '15:00:00', 'SALON 502NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 3', 'MARTES', '14:00:00', '15:00:00', 'SALON 502NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 3', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 502NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 3', 'JUEVES', '14:00:00', '15:00:00', 'SALON 502NB'),
        ('VII ALIANZA SABATINO 7', 'Modalidad Sabatina', 'Profesor 1', 'SÁBADO', '08:00:00', '09:00:00', 'SALON 502NB'),

        # ── SALON 503NB (9 horarios) ──
        ('I DERECHO C', 'DERECHO ROMANO', 'TATIANA POLO', 'VIERNES', '08:00:00', '09:00:00', 'SALON 503NB'),
        ('I DERECHO C', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'YADIRA GARCÍA', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 503NB'),
        ('I DERECHO C', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 503NB'),
        ('I DERECHO D', 'DERECHO ROMANO', 'TATIANA POLO', 'LUNES', '10:00:00', '11:00:00', 'SALON 503NB'),
        ('I DERECHO D', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'LUNES', '08:00:00', '09:00:00', 'SALON 503NB'),
        ('III DERECHO AB', 'CIVIL BIENES  3AB', 'CARLOS ESPINEL', 'LUNES', '06:00:00', '07:00:00', 'SALON 503NB'),
        ('III DERECHO AB', 'CIVIL BIENES  3AB', 'CARLOS ESPINEL', 'MARTES', '06:00:00', '07:00:00', 'SALON 503NB'),
        ('III DERECHO AD', 'INVESTIGACIÓN I 3AD', 'ALEJANDRO BLANCO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 503NB'),
        ('III DERECHO B', 'INVESTIGACIÓN I', 'PATRICIA MORRIS', 'MARTES', '08:00:00', '09:00:00', 'SALON 503NB'),

        # ── SALON 504NB (13 horarios) ──
        ('I DERECHO C', 'HISTORIA DE LA FILOSOFÍA', 'CRISTÓBL ARTETA', 'LUNES', '10:00:00', '11:00:00', 'SALON 504NB'),
        ('I DERECHO C', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'LUNES', '08:00:00', '09:00:00', 'SALON 504NB'),
        ('I DERECHO D', 'TEORÍA ECONÓMICA', 'GUILLERMO DE LA HOZ', 'VIERNES', '06:00:00', '07:00:00', 'SALON 504NB'),
        ('II DERECHO A', 'SOCIOLOGÍA GENERAL Y JURÍDICA', 'YOLANDA FANDIÑO', 'VIERNES', '09:00:00', '10:00:00', 'SALON 504NB'),
        ('III DERECHO C', 'CIVIL BIENES', 'BRENDA VALERO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 504NB'),
        ('III DERECHO C', 'INVESTIGACIÓN I', 'ALEJANDRO BLANCO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 504NB'),
        ('III DERECHO C', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 504NB'),
        ('III DERECHO D', 'CIVIL BIENES', 'BRENDA VALERO', 'LUNES', '13:00:00', '14:00:00', 'SALON 504NB'),
        ('V DERECHO A', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'MARTES', '10:00:00', '11:00:00', 'SALON 504NB'),
        ('V DERECHO A', 'DERECHO INTERNACIONAL PRIVADO', 'JUAN CARLOS DE LOS RÍOS', 'VIERNES', '18:00:00', '19:00:00', 'SALON 504NB'),
        ('VIII DERECHO A', 'CRIMINALÍSTICA Y CIENCIA FORENSE', 'CARLOS NEWBALL', 'JUEVES', '06:00:00', '07:00:00', 'SALON 504NB'),
        ('VIII DERECHO A', 'PROCESAL CIVIL ESPECIAL Y DE FAMILIA', 'NUBIA MARRUGO', 'JUEVES', '12:00:00', '13:00:00', 'SALON 504NB'),
        ('', 'Teoría del estado', 'LINDA NADER', 'JUEVES', '10:00:00', '11:00:00', 'SALON 504NB'),

        # ── SALON 505NB (6 horarios) ──
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 4', 'LUNES', '14:00:00', '15:00:00', 'SALON 505NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 4', 'MARTES', '14:00:00', '15:00:00', 'SALON 505NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 4', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 505NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 4', 'JUEVES', '14:00:00', '15:00:00', 'SALON 505NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 1', 'LUNES', '11:00:00', '12:00:00', 'SALON 505NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 1', 'JUEVES', '11:00:00', '12:00:00', 'SALON 505NB'),

        # ── SALON 506NB (10 horarios) ──
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 5', 'LUNES', '14:00:00', '15:00:00', 'SALON 506NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 5', 'MARTES', '14:00:00', '15:00:00', 'SALON 506NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 5', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 506NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 5', 'JUEVES', '14:00:00', '15:00:00', 'SALON 506NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 2', 'LUNES', '11:00:00', '12:00:00', 'SALON 506NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 2', 'JUEVES', '11:00:00', '12:00:00', 'SALON 506NB'),
        ('II CONTADURIA AN', 'Cálculo', 'Rocío Mercedes Duarte Angarita', 'MARTES', '20:00:00', '21:00:00', 'SALON 506NB'),
        ('II ADM. NEGOCIOS AN', 'Cálculo', 'Rocío Mercedes Duarte Angarita', 'MARTES', '20:00:00', '21:00:00', 'SALON 506NB'),
        ('II CONTADURIA AN', 'Epistemología y Metodología de la Investigación', 'Milagros Del Carmen Villasmil Molero', 'MARTES', '18:00:00', '19:00:00', 'SALON 506NB'),
        ('II ADM. NEGOCIOS AN', 'Epistemología y Metodología de la Investigación', 'Milagros Del Carmen Villasmil Molero', 'MARTES', '18:00:00', '19:00:00', 'SALON 506NB'),

        # ── SALON 507NB (8 horarios) ──
        ('II DERECHO A', 'CIENCIA POLITICA', 'ALEJANDRO BLANCO', 'LUNES', '15:00:00', '16:00:00', 'SALON 507NB'),
        ('II DERECHO A', 'DERECHOS HUMANOS Y D.I.H.', 'MAGDA DJANON', 'LUNES', '10:00:00', '11:00:00', 'SALON 507NB'),
        ('III DERECHO C', 'CIVIL BIENES', 'BRENDA VALERO', 'VIERNES', '10:00:00', '11:00:00', 'SALON 507NB'),
        ('III DERECHO C', 'INVESTIGACIÓN I', 'ALEJANDRO BLANCO', 'VIERNES', '08:00:00', '09:00:00', 'SALON 507NB'),
        ('IX DERECHO B', 'PROCESAL ADMINISTRATIVO II', 'GUILLERMO ARÉVALO', 'MARTES', '06:00:00', '07:00:00', 'SALON 507NB'),
        ('IX DERECHO B', 'SUCESIONES', 'RICARDO JIMÉNEZ', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 507NB'),
        ('IX DERECHO B', 'SUCESIONES', 'RICARDO JIMÉNEZ', 'JUEVES', '06:00:00', '07:00:00', 'SALON 507NB'),
        ('', 'Electiva de profundización B: DERECHO ADUANERO', 'ROBERTO CARLOS MEISEL LANER', 'VIERNES', '14:00:00', '15:00:00', 'SALON 507NB'),

        # ── SALON 508NB (6 horarios) ──
        ('X DERECHO A', 'DERECHO AMBIENTAL', 'JAIME BERMEJO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 508NB'),
        ('III DERECHO B', 'CONSTITUCIONAL COLOMBIANO', '', 'LUNES', '14:00:00', '15:00:00', 'SALON 508NB'),
        ('III DERECHO B', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'LUNES', '10:00:00', '11:00:00', 'SALON 508NB'),
        ('V DERECHO D', 'ELECTIVA V CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'MARTES', '10:00:00', '11:00:00', 'SALON 508NB'),
        ('V DERECHO D', 'DERECHO INTERNACIONAL PRIVADO', 'JUAN CARLOS DE LOS RÍOS', 'MARTES', '06:00:00', '07:00:00', 'SALON 508NB'),
        ('VIII DERECHO A', 'PROCESAL ADMINISTRATIVO I', 'LUIS CERRA', 'VIERNES', '06:00:00', '07:00:00', 'SALON 508NB'),

        # ── SALON 509NB (8 horarios) ──
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 3', 'LUNES', '11:00:00', '12:00:00', 'SALON 509NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 3', 'MARTES', '14:00:00', '15:00:00', 'SALON 509NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 3', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 509NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 3', 'JUEVES', '11:00:00', '12:00:00', 'SALON 509NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-Intensiva', 'Profesor 1', 'LUNES', '16:00:00', '17:00:00', 'SALON 509NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MARTES', '16:00:00', '17:00:00', 'SALON 509NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 509NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-Intensiva', 'Profesor 1', 'JUEVES', '16:00:00', '17:00:00', 'SALON 509NB'),

        # ── SALON 510NB (9 horarios) ──
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 4', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 510NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 4', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 510NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 4', 'JUEVES', '11:00:00', '12:00:00', 'SALON 510NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 4', 'JUEVES', '14:00:00', '15:00:00', 'SALON 510NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-Intensiva', 'Profesor 1', 'LUNES', '16:00:00', '17:00:00', 'SALON 510NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MARTES', '16:00:00', '17:00:00', 'SALON 510NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-Intensiva', 'Profesor 1', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 510NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-Intensiva', 'Profesor 1', 'JUEVES', '16:00:00', '17:00:00', 'SALON 510NB'),
        ('', 'Electiva de profundización A: COMERCIO EXTERIOR', 'ROBERTO CARLOS MEISEL LANER', 'JUEVES', '16:00:00', '17:00:00', 'SALON 510NB'),

        # ── SALON 511NB (13 horarios) ──
        ('IV SEMESTRE GRUPO A', 'DERECHO INTERNACIONAL PÚBLICO', 'GRETTY PAVLOVICH', 'MARTES', '08:00:00', '09:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'INVESTIGACIÓN II', 'ALEJANDRO BLANCO', 'LUNES', '10:00:00', '11:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'INVESTIGACIÓN II', 'ALEJANDRO BLANCO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'LABORAL INDIVIDUAL Y PRESTACIONAL', 'LILIA CEDEÑO', 'MARTES', '13:00:00', '14:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'LABORAL INDIVIDUAL Y PRESTACIONAL', 'LILIA CEDEÑO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'SOLUCIÓN ALTERNATIVA DE CONFLICTOS', 'TATIANA POLO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'SOLUCIÓN ALTERNATIVA DE CONFLICTOS', 'TATIANA POLO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'TEORÍA GENERAL DEL PROCESO', 'INGRID PEREZ', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'TEORÍA GENERAL DEL PROCESO', 'INGRID PEREZ', 'VIERNES', '08:00:00', '09:00:00', 'SALON 511NB'),
        ('IV SEMESTRE GRUPO A', 'TUTELA PENAL DE LOS BIENES JURIDÍCOS I', 'EDGAR DEVIA', 'JUEVES', '06:00:00', '07:00:00', 'SALON 511NB'),
        ('IX DERECHO A', 'JURISPRUDENCIA CONSTITUCIONAL', 'GRETTY PÁVLOVICH', 'LUNES', '06:00:00', '07:00:00', 'SALON 511NB'),
        ('IX DERECHO A', 'JURISPRUDENCIA CONSTITUCIONAL', 'GRETTY PÁVLOVICH', 'MARTES', '06:00:00', '07:00:00', 'SALON 511NB'),
        ('', 'Electiva de profundización E: LITIGIO ESTRATÉGICO', 'PABLO RAFAEL BULA GONZALEZ', 'VIERNES', '14:00:00', '15:00:00', 'SALON 511NB'),

        # ── SALON 512NB (9 horarios) ──
        ('VII DERECHO C', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'JUEVES', '14:00:00', '15:00:00', 'SALON 512NB'),
        ('VII DERECHO C', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 512NB'),
        ('VIII DERECHO B', 'CRIMINALÍSTICA Y CIENCIA FORENSE', 'CARLOS NEWBALL', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 512NB'),
        ('VIII DERECHO B', 'PROCESAL CIVIL ESPECIAL Y DE FAMILIA', 'NUBIA MARRUGO', 'LUNES', '12:00:00', '13:00:00', 'SALON 512NB'),
        ('VIII DERECHO B', 'PROCESAL CIVIL ESPECIAL Y DE FAMILIA', 'NUBIA MARRUGO', 'MARTES', '12:00:00', '13:00:00', 'SALON 512NB'),
        ('VIII DERECHO B', 'PROCESAL LABORAL', 'DAVID GUETTE', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 512NB'),
        ('VIII DERECHO B', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ', 'MARTES', '07:00:00', '08:00:00', 'SALON 512NB'),
        ('IX DERECHO AN', 'OPTATIVA II DIPLOMACIA Y RELACIONES INTERNACIONALES', 'ALEJANDRO BLANCO', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 512NB'),
        ('I ADM. NEG CD', 'PRINCIPIOS DE DERECHO Y CONSTITUCIÓN', 'ALEJANDRO BLANCO', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 512NB'),

        # ── SALON 513NB (3 horarios) ──
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 5', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 513NB'),
        ('II ALIANZA SEMESTRAL 2', 'Modalidad Semestral', 'Profesor 5', 'JUEVES', '11:00:00', '12:00:00', 'SALON 513NB'),
        ('', 'Electiva de profundización F: Derecho y sociedad', 'YOLANDA FANDIÑO', 'JUEVES', '16:00:00', '17:00:00', 'SALON 513NB'),

        # ── SALON 514NB (6 horarios) ──
        ('III DERECHO A', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'VIERNES', '18:00:00', '19:00:00', 'SALON 514NB'),
        ('VI ADMIN NEGOCIOS CD', 'Finanzas internacionales', 'Winston Fontalvo Cerpa', 'MARTES', '18:00:00', '19:00:00', 'SALON 514NB'),
        ('VI ADMIN NEGOCIOS CD', 'Gestión de importaciones', 'Maribel Cerro Camera', 'MARTES', '20:00:00', '21:00:00', 'SALON 514NB'),
        ('VI ADMIN NEGOCIOS CD', 'Gestión del transporte internacional', 'Roberto Meisel Lanner', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 514NB'),
        ('VI ADMIN NEGOCIOS CD', 'Investigación de mercados', 'José Rafael Simancas Trujillo', 'MIÉRCOLES', '20:00:00', '21:00:00', 'SALON 514NB'),
        ('', 'Electiva de profundización G: Economía y medio ambiente', 'Esperanza Castro', 'JUEVES', '16:00:00', '17:00:00', 'SALON 514NB'),

        # ── SALON 515NB (12 horarios) ──
        ('VII DERECHO D', 'CONTRATOS', 'RAFAEL FIERRO', 'LUNES', '08:00:00', '09:00:00', 'SALON 515NB'),
        ('VII DERECHO D', 'CONTRATOS', 'RAFAEL FIERRO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 515NB'),
        ('VII DERECHO D', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'GONZALO AGUILAR', 'LUNES', '13:00:00', '14:00:00', 'SALON 515NB'),
        ('VII DERECHO D', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 515NB'),
        ('VII DERECHO D', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'LUNES', '10:00:00', '11:00:00', 'SALON 515NB'),
        ('VII DERECHO D', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 515NB'),
        ('VII DERECHO D', 'PROBATORIO', 'EDUARDO LASCANO', 'MARTES', '10:00:00', '11:00:00', 'SALON 515NB'),
        ('VII DERECHO D', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'MARTES', '08:00:00', '09:00:00', 'SALON 515NB'),
        ('VIII DERECHO B', 'PROCESAL ADMINISTRATIVO I', 'LUIS CERRA', 'JUEVES', '06:00:00', '07:00:00', 'SALON 515NB'),
        ('VIII DERECHO B', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ', 'JUEVES', '11:00:00', '12:00:00', 'SALON 515NB'),
        ('', 'Electiva 2 Sistemas de Información Geográfica', 'Camilo Madariaga', 'JUEVES', '16:00:00', '17:00:00', 'SALON 515NB'),
        ('', 'OPTATIVA III SISTEMA DE RESPONSABILIDAD PENAL PARA ADOLESCENTES', 'RICARDO MÉNDEZ', 'MARTES', '13:00:00', '14:00:00', 'SALON 515NB'),

        # ── SALON 516NB (17 horarios) ──
        ('X DERECHO A', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'LUNES', '10:00:00', '11:00:00', 'SALON 516NB'),
        ('X DERECHO A', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'MARTES', '10:00:00', '11:00:00', 'SALON 516NB'),
        ('X DERECHO A', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'LUNES', '06:00:00', '07:00:00', 'SALON 516NB'),
        ('X DERECHO A', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'MARTES', '06:00:00', '07:00:00', 'SALON 516NB'),
        ('X DERECHO B', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 516NB'),
        ('V DERECHO D', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MARTES', '14:00:00', '15:00:00', 'SALON 516NB'),
        ('VII DERECHO A', 'CONTRATOS', 'CARLOS ESPINEL', 'JUEVES', '18:00:00', '19:00:00', 'SALON 516NB'),
        ('VII DERECHO A', 'PROBATORIO', 'RAFAEL FIERRO', 'LUNES', '18:00:00', '19:00:00', 'SALON 516NB'),
        ('VII DERECHO A', 'PROBATORIO', 'RAFAEL FIERRO', 'MARTES', '18:00:00', '19:00:00', 'SALON 516NB'),
        ('VII DERECHO C', 'PROBATORIO', 'EDUARDO LASCANO', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 516NB'),
        ('VII DERECHO D', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'JUEVES', '06:00:00', '07:00:00', 'SALON 516NB'),
        ('VII DERECHO D', 'PROBATORIO', 'EDUARDO LASCANO', 'JUEVES', '09:00:00', '10:00:00', 'SALON 516NB'),
        ('VII DERECHO D', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'JUEVES', '14:00:00', '15:00:00', 'SALON 516NB'),
        ('', 'Electiva de profundización C: DERECHO DE LOS TRATADOS Internacionales', 'GRETTY PAVLOVICH', 'MARTES', '16:00:00', '17:00:00', 'SALON 516NB'),
        ('', 'Electiva de profundización D: DERECHO SOCIETARIO', 'MARLYS HERAZO', 'VIERNES', '14:00:00', '15:00:00', 'SALON 516NB'),
        ('', 'OPTATIVA II GESTIÓN DEL CONFLICTO EN LO PÚBLICO', 'LINDA NADER', 'MARTES', '13:00:00', '14:00:00', 'SALON 516NB'),
        ('', 'OPTATIVA III PRÁCTICA JUDICIAL', 'LUIS CERRA', 'LUNES', '16:00:00', '17:00:00', 'SALON 516NB'),

        # ── SALON 601NB (3 horarios) ──
        ('I DERECHO AN', 'HABILIDADES COMUNICATIVAS', 'ALEJANDRO BLANCO', 'MARTES', '18:00:00', '19:00:00', 'SALON 601NB'),
        ('I DERECHO AN', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'LUNES', '18:00:00', '19:00:00', 'SALON 601NB'),
        ('I DERECHO AN', 'TEORÍA ECONÓMICA', 'FRANCISCO POLO', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 601NB'),

        # ── SALON 603NB (12 horarios) ──
        ('V DERECHO A', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'JUEVES', '18:00:00', '19:00:00', 'SALON 603NB'),
        ('V DERECHO A', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'MARTES', '06:00:00', '07:00:00', 'SALON 603NB'),
        ('V DERECHO A', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'VIERNES', '07:00:00', '08:00:00', 'SALON 603NB'),
        ('V DERECHO A', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'LUNES', '18:00:00', '19:00:00', 'SALON 603NB'),
        ('V DERECHO A', 'OBLIGACIONES', 'CARLOS ESPINEL', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 603NB'),
        ('V DERECHO A', 'OBLIGACIONES', 'CARLOS ESPINEL', 'JUEVES', '06:00:00', '07:00:00', 'SALON 603NB'),
        ('V DERECHO A', 'PROCESAL PENAL I', 'DAVID GÜETTE', 'MARTES', '18:00:00', '19:00:00', 'SALON 603NB'),
        ('V DERECHO C', 'ELECTIVA V CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'LUNES', '08:00:00', '09:00:00', 'SALON 603NB'),
        ('V DERECHO C', 'OBLIGACIONES', 'CARLOS ESPINEL', 'LUNES', '10:00:00', '11:00:00', 'SALON 603NB'),
        ('V DERECHO D', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'VIERNES', '10:00:00', '11:00:00', 'SALON 603NB'),
        ('V DERECHO D', 'OBLIGACIONES', 'CARLOS ESPINEL', 'VIERNES', '08:00:00', '09:00:00', 'SALON 603NB'),
        ('', 'DERECHO PROCESAL CONSTITUCIONAL', 'PABLO RAFAEL BULA GONZALEZ', 'JUEVES', '16:00:00', '17:00:00', 'SALON 603NB'),

        # ── SALON 604NB (10 horarios) ──
        ('I DERECHO E', 'HABILIDADES COMUNICATIVAS', 'TATIANA POLO', 'MARTES', '08:00:00', '09:00:00', 'SALON 604NB'),
        ('V DERECHO C', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'LUNES', '14:00:00', '15:00:00', 'SALON 604NB'),
        ('V DERECHO C', 'OBLIGACIONES', 'CARLOS ESPINEL', 'VIERNES', '10:00:00', '11:00:00', 'SALON 604NB'),
        ('V DERECHO C', 'PROCESAL PENAL I', 'DAVID GÜETTE', 'VIERNES', '06:00:00', '07:00:00', 'SALON 604NB'),
        ('V DERECHO D', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 604NB'),
        ('V DERECHO D', 'OBLIGACIONES', 'CARLOS ESPINEL', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 604NB'),
        ('V DERECHO D', 'PROCESAL PENAL I', 'DAVID GÜETTE', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 604NB'),
        ('VII DERECHO C', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'LUNES', '06:00:00', '07:00:00', 'SALON 604NB'),
        ('VII DERECHO C', 'PROBATORIO', 'EDUARDO LASCANO', 'LUNES', '09:00:00', '10:00:00', 'SALON 604NB'),
        ('', 'Lenguas Extranjeras: Inglés II', 'LUIS FERNANDO GÓMEZ', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 604NB'),

        # ── SALON 607NB (7 horarios) ──
        ('I DERECHO E', 'INTRODUCCIÓN AL DERECHO', 'GONZALO AGUILAR', 'LUNES', '11:00:00', '12:00:00', 'SALON 607NB'),
        ('I DERECHO AN-1E', 'DERECHO ROMANO', 'TATIANA POLO', 'LUNES', '07:00:00', '08:00:00', 'SALON 607NB'),
        ('VII DERECHO A', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'RICARDO JIMÉNEZ', 'MARTES', '06:00:00', '07:00:00', 'SALON 607NB'),
        ('VII DERECHO A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 607NB'),
        ('', 'ELECTIVA V: CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'VIERNES', '14:00:00', '15:00:00', 'SALON 607NB'),
        ('', 'Lenguas Extranjeras: Inglés I', 'LUIS FERNANDO GÓMEZ', 'LUNES', '16:00:00', '17:00:00', 'SALON 607NB'),
        ('', 'Lenguas Extranjeras: Inglés I', 'LUIS FERNANDO GÓMEZ', 'MARTES', '16:00:00', '17:00:00', 'SALON 607NB'),

        # ── SALON 608NB (10 horarios) ──
        ('I DERECHO B', 'DERECHO ROMANO', 'TATIANA POLO', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 608NB'),
        ('I DERECHO B', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 608NB'),
        ('V DERECHO B', 'ADMINISTRATIVO GENERAL', 'EDUARDO CERRA', 'LUNES', '14:00:00', '15:00:00', 'SALON 608NB'),
        ('V DERECHO B', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'LUNES', '10:00:00', '11:00:00', 'SALON 608NB'),
        ('VII DERECHO C', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'GONZALO AGUILAR', 'MARTES', '11:00:00', '12:00:00', 'SALON 608NB'),
        ('VII DERECHO C', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MARTES', '08:00:00', '09:00:00', 'SALON 608NB'),
        ('VII DERECHO C', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'MARTES', '06:00:00', '07:00:00', 'SALON 608NB'),
        ('IX DERECHO A', 'OPTATIVA II PAZ Y MODELOS DE JUSTICIA', 'JOHN FABER BUITRAGO', 'VIERNES', '10:00:00', '11:00:00', 'SALON 608NB'),
        ('', 'ELECTIVA I', 'YADIRA PATRICIA GARCÍA NAVARRO', 'VIERNES', '14:00:00', '15:00:00', 'SALON 608NB'),
        ('', 'OPTATIVA I: CONTRATOS COMERCIALES INTERNACIONALES', 'MARLYS HERAZO', 'LUNES', '14:00:00', '15:00:00', 'SALON 608NB'),

        # ── SALON 611NB (14 horarios) ──
        ('X DERECHO B', 'ÉTICA II', 'OONA HERNÁNDEZ', 'LUNES', '13:00:00', '14:00:00', 'SALON 611NB'),
        ('V DERECHO B', 'ADMINISTRATIVO GENERAL', 'EDUARDO CERRA', 'JUEVES', '14:00:00', '15:00:00', 'SALON 611NB'),
        ('V DERECHO B', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MARTES', '11:00:00', '12:00:00', 'SALON 611NB'),
        ('V DERECHO B', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 611NB'),
        ('V DERECHO B', 'OBLIGACIONES', 'JAVIER CRESPO', 'MARTES', '06:00:00', '07:00:00', 'SALON 611NB'),
        ('V DERECHO B', 'PROCESAL PENAL I', 'EDGAR DEVIA', 'JUEVES', '09:00:00', '10:00:00', 'SALON 611NB'),
        ('VII DERECHO C', 'CONTRATOS', 'RAFAEL FIERRO', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 611NB'),
        ('VII DERECHO C', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 611NB'),
        ('IX DERECHO A', 'OPTATIVA II GESTIÓN DEL CONFLICO EN LO PÚBLICO', 'LINDA NADER', 'VIERNES', '10:00:00', '11:00:00', 'SALON 611NB'),
        ('IX DERECHO C', 'JURISPRUDENCIA CONSTITUCIONAL', 'MAGDA DJANON', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 611NB'),
        ('IX DERECHO C', 'PROCESAL ADMINISTRATIVO II', 'GUILLERMO ARÉVALO', 'JUEVES', '06:00:00', '07:00:00', 'SALON 611NB'),
        ('IX DERECHO C', 'SUCESIONES', 'FABIO AMOROCHO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 611NB'),
        ('', 'Electiva 2 Derecho a la prueba', 'Eduardo Lascano', 'JUEVES', '16:00:00', '17:00:00', 'SALON 611NB'),
        ('', 'RAZONAMIENTO CUANTITATIVO', 'FRANCISCO DE LA HOZ', 'LUNES', '16:00:00', '17:00:00', 'SALON 611NB'),

        # ── SALON 612NB (15 horarios) ──
        ('I DERECHO AN-E', 'DERECHO ROMANO', 'TATIANA POLO', 'JUEVES', '06:00:00', '07:00:00', 'SALON 612NB'),
        ('I DERECHO AN-E', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 612NB'),
        ('I DERECHO AN-E', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'VIERNES', '06:00:00', '07:00:00', 'SALON 612NB'),
        ('I DERECHO E', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'GRETTY PÁVLOVICH', 'MARTES', '06:00:00', '07:00:00', 'SALON 612NB'),
        ('I DERECHO E', 'HISTORIA DE LA FILOSOFÍA', 'ALEXANDER GONZÁLEZ', 'VIERNES', '08:00:00', '09:00:00', 'SALON 612NB'),
        ('I DERECHO E', 'INTRODUCCIÓN AL DERECHO', 'GONZALO AGUILAR', 'JUEVES', '08:00:00', '09:00:00', 'SALON 612NB'),
        ('X DERECHO B', 'DERECHO AMBIENTAL', 'JAIME BERMEJO', 'MARTES', '10:00:00', '11:00:00', 'SALON 612NB'),
        ('X DERECHO B', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'MARTES', '08:00:00', '09:00:00', 'SALON 612NB'),
        ('', 'DERECHO TRIBUTARIO', 'JORGE MARIO MOLINA HERNÁNDEZ', 'JUEVES', '16:00:00', '17:00:00', 'SALON 612NB'),
        ('', 'ELECTIVA V: TRIBUTARIO I', 'JORGE MARIO MOLINA HERNÁNDEZ', 'LUNES', '14:00:00', '15:00:00', 'SALON 612NB'),
        ('', 'Electiva II', 'GRETTY PAVLOVICH', 'MARTES', '13:00:00', '14:00:00', 'SALON 612NB'),
        ('', 'OPTATIVA II DERECHO MIGRATORIO', 'JUAN CARLOS DE LOS RIOS', 'LUNES', '16:00:00', '17:00:00', 'SALON 612NB'),
        ('', 'OPTATIVA III DERECHO CONTENCIOSO ADMINISTRATIVO', 'EDUARDO CERRA', 'MARTES', '13:00:00', '14:00:00', 'SALON 612NB'),
        ('', 'OPTATIVA III GESTIÓN DEL TALENTO HUMANO', 'FRANCISCO BUSTAMANTE', 'LUNES', '14:00:00', '15:00:00', 'SALON 612NB'),
        ('', 'OPTATIVA III LITIGIO ORAL', 'INGRID PÉREZ', 'JUEVES', '16:00:00', '17:00:00', 'SALON 612NB'),

        # ── SALON 613NB (4 horarios) ──
        ('III DERECHO A', 'CONSTITUCIONAL COLOMBIANO', 'JHONNY MENDOZA', 'MARTES', '18:00:00', '19:00:00', 'SALON 613NB'),
        ('III DERECHO A', 'CONSTITUCIONAL COLOMBIANO', 'JHONNY MENDOZA', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 613NB'),
        ('III DERECHO A', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'LUNES', '18:00:00', '19:00:00', 'SALON 613NB'),
        ('III DERECHO A', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'JUEVES', '18:00:00', '19:00:00', 'SALON 613NB'),

        # ── SALON 615NB (5 horarios) ──
        ('X DERECHO B', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'LUNES', '08:00:00', '09:00:00', 'SALON 615NB'),
        ('V DERECHO D', 'TUTELA PENAL DE LOS BIENES JURÍDICOS II', 'LUIS CASTILLO', 'LUNES', '14:00:00', '15:00:00', 'SALON 615NB'),
        ('IX DERECHO A', 'OPTATIVA III GESTIÓN DEL TALENTO HUMANO', 'LILIA CEDEÑO', 'LUNES', '10:00:00', '11:00:00', 'SALON 615NB'),
        ('IX DERECHO A', 'OPTATIVA III GESTIÓN DEL TALENTO HUMANO', 'LILIA CEDEÑO', 'JUEVES', '13:00:00', '14:00:00', 'SALON 615NB'),
        ('IX DERECHO A', 'OPTATIVA III SISTEMA DE RESPONSABILIDAD PENAL PARA ADOLESCENTES', 'EDGAR DEVIA', 'MARTES', '10:00:00', '11:00:00', 'SALON 615NB'),

        # ── SALON 616NB (9 horarios) ──
        ('VI DERECHO A', 'PROCESAL CIVIL GENERAL', 'NUBIA MARRUGO', 'LUNES', '08:00:00', '09:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'ADMINISTRATIVO COLOMBIANO', 'JHONNY MENDOZA', 'LUNES', '14:00:00', '15:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'ADMINISTRATIVO COLOMBIANO', 'JHONNY MENDOZA', 'MARTES', '11:00:00', '12:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'ARGUMENTACIÓN JURÍDICA', 'PATRICIA MORRIS', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'INVESTIGACIÓN IV', 'YOLANDA FANDIÑO', 'MARTES', '09:00:00', '10:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'LABORAL COLECTIVO', 'FRANCISCO BUSTAMANTE', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'PROCESAL CIVIL GENERAL', 'NUBIA MARRUGO', 'MARTES', '14:00:00', '15:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'PROCESAL PENAL II', 'RICARDO MÉNDEZ', 'VIERNES', '06:00:00', '07:00:00', 'SALON 616NB'),
        ('VI DERECHO A', 'INVESTIGACIÓN IV', 'YOLANDA FANDIÑO', 'LUNES', '10:00:00', '11:00:00', 'SALON 616NB'),

        # ── SALÓN 611 NB (1 horarios) [ESPACIO NO OFICIAL] ──
        ('', 'OPTATIVA II PAZ Y MODELOS DE JUSTICIA', 'JOHN FABER BUITRAGO', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 611 NB'),
    ]
    
    created_count = 0
    skipped_count = 0
    errors = []
    
    try:
        periodo = PeriodoAcademico.objects.get(nombre='2026-1')
        sede_centro = Sede.objects.get(nombre='Sede Centro')
        programa_derecho = Programa.objects.get(nombre='Derecho')
        programa_admin = Programa.objects.get(nombre='Administración de Negocios Internacionales')
        programa_contaduria = Programa.objects.get(nombre='Contaduría Pública')
        programa_alianza = Programa.objects.get(nombre='Alianza Canadiense')
        
        tipo_aula = TipoEspacio.objects.get(nombre='Aula')
    except Exception as e:
        stdout.write(style.ERROR(f'    ✗ Error obteniendo entidades base: {str(e)}'))
        return
    
    # Helper function para extraer número de semestre de un nombre de grupo
    def extraer_semestre(grupo_nombre):
        import re
        # Buscar patrones como "1 Semestre", "10 semestre", "I ", "X ", etc.
        romanos_map = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
            'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
        }
        
        # Intentar encontrar número romano al inicio
        for romano, numero in romanos_map.items():
            if grupo_nombre.strip().startswith(romano + ' '):
                return numero
        
        # Intentar encontrar "X Semestre" o "X semestre"
        match = re.search(r'(\d+)\s*[Ss]emestre', grupo_nombre)
        if match:
            return int(match.group(1))
        
        # Intentar encontrar en el texto "II CONTADURIA", "III ADM", etc
        for romano, numero in romanos_map.items():
            if f'/{romano} ' in grupo_nombre or grupo_nombre.startswith(romano + ' '):
                return numero
        
        return None
    
    # Determinar programa basado en el nombre del grupo
    def determinar_programa(grupo_nombre):
        grupo_upper = grupo_nombre.upper()
        if 'CONTADURIA' in grupo_upper or 'CONTADURÍA' in grupo_upper:
            return programa_contaduria
        elif 'ADM' in grupo_upper or 'NEGOCIOS' in grupo_upper:
            return programa_admin
        elif 'ALIANZA' in grupo_upper:
            return programa_alianza
        else:
            return programa_derecho
    
    # Mapeo de nombres informales de grupo → nombre formal del Grupo en BD
    # Los nombres formales coinciden con el campo `nombre` del modelo Grupo.
    # Los números romanos indican el semestre (I=1, II=2, …, X=10).
    grupos_derecho_map = {
        # Semestre I
        'I DERECHO A':                 'DERECHO A',
        'I DERECHO B':                 'DERECHO B',
        'I DERECHO C':                 'DERECHO C',
        'I DERECHO D':                 'DERECHO D',
        'I DERECHO E':                 'DERECHO E',
        'I DERECHO AN':                'DERECHO AN',
        'I DERECHO AN-E':              'DERECHO AN-E',
        'I DERECHO AN-1E':             'DERECHO AN-1E',
        '1 semestre grupo A':          'DERECHO A',
        '1 Semestre grupo A':          'DERECHO A',
        '1 semestre grupo B':          'DERECHO B',
        '1 Semestre grupo B':          'DERECHO B',
        '1 semestre grupo C':          'DERECHO C',
        '1 Semestre grupo C':          'DERECHO C',
        '1 semestre grupo D':          'DERECHO D',
        '1 Semestre grupo D':          'DERECHO D',
        '1 semestre grupo E':          'DERECHO E',
        '1 Semestre grupo E':          'DERECHO E',
        # Semestre II
        'II DERECHO A':                'DERECHO A',
        'II DERECHO B':                'DERECHO B',
        'II DERECHO C':                'DERECHO C',
        'II DERECHO D':                'DERECHO D',
        '2 semestre grupo A':          'DERECHO A',
        '2 Semestre grupo A':          'DERECHO A',
        '2 semestre grupo B':          'DERECHO B',
        '2 Semestre grupo B':          'DERECHO B',
        '2. Semestre grupo B':         'DERECHO B',
        '2 semestre grupo C':          'DERECHO C',
        '2 Semestre grupo C':          'DERECHO C',
        '2 semestre grupo D':          'DERECHO D',
        '2 Semestre grupo D':          'DERECHO D',
        # Semestre III
        'III DERECHO A':               'DERECHO A',
        'III DERECHO B':               'DERECHO B',
        'III DERECHO C':               'DERECHO C',
        'III DERECHO D':               'DERECHO D',
        'III DERECHO AB':              'DERECHO AB',
        'III DERECHO AD':              'DERECHO AD',
        '3 semestre grupo A':          'DERECHO A',
        '3 Semestre grupo A':          'DERECHO A',
        '3 semestre grupo B':          'DERECHO B',
        '3 Semestre grupo B':          'DERECHO B',
        '3 semestre grupo C':          'DERECHO C',
        '3 Semestre grupo C':          'DERECHO C',
        '3 semestre grupo D':          'DERECHO D',
        '3 Semestre grupo D':          'DERECHO D',
        # Semestre IV
        'IV DERECHO A':                'DERECHO A',
        'IV DERECHO B':                'DERECHO B',
        'IV DERECHO C':                'DERECHO C',
        'IV SEMESTRE GRUPO A':         'DERECHO A',
        '4 semestre grupo A':          'DERECHO A',
        '4 Semestre grupo A':          'DERECHO A',
        '4 semestre grupo B':          'DERECHO B',
        '4 Semestre grupo B':          'DERECHO B',
        '4 semestre grupo C':          'DERECHO C',
        '4 Semestre grupo C':          'DERECHO C',
        # Semestre V
        'V DERECHO A':                 'DERECHO A',
        'V DERECHO B':                 'DERECHO B',
        'V DERECHO C':                 'DERECHO C',
        'V DERECHO D':                 'DERECHO D',
        '5 semestre grupo A':          'DERECHO A',
        '5 Semestre grupo A':          'DERECHO A',
        '5 Semestre Grupo A':          'DERECHO A',
        '5 semestre grupo B':          'DERECHO B',
        '5 Semestre grupo B':          'DERECHO B',
        '5 Semestre Grupo B':          'DERECHO B',
        '5 semestre grupo C':          'DERECHO C',
        '5 Semestre grupo C':          'DERECHO C',
        '5 Semestre Grupo C':          'DERECHO C',
        '5. Semestre grupo C':         'DERECHO C',
        '5 semestre grupo D':          'DERECHO D',
        '5 Semestre grupo D':          'DERECHO D',
        '5 Semestre Grupo D':          'DERECHO D',
        # Semestre VI
        'VI DERECHO A':                'DERECHO A',
        'VI DERECHO B':                'DERECHO B',
        'VI DERECHO C':                'DERECHO C',
        '6 semestre grupo A':          'DERECHO A',
        '6 Semestre grupo A':          'DERECHO A',
        '6. Semestre grupo A':         'DERECHO A',
        '6 semestre grupo B':          'DERECHO B',
        '6 Semestre grupo B':          'DERECHO B',
        '6 semestre grupo C':          'DERECHO C',
        '6 Semestre grupo C':          'DERECHO C',
        # Semestre VII
        'VII DERECHO A':               'DERECHO A',
        'VII DERECHO B':               'DERECHO B',
        'VII DERECHO C':               'DERECHO C',
        'VII DERECHO D':               'DERECHO D',
        '7 semestre grupo A':          'DERECHO A',
        '7 Semestre grupo A':          'DERECHO A',
        '7 Semestre Grupo A':          'DERECHO A',
        '7 semestre grupo B':          'DERECHO B',
        '7 Semestre grupo B':          'DERECHO B',
        '7 Semestre Grupo B':          'DERECHO B',
        '7 semestre grupo C':          'DERECHO C',
        '7 Semestre grupo C':          'DERECHO C',
        '7 Semestre Grupo C':          'DERECHO C',
        '7 semestre grupo D':          'DERECHO D',
        '7 Semestre grupo D':          'DERECHO D',
        # Semestre VIII
        'VIII DERECHO A':              'DERECHO A',
        'VIII DERECHO B':              'DERECHO B',
        'VIII DERECHO C':              'DERECHO C',
        '8 semestre grupo A':          'DERECHO A',
        '8 Semestre grupo A':          'DERECHO A',
        '8 semestre grupo B':          'DERECHO B',
        '8 Semestre grupo B':          'DERECHO B',
        '8 semestre grupo C':          'DERECHO C',
        '8 Semestre grupo C':          'DERECHO C',
        # Semestre IX
        'IX DERECHO A':                'DERECHO A',
        'IX DERECHO B':                'DERECHO B',
        'IX DERECHO C':                'DERECHO C',
        'IX DERECHO AN':               'DERECHO AN',
        '9 semestre grupo A':          'DERECHO A',
        '9 Semestre grupo A':          'DERECHO A',
        '9 Semestre Grupo A Nocturno': 'DERECHO A',
        '9 semestre grupo A Nocturno': 'DERECHO A',
        '9 Semestre Diurno':           'DERECHO A',
        '9 semestre grupo B':          'DERECHO B',
        '9 Semestre grupo B':          'DERECHO B',
        '9 semestre grupo C':          'DERECHO C',
        '9 Semestre Grupo C':          'DERECHO C',
        '9 semestre grupo D':          'DERECHO D',
        '9. Semestre grupo C':         'DERECHO C',
        # Semestre X
        'X DERECHO A':                 'DERECHO A',
        'X DERECHO B':                 'DERECHO B',
        'X DERECHO C':                 'DERECHO C',
        '10 semestre grupo A':         'DERECHO A',
        '10 Semestre Grupo A Diurno':  'DERECHO A',
        '10 semestre Grupo A Diurno':  'DERECHO A',
        '10 semestre grupo B':         'DERECHO B',
        '10 Semestre grupo B':         'DERECHO B',
        '10 Semestre Grupo B Diurno':  'DERECHO B',
        '10 semestre Grupo B Diurno':  'DERECHO B',
        '10 semestre grupo C':         'DERECHO C',
        '10 Semestre grupo C':         'DERECHO C',
    }

    # Semestres asociados a cada nombre formal de grupo DERECHO
    semestres_derecho = {
        'I':   1, 'II':  2, 'III': 3, 'IV':  4, 'V':   5,
        'VI':  6, 'VII': 7, 'VIII':8, 'IX':  9, 'X':  10,
    }
    # Nombres formales registrados con su semestre
    grupos_formales_derecho = {
        'DERECHO A': None, 'DERECHO B': None,
        'DERECHO C': None, 'DERECHO D': None,
        'DERECHO E': None,
    }

    for grupo_nombre, materia_nombre, profesor_nombre, dia, hora_inicio_str, hora_fin_str, espacio_nombre in horarios_data:
        try:
            # Aplicar mapeo de nombre informal → nombre formal de grupo DERECHO
            grupo_nombre_resuelto = grupos_derecho_map.get(grupo_nombre, grupo_nombre)

            # Buscar la asignatura - si no existe, crearla
            asignatura = Asignatura.objects.filter(nombre__iexact=materia_nombre.strip()).first()
            if not asignatura:
                # Crear la asignatura automáticamente con código único
                import hashlib
                codigo_base = materia_nombre.strip()[:15].upper().replace(' ', '-').replace(':', '')
                codigo_hash = hashlib.md5(materia_nombre.encode()).hexdigest()[:6].upper()
                codigo_unico = f'{codigo_hash}'
                
                # Asegurar que el código sea único
                contador = 1
                codigo_final = codigo_unico
                while Asignatura.objects.filter(codigo=codigo_final).exists():
                    codigo_final = f'{codigo_unico}{contador}'
                    contador += 1
                
                asignatura = Asignatura.objects.create(
                    nombre=materia_nombre.strip(),
                    codigo=codigo_final,
                    creditos=3,
                    horas=3,
                    tipo='mixta'
                )
            
            # Buscar o crear el grupo
            grupo = None
            programa_detectado = determinar_programa(grupo_nombre_resuelto) if grupo_nombre_resuelto.strip() else programa_derecho

            if grupo_nombre_resuelto.strip():
                # Extraer semestre del nombre original para validación
                semestre_extraido = extraer_semestre(grupo_nombre)
                
                # ─── Grupos formales DERECHO (ej. "DERECHO A", "DERECHO B") ───
                if grupo_nombre_resuelto.strip().upper().startswith('DERECHO ') and \
                   grupo_nombre_resuelto.strip().upper() in [k.upper() for k in grupos_formales_derecho]:
                    # VALIDACIÓN REFORZADA: Buscar grupo con nombre Y semestre
                    if semestre_extraido:
                        grupo = Grupo.objects.filter(
                            periodo=periodo,
                            programa=programa_derecho,
                            nombre__iexact=grupo_nombre_resuelto.strip(),
                            semestre=semestre_extraido
                        ).first()
                    else:
                        # Fallback: buscar solo por nombre si no se pudo extraer semestre
                        grupo = Grupo.objects.filter(
                            periodo=periodo,
                            programa=programa_derecho,
                            nombre__iexact=grupo_nombre_resuelto.strip(),
                        ).first()
                    
                    if not grupo:
                        errors.append(f'Grupo formal no encontrado en BD: {grupo_nombre_resuelto} semestre {semestre_extraido} (original: {grupo_nombre})')
                        skipped_count += 1
                        continue
                else:
                    # ─── Grupos informales: extraer semestre del texto ───
                    semestre = extraer_semestre(grupo_nombre_resuelto)

                    if not semestre:
                        semestre = 1  # Default a primer semestre

                    # Buscar grupo existente
                    grupo = Grupo.objects.filter(
                        periodo=periodo,
                        programa=programa_detectado,
                        semestre=semestre
                    ).first()

                    if not grupo:
                        # Crear grupo
                        romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
                        nombre_grupo = f'{romanos[semestre-1]} {programa_detectado.nombre[:20]} Centro'
                        grupo, created = Grupo.objects.get_or_create(
                            programa=programa_detectado,
                            periodo=periodo,
                            semestre=semestre,
                            nombre=nombre_grupo,
                            defaults={'activo': True}
                        )
            else:
                # Para horarios sin grupo específico, crear/usar un grupo general
                grupo, created = Grupo.objects.get_or_create(
                    programa=programa_derecho,
                    periodo=periodo,
                    semestre=1,
                    nombre='I DERECHO GENERAL',
                    defaults={'activo': True}
                )
            
            if not grupo:
                errors.append(f'Grupo no creado: {grupo_nombre}')
                skipped_count += 1
                continue
            
            # Buscar el docente (puede ser null)
            docente = None
            if profesor_nombre.strip():
                # Normalizar nombre para búsqueda
                nombre_busqueda = profesor_nombre.strip().upper()
                # Intentar búsqueda flexible
                docente = Usuario.objects.filter(
                    nombre__icontains=nombre_busqueda
                ).first()
                
                if not docente:
                    # Intentar con partes del nombre
                    partes = nombre_busqueda.split()
                    if len(partes) >= 2:
                        docente = Usuario.objects.filter(
                            nombre__icontains=partes[0]
                        ).filter(
                            nombre__icontains=partes[-1]
                        ).first()
            
            # Buscar o crear el espacio físico
            espacio_normalizado = espacio_nombre.strip()
            espacio = EspacioFisico.objects.filter(
                nombre__iexact=espacio_normalizado,
                sede=sede_centro
            ).first()
            
            if not espacio:
                # Intentar búsqueda parcial
                espacio = EspacioFisico.objects.filter(
                    nombre__icontains=espacio_normalizado.split()[0],
                    sede=sede_centro
                ).first()
                
            if not espacio:
                # Crear el espacio si no existe
                try:
                    espacio = EspacioFisico.objects.create(
                        nombre=espacio_normalizado,
                        sede=sede_centro,
                        tipo=tipo_aula,
                        capacidad=30,  # Capacidad por defecto
                        estado='Disponible'
                    )
                except Exception as e:
                    errors.append(f'No se pudo crear espacio {espacio_nombre}: {str(e)}')
                    skipped_count += 1
                    continue
            
            # Normalizar día
            dia_normalizado = dias_map.get(dia.upper().strip(), dia.strip())
            
            # Convertir horas
            hora_inicio = time.fromisoformat(hora_inicio_str)
            hora_fin = time.fromisoformat(hora_fin_str)
            
            # Crear el horario (sin validación de conflictos durante seed)
            horario, created = Horario.objects.get_or_create(
                grupo=grupo,
                asignatura=asignatura,
                dia_semana=dia_normalizado,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                espacio=espacio,
                defaults={
                    'docente': docente,
                    'estado': 'aprobado'
                }
            )
            
            # Si ya existía pero está pendiente, actualizarlo a aprobado
            if not created and horario.estado == 'pendiente':
                horario.estado = 'aprobado'
                horario.save()
            
            if created:
                created_count += 1
            else:
                skipped_count += 1
                
        except Exception as e:
            errors.append(f'Error en {materia_nombre}: {str(e)}')
            skipped_count += 1
    
    total = len(horarios_data)
    stdout.write(style.SUCCESS(f'    ✓ {created_count} horarios creados, {skipped_count} omitidos ({total} totales)'))
    
    if errors:
        stdout.write(style.WARNING(f'\n    Errores encontrados ({len(errors)}):'))
        for error in errors[:20]:  # Mostrar los primeros 20 errores
            stdout.write(style.WARNING(f'      • {error}'))
        if len(errors) > 20:
            stdout.write(style.WARNING(f'      ... y {len(errors) - 20} errores más'))
    
    # Reconectar la validación de horarios
    pre_save.connect(validar_horario, sender=Horario)


def create_horarios_sede_principal(stdout, style):
    """Crear horarios para la sede principal"""
    stdout.write('  → Creando horarios sede principal...')
    
    # Desconectar temporalmente la validación de horarios durante el seed
    from django.db.models.signals import pre_save
    from horario.signals import validar_horario
    pre_save.disconnect(validar_horario, sender=Horario)
    
    # Mapeo de días en español a formato consistente
    dias_map = {
        'LUNES': 'Lunes',
        'MARTES': 'Martes',
        'MIÉRCOLES': 'Miércoles',
        'MIERCOLES': 'Miércoles',
        'JUEVES': 'Jueves',
        'VIERNES': 'Viernes',
        'SÁBADO': 'Sábado',
        'SABADO': 'Sábado',
        'DOMINGO': 'Domingo'
    }
    
    # Formato: (grupo, materia, profesor, dia, hora_inicio, hora_fin, espacio)
    horarios_data = [
        # ── SALA COMPUTO 201B (1 horarios) ──
        ('Sin grupo especificado', 'Electiva de Profundización II: Estilos de vida saludable y MCH', 'LESLIE MONTEALEGRE', 'LUNES', '09:00:00', '10:00:00', 'SALA COMPUTO 201B'),

        # ── SALA COMPUTO 202B (17 horarios) ──
        ('III MEDICINA/I Y III MICROBIOLOGIA /BACTERIOLOGIA III/instrumentacion III/VIII FISIOTERAPIA', 'Emprendimiento e Innovacion', 'Luis Carlos Rodriguez', 'MARTES', '17:00:00', '18:00:00', 'SALA COMPUTO 202B'),
        ('IV MEDICINA/III INSTRUMENTACION/VIII FISIOTERAPIA/IV BACTERIOLOGÍA', 'Electiva:Competencias informacionales y digitales', 'Luis Carlos Rodriguez', 'MARTES', '15:00:00', '16:00:00', 'SALA COMPUTO 202B'),
        ('MEDICINA I - GA', 'Bioestadística y Demografía Taller', 'Sergio Nieves Vanegas', 'JUEVES', '09:00:00', '10:00:00', 'SALA COMPUTO 202B'),
        ('MEDICINA I - GA', 'Bioestadística y Demografía Taller', 'Sergio Nieves Vanegas', 'JUEVES', '11:00:00', '12:00:00', 'SALA COMPUTO 202B'),
        ('MEDICINA I - GB', 'Bioestadística y Demografía', '202B', 'LUNES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B'),
        ('MEDICINA I - GB', 'Bioestadística y Demografía', '202B', 'VIERNES', '10:00:00', '11:00:00', 'SALA COMPUTO 202B'),
        ('MEDICINA II', 'Electiva de formación integral: Inteligencia Artificial', 'Luis Carlos Rodriguez', 'VIERNES', '15:00:00', '16:00:00', 'SALA COMPUTO 202B'),
        ('MEDICINA II - GB', 'TALLER BIOQUIMICA B2', 'L. Banderas', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Bioestadística', '105B', 'LUNES', '09:00:00', '10:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Bioestadística', '105B', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Bioestadística', '105B', 'JUEVES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Bioinformática', '202B', 'VIERNES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Electiva de profundización I: Estilos de vida saludable', 'Luisa Galeano (TC)', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Empresarismo y Emprendimiento', 'Luis Carlos Rodriguez', 'JUEVES', '15:00:00', '16:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Morfofisiología Humana II', 'D: Aroldo Padilla.', 'LUNES', '15:00:00', '16:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Optativa A: Introducción a la ciencia de datos', '202B', 'MARTES', '13:00:00', '14:00:00', 'SALA COMPUTO 202B'),
        ('Sin grupo especificado', 'Ética y Deontología', 'Stephanye Carrillo', 'MARTES', '08:00:00', '09:00:00', 'SALA COMPUTO 202B'),

        # ── SALON 101B (15 horarios) ──
        ('1 semestre grupo B', 'HABILIDADES COMUNICATIVAS', 'CLAUDIA VIZCAÍNO', 'MARTES', '10:00:00', '11:00:00', 'SALON 101B'),
        ('1 semestre grupo B', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'MARTES', '08:00:00', '09:00:00', 'SALON 101B'),
        ('1 semestre grupo C', 'HABILIDADES COMUNICATIVAS', 'CLAUDIA VIZCAÍNO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 101B'),
        ('1 semestre grupo C', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'JUEVES', '08:00:00', '09:00:00', 'SALON 101B'),
        ('2 semestre grupo A', 'ÉTICA I', 'CRISTÓBAL ARTETA RIPOLL', 'JUEVES', '14:00:00', '15:00:00', 'SALON 101B'),
        ('3 Semestre grupo B', 'CONSTITUCIONAL COLOMBIANO', 'Sin profesor especificado', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 101B'),
        ('3 semestre grupo B', 'INVESTIGACIÓN I', 'PATRICIA MORRIS', 'JUEVES', '06:00:00', '07:00:00', 'SALON 101B'),
        ('3 semestre grupo D', 'CONSTITUCIONAL COLOMBIANO', 'GRETTY PÁVLOVICH', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 101B'),
        ('3 semestre grupo D', 'ELECTIVA III COMPRENSIÓN LECTORA', 'CLAUDIA VIZCAÍNO', 'MARTES', '06:00:00', '07:00:00', 'SALON 101B'),
        ('I MEDICINA - GA', 'Historia de la Medicina', 'Enrique Fonseca', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 101B'),
        ('I MEDICINA GA', 'BIOFISICA TEORIA', 'Ismael Piñeres', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 101B'),
        ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'VIERNES', '08:00:00', '09:00:00', 'SALON 101B'),
        ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'VIERNES', '13:00:00', '14:00:00', 'SALON 101B'),
        ('V MEDICINA - GA', 'Micologia', 'Gloria Muñoz', 'LUNES', '13:00:00', '14:00:00', 'SALON 101B'),
        ('V MEDICINA - GA', 'Patología ATENEO', 'Dra Bertiller', 'LUNES', '11:00:00', '12:00:00', 'SALON 101B'),

        # ── SALON 102B (19 horarios) ──
        ('5 Semestre grupo C', 'DERECHO INTERNACIONAL PRIVADO', 'JUAN CARLOS DE LOS RÍOS', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 102B'),
        ('5 Semestre grupo C', 'INVESTIGACIÓN III', 'CLAUDIA VIZCAÍNO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 102B'),
        ('5 semestre grupo C', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 102B'),
        ('I MEDICINA - GB', 'Electiva de formación integral:', 'Expresión Oral y Escrita', 'JUEVES', '07:00:00', '08:00:00', 'SALON 102B'),
        ('I MEDICINA - GB', 'Socio-Antropología', 'VIRGINIA SIRTORI', 'MARTES', '13:00:00', '14:00:00', 'SALON 102B'),
        ('III MEDICINA', 'Electiva:  Ingles I', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '12:00:00', 'SALON 102B'),
        ('III MEDICINA/III Y IV MICROBIOLOGIA/III BACTERIOLOGIA/III INSTRUMENTACIÓN', 'Electiva:  Ingles II', '102B', 'VIERNES', '13:00:00', '14:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Administración', '102B', 'LUNES', '09:00:00', '10:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Biomecánica', 'GB', 'VIERNES', '09:00:00', '10:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Electiva de profundización II: Motricidad', 'Eulalia Amador', 'LUNES', '07:00:00', '08:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Electiva de profundización II: enfermedades crónicas y MCH', 'Sindy Ariza', 'JUEVES', '13:00:00', '14:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Electiva:  Inglés Basic', '102B', 'VIERNES', '15:00:00', '16:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Inmunologia Teoria', 'Yosed Anaya', 'MARTES', '08:00:00', '09:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Intervención en Fisioterapia l GA', 'Lucy Bula', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Intervención en Fisioterapia l GB', 'Nobis de la Cruz', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Prescripción del Ejercicio GB', 'Raúl Polo', 'LUNES', '12:00:00', '13:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Proyecto de Investigación I G1', '102B', 'LUNES', '14:00:00', '15:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Psicología Evolutiva G1', 'Salón 102B', 'MARTES', '16:00:00', '17:00:00', 'SALON 102B'),
        ('Sin grupo especificado', 'Salud Pública I', 'Eduardo Navarro', 'MARTES', '11:00:00', '12:00:00', 'SALON 102B'),

        # ── SALON 103B (17 horarios) ──
        ('1 semestre grupo D', 'HABILIDADES COMUNICATIVAS', 'CLAUDIA VIZCAÍNO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 103B'),
        ('3 semestre grupo D', 'CONSTITUCIONAL COLOMBIANO', 'GRETTY PÁVLOVICH', 'JUEVES', '08:00:00', '09:00:00', 'SALON 103B'),
        ('I MEDICINA - GA', 'Bioestadística y Demografía', 'Sergio Nieves Vanegas', 'LUNES', '07:00:00', '08:00:00', 'SALON 103B'),
        ('MEDICINA II - GA', 'Metodología de la Investigación', 'Ronald Maestre', 'MARTES', '10:00:00', '11:00:00', 'SALON 103B'),
        ('MEDICINA II - GB', 'TALLER BIOQUIMICA A1', 'L. Banderas', 'VIERNES', '07:00:00', '08:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Análisis Físico-Químico', 'Mario Peña', 'LUNES', '10:00:00', '11:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Bioquímica Teoría', 'Pierine España', 'MARTES', '15:00:00', '16:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Bioquímica Teoría', 'Pierine España', 'JUEVES', '12:00:00', '13:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Electiva de profundización I: FT. Cardiopulmonar', 'Tammy Pulido (CAT)', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Electiva:  Inglés Avanzado', '103B', 'JUEVES', '14:00:00', '15:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Electiva:  Inglés II', '103B', 'JUEVES', '16:00:00', '17:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Electiva: Ingles Avanzado III', 'Salón  103B', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Evaluación y Diagnóstico                 GA', 'Roberto Rebolledo', 'LUNES', '12:00:00', '13:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Microbiología Industrial', 'Marianella  Suárez', 'MARTES', '07:00:00', '08:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Morfo fisiología l (Práctica)', 'GB', 'VIERNES', '09:00:00', '10:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Ocupación y movimiento corporal G1', 'Martha Mendihueta', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Procesos Quirúrgicos', 'en Oftalmología', 'LUNES', '15:00:00', '16:00:00', 'SALON 103B'),

        # ── SALON 104B (21 horarios) ──
        ('1 semestre grupo D', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 104B'),
        ('II MEDICINA', 'Electiva  complementaria 1 : Inteligencia emocional', '104B', 'VIERNES', '11:00:00', '12:00:00', 'SALON 104B'),
        ('II Medicina', 'Electiva Cuidados Basicos', 'Salón  104B', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 104B'),
        ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Administración II Teoría', 'Norka Márquez', 'LUNES', '11:00:00', '12:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Análisis Matemático y Estadístico', 'Javier Duran', 'VIERNES', '07:00:00', '08:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Biología de los Microorganismos', 'María Rosa Baldovino', 'JUEVES', '11:00:00', '12:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Bioquímica Microbiana Teoría', 'Juan David Sanchez', 'LUNES', '06:00:00', '07:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Bioquímica Teoría', 'Pierine España', 'MARTES', '07:00:00', '08:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Comunicación, Liderazgo y Trabajo en Equipo', 'Cecilia Arciniegas', 'MARTES', '16:00:00', '17:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Electiva de profundización I: Estilos de vida saludable', 'Luisa Galeano (TC)', 'LUNES', '16:00:00', '17:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Electiva de profundización II: estilos de vida saludable y MCH', 'Roberto Rebolledo', 'JUEVES', '14:00:00', '15:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Evaluación y Diagnóstico (práctica) GA Roberto Rebolledo', '104B', 'JUEVES', '09:00:00', '10:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Introducción a las ciencias ómicas                                 D: Cristian Cadena', 'Salón: 104B', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Microbiología Teoría', 'Wendy Rosales', 'MARTES', '11:00:00', '12:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'JUEVES', '16:00:00', '17:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Procesos Qcos en Ortopedia', 'Jainer Molina', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Procesos Quirúrgicos en Cardiovascular( C )', 'MARIA MARRIAGA - LORENA HERRERA', 'LUNES', '09:00:00', '10:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Seminario de integración prácticas optativas', 'Yennifer Barrios', 'MARTES', '13:00:00', '14:00:00', 'SALON 104B'),
        ('Sin grupo especificado', 'Ética Y Bioética', 'Anderson Diaz', 'MARTES', '09:00:00', '10:00:00', 'SALON 104B'),
        ('V Semestre Grupo D', 'TUTELA PENAL DE LOS BIENES JURÍDICOS II', 'LUIS CASTILLO', 'LUNES', '13:00:00', '14:00:00', 'SALON 104B'),

        # ── SALON 105B (22 horarios) ──
        ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Administración 1', 'Lorena Herera', 'LUNES', '07:00:00', '08:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Bioestadística', '105B', 'LUNES', '12:00:00', '13:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Calidad Microbiológica y Sanitaria en productos de Consumo - Teoría', '105B', 'MARTES', '09:00:00', '10:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Competencia Comunicativas II', 'Marina Hernández', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Constitución Política', 'D: Bibiana Sierra', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Cálculo', 'Javier Duran', 'VIERNES', '09:00:00', '10:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'ELECTIVA DE PROFUNDIZACIÓN I', 'CALIDAD EN SERVICIO DE SALUD', 'MARTES', '14:00:00', '15:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Epidemiología', 'Adalgiza', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Farmacología y Anestesia', 'SALÓN 105B', 'JUEVES', '10:00:00', '11:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Fundamentos en el Análisis y Redacción de Textos G1', 'Luz Marina Silvera', 'LUNES', '14:00:00', '15:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Microbiología de Alimentos', 'Marianela Suárez', 'JUEVES', '12:00:00', '13:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Morfo fisiología I Práctica- Anfiteatro', 'Gladys Helena Ríos', 'MARTES', '11:00:00', '12:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Optativa B: Bioprospectuón', 'Caludia Tapia', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Optativa C: Fitopatologia y control Biologico', 'Mario Peña', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Optativa I Parasitología Veterinaria', '105B', 'MARTES', '07:00:00', '08:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Patología Teoría', 'Richard Zambrano', 'JUEVES', '07:00:00', '08:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Procesos Qcos en Cirugía Plástica', 'Leidy Gómez', 'LUNES', '09:00:00', '10:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Procesos asepticos I teoria', 'Maria Amador', 'VIERNES', '07:00:00', '08:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Química Especial Teoría', 'Leidy Goenaga', 'MARTES', '16:00:00', '17:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Sistemas de Calidad', 'Maria Rosa Baldovino', 'JUEVES', '15:00:00', '16:00:00', 'SALON 105B'),
        ('Sin grupo especificado', 'Socio antropología', 'Virginia Sirtori', 'LUNES', '16:00:00', '17:00:00', 'SALON 105B'),

        # ── SALON 106B (17 horarios) ──
        ('1 semestre grupo C', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'MARTES', '10:00:00', '11:00:00', 'SALON 106B'),
        ('1 semestre grupo C', 'TEORÍA ECONÓMICA', 'GUILLERMO DE LA HOZ', 'MARTES', '06:00:00', '07:00:00', 'SALON 106B'),
        ('3 Semestre grupo C', 'ELECTIVA III COMPRENSIÓN LECTORA', 'CLAUDIA VIZCAÍNO', 'JUEVES', '06:00:00', '07:00:00', 'SALON 106B'),
        ('3 Semestre grupo C', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'JUEVES', '09:00:00', '10:00:00', 'SALON 106B'),
        ('5 Semestre grupo B', 'ELECTIVA V CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'VIERNES', '06:00:00', '07:00:00', 'SALON 106B'),
        ('II MEDICINA - GA', 'BIOQUIMICA', 'Alejandra Zambrano', 'JUEVES', '12:00:00', '13:00:00', 'SALON 106B'),
        ('III MEDICINA/IV FISIOTERAPIA/III INSTRUMENTACION/III MICROBIOLOGIA/III Y IV BACTERIOLOGIA', 'Electiva de formación integral:', 'Innovacion Social', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 106B'),
        ('III Semestre BacterioplogÍa y MICROBIOLOGÍA', 'Genética', 'Teoría/Genética Básica y', 'LUNES', '10:00:00', '11:00:00', 'SALON 106B'),
        ('IV MEDICINA - GA', 'Epidemiología Básica.', 'Eduardo Navarro', 'VIERNES', '14:00:00', '15:00:00', 'SALON 106B'),
        ('IV MEDICINA - GB', 'Epidemiología Básica', 'Eduardo Navarro', 'VIERNES', '16:00:00', '17:00:00', 'SALON 106B'),
        ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 106B'),
        ('Sin grupo especificado', 'Electiva de profundización II: estilos de vida saludable y MCH', 'Roberto Rebolledo', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 106B'),
        ('Sin grupo especificado', 'Metodología', 'de la Investigación', 'JUEVES', '14:00:00', '15:00:00', 'SALON 106B'),
        ('VI MEDICINA - GA', 'Farmacología Práctica', 'A. GUERRERO/J. Navarro', 'LUNES', '14:00:00', '15:00:00', 'SALON 106B'),
        ('VI MEDICINA - GB', 'Farmacología Práctica', 'A. GUERRERO/J. Navarro', 'MARTES', '16:00:00', '17:00:00', 'SALON 106B'),
        ('VI MEDICINA - GB', 'Farmacología y Toxicología Teoría', 'Dr. Guerrero', 'LUNES', '16:00:00', '17:00:00', 'SALON 106B'),
        ('VI MEDICINA - GB', 'Genética Clínica Teoría', 'Zuleima Yañez', 'MARTES', '12:00:00', '13:00:00', 'SALON 106B'),

        # ── SALON 107B (18 horarios) ──
        ('7 semestre grupo B', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'GONZALO AGUILAR', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 107B'),
        ('7 semestre grupo B', 'FILOSOFÍA DEL DERECHO', 'CRISTÓBAL ARTETA', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 107B'),
        ('III MEDICINA - GB', 'Psicología del Desarrollo                                                                                      Virginia Sirtori', '107B', 'LUNES', '09:00:00', '10:00:00', 'SALON 107B'),
        ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Administración', '102B', 'JUEVES', '14:00:00', '15:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Administración y SSS', 'D: Leidy Goenaga', 'JUEVES', '11:00:00', '12:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Electiva de profundización I: SST', 'Karol Cervantes', 'JUEVES', '16:00:00', '17:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Electivas de formación integral III', 'Cuidado Básico en Salud Noris Álvarez', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'FARMACOLOGIA Y TOXICOLOGIA VII. LILIANA CARRANZA', 'Salón 107B', 'LUNES', '14:00:00', '15:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Inmunohematología Teoría', 'Goenaga', 'MARTES', '14:00:00', '15:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Introducción a la instrumentación', 'María Amador', 'VIERNES', '11:00:00', '12:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Lógica Matemática', 'Sergio Nieves', 'MARTES', '07:00:00', '08:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Micología teoría', 'Gloria Muñoz', 'LUNES', '07:00:00', '08:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Microbiología Ambiental Teoría', 'Mario Peña', 'JUEVES', '07:00:00', '08:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Optativa II: Gestión de residuos hospitalarios', 'D: Liliana Carranza', 'JUEVES', '09:00:00', '10:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Procesos Industriales Teoría', 'Javier Duran', 'LUNES', '16:00:00', '17:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Proyecto de investigación', 'Liliana Carranza', 'MARTES', '17:00:00', '18:00:00', 'SALON 107B'),
        ('Sin grupo especificado', 'Química Teoría', 'Mario Mutis', 'VIERNES', '07:00:00', '08:00:00', 'SALON 107B'),

        # ── SALON 203B (17 horarios) ──
        ('2 semestre grupo A', 'ECONOMÍA COLOMBIANA', 'GUILLERMO DE LA HOZ', 'MARTES', '10:00:00', '11:00:00', 'SALON 203B'),
        ('III MEDICINA', 'Electiva  complementaria 2: Inteligencia emocional', 'Gustavo De La Hoz', 'VIERNES', '13:00:00', '14:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Biofísica', 'Matías Puello', 'MARTES', '15:00:00', '16:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Biotecnología Teoría', 'Mario Peña', 'JUEVES', '07:00:00', '08:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Evaluación y Diagnóstico GB', 'Julia Andrade', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Expresión Oral y Escrita', 'Marina Hernandez', 'LUNES', '08:00:00', '09:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Hematología Teoria', 'Christian Cadenas', 'JUEVES', '09:00:00', '10:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Intervención en Fisioterapia l', 'GA', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Investigación Clínica Epidemiológica', 'Bryan Domínguez', 'LUNES', '14:00:00', '15:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Microbiología General Teoría', 'José Luis Villarreal', 'VIERNES', '10:00:00', '11:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'PRACTICA SALUD PUBLICA PROYECCIÓN COMUNITARIA û Teoría', 'Bryan Domínguez', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Procesos Industriales Teoría / Javier Duran', 'Salón 104B', 'VIERNES', '15:00:00', '16:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Propuesta de Investigación', 'Emilse Vásquez', 'MARTES', '07:00:00', '08:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Proyecto de Investigación III', 'Lina Chavez', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'TOXICOLOGIA', 'Claudia Tapia', 'LUNES', '12:00:00', '13:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Tecnicas Especiales Teoria', 'Claudia Tapia', 'MARTES', '13:00:00', '14:00:00', 'SALON 203B'),
        ('Sin grupo especificado', 'Ética', 'Jose Luis Villareal', 'JUEVES', '13:00:00', '14:00:00', 'SALON 203B'),

        # ── SALON 204B (22 horarios) ──
        ('MEDICINA II - GA', 'Taller Bioqca  A1', 'L. Banderas', 'JUEVES', '07:00:00', '08:00:00', 'SALON 204B'),
        ('MEDICINA II - GB', 'Taller Bioqca  B3 Doc de bioqca', 'L. Banderas', 'VIERNES', '11:00:00', '12:00:00', 'SALON 204B'),
        ('Sin grupo especificado', '"Salud y Ambiente/Electiva de profundización B', 'D: Liliana Carranza', 'MARTES', '09:00:00', '10:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Administración en servicios de salud G1', 'Lucy Bula', 'MARTES', '14:00:00', '15:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Biofisica', 'MATIAS PUELLO', 'JUEVES', '15:00:00', '16:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Biologia molecular', 'Arleth Lopez', 'JUEVES', '10:00:00', '11:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Biotecnología Teoría', 'Mario Peña', 'JUEVES', '09:00:00', '10:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Cinesiopatología G1', 'Yadira Barrios', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Electiva de profundización I: FT. Cardiopulmonar', 'Tammy Pulido (CAT)', 'LUNES', '16:00:00', '17:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Electiva: Comunicación, Liderazgo y Trabajo en Equipo', '204B', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Fundamentos de Psicología', 'Mily Ardila', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Hematología Clínica', 'Lady Goenaga', 'JUEVES', '12:00:00', '13:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Modalidades Físicas GA', 'Lina Chavez', 'LUNES', '11:00:00', '12:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Procesos Qcos Otorrino- Teoría', 'Tatiana Gómez', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Procesos Qcos en Neurocirugía', 'Leidy Gómez', 'MARTES', '16:00:00', '17:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Procesos Qcos. Cx. General y Pediatría GA', 'Arleth Cataño', 'LUNES', '07:00:00', '08:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Procesos Qcos. Cx. General y Pediatría GA', 'Arleth Cataño', 'LUNES', '09:00:00', '10:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Proyecto de investigación', 'Liliana Carranza', 'MARTES', '11:00:00', '12:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Proyecto de investigación', 'Liliana Carranza', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Salud Publica II', 'Elvira Crespo', 'VIERNES', '08:00:00', '09:00:00', 'SALON 204B'),
        ('Sin grupo especificado', 'Técnicas Especiales Teoría', 'Claudia Tapias', 'LUNES', '14:00:00', '15:00:00', 'SALON 204B'),

        # ── SALON 205B (22 horarios) ──
        ('1 semestre grupo D', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'YADIRA GARCÍA', 'JUEVES', '08:00:00', '09:00:00', 'SALON 205B'),
        ('1 semestre grupo D', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'JUEVES', '10:00:00', '11:00:00', 'SALON 205B'),
        ('I MEDICINA - GA', 'Integracion basico', 'clinica. Quimica-Bioquimica', 'VIERNES', '07:00:00', '08:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Biología', 'G1. Alberto Moreno', 'LUNES', '07:00:00', '08:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Biología Teoría', 'Yosed Anaya', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Constitución Nacional', 'Elvis Ruiz', 'MARTES', '16:00:00', '17:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Electiva de profundización I: SST', 'Karol Cervantes', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Epidemiología G1', 'Laura Ardila', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Farmacología en Ft. G1', 'Luisa Galeano', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Fisiopatología Humana / Morfosi ología Humana', 'Gladys Gutierrez', 'LUNES', '14:00:00', '15:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Intervención en Fisioterapia l GA', 'Lucy Bula', 'MARTES', '09:00:00', '10:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Intervención en Ft II GA', 'GA 205B', 'MARTES', '07:00:00', '08:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Intervención en Ft II GA', 'GA 205B', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Introducción a la Fisioterapia', 'Yadira Barrios', 'LUNES', '09:00:00', '10:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Microbiología Teoría', 'Wendy Rosales', 'JUEVES', '12:00:00', '13:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Microbiología predictiva', 'Juan David Sanchez', 'JUEVES', '15:00:00', '16:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Morfofisiología l G1 (teoría)', 'Nobis De la Cruz', 'LUNES', '11:00:00', '12:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Neurociencias del Movimiento G1', 'Eulalia Amador', 'MARTES', '11:00:00', '12:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Parasitología Clínica', 'Christian Cadena', 'VIERNES', '08:00:00', '09:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Tutorias practicas', 'Sindy Ariza', 'MARTES', '14:00:00', '15:00:00', 'SALON 205B'),
        ('Sin grupo especificado', 'Virología Clínica', 'D: María Rosa Baldovino', 'VIERNES', '10:00:00', '11:00:00', 'SALON 205B'),

        # ── SALON 206B (18 horarios) ──
        ('IV MEDICINA/IV FISIOTERAPIA/', 'Electiva:Razonamiento Cuantitativo', 'Jose Jinete', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Control de la Infección y Promoción de la Salud', 'Arleth Cataño', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Electiva de profundización II: conexión mental', 'Mónica Gómez', 'LUNES', '07:00:00', '08:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Electiva de profundización II: conexión mental', 'Mónica Gómez', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Epidemiología G1', 'Laura Ardila', 'MARTES', '14:00:00', '15:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Fisiología del Ejercicio grupo GA', 'Raul Polo', 'LUNES', '09:00:00', '10:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Innovación y tecnología TEORIA', 'Lorena Herrera- Coordinadora asignatura', 'MARTES', '07:00:00', '08:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Intervención en Ft II', 'Yadira Barrios', 'MARTES', '11:00:00', '12:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Metodología de la investigación', 'Cecilia Arciniegas', 'LUNES', '11:00:00', '12:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Microbiología', 'Jaime Lordouy', 'JUEVES', '09:00:00', '10:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Microbiología de suelos', 'Beatriz Barraza', 'MARTES', '09:00:00', '10:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Modalidades Físicas', 'GA', 'MARTES', '16:00:00', '17:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'PRÁCTICA HOSPITALARIA IV', 'SEMINARIO TEORICO PRACTICO', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Quimica Clinica Teoria', 'Lady Goenaga', 'JUEVES', '16:00:00', '17:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Salud y Comunidad G1', 'Lina Chávez', 'VIERNES', '07:00:00', '08:00:00', 'SALON 206B'),
        ('Sin grupo especificado', 'Seminario de integración Prácticas Formativas G1', '206B', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 206B'),
        ('V Semestre grupo D', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'JUEVES', '14:00:00', '15:00:00', 'SALON 206B'),

        # ── SALON 301B (16 horarios) ──
        ('Sin grupo especificado', 'Biología teoría', 'Evelyn Mendoza', 'JUEVES', '07:00:00', '08:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Biomecánica GB', 'Gladys Helena Gutierrez', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Cinesiopatología G1', 'Yadira Barrios', 'VIERNES', '07:00:00', '08:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Control y aprendizaje motor G1', 'Yoly Yepes', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Cuidados Básicos en Salud Teoría', 'María Amador', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Ecología Microbiana', 'Beatriz Barraza', 'LUNES', '08:00:00', '09:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Electiva de profundización (A):', 'Enfermedades Transmitidas por Vectores', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Epistemología de las ciencias G1', 'Karol Cervantes', 'JUEVES', '11:00:00', '12:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Evaluación y Diagnóstico GB', 'Julia Andrade', 'VIERNES', '11:00:00', '12:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Fisiología Animal y Vegetal Arleth Lopez', 'Salón 206B', 'LUNES', '14:00:00', '15:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Fisiología del Ejercicio grupo B', 'Sindy Ariza', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Inmunología Clinica Teoria', 'Franklin Torres', 'JUEVES', '14:00:00', '15:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Procesos Asépticos II', 'Teoría', 'MARTES', '11:00:00', '12:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Sociedad y sector salud teoría', 'Maria Amador', 'JUEVES', '09:00:00', '10:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'Sociedad y sector salud y comunidad - teoría', 'Brayan Domínguez', 'MARTES', '08:00:00', '09:00:00', 'SALON 301B'),
        ('Sin grupo especificado', 'TOXICOLOGIA', 'Claudia Tapia', 'MARTES', '15:00:00', '16:00:00', 'SALON 301B'),

        # ── SALON 302A (19 horarios) ──
        ('3 semestre grupo D', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'MARTES', '09:00:00', '10:00:00', 'SALON 302A'),
        ('302A / V MEDICINA - GB', 'Parasitología  Teoría', 'TULIO DÍAZ', 'MIÉRCOLES', '12:00:00', '13:00:00', 'SALON 302A'),
        ('I MEDICINA - GB', 'Bioestadística y Demografía', 'Adalgisa Alcocer', 'VIERNES', '07:00:00', '08:00:00', 'SALON 302A'),
        ('II MEDICINA - GA', 'Bioquimica', 'ISMAEL LIZARAZU', 'LUNES', '17:00:00', '18:00:00', 'SALON 302A'),
        ('II MEDICINA - GA', 'Morfología I: Anatomia', 'Dr. Aroldo Padillo', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 302A'),
        ('II MEDICINA - GB', 'Bioquimica', 'ISMAEL LIZARAZU', 'LUNES', '18:00:00', '19:00:00', 'SALON 302A'),
        ('II MEDICINA - GB', 'Metodología de la Investigación', 'ELVIRA CRESPO', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 302A'),
        ('II MEDICINA - GB', 'Metodología de la Investigación ELVIRA CRESPO', '302A', 'MARTES', '07:00:00', '08:00:00', 'SALON 302A'),
        ('III MEDICINA - GA', 'Morfología II: Histología Teoría', 'Waldy Ahumada', 'VIERNES', '15:00:00', '16:00:00', 'SALON 302A'),
        ('III MEDICINA/III INSTRUMENTACION/III BACTERIOLOGIA/III MICROBIOLOGIA', 'Electiva de formación integral: Texto y Cultura', 'LUZ M. SILVERA', 'VIERNES', '13:00:00', '14:00:00', 'SALON 302A'),
        ('IV MEDICINA - GA', 'Salud Familiar II', '302A', 'JUEVES', '07:00:00', '08:00:00', 'SALON 302A'),
        ('IV MEDICINA - GB', 'Fisiología Teoría', '302A', 'LUNES', '08:00:00', '09:00:00', 'SALON 302A'),
        ('IV MEDICINA - GB', 'SALUD FAMILIAR II', '302A', 'LUNES', '10:00:00', '11:00:00', 'SALON 302A'),
        ('V MEDICINA - GB', 'Microbiología Teoría', 'ARACELLY GARCÍA', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 302A'),
        ('V MEDICINA - GB', 'Microbiología VIROLOGIA Teoría J.Villarreal', '302A', 'MARTES', '15:00:00', '16:00:00', 'SALON 302A'),
        ('V MEDICINA - GB', 'Módulo farmacología', '302A', 'MARTES', '13:00:00', '14:00:00', 'SALON 302A'),
        ('V MEDICINA - GB', 'Patologia Teoria', 'Sin profesor especificado', 'JUEVES', '09:00:00', '10:00:00', 'SALON 302A'),
        ('VI MEDICINA - GB', 'Farmacología y Toxicología Teoría Guillermo Sarmiento/', 'Elen Manrrique', 'JUEVES', '13:00:00', '14:00:00', 'SALON 302A'),
        ('VI MEDICINA', 'Semiología Teoría', 'FERNANDO FIORILLO', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 302A'),

        # ── SALON 302B (18 horarios) ──
        ('1 semestre grupo D', 'HISTORIA DE LA FILOSOFÍA', 'CRISTÓBAL ARTETA', 'MARTES', '10:00:00', '11:00:00', 'SALON 302B'),
        ('1 semestre grupo D', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MARTES', '08:00:00', '09:00:00', 'SALON 302B'),
        ('IV MEDICINA', 'Electiva : áComunicación, Liderazgo y Trabajo en Equipo', 'Cecilia Arciniegas', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 302B'),
        ('Sin grupo especificado', '*CONTROL DE INFECCIÓN Y PROMOCIÓN DE LA SALUD:', 'Bryan Domínguez', 'MARTES', '14:00:00', '15:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Biofísica Teoría G1', 'Matías Puello', 'JUEVES', '13:00:00', '14:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Cálculo', 'Javier Duran', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'ELECTIVA INSTITUCIONAL û COMPLEMENTARIA', 'Texto y cultura', 'VIERNES', '13:00:00', '14:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Farmacología en Ft', 'Luisa Galeano', 'LUNES', '14:00:00', '15:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Intervención en fisioterapia III', 'GA', 'LUNES', '07:00:00', '08:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Intervención en fisioterapia III GA Jennifer Barrios', '302B', 'JUEVES', '09:00:00', '10:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Intervención en fisioterapia III GB', 'Jennifer Barrios', 'LUNES', '11:00:00', '12:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Introducción a la Fisioterapia G1', 'Yadira Barrios', 'JUEVES', '11:00:00', '12:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Lógica Matemática G1', 'José Jinete', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Ocupación y movimiento corporal G1', 'Martha Mendihueta', 'JUEVES', '07:00:00', '08:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Procesos Quirúrgico Urología(T)', 'Tatiana Gómez', 'VIERNES', '09:00:00', '10:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Salud Ocupacional - Teoría-Jainer Molina', '302B', 'VIERNES', '11:00:00', '12:00:00', 'SALON 302B'),
        ('Sin grupo especificado', 'Salud Pública G1', 'Lina chavez', 'LUNES', '09:00:00', '10:00:00', 'SALON 302B'),
        ('V Semestre grupo D', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'JUEVES', '15:00:00', '16:00:00', 'SALON 302B'),

        # ── SALON 303A (19 horarios) ──
        ('303A / V MEDICINA - GA', 'Parasitología  Teoría', 'TULIO DÍAZ', 'MARTES', '17:00:00', '18:00:00', 'SALON 303A'),
        ('I MEDICINA GB', 'BIOFISICA TEORIA', 'Ismael Piñeres', 'MARTES', '08:00:00', '09:00:00', 'SALON 303A'),
        ('II MEDICINA - GA', 'Morfología I: Histología Teoría', 'Waldy  Ahumada', 'LUNES', '14:00:00', '15:00:00', 'SALON 303A'),
        ('II MEDICINA - GA y GB', 'Morfología I: Embriología', 'Jaime Navarro', 'LUNES', '12:00:00', '13:00:00', 'SALON 303A'),
        ('II MEDICINA - GB', 'Morfología I: Histología Teoría', 'Waldy  Ahumada', 'LUNES', '16:00:00', '17:00:00', 'SALON 303A'),
        ('II MEDICINA GA', 'Metodología de la Investigación', 'Ronald Maestre', 'LUNES', '07:00:00', '08:00:00', 'SALON 303A'),
        ('III MEDICINA - GA', 'Psicología del Desarrollo', 'Mily Ardila', 'JUEVES', '09:00:00', '10:00:00', 'SALON 303A'),
        ('III MEDICINA - GA', 'Salud Familiar  Teoría', 'Sin profesor especificado', 'JUEVES', '07:00:00', '08:00:00', 'SALON 303A'),
        ('III MEDICINA - GA y GB', 'Modulo basico- clinica Embiologia .', 'Jaime Navarro JLM', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 303A'),
        ('III MEDICINA/III MICROBIOLOGIA', 'Electiva de formación integral: Lectura Critica', 'Luz Marina Silvera', 'MARTES', '11:00:00', '12:00:00', 'SALON 303A'),
        ('IV MEDICINA - GB', 'Fisiología Taller', '303A', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 303A'),
        ('IV MEDICINA - GB', 'SALUD FAMILIAR II  TEORIA', '303A', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 303A'),
        ('V MEDICINA - GA', 'ETICA', 'Esteffany Carrillo', 'JUEVES', '15:00:00', '16:00:00', 'SALON 303A'),
        ('V MEDICINA - GA', 'Farmacología Teoria', 'Elen Manrrique', 'MARTES', '15:00:00', '16:00:00', 'SALON 303A'),
        ('V MEDICINA - GA', 'Módulo farmacología', '303A', 'MARTES', '13:00:00', '14:00:00', 'SALON 303A'),
        ('V MEDICINA - GB', 'ETICA', 'Esteffany Carrillo', 'JUEVES', '12:00:00', '13:00:00', 'SALON 303A'),
        ('VI MEDICINA - GA', 'Farmacología Práctica', 'A. GUERRERO/J. Navarro', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 303A'),
        ('VI MEDICINA - GA', 'Farmacología y Toxicología Teoría', 'G. Sarmiento/J. Navarro', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 303A'),
        ('VI MEDICINA - GA', 'Genética Clínica Teoría-Practica', 'Zuleima Yañez', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALON 303A'),

        # ── SALON 303B (21 horarios) ──
        ('I MEDICINA - B', 'Biologia Teoria', 'Yosed Anaya', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 303B'),
        ('III MEDICINA - GB', 'Biología molecular', 'Christian Cadena', 'VIERNES', '10:00:00', '11:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Administración en servicios de salud G1', 'Lucy Bula', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Biología Molecular Teoría', 'D: Arleth López', 'VIERNES', '07:00:00', '08:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Biomecánica', 'GB', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Biomecánica', 'GB', 'JUEVES', '09:00:00', '10:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Bioquímica', 'Mario Mutis', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Cinesiopatología G1', 'Yadira Barrios', 'MARTES', '16:00:00', '17:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Constitución política G1', '303B', 'JUEVES', '11:00:00', '12:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Electiva de profundización II: Motricidad', 'Eulalia Amador', 'LUNES', '09:00:00', '10:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Fisiología del Ejercicio (practica) GB', '303B', 'LUNES', '11:00:00', '12:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Historia de la Ciencia y la Microbiología.', 'Juan David Sánchez', 'JUEVES', '13:00:00', '14:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Intervención en fisioterapia III', 'GA', 'MARTES', '09:00:00', '10:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Morfo fisiología I Teoría', 'Gladys Helena Ríos', 'LUNES', '15:00:00', '16:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Morfo fisiología ll (teoría) G1', '303B', 'LUNES', '13:00:00', '14:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Ocupación y movimiento corporal G1', 'Martha Mendihueta', 'MARTES', '07:00:00', '08:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Optativa II: Diagnóstico Forense                         D: Miriam Linero', 'Salón: 303B', 'JUEVES', '16:00:00', '17:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Patología Básica', 'Richard Zambrano', 'LUNES', '07:00:00', '08:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Prescripción del Ejercicio GA', 'Roberto Rebolledo', 'MARTES', '14:00:00', '15:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Salud Pública G1', 'Lina chavez', 'MARTES', '11:00:00', '12:00:00', 'SALON 303B'),
        ('Sin grupo especificado', 'Ética y bioética G1', 'Gustavo de la Hoz', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 303B'),

        # ── SALON 304B (17 horarios) ──
        ('7 semestre grupo A', 'TITULOS VALORES', 'SANDRA VILLA', 'JUEVES', '06:00:00', '07:00:00', 'SALON 304B'),
        ('I MEDICINA - GA', 'Biología Teoría', 'Juan David Rodriguez/Yosed Anaya', 'MARTES', '07:00:00', '08:00:00', 'SALON 304B'),
        ('III MEDICINA - GB', 'Biología molecular', 'Christian Cadena', 'MARTES', '15:00:00', '16:00:00', 'SALON 304B'),
        ('IV MEDICINA', 'Electiva:  Ingles III', 'YESENIA VALAREZO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Bacteriología Clínica Teoría', 'Gisell diFilippo', 'LUNES', '11:00:00', '12:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Biologia molecular', 'Arleth Lopez', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Competencias Comunicativas I', 'Cecilia Arciniegas', 'LUNES', '08:00:00', '09:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Electiva de profundización I: Estilos de vida saludable y MCH', 'Leslie Montealegre', 'VIERNES', '09:00:00', '10:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Electiva de profundización I: Fisioterapia en enfermedades crónicas', 'Laura Ardila', 'LUNES', '16:00:00', '17:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Epidemiología G1', 'Laura Ardila', 'MARTES', '09:00:00', '10:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Fisiología del Ejercicio GA', 'Raúl Polo', 'JUEVES', '09:00:00', '10:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Intervención en Fisioterapia l GB', 'Nobis de la Cruz', 'LUNES', '14:00:00', '15:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Intervención en fisioterapia III GA', 'Salón 304B', 'JUEVES', '14:00:00', '15:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Morfo fisiología II- Teoría', 'Tatiana Gómez', 'VIERNES', '11:00:00', '12:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Optativa A: Micología Avanzada', 'Gloria Muñoz', 'MARTES', '13:00:00', '14:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Procesos Qcos. Cirugía Plástica', 'Leidy Gómez', 'MARTES', '11:00:00', '12:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Proyecto de Investigación II', 'Laura Ardila (TC)', 'VIERNES', '07:00:00', '08:00:00', 'SALON 304B'),

        # ── SALON 305B (18 horarios) ──
        ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Biomecánica teoría', 'GA', 'MARTES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'CALIDAD EN SERVICIOS DE SALUD', 'María Inés López', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Discapacidad G1', 'Yoly Yepes', 'LUNES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Electiva de profundización I: Fisioterapia en enfermedades crónicas - Laura Ardila', 'salón 305B', 'MARTES', '16:00:00', '17:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Evaluación y Diagnóstico GB', 'Julia Andrade', 'JUEVES', '11:00:00', '12:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Farmacología y Anestesia', 'SALÓN 105B', 'MARTES', '14:00:00', '15:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Intervención en Fisioterapia l GB', 'Nobis de la Cruz', 'JUEVES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Intervención en Ft II', 'Yadira Barrios', 'LUNES', '11:00:00', '12:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Intervención en Ft II GA', 'GA 205B', 'LUNES', '07:00:00', '08:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Metodología de la investigación   G1', 'Laura Ardila', 'MARTES', '07:00:00', '08:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Modalidades Físicas', 'GA', 'JUEVES', '14:00:00', '15:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Morfo fisiología l (Práctica)', 'GB', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'PRACTICA HOSPITALARIA III', 'SEMINARIO TEORICO PRACTICO', 'LUNES', '16:00:00', '17:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Proyección a la comunidad TEORÍA D: Bryan Dominguéz Salón: 305B', 'VI BACTERIOLOGÍA', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Práctica Administrativa Teoría', 'Lorena Herrera', 'VIERNES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'SocioAnatropologia', 'Salón 305B', 'MARTES', '11:00:00', '12:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Trabajo de grado', 'Alfonso Rodriguez', 'VIERNES', '07:00:00', '08:00:00', 'SALON 305B'),

        # ── SALON 306B (20 horarios) ──
        ('2 semestre grupo A', 'TEORÍA DE LA CONSTITUCIÓN', 'GRETTY PAVLOVICH', 'JUEVES', '11:00:00', '12:00:00', 'SALON 306B'),
        ('II MEDICINA - GA', 'Metodología de la Investigación', 'G. DE LA HOZ', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 306B'),
        ('II MEDICINA - GB', 'Metodología de la Investigación ELVIRA CRESPO', '302A', 'LUNES', '09:00:00', '10:00:00', 'SALON 306B'),
        ('II MEDICINA/II FISIOTERAPIA/II MICROBIOLOGIA/III INSTRUMENTACION', 'Electiva de formación integral:', 'Comunicación No verbal', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 306B'),
        ('III MEDICINA - GA', 'Biología molecular', 'Christian Cadena', 'VIERNES', '11:00:00', '12:00:00', 'SALON 306B'),
        ('III MEDICINA - GB', 'Salud Familiar áTeoría', '306B', 'LUNES', '07:00:00', '08:00:00', 'SALON 306B'),
        ('IV MEDICINA', 'Electiva de Formación Integral: Responsabilidad Social y Empresarial', '306B', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 306B'),
        ('IV MEDICINA - GA', 'Epidemiología Básica', 'Eduardo Navarro', 'LUNES', '14:00:00', '15:00:00', 'SALON 306B'),
        ('IV MEDICINA - GA', 'Fisiología Teoría', 'Simon Bolivar', 'LUNES', '11:00:00', '12:00:00', 'SALON 306B'),
        ('IV MEDICINA - GA', 'Fisiología Teoría', 'Simon Bolivar', 'MARTES', '10:00:00', '11:00:00', 'SALON 306B'),
        ('IV MEDICINA - GA', 'Inmunología Teoría', 'FRANKLIN TORRES', 'LUNES', '16:00:00', '17:00:00', 'SALON 306B'),
        ('IV MEDICINA - GB', 'Epidemiología Básica.', 'Eduardo Navarro', 'JUEVES', '14:00:00', '15:00:00', 'SALON 306B'),
        ('IV MEDICINA - GB', 'Fisiología Teoría', '302A', 'MARTES', '07:00:00', '08:00:00', 'SALON 306B'),
        ('IV MEDICINA - GB', 'Inmunología Teoría', 'FRANKLIN TORRES', 'JUEVES', '16:00:00', '17:00:00', 'SALON 306B'),
        ('MEDICINA II - GA', 'Taller Bioqca  A1', 'L. Banderas', 'VIERNES', '09:00:00', '10:00:00', 'SALON 306B'),
        ('Sin grupo especificado', 'CONTROL DE INFECCIÓN: Angelica Corcho-', 'Sin profesor especificado', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 306B'),
        ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'JUEVES', '08:00:00', '09:00:00', 'SALON 306B'),
        ('V MEDICINA GA', 'Patología  Teoría', '306B', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 306B'),
        ('VI MEDICINA - GA', 'Farmacología y Toxicología Teoría', 'G. Sarmiento/J. Navarro', 'MARTES', '13:00:00', '14:00:00', 'SALON 306B'),
        ('VI MEDICINA - GA', 'Genética Clínica Teoría', 'Zuleima Yañez', 'MARTES', '16:00:00', '17:00:00', 'SALON 306B'),

        # ── SALON 307B (21 horarios) ──
        ('5 Semestre Grupo C', 'INVESTIGACIÓN III', 'CLAUDIA VIZCAÍNO', 'JUEVES', '08:00:00', '09:00:00', 'SALON 307B'),
        ('I MEDICINA - GB', 'Química Teoría', 'ALEJANDRA ZAMBRANO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 307B'),
        ('II MEDICINA', 'ELECTIVA INSTITUCIONAL COMPLEMENTARIA', 'Comunicación escrita 307B', 'VIERNES', '11:00:00', '12:00:00', 'SALON 307B'),
        ('III MEDICINA - GA', 'Morfología II: Anatomia AROLDO PADILLA', '307B', 'MARTES', '15:00:00', '16:00:00', 'SALON 307B'),
        ('III MEDICINA - GA', 'Morfología II: Histología Teoría', 'Waldy Ahumada', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALON 307B'),
        ('III MEDICINA - GA', 'Psicología del Desarrollo', 'Mily Ardila', 'MARTES', '13:00:00', '14:00:00', 'SALON 307B'),
        ('III MEDICINA - GA', 'Salud Familiar áTeoría', '307B', 'MARTES', '07:00:00', '08:00:00', 'SALON 307B'),
        ('IV MEDICINA - GA', 'Fisiología Taller', '307B', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 307B'),
        ('Sin grupo especificado', 'Salud PUBLICA', 'ANDERSON DIAZ', 'MARTES', '11:00:00', '12:00:00', 'SALON 307B'),
        ('V MEDICINA - GA', 'Patologia Practica', '307B', 'MARTES', '09:00:00', '10:00:00', 'SALON 307B'),
        ('V MEDICINA - GA', 'Patologia Practica', '307B', 'VIERNES', '09:00:00', '10:00:00', 'SALON 307B'),
        ('V MEDICINA - GB', 'Farmacología Teoria', 'Elin Manrrique', 'LUNES', '15:00:00', '16:00:00', 'SALON 307B'),
        ('V MEDICINA - GB', 'Micologia', 'Gloria Muñoz', 'LUNES', '11:00:00', '12:00:00', 'SALON 307B'),
        ('V MEDICINA - GB', 'Patología ATENEO', 'Dra Bertiller', 'LUNES', '13:00:00', '14:00:00', 'SALON 307B'),
        ('V MEDICINA - GB', 'Patología Macro Práctica      GRUPOS A4-B4', '307B', 'LUNES', '09:00:00', '10:00:00', 'SALON 307B'),
        ('V MEDICINA - GB', 'Patología Teoria', '307B', 'LUNES', '07:00:00', '08:00:00', 'SALON 307B'),
        ('VI MEDICINA - GA', 'Bioética', 'Anderson Diaz', 'JUEVES', '14:00:00', '15:00:00', 'SALON 307B'),
        ('VI MEDICINA - GB', 'Bioética', 'Anderson Diaz', 'JUEVES', '16:00:00', '17:00:00', 'SALON 307B'),
        ('VI MEDICINA - GB', 'Farmacología y Toxicología Teoría', 'Dr. Guerrero', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 307B'),
        ('VI MEDICINA - GB', 'Genética Clínica Teoría', 'Zuleima Yañez', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 307B'),
        ('VI MEDICINA', 'Semiología', 'ELBA VALLE', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 307B'),

        # ── SALON 308B (22 horarios) ──
        ('2 semestre grupo A', 'ELECTIVA II ESTRUCTURA COMUNICATIVA DEL TEXO ESCRITO', 'SANDRA VILLA', 'MARTES', '08:00:00', '09:00:00', 'SALON 308B'),
        ('2 semestre grupo A', 'TEORÍA DE LA CONSTITUCIÓN', 'GRETTY PAVLOVICH', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 308B'),
        ('3 semestre grupo AB', 'ELECTIVA III  3AB', 'COMPRENSIÓN LECTORA', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 308B'),
        ('7 semestre grupo A', 'TITULOS VALORES', 'SANDRA VILLA', 'MARTES', '06:00:00', '07:00:00', 'SALON 308B'),
        ('I MEDICINA  - GA', 'Biologia Teoria', 'Yosed Anaya', 'LUNES', '16:00:00', '17:00:00', 'SALON 308B'),
        ('I MEDICINA - GA', 'Química Teoría', 'ALEJANDRA ZAMBRANO', 'VIERNES', '10:00:00', '11:00:00', 'SALON 308B'),
        ('I MEDICINA - GA', 'Socio-Antropología', 'VIRGINIA SIRTORI', 'LUNES', '14:00:00', '15:00:00', 'SALON 308B'),
        ('I MEDICINA - GB', 'Integracion basico-clinica. Quimica-Bioquimica', 'ALEJANDRA ZAMBRANO', 'MIÉRCOLES', '12:00:00', '13:00:00', 'SALON 308B'),
        ('I MEDICINA-GA', 'Expresión Oral y Escrita', 'Marina Hernandez', 'LUNES', '10:00:00', '11:00:00', 'SALON 308B'),
        ('II MEDICINA - GB', 'Bioquimica', 'ISMAEL LIZARAZU', 'JUEVES', '13:00:00', '14:00:00', 'SALON 308B'),
        ('II MEDICINA - GB', 'Morfología I: Anatomia', 'GILBERTO BARRIOS', 'MARTES', '11:00:00', '12:00:00', 'SALON 308B'),
        ('III MEDICINA - GA', 'Biología Molecular  Teoría', 'Christian Cadena', 'LUNES', '07:00:00', '08:00:00', 'SALON 308B'),
        ('III MEDICINA - GB', 'Morfología II: Teoría', 'AROLDO PADILLA', 'JUEVES', '16:00:00', '17:00:00', 'SALON 308B'),
        ('III MEDICINA - GB', 'Salud Familiar  Teoría', '308B', 'JUEVES', '07:00:00', '08:00:00', 'SALON 308B'),
        ('III MEDICINA/III BACTERIOLOGIA', 'Electiva de formación integral:    Lectura Critica', 'Marina Hernandez', 'VIERNES', '08:00:00', '09:00:00', 'SALON 308B'),
        ('IV MEDICINA - GA', 'Fisiología Teoría', 'Simon Bolivar', 'JUEVES', '12:00:00', '13:00:00', 'SALON 308B'),
        ('IV MEDICINA - GA', 'Salud Familiar II Teoría', '308B', 'MARTES', '13:00:00', '14:00:00', 'SALON 308B'),
        ('IV MEDICINA - GB', 'Fisiología Teoría', '302A', 'JUEVES', '11:00:00', '12:00:00', 'SALON 308B'),
        ('IV MEDICINA GB', 'Electiva: Razonamiento cuantitativo', 'JOSE JINETE', 'MARTES', '15:00:00', '16:00:00', 'SALON 308B'),
        ('IV MEDICINA/VI FISIOTERAPIA/', 'Electiva: Competencia Ciudadana', 'Luz Marina Silvera', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 308B'),
        ('Sin grupo especificado', 'Prestamo Consejo Estudiantil de Medicina - CEM', '308B', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALON 308B'),
        ('V MEDICINA - GA', 'Microbiología  teoría', 'Virologia. J. Villarreal', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 308B'),

        # ── TORREON 1 (12 horarios) ──
        ('2. Semestre grupo B', 'CIVIL GENERAL Y PERSONAS', 'BEATRIZ TOVAR', 'MIÉRCOLES', '07:00:00', '08:00:00', 'TORREON 1'),
        ('2. Semestre grupo B', 'CIVIL GENERAL Y PERSONAS', 'BEATRIZ TOVAR', 'JUEVES', '07:00:00', '08:00:00', 'TORREON 1'),
        ('3 Semestre grupo B', 'TEORÍA DEL DELITO', 'JOHN BUITRAGO', 'MIÉRCOLES', '09:00:00', '10:00:00', 'TORREON 1'),
        ('3 Semestre grupo B', 'TEORÍA DEL DELITO', 'JOHN BUITRAGO', 'JUEVES', '09:00:00', '10:00:00', 'TORREON 1'),
        ('3 Semestre grupo C', 'CONSTITUCIONAL COLOMBIANO', 'Sin profesor especificado', 'LUNES', '06:00:00', '07:00:00', 'TORREON 1'),
        ('3 Semestre grupo C', 'CONSTITUCIONAL COLOMBIANO', 'Sin profesor especificado', 'MARTES', '06:00:00', '07:00:00', 'TORREON 1'),
        ('3 Semestre grupo C', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'MARTES', '10:00:00', '11:00:00', 'TORREON 1'),
        ('II MEDICINA - GA', 'Bioquimica ISMAEL LIZARAZU, ALEJANDRA ZAMBRANO', 'Sin profesor especificado', 'JUEVES', '16:00:00', '17:00:00', 'TORREON 1'),
        ('II MEDICINA - GB', 'Bioquimica', 'ISMAEL LIZARAZU', 'MIÉRCOLES', '16:00:00', '17:00:00', 'TORREON 1'),
        ('IX MEDICINA', 'Proyecto de Grado  teoría', 'GUSTAVO DE LA HOZ - Primer Corte', 'MIÉRCOLES', '14:00:00', '15:00:00', 'TORREON 1'),
        ('V MEDICINA - GA', 'Microbiología Teoría', 'Aracelys García', 'JUEVES', '13:00:00', '14:00:00', 'TORREON 1'),
        ('V MEDICINA - GB', 'Patologia Teoria', 'Sin profesor especificado', 'VIERNES', '09:00:00', '10:00:00', 'TORREON 1'),

        # ── TORREON 2 (12 horarios) ──
        ('1 semestre grupo B', 'FILOSOFÍA DEL DERECHO', 'CRISTÓBAL ARTETA', 'JUEVES', '10:00:00', '11:00:00', 'TORREON 2'),
        ('1 semestre grupo B', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'JUEVES', '08:00:00', '09:00:00', 'TORREON 2'),
        ('3 Semestre grupo B', 'INVESTIGACIÓN I', 'PATRICIA MORRIS', 'JUEVES', '06:00:00', '07:00:00', 'TORREON 2'),
        ('3 semestre grupo D', 'TEORÍA DEL DELITO', 'LUIS CASTILLO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'TORREON 2'),
        ('3 semestre grupo D', 'TEORÍA DEL DELITO', 'LUIS CASTILLO', 'JUEVES', '13:00:00', '14:00:00', 'TORREON 2'),
        ('I MEDICINA - GB', 'Biologia Teoria', 'Juan David Rodriguez/Alberto Moreno', 'MARTES', '15:00:00', '16:00:00', 'TORREON 2'),
        ('I MEDICINA - GB', 'Biología Teoría', 'Juan David Rodriguez', 'MIÉRCOLES', '07:00:00', '08:00:00', 'TORREON 2'),
        ('I MEDICINA - GB', 'Historia de la Medicina', 'Enrique Fonseca', 'MIÉRCOLES', '09:00:00', '10:00:00', 'TORREON 2'),
        ('II MEDICINA - GA', 'Bioquimica _x000D_', 'ISMAEL LIZARAZU_x000D_', 'MARTES', '16:00:00', '17:00:00', 'TORREON 2'),
        ('II MEDICINA/I Y II MICROBIOLOGIA//II BACTERIOLOGIA', 'Electiva de formación integral:', 'Redacción de Textos Científicos', 'MIÉRCOLES', '11:00:00', '12:00:00', 'TORREON 2'),
        ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'MARTES', '08:00:00', '09:00:00', 'TORREON 2'),
        ('Sin grupo especificado', 'Química Teoría', 'Mario Mutis', 'LUNES', '12:00:00', '13:00:00', 'TORREON 2'),
    ]
    
    # Obtener sede principal
    try:
        sede, _ = Sede.objects.get_or_create(nombre='Sede Principal', defaults={
            'direccion': 'Dirección sede principal',
            'activo': True
        })
    except Exception as e:
        stdout.write(style.ERROR(f'Error creando sede: {str(e)}'))
        return
    
    # Obtener periodo
    try:
        periodo = PeriodoAcademico.objects.get(nombre='2026-1')
    except PeriodoAcademico.DoesNotExist:
        stdout.write(style.ERROR('Periodo 2026-1 no existe'))
        return
    
    # Contadores
    created_count = 0
    skipped_count = 0
    errors = []
    
    # Crear horarios
    for data in horarios_data:
        try:
            grupo_nombre, materia_nombre, profesor_nombre, dia, hora_inicio, hora_fin, espacio_nombre = data
            
            # Limpiar y limitar nombres
            materia_nombre = materia_nombre.strip()
            if len(materia_nombre) > 100:
                materia_nombre = materia_nombre[:97] + '...'
            
            # Normalizar día
            dia_normalizado = dias_map.get(dia.upper(), dia)
            
            # Obtener o crear asignatura
            # Generar un código único basado en el nombre completo (max 20 chars)
            import hashlib
            nombre_hash = hashlib.md5(materia_nombre.encode()).hexdigest()[:6].upper()
            codigo_base = materia_nombre[:12].replace(" ", "").upper()
            codigo = f'{codigo_base[:12]}-{nombre_hash}'  # Max 12+1+6 = 19 chars
            
            # Primero intentar encontrar por nombre
            try:
                asignatura = Asignatura.objects.filter(nombre=materia_nombre).first()
                if not asignatura:
                    # Si no existe, crear una nueva
                    asignatura, _ = Asignatura.objects.get_or_create(
                        codigo=codigo,
                        defaults={
                            'nombre': materia_nombre,
                            'creditos': 3,
                            'horas': 3
                        }
                    )
            except Exception as e:
                # Si hay error, intentar crear con codigo único
                counter = 1
                while True:
                    try:
                        codigo_alt = f'{codigo_base[:10]}-{counter:03d}'  # Max 10+1+3 = 14 chars
                        asignatura, _ = Asignatura.objects.get_or_create(
                            codigo=codigo_alt,
                            defaults={
                                'nombre': materia_nombre,
                                'creditos': 3,
                                'horas': 3
                            }
                        )
                        break
                    except:
                        counter += 1
                        if counter > 999:
                            raise Exception(f'No se pudo crear asignatura: {materia_nombre}')
            
            # Obtener o crear grupo
            # Si el grupo está vacío, usamos un nombre genérico
            if not grupo_nombre or grupo_nombre.strip() == '':
                grupo_nombre_final = f'{materia_nombre} - General'
            else:
                grupo_nombre_final = grupo_nombre
            
            # Limitar el nombre del grupo a 50 caracteres
            if len(grupo_nombre_final) > 50:
                grupo_nombre_final = grupo_nombre_final[:47] + '...'
            
            # Intentar encontrar un programa relacionado
            programa = None
            if 'MEDICINA' in grupo_nombre_final.upper():
                try:
                    programa = Programa.objects.get(nombre__icontains='Medicina')
                except:
                    pass
            elif 'DERECHO' in grupo_nombre_final.upper() or 'semestre' in grupo_nombre_final.lower():
                try:
                    programa = Programa.objects.get(nombre__icontains='Derecho')
                except:
                    pass
            elif 'BACTERIO' in grupo_nombre_final.upper() or 'MICROBIOLOGIA' in grupo_nombre_final.upper():
                try:
                    programa = Programa.objects.get(nombre__icontains='Bacteriología')
                except:
                    pass
            elif 'FISIOTERAPIA' in grupo_nombre_final.upper():
                try:
                    programa = Programa.objects.get(nombre__icontains='Fisioterapia')
                except:
                    pass
            elif 'INSTRUMENTACION' in grupo_nombre_final.upper():
                try:
                    programa = Programa.objects.get(nombre__icontains='Instrumentación')
                except:
                    pass
            
            # Si no encontramos programa, usar uno por defecto
            if not programa:
                try:
                    programa = Programa.objects.first()
                except:
                    pass
            
            grupo, _ = Grupo.objects.get_or_create(
                nombre=grupo_nombre_final,
                periodo=periodo,
                defaults={
                    'programa': programa,
                    'semestre': 1,
                    'activo': True
                }
            )
            
            # Obtener o crear usuario (profesor)
            profesor = None
            if profesor_nombre and profesor_nombre != 'Sin profesor especificado':
                # Generar correo único
                base_email = profesor_nombre.lower().replace(' ', '.').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')[:30]
                email = f'{base_email}@sihul.edu.co'
                counter = 1
                while Usuario.objects.filter(correo=email).exists():
                    email = f'{base_email[:20]}_{counter}@sihul.edu.co'
                    counter += 1
                
                # Intentar obtener el rol Docente
                rol_docente = None
                try:
                    rol_docente = Rol.objects.get(nombre='Docente')
                except Rol.DoesNotExist:
                    pass
                
                profesor, _ = Usuario.objects.get_or_create(
                    correo=email,
                    defaults={
                        'nombre': profesor_nombre,
                        'contrasena_hash': 'hash_placeholder',
                        'rol': rol_docente,
                        'activo': True
                    }
                )
            
            # Obtener o crear espacio físico
            # Primero obtener o crear el tipo de espacio
            tipo_espacio, _ = TipoEspacio.objects.get_or_create(
                nombre='Aula',
                defaults={'descripcion': 'Aula de clases'}
            )
            
            espacio, _ = EspacioFisico.objects.get_or_create(
                nombre=espacio_nombre,
                sede=sede,
                defaults={
                    'capacidad': 50,
                    'tipo': tipo_espacio,
                    'estado': 'Disponible'
                }
            )
            
            # Crear horario
            horario, created = Horario.objects.get_or_create(
                asignatura=asignatura,
                grupo=grupo,
                dia_semana=dia_normalizado,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                espacio=espacio,
                defaults={
                    'docente': profesor,
                    'estado': 'aprobado'  # Estado aprobado por defecto
                }
            )
            
            if created:
                created_count += 1
            else:
                skipped_count += 1
                
        except Exception as e:
            errors.append(f'Error en {materia_nombre}: {str(e)}')
            skipped_count += 1
    
    total = len(horarios_data)
    stdout.write(style.SUCCESS(f'    ✓ {created_count} horarios creados, {skipped_count} omitidos ({total} totales)'))
    
    if errors:
        stdout.write(style.WARNING(f'\n    Errores encontrados ({len(errors)}):'))
        for error in errors[:20]:  # Mostrar los primeros 20 errores
            stdout.write(style.WARNING(f'      • {error}'))
        if len(errors) > 20:
            stdout.write(style.WARNING(f'      ... y {len(errors) - 20} errores más'))
    
    # Reconectar la validación de horarios
    pre_save.connect(validar_horario, sender=Horario)

