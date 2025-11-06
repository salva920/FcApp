import nodemailer from 'nodemailer'

// Configuración del transporter de nodemailer
export function createEmailTransporter() {
  // Verificar que las variables de entorno estén configuradas
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASS no están configuradas en .env.local')
    return null
  }

  console.log('📧 Configurando transporter con:')
  console.log('   EMAIL_USER:', process.env.EMAIL_USER)
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '***CONFIGURADA***' : 'NO CONFIGURADA')
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Configuración mejorada para evitar timeouts
    // Timeouts aumentados
    connectionTimeout: 60000, // 60 segundos
    greetingTimeout: 30000,
    socketTimeout: 60000,
    // Configuraciones adicionales
    tls: {
      rejectUnauthorized: false // Solo para desarrollo, en producción usa certificados válidos
    }
  })

  return transporter
}

// Función para verificar la configuración de email
export async function verifyEmailConfig(): Promise<boolean> {
  // Verificar primero que las variables estén configuradas
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASS no están configuradas en .env.local')
    console.warn('📝 Para configurar:')
    console.warn('   1. Abre tu archivo .env.local')
    console.warn('   2. Agrega: EMAIL_USER="tu-email@gmail.com"')
    console.warn('   3. Agrega: EMAIL_PASS="tu-contraseña-de-aplicación-de-16-caracteres"')
    console.warn('   4. Genera la contraseña de aplicación en: https://myaccount.google.com/apppasswords')
    return false
  }

  const transporter = createEmailTransporter()
  if (!transporter) return false

  try {
    await transporter.verify()
    console.log('✅ Configuración de email verificada correctamente')
    return true
  } catch (error: any) {
    console.error('❌ Error en la configuración de email:', error.message)
    return false
  }
}

// Función para crear transporter alternativo (puerto 465 SSL)
export function createEmailTransporterAlternative() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: false
    }
  })

  return transporter
}

// Función genérica para enviar emails con reintentos
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<{ success: boolean; error?: string }> {
  // Verificar que las variables estén configuradas
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ EMAIL_USER o EMAIL_PASS no están configuradas en .env.local')
    return {
      success: false,
      error: 'Configuración de email no disponible. Verifica que EMAIL_USER y EMAIL_PASS estén en .env.local'
    }
  }

  const transporter = createEmailTransporter()
  if (!transporter) {
    return {
      success: false,
      error: 'No se pudo crear el transporter de email'
    }
  }

  try {
    console.log('📧 Intentando enviar email a:', options.to)
    console.log('📧 Host SMTP:', process.env.SMTP_HOST || 'smtp.gmail.com')
    console.log('📧 Puerto:', '587')
    
    await transporter.sendMail({
      from: options.from || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html
    })

    console.log(`✅ Email enviado exitosamente a: ${options.to}`)
    return { success: true }
  } catch (error: any) {
    console.warn('⚠️ Error con puerto 587:', error.message)
    console.warn('⚠️ Intentando puerto 465 como alternativa...')
    
    // Si falla con puerto 587, intentar con puerto 465
    try {
      const altTransporter = createEmailTransporterAlternative()
      if (!altTransporter) {
        return {
          success: false,
          error: error.message
        }
      }

      await altTransporter.sendMail({
        from: options.from || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html
      })

      console.log(`✅ Email enviado exitosamente a: ${options.to} (con puerto 465)`)
      return { success: true }
    } catch (altError: any) {
      console.error('❌ Error enviando email (ambos puertos fallaron):', altError.message)
      console.error('💡 Nota: Verifica que EMAIL_USER y EMAIL_PASS estén configurados en .env.local')
      console.error('💡 Genera una contraseña de aplicación en: https://myaccount.google.com/apppasswords')
      return {
        success: false,
        error: altError.message
      }
    }
  }
}

