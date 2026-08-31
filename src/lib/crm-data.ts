export type Estado = "Activo" | "Nuevo" | "En seguimiento" | "Inactivo";

export const kpis = [
  { label: "Leads del día", value: "48", delta: "+12.4%", trend: "up" as const },
  { label: "Conversaciones activas", value: "126", delta: "+8.1%", trend: "up" as const },
  { label: "Oportunidades abiertas", value: "37", delta: "+3.2%", trend: "up" as const },
  { label: "Ventas potenciales", value: "$284,500", delta: "+18.7%", trend: "up" as const },
  { label: "Seguimientos pendientes", value: "19", delta: "-5.0%", trend: "down" as const },
  { label: "Clientes activos", value: "412", delta: "+2.6%", trend: "up" as const },
  { label: "Tasa de conversión", value: "31.8%", delta: "+4.3%", trend: "up" as const },
  { label: "Ingresos proyectados", value: "$96,200", delta: "+9.9%", trend: "up" as const },
];

export const ventasMensuales = [
  { mes: "Ene", ventas: 42000, meta: 38000 },
  { mes: "Feb", ventas: 51000, meta: 44000 },
  { mes: "Mar", ventas: 47500, meta: 48000 },
  { mes: "Abr", ventas: 62000, meta: 52000 },
  { mes: "May", ventas: 58800, meta: 56000 },
  { mes: "Jun", ventas: 71200, meta: 60000 },
  { mes: "Jul", ventas: 83400, meta: 66000 },
  { mes: "Ago", ventas: 96200, meta: 72000 },
];

export const tendencia = [
  { dia: "Lun", conversaciones: 82, leads: 24 },
  { dia: "Mar", conversaciones: 96, leads: 31 },
  { dia: "Mié", conversaciones: 74, leads: 19 },
  { dia: "Jue", conversaciones: 118, leads: 42 },
  { dia: "Vie", conversaciones: 132, leads: 48 },
  { dia: "Sáb", conversaciones: 65, leads: 15 },
  { dia: "Dom", conversaciones: 38, leads: 9 },
];

export const embudo = [
  { etapa: "Conversaciones", valor: 1240, color: "var(--chart-1)" },
  { etapa: "Leads", valor: 640, color: "var(--chart-2)" },
  { etapa: "Calificados", valor: 320, color: "var(--chart-5)" },
  { etapa: "Propuestas", valor: 168, color: "var(--chart-3)" },
  { etapa: "Negociación", valor: 92, color: "var(--chart-4)" },
  { etapa: "Ganados", valor: 41, color: "var(--chart-1)" },
];

export const origenes = [
  { origen: "WhatsApp", leads: 486 },
  { origen: "Meta Ads", leads: 264 },
  { origen: "Sitio web", leads: 198 },
  { origen: "Referidos", leads: 132 },
  { origen: "Google Ads", leads: 96 },
];

export type Contacto = {
  id: string;
  nombre: string;
  empresa: string;
  telefono: string;
  correo: string;
  estado: Estado;
  fuente: string;
  creado: string;
  ultimaActividad: string;
};

