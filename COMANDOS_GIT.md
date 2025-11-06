# Comandos Git para Documentar Cambios

Este documento contiene los comandos para crear commits bien documentados siguiendo el estándar [Conventional Commits](https://www.conventionalcommits.org/).

## 📝 Estructura de Commits

Formato: `tipo(alcance): descripción`

**Tipos comunes:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización de código
- `perf`: Mejoras de rendimiento
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

## 🚀 Comandos para Ejecutar

### 1. Verificar estado actual
```bash
git status
```

### 2. Agregar archivos de documentación
```bash
git add CHANGELOG.md
git add README.md
git add COMANDOS_GIT.md
```

### 3. Crear commits organizados

#### Commit 1: Documentación principal
```bash
git commit -m "docs: agregar CHANGELOG.md con historial completo de cambios v1.0.0"
```

#### Commit 2: Actualización de README
```bash
git commit -m "docs(readme): actualizar documentación con nuevas características y endpoints

- Agregar sección de autenticación y roles
- Documentar módulos de Torneos, Desarrollo del Atleta, Tienda
- Actualizar lista de API endpoints
- Mejorar instrucciones de instalación y despliegue
- Actualizar Roadmap con características completadas"
```

#### Commit 3: Guía de comandos Git
```bash
git commit -m "docs: agregar guía de comandos Git para documentación de cambios"
```

### 4. Ver historial de commits
```bash
git log --oneline -10
```

### 5. Push a GitHub (si ya tienes el remoto configurado)
```bash
git push origin main
```

## 📦 Alternativa: Commit único para documentación

Si prefieres un solo commit con toda la documentación:

```bash
git add CHANGELOG.md README.md COMANDOS_GIT.md
git commit -m "docs: documentación completa del proyecto v1.0.0

- CHANGELOG.md: historial detallado de cambios desde v0.1.0 a v1.0.0
- README.md: actualización completa con todas las características
- COMANDOS_GIT.md: guía de comandos para documentación
- Actualización de Roadmap con características completadas
- Documentación de API endpoints actualizada"
```

## 🏷️ Crear Tag de Versión (Opcional)

Para marcar esta versión en Git:

```bash
git tag -a v1.0.0 -m "Release 1.0.0: Sistema completo de gestión de escuela de fútbol

Características principales:
- Sistema de autenticación y roles
- Módulo de Torneos y Competencias
- Desarrollo del Atleta con evaluaciones
- Tienda de productos con carrito
- Sistema de aprobación de actividades
- Notificaciones por email mejoradas"

# Push del tag
git push origin v1.0.0
```

## 📋 Checklist antes de hacer push

- [ ] Todos los archivos sensibles están en `.gitignore`
- [ ] No hay credenciales en el código
- [ ] `.env.local` no está en el repositorio
- [ ] La documentación está completa y actualizada
- [ ] Los commits tienen mensajes descriptivos
- [ ] El código está funcionando correctamente

## 🔗 Enlaces Útiles

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

