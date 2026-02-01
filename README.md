# Screaming Frog Automation

## Descripción
Aplicación Electron que automatiza el flujo de trabajo de Screaming Frog SEO Spider sin necesidad de abrir la aplicación manualmente. Permite lanzar rastreos web o abrir archivos .seospider, extraer datos a carpetas locales, procesar archivos, generar informes PDF de resumen y comparar rastreos. También soporta programación de rastreos con gestión completa.

## Stack tecnológico
- **Runtime:** Electron
- **Frontend:** Vanilla JS (sin framework)
- **Datos entrada:** Excel (archivos Internal:All de Screaming Frog)
- **Datos salida:** Archivos procesados + PDFs (informe y comparación)
- **Dependencias clave:** ExcelJS, pdfkit, node-schedule

## Funcionalidades actuales

### Rastreo
- Lanzar rastreos de sitios web via Screaming Frog CLI
- Abrir archivos .seospider existentes
- Adjuntar archivo de configuración SF (.seospiderconfig)

### Exportaciones
- Todas las opciones de Export Tabs de Screaming Frog (Internal, External, Security, etc.)
- Todas las opciones de Bulk Exports (All Links, All Images, etc.)
- Interfaz de acordeón con grupos colapsables
- Botones de selección rápida: Todos, Ninguno, Principales

### Procesados
- **Análisis de URLs Internas:** Genera Excel categorizado por tipos y PDF de resumen
- **Comparación de rastreos:** Compara con el rastreo anterior del mismo dominio

### Comparación de rastreos
Detecta cambios entre el rastreo actual y el anterior comparando 15 campos por URL:
- Status Code, Indexability, Indexability Status
- Title 1, Meta Description 1
- H1-1, H1-2
- Meta Robots 1, Canonical Link Element 1
- Size (bytes), Word Count, Crawl Depth
- Redirect URL, Redirect Type
- Rich Results Types

Genera un PDF con:
- Resumen ejecutivo (totales y contadores)
- URLs nuevas (añadidas)
- URLs eliminadas
- URLs con cambios (detalle campo por campo)

### Programación
- Programar rastreos para ejecución automática
- Frecuencias: Una vez, Diario, Semanal, Mensual
- Nombre personalizable para cada tarea
- Gestión en pestaña dedicada "Programados"
- Edición de frecuencia en caliente
- Modal de detalles completos
- Eliminación automática de tareas "una vez" tras ejecutarse

### Configuración
- Ruta del ejecutable de Screaming Frog CLI
- Carpeta de salida para resultados
- Carpeta de configuraciones
- Carpeta temporal

## Estructura del proyecto

```
screaming-frog-automation/
├── main.js                          # Entry point Electron
├── ui/
│   ├── index.html                   # Interfaz principal
│   └── styles/main.css              # Estilos
├── src/
│   ├── renderer/
│   │   └── app.js                   # Lógica del frontend
│   └── main/
│       ├── constants/
│       │   ├── config.js            # Configuración por defecto
│       │   └── exportOptions.js     # Opciones de exportación SF
│       ├── services/
│       │   ├── ConfigService.js     # Gestión de configuración
│       │   ├── ScreamingFrogService.js  # Ejecución de SF
│       │   └── SchedulerService.js  # Programación de tareas
│       ├── processors/
│       │   ├── InternalUrlProcessor.js   # Análisis de URLs
│       │   ├── PDFGenerator.js           # PDF de informe
│       │   ├── ComparisonProcessor.js    # Comparación de rastreos
│       │   └── ComparisonPDFGenerator.js # PDF de comparación
│       ├── utils/
│       │   ├── PathManager.js       # Gestión de rutas
│       │   ├── CommandBuilder.js    # Construcción de comandos CLI
│       │   └── Logger.js            # Sistema de logging
│       └── ipc/
│           └── handlers/            # Manejadores IPC
│               ├── CrawlHandlers.js
│               ├── ConfigHandlers.js
│               ├── FileHandlers.js
│               └── ScheduleHandlers.js
└── package.json
```

## Comandos de desarrollo
- `npm start` — Ejecutar la aplicación
- `npm install` — Instalar dependencias

## Convenciones
- Las carpetas de salida se nombran: `dominio_YYYYMMDD_HHMMSS`
- Los PDFs se nombran: `{baseName}_informe.pdf` y `{baseName}_comparison.pdf`
- Comparación por URL exacta (case-insensitive)

## Notas importantes
- La aplicación interactúa con Screaming Frog SEO Spider como herramienta externa, no la reemplaza
- Requiere licencia de Screaming Frog con acceso a CLI
- El proyecto está pensado para crecer: nueva funcionalidad debe integrarse de forma modular
- Desarrollo nativo en Windows, sin WSL ni entornos Linux

## Funcionalidades planificadas
- Posibles alternativas a Excel para la entrada de datos
- Exportación de comparaciones a Excel
