# Mejoras Potenciales

## Escalabilidad

- Base de Datos: Migrar de Firebase Realtime Database a Firestore o PostgreSQL para consultas complejas.
- Redis: Usar Redis para estado compartido entre múltiples instancias de bot.

## Seguridad

- Secretos: Asegurar que todas las claves API estén cifradas y rotadas regularmente.
- Validación de Entrada: Fortalecer validación en entradas de modales y argumentos de comandos.
- Limitación de Tasa: Implementar límites de tasa globales más estrictos para prevenir prohibiciones de API.

## Optimización de Memoria

- Límites de Caché: Aplicar límites más estrictos en cachés de interacciones y embeds.
- Gestión de Flujos: Asegurar que recursos de audio sean destruidos inmediatamente después del uso.
- Escuchas de Eventos: Auditar escuchas de eventos para prevenir fugas de memoria.

## Refactorización de Código

- Inyección de Dependencias: Reemplazar variables globales con dependencias inyectadas para mejor capacidad de prueba.
- TypeScript: Migrar a TypeScript para seguridad de tipos.
- Pruebas Unitarias: Agregar pruebas Jest para funciones de utilidad y lógica de estado.
