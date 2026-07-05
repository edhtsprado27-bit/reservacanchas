-- =============================================
-- SISTEMA WEB PARA RESERVAR CANCHAS DEPORTIVAS
-- Base de datos: SQL Server
-- =============================================

CREATE DATABASE reservacanchas;
GO

USE reservacanchas;
GO

-- Tabla: usuarios
CREATE TABLE usuarios (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    nombre        NVARCHAR(100)  NOT NULL,
    apellido      NVARCHAR(100)  NOT NULL,
    correo        NVARCHAR(255)  NOT NULL UNIQUE,
    contrasena    NVARCHAR(255)  NOT NULL,
    rol           NVARCHAR(20)   NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario','administrador')),
    estado        NVARCHAR(20)   NOT NULL DEFAULT 'activo'  CHECK (estado IN ('activo','suspendido')),
    fecha_creacion DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- Tabla: canchas
CREATE TABLE canchas (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(150)  NOT NULL,
    tipo        NVARCHAR(20)   NOT NULL CHECK (tipo IN ('futbol','voley')),
    ubicacion   NVARCHAR(255)  NOT NULL,
    precio_hora DECIMAL(10,2)  NOT NULL CHECK (precio_hora > 0),
    estado      NVARCHAR(20)   NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva','mantenimiento'))
);
GO

-- Tabla: horarios
CREATE TABLE horarios (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    cancha_id   INT            NOT NULL REFERENCES canchas(id) ON DELETE CASCADE,
    fecha       DATE           NOT NULL,
    hora_inicio TIME           NOT NULL,
    hora_fin    TIME           NOT NULL,
    estado      NVARCHAR(20)   NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','reservado','bloqueado'))
);
GO

-- Tabla: reservas
CREATE TABLE reservas (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id          INT           NOT NULL REFERENCES usuarios(id),
    cancha_id           INT           NOT NULL REFERENCES canchas(id),
    horario_id          INT           NOT NULL REFERENCES horarios(id),
    fecha               DATE          NOT NULL,
    hora_inicio         TIME          NOT NULL,
    hora_fin            TIME          NOT NULL,
    estado              NVARCHAR(20)  NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('pendiente','confirmada','cancelada','completada')),
    motivo_cancelacion  NVARCHAR(500) NULL,
    fecha_reserva       DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- Tabla: pagos
CREATE TABLE pagos (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    reserva_id  INT            NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    monto       DECIMAL(10,2)  NOT NULL CHECK (monto >= 0),
    estado_pago NVARCHAR(20)   NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','pagado','reembolsado')),
    fecha_pago  DATETIME       NULL
);
GO

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Administrador (contraseña: Admin123)
INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol) VALUES
('Admin', 'Sistema', 'admin@reservacanchas.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador');

-- Usuarios de prueba (contraseña: Test1234)
INSERT INTO usuarios (nombre, apellido, correo, contrasena) VALUES
('Juan',  'Perez',  'juan@mail.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Maria', 'Lopez',  'maria@mail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Canchas
INSERT INTO canchas (nombre, tipo, ubicacion, precio_hora) VALUES
('Cancha Futbol 1', 'futbol', 'Sector Norte - Pabellon A', 30.00),
('Cancha Futbol 2', 'futbol', 'Sector Norte - Pabellon B', 25.00),
('Cancha Voley 1',  'voley',  'Sector Sur  - Area Central', 20.00),
('Cancha Voley 2',  'voley',  'Sector Sur  - Area Exterior', 18.00);

-- Horarios para hoy y mañana
DECLARE @hoy DATE = CAST(GETDATE() AS DATE);
DECLARE @manana DATE = DATEADD(DAY, 1, @hoy);

INSERT INTO horarios (cancha_id, fecha, hora_inicio, hora_fin) VALUES
(1, @hoy,    '08:00', '09:00'),
(1, @hoy,    '09:00', '10:00'),
(1, @hoy,    '10:00', '11:00'),
(1, @hoy,    '14:00', '15:00'),
(1, @hoy,    '15:00', '16:00'),
(1, @manana, '08:00', '09:00'),
(1, @manana, '09:00', '10:00'),
(2, @hoy,    '08:00', '09:00'),
(2, @hoy,    '09:00', '10:00'),
(2, @manana, '10:00', '11:00'),
(3, @hoy,    '08:00', '09:00'),
(3, @hoy,    '09:00', '10:00'),
(3, @hoy,    '10:00', '11:00'),
(3, @manana, '08:00', '09:00'),
(4, @hoy,    '09:00', '10:00'),
(4, @manana, '09:00', '10:00');
GO

PRINT 'Base de datos creada exitosamente';
GO
