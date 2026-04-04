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
    abbreviation = words[0].substring(0, maxChars);
  } else if (words.length === 2) {
    abbreviation = words[0].substring(0, 6) + words[1].substring(0, 6);
  } else if (words.length === 3) {
    abbreviation = words[0].substring(0, 4) + words[1].substring(0, 4) + words[2].substring(0, 4);
  } else {
    for (const word of words) {
      if (abbreviation.length >= maxChars) break;
      abbreviation += word.substring(0, 3);
    }
  }

  return abbreviation.substring(0, maxChars).trim();
}

export function formatFileName(disciplineName: string, originalFileName: string): string {
  let lastDotIndex = originalFileName.lastIndexOf('.');
  if (lastDotIndex <= 0) lastDotIndex = originalFileName.length;

  const extension = originalFileName.substring(lastDotIndex);
  const nameWithoutExt = originalFileName.substring(0, lastDotIndex);

  const abbreviation = abbreviateDiscipline(disciplineName);
  
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

  // 2. Prefixo da prova (Extrai AD1, AP2, AD 1, ADs, etc)
  let proofPrefix = '';
  // Regex melhorada: Procura AD ou AP, opcionalmente seguido de espaço, opcionalmente seguido de número ou 'S'
  const proofMatch = folderName.match(/(AD|AP)\s?([1-3]|S)?/i);
  if (proofMatch) {
    const type = proofMatch[1].toUpperCase();
    const suffix = proofMatch[2] ? proofMatch[2].toUpperCase() : '';
    proofPrefix = type + suffix + '_';
  }

  // 3. Extrair ano (procura por 202X ou apenas XX)
  let year = '';
  const yearMatch = nameWithoutExt.match(/\b(202[0-9]|2[0-9])\b/);
  if (yearMatch) {
    let yearDigits = yearMatch[1];
    if (yearDigits.length === 2) yearDigits = '20' + yearDigits;
    year = yearDigits + '_';
  }

  // 4. Extrair semestre (procura por .1, .2, _1, _2 ou apenas 1, 2 isolado)
  let semester = '';
  const semesterMatch = nameWithoutExt.match(/(?:202[0-9]|2[0-9])[._-]?([12])\b/);
  if (semesterMatch) {
    semester = semesterMatch[1] + '_';
  } else {
    const isolatedSemester = nameWithoutExt.match(/\b([12])\b/);
    if (isolatedSemester) semester = isolatedSemester[1] + '_';
  }

  // 5. Palavras-chave
  const keywords = ['GABARITO', 'RESOLUCAO', 'COMENTADA', 'RESUMO'];
  const foundKeywords = keywords.filter(kw => 
    nameWithoutExt.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(kw)
  );

  // 6. Montar novo nome
  let newName = disciplinePrefix + proofPrefix + year + semester;
  if (foundKeywords.length > 0) {
    newName += foundKeywords.join('_').toUpperCase() + '_';
  }
  
  // Limpeza final
  newName = newName.replace(/_+/g, '_').replace(/_$/, '') + extension;

  return newName;
}