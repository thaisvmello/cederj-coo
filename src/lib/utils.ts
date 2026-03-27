"use client";

/**
 * Abbreviates a discipline name to a short prefix (max 8 chars).
 * Removes stop words, converts Roman numerals to Arabic, and takes the first 3 letters of relevant words.
 */
export function abbreviateDiscipline(name: string): string {
  const stopWords = ['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'em', 'para', 'com', 'por', 'à', 'i', 'ii', 'iii', 'iv', 'v'];
  const romanToArabic: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10'
  };

  // Remove accents and convert to uppercase
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  
  const words = cleanName.split(/[\s-]+/).filter(w => w.length > 0);
  
  const abbreviated = words
    .filter(word => !stopWords.includes(word.toLowerCase()))
    .map(word => {
      // Check for roman numerals
      if (romanToArabic[word]) return romanToArabic[word];
      // Take first 3 letters of the word
      return word.substring(0, 3);
    })
    .join('');

  // Return first 8 characters
  return abbreviated.substring(0, 8);
}

/**
 * Formats a filename by prefixing it with the abbreviated discipline name.
 */
export function formatFileName(disciplineName: string, originalFileName: string): string {
  const abbreviation = abbreviateDiscipline(disciplineName);
  
  // Avoid double prefixing if the file already starts with the abbreviation
  if (originalFileName.toUpperCase().startsWith(abbreviation + '_')) {
    return originalFileName;
  }
  
  // Clean original filename: replace spaces with underscores or dashes if preferred, 
  // but here we just prefix to keep it simple as requested.
  return `${abbreviation}_${originalFileName}`;
}