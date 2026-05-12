#!/usr/bin/env python
import oracledb
import sys

def count_grupos():
    try:
        connection = oracledb.connect(
            user="UHORARIOS",
            password="Temporal2026U",
            host="10.4.100.215",
            port=1521,
            service_name="SIULEDU"
        )
        
        cursor = connection.cursor()
        
        print("Contando registros en VW_GRUPOS_ACADEMICOS...")
        cursor.execute("SELECT COUNT(*) as total FROM VW_GRUPOS_ACADEMICOS")
        result = cursor.fetchone()
        total = result[0]
        
        print(f"Total de registros en VW_GRUPOS_ACADEMICOS: {total:,}")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    count_grupos()
