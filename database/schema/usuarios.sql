-- Snapshot actual de la tabla usuarios según la estructura vigente en MySQL
CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  tenant_id CHAR(36) NULL,
  nombre VARCHAR(200) NULL,
  email VARCHAR(200) NOT NULL,
  password_hash TEXT NULL,
  rol VARCHAR(50) NULL DEFAULT 'usuario',
  status ENUM('pending', 'approved', 'rejected') NULL DEFAULT 'pending',
  activo TINYINT(1) NULL DEFAULT 0,
  creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
);
