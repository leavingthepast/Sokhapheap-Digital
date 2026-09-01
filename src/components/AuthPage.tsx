import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Inbox,
  Sparkles
} from 'lucide-react';
import { Patient } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AuthPageProps {
  onLogin: (email: string, password?: string) => Promise<{ unverified?: boolean; email?: string } | void>;
  onCreateAccount: (name: string, email: string, password?: string) => Promise<{ unverified?: boolean; email?: string } | void>;
  onResendVerification?: (email: string, password?: string) => Promise<void>;
  availablePatients: Patient[];
  authError?: string | null;
  isLoading?: boolean;
  initialVerifyEmail?: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onCreateAccount,
  onResendVerification,
  availablePatients,
  authError,
  isLoading = false,
  initialVerifyEmail = null,
}) => {
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify'>(
    initialVerifyEmail ? 'verify' : 'login'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>(initialVerifyEmail || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (initialVerifyEmail) {
      setUnverifiedEmail(initialVerifyEmail);
      setAuthMode('verify');
    }
  }, [initialVerifyEmail]);

  const displayError = authError || localError;
  const busy = isLoading || localLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResendSuccess(false);

    if (authMode === 'signup') {
      if (!name.trim() || !email.trim()) return;
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      try {
        setLocalLoading(true);
        const result = await onCreateAccount(name.trim(), email.trim(), password);
        if (result && result.unverified) {
          setUnverifiedEmail(result.email || email.trim());
          setAuthMode('verify');
        }
      } catch (err: any) {
        setLocalError(err.message || 'Failed to create account.');
      } finally {
        setLocalLoading(false);
      }
    } else if (authMode === 'login') {
      if (!email.trim()) return;
      try {
        setLocalLoading(true);
        const result = await onLogin(email.trim(), password);
        if (result && result.unverified) {
          setUnverifiedEmail(result.email || email.trim());
          setAuthMode('verify');
        }
      } catch (err: any) {
        setLocalError(err.message || 'Failed to sign in.');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setLocalError(null);
    setResendSuccess(false);
    setIsResending(true);
    try {
      if (onResendVerification) {
        await onResendVerification(unverifiedEmail, password);
      }
      setResendSuccess(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
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
          
          {/* ======================================================== */}
          {/* SCREEN 1: EMAIL VERIFICATION NOTICE SCREEN */}
          {/* ======================================================== */}
          {authMode === 'verify' ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Visual Icon */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center shadow-xs border border-teal-100 relative">
                  <Inbox className="w-8 h-8 text-teal-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                    ✓
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t.checkEmailTitle}
                </h1>
                
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {t.checkEmailSubtitle}
                </p>
              </div>

              {/* Target Email Badge */}
              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-center space-y-1">
                <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
                  Verification Destination
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm break-all">
                  {unverifiedEmail || email}
                </span>
              </div>

              {/* Instructions Callout */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t.checkEmailInstructions}</span>
                </div>
              </div>

              {/* Status & Alerts */}
              {resendSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800 text-xs animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-semibold">{t.verificationEmailResent}</div>
                </div>
              )}

              {displayError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug">{displayError}</div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                {/* Login Button */}
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    setResendSuccess(false);
                    setEmail(unverifiedEmail || email);
                    setAuthMode('login');
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.backToLogin}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Resend Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 disabled:opacity-50 transition-colors cursor-pointer hover:underline"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? t.resendingEmail : t.resendVerificationEmail}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* SCREEN 2: LOGIN / SIGN UP FORM */
            /* ======================================================== */
            <>
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
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-hidden transition-all"
                    />
                  </div>
                  {authMode === 'signup' && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Minimum 6 characters for secure Firebase auth
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
            </>
          )}

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


