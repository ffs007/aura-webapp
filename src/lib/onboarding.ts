// Definição do formulário inicial (perfil visual). Dados salvos em visual_profiles.data.
export type Opt = { value: string; label: string; hint?: string; color?: string };
export type OField = {
  key: string; label: string; hint: string; example?: string;
  type: "text" | "area" | "slider" | "cards" | "colors" | "number";
  options?: Opt[]; suggested: string | number; unit?: string; min?: string; max?: string; optional?: boolean;
};
export type OStep = { id: string; title: string; tip: string; quick: boolean; fields: OField[] };
export type Mode = "quick" | "assisted";
export type Data = Record<string, string | number | string[] | undefined> & { _pending?: string[]; _last_step?: string };

export const BODY_SHAPES: Opt[] = [
  { value: "retangular", label: "Retangular", hint: "Ombros, cintura e quadril em linha parecida" },
  { value: "triangulo", label: "Triângulo", hint: "Quadril um pouco mais largo que os ombros" },
  { value: "triangulo_invertido", label: "Triângulo invertido", hint: "Ombros um pouco mais largos que o quadril" },
  { value: "oval", label: "Oval", hint: "Volume mais concentrado no meio do corpo" },
  { value: "ampulheta", label: "Ampulheta", hint: "Ombros e quadril parecidos, cintura marcada" },
];
export const SKIN: Opt[] = [
  { value: "muito_clara", label: "Muito clara", color: "#f3d9c6" }, { value: "clara", label: "Clara", color: "#e8c0a0" },
  { value: "media", label: "Média", color: "#c99673" }, { value: "morena", label: "Morena", color: "#a26e4b" },
  { value: "escura", label: "Escura", color: "#7a4a2e" }, { value: "muito_escura", label: "Muito escura", color: "#4e2d1b" },
];
export const UNDERTONES: Opt[] = [
  { value: "quente", label: "Quente", hint: "Veias mais esverdeadas; dourado costuma combinar" },
  { value: "frio", label: "Frio", hint: "Veias mais azuladas; prateado costuma combinar" },
  { value: "neutro", label: "Neutro", hint: "Mistura dos dois; os dois metais funcionam" },
];
export const EYES: Opt[] = [
  { value: "castanho_escuro", label: "Castanho escuro", color: "#3b2416" }, { value: "castanho_claro", label: "Castanho claro", color: "#7b5230" },
  { value: "mel", label: "Mel", color: "#a87a35" }, { value: "verde", label: "Verde", color: "#5d7a46" },
  { value: "azul", label: "Azul", color: "#5b84a8" }, { value: "cinza", label: "Cinza", color: "#8a9096" },
];
export const HAIR_COLORS: Opt[] = [
  { value: "preto", label: "Preto", color: "#1c1512" }, { value: "castanho_escuro", label: "Castanho escuro", color: "#3d2618" },
  { value: "castanho_claro", label: "Castanho claro", color: "#7a5236" }, { value: "loiro", label: "Loiro", color: "#d2ae6d" },
  { value: "ruivo", label: "Ruivo", color: "#a4472a" }, { value: "grisalho", label: "Grisalho/branco", color: "#c9c6c1" },
  { value: "colorido", label: "Colorido", color: "#7a4c8c" },
];
export const HAIR_TEXTURES: Opt[] = ["Liso", "Ondulado", "Cacheado", "Crespo"].map((v) => ({ value: v, label: v }));
const SIZES = (a: string[]): Opt[] => a.map((v) => ({ value: v, label: v }));
export const SIZE_TOPS = ["PP", "P", "M", "G", "GG", "XGG"];
export const SIZE_BOTTOMS = ["34", "36", "38", "40", "42", "44", "46", "48", "50+"];
export const PALETTE: Opt[] = [
  { value: "branco", label: "Branco", color: "#f4efe6" }, { value: "preto", label: "Preto", color: "#1f1b1a" }, { value: "cinza", label: "Cinza", color: "#8d8a86" },
  { value: "bege", label: "Bege", color: "#d6c3a3" }, { value: "marrom", label: "Marrom", color: "#6b4a33" }, { value: "azul_marinho", label: "Azul-marinho", color: "#24324f" },
  { value: "jeans", label: "Jeans", color: "#4f6d8f" }, { value: "verde", label: "Verde", color: "#5d7348" }, { value: "vinho", label: "Vinho", color: "#6e2335" },
  { value: "terracota", label: "Terracota", color: "#b5603e" }, { value: "mostarda", label: "Mostarda", color: "#c99a2e" }, { value: "rosa", label: "Rosa", color: "#d99aa5" },
];
const COLOR_WORDS: [RegExp, string][] = [
  [/branc|off|creme|marfim/, "#f4efe6"], [/pret/, "#1f1b1a"], [/cinz|grafite/, "#8d8a86"], [/beg|nude|caqui|areia/, "#d6c3a3"],
  [/marrom|caramelo|chocolate|camel/, "#6b4a33"], [/marinho/, "#24324f"], [/jeans|denim/, "#4f6d8f"], [/azul/, "#4a72a8"],
  [/verde|oliva|militar/, "#5d7348"], [/vinho|bord/, "#6e2335"], [/vermelh/, "#b23a32"], [/terracot|ferrugem|laranj/, "#b5603e"],
  [/mostard|amarel/, "#c99a2e"], [/rosa|pink/, "#d99aa5"], [/roxo|lilás|lilas|violeta/, "#7a4c8c"],
];
/** Converte o nome livre da cor de uma peça em cor de exibição. */
export function colorFromName(name: string | null | undefined): string | undefined {
  const n = (name ?? "").toLowerCase();
  if (!n) return undefined;
  if (/^#[0-9a-f]{6}$/.test(n)) return n;
  return COLOR_WORDS.find(([r]) => r.test(n))?.[1] ?? "#9a8f86";
}

const t = (key: string, label: string, hint: string, example: string, suggested = ""): OField => ({ key, label, hint, example, type: "text", suggested });
const a = (key: string, label: string, hint: string, example: string, suggested = ""): OField => ({ key, label, hint, example, type: "area", suggested });

export const STEPS: OStep[] = [
  { id: "goals", quick: true, title: "O que você gostaria que sua imagem expressasse?", tip: "Pense em como quer se sentir, não em regras.", fields: [
    { key: "presentation", label: "Estrutura das sugestões", hint: "Uma preferência de estilo, não uma definição de identidade. Você pode trocar quando quiser.", type: "cards", options: [{ value: "masculine", label: "Masculino" }, { value: "feminine", label: "Feminino" }], suggested: "" },
    { key: "makeup_preference", label: "Maquiagem nas combinações", hint: "Só incluiremos se você quiser.", type: "cards", options: [{ value: "yes", label: "Quero incluir" }, { value: "no", label: "Não quero" }], suggested: "no" },
    { key: "beard_preference", label: "Barba nas combinações", hint: "Sem barba também é uma escolha válida.", type: "cards", options: [{ value: "yes", label: "Tenho / quero explorar" }, { value: "no", label: "Sem barba" }], suggested: "" },
    t("accessory_preferences", "Acessórios que você usa", "Inclua também o que não quer receber.", "relógio e óculos; não uso bolsa"),
    a("goals", "Objetivos de imagem", "Uma ou duas frases bastam.", "me sentir à vontade no trabalho com pouco esforço", "Me sentir bem e à vontade no dia a dia"),
    { ...a("social_goals", "E na vida social?", "Opcional: pode ser diferente do trabalho.", "mais leveza nos fins de semana"), optional: true },
  ] },
  { id: "body", quick: true, title: "Seu corpo, do seu jeito", tip: "Nenhum formato é melhor que outro — isso só ajuda a sugerir caimentos.", fields: [
    { key: "body_shape", label: "Formato do corpo", hint: "Escolha o desenho que parece mais com você. Se não souber, deixamos Retangular, que é o mais comum.", type: "cards", options: BODY_SHAPES, suggested: "retangular" },
    { key: "height_cm", label: "Altura", hint: "Aproximada já ajuda.", example: "165", type: "number", unit: "cm", suggested: 165 },
    { key: "weight_kg", label: "Peso (opcional)", hint: "Só se quiser. Nunca é usado para julgar, apenas para ajustar tamanhos.", example: "65", type: "number", unit: "kg", suggested: "", optional: true },
  ] },
  { id: "sizes", quick: true, title: "Tamanhos que você costuma usar", tip: "Se varia por loja, escolha o que serve na maioria das vezes.", fields: [
    { key: "top_size", label: "Blusas e camisas", hint: "O tamanho da etiqueta.", type: "cards", options: SIZES(SIZE_TOPS), suggested: "M" },
    { key: "bottom_size", label: "Calças", hint: "Numeração brasileira.", type: "cards", options: SIZES(SIZE_BOTTOMS), suggested: "40" },
    { key: "shoe_size", label: "Calçado", hint: "Numeração brasileira.", example: "37", type: "number", suggested: 37 },
  ] },
  { id: "colors", quick: true, title: "Suas cores", tip: "Olhe em luz natural, perto de uma janela.", fields: [
    { key: "skin_tone", label: "Tom de pele", hint: "Toque na cor mais próxima.", type: "colors", options: SKIN, suggested: "media" },
    { key: "undertone", label: "Subtom", hint: "Olhe as veias do pulso. Se não souber, Neutro funciona bem.", type: "cards", options: UNDERTONES, suggested: "neutro" },
    { key: "eye_color", label: "Cor dos olhos", hint: "Toque na cor mais próxima.", type: "colors", options: EYES, suggested: "castanho_escuro" },
  ] },
  { id: "hair", quick: true, title: "Seu cabelo hoje", tip: "Vale a cor atual, mesmo que seja pintada.", fields: [
    { key: "hair_color", label: "Cor do cabelo", hint: "A cor que está hoje.", type: "colors", options: HAIR_COLORS, suggested: "castanho_escuro" },
    { key: "hair_texture", label: "Textura", hint: "Como o fio seca naturalmente, sem escova.", type: "cards", options: HAIR_TEXTURES, suggested: "Ondulado" },
  ] },
  { id: "context", quick: false, title: "Seu contexto do dia a dia", tip: "Ajuda a sugerir o que cabe na sua rotina.", fields: [
    t("profession", "Profissão", "Só o nome já basta.", "arquiteta"),
    t("dress_code", "Dress code", "Se não houver, escreva 'nenhum'.", "esporte fino", "nenhum"),
    t("climate", "Cidade / clima", "Cidade ou como é o clima.", "São Paulo, quente e úmido"),
  ] },
  { id: "limits", quick: true, title: "Limites práticos", tip: "Sem certo ou errado: é para respeitar seu ritmo.", fields: [
    t("budget", "Orçamento", "Uma faixa aproximada.", "R$ 300/mês", "modesto"),
    { key: "maintenance", label: "Tolerância à manutenção", hint: "Quanto tempo topa investir.", type: "slider", suggested: 3, min: "Mínima", max: "Gosto de investir tempo" },
    { key: "comfort", label: "Conforto com mudanças", hint: "Passos pequenos ou algo grande.", type: "slider", suggested: 3, min: "Passos pequenos", max: "Topo algo grande" },
  ] },
  { id: "taste", quick: false, title: "O que você ama e o que não quer", tip: "Referências livres: cores, épocas, pessoas.", fields: [
    a("preferred", "Estilos, cores e referências de que gosta", "Palavras soltas valem.", "tons terrosos, anos 70, linho"),
    a("rejected", "Coisas que nunca quer ver sugeridas", "Vamos respeitar sempre.", "neon, contorno pesado"),
  ] },
  { id: "deep", quick: false, title: "Rotina e limites pessoais (opcional)", tip: "Compartilhe só o que quiser. Nunca inferimos isso.", fields: [
    { ...a("routine", "Um dia típico", "Tempo de manhã, deslocamento, atividades.", "10 minutos de manhã, vou de bicicleta"), optional: true },
    { ...a("culture", "Algo cultural, religioso ou pessoal a respeitar", "Opcional.", "não uso decotes"), optional: true },
    { ...a("emotional_limits", "Temas sensíveis para você", "Opcional.", "não sugerir nada sobre peso"), optional: true },
  ] },
];

export const stepsFor = (mode: Mode) => STEPS.filter((s) => mode === "assisted" || s.quick);
export const allFields = () => STEPS.flatMap((s) => s.fields);
export const fieldByKey = (k: string) => allFields().find((f) => f.key === k);
export const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

/**
 * Campos condicionais só aparecem quando a apresentação escolhida faz sentido.
 * Sem apresentação definida, os dois reaparecem.
 */
export function isFieldVisible(key: string, presentation: unknown): boolean {
  if (key === "beard_preference") return presentation !== "feminine";
  if (key === "makeup_preference") return presentation !== "masculine";
  return true;
}

/** Campos do passo que fazem sentido para as respostas atuais. */
export function visibleFields(step: OStep, data: Data): OField[] {
  return step.fields.filter((f) => isFieldVisible(f.key, data["presentation"]));
}

/** Campos obrigatórios sem valor nas etapas visíveis viram pendências. */
export function computePending(data: Data, mode: Mode): string[] {
  const skipped = new Set(data._pending ?? []);
  const out: string[] = [];
  for (const s of stepsFor(mode)) for (const f of s.fields) {
    if (!isFieldVisible(f.key, data["presentation"])) continue;
    if (f.optional) continue;
    if (isEmpty(data[f.key]) || skipped.has(f.key)) out.push(f.key);
  }
  return out;
}

/** Avisos gentis — nunca bloqueiam o envio. */
export function coherence(data: Data): { key: string; msg: string }[] {
  const out: { key: string; msg: string }[] = [];
  const h = Number(data["height_cm"]), w = Number(data["weight_kg"]), shoe = Number(data["shoe_size"]);
  if (data["height_cm"] && (h < 120 || h > 220)) out.push({ key: "height_cm", msg: "Confere a altura? Está em centímetros (ex.: 165)." });
  if (data["weight_kg"] && (w < 30 || w > 250)) out.push({ key: "weight_kg", msg: "Confere o peso? Está em quilos (ex.: 65)." });
  if (h && w && h >= 120 && w >= 30) {
    const bmi = w / (h / 100) ** 2;
    if (bmi < 13 || bmi > 70) out.push({ key: "weight_kg", msg: "Altura e peso parecem trocados ou com um dígito a mais. Quer conferir?" });
  }
  if (data["shoe_size"] && (shoe < 30 || shoe > 50)) out.push({ key: "shoe_size", msg: "Confere o calçado? Usamos numeração brasileira (ex.: 37)." });
  return out;
}

const TIPS: Record<string, string[]> = {
  retangular: ["Cintos e recortes na cintura criam desenho, se você quiser.", "Camadas e sobreposições trazem movimento.", "Peças retas também ficam ótimas: a escolha é sua."],
  triangulo: ["Detalhes nos ombros e decotes equilibram, se for sua vontade.", "Calças de corte reto ou flare alongam.", "Saias evasê costumam vestir com conforto."],
  triangulo_invertido: ["Volume ou cores na parte de baixo criam equilíbrio.", "Decotes em V suavizam a linha dos ombros.", "Calças pantalona e wide leg combinam bem."],
  oval: ["Tecidos fluidos e linhas verticais alongam.", "Terceira peça aberta cria uma moldura.", "Decote em V e golas abertas valorizam o rosto."],
  ampulheta: ["Peças que acompanham a cintura mostram sua forma, se quiser.", "Envelope e transpassado são aliados.", "Tecidos com caimento evitam excesso de volume."],
};
export function fitTips(data: Data): string[] {
  const shapeTips = TIPS[String(data["body_shape"] ?? "retangular")] ?? [];
  const tips = data["presentation"] === "masculine" ? ["Experimente camisas e polos com liberdade nos ombros.", "Compare calças retas ou amplas conforme seu gosto.", "Confira o caimento sentado e em pé antes de escolher o tamanho."] : [...shapeTips];
  const u = data["undertone"];
  if (u === "quente") tips.push("Tons terrosos, mostarda e dourado costumam acender sua pele.");
  if (u === "frio") tips.push("Azuis, vinho e prateado costumam harmonizar com você.");
  if (u === "neutro") tips.push("Você transita bem entre tons quentes e frios.");
  const h = Number(data["height_cm"]);
  if (h && h < 160) tips.push("Monocromia de cima a baixo alonga a silhueta.");
  if (h && h > 178) tips.push("Contrastes na cintura e barras dobradas brincam com a proporção.");
  return tips.slice(0, 3);
}

export const ENCOURAGE = ["Ótimo começo!", "Você está indo muito bem.", "Já dá para ver seu estilo aparecendo.", "Quase lá!", "Mais um passo e pronto."];
export const optLabel = (k: string, v: unknown) => fieldByKey(k)?.options?.find((o) => o.value === v)?.label ?? (isEmpty(v) ? "—" : String(v));
export const optColor = (opts: Opt[], v: unknown, fallback: string) => opts.find((o) => o.value === v)?.color ?? fallback;
