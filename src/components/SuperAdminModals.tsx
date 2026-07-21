"use client";

import React, { useState, useEffect } from 'react';
import { Lock, Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, Tenant } from '../lib/db';

interface SuperAdminModalsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuperAdminModals({ isOpen, onClose }: SuperAdminModalsProps) {
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);
  const [adminTenants, setAdminTenants] = useState<Tenant[]>([]);
  const [superAdminError, setSuperAdminError] = useState('');

  // Reset internal state when opened
  useEffect(() => {
    if (isOpen) {
      setSuperAdminError('');
      setSuperAdminPassword('');
    }
  }, [isOpen]);

  const loadAllTenantsAdmin = async () => {
    if (db.getAllTenantsAdmin) {
      const data = await db.getAllTenantsAdmin();
      setAdminTenants(data);
    }
  };

  const handleSuperAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuperAdminError('');
    if (superAdminPassword === '33642') {
      onClose(); // Close the prompt
      setShowSuperAdminPanel(true);
      setSuperAdminPassword('');
      await loadAllTenantsAdmin();
    } else {
      setSuperAdminError('Senha incorreta do administrador do sistema.');
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
    <AnimatePresence>
      {/* Super Admin Password Prompt Modal */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", duration: 0.5 }}
            className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative p-6"
          >
            <button
              onClick={onClose}
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
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer transition-all"
              >
                Acessar Painel
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Super Admin Panel Modal */}
      {showSuperAdminPanel && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", duration: 0.5 }}
            className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative my-8"
          >
            {/* Header */}
            <div className="border-b border-zinc-700/50 px-6 py-5 flex justify-between items-center bg-zinc-900/30">
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
