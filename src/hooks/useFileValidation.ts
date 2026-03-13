import { supabase } from '../lib/supabase';

export function useFileValidation() {
  const checkDuplicates = async (folderId: string, files: { name: string; size: number }[]): Promise<string[]> => {
    if (files.length === 0) return [];

    const { data, error } = await supabase
      .from('files')
      .select('name, file_size')
      .eq('folder_id', folderId);

    if (error || !data) {
      console.error('Erro ao verificar duplicatas:', error);
      return [];
    }

    const duplicates: string[] = [];
    for (const file of files) {
      const exists = data.some(
        (dbFile: any) => dbFile.name === file.name && dbFile.file_size === file.size
      );
      if (exists) {
        duplicates.push(file.name);
      }
    }

    return duplicates;
  };

  return { checkDuplicates };
}