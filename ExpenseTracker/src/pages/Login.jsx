import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope, FaExclamationCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/Modal';
import { SubmitButton } from '../components/SubmitButton';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnconfirmedModalOpen, setIsUnconfirmedModalOpen] = useState(false);
  const [isAuthErrorModalOpen, setIsAuthErrorModalOpen] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn({ email: email.trim(), password });
    setIsSubmitting(false);

    if (error) {
      const msg = error.message?.toLowerCase() || '';

      if (msg.includes('confirm') || msg.includes('verify')) {
        setIsUnconfirmedModalOpen(true);
      } else {
        setIsAuthErrorModalOpen(true);
      }
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 pink-grid-bg transition-colors relative">
      {/* Central Login Card - Clean White Card with Pink Border */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border-2 border-pink-300 shadow-2xl space-y-6 relative overflow-hidden animate-modal-pop">
        {/* Header - No horizontal divider lines */}
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-bold text-rose-600 font-cursive leading-tight">
            Simple and Easy
          </h2>
          <h1 className="text-3xl font-black text-rose-800 tracking-wider uppercase">
            EXPENSE
          </h1>
          <p className="text-xs font-black tracking-widest text-rose-500 uppercase mt-1">
            TRACKER SPREADSHEET
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div key={errorMsg} className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-xs font-bold uppercase text-red-700 flex items-center gap-2 animate-shake">
            <FaExclamationCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs font-bold uppercase">
          <div>
            <label className="block text-rose-900 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <FaEnvelope className={`absolute left-4 top-3.5 w-4 h-4 ${errors.email ? 'text-red-400' : 'text-pink-400'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="name@example.com"
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-950 placeholder-rose-400 focus:outline-hidden focus:ring-2 transition-all text-xs font-bold ${
                  errors.email
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300 focus:ring-rose-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-rose-900 mb-1">
              Password *
            </label>
            <div className="relative">
              <FaLock className={`absolute left-4 top-3.5 w-4 h-4 ${errors.password ? 'text-red-400' : 'text-pink-400'}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-950 placeholder-rose-400 focus:outline-hidden focus:ring-2 transition-all text-xs font-bold ${
                  errors.password
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300 focus:ring-rose-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          <SubmitButton
            loading={isSubmitting}
            className="w-full py-3 px-4 text-xs font-extrabold uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign In To Tracker
          </SubmitButton>
        </form>

        {/* Footer redirect */}
        <p className="text-center text-xs font-bold text-rose-700 uppercase">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-black text-rose-900 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>

      {/* Unconfirmed Email Standard Modal */}
      <Modal
        isOpen={isUnconfirmedModalOpen}
        onClose={() => setIsUnconfirmedModalOpen(false)}
        title="Email Verification"
      >
        <div className="space-y-4 text-center py-2 text-xs font-bold text-rose-900 uppercase">
          <p className="text-sm">You need to verify email first</p>
          <div className="pt-3">
            <button
              onClick={() => setIsUnconfirmedModalOpen(false)}
              className="w-full py-2.5 px-4 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer uppercase tracking-wider"
            >
              Okay
            </button>
          </div>
        </div>
      </Modal>

      {/* Authentication Error Standard Modal */}
      <Modal
        isOpen={isAuthErrorModalOpen}
        onClose={() => setIsAuthErrorModalOpen(false)}
        title="Authentication Error"
      >
        <div className="space-y-5 text-center py-2 text-xs font-bold text-rose-900 uppercase">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 border-2 border-red-300 text-red-600 flex items-center justify-center shadow-xs">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-rose-950">Login Failed</h4>
            <p className="text-xs text-red-700 font-extrabold normal-case leading-relaxed p-3 bg-red-50 rounded-2xl border border-red-200">
              Invalid email or password.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAuthErrorModalOpen(false)}
              className="w-full py-3 px-4 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
