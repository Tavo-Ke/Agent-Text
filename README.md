# Data Typing Reading Agent 🧠🕸️

Una extensión de navegador (MV3) de código abierto y 100% offline diseñada para diseccionar, analizar y estructurar textos usando Procesamiento de Lenguaje Natural (NLP) heurístico y modelos locales (WebLLM/Transformers.js).

## 🚀 Características Principales

*   **Extracción de Entidades (Open NER):** Identifica automáticamente conceptos clave, personas, y organizaciones usando diccionarios heurísticos y reconocimiento abierto de entidades, saltándose las stopwords en español.
*   **Grafo de Conocimiento Interactivo:** Convierte cualquier texto aburrido en un mapa de conocimiento utilizando **Cytoscape.js** (2D) y **3D Force Graph** (WebGL tridimensional).
*   **Humanizador Anti-IA:** Algoritmo heurístico que aplica "burstiness" y perplejidad léxica para reformatear textos corporativos/robóticos y hacerlos sonar orgánicos.
*   **Exportación Markdown / Obsidian:** Convierte el análisis estructural a formato Markdown (.md) con tablas taxonómicas generadas automáticamente usando **Turndown**.
*   **Inteligencia Artificial Local:** Integración con **Transformers.js** para resúmenes de texto offline y un motor **WebLLM** (WebGPU) de pantalla completa para correr modelos pesados como Llama-3 directamente en tu tarjeta gráfica.

## 🛠️ Tecnologías y Librerías (Zero-Dependency Cloud)
Toda la extensión corre offline. No requiere conexiones a APIs de terceros a menos que decidas conectar tu propia llave de OpenAI/Gemini.
- **NLP:** compromise.js
- **Grafos:** cytoscape.js (layout fCoSE), 3d-force-graph
- **Exportación:** 	urndown.js, FileSaver.js
- **Modelos Locales:** 	ransformers.js, @mlc.ai/web-llm

## 📦 Instalación

1. Clona o descarga este repositorio.
2. Abre tu navegador (Chrome, Brave, Edge) y ve a la página de extensiones (ej. chrome://extensions/).
3. Activa el **"Modo Desarrollador"** (Developer Mode).
4. Haz clic en **"Cargar descomprimida"** (Load unpacked) y selecciona la carpeta de este proyecto.
5. ¡Listo! Abre el popup en cualquier página web, selecciona texto, captúralo y comienza a analizar.

## 🤝 Contribuir
¡Las contribuciones (pull requests) son bienvenidas! Buscamos expandir las capacidades del motor de NLP para español nativo y optimizar la carga de modelos WebGPU.

## 📄 Licencia
Distribuido bajo la Licencia MIT.
