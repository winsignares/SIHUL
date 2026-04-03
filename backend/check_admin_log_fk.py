from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(
        """
        SELECT conname, confrelid::regclass::text AS referenced_table
        FROM pg_constraint
        WHERE conrelid = 'django_admin_log'::regclass
          AND conname LIKE 'django_admin_log_user_id%';
        """
    )
    print(cursor.fetchall())
