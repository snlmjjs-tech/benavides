# Esquema de datos (Firestore)

IDs de documento: generados por Firestore (`add`) salvo `config/emisor`. **No renombrar campos existentes.** Los campos marcados *(nuevo)* son opcionales; los registros antiguos se leen con valores por defecto.

| Colección | Campos |
|---|---|
| `propiedades` | nombre, tipo, direccion, comuna, rol, propietario, rutPropietario, avaluo, superficie, notas, *(nuevo)* supConstruida, dormitorios, banos, estacionamientos, anioConstruccion |
| `contratos` | propiedadId, arrendatario, rut, telefono, email, inicio, termino, canon, moneda (CLP/UF), diaPago, garantia, reajuste, notas, archivoId/archivoUrl/archivoNombre/archivoTipo, *(nuevo)* proxReajuste, renuevaDe (id del contrato renovado) |
| `pagos` | contratoId, propiedadId, arrendatario, rutArrendatario, direccion, comuna, propiedadNombre, periodo (YYYY-MM), fecha, monto, medio, concepto, obs, numero (correlativo), *(nuevo)* archivo* (comprobante) |
| `contribuciones` | propiedadId, anio, cuota (1-4), monto, vencimiento, pagada, fechaPago, folio, *(nuevo)* archivo* (comprobante) |
| `documentos` | propiedadId, tipo, fecha, notaria, repertorio, conservador, fojas, numero, anioInsc, notas, archivo* |
| `gastos` | propiedadId, fecha, cuantia (menor/mayor), categoria, cargo (Propietario/Arrendatario), descripcion, proveedor, rutProveedor, tipoDoc, nDoc, medio, items[{desc,clase,cant,unit}], monto, notas, archivo*, *(nuevo)* responsable |
| `config/emisor` | nombre, rut, direccion, telefono, email, firmante |

Fechas: ISO `YYYY-MM-DD` (períodos `YYYY-MM`). Montos: pesos enteros; los contratos en UF guardan `canon` en UF y los pagos siempre en pesos.

## Reglas de cálculo
- **Contratado** = Σ canon de contratos vigentes (CLP y UF por separado). **Cobrado** = Σ pagos del período. **Pendiente** = contratado de contratos vigentes sin pago en el período.
- **Egresos del propietario** = gastos con `cargo ≠ "Arrendatario"` + contribuciones pagadas. Los gastos a cargo del arrendatario se muestran aparte y no se descuentan.
- El número de recibo es correlativo (`max(numero)+1`).
