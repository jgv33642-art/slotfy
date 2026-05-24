"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, Tenant } from '../lib/db';
import { Calendar, Clock, Sparkles, Shield, ArrowRight, Store, ArrowUpRight, MessageSquare, Check, Layers } from 'lucide-react';

export default function Home() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      const data = await db.getTenants();
      setTenants(data);
    };
    fetchTenants();
  }, []);

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

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Experimentar Painel Administrativo
            <ArrowRight size={16} />
          </Link>
          <a
            href="#demos"
            className="px-6 py-3.5 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 bg-zinc-950/40 text-zinc-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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

      {/* Pricing Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-900 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/10 bg-blue-500/5 text-blue-400 text-xs font-semibold mb-4">
            Preço Transparente
          </div>
          <h2 className="text-3xl font-black text-zinc-50 tracking-tight">Planos de Assinatura Simples</h2>
          <p className="text-xs text-zinc-500 mt-2 max-w-md mx-auto">
            Escolha o melhor plano para o seu negócio e comece a receber agendamentos automatizados ainda hoje.
          </p>

          {/* Switch Billing Cycle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-xs font-semibold ${!isYearly ? 'text-zinc-200' : 'text-zinc-500'}`}>Mensal</span>
            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className="w-12 h-6.5 rounded-full bg-zinc-800 border border-zinc-700 p-0.5 transition-all cursor-pointer relative"
            >
              <div
                className={`w-5 h-5 rounded-full bg-blue-600 transition-all ${
                  isYearly ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isYearly ? 'text-zinc-200' : 'text-zinc-500'}`}>
              Anual
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-md">
                Economize 33%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Plan 1: Mensal */}
          <div className="p-8 rounded-3xl border border-zinc-855 bg-zinc-900/10 hover:border-zinc-800/80 transition-all flex flex-col justify-between relative group">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">Plano Mensal</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm font-semibold text-zinc-400">R$</span>
                <span className="text-4xl font-black text-zinc-50">30</span>
                <span className="text-zinc-500 text-xs font-medium">/mês</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Perfeito para quem está iniciando e quer testar a plataforma.</p>

              <div className="border-t border-zinc-850/80 my-6" />

              <ul className="space-y-3.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Agendamentos Ilimitados
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Notificação e Confirmação via WhatsApp
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Dashboard de Gestão Administrativa
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Páginas temáticas adaptadas ao nicho
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/login"
                className="w-full py-3.5 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 bg-zinc-955 text-center font-bold text-sm text-zinc-200 block transition-all cursor-pointer"
              >
                Assinar Plano Mensal
              </Link>
            </div>
          </div>

          {/* Plan 2: Anual */}
          <div className="p-8 rounded-3xl border border-blue-500/30 bg-blue-950/5 hover:border-blue-500/50 transition-all flex flex-col justify-between relative group shadow-lg shadow-blue-900/5">
            {/* Tag Popular */}
            <div className="absolute -top-3.5 right-6 bg-blue-600 border border-blue-400/30 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              Melhor Valor
            </div>

            <div>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold block mb-1">Plano Anual</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm font-semibold text-zinc-400">R$</span>
                <span className="text-4xl font-black text-zinc-50 transition-all">
                  {isYearly ? '20' : '240'}
                </span>
                <span className="text-zinc-500 text-xs font-medium">
                  {isYearly ? '/mês' : '/ano'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {isYearly ? 'Cobrado anualmente (total de R$ 240/ano)' : 'Equivale a R$ 20/mês (economia de R$ 120/ano)'}
              </p>

              <div className="border-t border-zinc-850/80 my-6" />

              <ul className="space-y-3.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/25 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Todos os recursos do plano mensal
                </li>
                <li className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-4 h-4 rounded-full bg-blue-500/25 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Suporte prioritário via WhatsApp
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/25 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Slug de URL totalmente customizada
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/25 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Check size={10} />
                  </span>
                  Relatórios avançados de faturamento
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/login"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-center font-bold text-sm text-white block shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                Assinar Plano Anual
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 text-center text-xs text-zinc-600 relative z-10 max-w-6xl mx-auto">
        <p>© 2026 Slotfy SaaS Inc. Todos os direitos reservados. Projeto Acadêmico / Sandbox.</p>
      </footer>
    </div>
  );
}
