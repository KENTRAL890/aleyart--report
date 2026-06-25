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
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '', gender: 'Male', dateOfBirth: '', parentName: '', parentPhone: '', totalFees: 0,
  });

  // Classes available based on role

  const students = data.students
    .filter(s => s.className === selectedClass)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({ name: '', gender: 'Male', dateOfBirth: '', parentName: '', parentPhone: '', totalFees: 0 });
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      totalFees: student.totalFees,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      await updateStudent({
        ...editingStudent,
        ...formData,
        feesBalance: formData.totalFees - editingStudent.feesPaid,
        feeStatus: (formData.totalFees - editingStudent.feesPaid) <= 0 ? 'completed' : (editingStudent.feesPaid > 0 ? 'partial' : 'pending'),
      });
    } else {
      const newStudent: Student = {
        id: generateId(),
        className: selectedClass,
        ...formData,
        feesPaid: 0,
        feesBalance: formData.totalFees,
        feeStatus: 'pending',
      };
      await addStudent(newStudent);
    }
    setShowModal(false);
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
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-xl font-bold text-gray-800">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
          <p className="text-xs text-gray-500">Boys</p>
          <p className="text-xl font-bold text-blue-600">{students.filter(s => s.gender === 'Male').length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
          <p className="text-xs text-gray-500">Girls</p>
          <p className="text-xl font-bold text-pink-600">{students.filter(s => s.gender === 'Female').length}</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
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
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Parent</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total Fees</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
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
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-600 hidden md:table-cell">{student.parentName || '—'}</td>
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-800">GH₵ {student.totalFees.toLocaleString()}</td>
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
                        <button onClick={() => openEditModal(student)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fees (GH₵) *</label>
                <input
                  type="number"
                  value={formData.totalFees}
                  onChange={e => setFormData({ ...formData, totalFees: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all">
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
