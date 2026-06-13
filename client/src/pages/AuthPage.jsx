import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Eye, EyeOff, Mail, Lock, User, Building2,
  FileText, Package, Users, TrendingUp, ArrowRight,
  CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ─── Left panel feature bullets ─────────────────────────────────────── */
const FEATURES = [
  { icon: FileText,   text: 'Smart invoice builder with live preview' },
  { icon: Package,    text: 'Real-time inventory tracking & low-stock alerts' },
  { icon: Users,      text: 'Role-based access for your whole team' },
  { icon: TrendingUp, text: 'Live dashboard with revenue charts' },
];

/* ─── Google "G" SVG logo ─────────────────────────────────────────────── */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

/* ─── Reusable labelled input ─────────────────────────────────────────── */
const Field = ({ label, icon: Icon, type = 'text', name, value, onChange,
  placeholder, required, minLength, suffix }) => {
  const { theme } = useTheme();
  return (
  <div>
    <label style={{
      display: 'block', fontSize: '12px', fontWeight: 700,
      color: theme === 'dark' ? '#cbd5e1' : '#475569', textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: '6px'
    }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {Icon && (
        <Icon size={15} style={{
          position: 'absolute', left: '13px', top: '50%',
          transform: 'translateY(-50%)', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', pointerEvents: 'none'
        }} />
      )}
      <input
        name={name} type={type} value={value}
        onChange={onChange} placeholder={placeholder}
        required={required} minLength={minLength}
        autoComplete={type === 'password' ? 'current-password' : 'off'}
        style={{
          width: '100%',
          padding: Icon ? '11px 40px 11px 38px' : '11px 14px',
          paddingRight: suffix ? '42px' : undefined,
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '10px', fontSize: '14px',
          color: 'var(--text-color, #1e293b)', background: 'transparent',
          outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
          fontFamily: 'inherit'
        }}
        onFocus={e => {
          e.target.style.borderColor = '#3a4a53';
          e.target.style.boxShadow = '0 0 0 3px rgba(58,74,83,0.12)';
        }}
        onBlur={e => {
          e.target.style.borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
          e.target.style.boxShadow = 'none';
        }}
      />
      {suffix}
    </div>
  </div>
)};

/* ─── OR divider ──────────────────────────────────────────────────────── */
const Divider = () => {
  const { theme } = useTheme();
  return (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
    <div style={{ flex: 1, height: '1px', background: theme === 'dark' ? '#334155' : '#e2e8f0' }} />
    <span style={{ fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', letterSpacing: '0.05em' }}>
      OR CONTINUE WITH
    </span>
    <div style={{ flex: 1, height: '1px', background: theme === 'dark' ? '#334155' : '#e2e8f0' }} />
  </div>
)};

/* ════════════════════════════════════════════════════════════════════════ */
const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const inviteToken    = searchParams.get('token');

  const [tab, setTab]       = useState(inviteToken ? 'register' : 'login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' });

  const navigate = useNavigate();
  const { login, register, googleLogin, user } = useAuth();
  const { theme } = useTheme();

  /* redirect if already authenticated */
  useEffect(() => {
    if (user && user.companyId && user.status === 'active') navigate('/dashboard');
  }, [user]);

  /* lock to register when invite token present */
  useEffect(() => {
    if (inviteToken) setTab('register');
  }, [inviteToken]);

  /* ── Google handler (called by GSI credential callback) ── */
  const handleGoogleResponse = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      const result = await googleLogin(response.credential, inviteToken || null);
      if (result.user.status === 'pending') {
        toast.success('Account created! Awaiting admin approval. 🎉');
      } else {
        toast.success('Signed in with Google! 👋');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [inviteToken]);

  /* ── Initialize Google Identity Services ── */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const init = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    };

    // GSI script might already be loaded, or we wait for it
    if (window.google) {
      init();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', init);
        return () => script.removeEventListener('load', init);
      }
    }
  }, [handleGoogleResponse]);

  /* ── Handle custom Google button click ── */
  const handleGoogleClick = () => {
    if (!window.google) {
      toast.error('Google Sign-In is not available. Please try again shortly.');
      return;
    }
    // Use Google's prompt for sign-in; it handles account selection gracefully
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        // Prompt was blocked (e.g., by browser settings) → fall back to renderButton
        toast('Opening Google sign-in…', { icon: '🔐' });
        // Re-render the button in a hidden div and programmatically click it
        const tmp = document.createElement('div');
        tmp.style.display = 'none';
        document.body.appendChild(tmp);
        window.google.accounts.id.renderButton(tmp, {
          type: 'standard', theme: 'filled_blue', size: 'large'
        });
        tmp.querySelector('[role="button"]')?.click();
        setTimeout(() => document.body.removeChild(tmp), 500);
      }
    });
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 👋');
      } else {
        await register({ ...form, inviteToken });
        toast.success(
          inviteToken
            ? 'Account created! Waiting for admin approval. 🎉'
            : 'Business account created! 🚀'
        );
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* derived */
  const isStaffInvite = !!inviteToken && tab === 'register';
  const isAdminReg    = !inviteToken  && tab === 'register';
  const isGoogleBusy  = loading || googleLoading;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: theme === 'dark' ? '#0f172a' : '#f8faf9', fontFamily: "'Nunito Sans', sans-serif"
    }}>

      {/* ══════════════ LEFT BRAND PANEL ══════════════ */}
      <div style={{
        width: '480px', minHeight: '100vh', flexShrink: 0,
        background: 'linear-gradient(160deg, #0f172a 0%, #2c3940 55%, #2c3940 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '52px 48px', position: 'relative', overflow: 'hidden'
      }}>
        {/* decorative blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'rgba(58,74,83,0.08)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'rgba(58,74,83,0.06)', pointerEvents: 'none'
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '64px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #948f80, #2c3940)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '20px', color: '#fff',
            boxShadow: '0 4px 16px rgba(58,74,83,0.4)'
          }}>I</div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
            InvoTrack
          </span>
        </div>

        {/* Hero copy */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(58,74,83,0.15)', border: '1px solid rgba(58,74,83,0.3)',
            borderRadius: '100px', padding: '4px 12px', marginBottom: '20px'
          }}>
            <Zap size={12} color="#948f80" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#948f80', letterSpacing: '0.04em' }}>
              LIVE REAL-TIME SYNC
            </span>
          </div>

          <h1 style={{
            fontSize: '36px', fontWeight: 900, color: '#fff',
            lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '16px'
          }}>
            Invoice smarter.<br />
            <span style={{
              background: 'linear-gradient(90deg, #948f80, #3a4a53)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Grow faster.
            </span>
          </h1>

          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.65, marginBottom: '40px', maxWidth: '320px'
          }}>
            The all-in-one platform for managing invoices, inventory, clients,
            and your team — with real-time sync across every device.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(58,74,83,0.15)', border: '1px solid rgba(58,74,83,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={15} color="#948f80" />
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                  {text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} color="#948f80" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              JWT secured · Google OAuth · Role-based access · Real-time alerts
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT FORM PANEL ══════════════ */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', overflowY: 'auto'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          {/* ── Header ── */}
          <div style={{ marginBottom: '28px' }}>

            {/* Staff invite banner */}
            {isStaffInvite && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #fbf9f6, #e4c5a0)',
                  border: '1.5px solid #a5b4fc', borderRadius: '14px', marginBottom: '24px'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#3a4a53', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0
                }}>
                  <CheckCircle2 size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#2c3940', marginBottom: '2px' }}>
                    You've been invited! 🎉
                  </p>
                  <p style={{ fontSize: '12px', color: '#3a4a53', lineHeight: 1.5 }}>
                    Create your staff account below. Your admin will activate it once you've registered.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Admin register notice */}
            {isAdminReg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #fbf9f6, #f6d1a1)',
                  border: '1.5px solid #93c5fd', borderRadius: '14px', marginBottom: '24px'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#2563eb', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0
                }}>
                  <Building2 size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8', marginBottom: '2px' }}>
                    Create a Business Account
                  </p>
                  <p style={{ fontSize: '12px', color: '#2563eb', lineHeight: 1.5 }}>
                    You'll be set up as Admin with full access. Invite your team from the Staff page.
                  </p>
                </div>
              </motion.div>
            )}

            <h2 style={{
              fontSize: '26px', fontWeight: 800, color: theme === 'dark' ? '#f8fafc' : '#0f172a',
              letterSpacing: '-0.4px', marginBottom: '4px'
            }}>
              {tab === 'login'
                ? 'Sign in to your account'
                : isStaffInvite
                  ? 'Set up your staff account'
                  : 'Create your business'}
            </h2>
            {tab !== 'login' && (
              <p style={{ fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>
                {isStaffInvite
                  ? 'Fill in your details to join the team'
                  : 'Start your 5-minute setup — no credit card required'}
              </p>
            )}
          </div>

          {/* ── Tab switcher (hidden for staff invite) ── */}
          {!isStaffInvite && (
            <div style={{
              display: 'flex', background: theme === 'dark' ? '#1e293b' : '#f1f5f9',
              borderRadius: '12px', padding: '4px', marginBottom: '24px'
            }}>
              {['login', 'register'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: tab === t ? (theme === 'dark' ? '#334155' : '#fff') : 'transparent',
                    color: tab === t ? (theme === 'dark' ? '#f8fafc' : '#0f172a') : theme === 'dark' ? '#cbd5e1' : '#94a3b8',
                    boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    fontFamily: 'inherit'
                  }}
                >
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* ── Role badge ── */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px', borderRadius: '100px',
              background: isStaffInvite ? (theme === 'dark' ? 'rgba(58,74,83,0.1)' : '#fbf9f6') : (theme === 'dark' ? '#1e293b' : '#f8fafc'),
              border: `1.5px solid ${isStaffInvite ? (theme === 'dark' ? 'rgba(58,74,83,0.2)' : '#a5b4fc') : (theme === 'dark' ? '#334155' : theme === 'dark' ? '#334155' : '#e2e8f0')}`,
              fontSize: '12px', fontWeight: 700,
              color: isStaffInvite ? '#3a4a53' : theme === 'dark' ? '#cbd5e1' : '#475569',
              letterSpacing: '0.04em', textTransform: 'uppercase'
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: isStaffInvite ? '#3a4a53' : theme === 'dark' ? '#cbd5e1' : '#64748b'
              }} />
              {isStaffInvite
                ? 'Staff Registration'
                : tab === 'register'
                  ? 'Admin · Business Owner'
                  : 'All Users · Sign In'}
            </div>
          </div>

          {/* ════════ GOOGLE SIGN-IN BUTTON ════════ */}
          <motion.button
            whileHover={{ scale: isGoogleBusy ? 1 : 1.01 }}
            whileTap={{ scale: isGoogleBusy ? 1 : 0.99 }}
            type="button"
            onClick={handleGoogleClick}
            disabled={isGoogleBusy}
            style={{
              width: '100%', padding: '12px 16px',
              background: theme === 'dark' ? '#1e293b' : '#fff',
              border: `1.5px solid ${theme === 'dark' ? '#334155' : theme === 'dark' ? '#334155' : '#e2e8f0'}`,
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#1e293b',
              cursor: isGoogleBusy ? 'not-allowed' : 'pointer',
              opacity: isGoogleBusy ? 0.7 : 1,
              transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
              fontFamily: 'inherit',
              marginBottom: '4px'
            }}
            onMouseEnter={e => {
              if (!isGoogleBusy) {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme === 'dark' ? '#334155' : '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            }}
          >
            {googleLoading
              ? <>
                  <span style={{
                    width: '18px', height: '18px',
                    border: '2px solid #e2e8f0', borderTopColor: '#4285F4',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                    display: 'inline-block', flexShrink: 0
                  }} />
                  Signing in with Google…
                </>
              : <>
                  <GoogleLogo />
                  {tab === 'login' ? 'Sign in with Google' : 'Continue with Google'}
                </>
            }
          </motion.button>

          {/* ── OR Divider ── */}
          <div style={{ margin: '20px 0' }}>
            <Divider />
          </div>

          {/* ── Email / Password Form ── */}
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 12 : -12 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Name — register only */}
              {tab === 'register' && (
                <Field
                  label="Full Name" icon={User} name="name"
                  value={form.name} onChange={handleChange}
                  placeholder="e.g. Preethi Sharma" required
                />
              )}

              <Field
                label="Email Address" icon={Mail} type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="you@company.com" required
              />

              <Field
                label="Password" icon={Lock}
                type={showPw ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Min. 6 characters" required minLength={6}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', padding: 0, display: 'flex'
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              {/* Business name — admin register only */}
              {isAdminReg && (
                <Field
                  label="Business Name" icon={Building2} name="companyName"
                  value={form.companyName} onChange={handleChange}
                  placeholder="e.g. Acme Corp" required
                />
              )}

              {/* Submit */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                type="submit"
                disabled={isGoogleBusy}
                style={{
                  width: '100%', padding: '13px',
                  background: isGoogleBusy
                    ? '#a5b4fc'
                    : 'linear-gradient(135deg, #948f80, #2c3940)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 700,
                  cursor: isGoogleBusy ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginTop: '2px',
                  boxShadow: isGoogleBusy ? 'none' : '0 4px 14px rgba(58,74,83,0.3)',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  fontFamily: 'inherit'
                }}
              >
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '16px', height: '16px',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite', display: 'inline-block'
                      }} />
                      Please wait…
                    </span>
                  : <>
                      {tab === 'login'
                        ? 'Sign In with Email'
                        : isStaffInvite
                          ? 'Create Staff Account'
                          : 'Create Business Account'}
                      <ArrowRight size={16} />
                    </>
                }
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* ── Footer switch (hidden for staff invite) ── */}
          {!isStaffInvite && (
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#3a4a53', fontWeight: 700, fontSize: '14px',
                  fontFamily: 'inherit', padding: 0
                }}
              >
                {tab === 'login' ? 'Create one →' : 'Sign in instead'}
              </button>
            </p>
          )}

          {/* Staff hint */}
          {tab === 'login' && (
            <div style={{
              marginTop: '16px', padding: '12px 14px',
              background: theme === 'dark' ? '#1e293b' : '#f8fafc', border: `1px solid ${theme === 'dark' ? '#334155' : '#f1f5f9'}`, borderRadius: '10px'
            }}>
              <p style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Staff?</strong>{' '}
                Use the invite link your admin sent you to register. If you already have an account, sign in above.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthPage;
