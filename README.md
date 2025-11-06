# ⚽ Gestión Football Pro

Sistema integral para la gestión de escuela de fútbol con registro de niños, representantes, pagos y notificaciones automáticas.

## 🚀 Características Principales

### 1. Sistema de Autenticación y Roles
- ✅ Autenticación JWT con roles (Admin, Profesor, Representante)
- ✅ Registro de usuarios (Representantes y Profesores)
- ✅ Protección de rutas basada en roles
- ✅ Dashboard y navegación personalizada por rol

### 2. Registro Centralizado de Niños y Representantes
- ✅ Formulario digitalizado con datos personales, contacto, alergias y emergencias
- ✅ Carga multimedia de cédulas, partidas de nacimiento y fotos (PDF, JPG, PNG)
- ✅ Organización automática por categorías (Sub-6, Sub-8, Sub-10, etc.)
- ✅ Filtros avanzados por edad, equipo o nivel
- ✅ Registro de medidas físicas (estatura, peso, talla, talla de calzado)
- ✅ Reconocimiento facial para identificación de niños

### 3. Módulo de Pagos y Suscripciones
- ✅ Estado de cuenta individual para cada representante
- ✅ Carga de comprobantes en formato Base64 (PDF, imágenes)
- ✅ Selección individual de conceptos a pagar (Mensualidad, Compra Tienda, etc.)
- ✅ Clasificación automática como Solvente o Deudor
- ✅ Seguimiento de pagos pendientes y vencidos
- ✅ Verificación de pagos por administradores
- ✅ Auto-generación de mensualidades al aprobar pagos

### 4. Sistema de Notificaciones Automáticas
- ✅ Notificaciones por email usando Gmail App Password
- ✅ Alertas de morosidad y recordatorios de pago
- ✅ Notificaciones de actividades creadas y canceladas
- ✅ Comunicados masivos para entrenamientos y eventos
- ✅ Notificaciones personalizadas por representante
- ✅ Notificaciones de aprobación de actividades para admin

### 5. Gestión de Actividades y Calendario
- ✅ Calendario de actividades con vista mensual
- ✅ Creación de actividades por admin y profesores
- ✅ Sistema de aprobación para actividades de profesores
- ✅ Gestión de asistencias por actividad
- ✅ Notificaciones automáticas a representantes por categoría
- ✅ Cancelación de actividades con notificaciones

### 6. Módulo de Desarrollo del Atleta
- ✅ Sistema completo de evaluaciones (técnicas, tácticas, físicas, psicológicas)
- ✅ Gráficos radar y de evolución temporal
- ✅ Comparación entre evaluaciones de diferentes fechas
- ✅ Exportación a PDF con información detallada
- ✅ Vista de solo lectura para representantes
- ✅ Seguimiento de medidas físicas y progreso

### 7. Gestión de Torneos y Competencias
- ✅ Creación de torneos internos y externos
- ✅ Gestión de equipos y jugadores
- ✅ Generación automática de fixtures (round-robin, ida-vuelta)
- ✅ Tabla de posiciones calculada automáticamente
- ✅ Estadísticas por jugador y equipo
- ✅ Control de acceso por roles

### 8. Tienda de Productos
- ✅ Catálogo de productos (uniformes, calzado, accesorios)
- ✅ Gestión de stock automática
- ✅ Carrito de compras funcional
- ✅ Proceso de checkout que genera pagos pendientes
- ✅ Notificaciones al admin sobre nuevas compras

### 9. Dashboard Administrativo
- ✅ Métricas clave: niños registrados, porcentaje de deudores, ingresos
- ✅ Filtros avanzados por categoría, representante, estado de pago
- ✅ Gráficos interactivos y estadísticas en tiempo real
- ✅ Vista personalizada según rol del usuario

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Chakra UI, Framer Motion
- **Base de Datos**: MongoDB con Prisma ORM
- **Gráficos**: Chart.js, React-Chartjs-2, Recharts
- **Estado**: TanStack Query (React Query)
- **Estilos**: Emotion, Chakra UI
- **Autenticación**: JWT (jsonwebtoken, jose)
- **Email**: Nodemailer
- **PDF**: jsPDF, jsPDF-AutoTable
- **Validación**: Formularios nativos con validación
- **Reconocimiento Facial**: React-Webcam

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- MongoDB (local o Atlas)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd gestion-football-pro
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp env.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
# Base de datos MongoDB
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/gestion-football-pro?retryWrites=true&w=majority"

