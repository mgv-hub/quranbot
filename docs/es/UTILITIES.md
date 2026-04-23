# Utilidades Personalizadas

## Cargador Envira

Ubicado en core/package/Envira/.

- Propósito: Alternativa personalizada a dotenv con soporte de cifrado.
- Características: Analiza archivos .env, soporta valores cifrados, maneja múltiples entornos.

## Alias de Ruta

- Biblioteca: pathlra-aliaser.
- Uso: Permite importaciones como @logger en lugar de rutas relativas.
- Configuración: Definido en package.json bajo path*aliaser*.

## Utilidades de Audio

- Lógica de Reintento: fetchWithRetry maneja inestabilidad de red.
- Validación de Flujo: Verifica tipo de contenido y estado antes de reproducir.
- Cálculo de Duración: Estima duración de audio para seguimiento de progreso.

## Limpiador de Base de Datos

Ubicado en core/utils/databaseCleaner.js.

- Función: Elimina datos obsoletos para gremios donde el bot ya no está.
- Objetivos: Gremios de configuración, estados de gremio e IDs de control.
