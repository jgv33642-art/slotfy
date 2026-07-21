"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkle, X, AlertCircle, User, Mail, Lock, Store, Phone, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/db';
import { usePWA } from './PWAProvider';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: 'personal' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
}

export function CheckoutModal({ isOpen, onClose, selectedPlan, billingCycle }: CheckoutModalProps) {
  const { isInstallable, installApp, isIOS } = usePWA();
  const [pwaInstalled, setPwaInstalled] = useState(false);
  
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [loadingMessage, setLoadingMessage] = useState('Processando dados...');
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; ticket_url: string; payment_id: number } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();

  if (!isOpen) return null;

  const handleCheckoutSubmit = () => {
    setCheckoutError('');
    setCheckoutStep(2); 
  };

  const handleFinalizeSubscription = async (data: any) => {
    setCheckoutError('');
    setCheckoutStep(3);
    setLoadingMessage('Configurando sua transação segura com o Mercado Pago...');

    try {
      let cardToken = '';
      let detectedBrand = 'visa';

      if (paymentMethod === 'credit_card') {
        setLoadingMessage('Gerando token criptografado do cartão...');
        const cleanCard = (data.cardNumber || '').replace(/\s+/g, '');
        const cleanCpf = (data.cardCpf || '').replace(/\D/g, '');

        if (cleanCard.startsWith('4')) detectedBrand = 'visa';
        else if (/^(5[1-5]|222[1-9]|22[3-9][0-9])/.test(cleanCard)) detectedBrand = 'master';
        else if (/^(34|37)/.test(cleanCard)) detectedBrand = 'amex';
        else if (/^(4011|4312|4389|4514|5041|5066|5090|6277|6362|6363|6504|6505|6507|6509|6516)/.test(cleanCard)) detectedBrand = 'elo';
        else if (/^(6062|6503|6504|6505|6511)/.test(cleanCard)) detectedBrand = 'hipercard';

        const [expiryMonthStr, expiryYearStr] = (data.cardExpiry || '').split('/');
        if (!expiryMonthStr || !expiryYearStr) {
          throw new Error('Data de expiração do cartão inválida. Use o formato MM/AA.');
        }

        const expiryMonth = parseInt(expiryMonthStr, 10);
        let expiryYear = parseInt(expiryYearStr, 10);
        if (expiryYear < 100) expiryYear += 2000;

        const mpPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (!mpPublicKey) throw new Error('Chave do Mercado Pago não configurada.');

        const tokenRes = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${mpPublicKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_number: cleanCard,
            expiration_month: expiryMonth,
            expiration_year: expiryYear,
            security_code: data.cardCvv,
            cardholder: {
              name: data.cardholderName,
              identification: { type: 'CPF', number: cleanCpf }
            }
          })
        });

        if (!tokenRes.ok) {
          const errData = await tokenRes.json();
          throw new Error(errData.message || 'Erro ao validar os dados do seu cartão.');
        }

        const tokenData = await tokenRes.json();
        cardToken = tokenData.id;
      }

      setLoadingMessage('Criando sua conta e ativando serviços no banco...');

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          password: data.password,
          tenantName: data.businessName,
          whatsappNumber: data.whatsapp,
          address: data.address,
          niche: data.niche || 'Beleza e Estética',
          plan: selectedPlan,
          billingCycle,
          paymentMethod,
          cardToken,
          paymentMethodId: detectedBrand,
          pixFirstName: data.pixFirstName,
          pixLastName: data.pixLastName,
          pixCpf: data.pixCpf,
          isLocalStorageFallback: !db.isSupabaseActive()
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Erro ao processar checkout no servidor.');
      }

      if (!db.isSupabaseActive()) {
        const expiresAt = resData.subscription_expires_at || new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
        const registered = await db.registerTenant({
          name: data.fullName,
          email: data.email,
          password: data.password,
          tenantName: data.businessName,
          whatsappNumber: data.whatsapp,
          address: data.address,
          niche: data.niche || 'Beleza e Estética',
          plan: selectedPlan
        });

        await db.updateTenant(registered.tenant.id, {
          subscription_status: paymentMethod === 'pix' ? 'inactive' : 'active',
          subscription_expires_at: expiresAt
        });
      }

      if (paymentMethod === 'pix') {
        setPixData(resData.pixData);
      }

      setCheckoutStep(4);
    } catch (err: any) {
      console.error(err);
      setCheckoutError(err.message || 'Ocorreu um erro ao processar a assinatura.');
      setCheckoutStep(2);
    }
  };

  const businessName = watch('businessName') || '';
  const email = watch('email') || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative my-8"
          >
        
        {/* Header */}
        <div className="border-b border-zinc-700/50 px-6 py-5 flex justify-between items-center bg-zinc-900/30">
          <div>
            <h3 className="font-black text-lg text-zinc-50 flex items-center gap-2">
              <Sparkle className="text-blue-500 fill-blue-500/20" size={18} />
              Ative sua Agenda Slotfy
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Preencha as informações básicas para efetuar a compra do plano.</p>
          </div>
          {checkoutStep !== 2 && checkoutStep !== 3 && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(checkoutStep === 1 ? handleCheckoutSubmit : handleFinalizeSubscription)} className="p-6 space-y-6">
          
          {checkoutStep < 3 && (
            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Plano Selecionado</span>
                <h4 className="font-bold text-sm text-zinc-100">
                  {selectedPlan === 'enterprise' ? 'Plano Empresarial - Liberação Total' : 'Plano Pessoal - Ativação Simples'}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-zinc-50">
                  {selectedPlan === 'enterprise' ? (billingCycle === 'yearly' ? 'R$ 90,15' : 'R$ 94,90') : (billingCycle === 'yearly' ? 'R$ 28,40' : 'R$ 29,90')}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">/mês</span>
              </div>
            </div>
          )}

          {checkoutError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Step 1 */}
          <div className={checkoutStep === 1 ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações de Acesso */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">1. Informações de Acesso</h5>
                
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3 text-zinc-500" />
                    <input {...register("fullName", { required: checkoutStep === 1 })} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: Carlos Oliveira" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3 text-zinc-500" />
                    <input type="email" {...register("email", { required: checkoutStep === 1 })} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="carlos@barbearia.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Senha de Acesso</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-zinc-500" />
                    <input type="password" {...register("password", { required: checkoutStep === 1, minLength: 6 })} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="Mínimo 6 caracteres" />
                  </div>
                </div>
              </div>

              {/* Dados da sua Agenda */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">2. Dados da sua Agenda</h5>
                
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Nome do Estabelecimento</label>
                  <div className="relative">
                    <Store size={14} className="absolute left-3 top-3 text-zinc-500" />
                    <input {...register("businessName", { required: checkoutStep === 1 })} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: Barbearia Imperial" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">WhatsApp para Contato</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3 text-zinc-500" />
                    <input {...register("whatsapp", { required: checkoutStep === 1 })} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="Ex: +55 (11) 99999-9999" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Endereço do Estabelecimento</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-zinc-500" />
                    <input {...register("address", { required: checkoutStep === 1 })} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="Rua das Flores, 123 - Centro, SP" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Nicho de Negócio</label>
                  <select {...register("niche")} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200 cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                    <option value="Beleza e Estética">Beleza e Estética (Barbearia/Salão)</option>
                    <option value="Saúde e Odontologia">Saúde e Odontologia (Clínicas)</option>
                    <option value="Fitness e Bem-Estar">Fitness e Bem-Estar (Pilates/Yoga)</option>
                    <option value="Serviços Gerais">Outro Nicho de Serviços</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 mt-6 pt-4 flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-semibold">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">Prosseguir para o Pagamento</button>
            </div>
          </div>

          {/* Step 2 */}
          <div className={checkoutStep === 2 ? 'block' : 'hidden'}>
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/80 pb-2">Escolha a Forma de Pagamento</h5>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentMethod('credit_card')} className={`py-3 px-4 rounded-xl border text-xs font-bold flex gap-2 justify-center ${paymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-zinc-800 text-zinc-400'}`}>💳 Cartão de Crédito</button>
                <button type="button" onClick={() => setPaymentMethod('pix')} className={`py-3 px-4 rounded-xl border text-xs font-bold flex gap-2 justify-center ${paymentMethod === 'pix' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-zinc-800 text-zinc-400'}`}>⚡ Pix Instantâneo</button>
              </div>

              {paymentMethod === 'credit_card' ? (
                <div className="space-y-4 pt-2">
                  <input {...register("cardNumber")} placeholder="Número do Cartão" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                  <input {...register("cardholderName")} placeholder="Nome do Titular" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                  <div className="grid grid-cols-2 gap-4">
                    <input {...register("cardExpiry")} placeholder="MM/AA" maxLength={5} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                    <input type="password" {...register("cardCvv")} placeholder="CVV" maxLength={4} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                  </div>
                  <input {...register("cardCpf")} placeholder="CPF do Titular" maxLength={14} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <input {...register("pixFirstName")} placeholder="Nome" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                    <input {...register("pixLastName")} placeholder="Sobrenome" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                  </div>
                  <input {...register("pixCpf")} placeholder="CPF do Pagador" maxLength={14} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-200" />
                </div>
              )}
            </div>
            
            <div className="border-t border-zinc-800/80 mt-6 pt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setCheckoutStep(1)} className="px-5 py-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-semibold">Voltar</button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">Finalizar Assinatura</button>
            </div>
          </div>
        </form>

        {/* Step 3 */}
        {checkoutStep === 3 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin duration-1000" />
            </div>
            <div>
              <h4 className="font-bold text-md text-zinc-100">Processando com Mercado Pago</h4>
              <p className="text-xs text-zinc-500 mt-2 animate-pulse">{loadingMessage}</p>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {checkoutStep === 4 && (
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="font-black text-xl text-zinc-50">Plataforma Ativada com Sucesso!</h4>
              <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto">
                {paymentMethod === 'pix' ? 'Seu código de pagamento Pix foi gerado.' : `Sua assinatura foi confirmada no cartão de crédito.`}
              </p>
            </div>

            {paymentMethod === 'pix' && pixData && (
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 max-w-md w-full flex flex-col items-center gap-4">
                <span className="text-[10px] text-zinc-450 uppercase tracking-widest font-bold">Pague com Pix</span>
                {pixData.qr_code_base64 && <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="Pix QR Code" className="w-40 h-40" />}
                <div className="w-full space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-500 text-left">Código Pix Copia e Cola:</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={pixData.qr_code || ''} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] text-zinc-400 font-mono" />
                    <button type="button" onClick={() => { if (pixData.qr_code) { navigator.clipboard.writeText(pixData.qr_code); setPixCopied(true); setTimeout(() => setPixCopied(false), 2000); } }} className="px-3 bg-zinc-800 text-zinc-200 rounded-lg text-xs font-bold">{pixCopied ? 'Copiado!' : 'Copiar'}</button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 text-xs text-zinc-400 max-w-md w-full text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Endereço da Agenda Pública:</span>
                <span className="text-blue-400 font-semibold">/{businessName?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">E-mail Administrativo:</span>
                <span className="text-zinc-200 font-semibold">{email}</span>
              </div>
            </div>

            <div className="pt-2 w-full max-w-xs">
              <Link href="/dashboard" onClick={onClose} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">
                Acessar Painel <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
