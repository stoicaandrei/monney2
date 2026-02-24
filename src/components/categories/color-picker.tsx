'use client'

import * as React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { DEFAULT_CATEGORY_COLORS } from '@/types/category'
import { cn } from '@/lib/utils'

function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
  children?: React.ReactNode
}

export function ColorPicker({
  color,
  onChange,
  className,
  children,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(color)

  React.useEffect(() => {
    setInputValue(color)
  }, [color])

  const handlePresetClick = (c: string) => {
    onChange(c)
    setInputValue(c)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    if (isValidHex(value)) {
      onChange(value)
    }
  }

  const handleInputBlur = () => {
    if (isValidHex(inputValue)) {
      onChange(inputValue)
    } else {
      setInputValue(color)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            type="button"
            className={cn(
              'size-8 rounded-none border-2 border-input transition-all hover:scale-105',
              className
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handlePresetClick(c)}
                className={cn(
                  'size-7 rounded-none border-2 transition-all',
                  color === c
                    ? 'border-foreground ring-2 ring-offset-2 ring-foreground/20'
                    : 'border-transparent hover:scale-110'
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <div
              className="size-8 shrink-0 rounded-none border border-input"
              style={{ backgroundColor: inputValue }}
            />
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="#000000"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
