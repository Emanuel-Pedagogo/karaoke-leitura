const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return "E-mail é obrigatório";
  if (!EMAIL_RE.test(normalized)) return "E-mail inválido";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Senha é obrigatória";
  if (password.length < 6) return "Senha deve ter pelo menos 6 caracteres";
  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Nome deve ter pelo menos 2 caracteres";
  return null;
}
