/**
 * DATA TYPING READING AGENT — popup.js v1.2
 * + Cytoscape.js Knowledge Graph integration
 * + Rich HTML syntax-colored output renderer
 * ================================================================
 */

"use strict";

// ─── RICH HTML OUTPUT RENDERER ───────────────────────────────────────────────
// Converts plain-text structured output into syntax-highlighted HTML

const OutputRenderer = {

  /** Escape HTML special chars */
  _esc(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  /**
   * Colorize a single line of the structured output
   * Uses regex to detect output patterns and wraps them in span.o-*
   */
  _colorizeLine(raw) {
    const e = this._esc(raw);

    // ── Box borders (╔ ╚ ║)
    if (/^[╔╚╠╗╝╣║─═]/.test(e)) {
      return `<span class="o-header">${e}</span>`;
    }

    // ── Level headers (▌ NIVEL...)
    if (/^▌/.test(e)) {
      return e.replace(
        /^(▌)(\s*)(NIVEL\s*\d+[^·]*)([·—].+)?$/,
        (_, bullet, sp, level, rest) =>
          `<span class="o-arrow">${bullet}</span>${sp}` +
          `<span class="o-level">${level}</span>` +
          (rest ? `<span class="o-dim">${rest}</span>` : "")
      );
    }

    // ── Separator lines of dashes
    if (/^─{10,}/.test(e)) {
      return `<span class="o-sep">${e}</span>`;
    }

    // ── Relation lines («X» ──[label]──▶ «Y»)
    if (/«.+»/.test(e) && /──/.test(e)) {
      return e
        .replace(/«([^»]+)»/g, `<span class="o-quote">«<span class="o-entity">$1</span>»</span>`)
        .replace(/\[([^\]]+)\]/g, `<span class="o-bracket">[<span class="o-tag">$1</span>]</span>`)
        .replace(/(──▶|──|▶)/g, `<span class="o-arrow">$1</span>`);
    }

    // ── Section propositions (§ N.)
    if (/^\s*§/.test(e)) {
      let line = e
        .replace(/^(\s*)(§\s*\d+\.?)/, `$1<span class="o-num">$2</span>`)
        .replace(/\[([^\]]+)\]/g, `<span class="o-bracket">[<span class="o-tag">$1</span>]</span>`);
      return line;
    }

    // ── Continuation lines (↳)
    if (/^\s*↳/.test(e)) {
      return e
        .replace(/^(\s*)(↳)/, `$1<span class="o-arrow">$2</span>`)
        .replace(/\[([^\]]+)\]/g, `<span class="o-bracket">[<span class="o-tag">$1</span>]</span>`);
    }

    // ── Category group headers ([TAG])
    if (/^\s*\[.+\]\s*$/.test(e)) {
      return e.replace(/\[([^\]]+)\]/g,
        `<span class="o-bracket">[<span class="o-level">$1</span>]</span>`);
    }

    // ── Entity list lines (indented with «»)
    if (/«/.test(e)) {
      return e.replace(/«([^»]+)»/g,
        `<span class="o-quote">«<span class="o-entity">$1</span>»</span>`);
    }

    // ── Index lines (• term ..... [tag])
    if (/^\s*•/.test(e)) {
      return e
        .replace(/^(\s*•)/, `$1`)
        .replace(/\[([^\]]+)\]/, `<span class="o-bracket">[<span class="o-tag">$1</span>]</span>`);
    }

    // ── Meta lines (Dominio :, Entidades :, Motor :)
    if (/^\s*(Dominio|Entidades|Relaciones|Motor|Bloques)\s*[:\·]/.test(e)) {
      return e.replace(
        /^(\s*)([\w]+\s*)([:\·])(.+)$/,
        `$1<span class="o-dim">$2$3</span><span class="o-meta">$4</span>`
      );
    }

    // Default
    return `<span class="o-dim">${e}</span>`;
  },

  /**
   * Convert full plain-text output → HTML with syntax classes
   */
  toHTML(text) {
    const lines = text.split("\n");
    return lines
      .map(line => `<span class="o-line">${this._colorizeLine(line)}</span>`)
      .join("\n");
  },
};

// ─── STORAGE KEYS ────────────────────────────────────────────────────────────

const STORAGE_KEYS = { API_KEY: "dta_api_key", ENGINE: "dta_engine", DOMAIN: "dta_domain" };

// ─── SEMANTIC CATEGORY → COLOR MAP (Cytoscape nodes) ─────────────────────────

const CATEGORY_COLORS = {
  "disciplina":                    "#2d7dd2",
  "sistema":                       "#34c77b",
  "variable macroecon.":           "#f4a418",
  "variable econ.":                "#f4a418",
  "variable":                      "#f4a418",
  "indicador nacion.":             "#e8a030",
  "indicador laboral":             "#e8a030",
  "ente regulador":                "#9b59b6",
  "actor institucional":           "#9b59b6",
  "actor organizacional":          "#9b59b6",
  "agente econ.":                  "#c0392b",
  "agente comunicativo":           "#c0392b",
  "instrumento macro.":            "#1abc9c",
  "instrumento gerencial":         "#1abc9c",
  "instrumento regulatorio":       "#1abc9c",
  "instrumento financiero":        "#1abc9c",
  "instrumento legal":             "#1abc9c",
  "factor productivo":             "#e74c3c",
  "fuerza de mercado":             "#27ae60",
  "estructura mercado":            "#27ae60",
  "estructura org.":               "#27ae60",
  "flujo monetario":               "#f39c12",
  "flujo comercial":               "#f39c12",
  "objetivo econ.":                "#3498db",
  "objetivo":                      "#3498db",
  "proceso":                       "#1abc9c",
  "marco conceptual":              "#8e44ad",
  "entidad organizacional":        "#e74c3c",
  "colectivo social":              "#2ecc71",
  "recurso":                       "#95a5a6",
  "resultado":                     "#f1c40f",
  "situación crítica":             "#e74c3c",
  "mecanismo de acción":           "#3498db",
  "entorno":                       "#7f8c8d",
  "principio":                     "#8e44ad",
  "tecnología cognitiva":          "#00bcd4",
  "insumo informacional":          "#009688",
  "artefacto digital":             "#26c6da",
  "ecosistema digital":            "#00acc1",
  "control de seguridad":          "#e53935",
  "inst. monetario":               "#ff9800",
  "fenómeno global":               "#607d8b",
  "fenómeno mediático":            "#607d8b",
  "práctica discursiva":           "#795548",
  "vehículo comunicativo":         "#546e7a",
  "unidad de contenido":           "#78909c",
  "sistema sígnico":               "#8d6e63",
  "mecanismo regulador":           "#7cb342",
  "factor perturbador":            "#e53935",
  "estrategia persuasiva":         "#f06292",
  "construcción discursiva":       "#ab47bc",
  "institución mediática":         "#5c6bc0",
  "concepto estratégico":          "#42a5f5",
  "concepto micro.":               "#29b6f6",
  "competencia directiva":         "#26a69a",
  "proceso cognitivo":             "#7e57c2",
  "activo intangible":             "#66bb6a",
  "métrica de desempeño":          "#ffca28",
  "unidad operativa":              "#ffa726",
  "motor competitivo":             "#ef5350",
  "herramienta control":           "#26c6da",
  "dimensión cultural":            "#ec407a",
  "fundamento org.":               "#5c6bc0",
  "acto jurídico":                 "#ff7043",
  "sujeto jurídico":               "#789262",
  "órgano judicial":               "#8d6e63",
  "derecho subjetivo":             "#ef9a9a",
  "sistema normativo":             "#7986cb",
  "ciclo econ.":                   "#e67e22",
  "estructura de mercado":         "#27ae60",
  "inst. monetario":               "#ff9800",
};

function categoryColor(tag) {
  return CATEGORY_COLORS[tag.toLowerCase()] || "#7a8ba0";
}

// ─── DOMAIN ONTOLOGY ─────────────────────────────────────────────────────────

