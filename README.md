# Familia Benavides — Control de propiedades

Aplicación web estática (HTML/CSS/JS, sin build) con datos en Firebase (Firestore, Auth, Storage). Se publica con GitHub Pages.

- Configuración de Firebase: `FIREBASE_CONFIG` en `js/core.js`. Reglas: `firestore.rules`, `storage.rules`.
- Guía de diseño y arquitectura: `.claude/skills/property-management-god-mode/SKILL.md`. Esquema: `docs/ESQUEMA.md`.

## Pruebas
Usan un Firebase simulado en memoria (nunca tocan el proyecto real) y Playwright.
```bash
PDF_LIBS=/ruta/a/node_modules node tests/run.js
```
`PDF_LIBS` debe contener `jspdf@2.5.1` y `jspdf-autotable@3.8.2` (las pruebas no cargan la CDN).
