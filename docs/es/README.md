# Documentación del Proyecto QuranBot

## Descripción General

QuranBot es una aplicación Node.js completa diseñada para la plataforma Discord. Su propósito principal es proporcionar servicios de contenido islámico, incluyendo recitación del Corán, transmisión de radio, automatización de Adhkar e información de horarios de oración. El proyecto está diseñado para alta disponibilidad, persistencia de estado y escalabilidad modular.

## Público Objetivo

- Administradores de servidores Discord que buscan automatización de contenido islámico.
- Desarrolladores interesados en arquitectura modular de bots de Discord.
- Usuarios finales que requieren transmisión de audio confiable y utilidades religiosas.

## Características Principales

- Reproducción de Audio: Transmisión de recitaciones del Corán de múltiples recitadores y estaciones de radio.
- Persistencia de Estado: Guardado y restauración de configuraciones de servidor a través de Firebase.
- Adhkar Automatizados: Envío programado de mensajes de recordatorio.
- Horarios de Oración: Búsqueda global de horarios de oración con precisión basada en ubicación.
- Controles de Administrador: Panel de desarrollador dedicado para gestión del servidor.
- Sistemas de Recuperación: Reconexión automática a canales de voz después de reinicios.

## Instalación

1. Clonar el repositorio.
2. Instalar dependencias usando pnpm install.
3. Configurar variables de entorno en .env.
4. Iniciar el bot usando pnpm start.

## Licencia

Licencia MIT
