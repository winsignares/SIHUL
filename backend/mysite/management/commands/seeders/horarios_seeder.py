"""
Seeder de horarios para Sede Centro y Sede Principal.
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
        # -- SALON 103B - Capacidad 60 personas (1 horario) --
        ('V DERECHO C', 'Tutela Penal De Los Bienes Jurídicos II', 'JUAN CARLOS GUTIÉRREZ', 'MARTES', '06:00:00', '09:00:00', 'SALON 103B'),
        ('V DERECHO B', 'Tutela Penal De Los Bienes Jurídicos II', 'JUAN CARLOS GUTIÉRREZ', 'MIÉRCOLES', '06:00:00', '09:00:00', 'SALON 103B'),
        ('V DERECHO A', 'Tutela Penal De Los Bienes Jurídicos II', 'JUAN CARLOS GUTIÉRREZ', 'MIÉRCOLES', '18:00:00', '21:00:00', 'SALON 103B'),
        ('VI ADM. NEGOCIOS CD', 'Formulación y Gestión de Proyectos', 'DANILO ENRIQUE TORRES PIMIENTO', 'VIERNES', '19:00:00', '22:00:00', 'SALON 103B'),

        # -- SALON 403NB (1 horario) --
        ('II CONTADURÍA CD', 'Fundamentos de Administración', 'MARIBEL CERRO CAMERA', 'LUNES', '07:00:00', '10:00:00', 'SALON 403NB'),
        ('I ADM. NEGOCIOS CD', 'Fundamentos de Administración', 'MARIBEL CERRO CAMERA', 'LUNES', '07:00:00', '10:00:00', 'SALON 403NB'),
        ('I ADM. NEGOCIOS CD', 'Principios de Derecho y Constitución Política', 'Eduardo De Jesus Pérez Ramirez', 'LUNES', '07:00:00', '10:00:00', 'SALON 403NB'),
        ('II CONTADURÍA CD', 'Principios de Derecho y Constitución Política', 'Eduardo De Jesus Pérez Ramirez', 'LUNES', '07:00:00', '10:00:00', 'SALON 403NB'),
        ('II CONTADURÍA CD', 'Curso Francés', '', 'LUNES', '07:00:00', '10:00:00', 'SALON 403NB'),
        ('I ADM. NEGOCIOS CD', 'Curso Francés', '', 'LUNES', '16:00:00', '18:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GA', 'Electricidad, Magnetismo y Laboratorio', 'MARVIN MOLINA', 'LUNES', '18:00:00', '21:00:00', 'SALON 403NB'),
        ('II CONTADURÍA CD', 'Derecho comercial', 'Eduardo De Jesus Pérez Ramirez', 'MARTES', '09:00:00', '11:00:00', 'SALON 403NB'),
        ('II ADM. NEGOCIOS CD', 'Derecho comercial', 'Eduardo De Jesus Pérez Ramirez', 'MARTES', '09:00:00', '11:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GA', 'Cálculo Multivariado y Vectorial', 'MARTHA ARTETA', 'MARTES', '14:00:00', '16:00:00', 'SALON 403NB'),
        ('I ADM. NEGOCIOS AN', 'Expresión verbal y escrita', 'MONICA PATRICIA DE LA HOZ SILVA', 'MARTES', '18:00:00', '20:00:00', 'SALON 403NB'),
        ('I CONTADURIA AN', 'Expresión verbal y escrita', 'MONICA PATRICIA DE LA HOZ SILVA', 'MARTES', '18:00:00', '20:00:00', 'SALON 403NB'),
        ('I ADM. NEGOCIOS AN', 'Fundamentos de matemáticas', 'Antonio Julio Castilla Romero', 'MARTES', '20:00:00', '22:00:00', 'SALON 403NB'),
        ('I CONTADURIA AN', 'Fundamentos de matemáticas', 'Antonio Julio Castilla Romero', 'MARTES', '20:00:00', '22:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GB', 'Electricidad, Magnetismo y Laboratorio', 'EMELDO CABALLERO', 'MIÉRCOLES', '06:00:00', '08:00:00', 'SALON 403NB'),
        ('I ADM. NEGOCIOS CD', 'Fundamentos de Economía', 'Marco Antonio Ariza Dau', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 403NB'),
        ('I CONTADURIA CD', 'Fundamentos de Economía', 'Marco Antonio Ariza Dau', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 403NB'),
        ('I CONTADURIA CD', 'Expresión verbal y escrita', 'MONICA PATRICIA DE LA HOZ SILVA', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 403NB'),
        ('I ADM. NEGOCIOS CD', 'Expresión verbal y escrita', 'MONICA PATRICIA DE LA HOZ SILVA', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GA', 'Cálculo Multivariado y Vectorial', 'MARTHA ARTETA', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 403NB'), 
        ('I ING. INDUSTRIAL GA', 'Cálculo Diferencial', 'DANNA BETANCOURT ESPINOSA', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GA', 'Gestión Organizacional', 'RICARDO DE LA HOZ', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 403NB'),
        ('VI ADM. NEGOCIOS CD', 'CEA-ABEN', 'RICHARD ANDRES PALACIO MATTA', 'JUEVES', '07:00:00', '09:00:00', 'SALON 403NB'),
        ('VII ADM. NEGOCIOS CD', 'CEA-ABEN', 'RICHARD ANDRES PALACIO MATTA', 'JUEVES', '07:00:00', '09:00:00', 'SALON 403NB'),
        ('VI ADM. NEGOCIOS CD', 'CSA-ELE1', 'RICHARD ANDRES PALACIO MATTA', 'JUEVES', '09:00:00', '11:00:00', 'SALON 403NB'),
        ('VII ADM. NEGOCIOS CD', 'CSA-ELE1', 'RICHARD ANDRES PALACIO MATTA', 'JUEVES', '09:00:00', '11:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GA', 'Electricidad, Magnetismo y Laboratorio', 'MARVIN MOLINA', 'JUEVES', '18:00:00', '20:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GB', 'CEA-ABEN', 'CARLOS CONSUEGRA', 'JUEVES', '20:00:00', '22:00:00', 'SALON 403NB'),
        ('VIII DERECHO B', 'LABORAL ADMINISTRATIVO', 'FRANCISCO BUSTAMANTE', 'VIERNES', '06:00:00', '09:00:00', 'SALON 403NB'),
        ('III ING. INDUSTRIAL GA', 'Fundamentos de Economía', 'ARNALDO ARCE', 'VIERNES', '06:00:00', '09:00:00', 'SALON 403NB'),
        ('I ING. INDUSTRIAL GA', 'Cálculo Diferencial', 'DANNA BETANCOURT ESPINOSA', 'VIERNES', '15:00:00', '17:00:00', 'SALON 403NB'),
        ('VIII ADM. NEGOCIOS BN', 'Régimen cambiario y aduanero', 'Roberto Meisel Lanner', 'VIERNES', '18:00:00', '20:00:00', 'SALON 403NB'),
        ('VIII ADM. NEGOCIOS EN', 'Optativa III. GESTION MARITIMA Y PORTUARIA', 'Cecilia Ibeth Sierra Martinez', 'VIERNES', '20:00:00', '22:00:00', 'SALON 403NB'),

        








        # ── SALON 404NB (22 horarios) ──
        ('V BACTERIOLOGÍA A', 'Electiva V', 'TATIANA POLO', 'LUNES', '08:00:00', '10:00:00', 'SALON 404NB'),
        ('VIII DERECHO A', 'Procesal Civil, Especial y De Familia', 'NUBIA MARRUGO', 'LUNES', '10:00:00', '12:00:00', 'SALON 404NB'),
        ('VIII DERECHO A', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ ', 'LUNES', '13:00:00', '16:00:00', 'SALON 404NB'),
        ('VII ADM. NEGOCIOS BN', 'Gerencia de comercio exterior', 'Cecilia Ibeth Sierra Martinez', 'LUNES', '18:00:00', '20:00:00', 'SALON 404NB'),
        ('I ADM. NEGOCIOS AN', 'Presupuestos empresariales', 'Rocío Mercedes Duarte Angarita', 'LUNES', '20:00:00', '22:00:00', 'SALON 404NB'),
        ('I CONTADURIA GN', 'Presupuestos empresariales', 'Rocío Mercedes Duarte Angarita', 'LUNES', '20:00:00', '22:00:00', 'SALON 404NB'),
        ('I DERECHO F', 'INTRODUCCIÓN AL DERECHO', 'RICARDO MÉNDEZ', 'MARTES', '06:00:00', '08:00:00', 'SALON 404NB'),
        ('I DERECHO F', 'CSA-ELE1', '', 'MARTES', '08:00:00', '10:00:00', 'SALON 404NB'),
        ('I CONTADURIA CD', 'Fundamentos de matemáticas', 'Boanerge José Salas Muñoz', 'MARTES', '06:00:00', '08:00:00', 'SALON 404NB'),
        ('I ADM. NEGOCIOS CD', 'Fundamentos de matemáticas', 'Boanerge José Salas Muñoz', 'MARTES', '06:00:00', '08:00:00', 'SALON 404NB'),
        ('VI ING. SISTEMAS GB', 'Formulación y Evaluación de Proyectos', 'FRANKLIN BARRIOS', 'MARTES', '18:00:00', '20:00:00', 'SALON 404NB'),
        ('IX ING. INDUSTRIAL GA', 'Investigación Aplicada IV', 'ASTRID BARRIOS', 'MARTES', '20:00:00', '22:00:00', 'SALON 404NB'),
        ('III ADMIN NEG CD', 'Matemáticas financieras', 'Ricardo Mena Torres', 'MIÉRCOLES', '07:00:00', '10:00:00', 'SALON 404NB'),
        ('III CONTADURIA CD', 'Matemáticas financieras', 'Ricardo Mena Torres', 'MIÉRCOLES', '07:00:00', '10:00:00', 'SALON 404NB'),
        ('X DERECHO A', 'OPTATIVA IV DERECHO TRIBUTARIO', 'FELIPE HERAS', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 404NB'),
        ('IX ING. INDUSTRIAL GA', 'Proyección Social', ' ERICK JASSIR', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALON 404NB'),
        ('VIII ADM. NEGOCIOS BN', 'Optativa III. DESARROLLO DEL FACTOR HUMANO', 'Julie Samanta Arévalo Coral', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 404NB'),
        ('VI DERECHO A', 'DERECHO COMERCIAL GENERAL', 'JAVIER CRESPO', 'JUEVES', '06:00:00', '10:00:00', 'SALON 404NB'),
        ('IX ING. INDUSTRIAL GA', 'Psicología Industria. DESARROLLO DEL FACTOR HUMANO', 'GUSTAVO DE LA HOZ', 'JUEVES', '18:00:00', '20:00:00', 'SALON 404NB'),
        ('X ING. INDUSTRIAL GA', 'Investigación Aplicada V', 'AGUSTIN VIDAL', 'JUEVES', '20:00:00', '22:00:00', 'SALON 404NB'),
        ('X DERECHO B', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'VIERNES', '06:00:00', '09:00:00', 'SALON 404NB'),
        ('IX ING. INDUSTRIAL GA', 'Psicología Industrial', 'GUSTAVO DE LA HOZ', 'VIERNES', '18:00:00', '22:00:00', 'SALON 404NB'),
        


        # ── SALON 405NB (27 horarios) ──
        ('VIII ING. SISTEMAS GA', 'Sistemas Integrados de Gestión', 'Arnaldo Arce', 'LUNES', '07:00:00', '09:00:00', 'SALON 405NB'),
        ('I ALIANZA SEMESTRAL 1', 'Modalidad Semestral', 'Profesor 1', 'LUNES', '11:00:00', '13:00:00', 'SALON 405NB'),
        ('VII ING. INDUSTRIAL GA', 'Seguridad y Salud en el trabajo', 'Ricardo De La Hoz', 'LUNES', '15:00:00', '18:00:00', 'SALON 405NB'),
        ('I ING. SISTEMAS GB', 'Competencias de Aprendizaje y Com.', 'Yessy Coronel', 'LUNES', '18:00:00', '21:00:00', 'SALON 405NB'),
        ('II ING. INDUSTRIAL GA', 'Álgebra Lineal GN', 'Roberto Osio', 'MARTES', '06:00:00', '08:00:00', 'SALON 405NB'),
        ('III CONTADURIA CD', 'Coyuntura económica nacional', 'Marco Antonio Ariza Dau', 'MARTES', '10:00:00', '12:00:00', 'SALON 405NB'),
        ('I ING. INDUSTRIAL GA', 'Química General y Lab.', 'Eduardo Espinosa', 'MARTES', '15:00:00', '18:00:00', 'SALON 405NB'),
        ('X ING. INDUSTRIAL GA', 'ING-EPR2', 'Hernando Peña', 'MARTES', '18:00:00', '21:00:00', 'SALON 405NB'),
        ('I DERECHO F', 'Habilidades Comunicativas', '', 'MIÉRCOLES', '06:00:00', '09:00:00', 'SALON 405NB'),
        ('I DERECHO F', 'Teoría del Estado', 'Jhonny Mendoza', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 405NB'),
        ('VI ING. INDUSTRIAL GA', 'Gestión de Tecnología', 'José W. Penagos', 'MIÉRCOLES', '15:00:00', '17:00:00', 'SALON 405NB'),
        ('I ING. SISTEMAS GB', 'Lógica y Algoritmo GB', 'Marvin Molina', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 405NB'),
        ('I ING. SISTEMAS GB', 'Cálculo Diferencial GB', 'Danna Betancourt', 'MIÉRCOLES', '20:00:00', '22:00:00', 'SALON 405NB'),
        ('II ING. SISTEMAS GA', 'Electricidad y Magnetismo & Lab.', 'Ingrid Steffanell', 'JUEVES', '08:00:00', '10:00:00', 'SALON 405NB'),
        ('I ALIANZA SEMESTRAL 1', 'Modalidad Semestral', 'Profesor 1', 'JUEVES', '11:00:00', '13:00:00', 'SALON 405NB'),
        ('VII BACTERIOLOGÍA B', 'Electiva de profundización (B): Diagnóstico Forense', 'Miriam Linero', 'JUEVES', '16:00:00', '18:00:00', 'SALON 405NB'),
        ('X ING. SISTEMAS GA', 'Investigación Aplicada V', 'Diana Suarez', 'JUEVES', '18:00:00', '20:00:00', 'SALON 405NB'),
        ('II ING. INDUSTRIAL GA', 'Contabilidad y Presupuesto GA', 'Deiber Puello', 'JUEVES', '20:00:00', '22:00:00', 'SALON 405NB'),
        ('II ING. SISTEMAS GA', 'Pensamiento Sistémico', 'Paul Sanmartin', 'VIERNES', '06:00:00', '08:00:00', 'SALON 405NB'),
        ('II ING. SISTEMAS GA', 'Electricidad y Magnetismo & Lab.', 'Ingrid Steffanell', 'VIERNES', '09:00:00', '12:00:00', 'SALON 405NB'),
        ('I ING. SISTEMAS GB', 'Cálculo Diferencial GB', 'Danna Betancourt', 'VIERNES', '18:00:00', '20:00:00', 'SALON 405NB'),
        ('I CONTADURIA AN', 'Ciclo básico contable', 'Jesús Maria Rodríguez Polo', 'VIERNES', '20:00:00', '22:00:00', 'SALON 405NB'),
        ('I ALIANZA SABATINO 1', 'Modalidad Sabatina', 'Profesor 1', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 405NB'),
        
        # ── SALON 406NB (26 horarios) ──
        ('V ADM. NEGOCIOS CD', 'Logística y Distribución Física Internacional', 'Roberto Antonio Morales Espinosa', 'LUNES', '08:00:00', '10:00:00', 'SALON 406NB'),
        ('V ADM. NEGOCIOS CD', 'Modelos de Investigación', 'Gustavo Rafael Henríquez Fuentes', 'LUNES', '10:00:00', '12:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', 'Profesor 4', 'LUNES', '14:00:00', '16:00:00', 'SALON 406NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 7', 'LUNES', '16:00:00', '18:00:00', 'SALON 406NB'),
        ('VIII ING. SISTEMAS GB', 'Gerencia Estratégica GB', 'José Peñagos', 'LUNES', '18:00:00', '20:00:00', 'SALON 406NB'),
        ('III CONTADURÍA CD', 'Ciclo de Egresos y Administración de Inventarios', 'Rafael Francisco Núñez Suárez', 'MARTES', '09:00:00', '12:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', 'Profesor 4', 'MARTES', '14:00:00', '16:00:00', 'SALON 406NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 7', 'MARTES', '16:00:00', '18:00:00', 'SALON 406NB'),
        ('VIII ING. SISTEMAS GB', 'Dirección y liderazgo', 'Saúl Olivos', 'MARTES', '18:00:00', '20:00:00', 'SALON 406NB'),
        ('III ADM. NEGOCIOS CD', 'Ingeniería Aplicada', 'Lilia Mercedes Mendoza Vega', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', 'Profesor 4', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 406NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 7', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 406NB'),
        ('IV ADM. NEGOCIOS AN', 'Estadística Inferencial', 'Rocío Mercedes Duarte Angarita', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 406NB'),
        ('IV CONTADURÍA AN', 'Estadística Inferencial', 'Rocío Mercedes Duarte Angarita', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 406NB'),
        ('IX ING. INDUSTRIAL A', 'Diseño de Planta', 'Franklin Barrios', 'MIÉRCOLES', '20:00:00', '22:00:00', 'SALON 406NB'),
        ('VII ING. INDUSTRIAL GB', 'Modelos Estocásticos Matemáticos GB', 'Luis Carlos Acosta', 'JUEVES', '06:00:00', '09:00:00', 'SALON 406NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', 'Profesor 4', 'JUEVES', '14:00:00', '16:00:00', 'SALON 406NB'),
        ('VII ALIANZA INTENSIVO 7', 'Modalidad Intensiva', 'Profesor 7', 'JUEVES', '16:00:00', '18:00:00', 'SALON 406NB'),
        ('IV ADM. NEGOCIOS AN', 'Legislación Aduanera', 'Roberto Meisel Lanner', 'JUEVES', '18:00:00', '20:00:00', 'SALON 406NB'),
        ('IV ADM. NEGOCIOS AN', 'Geopolítica', 'Roberto Antonio Morales Espinosa', 'JUEVES', '20:00:00', '22:00:00', 'SALON 406NB'),
        ('X MEDICINA', 'Medicina Legal', 'Luz Marina Carvajal Bustos', 'VIERNES', '07:00:00', '10:00:00', 'SALON 406NB'),
        ('II ING. INDUSTRIAL GA', 'Ciencia de los Materiales', 'Juan Carlos Carrasco', 'VIERNES', '18:00:00', '21:00:00', 'SALON 406NB'),
        ('IV ALIANZA SABATINO 4', 'Modalidad Sabatina', 'Profesor 4', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 406NB'),
        ('VII ALIANZA SABATINO 7', 'Modalidad Sabatina', 'Profesor 7', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 406NB'),


        # ── SALON 407NB (17 horarios) ──
        
        ('VII ING. SISTEMAS GB', 'ING-ETIC', 'OONA HERNANDEZ', 'LUNES', '06:00:00', '08:00:00', 'SALON 407NB'),
        ('II ING. SISTEMAS GA', 'Álgebra Lineal', 'ROBERTO OSIO', 'LUNES', '08:00:00', '10:00:00', 'SALON 407NB'),
        ('II ING. INDUSTRIAL GA', 'Álgebra Lineal', 'ROBERTO OSIO', 'LUNES', '08:00:00', '10:00:00', 'SALON 407NB'),
        ('III ING. INDUSTRIAL GA', 'Cálculo Multivariado y Vectorial', 'INGRID STEFANEL', 'LUNES', '10:00:00', '12:00:00', 'SALON 407NB'),
        ('II CONTADURÍA CD', 'Curso Francés', '', 'LUNES', '16:00:00', '18:00:00', 'SALON 407NB'),
        ('I ADM. NEGOCIOS CD', 'Curso Francés', '', 'LUNES', '16:00:00', '18:00:00', 'SALON 407NB'),
        ('I ADM. NEGOCIOS CD', 'Curso Francés', '', 'LUNES', '16:00:00', '18:00:00', 'SALON 407NB'),
        ('III ING. INDUSTRIAL GB', 'Electricidad, Magnetismo y Laboratorio', 'EMELDO CABALLERO', 'LUNES', '20:00:00', '22:00:00', 'SALON 407NB'),
        ('VIII ING. SISTEMAS GB', 'Sistemas Integrados de Gestión', 'ARNALDO ARCE', 'MARTES', '07:00:00', '09:00:00', 'SALON 407NB'),
        ('V ING. SISTEMAS GB', 'Matemáticas Discretas', 'EDGARDO BUELVAS', 'MARTES', '10:00:00', '12:00:00', 'SALON 407NB'),
        ('III ING. INDUSTRIAL GB', 'Cálculo Multivariado y Vectorial', 'EMELDO CABALLERO', 'MARTES', '14:00:00', '16:00:00', 'SALON 407NB'), 
        ('V ING. INDUSTRIAL GA', 'Método', 'RICARDO DE LA HOZ', 'MARTES', '16:00:00', '18:00:00', 'SALON 407NB'), 
        ('IV ING. SISTEMAS GB', 'Ecuaciones Diferenciales', 'MARTHA ARTETA', 'MARTES', '18:00:00', '20:00:00', 'SALON 407NB'),
        ('VIII ING. SISTEMAS GB', 'Sistemas Integrados de Gestión', 'ARNALDO ARCE', 'MIÉRCOLES', '07:00:00', '09:00:00', 'SALON 407NB'), 
        ('II ING. SISTEMAS GA', 'Álgebra Lineal', 'ROBERTO OSIO', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 407NB'), 
        ('II ING. INDUSTRIAL GA', 'Álgebra Lineal', 'ROBERTO OSIO', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 407NB'),
        ('X DERECHO A', 'DER-OPT4', 'EDUARDO CERRA', 'MIÉRCOLES', '14:00:00', '17:00:00', 'SALON 407NB'), 
        ('VII ADMIN NEGOCIOS BN', 'International Marketing', 'José Rafael Simancas Trujillo', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 407NB'), 
        ('VII ADMIN NEGOCIOS BN', 'Gerencia de comercio exterio', 'Cecilia Ibeth Sierra Martinez', 'MIÉRCOLES', '20:00:00', '21:00:00', 'SALON 407NB'), 
        ('VII DERECHO A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'JUEVES', '06:00:00', '08:00:00', 'SALON 407NB'),  
        ('III ING. INDUSTRIAL GA', 'Cálculo Multivariado y Vectorial', 'INGRID STEFANEL', 'JUEVES', '10:00:00', '12:00:00', 'SALON 407NB'), 
        ('V ING. SISTEMAS GA', 'Fundamentos de Economía', 'DEIBER PUELLO', 'JUEVES', '14:00:00', '17:00:00', 'SALON 407NB'), 
        ('V ING. INDUSTRIAL GB', 'Fundamentos de Economía', 'DEIBER PUELLO', 'JUEVES', '17:00:00', '20:00:00', 'SALON 407NB'), 
        ('VII DERECHO A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'VIERNES', '06:00:00', '08:00:00', 'SALON 407NB'), 
        ('III ING. INDUSTRIAL GB', 'Cálculo Multivariado y Vectorial', 'EMELDO CABALLERO', 'VIERNES', '08:00:00', '10:00:00', 'SALON 407NB'),     
        ('IV ING. INDUSTRIAL GA', 'Cátedra de Sostenibilidad', 'RICARDO DE LA HOZ', 'VIERNES', '10:00:00', '12:00:00', 'SALON 407NB'), 
        ('VII ADMIN NEGOCIOS AN', 'Seminario de negociacion y concertacion', 'Winston Fontalvo Cerpa', 'VIERNES', '18:00:00', '20:00:00', 'SALON 407NB'), 
        ('VII ADMIN NEGOCIOS AN', 'Proyecto de Investigación', 'RLilia Mercedes Mendoza Vega', 'VIERNES', '20:00:00', '22:00:00', 'SALON 407NB'), 
        
        # ── SALON 408NB (26 horarios) ──
        ('I ING. SISTEMAS GA', 'Física Mecánica y Lab.', 'Ingrid Steffanell', 'LUNES', '08:00:00', '10:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Cálculo Diferencial', 'Saúl Olivos', 'LUNES', '10:00:00', '12:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Introducción a la Ingeniería', 'Janeth Rozo', 'LUNES', '13:00:00', '14:00:00', 'SALON 408NB'),
        ('VI ING. SISTEMAS GA', 'ING-ELE3', 'Yessy Coronel', 'LUNES', '14:00:00', '16:00:00', 'SALON 408NB'),
        ('VIII ING. SISTEMAS GA', 'Gerencia Estratégica', 'Andrea Coronado', 'LUNES', '18:00:00', '21:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GB', 'Introducción a la Ingeniería', 'Obeth Romero', 'MARTES', '06:00:00', '08:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Física Mecánica y Lab.', 'Ingrid Steffanell', 'MARTES', '10:00:00', '13:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Introducción a la Ingeniería', 'Janeth Rozo', 'MARTES', '13:00:00', '14:00:00', 'SALON 408NB'),
        ('II ING. SISTEMAS GA', 'Cálculo Integral', 'Saúl Olivos', 'MARTES', '16:00:00', '18:00:00', 'SALON 408NB'),
        ('II ING. INDUSTRIAL GA', 'Cálculo Integral', 'Saúl Olivos', 'MARTES', '16:00:00', '18:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Física Mecánica y Lab. GB', 'Emeldo Caballero', 'MARTES', '18:00:00', '21:00:00', 'SALON 408NB'),
        ('I ING. INDUSTRIAL GA', 'Física Mecánica y Lab. GB', 'Emeldo Caballero', 'MARTES', '18:00:00', '21:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'ING-CPAC', 'Yessy Coronel', 'MIÉRCOLES', '07:00:00', '10:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Cálculo Diferencial', 'Saúl Olivos', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 408NB'),
        ('IV ING. SISTEMAS GA', 'Constitución Política', 'Elvis Ruiz', 'MIÉRCOLES', '13:00:00', '15:00:00', 'SALON 408NB'),
        ('II ING. SISTEMAS GA', 'Cálculo Integral', 'Saúl Olivos', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 408NB'),
        ('II ING. INDUSTRIAL GA', 'Cálculo Integral', 'Saúl Olivos', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 408NB'),
        ('IV ING. SISTEMAS GA', 'Ecuaciones Diferenciales', 'Martha Arteta', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 408NB'),
        ('IV ING. INDUSTRIAL GB', 'Cátedra de Sostenibilidad', 'Ricardo De la Hoz', 'MIÉRCOLES', '20:00:00', '22:00:00', 'SALON 408NB'),
        ('VII ADM. NEGOCIOS FN', 'CEA-OPT2', 'Danilo Enrique Torres Pimiento', 'JUEVES', '07:00:00', '11:00:00', 'SALON 408NB'),
        ('IV ING. SISTEMAS GA', 'Ecuaciones Diferenciales', 'Martha Arteta', 'JUEVES', '14:00:00', '16:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Física Mecánica y Lab. GB', 'Emeldo Caballero', 'JUEVES', '18:00:00', '20:00:00', 'SALON 408NB'),
        ('I ING. INDUSTRIAL GA', 'Física Mecánica y Lab. GB', 'Emeldo Caballero', 'JUEVES', '18:00:00', '21:00:00', 'SALON 408NB'),
        ('VIII ING. SISTEMAS GA', 'Sistemas Integrados de Gestión', 'Arnaldo Arce', 'VIERNES', '07:00:00', '09:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Lógica Matemática', 'Emeldo Caballero', 'VIERNES', '10:00:00', '13:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Lógica y Algoritmos', 'Edgardo Buelvas', 'VIERNES', '15:00:00', '17:00:00', 'SALON 408NB'),
        ('VII ING. SISTEMAS GB', 'Metodología de la Investigación', 'Astrid Barrios', 'VIERNES', '18:00:00', '21:00:00', 'SALON 408NB'),
        ('I ING. SISTEMAS GA', 'Lógica Matemática', 'Emeldo Caballero', 'SÁBADO', '06:00:00', '09:00:00', 'SALON 408NB'),

        # ── SALON 409NB (24 horarios) ──
        ('IV ING. INDUSTRIAL GA', 'Procesos Industriales', 'Diego Suero', 'LUNES', '06:00:00', '08:00:00', 'SALON 409NB'),
        ('II ADM. NEGOCIOS CD', 'Contabilidad financiera', 'Jesús María Rodríguez Polo', 'LUNES', '08:00:00', '11:00:00', 'SALON 409NB'),
        ('IV ING. INDUSTRIAL GA', 'Ecuaciones Diferenciales', 'Ingrid Steffanell', 'LUNES', '14:00:00', '16:00:00', 'SALON 409NB'),
        ('II ING. INDUSTRIAL GA', 'Álgebra Lineal GN', 'Roberto Osio', 'LUNES', '18:00:00', '20:00:00', 'SALON 409NB'),
        ('II ING. INDUSTRIAL GA', 'Cálculo Integral GN', 'Saúl Olivos', 'LUNES', '20:00:00', '22:00:00', 'SALON 409NB'),
        ('IV ING. INDUSTRIAL GA', 'Termodinámica', 'Juan Carlos Carrasco', 'MARTES', '06:00:00', '09:00:00', 'SALON 409NB'),
        ('IV ING. INDUSTRIAL GA', 'Costos de Operación', 'Medardo González', 'MARTES', '09:00:00', '12:00:00', 'SALON 409NB'),
        ('X ING. SISTEMAS GA', 'Gestión de Proyectos Informáticos', 'Patty Pedroza', 'MARTES', '18:00:00', '20:00:00', 'SALON 409NB'),
        ('X ING. SISTEMAS GA', 'ING-ELE3', 'Alexander Parody', 'MARTES', '20:00:00', '22:00:00', 'SALON 409NB'),
        ('VII DERECHO A', 'Filosofía del Derecho', 'Alexander González', 'MIÉRCOLES', '06:00:00', '08:00:00', 'SALON 409NB'),
        ('IV ING. INDUSTRIAL GA', 'Ecuaciones Diferenciales', 'Ingrid Steffanell', 'MIÉRCOLES', '09:00:00', '11:00:00', 'SALON 409NB'),
        ('IV ING. INDUSTRIAL GA', 'Procesos Industriales', 'Diego Suero', 'MIÉRCOLES', '11:00:00', '14:00:00', 'SALON 409NB'),
        ('V ING. INDUSTRIAL GA', 'ING-ELE3', 'Agustín Vidal', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 409NB'),
        ('X ING. INDUSTRIAL GA', 'Logística Interna y Externa', 'Franklin Barrios', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 409NB'),
        ('II ING. INDUSTRIAL GA', 'Cálculo Integral GN', 'Saúl Olivos', 'MIÉRCOLES', '20:00:00', '22:00:00', 'SALON 409NB'),
        ('IV ING. INDUSTRIAL GA', 'Termodinámica', 'Juan Carlos Carrasco', 'JUEVES', '06:00:00', '08:00:00', 'SALON 409NB'),
        ('VII ING. INDUSTRIAL GA', 'Modelos Estocásticos Matemáticos', 'Luis Carlos Acosta', 'JUEVES', '09:00:00', '12:00:00', 'SALON 409NB'),
        ('I ING. INDUSTRIAL GA', 'Química General y Lab.', 'Eduardo Espinosa', 'JUEVES', '16:00:00', '18:00:00', 'SALON 409NB'),
        ('VIII ING. SISTEMAS GA', 'Ingeniería Aplicada', 'ASTRID BARRIOS', 'JUEVES', '18:00:00', '19:00:00', 'SALON 409NB'),
        ('IX ING. INDUSTRIAL GA', 'Diseño de Planta', 'Franklin Barrios', 'JUEVES', '20:00:00', '22:00:00', 'SALON 409NB'),
        ('VI DERECHO B', 'Procesal Penal II', '', 'VIERNES', '06:00:00', '09:00:00', 'SALON 409NB'),
        ('IV ING. INDUSTRIAL GA', 'Modelos Estocásticos Matemáticos', 'Luis Carlos Acosta', 'VIERNES', '09:00:00', '11:00:00', 'SALON 409NB'),
        ('II ING. INDUSTRIAL GA', 'Lógica y Algoritmo GA', 'Edgardo Buelvas', 'VIERNES', '17:00:00', '19:00:00', 'SALON 409NB'),
        ('II CONTADURIA AN', 'Ciclo de ingresos', 'Julio César Padilla Molina', 'VIERNES', '20:00:00', '22:00:00', 'SALON 409NB'),
        ('II ALIANZA SABATINO 2', 'Modalidad: Sabatino', '', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 409NB'),

        # ── SALON 410NB (23 horarios) ──
        ('X MEDICINA', 'Gineco-Obstetricia Teórico', '', 'LUNES', '06:00:00', '09:00:00', 'SALON 410NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-intensiva', '', 'LUNES', '14:00:00', '16:00:00', 'SALON 410NB'),
        ('VI ING. INDUSTRIAL GA', 'Gestión de Tecnología', 'José W. Penagos', 'LUNES', '16:00:00', '18:00:00', 'SALON 410NB'),
        ('VI ADM. NEGOCIOS CD', 'Finanzas Internacionales', 'Winston Fontalvo Cerpa', 'LUNES', '18:00:00', '19:00:00', 'SALON 410NB'),
        ('VI ADM. NEGOCIOS CD', 'Investigación de Mercados', 'José Rafael Simancas Trujillo', 'LUNES', '19:00:00', '20:00:00', 'SALON 410NB'),
        ('III ADM. NEGOCIOS CD', 'Coyuntura económica nacional', 'Yesenia Judith Barandica Angulo', 'MARTES', '07:00:00', '09:00:00', 'SALON 410NB'),
        ('III ADM. NEGOCIOS CD', 'Sistemas de Costeo', 'Jesús Rodríguez Polo', 'MARTES', '09:00:00', '12:00:00', 'SALON 410NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-intensiva', '', 'MARTES', '14:00:00', '16:00:00', 'SALON 410NB'),
        ('VI ING. INDUSTRIAL GA', 'ING-OPT1', 'Medardo González', 'MARTES', '16:00:00', '18:00:00', 'SALON 410NB'),
        ('V ING. INDUSTRIAL GA', 'Planeación y Control de la Producción y Operaciones', 'Roberto Osio', 'MARTES', '18:00:00', '20:00:00', 'SALON 410NB'),
        ('X MEDICINA', 'Gineco-Obstetricia Teórico', '', 'MIÉRCOLES', '06:00:00', '09:00:00', 'SALON 410NB'),
        ('VII ADM. NEGOCIOS CD', 'Gerencia de Comercio Exterior', 'Cecilia Ibeth Sierra Martínez', 'MIÉRCOLES', '09:00:00', '12:00:00', 'SALON 410NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-intensiva', '', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 410NB'),
        ('X ING. INDUSTRIAL GA', 'Mercadeo GA', 'Erick Jassir', 'MIÉRCOLES', '18:00:00', '21:00:00', 'SALON 410NB'),
        ('V ING. INDUSTRIAL GA', 'Sistemas Integrados de Gestión', 'Arnaldo Arce', 'JUEVES', '06:00:00', '09:00:00', 'SALON 410NB'),
        ('V ING. INDUSTRIAL GA', 'Métodos GA', 'Ricardo De La Hoz', 'JUEVES', '09:00:00', '12:00:00', 'SALON 410NB'),
        ('V ALIANZA SEMI-INTENSIVO 5', 'Modalidad Semi-intensiva', '', 'JUEVES', '14:00:00', '16:00:00', 'SALON 410NB'),
        ('VI ING. INDUSTRIAL GA', 'ING-OPT1', 'Medardo González', 'JUEVES', '16:00:00', '18:00:00', 'SALON 410NB'),
        ('VI ING. INDUSTRIAL GA', 'Planeación y Control de la Producción y Operaciones', 'Roberto Osio', 'JUEVES', '18:00:00', '21:00:00', 'SALON 410NB'),
        ('V ING. INDUSTRIAL GA', 'Cátedra de Sostenibilidad', 'Ricardo De La Hoz', 'VIERNES', '08:00:00', '10:00:00', 'SALON 410NB'),
        ('V ING. INDUSTRIAL GA', 'Diseño de productos y servicios', 'Erick Jassir', 'VIERNES', '10:00:00', '12:00:00', 'SALON 410NB'),
        ('VII CONTADURIA AN', 'Finanzas Corporativas', 'Ricardo Mena Torres', 'VIERNES', '19:00:00', '22:00:00', 'SALON 410NB'),
        ('III ALIANZA SABATINO 3', 'Modalidad Sabatina', '', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 410NB'),

        # ── SALON 411NB (21 horarios) ──
        ('I DERECHO AN', 'CEA-ELE1', 'Yadira García', 'LUNES', '08:00:00', '10:00:00', 'SALON 411NB'),
        ('I DERECHO AN', 'INTRODUCCIÓN AL DERECHO', 'Oona Hernández', 'LUNES', '10:00:00', '12:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'CEA-OPT2', 'Danilo Enrique Torres Pimiento', 'LUNES', '18:00:00', '20:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'Ingeniería Aplicada', 'Astrid Barrios', 'LUNES', '20:00:00', '22:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'Diseño de Instalaciones Industriales y de Servicios', 'Luis Carlos Acosta', 'MARTES', '06:00:00', '09:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'Títulos Valores', 'Marlys Herazo', 'MARTES', '10:00:00', '12:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'Contratos', 'Rafael Fierro', 'MARTES', '13:00:00', '15:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'Probatorio', 'Eduardo Lascano', 'MARTES', '15:00:00', '18:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'Logística y Cadena de Suministro', 'Carlos Consuegra', 'MARTES', '18:00:00', '22:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'Diseño de Instalaciones Industriales y de Servicios', 'Luis Carlos Acosta', 'MIÉRCOLES', '06:00:00', '08:00:00', 'SALON 411NB'),
        ('V ADM. NEGOCIOS CD', 'Derecho Comercial Internacional', 'Roberto Meisel Lanner', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 411NB'),
        ('X DERECHO A', 'DER-OPT4', 'Jhonny Mendoza', 'MIÉRCOLES', '14:00:00', '17:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'CEA-OPT3B', 'Medardo González', 'MIÉRCOLES', '18:00:00', '22:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'Familia, Infancia y Adolescencia', 'Juan Carlos de los Ríos', 'JUEVES', '06:00:00', '08:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'Títulos Valores', 'Marlys Herazo', 'JUEVES', '08:00:00', '10:00:00', 'SALON 411NB'),
        ('VII DERECHO B', 'Contratos', 'Rafael Fierro', 'JUEVES', '10:00:00', '12:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'CEA-ELE1', 'Agustín Vidal', 'JUEVES', '18:00:00', '21:00:00', 'SALON 411NB'),
        ('VIII ING. INDUSTRIAL GA', 'Investigación Aplicada V', 'Astrid Barrios', 'JUEVES', '20:00:00', '22:00:00', 'SALON 411NB'),
        ('I DERECHO B', 'Teoría Económica', 'Francisco Polo', 'VIERNES', '06:00:00', '09:00:00', 'SALON 411NB'),
        ('VII DERECHO A', 'Criminología y Política Criminal', 'Ricardo Méndez', 'VIERNES', '18:00:00', '21:00:00', 'SALON 411NB'),
        ('IV ALIANZA SABATINO 4', 'Modalidad Sabatina', '', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 411NB'),

        # ── SALON 412NB (20 horarios) ──
        ('VII DERECHO B', 'Filosofía del Derecho', 'Cristóbal Arteta', 'LUNES', '08:00:00', '10:00:00', 'SALON 412NB'),
        ('VII DERECHO A', 'Laboral Administrativo', 'Francisco Bustamante', 'MARTES', '08:00:00', '10:00:00', 'SALON 412NB'),
        ('II CONTADURIA CD', 'Cálculo', 'Antonio Julio Castilla Romero', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 412NB'),
        ('II ADM. NEGOCIOS CD', 'Cálculo', 'Antonio Julio Castilla Romero', 'MIÉRCOLES', '08:00:00', '10:00:00', 'SALON 412NB'),
        ('III ADM. NEGOCIOS CD', 'Derecho laboral y seguridad social', 'Antonio Julio Castilla Romero', 'JUEVES', '08:00:00', '10:00:00', 'SALON 412NB'),
        ('III CONTADURIA CD', 'Derecho laboral y seguridad social', 'Antonio Julio Castilla Romero', 'JUEVES', '08:00:00', '10:00:00', 'SALON 412NB'),
        ('VII DERECHO B', 'Familia, Infancia y Adolescencia', 'Juan Carlos de los Ríos', 'LUNES', '10:00:00', '12:00:00', 'SALON 412NB'),
        ('VIII DERECHO A', 'Procesal Laboral', 'Lilia Cedeño', 'MARTES', '10:00:00', '12:00:00', 'SALON 412NB'),
        ('II CONTADURIA CD', 'Epistemología y metodología de la investigación', 'Milagros del Carmen Villasmil', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 412NB'),
        ('II ADM. NEGOCIOS CD', 'Epistemología y metodología de la investigación', 'Milagros del Carmen Villasmil', 'MIÉRCOLES', '10:00:00', '12:00:00', 'SALON 412NB'),
        ('II CONTADURIA CD', 'Economía de empresa', 'Yesenia Judith Barandica Angulo', 'JUEVES', '10:00:00', '12:00:00', 'SALON 412NB'),
        ('II ADM. NEGOCIOS CD', 'Economía de empresa', 'Yesenia Judith Barandica Angulo', 'JUEVES', '10:00:00', '12:00:00', 'SALON 412NB'),
        ('VII DERECHO B', 'Probatorio', 'Eduardo Lascano', 'LUNES', '14:00:00', '16:00:00', 'SALON 412NB'),
        ('VII ADM. NEGOCIOS AN', 'Principles of Public Speaking', 'Sandra Milena Castillo Balmaceda', 'LUNES', '18:00:00', '20:00:00', 'SALON 412NB'),
        ('VII ADM. NEGOCIOS AN', 'Gerencia de comercio exterior', 'Cecilia Ibet Sierra Martínez', 'MARTES', '18:00:00', '20:00:00', 'SALON 412NB'),
        ('VII ADM. NEGOCIOS AN', 'International Agreement', 'Jemmy Maritza Bernal Gómez', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 412NB'),
        ('VII ADM. NEGOCIOS AN', 'Gestión de Exportaciones', 'Maribel Cera Camera', 'JUEVES', '18:00:00', '20:00:00', 'SALON 412NB'),
        ('I ADM. NEGOCIOS AN', 'Fundamentos de matemáticas', 'Antonio Julio Castilla Romero', 'VIERNES', '18:00:00', '20:00:00', 'SALON 412NB'),
        ('I CONTADURIA AN', 'Fundamentos de matemáticas', 'Antonio Julio Castilla Romero', 'VIERNES', '18:00:00', '20:00:00', 'SALON 412NB'),
        ('VII ADM. NEGOCIOS AN', 'Optativa II. Innovación y sostenibilidad estratégica', 'Daniel Enrique Torres Avendaño', 'LUNES', '20:00:00', '22:00:00', 'SALON 412NB'),
        ('VII ADM. NEGOCIOS AN', 'Optativa II. Innovación y sostenibilidad estratégica', 'Danilo Enrique Torres Pimiento', 'MARTES', '20:00:00', '22:00:00', 'SALON 412NB'),
        ('VII ADM. NEGOCIOS AN', 'International Marketing', 'José Rafael Simancas Trujillo', 'JUEVES', '20:00:00', '22:00:00', 'SALON 412NB'),
        ('I ADM. NEGOCIOS AN', 'Emprendimiento e innovación', 'José Rafael Simancas Trujillo', 'VIERNES', '20:00:00', '22:00:00', 'SALON 412NB'),
        ('I CONTADURIA AN', 'Emprendimiento e innovación', 'José Rafael Simancas Trujillo', 'VIERNES', '20:00:00', '22:00:00', 'SALON 412NB'),
        ('I ALIANZA SABATINO 1', 'Modalidad Sabatina', '', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 412NB'),

        # ── SALON 413NB (26 horarios) ──
        ('III CONTADURIA CD', 'Teorías Contables', 'Julio César Padilla Molina', 'LUNES', '07:00:00', '09:00:00', 'SALON 413NB'),
        ('III CONTADURIA CD', 'CEA-CEAI', 'Rafael Francisco Núñez Suárez', 'LUNES', '09:00:00', '11:00:00', 'SALON 413NB'),
        ('IV ALIANZA SEMESTRAL 4', 'Modalidad Semestral', '', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 413NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-intensiva', '', 'LUNES', '14:00:00', '16:00:00', 'SALON 413NB'),
        ('V CONTADURIA AN', 'Investigación de Operaciones', 'Boanerge Salas Muñoz', 'LUNES', '18:00:00', '19:00:00', 'SALON 413NB'),
        ('V ADM. NEGOCIOS AN', 'Investigación de Operaciones', 'Boanerge Salas Muñoz', 'LUNES', '18:00:00', '20:00:00', 'SALON 413NB'),
        ('VI CONTADURIA AN', 'CEA-IMRE', 'Cástulo Antonio Maza Cabrera', 'MARTES', '19:00:00', '20:00:00', 'SALON 413NB'),
        ('V ADM. NEGOCIOS AN', 'Comercio y Negocios Globales', 'José Rafael Simanca Trujillo', 'LUNES', '20:00:00', '22:00:00', 'SALON 413NB'),
        ('VII ADM. NEGOCIOS CD', 'Seminario de Negociación y Concertación', 'Farid Elías Amín De La Hoz', 'MARTES', '07:00:00', '09:00:00', 'SALON 413NB'),
        ('VII ADM. NEGOCIOS CD', 'Proyecto de Investigación', 'Milagros Del Carmen Villasmil Molero', 'MARTES', '09:00:00', '11:00:00', 'SALON 413NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-intensiva', '', 'MARTES', '14:00:00', '16:00:00', 'SALON 413NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-intensiva', '', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 413NB'),
        ('VI CONTADURIA AN', 'Auditoría Aplicada', 'Juan Torres Palacio', 'MIÉRCOLES', '20:00:00', '22:00:00', 'SALON 413NB'),
        ('II CONTADURIA CD', 'CEA-CIIN', 'Julio César Padilla Molina', 'JUEVES', '07:00:00', '09:00:00', 'SALON 413NB'),
        ('IV ALIANZA SEMESTRAL 4', 'Modalidad Semestral', '', 'JUEVES', '11:00:00', '13:00:00', 'SALON 413NB'),
        ('VI ALIANZA SEMI-INTENSIVO 6', 'Modalidad Semi-intensiva', '', 'JUEVES', '14:00:00', '16:00:00', 'SALON 413NB'),
        ('VI ING. INDUSTRIAL GA', 'ING-ELE3', 'Yessy Coronel', 'JUEVES', '16:00:00', '18:00:00', 'SALON 413NB'),
        ('V ADM. NEGOCIOS AN', 'CEA-DINO', 'Danilo Enrique Torres Pimiento', 'JUEVES', '18:00:00', '21:00:00', 'SALON 413NB'),
        ('IV CONTADURIA AN', 'Fundamentos de Mercadeo', 'Luis Alfonso Grisales Domínguez', 'VIERNES', '18:00:00', '20:00:00', 'SALON 413NB'),
        ('IV ADM. NEGOCIOS AN', 'Fundamentos de Mercadeo', 'Luis Alfonso Grisales Domínguez', 'JUEVES', '20:00:00', '21:00:00', 'SALON 413NB'),
        ('X MEDICINA', 'Medicina Legal', 'Luz Marina Carvajal Bustos', 'VIERNES', '07:00:00', '10:00:00', 'SALON 413NB'),
        ('IV CONTADURIA AN', 'Estadística Inferencial', 'Rocío Mercedes Duarte Angarita', 'VIERNES', '20:00:00', '21:00:00', 'SALON 413NB'),
        ('IV ADM. NEGOCIOS AN', 'Estadística Inferencial', 'Rocío Mercedes Duarte Angarita', 'VIERNES', '20:00:00', '22:00:00', 'SALON 413NB'),
        ('V ALIANZA SABATINO 5', 'Modalidad Sabatina', '', 'SÁBADO', '09:00:00', '12:00:00', 'SALON 413NB'),
        
        # ── SALON 414NB (22 horarios) ──
        ('VII ADM. NEGOCIOS CD', 'Optativa II. Administración Estratégica', 'Luis Alfonso Grisales Domínguez', 'LUNES', '07:00:00', '10:00:00', 'SALON 414NB'),
        ('VII ADM. NEGOCIOS CD', 'Gestión de Exportaciones', 'Maribel Cerro Camera', 'LUNES', '10:00:00', '12:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-intensiva', '', 'LUNES', '14:00:00', '16:00:00', 'SALON 414NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', '', 'LUNES', '16:00:00', '18:00:00', 'SALON 414NB'),
        ('VIII CONTADURIA AN', 'CEA-OPT3', 'Juan Torres Palacio', 'LUNES', '18:00:00', '20:00:00', 'SALON 414NB'),
         ('VII ING. INDUSTRIAL GB', 'Modelos Estocásticos Matemáticos GB', 'Luis Carlos Acosta', 'LUNES', '20:00:00', '22:00:00', 'SALON 414NB'),
        
         ('V ADM. NEGOCIOS CD', 'Desarrollo e innovaciones de las organizaciones', 'Danilo Enrique Torres Pimiento', 'MARTES', '07:00:00', '10:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-intensiva', '', 'MARTES', '14:00:00', '16:00:00', 'SALON 414NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', '', 'MARTES', '16:00:00', '18:00:00', 'SALON 414NB'),
        ('VII ING. INDUSTRIAL GA', 'ING-ETIC', 'Mariluz Barrios', 'MARTES', '18:00:00', '20:00:00', 'SALON 414NB'),
        
        ('V ALIANZA SEMESTRAL 5', 'Modalidad Semestral', '', 'MIÉRCOLES', '11:00:00', '13:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-intensiva', '', 'MIÉRCOLES', '14:00:00', '16:00:00', 'SALON 414NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', '', 'MIÉRCOLES', '16:00:00', '18:00:00', 'SALON 414NB'),
        ('VII ING. INDUSTRIAL GA', 'Metodología de la Investigación', 'Agustín Vidal', 'MIÉRCOLES', '18:00:00', '20:00:00', 'SALON 414NB'),
        
        ('IV DERECHO B', 'DER-TPB1', '', 'JUEVES', '07:00:00', '09:00:00', 'SALON 414NB'),
        ('V ALIANZA SEMESTRAL 5', 'Modalidad Semestral', '', 'JUEVES', '11:00:00', '13:00:00', 'SALON 414NB'),
        ('VII ALIANZA SEMI-INTENSIVO 7', 'Modalidad Semi-intensiva', '', 'JUEVES', '14:00:00', '16:00:00', 'SALON 414NB'),
        ('IV ALIANZA SEMI-INTENSIVO 4', 'Modalidad Semi-intensiva', '', 'JUEVES', '16:00:00', '18:00:00', 'SALON 414NB'),
        ('VI CONTADURIA AN', 'CEA-IMRE', 'Castulo Antonio Maza Cabrera', 'JUEVES', '18:00:00', '20:00:00', 'SALON 414NB'),
        ('X ING. INDUSTRIAL GA', 'ING-EBI3', 'Alexander Parody', 'JUEVES', '20:00:00', '22:00:00', 'SALON 414NB'),
        
        ('X MEDICINA', 'CSA-GIOB', '', 'VIERNES', '07:00:00', '09:00:00', 'SALON 414NB'),
        ('ALIANZA SABATINO', 'Modalidad Sabatina', '', 'VIERNES', '09:00:00', '13:00:00', 'SALON 414NB'),
        ('VI CONTADURIA AN', 'Comercio y Negocios Globales', 'José Rafael Simancas Trujillo', 'VIERNES', '18:00:00', '20:00:00', 'SALON 414NB'),
        ('VI CONTADURIA AN', 'Administración Financiera', 'Winston Fontanilla Correa', 'VIERNES', '20:00:00', '21:00:00', 'SALON 414NB'),
        ('ALIANZA SABATINO', 'Modalidad Sabatina', '', 'SÁBADO', '08:00:00', '12:00:00', 'SALON 414NB'),
        
        
        # ── SALON 415NB (24 horarios) ─
        
        
        # -─ SALON 416NB (24 horarios) ──
        
        # -─ SALON 501NB (24 horarios) ──
        ("IV DERECHO A", "ELECTIVA LAW AT THE EDGE", "ALEXANDER GONZÁLEZ", "Lunes", "08:00", "10:00", "SALON 501NB"), 
        ("IV ALIANZA INTENSIVO 4", "Modalidad Intensiva", "", "Lunes", "14:00", "18:00", "SALON 501NB"), 
        ("VI CONTADURIA AN", "Presupuestos empresariales", "Freddy Alberto Mejía Torres", "Lunes", "18:00", "20:00", "SALON 501NB"), 
        ("VI CONTADURIA AN", "Auditoría aplicada", "", "Lunes", "20:00", "22:00", "SALON 501NB"), 
        
        ("I ADM. NEGOCIOS DD", "Ciclo básico contable", "", "Martes", "08:00", "10:00", "SALON 501NB"), 
        ("IV ALIANZA INTENSIVO 4", "Modalidad Intensiva", "", "Martes", "14:00", "18:00", "SALON 501NB"), 
        ("III ADM. NEGOCIOS AN/ III CONTADURIA AN", "Derecho laboral y seguridad social", "Farid Elias Amín De La Hoz", "Martes", "18:00", "20:00", "SALON 501NB"), 
        
        ("I ADM. NEGOCIOS DD", "Expresión verbal y escrita", "MONICA PATRICIA DE LA HOZ SILVA", "Miércoles", "07:00", "09:00", "SALON 501NB"), 
        ("I ADM. NEGOCIOS DD", "Fundamentos de negocios internacionales", "Yesenia Judith Barandica Angulo", "Miércoles", "09:00", "12:00", "SALON 501NB"), 
        ("IV ALIANZA INTENSIVO 4", "Modalidad Intensiva", "", "Miércoles", "16:00", "18:00", "SALON 501NB"), 
        ("III ADM. NEGOCIOS AN", "Sistemas de costeo", "GLORIA QUIJANO", "Miércoles", "19:00", "22:00", "SALON 501NB"), 
        
        ("I ADM. NEGOCIOS DD", "Fundamentos de administración", "Maribel Cerro Camera", "Jueves", "07:00", "10:00", "SALON 501NB"), 
        ("I ADM. NEGOCIOS DD", "Fundamentos de economía", "Marco Antonio Ariza Dau", "Jueves", "10:00", "12:00", "SALON 501NB"), 
        ("IV ALIANZA INTENSIVO 4", "Modalidad Intensiva", "", "Jueves", "14:00", "18:00", "SALON 501NB"), 
        ("III ADM. NEGOCIOS AN", "Presupuestos empresariales", "Rocío Mercedes Duarte Angarita", "Jueves", "18:00", "19:00", "SALON 501NB"),
        ("III ADM. NEGOCIOS AN", "Matemáticas financieras", "Ricardo Mena Torres", "Jueves", "19:00", "22:00", "SALON 501NB"), 
        ("III CONTADURIA AN", "Matemáticas financieras", "Ricardo Mena Torres", "Jueves", "19:00", "22:00", "SALON 501NB"), 
        
        ("VIII ING. SISTEMAS GA", "Práctica Empresarial", "ERICK JASSIR", "Viernes", "06:00", "09:00", "SALON 501NB"), 
        ("V ADM. NEGOCIOS CD", "Investigación de operaciones", "Boanerge Salas Muñoz", "Viernes", "09:00", "12:00", "SALON 501NB"), 
        ("IX MEDICINA", "Electiva Imagenología en clínicas y hospitales", "", "Viernes", "13:00", "15:00", "SALON 501NB"), 
        ("III ADM. NEGOCIOS AN", "Coyuntura económica nacional", "Yesenia Judith Barandica Angulo", "Viernes", "18:00", "20:00", "SALON 501NB"),
        ("III CONTADURIA AN", "Coyuntura económica nacional", "Yesenia Judith Barandica Angulo", "Viernes", "18:00", "20:00", "SALON 501NB"),  
        
        ("IX ING. SISTEMAS GA", "Gestión de Tecnología GA", "JOSE W. PENAGOS", "Sábado", "06:00", "09:00", "SALON 501NB"),

        # --- SALON 502NB (24 horarios) ──
        
        ("I ING. SISTEMAS DE", "Física Mecánica y Lab. GA", "ANDRES BERMUDEZ", "Lunes", "07:00", "09:00", "SALON 502NB"), 
        ("V ALIANZA INTENSIVO 5", "Modalidad Intensiva", "", "Lunes", "14:00", "18:00", "SALON 502NB"), 
        ("V ING. INDUSTRIAL GA", "Diseño de productos y servicios GA", "ERICK JASSIR", "Lunes", "19:00", "22:00", "SALON 502NB"), 
        ("I ADM. NEGOCIOS DD", "Fundamentos de matemáticas", "Boanerge José Salas Muñoz", "Martes", "08:00", "10:00", "SALON 502NB"), 
        ("I ADM. NEGOCIOS DD", "Emprendimiento e innovación", "José Rafael Simancas Trujillo", "Martes", "10:00", "12:00", "SALON 502NB"), 
        ("V ALIANZA INTENSIVO 5", "Modalidad Intensiva", "", "Martes", "14:00", "18:00", "SALON 502NB"), 
        ("III ADM. NEGOCIOS AN", "Dirección y liderazgo", "José Rafael Simancas Trujillo", "Martes", "20:00", "22:00", "SALON 502NB"), 
        ("III CONTADURIA CD", "Ciclo de egresos y administración de inventarios", "Rafael Francisco Nuñez Suarez", "Miércoles", "10:00", "12:00", "SALON 502NB"), 
        ("V ALIANZA INTENSIVO 5", "Modalidad Intensiva", "", "Miércoles", "14:00", "18:00", "SALON 502NB"), ("I DERECHO F", "INTRODUCCIÓN AL DERECHO", "RICARDO MÉNDEZ", "Jueves", "06:00", "08:00", "SALON 502NB"), ("I DERECHO F", "HISTORIA DE LA FILOSOFÍA", "YADIRA GARCÍA", "Jueves", "09:00", "12:00", "SALON 502NB"), ("", "Modalidad: Intensivo Step 5", "ALIANZA CANADIENSE", "Jueves", "14:00", "18:00", "SALON 502NB"), 
        ("I DERECHO AN", "CEA-ELE1", "PEDRO ARIAS", "Jueves", "18:00", "20:00", "SALON 502NB"), 
        ("III ADM. NEGOCIOS CD", "Presupuestos empresariales", "Arnulfo Rico Camacho", "Viernes", "07:00", "10:00", "SALON 502NB"), 
        ("I ING. SISTEMAS DE", "Lógica Matemática GB", "ANDRES BERMUDEZ", "Viernes", "10:00", "12:00", "SALON 502NB"), 
        ("IX MEDICINA", "Electiva II: Atencion al adulto mayor", "Fanny Lambraño", "Viernes", "14:00", "16:00", "SALON 502NB"), 
        ("I DERECHO AN", "HISTORIA DE LA FILOSOFÍA", "ALEXANDER GONZÁLEZ", "Viernes", "18:00", "19:00", "SALON 502NB"), 
        ("VII ALIANZA SABATINO 7", "Modalidad Sabatina", "", "Sábado", "08:00", "12:00", "SALON 502NB"),
        
        # --- SALON 503NB (24 horarios) ──
        ("III DERECHO AB", "CIVIL BIENES", "CARLOS ESPINEL", "Lunes", "06:00", "08:00", "SALON 503NB"),
        ("I DERECHO D", "INTRODUCCIÓN AL DERECHO", "OONA HERNÁNDEZ", "Lunes", "08:00", "10:00", "SALON 503NB"),
        ("I DERECHO D", "DERECHO ROMANO", "TATIANA POLO", "Lunes", "10:00", "13:00", "SALON 503NB"),
        ("I ADM. NEGOCIOS AN", "Fundamentos de administración", "Maribel Cerro Camera", "Lunes", "18:00", "21:00", "SALON 503NB"),
        ("II CONTADURIA AN", "Fundamentos de administración", "Maribel Cerro Camera", "Lunes", "18:00", "21:00", "SALON 503NB"),
        ("III DERECHO AB", "CIVIL BIENES", "CARLOS ESPINEL", "Martes", "06:00", "08:00", "SALON 503NB"),
        ("III DERECHO B", "INVESTIGACIÓN I", "PATRICIA MORRIS", "Martes", "08:00", "10:00", "SALON 503NB"),
        ("VII ADM. NEGOCIOS FN", "OPTATIVA II: INNOVACIÓN Y TRANSFORMACIÓN DIGITAL EN EMPRESAS GLOBALES", "Danilo Enrique Torres Pimiento", "Martes", "18:00", "19:00", "SALON 503NB"),
        ("VIII CONTADURIA AN", "Ética profesional", "Milagros Del Carmen Villasmil Molero", "Martes", "20:00", "22:00", "SALON 503NB"),
        ("I DERECHO C", "TEORÍA DEL ESTADO", "LINDA NADER", "Miércoles", "08:00", "10:00", "SALON 503NB"),
        ("I DERECHO C", "ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA", "YADIRA GARCÍA", "Miércoles", "10:00", "12:00", "SALON 503NB"),
        ("VIII CONTADURIA AN", "Impuestos territoriales y procedimiento tributario", "Cástulo Antonio Maza Cabrera", "Miércoles", "19:00", "22:00", "SALON 503NB"),
        ("III ADM. NEGOCIOS CD", "Estadística descriptiva", "Antonio Julio Castilla Romero", "Jueves", "09:00", "12:00", "SALON 503NB"),
        ("VIII ADM. NEGOCIOS AN", "Ética profesional y responsabilidad social empresarial", "Milagros Del Carmen Villasmil Molero", "Jueves", "18:00", "20:00", "SALON 503NB"),
        ("VIII ADM. NEGOCIOS AN", "Mercado de capitales", "Winston Fontalvo Cerpa", "Jueves", "20:00", "22:00", "SALON 503NB"),
        ("III DERECHO AD", "INVESTIGACIÓN I", "ALEJANDRO BLANCO", "Viernes", "06:00", "08:00", "SALON 503NB"),
        ("I DERECHO C", "DERECHO ROMANO", "TATIANA POLO", "Viernes", "08:00", "11:00", "SALON 503NB")


        
        
        # --- SALON 702NB (24 horarios) ─
        ("CLASES POSGRADOS", "POSGRADO", "", "Viernes", "14:00:00", "22:00:00", "SALON 702NB"), 
        ("CLASES POSGRADOS", "POSGRADO", "", "Sábado", "08:00:00", "16:00:00", "SALON 702NB"),
        # --- SALON 703NB (24 horarios) ──
        ("CLASES POSGRADOS", "POSGRADO", "", "Viernes", "14:00:00", "22:00:00", "SALON 703NB"), 
        ("CLASES POSGRADOS", "POSGRADO", "", "Sábado", "08:00:00", "16:00:00", "SALON 703NB"),
        # --- SALON 704NB (24 horarios) ──
        ("CLASES POSGRADOS", "POSGRADO", "", "Viernes", "14:00:00", "22:00:00", "SALON 704NB"), 
        ("CLASES POSGRADOS", "POSGRADO", "", "Sábado", "08:00:00", "16:00:00", "SALON 704NB"),
        # --- SALON 709NB (24 horarios) ──
        ("CLASES POSGRADOS", "POSGRADO", "", "Viernes", "14:00:00", "22:00:00", "SALON 709NB"), 
        ("CLASES POSGRADOS", "POSGRADO", "", "Sábado", "08:00:00", "16:00:00", "SALON 709NB"),
        # --- SALON 710NB (24 horarios) ──
        ("CLASES POSGRADOS", "POSGRADO", "", "Viernes", "14:00:00", "22:00:00", "SALON 710NB"), 
        ("CLASES POSGRADOS", "POSGRADO", "", "Sábado", "08:00:00", "16:00:00", "SALON 710NB"),
        # --- SALON 711NB (24 horarios) ──
        ("VIII MEDICINA", "Cirugía Teoría", "", "Lunes", "14:00", "16:00", "SALON 711NB"),
        ("VIII MEDICINA", "CSA-SSTM", "JORGE RIVERA", "Martes", "13:00", "16:00", "SALON 711NB"),
        ("VII MEDICINA", "CSA-MEIN", "", "Martes", "17:00", "20:00", "SALON 711NB"),
        ("VIII MEDICINA", "Especialidades Quirúrgicas", "", "Miércoles", "13:00", "15:00", "SALON 711NB"),
        ("VIII MEDICINA", "CSA-SSTM", "JORGE RIVERA", "Jueves", "13:00", "14:00", "SALON 711NB"),
        ("VII MEDICINA", "Psiquiatría", "MILENA RUBIO", "Jueves", "17:00", "19:00", "SALON 711NB"),
        ("VII MEDICINA", "CSA-MEIN", "", "Jueves", "19:00", "21:00", "SALON 711NB"),
        ("VIII MEDICINA", "CSA-CIRU", "", "Viernes", "13:00", "16:00", "SALON 711NB"),
        ("V CONTADURIA AN", "Ciclo de Estados Financieros", "Jesús María Rodríguez Polo", "Viernes", "18:00", "20:00", "SALON 711NB"),
        ("V CONTADURIA AN", "Costos Gerenciales", "Yuleida Ariza Angarita", "Viernes", "20:00", "22:00", "SALON 711NB"),
        # ── SALON 713NB (24 horarios) ──
        ("CLASES POSGRADOS", "POSGRADO", "", "Viernes", "14:00:00", "22:00:00", "SALON 713NB"), 
        ("CLASES POSGRADOS", "POSGRADO", "", "Sábado", "08:00:00", "16:00:00", "SALON 713NB"),
        # ── SALON 714NB (24 horarios) ──
        ("CLASES POSGRADOS", "POSGRADO", "", "Viernes", "14:00:00", "22:00:00", "SALON 714NB"), 
        ("CLASES POSGRADOS", "POSGRADO", "", "Sábado", "08:00:00", "16:00:00", "SALON 714NB"),
        # ── SALON 717NB (24 horarios) ──
        ("IV ING. INDUSTRIAL GA", "Gerencia Estratégica", "ANDREA CORONADO", "Viernes", "18:00", "21:00", "SALON 717NB"),
        # ── SALON 718NB (24 horarios) ──
        ("VII ING. INDUSTRIAL GA", "Constitución Política GA", "MARILUZ BARROS", "Viernes", "18:00", "20:00", "SALON 718NB"),
        
       
        
        
       
        
        
        
   
   
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
        programa_posgrado = Programa.objects.get(nombre='Posgrado')
        
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
        elif 'POSGRADO' in grupo_upper:
            return programa_posgrado
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
        'I DERECHO F':                 'DERECHO F',
        'I DERECHO AN':                'DERECHO AN',
        'I DERECHO AN-E':              'DERECHO AN-E',
        'I DERECHO AN-1E':             'DERECHO AN-1E',
        # Semestre II
        'II DERECHO A':                'DERECHO A',
        'II DERECHO B':                'DERECHO B',
        'II DERECHO C':                'DERECHO C',
        'II DERECHO D':                'DERECHO D',
        # Semestre III
        'III DERECHO A':               'DERECHO A',
        'III DERECHO B':               'DERECHO B',
        'III DERECHO C':               'DERECHO C',
        'III DERECHO D':               'DERECHO D',
        'III DERECHO AB':              'DERECHO AB',
        'III DERECHO AD':              'DERECHO AD',

        # Semestre IV
        'IV DERECHO A':                'DERECHO A',
        'IV DERECHO B':                'DERECHO B',
        'IV DERECHO C':                'DERECHO C',

        # Semestre V
        'V DERECHO A':                 'DERECHO A',
        'V DERECHO B':                 'DERECHO B',
        'V DERECHO C':                 'DERECHO C',
        'V DERECHO D':                 'DERECHO D',

        # Semestre VI
        'VI DERECHO A':                'DERECHO A',
        'VI DERECHO B':                'DERECHO B',
        'VI DERECHO C':                'DERECHO C',

        # Semestre VII
        'VII DERECHO A':               'DERECHO A',
        'VII DERECHO B':               'DERECHO B',
        'VII DERECHO C':               'DERECHO C',
        'VII DERECHO D':               'DERECHO D',

        # Semestre VIII
        'VIII DERECHO A':              'DERECHO A',
        'VIII DERECHO B':              'DERECHO B',
        'VIII DERECHO C':              'DERECHO C',

        # Semestre IX
        'IX DERECHO A':                'DERECHO A',
        'IX DERECHO B':                'DERECHO B',
        'IX DERECHO C':                'DERECHO C',
        'IX DERECHO AN':               'DERECHO AN',

        # Semestre X
        'X DERECHO A':                 'DERECHO A',
        'X DERECHO B':                 'DERECHO B',
        'X DERECHO C':                 'DERECHO C',

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
            asignatura = Asignatura.objects.filter(
                Q(nombre__iexact=materia_nombre.strip()) | Q(codigo__iexact=materia_nombre.strip())
            ).first()
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
                if grupo_nombre_resuelto.strip().upper().startswith('DERECHO '):
                    # VALIDACIÓN REFORZADA: Buscar grupo con nombre Y semestre
                    if semestre_extraido:
                        # Construir el nombre completo con número romano (ej: "V DERECHO A")
                        romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
                        nombre_completo = f'{romanos[semestre_extraido-1]} {grupo_nombre_resuelto.strip()}'
                        
                        grupo = Grupo.objects.filter(
                            periodo=periodo,
                            programa=programa_derecho,
                            nombre__iexact=nombre_completo,
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

                    # Primero intentar buscar por nombre exacto
                    grupo = Grupo.objects.filter(
                        periodo=periodo,
                        programa=programa_detectado,
                        nombre__iexact=grupo_nombre_resuelto.strip()
                    ).first()

                    # Si no se encuentra, buscar por programa y semestre
                    if not grupo:
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
        ('Sin grupo especificado', 'Psicología Evolutiva G1', 'SALON 102B', 'MARTES', '16:00:00', '17:00:00', 'SALON 102B'),
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
        ('Sin grupo especificado', 'Electiva: Ingles Avanzado III', 'SALON  103B', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Evaluación y Diagnóstico                 GA', 'Roberto Rebolledo', 'LUNES', '12:00:00', '13:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Microbiología Industrial', 'Marianella  Suárez', 'MARTES', '07:00:00', '08:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Morfo fisiología l (Práctica)', 'GB', 'VIERNES', '09:00:00', '10:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Ocupación y movimiento corporal G1', 'Martha Mendihueta', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 103B'),
        ('Sin grupo especificado', 'Procesos Quirúrgicos', 'en Oftalmología', 'LUNES', '15:00:00', '16:00:00', 'SALON 103B'),

        # ── SALON 104B (21 horarios) ──
        ('1 semestre grupo D', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 104B'),
        ('II MEDICINA', 'Electiva  complementaria 1 : Inteligencia emocional', '104B', 'VIERNES', '11:00:00', '12:00:00', 'SALON 104B'),
        ('II Medicina', 'Electiva Cuidados Basicos', 'SALON  104B', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 104B'),
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
        ('Sin grupo especificado', 'Introducción a las ciencias ómicas                                 D: Cristian Cadena', 'SALON: 104B', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 104B'),
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
        ('Sin grupo especificado', 'Farmacología y Anestesia', 'SALON 105B', 'JUEVES', '10:00:00', '11:00:00', 'SALON 105B'),
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
        ('Sin grupo especificado', 'FARMACOLOGIA Y TOXICOLOGIA VII. LILIANA CARRANZA', 'SALON 107B', 'LUNES', '14:00:00', '15:00:00', 'SALON 107B'),
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
        ('Sin grupo especificado', 'Procesos Industriales Teoría / Javier Duran', 'SALON 104B', 'VIERNES', '15:00:00', '16:00:00', 'SALON 203B'),
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
        ('Sin grupo especificado', 'Fisiología Animal y Vegetal Arleth Lopez', 'SALON 206B', 'LUNES', '14:00:00', '15:00:00', 'SALON 301B'),
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
        ('Sin grupo especificado', 'Optativa II: Diagnóstico Forense                         D: Miriam Linero', 'SALON: 303B', 'JUEVES', '16:00:00', '17:00:00', 'SALON 303B'),
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
        ('Sin grupo especificado', 'Intervención en fisioterapia III GA', 'SALON 304B', 'JUEVES', '14:00:00', '15:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Morfo fisiología II- Teoría', 'Tatiana Gómez', 'VIERNES', '11:00:00', '12:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Optativa A: Micología Avanzada', 'Gloria Muñoz', 'MARTES', '13:00:00', '14:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Procesos Qcos. Cirugía Plástica', 'Leidy Gómez', 'MARTES', '11:00:00', '12:00:00', 'SALON 304B'),
        ('Sin grupo especificado', 'Proyecto de Investigación II', 'Laura Ardila (TC)', 'VIERNES', '07:00:00', '08:00:00', 'SALON 304B'),

        # ── SALON 305B (18 horarios) ──
        ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Biomecánica teoría', 'GA', 'MARTES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'CALIDAD EN SERVICIOS DE SALUD', 'María Inés López', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Discapacidad G1', 'Yoly Yepes', 'LUNES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Electiva de profundización I: Fisioterapia en enfermedades crónicas - Laura Ardila', 'SALON 305B', 'MARTES', '16:00:00', '17:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Evaluación y Diagnóstico GB', 'Julia Andrade', 'JUEVES', '11:00:00', '12:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Farmacología y Anestesia', 'SALON 105B', 'MARTES', '14:00:00', '15:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Intervención en Fisioterapia l GB', 'Nobis de la Cruz', 'JUEVES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Intervención en Ft II', 'Yadira Barrios', 'LUNES', '11:00:00', '12:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Intervención en Ft II GA', 'GA 205B', 'LUNES', '07:00:00', '08:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Metodología de la investigación   G1', 'Laura Ardila', 'MARTES', '07:00:00', '08:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Modalidades Físicas', 'GA', 'JUEVES', '14:00:00', '15:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Morfo fisiología l (Práctica)', 'GB', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'PRACTICA HOSPITALARIA III', 'SEMINARIO TEORICO PRACTICO', 'LUNES', '16:00:00', '17:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Proyección a la comunidad TEORÍA D: Bryan Dominguéz SALON: 305B', 'VI BACTERIOLOGÍA', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'Práctica Administrativa Teoría', 'Lorena Herrera', 'VIERNES', '09:00:00', '10:00:00', 'SALON 305B'),
        ('Sin grupo especificado', 'SocioAnatropologia', 'SALON 305B', 'MARTES', '11:00:00', '12:00:00', 'SALON 305B'),
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
            
            # Primero intentar encontrar por nombre o código
            try:
                asignatura = Asignatura.objects.filter(
                    Q(nombre__iexact=materia_nombre) | Q(codigo__iexact=materia_nombre)
                ).first()
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

