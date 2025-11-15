# Sobre el Proyecto

Este proyecto es un sistema de gestión y planeación académica diseñado para optimizar la estructura académica (facultades, programas, grupos, asignaturas) y la administración de recursos físicos (salones, laboratorios, espacios). Permite a los administradores de planeación organizar la oferta académica y gestionar eficientemente el inventario de espacios, mientras que los usuarios consultores pueden verificar horarios y disponibilidad.

El objetivo principal es centralizar la gestión de:

Estructura Académica: Registro de programas, grupos, y asignaturas por periodo.

Recursos Físicos: Inventario, tipos de espacios, capacidad, y estado.

Horarios: Creación, validación y consulta de horarios de grupo, docente y espacios.

Reportes: Generación de métricas de ocupación y disponibilidad para optimización.

#Instrucciones de instalación

# 1. Clonar el repositorio
git clone https://github.com/winsignares/SIHUL
cd sihul

# 2. Configurar el Backend (Ejemplo)
cd backend
npm install   # o pip install -r requirements.txt, o equivalente

# 3. Configurar el Frontend (Ejemplo)
cd ../frontend
npm install
npm start

# 4. Inicialización
4.1. Abrir el cmd como administrador
4.2. Navegar hacia la ruta del proyecto
cd <Ruta>
4.3. Montar los contenedores
docker compose up --build
4.4. Abrir dirección url del contedor principal del proyecto