# JWT Secret para autenticación
JWT_SECRET="tu-jwt-secret-super-seguro-aqui"

# Configuración de Email (Gmail)
# IMPORTANTE: Para Gmail necesitas usar una "Contraseña de Aplicación"
# Ve a: https://myaccount.google.com/apppasswords para generarla
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-contraseña-de-aplicacion-de-16-caracteres"

# Email del administrador (para notificaciones)
ADMIN_EMAIL="admin@example.com"

# WhatsApp (opcional)
WHATSAPP_SESSION_PATH="./whatsapp-session"

# Directorio de uploads
UPLOAD_PATH="./uploads"

# URL de la aplicación (para producción)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Nota**: Para más detalles sobre la configuración de email, consulta `CONFIGURACION_EMAIL.md`

4. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
npx prisma generate

# Aplicar el esquema a la base de datos
npx prisma db push
```

**Nota**: Si `DATABASE_URL` no se carga correctamente, asegúrate de que esté en un archivo `.env` en la raíz del proyecto (no solo en `.env.local`), ya que Prisma CLI lee desde `.env`.

5. **Crear usuario administrador**
```bash
# Opción 1: Usando el script de Node.js
npm run create-admin

# Opción 2: Usando la API temporal (solo primera vez)
# POST a http://localhost:3000/api/auth/create-admin
```

Para más detalles, consulta `CREAR_ADMIN.md`

6. **Crear directorio de uploads**
```bash
mkdir -p public/uploads
```

7. **Ejecutar en modo desarrollo**
```bash
npm run dev
# o en Windows
npm run dev:win
```

8. **Abrir en el navegador**
```
http://localhost:3000
```

9. **Iniciar sesión**
- Usa las credenciales del admin creado en el paso 5
- O registra un nuevo usuario desde la página de login

## 🗄️ Estructura de la Base de Datos

### Modelos Principales

#### Representante
- Información personal (nombre, cédula, email, teléfono)
- Dirección opcional
- Relación con niños y pagos

#### Niño
- Datos personales (nombre, apellido, fecha nacimiento, cédula)
- Información médica (alergias, contacto emergencia)
- Categoría y nivel deportivo
- Archivos multimedia (cédula, partida, foto)
- Relación con representante

#### Pago
- Monto y concepto
- Fechas de vencimiento y pago
- Estado (Pendiente, Pagado, Vencido)
- Método de pago y comprobante
- Observaciones

#### Notificación
- Tipo (Pago, Recordatorio, Comunicado)
- Contenido del mensaje
- Método de envío (Email, WhatsApp)
- Estado de envío

## 📱 Páginas del Sistema

### Autenticación (`/login`)
- Login y registro de usuarios
- Registro de representantes y profesores
- Protección de rutas

### Página Principal (`/`)
- Dashboard con métricas generales según rol
- Accesos rápidos a todas las funcionalidades
- Estadísticas en tiempo real
- Vista personalizada por rol (Admin, Profesor, Representante)

### Gestión de Niños (`/ninos`)
- Registro y edición de niños
- Carga de documentos multimedia
- Registro de medidas físicas (estatura, peso, talla, talla de calzado)
- Filtros por categoría y búsqueda
- Vista de información del representante
- Módulo de Desarrollo del Atleta (profesores y admins)
- Vista de solo lectura para representantes

### Gestión de Representantes (`/representantes`)
- CRUD completo de representantes
- Registro multi-paso con opción de agregar niños inmediatamente
- Vista de niños asociados
- Estado de pagos por representante
- Estadísticas de deudores

### Gestión de Pagos (`/pagos`)
- Registro y seguimiento de pagos (solo admin)
- Estados de cuenta por representante
- Filtros por estado y fecha
- Visualización y descarga de comprobantes Base64
- Verificación de pagos
- Detalle de compras de tienda

### Sistema de Pagos Público (`/pago-publico`)
- Interfaz para representantes
- Auto-selección de representante logueado
- Selección individual de conceptos a pagar
- Carga de comprobantes
- Resumen consolidado de deudas

### Mis Pagos (`/consultar-deuda`)
- Vista de pagos para representantes
- Auto-carga de datos del representante logueado
- Búsqueda por cédula/nombre (solo admin)

### Calendario de Actividades (`/calendario`)
- Vista mensual de actividades
- Creación de actividades (admin y profesores)
- Sistema de aprobación para actividades de profesores
- Gestión de asistencias por actividad
- Cancelación de actividades con notificaciones
- Filtros por categoría e instructor

### Gestión de Asistencias (`/asistencias`)
- Registro histórico de asistencias
- Filtros por fecha, categoría y búsqueda
- Interfaz moderna con cards
- Estadísticas de asistencia

### Gestión de Torneos (`/torneos`)
- Creación y gestión de torneos (solo admin)
- Gestión de equipos y jugadores
- Generación automática de fixtures
- Tabla de posiciones
- Estadísticas por jugador y equipo
- Vista de solo lectura para profesores y representantes

### Tienda (`/tienda`)
- Catálogo de productos
- Carrito de compras
- Gestión de productos (solo admin)
- Proceso de checkout

### Notificaciones (`/notificaciones`)
- Envío de notificaciones individuales y masivas
- Filtro por categoría
- Historial de notificaciones
- Integración con email

### Dashboard (`/dashboard`)
- Métricas detalladas del sistema
- Gráficos interactivos
- Alertas y notificaciones
- Envío de comunicados masivos

### Reportes (`/reportes`)
- Análisis financiero detallado
- Gráficos de distribución por categorías
- Exportación a Excel/PDF
- Recomendaciones del sistema

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuarios (representantes y profesores)
- `POST /api/auth/login` - Login de usuarios
- `POST /api/auth/create-admin` - Crear admin (solo primera vez)

### Representantes
- `GET /api/representantes` - Listar todos
- `POST /api/representantes` - Crear nuevo
- `GET /api/representantes/[id]` - Obtener por ID
- `PUT /api/representantes/[id]` - Actualizar
- `DELETE /api/representantes/[id]` - Eliminar

### Niños
- `GET /api/ninos` - Listar todos (filtros: `representanteId`, `categoria`)
- `POST /api/ninos` - Crear nuevo
- `GET /api/ninos/[id]` - Obtener por ID
- `PUT /api/ninos/[id]` - Actualizar
- `DELETE /api/ninos/[id]` - Eliminar

### Pagos
- `GET /api/pagos` - Listar todos
- `POST /api/pagos` - Crear nuevo
- `GET /api/pagos/[id]` - Obtener por ID
- `PUT /api/pagos/[id]` - Actualizar
- `DELETE /api/pagos/[id]` - Eliminar
- `POST /api/pagos/publico` - Crear pago público (representantes)
- `GET /api/pagos/consultar` - Consultar deudas por cédula/nombre
- `POST /api/pagos/[id]/verificar` - Verificar pago (admin)

### Evaluaciones
- `GET /api/evaluaciones` - Listar todas (filtro: `ninoId`)
- `POST /api/evaluaciones` - Crear nueva evaluación
- `GET /api/evaluaciones/[id]` - Obtener por ID
- `PUT /api/evaluaciones/[id]` - Actualizar
- `DELETE /api/evaluaciones/[id]` - Eliminar

### Actividades
- `GET /api/actividades` - Listar todas
- `POST /api/actividades` - Crear nueva
- `GET /api/actividades/[id]` - Obtener por ID
- `PUT /api/actividades/[id]` - Actualizar (incluye cancelación y aprobación)
- `DELETE /api/actividades/[id]` - Eliminar
- `GET /api/actividades/[id]/asistencias` - Obtener asistencias de una actividad
- `POST /api/actividades/[id]/asistencias` - Guardar asistencias

### Asistencias
- `GET /api/asistencias` - Listar todas (filtros: `fecha`, `categoria`, `ninoId`)

### Torneos
- `GET /api/torneos` - Listar todos
- `POST /api/torneos` - Crear nuevo
- `GET /api/torneos/[id]/tabla` - Obtener tabla de posiciones

### Equipos
- `GET /api/equipos` - Listar todos (filtro: `torneoId`)
- `POST /api/equipos` - Crear nuevo
- `GET /api/equipos/[id]/jugadores` - Obtener jugadores del equipo
- `POST /api/equipos/[id]/jugadores` - Agregar jugador
- `DELETE /api/equipos/[id]/jugadores` - Eliminar jugador

### Partidos
- `GET /api/partidos` - Listar todos (filtro: `torneoId`)
- `POST /api/partidos/generar` - Generar fixture automático

### Carrito
- `GET /api/carrito` - Obtener carrito activo (filtro: `representanteId`)
- `POST /api/carrito` - Agregar item al carrito
- `PUT /api/carrito` - Actualizar cantidad
- `DELETE /api/carrito` - Eliminar item (filtro: `itemId`)
- `POST /api/carrito/checkout` - Procesar checkout

### Productos
- `GET /api/productos` - Listar todos
- `POST /api/productos` - Crear nuevo
- `PUT /api/productos/[id]` - Actualizar
- `DELETE /api/productos/[id]` - Eliminar

### Estadísticas
- `GET /api/estadisticas` - Obtener métricas generales

### Notificaciones
- `GET /api/notificaciones` - Listar notificaciones
- `POST /api/notificaciones` - Enviar notificación (individual o masiva)

### Upload
- `POST /api/upload` - Subir archivos multimedia

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Conectar con GitHub**
   - Ve a [Vercel](https://vercel.com) y conecta tu repositorio

2. **Configurar variables de entorno** en el dashboard de Vercel:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `ADMIN_EMAIL`
   - `NEXT_PUBLIC_APP_URL` (URL de producción)

3. **Configurar build settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build` (o `prisma generate && next build`)
   - Output Directory: `.next`

