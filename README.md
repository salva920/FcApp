# ⚽ Gestión Football Pro

Sistema integral para la gestión de escuela de fútbol con registro de niños, representantes, pagos y notificaciones automáticas.

## 🚀 Características Principales

### 1. Registro Centralizado de Niños y Representantes
- ✅ Formulario digitalizado con datos personales, contacto, alergias y emergencias
- ✅ Carga multimedia de cédulas, partidas de nacimiento y fotos (PDF, JPG, PNG)
- ✅ Organización automática por categorías (Sub-6, Sub-8, Sub-10, etc.)
- ✅ Filtros avanzados por edad, equipo o nivel

### 2. Módulo de Pagos y Suscripciones
- ✅ Estado de cuenta individual para cada representante
- ✅ Carga de comprobantes de transferencias/pagos
- ✅ Clasificación automática como Solvente o Deudor
- ✅ Seguimiento de pagos pendientes y vencidos

### 3. Sistema de Notificaciones Automáticas
- ✅ Alertas de morosidad vía email o WhatsApp
- ✅ Recordatorios de pago programados
- ✅ Comunicados masivos para entrenamientos y eventos
- ✅ Notificaciones personalizadas por representante

### 4. Dashboard Administrativo
- ✅ Métricas clave: niños registrados, porcentaje de deudores, ingresos
- ✅ Filtros avanzados por categoría, representante, estado de pago
- ✅ Reportes exportables en Excel/PDF
- ✅ Gráficos interactivos y estadísticas en tiempo real

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: Chakra UI, Framer Motion
- **Base de Datos**: MongoDB con Prisma ORM
- **Gráficos**: Recharts
- **Estado**: TanStack Query (React Query)
- **Estilos**: Emotion, Chakra UI
- **Validación**: Formularios nativos con validación

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
# Crear archivo .env.local
cp .env.local.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
# Base de datos
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/gestion-football-pro?retryWrites=true&w=majority"

# JWT
JWT_SECRET="tu-jwt-secret-super-seguro"

# Email (opcional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-password-de-aplicacion"

# WhatsApp (opcional)
WHATSAPP_SESSION_PATH="./whatsapp-session"

# Uploads
UPLOAD_PATH="./uploads"
```

4. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
npx prisma generate

# Aplicar migraciones (si usas migraciones)
npx prisma db push
```

5. **Crear directorio de uploads**
```bash
mkdir -p public/uploads
```

6. **Ejecutar en modo desarrollo**
```bash
npm run dev
# o
yarn dev
```

7. **Abrir en el navegador**
```
http://localhost:3000
```

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

### Página Principal (`/`)
- Dashboard con métricas generales
- Accesos rápidos a todas las funcionalidades
- Estadísticas en tiempo real

### Gestión de Niños (`/ninos`)
- Registro y edición de niños
- Carga de documentos multimedia
- Filtros por categoría y búsqueda
- Vista de información del representante

### Gestión de Representantes (`/representantes`)
- CRUD completo de representantes
- Vista de niños asociados
- Estado de pagos por representante
- Estadísticas de deudores

### Gestión de Pagos (`/pagos`)
- Registro y seguimiento de pagos
- Estados de cuenta por representante
- Filtros por estado y fecha
- Carga de comprobantes

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

### Representantes
- `GET /api/representantes` - Listar todos
- `POST /api/representantes` - Crear nuevo
- `GET /api/representantes/[id]` - Obtener por ID
- `PUT /api/representantes/[id]` - Actualizar
- `DELETE /api/representantes/[id]` - Eliminar

### Niños
- `GET /api/ninos` - Listar todos
- `POST /api/ninos` - Crear nuevo
- `GET /api/ninos/[id]` - Obtener por ID
- `PUT /api/ninos/[id]` - Actualizar
- `DELETE /api/ninos/[id]` - Eliminar

### Pagos
- `GET /api/pagos` - Listar todos
- `POST /api/pagos` - Crear nuevo
- `PUT /api/pagos/[id]` - Actualizar
- `DELETE /api/pagos/[id]` - Eliminar

### Estadísticas
- `GET /api/estadisticas` - Obtener métricas generales

### Notificaciones
- `GET /api/notificaciones` - Listar notificaciones
- `POST /api/notificaciones` - Enviar notificación

### Upload
- `POST /api/upload` - Subir archivos multimedia

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Conectar con GitHub**
2. **Configurar variables de entorno** en el dashboard de Vercel
3. **Desplegar automáticamente** desde la rama main

### Otras plataformas

El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

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

## 🎯 Roadmap

### Próximas características:
- [ ] Sistema de autenticación completo
- [ ] Integración con WhatsApp Business API
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con sistemas de pago
- [ ] Reportes avanzados con IA
- [ ] Sistema de torneos y competencias

---

**Desarrollado con ❤️ para la gestión eficiente de escuelas de fútbol**
# FcApp
