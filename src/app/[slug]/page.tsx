"use client";

import React, { use, useState, useEffect } from 'react';
import { db, Tenant, Service, Appointment, Professional } from '../../lib/db';
import Calendar from '../../components/Calendar';
import TimeSlots from '../../components/TimeSlots';
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckCircle2, MessageSquare, Landmark, ArrowLeft, Phone, User, FileText, Users, AlertCircle, MapPin, Globe, ExternalLink } from 'lucide-react';
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
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busySlots, setBusySlots] = useState<{ busy_time: string; duration_minutes: number }[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [blacklistError, setBlacklistError] = useState('');
  
  // Confirmed appointment state
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const loadTenantData = async () => {
      const t = await db.getTenantBySlug(slug);
      if (t) {
        setTenant(t);
        const svcs = await db.getServices(t.id);
        setServices(svcs);
        const profs = await db.getProfessionals(t.id);
        setProfessionals(profs);
        // Pre-select the professional if Personal plan (bypassing step 2)
        if (t.plan_type === 'personal' && profs.length > 0) {
          setSelectedProfessional(profs[0]);
        }
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
    setBlacklistError('');

    // Validar blacklist
    const isBlacklisted = tenant.blacklist_numbers?.includes(clientPhone.trim());
    if (isBlacklisted) {
      setBlacklistError('Desculpe, este número de telefone possui restrições para novos agendamentos neste local. Entre em contato diretamente pelo WhatsApp.');
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return;

    // Combine date and time
    const appointmentTime = new Date(selectedDate);
    const [h, m] = selectedTime.split(':').map(Number);
    appointmentTime.setHours(h, m, 0, 0);

    const newApp = await db.createAppointment({
      tenant_id: tenant.id,
      service_id: selectedService.id,
      professional_id: selectedProfessional?.id || undefined,
      client_name: clientName,
      client_phone: clientPhone,
      appointment_time: appointmentTime.toISOString(),
      notes: notes || undefined
    });

    setCreatedAppointment(newApp);
    setStep(5);
  };

  const getWhatsAppLink = () => {
    if (!createdAppointment || !selectedService) return '';
    const dateFormatted = new Date(createdAppointment.appointment_time).toLocaleDateString('pt-BR');
    
    const profText = selectedProfessional ? `• *Profissional:* ${selectedProfessional.name}\n` : '';

    const text = `Olá! Acabei de agendar um horário pelo Slotfy:\n\n` +
      `🏢 *Estabelecimento:* ${tenant.name}\n` +
      `📍 *Endereço:* ${tenant.address || 'Não informado'}\n` +
      `📞 *Telefone Contato:* ${tenant.whatsapp_number}\n\n` +
      `📋 *Detalhes do Agendamento:*\n` +
      `• *Serviço:* ${selectedService.name}\n` +
      profText +
      `• *Data:* ${dateFormatted}\n` +
      `• *Horário:* ${selectedTime}\n\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📱 *Telefone Cliente:* ${clientPhone}\n\n` +
      `Por favor, confirme meu agendamento!`;

    const cleanedPhone = tenant.whatsapp_number.replace(/\D/g, '');
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
  };

  const getGoogleCalendarUrl = () => {
    if (!createdAppointment || !selectedService) return '';
    const start = new Date(createdAppointment.appointment_time);
    const end = new Date(start.getTime() + selectedService.duration_minutes * 60 * 1000);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const text = encodeURIComponent(`${selectedService.name} - ${tenant.name}`);
    const details = encodeURIComponent(
      `Agendamento de ${selectedService.name} no estabelecimento ${tenant.name}.\n` +
      `Profissional: ${selectedProfessional?.name || 'Qualquer profissional'}\n` +
      `Endereço: ${tenant.address || 'Não informado'}\n` +
      `Status: Agendado via Slotfy`
    );
    const location = encodeURIComponent(tenant.address || '');
    const dates = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${dates}`;
  };

  const downloadICSFile = () => {
    if (!createdAppointment || !selectedService) return;
    const start = new Date(createdAppointment.appointment_time);
    const end = new Date(start.getTime() + selectedService.duration_minutes * 60 * 1000);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Slotfy//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `UID:${createdAppointment.id}`,
      `SUMMARY:${selectedService.name} - ${tenant.name}`,
      `DESCRIPTION:Agendamento de ${selectedService.name} no estabelecimento ${tenant.name}. Profissional: ${selectedProfessional?.name || 'Qualquer profissional'}`,
      `LOCATION:${tenant.address || ''}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT1H', // 1 hora antes
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete de agendamento no Slotfy',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agendamento-${tenant.slug}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  const primaryColor = tenant.primary_color || '#3b82f6';

  // Format currency helpers
  const formatBRL = (val: number | string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  const formatLongDate = (date: Date) => {
    const formatted = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    // Capitalize first letter (e.g., "Quarta-feira...")
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentTheme.bg} text-zinc-100 font-sans pb-24 relative overflow-x-hidden`}>
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--brand-primary)]/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --brand-primary: ${primaryColor};
        }
        .brand-bg-primary {
          background-color: ${primaryColor} !important;
        }
        .brand-border-primary {
          border-color: ${primaryColor} !important;
        }
        .brand-text-primary {
          color: ${primaryColor} !important;
        }
        .brand-accent-hover:hover {
          background-color: ${primaryColor}0d !important;
          color: ${primaryColor} !important;
          border-color: ${primaryColor}40 !important;
        }
        .brand-ring-focus:focus {
          border-color: ${primaryColor}80 !important;
          box-shadow: 0 0 0 3px ${primaryColor}20 !important;
        }
      `}} />

      {/* Header */}
      <header className="border-b border-zinc-900/60 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-10 h-10 rounded-2xl object-cover border border-zinc-800 shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center font-bold text-lg brand-text-primary shadow-inner">
                {tenant.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-sm font-semibold leading-tight text-zinc-100">{tenant.name}</h1>
              <p className="text-[10px] text-zinc-500 font-medium tracking-wide mt-0.5 uppercase">{tenant.niche}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl px-3.5 py-1.5 bg-zinc-900/30 hover:bg-zinc-900/70 transition-all active:scale-95"
          >
            Área Administrativa
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 mt-8 relative z-10">
        
        {/* Welcome and description of the business */}
        {step === 1 && (tenant.description || tenant.address || tenant.website_url) && (
          <div className="mb-6 border border-zinc-800 bg-zinc-950/25 p-5.5 rounded-[22px] backdrop-blur-md text-zinc-300 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[var(--brand-primary)]/5 rounded-full blur-[40px] pointer-events-none" />
            {tenant.description && (
              <p className="text-[12px] text-zinc-350 leading-relaxed mb-3.5 italic">
                "{tenant.description}"
              </p>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-zinc-500 border-t border-zinc-900/85 pt-3">
              {tenant.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} className="brand-text-primary shrink-0" />
                  {tenant.address}
                </span>
              )}
              {tenant.website_url && (
                <a 
                  href={tenant.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 hover:brand-text-primary transition-colors cursor-pointer text-zinc-300 font-medium"
                >
                  <Globe size={12} className="brand-text-primary shrink-0" />
                  Website Oficial
                  <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Wizard Steps indicator */}
        {step < 5 && (
          <div className="flex justify-between items-center mb-8 border border-zinc-850 bg-zinc-950/40 px-5 py-4 rounded-2xl backdrop-blur-xl text-zinc-100 shadow-md">
            <span className={`text-[11px] font-semibold flex items-center gap-2 transition-all duration-300 ${step >= 1 ? 'brand-text-primary' : 'text-zinc-500'}`}>
              <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-300 ${step >= 1 ? 'brand-bg-primary/10 border border-brand-primary/40 text-brand-primary' : 'bg-zinc-900 text-zinc-650 border border-transparent'}`}>1</span>
              Serviço
            </span>
            
            {tenant.plan_type !== 'personal' && (
              <>
                <ChevronRight size={12} className="text-zinc-800" />
                <span className={`text-[11px] font-semibold flex items-center gap-2 transition-all duration-300 ${step >= 2 ? 'brand-text-primary' : 'text-zinc-500'}`}>
                  <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-300 ${step >= 2 ? 'brand-bg-primary/10 border border-brand-primary/40 text-brand-primary' : 'bg-zinc-900 text-zinc-650 border border-transparent'}`}>2</span>
                  Profissional
                </span>
              </>
            )}
            
            <ChevronRight size={12} className="text-zinc-800" />
            <span className={`text-[11px] font-semibold flex items-center gap-2 transition-all duration-300 ${step >= 3 ? 'brand-text-primary' : 'text-zinc-500'}`}>
              <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-300 ${step >= 3 ? 'brand-bg-primary/10 border border-brand-primary/40 text-brand-primary' : 'bg-zinc-900 text-zinc-650 border border-transparent'}`}>
                {tenant.plan_type === 'personal' ? '2' : '3'}
              </span>
              Data & Hora
            </span>
            
            <ChevronRight size={12} className="text-zinc-800" />
            <span className={`text-[11px] font-semibold flex items-center gap-2 transition-all duration-300 ${step >= 4 ? 'brand-text-primary' : 'text-zinc-500'}`}>
              <span className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-300 ${step >= 4 ? 'brand-bg-primary/10 border border-brand-primary/40 text-brand-primary' : 'bg-zinc-900 text-zinc-650 border border-transparent'}`}>
                {tenant.plan_type === 'personal' ? '3' : '4'}
              </span>
              Dados
            </span>
          </div>
        )}

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xs font-semibold mb-4 uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-3 rounded bg-[var(--brand-primary)]" />
              Selecione um serviço
            </h2>
            <div className="grid gap-3.5">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    if (tenant.plan_type !== 'personal' && professionals.length > 0) {
                      setStep(2);
                    } else {
                      setStep(3);
                    }
                  }}
                  className={`
                    p-5 rounded-[22px] border transition-all cursor-pointer flex justify-between items-center group brand-accent-hover hover:scale-[1.01] active:scale-[0.99]
                    ${selectedService?.id === service.id
                      ? 'brand-border-primary bg-[var(--brand-primary)]/10 text-brand-primary shadow-lg shadow-[var(--brand-primary)]/5'
                      : 'border-zinc-800/70 bg-zinc-950/20 hover:bg-zinc-900/30 hover:border-zinc-700/60'
                    }
                  `}
                >
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold group-hover:brand-text-primary transition-colors text-zinc-150 text-sm md:text-md">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex gap-2.5 mt-3">
                      <span className="text-[10px] flex items-center gap-1.5 text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-850 font-medium">
                        <Clock size={10} className="brand-text-primary" />
                        {service.duration_minutes} min
                      </span>
                      <span className="text-[10px] flex items-center gap-1.5 text-zinc-200 bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-850 font-bold">
                        <Landmark size={10} className="brand-text-primary" />
                        {formatBRL(service.price)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-650 group-hover:brand-text-primary transition-all group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Professional */}
        {step === 2 && selectedService && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 mb-6 bg-zinc-900/40 px-3.5 py-1.5 rounded-xl border border-zinc-850 cursor-pointer hover:bg-zinc-900/70 transition-colors"
            >
              <ArrowLeft size={10} /> Voltar aos Serviços
            </button>

            <h2 className="text-xs font-semibold mb-4 uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-3 rounded bg-[var(--brand-primary)]" />
              Selecione o Profissional
            </h2>
            <div className="grid gap-3.5">
              {/* Option Tanto Faz */}
              <div
                onClick={() => {
                  setSelectedProfessional(null);
                  setStep(3);
                }}
                className={`
                  p-5 rounded-[22px] border transition-all cursor-pointer flex justify-between items-center group brand-accent-hover hover:scale-[1.01] active:scale-[0.99]
                  ${selectedProfessional === null
                    ? 'brand-border-primary bg-[var(--brand-primary)]/10 shadow-lg shadow-[var(--brand-primary)]/5'
                    : 'border-zinc-800/70 bg-zinc-950/20 hover:bg-zinc-900/30 hover:border-zinc-700/60'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold text-base brand-text-primary shadow-inner">
                    ★
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-150 group-hover:brand-text-primary transition-colors text-sm">Tanto faz / Próximo disponível</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Qualquer profissional livre no horário selecionado</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-650 group-hover:brand-text-primary transition-all group-hover:translate-x-1" />
              </div>

              {/* Professionals list */}
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => {
                    setSelectedProfessional(prof);
                    setStep(3);
                  }}
                  className={`
                    p-5 rounded-[22px] border transition-all cursor-pointer flex justify-between items-center group brand-accent-hover hover:scale-[1.01] active:scale-[0.99]
                    ${selectedProfessional?.id === prof.id
                      ? 'brand-border-primary bg-[var(--brand-primary)]/10 shadow-lg shadow-[var(--brand-primary)]/5'
                      : 'border-zinc-800/70 bg-zinc-950/20 hover:bg-zinc-900/30 hover:border-zinc-700/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {prof.avatar_url ? (
                      <img
                        src={prof.avatar_url}
                        alt={prof.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-zinc-800 shadow-md"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold text-sm brand-text-primary shadow-inner">
                        {prof.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-zinc-150 group-hover:brand-text-primary transition-colors text-sm">{prof.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{prof.specialty || 'Profissional Geral'}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-650 group-hover:brand-text-primary transition-all group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && selectedService && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              type="button"
              onClick={() => {
                if (tenant.plan_type !== 'personal' && professionals.length > 0) {
                  setStep(2);
                } else {
                  setStep(1);
                }
              }}
              className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 mb-6 bg-zinc-900/40 px-3.5 py-1.5 rounded-xl border border-zinc-850 cursor-pointer hover:bg-zinc-900/70 transition-all"
            >
              <ArrowLeft size={10} /> Voltar ao Passo Anterior
            </button>

            {/* Selection Recap */}
            <div className="flex items-center gap-4 p-5 rounded-[22px] border border-zinc-800/80 bg-zinc-950/20 mb-6 shadow-md relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[var(--brand-primary)]/5 rounded-full blur-[35px] pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center brand-text-primary shadow-inner shrink-0">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-semibold">Serviço Selecionado</span>
                <h3 className="font-semibold text-zinc-100 text-sm mt-0.5">{selectedService.name}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400 mt-1 font-medium">
                  <span>{selectedService.duration_minutes} min</span>
                  <span className="text-zinc-650">•</span>
                  <span className="font-semibold text-zinc-300">{formatBRL(selectedService.price)}</span>
                  {selectedProfessional && (
                    <>
                      <span className="text-zinc-650">•</span>
                      <span className="brand-text-primary font-semibold">Profissional: {selectedProfessional.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <CalendarIcon size={12} className="brand-text-primary" />
                  Selecione o Dia
                </h3>
                <Calendar
                  selectedDate={selectedDate}
                  onChange={setSelectedDate}
                  activeDays={Object.keys(tenant.business_hours).reduce((acc, key) => {
                    acc[key] = tenant.business_hours[key].active;
                    return acc;
                  }, {} as { [key: string]: boolean })}
                  blockedDates={tenant.blocked_dates}
                />
              </div>

              {selectedDate && (
                <div className="mt-4 border-t border-zinc-900/60 pt-6">
                  <TimeSlots
                    selectedDate={selectedDate}
                    businessHours={getBusinessHoursForSelectedDate()}
                    busySlots={busySlots}
                    serviceDuration={selectedService.duration_minutes}
                    selectedTime={selectedTime}
                    onChange={(time) => {
                      setSelectedTime(time);
                      setStep(4);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Client Info */}
        {step === 4 && selectedService && selectedDate && selectedTime && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 mb-6 bg-zinc-900/40 px-3.5 py-1.5 rounded-xl border border-zinc-850 cursor-pointer hover:bg-zinc-900/70 transition-all"
            >
              <ArrowLeft size={10} /> Voltar à Data
            </button>

            {/* Recap Card */}
            <div className="grid grid-cols-2 gap-4 p-5 rounded-[22px] border border-zinc-800 bg-zinc-950/20 mb-6 text-xs md:text-sm shadow-md backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[var(--brand-primary)]/5 rounded-full blur-[40px] pointer-events-none" />
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Serviço</span>
                <span className="font-semibold text-zinc-200 text-xs md:text-sm block mt-0.5">{selectedService.name}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Valor Total</span>
                <span className="font-bold text-zinc-200 text-xs md:text-sm block mt-0.5">{formatBRL(selectedService.price)}</span>
              </div>
              <div className="mt-1">
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Data</span>
                <span className="font-semibold text-zinc-200 text-xs md:text-sm block mt-0.5">{selectedDate.toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="mt-1">
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Horário Escolhido</span>
                <span className="font-semibold text-zinc-200 text-xs md:text-sm block mt-0.5">{selectedTime}</span>
              </div>
              {selectedProfessional && (
                <div className="mt-2.5 col-span-2 border-t border-zinc-900/80 pt-2.5 flex items-center gap-1.5 text-xs">
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-semibold">Profissional:</span>
                  <span className="font-semibold brand-text-primary">{selectedProfessional.name}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleBook} className="space-y-4 border border-zinc-800/80 bg-zinc-950/25 p-6 rounded-[22px] backdrop-blur-md shadow-xl">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-900/80 pb-3">Seus Dados de Contato</h3>
              
              {blacklistError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-450 leading-relaxed">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
                  <span>{blacklistError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-zinc-650" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Guilherme Silva"
                    className="w-full bg-zinc-950/60 border border-zinc-850 rounded-2xl py-3 pl-11 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none brand-ring-focus transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3.5 text-zinc-650" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full bg-zinc-950/60 border border-zinc-850 rounded-2xl py-3 pl-11 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none brand-ring-focus transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Observações (Opcional)</label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3.5 top-3.5 text-zinc-650" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Alguma instrução especial ou observação..."
                    className="w-full bg-zinc-950/60 border border-zinc-850 rounded-2xl py-3 pl-11 pr-4 text-xs text-zinc-200 placeholder-zinc-750 focus:outline-none brand-ring-focus transition-all h-24 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg transition-all cursor-pointer mt-4 brand-bg-primary hover:scale-[1.01] active:scale-[0.99] hover:opacity-95 shadow-zinc-950/40"
              >
                Confirmar Agendamento
              </button>
            </form>
          </div>
        )}

        {/* Step 5: Success Screen (Premium Ticket Design) */}
        {step === 5 && createdAppointment && selectedService && (
          <div className="animate-in zoom-in duration-300 max-w-md mx-auto text-center relative z-10">
            {/* Ticket Outer Wrapper */}
            <div className="border border-zinc-800 bg-zinc-950/80 p-6 pt-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Glow Accent */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[var(--brand-primary)]/5 blur-3xl pointer-events-none" />

              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 relative z-10">
                <CheckCircle2 size={28} />
              </div>
              
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Agendamento Realizado!</h2>
              <p className="text-[11px] text-zinc-400 mt-1 font-medium">Seu horário foi reservado com sucesso.</p>

              {/* Receipt Ticket Details */}
              <div className="mt-6 space-y-2.5 text-xs text-left bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4.5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Local:</span>
                  <span className="font-semibold text-zinc-200">{tenant.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Serviço:</span>
                  <span className="font-semibold text-zinc-200">{selectedService.name}</span>
                </div>
                {selectedProfessional && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-medium">Profissional:</span>
                    <span className="font-semibold text-zinc-200">{selectedProfessional.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Data:</span>
                  <span className="font-semibold text-zinc-200">{selectedDate?.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Horário:</span>
                  <span className="font-semibold text-zinc-200">{selectedTime}</span>
                </div>
                <div className="flex justify-between items-center border-t border-zinc-900/60 pt-2.5 mt-2.5">
                  <span className="text-zinc-400 font-medium">Valor:</span>
                  <span className="font-bold text-zinc-200">{formatBRL(selectedService.price)}</span>
                </div>
              </div>

              {/* Ticket Jagged Cutter Divisor */}
              <div className="relative border-t border-dashed border-zinc-800/80 my-5">
                <div className="absolute -left-[33px] -top-[9px] w-4.5 h-4.5 rounded-full bg-zinc-950 border-r border-zinc-800/80" />
                <div className="absolute -right-[33px] -top-[9px] w-4.5 h-4.5 rounded-full bg-zinc-950 border-l border-zinc-800/80" />
              </div>

              {/* Custom success message / instructions */}
              {tenant.success_message && (
                <div className="border border-brand-primary/25 bg-[var(--brand-primary)]/5 rounded-2xl p-4 mb-4 text-left">
                  <h4 className="text-[10px] font-semibold brand-text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span>ℹ️</span> Instruções de Atendimento
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    {tenant.success_message}
                  </p>
                </div>
              )}

              {/* Pix payment card */}
              {tenant.pix_key && (
                <div className="border border-emerald-500/25 bg-emerald-500/5 rounded-2xl p-4 mb-4 text-left">
                  <h4 className="text-[10px] font-semibold text-emerald-450 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <span>💸</span> Garantir Vaga com PIX
                  </h4>
                  <p className="text-[10px] text-zinc-450 mb-2.5 leading-normal">
                    Se o estabelecimento exige sinal ou pagamento prévio, copie a chave PIX abaixo:
                  </p>
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl p-2.5">
                    <code className="text-[11px] font-semibold text-emerald-400 break-all select-all font-mono pl-1">{tenant.pix_key}</code>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tenant.pix_key || '');
                        alert('Chave PIX copiada!');
                      }}
                      className="text-[9px] font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-850 hover:border-zinc-700 px-3 py-1.5 rounded-lg cursor-pointer shrink-0 ml-2 transition-all duration-200 active:scale-95"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {/* Save alarm integration */}
              <div className="border border-zinc-900 bg-zinc-900/20 rounded-2xl p-4 mb-6 text-left">
                <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span>🔔</span> Lembrete Automático
                </h4>
                <p className="text-[10px] text-zinc-500 mb-3 leading-normal">
                  Programe a agenda do seu celular para receber um alarme automático 1 hora antes.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-850 hover:border-zinc-750 bg-zinc-950/40 rounded-xl text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 transition-all text-center brand-accent-hover active:scale-95"
                  >
                    <CalendarIcon size={11} className="brand-text-primary" />
                    Google Agenda
                  </a>
                  <button
                    type="button"
                    onClick={downloadICSFile}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-850 hover:border-zinc-750 bg-zinc-950/40 rounded-xl text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 transition-all text-center cursor-pointer brand-accent-hover active:scale-95"
                  >
                    <CalendarIcon size={11} className="brand-text-primary" />
                    iCal / Outlook
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] text-white shadow-lg shadow-emerald-950/50 transition-all duration-300 cursor-pointer active:scale-97"
                >
                  <MessageSquare size={14} />
                  Confirmar por WhatsApp
                </a>
                
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedService(null);
                    setSelectedProfessional(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setClientName('');
                    setClientPhone('');
                    setNotes('');
                    setCreatedAppointment(null);
                  }}
                  className="w-full py-3 rounded-2xl font-semibold text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/60 transition-all cursor-pointer active:scale-97"
                >
                  Agendar Outro Serviço
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Social links */}
      {(tenant.instagram_handle || tenant.facebook_handle) && (
        <footer className="max-w-md mx-auto mt-12 text-center text-xs text-zinc-500 border-t border-zinc-900/50 pt-6 flex flex-col items-center gap-3">
          <span className="font-bold uppercase tracking-widest text-[9px] text-zinc-650">Siga-nos nas Redes Sociais</span>
          <div className="flex gap-4">
            {tenant.instagram_handle && (
              <a
                href={`https://instagram.com/${tenant.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:brand-text-primary transition-colors font-semibold flex items-center gap-1.5"
              >
                📸 Instagram
              </a>
            )}
            {tenant.facebook_handle && (
              <a
                href={`https://facebook.com/${tenant.facebook_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:brand-text-primary transition-colors font-semibold flex items-center gap-1.5"
              >
                📘 Facebook
              </a>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

