"""
Seeder de relaciones Asignatura-Programa.
Generado a partir de asignaturas_con_codigos.csv
"""

from asignaturas.models import Asignatura, AsignaturaPrograma
from programas.models import Programa


def create_asignaturas_programa(stdout, style):
    """Crear relaciones entre asignaturas y programas con semestre y componente formativo"""
    stdout.write('  → Creando relaciones asignatura-programa...')
    stdout.write('     Este proceso puede tomar varios segundos...')
    
    # Formato: (nombre_programa, codigo_asignatura, semestre, componente_formativo)
    relaciones_data = _get_all_relaciones()
    
    created_count = 0
    skipped_count = 0
    
    for nombre_programa, codigo_asignatura, semestre, componente in relaciones_data:
        try:
            programa = Programa.objects.get(nombre=nombre_programa)
            asignatura = Asignatura.objects.get(codigo=codigo_asignatura)
            
            _, created = AsignaturaPrograma.objects.get_or_create(
                programa=programa,
                asignatura=asignatura,
                defaults={
                    'semestre': semestre,
                    'componente_formativo': componente
                }
            )
            if created:
                created_count += 1
        except Programa.DoesNotExist:
            stdout.write(style.WARNING(f'    ! Programa no encontrado: {nombre_programa}'))
            skipped_count += 1
        except Asignatura.DoesNotExist:
            stdout.write(style.WARNING(f'    ! Asignatura no encontrada: {codigo_asignatura}'))
            skipped_count += 1
    
    total = len(relaciones_data)
    stdout.write(style.SUCCESS(f'    ✓ Relaciones procesadas: {created_count} nuevas, {skipped_count} omitidas, {total} totales'))


