'use client'

import { Calendar } from 'lucide-react'

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: string
  max?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
  min,
  max,
}: DatePickerProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-900 pointer-events-none" />
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          className="w-full pl-10 pr-3 py-1.5 bg-white border border-gray-200 rounded-md hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-sm text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
      </div>
    </div>
  )
}

