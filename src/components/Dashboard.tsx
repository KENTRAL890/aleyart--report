import { useData } from '../store/DataContext';
import { ALL_CLASSES } from '../types';
import { Users, DollarSign, BookOpen, GraduationCap, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { data, currentUser } = useData();

  const isAdmin = currentUser?.role === 'admin';
  const students = isAdmin 
    ? data.students 
    : data.students.filter(s => s.className === currentUser?.assignedClass);

  const totalStudents = students.length;
  const totalFeesExpected = students.reduce((sum, s) => sum + s.totalFees, 0);
  const totalFeesCollected = students.reduce((sum, s) => sum + s.feesPaid, 0);
  const totalFeesOwed = students.reduce((sum, s) => sum + s.feesBalance, 0);
  const feeCompletedCount = students.filter(s => s.feeStatus === 'completed').length;
  const feePendingCount = students.filter(s => s.feeStatus === 'pending' || s.feeStatus === 'partial').length;

  const classCounts = ALL_CLASSES.map(c => ({
    name: c,
    count: data.students.filter(s => s.className === c).length,
    feesCollected: data.students.filter(s => s.className === c).reduce((sum, s) => sum + s.feesPaid, 0),
    feesOwed: data.students.filter(s => s.className === c).reduce((sum, s) => sum + s.feesBalance, 0),
  }));

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Fees Collected', value: `GH₵ ${totalFeesCollected.toLocaleString()}`, icon: DollarSign, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
    { label: 'Fees Owed', value: `GH₵ ${totalFeesOwed.toLocaleString()}`, icon: AlertTriangle, color: 'from-red-500 to-red-600', bg: 'bg-red-50' },
    { label: 'Fees Completed', value: feeCompletedCount, icon: TrendingUp, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8" />
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome to Aleyart Academy</h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl">
            {isAdmin
              ? 'Manage all classes, students, assessments, and fees from your admin dashboard.'
              : `Manage your ${currentUser?.assignedClass || ''} class students, assessments, and fees.`
            }
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs sm:text-sm text-blue-100">
            <span>📍 Odorkor-Official Town</span>
            <span>📮 P.O. Box 4183</span>
            <span>📞 0553797233</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Class Overview */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Class Overview
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Students</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fees Collected</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fees Owed</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classCounts.map(c => {
                  const teacher = data.users.find(u => u.assignedClass === c.name && u.role === 'teacher');
                  return (
                    <tr key={c.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                          {c.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">{c.count}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">GH₵ {c.feesCollected.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-medium">GH₵ {c.feesOwed.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher?.fullName || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Info for Teachers */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Fee Summary - {currentUser?.assignedClass}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Expected</span>
                <span className="font-semibold text-gray-800">GH₵ {totalFeesExpected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Collected</span>
                <span className="font-semibold text-green-600">GH₵ {totalFeesCollected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Outstanding</span>
                <span className="font-semibold text-red-600">GH₵ {totalFeesOwed.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Completed: {feeCompletedCount}</span>
                  <span className="text-gray-500">Pending: {feePendingCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Students with Outstanding Fees</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {students.filter(s => s.feesBalance > 0).length === 0 ? (
                <p className="text-gray-400 text-sm">All fees collected! 🎉</p>
              ) : (
                students.filter(s => s.feesBalance > 0).map(s => (
                  <div key={s.id} className="flex justify-between items-center text-sm py-1">
                    <span className="text-gray-700">{s.name}</span>
                    <span className="text-red-600 font-medium">GH₵ {s.feesBalance.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
