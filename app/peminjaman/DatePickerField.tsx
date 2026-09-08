"use client"

import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as React from "react"

type DatePickerFieldProps = {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function DatePickerField({ value, onChange, placeholder, minDate, maxDate, className }: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement>(null)

  // Focus today on open
  React.useEffect(() => {
    if (open && calendarRef.current) {
      const todayBtn = calendarRef.current.querySelector('[aria-label="Today"]') as HTMLElement
      if (todayBtn) todayBtn.focus()
    }
  }, [open])

  // Handler to set time to 15:00:00 for due date
  function handleSelect(date: Date | undefined) {
    if (!date) return
    const d = new Date(date)
    d.setHours(16, 0, 0, 0)
    onChange(d)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left h-9 text-sm mt-1",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? (
            format(value, "PPP", { locale: id })
          ) : (
            <span>{placeholder || "Pilih tanggal..."}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div ref={calendarRef} className="rounded-md transition-colors bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            startMonth={minDate}
            endMonth={maxDate}
            autoFocus
            captionLayout="dropdown"
            locale={id}
            modifiers={{
              today: new Date(),
              weekend: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
              outside: (date: Date) => {
                // Mark days outside the current month
                if (!value) return false
                return date.getMonth() !== (value?.getMonth() ?? new Date().getMonth())
              },
            }}
            modifiersClassNames={{
              today: "!bg-accent-100 !text-accent-700 dark:!bg-accent-900/40 dark:!text-accent-200 rounded-md",
              weekend: "text-red-500",
              "weekend outside": "text-red-500 opacity-40",
              outside: "opacity-50",
            }}
            className="transition-colors bg-white dark:bg-gray-800"
            onDayKeyDown={(day, modifiers, e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                // Select the day and close
                handleSelect(day)
              }
            }}
          />
          <Button
            variant="ghost"
            className="w-full justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            onClick={() => {
              const today = new Date()
              handleSelect(today)
            }}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}