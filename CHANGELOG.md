# Changelog

Todas las novedades notables de este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-30

### 🎉 Añadido

#### Módulo de Torneos y Competencias
- Modelos Prisma para gestión de torneos (`Torneo`, `Equipo`, `EquipoJugador`, `Partido`, `EstadisticaJugador`, `EstadisticaEquipo`)
- API endpoints para CRUD de torneos, equipos y partidos
- Página de gestión de torneos (`/torneos`) con tabs para General, Equipos y Fixture
- Generación automática de fixtures (round-robin, ida-vuelta)
- Tabla de posiciones calculada automáticamente
- Control de acceso: solo admins pueden crear/editar, representantes y profesores en modo vista

#### Sistema de Aprobación de Actividades
- Flujo de aprobación para actividades creadas por profesores (Pendiente → Aprobada/Rechazada)
- Notificaciones por email al admin cuando un profesor crea una actividad
- Notificaciones a representantes cuando una actividad es aprobada
- Botones "Aprobar" y "Rechazar" en el calendario para admins
- Campos `estado`, `aprobadoPor`, `aprobadoEn`, `creadoPorRol` en modelo `Actividad`

#### Gestión de Asistencias por Actividad
- Registro de asistencia vinculado a actividades específicas
- Listado de niños por categoría al gestionar asistencia
- Métricas de asistencia (Presentes, Ausentes, Total)
- Interfaz mejorada con secciones destacadas para alumnos ausentes
- Filtro de búsqueda por nombre de niño o representante en página de asistencias
- Interfaz moderna con cards en lugar de tabla

#### Módulo de Desarrollo del Atleta
- Sistema completo de evaluaciones para seguimiento del progreso de los atletas
- Formulario de evaluación con competencias técnicas, tácticas, físicas y psicológicas (escala 1-10)
- Gráfico radar para visualización de competencias
- Gráfico de línea para evolución temporal
- Comparación entre evaluaciones de diferentes fechas
- Exportación a PDF con información detallada
- Campos de medidas físicas: `estatura`, `peso`, `talla` (uniforme), `tallaCalzado`
- Modo de solo lectura para representantes
- Vista completa para profesores y admins

#### Sistema de Autenticación y Roles
- Modelo `Usuario` con roles (admin, profesor, representante)
- Endpoints de registro y login (`/api/auth/register`, `/api/auth/login`)
- Hook personalizado `useAuth` para gestión de estado de autenticación
- Página de login con tabs para Login y Registro
- Protección de rutas con middleware
- Navbar y dashboard dinámicos según rol del usuario

#### Mejoras en Módulo de Pagos
- Auto-selección de representante en página de pagos públicos para usuarios logueados
- Tarjeta consolidada de "Total a Pagar" con información de deuda
- Selección individual de conceptos a pagar (Mensualidad, Compra Tienda, etc.)
- Envío individual de pagos por concepto seleccionado
- Visualización y descarga de comprobantes en formato Base64
- Página "Mis Pagos" (`/consultar-deuda`) con auto-carga para representantes
- Detalle de compras de tienda en vista de admin (ítems, cantidades, tallas)

#### Sistema de Notificaciones por Email
- Configuración mejorada de Nodemailer con Gmail App Password
- Notificaciones automáticas de pagos recibidos y verificados
- Notificaciones de actividades creadas y canceladas
- Notificaciones masivas con delay para evitar rate limiting
- Notificaciones de actividades pendientes de aprobación para admin
- Documentación de configuración en `CONFIGURACION_EMAIL.md`

#### Módulo de Tienda
- Catálogo de productos con gestión de stock
- Sistema de carrito de compras funcional
- Gestión de stock automática al agregar/quitar del carrito
- Proceso de checkout que genera pagos pendientes
- Detalle completo de compras en observaciones del pago
- Notificaciones al admin sobre nuevas compras
- Selector de tallas dinámico según categoría del producto

#### Campos Adicionales en Registro de Niños
- Campos `estatura`, `peso`, `talla`, `tallaCalzado` en formulario de registro
- Creación automática de evaluación inicial al registrar niño con medidas
- Carga de medidas desde última evaluación al editar niño
- Campo `cedula` ahora es opcional

#### Documentación
- `env.example` con instrucciones detalladas
- `CONFIGURACION_EMAIL.md` con guía de configuración de Gmail
- `CREAR_ADMIN.md` con instrucciones para crear usuario admin
- Script `create-admin.js` para creación de admin desde línea de comandos

### 🔄 Cambiado

- **Página de Consulta de Deudas**: Ahora muestra "Mis Pagos" para representantes con auto-carga de datos
- **Navbar**: Reorganizado con menú "Aplicaciones" agrupado por roles
- **Calendario**: Botones de gestión ocultos para representantes
- **Tienda**: Botón "Gestionar Productos" solo visible para admins
- **Búsqueda de Representantes**: Prioriza búsqueda exacta por cédula antes de búsqueda parcial
- **Interfaz de Asistencias**: Rediseñada con cards modernas en lugar de tabla

### 🐛 Corregido

- Búsqueda de representantes por cédula ahora prioriza coincidencia exacta
- Errores de importación y tipos TypeScript
- Error `doc.autoTable is not a function` en exportación PDF
- Validación de campo `cedula` opcional en formulario de niños
- Overflow del campo "Fecha Fin" en modal de actividades
- Carga de medidas físicas al editar niño
- Visualización de tallas en modal de agregar al carrito
- Carrito vacío: ahora muestra correctamente los ítems agregados
- ContextError con `AlertIcon` fuera de componente `Alert`

### 🔧 Infraestructura

- `.gitignore` actualizado para excluir archivos sensibles y temporales
- Configuración de Git LFS para archivos grandes (opcional)
- Scripts npm actualizados (`create-admin`)
- Variables de entorno documentadas en `env.example`

---

## [0.1.0] - 2025-10-01

### 🎉 Añadido

- Sistema inicial de gestión de niños y representantes
- Módulo de pagos básico
- Dashboard administrativo
- Sistema de notificaciones básico
- Carga de archivos multimedia
- Integración con MongoDB y Prisma

---

**Nota**: Para cambios futuros, seguir el formato de este changelog.


