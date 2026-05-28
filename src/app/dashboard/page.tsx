"use client";

import React, { useState, useEffect } from 'react';
import { db, Tenant, Service, Appointment } from '../../lib/db';
import {
  Calendar as CalendarIcon,
  Clock,
  Settings,
  Users,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Smartphone,
  CheckCircle,
  TrendingUp,
  Store,
  DollarSign,
  UserCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  MapPin,
  Globe,
  FileText,
  Tag
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [session, setSession] = useState<{ tenant?: Tenant; profile?: any }>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  
  // Tabs: 'appointments' | 'services' | 'hours' | 'settings' | 'professionals' | 'crm'
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'hours' | 'settings' | 'professionals' | 'crm' | 'analytics'>('appointments');

  // Service Form Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceDuration, setServiceDuration] = useState(30);
  const [servicePrice, setServicePrice] = useState(50);

  // Professionals Form Modal State
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState(0); // 0 = Idle, 1 = Processing, 2 = Success
  const [upgradeStatusMessage, setUpgradeStatusMessage] = useState('');
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<any>(null);
  const [profName, setProfName] = useState('');
  const [profSpecialty, setProfSpecialty] = useState('');
  const [profAvatar, setProfAvatar] = useState('');

  // Profile Settings Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantWhatsapp, setTenantWhatsapp] = useState('');
  const [tenantLogo, setTenantLogo] = useState('');
  const [tenantColor, setTenantColor] = useState('#3b82f6');
  const [tenantInstagram, setTenantInstagram] = useState('');
  const [tenantFacebook, setTenantFacebook] = useState('');
  const [tenantAddress, setTenantAddress] = useState('');
  const [tenantNiche, setTenantNiche] = useState('');
  const [tenantDescription, setTenantDescription] = useState('');
  const [tenantWebsite, setTenantWebsite] = useState('');
  const [tenantPixKey, setTenantPixKey] = useState('');
  const [tenantSuccessMessage, setTenantSuccessMessage] = useState('');

  // Load session data
  const loadDashboardData = async () => {
    const s = await db.getCurrentSession();
    setSession(s);
    if (s.tenant) {
      const apps = await db.getAppointments(s.tenant.id);
      setAppointments(apps);
      const svcs = await db.getServices(s.tenant.id, true); // include inactive
      setServices(svcs);
      const profs = await db.getProfessionals(s.tenant.id, true); // include inactive
      setProfessionals(profs);
      setBlockedDates(s.tenant.blocked_dates || []);

      // Safeguard for Personal plan restrictions
      if (s.tenant.plan_type === 'personal' && (activeTab === 'crm' || activeTab === 'analytics')) {
        setActiveTab('appointments');
      }

      setTenantName(s.tenant.name);
      setTenantWhatsapp(s.tenant.whatsapp_number);
      setTenantLogo(s.tenant.logo_url || '');
      setTenantColor(s.tenant.primary_color || '#3b82f6');
      setTenantInstagram(s.tenant.instagram_handle || '');
      setTenantFacebook(s.tenant.facebook_handle || '');
      setTenantAddress(s.tenant.address || '');
      setTenantNiche(s.tenant.niche || '');
      setTenantDescription(s.tenant.description || '');
      setTenantWebsite(s.tenant.website_url || '');
      setTenantPixKey(s.tenant.pix_key || '');
      setTenantSuccessMessage(s.tenant.success_message || '');
    }
    const tenantsList = await db.getTenants();
    setAllTenants(tenantsList);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleTenantSwitch = async (tenantId: string) => {
    await db.switchSessionTenant(tenantId);
    loadDashboardData();
  };

  // Appointments actions
  const handleUpdateStatus = async (appId: string, status: 'confirmed' | 'cancelled') => {
    await db.updateAppointmentStatus(appId, status);
    if (session.tenant) {
      const apps = await db.getAppointments(session.tenant.id);
      setAppointments(apps);
    }
  };

  const getReminderLink = (appointment: Appointment, service: Service | undefined) => {
    const appDate = new Date(appointment.appointment_time);
    const formattedDate = appDate.toLocaleDateString('pt-BR');
    const formattedTime = appDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const profName = professionals.find(p => p.id === appointment.professional_id)?.name || 'nossa equipe';

    const text = `Olá ${appointment.client_name}!\n\n` +
      `Este é um lembrete do seu agendamento de *${service?.name || 'Serviço'}* conosco no estabelecimento *${session.tenant?.name || ''}*:\n\n` +
      `📅 *Data:* ${formattedDate}\n` +
      `⏰ *Horário:* ${formattedTime}\n` +
      `👤 *Profissional:* ${profName}\n` +
      `📍 *Local:* ${session.tenant?.address || 'Não informado'}\n\n` +
      `Estamos te aguardando! Caso precise reagendar ou cancelar, por favor nos avise com antecedência. Obrigado!`;
      
    const cleanPhone = appointment.client_phone.replace(/\D/g, '');
    const prefix = (cleanPhone.length === 10 || cleanPhone.length === 11) ? '55' : '';
    return `https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Service operations
  const handleOpenNewService = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDesc('');
    setServiceDuration(30);
    setServicePrice(50);
    setShowServiceModal(true);
  };

  const handleOpenEditService = (svc: Service) => {
    setEditingService(svc);
    setServiceName(svc.name);
    setServiceDesc(svc.description);
    setServiceDuration(svc.duration_minutes);
    setServicePrice(Number(svc.price));
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.tenant) return;

    if (editingService) {
      await db.updateService(editingService.id, {
        name: serviceName,
        description: serviceDesc,
        duration_minutes: serviceDuration,
        price: servicePrice
      });
    } else {
      await db.createService(session.tenant.id, {
        name: serviceName,
        description: serviceDesc,
        duration_minutes: serviceDuration,
        price: servicePrice,
        is_active: true
      });
    }

    const svcs = await db.getServices(session.tenant.id, true);
    setServices(svcs);
    setShowServiceModal(false);
  };

  const handleToggleServiceActive = async (id: string, currentStatus: boolean) => {
    await db.updateService(id, { is_active: !currentStatus });
    if (session.tenant) {
      const svcs = await db.getServices(session.tenant.id, true);
      setServices(svcs);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      await db.deleteService(id);
      if (session.tenant) {
        const svcs = await db.getServices(session.tenant.id, true);
        setServices(svcs);
      }
    }
  };

  const triggerUpgradeModal = (featureName: string) => {
    setUpgradeFeatureName(featureName);
    setShowUpgradeModal(true);
  };

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.tenant || !newBlockedDate) return;
    const updated = await db.addBlockedDate(session.tenant.id, newBlockedDate);
    setBlockedDates(updated);
    setNewBlockedDate('');
  };

  const handleRemoveBlockedDate = async (dateStr: string) => {
    if (!session.tenant) return;
    if (confirm(`Tem certeza que deseja liberar a data ${new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')}?`)) {
      const updated = await db.removeBlockedDate(session.tenant.id, dateStr);
      setBlockedDates(updated);
    }
  };

  // Professional Operations
  const handleOpenNewProfessional = () => {
    setEditingProfessional(null);
    setProfName('');
    setProfSpecialty('');
    setProfAvatar('');
    setShowProfessionalModal(true);
  };

  const handleOpenEditProfessional = (prof: any) => {
    setEditingProfessional(prof);
    setProfName(prof.name);
    setProfSpecialty(prof.specialty || '');
    setProfAvatar(prof.avatar_url || '');
    setShowProfessionalModal(true);
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.tenant) return;

    if (!editingProfessional && session.tenant.plan_type === 'personal' && professionals.filter(p => p.is_active).length >= 1) {
      alert("Seu plano pessoal permite apenas 1 profissional ativo.");
      return;
    }

    if (editingProfessional) {
      await db.updateProfessional(editingProfessional.id, {
        name: profName,
        specialty: profSpecialty,
        avatar_url: profAvatar
      });
    } else {
      await db.createProfessional(session.tenant.id, {
        name: profName,
        specialty: profSpecialty,
        avatar_url: profAvatar,
        is_active: true
      });
    }

    const profs = await db.getProfessionals(session.tenant.id, true);
    setProfessionals(profs);
    setShowProfessionalModal(false);
  };

  const handleToggleProfessionalActive = async (id: string, currentStatus: boolean) => {
    if (!session.tenant) return;

    if (session.tenant.plan_type === 'personal') {
      if (currentStatus) {
        // Trying to deactivate
        const activeCount = professionals.filter(p => p.is_active).length;
        if (activeCount <= 1) {
          alert("O seu estabelecimento precisa ter pelo menos um profissional ativo para receber agendamentos.");
          return;
        }
      } else {
        // Trying to activate
        const activeCount = professionals.filter(p => p.is_active).length;
        if (activeCount >= 1) {
          triggerUpgradeModal('Múltiplos Profissionais');
          return;
        }
      }
    }

    await db.updateProfessional(id, { is_active: !currentStatus });
    const profs = await db.getProfessionals(session.tenant.id, true);
    setProfessionals(profs);
  };

  const handleDeleteProfessional = async (id: string) => {
    if (!session.tenant) return;

    if (session.tenant.plan_type === 'personal' && professionals.length <= 1) {
      alert("O Plano Pessoal requer que você possua pelo menos 1 profissional cadastrado para receber agendamentos.");
      return;
    }

    if (confirm("Tem certeza que deseja excluir este profissional?")) {
      await db.deleteProfessional(id);
      const profs = await db.getProfessionals(session.tenant.id, true);
      setProfessionals(profs);
    }
  };

  // Blacklist operation
  const handleToggleBlacklist = async (phone: string) => {
    if (!session.tenant) return;
    if (session.tenant.plan_type === 'personal') {
      triggerUpgradeModal('Bloqueio de Contatos (Blacklist)');
      return;
    }
    const updatedBlacklist = await db.toggleBlacklistNumber(session.tenant.id, phone);
    setSession(prev => ({
      ...prev,
      tenant: {
        ...prev.tenant!,
        blacklist_numbers: updatedBlacklist
      }
    }));
  };

  // CRM helper logic to consolidate unique clients
  const getCrmClients = () => {
    const clientsMap: { [key: string]: { name: string; phone: string; count: number; spent: number } } = {};
    
    appointments.forEach(a => {
      const s = services.find(sv => sv.id === a.service_id);
      const price = s ? Number(s.price) : 0;
      const phoneClean = a.client_phone.trim();
      
      if (!clientsMap[phoneClean]) {
        clientsMap[phoneClean] = {
          name: a.client_name,
          phone: a.client_phone,
          count: 0,
          spent: 0
        };
      }
      
      clientsMap[phoneClean].count += 1;
      if (a.status === 'confirmed') {
        clientsMap[phoneClean].spent += price;
      }
    });
    
    return Object.values(clientsMap);
  };

  // Business Hours operations
  const handleToggleDay = async (dayKey: string, currentActive: boolean) => {
    if (!session.tenant) return;
    const currentHours = { ...session.tenant.business_hours };
    currentHours[dayKey].active = !currentActive;
    
    const updated = await db.updateTenant(session.tenant.id, { business_hours: currentHours });
    setSession(prev => ({ ...prev, tenant: updated }));
  };

  const handleTimeChange = async (dayKey: string, field: 'open' | 'close', value: string) => {
    if (!session.tenant) return;
    const currentHours = { ...session.tenant.business_hours };
    currentHours[dayKey][field] = value;
    
    const updated = await db.updateTenant(session.tenant.id, { business_hours: currentHours });
    setSession(prev => ({ ...prev, tenant: updated }));
  };

  // Profile operations
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.tenant) return;

    const updated = await db.updateTenant(session.tenant.id, {
      name: tenantName,
      whatsapp_number: tenantWhatsapp,
      logo_url: tenantLogo || undefined,
      primary_color: tenantColor,
      instagram_handle: tenantInstagram || undefined,
      facebook_handle: tenantFacebook || undefined,
      address: tenantAddress || undefined,
      niche: tenantNiche,
      description: tenantDescription || undefined,
      website_url: tenantWebsite || undefined,
      pix_key: tenantPixKey || undefined,
      success_message: tenantSuccessMessage || undefined
    });
    setSession(prev => ({ ...prev, tenant: updated }));
    alert("Configurações salvas com sucesso!");
  };

  const handleUpgradePlan = async () => {
    if (!session.tenant) return;

    if (session.tenant.id === 't-3') {
      alert("Demonstração do Plano Pessoal: Para testar todas as funcionalidades do Plano Empresarial, retorne à página inicial e clique em 'Testar Painel Empresarial (Demo)'. Nesta demonstração, as restrições são fixadas.");
      return;
    }

    // Hide general upgrade modal if open
    setShowUpgradeModal(false);
    
    // Start simulation
    setIsUpgrading(true);
    setUpgradeStep(1);
    
    const steps = [
      "Iniciando transição de plano...",
      "Processando simulação de pagamento...",
      "Configurando novos limites do Plano Empresarial...",
      "Finalizando upgrade..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setUpgradeStatusMessage(steps[i]);
      await new Promise(resolve => setTimeout(resolve, i === 1 ? 950 : 650));
    }

    const updated = await db.updateTenant(session.tenant.id, { plan_type: 'enterprise' });
    setSession(prev => ({ ...prev, tenant: updated }));
    setUpgradeStep(2);
  };

  if (!session.tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-zinc-400">Carregando painel...</p>
        </div>
      </div>
    );
  }

  // Analytics helper calculations
  const totalRevenue = appointments
    .filter(a => a.status === 'confirmed')
    .reduce((acc, a) => {
      const s = services.find(sv => sv.id === a.service_id);
      return acc + (s ? Number(s.price) : 0);
    }, 0);

  const activeAppointmentsCount = appointments.filter(a => a.status !== 'cancelled').length;

  const WEEKDAYS_PT = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-900/50 border-r border-zinc-800/80 p-6 flex flex-col justify-between">
        <div>
          {/* Logo / Switcher */}
          <div className="mb-8">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2 font-bold">Multi-tenant Sandbox</span>
            <select
              value={session.tenant.id}
              onChange={(e) => handleTenantSwitch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {allTenants.map(t => (
                <option key={t.id} value={t.id}>🏢 {t.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-zinc-950 border border-zinc-850">
            <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {session.profile?.role === 'admin' ? 'Administrador' : 'Equipe'}
            </span>
            <h4 className="font-bold text-sm mt-2 text-zinc-100">{session.profile?.name}</h4>
            <p className="text-xs text-zinc-500 truncate">{session.profile?.email}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'appointments' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <CalendarIcon size={18} />
              Agenda / Clientes
            </button>
            <button
              onClick={() => setActiveTab('professionals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'professionals' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Users size={18} />
              Equipe / Profissionais
            </button>
            <button
              onClick={() => {
                if (session.tenant?.plan_type === 'personal') {
                  triggerUpgradeModal('Clientes & CRM');
                } else {
                  setActiveTab('crm');
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'crm' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <UserCheck size={18} />
              Clientes & CRM
            </button>
            <button
              onClick={() => {
                if (session.tenant?.plan_type === 'personal') {
                  triggerUpgradeModal('Estatísticas & Analytics');
                } else {
                  setActiveTab('analytics');
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <TrendingUp size={18} />
              Estatísticas 📊
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Briefcase size={18} />
              Serviços
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'hours' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Clock size={18} />
              Horário de Atendimento
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Settings size={18} />
              Configurações do Perfil
            </button>
          </nav>
        </div>

        {/* Footer info & view public page */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <a
            href={`/${session.tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold transition-all cursor-pointer group"
          >
            <span>Ver página pública</span>
            <ExternalLink size={14} className="text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        
        {/* Top welcome row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-zinc-50">{session.tenant.name}</h1>
            <p className="text-zinc-400 text-sm">Painel Administrativo da sua empresa • Nicho {session.tenant.niche}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Faturamento Confirmado</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">R$ {totalRevenue.toFixed(2)}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign size={22} />
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Agendamentos Ativos</span>
              <span className="text-2xl font-black text-blue-400 mt-1 block">{activeAppointmentsCount}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UserCheck size={22} />
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Total de Serviços</span>
              <span className="text-2xl font-black text-zinc-100 mt-1 block">{services.length}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <Briefcase size={22} />
            </div>
          </div>
        </div>

        {/* Tab content 1: Appointments */}
        {activeTab === 'appointments' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-500" />
              Lista de Agendamentos
            </h2>

            {appointments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10">
                <p className="text-zinc-400 font-medium">Nenhum agendamento realizado até o momento.</p>
                <p className="text-xs text-zinc-650 mt-1">Divulgue seu link público para os clientes começarem a agendar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs font-bold uppercase tracking-wider text-zinc-400">
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Serviço / Valor</th>
                      <th className="p-4">Data e Hora</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/80">
                    {appointments.map((a) => {
                      const s = services.find(sv => sv.id === a.service_id);
                      const appDate = new Date(a.appointment_time);
                      return (
                        <tr key={a.id} className="text-sm hover:bg-zinc-900/40 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-zinc-100">{a.client_name}</div>
                            <div className="text-xs text-zinc-500">{a.client_phone}</div>
                            {a.notes && (
                              <div className="text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-0.5 mt-1.5 inline-block">
                                📝 {a.notes}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-zinc-200">{s?.name || 'Serviço deletado'}</div>
                            <div className="text-xs text-zinc-500">{s ? `${s.duration_minutes} min • R$ ${Number(s.price).toFixed(2)}` : ''}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-zinc-200">{appDate.toLocaleDateString('pt-BR')}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock size={12} className="text-blue-500" />
                              {appDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="p-4">
                            {a.status === 'confirmed' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                Confirmado
                              </span>
                            )}
                            {a.status === 'scheduled' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
                                Agendado
                              </span>
                            )}
                            {a.status === 'cancelled' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-wider">
                                Cancelado
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end items-center">
                              {/* Botão de Enviar Lembrete no WhatsApp */}
                              {(a.status === 'scheduled' || a.status === 'confirmed') && (
                                <a
                                  href={getReminderLink(a, s)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Enviar Lembrete por WhatsApp"
                                  className="p-1.5 rounded-lg border border-zinc-800 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5 cursor-pointer transition-all inline-flex items-center"
                                >
                                  <MessageSquare size={14} />
                                </a>
                              )}
                              {a.status === 'scheduled' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleUpdateStatus(a.id, 'confirmed')}
                                    title="Confirmar Horário"
                                    className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/5 cursor-pointer transition-colors"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(a.id, 'cancelled')}
                                    title="Cancelar Horário"
                                    className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-50/10 bg-red-500/5 cursor-pointer transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}
                              {a.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateStatus(a.id, 'cancelled')}
                                  className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-900/30 px-2 py-1.5 bg-red-950/20 hover:bg-red-950/40 rounded-lg cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              )}
                              {a.status === 'cancelled' && (
                                <span className="text-xs text-zinc-650 font-medium">Cancelado</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab content 2: Services */}
        {activeTab === 'services' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Briefcase size={18} className="text-blue-500" />
                Meus Serviços
              </h2>
              <button
                onClick={handleOpenNewService}
                className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
              >
                <Plus size={14} /> Novo Serviço
              </button>
            </div>

            <div className="grid gap-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={`p-5 rounded-2xl border bg-zinc-900/30 border-zinc-800 flex justify-between items-center ${
                    !svc.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-100">{svc.name}</h3>
                      {!svc.is_active && (
                        <span className="text-[9px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded uppercase">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 max-w-lg">{svc.description}</p>
                    <div className="flex gap-4 mt-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {svc.duration_minutes} minutos
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-zinc-300">
                        R$ {Number(svc.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleServiceActive(svc.id, svc.is_active)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                        svc.is_active
                          ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                          : 'border-blue-500/20 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                      }`}
                    >
                      {svc.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleOpenEditService(svc)}
                      className="p-2 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(svc.id)}
                      className="p-2 border border-red-500/20 hover:bg-red-500/10 rounded-lg text-red-500/80 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab content 3: Business Hours */}
        {activeTab === 'hours' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Horário de Funcionamento
            </h2>
            <p className="text-xs text-zinc-400 mb-6">Defina os dias da semana em que sua empresa está de portas abertas e o horário correspondente.</p>

            <div className="border border-zinc-800/80 rounded-2xl divide-y divide-zinc-850/80 bg-zinc-900/30">
              {Object.entries(session.tenant.business_hours).map(([dayKey, bh]: [string, any]) => {
                const dayLabel = WEEKDAYS_PT[dayKey as keyof typeof WEEKDAYS_PT];
                return (
                  <div key={dayKey} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={bh.active}
                        onChange={() => handleToggleDay(dayKey, bh.active)}
                        className="w-4.5 h-4.5 accent-blue-600 rounded bg-zinc-950 border-zinc-800 cursor-pointer"
                      />
                      <span className={`font-semibold text-sm ${bh.active ? 'text-zinc-100' : 'text-zinc-500'}`}>
                        {dayLabel}
                      </span>
                    </div>

                    {bh.active ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-500">De</span>
                        <input
                          type="time"
                          value={bh.open}
                          onChange={(e) => handleTimeChange(dayKey, 'open', e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs font-semibold"
                        />
                        <span className="text-zinc-500">às</span>
                        <input
                          type="time"
                          value={bh.close}
                          onChange={(e) => handleTimeChange(dayKey, 'close', e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs font-semibold"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-red-500/80 font-bold bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded">
                        FECHADO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Blocked Dates Section */}
            <div className="mt-8 border-t border-zinc-800/80 pt-8">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-500" />
                Bloqueio de Datas Especiais & Folgas
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Bloqueie datas específicas (ex: feriados, folgas ou férias) para impedir novos agendamentos na sua agenda pública.
              </p>

              <form onSubmit={handleAddBlockedDate} className="flex flex-col sm:flex-row gap-3 max-w-md mb-6">
                <input
                  type="date"
                  required
                  value={newBlockedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-500 flex-1"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 py-3 cursor-pointer shadow-lg transition-all"
                >
                  Bloquear Data
                </button>
              </form>

              {blockedDates.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/10">
                  <p className="text-zinc-500 text-xs font-medium">Nenhuma data bloqueada no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {blockedDates.sort().map((dateStr) => {
                    const localDate = new Date(dateStr + 'T00:00:00');
                    return (
                      <div
                        key={dateStr}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm"
                      >
                        <span className="text-xs font-semibold text-zinc-200">
                          📅 ${localDate.toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(dateStr)}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                          title="Remover Bloqueio"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab content: Professionals */}
        {activeTab === 'professionals' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Membros da Equipe / Profissionais
                </h2>
                {session.tenant?.plan_type === 'personal' && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <span>🔒</span> Você está no <strong>Plano Pessoal</strong> (Limite: 1 profissional ativo)
                  </p>
                )}
              </div>
              {session.tenant?.plan_type === 'personal' && professionals.filter(p => p.is_active).length >= 1 ? (
                <button
                  onClick={() => triggerUpgradeModal('Múltiplos Profissionais')}
                  className="flex items-center gap-1.5 text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 rounded-xl px-4 py-2.5 shadow-lg transition-all cursor-pointer"
                >
                  <span>🔒</span> Novo Profissional
                </button>
              ) : (
                <button
                  onClick={handleOpenNewProfessional}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Novo Profissional
                </button>
              )}
            </div>

            <div className="grid gap-3">
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  className={`p-5 rounded-2xl border bg-zinc-900/30 border-zinc-800 flex justify-between items-center ${
                    !prof.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {prof.avatar_url ? (
                      <img
                        src={prof.avatar_url}
                        alt={prof.name}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-850"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-sm text-blue-400">
                        {prof.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-100">{prof.name}</h3>
                        {!prof.is_active && (
                          <span className="text-[9px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded uppercase">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{prof.specialty || 'Profissional Geral'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleProfessionalActive(prof.id, prof.is_active)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                        prof.is_active
                          ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                          : 'border-blue-500/20 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                      }`}
                    >
                      {prof.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleOpenEditProfessional(prof)}
                      className="p-2 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProfessional(prof.id)}
                      className="p-2 border border-red-500/20 hover:bg-red-500/10 rounded-lg text-red-500/80 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab content: CRM Clients */}
        {activeTab === 'crm' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-blue-500" />
              Gestão de Clientes & CRM
            </h2>
            <p className="text-xs text-zinc-400 mb-6">Lista consolidada de contatos que efetuaram agendamentos na sua plataforma com relatórios de gastos acumulados e blacklist.</p>

            {getCrmClients().length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10">
                <p className="text-zinc-400 font-medium">Nenhum cliente cadastrado no CRM.</p>
                <p className="text-xs text-zinc-650 mt-1">Os clientes aparecerão aqui assim que realizarem seu primeiro agendamento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs font-bold uppercase tracking-wider text-zinc-400">
                      <th className="p-4">Cliente / Telefone</th>
                      <th className="p-4 text-center">Agendamentos Totais</th>
                      <th className="p-4">Faturamento Acumulado</th>
                      <th className="p-4">Status da Conta</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/80">
                    {getCrmClients().map((c) => {
                      const isBlacklisted = session.tenant?.blacklist_numbers?.includes(c.phone);
                      return (
                        <tr key={c.phone} className="text-sm hover:bg-zinc-900/40 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-zinc-100">{c.name}</div>
                            <div className="text-xs text-zinc-400 mt-0.5">{c.phone}</div>
                          </td>
                          <td className="p-4 text-center font-bold text-zinc-300">
                            {c.count}
                          </td>
                          <td className="p-4 font-black text-emerald-400">
                            R$ {c.spent.toFixed(2)}
                          </td>
                          <td className="p-4">
                            {isBlacklisted ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-500 uppercase tracking-wider">
                                Bloqueado (Blacklist)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                Ativo / Sem Restrições
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  if (session.tenant?.plan_type === 'personal') {
                                    triggerUpgradeModal('Fidelização via WhatsApp');
                                    return;
                                  }
                                  
                                  // Get client last service
                                  const clientAppointments = appointments.filter(a => a.client_phone === c.phone);
                                  const lastApp = clientAppointments[clientAppointments.length - 1];
                                  const lastService = lastApp ? services.find(s => s.id === lastApp.service_id) : null;
                                  const serviceName = lastService ? lastService.name : 'um serviço';
                                  
                                  const text = `Olá ${c.name}!\n\nSentimos sua falta no *${session.tenant?.name}*!\nNotamos que faz um tempo desde o seu último agendamento de *${serviceName}*.\n\nQue tal aproveitar para agendar seu próximo horário? Garanta seu atendimento clicando no link abaixo:\n🔗 ${window.location.origin}/${session.tenant?.slug}\n\nQualquer dúvida, estamos à disposição!`;
                                    
                                  const cleanPhone = c.phone.replace(/\D/g, '');
                                  const prefix = (cleanPhone.length === 10 || cleanPhone.length === 11) ? '55' : '';
                                  const link = `https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(text)}`;
                                  window.open(link, '_blank');
                                }}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                {session.tenant?.plan_type === 'personal' && <span>🔒</span>}
                                Fidelizar
                              </button>
                              <button
                                onClick={() => handleToggleBlacklist(c.phone)}
                                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isBlacklisted
                                    ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                                    : 'border-red-500/20 text-red-400 bg-red-950/20 hover:bg-red-950/40'
                                }`}
                              >
                                {isBlacklisted ? 'Desbloquear Número' : 'Bloquear / Blacklist'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab content: Analytics */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300">
            {session.tenant?.plan_type === 'personal' ? (
              <div className="p-12 text-center rounded-3xl border border-zinc-800 bg-zinc-900/10 backdrop-blur-md max-w-xl mx-auto my-8 relative overflow-hidden text-zinc-100">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-blue-600/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-6 shadow-xl">
                  <TrendingUp size={28} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-50">Estatísticas & Insights Bloqueados</h3>
                <p className="text-xs text-zinc-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
                  O painel de estatísticas, faturamento agregado, ticket médio e serviços populares é um recurso exclusivo do **Plano Empresarial**. 
                  No momento, seu estabelecimento está no **Plano Pessoal**.
                </p>
                <div className="border-t border-zinc-850/80 my-6" />
                <div className="flex flex-col items-center gap-3">
                  <div className="text-xs text-zinc-400 font-semibold">
                    Faça o upgrade agora por apenas <span className="font-bold text-zinc-200">R$ 94,90/mês</span>
                  </div>
                   <button
                    onClick={handleUpgradePlan}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                  >
                    🚀 Assinar Plano Empresarial
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" />
                  Painel de Estatísticas e Desempenho
                </h2>

                {/* Grid de Metricas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Receita Estimada (Mês)</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">
                      R$ {totalRevenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-1">Baseado em agendamentos confirmados</span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Ticket Médio</span>
                    <span className="text-2xl font-black text-blue-400 mt-1 block">
                      R$ {appointments.filter(a => a.status === 'confirmed').length > 0 
                        ? (totalRevenue / appointments.filter(a => a.status === 'confirmed').length).toFixed(2)
                        : '0.00'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-1">Média gasta por cliente</span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Agendamentos Totais</span>
                    <span className="text-2xl font-black text-zinc-100 mt-1 block">{appointments.length}</span>
                    <span className="text-[10px] text-zinc-500 block mt-1">Histórico completo</span>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider block">Taxa de Cancelamento</span>
                    <span className="text-2xl font-black text-red-400 mt-1 block">
                      {appointments.length > 0 
                        ? ((appointments.filter(a => a.status === 'cancelled').length / appointments.length) * 100).toFixed(0) + '%'
                        : '0%'}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      {appointments.filter(a => a.status === 'cancelled').length} cancelamentos
                    </span>
                  </div>
                </div>

                {/* Popularidade de Serviços */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">Popularidade dos Serviços</h3>
                  <div className="space-y-4">
                    {services.map(svc => {
                      const count = appointments.filter(a => a.service_id === svc.id).length;
                      const maxCount = Math.max(...services.map(s => appointments.filter(a => a.service_id === s.id).length), 1);
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={svc.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-zinc-300">{svc.name}</span>
                            <span className="text-zinc-400">{count} agendamento{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="w-full bg-zinc-950 border border-zinc-850 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab content 4: Settings */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings size={18} className="text-blue-500" />
              Configurações do Estabelecimento
            </h2>

            <form onSubmit={handleSaveProfile} className="max-w-xl space-y-6 border border-zinc-800 bg-zinc-900/40 p-6 rounded-2xl backdrop-blur-sm">
              
              {/* Section 1: Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-zinc-800/80 pb-2">Informações Básicas</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Nome do Estabelecimento / Empresa</label>
                  <div className="relative">
                    <Store size={16} className="absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Ramo de Atividade</label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-3 top-3.5 text-zinc-500 pointer-events-none" />
                      <select
                        value={tenantNiche}
                        onChange={(e) => setTenantNiche(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
                      >
                        <option value="Beleza e Estética">Beleza e Estética</option>
                        <option value="Saúde e Odontologia">Saúde e Odontologia</option>
                        <option value="Fitness e Bem-Estar">Fitness e Bem-Estar</option>
                        <option value="default">Outros / Padrão</option>
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-500">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Website Oficial</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3 top-3 text-zinc-500" />
                      <input
                        type="url"
                        value={tenantWebsite}
                        onChange={(e) => setTenantWebsite(e.target.value)}
                        placeholder="https://suaempresa.com.br"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Sobre o Estabelecimento / Descrição</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3 top-3 text-zinc-500" />
                    <textarea
                      value={tenantDescription}
                      onChange={(e) => setTenantDescription(e.target.value)}
                      placeholder="Descreva brevemente os serviços e o diferencial do seu estabelecimento..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-750 focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Logotipo do Estabelecimento (URL da Imagem)</label>
                  <input
                    type="url"
                    value={tenantLogo}
                    onChange={(e) => setTenantLogo(e.target.value)}
                    placeholder="https://exemplo.com/sua-logo.png"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Section 2: Localização e Contato */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-zinc-800/80 pb-2">Localização e Contato</h3>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Celular de Contato (WhatsApp)</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={tenantWhatsapp}
                      onChange={(e) => setTenantWhatsapp(e.target.value)}
                      placeholder="Ex: +55 11 99999-9999"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Endereço Físico</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      value={tenantAddress}
                      onChange={(e) => setTenantAddress(e.target.value)}
                      placeholder="Av. Paulista, 1000 - São Paulo, SP"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Redes Sociais */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-zinc-800/80 pb-2">Redes Sociais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Instagram (Nome de Usuário)</label>
                    <input
                      type="text"
                      value={tenantInstagram}
                      onChange={(e) => setTenantInstagram(e.target.value)}
                      placeholder="ex: barbearia_vintage"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Facebook (Nome de Usuário)</label>
                    <input
                      type="text"
                      value={tenantFacebook}
                      onChange={(e) => setTenantFacebook(e.target.value)}
                      placeholder="ex: barbearia.vintage.oficial"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Aparência e Personalização */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-zinc-800/80 pb-2">Aparência e Cores</h3>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Cor Primária da Agenda (White-label)</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={tenantColor}
                      onChange={(e) => setTenantColor(e.target.value)}
                      className="w-12 h-10 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={tenantColor}
                      onChange={(e) => setTenantColor(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-blue-500 w-28"
                    />
                    <span className="text-[10px] text-zinc-500">Cor aplicada aos botões, links e destaques da agenda pública.</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Pagamento e Confirmação */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 border-b border-zinc-800/80 pb-2">Pagamento e Mensagens</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Chave PIX (Para sinal/pagamento facilitado)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      value={tenantPixKey}
                      onChange={(e) => setTenantPixKey(e.target.value)}
                      placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Mensagem de Sucesso Personalizada</label>
                  <textarea
                    value={tenantSuccessMessage}
                    onChange={(e) => setTenantSuccessMessage(e.target.value)}
                    placeholder="Ex: Chegue com 10 minutos de antecedência. Em caso de dúvidas, envie mensagem."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none"
                  />
                  <span className="text-[10px] text-zinc-500 block mt-1">Exibida na tela de confirmação de agendamento e enviada nas instruções.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        )}


      </main>

      {/* Upgrade Invitation Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Recurso Exclusivo</h3>
            <p className="text-xs text-zinc-400 mt-2">
              A funcionalidade de <strong>{upgradeFeatureName}</strong> está disponível apenas para assinantes do <strong>Plano Empresarial</strong>.
            </p>
            <div className="border-t border-zinc-850/80 my-4" />
            <div className="flex flex-col gap-3">
              <button
                onClick={handleUpgradePlan}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/20"
              >
                🚀 Assinar Plano Empresarial (R$ 94,90/mês)
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Service Modal Dialog */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-zinc-100">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Corte de Cabelo"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Descrição</label>
                <textarea
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Descreva o que o serviço inclui..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Duração (minutos)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Preço (R$)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.5}
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-800/80 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* New/Edit Professional Modal Dialog */}
      {showProfessionalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center bg-zinc-950">
              <h3 className="font-bold text-zinc-100">
                {editingProfessional ? 'Editar Profissional' : 'Cadastrar Membro da Equipe'}
              </h3>
              <button
                onClick={() => setShowProfessionalModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfessional} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nome do Profissional</label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="Ex: Roberto Carlos"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Especialidade / Cargo</label>
                <input
                  type="text"
                  required
                  value={profSpecialty}
                  onChange={(e) => setProfSpecialty(e.target.value)}
                  placeholder="Ex: Cabeleireiro e Visagista"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Foto de Avatar (URL)</label>
                <input
                  type="url"
                  value={profAvatar}
                  onChange={(e) => setProfAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-zinc-800/80 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowProfessionalModal(false)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Upgrade Processing Modal */}
      {isUpgrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 text-center relative">
            {upgradeStep === 1 ? (
              <div className="space-y-6 py-4">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                  <TrendingUp size={24} className="text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Processando Assinatura</h3>
                  <p className="text-xs text-zinc-400 mt-1">Aguarde enquanto ativamos seus novos recursos.</p>
                </div>
                <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                  <span className="text-[11px] font-mono text-zinc-400 block transition-all animate-pulse">
                    {upgradeStatusMessage}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/5">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-50">Plano Empresarial Ativo!</h3>
                  <p className="text-xs text-zinc-400 mt-2">
                    Parabéns! Seu estabelecimento agora possui acesso completo a profissionais ilimitados, CRM avançado, blacklist e estatísticas detalhadas.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsUpgrading(false);
                    setUpgradeStep(0);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/20"
                >
                  Acessar Recursos Liberados
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
