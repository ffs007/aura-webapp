import { describe, expect, it } from 'vitest';
import { tattooToMarkdown, type TattooPlan } from '@/lib/tattoo';

describe('Tattoo briefing privacy', () => {
  const plan = {
    title: 'Ramo botânico',
    concepts: ['safe', 'intermediate', 'bold'].map(level => ({ level, title: level, description: 'Traço botânico', meaning: 'Crescimento', area: 'Antebraço', size_cm: '8 cm', visibility: 'Ocultável', style: 'Fine line', questions: ['Como preservar espaço?'] })),
    long_term: ['Preservar espaço'], artist_questions: ['Como validar o desenho?'],
    note: 'NOTA_PRIVADA', photos: ['FOTO_PRIVADA'], health: 'SAUDE_PRIVADA',
  } as unknown as TattooPlan;
  it('exports only the selected concept, without private or medical fields', () => {
    const md = tattooToMarkdown(plan, 'safe');
    expect(md).toContain('## safe');
    expect(md).not.toContain('## bold');
    expect(md).not.toContain('NOTA_PRIVADA');
    expect(md).not.toContain('FOTO_PRIVADA');
    expect(md).not.toContain('SAUDE_PRIVADA');
    expect(md).toContain('Gerado por IA');
    expect(md).toContain('permanentes');
  });
});