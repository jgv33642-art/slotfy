"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, Tenant } from '../lib/db';
import { Calendar, Clock, Sparkles, Shield, ArrowRight, Store, ArrowUpRight, MessageSquare, Check, Layers, X, AlertCircle, CheckCircle2, MapPin, User, Mail, Lock, Phone, Sparkle } from 'lucide-react';

export default function Home() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Checkout modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'personal' | 'enterprise'>('personal');
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Form, 2 = Loading/Processing, 3 = Success
  const [loadingMessage, setLoadingMessage] = useState('Processando dados...');
  const [checkoutError, setCheckoutError] = useState('');

  // Super Admin states
  const [showSuperAdminPrompt, setShowSuperAdminPrompt] = useState(false);
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);
  const [adminTenants, setAdminTenants] = useState<Tenant[]>([]);
  const [superAdminError, setSuperAdminError] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [niche, setNiche] = useState('Beleza e Estética');

  useEffect(() => {
    const fetchTenants = async () => {
      const data = await db.getTenants();
      setTenants(data);
    };
    fetchTenants();
  }, []);

  const handleTestDemo = async (tenantId: string) => {
    await db.switchSessionTenant(tenantId);
    window.location.href = '/dashboard';
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutStep(2);

    const steps = [
      { text: 'Verificando dados cadastrais...', time: 600 },
      { text: 'Processando pagamento da assinatura...', time: 800 },
      { text: 'Criando estrutura lógica do estabelecimento...', time: 800 },
      { text: 'Instalando temas e configurações...', time: 600 },
      { text: 'Concluindo ativação de conta...', time: 500 }
    ];

    try {
      for (const s of steps) {
        setLoadingMessage(s.text);
        await new Promise(resolve => setTimeout(resolve, s.time));
      }

      if (db.isSupabaseActive()) {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: fullName,
            email,
            password,
            tenantName: businessName,
            whatsappNumber: whatsapp,
            address,
            niche,
            plan: selectedPlan
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar conta');
        }

        if (data.paymentRequired) {
          window.location.href = data.url;
          return;
        }
      } else {
        // Fallback local localStorage registration
        await db.registerTenant({
          name: fullName,
          email,
          password,
          tenantName: businessName,
          whatsappNumber: whatsapp,
          address,
          niche,
          plan: selectedPlan
        });
      }

      setCheckoutStep(3);
    } catch (err: any) {
      console.error(err);
      setCheckoutError(err.message || 'Ocorreu um erro no processamento. Tente novamente.');
      setCheckoutStep(1);
    }
  };

  // Super Admin Handlers
  const handleSuperAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperAdminError('');
    if (superAdminPassword === '33642') {
      setShowSuperAdminPrompt(false);
      setShowSuperAdminPanel(true);
      setSuperAdminPassword('');
      await loadAllTenantsAdmin();
    } else {
      setSuperAdminError('Senha incorreta do administrador do sistema.');
    }
  };

  const loadAllTenantsAdmin = async () => {
    if (db.getAllTenantsAdmin) {
      const data = await db.getAllTenantsAdmin();
      setAdminTenants(data);
    }
  };

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    if (db.updateTenantStatusAdmin) {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await db.updateTenantStatusAdmin(tenantId, newStatus);
      await loadAllTenantsAdmin();
    }
  };

  const handleToggleTenantPlan = async (tenantId: string, currentPlan: 'personal' | 'enterprise') => {
    if (db.updateTenantPlanAdmin) {
      const newPlan = currentPlan === 'enterprise' ? 'personal' : 'enterprise';
      await db.updateTenantPlanAdmin(tenantId, newPlan);
      await loadAllTenantsAdmin();
    }
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (confirm(`Tem certeza de que deseja excluir permanentemente a conta de "${tenantName}"? Todos os agendamentos, serviços e profissionais vinculados serão deletados.`)) {
      if (db.deleteTenantAdmin) {
        await db.deleteTenantAdmin(tenantId);
        await loadAllTenantsAdmin();
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-blue-500/20">
              S
            </div>
            <span className="font-black text-md tracking-tight text-zinc-50">Slotfy</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Super Admin Lock Button */}
            <button
              onClick={() => {
                setSuperAdminError('');
                setSuperAdminPassword('');
                setShowSuperAdminPrompt(true);
              }}
              title="Painel do Dono do SaaS"
              className="p-2 text-zinc-650 hover:text-zinc-400 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all cursor-pointer inline-flex items-center justify-center mr-1"
            >
              <Lock size={15} />
            </button>
            <Link
              href="/login"
              className="text-xs font-bold text-zinc-400 hover:text-zinc-200 px-4 py-2 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-all"
            >
              Área do Parceiro
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1"
            >
              Acessar Painel <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles size={12} /> Nova Geração de Agendamentos Online
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-none text-zinc-50">
          A agenda online perfeita para o seu <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">negócio prosperar</span>
        </h1>
        
        <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
          Slotfy é a solução SaaS multi-tenant definitiva. Tenha uma página de agendamentos automatizada e personalizada para o seu nicho, integrada com WhatsApp e painel administrativo completo.
        </p>

        {/* Side-by-side Pricing Plans Grid directly in the Hero fold */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 text-left">
          {/* Plan 1: Plano Pessoal */}
          <div className="p-7 rounded-3xl border border-zinc-850 bg-zinc-900/10 hover:border-zinc-800 transition-all flex flex-col justify-between relative group shadow-xl">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-zinc-800/10 rounded-full blur-[40px] pointer-events-none" />
            
            <div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Profissional Autônomo</span>
              <h3 className="text-xl font-black text-zinc-50 mt-1">Plano Pessoal</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Ideal para profissionais autônomos. Agenda individual, configurações de marca e lembretes automáticos.
              </p>
              
              <div className="flex items-baseline gap-1 mt-5">
                <span className="text-base font-bold text-zinc-400">R$</span>
                <span className="text-5xl font-black text-emerald-450 tracking-tight">29,90</span>
                <span className="text-zinc-500 text-xs font-semibold">/mês</span>
              </div>

              <div className="border-t border-zinc-850/80 my-5" />

              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check size={9} />
                  </span>
                  Agendamentos Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check size={9} />
                  </span>
                  Confirmação via WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check size={9} />
                  </span>
                  Configurações de Cores e Logos
                </li>
                <li className="flex items-center gap-2 text-zinc-600">
                  <span className="w-4 h-4 rounded-full bg-zinc-900/60 border border-zinc-850 flex items-center justify-center text-zinc-500 shrink-0">
                    <X size={9} />
                  </span>
                  Sem Gestão de Equipe (1 profissional)
                </li>
              </ul>
            </div>
 
            <div className="mt-7 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('personal');
                  setShowCheckoutModal(true);
                  setCheckoutStep(1);
                  setCheckoutError('');
                }}
                className="w-full py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 bg-zinc-950 text-center font-bold text-xs text-zinc-200 block transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                Assinar Plano Pessoal
              </button>
              
              <button
                type="button"
                onClick={() => handleTestDemo('t-3')}
                className="w-full py-2.5 rounded-xl border border-zinc-850 hover:border-zinc-800 hover:bg-zinc-900 text-center font-semibold text-[11px] text-zinc-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>⚡</span> Testar Painel Pessoal (Demo)
              </button>
            </div>
          </div>
 
          {/* Plan 2: Plano Empresarial */}
          <div className="p-7 rounded-3xl border border-blue-500/30 bg-blue-955/5 hover:border-blue-500/55 transition-all flex flex-col justify-between relative group shadow-lg shadow-blue-900/5">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-blue-600/10 rounded-full blur-[50px] pointer-events-none" />
            
            {/* Tag Popular */}
            <div className="absolute -top-3 right-6 bg-blue-600 border border-blue-400/20 text-white font-bold text-[8px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
              Mais Vendido
            </div>
 
            <div>
              <span className="text-[9px] text-blue-400 uppercase tracking-widest font-bold block mb-1">Para Estabelecimentos</span>
              <h3 className="text-xl font-black text-zinc-50 mt-1">Plano Empresarial</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Ideal para clínicas, salões e equipes. Múltiplos profissionais, CRM de faturamento e blacklist.
              </p>
              
              <div className="flex items-baseline gap-1 mt-5">
                <span className="text-base font-bold text-zinc-400">R$</span>
                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 tracking-tight">94,90</span>
                <span className="text-zinc-500 text-xs font-semibold">/mês</span>
              </div>
 
              <div className="border-t border-zinc-850/80 my-5" />
 
              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-400/25 flex items-center justify-center text-blue-400 shrink-0">
                    <Check size={9} />
                  </span>
                  Todos os recursos do Plano Pessoal
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-400/25 flex items-center justify-center text-blue-400 shrink-0">
                    <Check size={9} />
                  </span>
                  Múltiplos Profissionais / Atendentes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-400/25 flex items-center justify-center text-blue-400 shrink-0">
                    <Check size={9} />
                  </span>
                  Painel CRM, Faturamento e Blacklist
                </li>
              </ul>
            </div>
 
            <div className="mt-7 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('enterprise');
                  setShowCheckoutModal(true);
                  setCheckoutStep(1);
                  setCheckoutError('');
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-center font-bold text-xs text-white block shadow-lg shadow-blue-500/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                Assinar Plano Empresarial
              </button>
              
              <button
                type="button"
                onClick={() => handleTestDemo('t-1')}
                className="w-full py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-center font-semibold text-[11px] text-blue-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🚀</span> Testar Painel Empresarial (Demo)
              </button>
            </div>
          </div>
        </div>

        {/* Hero actions in smaller scale below the two plans */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link
            href="/dashboard"
            className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            Experimentar Painel Administrativo
            <ArrowRight size={13} />
          </Link>
          <a
            href="#demos"
            className="px-4.5 py-2.5 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900 bg-zinc-950/20 text-zinc-400 hover:text-zinc-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            Ver agendas de demonstração
          </a>
        </div>
      </section>

      {/* Active Demos Section */}
      <section id="demos" className="max-w-5xl mx-auto px-6 py-12 relative z-10 border-t border-zinc-900">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-zinc-50">Nossos Modelos de Agendas em Ação</h2>
          <p className="text-xs text-zinc-500 mt-2">Clique em um dos estabelecimentos abaixo para abrir a página pública de agendamentos como se fosse um cliente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tenants.map((t) => {
            const isBarber = t.slug === 'barbearia-vintage';
            const isClinic = t.slug === 'sorriso-saudavel';
            return (
              <div
                key={t.id}
                className="group p-6 rounded-2xl border border-zinc-850 bg-zinc-900/20 hover:bg-zinc-900/60 backdrop-blur-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 font-bold text-md ${
                    isBarber 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                      : isClinic 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    {t.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">{t.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{t.niche}</p>
                  
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Dias de funcionamento:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(t.business_hours).map(([day, val]) => {
                        const letters = { monday: 'S', tuesday: 'T', wednesday: 'Q', thursday: 'Q', friday: 'S', saturday: 'S', sunday: 'D' };
                        return (
                          <span
                            key={day}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border ${
                              val.active
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                : 'bg-red-950/20 border-red-900/15 text-red-500/60'
                            }`}
                            title={val.active ? `${letters[day as keyof typeof letters]}: Aberto` : 'Fechado'}
                          >
                            {letters[day as keyof typeof letters]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-medium">Link: /{t.slug}</span>
                  <Link
                    href={`/${t.slug}`}
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                  >
                    Agendar Horário <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-900 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-zinc-50">Por que escolher o Slotfy?</h2>
          <p className="text-xs text-zinc-500 mt-2">Nossos diferenciais desenvolvidos para simplificar o cotidiano da sua empresa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800/80 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Layers size={18} />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Estrutura Multi-Tenant</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Cada estabelecimento possui seu próprio banco de dados lógico, serviços exclusivos, funcionários e horários de funcionamento específicos.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800/80 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <MessageSquare size={18} />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Notificações por WhatsApp</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Após confirmar o agendamento no site, o cliente é direcionado para enviar os dados da reserva no WhatsApp do estabelecimento com um clique.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800/80 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Clock size={18} />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Evite Conflitos de Agenda</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Nosso algoritmo calcula slots vagos em tempo real, respeitando a duração do serviço escolhido e as reservas já confirmadas dos profissionais.
            </p>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
            
            {/* Background glowing lights inside modal */}
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-5 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="font-black text-lg text-zinc-50 flex items-center gap-2">
                  <Sparkle className="text-blue-500 fill-blue-500/20" size={18} />
                  Ative sua Agenda Slotfy
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Preencha as informações básicas para efetuar a compra do plano.</p>
              </div>
              {checkoutStep !== 2 && (
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Content Switch */}
            {checkoutStep === 1 && (
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-6">
                
                {/* Plan Selector / Banner */}
                <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Plano Selecionado</span>
                    <h4 className="font-bold text-sm text-zinc-100">
                      {selectedPlan === 'enterprise' ? 'Plano Empresarial - Liberação Total' : 'Plano Pessoal - Ativação Simples'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-zinc-50">
                      {selectedPlan === 'enterprise' ? 'R$ 94,90' : 'R$ 29,90'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      /mês
                    </span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-400">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Account Details */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">
                      1. Informações de Acesso
                    </h5>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Nome Completo</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-3 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex: Carlos Oliveira"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">E-mail Corporativo</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-3 text-zinc-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="carlos@barbearia.com"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Senha de Acesso</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-3 text-zinc-500" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Business Details */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">
                      2. Dados da sua Agenda
                    </h5>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Nome do Estabelecimento</label>
                      <div className="relative">
                        <Store size={14} className="absolute left-3 top-3 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Ex: Barbearia Imperial"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">WhatsApp para Contato</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-3 text-zinc-500" />
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="Ex: +55 (11) 99999-9999"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Endereço do Estabelecimento</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-3 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Rua das Flores, 123 - Centro, SP"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Nicho de Negócio</label>
                      <select
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        <option value="Beleza e Estética">Beleza e Estética (Barbearia/Salão)</option>
                        <option value="Saúde e Odontologia">Saúde e Odontologia (Clínicas)</option>
                        <option value="Fitness e Bem-Estar">Fitness e Bem-Estar (Pilates/Yoga)</option>
                        <option value="Serviços Gerais">Outro Nicho de Serviços</option>
                      </select>
                    </div>
                  </div>

                </div>

                <div className="border-t border-zinc-800/80 pt-4 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="px-5 py-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-blue-500/20"
                  >
                    Confirmar e Ativar Agenda
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Processing Payment & Database setup */}
            {checkoutStep === 2 && (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-6">
                <div className="relative w-20 h-20">
                  {/* Glowing spinner animations */}
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin duration-1000" />
                </div>
                
                <div>
                  <h4 className="font-bold text-md text-zinc-100">Configurando sua Plataforma</h4>
                  <p className="text-xs text-zinc-500 mt-2 animate-pulse">{loadingMessage}</p>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {checkoutStep === 3 && (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-6 animate-in scale-in duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                  <CheckCircle2 size={32} />
                </div>
                
                <div>
                  <h4 className="font-black text-xl text-zinc-50">Plataforma Ativada com Sucesso!</h4>
                  <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto">
                    Parabéns! Sua assinatura foi confirmada. O estabelecimento <strong>{businessName}</strong> foi cadastrado e sua agenda está ativa e pronta para receber agendamentos.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 text-xs text-zinc-400 max-w-md w-full text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Endereço da Agenda Pública:</span>
                    <Link
                      href={`/${businessName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`}
                      target="_blank"
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      /{businessName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">E-mail Administrativo:</span>
                    <span className="text-zinc-200 font-semibold">{email}</span>
                  </div>
                </div>

                <div className="pt-2 w-full max-w-xs">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Acessar Painel Administrativo
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Super Admin Password Prompt Modal */}
      {showSuperAdminPrompt && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSuperAdminPrompt(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mx-auto mb-3">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-zinc-50">Área do Proprietário</h3>
              <p className="text-xs text-zinc-500 mt-1">Digite a senha padrão do sistema para gerenciar as assinaturas.</p>
            </div>

            <form onSubmit={handleSuperAdminAuth} className="space-y-4">
              {superAdminError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 text-center font-semibold">
                  {superAdminError}
                </div>
              )}
              <div>
                <input
                  type="password"
                  required
                  placeholder="Senha de Acesso (padrão: 33642)"
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 text-center"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Acessar Painel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Panel Modal */}
      {showSuperAdminPanel && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-5 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="font-black text-lg text-zinc-50 flex items-center gap-2">
                  <Shield className="text-blue-500" size={18} />
                  Super Painel do Proprietário SaaS
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Métricas de receita e controle total de estabelecimentos cadastrados.</p>
              </div>
              <button
                onClick={() => setShowSuperAdminPanel(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-800/80 bg-zinc-950/20">
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Clientes Registrados</span>
                <span className="text-2xl font-black text-zinc-100 block mt-1">{adminTenants.length}</span>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Assinaturas Ativas</span>
                <span className="text-2xl font-black text-emerald-400 block mt-1">
                  {adminTenants.filter(t => t.subscription_status === 'active').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Projeção MRR (Mensal)</span>
                <span className="text-2xl font-black text-blue-400 block mt-1 font-mono">
                  R$ {adminTenants
                    .filter(t => t.subscription_status === 'active')
                    .reduce((acc, t) => acc + (t.plan_type === 'enterprise' ? 94.90 : 29.90), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tenants List Table */}
            <div className="p-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Gerenciar Estabelecimentos</h4>
              {adminTenants.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-2xl">
                  Nenhum estabelecimento registrado no momento.
                </div>
              ) : (
                <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-zinc-950/30">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="p-3.5">Nome / Slug</th>
                        <th className="p-3.5">Contato / Endereço</th>
                        <th className="p-3.5">Categoria Plano</th>
                        <th className="p-3.5">Status Assinatura</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {adminTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-zinc-100">{t.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">/{t.slug}</div>
                          </td>
                          <td className="p-3.5 text-zinc-300">
                            <div>📞 {t.whatsapp_number}</div>
                            <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">📍 {t.address || 'Não informado'}</div>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={t.plan_type || 'personal'}
                              onChange={(e) => handleToggleTenantPlan(t.id, t.plan_type || 'personal')}
                              className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-1 focus:outline-none text-[11px] font-semibold cursor-pointer"
                            >
                              <option value="personal">Pessoal (R$ 29,90)</option>
                              <option value="enterprise">Empresarial (R$ 94,90)</option>
                            </select>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => handleToggleTenantStatus(t.id, t.subscription_status)}
                              className={`px-2.5 py-1 rounded font-bold uppercase tracking-wider text-[9px] border cursor-pointer transition-all ${
                                t.subscription_status === 'active'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}
                            >
                              {t.subscription_status === 'active' ? 'Ativa' : 'Inativa'}
                            </button>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleDeleteTenant(t.id, t.name)}
                              className="px-2.5 py-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg border border-transparent hover:border-red-500/15 cursor-pointer transition-colors text-[11px] font-semibold"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-650 relative z-10 max-w-6xl mx-auto">
        <p>© 2026 Slotfy SaaS Inc. Todos os direitos reservados. Projeto Acadêmico / Sandbox.</p>
      </footer>
    </div>
  );
}
