"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('carlos@vintage.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (supabase) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'Credenciais de e-mail ou senha inválidas.' : authError.message);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      // Simulate login validation
      setTimeout(() => {
        if (email === 'carlos@vintage.com' && password === '123456') {
          router.push('/dashboard');
        } else {
          setError('E-mail ou senha incorretos. Utilize as credenciais de demonstração.');
          setLoading(false);
        }
      }, 800);
    }
  };

  const handleDemoFill = () => {
    setEmail('carlos@vintage.com');
    setPassword('123456');
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-6 relative overflow-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 transition-all"
      >
        <ArrowLeft size={14} /> Voltar para o início
      </Link>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl text-white mx-auto shadow-xl shadow-blue-500/20 mb-4">
            S
          </div>
          <h2 className="text-2xl font-black text-zinc-50">Acesse o seu painel</h2>
          <p className="text-sm text-zinc-500 mt-1">Insira suas credenciais de parceiro Slotfy</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
          
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">E-mail corporativo</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parceiro@empresa.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Senha de acesso</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Validando...' : 'Entrar no Sistema'}
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>

          {/* Sandbox Box */}
          <div className="mt-8 pt-6 border-t border-zinc-850 text-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-3">Modo Demonstração</span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 bg-zinc-950 text-xs font-semibold transition-all cursor-pointer"
            >
              Preencher dados de teste (Carlos Barbeiro)
            </button>
            <p className="text-[10px] text-zinc-600 mt-2">Use o e-mail <strong>carlos@vintage.com</strong> e a senha <strong>123456</strong></p>
          </div>

        </div>

      </div>
    </div>
  );
}
