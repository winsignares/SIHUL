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
        
        # SALÓN 106B (Capacidad: 100)
        # ══════════════════════════════════════════════════
        
        # LUNES
        ('III MICROBIOLOGÍA GA', 'Genética', 'María Rosa Baldovino', 'LUNES', '11:00:00', '14:00:00', 'SALON 106B'),
        ('VI MEDICINA GA', 'Farmacología y Toxicología', 'A. Guerrero', 'LUNES', '14:00:00', '16:00:00', 'SALON 106B'),
        ('VI MEDICINA GB', 'Farmacología y Toxicología', 'A. Guerrero', 'LUNES', '16:00:00', '18:00:00', 'SALON 106B'),
        
        # MARTES
        ('I DERECHO GC', 'Teoría Económica', 'Guillermo De La Hoz', 'MARTES', '06:00:00', '09:00:00', 'SALON 106B'),
        ('I DERECHO GC', 'Introducción al Derecho', 'Oona Hernández', 'MARTES', '10:00:00', '12:00:00', 'SALON 106B'),
        ('VI MEDICINA GB', 'Genética Clínica', 'Zuleima Yañez', 'MARTES', '12:00:00', '16:00:00', 'SALON 106B'),
        ('VI MEDICINA GB', 'Farmacología y Toxicología', 'J. Navarro', 'MARTES', '16:00:00', '18:00:00', 'SALON 106B'),
        
        # MIÉRCOLES
        ('I MEDICINA GA', 'Biología', '', 'MIÉRCOLES', '08:00:00', '11:00:00', 'SALON 106B'),
        ('III MEDICINA GA', 'Electiva Complementaria I', 'Ana Medina', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 106B'),
        ('IV FISIOTERAPIA GA', 'Electiva Complementaria I', 'Ana Medina', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 106B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria I', 'Ana Medina', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 106B'),
        ('III MICROBIOLOGÍA GA', 'Electiva Complementaria I', 'Ana Medina', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 106B'),
        ('III BACTERIOLOGÍA GA', 'Electiva Complementaria I', 'Ana Medina', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 106B'),
        ('IV BACTERIOLOGÍA GA', 'Electiva Complementaria I', 'Ana Medina', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 106B'),
        ('VIII FISIOTERAPIA GA', 'Electiva de Profundización II', 'Luisa Galeano', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 106B'),
        
        # JUEVES
        ('III DERECHO GC', 'Electiva Complementaria III', 'Claudia Vizcaíno', 'JUEVES', '06:00:00', '08:00:00', 'SALON 106B'),
        ('III DERECHO GC', 'Teoría del Delito', 'Carlos Jiménez', 'JUEVES', '09:00:00', '12:00:00', 'SALON 106B'),
        ('II MEDICINA GA', 'Bioquímica', 'Alejandra Zambrano', 'JUEVES', '12:00:00', '14:00:00', 'SALON 106B'),
        ('IV BACTERIOLOGÍA GA', 'Metodología de la Investigación', 'Claudia Tapia', 'JUEVES', '14:00:00', '16:00:00', 'SALON 106B'),
        ('IV MICROBIOLOGÍA GA', 'Metodología de la Investigación', 'Claudia Tapia', 'JUEVES', '14:00:00', '16:00:00', 'SALON 106B'),
        
        # VIERNES
        ('V DERECHO GB', 'Electiva V', 'Rafael Rodríguez', 'VIERNES', '06:00:00', '08:00:00', 'SALON 106B'),
        ('V DERECHO GB', 'Derecho Internacional Privado', 'Juan Carlos De Los Ríos', 'VIERNES', '09:00:00', '12:00:00', 'SALON 106B'),
        ('IV MEDICINA GA', 'Epidemiología Básica', 'Eduardo Navarro', 'VIERNES', '14:00:00', '16:00:00', 'SALON 106B'),
        ('IV MEDICINA GB', 'Epidemiología Básica', 'Eduardo Navarro', 'VIERNES', '16:00:00', '18:00:00', 'SALON 106B'),
        
        # SALÓN 107B (Capacidad: 50)
        # ══════════════════════════════════════════════════════
        
        # LUNES
        ('VII BACTERIOLOGÍA GA', 'Micología Clínica', 'Gloria Muñoz', 'LUNES', '07:00:00', '09:00:00', 'SALON 107B'),
        ('III MEDICINA GB', 'Psicología del Desarrollo', 'Virginia Siacon', 'LUNES', '09:00:00', '13:00:00', 'SALON 107B'),
        ('VII BACTERIOLOGÍA GA', 'Farmacología y Toxicología', 'Liliana Carranza', 'LUNES', '14:00:00', '16:00:00', 'SALON 107B'),
        ('VII MICROBIOLOGÍA GA', 'Procesos Industriales', 'Javier Duran', 'LUNES', '16:00:00', '18:00:00', 'SALON 107B'),
        
        # MARTES
        ('I BACTERIOLOGÍA GA', 'Lógica Matemática', 'Sergio Nieves Vanegas', 'MARTES', '07:00:00', '09:00:00', 'SALON 107B'),
        ('III MEDICINA GA', 'Morfología II', 'Leonel Alfonso', 'MARTES', '09:00:00', '11:00:00', 'SALON 107B'),
        ('VI BACTERIOLOGÍA GA', 'Inmunohematología y Banco de Sangre', 'Leidy Goenaga', 'MARTES', '14:00:00', '16:00:00', 'SALON 107B'),
        ('VII BACTERIOLOGÍA GA', 'Proyecto de Investigación', 'Liliana Carranza', 'MARTES', '17:00:00', '19:00:00', 'SALON 107B'),
        
        # MIÉRCOLES
        ('VII DERECHO GB', 'Filosofía del Derecho', 'Cristóbal Arteta', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 107B'),
        ('VII DERECHO GB', 'Criminología y Política Criminal', 'Gonzalo Aguilar', 'MIÉRCOLES', '10:00:00', '13:00:00', 'SALON 107B'),
        ('VI FISIOTERAPIA GA', 'Electiva Complementaria III', 'Nora Álvarez', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 107B'),
        
        # JUEVES
        ('VII MICROBIOLOGÍA GA', 'Microbiología Ambiental', 'Mario Peña', 'JUEVES', '07:00:00', '09:00:00', 'SALON 107B'),
        ('VI BACTERIOLOGÍA GA', 'Electiva Profesional II', 'Liliana Carranza', 'JUEVES', '09:00:00', '11:00:00', 'SALON 107B'),
        ('VI BACTERIOLOGÍA GA', 'Administración en Salud II', 'Leidy Goenaga', 'JUEVES', '11:00:00', '14:00:00', 'SALON 107B'),
        ('VI MICROBIOLOGÍA GA', 'Administración en Salud II', 'Marianella Suarez', 'JUEVES', '14:00:00', '15:00:00', 'SALON 107B'),
        ('VIII FISIOTERAPIA GA', 'Electiva de Profundización I', 'Karol Cervantes', 'JUEVES', '16:00:00', '18:00:00', 'SALON 107B'),
        
        # VIERNES
        ('I INSTRUMENTACIÓN GA', 'Química', 'Pierine España', 'VIERNES', '07:00:00', '09:00:00', 'SALON 107B'),
        ('I INSTRUMENTACIÓN GA', 'Introducción a la Instrumentación', 'María Amador', 'VIERNES', '11:00:00', '13:00:00', 'SALON 107B'),
        ('ALIANZA CANADIENSE GA', 'Modalidad Semestral', '', 'VIERNES', '14:00:00', '18:00:00', 'SALON 107B'),
        
        # SALA COMPUTO 201B (Capacidad: 40)
        # ══════════════════════════════════════════════════════
        
        # LUNES
        ('VII FISIOTERAPIA GA', 'Electiva de Profundización II', 'Leslie Montealegre', 'LUNES', '09:00:00', '11:00:00', 'SALA COMPUTO 201B'),
        
        # SALA COMPUTO 202B (Capacidad: 40)
        # ══════════════════════════════════════════════════════
        
        # LUNES
        ('III FISIOTERAPIA GA', 'Bioestadística', 'Adalgiza Alcocer', 'LUNES', '09:00:00', '12:00:00', 'SALA COMPUTO 202B'),
        ('III BACTERIOLOGÍA GA', 'Morfofisiología II', 'Aroldo Padilla', 'LUNES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        
        # MARTES
        ('II INSTRUMENTACIÓN GA', 'Ética General y Deontología IQ', 'Stephanye Carrillo', 'MARTES', '08:00:00', '11:00:00', 'SALA COMPUTO 202B'),
        ('VIII MICROBIOLOGÍA GA', 'Electiva Profesional I', 'Javier Duran', 'MARTES', '13:00:00', '15:00:00', 'SALA COMPUTO 202B'),
        ('IV MEDICINA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('VIII FISIOTERAPIA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('IV BACTERIOLOGÍA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('III MEDICINA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '17:00:00', '19:00:00', 'SALA COMPUTO 202B'),
        ('VIII MICROBIOLOGÍA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '17:00:00', '19:00:00', 'SALA COMPUTO 202B'),
        ('III BACTERIOLOGÍA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '17:00:00', '19:00:00', 'SALA COMPUTO 202B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '17:00:00', '19:00:00', 'SALA COMPUTO 202B'),
        ('VIII FISIOTERAPIA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'MARTES', '17:00:00', '19:00:00', 'SALA COMPUTO 202B'),
        
        # MIÉRCOLES
        ('II INSTRUMENTACIÓN GA', 'Bioestadística', 'Karol Cervantes', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALA COMPUTO 202B'),
        ('II MEDICINA GB', 'Bioquímica', 'L Banderas', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALA COMPUTO 202B'),
        ('V BACTERIOLOGÍA GA', 'Biología Molecular', 'Arleth Lopez', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALA COMPUTO 202B'),
        ('V MICROBIOLOGÍA GA', 'Biología Molecular', 'Arleth Lopez', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALA COMPUTO 202B'),
        ('III MICROBIOLOGÍA GA', 'Biología Molecular', 'Arleth Lopez', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALA COMPUTO 202B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', 'Luisa Galeano', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALA COMPUTO 202B'),
        
        # JUEVES
        ('II INSTRUMENTACIÓN GA', 'Bioestadística', 'Karol Cervantes', 'JUEVES', '07:00:00', '09:00:00', 'SALA COMPUTO 202B'),
        ('I MEDICINA GA', 'Bioestadística y Demografía', 'Sergio Nieves Vanegas', 'JUEVES', '09:00:00', '11:00:00', 'SALA COMPUTO 202B'),
        ('V MICROBIOLOGÍA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'JUEVES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('V BACTERIOLOGÍA GA', 'Electiva Complementaria III', 'Luis Carlos Rodriguez', 'JUEVES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        
        # VIERNES
        ('VII BACTERIOLOGÍA GA', 'Bioinformática', 'Juan David Sanchez', 'VIERNES', '07:00:00', '09:00:00', 'SALA COMPUTO 202B'),
        ('VII MICROBIOLOGÍA GA', 'Bioinformática', 'Juan David Sanchez', 'VIERNES', '07:00:00', '09:00:00', 'SALA COMPUTO 202B'),
        ('I MEDICINA GB', 'Bioestadística y Demografía', '', 'VIERNES', '10:00:00', '12:00:00', 'SALA COMPUTO 202B'),
        ('II MEDICINA GA', 'Electiva Complementaria I', 'Luis Carlos Rodriguez', 'VIERNES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('III BACTERIOLOGÍA GA', 'Electiva Complementaria I', 'Luis Carlos Rodriguez', 'VIERNES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria I', 'Luis Carlos Rodriguez', 'VIERNES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        ('VIII FISIOTERAPIA GA', 'Electiva Complementaria I', 'Luis Carlos Rodriguez', 'VIERNES', '15:00:00', '17:00:00', 'SALA COMPUTO 202B'),
        
        # SALA COMPUTO LABORATORIOS (Capacidad: 30)
        # ══════════════════════════════════════════════════════
        
        # LUNES
        ('VII INSTRUMENTACIÓN GA', 'Práctica Hospitalaria I', 'Boris Silva', 'LUNES', '16:00:00', '17:00:00', 'SALA COMPUTO LABORATORIOS'),
        
        # MARTES
        ('VII MICROBIOLOGÍA GA', 'Proyecto de Investigación', 'Arleth Lopez', 'MARTES', '09:00:00', '11:00:00', 'SALA COMPUTO LABORATORIOS'),
        
        # SALÓN 203B (Capacidad: 50)
        # ══════════════════════════════════════════════════════
        
        # LUNES
        ('I BACTERIOLOGÍA GA', 'Expresión Oral y Escrita', 'Marina Hernandez', 'LUNES', '08:00:00', '10:00:00', 'SALON 203B'),
        ('I MICROBIOLOGÍA GA', 'Expresión Oral y Escrita', 'Marina Hernandez', 'LUNES', '08:00:00', '10:00:00', 'SALON 203B'),
        ('VI MICROBIOLOGÍA GA', 'Toxicología', 'Claudia Tapia', 'LUNES', '12:00:00', '14:00:00', 'SALON 203B'),
        ('III INSTRUMENTACIÓN GA', 'Investigación Clínica Epidemiológica', 'Bryan Domínguez', 'LUNES', '14:00:00', '16:00:00', 'SALON 203B'),
        
        # MARTES
        ('VI INSTRUMENTACIÓN GA', 'Proyecto de Investigación', 'Emilee Vásquez', 'MARTES', '07:00:00', '10:00:00', 'SALON 203B'),
        ('II DERECHO GA', 'Economía Colombiana', 'Guillermo De La Hoz', 'MARTES', '10:00:00', '13:00:00', 'SALON 203B'),
        ('V MICROBIOLOGÍA GA', 'Toxicología', 'Claudia Tapia', 'MARTES', '13:00:00', '15:00:00', 'SALON 203B'),
        ('I MICROBIOLOGÍA GA', 'Biofísica', 'Matias Puello', 'MARTES', '15:00:00', '17:00:00', 'SALON 203B'),
        ('I BACTERIOLOGÍA GA', 'Biofísica', 'Matias Puello', 'MARTES', '15:00:00', '17:00:00', 'SALON 203B'),
        
        # MIÉRCOLES
        ('VIII INSTRUMENTACIÓN GA', 'Toxicología', 'Bryan Domínguez', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 203B'),
        ('III FISIOTERAPIA GA', 'Intervención en Fisioterapia I', 'Lucy Bula', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 203B'),
        ('III FISIOTERAPIA GB', 'Evaluación y Diagnóstico', 'Julia Andrade', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 203B'),
        ('VIII FISIOTERAPIA GA', 'Proyecto de Investigación III', 'Lina Chavez', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 203B'),
        
        # JUEVES
        ('VI MICROBIOLOGÍA GA', 'Biotecnología', 'Mario Peña', 'JUEVES', '07:00:00', '09:00:00', 'SALON 203B'),
        ('IV BACTERIOLOGÍA GA', 'Hematología', 'Christian Cadenas', 'JUEVES', '09:00:00', '11:00:00', 'SALON 203B'),
        ('II MICROBIOLOGÍA GA', 'Ética y Bioética', 'José Luis Villarreal', 'JUEVES', '13:00:00', '15:00:00', 'SALON 203B'),
        
        # VIERNES
        ('I DERECHO GF', 'Derecho Romano', 'Luis Carlos Rueda', 'VIERNES', '07:00:00', '10:00:00', 'SALON 203B'),
        ('IV BACTERIOLOGÍA GA', 'Microbiología General', 'José Luis Villarreal', 'VIERNES', '10:00:00', '12:00:00', 'SALON 203B'),
        ('III MEDICINA GA', 'Electiva Complementaria II', 'Gustavo De La Hoz', 'VIERNES', '13:00:00', '15:00:00', 'SALON 203B'),
        ('VII MICROBIOLOGÍA GA', 'Procesos Industriales', 'Javier Duran', 'VIERNES', '15:00:00', '16:00:00', 'SALON 203B'),
        
        # ============================================================
        # SALON 204B
        # ============================================================
        
        # LUNES
        ('IV INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Cirugía General y Pediatría', 'Arleth Cataño', 'LUNES', '07:00:00', '09:00:00', 'SALON 204B'),
        ('IV INSTRUMENTACIÓN GB', 'Procesos Quirúrgicos en Cirugía General y Pediatría', 'Arleth Cataño', 'LUNES', '09:00:00', '11:00:00', 'SALON 204B'),
        ('IV FISIOTERAPIA GA', 'Modalidades Físicas', 'Lina Chavez', 'LUNES', '11:00:00', '13:00:00', 'SALON 204B'),
        ('V MICROBIOLOGÍA GA', 'Toxicología', 'Claudia Tapia', 'LUNES', '14:00:00', '16:00:00', 'SALON 204B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', 'Tammy Pulido', 'LUNES', '16:00:00', '18:00:00', 'SALON 204B'),
        
        # MARTES
        ('VI BACTERIOLOGÍA GA', 'Bacteriología Clínica', 'Gisell diFilippo', 'MARTES', '07:00:00', '09:00:00', 'SALON 304B'),
        ('III BACTERIOLOGÍA GA', 'Salud y Ambiente', 'Liliana Carranza', 'MARTES', '09:00:00', '11:00:00', 'SALON 204B'),
        ('VII BACTERIOLOGÍA GA', 'Electiva de Profundización II', 'Liliana Carranza', 'MARTES', '09:00:00', '11:00:00', 'SALON 204B'),
        ('V FISIOTERAPIA GA', 'Administración en Salud', 'Lucy Bula', 'MARTES', '14:00:00', '16:00:00', 'SALON 204B'),
        ('V INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Neurocirugía', 'Leidy Gómez', 'MARTES', '16:00:00', '18:00:00', 'SALON 204B'),
        
        # MIÉRCOLES
        ('III FISIOTERAPIA GA', 'Cinesiopatología', 'Yadira Barrios', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 204B'),
        ('VII INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Otorrinolaringología', 'Tatiana Gómez', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 204B'),
        ('VII INSTRUMENTACIÓN GA', 'Proyecto de Investigación', 'Jaime Lorduy', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 204B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria III', '', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 204B'),
        ('II INSTRUMENTACIÓN GA', 'Fundamentos de Psicología', 'Mily Ardila', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 204B'),
        
        # JUEVES
        ('II MEDICINA GA', 'Bioquímica', 'L Banderas', 'JUEVES', '07:00:00', '09:00:00', 'SALON 204B'),
        ('VI MICROBIOLOGÍA GA', 'Biotecnología', 'Mario Peña', 'JUEVES', '09:00:00', '10:00:00', 'SALON 204B'),
        ('V BACTERIOLOGÍA GA', 'Biología Molecular', 'Arleth Lopez', 'JUEVES', '10:00:00', '11:00:00', 'SALON 204B'),
        ('V BACTERIOLOGÍA GA', 'Hematología Clínica', 'Lady Goenaga', 'JUEVES', '12:00:00', '13:00:00', 'SALON 204B'),
        ('I INSTRUMENTACIÓN GA', 'Bioética', 'Matias Puello', 'JUEVES', '15:00:00', '16:00:00', 'SALON 204B'),
        
        # VIERNES
        ('IV BACTERIOLOGÍA GA', 'Salud Pública II', 'Elvira Crespo', 'VIERNES', '08:00:00', '10:00:00', 'SALON 204B'),
        ('II MEDICINA GB', 'Bioquímica', 'L Banderas', 'VIERNES', '11:00:00', '13:00:00', 'SALON 204B'),
        ('ALIANZA CANADIENSE GA', 'Optativa I', '', 'VIERNES', '14:00:00', '18:00:00', 'SALON 204B'),
        
        # ============================================================
        # SALON 205B
        # ============================================================
        
        # LUNES
        ('I FISIOTERAPIA GA', 'Biología', 'Alberto Moreno', 'LUNES', '07:00:00', '09:00:00', 'SALON 205B'),
        ('I FISIOTERAPIA GA', 'Introducción a la Fisioterapia', 'Yadira Barrios', 'LUNES', '09:00:00', '11:00:00', 'SALON 205B'),
        ('I FISIOTERAPIA GA', 'Morfofisiología I', 'Nobis De La Cruz', 'LUNES', '11:00:00', '13:00:00', 'SALON 205B'),
        ('II MICROBIOLOGÍA GA', 'Fisiopatología Humana', 'Gladys Gutiérrez', 'LUNES', '14:00:00', '16:00:00', 'SALON 205B'),
        ('II BACTERIOLOGÍA GA', 'Fisiopatología Humana', 'Gladys Gutiérrez', 'LUNES', '14:00:00', '16:00:00', 'SALON 205B'),
        
        # MARTES
        ('IV FISIOTERAPIA GA', 'Intervención en Fisioterapia II', 'Yoli Yepes', 'MARTES', '07:00:00', '09:00:00', 'SALON 205B'),
        ('III FISIOTERAPIA GA', 'Intervención en Fisioterapia I', 'Lucy Bula', 'MARTES', '09:00:00', '11:00:00', 'SALON 205B'),
        ('III FISIOTERAPIA GA', 'Neurociencia del Movimiento', 'Eulalia Amador', 'MARTES', '11:00:00', '13:00:00', 'SALON 205B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', 'Sindy Ariza', 'MARTES', '14:00:00', '16:00:00', 'SALON 205B'),
        ('IV INSTRUMENTACIÓN GA', 'Constitución Nacional', 'Elvis Ruiz', 'MARTES', '16:00:00', '18:00:00', 'SALON 205B'),
        
        # MIÉRCOLES
        ('IV FISIOTERAPIA GA', 'Intervención en Fisioterapia II', 'Yoli Yepes', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 205B'),
        ('IV FISIOTERAPIA GA', 'Epidemiología', 'Laura Ardila', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 205B'),
        ('IV FISIOTERAPIA GA', 'Farmacología en Fisioterapia', 'Luisa Galeano', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 205B'),
        ('I MICROBIOLOGÍA GA', 'Biología', 'Yosed Anaya', 'MIÉRCOLES', '13:00:00', '16:00:00', 'SALON 205B'),
        ('I BACTERIOLOGÍA GA', 'Biología', 'Yosed Anaya', 'MIÉRCOLES', '13:00:00', '16:00:00', 'SALON 205B'),
        ('VIII FISIOTERAPIA GA', 'Electiva de Profundización I', 'Karol Cervantes', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 205B'),
        
        # JUEVES
        ('III DERECHO GA', 'Investigación I', 'Alejandro Blanco', 'JUEVES', '06:00:00', '08:00:00', 'SALON 205B'),
        ('I DERECHO GD', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'Yadira García', 'JUEVES', '08:00:00', '10:00:00', 'SALON 205B'),
        ('I DERECHO GD', 'Teoría del Estado', 'Linda Nader', 'JUEVES', '10:00:00', '12:00:00', 'SALON 205B'),
        ('VI MICROBIOLOGÍA GA', 'Microbiología', 'Wendy Rosales', 'JUEVES', '12:00:00', '14:00:00', 'SALON 205B'),
        ('VIII MICROBIOLOGÍA GA', 'Microbiología Predictiva', 'Juan David Sanchez', 'JUEVES', '15:00:00', '17:00:00', 'SALON 205B'),
        
        # VIERNES
        ('I MEDICINA GA', 'Química', 'Alejandra Zambrano', 'VIERNES', '07:00:00', '08:00:00', 'SALON 205B'),
        ('V BACTERIOLOGÍA GA', 'Parasitología Clínica', 'Christian Cadenas', 'VIERNES', '08:00:00', '10:00:00', 'SALON 205B'),
        ('VI BACTERIOLOGÍA GA', 'Virología Clínica', 'María Rosa Baldovino', 'VIERNES', '10:00:00', '13:00:00', 'SALON 205B'),
        ('ALIANZA CANADIENSE GA', 'Optativa I', '', 'VIERNES', '14:00:00', '18:00:00', 'SALON 205B'),
        
        # ============================================================
        # SALON 206B
        # ============================================================
        
        # LUNES
        ('VII FISIOTERAPIA GA', 'Electiva de Profundización II', 'Mónica Gómez', 'LUNES', '07:00:00', '09:00:00', 'SALON 206B'),
        ('II FISIOTERAPIA GA', 'Fisiología del Ejercicio', 'Raúl Polo', 'LUNES', '09:00:00', '11:00:00', 'SALON 206B'),
        ('IV INSTRUMENTACIÓN GA', 'Metodología de la Investigación', 'Cecilia Arcieniegas', 'LUNES', '11:00:00', '13:00:00', 'SALON 206B'),
        
        # MARTES
        ('V INSTRUMENTACIÓN GA', 'Innovación y Tecnología', 'Lorena Herrera', 'MARTES', '07:00:00', '09:00:00', 'SALON 206B'),        
        ('VIII MICROBIOLOGÍA GA', 'Microbiología de Suelos', 'Beatriz Barraza', 'MARTES', '09:00:00', '11:00:00', 'SALON 206B'),        
        ('IV FISIOTERAPIA GA', 'Intervención en Fisioterapia II', 'Yadira Barrios', 'MARTES', '11:00:00', '14:00:00', 'SALON 206B'),
        ('IV FISIOTERAPIA GA', 'Epidemiología', 'Laura Ardila', 'MARTES', '14:00:00', '16:00:00', 'SALON 206B'),
        ('IV FISIOTERAPIA GA', 'Modalidades Físicas', 'Lina Chavez', 'MARTES', '16:00:00', '18:00:00', 'SALON 206B'),
        
        # MIÉRCOLES
        ('VII FISIOTERAPIA GA', 'Electiva de Profundización II', 'Mónica Gómez', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 206B'),
        ('VII FISIOTERAPIA GA', 'Prácticas Formativas', 'Luisa Galeano', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 206B'),
        ('III INSTRUMENTACIÓN GA', 'Control de Infecciones y Promoción de la Salud', 'Arleth Cataño', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 206B'),
        ('IV MEDICINA GA', 'Electiva Complementaria I', 'José Jinete', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 206B'),
        ('VIII INSTRUMENTACIÓN GA', 'Práctica Hospitalaria IV', '', 'MIÉRCOLES', '15:00:00', '18:00:00', 'SALON 206B'),
        
        # JUEVES
        ('II INSTRUMENTACIÓN GA', 'Microbiología', 'Jaime Lorduy', 'JUEVES', '09:00:00', '11:00:00', 'SALON 206B'),
        ('V DERECHO GD', 'Hermenéutica Jurídica', 'Patricia Morris', 'JUEVES', '14:00:00', '16:00:00', 'SALON 206B'),
        ('IV BACTERIOLOGÍA GA', 'Química Clínica', 'Lady Goenaga', 'JUEVES', '16:00:00', '18:00:00', 'SALON 206B'),
        
        # VIERNES
        ('I FISIOTERAPIA GA', 'Salud y Comunidad', 'Lina Chavez', 'VIERNES', '07:00:00', '09:00:00', 'SALON 206B'),
        ('ALIANZA CANADIENSE GA', 'Optativa I', '', 'VIERNES', '14:00:00', '18:00:00', 'SALON 206B'),
        
        # ============================================================
        # SALON 301B
        # ============================================================
        
        # LUNES
        ('IV MICROBIOLOGÍA GA', 'Ecología Microbiana', 'Beatriz Barraza', 'LUNES', '08:00:00', '11:00:00', 'SALON 301B'),
        ('IV MICROBIOLOGÍA GA', 'Fisiopatología Vegetal', 'Arleth Lopez', 'LUNES', '15:00:00', '17:00:00', 'SALON 301B'),
        
        # MARTES
        ('I INSTRUMENTACIÓN GA', 'Sociedad, Sector Salud y Comunidad', 'Bryan Domínguez', 'MARTES', '08:00:00', '10:00:00', 'SALON 301B'),
        ('IV INSTRUMENTACIÓN GA', 'Procesos Asépticos II', 'Lorena Herrera', 'MARTES', '11:00:00', '13:00:00', 'SALON 301B'),
        ('VI MICROBIOLOGÍA GA', 'Toxicología', 'Claudia Tapia', 'MARTES', '15:00:00', '17:00:00', 'SALON 301B'),
        
        # MIÉRCOLES
        ('III INSTRUMENTACIÓN GA', 'Cuidados Básicos en Salud', 'María Amador', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 301B'),
        ('V BACTERIOLOGÍA GA', 'Electiva de Profundización I', 'Ronald Maestre', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 301B'),
        ('II FISIOTERAPIA GB', 'Fisiología del Ejercicio', 'Sindy Ariza', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 301B'),
        ('II FISIOTERAPIA GB', 'Biomecánica', 'Gladys Gutiérrez', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 301B'),
        ('IV FISIOTERAPIA GA', 'Control y Aprendizaje Motor', 'Yoli Yepes', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 301B'),
        
        # JUEVES
        ('I INSTRUMENTACIÓN GA', 'Biología', 'Evelyn Mendoza', 'JUEVES', '07:00:00', '09:00:00', 'SALON 301B'),
        ('I INSTRUMENTACIÓN GA', 'Sociedad, Sector Salud y Comunidad', 'María Amador', 'JUEVES', '09:00:00', '11:00:00', 'SALON 301B'),
        ('V FISIOTERAPIA GA', 'Epistemología de las Ciencias', 'Karol Cervantes', 'JUEVES', '11:00:00', '13:00:00', 'SALON 301B'),
        ('V BACTERIOLOGÍA GA', 'Inmunología Clínica', 'Franklin Torres', 'JUEVES', '14:00:00', '16:00:00', 'SALON 301B'),
        
        # VIERNES
        ('III FISIOTERAPIA GA', 'Cinesiopatología', 'Yadira Barrios', 'VIERNES', '07:00:00', '09:00:00', 'SALON 301B'),
        ('III FISIOTERAPIA GB', 'Evaluación y Diagnóstico', 'Julia Andrade', 'VIERNES', '11:00:00', '14:00:00', 'SALON 301B'),
        
        # ============================================================
        # SALON 302B
        # ============================================================
        
        # LUNES
        ('V FISIOTERAPIA GA', 'Intervención en Fisioterapia III', 'Jennifer Barrios', 'LUNES', '07:00:00', '09:00:00', 'SALON 302B'),
        ('VI FISIOTERAPIA GA', 'Salud Pública', 'Lina Chavez', 'LUNES', '09:00:00', '11:00:00', 'SALON 302B'),
        ('V FISIOTERAPIA GB', 'Intervención en Fisioterapia III', 'Jennifer Barrios', 'LUNES', '11:00:00', '13:00:00', 'SALON 302B'),
        ('IV FISIOTERAPIA GA', 'Farmacología en Fisioterapia', 'Luisa Galeano', 'LUNES', '14:00:00', '16:00:00', 'SALON 302B'),
        
        # MARTES
        ('I DERECHO GD', 'Teoría del Estado', 'Linda Nader', 'MARTES', '08:00:00', '10:00:00', 'SALON 302B'),
        ('I DERECHO GD', 'Historia de la Filosofía', 'Cristobal Arteta', 'MARTES', '10:00:00', '13:00:00', 'SALON 302B'),
        ('VI INSTRUMENTACIÓN GA', 'Control de Infecciones y Promoción de la Salud', 'Bryan Domínguez', 'MARTES', '14:00:00', '17:00:00', 'SALON 302B'),
        
        # MIÉRCOLES
        ('II MICROBIOLOGÍA GA', 'Cálculo', 'Javier Duran', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 302B'),
        ('IV MEDICINA GA', 'Electiva Complementaria I', 'Cecilia Arcieniegas', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 302B'),
        ('I FISIOTERAPIA GA', 'Lógica Matemática', 'José Jinete', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 302B'),
        
        # JUEVES
        ('V FISIOTERAPIA GA', 'Ocupación y Movimiento Corporal', 'Martha Mendihueta', 'JUEVES', '07:00:00', '09:00:00', 'SALON 302B'),
        ('V FISIOTERAPIA GA', 'Intervención en Fisioterapia III', 'Jennifer Barrios', 'JUEVES', '09:00:00', '11:00:00', 'SALON 302B'),
        ('I FISIOTERAPIA GA', 'Introducción a la Fisioterapia', 'Yadira Barrios', 'JUEVES', '11:00:00', '13:00:00', 'SALON 302B'),
        ('I FISIOTERAPIA GA', 'Biofísica', 'Matias Puello', 'JUEVES', '13:00:00', '15:00:00', 'SALON 302B'),
        ('V DERECHO GD', 'Hermenéutica Jurídica', 'Patricia Morris', 'JUEVES', '15:00:00', '18:00:00', 'SALON 302B'),
        
        # VIERNES
        ('IV INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Urología', 'Tatiana Gómez', 'VIERNES', '09:00:00', '11:00:00', 'SALON 302B'),
        ('IV INSTRUMENTACIÓN GA', 'Seguridad y Salud en el Trabajo', 'Jainer Molina', 'VIERNES', '11:00:00', '13:00:00', 'SALON 302B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria I', '', 'VIERNES', '13:00:00', '15:00:00', 'SALON 302B'),
        
        # ============================================================
        # SALON 303B
        # ============================================================
        
        # LUNES
        ('II FISIOTERAPIA GA', 'Patología', 'Richard Zambrano', 'LUNES', '07:00:00', '09:00:00', 'SALON 303B'),
        ('VII FISIOTERAPIA GA', 'Electiva de Profundización II', 'Eulalia Amador', 'LUNES', '09:00:00', '11:00:00', 'SALON 303B'),
        ('II FISIOTERAPIA GB', 'Fisiología del Ejercicio', 'Sindy Ariza', 'LUNES', '11:00:00', '13:00:00', 'SALON 303B'),
        ('II FISIOTERAPIA GA', 'Morfofisiología II', 'Gladys Helena Gutiérrez', 'LUNES', '13:00:00', '15:00:00', 'SALON 303B'),
        
        # MARTES
        ('V FISIOTERAPIA GA', 'Ocupación y Movimiento Corporal', 'Martha Mendihueta', 'MARTES', '07:00:00', '09:00:00', 'SALON 303B'),
        ('V FISIOTERAPIA GA', 'Intervención en Fisioterapia III', 'Jennifer Barrios', 'MARTES', '09:00:00', '11:00:00', 'SALON 303B'),
        ('V FISIOTERAPIA GA', 'Salud Pública', 'Karol Cervantes', 'MARTES', '11:00:00', '13:00:00', 'SALON 303B'),
        ('III FISIOTERAPIA GA', 'Prescripción del Ejercicio', 'Roberto Rebolledo', 'MARTES', '14:00:00', '16:00:00', 'SALON 303B'),
        ('III FISIOTERAPIA GA', 'Cinesiopatología', 'Yadira Barrios', 'MARTES', '16:00:00', '18:00:00', 'SALON 303B'),
        
        # MIÉRCOLES
        ('II FISIOTERAPIA GA', 'Biomecánica', 'Nobis De La Cruz', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 303B'),
        ('II FISIOTERAPIA GA', 'Bioquímica', 'Mario Mutis', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 303B'),
        ('V FISIOTERAPIA GA', 'Administración en Salud', 'Lucy Bula', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 303B'),
        ('V FISIOTERAPIA GA', 'Ética y Bioética', 'Gustavo De La Hoz', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 303B'),
        ('I MEDICINA GB', 'Biología', 'Yosed Anaya', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 303B'),
        
        # JUEVES
        ('II FISIOTERAPIA GB', 'Biomecánica', 'Gladys Helena Gutiérrez', 'JUEVES', '09:00:00', '11:00:00', 'SALON 303B'),
        ('IV FISIOTERAPIA GA', 'Constitución Política', 'Elvis Ruiz', 'JUEVES', '11:00:00', '13:00:00', 'SALON 303B'),
        ('I MICROBIOLOGÍA GA', 'Historia de la Ciencia', 'Juan David Sanchez', 'JUEVES', '13:00:00', '15:00:00', 'SALON 303B'),
        ('VI BACTERIOLOGÍA GA', 'Optativa II', 'Miriam Linero', 'JUEVES', '16:00:00', '18:00:00', 'SALON 303B'),
        
        # VIERNES
        ('III MICROBIOLOGÍA GA', 'Biología Molecular', 'Arleth Lopez', 'VIERNES', '07:00:00', '09:00:00', 'SALON 303B'),
        ('III MEDICINA GB', 'Biología Molecular', 'Christian Cadena', 'VIERNES', '10:00:00', '11:00:00', 'SALON 303B'),
        
        # ============================================================
        # SALON 304B
        # ============================================================
        
        # LUNES
        ('I INSTRUMENTACIÓN GA', 'Competencias Comunicativas I', 'Cecilia Arcieniegas', 'LUNES', '08:00:00', '10:00:00', 'SALON 304B'),
        ('III FISIOTERAPIA GB', 'Intervención en Fisioterapia I', 'Nobis De La Cruz', 'LUNES', '14:00:00', '16:00:00', 'SALON 304B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', 'Laura Ardila', 'LUNES', '16:00:00', '18:00:00', 'SALON 304B'),
        
        # MARTES
        ('I MEDICINA GA', 'Biología', 'Juan David Rodriguez', 'MARTES', '07:00:00', '09:00:00', 'SALON 304B'),
        ('IV FISIOTERAPIA GA', 'Epidemiología', 'Laura Ardila', 'MARTES', '09:00:00', '11:00:00', 'SALON 304B'),
        ('VI INSTRUMENTACIÓN GA', 'Procesos Quirúrgicos en Cirugía Plástica', 'Leidy Gómez', 'MARTES', '11:00:00', '13:00:00', 'SALON 304B'),
        ('VIII MICROBIOLOGÍA GA', 'Prácticas Profesionales', 'Gloria Muñoz', 'MARTES', '13:00:00', '15:00:00', 'SALON 304B'),
        ('III MEDICINA GB', 'Biología Molecular', 'Christian Cadena', 'MARTES', '15:00:00', '17:00:00', 'SALON 304B'),
        
        # MIÉRCOLES
        ('IV MEDICINA GA', 'Electiva III', 'Yesenia Valarezo', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 304B'),
        ('V BACTERIOLOGÍA GA', 'Biología Molecular', 'Arleth Lopez', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 304B'),
        
        # JUEVES
        ('VII DERECHO GA', 'Títulos Valores', 'Sandra Villa', 'JUEVES', '06:00:00', '08:00:00', 'SALON 304B'),
        ('II FISIOTERAPIA GA', 'Fisiología del Ejercicio', 'Raúl Polo', 'JUEVES', '09:00:00', '11:00:00', 'SALON 304B'),
        ('V FISIOTERAPIA GA', 'Intervención en Fisioterapia III', 'Jennifer Barrios', 'JUEVES', '14:00:00', '16:00:00', 'SALON 304B'),
        
        # VIERNES
        ('VII FISIOTERAPIA GA', 'Proyecto de Investigación II', 'Laura Ardila', 'VIERNES', '07:00:00', '09:00:00', 'SALON 304B'),
        ('VII FISIOTERAPIA GA', 'Electiva de Profundización I', 'Leslie Montealegre', 'VIERNES', '09:00:00', '11:00:00', 'SALON 304B'),
        ('II INSTRUMENTACIÓN GA', 'Morfofisiología II', 'Tatiana Gómez', 'VIERNES', '11:00:00', '13:00:00', 'SALON 304B'),
        
        # ============================================================
        # SALÓN 308B
        # ============================================================
        
        # LUNES
        ('III MEDICINA GA', 'Biología Molecular', 'Christian Cadena', 'LUNES', '07:00:00', '09:00:00', 'SALON 308B'),
        ('I MEDICINA GA', 'Expresión Oral y Escrita', 'Marina Hernandez', 'LUNES', '10:00:00', '12:00:00', 'SALON 308B'),
        ('I MEDICINA GA', 'Socioantropología', 'Virginia Sirtori', 'LUNES', '14:00:00', '16:00:00', 'SALON 308B'),
        ('I MEDICINA GA', 'Biología', 'Yosed Anaya', 'LUNES', '16:00:00', '17:00:00', 'SALON 308B'),

        # MARTES
        ('VII DERECHO GA', 'Títulos Valores', 'Sandra Villa', 'MARTES', '06:00:00', '08:00:00', 'SALON 308B'),
        ('II DERECHO GA', 'Electiva II', 'Sandra Villa', 'MARTES', '08:00:00', '10:00:00', 'SALON 308B'),
        ('II MEDICINA GB', 'Morfología I', 'Gilberto Barrios', 'MARTES', '11:00:00', '13:00:00', 'SALON 308B'),
        ('IV MEDICINA GA', 'Salud Familiar II', '', 'MARTES', '13:00:00', '15:00:00', 'SALON 308B'),
        ('IV MEDICINA GB', 'Electiva III', 'José Jinete', 'MARTES', '15:00:00', '17:00:00', 'SALON 308B'),

        # MIÉRCOLES
        ('III DERECHO GA', 'Electiva III', 'Claudia Vizcaíno', 'MIÉRCOLES', '06:00:00', '08:00:00', 'SALON 308B'),
        ('III DERECHO GB', 'Electiva III', 'Claudia Vizcaíno', 'MIÉRCOLES', '06:00:00', '08:00:00', 'SALON 308B'),
        ('II DERECHO GA', 'Teoría de la Constitución', 'Gretty Pavlovich', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 308B'),
        ('I MEDICINA GB', 'Química', 'Alejandra Zambrano', 'MIÉRCOLES', '12:00:00', '13:00:00', 'SALON 308B'),
        ('IV MEDICINA GA', 'Electiva Complementaria I', 'Luz Marina Silvera', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 308B'),
        ('V MEDICINA GA', 'Virología Clínica', 'J. Villarreal', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 308B'),

        # JUEVES
        ('III MEDICINA GB', 'Salud Familiar I', '', 'JUEVES', '07:00:00', '09:00:00', 'SALON 308B'),
        ('IV MEDICINA GB', 'Fisiología', '', 'JUEVES', '11:00:00', '12:00:00', 'SALON 308B'),
        ('IV MEDICINA GA', 'Fisiología', 'Jesús Iglesias', 'JUEVES', '12:00:00', '13:00:00', 'SALON 308B'),
        ('II MEDICINA GB', 'Bioquímica', 'Ismael Lizarazu', 'JUEVES', '13:00:00', '15:00:00', 'SALON 308B'),
        ('III MEDICINA GB', 'Morfología II', 'Aroldo Padilla', 'JUEVES', '16:00:00', '18:00:00', 'SALON 308B'),

        # VIERNES
        ('III MEDICINA GA', 'Electiva Complementaria I', 'Marina Hernandez', 'VIERNES', '08:00:00', '10:00:00', 'SALON 308B'),
        ('III BACTERIOLOGÍA GA', 'Electiva Complementaria I', 'Marina Hernandez', 'VIERNES', '08:00:00', '10:00:00', 'SALON 308B'),
        ('I MEDICINA GA', 'Química', 'Alejandra Zambrano', 'VIERNES', '10:00:00', '13:00:00', 'SALON 308B'),

        # ============================================================
        # SALÓN 307B
        # ============================================================
        
        # LUNES
        ('V MEDICINA GB', 'Patología', '', 'LUNES', '07:00:00', '09:00:00', 'SALON 307B'),
        ('V MEDICINA GB', 'Patología', '', 'LUNES', '09:00:00', '11:00:00', 'SALON 307B'),
        ('V MEDICINA GB', 'Micología Clínica', 'Gloria Muñoz', 'LUNES', '11:00:00', '12:00:00', 'SALON 307B'),
        ('V MEDICINA GB', 'Patología', 'Bertiller', 'LUNES', '13:00:00', '15:00:00', 'SALON 307B'),
        ('V MEDICINA GB', 'Farmacología y Toxicología', 'Elen Manrrique', 'LUNES', '15:00:00', '17:00:00', 'SALON 307B'),

        # MARTES
        ('III MEDICINA GA', 'Salud Familiar I', '', 'MARTES', '07:00:00', '09:00:00', 'SALON 307B'),
        ('V MEDICINA GA', 'Patología', '', 'MARTES', '09:00:00', '11:00:00', 'SALON 307B'),
        ('V INSTRUMENTACIÓN GA', 'Salud Pública', 'Anderson Díaz', 'MARTES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('III MEDICINA GA', 'Psicología del Desarrollo', 'Mily Ardila', 'MARTES', '13:00:00', '15:00:00', 'SALON 307B'),
        ('III MEDICINA GA', 'Morfología II', 'Aroldo Padilla', 'MARTES', '15:00:00', '17:00:00', 'SALON 307B'),

        # MIÉRCOLES
        ('IV MEDICINA GA', 'Fisiología', '', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 307B'),
        ('VI MEDICINA GA', 'Semiología', 'Elba Valle', 'MIÉRCOLES', '09:00:00', '12:00:00', 'SALON 307B'),
        ('VI MEDICINA GB', 'Semiología', 'Elba Valle', 'MIÉRCOLES', '09:00:00', '12:00:00', 'SALON 307B'),
        ('VI MEDICINA GB', 'Farmacología y Toxicología', 'A. Guerrero', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 307B'),
        ('VI MEDICINA GB', 'Genética Clínica', 'Zuleima Yañez', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 307B'),

        # JUEVES
        ('V DERECHO GC', 'Investigación III', 'Claudia Vizcaíno', 'JUEVES', '08:00:00', '10:00:00', 'SALON 307B'),
        ('I MEDICINA GB', 'Química', 'Alejandra Zambrano', 'JUEVES', '10:00:00', '14:00:00', 'SALON 307B'),
        ('VI MEDICINA GA', 'Bioética', 'Anderson Díaz', 'JUEVES', '14:00:00', '16:00:00', 'SALON 307B'),
        ('VI MEDICINA GB', 'Bioética', 'Anderson Díaz', 'JUEVES', '16:00:00', '18:00:00', 'SALON 307B'),

        # VIERNES
        ('V MEDICINA GA', 'Patología', '', 'VIERNES', '09:00:00', '11:00:00', 'SALON 307B'),
        ('II MEDICINA GA', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('II MEDICINA GB', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('II FISIOTERAPIA GA', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('II FISIOTERAPIA GB', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('II MICROBIOLOGÍA GA', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('II BACTERIOLOGÍA GA', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),
        ('III INSTRUMENTACIÓN GB', 'Electiva Complementaria I', '', 'VIERNES', '11:00:00', '13:00:00', 'SALON 307B'),

        # ============================================================
        # SALÓN 306B
        # ============================================================
        
        # LUNES
        ('III MEDICINA GB', 'Salud Familiar I', '', 'LUNES', '07:00:00', '09:00:00', 'SALON 306B'),
        ('II MEDICINA GB', 'Metodología de la Investigación', 'Elvira Crespo', 'LUNES', '09:00:00', '11:00:00', 'SALON 306B'),
        ('IV MEDICINA GA', 'Fisiología', 'Simón Bolívar', 'LUNES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('IV MEDICINA GA', 'Epidemiología Básica', 'Eduardo Navarro', 'LUNES', '14:00:00', '16:00:00', 'SALON 306B'),
        ('IV MEDICINA GA', 'Inmunología', 'Franklin Torres', 'LUNES', '16:00:00', '18:00:00', 'SALON 306B'),

        # MARTES
        ('IV MEDICINA GB', 'Fisiología', 'Simón Bolívar', 'MARTES', '07:00:00', '09:00:00', 'SALON 306B'),
        ('IV MEDICINA GA', 'Fisiología', '', 'MARTES', '10:00:00', '12:00:00', 'SALON 306B'),
        ('VI MEDICINA GA', 'Farmacología y Toxicología', 'G. Sarmiento', 'MARTES', '13:00:00', '15:00:00', 'SALON 306B'),
        ('VI MEDICINA GA', 'Genética Clínica', 'Zuleima Yañez', 'MARTES', '16:00:00', '20:00:00', 'SALON 306B'),

        # MIÉRCOLES
        ('II MEDICINA GA', 'Metodología de la Investigación', 'Gustavo De La Hoz', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 306B'),
        ('V MEDICINA GA', 'Patología', '', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 306B'),
        ('II MEDICINA GA', 'Electiva Complementaria I', 'Marina Hernandez', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('II MEDICINA GB', 'Electiva Complementaria I', 'Marina Hernandez', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('II FISIOTERAPIA GA', 'Electiva Complementaria I', 'Marina Hernandez', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('II FISIOTERAPIA GB', 'Electiva Complementaria I', 'Marina Hernandez', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('II MICROBIOLOGÍA GA', 'Electiva Complementaria I', 'Marina Hernandez', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('III INSTRUMENTACIÓN GA', 'Electiva Complementaria I', 'Marina Hernandez', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('III INSTRUMENTACIÓN GB', 'Electiva Complementaria I', 'Marina Hernandez', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('IV MEDICINA GA', 'Ética Profesional y Responsabilidad Social', '', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 306B'),
        ('IV MEDICINA GB', 'Ética Profesional y Responsabilidad Social', '', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 306B'),
        ('VI FISIOTERAPIA GA', 'Ética Profesional y Responsabilidad Social', '', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 306B'),
        ('III INSTRUMENTACIÓN GA', 'Ética Profesional y Responsabilidad Social', '', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 306B'),
        ('III INSTRUMENTACIÓN GB', 'Ética Profesional y Responsabilidad Social', '', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 306B'),
        ('IV BACTERIOLOGÍA GA', 'Ética Profesional y Responsabilidad Social', '', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 306B'),
        ('VII INSTRUMENTACIÓN GA', 'Control de Infecciones y Promoción de la Salud', 'Angélica Corcho', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 306B'),

        # JUEVES
        ('II DERECHO GA', 'Teoría de la Constitución', 'Gretty Pavlovich', 'JUEVES', '11:00:00', '13:00:00', 'SALON 306B'),
        ('IV MEDICINA GA', 'Epidemiología Básica', 'Eduardo Navarro', 'JUEVES', '14:00:00', '16:00:00', 'SALON 306B'),
        ('IV MEDICINA GB', 'Epidemiología Básica', 'Eduardo Navarro', 'JUEVES', '14:00:00', '16:00:00', 'SALON 306B'),
        ('IV MEDICINA GA', 'Inmunología', 'Franklin Torres', 'JUEVES', '16:00:00', '18:00:00', 'SALON 306B'),
        ('IV MEDICINA GB', 'Inmunología', 'Franklin Torres', 'JUEVES', '16:00:00', '18:00:00', 'SALON 306B'),

        # VIERNES
        ('IV MEDICINA GA', 'Bioquímica', 'L Banderas', 'VIERNES', '09:00:00', '11:00:00', 'SALON 306B'),
        ('III MEDICINA GA', 'Biología Molecular', 'Christian Cadena', 'VIERNES', '11:00:00', '12:00:00', 'SALON 306B'),

        # ============================================================
        # SALÓN 305B
        # ============================================================
        
        # LUNES
        ('IV FISIOTERAPIA GA', 'Intervención en Fisioterapia II', 'Yoli Yepes', 'LUNES', '07:00:00', '09:00:00', 'SALON 305B'),
        ('IV FISIOTERAPIA GA', 'Discapacidad', 'Yoli Yepes', 'LUNES', '09:00:00', '11:00:00', 'SALON 305B'),
        ('IV FISIOTERAPIA GB', 'Intervención en Fisioterapia II', 'Yadira Barrios', 'LUNES', '11:00:00', '14:00:00', 'SALON 305B'),
        ('VII INSTRUMENTACIÓN GA', 'Práctica Hospitalaria III', 'Angélica Corcho', 'LUNES', '16:00:00', '19:00:00', 'SALON 305B'),

        # MARTES
        ('II FISIOTERAPIA GA', 'Metodología de la Investigación', 'Laura Ardila', 'MARTES', '07:00:00', '09:00:00', 'SALON 305B'),
        ('II FISIOTERAPIA GB', 'Metodología de la Investigación', 'Laura Ardila', 'MARTES', '07:00:00', '09:00:00', 'SALON 305B'),
        ('II FISIOTERAPIA GA', 'Biomecánica', 'Nobis De La Cruz', 'MARTES', '09:00:00', '11:00:00', 'SALON 305B'),
        ('III INSTRUMENTACIÓN GA', 'Socioantropología', '', 'MARTES', '11:00:00', '13:00:00', 'SALON 305B'),
        ('III INSTRUMENTACIÓN GB', 'Socioantropología', '', 'MARTES', '11:00:00', '13:00:00', 'SALON 305B'),
        ('III INSTRUMENTACIÓN GA', 'Farmacología y Anestesia', 'Jorge Bolaño', 'MARTES', '14:00:00', '16:00:00', 'SALON 305B'),
        ('III INSTRUMENTACIÓN GB', 'Farmacología y Anestesia', 'Jorge Bolaño', 'MARTES', '14:00:00', '16:00:00', 'SALON 305B'),
        ('VI FISIOTERAPIA GA', 'Electiva de Profundización I', 'Laura Ardila', 'MARTES', '16:00:00', '18:00:00', 'SALON 305B'),

        # MIÉRCOLES
        ('VI BACTERIOLOGÍA GA', 'Proyección a la Comunidad', 'Bryan Domínguez', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 305B'),
        ('I FISIOTERAPIA GA', 'Morfofisiología I', 'Nobis De La Cruz', 'MIÉRCOLES', '11:00:00', '14:00:00', 'SALON 305B'),
        ('VII INSTRUMENTACIÓN GA', 'Calidad en Servicios de Salud', 'María Inés López', 'MIÉRCOLES', '15:00:00', '18:00:00', 'SALON 305B'),

        # JUEVES
        ('III FISIOTERAPIA GB', 'Intervención en Fisioterapia I', 'Nobis De La Cruz', 'JUEVES', '09:00:00', '12:00:00', 'SALON 305B'),
        ('III FISIOTERAPIA GB', 'Evaluación y Diagnóstico', 'Julia Andrade', 'JUEVES', '11:00:00', '13:00:00', 'SALON 305B'),
        ('III FISIOTERAPIA GA', 'Psicología de la Salud', 'Mily Ardila', 'JUEVES', '14:00:00', '16:00:00', 'SALON 305B'),
        ('III FISIOTERAPIA GB', 'Psicología de la Salud', 'Mily Ardila', 'JUEVES', '14:00:00', '16:00:00', 'SALON 305B'),

        # VIERNES
        ('VIII INSTRUMENTACIÓN GA', 'Trabajo de Grado', 'Leonel Alfonso', 'VIERNES', '07:00:00', '09:00:00', 'SALON 305B'),
        ('VIII INSTRUMENTACIÓN GA', 'Práctica Hospitalaria IV', 'Lorena Herrera', 'VIERNES', '09:00:00', '11:00:00', 'SALON 305B'),
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