4. **Desplegar automáticamente** desde la rama `main`

**Nota**: Asegúrate de que el archivo `vercel.json` esté configurado correctamente.

### Otras plataformas

El proyecto es compatible con cualquier plataforma que soporte Next.js:
- **Netlify**: Similar a Vercel, configurar variables de entorno
- **Railway**: Despliegue automático desde GitHub
- **Heroku**: Requiere configuración adicional de buildpacks
- **DigitalOcean App Platform**: Configuración similar a Vercel

### Consideraciones para Producción

1. **Base de Datos**: Usa MongoDB Atlas para producción
2. **Email**: Configura correctamente Gmail App Password
3. **JWT Secret**: Usa un secret fuerte y aleatorio
4. **Uploads**: Considera usar un servicio de almacenamiento (S3, Cloudinary) en lugar de almacenamiento local
5. **Variables de Entorno**: Nunca commitees `.env.local` o `.env` con credenciales reales

## 📊 Características Avanzadas

### Sistema de Notificaciones
- Envío automático de recordatorios de pago
- Comunicados masivos por email/WhatsApp
- Programación de notificaciones
- Historial de comunicaciones

### Carga de Archivos
- Soporte para PDF, JPG, PNG
- Validación de tipos y tamaños
- Almacenamiento seguro en servidor
- Preview de archivos subidos

