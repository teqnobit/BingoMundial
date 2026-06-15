# Base de datos y ORM (SQLAlchemy + SQL Server)

Este proyecto usa **SQLAlchemy 2.x** como ORM y **pyodbc** como driver para conectarse a **Microsoft SQL Server**.

## Requisitos previos

1. **SQL Server** instalado (Express, Developer o Azure SQL).
2. **ODBC Driver 17 (o 18) for SQL Server** instalado en Windows:
   - [Descarga Microsoft ODBC Driver](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)

## Crear la base de datos

En SQL Server Management Studio (SSMS) o `sqlcmd`:

```sql
CREATE DATABASE BingoMundial;
GO
```

Las tablas se crean automáticamente al iniciar la API (`Base.metadata.create_all` en `app/main.py`).

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

2. Edita `.env` con tu cadena de conexión:

```env
DATABASE_URL=mssql+pyodbc://USUARIO:CONTRASENA@SERVIDOR/BingoMundial?driver=ODBC+Driver+17+for+SQL+Server
SECRET_KEY=una-clave-secreta-larga-y-aleatoria
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### Formato de la URL

```
mssql+pyodbc://<usuario>:<contraseña>@<servidor>/<base_de_datos>?driver=ODBC+Driver+17+for+SQL+Server
```

Ejemplos:

| Escenario              | URL (fragmento)                                      |
|------------------------|------------------------------------------------------|
| Instancia local        | `@localhost/BingoMundial`                            |
| Instancia nombrada     | `@localhost\\SQLEXPRESS/BingoMundial`                |
| Puerto explícito       | `@localhost,1433/BingoMundial`                       |
| Autenticación Windows  | Ver sección siguiente                                |

### Autenticación Windows (Trusted Connection)

Si usas tu usuario de Windows en lugar de SQL login:

```env
DATABASE_URL=mssql+pyodbc://@localhost/BingoMundial?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes
```

> Si la contraseña contiene caracteres especiales (`@`, `#`, `%`), codifícalos en URL (por ejemplo `@` → `%40`).

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

El engine representa la conexión al servidor. La sesión es el “workspace” para consultas:

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
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
| `IM002` / driver not found | Instala ODBC Driver 17/18 |
| Login failed | Usuario/contraseña incorrectos o SQL auth deshabilitado |
| Cannot open database | La BD `BingoMundial` no existe |
| Timeout | Firewall o SQL Server no acepta conexiones TCP |

Para verificar el driver ODBC instalado en Windows:

```powershell
Get-OdbcDriver | Where-Object { $_.Name -like '*SQL Server*' }
```
