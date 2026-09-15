# scripts/vps — las tareas programadas de producción

**Todas las tareas programadas de BuscayCurra viven en el `crontab` de `root` del
VPS**, no en GitHub Actions. Esta carpeta es su copia versionada.

## Por qué no en GitHub Actions

GitHub solo lanza calendarios programados (`schedule`) desde la rama por defecto,
que es `main`. El 5 de julio de 2026 se desactivaron allí a propósito (commit
`553719a`: *"VPS ya tiene crons locales"*). Lo que haya en `.github/workflows/` de
`unified-production` **no se ejecuta solo**.

Se tropezó con esto en septiembre de 2026: el centinela y el barrido de Adzuna se
escribieron como workflows y nunca llegaron a correr, y el añadido de Japón y
Singapur a `sync-jobs.yml` no tuvo ningún efecto porque el script real de Careerjet
seguía sin ellos.

## Qué hay aquí

| Fichero | Qué hace |
|---|---|
| `crontab.txt` | El crontab completo, tal cual está instalado |
| `centinela.sh` | 12 comprobaciones contra datos reales; **correo** si cambia el resultado |
| `sync-adzuna-barrido.sh` | Lo publicado en Adzuna en 24 h, paginando sin palabras clave |
| `sync-careerjet-parallel.sh` | Careerjet, 26 países en paralelo |
| `sync-adzuna-19.sh`, `sync-adzuna-loop.sh` | Adzuna por palabra clave (método antiguo) |
| `sync-eures-loop.sh`, `sync-europa.sh`, `sync-usajobs-loop.sh`, `sync-arbeitsagentur.sh`, `sync-fuentes-recuperadas.sh` | Resto de fuentes |
| `limpiar-caducadas.sh` | Retira ofertas caducadas (05:30 UTC) |
| `extract-emails-fast.sh`, `mantenimiento-emails.sh` | Emails de contacto de las ofertas |
| `enviar-alertas.sh` | Alertas de empleo a los usuarios |
| `backup-bc.sh`, `restore-bc.sh` | Copia diaria de la base propia (04:00 UTC, 7 días) y su restauración |

## Reglas

1. **Ninguna clave escrita en un script.** El repositorio es público. Se leen del
   `.env.local` del servidor, con la misma línea que usan todos:
   `grep -E '^NOMBRE=' /root/.openclaw/workspace/buscaycurra-unified/.env.local`.
   El sello lo comprueba.
2. **Fin de línea LF.** Lo fuerza `.gitattributes`. Un script con CRLF revienta en
   el servidor.
3. **La copia tiene que ser igual que lo instalado.** Para cambiar algo:
   ```bash
   scp -i ~/.ssh/hostinger_openclaw scripts/vps/<script>.sh root@<VPS>:/tmp/
   ssh ... "bash -n /tmp/<script>.sh && install -m 755 /tmp/<script>.sh /root/<script>.sh"
   # si cambia el crontab:
   scp scripts/vps/crontab.txt root@<VPS>:/tmp/ && ssh ... "crontab /tmp/crontab.txt"
   ```
   Si un proceso está usando el script en ese momento, `install` crea un fichero
   nuevo y el proceso termina con la versión anterior sin romperse.

## Lo que NO está aquí, a propósito

- **`candados.sh`** — lleva una contraseña real escrita dentro. Hay que sacarla a
  `.env.local` antes de poder versionarlo.
- **`watchdog-bc.sh`** — no está en el crontab, y sus avisos solo van a
  `/tmp/watchdog-alerts.log`.
- Los demás `/root/sync-*.sh` — no están en el crontab. Entre ellos
  `sync-fuentes-extra.sh` y `sync-nocturno.sh`, que eran los únicos que
  sincronizaban **Arbeitnow**: por eso lleva parado desde el 19 de agosto de 2026.
