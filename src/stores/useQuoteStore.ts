// src/stores/useQuoteStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { QuoteItem } from '../domain/items'
import type { DiscountModel } from '../features/quotes/types' // tieni il tuo DiscountModel

// --- Tipi richiesti (ed esportati) ---
export type ProfileOverviewFeature = {
  id: string
  eyebrow: string
  title: string
  description: string
}

export type ProfileOverview = {
  imageUrl: string | null
  features: ProfileOverviewFeature[]
  label?: string | null
  glazing?: string | null
}

// Robust ID generator (anche senza crypto.randomUUID)
const rid = () =>
  typeof crypto !== 'undefined' && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

// --- Store State ---
export type QuoteStoreState = {
  // items
  items: QuoteItem[]
  setItems: (items: QuoteItem[]) => void
  addItem: (it: QuoteItem) => void
  updateItem: (id: string, patch: Partial<QuoteItem>) => void
  replaceItem: (id: string, it: QuoteItem) => void
  removeItem: (id: string) => void
  duplicateItem: (id: string) => void

  // discount (totale preventivo)
  discount: DiscountModel | null
  setDiscount: (d: DiscountModel | null) => void

  // Profile Overview (editor descrittivo)
  profileOverview: ProfileOverview | null
  setProfileOverview: (po: ProfileOverview | null) => void
  addPOFeature: (f: ProfileOverviewFeature) => void
  updatePOFeature: (id: string, patch: Partial<ProfileOverviewFeature>) => void
  removePOFeature: (id: string) => void
  movePOFeature: (id: string, dir: -1 | 1) => void

  // --- (Compat: metodi basati su indice; opzionali) ---
  updatePOFeatureByIndex?: (index: number, patch: Partial<ProfileOverviewFeature>) => void
  removePOFeatureByIndex?: (index: number) => void
  movePOFeatureByIndex?: (from: number, to: number) => void

  // utilities
  clear: () => void
}

export const useQuoteStore = create<QuoteStoreState>()(
  persist(
    (set, get) => ({
      // --- Items ---
      items: [],
      setItems: (items) => set({ items }),
      addItem: (it) => set({ items: [...get().items, it] }),
      updateItem: (id, patch) =>
        set({ items: get().items.map(i => (i.id === id ? { ...i, ...patch } : i)) }),
      replaceItem: (id, it) =>
        set({ items: get().items.map(i => (i.id === id ? it : i)) }),
      removeItem: (id) =>
        set({ items: get().items.filter(i => i.id !== id) }),
      duplicateItem: (id) => {
        const src = get().items.find(i => i.id === id)
        if (!src) return
        set({ items: [...get().items, { ...src, id: rid() }] })
      },

      // --- Discount ---
      discount: null,
      setDiscount: (d) => set({ discount: d }),

      // --- Profile Overview ---
      profileOverview: null,
      setProfileOverview: (po) => set({ profileOverview: po }),

      addPOFeature: (f) =>
        set(state => {
          const base: ProfileOverview = state.profileOverview ?? { imageUrl: null, features: [], label: null, glazing: null }
          const feat = f.id ? f : { ...f, id: rid() }
          return { profileOverview: { ...base, features: [...base.features, feat] } }
        }),

      updatePOFeature: (id, patch) =>
        set(state => {
          const base: ProfileOverview = state.profileOverview ?? { imageUrl: null, features: [], label: null, glazing: null }
          const next = base.features.map(feat => (feat.id === id ? { ...feat, ...patch } : feat))
          return { profileOverview: { ...base, features: next } }
        }),

      removePOFeature: (id) =>
        set(state => {
          const base: ProfileOverview = state.profileOverview ?? { imageUrl: null, features: [], label: null, glazing: null }
          const next = base.features.filter(f => f.id !== id)
          return { profileOverview: { ...base, features: next } }
        }),

      movePOFeature: (id, dir) =>
        set(state => {
          const base: ProfileOverview = state.profileOverview ?? { imageUrl: null, features: [], label: null, glazing: null }
          const arr = [...base.features]
          const i = arr.findIndex(f => f.id === id)
          if (i === -1) return { profileOverview: base }
          const j = i + dir
          if (j < 0 || j >= arr.length) return { profileOverview: base }
          const [spliced] = arr.splice(i, 1)
          arr.splice(j, 0, spliced)
          return { profileOverview: { ...base, features: arr } }
        }),

      // --- Compat (basato su indice) ---
      updatePOFeatureByIndex: (index, patch) =>
        set(state => {
          const base: ProfileOverview = state.profileOverview ?? { imageUrl: null, features: [], label: null, glazing: null }
          const next = [...base.features]
          if (!next[index]) return { profileOverview: base }
          next[index] = { ...next[index], ...patch }
          return { profileOverview: { ...base, features: next } }
        }),

      removePOFeatureByIndex: (index) =>
        set(state => {
          const base: ProfileOverview = state.profileOverview ?? { imageUrl: null, features: [], label: null, glazing: null }
          const next = base.features.filter((_, i) => i !== index)
          return { profileOverview: { ...base, features: next } }
        }),

      movePOFeatureByIndex: (from, to) =>
        set(state => {
          const base: ProfileOverview = state.profileOverview ?? { imageUrl: null, features: [], label: null, glazing: null }
          const arr = [...base.features]
          if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) {
            return { profileOverview: base }
          }
          const [spliced] = arr.splice(from, 1)
          arr.splice(to, 0, spliced)
          return { profileOverview: { ...base, features: arr } }
        }),

      // --- Utils ---
      clear: () => set({ items: [], discount: null, profileOverview: null }),
    }),
    {
      name: 'quote-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
        profileOverview: state.profileOverview,
      }),
    }
  )
)