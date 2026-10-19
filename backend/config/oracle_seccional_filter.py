import re
import unicodedata
import os

import oracledb


CANONICAL_SECCIONAL_NAMES = (
    'Nacional',
    'Virtual',
    'El Socorro',
    'Cali',
    'Barranquilla',
    'Bogota',
    'Cucuta',
    'Cartagena',
    'Pereira',
)

_SECCIONAL_ALIASES = {
    'NACIONAL': 'Nacional',
    'AUTORIDADES NACIONALES': 'Nacional',
    'VIRTUAL': 'Virtual',
    'CAMPUS VIRTUAL': 'Virtual',
    'CAMPUS VIRTUAL UNILIBRE': 'Virtual',
    'EL SOCORRO': 'El Socorro',
    'SOCORRO': 'El Socorro',
    'CALI': 'Cali',
    'BARRANQUILLA': 'Barranquilla',
    'BOGOTA': 'Bogota',
    'CUCUTA': 'Cucuta',
    'CARTAGENA': 'Cartagena',
    'PEREIRA': 'Pereira',
}


def _norm_upper(value):
    text = str(value or '').strip()
    if not text:
        return ''
    no_accents = ''.join(
        ch for ch in unicodedata.normalize('NFD', text.upper()) if unicodedata.category(ch) != 'Mn'
    )
    return re.sub(r'\s+', ' ', no_accents).strip()


def normalize_seccional_name(value):
    """
    Normaliza aliases de seccional al nombre canonico de SIHUL.
    Si no reconoce alias, retorna el valor original sin modificar formato.
    """
    raw = str(value or '').strip()
    if not raw:
        return ''

    norm = _norm_upper(raw)
    if norm in _SECCIONAL_ALIASES:
        return _SECCIONAL_ALIASES[norm]

    for token, canonical in sorted(_SECCIONAL_ALIASES.items(), key=lambda x: len(x[0]), reverse=True):
        if re.search(rf'(^|\s){re.escape(token)}(\s|$)', norm):
            return canonical

    return raw


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


def _build_probe_query(base_query, where_clause=None):
    if where_clause:
        return f'SELECT 1 FROM ({base_query}) SRC_Q WHERE ({where_clause}) AND ROWNUM = 1'
    return f'SELECT 1 FROM ({base_query}) SRC_Q WHERE ROWNUM = 1'


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
    seccional_match_mode=None,
):
    seccional_raw = str(seccional or '').strip()
    seccional_value = normalize_seccional_name(seccional_raw)
    columns = tuple(seccional_columns or ())
    related_predicates = tuple(seccional_related_predicates or ())
    match_mode = str(seccional_match_mode or os.getenv('ORACLE_SECCIONAL_MATCH_MODE', 'smart')).strip().lower()
    if match_mode not in ('smart', 'exact', 'contains'):
        match_mode = 'smart'

    if seccional_raw and seccional_raw != seccional_value and stdout is not None:
        stdout.write(
            f"Filtro seccional normalizado: '{seccional_raw}' -> '{seccional_value}'"
        )

    def _run(query_text, params):
        if params:
            cursor.execute(query_text, params)
        else:
            cursor.execute(query_text)

    def _has_matches(where_clause, params):
        probe_query = _build_probe_query(base_query, where_clause=where_clause)
        _run(probe_query, params)
        return cursor.fetchone() is not None

    attempted_filter = False

    if seccional_value and columns:
        attempted_filter = True
        predicate_variants = [columns] + [(col,) for col in columns]
        for candidate_columns in predicate_variants:
            exact_clause = _build_where_clause_exact('SRC_Q', candidate_columns)
            like_clause = _build_where_clause_like('SRC_Q', candidate_columns)
            try:
                if match_mode in ('smart', 'exact'):
                    exact_params = _build_params(
                        seccional_value=seccional_value,
                        include_exact=True,
                        include_like=False,
                    )
                    exact_has_matches = True
                    if match_mode == 'smart':
                        exact_has_matches = _has_matches(exact_clause, exact_params)
                    if exact_has_matches:
                        use_exact_query = True
                        if match_mode == 'smart':
                            like_only_extra_clause = f"({like_clause}) AND NOT ({exact_clause})"
                            like_only_extra_params = _build_params(
                                seccional_value=seccional_value,
                                include_exact=True,
                                include_like=True,
                            )
                            if _has_matches(like_only_extra_clause, like_only_extra_params):
                                use_exact_query = False

                        if use_exact_query:
                            query_with_exact = _build_wrapped_query(base_query, where_clause=exact_clause, limit=limit)
                            _run(query_with_exact, _build_params(
                                seccional_value=seccional_value,
                                limit=limit,
                                include_exact=True,
                                include_like=False,
                            ))
                            return {
                                'filter_applied': True,
                                'fallback_without_filter': False,
                                'filter_mode': 'direct_exact',
                                'match_mode': match_mode,
                            }

                if match_mode in ('smart', 'contains'):
                    like_params = _build_params(
                        seccional_value=seccional_value,
                        include_exact=False,
                        include_like=True,
                    )
                    like_has_matches = True
                    if match_mode == 'smart':
                        like_has_matches = _has_matches(like_clause, like_params)
                    if like_has_matches:
                        query_with_like = _build_wrapped_query(base_query, where_clause=like_clause, limit=limit)
                        _run(query_with_like, _build_params(
                            seccional_value=seccional_value,
                            limit=limit,
                            include_exact=False,
                            include_like=True,
                        ))
                        return {
                            'filter_applied': True,
                            'fallback_without_filter': False,
                            'filter_mode': 'direct_like',
                            'match_mode': match_mode,
                        }
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
                return {
                    'filter_applied': True,
                    'fallback_without_filter': False,
                    'filter_mode': 'related_sql_exact' if uses_exact and not uses_like else 'related_sql_like',
                    'match_mode': match_mode,
                }
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
        'match_mode': match_mode,
    }
