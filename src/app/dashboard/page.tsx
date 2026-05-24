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
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [session, setSession] = useState<{ tenant?: Tenant; profile?: any }>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  
  // Tabs: 'appointments' | 'services' | 'business_hours' | 'settings'
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'hours' | 'settings'>('appointments');

  // Service Form Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceDuration, setServiceDuration] = useState(30);
  const [servicePrice, setServicePrice] = useState(50);

  // Profile Settings Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantWhatsapp, setTenantWhatsapp] = useState('');

  // Load session data
  const loadDashboardData = async () => {
    const s = await db.getCurrentSession();
    setSession(s);
    if (s.tenant) {
      const apps = await db.getAppointments(s.tenant.id);
      setAppointments(apps);
      const svcs = await db.getServices(s.tenant.id, true); // include inactive
      setServices(svcs);
      setTenantName(s.tenant.name);
      setTenantWhatsapp(s.tenant.whatsapp_number);
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
      whatsapp_number: tenantWhatsapp
    });
    setSession(prev => ({ ...prev, tenant: updated }));
    alert("Configurações salvas com sucesso!");
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
                            {a.status === 'scheduled' && (
                              <div className="flex gap-1 justify-end">
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
                              <span className="text-xs text-zinc-600 font-medium">Cancelado</span>
                            )}
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
                    <div className="flex gap-4 mt-3 text-xs text-zinc-450">
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
            <p className="text-xs text-zinc-450 mb-6">Defina os dias da semana em que sua empresa está de portas abertas e o horário correspondente.</p>

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
          </div>
        )}

        {/* Tab content 4: Settings */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings size={18} className="text-blue-500" />
              Configurações do Estabelecimento
            </h2>

            <form onSubmit={handleSaveProfile} className="max-w-xl space-y-4 border border-zinc-800 bg-zinc-900/40 p-6 rounded-2xl backdrop-blur-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nome do Estabelecimento / Empresa</label>
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

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Celular de Contato (WhatsApp)</label>
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

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

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
    </div>
  );
}
