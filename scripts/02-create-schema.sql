-- =============================================
-- HumanMobility Backend - Esquema institucional MDMQ
-- Normativa CGE: auditoría, borrado lógico, precisión de fechas
-- Nomenclatura: toda la BD en español
-- Ejecutar con la base de datos HumanMobility seleccionada
-- =============================================

USE [HumanMobility];
GO

-- Precisión de fechas (SGDTIC): DATETIME2(3) = milisegundos

-- Tabla: personas
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'personas')
BEGIN
  CREATE TABLE [dbo].[personas] (
    [id]                    INT IDENTITY(1,1) NOT NULL,
    [nombre]                NVARCHAR(255)    NOT NULL,
    [documento]             NVARCHAR(100)   NULL,
    [cuestionarios]         NVARCHAR(MAX)   NULL,
    [activo]                BIT             NOT NULL DEFAULT 1,
    [fecha_creacion]        DATETIME2(3)    NOT NULL DEFAULT (GETUTCDATE()),
    [fecha_modificacion]    DATETIME2(3)    NOT NULL DEFAULT (GETUTCDATE()),
    [usuario_creacion]      NVARCHAR(100)   NULL,
    [usuario_modificacion]  NVARCHAR(100)   NULL,
    CONSTRAINT [PK_personas] PRIMARY KEY CLUSTERED ([id])
  );
  CREATE NONCLUSTERED INDEX [IX_personas_activo] ON [dbo].[personas]([activo]);
  PRINT 'Tabla personas creada.';
END
ELSE
  PRINT 'Tabla personas ya existe.';

GO

-- Tabla: definiciones_cuestionario (editable desde backend/frontend)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'definiciones_cuestionario')
BEGIN
  CREATE TABLE [dbo].[definiciones_cuestionario] (
    [id]                    INT IDENTITY(1,1) NOT NULL,
    [slug]                  NVARCHAR(50)    NOT NULL,
    [version]               INT             NOT NULL DEFAULT 1,
    [nombre]                NVARCHAR(200)   NULL,
    [configuracion_json]     NVARCHAR(MAX)   NULL,
    [activo]                BIT             NOT NULL DEFAULT 1,
    [fecha_creacion]        DATETIME2(3)    NOT NULL DEFAULT (GETUTCDATE()),
    [fecha_modificacion]    DATETIME2(3)    NOT NULL DEFAULT (GETUTCDATE()),
    [usuario_creacion]      NVARCHAR(100)   NULL,
    [usuario_modificacion]  NVARCHAR(100)   NULL,
    CONSTRAINT [PK_definiciones_cuestionario] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UQ_definiciones_cuestionario_slug_version] UNIQUE ([slug], [version])
  );
  CREATE NONCLUSTERED INDEX [IX_definiciones_cuestionario_slug] ON [dbo].[definiciones_cuestionario]([slug]);
  CREATE NONCLUSTERED INDEX [IX_definiciones_cuestionario_activo] ON [dbo].[definiciones_cuestionario]([activo]);
  PRINT 'Tabla definiciones_cuestionario creada.';
END
ELSE
  PRINT 'Tabla definiciones_cuestionario ya existe.';

GO

-- Tabla: envios_cuestionario (un envío por persona y cuestionario)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'envios_cuestionario')
BEGIN
  CREATE TABLE [dbo].[envios_cuestionario] (
    [id]                    INT IDENTITY(1,1) NOT NULL,
    [persona_id]            INT             NOT NULL,
    [cuestionario_slug]      NVARCHAR(50)    NOT NULL,
    [version_cuestionario]  INT             NOT NULL DEFAULT 1,
    [respuestas_json]       NVARCHAR(MAX)   NULL,
    [enviado_en]            DATETIME2(3)    NULL,
    [activo]                BIT             NOT NULL DEFAULT 1,
    [fecha_creacion]        DATETIME2(3)    NOT NULL DEFAULT (GETUTCDATE()),
    [fecha_modificacion]    DATETIME2(3)    NOT NULL DEFAULT (GETUTCDATE()),
    [usuario_creacion]      NVARCHAR(100)   NULL,
    [usuario_modificacion]  NVARCHAR(100)   NULL,
    CONSTRAINT [PK_envios_cuestionario] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FK_envios_cuestionario_persona] FOREIGN KEY ([persona_id])
      REFERENCES [dbo].[personas]([id]) ON DELETE CASCADE
  );

  -- Restricción UNIQUE en paso aparte para evitar error de columna no encontrada en algunos entornos
  ALTER TABLE [dbo].[envios_cuestionario]
    ADD CONSTRAINT [UQ_envios_cuestionario_persona_formulario] UNIQUE ([persona_id], [cuestionario_slug]);

  CREATE NONCLUSTERED INDEX [IX_envios_cuestionario_persona_id]
    ON [dbo].[envios_cuestionario]([persona_id]);
  CREATE NONCLUSTERED INDEX [IX_envios_cuestionario_activo]
    ON [dbo].[envios_cuestionario]([activo]);

  PRINT 'Tabla envios_cuestionario creada.';
END
ELSE
BEGIN
  PRINT 'Tabla envios_cuestionario ya existe.';
  -- Si la tabla existía por un run anterior fallido, asegurar la restricción UNIQUE
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_envios_cuestionario_persona_formulario' AND object_id = OBJECT_ID(N'dbo.envios_cuestionario'))
  BEGIN
    ALTER TABLE [dbo].[envios_cuestionario]
      ADD CONSTRAINT [UQ_envios_cuestionario_persona_formulario] UNIQUE ([persona_id], [cuestionario_slug]);
    PRINT 'Restricción UQ_envios_cuestionario_persona_formulario agregada.';
  END
END

GO
