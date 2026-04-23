# Gestión de Estado

## Estado del Gremio

Cada gremio tiene un objeto de estado de tiempo de ejecución almacenado en memoria.

- Conexión: Objeto de conexión de voz.
- Reproducción: Surah actual, recitador y modo.
- Temporizadores: Temporizadores de Adhkar e inactividad.
- Configuración: Modo de control e IDs de canal.

## Estado Persistente

El estado está sincronizado con Firebase Realtime Database.

- Recuperación: Los estados se restauran al reiniciar el bot.
- Copia de Seguridad: Copias de seguridad automáticas cada 5 minutos.
- Limpieza: Datos obsoletos eliminados para gremios abandonados.

## Restauración de Estado

1. Cargar estados desde Firebase.
2. Validar existencia del canal.
3. Reconectar canales de voz.
4. Reanudar reproducción si corresponde.

## Gestión de Memoria

- Recolección de basura activada en alto uso de memoria.
- Caché de interacciones limpiado periódicamente.
- Conexiones destruidas limpiadas automáticamente.
