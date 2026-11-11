# Migraciones

Este rediseño **no requiere migración**: todos los campos nuevos son opcionales y no se reescribe ningún registro existente. No se cambiaron IDs ni nombres de campos.

Si en el futuro se necesita cambiar el esquema: escribir un script idempotente, probarlo primero contra el Firebase simulado (`tests/`) y documentarlo aquí con fecha, alcance y cómo revertirlo.
