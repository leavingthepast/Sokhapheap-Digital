import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AuthPageProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onCreateAccount: (name: string, email: string, password?: string) => Promise<void>;
  availablePatients: Patient[];
  authError?: string | null;
  isLoading?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onCreateAccount,
  authError,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const displayError = authError || localError;
  const busy = isLoading || localLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (authMode === 'signup') {
      if (!name.trim() || !email.trim()) return;
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      try {
        setLocalLoading(true);
        await onCreateAccount(name.trim(), email.trim(), password);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to create account.');
      } finally {
        setLocalLoading(false);
      }
    } else if (authMode === 'login') {
      if (!email.trim()) return;
      try {
        setLocalLoading(true);
        await onLogin(email.trim(), password);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to sign in.');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f0f9f6] to-[#e6f4f1] flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Brand Nav */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t.appName}
            </span>
            <span className="hidden sm:block text-[11px] text-teal-700 font-semibold">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">{t.securePortal}</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </div>
      </header>

      {/* Main Container Card */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {authMode === 'signup' ? t.createAccount : t.welcomeBack}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {t.tagline}
            </p>
          </div>

          {/* Error Message Banner */}
          {displayError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{displayError}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Moli Keo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.emailAddress}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden transition-all"
                />
                <button
                  type="button"
                  id="toggle-password-visibility-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'View password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {authMode === 'signup' && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Minimum 6 characters
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md hover:shadow transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signup' ? t.createHealthRecord : t.signIn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login & signup */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {authMode === 'signup' ? (
              <p>
                {t.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLocalError(null);
                  }}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  {t.logInLink}
                </button>
              </p>
            ) : (
              <p>
                {t.dontHaveRecord}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setName('');
                    setLocalError(null);
                  }}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  {t.createAccountLink}
                </button>
              </p>
            )}
          </div>

        </div>
      </main>

      {/* Footer Tagline */}
      <footer className="text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          {t.subTagline}
        </p>
        <p className="text-slate-400">
          {t.appName} • {t.appSubtitle}
        </p>
      </footer>
    </div>
  );
};


