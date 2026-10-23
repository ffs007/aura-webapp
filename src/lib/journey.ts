export const JOURNEY_GOALS = [
  'Construir confiança profissional', 'Recuperar leveza', 'Expressar criatividade', 'Marcar uma nova fase',
  'Reduzir compras por impulso', 'Usar melhor o que já tenho', 'Imagem coerente com a nova rotina',
] as const;
export const STEP_CATEGORIES: Record<string, string> = {
  cabelo: 'Ajustar cabelo', roupas: 'Montar look de trabalho', maquiagem: 'Testar paleta de maquiagem',
  tatuagem: 'Planejar tatuagem', armario: 'Revisar armário', fotos: 'Preparar fotos', outro: 'Outro passo',
};
export const STEP_STATUSES: Record<string, string> = {
  testing: 'Em teste', approved: 'Aprovado', did_not_work: 'Não funcionou', adapt: 'Quero adaptar',
  later: 'Talvez depois', implemented: 'Já implementado', no_longer_fits: 'Não combina mais comigo',
};
export const STATUS_KEYS = Object.keys(STEP_STATUSES) as (keyof typeof STEP_STATUSES)[];

export type JourneyReport = {
  title: string; summary: string; favorite_choices: string[]; repeated_styles: string[];
  most_used_colors: string[]; confidence_changes: string[]; learnings: string[]; next_invitations: string[];
};

export function journeyToMarkdown(planTitle: string, kind: string, r: JourneyReport): string {
  const list = (t: string, xs: string[]) => `\n## ${t}\n${xs.length ? xs.map(x => `- ${x}`).join('\n') : '- —'}\n`;
  return `# ${r.title}\n\n_${kind === 'quarter' ? 'Relatório trimestral' : 'Meu mês em imagens'} · ${planTitle} · Gerado por IA_\n\n${r.summary}\n`
    + list('Escolhas favoritas', r.favorite_choices) + list('Estilos que se repetem', r.repeated_styles)
    + list('Cores mais usadas', r.most_used_colors) + list('Mudanças que trouxeram confiança', r.confidence_changes)
    + list('Aprendizados', r.learnings) + list('Próximos convites', r.next_invitations)
    + '\n---\nNotas emocionais e fotos não incluídas. Nada foi enviado a terceiros.\n';
}

export const journeyHead = (title: string) => ({ meta: [
  { title: `${title} — Jornada · Aura ID` },
  { name: 'description', content: 'Planos graduais de transformação visual, diário privado e relatórios de evolução.' },
  { property: 'og:title', content: `${title} — Jornada · Aura ID` },
  { property: 'og:description', content: 'Transforme sugestões em pequenos passos e lembre do que funcionou.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
] });