export const contactos: Contacto[] = [
  {
    id: "C-1041",
    nombre: "María Fernanda Rojas",
    empresa: "Andes Logistics",
    telefono: "+591 700 12345",
    correo: "mf.rojas@andeslog.com",
    estado: "Activo",
    fuente: "WhatsApp",
    creado: "12 Ago 2026",
    ultimaActividad: "Hace 12 min",
  },
  {
    id: "C-1042",
    nombre: "Carlos Villarroel",
    empresa: "Nexa Constructora",
    telefono: "+591 712 88320",
    correo: "cvillarroel@nexa.bo",
    estado: "Nuevo",
    fuente: "Meta Ads",
    creado: "24 Ago 2026",
    ultimaActividad: "Hace 1 h",
  },
  {
    id: "C-1043",
    nombre: "Daniela Peñaranda",
    empresa: "Clínica Sur",
    telefono: "+591 763 41100",
    correo: "dpenaranda@clinicasur.com",
    estado: "En seguimiento",
    fuente: "Sitio web",
    creado: "05 Ago 2026",
    ultimaActividad: "Ayer",
  },
  {
    id: "C-1044",
    nombre: "Jorge Mendoza",
    empresa: "Tech Bolivia SRL",
    telefono: "+591 705 99012",
    correo: "jmendoza@techbo.com",
    estado: "Activo",
    fuente: "Referido",
    creado: "18 Jul 2026",
    ultimaActividad: "Hace 3 h",
  },
  {
    id: "C-1045",
    nombre: "Lucía Gutiérrez",
    empresa: "Retail Prime",
    telefono: "+591 778 20145",
    correo: "lgutierrez@retailprime.com",
    estado: "Inactivo",
    fuente: "Google Ads",
    creado: "02 Jun 2026",
    ultimaActividad: "Hace 21 días",
  },
  {
    id: "C-1046",
    nombre: "Andrés Camacho",
    empresa: "Grupo Altiplano",
    telefono: "+591 733 55008",
    correo: "acamacho@altiplano.bo",
    estado: "En seguimiento",
    fuente: "WhatsApp",
    creado: "27 Ago 2026",
    ultimaActividad: "Hace 40 min",
  },
  {
    id: "C-1047",
    nombre: "Paola Arispe",
    empresa: "EduSmart",
    telefono: "+591 749 30271",
    correo: "parispe@edusmart.io",
    estado: "Nuevo",
    fuente: "Sitio web",
    creado: "29 Ago 2026",
    ultimaActividad: "Hace 8 min",
  },
  {
    id: "C-1048",
    nombre: "Rodrigo Salazar",
    empresa: "Fintech Andina",
    telefono: "+591 717 66430",
    correo: "rsalazar@fintechandina.com",
    estado: "Activo",
    fuente: "Referido",
    creado: "14 Ago 2026",
    ultimaActividad: "Hace 2 h",
  },
];

export type LeadEtapa =
  | "Nuevo"
  | "Contactado"
  | "Calificado"
  | "Propuesta"
  | "Negociación"
  | "Ganado"
  | "Perdido";

export const etapas: LeadEtapa[] = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta",
  "Negociación",
  "Ganado",
  "Perdido",
];

export type Lead = {
  id: string;
  nombre: string;
  empresa: string;
  valor: number;
  responsable: string;
  score: number;
  etapa: LeadEtapa;
  canal: string;
};

export const leadsIniciales: Lead[] = [
  { id: "L-01", nombre: "María Fernanda Rojas", empresa: "Andes Logistics", valor: 18500, responsable: "Ana Vargas", score: 88, etapa: "Nuevo", canal: "WhatsApp" },
  { id: "L-02", nombre: "Paola Arispe", empresa: "EduSmart", valor: 7400, responsable: "Luis Peña", score: 62, etapa: "Nuevo", canal: "Web" },
  { id: "L-03", nombre: "Carlos Villarroel", empresa: "Nexa Constructora", valor: 32000, responsable: "Ana Vargas", score: 74, etapa: "Contactado", canal: "Meta Ads" },
  { id: "L-04", nombre: "Andrés Camacho", empresa: "Grupo Altiplano", valor: 12300, responsable: "Diego Ruiz", score: 69, etapa: "Contactado", canal: "WhatsApp" },
  { id: "L-05", nombre: "Daniela Peñaranda", empresa: "Clínica Sur", valor: 24800, responsable: "Luis Peña", score: 81, etapa: "Calificado", canal: "Web" },
  { id: "L-06", nombre: "Jorge Mendoza", empresa: "Tech Bolivia SRL", valor: 41000, responsable: "Ana Vargas", score: 92, etapa: "Propuesta", canal: "Referido" },
  { id: "L-07", nombre: "Rodrigo Salazar", empresa: "Fintech Andina", valor: 56000, responsable: "Diego Ruiz", score: 85, etapa: "Negociación", canal: "Referido" },
  { id: "L-08", nombre: "Lucía Gutiérrez", empresa: "Retail Prime", valor: 9800, responsable: "Luis Peña", score: 34, etapa: "Perdido", canal: "Google Ads" },
  { id: "L-09", nombre: "Sofía Alarcón", empresa: "Vitalis Pharma", valor: 28900, responsable: "Ana Vargas", score: 90, etapa: "Ganado", canal: "WhatsApp" },
  { id: "L-10", nombre: "Iván Torrico", empresa: "AgroSur", valor: 15600, responsable: "Diego Ruiz", score: 58, etapa: "Calificado", canal: "Meta Ads" },
];

