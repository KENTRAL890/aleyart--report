import { useState } from 'react';
import { useData } from '../store/DataContext';
import { ALL_CLASSES } from '../types';
import type { User } from '../types';
import { UserCog, Plus, Edit2, Trash2, X, Key, Shield } from 'lucide-react';

function generateId() {
  return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export default function TeachersPage() {
  const { data, addUser, updateUser, deleteUser } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: '', username: '', password: '', assignedClass: '',
  });

  const teachers = data.users.filter(u => u.role === 'teacher');
  const assignedClasses = new Set(teachers.map(t => t.assignedClass));

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ fullName: '', username: '', password: '', assignedClass: '' });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      password: user.password,
      assignedClass: user.assignedClass || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if username already exists
    const existingUser = data.users.find(u => u.username === formData.username && u.id !== editingUser?.id);
    if (existingUser) {
      alert('Username already exists. Please choose a different username.');
      return;
    }

    if (editingUser) {
      await updateUser({
        ...editingUser,
        ...formData,
      });
    } else {
      const newUser: User = {
        id: generateId(),
        role: 'teacher',
        ...formData,
      };
      await addUser(newUser);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this teacher account?')) {
      await deleteUser(id);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Teacher Management</h2>
          <p className="text-sm text-gray-500">Create and manage teacher accounts with class assignments</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 shadow-sm">
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center border border-gray-100">
            <UserCog className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 mb-2">No teachers added yet</p>
            <button onClick={openAddModal} className="text-blue-600 text-sm hover:underline">
              Add your first teacher
            </button>
          </div>
        ) : (
          teachers.map(teacher => (
            <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {teacher.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{teacher.fullName}</h3>
                    <p className="text-xs text-gray-500">@{teacher.username}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(teacher)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(teacher.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Class:</span>
                  <span className="font-medium text-blue-600">{teacher.assignedClass || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Password:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{teacher.password}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingUser ? 'Edit Teacher' : 'Add New Teacher'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    required />
                  <button type="button" onClick={generatePassword}
                    className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors whitespace-nowrap">
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Class *</label>
                <select value={formData.assignedClass} onChange={e => setFormData({ ...formData, assignedClass: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required>
                  <option value="">Select a class</option>
                  {ALL_CLASSES.map(c => (
                    <option key={c} value={c} disabled={assignedClasses.has(c) && editingUser?.assignedClass !== c}>
                      {c} {assignedClasses.has(c) && editingUser?.assignedClass !== c ? '(Assigned)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700">
                  {editingUser ? 'Update' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
