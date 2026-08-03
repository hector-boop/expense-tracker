import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Modal } from './Modal';
import { 
  FaChartPie, 
  FaReceipt, 
  FaCoins,
  FaCog, 
  FaSignOutAlt, 
  FaTimes, 
  FaHeart,
  FaTable,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isPetDisabled, setIsPetDisabled] = useState(() => {
    return localStorage.getItem('pet_duck_disabled') !== 'false';
  });

  const togglePetDuck = () => {
    const nextState = !isPetDisabled;
    setIsPetDisabled(nextState);
    localStorage.setItem('pet_duck_disabled', nextState ? 'true' : 'false');
    window.dispatchEvent(new Event('pet_duck_toggle'));
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaChartPie },
    { name: 'Expenses Table', path: '/expenses', icon: FaReceipt },
    { name: 'Debt Manager', path: '/debts', icon: FaCoins },
    { name: 'Settings', path: '/settings', icon: FaCog },
  ];

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-pink-950/20 backdrop-blur-xs lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 lg:z-10 w-64 bg-white border-r border-pink-200/60 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 flex flex-col justify-between overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between h-20 px-6 bg-white border-b border-pink-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 border border-pink-300 text-rose-700 flex items-center justify-center shadow-xs">
                <FaTable className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-rose-900 leading-none tracking-wide font-cursive">
                  Expense Tracker
                </h1>
                <p className="text-[11px] text-rose-700 font-bold tracking-wider uppercase mt-1">
                  Spreadsheet Dashboard
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-rose-700 hover:text-rose-900 rounded-lg"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2 bg-white">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md border-2 border-rose-700'
                        : 'text-rose-900 bg-pink-50/80 hover:bg-pink-100 hover:text-rose-800 border border-pink-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Pet Toggle Footer (Always Fixed & Visible) */}
        <div className="p-4 bg-white border-t border-pink-100 shrink-0 space-y-2">
          {/* Small Pet Toggle Button Above User Profile */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Wandering Pet</span>
            <button
              type="button"
              onClick={togglePetDuck}
              title={isPetDisabled ? 'Enable Pet Duck' : 'Disable Pet Duck'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all text-[10px] font-extrabold cursor-pointer border uppercase tracking-wider ${
                isPetDisabled
                  ? 'bg-pink-50 text-rose-600 border-pink-200 hover:bg-pink-100 hover:text-rose-800'
                  : 'bg-pink-100 text-rose-700 border-pink-300 hover:bg-pink-200'
              }`}
            >
              {isPetDisabled ? (
                <>
                  <FaEyeSlash className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Pet: Off</span>
                </>
              ) : (
                <>
                  <FaEye className="w-3 h-3 text-rose-700 shrink-0" />
                  <span>Pet: On</span>
                </>
              )}
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-pink-50 border border-pink-300">
            <NavLink
              to="/settings"
              onClick={() => onClose && onClose()}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
              title="View Account Settings"
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-rose-400 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-pink-100 border border-pink-300 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <FaHeart className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-rose-900 truncate">
                  {userDisplayName}
                </p>
                <p className="text-[10px] text-rose-700 font-semibold truncate">
                  {user?.email}
                </p>
              </div>
            </NavLink>

            <button
              onClick={() => setIsSignOutModalOpen(true)}
              title="Log out"
              className="p-1.5 text-rose-700 hover:text-rose-900 rounded-xl hover:bg-pink-100 transition-colors shrink-0 cursor-pointer"
            >
              <FaSignOutAlt className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal: Sign Out Confirmation */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Sign Out"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold text-rose-900 uppercase">
            Are you sure you want to sign out of your account?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
            <button
              type="button"
              onClick={() => setIsSignOutModalOpen(false)}
              className="px-5 py-2.5 text-xs font-black uppercase text-rose-800 bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 rounded-2xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignOutModalOpen(false);
                signOut();
              }}
              className="px-5 py-2.5 text-xs font-black uppercase text-white bg-rose-600 hover:bg-rose-700 border-2 border-rose-700 rounded-2xl shadow-md transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
