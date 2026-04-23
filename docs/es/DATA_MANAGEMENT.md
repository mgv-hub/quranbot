# Gestión de Datos

## Obtención

Ubicado en core/data/.

- Fuentes: Datos obtenidos de mp3quran.net, aladhan.com y repositorios JSON personalizados.
- Métodos: Usa node-fetch con encabezados personalizados y tiempos de espera.
- Validación: Estructuras de datos validadas antes de cargarse en estado global.

## Almacenamiento en Caché

- Caché de Tiempo de Ejecución: Datos almacenados en variables globales para acceso rápido.
- Caché de Firebase: Datos críticos respaldados en Firebase para persistencia.
- Caché Local: Archivos JSON usados como alternativa si fuentes remotas fallan.

## Almacenamiento

- Firebase: Usado para configuraciones de gremio, estados, IDs de control y webhooks de usuario.
- Local: Archivos de copia de seguridad comprimidos y almacenados localmente antes de enviar a canales de Discord.
- Entorno: Configuración sensible cargada vía cargador Envira personalizado.
