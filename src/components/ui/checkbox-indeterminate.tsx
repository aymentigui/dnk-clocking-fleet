"use client"

import { useRef, useEffect } from "react"

interface CheckboxIndeterminateProps {
  checked: boolean
  indeterminate: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function CheckboxIndeterminate({ checked, indeterminate, onChange, className }: CheckboxIndeterminateProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
      ref.current.checked = checked
    }
  }, [indeterminate, checked])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      className={className}
      aria-label="Select item"
    />
  )
}
