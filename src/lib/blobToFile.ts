// src/lib/blobToFile.ts
/**
 * Converte un Blob in un File nel browser, senza dipendere da Buffer (Node).
 * Mantiene il MIME type del blob a meno che non venga passato un override.
 */
export function blobToFile(blob: Blob, filename: string, mime?: string): File {
  const type = mime || blob.type || "application/octet-stream";
  return new File([blob], filename, { type });
}