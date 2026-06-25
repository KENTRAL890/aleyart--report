import { useState } from 'react';
import { DataProvider, useData } from './store/DataContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentsPage from './components/StudentsPage';
import AssessmentPage from './components/AssessmentPage';
import FeesPage from './components/FeesPage';
import ReportsPage from './components/ReportsPage';
import ReportArchive from './components/ReportArchive';
import TeachersPage from './components/TeachersPage';
import PromotePage from './components/PromotePage';
import SettingsPage from './components/SettingsPage';
import { GraduationCap, Loader2, Cloud, HardDrive } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-6">
          <GraduationCap className="w-10 h-10 text-blue-800" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Aleyart Academy</h1>
        <div className="flex items-center justify-center gap-2 text-blue-200">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus() {
  const { useSupabase } = useData();
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg ${
      useSupabase 
        ? 'bg-green-100 text-green-700 border border-green-200' 
        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    }`}>
      {useSupabase ? (
        <>
          <Cloud className="w-4 h-4" />
          <span>Cloud Sync Active</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </>
      ) : (
        <>
          <HardDrive className="w-4 h-4" />
          <span>Local Storage</span>
        </>
      )}
    </div>
  );
}

function AppContent() {
  const { currentUser, loading } = useData();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsPage />;
      case 'assessment':
        return <AssessmentPage />;
      case 'fees':
        return <FeesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'report-archive':
        return <ReportArchive />;
      case 'teachers':
        return currentUser.role === 'admin' ? <TeachersPage /> : <Dashboard />;
      case 'promote':
        return currentUser.role === 'admin' ? <PromotePage /> : <Dashboard />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
      <ConnectionStatus />
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
