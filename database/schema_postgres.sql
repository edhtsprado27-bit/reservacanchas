-- =============================================
-- RESERVACANCHAS - PostgreSQL (Render)
-- =============================================

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100)  NOT NULL,
  apellido       VARCHAR(100)  NOT NULL,
  correo         VARCHAR(255)  NOT NULL UNIQUE,
  contrasena     VARCHAR(255)  NOT NULL,
  rol            VARCHAR(20)   NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario','administrador')),
  estado         VARCHAR(20)   NOT NULL DEFAULT 'activo'  CHECK (estado IN ('activo','suspendido')),
  fecha_creacion TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Tabla: canchas
CREATE TABLE IF NOT EXISTS canchas (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(150)  NOT NULL,
  tipo        VARCHAR(20)   NOT NULL CHECK (tipo IN ('futbol','voley')),
  ubicacion   VARCHAR(255)  NOT NULL,
  precio_hora DECIMAL(10,2) NOT NULL CHECK (precio_hora > 0),
  estado      VARCHAR(20)   NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva','mantenimiento'))
);

-- Tabla: horarios
CREATE TABLE IF NOT EXISTS horarios (
  id          SERIAL PRIMARY KEY,
  cancha_id   INT           NOT NULL REFERENCES canchas(id) ON DELETE CASCADE,
  fecha       DATE          NOT NULL,
  hora_inicio TIME          NOT NULL,
  hora_fin    TIME          NOT NULL,
  estado      VARCHAR(20)   NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','reservado','bloqueado'))
);

-- Tabla: reservas
CREATE TABLE IF NOT EXISTS reservas (
  id                  SERIAL PRIMARY KEY,
  usuario_id          INT          NOT NULL REFERENCES usuarios(id),
  cancha_id           INT          NOT NULL REFERENCES canchas(id),
  horario_id          INT          NOT NULL REFERENCES horarios(id),
  fecha               DATE         NOT NULL,
  hora_inicio         TIME         NOT NULL,
  hora_fin            TIME         NOT NULL,
  estado              VARCHAR(20)  NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('pendiente','confirmada','cancelada','completada')),
  motivo_cancelacion  VARCHAR(500),
  fecha_reserva       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabla: pagos
CREATE TABLE IF NOT EXISTS pagos (
  id          SERIAL PRIMARY KEY,
  reserva_id  INT            NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  monto       DECIMAL(10,2)  NOT NULL CHECK (monto >= 0),
  estado_pago VARCHAR(20)    NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente','pagado','reembolsado')),
  fecha_pago  TIMESTAMP
);

-- Datos de prueba
INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol) VALUES
('Admin', 'Sistema', 'admin@reservacanchas.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'administrador')
ON CONFLICT (correo) DO NOTHING;

INSERT INTO canchas (nombre, tipo, ubicacion, precio_hora) VALUES
('Cancha Futbol 1', 'futbol', 'Sector Norte - Pabellon A', 30.00),
('Cancha Futbol 2', 'futbol', 'Sector Norte - Pabellon B', 25.00),
('Cancha Voley 1',  'voley',  'Sector Sur - Area Central',  20.00),
('Cancha Voley 2',  'voley',  'Sector Sur - Area Exterior', 18.00)
ON CONFLICT DO NOTHING;

-- Horarios para los próximos 14 días
INSERT INTO horarios (cancha_id, fecha, hora_inicio, hora_fin)
SELECT c.id, d.fecha, h.hora_inicio, h.hora_fin
FROM canchas c
CROSS JOIN (
  SELECT CURRENT_DATE + i AS fecha
  FROM generate_series(0, 13) AS i
) d
CROSS JOIN (
  VALUES
    ('06:00'::TIME,'07:00'::TIME),('07:00'::TIME,'08:00'::TIME),
    ('08:00'::TIME,'09:00'::TIME),('09:00'::TIME,'10:00'::TIME),
    ('10:00'::TIME,'11:00'::TIME),('11:00'::TIME,'12:00'::TIME),
    ('14:00'::TIME,'15:00'::TIME),('15:00'::TIME,'16:00'::TIME),
    ('16:00'::TIME,'17:00'::TIME),('17:00'::TIME,'18:00'::TIME),
    ('18:00'::TIME,'19:00'::TIME),('19:00'::TIME,'20:00'::TIME),
    ('20:00'::TIME,'21:00'::TIME),('21:00'::TIME,'22:00'::TIME)
) AS h(hora_inicio, hora_fin)
ON CONFLICT DO NOTHING;

SELECT 'Base de datos PostgreSQL creada exitosamente' AS resultado;
