# Base de datos y ORM (SQLAlchemy + SQLite)

Este proyecto usa **SQLAlchemy 2.x** como ORM y **SQLite** como motor de base de datos. No hace falta instalar un servidor de BD ni drivers ODBC: SQLite viene incluido con Python.

## Requisitos previos

Solo necesitas Python 3.11+ y las dependencias del backend (`pip install -r requirements.txt`).

## Archivo de base de datos

Por defecto la API crea y usa el archivo `backend/bingomundial.db`. Las tablas se generan automáticamente al iniciar la API (`Base.metadata.create_all` en `app/main.py`).

### Tablas generadas

| Tabla       | Columnas principales                          |
|-------------|-----------------------------------------------|
| `usuarios`  | `id`, `nombre` (único), `contrasena` (hash)   |
| `oraciones` | `id`, `usuario_id` (FK), `texto`, `orden`     |

## Configurar la conexión

1. Copia el archivo de ejemplo:

```powershell
cd backend
copy .env.example .env
```

2. Edita `.env` si quieres cambiar la ruta del archivo SQLite:

```env
DATABASE_URL=sqlite:///./bingomundial.db
SECRET_KEY=una-clave-secreta-larga-y-aleatoria
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### Formato de la URL

```
sqlite:///<ruta_al_archivo.db>
```

Ejemplos:

| Escenario              | URL                                              |
|------------------------|--------------------------------------------------|
| Archivo en `backend/`  | `sqlite:///./bingomundial.db`                    |
| Ruta absoluta (Windows)| `sqlite:///C:/Users/tu/bingo.db`                 |
| Memoria (solo pruebas) | `sqlite:///:memory:`                             |

> En Windows usa barras `/` en la ruta absoluta. Si no defines `DATABASE_URL`, la API usa `backend/bingomundial.db` por defecto.

## Instalar dependencias del backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Iniciar la API

```powershell
uvicorn app.main:app --reload --port 8000
```

Comprueba: [http://localhost:8000/api/health](http://localhost:8000/api/health)

Documentación interactiva: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Uso básico del ORM (SQLAlchemy)

### 1. Engine y sesión

El engine representa la conexión al archivo SQLite. La sesión es el “workspace” para consultas:

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

En FastAPI, inyecta la sesión con `Depends(get_db)`.

### 2. Definir modelos (entidades)

```python
# app/models.py
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String

class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True)
    contrasena: Mapped[str] = mapped_column(String(255))
```

Cada clase mapea una tabla; cada atributo tipado con `Mapped[...]` es una columna.

### 3. Crear tablas

```python
from app.database import Base, engine
Base.metadata.create_all(bind=engine)
```

En producción suele usarse **Alembic** para migraciones versionadas.

### 4. Insertar (CREATE)

```python
usuario = Usuario(nombre="ana", contrasena=hash_password("1234"))
db.add(usuario)
db.commit()
db.refresh(usuario)  # obtiene el id generado
```

### 5. Consultar (READ)

```python
# Por filtro
user = db.query(Usuario).filter(Usuario.nombre == "ana").first()

# Por clave primaria
user = db.get(Usuario, 1)

# Listar con relación
user = db.get(Usuario, 1)
for oracion in user.oraciones:
    print(oracion.texto)
```

### 6. Actualizar (UPDATE)

```python
oracion = db.get(Oracion, 5)
oracion.texto = "Nuevo texto"
db.commit()
```

### 7. Eliminar (DELETE)

```python
oracion = db.get(Oracion, 5)
db.delete(oracion)
db.commit()
```

### 8. Relaciones

```python
class Usuario(Base):
    oraciones: Mapped[list["Oracion"]] = relationship(back_populates="usuario")

class Oracion(Base):
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    usuario: Mapped["Usuario"] = relationship(back_populates="oraciones")
```

`cascade="all, delete-orphan"` en `Usuario.oraciones` elimina las oraciones al borrar el usuario.

---

## Solución de problemas

| Error | Posible causa |
|-------|----------------|
| `unable to open database file` | La carpeta de destino no existe o no hay permisos de escritura |
| `database is locked` | Otra app o proceso tiene el archivo abierto en exclusiva |
| Tablas vacías tras cambiar de motor | Borra `bingomundial.db` y reinicia la API para recrearlas |

Para inspeccionar la base de datos puedes usar [DB Browser for SQLite](https://sqlitebrowser.org/) o la extensión SQLite de VS Code.
