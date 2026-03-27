export function abbreviateDiscipline(name: string): string {
  // Remove acentos e caracteres especiais, mantém apenas letras, números e espaços
  let clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase();

  // Remove stop words comuns
  const stopWords = ['DA', 'DE', 'DO', 'DAS', 'DOS', 'E', 'EM', 'NO', 'NOS', 'NA', 'NAS', 'PARA', 'POR', 'COM', 'SEM', 'SOBRE'];
  const words = clean.split(' ')
    .filter(word => !stopWords.includes(word) && word.length > 0);

  if (words.length === 0) return 'ARQUIVO';

  let abbreviation = '';
  const maxChars = 12;

  // Lógica inteligente baseada no número de palavras
  if (words.length === 1) {
    // Se for só uma palavra, pega até 12 letras
    abbreviation = words[0].substring(0, maxChars);
  } else if (words.length === 2) {
    // Se forem duas palavras (ex: Contabilidade Gerencial), pega 6 de cada
    // Resultaria em: CONTABGERENC
    abbreviation = words[0].substring(0, 6) + words[1].substring(0, 6);
  } else if (words.length === 3) {
    // Se forem três palavras, pega 4 de cada
    abbreviation = words[0].substring(0, 4) + words[1].substring(0, 4) + words[2].substring(0, 4);
  } else {
    // 4 ou mais palavras, pega as 3 primeiras letras de cada até bater o limite
    for (const word of words) {
      if (abbreviation.length >= maxChars) break;
      abbreviation += word.substring(0, 3);
    }
  }

  // Garante que não passe de 12 e remove espaços extras
  return abbreviation.substring(0, maxChars).trim();
}

export function formatFileName(disciplineName: string, originalFileName: string): string {
  // Pega a extensão do arquivo
  const extIndex = originalFileName.lastIndexOf('.');
  const extension = extIndex > 0 ? originalFileName.substring(extIndex) : '';
  const nameWithoutExt = extIndex > 0 ? originalFileName.substring(0, extIndex) : originalFileName;
  
  // Gera a abreviação inteligente
  const abbreviation = abbreviateDiscipline(disciplineName);
  
  // Formato: ABREVIACAO_NOMEDOARQUIVO.EXTENSAO
  if (!abbreviation) {
    return originalFileName;
  }
  
  // Limpa o nome original de caracteres que podem quebrar a URL
  const cleanOriginalName = nameWithoutExt
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');

  return `${abbreviation}_${cleanOriginalName}${extension}`;
}