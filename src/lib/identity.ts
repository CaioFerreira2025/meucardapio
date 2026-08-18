// Normalização e validação de CPF/CNPJ e telefone.
//
// Esses dois valores são a CHAVE do teste gratuito único (ver TrialClaim no
// schema e src/app/api/register/route.ts): sem normalizar, "123.456.789-09"
// e "12345678909" seriam documentos diferentes e o mesmo CPF ganharia
// quantos testes quisesse só variando a pontuação. Por isso tudo é
// guardado e comparado apenas em dígitos.

/** Só os dígitos, o formato canônico usado no banco e nas comparações. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Dígitos verificadores de CPF: cada um é a soma ponderada dos dígitos
// anteriores, módulo 11 (resto 0 ou 1 vira dígito 0).
function isValidCpf(digits: string): boolean {
  if (digits.length !== 11) return false;
  // Sequências repetidas (00000000000, 11111111111...) passam no cálculo do
  // dígito verificador mas não são CPFs reais — precisam ser barradas à mão.
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}

// Dígitos verificadores de CNPJ: mesma ideia do CPF, com pesos que ciclam
// de 2 a 9 da direita para a esquerda.
function isValidCnpj(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const checkDigit = (length: number) => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * weight;
      weight = weight - 1 < 2 ? 9 : weight - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return checkDigit(12) === Number(digits[12]) && checkDigit(13) === Number(digits[13]);
}

export type DocumentKind = "cpf" | "cnpj";

export type ParsedDocument =
  | { ok: true; digits: string; kind: DocumentKind }
  | { ok: false; error: string };

/**
 * Valida CPF (11 dígitos) ou CNPJ (14 dígitos) conferindo os dígitos
 * verificadores — não só o tamanho. Isso importa aqui: se aceitássemos
 * qualquer sequência de 11 números, burlar o teste único seria digitar
 * "11111111111", "11111111112" e assim por diante.
 */
export function parseDocument(raw: string): ParsedDocument {
  const digits = onlyDigits(raw);

  if (digits.length === 0) return { ok: false, error: "Informe seu CPF ou CNPJ" };
  if (digits.length === 11) {
    return isValidCpf(digits)
      ? { ok: true, digits, kind: "cpf" }
      : { ok: false, error: "CPF inválido" };
  }
  if (digits.length === 14) {
    return isValidCnpj(digits)
      ? { ok: true, digits, kind: "cnpj" }
      : { ok: false, error: "CNPJ inválido" };
  }
  return { ok: false, error: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)" };
}

export type ParsedPhone = { ok: true; digits: string } | { ok: false; error: string };

/**
 * Normaliza um celular brasileiro para o formato canônico DDD + 9 dígitos
 * (11 dígitos, sem o 55). O código do país é removido quando vier junto,
 * senão "5511999998888" e "11999998888" seriam chaves diferentes para o
 * mesmo telefone — e o mesmo número ganharia dois testes.
 */
export function parsePhone(raw: string): ParsedPhone {
  let digits = onlyDigits(raw);

  // Tira o código do país quando presente (com ou sem o nono dígito).
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  if (digits.length === 0) return { ok: false, error: "Informe seu WhatsApp" };
  if (digits.length !== 11) {
    return { ok: false, error: "Informe DDD + número com 9 dígitos (ex.: 11 99999-9999)" };
  }
  // Celular brasileiro sempre começa com 9 depois do DDD; e DDD válido vai
  // de 11 a 99 (não existe DDD começando com 0).
  if (digits[0] === "0") return { ok: false, error: "DDD inválido" };
  if (digits[2] !== "9") {
    return { ok: false, error: "Informe um celular (o número deve começar com 9 após o DDD)" };
  }

  return { ok: true, digits };
}

/** Formato com código do país, exigido pelo checkout da Cakto (`phone=55...`). */
export function toInternationalPhone(digits: string): string {
  return `55${digits}`;
}
