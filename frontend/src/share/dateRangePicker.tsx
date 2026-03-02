'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from './utils';

interface DateRangePickerProps {
  value: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selecting, setSelecting] = React.useState<'from' | 'to'>('from');

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fromDate = value.from ? new Date(value.from + 'T00:00:00') : null;
  const toDate = value.to ? new Date(value.to + 'T00:00:00') : null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: Date; dayOfMonth: number; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        dayOfMonth: prevMonth.getDate() - i,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        dayOfMonth: i,
        isCurrentMonth: true,
      });
    }

    // Next month days to fill the grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        dayOfMonth: i,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isDateDisabled = (date: Date) => {
    // Disable Sundays
    if (date.getDay() === 0) return true;
    // Disable dates before today
    if (date < hoy) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!fromDate || !toDate) return false;
    return date > fromDate && date < toDate;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    const dateStr = date.toISOString().split('T')[0];

    if (selecting === 'from') {
      onChange({ from: dateStr, to: '' });
      setSelecting('to');
    } else {
      if (fromDate && date < fromDate) {
        // If selected date is before 'from', reset
        onChange({ from: dateStr, to: '' });
        setSelecting('to');
      } else {
        onChange({ from: value.from, to: dateStr });
        setSelecting('from');
      }
    }
  };

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // Allow going back as long as the month contains today or future dates
    const lastDayOfPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    if (lastDayOfPrevMonth >= hoy) {
      setCurrentMonth(prevMonth);
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  return (
    <div className={cn('p-3 bg-white rounded-lg border shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs text-slate-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isDisabled = isDateDisabled(day.date);
          const isToday = isSameDay(day.date, hoy);
          const isFrom = fromDate && isSameDay(day.date, fromDate);
          const isTo = toDate && isSameDay(day.date, toDate);
          const inRange = isInRange(day.date);
          const isSunday = day.date.getDay() === 0;

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              disabled={isDisabled}
              className={cn(
                'h-8 w-8 rounded text-sm transition-colors relative',
                !day.isCurrentMonth && 'text-slate-300',
                day.isCurrentMonth && !isDisabled && 'text-slate-900',
                // Sunday in gray
                isSunday && 'bg-slate-100 text-slate-400 cursor-not-allowed',
                // Today in blue
                isToday && !isSunday && 'bg-blue-100 text-blue-700 font-medium',
                // Selected dates
                isFrom && 'bg-blue-600 text-white hover:bg-blue-700',
                isTo && 'bg-blue-600 text-white hover:bg-blue-700',
                inRange && 'bg-blue-50 text-blue-700',
                // Disabled
                isDisabled && !isSunday && 'text-slate-300 cursor-not-allowed',
                // Hover (only for enabled dates)
                !isDisabled && !isFrom && !isTo && !isToday && 'hover:bg-slate-100'
              )}
            >
              {day.dayOfMonth}
            </button>
          );
        })}
      </div>

      {/* Selection indicator */}
      <div className="flex gap-2 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span className="text-slate-600">Seleccionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 rounded"></div>
          <span className="text-slate-600">Hoy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-slate-100 rounded"></div>
          <span className="text-slate-600">No disponible</span>
        </div>
      </div>
    </div>
  );
}
