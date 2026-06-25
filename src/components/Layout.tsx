import { useState } from 'react';
import { useData } from '../store/DataContext';
import {
  LayoutDashboard, Users, BookOpen, DollarSign, FileText,
  Settings, LogOut, Menu, X, GraduationCap, ChevronDown,
  UserCog, ArrowLeftRight, Archive
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'assessment', label: 'Assessment', icon: BookOpen },
  { id: 'fees', label: 'Fees Management', icon: DollarSign },
  { id: 'reports', label: 'Terminal Reports', icon: FileText },
  { id: 'report-archive', label: 'Report Archive', icon: Archive },
  { id: 'teachers', label: 'Teachers', icon: UserCog },
  { id: 'promote', label: 'Move Students', icon: ArrowLeftRight },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const teacherNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'My Students', icon: Users },
  { id: 'assessment', label: 'Assessment', icon: BookOpen },
  { id: 'fees', label: 'Class Fees', icon: DollarSign },
  { id: 'reports', label: 'Terminal Reports', icon: FileText },
  { id: 'report-archive', label: 'Report Archive', icon: Archive },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { currentUser, logout } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = currentUser?.role === 'admin' ? adminNavItems : teacherNavItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/images/logo.png" alt="Logo" className="w-10 h-10 object-contain"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                  }}
                />
                <GraduationCap className="w-7 h-7 text-blue-800" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Aleyart</h1>
                <p className="text-blue-200 text-xs">Academy</p>
              </div>
              <button className="lg:hidden ml-auto text-white" onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentPage === item.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {currentUser?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{currentUser?.fullName}</p>
                <p className="text-blue-200 text-xs capitalize">{currentUser?.role}{currentUser?.assignedClass ? ` • ${currentUser.assignedClass}` : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 capitalize">
                  {navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">Aleyart Academy Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {currentUser?.fullName?.charAt(0) || 'A'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{currentUser?.fullName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800">{currentUser?.fullName}</p>
                        <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
