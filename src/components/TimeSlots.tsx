"use client";

import React from 'react';
import { Clock } from 'lucide-react';

interface TimeSlotsProps {
  selectedDate: Date;
  businessHours: { open: string; close: string; active: boolean };
  busySlots: { busy_time: string; duration_minutes: number }[];
  serviceDuration: number;
  selectedTime: string | null;
  onChange: (time: string) => void;
}

export default function TimeSlots({
  selectedDate,
  businessHours,
  busySlots,
  serviceDuration,
  selectedTime,
  onChange
}: TimeSlotsProps) {
  if (!businessHours.active) {
    return (
      <div className="p-6 text-center rounded-xl bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          Este estabelecimento não funciona neste dia da semana.
        </p>
      </div>
    );
  }

  // Parse "HH:MM" into minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTimeStr = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const startMinutes = parseTimeToMinutes(businessHours.open);
  const endMinutes = parseTimeToMinutes(businessHours.close);

  // Generate slots every 30 minutes
  const slots: string[] = [];
  const slotInterval = 30; // 30 minutes between start of slots

  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  for (let current = startMinutes; current + serviceDuration <= endMinutes; current += slotInterval) {
    // If today, filter out past times
    if (isToday && current <= currentMinutes + 15) {
      continue; // Skip past times + 15 minutes buffer
    }

    const slotTimeStr = minutesToTimeStr(current);
    
    // Check overlap with busy slots
    const slotStart = new Date(selectedDate);
    const [sh, sm] = slotTimeStr.split(':').map(Number);
    slotStart.setHours(sh, sm, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000);

    const isOverlapping = busySlots.some(busy => {
      const busyStart = new Date(busy.busy_time);
      const busyEnd = new Date(busyStart.getTime() + busy.duration_minutes * 60 * 1000);

      // Overlap condition: startA < endB && endA > startB
      return slotStart < busyEnd && slotEnd > busyStart;
    });

    if (!isOverlapping) {
      slots.push(slotTimeStr);
    }
  }

  if (slots.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl bg-zinc-50 border border-zinc-200/60 dark:bg-zinc-900/50 dark:border-zinc-800/60">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Nenhum horário disponível para esta data.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
        <Clock size={16} className="text-blue-500" />
        Horários Disponíveis
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {slots.map((time) => {
          const isSelected = selectedTime === time;
          return (
            <button
              key={time}
              onClick={() => onChange(time)}
              className={`
                py-2.5 px-4 rounded-xl text-sm font-semibold text-center border transition-all cursor-pointer
                ${isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80'
                }
              `}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
