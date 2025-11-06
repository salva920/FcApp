# 🔐 Crear Usuario Administrador

Como administrador, necesitas crear el primer usuario admin para acceder al sistema. Tienes dos opciones:

## Método 1: Script de Línea de Comandos (Recomendado)

### Usar valores por defecto:
```bash
npm run create-admin
```
Esto creará un admin con:
- Email: `admin@footballpro.com`
- Contraseña: `admin123`
- Nombre: `Administrador`

### Usar valores personalizados:
```bash
npm run create-admin admin@tuservidor.com miPassword123 "Tu Nombre"
```

**Ejemplo:**
```bash
npm run create-admin admin@footballpro.com Admin2024! "Administrador Principal"
```

---

## Método 2: Endpoint API Temporal

1. Abre tu navegador o Postman
2. Haz una petición POST a: `http://localhost:3000/api/auth/create-admin`
3. Con el siguiente body (JSON):
```json
{
  "email": "admin@footballpro.com",
  "password": "admin123",
  "nombre": "Administrador"
}
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@footballpro.com","password":"admin123","nombre":"Administrador"}'
```

---

## ⚠️ IMPORTANTE - Seguridad

1. **Después de crear el admin:**
   - Cambia la contraseña desde el panel de administración
   - Elimina o protege el endpoint `/api/auth/create-admin`
   - El endpoint se deshabilita automáticamente si ya existe un admin

2. **El endpoint temporal solo funciona si:**
   - NO existe ningún usuario con rol 'admin' en la base de datos
   - Una vez creado el primer admin, el endpoint queda deshabilitado

3. **Recomendación:**
   - Usa el script de línea de comandos para mejor seguridad
   - Elimina el archivo `src/app/api/auth/create-admin/route.ts` después de crear el admin

---

## 🔑 Credenciales por Defecto (si usas el script sin parámetros)

- **Email:** admin@footballpro.com
- **Contraseña:** admin123
- **Nombre:** Administrador

**⚠️ CAMBIA LA CONTRASEÑA DESPUÉS DEL PRIMER ACCESO**

