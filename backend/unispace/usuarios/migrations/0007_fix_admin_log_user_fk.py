from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('admin', '0003_logentry_add_action_flag_choices'),
        ('usuarios', '0006_sync_auth_fields_from_legacy'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'django_admin_log_user_id_c564eba6_fk_auth_user_id'
                ) THEN
                    ALTER TABLE django_admin_log
                    DROP CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id;
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'django_admin_log_user_id_c564eba6_fk_usuarios_usuario_id'
                ) THEN
                    ALTER TABLE django_admin_log
                    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_usuarios_usuario_id
                    FOREIGN KEY (user_id)
                    REFERENCES usuarios_usuario(id)
                    DEFERRABLE INITIALLY DEFERRED;
                END IF;
            END
            $$;
            """,
            reverse_sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'django_admin_log_user_id_c564eba6_fk_usuarios_usuario_id'
                ) THEN
                    ALTER TABLE django_admin_log
                    DROP CONSTRAINT django_admin_log_user_id_c564eba6_fk_usuarios_usuario_id;
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'django_admin_log_user_id_c564eba6_fk_auth_user_id'
                ) THEN
                    ALTER TABLE django_admin_log
                    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id
                    FOREIGN KEY (user_id)
                    REFERENCES auth_user(id)
                    DEFERRABLE INITIALLY DEFERRED;
                END IF;
            END
            $$;
            """,
        ),
    ]
