---
name: notas-obsidian
description: Usar al terminar una tarea, fase o decisión, o cuando cambia algo del negocio, para mantener al día el vault de Obsidian en docs/ (bitácora, decisiones, preguntas abiertas, roadmap).
---
# Mantener el vault de Obsidian (`docs/`)

`docs/` es un vault de Obsidian y la memoria del proyecto. Max lo lee y edita desde Obsidian; vos lo leés y editás desde acá. Lo que no quede escrito ahí se pierde entre sesiones.

## Formato
- Markdown de Obsidian: frontmatter YAML (`tags`, y `estado`/`actualizado` si aplica), links internos `[[Nombre de nota]]` sin extensión, callouts `> [!warning]`, tareas `- [ ]`.
- Nombres de archivo con el número de orden existente; notas nuevas sin número van en subcarpetas (`Bitácora/`, `Prompts/`).
- No renombres ni muevas notas existentes: rompe los links.
- Si existe la skill `obsidian-markdown` (kepano), seguila para sintaxis avanzada.

## Qué actualizar y cuándo
| Pasó esto | Actualizá |
|---|---|
| Terminaste una tarea del roadmap | Tildá `- [x]` en `08 Roadmap por fases.md` |
| Cerraste una sesión de trabajo | Creá/sumá a `Bitácora/AAAA-MM-DD.md`: qué se hizo, archivos clave, qué falta (máx. 10 líneas) |
| Tomaste una decisión de arquitectura | Entrada nueva en `09 Decisiones.md` (fecha · decisión · por qué · descartado) |
| Encontraste algo sin definir | `10 Preguntas abiertas.md` |
| Max respondió una pregunta abierta | Tildala ahí y actualizá la nota de reglas/datos correspondiente, sacando el `[A CONFIRMAR]` |
| Cambió el modelo de datos | `05 Modelo de datos.md` en el mismo cambio que la migración |
| Plan de Superpowers aprobado | Guardalo también como `Planes/Fase N.md` con link desde el roadmap |

## Reglas
- Escribí corto y en español rioplatense; es para leer rápido.
- Nunca pongas secretos, tokens ni datos de clientes reales en las notas.
- Actualizá `actualizado:` del frontmatter de `00 Inicio.md` y su sección "Estado actual" al cerrar una fase.
