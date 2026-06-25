import { useState } from 'react';
import { useData } from '../store/DataContext';
import { Settings, Trash2, AlertTriangle, Download, Upload, Database, Cloud, HardDrive, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { data, currentUser, useSupabase } = useData();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetText, setResetText] = useState('');

  const handleExport = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aleyart_academy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          localStorage.setItem('aleyart_academy_data', JSON.stringify(imported));
          alert('Data imported successfully! Page will reload.');
          window.location.reload();
        } catch {
          alert('Invalid file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (resetText !== 'DELETE ALL DATA') return;
    localStorage.removeItem('aleyart_academy_data');
    localStorage.removeItem('aleyart_current_user');
    alert('All data has been reset. Page will reload.');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Connection Status */}
      <div className={`rounded-xl shadow-sm border p-6 ${useSupabase ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          {useSupabase ? (
            <>
              <Cloud className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-green-800">Cloud Sync Active</h2>
                <p className="text-sm text-green-600">All data is synced in real-time with Supabase</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500 ml-auto" />
            </>
          ) : (
            <>
              <HardDrive className="w-6 h-6 text-yellow-600" />
              <div>
                <h2 className="text-lg font-semibold text-yellow-800">Local Storage Mode</h2>
                <p className="text-sm text-yellow-600">Data saved locally. Configure Supabase for cloud sync.</p>
              </div>
            </>
          )}
        </div>
        {!useSupabase && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600 mb-2">
              <strong>To enable cloud sync:</strong>
            </p>
            <ol className="text-sm text-gray-500 list-decimal list-inside space-y-1">
              <li>Create a free account at <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:underline">supabase.com</a></li>
              <li>Create a new project</li>
              <li>Run the SQL schema from <code className="bg-gray-100 px-1 rounded">SUPABASE_SETUP.md</code></li>
              <li>Add your Supabase URL and key to environment variables</li>
            </ol>
          </div>
        )}
      </div>

      {/* School Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">School Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">School Name</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">Aleyart Academy</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Location</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">Odorkor-Official Town</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">P.O. Box</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">4183</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">0553797233</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Database Statistics</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{data.users.length}</p>
            <p className="text-xs text-blue-500 mt-1">Users</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{data.students.length}</p>
            <p className="text-xs text-green-500 mt-1">Students</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{data.assessments.length}</p>
            <p className="text-xs text-purple-500 mt-1">Assessments</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{data.terminalReports.length}</p>
            <p className="text-xs text-orange-500 mt-1">Reports Saved</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Data Management</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-green-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-800">Export Data</h3>
              <p className="text-xs text-gray-500">Download all data as JSON backup file</p>
            </div>
            <button onClick={handleExport}
              className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-800">Import Data</h3>
              <p className="text-xs text-gray-500">Restore from a JSON backup file (replaces all data)</p>
            </div>
            <button onClick={handleImport}
              className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>

          {currentUser?.role === 'admin' && (
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Reset All Data
                  </h3>
                  <p className="text-xs text-red-600">This will permanently delete ALL data. This cannot be undone.</p>
                </div>
                <button onClick={() => setShowResetConfirm(true)}
                  className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                  <Trash2 className="w-4 h-4" />
                  Reset
                </button>
              </div>

              {showResetConfirm && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 mb-3">
                    Type <strong>DELETE ALL DATA</strong> to confirm:
                  </p>
                  <div className="flex gap-2">
                    <input type="text" value={resetText} onChange={e => setResetText(e.target.value)}
                      className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm"
                      placeholder="DELETE ALL DATA" />
                    <button onClick={handleReset}
                      disabled={resetText !== 'DELETE ALL DATA'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                      Confirm
                    </button>
                    <button onClick={() => { setShowResetConfirm(false); setResetText(''); }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <span className="ml-2 font-medium text-gray-800">{currentUser?.fullName}</span>
          </div>
          <div>
            <span className="text-gray-500">Role:</span>
            <span className="ml-2 font-medium text-gray-800 capitalize">{currentUser?.role}</span>
          </div>
          <div>
            <span className="text-gray-500">Username:</span>
            <span className="ml-2 font-medium text-gray-800">{currentUser?.username}</span>
          </div>
          {currentUser?.assignedClass && (
            <div>
              <span className="text-gray-500">Assigned Class:</span>
              <span className="ml-2 font-medium text-blue-600">{currentUser.assignedClass}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
