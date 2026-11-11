---
name: property-management-god-mode
description: Guía de trabajo para intervenir la plataforma FAMILIA BENAVIDES — CONTROL DE PROPIEDADES (HTML/CSS/JS + Firebase). Úsala al modificar cualquier módulo (resumen, propiedades, contribuciones, documentos, contratos, pagos y recibos, gastos de mantención, informes, datos del emisor), el diseño, los PDF o las reglas de Firebase. Impone coherencia visual, integridad de datos y pruebas antes de declarar algo terminado.
---

# Property Management — guía maestra

Plataforma de administración inmobiliaria familiar, sin build step, publicada en GitHub Pages, con datos en Firebase. El objetivo es que se sienta como un SaaS financiero premium sin sacrificar estabilidad ni datos.

## 1. Principios no negociables

1. **Integridad de datos primero.** Nunca borrar, duplicar ni renombrar registros existentes. Nunca cambiar IDs de documentos. Si el esquema cambia: migración idempotente, documentada en `docs/MIGRACIONES.md`, con valores por defecto para registros antiguos (leer siempre con `?? default`).
2. **Compatibilidad hacia atrás.** Los campos existentes se conservan con su nombre. Campos nuevos son opcionales.
3. **Sin datos ficticios en producción.** Las pruebas usan Firebase simulado (`tests/`), jamás el proyecto real.
4. **Sin secretos.** La `apiKey` web de Firebase es pública por diseño; la seguridad está en `firestore.rules`/`storage.rules` (solo `request.auth != null`). Nunca subir claves de servicio ni contraseñas.
5. **Cálculos financieros verificables.** Todo total sale de funciones puras en `js/finance.js`, con prueba en `tests/`. Redondeo con `Math.round` a pesos enteros; UF con 2 decimales. No mezclar CLP y UF en una misma suma.
6. **Sin dependencias nuevas** salvo necesidad real. Hoy: Firebase compat 10.12.2, jsPDF 2.5.1, jspdf-autotable 3.8.2 (CDN con versión fija).
7. **No tocar el logo** (`assets/logo.png`) ni la marca sin autorización.
8. **Nada a medias:** ningún botón sin acción, ningún formulario que no guarde.

## 2. Arquitectura

```
index.html            estructura y carga de scripts
css/app.css           tokens, componentes, responsive, animaciones
js/core.js            estado S, filtros F, utilidades, formato (clp, uf, fdate…)
js/finance.js         reglas de negocio y cálculos (funciones puras)
js/data.js            persistencia Firebase (guardar/borrar/subir/descargar)
js/ui.js              modal, toast, formularios, confirmaciones, tablas ordenables
js/pdf.js             recibos y informes PDF/CSV
js/views-*.js         una vista por módulo
js/app.js             eventos, router, login, arranque
tests/                pruebas con Playwright + Firebase simulado
```

Los scripts son clásicos (no módulos) y comparten el ámbito global léxico; el orden de carga en `index.html` importa. Colecciones Firestore: `propiedades`, `contribuciones`, `documentos`, `contratos`, `pagos`, `gastos` y el documento `config/emisor`. Archivos en Storage bajo `archivos/`.

Esquemas (campos existentes, no renombrar): ver `docs/ESQUEMA.md`.

## 3. Sistema de diseño

Dirección: Linear / Stripe / Mercury / Apple HIG como estándar de calidad, sin copiar. Sobrio, mucho aire, tipografía clara, dorado como acento escaso.

Tokens (definidos en `:root`, nunca colores sueltos en componentes):
- Marino `#101D3A`, marino 2 `#1C2D50`, dorado `#C8A45D`, dorado claro `#E8D6A5`
- Fondo `#F7F5EF`, superficie `#FFFDF8`, texto `#17243B`, texto 2 `#718096`
- Positivo verde, alerta rojo, aviso ámbar (siempre con fondo suave + texto oscuro del mismo tono)
- Tema **claro fijo** (decisión del usuario). Sin modo oscuro.
- Tipografía: Cormorant Garamond / Cinzel para títulos de marca; IBM Plex Sans para UI; IBM Plex Mono para cifras de documentos. Cifras con `font-variant-numeric: tabular-nums`.
- Radios 8–12 px, sombras suaves y cortas, bordes de 1 px color línea.
- Objetivos táctiles ≥ 40 px; texto de cuerpo ≥ 14 px; sin interfaces comprimidas.

Componentes obligatorios y reutilizables: `.btn` (primary/ghost/danger/small), `.pill` (ok/warn/bad/acc), `.kpi`, `.panel`, tabla con encabezado ordenable, `.empty` (estado vacío con ícono SVG), skeleton `.sk`, modal con animación, toast apilable.

Animaciones: 120–250 ms, `ease-out`, solo `opacity` y `transform`. Todo respeta `prefers-reduced-motion`.

## 4. Reglas de dominio (Chile)

- Contribuciones: 4 cuotas (abril, junio, septiembre, noviembre; vencen el último día).
- Arriendos: canon en CLP o UF; día de pago; estado Pagado / Pendiente / Atrasado por período `YYYY-MM`.
- Recibos: numeración correlativa `nextNro()`; el número no se reutiliza; guardan snapshot de arrendatario y propiedad.
- Gastos: cuantía menor/mayor; **cargo a Propietario o Arrendatario — solo los del propietario restan del resultado**; ítems con clase (materiales / mano de obra / flete / otro), cantidad y valor unitario; total = Σ cant × unit.
- Distinguir siempre: ingreso **contratado** (canon de contratos vigentes), **cobrado** (pagos registrados) y **pendiente** (contratado − cobrado).
- Fechas ISO `YYYY-MM-DD` en base de datos; `DD-MM-YYYY` solo al mostrar.

## 5. Procedimiento de trabajo

1. Leer el código real del módulo (no suponer). `grep` por `data-act` para ver acciones existentes.
2. Cambiar con el menor radio posible; extraer lógica de cálculo a `finance.js` y probarla.
3. Escapar todo texto de usuario con `esc()` al armar HTML.
4. Escribir/actualizar la prueba del módulo en `tests/`.
5. Ejecutar `node tests/run.js` y revisar consola del navegador sin errores.
6. Revisar 3 anchos: 1440, 820 y 390 px.
7. Verificar que los módulos previos siguen funcionando (la suite completa).
8. Commit pequeño y descriptivo; PR hacia `main`. No declarar terminado sin haber ejecutado la prueba.

## 6. Lista de verificación por módulo

- [ ] Carga sin errores de consola
- [ ] Crear / editar / eliminar (con confirmación) persiste y se refleja
- [ ] Cálculos coinciden con la prueba
- [ ] Filtros, búsqueda y orden funcionan
- [ ] PDF/CSV se generan y abren
- [ ] Responsive 1440 / 820 / 390
- [ ] Estados: cargando (skeleton), vacío, error
- [ ] Accesible: foco visible, etiquetas, contraste, `prefers-reduced-motion`

## 7. Antipatrones

- Cambios solo cosméticos que dejan lógica rota.
- Duplicar registros al "guardar" (usar siempre `set` con ID existente al editar).
- Sumar gastos del arrendatario como egresos del propietario.
- Concentrar toda la lógica en un solo archivo.
- Introducir un framework o paso de compilación.
- Usar `innerHTML` con datos sin `esc()`.
