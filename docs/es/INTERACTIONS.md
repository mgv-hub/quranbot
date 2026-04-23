# Manejadores de Interacciones

## Procesadores

Ubicados en core/interactions/.

- interactionProcessor.js: Enrutador principal para todas las interacciones.
- proc-buttons.js: Enruta clics de botones a archivos de lógica específicos.
- proc-menus.js: Maneja interacciones de menú de selección.
- proc-modals.js: Procesa envíos de modales.
- proc-commands.js: Ejecuta comandos slash.

## Lógica del Sistema

- Estado de Voz: Verifica si el bot está en canal de voz antes de permitir comandos de reproducción.
- Autorización: Valida permisos de usuario antes de ejecutar acciones sensibles.
- Tiempos de Espera: Aplica limitación de tasa para prevenir abusos.
- Manejo de Errores: Captura de errores centralizada con mensajes amigables para el usuario.

## Manejadores Específicos

- Reproducción: Play, pause, resume, next, previous.
- Navegación: Paginación para listas de Surahs y listas de Recitadores.
- Admin: Controles solo para desarrollador para gestión del servidor y estadísticas.
- Webhooks: Registro y gestión de servicios externos de webhook Adhkar.