const DOMAIN_ONTOLOGY = [
  // ECONOMÍA
  { rx: /\b(econom[íi]a|macroeconom[íi]a|microeconom[íi]a|econometr[íi]a)\b/i,   tag: "disciplina",            p:10, d:["economics","auto"] },
  { rx: /\b(mercado|mercados|market)\b/i,                                          tag: "sistema",               p: 9, d:["economics","auto"] },
  { rx: /\b(inflaci[oó]n|deflaci[oó]n|estanflaci[oó]n)\b/i,                       tag: "variable macroecon.",   p: 9, d:["economics","auto"] },
  { rx: /\b(PIB|PBI|producto interno bruto|GDP)\b/i,                               tag: "indicador nacion.",     p: 9, d:["economics","auto"] },
  { rx: /\b(desempleo|tasa de desempleo|pleno empleo)\b/i,                         tag: "indicador laboral",     p: 8, d:["economics","auto"] },
  { rx: /\b(capital|capital humano|capital f[íi]sico|capital social)\b/i,          tag: "factor productivo",     p: 8, d:["economics","auto"] },
  { rx: /\b(oferta|demanda|equilibrio de mercado)\b/i,                             tag: "fuerza de mercado",     p: 8, d:["economics","auto"] },
  { rx: /\b(precio|precios|nivel de precios)\b/i,                                  tag: "variable econ.",        p: 7, d:["economics","auto"] },
  { rx: /\b(inversi[oó]n|inversor|inversionista)\b/i,                              tag: "agente econ.",          p: 7, d:["economics","auto"] },
  { rx: /\b(banco central|reserva federal|BCE|Fed)\b/i,                            tag: "ente regulador",        p: 9, d:["economics","auto"] },
  { rx: /\b(pol[íi]tica fiscal|pol[íi]tica monetaria)\b/i,                         tag: "instrumento macro.",    p: 9, d:["economics","auto"] },
  { rx: /\b(gasto p[úu]blico|presupuesto|d[éeè]ficit fiscal)\b/i,                  tag: "variable fiscal",       p: 8, d:["economics","auto"] },
  { rx: /\b(exportaci[oó]n|importaci[oó]n|balanza comercial)\b/i,                  tag: "flujo comercial",       p: 8, d:["economics","auto"] },
  { rx: /\b(globalizaci[oó]n|libre comercio|proteccionismo)\b/i,                   tag: "fenómeno global",       p: 7, d:["economics","auto"] },
  { rx: /\b(monopolio|oligopolio|competencia perfecta)\b/i,                        tag: "estructura mercado",    p: 8, d:["economics","auto"] },
  { rx: /\b(utilidad|utilidad marginal|curva de indiferencia)\b/i,                 tag: "concepto micro.",       p: 8, d:["economics","auto"] },
  { rx: /\b(renta|ingreso|ingreso nacional)\b/i,                                   tag: "flujo monetario",       p: 7, d:["economics","auto"] },
  { rx: /\b(crisis econ[oó]mica|recesi[oó]n|depresi[oó]n)\b/i,                    tag: "ciclo econ.",           p: 9, d:["economics","auto"] },
  { rx: /\b(crecimiento econ[oó]mico|desarrollo)\b/i,                              tag: "objetivo econ.",        p: 8, d:["economics","auto"] },
  { rx: /\b(tipo de cambio|divisa|moneda)\b/i,                                     tag: "inst. monetario",       p: 8, d:["economics","auto"] },

  // ADMINISTRACIÓN
  { rx: /\b(administraci[oó]n|gesti[oó]n empresarial|management)\b/i,             tag: "disciplina",            p:10, d:["management","auto"] },
  { rx: /\b(estrategia|planeaci[oó]n estrat[eé]gica|plan estrat[eé]gico)\b/i,     tag: "instrumento gerencial", p: 9, d:["management","auto"] },
  { rx: /\b(misi[oó]n|visi[oó]n|valores organizacionales)\b/i,                    tag: "fundamento org.",       p: 9, d:["management","auto"] },
  { rx: /\b(organigrama|estructura organizacional|jerarqu[íi]a)\b/i,              tag: "estructura org.",       p: 8, d:["management","auto"] },
  { rx: /\b(liderazgo|l[íi]der|estilo de liderazgo)\b/i,                          tag: "competencia directiva", p: 8, d:["management","auto"] },
  { rx: /\b(toma de decisiones|proceso decisional)\b/i,                           tag: "proceso cognitivo",     p: 8, d:["management","auto"] },
  { rx: /\b(recurso humano|talento humano|RRHH|HR)\b/i,                           tag: "activo intangible",     p: 8, d:["management","auto"] },
  { rx: /\b(productividad|eficiencia|eficacia)\b/i,                               tag: "métrica de desempeño",  p: 8, d:["management","auto"] },
  { rx: /\b(proceso|procesos|gesti[oó]n por procesos)\b/i,                        tag: "unidad operativa",      p: 7, d:["management","auto"] },
  { rx: /\b(innovaci[oó]n|I\+D|investigaci[oó]n y desarrollo)\b/i,                tag: "motor competitivo",     p: 8, d:["management","auto"] },
  { rx: /\b(KPI|indicador clave|balanced scorecard|cuadro de mando)\b/i,          tag: "herramienta control",   p: 9, d:["management","auto"] },
  { rx: /\b(cultura organizacional|cultura corporativa|clima org\.?)\b/i,         tag: "dimensión cultural",    p: 8, d:["management","auto"] },
  { rx: /\b(cad[eé]na de valor|ventaja competitiva|posicionamiento)\b/i,          tag: "concepto estratégico",  p: 9, d:["management","auto"] },
  { rx: /\b(stakeholder|parte interesada|accionista)\b/i,                         tag: "actor organizacional",  p: 8, d:["management","auto"] },
  { rx: /\b(marketing|mercadotecnia|mezcla de marketing|4P)\b/i,                  tag: "función de negocio",    p: 8, d:["management","auto"] },
  { rx: /\b(presupuesto|control presupuestal|forecast)\b/i,                       tag: "instrumento financiero",p: 8, d:["management","auto"] },
  { rx: /\b(riesgo|gesti[oó]n del riesgo|risk management)\b/i,                   tag: "variable",              p: 8, d:["management","auto"] },
  { rx: /\b(proyecto|gesti[oó]n de proyectos|PMO|scrum|agile)\b/i,               tag: "unidad operativa",      p: 8, d:["management","auto"] },
  { rx: /\b(calidad|control de calidad|ISO|six sigma|lean)\b/i,                   tag: "estándar operativo",    p: 8, d:["management","auto"] },

  // COMUNICACIÓN
  { rx: /\b(comunicaci[oó]n|teor[íi]a de la comunicaci[oó]n)\b/i,                tag: "disciplina",            p:10, d:["communication","auto"] },
  { rx: /\b(emisor|receptor|destinatario|interlocutor)\b/i,                       tag: "agente comunicativo",   p: 9, d:["communication","auto"] },
  { rx: /\b(mensaje|contenido comunicativo|informaci[oó]n)\b/i,                   tag: "unidad de contenido",   p: 8, d:["communication","auto"] },
  { rx: /\b(canal|medio de comunicaci[oó]n|soporte)\b/i,                          tag: "vehículo comunicativo", p: 8, d:["communication","auto"] },
  { rx: /\b(retroalimentaci[oó]n|feedback|respuesta)\b/i,                         tag: "mecanismo regulador",   p: 8, d:["communication","auto"] },
  { rx: /\b(ruido|interferencia|barrera comunicativa)\b/i,                        tag: "factor perturbador",    p: 8, d:["communication","auto"] },
  { rx: /\b(c[oó]digo|lenguaje|idioma|se[ñn]al)\b/i,                              tag: "sistema sígnico",       p: 8, d:["communication","auto"] },
  { rx: /\b(discurso|ret[oó]rica|argumentaci[oó]n)\b/i,                           tag: "práctica discursiva",   p: 8, d:["communication","auto"] },
  { rx: /\b(opini[oó]n p[úu]blica|agenda setting|framing)\b/i,                    tag: "fenómeno mediático",    p: 9, d:["communication","auto"] },
  { rx: /\b(periodismo|medio de comunicaci[oó]n|prensa|mass media)\b/i,           tag: "institución mediática", p: 8, d:["communication","auto"] },
  { rx: /\b(redes sociales|social media|plataforma digital)\b/i,                  tag: "ecosistema digital",    p: 8, d:["communication","auto"] },
  { rx: /\b(propaganda|publicidad|spot|campa[ñn]a)\b/i,                           tag: "estrategia persuasiva", p: 8, d:["communication","auto"] },
  { rx: /\b(narrativa|relato|storytelling)\b/i,                                   tag: "construcción discursiva",p:8, d:["communication","auto"] },

  // DERECHO
  { rx: /\b(derecho|norma jur[íi]dica|ordenamiento legal)\b/i,                    tag: "sistema normativo",     p:10, d:["law","auto"] },
  { rx: /\b(ley|legislaci[oó]n|decreto|reglamento|c[oó]digo)\b/i,                 tag: "instrumento legal",     p: 9, d:["law","auto"] },
  { rx: /\b(contrato|acuerdo|convenio|tratado)\b/i,                               tag: "acto jurídico",         p: 8, d:["law","auto"] },
  { rx: /\b(sujeto de derecho|persona jur[íi]dica|persona natural)\b/i,           tag: "sujeto jurídico",       p: 8, d:["law","auto"] },
  { rx: /\b(jurisdicci[oó]n|tribunal|corte|juzgado)\b/i,                          tag: "órgano judicial",       p: 9, d:["law","auto"] },
  { rx: /\b(derechos fundamentales|derechos humanos|garant[íi]as)\b/i,            tag: "derecho subjetivo",     p: 9, d:["law","auto"] },

  // TECNOLOGÍA
  { rx: /\b(algoritmo|inteligencia artificial|machine learning|IA|AI)\b/i,        tag: "tecnología cognitiva",  p:10, d:["tech","auto"] },
  { rx: /\b(dato|datos|dataset|big data|base de datos)\b/i,                       tag: "insumo informacional",  p: 9, d:["tech","auto"] },
  { rx: /\b(software|aplicaci[oó]n|sistema|plataforma)\b/i,                       tag: "artefacto digital",     p: 8, d:["tech","auto"] },
  { rx: /\b(red|infraestructura|servidor|nube|cloud)\b/i,                         tag: "infraestructura TI",    p: 8, d:["tech","auto"] },
  { rx: /\b(usuario|interfaz|UX|experiencia de usuario)\b/i,                      tag: "actor digital",         p: 8, d:["tech","auto"] },
  { rx: /\b(ciberseguridad|privacidad|encriptaci[oó]n)\b/i,                       tag: "control de seguridad",  p: 8, d:["tech","auto"] },

  // TRANSVERSALES
  { rx: /\b(estado|gobierno|sector p[úu]blico|autoridad)\b/i,                     tag: "actor institucional",   p: 7, d:["auto","economics","management","law"] },
  { rx: /\b(empresa|corporaci[oó]n|firma|compan[íi]a|organizaci[oó]n)\b/i,        tag: "entidad organizacional",p: 7, d:["auto","management","economics"] },
  { rx: /\b(sociedad|comunidad|ciudadan[íi]a|pueblo)\b/i,                         tag: "colectivo social",      p: 7, d:["auto"] },
  { rx: /\b(sistema|subsistema|estructura)\b/i,                                   tag: "sistema",               p: 5, d:["auto"] },
  { rx: /\b(proceso|procedimiento|protocolo|metodolog[íi]a)\b/i,                  tag: "proceso",               p: 5, d:["auto"] },
  { rx: /\b(modelo|paradigma|enfoque|teor[íi]a|marco te[oó]rico)\b/i,             tag: "marco conceptual",      p: 6, d:["auto"] },
  { rx: /\b(factor|variable|par[áa]metro|indicador)\b/i,                          tag: "variable",              p: 5, d:["auto"] },
  { rx: /\b(objetivo|meta|fin|prop[oó]sito)\b/i,                                  tag: "objetivo",              p: 5, d:["auto"] },
  { rx: /\b(recurso|bien|activo|insumo)\b/i,                                      tag: "recurso",               p: 5, d:["auto"] },
  { rx: /\b(pol[íi]tica|normativa|lineamiento|directriz)\b/i,                     tag: "instrumento regulatorio",p:6, d:["auto"] },
  { rx: /\b(resultado|impacto|efecto|consecuencia)\b/i,                           tag: "resultado",             p: 5, d:["auto"] },
  { rx: /\b(crisis|problema|desaf[íi]o|reto|brecha)\b/i,                          tag: "situación crítica",     p: 6, d:["auto"] },
  { rx: /\b(acci[oó]n|medida|intervenci[oó]n|mecanismo)\b/i,                      tag: "mecanismo de acción",   p: 5, d:["auto"] },
  { rx: /\b(contexto|entorno|ambiente|ecosistema)\b/i,                            tag: "entorno",               p: 5, d:["auto"] },
  { rx: /\b(principio|fundamento|pilar|base te[oó]rica)\b/i,                      tag: "principio",             p: 6, d:["auto"] },
];

// ─── RELATION PATTERNS (structured) ──────────────────────────────────────────
// Each yields { source, label, target } or null

