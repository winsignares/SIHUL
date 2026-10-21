# Aplicar las políticas de rama (guía para el administrador)

Repositorio: `winsignares/SIHUL`. Requiere rol **Admin** del repositorio (o propietario de la organización).

## Qué se aplica

| Rama | Reglas |
|---|---|
| `main` | Solo por PR. 1 aprobación de **otra persona** (el autor no puede aprobar su propio PR); si se sube un commit después de aprobar, lo debe aprobar alguien distinto de quien lo subió. Solo *merge commit*. Sin force push ni borrado. Checks obligatorios (sin exigir que la rama esté al día con main, para no obligar a actualizar develop tras cada release). Sin excepciones (bypass vacío). |
| `develop` | Solo por PR. 1 aprobación de otra persona. Solo *squash*. Sin force push ni borrado. Checks obligatorios. |

Origen de los PR (lo exige el check `check`, de `.github/workflows/branch-policy.yml`):
- A `main`: solo desde `develop` o `hotfix/*`.
- A `develop`: solo desde `feature/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*` o `hotfix/*`.

Checks obligatorios: `check` (política de ramas), `backend-tests` y `frontend-build` (`.github/workflows/ci.yml`).

## Orden obligatorio (si no, se bloquea el repositorio)

Los rulesets exigen checks que deben existir en las ramas. Si se activan antes de que los workflows estén en `develop` y `main`, ningún PR podrá fusionarse, ni siquiera el que agrega los workflows.

1. Fusionar a `develop` el PR que agrega `.github/workflows/branch-policy.yml`, `.github/workflows/ci.yml`, `CODEOWNERS` y la plantilla de PR.
2. Fusionar `develop` → `main` por PR, para que los workflows existan también en `main`.
3. Abrir cualquier PR de prueba y comprobar que aparecen los tres checks (`check`, `backend-tests`, `frontend-build`) y que pasan. **Si `backend-tests` falla, corregir antes de seguir.**
4. Solo entonces, aplicar los rulesets (siguiente sección).

## Aplicar (con GitHub CLI, sesión de un administrador)

Desde la raíz del repositorio:

```bash
gh api repos/winsignares/SIHUL/rulesets --method POST --input infra/github/ruleset-main.json
gh api repos/winsignares/SIHUL/rulesets --method POST --input infra/github/ruleset-develop.json
gh api repos/winsignares/SIHUL --method PATCH -f delete_branch_on_merge=true
```

Alternativa por la web: *Settings → Rules → Rulesets → New branch ruleset* y reproducir las reglas de la tabla.

## Verificar

```bash
gh api repos/winsignares/SIHUL/rulesets --jq '.[] | {id, name, enforcement}'
gh api repos/winsignares/SIHUL/rules/branches/main --jq '.[].type'
gh api repos/winsignares/SIHUL/rules/branches/develop --jq '.[].type'
```

Pruebas manuales (deben fallar o quedar bloqueadas):
1. `git push origin main` y `git push origin develop` directos → rechazados.
2. Force push a `develop` → rechazado, incluso siendo administrador.
3. PR de una rama sin prefijo permitido hacia `main` → falla el check `check`.
4. PR `develop` → `main` sin aprobación de otra persona → no se puede fusionar.
5. PR con un test roto → no se puede fusionar.

## Emergencia / deshacer

Con el bypass vacío nadie salta las reglas. Si hace falta una excepción real, un administrador puede desactivar el ruleset de forma temporal:

```bash
gh api repos/winsignares/SIHUL/rulesets --jq '.[] | {id, name}'
gh api repos/winsignares/SIHUL/rulesets/ID --method PUT -f enforcement=disabled
```

y volver a activarlo después con `-f enforcement=active`.

## Notas

- Las reglas de protección en repositorios privados de una organización dependen del plan de GitHub de la organización.
- `CODEOWNERS` hoy solo lista a `@HarlemHM`. Agregar al segundo integrante del equipo.
- Los nombres de los checks deben coincidir con los jobs de los workflows. Si se renombra un job, actualizar los rulesets.
