# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## OBJETIVO

Construir una aplicacion para ayudar a los usuarios de la Red de Paradores de Turismo Nacionales a elegir el Parador que deseen. La aplicacion debe ser una aplicacion web para ejecutarse en el navegador. La **landing page** debe mostrar como contenido principal un mapa de España donde cada parador se represente con un punto. Cada parador debe ser seleccionable con el puntero del raton. Cuando el usuario haga click sobre un parador debe aparecer informacion sobre el parador seleccionado con un enlace a su sitio web. Tambien deben resaltarse en otro color los paradores mas proximos (que se encuentren a menos de 150 kms).

## ARQUITECTURA

La aplicacion debe tener una arquitectura **frontend/backend**

1. **Frontend**: Debe estar programado con html, css y vainilla javascript
2. **Backend**: Debe estar programado en Python con el framework FastAPI. Como gestor de paquetes y entorno de python usar uv

## ESTRUCTURA

* `backend/server.py`: API FastAPI. `GET /api/paradores` devuelve todos los paradores y `GET /api/paradores/{id}/cercanos?km=150` los cercanos (haversine). Tambien sirve `frontend/` como estaticos en `/`
* `backend/paradores.json`: datos de los paradores (id, nombre, provincia, comunidad, lat, lon, web). Las URLs siguen el patron `https://paradores.es/es/parador-de-<slug>` con excepciones
* `frontend/`: mapa con Leaflet (cargado desde cdnjs) y teselas Esri World Street Map (sin api key; CARTO y OSM estandar fallan: CARTO exige api key y OSM bloquea clientes sin politica de uso); el frontend solo habla con la API relativa `/api/...`, asi que debe servirse desde el backend
* Ejecutar desde la raiz del proyecto: `uv run uvicorn backend.server:app --reload` y abrir http://localhost:8000
* No hay tests
* Este directorio no es un repositorio git propio: git usa el repositorio padre `/Users/jlqrmac/projects`, que contiene muchos proyectos ajenos. Limitar los comandos git a este directorio (p. ej. `git status .`)

## REGLAS GENERALES

* El codigo debe ser lo mas sencillo posible
* No utilizar emoji
* No utilizar excesivas comprobaciones de tipos
* No incluir documentacion