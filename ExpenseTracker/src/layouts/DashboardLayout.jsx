import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { WanderingDuck } from '../components/WanderingDuck';

export const DashboardLayout = ({ children, title = 'Dashboard', onOpenAddModal, onOpenTour, onOpenExport }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex pink-grid-bg text-rose-900 transition-colors relative">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={title}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenAddModal={onOpenAddModal}
          onOpenTour={onOpenTour}
          onOpenExport={onOpenExport}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div key={location.pathname} className="space-y-6 animate-content-fade">
            {children}
          </div>
        </main>
      </div>

      {/* Cute Wandering Duck Pet */}
      <WanderingDuck />
    </div>
  );
};
