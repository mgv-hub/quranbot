# Sistema de Comandos

## Comandos Slash

- /control: Muestra el panel de control principal para reproducción.
- /setup: Crea la categoría del Corán y canales.
- /join: Se une al canal de voz configurado.
- /leave: Se desconecta del canal de voz.
- /ping: Muestra la latencia del bot y estadísticas.
- /prayer_times: Muestra horarios de oración para ubicaciones seleccionadas.
- /sources: Lista fuentes de datos utilizadas por el bot.
- /guide: Muestra instrucciones de uso.

## Niveles de Permiso

- Administrador: Acceso completo a todos los comandos.
- Usuarios Especiales: Definidos en variables de entorno.
- Todos: Limitado a navegación de reproducción en modos específicos.

## Tiempos de Espera

Los comandos utilizan un sistema de tiempo de espera para prevenir abusos.

- Tiempos de Espera de Usuario: Aplicados por usuario por comando.
- Tiempos de Espera de Servidor: Aplicados por gremio para comandos de configuración.
- Tiempos de Espera Globales: Aplicados durante situaciones de alta carga.

## Flujo de Ejecución

1. Interacción recibida.
2. Verificación de permisos.
3. Verificación de tiempo de espera.
4. Ejecución del comando.
5. Actualización de estado.
