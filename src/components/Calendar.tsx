"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  activeDays: { [key: string]: boolean }; // e.g., { monday: true, sunday: false }
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const WEEKDAY_NAMES_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function Calendar({ selectedDate, onChange, activeDays }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isPast = (day: number) => {
    const dateToCheck = new Date(year, month, day, 23, 59, 59);
    return dateToCheck < new Date();
  };

  const isDayClosed = (day: number) => {
    const dateToCheck = new Date(year, month, day);
    const dayOfWeekName = WEEKDAY_NAMES_EN[dateToCheck.getDay()];
    return activeDays[dayOfWeekName] === false;
  };

  const handleDateClick = (day: number) => {
    if (isPast(day) || isDayClosed(day)) return;
    onChange(new Date(year, month, day));
  };

  const days = [];
  // Empty slots for the days before the first of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white/70 p-5 backdrop-blur-xl shadow-xl dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg border border-zinc-200/60 bg-white hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg border border-zinc-200/60 bg-white hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const past = isPast(day);
          const closed = isDayClosed(day);
          const disabled = past || closed;
          const selected =
            selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year;

          return (
            <button
              key={`day-${day}`}
              disabled={disabled}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square w-full rounded-xl text-sm font-medium flex flex-col items-center justify-center transition-all cursor-pointer relative
                ${disabled 
                  ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' 
                  : selected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                }
              `}
            >
              <span>{day}</span>
              {isToday(day) && !selected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
              {closed && !past && (
                <span className="text-[9px] text-red-500 dark:text-red-400/80 font-normal">fechado</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
