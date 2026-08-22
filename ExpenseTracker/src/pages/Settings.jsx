import { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_CATEGORIES, expenseService } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { OnboardingModal } from '../components/OnboardingModal';
import { DatePickerModal } from '../components/DatePickerModal';
import { ExportModal } from '../components/ExportModal';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { formatDate } from '../utils/formatters';
import { PRESET_AVATARS } from '../utils/imageUtils';
import { 
  FaUser, 
  FaTag, 
  FaPlus, 
  FaTrash, 
  FaTable, 
  FaQuestionCircle, 
  FaExclamationTriangle, 
  FaCalendarAlt, 
  FaCheck, 
  FaExclamationCircle, 
  FaDownload,
  FaCamera,
  FaHeart,
  FaCrop,
  FaWallet,
  FaPaw
} from 'react-icons/fa';

export const Settings = () => {
  const { user, updateProfile } = useAuth();

  const userKey = user?.id || user?.email || 'guest';
  const storageCategoryKey = `custom_categories_${userKey}`;

  // Form State for Editable Profile initialized from user metadata
  const [fullName, setFullName] = useState(() => user?.user_metadata?.full_name || '');
  const [birthDate, setBirthDate] = useState(() => user?.user_metadata?.birth_date || '');
  const [avatarUrl, setAvatarUrl] = useState(() => user?.user_metadata?.avatar_url || '');
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Custom categories & export state
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem(storageCategoryKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [newCatInput, setNewCatInput] = useState('');
  const [catError, setCatError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);

  // Budget State
  const [budgetObj, setBudgetObj] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState('monthly');
  const [budgetError, setBudgetError] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Pet type
  const [petType, setPetType] = useState(() => localStorage.getItem('pet_type') || 'duck');

  const handlePetTypeChange = (type) => {
    setPetType(type);
    localStorage.setItem('pet_type', type);
    window.dispatchEvent(new Event('pet_type_change'));
  };

  useEffect(() => {
    expenseService.getExpenses().then(data => setExpenses(data || [])).catch(() => {});
    budgetService.getBudget().then(bgt => {
      if (bgt) {
        setBudgetObj(bgt);
        setBudgetAmount(bgt.amount ? String(bgt.amount) : '');
        setBudgetPeriod(bgt.period || 'monthly');
      }
    }).catch(() => {});
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setBudgetError('');
    const parsed = parseFloat(budgetAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setBudgetError('Please enter a valid positive budget amount');
      return;
    }
    setIsSavingBudget(true);
    try {
      const updated = await budgetService.setBudget({ amount: parsed, period: budgetPeriod });
      setBudgetObj(updated);
      setToast({ message: 'Salary / Budget limit saved successfully!', type: 'success' });
    } catch (err) {
      console.error('Failed to save budget:', err);
      setToast({ message: 'Failed to save budget', type: 'error' });
    } finally {
      setIsSavingBudget(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(storageCategoryKey, JSON.stringify(customCategories));
  }, [customCategories, storageCategoryKey]);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'Avatar image must be smaller than 2MB', type: 'error' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setIsCropperOpen(true);
    };
    e.target.value = '';
  };

  const handleOpenCropperForExisting = () => {
    if (avatarUrl) {
      setCropImageSrc(avatarUrl);
      setIsCropperOpen(true);
    }
  };

  const handleCroppedAvatarSave = (croppedDataUrl) => {
    setAvatarUrl(croppedDataUrl);
    setToast({ message: 'Profile photo adjusted! Click "Save Profile Changes" to apply.', type: 'success' });
  };

  // Save updated profile details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('Full name is required');
      return;
    }

    setIsSavingProfile(true);

    try {
      const res = await updateProfile({ 
        fullName: fullName.trim(), 
        birthDate,
        avatarUrl
      });
      if (res.success) {
        setToast({ message: 'Profile & picture saved successfully!', type: 'success' });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setToast({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    setCatError('');
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      setCatError('Category name is required');
      return;
    }

    if (DEFAULT_CATEGORIES.includes(trimmed) || customCategories.includes(trimmed)) {
      setCatError('Category already exists');
      return;
    }

    setCustomCategories(prev => [...prev, trimmed]);
    setNewCatInput('');
    setToast({ message: `Added category "${trimmed}"`, type: 'success' });
  };

  const handleRemoveCustomCategory = (categoryName) => {
    setCustomCategories(prev => prev.filter(c => c !== categoryName));
    setToast({ message: `Removed category "${categoryName}"`, type: 'success' });
  };

  const handleConfirmClearAllData = () => {
    expenseService.clearAllAccountData();
    setIsClearModalOpen(false);
    setToast({ message: 'Cleared all entries across accounts!', type: 'success' });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <DashboardLayout
      title="Account & Preferences"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 1. Interactive Tutorial Tour Box */}
        <div className="clean-pink-card p-6 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-100 text-rose-700 border border-pink-200">
              <FaQuestionCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-rose-800 font-cursive">Interactive Tutorial Tour</h3>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
                Revisit the step-by-step walkthrough anytime
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-colors cursor-pointer uppercase"
          >
            Take Tour
          </button>
        </div>

        {/* 1.5 Pet Companion */}
        <div className="clean-pink-card p-6 flex items-center justify-between bg-white gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-100 text-rose-600 border border-pink-200">
              <FaPaw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-rose-800 font-cursive">Pet Companion</h3>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
                Choose your wandering desk buddy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handlePetTypeChange('duck')}
              title="Select Duck Companion 🐥"
              aria-label="Select Duck Companion"
              className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center ${
                petType === 'duck'
                  ? 'bg-rose-600 border-rose-700 shadow-md ring-2 ring-rose-400/50 scale-105'
                  : 'bg-pink-50/80 border-pink-200 hover:bg-pink-100 hover:border-pink-300 hover:scale-105'
              }`}
            >
              <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xs">
                {/* Feet */}
                <ellipse cx="36" cy="86" rx="9" ry="5" fill="#F97316" />
                <ellipse cx="64" cy="86" rx="9" ry="5" fill="#F97316" />
                {/* Body */}
                <circle cx="50" cy="62" r="26" fill="#FDE047" stroke="#EAB308" strokeWidth="3" />
                <ellipse cx="50" cy="66" rx="16" ry="12" fill="#FEF08A" opacity="0.6" />
                {/* Wings */}
                <path d="M 24 55 Q 12 60 22 72 Q 28 68 26 58 Z" fill="#FACC15" stroke="#EAB308" strokeWidth="2" />
                <path d="M 76 55 Q 88 60 78 72 Q 72 68 74 58 Z" fill="#FACC15" stroke="#EAB308" strokeWidth="2" />
                {/* Head */}
                <circle cx="50" cy="38" r="22" fill="#FDE047" stroke="#EAB308" strokeWidth="3" />
                {/* Eyes */}
                <circle cx="38" cy="34" r="4.5" fill="#1E293B" />
                <circle cx="40" cy="32" r="1.8" fill="#FFFFFF" />
                <circle cx="62" cy="34" r="4.5" fill="#1E293B" />
                <circle cx="64" cy="32" r="1.8" fill="#FFFFFF" />
                {/* Cheeks */}
                <circle cx="27" cy="42" r="4.5" fill="#F472B6" opacity="0.85" />
                <circle cx="73" cy="42" r="4.5" fill="#F472B6" opacity="0.85" />
                {/* Beak */}
                <ellipse cx="50" cy="44" rx="8" ry="5" fill="#FB923C" stroke="#EA580C" strokeWidth="2" />
                {/* Bowknot */}
                <path d="M 42 16 Q 50 20 42 24 Z" fill="#E11D48" />
                <path d="M 58 16 Q 50 20 58 24 Z" fill="#E11D48" />
                <circle cx="50" cy="20" r="3.5" fill="#BE123C" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handlePetTypeChange('cat')}
              title="Select Cat Companion 🐱"
              aria-label="Select Cat Companion"
              className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center ${
                petType === 'cat'
                  ? 'bg-rose-600 border-rose-700 shadow-md ring-2 ring-rose-400/50 scale-105'
                  : 'bg-pink-50/80 border-pink-200 hover:bg-pink-100 hover:border-pink-300 hover:scale-105'
              }`}
            >
              <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xs">
                {/* Paws */}
                <ellipse cx="36" cy="87" rx="8" ry="5" fill="#E8E8E8" stroke="#D0D0D0" strokeWidth="1.5" />
                <ellipse cx="64" cy="87" rx="8" ry="5" fill="#E8E8E8" stroke="#D0D0D0" strokeWidth="1.5" />
                {/* Body */}
                <ellipse cx="50" cy="66" rx="26" ry="22" fill="#F5F5F5" stroke="#DCDCDC" strokeWidth="2" />
                <ellipse cx="50" cy="70" rx="14" ry="11" fill="#FFFFFF" opacity="0.8" />
                {/* Tail */}
                <path d="M 74 75 Q 95 65 90 50 Q 88 44 82 50 Q 87 55 76 68 Z" fill="#F0F0F0" stroke="#DCDCDC" strokeWidth="1.5" />
                {/* Head */}
                <circle cx="50" cy="38" r="24" fill="#F5F5F5" stroke="#DCDCDC" strokeWidth="2" />
                {/* Ears */}
                <polygon points="26,22 20,4 36,16" fill="#F0F0F0" stroke="#DCDCDC" strokeWidth="2" />
                <polygon points="74,22 80,4 64,16" fill="#F0F0F0" stroke="#DCDCDC" strokeWidth="2" />
                <polygon points="27,21 22,8 34,17" fill="#F9A8D4" opacity="0.7" />
                <polygon points="73,21 78,8 66,17" fill="#F9A8D4" opacity="0.7" />
                {/* Eyes */}
                <ellipse cx="38" cy="36" rx="5.5" ry="6" fill="#22C55E" />
                <ellipse cx="38" cy="36" rx="2.5" ry="5" fill="#1E293B" />
                <circle cx="36" cy="33" r="1.5" fill="#FFFFFF" />
                <ellipse cx="62" cy="36" rx="5.5" ry="6" fill="#EAB308" />
                <ellipse cx="62" cy="36" rx="2.5" ry="5" fill="#1E293B" />
                <circle cx="60" cy="33" r="1.5" fill="#FFFFFF" />
                {/* Cheeks */}
                <circle cx="27" cy="44" r="4" fill="#F472B6" opacity="0.6" />
                <circle cx="73" cy="44" r="4" fill="#F472B6" opacity="0.6" />
                {/* Nose & Mouth */}
                <polygon points="50,46 47,50 53,50" fill="#F9A8D4" />
                <path d="M 47 50 Q 50 54 53 50" stroke="#DCDCDC" strokeWidth="1.5" fill="none" />
                {/* Whiskers */}
                <line x1="20" y1="44" x2="44" y2="46" stroke="#BDBDBD" strokeWidth="1.2" />
                <line x1="20" y1="48" x2="44" y2="48" stroke="#BDBDBD" strokeWidth="1.2" />
                <line x1="56" y1="46" x2="80" y2="44" stroke="#BDBDBD" strokeWidth="1.2" />
                <line x1="56" y1="48" x2="80" y2="48" stroke="#BDBDBD" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2. Editable Account Profile Settings */}
        <div className="clean-pink-card p-6 space-y-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-100 text-rose-600 border border-pink-200">
              <FaUser className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-rose-900 font-cursive">Account Settings & Profile Details</h3>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">Edit your personal account information</p>
            </div>
          </div>

          <form key={user?.id || 'profile-form'} onSubmit={handleSaveProfile} noValidate className="space-y-4 text-xs font-bold uppercase">
            {/* Profile Picture Upload & Avatar Picker */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-pink-50/80 border-2 border-pink-200">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-pink-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 bg-pink-100 font-bold">
                      <FaHeart className="w-6 h-6 mb-0.5" />
                      <span className="text-[9px]">No Photo</span>
                    </div>
                  )}
                </div>

                <label
                  htmlFor="avatar-upload-input"
                  className="absolute bottom-0 right-0 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg cursor-pointer border-2 border-white transition-all transform hover:scale-110"
                  title="Upload new profile picture"
                >
                  <FaCamera className="w-3 h-3" />
                </label>
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <label className="block text-rose-900 font-black tracking-wider text-xs">
                  Profile Picture
                </label>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label
                    htmlFor="avatar-upload-btn"
                    className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-white hover:bg-pink-100 border-2 border-pink-300 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <FaCamera className="w-3 h-3 text-rose-600" />
                    <span>Upload Photo</span>
                  </label>
                  <input
                    id="avatar-upload-btn"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  {avatarUrl && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenCropperForExisting}
                        className="px-3 py-1.5 text-xs font-bold text-rose-900 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        title="Adjust scale and crop photo"
                      >
                        <FaCrop className="w-3 h-3 text-rose-600" />
                        <span>Adjust Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border-2 border-red-200 rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1"
                      >
                        <FaTrash className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-1">
                  <p className="text-[10px] text-rose-700 font-bold mb-1.5">Or Select Preset Avatar:</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          avatarUrl === preset ? 'border-rose-600 ring-2 ring-rose-400 scale-110' : 'border-pink-300 hover:border-rose-400'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-rose-900 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <FaUser className={`absolute left-4 top-3.5 w-4 h-4 ${profileError ? 'text-red-400' : 'text-pink-400'}`} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (profileError) setProfileError('');
                    }}
                    placeholder="Enter full name"
                    className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 focus:outline-hidden focus:ring-2 font-bold ${
                      profileError
                        ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                        : 'border-pink-300 focus:ring-rose-500'
                    }`}
                  />
                </div>
                {profileError && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                    <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                    <span>{profileError}</span>
                  </p>
                )}
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-rose-900 mb-1">
                  Birth Date
                </label>
                <div 
                  onClick={() => setIsDatePickerOpen(true)}
                  className="relative cursor-pointer"
                >
                  <FaCalendarAlt className="absolute left-4 top-3.5 text-pink-400 w-4 h-4" />
                  <input
                    type="text"
                    readOnly
                    value={birthDate ? formatDate(birthDate) : ''}
                    placeholder="Select birth date..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 cursor-pointer font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Read-Only Email */}
            <div>
              <label className="block text-rose-900 mb-1">
                Email Address 
              </label>
              <div className="p-3 py-2.5 rounded-2xl bg-pink-50 text-rose-900 font-black border-2 border-pink-200">
                {user?.email || 'N/A'}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSavingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaCheck className="w-3.5 h-3.5" />
                )}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. Custom Categories Management */}
        <div className="clean-pink-card p-6 space-y-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-100 text-rose-600 border border-pink-200">
              <FaTag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-rose-900 font-cursive">Custom Categories</h3>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
                Add custom categories beyond default options
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <form onSubmit={handleAddCategory} noValidate className="flex gap-3 text-xs font-bold uppercase">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => {
                  setNewCatInput(e.target.value);
                  if (catError) setCatError('');
                }}
                placeholder="Enter new category..."
                className={`flex-1 px-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 focus:outline-hidden focus:ring-2 ${
                  catError
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-pink-300 focus:ring-rose-500'
                }`}
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl border-2 border-rose-700 shadow-md transition-colors cursor-pointer shrink-0"
              >
                <FaPlus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </form>
            {catError && (
              <p className="flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                <span>{catError}</span>
              </p>
            )}
          </div>

          {customCategories.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-rose-900 mb-2 uppercase">Custom Category Entries:</p>
              <div className="flex flex-wrap gap-2">
                {customCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-100 text-rose-950 text-xs font-bold border border-pink-300 uppercase"
                  >
                    <FaTable className="w-3 h-3 text-rose-600" />
                    <span>{cat}</span>
                    <button
                      onClick={() => setDeletingCategory(cat)}
                      className="text-pink-600 hover:text-rose-800 transition-colors cursor-pointer"
                      title="Remove category"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3.5. Salary / Budget Setup Card */}
        <div className="clean-pink-card p-6 space-y-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-100 text-rose-600 border border-pink-200">
              <FaWallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-rose-900 font-cursive">Salary / Budget Settings</h3>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
                Set income or spending limits to monitor overspending
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBudget} noValidate className="space-y-4 text-xs font-bold uppercase">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-rose-900 mb-1">
                  Budget / Salary Limit (₱) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-pink-400 font-extrabold text-sm select-none">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={budgetAmount}
                    onChange={(e) => {
                      setBudgetAmount(e.target.value);
                      if (budgetError) setBudgetError('');
                    }}
                    placeholder="e.g. 50000"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-2xl border-2 bg-white text-rose-900 focus:outline-hidden focus:ring-2 font-bold ${
                      budgetError
                        ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                        : 'border-pink-300 focus:ring-rose-500'
                    }`}
                  />
                </div>
                {budgetError && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-600 tracking-wide uppercase">
                    <FaExclamationCircle className="w-3 h-3 text-red-600 shrink-0" />
                    <span>{budgetError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-rose-900 mb-1">
                  Budget Period
                </label>
                <select
                  value={budgetPeriod}
                  onChange={(e) => setBudgetPeriod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-pink-300 bg-white text-rose-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingBudget}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSavingBudget ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaCheck className="w-3.5 h-3.5" />
                )}
                <span>Save Budget</span>
              </button>
            </div>
          </form>
        </div>

        {/* 4. Export Spreadsheet Data Card */}
        <div className="clean-pink-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-2 border-pink-300">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 border border-pink-300">
              <FaDownload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-rose-900 font-cursive">Export Expenses Data</h3>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
                Download your spreadsheet records as PDF, CSV, or Microsoft Word (.docx)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-md border-2 border-rose-700 transition-colors cursor-pointer uppercase shrink-0 flex items-center gap-2"
          >
            <FaDownload className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>

        {/* 5. Clear All Accounts Data Action Card */}
        <div className="clean-pink-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-2 border-red-300">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-100 text-red-700 border border-red-300">
              <FaExclamationTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-rose-900 font-cursive">Clear All Account Data</h3>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wide">
                Wipe all cached spreadsheet entries & start completely clean
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-5 py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-md border-2 border-red-700 transition-colors cursor-pointer uppercase shrink-0"
          >
            Clear All Data
          </button>
        </div>
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

      {/* Interactive Onboarding Tutorial Modal */}
      <OnboardingModal
        key={isOnboardingOpen ? 'tour-open' : 'tour-closed'}
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Clear All Data Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Data Erasure"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-rose-900">
            Are you sure you want to clear all spreadsheet entries across accounts? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsClearModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-rose-800 hover:bg-pink-100 rounded-2xl transition-colors cursor-pointer uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClearAllData}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-md transition-all cursor-pointer uppercase"
            >
              Wipe Data Now
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Custom Category Confirmation Modal */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Remove Category"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold text-rose-900 uppercase">
            Are you sure you want to remove the category &quot;{deletingCategory}&quot;? Existing expenses using this category will be unaffected, but you won&apos;t be able to select it for new entries.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
            <button
              type="button"
              onClick={() => setDeletingCategory(null)}
              className="px-5 py-2.5 text-xs font-black uppercase text-rose-800 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-2xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deletingCategory) {
                  handleRemoveCustomCategory(deletingCategory);
                  setDeletingCategory(null);
                }
              }}
              className="px-5 py-2.5 text-xs font-black uppercase text-white bg-red-600 hover:bg-red-700 border-2 border-red-700 rounded-2xl shadow-md transition-all cursor-pointer"
            >
              Remove Category
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Data Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        budget={budgetObj}
        defaultTitle="Expense Tracker Complete Account Report"
      />

      {/* Profile Picture Image Adjuster & Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={cropImageSrc}
        onSave={handleCroppedAvatarSave}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </DashboardLayout>
  );
};
