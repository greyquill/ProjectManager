'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onChange?: (startDate: string | undefined, endDate: string | undefined) => void
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(startDate || '')
  const [tempEndDate, setTempEndDate] = useState(endDate || '')
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    setTempStartDate(startDate || '')
    setTempEndDate(endDate || '')
  }, [startDate, endDate])

  const formatDateRange = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const startStr = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      const endStr = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      return `${startStr} - ${endStr}`
    }
    return 'Select Date Range'
  }

  const handleApply = () => {
    onChange?.(tempStartDate || undefined, tempEndDate || undefined)
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempStartDate('')
    setTempEndDate('')
    onChange?.(undefined, undefined)
    setIsOpen(false)
  }

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors text-sm text-gray-700 min-w-[180px]"
      >
        <Calendar className="h-4 w-4 text-gray-900 flex-shrink-0" />
        <span className="flex-1 text-left truncate text-gray-900">{formatDateRange()}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 min-w-[360px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Select Date Range</h3>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Start
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  End
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  min={tempStartDate || undefined}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

