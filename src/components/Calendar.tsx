"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  activeDays: { [key: string]: boolean }; // e.g., { monday: true, sunday: false }
  blockedDates?: string[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Standard Brazilian Calendar starts on Sunday (Domingo)
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const WEEKDAY_NAMES_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function Calendar({ selectedDate, onChange, activeDays, blockedDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  // 0 is Sunday, 1 is Monday, etc. Directly matches index in WEEKDAYS
  const startDayOfWeek = firstDayOfMonth.getDay(); 
  
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(year, month, day);
    return dateToCheck < today;
  };

  const isDayClosed = (day: number) => {
    const dateToCheck = new Date(year, month, day);
    const dayOfWeekName = WEEKDAY_NAMES_EN[dateToCheck.getDay()];
    return activeDays[dayOfWeekName] === false;
  };

  const isDayBlocked = (day: number) => {
    if (!blockedDates) return false;
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    return blockedDates.includes(dateStr);
  };

  const handleDateClick = (day: number) => {
    if (isPast(day) || isDayClosed(day) || isDayBlocked(day)) return;
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
    <div className="w-full rounded-[24px] border border-zinc-800 bg-zinc-950/45 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[var(--brand-primary)]/5 blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-semibold text-zinc-150 tracking-wide font-sans first-letter:uppercase flex items-center gap-1">
          <span className="w-1.5 h-3 rounded-full bg-[var(--brand-primary)] inline-block"></span>
          {MONTHS[month]} <span className="text-zinc-500 font-normal">{year}</span>
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-all duration-200 hover:border-zinc-700 cursor-pointer active:scale-95"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-zinc-850 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white text-zinc-400 transition-all duration-200 hover:border-zinc-700 cursor-pointer active:scale-95"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 border-b border-zinc-900/60 pb-2 relative z-10">
        {WEEKDAYS.map((d, index) => (
          <div key={d} className={`py-0.5 ${index === 0 ? 'text-rose-500/70' : ''}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 relative z-10">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const past = isPast(day);
          const closed = isDayClosed(day);
          const blocked = isDayBlocked(day);
          const disabled = past || closed || blocked;
          const selected =
            selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year;

          const today = isToday(day);

          return (
            <button
              type="button"
              key={`day-${day}`}
              disabled={disabled}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square w-full rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all cursor-pointer relative
                ${disabled 
                  ? 'text-zinc-650/40 cursor-not-allowed bg-transparent' 
                  : selected
                    ? 'text-white font-bold'
                    : today
                      ? 'text-zinc-150 border border-[var(--brand-primary)]/45 bg-zinc-900/30'
                      : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white border border-transparent'
                }
              `}
              style={selected ? { backgroundColor: 'var(--brand-primary)', boxShadow: '0 4px 14px -2px var(--brand-primary)' } : {}}
            >
              <span className={disabled && (closed || blocked) ? "opacity-30 line-through decoration-zinc-800" : ""}>
                {day}
              </span>
              
              {/* Premium indicators at the bottom */}
              {!selected && (
                <div className="absolute bottom-1.5 flex gap-0.5 justify-center items-center">
                  {today && (
                    <span className="w-1 h-1 rounded-full bg-[var(--brand-primary)]" />
                  )}
                  {closed && !past && (
                    <span className="w-1 h-1 rounded-full bg-rose-500/60" title="Fechado" />
                  )}
                  {blocked && !past && (
                    <span className="w-1 h-1 rounded-full bg-amber-500/60" title="Folga" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
