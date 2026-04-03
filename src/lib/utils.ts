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
  // Encontrar a última ocorrência de ponto que não seja o primeiro caractere
  let lastDotIndex = originalFileName.lastIndexOf('.');
  
  // Se o ponto for o primeiro caractere (arquivo oculto), não considerar como extensão
  if (lastDotIndex === 0) {
    lastDotIndex = -1;
  }

  const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;

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

export function generateNewFileName(disciplineName: string, folderName: string, originalFileName: string): string {
  const lastDotIndex = originalFileName.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;

  // 1. Prefixo da disciplina
  const disciplinePrefix = abbreviateDiscipline(disciplineName).toUpperCase() + '_';

  // 2. Prefixo da prova (se a pasta for AD1, AP1, AP2, AP3)
  let proofPrefix = '';
  const proofMatch = folderName.match(/^(AD|AP)[1-3]$/i);
  if (proofMatch) {
    proofPrefix = folderName.toUpperCase() + '_';
  }

  // 3. Extrair ano do nome original (2 ou 4 dígitos)
  let year = '';
  let remainingAfterYear = nameWithoutExt;
  const yearMatch = nameWithoutExt.match(/\b(20\d{2}|\d{2})\b/);
  if (yearMatch) {
    let yearDigits = yearMatch[1];
    if (yearDigits.length === 2) {
      yearDigits = '20' + yearDigits;
    }
    year = yearDigits + '_';
    remainingAfterYear = nameWithoutExt.replace(yearMatch[0], '');
  }

  // 4. Extrair semestre (1 ou 2) do nome original (após remover o ano)
  let semester = '';
  const semesterMatch = remainingAfterYear.match(/(?:^|[^0-9])([12])(?:$|[^0-9])/);
  if (semesterMatch) {
    semester = semesterMatch[1] + '_';
    remainingAfterYear = remainingAfterYear.replace(semesterMatch[0], '');
  }

  // 5. Manter apenas palavras-chave: GABARITO, RESOLUÇÃO (e variações)
  const keywords = ['GABARITO', 'RESOLUCAO', 'GABARITOS', 'RESOLUCOES'];
  
  // Extrair palavras e manter apenas as que são palavras-chave
  const words = remainingAfterYear.split(/[\s_.-]+/);
  const keptWords = words.filter(word => 
    keywords.some(kw => word.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === kw)
  );

  // 6. Montar novo nome
  let newName = disciplinePrefix + proofPrefix + year + semester;
  if (keptWords.length > 0) {
    newName += keptWords.join('_').toUpperCase() + '_';
  }
  newName = newName.replace(/_+$/, '') + extension;

  return newName;
}