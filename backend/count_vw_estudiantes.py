import oracledb
import sys
import os

def count_estudiantes():
    try:
        # Conexión a Oracle
        connection = oracledb.connect(
            user="UHORARIOS",
            password="Temporal2026U",
            host="10.4.100.215",
            port=1521,
            service_name="SIULEDU"
        )
        
        cursor = connection.cursor()
        
        # Contar registros en VW_ESTUDIANTES
        periodo = os.getenv('ETL_PERIODO', '20261')
        print(f"Buscando periodo: {periodo}")
        cursor.execute(f"SELECT COUNT(*) as total FROM VW_ESTUDIANTES WHERE PERIODO_ACADEMICO LIKE '{periodo}'")
        result = cursor.fetchone()
        total = result[0]
        
        print(f"Total de registros en VW_ESTUDIANTES: {total:,}")
        
        # Calcular tiempo aproximado basado en el ETL de 1000 registros
        # Si 1000 registros demoraron aproximadamente 30-40 segundos
        estimated_seconds = (total / 1000) * 35  # estimación promedio
        estimated_minutes = estimated_seconds / 60
        estimated_hours = estimated_minutes / 60
        
        print(f"\nEstimación de tiempo de carga (aproximado):")
        if estimated_hours > 1:
            print(f"  {estimated_hours:.2f} horas ({estimated_minutes:.0f} minutos)")
        else:
            print(f"  {estimated_minutes:.0f} minutos ({estimated_seconds:.0f} segundos)")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    count_estudiantes()
