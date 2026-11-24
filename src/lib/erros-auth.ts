/**
 * Tradução dos erros do Supabase Auth para português de gente — única fonte
 * para auth, redefinição de senha e configurações (nada de inglês cru na tela).
 *
 * Inclui a política de senha REAL do projeto (configurada no painel Supabase):
 * mínimo 8 caracteres + letra maiúscula + minúscula + número, além da proteção
 * de senha vazada (HaveIBeenPwned), que devolve "Password is known to be weak
 * and easy to guess" sem nenhuma pista de "password should".
 */

const ERROS_AUTH: [RegExp, string][] = [
  // Política de caracteres do Supabase (mensagem começa com "Password should contain…")
  [/password should contain|at least one character of each|weak password|password should/i,
    "A senha precisa ter pelo menos 8 caracteres, com letra maiúscula, minúscula e número."],
  // Senha vazada/comum (Leaked Password Protection) — sem menção a "should"
  [/known to be weak|easy to guess|pwned/i,
    "Essa senha é muito comum e já apareceu em vazamentos. Misture palavras incomuns com números e símbolos."],
  [/at least 6 characters/i, "A senha precisa ter pelo menos 8 caracteres."],
  [/same (as|email|password)|should be different/i, "Escolha um valor diferente do atual."],
  [/invalid login credentials/i, "E-mail ou senha incorretos. Confira e tente de novo."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar — olhe a caixa de entrada (e o spam)."],
  [/already (been )?registered|already registered/i, "Este e-mail já tem conta. Toque em “Já tem conta? Entre”."],
  // Falha de envio (SMTP): cadastro com confirmação ou link de recuperação
  [/error sending (confirmation|recovery|invite) email|smtp/i,
    "Não conseguimos enviar o e-mail agora. Aguarde alguns minutos e tente de novo — se persistir, fale com a gente."],
  [/rate limit|too many|only request this after/i, "Muitas tentativas em pouco tempo. Respire e tente de novo em alguns minutos."],
  [/unable to validate|validation failed|invalid email/i, "Confira o e-mail digitado."],
  [/session|jwt|not authenticated|expired|refresh token/i, "Sua sessão ou link expirou. Entre novamente (ou peça um novo link)."],
];

/** Traduz a mensagem do Supabase; sem correspondência, usa o fallback da rota. */
export function traduzErroAuth(mensagem: string, fallback = "Algo deu errado. Tente novamente."): string {
  return ERROS_AUTH.find(([padrao]) => padrao.test(mensagem))?.[1] ?? fallback;
}

/**
 * Checagem client-side da política de senha (mesma regra do painel Supabase).
 * Devolve a frase em português com o que falta, ou null se a senha serve.
 */
export function mensagemSenhaFraca(senha: string): string | null {
  const faltando: string[] = [];
  if (senha.length < 8) faltando.push("8 caracteres");
  if (!/[a-z]/.test(senha)) faltando.push("uma letra minúscula");
  if (!/[A-Z]/.test(senha)) faltando.push("uma letra maiúscula");
  if (!/\d/.test(senha)) faltando.push("um número");
  if (faltando.length === 0) return null;
  const ultimo = faltando[faltando.length - 1] ?? "";
  const lista = faltando.length === 1 ? ultimo : `${faltando.slice(0, -1).join(", ")} e ${ultimo}`;
  return `Sua senha precisa ter ${lista}.`;
}
