export function abbreviateDiscipline(name: string): string {
  // Remove accents and special characters, keep only letters, numbers and spaces
  let clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase();

  // Remove common stop words
  const stopWords = ['DA', 'DE', 'DO', 'DAS', 'DOS', 'E', 'EM', 'NO', 'NOS', 'NA', 'NAS', 'PARA', 'POR', 'COM', 'SEM', 'SOBRE'];
  clean = clean.split(' ')
    .filter(word => !stopWords.includes(word) && word.length > 0)
    .join(' ');

  // Convert Roman numerals to Arabic (simple cases)
  clean = clean
    .replace(/I\s*$/, '1')
    .replace(/II\s*$/, '2')
    .replace(/III\s*$/, '3')
    .replace(/IV\s*$/, '4')
    .replace(/V\s*$/, '5')
    .replace(/VI\s*$/, '6')
    .replace(/VII\s*$/, '7')
    .replace(/VIII\s*$/, '8')
    .replace(/IX\s*$/, '9')
    .replace(/X\s*$/, '10');

  // Take first 3 letters of each word, limit to 8 characters total
  const words = clean.split(' ');
  let abbreviation = '';
  
  for (const word of words) {
    if (abbreviation.length >= 8) break;
    const part = word.substring(0, Math.min(3, word.length));
    abbreviation += part;
  }

  // Ensure we don't exceed 8 characters
  return abbreviation.length > 8 ? abbreviation.substring(0, 8) : abbreviation;
}

export function formatFileName(disciplineName: string, originalFileName: string): string {
  // Get file extension
  const extIndex = originalFileName.lastIndexOf('.');
  const extension = extIndex > 0 ? originalFileName.substring(extIndex) : '';
  const nameWithoutExt = extIndex > 0 ? originalFileName.substring(0, extIndex) : originalFileName;
  
  // Get abbreviation
  const abbreviation = abbreviateDiscipline(disciplineName);
  
  // Format: ABBREVIATION_ORIGINALNAME.EXTENSION
  // If abbreviation is empty, use original name
  if (!abbreviation) {
    return originalFileName;
  }
    return `${abbreviation}_${nameWithoutExt}${extension}`;
}