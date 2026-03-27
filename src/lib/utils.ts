/**
 * Abbreviates a discipline name to a short prefix (approx. 8 characters).
 * Example: "Cálculo I" -> "CALC1"
 * Example: "Introdução à Informática" -> "INTINF"
 */
export function abbreviateDiscipline(name: string): string {
  if (!name) return '';

  // 1. Remove accents and special characters
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // 2. Stop words to remove
  const stopWords = ['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'em', 'para', 'com', 'por'];
  
  // 3. Roman numerals mapping
  const romanMap: { [key: string]: string } = {
    'I': '1',
    'II': '2',
    'III': '3',
    'IV': '4',
    'V': '5',
    'VI': '6',
    'VII': '7',
    'VIII': '8',
    'IX': '9',
    'X': '10'
  };

  // 4. Process words
  const words = normalized
    .split(/[\s-]+/)
    .filter(word => word.length > 0)
    .map(word => word.toUpperCase())
    .filter(word => !stopWords.includes(word.toLowerCase()));

  const abbreviated = words.map(word => {
    // If it's a roman numeral, convert it
    if (romanMap[word]) return romanMap[word];
    
    // If it's already a number, keep it
    if (/^\d+$/.test(word)) return word;
    
    // Otherwise take first 3 letters
    return word.substring(0, 3);
  }).join('');

  // 5. Limit to 8 characters
  return abbreviated.substring(0, 8);
}

/**
 * Formats a file name by prefixing it with the abbreviated discipline name.
 * Example: "CALC1_AP1.2025-2.pdf"
 */
export function formatFileName(disciplineName: string, originalFileName: string): string {
  const prefix = abbreviateDiscipline(disciplineName);
  if (!prefix) return originalFileName;
  
  // Avoid double prefixing if the file already starts with the prefix
  if (originalFileName.toUpperCase().startsWith(prefix + '_')) {
    return originalFileName;
  }
  
  return `${prefix}_${originalFileName}`;
}