# Configuración de Notificaciones por Email

## 📧 Configuración Requerida

Para que las notificaciones de email funcionen correctamente, necesitas configurar las siguientes variables en tu archivo `.env.local`:

### Variables de Entorno

```env
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-contraseña-de-aplicacion"
```

## 🔑 Obtener Contraseña de Aplicación en Gmail

1. **Habilitar verificación en 2 pasos**:
   - Ve a tu cuenta de Google
   - Seguridad → Verificación en 2 pasos
   - Sigue los pasos para habilitarla

2. **Generar contraseña de aplicación**:
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "App" → "Mail"
   - Selecciona "Device" → "Other (Custom name)"
   - Ingresa un nombre (ej: "Futbol 360")
   - Copia la contraseña de 16 caracteres generada
   - Úsala como `EMAIL_PASS` en el `.env.local`

## ✅ Verificación de la Configuración

El sistema verificará automáticamente que las credenciales sean correctas. Si hay problemas:

- Verifica que la verificación en 2 pasos esté activa
- Usa la contraseña de aplicación, NO tu contraseña normal de Gmail
- Asegúrate de que `EMAIL_USER` sea tu email completo con @gmail.com

## 📨 Notificaciones Disponibles

### 1. **Pago Recibido** (Pago Público)
Cuando un representante sube un comprobante de pago, se envía:
- Confirmación de recepción
- Detalles del pago
- Estado: en verificación

### 2. **Pago Aprobado/Denegado** (Gestión de Pagos)
Cuando el admin aprueba o deniega un pago:
- Estado del pago
- Comentarios del administrador
- Detalles del pago

## ⚙️ Configuración Mejorada

El sistema ahora incluye:
- ✅ Configuración explícita de host y puerto
- ✅ Timeouts adecuados (30 segundos)
- ✅ Mejor manejo de errores
- ✅ Logs detallados
- ✅ No bloquea el proceso si falla el email
- ✅ Uso del puerto 587 (STARTTLS) en lugar de 465 (SSL)

## 🔍 Solución de Problemas

Si los emails no se envían:

1. **Error "ETIMEDOUT 192.178.219.109:465"**: 
   - El sistema intentó usar el puerto 465 (SSL)
   - Ahora usa el puerto 587 (STARTTLS) que es más confiable
   - Reinicia el servidor para aplicar los cambios

2. **Credenciales incorrectas**: 
   - Verifica que EMAIL_USER sea tu email completo
   - Usa CONTASEÑA DE APLICACIÓN, no tu contraseña normal
   - Puedes generarla en: https://myaccount.google.com/apppasswords

3. **Firewall/Red**: 
   - Verifica que el puerto 587 esté abierto
   - Algunas redes públicas bloquean el puerto 587

4. **Gmail bloqueo**: 
   - Gmail puede bloquear intentos repetidos
   - Espera unos minutos y vuelve a intentar
   - Verifica que "Acceso de aplicaciones menos seguras" esté deshabilitado (usa contraseña de aplicación en su lugar)

### Logs del Sistema

El sistema mostrará en la consola:
- ✅ Email enviado exitosamente
- ⚠️ No se pudo enviar el email (con razón)
- ❌ Error enviando notificación

## 📝 Nota Importante

Las imágenes en base64 ahora se guardan directamente en MongoDB, lo que mejora:
- Seguridad de datos
- Disponibilidad 24/7
- No dependencia de archivos externos

