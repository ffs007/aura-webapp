import { describe, expect, it } from 'vitest';
import { journeyToMarkdown } from '@/lib/journey';
describe('journeyToMarkdown', () => {
  it('exports report content without private notes', () => {
    const md = journeyToMarkdown('Plano', 'month', { title: 'Meu mês', summary: 'Resumo', favorite_choices: ['Coque'], repeated_styles: [], most_used_colors: ['Terracota'], confidence_changes: [], learnings: ['Menos é mais'], next_invitations: [] });
    expect(md).toContain('Meu mês em imagens'); expect(md).toContain('Terracota'); expect(md).toContain('Notas emocionais e fotos não incluídas');
  });
});
