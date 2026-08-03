import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaEnvelope, FaUser, FaCalendarAlt, FaExclamationCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { DatePickerModal } from '../components/DatePickerModal';
import { Modal } from '../components/Modal';
import { formatDate } from '../utils/formatters';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [registrationErrorMessage, setRegistrationErrorMessage] = useState('');

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else if (birthDate > todayStr) {
      newErrors.birthDate = 'Birth date cannot be in the future';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must include at least one uppercase letter (A-Z)';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must include at least one lowercase letter (a-z)';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must include at least one number (0-9)';
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = 'Password must include at least one special character (!@#$%^&*)';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password && confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) {
      setErrorMsg('Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp({ email: email.trim(), password, fullName: fullName.trim(), birthDate });
    setIsSubmitting(false);

    if (error) {
      setRegistrationErrorMessage(error.message || 'Something went wrong during account creation. Please try again.');
      setIsErrorModalOpen(true);
    } else {
      setIsSuccessModalOpen(true);
    }
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 pink-grid-bg transition-colors relative">
      {/* Central Register Card - Clean White Card with Pink Border */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border-2 border-pink-300 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-bold text-rose-600 font-cursive leading-tight">
            Simple and Easy
          </h2>
          <h1 className="text-3xl font-black text-rose-800 tracking-wider uppercase">
            EXPENSE
          </h1>
          <p className="text-xs font-black tracking-widest text-rose-500 uppercase mt-1">
            CREATE TRACKER ACCOUNT
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-xs font-bold uppercase text-red-700 flex items-center gap-2">
            <FaExclamationCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs font-bold uppercase">
          <div>
            <label className="block text-rose-900 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <FaUser className={`absolute left-4 top-3.5 w-4 h-4 ${errors.fullName ? 'text-red-400' : 'text-pink-400'}`} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                placeholder="John Doe"
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 placeholder-pink-300 focus:outline-hidden focus:ring-2 transition-all text-xs font-bold ${
                  errors.fullName
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300 focus:ring-rose-500'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

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
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 placeholder-pink-300 focus:outline-hidden focus:ring-2 transition-all text-xs font-bold ${
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

          {/* Birth Date Field with Custom Pink Date Picker Modal */}
          <div>
            <label className="block text-rose-900 mb-1">
              Birth Date *
            </label>
            <div 
              onClick={() => setIsDatePickerOpen(true)}
              className="relative cursor-pointer"
            >
              <FaCalendarAlt className={`absolute left-4 top-3.5 w-4 h-4 ${errors.birthDate ? 'text-red-400' : 'text-pink-400'}`} />
              <input
                type="text"
                readOnly
                value={birthDate ? formatDate(birthDate) : ''}
                placeholder="Select birth date..."
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 placeholder-pink-300 cursor-pointer text-xs font-bold ${
                  errors.birthDate
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300'
                }`}
              />
            </div>
            {errors.birthDate && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.birthDate}</span>
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
                placeholder="Min. 8 chars (e.g. Pass123!)"
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 placeholder-pink-300 focus:outline-hidden focus:ring-2 transition-all text-xs font-bold ${
                  errors.password
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300 focus:ring-rose-500'
                }`}
              />
            </div>
            <p className="mt-1 text-[10px] text-pink-500 font-semibold normal-case">
              Requires min. 8 chars with uppercase, lowercase, number & special symbol.
            </p>
            {errors.password && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-rose-900 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <FaLock className={`absolute left-4 top-3.5 w-4 h-4 ${errors.confirmPassword ? 'text-red-400' : 'text-pink-400'}`} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="Re-enter password"
                className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 placeholder-pink-300 focus:outline-hidden focus:ring-2 transition-all text-xs font-bold ${
                  errors.confirmPassword
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300 focus:ring-rose-500'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <p className="text-center text-xs font-bold text-rose-700 uppercase">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-black text-rose-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Custom Pink Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={birthDate}
        onSelectDate={(d) => setBirthDate(d)}
        title="Select Birth Date"
        maxDate={todayStr}
      />

      {/* Account Created Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        title="Account Created!"
      >
        <div className="space-y-5 text-center py-2 text-xs font-bold text-rose-900 uppercase">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center shadow-xs">
            <FaCheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-rose-950">Account Created!</h4>
            <p className="text-xs text-rose-700 font-extrabold normal-case leading-relaxed">
              Account created successfully! Continue to sign in to access your tracker spreadsheet.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleCloseSuccessModal}
              className="w-full py-3 px-4 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer uppercase tracking-wider"
            >
              Continue to Sign In
            </button>
          </div>
        </div>
      </Modal>

      {/* Account Creation Error Modal */}
      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Registration Failed"
      >
        <div className="space-y-5 text-center py-2 text-xs font-bold text-rose-900 uppercase">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 border-2 border-red-300 text-red-600 flex items-center justify-center shadow-xs">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-rose-950">Something Went Wrong</h4>
            <p className="text-xs text-red-700 font-extrabold normal-case leading-relaxed p-3 bg-red-50 rounded-2xl border border-red-200">
              {registrationErrorMessage}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsErrorModalOpen(false)}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer uppercase tracking-wider"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                setIsErrorModalOpen(false);
                navigate('/login');
              }}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer border-2 border-pink-300 uppercase tracking-wider"
            >
              Sign In
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
