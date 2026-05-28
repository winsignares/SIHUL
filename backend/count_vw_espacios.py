#!/usr/bin/env python
import oracledb
import sys

def count_espacios():
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
        
        # Ver estructura de VW_ESPACIOS_FISICOS
        cursor.execute("SELECT * FROM VW_ESPACIOS_FISICOS WHERE ROWNUM = 1")
        columns = [desc[0].lower() for desc in cursor.description]
        print("Columnas en VW_ESPACIOS_FISICOS:")
        for i, col in enumerate(columns, 1):
            print(f"  {i}. {col}")
        
        # Contar registros en VW_ESPACIOS_FISICOS
        cursor.execute("SELECT COUNT(*) as total FROM VW_ESPACIOS_FISICOS")
        result = cursor.fetchone()
        total = result[0]
        
        print(f"\nTotal de registros en VW_ESPACIOS_FISICOS: {total:,}")
        
        # Calcular tiempo aproximado (asumiendo ~40-50 registros por segundo)
        estimated_seconds = total / 50
        estimated_minutes = estimated_seconds / 60
        
        print(f"\nEstimación de tiempo de carga (aproximado):")
        if estimated_minutes > 1:
            print(f"  {estimated_minutes:.2f} minutos ({estimated_seconds:.0f} segundos)")
        else:
            print(f"  {estimated_seconds:.0f} segundos")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    count_espacios()
