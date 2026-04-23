# Implementación y Configuración

## Variables de Entorno

- DISCORD_TOKEN: Token de autenticación del bot.
- FIREBASE_CONFIG: Credenciales de base de datos.
- SPE_USER_ID: IDs de usuarios desarrolladores especiales.
- NODE_ENV: Modo producción o desarrollo.

## Scripts de Inicio

- start.bat: Script de inicio de Windows.
- start.sh: Script de inicio de Linux.
- Gestor de Paquetes: Usa pnpm para gestión de dependencias.

## Monitoreo

- Verificación de Salud: Punto final HTTP para estado.
- Registro: Basado en archivos con rotación y archivado.
- Estadísticas: Métricas de uso rastreadas en Firebase.

## Sistema de Copia de Seguridad

- Local: Archivos JSON comprimidos almacenados localmente.
- Remoto: Enviados al canal de Discord vía webhook.
- Programación: Se ejecuta cada 5 minutos automáticamente.

## Escalabilidad

- Memoria: Optimizado para implementación de instancia única.
- Base de Datos: Firebase usado para estado compartido.
