import { useState } from 'react';
import { useData } from '../store/DataContext';
import { ALL_CLASSES } from '../types';
import type { Student } from '../types';
import { Edit2, Trash2, Search, X, UserPlus, Users } from 'lucide-react';

function generateId() {
  return 'stu-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export default function StudentsPage() {
  const { data, currentUser, addStudent, updateStudent, deleteStudent } = useData();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Simple add form - only name and gender
  const [addName, setAddName] = useState('');
  const [addGender, setAddGender] = useState('Male');

  // Full edit form
  const [editForm, setEditForm] = useState({
    name: '', gender: 'Male', dateOfBirth: '', parentName: '', parentPhone: '', totalFees: 0,
  });

  const students = data.students
    .filter(s => s.className === selectedClass)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const openAddModal = () => {
    setAddName('');
    setAddGender('Male');
    setShowAddModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      totalFees: student.totalFees,
    });
    setShowEditModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    const newStudent: Student = {
      id: generateId(),
      name: addName.trim(),
      gender: addGender,
      className: selectedClass,
      dateOfBirth: '',
      parentName: '',
      parentPhone: '',
      totalFees: 0,
      feesPaid: 0,
      feesBalance: 0,
      feeStatus: 'pending',
    };
    await addStudent(newStudent);
    setAddName('');
    setAddGender('Male');
    // Keep modal open so teacher can add more students quickly
  };

  const handleAddAndClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    const newStudent: Student = {
      id: generateId(),
      name: addName.trim(),
      gender: addGender,
      className: selectedClass,
      dateOfBirth: '',
      parentName: '',
      parentPhone: '',
      totalFees: 0,
      feesPaid: 0,
      feesBalance: 0,
      feeStatus: 'pending',
    };
    await addStudent(newStudent);
    setShowAddModal(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    await updateStudent({
      ...editingStudent,
      ...editForm,
      feesBalance: editForm.totalFees - editingStudent.feesPaid,
      feeStatus: (editForm.totalFees - editingStudent.feesPaid) <= 0 
        ? 'completed' 
        : (editingStudent.feesPaid > 0 ? 'partial' : 'pending'),
    });
    setShowEditModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student? All their data will be removed.')) {
      await deleteStudent(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {isAdmin && (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {ALL_CLASSES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-xl font-bold text-gray-800">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Boys</p>
          <p className="text-xl font-bold text-blue-600">{students.filter(s => s.gender === 'Male').length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Girls</p>
          <p className="text-xl font-bold text-pink-600">{students.filter(s => s.gender === 'Female').length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Fees Completed</p>
          <p className="text-xl font-bold text-green-600">{students.filter(s => s.feeStatus === 'completed').length}</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Gender</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fees</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No students found in {selectedClass}</p>
                    <button onClick={openAddModal} className="mt-2 text-blue-600 text-sm hover:underline">
                      Add your first student
                    </button>
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${student.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{student.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-600 hidden sm:table-cell">{student.gender}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-800">
                      {student.totalFees > 0 ? `GH₵ ${student.totalFees.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.feeStatus === 'completed' ? 'bg-green-50 text-green-700' :
                        student.feeStatus === 'partial' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {student.feeStatus === 'completed' ? '✓ Completed' : student.feeStatus === 'partial' ? '◐ Partial' : '○ Pending'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(student)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== ADD STUDENT MODAL (Simple: Name + Gender only) ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Add Student</h3>
                <p className="text-xs text-gray-500 mt-0.5">Adding to <strong>{selectedClass}</strong></p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter student's full name"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddGender('Male')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      addGender === 'Male'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">👦</span>
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddGender('Female')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      addGender === 'Female'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">👧</span>
                    Female
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddAndClose}
                  disabled={!addName.trim()}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add & Close
                </button>
                <button
                  type="submit"
                  disabled={!addName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add & Next
                </button>
              </div>

              {/* Recently added indicator */}
              {students.length > 0 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  {students.length} student{students.length !== 1 ? 's' : ''} in {selectedClass}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT STUDENT MODAL (Full details) ===== */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Edit Student</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingStudent.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, gender: 'Male' })}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      editForm.gender === 'Male'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>👦</span> Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, gender: 'Female' })}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      editForm.gender === 'Female'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>👧</span> Female
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Fees (GH₵)</label>
                  <input
                    type="number"
                    value={editForm.totalFees || ''}
                    onChange={e => setEditForm({ ...editForm, totalFees: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                <input
                  type="text"
                  value={editForm.parentName}
                  onChange={e => setEditForm({ ...editForm, parentName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Parent or guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                <input
                  type="tel"
                  value={editForm.parentPhone}
                  onChange={e => setEditForm({ ...editForm, parentPhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Phone number"
                />
              </div>

              {/* Fee summary */}
              {editingStudent.totalFees > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Fees:</span>
                    <span className="font-medium">GH₵ {editingStudent.totalFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid:</span>
                    <span className="font-medium text-green-600">GH₵ {editingStudent.feesPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Balance:</span>
                    <span className="font-medium text-red-600">GH₵ {Math.max(0, editingStudent.feesBalance).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all">
                  Update Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
