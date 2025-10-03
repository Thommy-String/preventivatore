// src/lib/uploadImages.ts
import { supabase } from "./supabase"

const BUCKET = "quote-item-images"

function extOf(file: File) {
  const n = file.name || ""
  const dot = n.lastIndexOf(".")
  if (dot === -1) return "png"
  return n.slice(dot + 1).toLowerCase() || "png"
}

export async function uploadQuoteItemImage(file: File, quoteId: string) {
  // path leggibile e separato per preventivo
  const path = `${quoteId}/${crypto.randomUUID()}.${extOf(file)}`
  // upload nel bucket GIUSTO + contentType
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "image/png",
    })
  if (upErr) throw upErr

  // URL pubblico stabile
  const { data: pub } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  // Sanity check
  if (!pub?.publicUrl) {
    throw new Error("Impossibile ottenere URL pubblico dell'immagine")
  }
  return pub.publicUrl
}