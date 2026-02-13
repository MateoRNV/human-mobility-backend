# Scripts SQL Server - HumanMobility (MDMQ)

Esquema institucional para el Municipio de Quito (MDMQ), alineado con normativa CGE (Sección 3) y criterios SGDTIC.

## Criterios institucionales aplicados

- **Auditoría (trazabilidad)**: En todas las tablas operativas:
  - `fecha_creacion`, `fecha_modificacion` (DATETIME2(3), precisión milisegundos).
  - `usuario_creacion`, `usuario_modificacion` (quién creó/modificó; llenar cuando exista contexto de usuario).
- **Borrado lógico**: Campo `activo` (BIT, default 1). No se eliminan registros físicamente; se marca `activo = 0` para historial y cumplimiento normativo.
- **Precisión de fechas**: DATETIME2(3) en todas las columnas de fecha (estándar SGDTIC).
- **Integridad de cuestionarios**: UNIQUE (`persona_id`, `cuestionario_slug`) en `envios_cuestionario` — una persona un envío por formulario (ej. un triaje por persona).
- **Definiciones de cuestionarios**: Tabla `definiciones_cuestionario` para almacenar estructura de cuestionarios en el backend y permitir futura edición desde el frontend.
- **Nomenclatura**: Toda la BD en español (tablas y columnas). El backend sigue en inglés y mapea con TypeORM (`@Entity('personas')`, `@Column({ name: 'nombre' })`, etc.).

## Tablas (esquema en español)

| Tabla                        | Descripción |
|-----------------------------|-------------|
| `personas`                  | Personas (triaje/beneficiarios). Columnas: id, nombre, documento, servicios_derivados, activo, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion. |
| `definiciones_cuestionario` | Definición de cuestionarios. Columnas: id, slug, version, nombre, descripcion, configuracion_json, activo, auditoría. |
| `envios_cuestionario`       | Envíos de cuestionarios por persona. persona_id → personas(id), cuestionario_slug, version_cuestionario, respuestas_json, enviado_en, activo, auditoría. UNIQUE(persona_id, cuestionario_slug). |

## Requisitos

- SQL Server instalado (local o remoto).
- Usuario con permisos para crear bases de datos (para `01-create-database.sql`) y tablas.

## Crear la base de datos

### Opción 1: Ejecutar los scripts manualmente

1. **Crear la base de datos**  
   En **SQL Server Management Studio (SSMS)** o **Azure Data Studio**:
   - Conéctate al servidor (ej: `localhost`, puerto `1433`).
   - Abre y ejecuta `01-create-database.sql` (crea la base `HumanMobility` si no existe).

2. **Crear las tablas**  
   Con la base `HumanMobility` seleccionada, ejecuta `02-create-schema.sql`.  
   Crea las tablas en español: `personas`, `definiciones_cuestionario`, `envios_cuestionario` con claves, FKs, auditoría y borrado lógico.

3. **Si ya tenías un esquema anterior en inglés (persons, form_submissions)**  
   Ejecuta `03-alter-audit-existing.sql` para añadir auditoría y `activo` a esas tablas. Para instalaciones nuevas se usa solo el esquema en español (paso 2).

### Opción 2: Línea de comandos (sqlcmd)

Ajusta `Server=localhost` y `-U sa -P YourPassword` según tu entorno:

```bash
sqlcmd -S localhost,1433 -U sa -P YourPassword -i scripts/01-create-database.sql
sqlcmd -S localhost,1433 -U sa -P YourPassword -d HumanMobility -i scripts/02-create-schema.sql
```

## Sincronización automática (desarrollo)

Con `NODE_ENV` distinto de `production`, TypeORM puede crear/actualizar las tablas al arrancar la app (`synchronize: true`). En ese caso solo necesitas que la base de datos `HumanMobility` exista (por ejemplo ejecutando solo `01-create-database.sql`). Asegúrate de que el esquema generado por TypeORM coincida con este diseño (entidades ya mapean columnas de auditoría y `activo`).

En **producción** no uses `synchronize`; crea el esquema con estos scripts o con migraciones.

## Variables de entorno

Configura `.env` según `.env.example`:

- `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_DATABASE`
- Opcional: `MSSQL_OPTIONS_TRUST_SERVER_CERTIFICATE=true` para desarrollo local con certificado no confiable.