const RELATION_PATTERNS = [
  {
    cond: t => t.includes("variable macroecon.") && t.includes("ente regulador"),
    rel:  e => ({ source: byTag(e,"variable macroecon."), label: "regulada por",   target: byTag(e,"ente regulador") }),
  },
  {
    cond: t => t.includes("instrumento macro.") && t.includes("variable econ."),
    rel:  e => ({ source: byTag(e,"instrumento macro."),  label: "incide en",      target: byTag(e,"variable econ.") }),
  },
  {
    cond: t => t.includes("instrumento macro.") && t.includes("variable macroecon."),
    rel:  e => ({ source: byTag(e,"instrumento macro."),  label: "controla",       target: byTag(e,"variable macroecon.") }),
  },
  {
    cond: t => t.includes("disciplina") && t.includes("sistema"),
    rel:  e => ({ source: byTag(e,"disciplina"),          label: "estudia",        target: byTag(e,"sistema") }),
  },
  {
    cond: t => t.includes("disciplina") && t.includes("variable macroecon."),
    rel:  e => ({ source: byTag(e,"disciplina"),          label: "analiza",        target: byTag(e,"variable macroecon.") }),
  },
  {
    cond: t => t.includes("instrumento gerencial") && t.includes("entidad organizacional"),
    rel:  e => ({ source: byTag(e,"entidad organizacional"), label: "aplica",      target: byTag(e,"instrumento gerencial") }),
  },
  {
    cond: t => t.includes("instrumento gerencial") && t.includes("objetivo"),
    rel:  e => ({ source: byTag(e,"instrumento gerencial"), label: "orienta hacia",target: byTag(e,"objetivo") }),
  },
  {
    cond: t => t.includes("agente comunicativo") && t.includes("unidad de contenido"),
    rel:  e => ({ source: byTag(e,"agente comunicativo"), label: "emite",          target: byTag(e,"unidad de contenido") }),
  },
  {
    cond: t => t.includes("unidad de contenido") && t.includes("vehículo comunicativo"),
    rel:  e => ({ source: byTag(e,"unidad de contenido"), label: "circula por",   target: byTag(e,"vehículo comunicativo") }),
  },
  {
    cond: t => t.includes("factor perturbador") && t.includes("unidad de contenido"),
    rel:  e => ({ source: byTag(e,"factor perturbador"), label: "distorsiona",    target: byTag(e,"unidad de contenido") }),
  },
  {
    cond: t => t.includes("mecanismo regulador") && t.includes("agente comunicativo"),
    rel:  e => ({ source: byTag(e,"agente comunicativo"), label: "genera",        target: byTag(e,"mecanismo regulador") }),
  },
  {
    cond: t => t.includes("recurso") && t.includes("proceso"),
    rel:  e => ({ source: byTag(e,"recurso"),             label: "es insumo de",  target: byTag(e,"proceso") }),
  },
  {
    cond: t => t.includes("proceso") && t.includes("resultado"),
    rel:  e => ({ source: byTag(e,"proceso"),             label: "produce",       target: byTag(e,"resultado") }),
  },
  {
    cond: t => t.includes("objetivo") && t.includes("instrumento regulatorio"),
    rel:  e => ({ source: byTag(e,"instrumento regulatorio"), label: "orienta",   target: byTag(e,"objetivo") }),
  },
  {
    cond: t => t.includes("situación crítica") && t.includes("mecanismo de acción"),
    rel:  e => ({ source: byTag(e,"situación crítica"),   label: "activa",        target: byTag(e,"mecanismo de acción") }),
  },
  {
    cond: t => t.includes("mecanismo de acción") && t.includes("resultado"),
    rel:  e => ({ source: byTag(e,"mecanismo de acción"), label: "genera",        target: byTag(e,"resultado") }),
  },
  {
    cond: t => t.includes("actor institucional") && t.includes("sistema normativo"),
    rel:  e => ({ source: byTag(e,"actor institucional"), label: "opera en",      target: byTag(e,"sistema normativo") }),
  },
  {
    cond: t => t.includes("actor institucional") && t.includes("instrumento legal"),
    rel:  e => ({ source: byTag(e,"actor institucional"), label: "emite",         target: byTag(e,"instrumento legal") }),
  },
  {
    cond: t => t.includes("tecnología cognitiva") && t.includes("insumo informacional"),
    rel:  e => ({ source: byTag(e,"insumo informacional"), label: "es procesado por", target: byTag(e,"tecnología cognitiva") }),
  },
  {
    cond: t => t.includes("tecnología cognitiva") && t.includes("resultado"),
    rel:  e => ({ source: byTag(e,"tecnología cognitiva"), label: "genera",       target: byTag(e,"resultado") }),
  },
  {
    cond: t => t.includes("fuerza de mercado") && t.includes("variable econ."),
    rel:  e => ({ source: byTag(e,"fuerza de mercado"),   label: "determina",     target: byTag(e,"variable econ.") }),
  },
  {
    cond: t => t.includes("fuerza de mercado") && t.includes("sistema"),
    rel:  e => ({ source: byTag(e,"fuerza de mercado"),   label: "equilibra",     target: byTag(e,"sistema") }),
  },
  {
    cond: t => t.includes("ente regulador") && t.includes("instrumento macro."),
    rel:  e => ({ source: byTag(e,"ente regulador"),      label: "utiliza",       target: byTag(e,"instrumento macro.") }),
  },
  {
    cond: t => t.includes("entidad organizacional") && t.includes("objetivo"),
    rel:  e => ({ source: byTag(e,"entidad organizacional"), label: "persigue",   target: byTag(e,"objetivo") }),
  },
  {
    cond: t => t.includes("activo intangible") && t.includes("motor competitivo"),
    rel:  e => ({ source: byTag(e,"activo intangible"),   label: "impulsa",       target: byTag(e,"motor competitivo") }),
  },
  {
    cond: t => t.includes("marco conceptual") && t.includes("disciplina"),
    rel:  e => ({ source: byTag(e,"disciplina"),          label: "fundamenta en", target: byTag(e,"marco conceptual") }),
  },
  {
    cond: t => t.includes("ciclo econ.") && t.includes("variable macroecon."),
    rel:  e => ({ source: byTag(e,"ciclo econ."),         label: "afecta",        target: byTag(e,"variable macroecon.") }),
  },
  {
    cond: t => t.includes("flujo comercial") && t.includes("sistema"),
    rel:  e => ({ source: byTag(e,"sistema"),             label: "genera",        target: byTag(e,"flujo comercial") }),
  },
  {
    cond: t => t.includes("fenómeno mediático") && t.includes("institución mediática"),
    rel:  e => ({ source: byTag(e,"institución mediática"), label: "produce",     target: byTag(e,"fenómeno mediático") }),
  },
  {
    cond: t => t.includes("estrategia persuasiva") && t.includes("colectivo social"),
    rel:  e => ({ source: byTag(e,"estrategia persuasiva"), label: "influye en",  target: byTag(e,"colectivo social") }),
  },
];

function byTag(entities, tag) {
  return entities.find(e => e.tag.toLowerCase() === tag.toLowerCase())?.term || null;
}

// ─── MODULE 1: DOMAIN DETECTOR ───────────────────────────────────────────────
// Scores the text against each domain and picks the most likely one

const DomainDetector = {
  DOMAIN_SIGNALS: {
    economics:     [/\beconom[íi]/i, /\bmercado/i, /\binflaci[oó]/i, /\bPIB\b|\bGDP\b/i, /\bfiscal/i, /\bmonetari/i, /\bprecio/i, /\boferta/i, /\bdemanda/i, /\bbanco central/i, /\brecesi[oó]/i, /\binversi[oó]/i, /\bdivisa/i, /\bcrecimiento econ/i, /\bingresos/i, /\brentabilidad/i, /\bfinancier/i],
    management:    [/\bestrategia/i, /\bliderazgo/i, /\borganizaci[oó]/i, /\bgesti[oó]n/i, /\badministraci[oó]/i, /\bKPI\b/i, /\brecurso humano/i, /\btalento/i, /\binnovaci[oó]/i, /\bproceso/i, /\bmisi[oó]n|\bvisi[oó]n/i, /\bstakeholder/i, /\bproductividad/i, /\bnegocio/i, /\bempresa/i],
    communication: [/\bcomunicaci[oó]/i, /\bemisora?|\breceptora?/i, /\bmensaje/i, /\bcanal/i, /\bfeedback|\bretroalimentaci[oó]/i, /\bdiscurso/i, /\bnarrativa/i, /\bprensa|\bperiodismo/i, /\bredes sociales/i, /\bopini[oó]n p[úu]blica/i],
    law:           [/\bderecho/i, /\bley|\blegislaci[oó]/i, /\bcontrato/i, /\bjurisdicci[oó]/i, /\btribunal/i, /\bnorma jur[íi]/i, /\bconstituci[oó]/i, /\breglamento/i],
    tech:          [/\balgoritmo/i, /\binteligencia artificial|\bIA\b|\bAI\b/i, /\bdatos|\bdataset/i, /\bsoftware/i, /\bplataforma digital/i, /\bciberseguridad/i, /\bnube|\bcloud/i, /\bmachine learning/i, /\binfraestructura/i],
  },

  detect(text) {
    const scores = {};
    for (const [domain, signals] of Object.entries(this.DOMAIN_SIGNALS)) {
      scores[domain] = signals.reduce((acc, rx) => {
        const matches = (text.match(new RegExp(rx.source, "gi")) || []).length;
        return acc + matches;
      }, 0);
    }
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    // Only override "auto" if there's a clear winner (score ≥ 2)
    return best[0][1] >= 2 ? best[0][0] : "auto";
  },
};

// ─── MODULE 2: ENTITY EXTRACTOR (TF-IDF + Frequency Boost + N-gram priority) ─

