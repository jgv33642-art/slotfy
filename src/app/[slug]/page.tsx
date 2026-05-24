"use client";

import React, { use, useState, useEffect } from 'react';
import { db, Tenant, Service, Appointment } from '../../lib/db';
import Calendar from '../../components/Calendar';
import TimeSlots from '../../components/TimeSlots';
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, MessageSquare, Landmark, ArrowLeft, Phone, User, FileText } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TenantBookingPage({ params }: PageProps) {
  const { slug } = use(params);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking wizard state
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busySlots, setBusySlots] = useState<{ busy_time: string; duration_minutes: number }[]>([]);
  
  // Confirmed appointment state
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const loadTenantData = async () => {
      const t = await db.getTenantBySlug(slug);
      if (t) {
        setTenant(t);
        const svcs = await db.getServices(t.id);
        setServices(svcs);
      }
      setLoading(false);
    };
    loadTenantData();
  }, [slug]);

  // Load busy slots when selected date changes
  useEffect(() => {
    const loadBusySlots = async () => {
      if (tenant && selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const slots = await db.getBusySlots(tenant.id, startOfDay.toISOString(), endOfDay.toISOString());
        setBusySlots(slots);
        setSelectedTime(null); // Reset selected time when date changes
      }
    };
    loadBusySlots();
  }, [selectedDate, tenant]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-zinc-950">
        <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Estabelecimento não encontrado</h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            A agenda que você está tentando acessar não existe ou não está ativa no momento.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
          >
            Voltar para a Home
          </Link>
        </div>
      </div>
    );
  }

  const getWeekDayNameEn = (date: Date): string => {
    const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return names[date.getDay()];
  };

  const getBusinessHoursForSelectedDate = () => {
    if (!selectedDate) return { open: "08:00", close: "18:00", active: false };
    const dayName = getWeekDayNameEn(selectedDate);
    return tenant.business_hours[dayName] || { open: "08:00", close: "18:00", active: false };
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return;

    // Combine date and time
    const appointmentTime = new Date(selectedDate);
    const [h, m] = selectedTime.split(':').map(Number);
    appointmentTime.setHours(h, m, 0, 0);

    const newApp = await db.createAppointment({
      tenant_id: tenant.id,
      service_id: selectedService.id,
      client_name: clientName,
      client_phone: clientPhone,
      appointment_time: appointmentTime.toISOString(),
      notes: notes || undefined
    });

    setCreatedAppointment(newApp);
    setStep(4);
  };

  const getWhatsAppLink = () => {
    if (!createdAppointment || !selectedService) return '';
    const dateFormatted = new Date(createdAppointment.appointment_time).toLocaleDateString('pt-BR');
    const text = `Olá! Acabei de agendar um horário pelo Slotfy:\n\n*Serviço:* ${selectedService.name}\n*Data:* ${dateFormatted}\n*Horário:* ${selectedTime}\n*Cliente:* ${clientName}\n\nPor favor, confirme meu agendamento!`;
    const cleanedPhone = tenant.whatsapp_number.replace(/\D/g, '');
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
  };

  // Niche themes configuration
  const themeStyles = {
    'Beleza e Estética': {
      bg: 'from-amber-500/10 via-zinc-950 to-zinc-950',
      accent: 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300',
      btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-950/50',
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    },
    'Saúde e Odontologia': {
      bg: 'from-emerald-500/10 via-zinc-950 to-zinc-950',
      accent: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300',
      btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/50',
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    },
    'default': {
      bg: 'from-blue-500/10 via-zinc-950 to-zinc-950',
      accent: 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300',
      btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-950/50',
      badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    }
  };

  const currentTheme = themeStyles[tenant.niche as keyof typeof themeStyles] || themeStyles['default'];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentTheme.bg} text-zinc-100 font-sans pb-20`}>
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-lg text-blue-500">
              S
            </div>
            <div>
              <h1 className="text-md font-bold leading-tight">{tenant.name}</h1>
              <p className="text-xs text-zinc-400">{tenant.niche}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg px-3 py-1.5 bg-zinc-900/50 hover:bg-zinc-900"
          >
            Área Administrativa
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* Wizard Steps indicator */}
        {step < 4 && (
          <div className="flex justify-between items-center mb-8 border border-zinc-800 bg-zinc-900/40 p-4 rounded-xl backdrop-blur-sm">
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${step >= 1 ? 'text-blue-400' : 'text-zinc-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-blue-500/20 border border-blue-400/40' : 'bg-zinc-800'}`}>1</span>
              Serviço
            </span>
            <ChevronRight size={14} className="text-zinc-600" />
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${step >= 2 ? 'text-blue-400' : 'text-zinc-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-blue-500/20 border border-blue-400/40' : 'bg-zinc-800'}`}>2</span>
              Data & Hora
            </span>
            <ChevronRight size={14} className="text-zinc-600" />
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${step >= 3 ? 'text-blue-400' : 'text-zinc-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-blue-500/20 border border-blue-400/40' : 'bg-zinc-800'}`}>3</span>
              Dados
            </span>
          </div>
        )}

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold mb-4">Selecione um serviço</h2>
            <div className="grid gap-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`
                    p-5 rounded-xl border transition-all cursor-pointer flex justify-between items-center group
                    ${selectedService?.id === service.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/90'
                    }
                  `}
                >
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold group-hover:text-blue-400 transition-colors text-zinc-100">{service.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{service.description}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs flex items-center gap-1 text-zinc-400">
                        <Clock size={12} />
                        {service.duration_minutes} min
                      </span>
                      <span className="text-xs flex items-center gap-1 text-zinc-400">
                        <Landmark size={12} />
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-600 group-hover:text-zinc-400 transition-all group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && selectedService && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 mb-6 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 cursor-pointer"
            >
              <ArrowLeft size={12} /> Voltar aos Serviços
            </button>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Serviço Selecionado</span>
                <h3 className="font-semibold text-sm">{selectedService.name}</h3>
                <p className="text-xs text-zinc-400">{selectedService.duration_minutes}min • R$ {Number(selectedService.price).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-1 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                  <CalendarIcon size={16} className="text-blue-500" />
                  Selecione o Dia
                </h3>
                <Calendar
                  selectedDate={selectedDate}
                  onChange={setSelectedDate}
                  activeDays={Object.keys(tenant.business_hours).reduce((acc, key) => {
                    acc[key] = tenant.business_hours[key].active;
                    return acc;
                  }, {} as { [key: string]: boolean })}
                />
              </div>

              {selectedDate && (
                <div className="mt-4 border-t border-zinc-800/60 pt-6">
                  <TimeSlots
                    selectedDate={selectedDate}
                    businessHours={getBusinessHoursForSelectedDate()}
                    busySlots={busySlots}
                    serviceDuration={selectedService.duration_minutes}
                    selectedTime={selectedTime}
                    onChange={(time) => {
                      setSelectedTime(time);
                      setStep(3);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Client Info */}
        {step === 3 && selectedService && selectedDate && selectedTime && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 mb-6 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800 cursor-pointer"
            >
              <ArrowLeft size={12} /> Voltar à Data
            </button>

            {/* Recap Card */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 mb-6 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Serviço</span>
                <span className="font-semibold text-zinc-200">{selectedService.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Preço</span>
                <span className="font-semibold text-zinc-200">R$ {Number(selectedService.price).toFixed(2)}</span>
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Data</span>
                <span className="font-semibold text-zinc-200">{selectedDate.toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="mt-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Horário</span>
                <span className="font-semibold text-zinc-200">{selectedTime}</span>
              </div>
            </div>

            <form onSubmit={handleBook} className="space-y-4 border border-zinc-800 bg-zinc-900/40 p-6 rounded-xl backdrop-blur-sm">
              <h3 className="text-md font-semibold text-zinc-100 mb-4 border-b border-zinc-800/80 pb-3">Seus Dados de Contato</h3>
              
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Guilherme Silva"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Observações (Opcional)</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3 text-zinc-500" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Gostaria de cortar mais curto do lado."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer mt-4 ${currentTheme.btn}`}
              >
                Confirmar Agendamento
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Success Screen */}
        {step === 4 && createdAppointment && selectedService && (
          <div className="animate-in scale-in duration-300 max-w-md mx-auto text-center border border-zinc-800 bg-zinc-900/30 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-100">Agendamento Realizado!</h2>
            <p className="text-sm text-zinc-400 mt-2">Seu horário foi reservado com sucesso no sistema.</p>

            <div className="border-t border-b border-zinc-800 my-6 py-4 space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-zinc-500">Estabelecimento:</span>
                <span className="font-semibold text-zinc-200">{tenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Serviço:</span>
                <span className="font-semibold text-zinc-200">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Data:</span>
                <span className="font-semibold text-zinc-200">{selectedDate?.toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Horário:</span>
                <span className="font-semibold text-zinc-200">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Preço:</span>
                <span className="font-semibold text-zinc-200">R$ {Number(selectedService.price).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <MessageSquare size={16} />
                Enviar Confirmação no WhatsApp
              </a>
              
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setClientName('');
                  setClientPhone('');
                  setNotes('');
                  setCreatedAppointment(null);
                }}
                className="w-full py-3 rounded-xl font-semibold text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Agendar Outro Serviço
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
