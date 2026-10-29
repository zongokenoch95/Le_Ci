/**
 * Validation des numéros de téléphone
 * Règle unique :
 * - Exactement 8 chiffres, précédés avec ou sans l'indicatif +226 ou 00226
 */
export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  cleanPhone: string;
  formatted: string;
  error?: string;
}

export function validateBurkinaPhone(phone: string, isOptional = false): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    if (isOptional) {
      return { isValid: true, normalized: '', cleanPhone: '', formatted: '' };
    }
    return {
      isValid: false,
      normalized: '',
      cleanPhone: '',
      formatted: '',
      error: 'Le numéro de téléphone est obligatoire.'
    };
  }

  // Nettoyage des espaces, tirets, points et parenthèses
  let raw = phone.trim().replace(/[\s.\-()]/g, '');

  // Retrait de l'indicatif international (+226 ou 00226) si présent
  if (raw.startsWith('+226')) {
    raw = raw.slice(4);
  } else if (raw.startsWith('00226')) {
    raw = raw.slice(5);
  } else if (raw.length === 11 && raw.startsWith('226')) {
    raw = raw.slice(3);
  }

  // Vérification de la présence de chiffres uniquement
  if (!/^\d+$/.test(raw)) {
    return {
      isValid: false,
      normalized: raw,
      cleanPhone: raw,
      formatted: raw,
      error: 'Le numéro ne doit comporter que 8 chiffres (avec ou sans +226 ou 00226).'
    };
  }

  // Vérification de la longueur exacte : 8 chiffres
  if (raw.length !== 8) {
    return {
      isValid: false,
      normalized: raw,
      cleanPhone: raw,
      formatted: raw,
      error: `Le numéro doit comporter exactement 8 chiffres (avec ou sans +226 ou 00226) — ${raw.length} chiffre(s) saisi(s).`
    };
  }

  // Formatage aéré : XX XX XX XX
  const formatted = `${raw.slice(0, 2)} ${raw.slice(2, 4)} ${raw.slice(4, 6)} ${raw.slice(6, 8)}`;

  return {
    isValid: true,
    normalized: raw,
    cleanPhone: raw,
    formatted
  };
}