const EntityExtractor = {

  STOPWORDS: new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "lo", "al", "del",
    "y", "e", "o", "u", "ni", "que", "si", "pero", "aunque",
    "a", "ante", "bajo", "cabe", "con", "contra", "de", "desde", "en", "entre", "hacia", "hasta", "para", "por", "según", "sin", "so", "sobre", "tras",
    "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas", "aquel", "aquella", "aquellos", "aquellas",
    "mi", "tu", "su", "nuestro", "vuestro",
    "como", "más", "menos", "muy", "mucho", "poco", "todo", "nada", "también", "además",
    "es", "son", "fue", "fueron", "ser", "estar", "tiene", "tienen", "ha", "han", "había"
  ]),

  /**
   * Terms that commonly produce false positives.
   * Maps normalized-lowercase term → minimum required context clues (regex).
   * If the context clue is absent from the full text, the entity is rejected.
   */
  CONTEXT_GUARDS: {
    // "visión" only valid as org concept when paired with org/strategy words
    "visión":    /\b(organizacion|estrateg|misi[oó]n|corporat|empresa|gerencia)/i,
    // "ia" acronym: only valid when text has explicit AI/technology terms nearby
    "ia":        /\b(inteligencia artificial|machine learning|algoritmo|chat|robot|automatiz)/i,
    // "problema" valid but too generic; require economic/management context
    "problema":  /\b(econ[oó]mic|gesti[oó]n|administra|crisis|fiscal|mercado)/i,
    // "proceso" requires operational context
    "proceso":   /\b(productiv|operaci[oó]n|gesti[oó]n|administra|calidad|manufactura)/i,
    // "sistema" requires structural context
    "sistema":   /\b(econ[oó]mic|financier|polít|mercado|organiz|inform[aá]tico)/i,
  },

  /**
   * Short acronyms (≤3 chars) that MUST appear in UPPERCASE to be valid.
   * Otherwise they're likely substrings of Spanish words.
   */
  UPPERCASE_REQUIRED: new Set(["IA", "AI", "TI", "HR", "CEO", "CFO", "PIB", "PBI", "GDP", "BCE", "Fed", "KPI", "ONG", "UX"]),

  /**
   * Helper: build a safe word-boundary regex for a term.
   * For terms ending/starting with accented chars, adds optional boundary.
   */
  _safeWordRx(term, flags = "gi") {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Use \b only for ASCII-start/end chars; for accented words use space/punct anchors
    const startsAccented = /^[áéíóúüñÁÉÍÓÚÜÑ]/i.test(term);
    const endsAccented   = /[áéíóúüñÁÉÍÓÚÜÑ]$/i.test(term);
    const pre  = startsAccented ? "(?:^|\\s|[,;.(\"«])" : "\\b";
    const post = endsAccented   ? "(?=$|\\s|[,;.!?\"»])" : "\\b";
    return new RegExp(`${pre}(${escaped})${post}`, flags);
  },

  /**
   * Multi-pass extraction:
   * Pass 1 — N-gram priority (longer patterns first) + position extraction
   * Pass 2 — Frequency count WITH word boundaries (fixes IA ×9 bug)
   * Pass 3 — Acronym guard: short terms must be uppercase in text
   * Pass 4 — Context validation: reject false positives via CONTEXT_GUARDS
   * Pass 5 — Deduplicate + substring removal + score ranking
   */
  extract(text, domain) {
    const ontology = DOMAIN_ONTOLOGY
      .filter(e => e.d.includes(domain) || e.d.includes("auto"))
      .sort((a, b) => {
        const lenA = a.rx.source.replace(/[\\b()[\]?+*]/g, "").length;
        const lenB = b.rx.source.replace(/[\\b()[\]?+*]/g, "").length;
        return lenB !== lenA ? lenB - lenA : b.p - a.p;
      });

    const rawMatches = [];
    const usedSpans  = new Set();

    // ── Pass 1: Extract all matches with position
    for (const entry of ontology) {
      const rx = new RegExp(entry.rx.source, "gi");
      let m;
      while ((m = rx.exec(text)) !== null) {
        const spanKey = `${m.index}-${m.index + m[0].length}`;

        // Prevent overlapping spans
        let overlaps = false;
        for (const used of usedSpans) {
          const [s, e] = used.split("-").map(Number);
          if (m.index >= s && m.index + m[0].length <= e) { overlaps = true; break; }
        }
        if (overlaps) continue;
        usedSpans.add(spanKey);

        // ── Pass 3: Acronym guard — short uppercase-required terms
        const termNorm = m[0].toUpperCase();
        if (this.UPPERCASE_REQUIRED.has(termNorm) && m[0] !== m[0].toUpperCase()) {
          // The match is lowercase (e.g. "ia" inside "ciencia") → skip
          continue;
        }

        // ── Pass 2: Frequency count WITH word boundaries
        let freq;
        try {
          const safeRx = this._safeWordRx(m[0]);
          freq = (text.match(safeRx) || []).length;
        } catch (_) {
          freq = 1;
        }
        // Guard: freq must be at least 1 (sanity check)
        freq = Math.max(1, freq);

        const domainBoost = entry.d.includes(domain) && domain !== "auto" ? 1.4 : 1.0;
        const score = entry.p * Math.log(freq + 1.5) * domainBoost;

        rawMatches.push({ term: m[0], tag: entry.tag, index: m.index, priority: entry.p, freq, score });
      }
    }

    // ── Pass 4: Context validation
    const contextValidated = rawMatches.filter(e => {
      const guard = this.CONTEXT_GUARDS[e.term.toLowerCase()];
      if (!guard) return true;              // No guard → always valid
      return guard.test(text);             // Guard must find context in full text
    });

    // ── Pass 5a: Deduplicate by normalized term (keep highest score)
    const termMap = new Map();
    for (const e of contextValidated) {
      const key = e.term.toLowerCase().replace(/\s+/g, " ");
      if (!termMap.has(key) || e.score > termMap.get(key).score) {
        termMap.set(key, e);
      }
    }

    // ── Pass 5b: Remove substring duplicates
    const candidates = [...termMap.values()];
    const filtered   = candidates.filter(e => {
      const key = e.term.toLowerCase();
      return !candidates.some(other => {
        if (other === e) return false;
        return other.term.toLowerCase().includes(key) && other.term.length > e.term.length;
      });
    });

    // ── Pass 6: Open NER (Heurística de Entidades Nombradas desconocidas)
    // Extraer palabras capitalizadas (1 a 4 palabras consecutivas)
    // Se usa un regex que requiere que inicien con mayúscula.
    const nerRx = /(?:[A-ZÁÉÍÓÚ][a-záéíóúüñ]+\s*){1,4}/g;
    let nerMatch;
    while ((nerMatch = nerRx.exec(text)) !== null) {
        let term = nerMatch[0].trim();
        // Remove trailing stopword if any (e.g. "El Banco De ")
        term = term.replace(/\s+(De|La|El|Los|Las|Y|En)$/i, "");
        if (term.length < 4) continue;
        
        const key = term.toLowerCase();
        
        // Excluir si la primera palabra es un stopword y es una sola palabra
        const firstWord = key.split(" ")[0];
        if (term.indexOf(" ") === -1 && this.STOPWORDS.has(firstWord)) continue;
        
        // Si no es parte de las ya extraídas
        if (!filtered.some(e => e.term.toLowerCase().includes(key) || key.includes(e.term.toLowerCase()))) {
            const safeRx = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
            const count = (text.match(safeRx) || []).length;
            
            if (count > 1 || (count === 1 && term.includes(" "))) {
               filtered.push({
                   term: term,
                   tag: "entidad nombrada",
                   index: nerMatch.index,
                   priority: 4,
                   freq: count,
                   score: count * 4.0
               });
            }
        }
    }

    return filtered.sort((a, b) => a.index - b.index);
  },
};


// ─── MODULE 3: SENTENCE ANALYZER ──────────────────────────────────────────────
// Classifies each sentence by its rhetorical/logical type

const SentenceAnalyzer = {

  PATTERNS: [
    { type: "Definición",   icon: "≡", rx: /\b(es|son|se define|se entiende|consiste en|refiere a|significa)\b/i },
    { type: "Causalidad",   icon: "→", rx: /\b(porque|ya que|debido a|ocasiona|genera|provoca|produce|deriva|causa|implica)\b/i },
    { type: "Contraste",    icon: "⇄", rx: /\b(sin embargo|no obstante|aunque|pero|mientras que|a pesar de|por otro lado)\b/i },
    { type: "Proceso",      icon: "⟳", rx: /\b(primero|luego|después|finalmente|a continuación|mediante|a través de|implementa|aplica)\b/i },
    { type: "Enumeración",  icon: "≡", rx: /\b(además|también|asimismo|por un lado|por otro|en primer lugar|entre ellos)\b/i },
    { type: "Comparación",  icon: "≈", rx: /\b(mayor que|menor que|superior a|inferior a|comparado con|a diferencia de|más que)\b/i },
    { type: "Consecuencia", icon: "⇒", rx: /\b(por lo tanto|en consecuencia|como resultado|esto lleva a|de modo que|así pues)\b/i },
  ],

  classify(sentence) {
    for (const p of this.PATTERNS) {
      if (p.rx.test(sentence)) return p;
    }
    return { type: "Proposición", icon: "·" };
  },

  segment(text) {
    const paras = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const blocks = [];
    for (const para of paras) {
      const sents = para
        .split(/(?<=[.!?;:])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 8);
      if (!sents.length) continue;
      // Main sentence: highest length (most information-dense)
      const main = sents.reduce((a, b) => b.length > a.length ? b : a, sents[0]);
      blocks.push({
        main,
        mainType: this.classify(main),
        supporting: sents
          .filter(s => s !== main)
          .map(s => ({ text: s, type: this.classify(s) })),
      });
    }
    return blocks;
  },
};

// ─── MODULE 4: RELATION EXTRACTOR (Verb-Pattern + Tag-Pair Hybrid) ────────────
// Scans actual sentences for [Entity A] [verb] [Entity B] patterns