export type Conversacion = {
  id: string;
  nombre: string;
  empresa: string;
  preview: string;
  hora: string;
  noLeidos: number;
  estado: LeadEtapa;
  score: number;
  telefono: string;
  mensajes: { de: "cliente" | "agente"; texto: string; hora: string }[];
  notasIA: string[];
};

export const conversaciones: Conversacion[] = [
  {
    id: "W-1",
    nombre: "María Fernanda Rojas",
    empresa: "Andes Logistics",
    preview: "Perfecto, ¿me envías la propuesta hoy?",
    hora: "10:42",
    noLeidos: 2,
    estado: "Propuesta",
    score: 88,
    telefono: "+591 700 12345",
    mensajes: [
      { de: "cliente", texto: "Hola, vi su plataforma de automatización comercial.", hora: "10:20" },
      { de: "agente", texto: "¡Hola María! Gracias por escribir. ¿Cuántos agentes atienden hoy tu WhatsApp?", hora: "10:23" },
      { de: "cliente", texto: "Somos 6 personas y perdemos muchos mensajes.", hora: "10:31" },
      { de: "agente", texto: "Con ZOLMYRA centralizas todo y la IA califica cada lead automáticamente.", hora: "10:35" },
      { de: "cliente", texto: "Perfecto, ¿me envías la propuesta hoy?", hora: "10:42" },
    ],
    notasIA: [
      "Probabilidad de cierre: 85%",
      "Intención detectada: compra inmediata",
      "Recomendación: enviar propuesta antes de las 18:00",
    ],
  },
  {
    id: "W-2",
    nombre: "Carlos Villarroel",
    empresa: "Nexa Constructora",
    preview: "Lo reviso con el directorio y te aviso.",
    hora: "09:58",
    noLeidos: 0,
    estado: "Negociación",
    score: 74,
    telefono: "+591 712 88320",
    mensajes: [
      { de: "agente", texto: "Buen día Carlos, te comparto el resumen del plan Enterprise.", hora: "09:30" },
      { de: "cliente", texto: "Gracias. El precio está algo alto para este trimestre.", hora: "09:44" },
      { de: "agente", texto: "Podemos escalar por fases, iniciando con 3 licencias.", hora: "09:51" },
      { de: "cliente", texto: "Lo reviso con el directorio y te aviso.", hora: "09:58" },
    ],
    notasIA: [
      "Probabilidad de cierre: 61%",
      "Objeción principal: presupuesto",
      "Recomendación: ofrecer plan por fases con descuento anual",
    ],
  },
  {
    id: "W-3",
    nombre: "Paola Arispe",
    empresa: "EduSmart",
    preview: "¿Tienen integración con N8N?",
    hora: "Ayer",
    noLeidos: 1,
    estado: "Calificado",
    score: 62,
    telefono: "+591 749 30271",
    mensajes: [
      { de: "cliente", texto: "Hola, ¿tienen integración con N8N?", hora: "18:12" },
      { de: "agente", texto: "Sí, incluimos webhooks nativos y nodos listos para usar.", hora: "18:20" },
    ],
    notasIA: ["Probabilidad de cierre: 47%", "Perfil técnico: alto", "Recomendación: agendar demo técnica"],
  },
  {
    id: "W-4",
    nombre: "Rodrigo Salazar",
    empresa: "Fintech Andina",
    preview: "Firmamos el lunes.",
    hora: "Ayer",
    noLeidos: 0,
    estado: "Negociación",
    score: 85,
    telefono: "+591 717 66430",
    mensajes: [
      { de: "cliente", texto: "El contrato ya está en legal.", hora: "16:02" },
      { de: "agente", texto: "Excelente Rodrigo, quedo pendiente.", hora: "16:10" },
      { de: "cliente", texto: "Firmamos el lunes.", hora: "16:22" },
    ],
    notasIA: ["Probabilidad de cierre: 93%", "Etapa: cierre legal", "Recomendación: preparar onboarding"],
  },
];

export type Oportunidad = {
  id: string;
  cliente: string;
  producto: string;
  valor: number;
  probabilidad: number;
  estado: LeadEtapa;
  cierre: string;
};

