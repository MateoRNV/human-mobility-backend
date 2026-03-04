# Estrategia de ramas — HumanMobilityBackend

## Modelo de ramas

```
main         ← producción (solo merge desde release/* o hotfix/*)
develop      ← integración (todas las features van aquí primero)
feature/*    ← trabajo nuevo
release/*    ← preparación de versión
hotfix/*     ← correcciones urgentes en producción
```

## Flujo normal (feature → develop → main)

```bash
# 1. Partir siempre desde develop actualizado
git checkout develop
git pull origin develop

# 2. Crear rama de feature
git checkout -b feature/nombre-descriptivo

# 3. Trabajar y hacer commits
git add <archivos>
git commit -m "feat: descripción del cambio"

# 4. Subir y abrir PR hacia develop
git push origin feature/nombre-descriptivo
# → Abrir PR en GitHub: feature/nombre-descriptivo → develop

# 5. PR aprobado → merge a develop (squash recomendado)
# 6. Eliminar rama local y remota tras el merge
git branch -d feature/nombre-descriptivo
git push origin --delete feature/nombre-descriptivo
```

## Release (develop → main)

```bash
# 1. Crear rama de release desde develop
git checkout develop
git pull origin develop
git checkout -b release/1.0.0

# 2. Ajustes de versión si hace falta (package.json, etc.)
git commit -m "chore: bump version to 1.0.0"

# 3. PR a main
git push origin release/1.0.0
# → Abrir PR en GitHub: release/1.0.0 → main

# 4. PR a develop también (para que los ajustes no se pierdan)
# → Abrir segundo PR: release/1.0.0 → develop

# 5. Etiquetar la versión en main tras el merge
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Hotfix (bug urgente en producción)

```bash
# 1. Partir desde main
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-del-bug

# 2. Corregir y commitear
git commit -m "fix: descripción del fix"

# 3. PR a main Y a develop
git push origin hotfix/descripcion-del-bug
# → PR: hotfix/* → main
# → PR: hotfix/* → develop
```

## Convenciones de nombres de rama

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Feature | `feature/descripcion` | `feature/campos-auditoria` |
| Bug en develop | `fix/descripcion` | `fix/jwt-secret-timing` |
| Release | `release/x.y.z` | `release/1.2.0` |
| Hotfix | `hotfix/descripcion` | `hotfix/login-500-error` |

## Convenciones de commits (Conventional Commits)

```
feat:     nueva funcionalidad
fix:      corrección de bug
chore:    mantenimiento (deps, config, etc.)
docs:     solo documentación
refactor: refactorización sin cambio de comportamiento
test:     añadir o corregir tests
```

Ejemplos:
```
feat: agregar exportación de cuestionarios a PDF
fix: corregir 401 al refrescar token JWT
chore(deps): actualizar nest a v11.1.0
test: agregar tests de integración para PersonsController
```

---

## Configuración de branch protection en GitHub

> Hacer esto una sola vez en GitHub → Settings → Branches → Add rule.

### Rama `main`

```
Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Status checks: build-and-test

☑ Do not allow bypassing the above settings
```

### Rama `develop`

```
Branch name pattern: develop

☑ Require a pull request before merging
  ☑ Require approvals: 1

☑ Require status checks to pass before merging
  Status checks: build-and-test
```

---

## Activación inicial (ejecutar una sola vez)

```bash
git checkout -b develop
git push -u origin develop
```

Luego configurar las branch protection rules en GitHub según la sección anterior.

---

## Docker — uso independiente

```bash
# Levantar BD + backend (desde este directorio)
docker-compose up --build

# Solo la BD (para desarrollo local con npm run start:dev)
docker-compose up mssql

# Detener y limpiar
docker-compose down
```

Variables de entorno: copia `.env.example` a `.env` y ajusta los valores antes de levantar.