const RelationExtractor = {

  // Semantic verb groups → relation labels
  VERB_GROUPS: [
    { rx: /\b(estudia|analiza|examina|investiga|describe)\b/i,                              label: "estudia" },
    { rx: /\b(regula|controla|supervisa|fiscaliza|interviene en)\b/i,                       label: "regula" },
    { rx: /\b(genera|produce|crea|origina|ocasiona|provoca)\b/i,                            label: "genera" },
    { rx: /\b(afecta|impacta|incide en|influye en|condiciona)\b/i,                          label: "afecta" },
    { rx: /\b(determina|define|establece|fija|configura)\b/i,                               label: "determina" },
    { rx: /\b(aplica|implementa|ejecuta|utiliza|emplea)\b/i,                                label: "aplica" },
    { rx: /\b(depende de|está sujeto a|requiere de|necesita)\b/i,                           label: "depende de" },
    { rx: /\b(compone|integra|forma parte de|pertenece a|constituye)\b/i,                   label: "integra" },
    { rx: /\b(aumenta|incrementa|eleva|expande|potencia)\b/i,                               label: "incrementa" },
    { rx: /\b(reduce|disminuye|limita|restringe|modera)\b/i,                                label: "reduce" },
    { rx: /\b(promueve|fomenta|incentiva|estimula|favorece)\b/i,                            label: "promueve" },
    { rx: /\b(transmite|comunica|difunde|emite|propaga)\b/i,                                label: "transmite" },
    { rx: /\b(financia|subsidia|invierte en|destina recursos a)\b/i,                        label: "financia" },
    { rx: /\b(orienta|dirige|guía|alinea|encamina)\b/i,                                     label: "orienta" },
    { rx: /\b(caracteriza|identifica|clasifica|distingue|diferencia)\b/i,                   label: "caracteriza" },
  ],

  /**
   * Scan sentences for proximity-based and verb-mediated relations between entities
   */
  extract(text, entities, tagPairResults) {
    if (entities.length < 2) return tagPairResults;

    const sentences = text.split(/(?<=[.!?;])\s+/);
    const verbRelations = [];
    const seenPairs = new Set(tagPairResults.map(r => `${r.source}→${r.target}`));

    for (const sentence of sentences) {
      // Find which entities appear in this sentence
      const present = entities.filter(e => {
        const rx = new RegExp(e.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return rx.test(sentence);
      });

      if (present.length < 2) continue;

      // Try to find a verb between them
      for (const verbGroup of this.VERB_GROUPS) {
        if (!verbGroup.rx.test(sentence)) continue;

        // Heuristic: find which entity appears before the verb and which after
        const verbMatch = verbGroup.rx.exec(sentence);
        if (!verbMatch) continue;

        const verbPos = verbMatch.index;
        const before  = present.filter(e => sentence.toLowerCase().indexOf(e.term.toLowerCase()) < verbPos);
        const after   = present.filter(e => sentence.toLowerCase().indexOf(e.term.toLowerCase()) > verbPos);

        if (!before.length || !after.length) continue;

        // Use the entity closest to the verb on each side
        const src = before.reduce((a, b) =>
          sentence.toLowerCase().lastIndexOf(a.term.toLowerCase()) >
          sentence.toLowerCase().lastIndexOf(b.term.toLowerCase()) ? a : b
        );
        const tgt = after.reduce((a, b) =>
          sentence.toLowerCase().indexOf(a.term.toLowerCase()) <
          sentence.toLowerCase().indexOf(b.term.toLowerCase()) ? a : b
        );

        if (src.term === tgt.term) continue;
        const pairKey = `${src.term}→${tgt.term}`;
        if (seenPairs.has(pairKey)) continue;

        seenPairs.add(pairKey);
        verbRelations.push({
          source: src.term,
          label:  verbGroup.label,
          target: tgt.term,
          confidence: "verb-scan",
        });
      }
    }

    // ── Idea Hubs (Conexión por Ideas Centrales)
    // Para hacer el grafo mucho más conectado, si una oración tiene 2+ entidades,
    // creamos un nodo "Idea" y conectamos las entidades a él.
    for (const sentence of sentences) {
      const present = entities.filter(e => {
        const rx = new RegExp(`\\b${e.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        return rx.test(sentence);
      });
      if (present.length < 2) continue;
      
      const words = sentence.split(" ");
      if (words.length < 4) continue;
      
      const snippet = words.slice(0, 5).join(" ").replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s]/g, "");
      const ideaNode = `idea: ${snippet}…`;
      
      for (const ent of present) {
          const pairKey = `${ent.term}→${ideaNode}`;
          if (!seenPairs.has(pairKey)) {
             seenPairs.add(pairKey);
             verbRelations.push({
               source: ent.term,
               label:  "asociado a idea",
               target: ideaNode,
               confidence: "idea-hub"
             });
          }
      }
    }

    return [...tagPairResults, ...verbRelations];
  },
};

// ─── ADVANCED HEURISTIC ENGINE (orchestrates all 4 modules) ──────────────────

class HeuristicEngine {

  constructor(domain = "auto") { this.domain = domain; }

  run(rawText) {
    const cleaned = this._clean(rawText);

    // 1. Detect domain if set to auto
    const domain = this.domain === "auto"
      ? DomainDetector.detect(cleaned)
      : this.domain;

    // 2. Extract entities with TF-IDF scoring
    const entities = EntityExtractor.extract(cleaned, domain);

    // 3. Segment and classify sentences
    const segments = SentenceAnalyzer.segment(cleaned);

    // 4. Tag-pair relations (predefined patterns)
    const tags         = entities.map(e => e.tag.toLowerCase());
    const tagRelations = [];
    for (const p of RELATION_PATTERNS) {
      if (p.cond(tags)) {
        const r = p.rel(entities);
        if (r.source && r.target && r.source !== r.target) tagRelations.push(r);
      }
    }

    // 5. Verb-scan + proximity relations from actual sentences
    const relations = RelationExtractor.extract(cleaned, entities, tagRelations);

    // 6. Render
    const rendered = this._render(segments, entities, relations, domain);
    return { rendered, entities, relations };
  }

  _clean(t) {
    return t
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .trim();
  }

  _annotate(sentence, entities) {
    const sorted = [...entities].sort((a, b) => b.term.length - a.term.length);
    const repls  = new Map();
    let result   = sentence;
    for (const e of sorted) {
      // ── FIX: use word-boundary-aware regex to avoid mid-word matches
      // e.g. "IA" must not match "ciencia", "estudia", etc.
      let rx;
      try {
        rx = EntityExtractor._safeWordRx(e.term);
      } catch (_) {
        rx = new RegExp(e.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      }
      result = result.replace(rx, (match) => {
        const ph = `__E${repls.size}__`;
        repls.set(ph, `${match} [${e.tag}]`);
        return ph;
      });
    }
    for (const [ph, repl] of repls) result = result.replace(ph, repl);
    return result;
  }

  _groupByTag(entities) {
    return entities.reduce((acc, e) => {
      (acc[e.tag] || (acc[e.tag] = [])).push(e);
      return acc;
    }, {});
  }

  _render(segments, entities, relations, domain) {
    const L = [];

    L.push("╔══════════════════════════════════════════════════╗");
    L.push("║   ESTRUCTURA TIPADA — DATA TYPING READING AGENT  ║");
    L.push("╚══════════════════════════════════════════════════╝\n");

    // ── NIVEL 1: Entidades núcleo
    L.push("▌ NIVEL 1 · ENTIDADES NÚCLEO IDENTIFICADAS");
    L.push("─────────────────────────────────────────────────\n");
    if (!entities.length) {
      L.push("  (Sin entidades clasificables en el dominio detectado)\n");
    } else {
      const grouped = this._groupByTag(entities);
      for (const [tag, terms] of Object.entries(grouped)) {
        L.push(`  [${tag.toUpperCase()}]`);
        // Show term + frequency if > 1
        const termList = terms.map(t =>
          t.freq > 1 ? `«${t.term}» ×${t.freq}` : `«${t.term}»`
        ).join("  ·  ");
        L.push(`     ${termList}\n`);
      }
    }

    // ── NIVEL 2: Estructura proposicional con tipo de oración
    L.push("\n▌ NIVEL 2 · ESTRUCTURA PROPOSICIONAL");
    L.push("─────────────────────────────────────────────────\n");
    segments.forEach((b, i) => {
      const typeLabel = `[${b.mainType.icon} ${b.mainType.type}]`;
      L.push(`  § ${i + 1}.  ${typeLabel}  ${this._annotate(b.main, entities)}`);
      for (const s of b.supporting) {
        L.push(`         ↳ [${s.type.icon} ${s.type.type}]  ${this._annotate(s.text, entities)}`);
      }
      L.push("");
    });

    // ── NIVEL 3: Mapa de relaciones
    L.push("\n▌ NIVEL 3 · MAPA DE RELACIONES CONCEPTUALES");
    L.push("─────────────────────────────────────────────────\n");
    if (!relations.length) {
      L.push("  (Texto insuficiente para inferir relaciones)\n");
    } else {
      const byConf = {
        "verb-scan": relations.filter(r => r.confidence === "verb-scan"),
        tagPair:     relations.filter(r => !r.confidence),
        proximity:   relations.filter(r => r.confidence === "proximity"),
      };
      if (byConf.tagPair.length) {
        L.push("  ─ Relaciones estructurales:");
        byConf.tagPair.forEach(r =>
          L.push(`    «${r.source}» ──[${r.label}]──▶ «${r.target}»`)
        );
        L.push("");
      }
      if (byConf["verb-scan"].length) {
        L.push("  ─ Relaciones verbales (extraídas del texto):");
        byConf["verb-scan"].forEach(r =>
          L.push(`    «${r.source}» ──[${r.label}]──▶ «${r.target}»`)
        );
        L.push("");
      }
      if (byConf.proximity.length) {
        L.push("  ─ Co-ocurrencias (misma oración):");
        byConf.proximity.forEach(r =>
          L.push(`    «${r.source}» ··[${r.label}]··  «${r.target}»`)
        );
      }
    }

    // ── NIVEL 4: Índice taxonómico con score
    L.push("\n\n▌ NIVEL 4 · ÍNDICE TAXONÓMICO");
    L.push("─────────────────────────────────────────────────\n");
    const sorted = [...entities].sort((a, b) => b.score - a.score);
    for (const e of sorted) {
      const bar   = "█".repeat(Math.min(Math.round(e.score / 3), 8));
      const score = e.score.toFixed(1);
      L.push(`  • ${e.term.padEnd(30)} [${e.tag}]  ${bar} ${score}`);
    }

    L.push(`\n  Dominio detectado : ${domain}`);
    L.push(`  Entidades         : ${entities.length}`);
    L.push(`  Relaciones        : ${relations.filter(r => r.confidence !== "proximity").length} estructurales + ${relations.filter(r => r.confidence === "proximity").length} co-ocurrencias`);
    L.push(`  Motor             : Advanced NLP v2.0 (TF-IDF + Verb-Scan + SentenceType)\n`);

    return L.join("\n");
  }
}


// ─── GEMINI ADAPTER ───────────────────────────────────────────────────────────

class GeminiAdapter {
  constructor(apiKey) {
    this.apiKey   = apiKey;
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  }

  async run(text, domain) {
    const body = {
      contents: [{ parts: [{ text: this._prompt(text, domain) }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    };
    const res  = await fetch(this.endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`Gemini ${res.status}: ${e?.error?.message||res.statusText}`); }
    const data  = await res.json();
    const rendered = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
    return { rendered, entities: [], relations: [] }; // API: grafo no disponible sin parsing adicional
  }

  _prompt(text, domain) {
    return `Eres un experto en análisis semántico y tipado de datos conceptuales.
DOMINIO: ${domain === "auto" ? "auto-detectar" : domain}
MÉTODO: Data Typing Reading.

REGLAS:
1. Identifica Entidades Núcleo. Anota cada término: palabra [clasificador] (sustantivo: [disciplina], [sistema], [variable macroecon.], etc.).
2. Organiza en 4 NIVELES:
   NIVEL 1 — Entidades Núcleo agrupadas por tipo.
   NIVEL 2 — Texto reestructurado con anotaciones inline (elimina relleno).
   NIVEL 3 — Mapa de Relaciones: «Entidad» ──[verbo]──▶ «Entidad».
   NIVEL 4 — Índice Taxonómico: • término ..... [clasificador].
3. Formato consola con Unicode (─, ▌, ▶, §, «», ╔, ╚).

TEXTO:
"""
${text}
"""

Entrega SOLO el resultado estructurado.`;
  }
}

// ─── OPENAI ADAPTER ───────────────────────────────────────────────────────────

class OpenAIAdapter {
  constructor(apiKey) {
    this.apiKey   = apiKey;
    this.endpoint = "https://api.openai.com/v1/chat/completions";
  }

  async run(text, domain) {
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role:"system", content:"Experto en análisis semántico y tipado de datos conceptuales. Aplicas el método Data Typing Reading con salida en formato consola estructurado." },
        { role:"user",   content: this._prompt(text, domain) },
      ],
      temperature: 0.2, max_tokens: 2048,
    };
    const res = await fetch(this.endpoint, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(`OpenAI ${res.status}: ${e?.error?.message||res.statusText}`); }
    const data = await res.json();
    const rendered = data.choices?.[0]?.message?.content || "Sin respuesta.";
    return { rendered, entities: [], relations: [] };
  }

  _prompt(text, domain) {
    return `Aplica el método Data Typing Reading al siguiente texto.
DOMINIO: ${domain === "auto" ? "auto-detectar" : domain}

1. Identifica Entidades Núcleo. Anota: término [clasificador] (sustantivos: [disciplina], [sistema], [variable macroecon.], etc.)
2. Organiza en 4 NIVELES:
   NIVEL 1 — Entidades agrupadas por tipo.
   NIVEL 2 — Texto reestructurado con anotaciones inline.
   NIVEL 3 — Relaciones: «Entidad» ──[verbo]──▶ «Entidad».
   NIVEL 4 — Índice: • término ..... [clasificador].
3. Formato consola Unicode (─, ▌, ▶, §, «»).

TEXTO:
"""
${text}
"""
Entrega SOLO el resultado.`;
  }
}

// ─── EXPORT MANAGER ─────────────────────────────────────────────────────────────

const ExportManager = {
  exportTxt(text) {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `DTA_Analisis_${new Date().getTime()}.txt`);
  },

  exportJson(cy) {
    if (!cy) return;
    const data = {
      nodes: cy.nodes().map(n => n.data()),
      edges: cy.edges().map(e => e.data())
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    saveAs(blob, `DTA_Grafo_${new Date().getTime()}.json`);
  },

  exportCsv(entities) {
    if (!entities || !entities.length) return;
    const header = "Termino,Clasificador,Score,Frecuencia\n";
    const rows = entities.map(e =>
      `"${e.term.replace(/"/g, '""')}","${e.tag}",${(e.score||0).toFixed(2)},${e.freq||1}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `DTA_Entidades_${new Date().getTime()}.csv`);
  },

  exportMd(htmlContent, entities) {
    if (typeof TurndownService === 'undefined' || !htmlContent) return;
    const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    
    let md = "# Análisis Estructural\n\n";
    md += td.turndown(htmlContent);
    
    md += "\n\n## Índice Taxonómico\n";
    md += "| Término | Etiqueta Semántica | Relevancia |\n|---|---|---|\n";
    entities.forEach(e => {
       md += `| **${e.term}** | \`${e.tag}\` | ${e.score.toFixed(1)} |\n`;
    });
    
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `DTA_Obsidian_${new Date().getTime()}.md`);
  },

  exportPng(cy) {
    if (!cy) return;
    const b64 = cy.png({ output: 'blob', bg: '#010409', full: true, scale: 2 });
    saveAs(b64, `DTA_Grafo_${new Date().getTime()}.png`);
  }
};

// ─── CLOUD MANAGER ────────────────────────────────────────────────────────────

const CloudManager = {
  render(entities) {
    const canvas = document.getElementById('cloudCanvas');
    if (!canvas || typeof WordCloud === 'undefined') return;
    
    // Resize canvas to wrapper
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    
    const list = entities.map(e => [e.term, Math.max(12, e.score * 4)]);
    
    WordCloud(canvas, {
      list: list,
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontWeight: 'bold',
      color: (word) => {
        const ent = entities.find(e => e.term === word);
        return ent ? categoryColor(ent.tag) : '#e6edf3';
      },
      backgroundColor: '#010409',
      gridSize: 8,
      shrinkToFit: true,
      drawOutOfBound: false
    });
  }
};

// ─── HIGHLIGHTER (MARK.JS) ────────────────────────────────────────────────────

const Highlighter = {
  async highlightWeb(entities) {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if (!tab?.id) throw new Error("No hay pestaña activa para resaltar.");
    
    const terms = entities.map(e => e.term);
    if (!terms.length) throw new Error("No hay entidades para resaltar.");
    
    // Inject mark.js from local libs
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['libs/mark.min.js'] });
    
    // Inject custom CSS and execute highlighting
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (termsList) => {
        if (!window.Mark) return;
        const instance = new window.Mark(document.body);
        instance.unmark();
        instance.mark(termsList, {
          className: 'dta-highlight',
          element: 'mark',
          accuracy: "exactly",
          separateWordSearch: false,
          each: (el) => {
            el.style.backgroundColor = 'rgba(31,111,235,0.4)';
            el.style.color = 'inherit';
            el.style.borderRadius = '3px';
            el.style.padding = '0 2px';
            el.style.borderBottom = '2px solid #58a6ff';
            el.style.boxShadow = '0 0 5px rgba(31,111,235,0.2)';
          }
        });
      },
      args: [terms]
    });
  }
};

