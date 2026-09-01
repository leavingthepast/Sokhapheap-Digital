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
  onGoogleSignIn?: () => Promise<void> | void;
  availablePatients: Patient[];
  authError?: string | null;
  isLoading?: boolean;
  initialVerifyEmail?: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onCreateAccount,
  onResendVerification,
  onGoogleSignIn,
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
  const [email, setEmail] = useState('patient@sokhapheap.kh');
  const [password, setPassword] = useState('password123');
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

  const handleGoogleClick = async () => {
    if (!onGoogleSignIn) return;
    setLocalError(null);
    try {
      setLocalLoading(true);
      await onGoogleSignIn();
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in failed.');
    } finally {
      setLocalLoading(false);
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

              {/* Quick Demo Fill Button */}
              {authMode === 'login' && (
                <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                      P
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Patient Account</span>
                      <span className="text-[10px] text-slate-500 font-mono">patient@sokhapheap.kh</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setEmail('patient@sokhapheap.kh');
                      setPassword('password123');
                      onLogin('patient@sokhapheap.kh', 'password123');
                    }}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    {t.oneClickLogin}
                  </button>
                </div>
              )}

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

              {/* Social Sign-In (Google) */}
              {onGoogleSignIn && (
                <div className="space-y-3 pt-2">
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      or
                    </span>
                    <div className="border-t border-slate-200 w-full"></div>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleGoogleClick}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 disabled:opacity-60 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              )}

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


