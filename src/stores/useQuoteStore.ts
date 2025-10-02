// src/stores/useQuoteStore.ts
import { create } from 'zustand'
import type { QuoteItem } from '../domain/items'

// Robust ID generator (works even if crypto.randomUUID is not available)
const rid = () => (typeof crypto !== 'undefined' && (crypto as any).randomUUID
  ? (crypto as any).randomUUID()
  : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36))

type State = {
  items: QuoteItem[]
  setItems: (items: QuoteItem[]) => void
  addItem: (it: QuoteItem) => void
  updateItem: (id: string, patch: Partial<QuoteItem>) => void
  replaceItem: (id: string, it: QuoteItem) => void
  removeItem: (id: string) => void
  duplicateItem: (id: string) => void
}

export const useQuoteStore = create<State>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (it) => set({ items: [...get().items, it] }),
  updateItem: (id, patch) => set({ items: get().items.map(i => i.id === id ? { ...i, ...patch } : i) }),
  replaceItem: (id, it) => set({ items: get().items.map(i => i.id === id ? it : i) }),
  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
  duplicateItem: (id) => {
    const src = get().items.find(i => i.id === id)
    if (!src) return
    set({ items: [...get().items, { ...src, id: rid() }] })
  }
}))