# Registro y Monitoreo

## Estrategia

- Cola Asíncrona: Previene bloqueo de E/S durante tráfico alto.
- Archivado: Registros antiguos comprimidos y almacenados en storage/logs/archive.
- Limpieza: Registros mayores de 60 días eliminados automáticamente.
- Seguimiento de Errores: Excepciones no capturadas y rechazos de promesa registrados con trazas de pila.

## Monitoreo

- Verificación de Salud: Servidor HTTP expone puntos finales /health y /radio-health.
- Gestión de Memoria: Verificaciones periódicas activan recolección de basura si uso de memoria excede umbrales.
- Estadísticas: Estadísticas de uso del bot (servidores, comandos, adhkar) rastreadas y guardadas en Firebase.

## Niveles de Registro

- debug: Información interna detallada.
- info: Mensajes operacionales generales.
- warn: Problemas potenciales.
- error: Fallos críticos.
- fatal: Errores que detienen el sistema.
