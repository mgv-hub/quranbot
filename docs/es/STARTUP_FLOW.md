# Flujo de Inicio e Inicialización

## Secuencia

1. Carga de Entorno: core/config/envSwitcher.js carga variables de entorno.
2. Inicialización del Cliente: core/startup/botSetup.js inicializa cliente Discord y variables globales.
3. Carga de Datos: core/data/data-manager.js obtiene datos del Corán y Recitadores.
4. Inicio de Sesión: El bot inicia sesión en Discord.
5. Evento Ready: core/startup/readyHandler.js se activa.
   - Inicializar Firebase.
   - Restaurar Estados de Tiempo de Ejecución.
   - Recuperar Conexiones de Voz.
   - Registrar Comandos.
   - Iniciar Temporizadores (Adhkar, Copias de Seguridad, Estadísticas).

## Tareas Recurrentes

- Guardado de Estado: Cada 60 segundos.
- Copia de Seguridad: Cada 5 minutos.
- Salud de Radio: Cada 30 minutos.
- Limpieza de Memoria: Cada 3 minutos.
- Actualización de Estadísticas: Cada 10 segundos.