def _get_all_relaciones():
    """Retorna todas las relaciones asignatura-programa basadas en el CSV"""
    return [
        # Administración
        ('Microbiología', 'CSA-ADMI', 7, 'profesional'),
        
        # Administración Financiera
        ('Contaduría Pública', 'CEA-ADFI', 6, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-ADFI', 4, 'profesional'),
        
        # Administración I
        ('Instrumentación Quirúrgica', 'CSA-ADM1', 6, 'profesional'),
        
        # Administración II
        ('Instrumentación Quirúrgica', 'CSA-ADM2', 7, 'profesional'),
        
        # Administración en Salud
        ('Fisioterapia', 'CSA-ADSA', 5, 'profesional'),
        
        # Administración en Salud II
        ('Medicina', 'CSA-ADSI', 10, 'profesional'),
        
        # Administración y Planeación en Salud I
        ('Medicina', 'CSA-APSI', 9, 'profesional'),
        
        # Administración y SSS
        ('Bacteriología', 'CSA-ASSS', 6, 'profesional'),
        
        # Administrativo Colombiano
        ('Derecho', 'DER-ADCO', 6, 'profesional'),
        
        # Administrativo General
        ('Derecho', 'DER-ADGE', 5, 'profesional'),
        
        # Análisis Físico-Químico
        ('Microbiología', 'CSA-AFIQ', 4, 'profesional'),
        
        # Argumentación Jurídica
        ('Derecho', 'DER-ARJR', 6, 'profesional'),
        
        # Arquitectura Empresarial
        ('Ingeniería de Sistemas', 'ING-AREM', 8, 'profesional'),
        
        # Arquitectura de Computadores
        ('Ingeniería de Sistemas', 'ING-ARCO', 3, 'profesional'),
        
        # Arquitectura de Información
        ('Ingeniería de Sistemas', 'ING-ARIN', 6, 'profesional'),
        
        # Aseguramiento y Fundamentos de Control
        ('Contaduría Pública', 'CEA-AFCO', 5, 'profesional'),
        
        # Auditoría Aplicada
        ('Contaduría Pública', 'CEA-AUAP', 6, 'profesional'),
        
        # Auditoría de Sistemas
        ('Contaduría Pública', 'CEA-AUSI', 8, 'profesional'),
        
        # Bacteriología Clínica
        ('Bacteriología', 'CSA-BACL', 6, 'profesional'),
        
        # Bienes
        ('Derecho', 'DER-BIEN', 3, 'profesional'),
        
        # Bioestadística
        ('Bacteriología', 'CSA-BIES', 2, 'básica'),
        ('Fisioterapia', 'CSA-BIES', 3, 'básica'),
        
        # Bioestadística e Informática
        ('Instrumentación Quirúrgica', 'CSA-BEIN', 2, 'básica'),
        
        # Biofísica
        ('Instrumentación Quirúrgica', 'CSA-BIOF', 1, 'básica'),
        ('Bacteriología', 'CSA-BIOF', 1, 'básica'),
        ('Fisioterapia', 'CSA-BIOF', 1, 'básica'),
        ('Medicina', 'CSA-BIOF', 1, 'básica'),
        
        # Bioinformática
        ('Microbiología', 'CSA-BINF', 4, 'profesional'),
        
        # Biología
        ('Microbiología', 'CSA-BIO', 1, 'básica'),
        ('Bacteriología', 'CSA-BIO', 1, 'básica'),
        ('Medicina', 'CSA-BIO', 1, 'básica'),
        
        # Biología Molecular
        ('Microbiología', 'CSA-BIMO', 3, 'profesional'),
        ('Bacteriología', 'CSA-BIMO', 5, 'profesional'),
        ('Medicina', 'CSA-BIMO', 3, 'básica'),
        
        # Biología de Microorganismos
        ('Microbiología', 'CSA-BIMI', 3, 'profesional'),
        
        # Biología de los Microorganismos
        ('Bacteriología', 'CSA-BLMI', 3, 'profesional'),
        
        # Biología e Histología
        ('Instrumentación Quirúrgica', 'CSA-BIHI', 1, 'básica'),
        ('Fisioterapia', 'CSA-BIHI', 1, 'básica'),
        
        # Biomecánica
        ('Fisioterapia', 'CSA-BIOM', 2, 'básica'),
        
        # Bioquímica
        ('Microbiología', 'CSA-BIOQ', 2, 'básica'),
        ('Instrumentación Quirúrgica', 'CSA-BIOQ', 2, 'básica'),
        ('Bacteriología', 'CSA-BIOQ', 2, 'básica'),
        ('Fisioterapia', 'CSA-BIOQ', 2, 'básica'),
        ('Medicina', 'CSA-BIOQ', 2, 'básica'),
        
        # Bioquímica Microbiana
        ('Microbiología', 'CSA-BQMI', 3, 'básica'),
        
        # Biotecnología
        ('Microbiología', 'CSA-BIOT', 6, 'profesional'),
        ('Bacteriología', 'CSA-BIOT', 7, 'profesional'),
        
        # Biotecnología de la Salud
        ('Bacteriología', 'CSA-BISA', 7, 'profesional'),
        
        # Bioética
        ('Microbiología', 'CSA-BIET', 2, 'básica'),
        ('Medicina', 'CSA-BIET', 6, 'humanística'),
        
        # Calidad Microbiológica y Sanitaria
        ('Bacteriología', 'CSA-CAMS', 5, 'profesional'),
        
        # Calidad en Servicios de Salud
        ('Instrumentación Quirúrgica', 'CSA-CASS', 5, 'profesional'),
        
        # Ciclo Básico Contable
        ('Contaduría Pública', 'CEA-CBCO', 1, 'básica'),
        
        # Ciclo de Egresos y Adm. de Inventarios
        ('Contaduría Pública', 'CEA-CEAI', 3, 'profesional'),
        
        # Ciclo de Estados Financieros
        ('Contaduría Pública', 'CEA-CEFI', 5, 'profesional'),
        
        # Ciclo de Ingresos
        ('Contaduría Pública', 'CEA-CIIN', 2, 'básica'),
        
        # Ciclo de Inversiones y Financiación
        ('Contaduría Pública', 'CEA-CIIF', 4, 'profesional'),
        
        # Ciencia Política
        ('Derecho', 'DER-CIPL', 2, 'básica'),
        
        # Cinesiopatología
        ('Fisioterapia', 'CSA-CIPA', 3, 'profesional'),
        
        # Cirugía (Sem. XI-XII considerado como 11-12)
        ('Medicina', 'CSA-CIRU', 11, 'profesional'),
        
        # Cirugía General
        ('Medicina', 'CSA-CIRG', 8, 'profesional'),
        
        # Civil General y Personas
        ('Derecho', 'DER-CGPE', 2, 'básica'),
        
        # Comercio y Negocios Globales
        ('Contaduría Pública', 'CEA-CONG', 6, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-CONG', 5, 'profesional'),
        
        # Competencias Comunicativas I
        ('Instrumentación Quirúrgica', 'CSA-CCI1', 1, 'humanística'),
        
        # Competencias Comunicativas II
        ('Instrumentación Quirúrgica', 'CSA-CCI2', 2, 'humanística'),
        
        # Competencias de Aprendizaje y Comunicación
        ('Ingeniería de Sistemas', 'ING-CPAC', 1, 'humanística'),
        
        # Constitucional Colombiano
        ('Derecho', 'DER-COCO', 3, 'profesional'),
        
        # Constitución Nacional
        ('Instrumentación Quirúrgica', 'CSA-CONA', 4, 'humanística'),
        
        # Constitución Política
        ('Microbiología', 'CSA-CPOL', 2, 'humanística'),
        ('Instrumentación Quirúrgica', 'CSA-CPOL', 4, 'humanística'),
        ('Bacteriología', 'CSA-CPOL', 2, 'humanística'),
        ('Fisioterapia', 'CSA-CPOL', 4, 'humanística'),
        ('Ingeniería de Sistemas', 'CSA-CPOL', 4, 'humanística'),
        ('Medicina', 'CSA-CPOL', 7, 'humanística'),
        
        # Consultorio Jurídico I
        ('Derecho', 'DER-CJU1', 7, 'profesional'),
        
        # Consultorio Jurídico II
        ('Derecho', 'DER-CJU2', 8, 'profesional'),
        
        # Consultorio Jurídico III
        ('Derecho', 'DER-CJU3', 9, 'profesional'),
        
        # Consultorio Jurídico IV
        ('Derecho', 'DER-CJU4', 10, 'profesional'),
        
        # Contabilidad Ambiental
        ('Contaduría Pública', 'CEA-COAM', 4, 'profesional'),
        
        # Contabilidad Financiera
        ('Administración de Negocios Internacionales', 'CEA-COFI', 2, 'profesional'),
        
        # Contabilidad y Finanzas Públicas
        ('Contaduría Pública', 'CEA-COFP', 7, 'profesional'),
        
        # Contratos
        ('Derecho', 'DER-CONT', 7, 'profesional'),
        
        # Control de Infecciones y Promoción de la Salud
        ('Instrumentación Quirúrgica', 'CSA-CIPS', 3, 'profesional'),
        
        # Control y Aprendizaje Motor
        ('Fisioterapia', 'CSA-CAPM', 4, 'profesional'),
        
        # Correlación Clínica
        ('Bacteriología', 'CSA-COCL', 7, 'profesional'),
        
        # Costos Gerenciales
        ('Contaduría Pública', 'CEA-COGE', 5, 'profesional'),
        
        # Coyuntura Económica Internacional
        ('Administración de Negocios Internacionales', 'CEA-COEI', 4, 'profesional'),
        
        # Coyuntura Económica Nacional
        ('Contaduría Pública', 'CEA-COEN', 3, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-COEN', 3, 'profesional'),
        
        # Criminalística y Ciencias Forenses
        ('Derecho', 'DER-CRCF', 8, 'profesional'),
        
        # Criminología y Política Criminal
        ('Derecho', 'DER-CRPC', 7, 'profesional'),
        
        # Cuidados Básicos en Salud
        ('Instrumentación Quirúrgica', 'CSA-CUBS', 3, 'profesional'),
        
        # Cálculo
        ('Microbiología', 'CEA-CALC', 2, 'básica'),
        ('Administración de Negocios Internacionales', 'CEA-CALC', 2, 'básica'),
        
        # Cálculo Diferencial
        ('Ingeniería de Sistemas', 'ING-CALD', 1, 'básica'),
        
        # Cálculo I
        ('Contaduría Pública', 'CEA-CAL1', 2, 'básica'),
        
        # Cálculo Integral
        ('Ingeniería de Sistemas', 'ING-CALI', 2, 'básica'),
        
        # Cálculo Multivariado y Vectorial
        ('Ingeniería de Sistemas', 'ING-CMVC', 3, 'básica'),
        
        # Cátedra Unilibrista
        ('Microbiología', 'CSA-CATU', 1, 'humanística'),
        ('Instrumentación Quirúrgica', 'CSA-CATU', 1, 'humanística'),
        ('Bacteriología', 'CSA-CATU', 1, 'humanística'),
        ('Contaduría Pública', 'CSA-CATU', 1, 'humanística'),
        ('Derecho', 'CSA-CATU', 1, 'humanística'),
        ('Fisioterapia', 'CSA-CATU', 1, 'humanística'),
        ('Ingeniería de Sistemas', 'CSA-CATU', 1, 'humanística'),
        ('Administración de Negocios Internacionales', 'CSA-CATU', 1, 'humanística'),
        ('Medicina', 'CSA-CATU', 1, 'humanística'),
        
        # Cátedra de Sostenibilidad
        ('Ingeniería de Sistemas', 'ING-CASO', 4, 'profesional'),
        
        # Derecho Ambiental
        ('Derecho', 'DER-DEAM', 10, 'profesional'),
        
        # Derecho Comercial
        ('Contaduría Pública', 'CEA-DECO', 2, 'básica'),
        ('Administración de Negocios Internacionales', 'CEA-DECO', 2, 'básica'),
        
        # Derecho Comercial General
        ('Derecho', 'DER-DCGE', 6, 'profesional'),
        
        # Derecho Comercial Internacional
        ('Administración de Negocios Internacionales', 'CEA-DCIN', 5, 'profesional'),
        
        # Derecho Internacional Privado
        ('Derecho', 'DER-DIPR', 5, 'profesional'),
        
        # Derecho Internacional Público
        ('Derecho', 'DER-DIPU', 4, 'profesional'),
        
        # Derecho Laboral y Seguridad Social
        ('Contaduría Pública', 'CEA-DLSS', 3, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-DLSS', 3, 'profesional'),
        
        # Derecho Romano
        ('Derecho', 'DER-DERO', 1, 'básica'),
        
        # Derechos Humanos y DIH
        ('Derecho', 'DER-DHDH', 2, 'básica'),
        
        # Desarrollo e Innovación de las Organizaciones
        ('Administración de Negocios Internacionales', 'CEA-DINO', 5, 'profesional'),
        
        # Dirección y Liderazgo
        ('Administración de Negocios Internacionales', 'CEA-DILI', 3, 'profesional'),
        
        # Discapacidad
        ('Fisioterapia', 'CSA-DISC', 4, 'profesional'),
        
        # Diseño Experimental
        ('Microbiología', 'CSA-DIEX', 5, 'profesional'),
        
        # Diseño en Ingeniería
        ('Ingeniería de Sistemas', 'ING-DSIN', 3, 'profesional'),
        
        # Ecología Microbiana
        ('Microbiología', 'CSA-ECMI', 5, 'profesional'),
        
        # Economía Colombiana
        ('Derecho', 'DER-ECCO', 2, 'básica'),
        
        # Economía de Empresa
        ('Contaduría Pública', 'CEA-ECEM', 2, 'básica'),
        ('Administración de Negocios Internacionales', 'CEA-ECEM', 2, 'básica'),
        
        # Ecuaciones Diferenciales
        ('Ingeniería de Sistemas', 'ING-ECDI', 4, 'básica'),
        
        # Electiva Complementaria (Medicina)
        ('Medicina', 'CSA-ELCM', 2, 'electiva'),
        
        # Electiva Complementaria I
        ('Instrumentación Quirúrgica', 'CSA-ELC1', 3, 'electiva'),
        ('Bacteriología', 'CSA-ELC1', 2, 'electiva'),
        ('Fisioterapia', 'CSA-ELC1', 2, 'electiva'),
        
        # Electiva Complementaria II
        ('Bacteriología', 'CSA-ELC2', 3, 'electiva'),
        ('Fisioterapia', 'CSA-ELC2', 4, 'electiva'),
        
        # Electiva Complementaria III
        ('Bacteriología', 'CSA-ELC3', 4, 'electiva'),
        ('Fisioterapia', 'CSA-ELC3', 6, 'electiva'),
        
        # Electiva Complementaria IV
        ('Fisioterapia', 'CSA-ELC4', 8, 'electiva'),
        
        # Electiva I CEA-ELE1
        ('Microbiología', 'CEA-ELE1', 1, 'electiva'),
        ('Contaduría Pública', 'CEA-ELE1', 1, 'electiva'),
        #Electiva I CSA-ELE1
        ('Ingeniería de Sistemas', 'CSA-ELE1', 2, 'electiva'),
        ('Administración de Negocios Internacionales', 'CSA-ELE1', 6, 'electiva'),
        
        # Electiva II
        ('Microbiología', 'CEA-ELE2', 3, 'electiva'),
        ('Contaduría Pública', 'CEA-ELE2', 5, 'electiva'),
        ('Derecho', 'CEA-ELE2', 3, 'electiva'),
        ('Ingeniería de Sistemas', 'CEA-ELE2', 4, 'electiva'),
        ('Administración de Negocios Internacionales', 'CEA-ELE2', 7, 'electiva'),
        
        # Electiva III
        ('Microbiología', 'CEA-ELE3', 7, 'electiva'),
        ('Contaduría Pública', 'CEA-ELE3', 8, 'electiva'),
        ('Derecho', 'CEA-ELE3', 4, 'electiva'),
        ('Ingeniería de Sistemas', 'CEA-ELE3', 6, 'electiva'),
        ('Administración de Negocios Internacionales', 'CEA-ELE3', 8, 'electiva'),
        
        #ING-ELLE Electiva II (Emprendimiento y Liderazgo)
        ('Ingeniería Industrial', 'ING-ELLE', 3, 'electiva'),

        #CEA-ABEN ELECTIVA: ADVANCED BUSINESS ENGLISH

        ('Administración de Negocios Internacionales', 'CEA-ABEN', 6, 'electiva'),
        ('Administración de Negocios Internacionales', 'CEA-ABEN', 7, 'electiva'),

        # Electiva IV
        ('Derecho', 'DER-ELE4', 4, 'electiva'),
        
        # Electiva Profesional I
        ('Medicina', 'CSA-EPR1', 8, 'electiva'),
        
        # Electiva Profesional II
        ('Medicina', 'CSA-EPR2', 9, 'electiva'),
        
        # Electiva Profesional III (Sem. XI-XII)
        ('Medicina', 'CSA-EPR3', 11, 'electiva'),
        
        # Electiva V
        ('Derecho', 'DER-ELE5', 5, 'electiva'),
        
        # Electiva de Profundización I
        ('Instrumentación Quirúrgica', 'CSA-EPI1', 6, 'electiva'),
        ('Fisioterapia', 'CSA-EPI1', 6, 'electiva'),
        
        # Electiva de Profundización II
        ('Instrumentación Quirúrgica', 'CSA-EPI2', 7, 'electiva'),
        ('Fisioterapia', 'CSA-EPI2', 7, 'electiva'),
        
        # Electiva de Profundización III
        ('Fisioterapia', 'CSA-EPI3', 8, 'electiva'),
        
        # Electricidad, Magnetismo y Laboratorio
        ('Ingeniería de Sistemas', 'ING-EMLA', 2, 'básica'),
        
        # Electrónica Digital
        ('Ingeniería de Sistemas', 'ING-ELDI', 2, 'básica'),
        
        # Emprendimiento e Innovación
        ('Contaduría Pública', 'CEA-EMPI', 3, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-EMPI', 1, 'profesional'),
        
        # Empresarismo y Emprendimiento
        ('Microbiología', 'CSA-EMPE', 4, 'profesional'),
        
        # Epidemiología
        ('Fisioterapia', 'CSA-EPID', 4, 'básica'),
        
        # Epidemiología Básica
        ('Medicina', 'CSA-EPBA', 4, 'básica'),
        
        # Epidemiología Clínica
        ('Medicina', 'CSA-EPCL', 7, 'profesional'),
        
        # Epistemología de las Ciencias
        ('Fisioterapia', 'CSA-EPCI', 5, 'profesional'),
        
        # Epistemología y Metodología de la Investigación
        ('Contaduría Pública', 'CEA-EPMI', 2, 'básica'),
        ('Administración de Negocios Internacionales', 'CEA-EPMI', 2, 'básica'),
        
        # Especialidades Quirúrgicas
        ('Medicina', 'CSA-ESQU', 8, 'profesional'),
        
        # Estadística
        ('Microbiología', 'CSA-ESTA', 3, 'profesional'),
        
        # Estadística Descriptiva
        ('Contaduría Pública', 'CEA-ESDE', 3, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-ESDE', 3, 'profesional'),
        
        # Estadística Inferencial
        ('Contaduría Pública', 'CEA-ESIN', 4, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-ESIN', 4, 'profesional'),
        
        # Estructuras de Datos
        ('Ingeniería de Sistemas', 'ING-ESDA', 3, 'profesional'),
        
        # Evaluación y Diagnóstico
        ('Fisioterapia', 'CSA-EVDI', 3, 'profesional'),
        
        # Expresión Oral y Escrita
        ('Microbiología', 'CSA-EXOE', 1, 'humanística'),
        ('Bacteriología', 'CSA-EXOE', 1, 'humanística'),
        ('Medicina', 'CSA-EXOE', 1, 'humanística'),
        
        # Expresión Verbal y Escrita
        ('Contaduría Pública', 'CEA-EXVE', 1, 'humanística'),
        ('Administración de Negocios Internacionales', 'CEA-EXVE', 1, 'humanística'),
        
        # Extramural (Sem. XI-XII)
        ('Medicina', 'CSA-EXTR', 11, 'básica'),
        
        # Familia, Infancia y Adolescencia
        ('Derecho', 'DER-FIAD', 7, 'profesional'),
        
        # Farmacología Aplicada y Toxicología Clínica
        ('Medicina', 'CSA-FATC', 6, 'profesional'),
        
        # Farmacología en Fisioterapia
        ('Fisioterapia', 'CSA-FAFI', 4, 'profesional'),
        
        # Farmacología y Anestesia
        ('Instrumentación Quirúrgica', 'CSA-FRAN', 3, 'básica'),
        
        # Farmacología y Toxicología
        ('Bacteriología', 'CSA-FTOX', 7, 'profesional'),
        
        # Farmacología y Toxicología Básica
        ('Medicina', 'CSA-FTBA', 5, 'básica'),
        
        # Filosofía del Derecho
        ('Derecho', 'DER-FIDE', 7, 'profesional'),
        
        # Finanzas Corporativas
        ('Contaduría Pública', 'CEA-FICO', 7, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-FICO', 5, 'profesional'),
        
        # Finanzas Internacionales
        ('Administración de Negocios Internacionales', 'CEA-FIIN', 6, 'profesional'),
        
        # Finanzas Públicas
        ('Derecho', 'DER-FIPU', 10, 'profesional'),
        
        # Fisiología
        ('Medicina', 'CSA-FISIO', 4, 'básica'),
        
        # Fisiología del Ejercicio
        ('Fisioterapia', 'CSA-FIEJ', 2, 'básica'),
        
        # Fisiopatología Animal
        ('Microbiología', 'CSA-FPAN', 3, 'profesional'),
        
        # Fisiopatología Humana
        ('Microbiología', 'CSA-FPHY', 2, 'básica'),
        
        # Fisiopatología Vegetal
        ('Microbiología', 'CSA-FPVE', 4, 'profesional'),
        
        # Formulación y Evaluación de Proyectos
        ('Ingeniería de Sistemas', 'ING-FEPR', 6, 'profesional'),
        
        # Formulación y Gestión de Proyectos
        ('Contaduría Pública', 'CEA-FGPR', 7, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-FGPR', 6, 'profesional'),
        
        # Fundamentos de Administración
        ('Contaduría Pública', 'CEA-FDAD', 2, 'humanística'),
        ('Administración de Negocios Internacionales', 'CEA-FDAD', 1, 'humanística'),
        
        # Fundamentos de Bases de Datos
        ('Ingeniería de Sistemas', 'ING-FBDA', 4, 'profesional'),
        
        # Fundamentos de Economía
        ('Contaduría Pública', 'CEA-FDEC', 1, 'humanística'),
        ('Ingeniería de Sistemas', 'CEA-FDEC', 5, 'humanística'),
        ('Administración de Negocios Internacionales', 'CEA-FDEC', 1, 'humanística'),
        
        # Fundamentos de Matemáticas
        ('Contaduría Pública', 'CEA-FDMA', 1, 'humanística'),
        ('Administración de Negocios Internacionales', 'CEA-FDMA', 1, 'humanística'),
        
        # Fundamentos de Mercadeo
        ('Contaduría Pública', 'CEA-FDME', 4, 'humanística'),
        ('Administración de Negocios Internacionales', 'CEA-FDME', 4, 'humanística'),
        
        # Fundamentos de Negocios Internacionales
        ('Administración de Negocios Internacionales', 'CEA-FDNI', 1, 'humanística'),
        
        # Fundamentos de Programación
        ('Ingeniería de Sistemas', 'ING-FDPR', 2, 'humanística'),
        
        # Fundamentos de Psicología
        ('Instrumentación Quirúrgica', 'CSA-FDPS', 2, 'humanística'),
        
        # Fundamentos en Análisis y Redacción de Texto
        ('Fisioterapia', 'CSA-FART', 1, 'básica'),
        
        # Fundamentos y Normatividad Tributaria
        ('Contaduría Pública', 'CEA-FDNT', 5, 'humanística'),
        
        # Física
        ('Microbiología', 'CSA-FIS', 1, 'básica'),
        
        # Física Mecánica
        ('Ingeniería de Sistemas', 'ING-FIME', 1, 'básica'),
        
        # Genética
        ('Microbiología', 'CSA-GEN', 2, 'básica'),
        ('Bacteriología', 'CSA-GEN', 3, 'básica'),
        
        # Genética Clínica
        ('Medicina', 'CSA-GECL', 6, 'profesional'),
        
        # Geopolítica
        ('Administración de Negocios Internacionales', 'CEA-GEOP', 4, 'profesional'),
        
        # Gerencia Estratégica
        ('Ingeniería de Sistemas', 'ING-GERE', 8, 'profesional'),
        
        # Gerencia Estratégica Organizacional
        ('Contaduría Pública', 'CEA-GEOR', 4, 'profesional'),
        
        # Gerencia de Comercio Exterior
        ('Administración de Negocios Internacionales', 'CEA-GCEX', 7, 'profesional'),
        
        # Gestión de Exportaciones
        ('Administración de Negocios Internacionales', 'CEA-GEXP', 7, 'profesional'),
        
        # Gestión de Importaciones
        ('Administración de Negocios Internacionales', 'CEA-GIMP', 6, 'profesional'),
        
        # Gestión de Proyectos de Ingeniería
        ('Ingeniería de Sistemas', 'ING-GPIN', 7, 'profesional'),
        
        # Gestión de la Planeación y Organización
        ('Administración de Negocios Internacionales', 'CEA-GPOR', 2, 'básica'),
        
        # Gestión del Talento Humano
        ('Administración de Negocios Internacionales', 'CEA-GTHA', 4, 'profesional'),
        
        # Gestión del Transporte Internacional
        ('Administración de Negocios Internacionales', 'CEA-GTIN', 6, 'profesional'),
        
        # Gineco-Obstetricia
        ('Medicina', 'CSA-GIOB', 10, 'profesional'),
        
        # Gineco-Obstetricia INT. (Sem. XI-XII)
        ('Medicina', 'CSA-GIOB2', 11, 'básica'),
        
        # Globalización
        ('Administración de Negocios Internacionales', 'CEA-GLOB', 8, 'humanística'),
        
        # Habilidades Comunicativas
        ('Derecho', 'DER-HACO', 1, 'humanística'),
        
        # Hematología
        ('Bacteriología', 'CSA-HEMA', 4, 'profesional'),
        
        # Hematología Clínica
        ('Bacteriología', 'CSA-HECL', 5, 'profesional'),
        
        # Hermenéutica Jurídica
        ('Derecho', 'DER-HEJR', 5, 'profesional'),
        
        # Historia de la Ciencia
        ('Microbiología', 'CSA-HCIE', 1, 'básica'),
        
        # Historia de la Filosofía
        ('Derecho', 'DER-HIFL', 1, 'humanística'),
        
        # Impuesto Sobre la Renta
        ('Contaduría Pública', 'CEA-IMRE', 6, 'profesional'),
        
        # Impuesto a las Ventas y Retención
        ('Contaduría Pública', 'CEA-IVYR', 7, 'profesional'),
        
        # Impuestos Territoriales y Proc. Tributario
        ('Contaduría Pública', 'CEA-ITPT', 8, 'profesional'),
        
        # Ingeniería Aplicada
        ('Ingeniería de Sistemas', 'ING-INAP', 8, 'profesional'),
        
        # Ingeniería de Software I
        ('Ingeniería de Sistemas', 'ING-ISW1', 3, 'profesional'),
        
        # Ingeniería de Software II
        ('Ingeniería de Sistemas', 'ING-ISW2', 4, 'profesional'),
        
        # Ingeniería de Software III
        ('Ingeniería de Sistemas', 'ING-ISW3', 5, 'profesional'),
        
        # Inmunohematología y Banco de Sangre
        ('Bacteriología', 'CSA-IMBS', 6, 'profesional'),
        
        # Inmunología
        ('Microbiología', 'CSA-INMU', 4, 'básica'),
        ('Medicina', 'CSA-INMU', 4, 'básica'),
        
        # Inmunología Básica
        ('Bacteriología', 'CSA-IMBA', 4, 'profesional'),
        
        # Inmunología Clínica
        ('Bacteriología', 'CSA-IMCL', 5, 'profesional'),
        
        # Innovación y Tecnología
        ('Instrumentación Quirúrgica', 'CSA-INTE', 5, 'profesional'),
        
        # Inteligencia Artificial
        ('Ingeniería de Sistemas', 'ING-INAR', 7, 'profesional'),
        
        # International Agreement
        ('Administración de Negocios Internacionales', 'CEA-INTA', 7, 'profesional'),
        
        # International Marketing
        ('Administración de Negocios Internacionales', 'CEA-INTM', 7, 'profesional'),
        
        # Intervención en Fisioterapia I
        ('Fisioterapia', 'CSA-IFI1', 3, 'profesional'),
        
        # Intervención en Fisioterapia II
        ('Fisioterapia', 'CSA-IFI2', 4, 'profesional'),
        
        # Intervención en Fisioterapia III
        ('Fisioterapia', 'CSA-IFI3', 5, 'profesional'),
        
        # Introducción a la Fisioterapia
        ('Fisioterapia', 'CSA-INFI', 1, 'básica'),
        
        # Introducción a la Ingeniería
        ('Ingeniería de Sistemas', 'ING-INGE', 1, 'básica'),
        
        # Introducción a la Instrumentación
        ('Instrumentación Quirúrgica', 'CSA-ININ', 1, 'básica'),
        
        # Introducción a las Tecnologías Ómicas
        ('Bacteriología', 'CSA-INTO', 6, 'profesional'),
        
        # Introducción al Derecho
        ('Derecho', 'DER-INDE', 1, 'básica'),
        
        # Investigación Clínica Epidemiológica
        ('Instrumentación Quirúrgica', 'CSA-ICEP', 3, 'básica'),
        
        # Investigación I
        ('Derecho', 'DER-INI1', 3, 'profesional'),
        
        # Investigación II
        ('Derecho', 'DER-INI2', 4, 'profesional'),
        
        # Investigación III
        ('Derecho', 'DER-INI3', 5, 'profesional'),
        
        # Investigación IV
        ('Derecho', 'DER-INI4', 6, 'profesional'),
        
        # Investigación de Mercados
        ('Administración de Negocios Internacionales', 'CEA-INME', 6, 'básica'),
        
        # Investigación de Operaciones
        ('Contaduría Pública', 'CEA-INOP', 5, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-INOP', 5, 'profesional'),
        
        # Jurisprudencia Constitucional
        ('Derecho', 'DER-JUCO', 9, 'profesional'),
        
        # Laboral Administrativo
        ('Derecho', 'DER-LAAD', 8, 'básica'),
        
        # Laboral Colectivo
        ('Derecho', 'DER-LACO', 6, 'básica'),
        
        # Laboral Individual y Prestacional
        ('Derecho', 'DER-LAIP', 4, 'básica'),
        
        # Legislación Aduanera
        ('Administración de Negocios Internacionales', 'CEA-LEAD', 4, 'profesional'),
        
        # Logística y Distribución Física Internacional
        ('Administración de Negocios Internacionales', 'CEA-LDFI', 5, 'profesional'),
        
        # Lógica Jurídica
        ('Derecho', 'DER-LGJU', 3, 'profesional'),
        
        # Lógica Matemática
        ('Bacteriología', 'CSA-LGMA', 1, 'básica'),
        ('Fisioterapia', 'CSA-LGMA', 1, 'básica'),
        
        # Lógica Matemáticas
        ('Ingeniería de Sistemas', 'ING-LGMA2', 1, 'básica'),
        
        # Lógica y Algoritmos
        ('Ingeniería de Sistemas', 'ING-LGAL', 1, 'básica'),
        
        # Matemáticas
        ('Microbiología', 'CSA-MAT', 1, 'básica'),
        
        # Matemáticas Discretas
        ('Ingeniería de Sistemas', 'ING-MADE', 5, 'básica'),
        
        # Matemáticas Financieras
        ('Contaduría Pública', 'CEA-MAFI', 3, 'básica'),
        ('Administración de Negocios Internacionales', 'CEA-MAFI', 3, 'básica'),
        
        # Medicina Interna
        ('Medicina', 'CSA-MEIN', 7, 'profesional'),
        
        # Medicina Interna INT. (Sem. XI-XII)
        ('Medicina', 'CSA-MEIN2', 11, 'básica'),
        
        # Medicina Legal
        ('Medicina', 'CSA-MELE', 10, 'profesional'),
        
        # Mercado de Capitales
        ('Administración de Negocios Internacionales', 'CEA-MECA', 8, 'profesional'),
        
        # Metodología de la Investigación
        ('Microbiología', 'CSA-METI', 2, 'básica'),
        ('Instrumentación Quirúrgica', 'CSA-METI', 4, 'básica'),
        ('Bacteriología', 'CSA-METI', 4, 'básica'),
        ('Fisioterapia', 'CSA-METI', 2, 'básica'),
        ('Ingeniería de Sistemas', 'CSA-METI', 7, 'profesional'),
        ('Medicina', 'CSA-METI', 2, 'básica'),
        
        # Micología Clínica
        ('Bacteriología', 'CSA-MICL', 7, 'profesional'),
        
        # Microbiología
        ('Microbiología', 'CSA-MICR', 4, 'profesional'),
        ('Instrumentación Quirúrgica', 'CSA-MICR', 2, 'básica'),
        ('Bacteriología', 'CSA-MICR', 4, 'profesional'),
        ('Medicina', 'CSA-MICR', 5, 'básica'),
        
        # Microbiología Ambiental
        ('Microbiología', 'CSA-MIAM', 5, 'profesional'),
        
        # Microbiología General
        ('Bacteriología', 'CSA-MIGE', 4, 'profesional'),
        
        # Microbiología Industrial
        ('Microbiología', 'CSA-MIIN', 5, 'profesional'),
        
        # Microbiología Predictiva
        ('Microbiología', 'CSA-MIPR', 7, 'profesional'),
        
        # Microbiología de Alimentos y Medicamentos
        ('Microbiología', 'CSA-MIAM2', 6, 'profesional'),
        
        # Microbiología de Suelos
        ('Microbiología', 'CSA-MISU', 6, 'profesional'),
        
        # Modalidades Físicas
        ('Fisioterapia', 'CSA-MOFI', 4, 'profesional'),
        
        # Modelos de Investigación
        ('Contaduría Pública', 'CEA-MOIN', 4, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-MOIN', 5, 'profesional'),
        
        # Morfofisiología I
        ('Instrumentación Quirúrgica', 'CSA-MFI1', 1, 'básica'),
        ('Fisioterapia', 'CSA-MFI1', 1, 'básica'),
        
        # Morfofisiología II
        ('Instrumentación Quirúrgica', 'CSA-MFI2', 2, 'básica'),
        ('Bacteriología', 'CSA-MFI2', 2, 'básica'),
        ('Fisioterapia', 'CSA-MFI2', 2, 'básica'),
        
        # Morfología I
        ('Medicina', 'CSA-MOR1', 2, 'básica'),
        
        # Morfología II
        ('Medicina', 'CSA-MOR2', 3, 'básica'),
        
        # Neurociencia del Movimiento
        ('Fisioterapia', 'CSA-NEMO', 3, 'profesional'),
        
        # Obligaciones
        ('Derecho', 'DER-OBLI', 5, 'profesional'),
        
        # Ocupación y Movimiento Corporal
        ('Fisioterapia', 'CSA-OCMC', 5, 'profesional'),
        
        # Optativa I
        ('Microbiología', 'CEA-OPT1', 6, 'optativa'),
        ('Bacteriología', 'CEA-OPT1', 5, 'optativa'),
        ('Contaduría Pública', 'CEA-OPT1', 6, 'optativa'),
        ('Derecho', 'CEA-OPT1', 9, 'optativa'),
        ('Ingeniería de Sistemas', 'CEA-OPT1', 6, 'optativa'),
        ('Administración de Negocios Internacionales', 'CEA-OPT1', 6, 'optativa'),
        
        # Optativa II
        ('Microbiología', 'CEA-OPT2', 7, 'optativa'),
        ('Bacteriología', 'CEA-OPT2', 6, 'optativa'),
        ('Contaduría Pública', 'CEA-OPT2', 7, 'optativa'),
        ('Derecho', 'CEA-OPT2', 9, 'optativa'),
        ('Ingeniería de Sistemas', 'CEA-OPT2', 7, 'optativa'),
        ('Administración de Negocios Internacionales', 'CEA-OPT2', 7, 'optativa'),
        
        # Optativa III
        ('Microbiología', 'CEA-OPT3', 7, 'optativa'),
        ('Bacteriología', 'CEA-OPT3', 7, 'optativa'),
        ('Contaduría Pública', 'CEA-OPT3', 8, 'optativa'),
        ('Derecho', 'CEA-OPT3', 10, 'optativa'),
        ('Ingeniería de Sistemas', 'CEA-OPT3', 8, 'optativa'),
        ('Administración de Negocios Internacionales', 'CEA-OPT3', 8, 'optativa'),
        
        # Optativa IV
        ('Derecho', 'DER-OPT4', 10, 'optativa'),
        
        # Optativa V
        ('Derecho', 'DER-OPT5', 10, 'optativa'),
        
        # Parasitología Clínica
        ('Bacteriología', 'CSA-PACL', 5, 'profesional'),
        
        # Patología
        ('Instrumentación Quirúrgica', 'CSA-PATO', 3, 'básica'),
        ('Fisioterapia', 'CSA-PATO', 2, 'básica'),
        
        # Pediatría
        ('Medicina', 'CSA-PEDI', 9, 'profesional'),
        
        # Pensamiento Sistémico
        ('Ingeniería de Sistemas', 'ING-PESI', 2, 'profesional'),
        
        # Prescripción del Ejercicio
        ('Fisioterapia', 'CSA-PREJ', 3, 'profesional'),
        
        # Presupuestos Empresariales
        ('Contaduría Pública', 'CEA-PREM', 6, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-PREM', 3, 'profesional'),
        
        # Principios de Derecho y Constitución
        ('Contaduría Pública', 'CEA-PDCO', 1, 'básica'),
        ('Administración de Negocios Internacionales', 'CEA-PDCO', 1, 'básica'),
        
        # Probabilidad y Estadística Descriptiva
        ('Ingeniería de Sistemas', 'ING-PRED', 3, 'básica'),
        
        # Probatorio
        ('Derecho', 'DER-PROB', 7, 'profesional'),
        
        # Procesal Administrativo I
        ('Derecho', 'DER-PAD1', 8, 'profesional'),
        
        # Procesal Administrativo II
        ('Derecho', 'DER-PAD2', 9, 'profesional'),
        
        # Procesal Civil Especial y de Familia
        ('Derecho', 'DER-PCEF', 8, 'profesional'),
        
        # Procesal Civil General
        ('Derecho', 'DER-PCGE', 6, 'profesional'),
        
        # Procesal Laboral
        ('Derecho', 'DER-PLAB', 8, 'básica'),
        
        # Procesal Penal I
        ('Derecho', 'DER-PPE1', 5, 'profesional'),
        
        # Procesal Penal II
        ('Derecho', 'DER-PPE2', 6, 'profesional'),
        
        # Procesos Asépticos I
        ('Instrumentación Quirúrgica', 'CSA-PAS1', 3, 'profesional'),
        
        # Procesos Asépticos II
        ('Instrumentación Quirúrgica', 'CSA-PAS2', 4, 'profesional'),
        
        # Procesos Industriales
        ('Microbiología', 'CSA-PRIN2', 7, 'profesional'),
        
        # Procesos Quirúrgicos en Cardiovascular
        ('Instrumentación Quirúrgica', 'CSA-PQCV', 7, 'profesional'),
        
        # Procesos Quirúrgicos en Cirugía General y Pediatría
        ('Instrumentación Quirúrgica', 'CSA-PQGP', 4, 'profesional'),
        
        # Procesos Quirúrgicos en Cirugía Maxilofacial
        ('Instrumentación Quirúrgica', 'CSA-PQCM', 6, 'profesional'),
        
        # Procesos Quirúrgicos en Cirugía Plástica
        ('Instrumentación Quirúrgica', 'CSA-PQCP', 6, 'profesional'),
        
        # Procesos Quirúrgicos en Gineco-Obstetricia
        ('Instrumentación Quirúrgica', 'CSA-PQGO', 4, 'profesional'),
        
        # Procesos Quirúrgicos en Neurocirugía
        ('Instrumentación Quirúrgica', 'CSA-PQNE', 5, 'profesional'),
        
        # Procesos Quirúrgicos en Oftalmología
        ('Instrumentación Quirúrgica', 'CSA-PQOF', 6, 'profesional'),
        
        # Procesos Quirúrgicos en Ortopedia
        ('Instrumentación Quirúrgica', 'CSA-PQOR', 5, 'profesional'),
        
        # Procesos Quirúrgicos en Otorrinolaringología
        ('Instrumentación Quirúrgica', 'CSA-PQOT', 7, 'profesional'),
        
        # Procesos Quirúrgicos en Urología
        ('Instrumentación Quirúrgica', 'CSA-PQUR', 4, 'profesional'),
        
        # Programación I
        ('Ingeniería de Sistemas', 'ING-PRG1', 4, 'profesional'),
        
        # Programación II
        ('Ingeniería de Sistemas', 'ING-PRG2', 5, 'profesional'),
        
        # Programación Lineal
        ('Ingeniería de Sistemas', 'ING-PRLI', 6, 'básica'),
        
        # Programación Móvil
        ('Ingeniería de Sistemas', 'ING-PRMO', 7, 'profesional'),
        
        # Programación Web
        ('Ingeniería de Sistemas', 'ING-PRWE', 6, 'profesional'),
        
        # Proyección a la Comunidad
        ('Bacteriología', 'CSA-PRCO', 6, 'profesional'),
        
        # Proyecto de Investigación
        ('Microbiología', 'CSA-PRIN', 5, 'profesional'),
        ('Fisioterapia', 'CSA-PRIN', 6, 'profesional'),
        ('Ingeniería de Sistemas', 'CSA-PRIN', 7, 'profesional'),
        ('Medicina', 'CSA-PRIN', 9, 'profesional'),
        
        # Proyecto de Investigación (Bacteriología)
        ('Bacteriología', 'CSA-PRIB', 7, 'profesional'),
        
        # Proyecto de Investigación II
        ('Fisioterapia', 'CSA-PRI2', 7, 'profesional'),
        
        # Proyecto de Investigación III
        ('Fisioterapia', 'CSA-PRI3', 8, 'profesional'),
        
        # Práctica Clínica
        ('Bacteriología', 'CSA-PRCL', 9, 'profesional'),
        
        # Práctica Clínica Básica
        ('Bacteriología', 'CSA-PRCB', 8, 'profesional'),
        
        # Práctica Empresarial
        ('Ingeniería de Sistemas', 'ING-PREM2', 8, 'profesional'),
        
        # Práctica Hospitalaria I
        ('Instrumentación Quirúrgica', 'CSA-PRH1', 5, 'profesional'),
        
        # Práctica Hospitalaria II
        ('Instrumentación Quirúrgica', 'CSA-PRH2', 6, 'profesional'),
        
        # Práctica Hospitalaria III
        ('Instrumentación Quirúrgica', 'CSA-PRH3', 7, 'profesional'),
        
        # Práctica Hospitalaria IV
        ('Instrumentación Quirúrgica', 'CSA-PRH4', 8, 'profesional'),
        
        # Práctica de Administración
        ('Instrumentación Quirúrgica', 'CSA-PRAD', 8, 'profesional'),
        
        # Prácticas Formativas (puede ser Sem. 6, 7)
        ('Fisioterapia', 'CSA-PRFO', 6, 'profesional'),
        ('Fisioterapia', 'CSA-PRFO', 7, 'profesional'),
        
        # Prácticas Optativas
        ('Fisioterapia', 'CSA-PROP', 8, 'profesional'),
        
        # Prácticas Profesionales
        ('Microbiología', 'CSA-PRPR', 8, 'profesional'),
        
        # Psicología Evolutiva
        ('Fisioterapia', 'CSA-PSEV', 2, 'básica'),
        
        # Psicología de la Salud
        ('Fisioterapia', 'CSA-PSSA', 3, 'profesional'),
        
        # Psicología del Desarrollo
        ('Medicina', 'CSA-PSDE', 3, 'profesional'),
        
        # Psicopatología
        ('Medicina', 'CSA-PSCP', 6, 'profesional'),
        
        # Psiquiatría
        ('Medicina', 'CSA-PSIQ', 7, 'profesional'),
        
        # Química
        ('Microbiología', 'CSA-QUIM', 1, 'básica'),
        ('Instrumentación Quirúrgica', 'CSA-QUIM', 1, 'básica'),
        ('Bacteriología', 'CSA-QUIM', 1, 'básica'),
        ('Medicina', 'CSA-QUIM', 1, 'básica'),
        
        # Química Clínica
        ('Bacteriología', 'CSA-QUCL', 4, 'profesional'),
        
        # Química Especial
        ('Bacteriología', 'CSA-QUES', 5, 'profesional'),
        
        # Redes de Computadores
        ('Ingeniería de Sistemas', 'ING-RECO', 6, 'profesional'),
        
        # Responsabilidad Civil
        ('Derecho', 'DER-RECI', 10, 'profesional'),
        
        # Revisoría Fiscal
        ('Contaduría Pública', 'CEA-REFI', 7, 'profesional'),
        
        # Régimen Cambiario y Aduanero
        ('Administración de Negocios Internacionales', 'CEA-RCYA', 8, 'profesional'),
        
        # Salud Familiar I
        ('Medicina', 'CSA-SAF1', 3, 'humanística'),
        
        # Salud Familiar II
        ('Medicina', 'CSA-SAF2', 4, 'humanística'),
        
        # Salud Pública
        ('Microbiología', 'CSA-SAPU', 6, 'humanística'),
        ('Instrumentación Quirúrgica', 'CSA-SAPU', 6, 'humanística'),
        ('Fisioterapia', 'CSA-SAPU', 5, 'humanística'),
        ('Medicina', 'CSA-SAPU', 5, 'humanística'),
        
        # Salud Pública (Práctica Comunitaria)
        ('Instrumentación Quirúrgica', 'CSA-SAPC', 8, 'humanística'),
        
        # Salud Pública I
        ('Bacteriología', 'CSA-SAP1', 3, 'humanística'),
        
        # Salud Pública II
        ('Bacteriología', 'CSA-SAP2', 4, 'humanística'),
        
        # Salud y Ambiente
        ('Bacteriología', 'CSA-SAMY', 3, 'humanística'),
        
        # Salud y Comunidad
        ('Fisioterapia', 'CSA-SAYU', 1, 'humanística'),
        
        # Salud y Seguridad en el Trabajo
        ('Instrumentación Quirúrgica', 'CSA-SSET', 4, 'profesional'),
        
        # Seguridad Social
        ('Derecho', 'DER-SESO', 8, 'profesional'),
        
        # Seguridad de la Información
        ('Ingeniería de Sistemas', 'ING-SEIN', 7, 'profesional'),
        
        # Seguridad y Salud en el Trabajo
        ('Medicina', 'CSA-SSTR', 8, 'profesional'),
        
        # Seminario de Negociación y Concertación
        ('Administración de Negocios Internacionales', 'CEA-SENE', 7, 'profesional'),
        
        # Semiología
        ('Medicina', 'CSA-SEMI', 6, 'profesional'),
        
        # Simulación Gerencial
        ('Contaduría Pública', 'CEA-SIGE', 8, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-SIGE', 8, 'profesional'),
        
        # Sistemas Integrados de Gestión
        ('Ingeniería de Sistemas', 'ING-SIGE2', 8, 'profesional'),
        
        # Sistemas Operativos
        ('Ingeniería de Sistemas', 'ING-SIOP', 5, 'profesional'),
        
        # Sistemas de Bases de Datos
        ('Ingeniería de Sistemas', 'ING-SBDA', 5, 'profesional'),
        
        # Sistemas de Calidad
        ('Bacteriología', 'CSA-SICA', 2, 'básica'),
        
        # Sistemas de Costeo
        ('Contaduría Pública', 'CEA-SICO', 4, 'profesional'),
        ('Administración de Negocios Internacionales', 'CEA-SICO', 3, 'profesional'),
        
        # Sociedad, Sector Salud y Comunidad
        ('Instrumentación Quirúrgica', 'CSA-SSSC', 1, 'básica'),
        
        # Socioantropología
        ('Instrumentación Quirúrgica', 'CSA-SCAN', 3, 'profesional'),
        ('Fisioterapia', 'CSA-SCAN', 1, 'humanística'),
        ('Medicina', 'CSA-SCAN', 1, 'humanística'),
        
        # Sociología General y Jurídica
        ('Derecho', 'DER-SGJU', 2, 'básica'),
        
        # Solución Alternativa de Conflictos
        ('Derecho', 'DER-SACO', 4, 'humanística'),
        
        # Sucesiones
        ('Derecho', 'DER-SUCE', 9, 'profesional'),
        
        # Teoría Económica
        ('Derecho', 'DER-TEEC', 1, 'básica'),
        
        # Teoría General del Proceso
        ('Derecho', 'DER-TGPR', 4, 'profesional'),
        
        # Teoría de la Constitución
        ('Derecho', 'DER-TECO2', 2, 'básica'),
        
        # Teoría del Delito
        ('Derecho', 'DER-TEDE', 3, 'básica'),
        
        # Teoría del Estado
        ('Derecho', 'DER-TEES', 1, 'básica'),
        
        # Teorías Contables
        ('Contaduría Pública', 'CEA-TECO', 3, 'profesional'),
        
        # Toxicología
        ('Microbiología', 'CSA-TOXC', 5, 'profesional'),
        
        # Trabajo de Grado
        ('Medicina', 'CSA-TRGR', 10, 'profesional'),
        
        # Trabajo de Investigación
        ('Microbiología', 'CSA-TRIN', 6, 'profesional'),
        ('Bacteriología', 'CSA-TRIN', 8, 'profesional'),
        
        # Tutela Penal de los Bienes Jurídicos I
        ('Derecho', 'DER-TPB1', 4, 'profesional'),
        
        # Tutela Penal de los Bienes Jurídicos II
        ('Derecho', 'DER-TPB2', 5, 'profesional'),
        
        # Títulos Valores
        ('Derecho', 'DER-TVAL', 7, 'básica'),
        
        # Urgencia Adulto (Sem. XI-XII)
        ('Medicina', 'CSA-URAD', 11, 'básica'),
        
        # Virología Clínica
        ('Bacteriología', 'CSA-VICL', 6, 'profesional'),
        
        # Álgebra Lineal
        ('Ingeniería de Sistemas', 'ING-ALGE', 2, 'básica'),
        
        # Ética General y Deontología IQ
        ('Instrumentación Quirúrgica', 'CSA-EGDI', 2, 'humanística'),
        
        # Ética I
        ('Derecho', 'DER-ETI1', 2, 'humanística'),
        
        # Ética II
        ('Derecho', 'DER-ETI2', 10, 'humanística'),
        
        # Ética Médica
        ('Medicina', 'CSA-ETME', 5, 'humanística'),
        
        # Ética Profesional
        ('Contaduría Pública', 'ING-ETPR', 8, 'humanística'),
        ('Ingeniería de Sistemas', 'ING-ETPR', 7, 'humanística'),
        
        # Ética Profesional y Responsabilidad Social
        ('Administración de Negocios Internacionales', 'CEA-EPRS', 8, 'humanística'),
        
        # Ética y Bioética
        ('Bacteriología', 'CSA-ETBI', 2, 'humanística'),
        ('Fisioterapia', 'CSA-ETBI', 5, 'humanística'),
        
        # ==========================================
        # RELACIONES INGENIERÍA INDUSTRIAL
        # ==========================================
        
        # Álgebra Lineal
        ('Ingeniería Industrial', 'ING-ALGE', 2, 'básica'),
        
        # Bioestadística y Demografía
        ('Medicina', 'CSA-BIDE', 1, 'básica'),
        
        # Cálculo Diferencial
        ('Ingeniería Industrial', 'ING-CALD', 1, 'básica'),
        
        # Cálculo Integral
        ('Ingeniería Industrial', 'ING-CALI', 2, 'básica'),
        
        # Cálculo Multivariado y Vectorial
        ('Ingeniería Industrial', 'ING-CMVC', 3, 'básica'),
        
        # Cátedra de Sostenibilidad
        ('Ingeniería Industrial', 'ING-CASO', 5, 'humanística'),
        
        # Cátedra Unilibrista
        ('Ingeniería Industrial', 'CSA-CATU', 1, 'humanística'),
        
        # Ciencia de los Materiales en la Industria
        ('Ingeniería Industrial', 'ING-CMDI', 2, 'profesional'),
        
        # Competencias de Aprendizaje y Comunicación
        ('Ingeniería Industrial', 'ING-CPAC', 1, 'humanística'),
        
        # Constitución Política
        ('Ingeniería Industrial', 'CSA-CPOL', 7, 'humanística'),
        
        # Contabilidad y Presupuesto
        ('Ingeniería Industrial', 'ING-COPR', 2, 'profesional'),
        
        # Control Estadístico de la Calidad
        ('Ingeniería Industrial', 'ING-CECQ', 4, 'profesional'),
        
        # Costos de Operación
        ('Ingeniería Industrial', 'ING-CSOP', 4, 'profesional'),
        
        # Diseño de Instalaciones Industriales y de Servicios
        ('Ingeniería Industrial', 'ING-DIIS', 8, 'profesional'),
        
        # Diseño de Productos y Servicios
        ('Ingeniería Industrial', 'ING-DPSE', 5, 'profesional'),
        
        # Diseño en Ingeniería
        ('Ingeniería Industrial', 'ING-DSIN', 3, 'profesional'),
        
        # Ecuaciones Diferenciales
        ('Ingeniería Industrial', 'ING-ECDI', 4, 'básica'),
        
        # Electricidad Magnetismo y Laboratorio
        ('Ingeniería Industrial', 'ING-EMYL', 3, 'básica'),
        
        # Electiva I
        ('Ingeniería Industrial', 'CEA-ELE1', 2, 'electiva'),
        
        # Electiva II
        ('Ingeniería Industrial', 'CEA-ELE2', 3, 'electiva'),
        
        # Electiva III
        ('Ingeniería Industrial', 'CEA-ELE3', 5, 'electiva'),
        
        # Epidemiología (Fisioterapia)
        ('Fisioterapia', 'CSA-EPFI', 4, 'básica'),
        
        # Estadística Descriptiva
        ('Ingeniería Industrial', 'CEA-ESDE', 3, 'básica'),
        
        # Expresión Gráfica para Ingeniería
        ('Ingeniería Industrial', 'ING-EGPI', 1, 'básica'),
        
        # Finanzas
        ('Ingeniería Industrial', 'ING-FINA', 6, 'profesional'),
        
        # Formulación y Evaluación de Proyectos
        ('Ingeniería Industrial', 'ING-FEPR', 7, 'profesional'),
        
        # Fundamentos de Economía
        ('Ingeniería Industrial', 'CEA-FDEC', 3, 'humanística'),
        
        # Física Mecánica y Lab
        ('Ingeniería Industrial', 'ING-FMLA', 2, 'básica'),
        
        # Gerencia Estratégica
        ('Ingeniería Industrial', 'ING-GERE', 4, 'profesional'),
        
        # Gestión Organizacional
        ('Ingeniería Industrial', 'ING-GEOR2', 3, 'profesional'),
        
        # Gestión de la Tecnología
        ('Ingeniería Industrial', 'ING-GETE', 6, 'profesional'),
        
        # Historia de la Medicina
        ('Medicina', 'CSA-HMED', 1, 'humanística'),
        
        # Ingeniería Aplicada
        ('Ingeniería Industrial', 'ING-INAP', 8, 'profesional'),
        
        # Ingeniería Económica
        ('Ingeniería Industrial', 'ING-INEC', 5, 'profesional'),
        
        # Ingeniería de Métodos
        ('Ingeniería Industrial', 'ING-INME', 5, 'profesional'),
        
        # Introducción a la Ingeniería
        ('Ingeniería Industrial', 'ING-INGE', 1, 'básica'),
        
        # Investigación Operativa I
        ('Ingeniería Industrial', 'ING-IOPI', 5, 'profesional'),
        
        # Investigación Operativa II
        ('Ingeniería Industrial', 'ING-IOPII', 6, 'profesional'),
        
        # Lenguaje de Programación
        ('Ingeniería Industrial', 'ING-LGPR', 2, 'profesional'),
        
        # Logística y Cadena de Suministros
        ('Ingeniería Industrial', 'ING-LCSU', 8, 'profesional'),
        
        # Lógica y Algoritmos
        ('Ingeniería Industrial', 'ING-LGAL', 1, 'básica'),
        
        # Mercadeo
        ('Ingeniería Industrial', 'ING-MERC', 6, 'profesional'),
        
        # Metodología de la Investigación
        ('Ingeniería Industrial', 'CSA-METI', 7, 'profesional'),
        
        # Modelos Matemáticos Estocásticos
        ('Ingeniería Industrial', 'ING-MMES', 7, 'profesional'),
        
        # Optativa de Énfasis I (Sem. 6, 7)
        ('Administración de Negocios Internacionales', 'CEA-OEF1', 6, 'optativa'),
        ('Administración de Negocios Internacionales', 'CEA-OEF1', 7, 'optativa'),
        
        # Optativa de Énfasis III
        ('Administración de Negocios Internacionales', 'CEA-OEF3', 8, 'optativa'),
        
        # Optativa I
        ('Ingeniería Industrial', 'CEA-OPT1', 6, 'optativa'),
        
        # Optativa II
        ('Ingeniería Industrial', 'CEA-OPT2', 7, 'optativa'),
        
        # Optativa III
        ('Ingeniería Industrial', 'CEA-OPT3', 8, 'optativa'),
        
        # Planeación y Control de la Producción y Operaciones
        ('Ingeniería Industrial', 'ING-PCPO', 6, 'profesional'),
        
        # Probabilidad y Estadística Descriptiva
        ('Ingeniería Industrial', 'ING-PRED', 3, 'básica'),
        
        # Procesos Industriales
        ('Ingeniería Industrial', 'CSA-PRIN2', 4, 'profesional'),
        
        # Proyecto de Investigación
        ('Ingeniería Industrial', 'CSA-PRIN', 7, 'profesional'),
        
        # Práctica Empresarial
        ('Ingeniería Industrial', 'ING-PREM2', 8, 'profesional'),
        
        # Química General y Laboratorio
        ('Ingeniería Industrial', 'ING-QGLA', 1, 'básica'),
        
        # Seguridad y Salud en el Trabajo (IND)
        ('Ingeniería Industrial', 'ING-SSTI', 7, 'profesional'),
        
        # Seguridad y Salud en el Trabajo (MED)
        ('Medicina', 'CSA-SSTM', 8, 'profesional'),
        
        # Simulación de Procesos
        ('Ingeniería Industrial', 'ING-SIPR', 8, 'profesional'),
        
        # Sistemas Integrados de Gestión
        ('Ingeniería Industrial', 'ING-SIGE2', 5, 'profesional'),
        
        # Termodinámica
        ('Ingeniería Industrial', 'ING-TERM', 4, 'básica'),
        
        # Ética (Ingeniería)
        ('Ingeniería Industrial', 'ING-ETIC', 7, 'humanística'),
        
        # Ética Profesional
        ('Contaduría Pública', 'ING-ETPR', 8, 'humanística'),
        
        # ==========================================
        # RELACIONES ALIANZA CANADIENSE
        # ==========================================
        
        # Modalidad Intensiva (Semestre VII)
        ('Alianza Canadiense', 'ALI-INTE', 7, 'profesional'),
        
        # Modalidad Semestral (Semestres I, II, IV)
        ('Alianza Canadiense', 'ALI-SEME', 1, 'profesional'),
        ('Alianza Canadiense', 'ALI-SEME', 2, 'profesional'),
        ('Alianza Canadiense', 'ALI-SEME', 4, 'profesional'),
        
        # Modalidad Sabatina (Semestres II, VII)
        ('Alianza Canadiense', 'ALI-SABA', 2, 'profesional'),
        ('Alianza Canadiense', 'ALI-SABA', 7, 'profesional'),
        
        # Modalidad Semi-Intensiva (Semestres IV, V, VI, VII)
        ('Alianza Canadiense', 'ALI-SEMI', 4, 'profesional'),
        ('Alianza Canadiense', 'ALI-SEMI', 5, 'profesional'),
        ('Alianza Canadiense', 'ALI-SEMI', 6, 'profesional'),
        ('Alianza Canadiense', 'ALI-SEMI', 7, 'profesional'),
    ]
