"""Migración: agregar columna 'estado' a celdas_oraciones."""
import sqlite3

conn = sqlite3.connect("bingomundial.db")
conn.execute(
    "ALTER TABLE celdas_oraciones ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'normal'"
)
conn.commit()
print("Columna 'estado' agregada exitosamente a celdas_oraciones.")
conn.close()
