# Arquitectura y Estructura

## Filosofía de Diseño

El proyecto sigue una arquitectura monolítica modular. La lógica está separada en dominios distintos incluyendo Estado, Datos, Interacciones y Utilidades para facilitar el mantenimiento. Utiliza alias de ruta personalizado para gestionar estructuras de directorios profundas.

## Jerarquía de Carpetas

- core/bot/: Punto de entrada e inicialización del cliente principal.
- core/startup/: Lógica de arranque y registro de comandos.
- core/state/: Gestión de estado y persistencia.
- core/interactions/: Manejo de botones, menús y comandos.
- core/data/: Obtención y almacenamiento en caché de datos.
- core/utils/: Utilidades compartidas incluyendo registro y Firebase.
- core/ui/: Constructores de embeds y creadores de componentes.
- core/package/Envira/: Cargador de variables de entorno personalizado.

## Componentes Principales

- Cliente: Instancia de Discord.js Client gestionada en core/bot/core.js.
- Gestor de Estado: GuildStateManager y PersistentStateManager manejan el estado de tiempo de ejecución y base de datos.
- Procesador de Interacciones: Enruta todas las interacciones de Discord a manejadores específicos.
- Cargador de Datos: Gestiona llamadas API externas y almacenamiento en caché para recitadores y surahs.

## Interacción de Módulos

La secuencia de inicio inicializa el cliente, carga datos, se conecta a Firebase y restaura estados anteriores. Las interacciones se enrutan a través de un procesador central que valida permisos y tiempos de espera antes de ejecutar manejadores específicos.
