-- =============================================
-- HumanMobility Backend - Crear base de datos
-- Ejecutar como usuario con permisos para crear bases de datos (ej: sa)
-- =============================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'HumanMobility')
BEGIN
  CREATE DATABASE [HumanMobility]
    COLLATE Latin1_General_CI_AS;
  PRINT 'Base de datos HumanMobility creada correctamente.';
END
ELSE
  PRINT 'La base de datos HumanMobility ya existe.';

GO
