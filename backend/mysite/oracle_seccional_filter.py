import oracledb


def _is_invalid_identifier_error(exc):
    message = str(exc).upper()
    return 'ORA-00904' in message or 'INVALID IDENTIFIER' in message


def _is_relation_unavailable_error(exc):
    message = str(exc).upper()
    return 'ORA-00942' in message or 'TABLE OR VIEW DOES NOT EXIST' in message or 'ORA-01031' in message


def _build_where_clause_like(alias, seccional_columns):
    checks = []
    for col in seccional_columns:
        checks.append(
            f"UPPER(TRIM(NVL(TO_CHAR({alias}.{col}), ''))) LIKE UPPER(:seccional_like)"
        )
    return ' OR '.join(checks)


def _build_where_clause_exact(alias, seccional_columns):
    checks = []
    for col in seccional_columns:
        checks.append(
            f"TRIM(NVL(TO_CHAR({alias}.{col}), '')) = :seccional_exact"
        )
    return ' OR '.join(checks)


def _build_wrapped_query(base_query, where_clause=None, limit=None):
    if where_clause:
        query_text = f'SELECT * FROM ({base_query}) SRC_Q WHERE ({where_clause})'
    else:
        query_text = base_query
    if limit and int(limit) > 0:
        query_text = f'SELECT * FROM ({query_text}) LIM_Q WHERE ROWNUM <= :max_rows'
    return query_text


def _build_params(seccional_value=None, limit=None, include_exact=True, include_like=True):
    params = {}
    if seccional_value is not None:
        if include_exact:
            params['seccional_exact'] = str(seccional_value).strip()
        if include_like:
            params['seccional_like'] = f'%{seccional_value}%'
    if limit and int(limit) > 0:
        params['max_rows'] = int(limit)
    return params


def execute_oracle_query_with_optional_seccional(
    cursor,
    base_query,
    seccional='',
    seccional_columns=None,
    seccional_related_predicates=None,
    limit=None,
    stdout=None,
):
    seccional_value = str(seccional or '').strip()
    columns = tuple(seccional_columns or ())
    related_predicates = tuple(seccional_related_predicates or ())

    def _run(query_text, params):
        if params:
            cursor.execute(query_text, params)
        else:
            cursor.execute(query_text)

    attempted_filter = False

    if seccional_value and columns:
        attempted_filter = True
        predicate_variants = [columns] + [(col,) for col in columns]
        for candidate_columns in predicate_variants:
            where_clause = (
                f"({_build_where_clause_exact('SRC_Q', candidate_columns)}) "
                f"OR ({_build_where_clause_like('SRC_Q', candidate_columns)})"
            )
            query_with_filter = _build_wrapped_query(base_query, where_clause=where_clause, limit=limit)
            uses_exact = ':seccional_exact' in where_clause
            uses_like = ':seccional_like' in where_clause
            params = _build_params(
                seccional_value=seccional_value,
                limit=limit,
                include_exact=uses_exact,
                include_like=uses_like,
            )
            try:
                _run(query_with_filter, params)
                return {'filter_applied': True, 'fallback_without_filter': False, 'filter_mode': 'direct'}
            except oracledb.DatabaseError as exc:
                if _is_invalid_identifier_error(exc):
                    continue
                raise

    if seccional_value and related_predicates:
        attempted_filter = True
        for where_clause in related_predicates:
            query_with_filter = _build_wrapped_query(base_query, where_clause=where_clause, limit=limit)
            uses_exact = ':seccional_exact' in where_clause
            uses_like = ':seccional_like' in where_clause
            params = _build_params(
                seccional_value=seccional_value,
                limit=limit,
                include_exact=uses_exact,
                include_like=uses_like,
            )
            try:
                _run(query_with_filter, params)
                return {'filter_applied': True, 'fallback_without_filter': False, 'filter_mode': 'related_sql'}
            except oracledb.DatabaseError as exc:
                if _is_invalid_identifier_error(exc) or _is_relation_unavailable_error(exc):
                    continue
                raise

    if attempted_filter and stdout is not None:
        stdout.write(
            'Advertencia: no se pudo aplicar filtro por seccional '
            '(ni columnas directas ni relacion SQL disponible). Se ejecuta sin filtro.'
        )

    fallback_query = _build_wrapped_query(base_query, where_clause=None, limit=limit)
    fallback_params = _build_params(limit=limit)
    _run(fallback_query, fallback_params)
    return {
        'filter_applied': False,
        'fallback_without_filter': bool(seccional_value and attempted_filter),
        'filter_mode': 'none',
    }