export const oportunidades: Oportunidad[] = [
  { id: "O-2201", cliente: "Andes Logistics", producto: "ZOLMYRA Growth", valor: 18500, probabilidad: 85, estado: "Propuesta", cierre: "05 Sep 2026" },
  { id: "O-2202", cliente: "Nexa Constructora", producto: "ZOLMYRA Enterprise", valor: 32000, probabilidad: 61, estado: "Negociación", cierre: "18 Sep 2026" },
  { id: "O-2203", cliente: "Fintech Andina", producto: "ZOLMYRA Enterprise + IA", valor: 56000, probabilidad: 93, estado: "Negociación", cierre: "02 Sep 2026" },
  { id: "O-2204", cliente: "Clínica Sur", producto: "ZOLMYRA Growth", valor: 24800, probabilidad: 72, estado: "Calificado", cierre: "24 Sep 2026" },
  { id: "O-2205", cliente: "Tech Bolivia SRL", producto: "Agente IA WhatsApp", valor: 41000, probabilidad: 78, estado: "Propuesta", cierre: "12 Sep 2026" },
  { id: "O-2206", cliente: "EduSmart", producto: "ZOLMYRA Starter", valor: 7400, probabilidad: 44, estado: "Calificado", cierre: "30 Sep 2026" },
  { id: "O-2207", cliente: "Vitalis Pharma", producto: "ZOLMYRA Growth", valor: 28900, probabilidad: 100, estado: "Ganado", cierre: "22 Ago 2026" },
];

export const insightsIA = [
  {
    cliente: "Andes Logistics",
    resumen:
      "Empresa de logística con 6 agentes atendiendo WhatsApp de forma manual. Necesita centralizar la bandeja y automatizar la calificación de leads.",
    intencion: "Compra inmediata",
    score: 88,
    probabilidad: 85,
    accion: "Enviar propuesta comercial hoy antes de las 18:00",
  },
  {
    cliente: "Fintech Andina",
    resumen:
      "Contrato en revisión legal, decisión tomada por el comité. Riesgo bajo, requiere acompañamiento de onboarding técnico.",
    intencion: "Cierre en curso",
    score: 93,
    probabilidad: 93,
    accion: "Preparar kickoff de implementación para el lunes",
  },
  {
    cliente: "Nexa Constructora",
    resumen:
      "Interés confirmado pero con objeción de presupuesto trimestral. Sensible al precio, valora escalabilidad por fases.",
    intencion: "Objeción de precio",
    score: 74,
    probabilidad: 61,
    accion: "Recomendamos contactar en 24 horas con plan escalonado",
  },
  {
    cliente: "EduSmart",
    resumen:
      "Perfil técnico evaluando integraciones. Consulta recurrente sobre N8N y APIs; aún no define presupuesto.",
    intencion: "Investigación técnica",
    score: 62,
    probabilidad: 47,
    accion: "Agendar demo técnica con equipo de integraciones",
  },
];

export const flujos = [
  {
    nombre: "Captura y calificación de leads",
    estado: "Activo",
    ejecuciones: 1284,
    nodos: [
      { tipo: "Webhook", titulo: "WhatsApp Business API", detalle: "POST /webhook/whatsapp" },
      { tipo: "IA", titulo: "Detección de intención", detalle: "OpenAI GPT — clasificación" },
      { tipo: "Lógica", titulo: "Lead Scoring", detalle: "score > 70 → comercial" },
      { tipo: "CRM", titulo: "Crear lead", detalle: "Pipeline → Nuevo" },
    ],
  },
  {
    nombre: "Seguimiento automático 24h",
    estado: "Activo",
    ejecuciones: 642,
    nodos: [
      { tipo: "Cron", titulo: "Cada 6 horas", detalle: "0 */6 * * *" },
      { tipo: "Query", titulo: "Leads sin respuesta", detalle: "última actividad > 24h" },
      { tipo: "IA", titulo: "Redactar mensaje", detalle: "tono consultivo" },
      { tipo: "API", titulo: "Enviar WhatsApp", detalle: "template: seguimiento_01" },
    ],
  },
  {
    nombre: "Alerta de oportunidad caliente",
    estado: "Pausado",
    ejecuciones: 187,
    nodos: [
      { tipo: "Evento", titulo: "Score ≥ 85", detalle: "trigger CRM" },
      { tipo: "Lógica", titulo: "Asignar responsable", detalle: "round robin" },
      { tipo: "API", titulo: "Notificar Slack", detalle: "#ventas-hot" },
    ],
  },
];
