# HumanMobility Backend

API NestJS con Microsoft SQL Server para el registro de personas y cuestionarios (triaje, trabajo social, legal, psicológico).

## Requisitos

- Node.js 18+
- Microsoft SQL Server (local o remoto)

## Base de datos con Docker

Si usas el SQL Server del `docker-compose.yml`:

1. **Levantar el contenedor**
   ```bash
   docker-compose up -d
   ```
2. **Esperar ~20-30 segundos** hasta que SQL Server esté listo.
3. **Crear la base de datos** (solo la primera vez). Desde tu máquina, con **Azure Data Studio**, **SSMS** o **sqlcmd**:
   - Servidor: `localhost,1433`
   - Usuario: `sa`
   - Contraseña: la de `MSSQL_SA_PASSWORD` en `docker-compose.yml` (ej: `Movilidad_2026!`)
   - Ejecutar el script `scripts/01-create-database.sql`.
4. Opcional: ejecutar `scripts/02-create-schema.sql` si no usas `synchronize` de TypeORM.
5. El `.env` del backend debe usar los mismos datos: `MSSQL_HOST=localhost`, `MSSQL_PORT=1433`, `MSSQL_USER=sa`, `MSSQL_PASSWORD=...`, `MSSQL_DATABASE=HumanMobility`, y para Docker local: `MSSQL_OPTIONS_ENCRYPT=false`, `MSSQL_OPTIONS_TRUST_SERVER_CERTIFICATE=true`.

Luego arranca el backend con `npm run start:dev`.

## Configuración

1. Copia el archivo de ejemplo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env` con los datos de tu SQL Server:
   - `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_DATABASE`
   - En desarrollo local suele usarse `MSSQL_OPTIONS_TRUST_SERVER_CERTIFICATE=true`

3. Crea la base de datos en SQL Server (por ejemplo `HumanMobility`). Con `synchronize: true` (por defecto en desarrollo), TypeORM creará las tablas al arrancar.

## Instalación y ejecución

```bash
npm install
npm run start:dev
```

El servidor queda en `http://localhost:3001` (o el `PORT` que definas en `.env`).

## API

- `GET /api/persons` — Lista de personas (con `derivedServices` y resumen de `forms`).
- `GET /api/persons/:id` — Detalle de una persona.
- `POST /api/persons` — Crear persona (`body: { name, document? }`).
- `PATCH /api/persons/:id` — Actualizar persona.
- `GET /api/persons/:personId/forms/:slug` — Obtener respuestas de un cuestionario (ej. `slug=triaje`).
- `PUT /api/persons/:personId/forms/:slug` — Guardar/actualizar respuestas. Si `slug=triaje`, se actualiza `derivedServices` según el campo de derivación (fld-60).

Slugs de formularios: `triaje`, `social-work`, `legal`, `psicological`, `medios-vida`.
