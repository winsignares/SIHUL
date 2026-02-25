"""
Seeder de horarios para Sede Norte.
Este archivo se llenará gradualmente con los datos específicos de la sede norte.
"""

from datetime import time
from django.db.models import Q
from sedes.models import Sede
from espacios.models import TipoEspacio, EspacioFisico
from usuarios.models import Rol, Usuario
from asignaturas.models import Asignatura
from programas.models import Programa
from periodos.models import PeriodoAcademico
from grupos.models import Grupo
from horario.models import Horario


def create_horarios_sede_centro(stdout, style):
    """Crear horarios para la sede centro (sede norte)"""
    stdout.write('  → Creando horarios sede centro (norte)...')
    # Datos pendientes por agregar
    stdout.write(style.SUCCESS('    ✓ 0 horarios creados (pendiente)'))


def create_horarios_sede_principal(stdout, style):
    """Crear horarios para la sede principal (sede norte)"""
    stdout.write('  → Creando horarios sede principal (norte)...')
    
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
        # ══════════════════════════════════════════════════
        # TORREÓN 1 (Capacidad: 130)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('III DERECHO GC', 'Constitucional Colombiano', '', 'LUNES', '06:00:00', '09:00:00', 'TORREON 1'),
        
        # MARTES
        ('III DERECHO GC', 'Constitucional Colombiano', '', 'MARTES', '06:00:00', '09:00:00', 'TORREON 1'),
        ('III DERECHO GC', 'Teoría del Delito', 'Carlos Jiménez', 'MARTES', '10:00:00', '13:00:00', 'TORREON 1'),
        
        # MIÉRCOLES
        ('II DERECHO GB', 'Civil General y Personas', 'Beatriz Tovar', 'MIÉRCOLES', '07:00:00', '09:00:00', 'TORREON 1'),
        ('III DERECHO GB', 'Teoría del Delito', 'John Buitrago', 'MIÉRCOLES', '9:00:00', '12:00:00', 'TORREON 1'),
        ('IX MEDICINA GA', 'Proyecto de Investigación', 'Gustavo De La Hoz', 'MIÉRCOLES', '14:00:00', '16:00:00', 'TORREON 1'),
        ('II MEDICINA GB', 'Bioquímica', 'Ismael Lizarazu', 'MIÉRCOLES', '16:00:00', '18:00:00', 'TORREON 1'),
        
        # JUEVES
        ('II DERECHO GB', 'Civil General y Personas', 'Beatriz Tovar', 'JUEVES', '07:00:00', '09:00:00', 'TORREON 1'),
        ('III DERECHO GB', 'Teoría del Delito', 'John Buitrago', 'JUEVES', '9:00:00', '12:00:00', 'TORREON 1'),
        ('V MEDICINA GA', 'Microbiología', 'Aracelly García', 'JUEVES', '13:00:00', '15:00:00', 'TORREON 1'),
        ('II MEDICINA GA', 'Bioquímica', 'Ismael Lizarazu', 'JUEVES', '16:00:00', '18:00:00', 'TORREON 1'),
        
        # VIERNES
        ('V MEDICINA GB', 'Patología', '', 'VIERNES', '9:00:00', '11:00:00', 'TORREON 1'),
        
        # ══════════════════════════════════════════════════
        # TORREÓN 2 (Capacidad: 130)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('I BACTERIOLOGÍA GA', 'Química', 'Mario Mutis', 'LUNES', '12:00:00', '15:00:00', 'TORREON 2'),
        ('I MICROBIOLOGÍA GA', 'Química', 'Mario Mutis', 'LUNES', '12:00:00', '15:00:00', 'TORREON 2'),
        
        # MARTES
        ('I MEDICINA GB', 'Química', '', 'MARTES', '08:00:00', '11:00:00', 'TORREON 2'),
        ('I MEDICINA GB', 'Biología', 'Juan David Rodriguez', 'MARTES', '15:00:00', '16:00:00', 'TORREON 2'),
        ('II MEDICINA GA', 'Bioquímica', 'Ismael Lizarazu', 'MARTES', '16:00:00', '18:00:00', 'TORREON 2'),
        
        # MIÉRCOLES
        ('I MEDICINA GB', 'Biología', 'Juan David Rodriguez', 'MIÉRCOLES', '07:00:00', '09:00:00', 'TORREON 2'),
        ('I MEDICINA GB', 'Historia de la Medicina', 'Enrique Fonseca', 'MIÉRCOLES', '09:00:00', '11:00:00', 'TORREON 2'),
        ('II MEDICINA GB', 'Fundamentos en Análisis y Redacción de Texto', 'Luz M. Silvera', 'MIÉRCOLES', '11:00:00', '13:00:00', 'TORREON 2'),
        ('II BACTERIOLOGÍA GA', 'Fundamentos en Análisis y Redacción de Texto', 'Luz M. Silvera', 'MIÉRCOLES', '11:00:00', '13:00:00', 'TORREON 2'),
        ('II MICROBIOLOGÍA GA', 'Fundamentos en Análisis y Redacción de Texto', 'Luz M. Silvera', 'MIÉRCOLES', '11:00:00', '13:00:00', 'TORREON 2'),
        ('III DERECHO GD', 'Teoría del Delito', 'Luis Castillo', 'MIÉRCOLES', '13:00:00', '16:00:00', 'TORREON 2'),
        
        # JUEVES
        ('III DERECHO GB', 'Investigación I', 'Patricia Morris', 'JUEVES', '06:00:00', '08:00:00', 'TORREON 2'),
        ('I DERECHO GB', 'Teoría del Estado', 'Linda Nader', 'JUEVES', '08:00:00', '10:00:00', 'TORREON 2'),
        ('I DERECHO GB', 'Filosofía del Derecho', 'Cristóbal Arteta', 'JUEVES', '10:00:00', '13:00:00', 'TORREON 2'),
        ('III DERECHO GD', 'Teoría del Delito', 'Luis Castillo', 'JUEVES', '13:00:00', '16:00:00', 'TORREON 2'),
        
        # ══════════════════════════════════════════════════
        # SALÓN 302A (Capacidad: 100)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('IV MEDICINA GB', 'Fisiología', '', 'LUNES', '08:00:00', '10:00:00', 'SALON 302A'),
        ('IV MEDICINA GB', 'Salud Familiar II', '', 'LUNES', '10:00:00', '12:00:00', 'SALON 302A'),
        ('I INSTRUMENTACIÓN GA', 'Morfofisiología I', 'Gladys Helena Rios', 'LUNES', '15:00:00', '17:00:00', 'SALON 302A'),
        ('II MEDICINA GA', 'Bioquímica', 'Ismael Lizarazu', 'LUNES', '17:00:00', '18:00:00', 'SALON 302A'),
        ('II MEDICINA GB', 'Bioquímica', 'Ismael Lizarazu', 'LUNES', '18:00:00', '19:00:00', 'SALON 302A'),
        
        
        # MARTES
        ('II MEDICINA GB', 'Metodología de la Investigación', 'Elvira Crespo', 'MARTES', '07:00:00', '09:00:00', 'SALON 302A'),
        ('III DERECHO GD', 'Lógica Jurídica', 'Yadira García', 'MARTES', '09:00:00', '12:00:00', 'SALON 302A'),
        ('V MEDICINA GB', 'Farmacología y Toxicología Básica', '', 'MARTES', '13:00:00', '15:00:00', 'SALON 302A'),
        ('V MEDICINA GB', 'Microbiología', 'J. Villareal', 'MARTES', '15:00:00', '17:00:00', 'SALON 302A'),
        
        # MIÉRCOLES
        ('II MEDICINA GB', 'Metodología de la Investigación', 'Elvira Crespo', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 302A'),
        ('VI MEDICINA GA', 'Semiología', 'Fernando Fiorillo', 'MIÉRCOLES', '09:00:00', '12:00:00', 'SALON 302A'),
        ('V MEDICINA GB', 'Parasitología Clínica', 'Tulio Díaz', 'MIÉRCOLES', '12:00:00', '13:00:00', 'SALON 302A'),
        ('V MEDICINA GB', 'Microbiología', 'Aracelly García', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 302A'),
        ('II MEDICINA GA', 'Morfología I', 'Aroldo Padilla', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 302A'),
        
        # JUEVES
        ('IV MEDICINA GA', 'Salud Familiar II', '', 'JUEVES', '07:00:00', '09:00:00', 'SALON 302A'),
        ('V MEDICINA GB', 'Patología', '', 'JUEVES', '09:00:00', '11:00:00', 'SALON 302A'),
        ('VI MEDICINA GB', 'Farmacología y Toxicología Básica', 'Elen Manrrique', 'JUEVES', '13:00:00', '15:00:00', 'SALON 302A'),
        
        # VIERNES
        ('I MEDICINA GB', 'Bioestadística y Demografía', 'Adalgisa Alcocer', 'VIERNES', '07:00:00', '10:00:00', 'SALON 302A'),
        ('III MEDICINA GA', 'Electiva Complementaria I', 'Luz M. Silvera', 'VIERNES', '13:00:00', '15:00:00', 'SALON 302A'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria I', 'Luz M. Silvera', 'VIERNES', '13:00:00', '15:00:00', 'SALON 302A'),
        ('III BACTERIOLOGÍA GA', 'Electiva Complementaria I', 'Luz M. Silvera', 'VIERNES', '13:00:00', '15:00:00', 'SALON 302A'),
        ('III MICROBIOLOGÍA GA', 'Electiva Complementaria I', 'Luz M. Silvera', 'VIERNES', '13:00:00', '15:00:00', 'SALON 302A'),
        
        # ══════════════════════════════════════════════════
        # SALÓN 101B (Capacidad: 100)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('V MEDICINA GA', 'Patología', 'Dra Bertiller', 'LUNES', '11:00:00', '13:00:00', 'SALON 101B'),
        ('V MEDICINA GA', 'Micología Clínica', 'Gloria Muñoz', 'LUNES', '13:00:00', '14:00:00', 'SALON 101B'),
        
        # MARTES
        ('III DERECHO GD', 'CEA-ELE3', 'Claudia Vizcaíno', 'MARTES', '06:00:00', '08:00:00', 'SALON 101B'),
        ('I DERECHO GB', 'Introducción al Derecho', 'Oona Hernández', 'MARTES', '08:00:00', '10:00:00', 'SALON 101B'),
        ('I DERECHO GB', 'Habilidades Comunicativas', 'Claudia Vizcaíno', 'MARTES', '10:00:00', '13:00:00', 'SALON 101B'),
        
        # MIÉRCOLES
        ('III DERECHO GD', 'Constitucional Colombiano', 'Gretty Pavlovich', 'MIÉRCOLES', '07:00:00', '10:00:00', 'SALON 101B'),
        ('I MEDICINA GA', 'Historia de la Medicina', 'Enrique Fonseca', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 101B'),
        ('I MEDICINA GA', 'Biofísica', 'Ismael Piñeres', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 101B'),
        
        # JUEVES
        ('III DERECHO GB', 'Investigación I', 'Patricia Morris', 'JUEVES', '06:00:00', '08:00:00', 'SALON 101B'),
        ('I DERECHO GC', 'Introducción al Derecho', 'Oona Hernández', 'JUEVES', '08:00:00', '10:00:00', 'SALON 101B'),
        ('I DERECHO GC', 'Habilidades Comunicativas', 'Claudia Vizcaíno', 'JUEVES', '10:00:00', '13:00:00', 'SALON 101B'),
        ('II DERECHO GA', 'Ética I', 'Cristóbal Arteta Ripoll', 'JUEVES', '14:00:00', '17:00:00', 'SALON 101B'),
        
        # VIERNES
        ('I DERECHO GB', 'Biología', '', 'VIERNES', '08:00:00', '10:00:00', 'SALON 101B'),
        ('I DERECHO GB', 'Química', '', 'VIERNES', '13:00:00', '15:00:00', 'SALON 101B'),
        
        # SALÓN 102B (Capacidad: 50)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('VII FISIOTERAPIA GA', 'Electiva de Profundización II', 'Eulalia Amador', 'LUNES', '07:00:00', '09:00:00', 'SALON 102B'),
        ('VI MICROBIOLOGÍA GA', 'Microbiología de Alimentos y Medicamentos', 'Marianella Suarez', 'LUNES', '09:00:00', '11:00:00', 'SALON 102B'),
        ('III FISIOTERAPIA GB', 'Prescripción del Ejercicio', 'Raúl Polo', 'LUNES', '12:00:00', '14:00:00', 'SALON 102B'),
        ('III FISIOTERAPIA GB', 'Intervención en Fisioterapia I', 'Tammy Pulido', 'LUNES', '12:00:00', '14:00:00', 'SALON 102B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', '', 'LUNES', '14:00:00', '16:00:00', 'SALON 102B'),
        
        # MARTES
        ('IV BACTERIOLOGÍA GA', 'Inmunología', 'Yosed Anaya', 'MARTES', '08:00:00', '11:00:00', 'SALON 102B'),
        ('IV MICROBIOLOGÍA GA', 'Inmunología', 'Yosed Anaya', 'MARTES', '08:00:00', '11:00:00', 'SALON 102B'),
        ('III BACTERIOLOGÍA GA', 'Salud Pública I', 'Eduardo Navarro', 'MARTES', '11:00:00', '13:00:00', 'SALON 102B'),
        ('II FISIOTERAPIA GA', 'Socioantropología', 'Virginia Sirtori', 'MARTES', '13:00:00', '15:00:00', 'SALON 102B'),
        ('II FISIOTERAPIA GB', 'Psicología Evolutiva', 'Mily Ardila', 'MARTES', '16:00:00', '18:00:00', 'SALON 102B'),
        
        # MIÉRCOLES
        ('V DERECHO GC', 'Investigación III', 'Claudia Vizcaíno', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 102B'),
        ('V DERECHO GC', 'Derecho Internacional Privado', 'Juan Carlos De Los Ríos', 'MIÉRCOLES', '10:00:00', '13:00:00', 'SALON 102B'),
        ('III FISIOTERAPIA GB', 'Intervención en Fisioterapia I', 'Nobis De La Cruz', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 102B'),
        ('III FISIOTERAPIA GA', 'Intervención en Fisioterapia I', 'Lucy Bula', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 102B'),
        
        # JUEVES
        ('I MEDICINA GB', 'Expresión Oral y Escrita', 'Marina Hernandez', 'JUEVES', '07:00:00', '09:00:00', 'SALON 102B'),
        ('V DERECHO GC', 'Administrativo General', 'Jaime Bermejo', 'JUEVES', '10:00:00', '12:00:00', 'SALON 102B'),
        ('VII FISIOTERAPIA GA', 'Electiva de Profundización II', 'Sindy Ariza', 'JUEVES', '14:00:00', '17:00:00', 'SALON 102B'),
        
        # VIERNES
        ('II FISIOTERAPIA GB', 'Biomecánica', 'Gladys Helena Gutiérrez', 'VIERNES', '09:00:00', '11:00:00', 'SALON 102B'),
        
        # Inglés I - 11:00-13:00
        ('III MEDICINA GA', 'Electiva Complementaria I', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '13:00:00', 'SALON 102B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria III', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '13:00:00', 'SALON 102B'),
        ('II BACTERIOLOGÍA GA', 'Electiva Complementaria III', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '13:00:00', 'SALON 102B'),
        ('III BACTERIOLOGÍA GA', 'Electiva Complementaria III', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '13:00:00', 'SALON 102B'),
        ('II MICROBIOLOGÍA GA', 'Electiva Complementaria III', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '13:00:00', 'SALON 102B'),
        ('III MICROBIOLOGÍA GA', 'Electiva Complementaria III', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '13:00:00', 'SALON 102B'),
        
        # Inglés II - 13:00-15:00
        ('III MEDICINA GA', 'Electiva Complementaria III', '', 'VIERNES', '13:00:00', '15:00:00', 'SALON 102B'),
        ('III MICROBIOLOGÍA GA', 'Electiva Complementaria III', '', 'VIERNES', '13:00:00', '15:00:00', 'SALON 102B'),
        ('IV MICROBIOLOGÍA GA', 'Electiva Complementaria III', '', 'VIERNES', '13:00:00', '15:00:00', 'SALON 102B'),
        ('III BACTERIOLOGÍA GA', 'Electiva Complementaria III', '', 'VIERNES', '13:00:00', '15:00:00', 'SALON 102B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria III', '', 'VIERNES', '13:00:00', '15:00:00', 'SALON 102B'),
        
        # Inglés Basic - 15:00-17:00
        ('II FISIOTERAPIA GA', 'Electiva Complementaria III', '', 'VIERNES', '15:00:00', '17:00:00', 'SALON 102B'),
        ('II BACTERIOLOGÍA GA', 'Electiva Complementaria III', '', 'VIERNES', '15:00:00', '17:00:00', 'SALON 102B'),
        ('II MICROBIOLOGÍA GA', 'Electiva Complementaria III', '', 'VIERNES', '15:00:00', '17:00:00', 'SALON 102B'),
        ('II INSTRUMENTACIÓN GA', 'Electiva Complementaria III', '', 'VIERNES', '15:00:00', '17:00:00', 'SALON 102B'),
        
        # SALÓN 103B (Capacidad: 50)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('I MEDICINA GB', 'Bioestadística y Demografía', 'Sergio Nieves Vanegas', 'LUNES', '07:00:00', '10:00:00', 'SALON 103B'),
        ('V MICROBIOLOGÍA GA', 'Análisis Físico-Químico', 'Mario Peña', 'LUNES', '10:00:00', '12:00:00', 'SALON 103B'),
        ('III FISIOTERAPIA GA', 'Evaluación y Diagnóstico', 'Roberto Rebolledo', 'LUNES', '12:00:00', '14:00:00', 'SALON 103B'),
        ('VI INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Oftalmología', 'Angélica Corcho', 'LUNES', '15:00:00', '17:00:00', 'SALON 103B'),
        
        # MARTES
        ('VII MICROBIOLOGÍA GA', 'Microbiología Industrial', 'Marianella Suarez', 'MARTES', '07:00:00', '09:00:00', 'SALON 103B'),
        ('II MEDICINA GA', 'Metodología de la Investigación', 'Ronald Maestre', 'MARTES', '10:00:00', '12:00:00', 'SALON 103B'),
        ('II INSTRUMENTACIÓN GA', 'Bioquímica', 'Pierine España', 'MARTES', '15:00:00', '17:00:00', 'SALON 103B'),
        
        # MIÉRCOLES
        ('V FISIOTERAPIA GA', 'Ocupación y Movimiento Corporal', 'Martha Mendihueta', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 103B'),
        ('I DERECHO GD', 'Habilidades Comunicativas', 'Claudia Vizcaíno', 'MIÉRCOLES', '10:00:00', '13:00:00', 'SALON 103B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria III', '', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 103B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', 'Tammy Pulido', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 103B'),
        
        # JUEVES
        ('III DERECHO GD', 'Constitucional Colombiano', 'Gretty Pavlovich', 'JUEVES', '08:00:00', '11:00:00', 'SALON 103B'),
        ('II MICROBIOLOGÍA GA', 'Bioquímica', 'Evelyn Mendoza', 'JUEVES', '12:00:00', '13:00:00', 'SALON 103B'),
        ('II BACTERIOLOGÍA GA', 'Bioquímica', 'Evelyn Mendoza', 'JUEVES', '12:00:00', '13:00:00', 'SALON 103B'),
        ('IV FISIOTERAPIA GA', 'Electiva Complementaria III', '', 'JUEVES', '14:00:00', '16:00:00', 'SALON 103B'),
        ('IV BACTERIOLOGÍA GA', 'Electiva Complementaria III', '', 'JUEVES', '16:00:00', '18:00:00', 'SALON 103B'),
        ('IV INSTRUMENTACIÓN GA', 'Electiva Complementaria III', '', 'JUEVES', '16:00:00', '18:00:00', 'SALON 103B'),
        
        # VIERNES
        ('II MEDICINA GB', 'Bioquímica', 'L Banderas', 'VIERNES', '07:00:00', '09:00:00', 'SALON 103B'),
        ('I FISIOTERAPIA GB', 'Morfofisiología I', 'Nobis De La Cruz', 'VIERNES', '09:00:00', '12:00:00', 'SALON 103B'),
        
        # SALÓN 104B (Capacidad: 50)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('III MICROBIOLOGÍA GA', 'Bioquímica Microbiana', 'Juan David Sanchez', 'LUNES', '06:00:00', '09:00:00', 'SALON 104B'),
        ('VII INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Cardiovascular', 'Lorena Herrera', 'LUNES', '09:00:00', '11:00:00', 'SALON 104B'),
        ('VII INSTRUMENTACIÓN GA', 'Administración II', 'Norka Márquez', 'LUNES', '11:00:00', '13:00:00', 'SALON 104B'),
        ('V DERECHO GD', 'Tutela Penal de los Bienes Jurídicos II', 'Luis Castillo', 'LUNES', '13:00:00', '16:00:00', 'SALON 104B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', 'Luisa Galeano', 'LUNES', '16:00:00', '18:00:00', 'SALON 104B'),
        
        # MARTES
        ('II MICROBIOLOGÍA GA', 'Bioquímica', 'Evelyn Mendoza', 'MARTES', '07:00:00', '09:00:00', 'SALON 104B'),
        ('II BACTERIOLOGÍA GA', 'Bioquímica', 'Evelyn Mendoza', 'MARTES', '07:00:00', '09:00:00', 'SALON 104B'),
        ('II BACTERIOLOGÍA GA', 'Ética y Bioética', 'Anderson Díaz', 'MARTES', '09:00:00', '11:00:00', 'SALON 104B'),
        ('V MICROBIOLOGÍA GA', 'Ética y Bioética', 'Anderson Díaz', 'MARTES', '09:00:00', '11:00:00', 'SALON 104B'),
        ('VI MICROBIOLOGÍA GA', 'Microbiología', 'Wendy Rosales', 'MARTES', '11:00:00', '13:00:00', 'SALON 104B'),
        ('VIII FISIOTERAPIA GA', 'Prácticas Optativas', 'Yennifer Barrios', 'MARTES', '13:00:00', '15:00:00', 'SALON 104B'),
        ('VIII FISIOTERAPIA GA', 'Administración en Salud II', 'Cecilia Arcieniegas', 'MARTES', '16:00:00', '18:00:00', 'SALON 104B'),
        ('III INSTRUMENTACIÓN GA', 'Administración en Salud II', 'Cecilia Arcieniegas', 'MARTES', '16:00:00', '18:00:00', 'SALON 104B'),
        
        # MIÉRCOLES
        ('I DERECHO GD', 'Introducción al Derecho', 'Oona Hernández', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 104B'),
        ('II MEDICINA GA', 'Cuidados Básicos en Salud', '', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 104B'),
        ('VI BACTERIOLOGÍA GA', 'Introducción a las Tecnologías Ómicas', 'Cristian Cadena', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 104B'),
        ('V INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Ortopedia', 'Jainer Molina', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 104B'),
        
        # JUEVES
        ('III FISIOTERAPIA GA', 'Evaluación y Diagnóstico', 'Roberto Rebolledo', 'JUEVES', '09:00:00', '11:00:00', 'SALON 104B'),
        ('II MEDICINA GA', 'Biología de los Microorganismos', 'María Rosa Baldovino', 'JUEVES', '11:00:00', '14:00:00', 'SALON 104B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización II', 'Roberto Rebolledo', 'JUEVES', '14:00:00', '16:00:00', 'SALON 104B'),
        ('ALIANZA CANADIENSE GA', 'Modalidad Semestral', '', 'JUEVES', '16:00:00', '18:00:00', 'SALON 104B'),
        
        # VIERNES
        ('I MICROBIOLOGÍA GA', 'Bioestadística', 'Javier Duran', 'VIERNES', '07:00:00', '09:00:00', 'SALON 104B'),
        ('II MEDICINA GA', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 104B'),
        ('ALIANZA CANADIENSE GA', 'Modalidad Semestral', '', 'VIERNES', '16:00:00', '18:00:00', 'SALON 104B'),
        
        # SALÓN 105B (Capacidad: 50)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('VI INSTRUMENTACIÓN GA', 'Administración I', 'Lorena Herrera', 'LUNES', '07:00:00', '09:00:00', 'SALON 105B'),
        ('VI INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Cirugía Plástica', 'Leidy Gómez', 'LUNES', '09:00:00', '11:00:00', 'SALON 105B'),
        ('II BACTERIOLOGÍA GA', 'Bioestadística', 'Sergio Nieves Vanegas', 'LUNES', '12:00:00', '14:00:00', 'SALON 105B'),
        ('III MICROBIOLOGÍA GA', 'Bioestadística', 'Sergio Nieves Vanegas', 'LUNES', '12:00:00', '14:00:00', 'SALON 105B'),
        ('I FISIOTERAPIA GA', 'Fundamentos en Análisis y Redacción de Texto', 'Luz M. Silvera', 'LUNES', '14:00:00', '16:00:00', 'SALON 105B'),
        ('I FISIOTERAPIA GA', 'Socioantropología', 'Virginia Sirtori', 'LUNES', '16:00:00', '18:00:00', 'SALON 105B'),
        
        # MARTES
        ('V BACTERIOLOGÍA GA', 'Optativa I', '', 'MARTES', '07:00:00', '09:00:00', 'SALON 105B'),
        ('VIII MICROBIOLOGÍA GA', 'Optativa I', '', 'MARTES', '07:00:00', '09:00:00', 'SALON 105B'),
        ('V BACTERIOLOGÍA GA', 'Calidad Microbiológica y Sanitaria', '', 'MARTES', '09:00:00', '11:00:00', 'SALON 105B'),
        ('I INSTRUMENTACIÓN GA', 'Morfofisiología I', 'Gladys Helena Rios', 'MARTES', '11:00:00', '13:00:00', 'SALON 105B'),
        ('VI INSTRUMENTACIÓN GA', 'Electiva de Profundización I', 'Cecilia Arcieniegas', 'MARTES', '14:00:00', '16:00:00', 'SALON 105B'),
        ('V BACTERIOLOGÍA GA', 'Química Especial', 'Leidy Goenaga', 'MARTES', '16:00:00', '18:00:00', 'SALON 105B'),
        
        # MIÉRCOLES
        ('III BACTERIOLOGÍA GA', 'Epidemiología', 'Adalgiza Alcocer', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 105B'),
        ('III MICROBIOLOGÍA GA', 'Epidemiología', 'Adalgiza Alcocer', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 105B'),
        ('II INSTRUMENTACIÓN GA', 'Competencias Comunicativas II', 'Marina Hernandez', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 105B'),
        ('VIII MICROBIOLOGÍA GA', 'Prácticas Profesionales', 'Claudia Tapia', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 105B'),
        ('VIII MICROBIOLOGÍA GA', 'Optativa III', 'Mario Peña', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 105B'),
        ('II BACTERIOLOGÍA GA', 'Constitución Política', 'Ingrid Perez', 'MIÉRCOLES', '17:00:00', '19:00:00', 'SALON 105B'),
        ('II MICROBIOLOGÍA GA', 'Constitución Política', 'Ingrid Perez', 'MIÉRCOLES', '17:00:00', '19:00:00', 'SALON 105B'),
        
        # JUEVES
        ('III INSTRUMENTACIÓN GA', 'Patología', 'Richard Zambrano', 'JUEVES', '07:00:00', '09:00:00', 'SALON 105B'),
        ('III INSTRUMENTACIÓN GA', 'Farmacología y Anestesia', '', 'JUEVES', '10:00:00', '12:00:00', 'SALON 105B'),
        ('VII MICROBIOLOGÍA GA', 'Microbiología de Alimentos y Medicamentos', 'Marianella Suarez', 'JUEVES', '12:00:00', '14:00:00', 'SALON 105B'),
        ('II BACTERIOLOGÍA GA', 'Sistemas de Calidad', 'María Rosa Baldovino', 'JUEVES', '15:00:00', '18:00:00', 'SALON 105B'),
        
        # VIERNES
        ('III INSTRUMENTACIÓN GA', 'Procesos Asépticos I', 'María Amador', 'VIERNES', '07:00:00', '09:00:00', 'SALON 105B'),
        ('III MICROBIOLOGÍA GA', 'Cálculo', 'Javier Duran', 'VIERNES', '09:00:00', '11:00:00', 'SALON 105B'),
        ('II MEDICINA GA', 'Electiva Profesional I', 'Tammy Pulido', 'VIERNES', '11:00:00', '13:00:00', 'SALON 105B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Profesional I', 'Tammy Pulido', 'VIERNES', '11:00:00', '13:00:00', 'SALON 105B'),
        ('ALIANZA CANADIENSE GA', 'Modalidad Semestral', '', 'VIERNES', '14:00:00', '18:00:00', 'SALON 105B'),
    ]
    
    # Obtener sede principal
    try:
        sede = Sede.objects.get(nombre='Sede Principal')
    except Sede.DoesNotExist:
        stdout.write(style.ERROR('    ✗ Sede Principal no existe'))
        return
    
    # Obtener periodo
    try:
        periodo = PeriodoAcademico.objects.get(nombre='2026-1')
    except PeriodoAcademico.DoesNotExist:
        stdout.write(style.ERROR('    ✗ Periodo 2026-1 no existe'))
        return
    
    # LIMPIAR TODOS LOS HORARIOS DE LOS GRUPOS DEL NORTE
    # Nota: Esto elimina TODOS los horarios de estos grupos, independientemente del espacio
    # (TORREÓN 1, TORREÓN 2, salones, laboratorios, etc.)
    grupos_nombres = list(set([data[0] for data in horarios_data]))
    
    stdout.write(style.WARNING(f'    ⚠ Eliminando TODOS los horarios de {len(grupos_nombres)} grupos (todos los espacios)...'))
    
    # Eliminar TODOS los horarios de estos grupos sin importar el espacio físico
    deleted_count = 0
    for grupo_nombre in grupos_nombres:
        try:
            grupo = Grupo.objects.get(nombre=grupo_nombre, periodo=periodo)
            # Cuenta cuántos horarios tiene el grupo en cualquier espacio
            count = Horario.objects.filter(grupo=grupo).count()
            # Elimina TODOS los horarios del grupo
            Horario.objects.filter(grupo=grupo).delete()
            deleted_count += count
            if count > 0:
                stdout.write(style.WARNING(f'      • {grupo_nombre}: {count} horarios eliminados (todos los espacios)'))
        except Grupo.DoesNotExist:
            stdout.write(style.WARNING(f'      • Grupo no encontrado: {grupo_nombre}'))
    
    stdout.write(style.WARNING(f'    ⚠ Total: {deleted_count} horarios eliminados de TODOS los espacios'))
    
    # Contadores
    created_count = 0
    skipped_count = 0
    errors = []
    
    # Crear horarios
    for data in horarios_data:
        try:
            grupo_nombre, materia_nombre, profesor_nombre, dia, hora_inicio, hora_fin, espacio_nombre = data
            
            # Normalizar día
            dia_normalizado = dias_map.get(dia.upper(), dia)
            
            # Obtener asignatura (por nombre o código)
            asignatura = Asignatura.objects.filter(
                Q(nombre__iexact=materia_nombre.strip()) | Q(codigo__iexact=materia_nombre.strip())
            ).first()
            
            if not asignatura:
                errors.append(f'Asignatura no encontrada: {materia_nombre}')
                skipped_count += 1
                continue
            
            # Obtener grupo
            try:
                grupo = Grupo.objects.get(nombre=grupo_nombre, periodo=periodo)
            except Grupo.DoesNotExist:
                errors.append(f'Grupo no encontrado: {grupo_nombre}')
                skipped_count += 1
                continue
            
            # Obtener o crear profesor
            profesor = None
            if profesor_nombre and profesor_nombre.strip() != '':
                base_email = profesor_nombre.lower().replace(' ', '.').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')[:30]
                email = f'{base_email}@sihul.edu.co'
                counter = 1
                while Usuario.objects.filter(correo=email).exists():
                    email = f'{base_email[:20]}_{counter}@sihul.edu.co'
                    counter += 1
                
                try:
                    rol_docente = Rol.objects.get(nombre='Docente')
                except Rol.DoesNotExist:
                    rol_docente = None
                
                profesor, _ = Usuario.objects.get_or_create(
                    correo=email,
                    defaults={
                        'nombre': profesor_nombre,
                        'contrasena_hash': 'hash_placeholder',
                        'rol': rol_docente,
                        'activo': True
                    }
                )
            
            # Obtener espacio físico
            try:
                espacio = EspacioFisico.objects.get(nombre=espacio_nombre, sede=sede)
            except EspacioFisico.DoesNotExist:
                errors.append(f'Espacio no encontrado: {espacio_nombre}')
                skipped_count += 1
                continue
            
            # Crear el horario (ya limpiamos todos los anteriores)
            horario = Horario.objects.create(
                asignatura=asignatura,
                grupo=grupo,
                dia_semana=dia_normalizado,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                espacio=espacio,
                docente=profesor,
                estado='aprobado'
            )
            
            created_count += 1
                
        except Exception as e:
            errors.append(f'Error en {grupo_nombre} - {materia_nombre}: {str(e)}')
            skipped_count += 1
    
    total = len(horarios_data)
    stdout.write(style.SUCCESS(f'    ✓ {created_count} horarios creados, {skipped_count} omitidos ({total} totales)'))
    
    if errors:
        stdout.write(style.WARNING(f'\n    Errores encontrados ({len(errors)}):'))
        for error in errors[:10]:  # Mostrar los primeros 10 errores
            stdout.write(style.WARNING(f'      • {error}'))
        if len(errors) > 10:
            stdout.write(style.WARNING(f'      ... y {len(errors) - 10} errores más'))
    
    # Reconectar la validación de horarios
    pre_save.connect(validar_horario, sender=Horario)
