import { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_CATEGORIES, expenseService } from '../services/expenseService';
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
  FaCrop
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

  useEffect(() => {
    expenseService.getExpenses().then(data => setExpenses(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(storageCategoryKey, JSON.stringify(customCategories));
  }, [customCategories, storageCategoryKey]);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