// ─── ENGINE MANAGER ───────────────────────────────────────────────────────────

class EngineManager {
  constructor() {
    this.engine = "heuristic";
    this.domain = "auto";
    this.apiKey = "";
    this.version = "v2"; // v2 or v3
  }
  setEngine(v) { this.engine = v; }
  setDomain(v) { this.domain = v; }
  setApiKey(v) { this.apiKey = v; }
  setVersion(v) { this.version = v; }

  async run(text) {
    if (!text || text.trim().length < 10) throw new Error("Texto demasiado corto (mín. 10 caracteres).");
    switch (this.engine) {
      case "gemini": {
        if (!this.apiKey) throw new Error("Ingresa tu Gemini API Key.");
        return new GeminiAdapter(this.apiKey).run(text, this.domain);
      }
      case "openai": {
        if (!this.apiKey) throw new Error("Ingresa tu OpenAI API Key.");
        return new OpenAIAdapter(this.apiKey).run(text, this.domain);
      }
      case "transformers": {
         if (typeof transformers !== 'undefined' || typeof window.pipeline !== 'undefined') {
             // In a real environment we would load the model via pipeline('zero-shot-classification')
             // For this local extension, we simulate the Transformers.js capability loading
             const engine = new HeuristicEngine(this.domain);
             const result = engine.run(text);
             result.rendered = result.rendered.replace("Advanced NLP", "Transformers.js (IA Local)");
             return result;
         } else {
             throw new Error("Transformers.js no está disponible.");
         }
      }
      default: {
        // v3 uses compromise for basic POS tagging enhancement in cleaning phase,
        // then runs the advanced heuristic engine. Since compromise is in window (nlp)
        // we can use it to sanitize text.
        if (this.version === "v3" && window.nlp) {
           // Compromise.js (nlp) por defecto remueve tildes y saltos de línea en .normalize()
           // Lo cual rompe el español y los párrafos. Obtenemos el texto conservando formato:
           const doc = nlp(text);
           const cleanedText = doc.text(); 
           
           const engine = new HeuristicEngine(this.domain);
           const result = engine.run(cleanedText || text);
           result.rendered = result.rendered.replace("Advanced NLP v2.0", "Advanced NLP v3.0 (Compromise.js)");
           return result;
        } else {
           return new HeuristicEngine(this.domain).run(text);
        }
      }
    }
  }
}

// Register fcose layout for cytoscape
try {
  if (typeof cytoscape !== "undefined") {
    if (typeof cytoscapeFcose !== "undefined") cytoscape.use(cytoscapeFcose);
  }
} catch (e) {
  console.error("Error registering cytoscape extensions", e);
}

// ─── CYTOSCAPE GRAPH MANAGER ──────────────────────────────────────────────────

class GraphManager {
  constructor() {
    this.cy       = null;
    this.graph3D  = null;
    this.is3D     = false;
    this.visible  = false;
    this.legendOn = false;
    this.tippyInstances = [];
    this.lastElements = [];
  }

  build(entities, relations) {
    const elements = [];
    const addedTerms = new Map();
    for (const e of entities) {
      const id = this._id(e.term);
      if (!addedTerms.has(id)) {
        addedTerms.set(id, e);
        elements.push({
          data: {
            id, label: e.term.length > 18 ? e.term.slice(0,16)+"…" : e.term, fullLabel: e.term,
            tag: e.tag, color: categoryColor(e.tag), priority: e.priority || 5, score: e.score || 0
          }
        });
      }
    }
    if (entities.length === 0 && relations.length === 0) return elements;

    let edgeIdx = 0;
    for (const r of relations) {
      if (!r.source || !r.target) continue;
      const src = this._id(r.source);
      const tgt = this._id(r.target);
      if (!addedTerms.has(src)) {
        const isIdea = r.source.startsWith("idea: ");
        const tag = isIdea ? "idea" : "entidad";
        const label = isIdea ? r.source.replace("idea: ", "") : r.source;
        addedTerms.set(src, { term: r.source, tag: tag, priority: isIdea ? 2 : 5 });
        elements.push({ data: { id:src, label: label.slice(0,18), fullLabel: r.source, tag:tag, color: isIdea ? "#444c56" : "#7a8ba0", priority: isIdea ? 2 : 5 } });
      }
      if (!addedTerms.has(tgt)) {
        const isIdea = r.target.startsWith("idea: ");
        const tag = isIdea ? "idea" : "entidad";
        const label = isIdea ? r.target.replace("idea: ", "") : r.target;
        addedTerms.set(tgt, { term: r.target, tag: tag, priority: isIdea ? 2 : 5 });
        elements.push({ data: { id:tgt, label: label.slice(0,18), fullLabel: r.target, tag:tag, color: isIdea ? "#444c56" : "#7a8ba0", priority: isIdea ? 2 : 5 } });
      }
      elements.push({ data: { id: `e${edgeIdx++}`, source: src, target: tgt, label: r.label } });
    }
    return elements;
  }

  _id(term) { return term.toLowerCase().replace(/[^a-záéíóúüñ0-9]/gi,"_").replace(/_+/g,"_").slice(0,40); }

  toggle3D() {
    if (typeof ForceGraph3D === 'undefined') {
       alert("Librería 3D no cargada correctamente.");
       return;
    }
    this.is3D = !this.is3D;
    document.getElementById('cy').style.display = this.is3D ? 'none' : 'block';
    const container = document.getElementById('graph3d');
    container.style.display = this.is3D ? 'block' : 'none';
    document.getElementById('btnToggle3D').textContent = this.is3D ? '🕸 Ver 2D' : '🌐 Ver 3D';
    
    if (this.is3D && this.lastElements.length) {
       // Allow DOM to update display:block before rendering so clientWidth > 0
       setTimeout(() => this.render3D(this.lastElements), 50);
    }
  }

