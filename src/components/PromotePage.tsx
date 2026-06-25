import { useState } from 'react';
import { useData } from '../store/DataContext';
import { ALL_CLASSES } from '../types';
import { ArrowRight, CheckSquare, Square, ArrowLeftRight } from 'lucide-react';

export default function PromotePage() {
  const { data, moveStudent } = useData();

  const [fromClass, setFromClass] = useState<string>(ALL_CLASSES[0]);
  const [toClass, setToClass] = useState<string>(ALL_CLASSES[1]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const students = data.students
    .filter(s => s.className === fromClass)
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStudents(newSet);
  };

  const selectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleMove = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to move.');
      return;
    }
    if (fromClass === toClass) {
      alert('Source and destination class cannot be the same.');
      return;
    }
    if (confirm(`Move ${selectedStudents.size} student(s) from ${fromClass} to ${toClass}?`)) {
      for (const id of selectedStudents) {
        await moveStudent(id, toClass);
      }
      setSelectedStudents(new Set());
      alert('Students moved successfully!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Move / Promote Students</h2>
        <p className="text-sm text-gray-500">Select students and move them to a different class</p>
      </div>

      {/* Class Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">From Class</label>
            <select value={fromClass} onChange={e => { setFromClass(e.target.value); setSelectedStudents(new Set()); }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <ArrowRight className="w-8 h-8 text-blue-600 flex-shrink-0 hidden sm:block mt-5" />
          <ArrowLeftRight className="w-6 h-6 text-blue-600 flex-shrink-0 sm:hidden" />

          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">To Class</label>
            <select value={toClass} onChange={e => setToClass(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">{fromClass} Students</h3>
            <p className="text-xs text-gray-500">{selectedStudents.size} of {students.length} selected</p>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
              {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
            </button>
            <button onClick={handleMove}
              disabled={selectedStudents.size === 0}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              Move Selected
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No students in {fromClass}
            </div>
          ) : (
            students.map((student, idx) => (
              <div key={student.id}
                onClick={() => toggleStudent(student.id)}
                className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors ${
                  selectedStudents.has(student.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}>
                {selectedStudents.has(student.id)
                  ? <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  : <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                }
                <span className="text-sm text-gray-400 w-6">{idx + 1}.</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  student.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                }`}>
                  {student.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-800">{student.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{student.gender}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
