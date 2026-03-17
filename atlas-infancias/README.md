# ATLAS Infancias

Plataforma colaborativa para mapear y visualizar stickers georeferenciados creados por niños y niñas de Costa Rica.
Desarrollada durante el 7mo semestre en el Tecnológico de Costa Rica.

![React](https://img.shields.io/badge/React_18-TypeScript-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL+PostGIS-teal)

---

## Autores

- **José Pablo Fernández Jiménez**
- **Joshua Solís Fuentes**

---

## Stack tecnológico

| Capa              | Tecnología                  |
|-------------------|-----------------------------|
| Frontend          | React + TypeScript          |
| Backend           | Python + FastAPI            |
| Base de datos     | PostgreSQL + PostGIS        |
| Mapas             | Leaflet + OpenStreetMap     |
| Formato geográfico| GeoJSON                     |
| Testing backend   | Pytest                      |
| Testing frontend  | Jest + React Testing Library|
| Testing E2E       | Cypress                     |
| Versiones         | GitHub                      |

---

## Instalación — primera vez

### 1. Clonar el repositorio

```bash
git clone https://github.com/JP113z/ATLAS-INFANCIAS.git
cd atlas-infancias
```

### 2. Configurar el backend

```bash
cd backend
python -m venv venv

# Activar en Windows
venv\Scripts\activate
# Activar en Mac / Linux
# source venv/bin/activate

pip install -r requirements.txt
```

Copiar el archivo de variables de entorno y rellenarlo con las credenciales locales:

```bash
cp .env.example .env
```

Contenido del `.env`:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@localhost:5432/atlas_infancias
SECRET_KEY=CAMBIA_ESTO
```

### 3. Configurar el frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Contenido del `.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Crear la base de datos

```sql
-- En psql o pgAdmin
CREATE DATABASE atlas_infancias;
\c atlas_infancias
CREATE EXTENSION postgis;
```

---

## Cómo desarrollar

Se necesitan tres terminales abiertas simultáneamente:

```bash
# Terminal 1 — Frontend en http://localhost:5173
cd frontend
npm run dev

# Terminal 2 — Backend en http://localhost:8000
cd backend
uvicorn app.main:app --reload

# Terminal 3 — Base de datos
# Usar psql o pgAdmin
```

La documentación automática de la API estará disponible en `http://localhost:8000/docs`.

---

## Estructura del proyecto

```
atlas-infancias/
├── frontend/
│   └── src/
│       ├── assets/           ← imágenes, logos
│       ├── components/       ← componentes reutilizables
│       ├── pages/            ← una carpeta por vista
│       ├── services/         ← llamadas a la API
│       ├── context/          ← estado global
│       ├── hooks/            ← custom hooks
│       ├── types/            ← interfaces TypeScript
│       └── utils/            ← funciones helpers
├── backend/
│   └── app/
│       ├── main.py           ← punto de entrada FastAPI
│       ├── config.py         ← variables de entorno
│       ├── database.py       ← conexión a PostgreSQL
│       ├── models/           ← modelos SQLAlchemy
│       ├── schemas/          ← validación Pydantic
│       ├── routers/          ← rutas por módulo
│       └── services/         ← lógica de negocio
├── .gitignore
└── README.md
```

---

## Control de versiones — convención de commits

| Prefijo      | Uso                              |
|--------------|----------------------------------|
| `feat:`      | Nueva funcionalidad              |
| `fix:`       | Corrección de bug                |
| `style:`     | Cambios de CSS/UI sin lógica     |
| `refactor:`  | Reorganización de código         |
| `docs:`      | Cambios en documentación         |
| `test:`      | Agregar o modificar tests        |

### Flujo de trabajo con ramas

```bash
# Crear rama para una feature
git checkout -b feature/nombre-de-la-feature

# Commits frecuentes y descriptivos
git add .
git commit -m "feat: descripción del cambio"

# Subir la rama
git push origin feature/nombre-de-la-feature

# Abrir Pull Request en GitHub hacia main
# El otro desarrollador revisa y aprueba antes del merge
```

---

> **Importante:** Los archivos `.env` nunca se suben al repositorio.
> Cada desarrollador debe crear los suyos copiando los archivos `.env.example` que sí están en el repo.