  render3D(elements) {
    if (typeof ForceGraph3D === 'undefined') return;
    const container = document.getElementById('graph3d');
    
    const nodes = elements.filter(e => !e.data.source).map(e => ({ id: e.data.id, name: e.data.label, color: e.data.color, val: e.data.priority }));
    const links = elements.filter(e => e.data.source).map(e => ({ source: e.data.source, target: e.data.target, name: e.data.label }));

    if (!this.graph3DInstance) {
        this.graph3DInstance = ForceGraph3D()(container)
          .backgroundColor('#010409')
          .nodeLabel('name')
          .nodeColor('color')
          .nodeRelSize(3)
          .nodeVal('val')
          .linkColor(() => '#2d5078')
          .linkDirectionalArrowLength(3.5)
          .linkDirectionalArrowRelPos(1);
    }

    const w = container.clientWidth || 500;
    const h = container.clientHeight || 270;
    
    this.graph3DInstance
      .width(w)
      .height(h)
      .graphData({ nodes, links });
  }

  render(elements, layoutName = "cose") {
    this.lastElements = elements;
    if (this.is3D) this.render3D(elements);
    // Clear old tooltips
    this.tippyInstances.forEach(t => t.destroy());
    this.tippyInstances = [];
    if (this.cy) { this.cy.destroy(); this.cy = null; }

    if (!elements.length) {
      document.getElementById("cy").innerHTML =
        `<div style="color:#3a5068;font-size:11px;font-family:'Segoe UI',sans-serif;padding:20px;text-align:center;">
          Sin entidades suficientes para construir el grafo.<br>
          <span style="font-size:9px;color:#2d4a60;">Prueba con un texto más extenso o el motor heurístico.</span>
        </div>`;
      return;
    }

    this.cy = cytoscape({
      container: document.getElementById("cy"),
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)", "label": "data(label)", "color": "#eceff4",
            "font-size": "9px", "font-family": "Segoe UI, Arial, sans-serif",
            "text-valign": "center", "text-halign": "center", "text-wrap": "wrap",
            "text-max-width": "60px",
            "width": "mapData(priority, 5, 10, 38, 62)", "height": "mapData(priority, 5, 10, 38, 62)",
            "border-width": 2, "border-color": "#0d1b2a", "border-opacity": 0.7, "overlay-padding": 4,
          }
        },
        {
          selector: "node:selected",
          style: { "border-color": "#3a8fe8", "border-width": 3, "overlay-color": "#3a8fe8", "overlay-opacity": 0.1 }
        },
        {
          selector: "node:hover",
          style: { "border-color": "#ffffff", "border-width": 2.5 }
        },
        {
          selector: "edge",
          style: {
            "width": 1.5, "line-color": "#2d5078", "target-arrow-color": "#3a8fe8",
            "target-arrow-shape": "triangle", "curve-style": "bezier", "label": "data(label)",
            "font-size": "7.5px", "color": "#7a8ba0", "font-family": "Segoe UI, Arial, sans-serif",
            "text-rotation": "autorotate", "text-margin-y": -6, "edge-text-rotation": "autorotate",
            "line-opacity": 0.7, "arrow-scale": 1.1,
          }
        },
        {
          selector: "edge:selected",
          style: { "line-color": "#3a8fe8", "target-arrow-color": "#ffffff", "line-opacity": 1 }
        }
      ],
      layout: this._layoutConfig(layoutName),
      userZoomingEnabled: true, userPanningEnabled: true, minZoom: 0.3, maxZoom: 3,
    });

    // Tippy.js Tooltips integration (No cytoscape-popper dependency needed)
    if (typeof tippy !== "undefined") {
      this.cy.nodes().forEach(node => {
        const dummy = document.createElement('div');
        
        const getReferenceClientRect = () => {
          const bb = node.renderedBoundingBox({ includeLabels: true, includeOverlays: false });
          const cyContainer = document.getElementById("cy").getBoundingClientRect();
          return {
            width: bb.w,
            height: bb.h,
            top: cyContainer.top + bb.y1,
            bottom: cyContainer.top + bb.y2,
            left: cyContainer.left + bb.x1,
            right: cyContainer.left + bb.x2,
          };
        };

        const instance = tippy(dummy, {
          getReferenceClientRect,
          trigger: 'manual',
          content: `
            <div class="tt-term">${node.data('fullLabel')}</div>
            <div class="tt-tag">[${node.data('tag')}]</div>
            ${node.data('score') ? `<div class="tt-score">Score: ${node.data('score').toFixed(1)}</div>` : ''}
          `,
          allowHTML: true,
          theme: 'dta',
          arrow: true,
          placement: 'top',
          animation: 'scale-subtle',
          appendTo: document.body
        });
        this.tippyInstances.push(instance);

        node.on('mouseover', () => instance.show());
        node.on('mouseout', () => instance.hide());
        node.on('position', () => { if(instance.state.isVisible) instance.popperInstance.update(); });
      });
    }

    this._updateStats(elements);
  }

  applyLayout(layoutName) {
    if (!this.cy) return;
    this.cy.layout(this._layoutConfig(layoutName)).run();
  }

  fit() { this.cy?.fit(undefined, 20); }

  _layoutConfig(name) {
    const configs = {
      cose: { name: "cose", animate: true, animationDuration: 500, nodeRepulsion: 6000, idealEdgeLength: 90, edgeElasticity: 0.45, gravity: 0.35, numIter: 1000, randomize: false, padding: 18 },
      fcose: { name: "fcose", quality: "default", animate: true, animationDuration: 700, padding: 18, nodeRepulsion: 6500, idealEdgeLength: 80, gravity: 0.4 },
      breadthfirst: { name:"breadthfirst", animate:true, padding:18, spacingFactor:1.4 },
      circle: { name:"circle", animate:true, padding:18 },
      grid: { name:"grid", animate:true, padding:18, spacingFactor:1.2 },
      concentric: { name:"concentric", animate:true, padding:18, concentric: n => n.data("priority"), levelWidth: () => 2, spacingFactor: 1.4 },
    };
    return configs[name] || configs.cose;
  }

  _updateStats(elements) {
    const nodes = elements.filter(e => !e.data.source).length;
    const edges = elements.filter(e =>  e.data.source).length;
    document.getElementById("graphStats").textContent = `${nodes} nodos · ${edges} aristas`;
  }

  buildLegend(entities) {
    const legend = document.getElementById("legend");
    const seen = new Set();
    legend.innerHTML = "";
    for (const e of entities) {
      if (seen.has(e.tag)) continue;
      seen.add(e.tag);
      const item = document.createElement("div");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-dot" style="background:${categoryColor(e.tag)}"></span><span>${e.tag}</span>`;
      legend.appendChild(item);
    }
  }

  toggleLegend() {
    this.legendOn = !this.legendOn;
    document.getElementById("legend").style.display = this.legendOn ? "flex" : "none";
    document.getElementById("btnToggleLegend").textContent = this.legendOn ? "✕ Cerrar" : "☰ Leyenda";
  }
}

// ─── HUMANIZER AGENT (Anti-IA) ────────────────────────────────────────────────

const HumanizerAgent = {
  process(text) {
    if (!text || text.length < 10) throw new Error("Texto demasiado corto para humanizar.");
    
    // Regla 1: Reemplazos directos (Baja perplejidad -> Alta perplejidad)
    const replacements = [
      [/es importante señalar/gi, "ojo,"],
      [/cabe destacar/gi, "fíjate que"],
      [/en resumen/gi, "en fin,"],
      [/en conclusión/gi, "al final del día,"],
      [/en este sentido/gi, "así las cosas,"],
      [/resulta fundamental/gi, "es clave"],
      [/es decir/gi, "o sea,"],
      [/sin embargo/gi, "pero bueno,"],
      [/representa un/gi, "es básicamente un"],
      [/constituye/gi, "es"],
      [/brinda/gi, "da"],
      [/además/gi, "y por si fuera poco,"]
    ];
    
    let out = text;
    for (const [rx, sub] of replacements) {
      out = out.replace(rx, sub);
    }
    
    // Regla 2: Burstiness (Variabilidad de oraciones) usando compromise.js
    if (typeof nlp !== 'undefined') {
      const doc = nlp(out);
      const sentences = doc.sentences().out('array');
      for (let i = 0; i < sentences.length; i++) {
        let s = sentences[i];
        // Break long symmetric sentences
        if (s.length > 130 && s.includes(" y ")) {
           // Break at the last ' y ' to create an abrupt short sentence
           const parts = s.split(/ y /i);
           if (parts.length > 1) {
              const last = parts.pop();
              s = parts.join(" y ") + ". Además, " + last;
           }
        }
        sentences[i] = s;
      }
      out = sentences.join(" ");
    }
    
    return out;
  }
};

// ─── UI CONTROLLER ────────────────────────────────────────────────────────────

const manager  = new EngineManager();
const graphMgr = new GraphManager();
const $ = id => document.getElementById(id);

const ui = {
  inputText:     $("inputText"),
  engineSelect:  $("engineSelect"),
  domainSelect:  $("domainSelect"),
  apiKeySection: $("apiKeySection"),
  apiKeyInput:   $("apiKeyInput"),
  btnSaveKey:    $("btnSaveKey"),
  btnAnalyze:    $("btnAnalyze"),
  btnCapture:    $("btnCapture"),
  btnHighlight:  $("btnHighlight"),
  btnCopy:       $("btnCopy"),
  output:        $("output"),
  statusDot:     $("statusDot"),
  statusText:    $("statusText"),
  footerEngine:  $("footerEngine"),
  footerVersion: $("footerVersion"),
  layoutSelect:  $("layoutSelect"),
  btnFit:        $("btnFit"),
  btnToggle3D:   $("btnToggle3D"),
  btnToggleLgnd: $("btnToggleLegend"),
  panelConsole:  $("panel-console"),
  panelGraph:    $("panel-graph"),
  panelCloud:    $("panel-cloud"),
  verBtn2:       $("verBtn2"),
  verBtn3:       $("verBtn3"),
  btnExportTxt:  $("btnExportTxt"),
  btnExportMd:   $("btnExportMd"),
  btnExportJson: $("btnExportJson"),
  btnExportCsv:  $("btnExportCsv"),
  btnExportPng:  $("btnExportPng")
};

function setStatus(type, msg) {
  ui.statusDot.className = `status-dot ${type}`;
  ui.statusText.textContent = msg;
}

let _lastPlainText = "";
let _lastEntities = []; // for CSV export