### Dashboard Interactivo
- Gráficos en tiempo real con Recharts
- Métricas actualizadas automáticamente
- Filtros dinámicos
- Exportación de datos

### Responsive Design
- Diseño adaptativo para móviles y tablets
- Interfaz optimizada para touch
- Navegación intuitiva

## 🔒 Seguridad

- Validación de tipos de archivo
- Límites de tamaño de archivos
- Sanitización de datos de entrada
- Autenticación JWT (implementar según necesidades)
- CORS configurado

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo

## 📋 Changelog

Para ver el historial detallado de cambios, mejoras y correcciones, consulta el [CHANGELOG.md](./CHANGELOG.md).

## 🎯 Roadmap

### ✅ Completado:
- [x] Sistema de autenticación completo con roles
- [x] Sistema de torneos y competencias
- [x] Notificaciones por email
- [x] Módulo de desarrollo del atleta
- [x] Sistema de aprobación de actividades
- [x] Tienda de productos con carrito

### 🔄 En desarrollo / Próximas características:
- [ ] Integración con WhatsApp Business API
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con sistemas de pago (pasarelas)
- [ ] Reportes avanzados con IA
- [ ] Dashboard de estadísticas avanzadas
- [ ] Sistema de mensajería interna
- [ ] Exportación masiva de reportes

---

**Desarrollado con ❤️ para la gestión eficiente de escuelas de fútbol**
