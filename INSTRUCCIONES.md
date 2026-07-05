# Sistema Web para Reservar Canchas Deportivas
## Instrucciones para ejecutar el proyecto

---

## PASO 1 — Crear la base de datos en SQL Server

1. Abre **SQL Server Management Studio (SSMS)**
2. Conéctate con **Windows Authentication**
3. Clic en **New Query**
4. Abre el archivo `database/schema.sql` y pega todo su contenido
5. Presiona **F5** para ejecutar
6. Debe decir: "Base de datos creada exitosamente"

---

## PASO 2 — Configurar el backend

1. Abre la terminal en VS Code (**Ctrl + `**)
2. Ve a la carpeta backend:
   ```
   cd C:\proyectos\reservacanchas\backend
   ```
3. Instala las dependencias:
   ```
   npm install
   ```
4. Abre el archivo `.env` y verifica que dice:
   ```
   DB_SERVER=localhost
   DB_DATABASE=reservacanchas
   DB_TRUSTED_CONNECTION=true
   ```
   Si tu SQL Server tiene contraseña, cambia a:
   ```
   DB_TRUSTED_CONNECTION=false
   DB_USER=sa
   DB_PASSWORD=TuContraseña
   ```
5. Instala el driver de Windows Authentication:
   ```
   npm install msnodesqlv8
   ```
6. Inicia el backend:
   ```
   npm run dev
   ```
7. Debe aparecer:
   - ✅ Conectado a SQL Server
   - 🚀 Servidor corriendo en http://localhost:3001

---

## PASO 3 — Configurar el frontend

1. Abre **otra terminal** en VS Code (clic en el + de la terminal)
2. Ve a la carpeta frontend:
   ```
   cd C:\proyectos\reservacanchas\frontend
   ```
3. Instala las dependencias:
   ```
   npm install
   ```
4. Inicia el frontend:
   ```
   npm run dev
   ```
5. Debe aparecer:
   - Local: http://localhost:5173

---

## PASO 4 — Abrir el sistema

- Abre tu navegador y ve a: **http://localhost:5173**

---

## USUARIOS DE PRUEBA

| Correo                        | Contraseña | Rol           |
|-------------------------------|-----------|---------------|
| admin@reservacanchas.com      | password  | Administrador |
| juan@mail.com                 | password  | Usuario       |
| maria@mail.com                | password  | Usuario       |

---

## ESTRUCTURA DEL PROYECTO

```
reservacanchas/
├── backend/
│   ├── src/
│   │   ├── config/       → Conexión SQL Server
│   │   ├── controllers/  → Lógica HTTP
│   │   ├── middlewares/  → Auth JWT, errores
│   │   ├── repositories/ → Consultas SQL
│   │   ├── routes/       → Rutas API
│   │   ├── services/     → Reglas de negocio
│   │   └── app.js
│   ├── .env              → Variables de entorno
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/   → Navbar
│   │   ├── context/      → AuthContext
│   │   ├── pages/        → Login, Register, Dashboard, Canchas, Reservas, Admin
│   │   ├── services/     → API axios
│   │   ├── App.jsx       → Rutas
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── database/
    └── schema.sql        → Script SQL Server
```
