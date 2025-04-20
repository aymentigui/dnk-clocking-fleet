"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholderText?: string
  isClearable?: boolean
  className?: string
}

export function DatePicker({
  selected,
  onChange,
  placeholderText = "Pick a date",
  isClearable = false,
  className
}: DatePickerProps) {
  return (
    <div className="flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? format(selected, "PPP") : <span>{placeholderText}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected || undefined}
            onSelect={(date) => onChange(date ?? null)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {isClearable && selected && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="ml-2" 
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}