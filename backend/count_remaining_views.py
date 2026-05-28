#!/usr/bin/env python
import oracledb
import sys

def check_all_views():
    try:
        connection = oracledb.connect(
            user="UHORARIOS",
            password="Temporal2026U",
            host="10.4.100.215",
            port=1521,
            service_name="SIULEDU"
        )
        
        cursor = connection.cursor()
        
        views = [
            'VW_SEDES',
            'VW_FACULTAD', 
            'VW_PROGRAMAS_ACADEMICOS',
            'VW_ASIGNATURA',
            'VW_ASIGNATURA_PROGRAMA'
        ]
        
        print("Contando registros en vistas pendientes:\n")
        
        for view in views:
            try:
                cursor.execute(f"SELECT COUNT(*) as total FROM {view}")
                result = cursor.fetchone()
                total = result[0] if result else 0
                print(f"  {view:30} : {total:,} registros")
            except Exception as e:
                print(f"  {view:30} : ERROR - {str(e)[:50]}")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error de conexión: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    check_all_views()
