/**
 * Validation des numéros de téléphone du Burkina Faso
 * Règles officielles :
 * - Indicatif international optionnel : +226, 00226 ou 226
 * - Longueur locale : exactement 8 chiffres
 * - Préfixes mobiles valides au Burkina Faso :
 *   - Orange : 07, 74, 75, 76, 77, 54, 55, 56, 57...
 *   - Moov : 01, 02, 03, 60, 61, 62, 63, 70, 71, 72, 73...
 *   - Telecel : 05, 06, 58, 68, 69...
 *   - Fixe Ouaga / Bobo : 25, 20
 */
export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formatted: string;
  error?: string;
}

export function validateBurkinaPhone(phone: string, isOptional = false): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    if (isOptional) {
      return { isValid: true, normalized: '', formatted: '' };
    }
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      error: 'Le numéro de téléphone est obligatoire.'
    };
  }

  // Nettoyage des espaces, tirets, points et parenthèses
  let raw = phone.trim().replace(/[\s.\-()]/g, '');

  // Retrait de l'indicatif international si présent
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
      formatted: raw,
      error: 'Le numéro ne doit comporter que des chiffres.'
    };
  }

  // Vérification de la longueur exacte (8 chiffres au Burkina Faso)
  if (raw.length !== 8) {
    return {
      isValid: false,
      normalized: raw,
      formatted: raw,
      error: `Numéro incomplet ou trop long : un numéro du Burkina Faso doit comporter exactement 8 chiffres (${raw.length} saisis).`
    };
  }

  // Vérification des préfixes autorisés au Burkina Faso (01..07, 20, 25, 50..79)
  const prefix2 = raw.slice(0, 2);
  const isValidPrefix = /^(0[1-7]|20|25|[5-7]\d)$/.test(prefix2);

  if (!isValidPrefix) {
    return {
      isValid: false,
      normalized: raw,
      formatted: `${raw.slice(0, 2)} ${raw.slice(2, 4)} ${raw.slice(4, 6)} ${raw.slice(6, 8)}`,
      error: `Préfixe « ${prefix2} » non reconnu. Au Burkina Faso, les numéros commencent par 01-07, 20, 25, ou 50-79 (ex: 70 12 34 56).`
    };
  }

  // Formatage aéré : XX XX XX XX
  const formatted = `${raw.slice(0, 2)} ${raw.slice(2, 4)} ${raw.slice(4, 6)} ${raw.slice(6, 8)}`;

  return {
    isValid: true,
    normalized: raw,
    formatted
  };
}

