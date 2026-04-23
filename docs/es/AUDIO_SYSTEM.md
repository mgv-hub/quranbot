# Sistema de Audio

## Motor de Reproducción

Utiliza @discordjs/voice para manejo de audio.

- Recursos: Creados desde flujos HTTP.
- Reproductor: Gestiona estado de reproducción y errores.
- Conexión: Maneja comunicación de puerta de enlace de voz.

## Manejo de Flujos

- Validación: URLs verificadas antes de reproducción.
- Lógica de Reintento: Flujos fallidos reintentados con alternativas.
- Duración: Estimada desde encabezados o número de surah.

## Datos de Recitadores

- Fuentes: mp3quran.net y repositorios JSON personalizados.
- Caché: Datos almacenados en caché en memoria y Firebase.
- Alternativa: Archivos locales usados si fuentes remotas fallan.

## Sistema de Radio

- Verificación de Salud: Flujos monitoreados periódicamente.
- Conmutación por Error: Cambio automático a flujos funcionales.
- Paginación: Radios listados en páginas de 25.
