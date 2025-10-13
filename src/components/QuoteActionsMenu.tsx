//src/components/QuoteActionsMenu.tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { MoreHorizontal } from "lucide-react";

export default function QuoteActionsMenu({
  onOpen,
  onDuplicate,
  onPdf,
  onDelete,
  align = 'end',
}: {
  onOpen: () => void
  onDuplicate: () => void
  onPdf: () => void
  onDelete?: () => void
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="text-gray-400 hover:text-gray-700 px-2"
          aria-label="Azioni preventivo"
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="bottom"
        align={align}
        className="rounded-lg border bg-white p-1 shadow-lg text-sm"
      >
        <MenuItem onSelect={onOpen}>Apri</MenuItem>
        <MenuItem onSelect={onDuplicate}>Duplica</MenuItem>
        <MenuItem onSelect={onPdf}>Scarica PDF</MenuItem>
        {onDelete && (
          <>
            <MenuSeparator />
            <MenuItem destructive onSelect={onDelete}>Elimina</MenuItem>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

function MenuItem({
  children,
  onSelect,
  destructive = false,
}: {
  children: ReactNode
  onSelect: () => void
  destructive?: boolean
}) {
  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        e.preventDefault()
        onSelect()
      }}
      className={`px-3 py-2 rounded-md cursor-pointer outline-none hover:bg-gray-100 ${
        destructive ? 'text-red-600 hover:bg-red-50' : ''
      }`}
    >
      {children}
    </DropdownMenu.Item>
  )
}

function MenuSeparator() {
  return <div className="my-1 h-px bg-gray-200" />
}