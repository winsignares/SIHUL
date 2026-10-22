# Despliegue automático a producción (runner + aprobación)

Cuando se fusiona a `main`: GitHub construye y publica las imágenes (`Build Images`) → arranca `Deploy Production` →
**espera la aprobación** del entorno `production` → un runner en el servidor ejecuta **un único script de root**
(`/usr/local/sbin/sihul-deploy-ci`) que valida, respalda y despliega con vuelta atrás automática.

## Qué puede y qué no puede hacer el runner

El repositorio es público, y un runner propio en un repositorio público es un riesgo si se configura a la ligera. Por eso:

- El runner corre como el usuario `github-runner`, **sin** permisos de Docker ni de root.
- Su único permiso es `sudo /usr/local/sbin/sihul-deploy-ci <sha>` (`despliegue/servidor/sudoers-sihul-runner`).
- Ese script es una **copia de root**, fuera del repositorio: ni `git pull` ni el usuario del runner la modifican.
  Solo despliega si el commit es **exactamente la punta de `origin/main`**, fuera de la ventana de la ETL
  (05:00–06:45 UTC), con las tres imágenes presentes y con un respaldo nuevo.
- El workflow no hace `checkout`: no ejecuta código del repositorio en el servidor. Solo se activa por un `push` a `main`
  de este repositorio (nunca por un fork ni un PR) y necesita aprobación.
- Si el despliegue no queda sano, `deploy.sh` vuelve solo a la versión anterior.

## Pasos en GitHub (con permisos de administrador)

1. **Settings → Environments → New environment → `production`**: *Required reviewers* (mejor dos personas),
   *Deployment branches: Selected branches → `main`*.
2. **Settings → Actions → General**: *Fork pull request workflows*: exigir aprobación para todos los colaboradores externos;
   *Workflow permissions*: solo lectura.
3. **Settings → Actions → Runners → New self-hosted runner** (Linux x64): copiar el `token` (caduca en ~1 hora).
   Si el repositorio es de una organización, restringir el grupo de runners a este repositorio.

## Pasos en el servidor (como root)

```bash
useradd -m -s /bin/bash github-runner            # SIN grupo docker
cd /opt/sihul-repo && git pull -q
install -m 750 -o root -g root despliegue/scripts/deploy-ci.sh /usr/local/sbin/sihul-deploy-ci
install -m 440 -o root -g root despliegue/servidor/sudoers-sihul-runner /etc/sudoers.d/sihul-runner
visudo -cf /etc/sudoers.d/sihul-runner
mkdir -p /var/log/sihul-deploy
```

Instalar el runner con los comandos que muestra la página *New self-hosted runner* (descarga y `config.sh`), como
`github-runner`, con la etiqueta `sihul-prod`:

```bash
su - github-runner
mkdir actions-runner && cd actions-runner
# (descargar y descomprimir según indica la página de GitHub)
./config.sh --url https://github.com/winsignares/SIHUL --token <TOKEN> --labels sihul-prod --name sihul-prod --unattended
exit
cd /home/github-runner/actions-runner && ./svc.sh install github-runner && ./svc.sh start
```

Consume unos 150 MB de RAM. Comprobar: en GitHub el runner aparece *Idle*.

## Prueba y uso

1. **Actions → Deploy Production → Run workflow** (rama `main`). Debe quedar esperando la aprobación; aprobar.
2. Seguimiento: `/var/log/sihul-deploy/deploy-<fecha>.log`. Debe terminar con `despliegue terminado: prod en <sha>`.
3. Desde entonces, cada fusión a `main` repite el proceso. Si cae en la ventana de la ETL, el job falla con
   *ventana de la ETL*: se vuelve a ejecutar desde **Re-run jobs** después.
4. Volver atrás a mano: `bash /opt/sihul-repo/despliegue/scripts/rollback.sh prod`.

## Desactivarlo

`cd /home/github-runner/actions-runner && ./svc.sh stop`. Sin runner, el workflow queda esperando y no despliega nada.
