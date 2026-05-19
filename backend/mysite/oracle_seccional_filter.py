import oracledb


def _is_invalid_identifier_error(exc):
    message = str(exc).upper()
    return 'ORA-00904' in message or 'INVALID IDENTIFIER' in message


def _build_where_clause(alias, seccional_columns):
    checks = []
    for col in seccional_columns:
        checks.append(
            f"UPPER(TRIM(NVL(TO_CHAR({alias}.{col}), ''))) LIKE UPPER(:seccional_like)"
        )
    return ' OR '.join(checks)


def execute_oracle_query_with_optional_seccional(
    cursor,
    base_query,
    seccional='',
    seccional_columns=None,
    limit=None,
    stdout=None,
):
    seccional_value = str(seccional or '').strip()
    columns = tuple(seccional_columns or ())
    base_alias = 'SRC_Q'

    def _run(query_text, params):
        if params:
            cursor.execute(query_text, params)
        else:
            cursor.execute(query_text)

    if seccional_value and columns:
        predicate_variants = [columns] + [(col,) for col in columns]
        for candidate_columns in predicate_variants:
            where_clause = _build_where_clause(base_alias, candidate_columns)
            query_with_filter = (
                f'SELECT * FROM ({base_query}) {base_alias} WHERE ({where_clause})'
            )
            params = {'seccional_like': f'%{seccional_value}%'}
            if limit and int(limit) > 0:
                query_with_filter = (
                    f'SELECT * FROM ({query_with_filter}) LIM_Q WHERE ROWNUM <= :max_rows'
                )
                params['max_rows'] = int(limit)
            try:
                _run(query_with_filter, params)
                return {'filter_applied': True, 'fallback_without_filter': False}
            except oracledb.DatabaseError as exc:
                if _is_invalid_identifier_error(exc):
                    continue
                raise

        if stdout is not None:
            stdout.write(
                'Advertencia: no se pudo aplicar filtro por seccional '
                '(la consulta no expone columnas de sede). Se ejecuta sin filtro.'
            )

    fallback_query = base_query
    fallback_params = {}
    if limit and int(limit) > 0:
        fallback_query = f'SELECT * FROM ({base_query}) LIM_Q WHERE ROWNUM <= :max_rows'
        fallback_params['max_rows'] = int(limit)
    _run(fallback_query, fallback_params)
    return {'filter_applied': False, 'fallback_without_filter': bool(seccional_value and columns)}
