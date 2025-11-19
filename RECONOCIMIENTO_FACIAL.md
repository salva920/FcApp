# Sistema de Reconocimiento Facial Mejorado

## 📋 Resumen de Mejoras

Se ha implementado un sistema de reconocimiento facial avanzado usando **face-api.js** que reemplaza la implementación simulada anterior. El sistema ahora detecta características faciales reales y las compara con precisión.

## 🚀 Características Implementadas

### 1. Reconocimiento Facial Real
- ✅ Uso de **face-api.js** con modelos de TensorFlow.js
- ✅ Detección automática de rostros en tiempo real
- ✅ Extracción de descriptores faciales de 128 dimensiones
- ✅ Comparación precisa con umbral de similitud del 60%

### 2. Registro Biométrico
- ✅ Captura de foto facial con reconocimiento automático
- ✅ Almacenamiento de descriptor facial en base de datos
- ✅ Verificación de duplicados antes del registro
- ✅ Comparación con todos los registros existentes

### 3. Control de Asistencia en Tiempo Real
- ✅ Detección automática de rostros en la cámara
- ✅ Reconocimiento instantáneo al detectar un rostro
- ✅ Registro automático de entrada/salida
- ✅ Visualización de caja de detección en tiempo real

### 4. Reportes de Frecuencia y Puntualidad
- ✅ API de reportes de asistencia (`/api/asistencias/reportes`)
- ✅ Estadísticas de puntualidad
- ✅ Agrupación por niño
- ✅ Identificación de inasistencias

### 5. Notificaciones Automáticas
- ✅ API para notificar inasistencias (`/api/asistencias/notificar-inasistencias`)
- ✅ Envío automático de emails a padres
- ✅ Registro de notificaciones en la base de datos

## 📦 Instalación de Modelos

**IMPORTANTE**: Para que el reconocimiento facial funcione, necesitas descargar los modelos de face-api.js.

### Opción 1: Descarga Automática (Script PowerShell) ✅ RECOMENDADO

Ejecuta el script desde la raíz del proyecto:

```powershell
.\scripts\download-face-models.ps1
```

Este script descargará automáticamente todos los modelos necesarios a `public/models/`.

### Opción 2: Descarga Manual (PowerShell)

```powershell
# Crear directorio de modelos
New-Item -ItemType Directory -Force -Path "public\models"

# Descargar modelos
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json" -OutFile "public\models\tiny_face_detector_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1" -OutFile "public\models\tiny_face_detector_model-shard1"

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json" -OutFile "public\models\face_landmark_68_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1" -OutFile "public\models\face_landmark_68_model-shard1"

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json" -OutFile "public\models\face_recognition_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1" -OutFile "public\models\face_recognition_model-shard1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2" -OutFile "public\models\face_recognition_model-shard2"

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json" -OutFile "public\models\face_expression_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1" -OutFile "public\models\face_expression_model-shard1"
```

### Opción 2: Descarga Manual

1. Ve a: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Descarga los siguientes archivos a `public/models/`:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`
   - `face_expression_model-weights_manifest.json`
   - `face_expression_model-shard1`

## 🔧 Componentes Actualizados

### 1. Hook Personalizado (`useFaceRecognition.ts`)
- Carga automática de modelos de face-api.js
- Detección de rostros en tiempo real
- Extracción de descriptores faciales
- Cálculo de similitud entre descriptores

### 2. Componente de Reconocimiento (`FacialRecognition.tsx`)
- Detección visual de rostros con caja de detección
- Captura de foto con descriptor facial real
- Validación de calidad de imagen
- Feedback visual del estado de detección

### 3. Página de Check-in (`checkin/page.tsx`)
- Detección automática de rostros
- Reconocimiento instantáneo al detectar rostro
- Registro automático de asistencia
- Visualización de información del niño reconocido

## 📊 APIs Nuevas

### GET `/api/asistencias/reportes`
Obtiene reportes detallados de asistencia.

**Parámetros de consulta:**
- `fechaInicio`: Fecha de inicio (opcional)
- `fechaFin`: Fecha de fin (opcional)
- `ninoId`: ID del niño (opcional)
- `categoria`: Categoría del niño (opcional)

**Respuesta:**
```json
{
  "estadisticas": {
    "totalAsistencias": 150,
    "entradas": 75,
    "salidas": 75,
    "puntuales": 70,
    "porcentajePuntualidad": 93
  },
  "porNino": [...],
  "inasistencias": [...],
  "asistencias": [...]
}
```

### POST `/api/asistencias/notificar-inasistencias`
Envía notificaciones automáticas a padres por inasistencias.

**Body:**
```json
{
  "fecha": "2025-01-20", // Opcional, por defecto hoy
  "categoria": "Sub-10"  // Opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "totalInasistencias": 5,
  "notificacionesEnviadas": 4,
  "errores": 1,
  "detalles": {
    "enviadas": [...],
    "errores": [...]
  }
}
```

## 🎯 Cómo Funciona

### Registro de Niño con Reconocimiento Facial

1. Al registrar un niño, se puede capturar su foto facial
2. El sistema detecta automáticamente el rostro
3. Se extrae un descriptor facial de 128 dimensiones
4. Se compara con todos los registros existentes
5. Si hay coincidencia, se muestra advertencia
6. El descriptor se guarda en base de datos (Base64)

### Check-in Automático

1. Se inicia el escaneo de la cámara
2. El sistema detecta rostros en tiempo real (cada 200ms)
3. Al detectar un rostro, se extrae su descriptor
4. Se compara con todos los descriptores guardados
5. Si la similitud es > 60%, se identifica al niño
6. Se muestra la información y permite registrar entrada/salida

## 🔍 Umbral de Similitud

- **Umbral actual**: 0.6 (60%)
- **Rango típico**: 0.5 - 0.7
- **Ajuste**: Puedes modificar el umbral en `src/hooks/useFaceRecognition.ts` si es necesario

## ⚠️ Notas Importantes

1. **Modelos requeridos**: Los modelos deben estar en `public/models/` para que funcione
2. **Primera carga**: La primera vez que se carga la página, los modelos pueden tardar 2-5 segundos
3. **Iluminación**: Se recomienda buena iluminación para mejor detección
4. **Cámara**: Se requiere acceso a la cámara del dispositivo
5. **Navegador**: Funciona mejor en Chrome/Edge (mejor soporte para TensorFlow.js)

## 🐛 Solución de Problemas

### Los modelos no se cargan
- Verifica que los archivos estén en `public/models/`
- Revisa la consola del navegador para errores
- Asegúrate de que la ruta `/models/` sea accesible

### No se detectan rostros
- Verifica que la cámara tenga permisos
- Asegúrate de buena iluminación
- El rostro debe estar centrado y visible

### Reconocimiento no funciona
- Verifica que los niños tengan descriptores faciales guardados
- Revisa que el umbral de similitud sea apropiado
- Asegúrate de que los modelos estén cargados (ver badge en la UI)

## 📈 Próximas Mejoras Sugeridas

1. **Ajuste de umbral dinámico**: Permitir ajustar el umbral desde la UI
2. **Múltiples rostros**: Detectar y reconocer múltiples niños a la vez
3. **Historial de reconocimientos**: Guardar intentos de reconocimiento
4. **Métricas de precisión**: Estadísticas de aciertos/fallos
5. **Reentrenamiento**: Mejorar modelos con datos propios

