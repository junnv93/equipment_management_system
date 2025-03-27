"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean | ((date: Date) => boolean)
  placeholder?: string
  className?: string
}

export function DatePicker({
  selected,
  onSelect,
  disabled = false,
  placeholder = "날짜 선택",
  className,
}: DatePickerProps) {
  const isButtonDisabled = typeof disabled === 'boolean' ? disabled : false;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
          disabled={isButtonDisabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            format(selected, "yyyy년 MM월 dd일", { locale: ko })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          disabled={disabled}
          locale={ko}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 