// Función para enviar notificación de pago recibido
export async function sendPagoRecibidoNotification(
  representante: { nombre: string; email: string },
  pago: { concepto: string; monto: number; fechaPago: any; metodoPago: string; observaciones?: string }
) {
  const result = await sendEmail({
    to: representante.email,
    subject: 'Comprobante de Pago Recibido - Club de Fútbol',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2D3748;">Comprobante de Pago Recibido</h2>
        
        <p>Estimado/a ${representante.nombre},</p>
        
        <p>Hemos recibido tu comprobante de pago con los siguientes detalles:</p>
        
        <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2D3748; margin-top: 0;">Detalles del Pago</h3>
          <p><strong>Concepto:</strong> ${pago.concepto}</p>
          <p><strong>Monto:</strong> $${pago.monto.toFixed(2)}</p>
          <p><strong>Fecha de Pago:</strong> ${pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-ES') : 'No especificada'}</p>
          <p><strong>Método de Pago:</strong> ${pago.metodoPago}</p>
          ${pago.observaciones ? `<p><strong>Observaciones:</strong> ${pago.observaciones}</p>` : ''}
        </div>
        
        <p>Tu comprobante está siendo revisado por nuestro equipo administrativo. 
        Te notificaremos por correo electrónico una vez que sea verificado.</p>
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Este es un mensaje automático, por favor no responder a este correo.
        </p>
        
        <p style="color: #2D3748; font-weight: bold;">
          Club de Fútbol - Sistema de Pagos
        </p>
      </div>
    `
  })

  return result
}

// Función para enviar notificación de verificación de pago
export async function sendPagoVerificadoNotification(
  pago: any
) {
  const esAprobado = pago.estadoVerificacion === 'Aprobado'
  const color = esAprobado ? '#48BB78' : '#E53E3E'
  const icono = esAprobado ? '✅' : '❌'
  const titulo = esAprobado ? 'Pago Aprobado' : 'Pago Denegado'

  const result = await sendEmail({
    to: pago.representante.email,
    subject: `${titulo} - Club de Fútbol`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${color};">${icono} ${titulo}</h2>
        
        <p>Estimado/a ${pago.representante.nombre},</p>
        
        <p>Tu comprobante de pago ha sido revisado por nuestro equipo administrativo.</p>
        
        <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
          <h3 style="color: #2D3748; margin-top: 0;">Detalles del Pago</h3>
          <p><strong>Concepto:</strong> ${pago.concepto}</p>
          <p><strong>Monto:</strong> $${pago.monto.toFixed(2)}</p>
          <p><strong>Fecha de Pago:</strong> ${pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-ES') : 'No especificada'}</p>
          <p><strong>Estado:</strong> <span style="color: ${color}; font-weight: bold;">${pago.estadoVerificacion}</span></p>
          ${pago.comentarioAdmin ? `<p><strong>Comentario:</strong> ${pago.comentarioAdmin}</p>` : ''}
        </div>
        
        ${esAprobado ? 
          '<p style="color: #48BB78; font-weight: bold;">¡Tu pago ha sido verificado y aprobado exitosamente!</p>' :
          '<p style="color: #E53E3E; font-weight: bold;">Tu comprobante no pudo ser verificado. Por favor, contacta con nosotros.</p>'
        }
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Este es un mensaje automático, por favor no responder a este correo.
        </p>
        
        <p style="color: #2D3748; font-weight: bold;">
          Club de Fútbol - Sistema de Pagos
        </p>
      </div>
    `
  })

  return result
}

// Función para enviar notificaciones generales
export async function sendNotificacionEmail(
  representante: { nombre: string; email: string },
  notificacion: { titulo: string; mensaje: string; tipo: string }
) {
  const tipoColors: { [key: string]: string } = {
    'Recordatorio': '#F6AD55',
    'Comunicado': '#4299E1',
    'Evento': '#48BB78'
  }

  const tipoIcons: { [key: string]: string } = {
    'Recordatorio': '⏰',
    'Comunicado': '📢',
    'Evento': '🎉'
  }

  const color = tipoColors[notificacion.tipo] || '#2D3748'
  const icono = tipoIcons[notificacion.tipo] || '📧'

  const result = await sendEmail({
    to: representante.email,
    subject: `${icono} ${notificacion.titulo} - Club de Fútbol`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${color};">${icono} ${notificacion.titulo}</h2>
        
        <p>Estimado/a ${representante.nombre},</p>
        
        <div style="background-color: #F7FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
          <p style="color: #2D3748; line-height: 1.6; white-space: pre-line;">${notificacion.mensaje}</p>
        </div>
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Este es un mensaje automático, por favor no responder a este correo.
        </p>
        
        <p style="color: #2D3748; font-weight: bold;">
          Club de Fútbol - Sistema de Notificaciones
        </p>
      </div>
    `
  })

  return result
}

// Función para enviar notificación de actividad creada
export async function sendActividadCreadaNotification(
  representante: { nombre: string; email: string },
  actividad: {
    titulo: string
    tipo: string
    fechaInicio: string | Date
    fechaFin?: string | Date
    categoria?: string
    instructor?: { nombre: string }
    cancha?: { nombre: string }
    descripcion?: string
  }
) {
  const fechaInicio = new Date(actividad.fechaInicio)
  const fechaFin = actividad.fechaFin ? new Date(actividad.fechaFin) : null
  
  const result = await sendEmail({
    to: representante.email,
    subject: `📅 Nueva ${actividad.tipo}: ${actividad.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4299E1;">📅 Nueva ${actividad.tipo}</h2>
        
        <p>Estimado/a ${representante.nombre},</p>
        
        <p>Te informamos que se ha programado una nueva actividad:</p>
        
        <div style="background-color: #EBF8FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4299E1;">
          <h3 style="color: #2D3748; margin-top: 0;">${actividad.titulo}</h3>
          ${actividad.descripcion ? `<p style="color: #4A5568; margin-bottom: 15px;">${actividad.descripcion}</p>` : ''}
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${fechaInicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 8px 0;"><strong>🕐 Hora:</strong> ${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            ${fechaFin ? `<p style="margin: 8px 0;"><strong>Hasta:</strong> ${fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>` : ''}
            ${actividad.categoria ? `<p style="margin: 8px 0;"><strong>👥 Categoría:</strong> ${actividad.categoria}</p>` : ''}
            ${actividad.instructor ? `<p style="margin: 8px 0;"><strong>👨‍🏫 Instructor:</strong> ${actividad.instructor.nombre}</p>` : ''}
            ${actividad.cancha ? `<p style="margin: 8px 0;"><strong>📍 Cancha:</strong> ${actividad.cancha.nombre}</p>` : ''}
          </div>
        </div>
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Este es un mensaje automático, por favor no responder a este correo.
        </p>
        
        <p style="color: #2D3748; font-weight: bold;">
          Club de Fútbol - Calendario de Actividades
        </p>
      </div>
    `
  })

  return result
}

// Función para enviar notificación de actividad cancelada
export async function sendActividadCanceladaNotification(
  representante: { nombre: string; email: string },
  actividad: {
    titulo: string
    tipo: string
    fechaInicio: string | Date
    categoria?: string
    instructor?: { nombre: string }
    cancha?: { nombre: string }
    motivo?: string
  }
) {
  const fechaInicio = new Date(actividad.fechaInicio)

  const result = await sendEmail({
    to: representante.email,
    subject: `❌ ${actividad.tipo} Cancelada: ${actividad.titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #E53E3E;">❌ ${actividad.tipo} Cancelada</h2>
        
        <p>Estimado/a ${representante.nombre},</p>
        
        <p>Lamentamos informarle que la siguiente actividad ha sido cancelada:</p>
        
        <div style="background-color: #FED7D7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E53E3E;">
          <h3 style="color: #2D3748; margin-top: 0;">${actividad.titulo}</h3>
          
          <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
            <p style="margin: 8px 0;"><strong>📅 Fecha:</strong> ${fechaInicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 8px 0;"><strong>🕐 Hora:</strong> ${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            ${actividad.categoria ? `<p style="margin: 8px 0;"><strong>👥 Categoría:</strong> ${actividad.categoria}</p>` : ''}
            ${actividad.instructor ? `<p style="margin: 8px 0;"><strong>👨‍🏫 Instructor:</strong> ${actividad.instructor.nombre}</p>` : ''}
            ${actividad.cancha ? `<p style="margin: 8px 0;"><strong>📍 Cancha:</strong> ${actividad.cancha.nombre}</p>` : ''}
          </div>
          ${actividad.motivo ? `<p style="margin-top: 15px; color: #4A5568;"><strong>Motivo:</strong> ${actividad.motivo}</p>` : ''}
        </div>
        
        <p>${actividad.motivo ? 'Agradecemos su comprensión.' : 'Les mantendremos informados sobre cualquier reprogramación.'}</p>
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Este es un mensaje automático, por favor no responder a este correo.
        </p>
        
        <p style="color: #2D3748; font-weight: bold;">
          Club de Fútbol - Calendario de Actividades
        </p>
      </div>
    `
  })

  return result
}
