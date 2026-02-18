'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerWithRangeProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({ date, setDate, className }: DatePickerWithRangeProps) {
  const t = useTranslations('common');
  const currentLocale = useLocale();
  const dateLocale = currentLocale === 'ko' ? ko : enUS;

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'PPP', { locale: dateLocale })} -{' '}
                  {format(date.to, 'PPP', { locale: dateLocale })}
                </>
              ) : (
                format(date.from, 'PPP', { locale: dateLocale })
              )
            ) : (
              <span>{t('datePicker.selectRange')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={dateLocale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
