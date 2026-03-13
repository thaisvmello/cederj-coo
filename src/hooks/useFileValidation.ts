import { supabase } from '../lib/supabase';

export function useFileValidation() {
  const checkDuplicate = async (folderId: string, fileName: string, fileSize: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('files')
      .select('id')
      .eq('folder_id', folderId)
      .eq('name', fileName)
      .eq('file_size', fileSize)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar duplicata:', error);
      return false;
    }

    return !!data;
  };

  const checkDuplicates = async (folderId: string, files: { name: string; size: number }[]): Promise<string[]> => {
    const duplicates: string[] = [];

    for (const file of files) {
      const isDuplicate = await checkDuplicate(folderId, file.name, file.size);
      if (isDuplicate) {
        duplicates.push(file.name);
      }
    }

    return duplicates;
  };

  return { checkDuplicate, checkDuplicates };
}