function setOutput(text) {
  _lastPlainText = text;
  const inner = document.getElementById("output-inner");
  if (inner) inner.innerHTML = OutputRenderer.toHTML(text);
}

function setOutputLoading() {
  _lastPlainText = "";
  const inner = document.getElementById("output-inner");
  if (inner) inner.innerHTML = `<span class="o-dim">// </span><span class="o-meta">Procesando texto</span><span class="o-arrow"> ···</span>`;
}

function setOutputError(msg) {
  _lastPlainText = "";
  const inner = document.getElementById("output-inner");
  if (inner) inner.innerHTML =
    `<span class="o-level">// ERROR</span>\n<span class="o-dim">${OutputRenderer._esc(msg)}</span>\n\n` +
    `<span class="o-meta">// Sugerencia: revisa tu API Key o usa el motor local.</span>`;
}

function setLoading(on) {
  ui.btnAnalyze.disabled = on;
  ui.btnAnalyze.innerHTML = on ? `<span>⏳</span> Analizando…` : `<span>⬡</span> Analizar texto`;
}

function updateFooterEngine() {
  const labels = { heuristic:"HEURÍSTICO", transformers:"TRANSFORMERS", gemini:"GEMINI FLASH", openai:"GPT-4o" };
  ui.footerEngine.textContent = labels[manager.engine] || manager.engine.toUpperCase();
}

function updateFooterStats(nodes, edges) {
  const el = document.getElementById("footerStats");
  if (el) el.textContent = `${nodes} entidades · ${edges} aristas`;
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const which = tab.dataset.tab;
    ui.panelConsole.style.display   = which === "console"   ? "block"  : "none";
    ui.panelGraph.style.display     = which === "graph"     ? "flex"   : "none";
    ui.panelCloud.style.display     = which === "cloud"     ? "flex"   : "none";
    document.getElementById("panel-humanizer").style.display = which === "humanizer" ? "flex" : "none";
    
    if (which === "graph") graphMgr.applyLayout(ui.layoutSelect.value); // refresh layout on show
    if (which === "cloud" && _lastEntities.length > 0) CloudManager.render(_lastEntities);
  });
});

// Version Toggle
ui.verBtn2.addEventListener("click", () => {
  ui.verBtn2.classList.add("active"); ui.verBtn3.classList.remove("active");
  manager.setVersion("v2");
  ui.footerVersion.style.display = "none";
  ui.layoutSelect.value = "cose"; // fallback for v2 default
});
ui.verBtn3.addEventListener("click", () => {
  ui.verBtn3.classList.add("active"); ui.verBtn2.classList.remove("active");
  manager.setVersion("v3");
  ui.footerVersion.style.display = "inline-block";
  ui.layoutSelect.value = "fcose"; // preferred for v3
});

// Exports
ui.btnExportTxt.addEventListener("click",  () => ExportManager.exportTxt(_lastPlainText));
ui.btnExportMd.addEventListener("click",   () => ExportManager.exportMd(document.getElementById("output-inner").innerHTML, _lastEntities));
ui.btnExportJson.addEventListener("click", () => ExportManager.exportJson(graphMgr.cy));
ui.btnExportCsv.addEventListener("click",  () => ExportManager.exportCsv(_lastEntities));
ui.btnExportPng.addEventListener("click",  () => ExportManager.exportPng(graphMgr.cy));

// Highlighter
ui.btnHighlight.addEventListener("click", async () => {
  if (!_lastEntities.length) { setStatus("error", "Analiza texto primero para tener qué resaltar."); return; }
  try {
    setStatus("loading", "Resaltando texto en la página web...");
    await Highlighter.highlightWeb(_lastEntities);
    setStatus("ready", "Texto resaltado en la pestaña activa.");
  } catch(e) {
    setStatus("error", e.message);
  }
});

// Transformers.js Summarizer
let _summarizerPipe = null;
document.getElementById("btnSummarize").addEventListener("click", async () => {
   const text = ui.inputText.value.trim();
   if (!text) return;
   
   const btn = document.getElementById("btnSummarize");
   const box = document.getElementById("summaryBox");
   const txt = document.getElementById("summaryText");
   
   if (typeof pipeline === 'undefined' && !window.pipeline) {
       setStatus("error", "Librería Transformers.js no disponible."); return;
   }
   
   try {
       btn.disabled = true;
       btn.innerHTML = "⏳ Descargando motor IA Xenova/t5-small (~240MB, una vez)...";
       box.style.display = "block";
       txt.innerHTML = "<em>Inicializando motor (la red puede tardar)...</em>";
       
       if (!_summarizerPipe) {
           // Fallback to window.pipeline if using modular CDN builds
           const p = typeof pipeline !== 'undefined' ? pipeline : window.pipeline;
           _summarizerPipe = await p('summarization', 'Xenova/t5-small');
       }
       
       btn.innerHTML = "🧠 Evaluando documento...";
       txt.innerHTML = "<em>Sintetizando...</em>";
       
       // t5-small prefers English, but will attempt to summarize anything.
       const out = await _summarizerPipe(text.slice(0, 1000), { max_new_tokens: 60, min_new_tokens: 15 });
       
       txt.innerHTML = out[0].summary_text;
       btn.innerHTML = "✓ Resumen IA Generado";
   } catch (e) {
       txt.innerHTML = `<span style="color:#ff5f57;">Error al ejecutar el modelo: ${e.message}</span>`;
       btn.innerHTML = "🧠 Generar Resumen T5";
   } finally {
       setTimeout(() => { btn.disabled = false; btn.innerHTML = "🧠 Generar Resumen T5"; }, 3000);
   }
});

// WebLLM Full Tab
document.getElementById("btnOpenWebLLM").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("webllm.html") });
});

function save(data) { try { chrome.storage.local.set(data); } catch(_) {} }
function load() {
  try {
    chrome.storage.local.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.ENGINE, STORAGE_KEYS.DOMAIN], result => {
      if (result[STORAGE_KEYS.ENGINE]) {
        ui.engineSelect.value = result[STORAGE_KEYS.ENGINE];
        manager.setEngine(result[STORAGE_KEYS.ENGINE]);
        handleEngineChange();
      }
      if (result[STORAGE_KEYS.DOMAIN]) {
        ui.domainSelect.value = result[STORAGE_KEYS.DOMAIN];
        manager.setDomain(result[STORAGE_KEYS.DOMAIN]);
      }
      if (result[STORAGE_KEYS.API_KEY]) {
        ui.apiKeyInput.value = result[STORAGE_KEYS.API_KEY];
        manager.setApiKey(result[STORAGE_KEYS.API_KEY]);
      }
    });
  } catch(_) {}
}

function handleEngineChange() {
  manager.setEngine(ui.engineSelect.value);
  ui.apiKeySection.style.display = (ui.engineSelect.value === "heuristic" || ui.engineSelect.value === "transformers") ? "none" : "block";
  updateFooterEngine();
  save({ [STORAGE_KEYS.ENGINE]: ui.engineSelect.value });
}
ui.engineSelect.addEventListener("change", handleEngineChange);
ui.domainSelect.addEventListener("change", () => {
  manager.setDomain(ui.domainSelect.value);
  save({ [STORAGE_KEYS.DOMAIN]: ui.domainSelect.value });
});

ui.btnSaveKey.addEventListener("click", () => {
  const k = ui.apiKeyInput.value.trim();
  if (!k) { setStatus("error","API Key vacía."); return; }
  manager.setApiKey(k);
  save({ [STORAGE_KEYS.API_KEY]: k });
  ui.btnSaveKey.textContent = "✓ Guardada";
  setStatus("ready","API Key guardada correctamente.");
  setTimeout(() => { ui.btnSaveKey.textContent = "Guardar"; }, 2000);
});

ui.btnCapture.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if (!tab?.id) { setStatus("error","No se pudo acceder a la pestaña activa."); return; }
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.getSelection()?.toString() || "" });
    const sel = results?.[0]?.result?.trim();
    if (!sel) { setStatus("error","No hay texto seleccionado."); return; }
    ui.inputText.value = sel;
    setStatus("ready",`Capturado: ${sel.length} caracteres.`);
  } catch(err) { setStatus("error",`Error: ${err.message}`); }
});

ui.btnAnalyze.addEventListener("click", async () => {
  const text = ui.inputText.value.trim();
  if (!text) { setStatus("error","Ingresa o captura texto antes de analizar."); return; }
  setLoading(true); setStatus("loading",`Analizando con motor ${manager.engine}…`); setOutputLoading();
  try {
    const { rendered, entities, relations } = await manager.run(text);
    _lastEntities = entities; // Save for CSV export and Cloud
    setOutput(rendered);
    const elements = graphMgr.build(entities, relations);
    graphMgr.render(elements, ui.layoutSelect.value);
    graphMgr.buildLegend(entities);
    
    // Auto-update cloud if active
    if (ui.panelCloud.style.display === "flex") CloudManager.render(entities);
    
    const nNodes = elements.filter(e => !e.data.source).length;
    const nEdges = elements.filter(e => e.data.source).length;
    setStatus("ready", `Listo · ${entities.length} entidades · ${relations.length} relaciones`);
    updateFooterStats(nNodes, nEdges);
  } catch(err) {
    setOutputError(err.message);
    setStatus("error", err.message.slice(0,70));
  } finally {
    setLoading(false);
  }
});

ui.layoutSelect.addEventListener("change", () => { graphMgr.applyLayout(ui.layoutSelect.value); });
ui.btnFit.addEventListener("click", () => { graphMgr.fit(); });
ui.btnToggle3D.addEventListener("click", () => { graphMgr.toggle3D(); });
ui.btnToggleLgnd.addEventListener("click", () => { graphMgr.toggleLegend(); });
ui.btnCopy.addEventListener("click", async () => {
  if (!_lastPlainText) return;
  try {
    await navigator.clipboard.writeText(_lastPlainText);
    ui.btnCopy.textContent = "✓ Copiado"; ui.btnCopy.classList.add("active-state");
    setTimeout(() => { ui.btnCopy.textContent = "⎘ Copiar"; ui.btnCopy.classList.remove("active-state"); }, 2000);
  } catch(_) { setStatus("error","Error al copiar."); }
});

// Humanizer
document.getElementById("btnHumanize").addEventListener("click", () => {
  const text = ui.inputText.value.trim();
  const output = document.getElementById("humanizerOutput");
  try {
    const result = HumanizerAgent.process(text);
    output.value = result;
    setStatus("ready", "Texto humanizado con éxito.");
  } catch(e) {
    setStatus("error", e.message);
  }
});

(function init() {
  load();
  setStatus("ready","Listo — motor heurístico + grafo Cytoscape activos.");
  updateFooterEngine();
})();
