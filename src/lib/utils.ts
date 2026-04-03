export function generateNewFileName(disciplineName: string, folderName: string, originalFileName: string): string {
  // Encontrar a última ocorrência de ponto que não seja o primeiro caractere
  let lastDotIndex = originalFileName.lastIndexOf('.');
  
  // Se o ponto for o primeiro caractere (arquivo oculto), não considerar como extensão
  if (lastDotIndex === 0) {
    lastDotIndex = -1;
  }

  const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;

  // ... resto do código
}