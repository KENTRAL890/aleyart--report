import { useState, useMemo, useEffect } from 'react';
import { useData } from '../store/DataContext';
import { ALL_CLASSES, getSubjectsForClass, getGrade, TERMS, ACADEMIC_YEARS } from '../types';
import type { Assessment } from '../types';
import { BookOpen, Save, Trash2, CheckCircle } from 'lucide-react';

function generateId(studentId: string, subject: string, term: string, year: string) {
  return `assess-${studentId}-${subject.replace(/\s/g, '_')}-${term.replace(/\s/g, '_')}-${year}`;
}

export default function AssessmentPage() {
  const { data, currentUser, saveAssessments, deleteClassAssessments } = useData();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [saved, setSaved] = useState(false);

  const subjects = getSubjectsForClass(selectedClass);
  const activeSubject = selectedSubject || subjects[0];

  const students = data.students
    .filter(s => s.className === selectedClass)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get existing assessments for this class/term/year/subject
  const existingAssessments = useMemo(() => {
    const map: Record<string, Assessment> = {};
    data.assessments
      .filter(a => a.className === selectedClass && a.term === selectedTerm && a.academicYear === selectedYear && a.subject === activeSubject)
      .forEach(a => { map[a.studentId] = a; });
    return map;
  }, [data.assessments, selectedClass, selectedTerm, selectedYear, activeSubject]);

  const [scores, setScores] = useState<Record<string, { classScore: number; examScore: number }>>({});

  // Initialize scores when subject/class changes
  useEffect(() => {
    const newScores: Record<string, { classScore: number; examScore: number }> = {};
    students.forEach(s => {
      const existing = existingAssessments[s.id];
      newScores[s.id] = {
        classScore: existing?.classScore ?? 0,
        examScore: existing?.examScore ?? 0,
      };
    });
    setScores(newScores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedTerm, selectedYear, activeSubject, students.length]);

  const updateScore = (studentId: string, field: 'classScore' | 'examScore', value: number) => {
    const capped = field === 'classScore' ? Math.min(50, Math.max(0, value)) : Math.min(50, Math.max(0, value));
    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: capped },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    const assessments: Assessment[] = students.map(student => {
      const s = scores[student.id] || { classScore: 0, examScore: 0 };
      const total = s.classScore + s.examScore;
      const { grade, remark } = getGrade(total);
      return {
        id: generateId(student.id, activeSubject, selectedTerm, selectedYear),
        studentId: student.id,
        studentName: student.name,
        className: selectedClass,
        subject: activeSubject,
        classScore: s.classScore,
        examScore: s.examScore,
        total,
        grade,
        remark,
        term: selectedTerm,
        academicYear: selectedYear,
      };
    });
    await saveAssessments(assessments);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAll = async () => {
    if (confirm(`Delete ALL assessments for ${selectedClass} - ${selectedTerm} ${selectedYear}? This cannot be undone.`)) {
      await deleteClassAssessments(selectedClass, selectedTerm, selectedYear);
    }
  };

  // Check completion status for each subject
  const subjectStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    subjects.forEach(sub => {
      const assessments = data.assessments.filter(a =>
        a.className === selectedClass && a.term === selectedTerm && a.academicYear === selectedYear && a.subject === sub
      );
      status[sub] = assessments.length > 0 && assessments.length === students.length;
    });
    return status;
  }, [data.assessments, selectedClass, selectedTerm, selectedYear, subjects, students.length]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Class</label>
              <select
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Class</label>
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                {currentUser?.assignedClass}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Term</label>
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Academic Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700">Select Subject</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => { setSelectedSubject(sub); setSaved(false); }}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeSubject === sub
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {sub}
              {subjectStatus[sub] && (
                <CheckCircle className={`inline-block w-3.5 h-3.5 ml-1.5 ${activeSubject === sub ? 'text-green-200' : 'text-green-500'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Score Entry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{activeSubject} - {selectedClass}</h3>
            <p className="text-xs text-gray-500">{selectedTerm} • {selectedYear} • Class Score (max 50) + Exam Score (max 50) = Total (100)</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
            )}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Scores'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-10">#</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                <th className="text-center px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Class Score (50)</th>
                <th className="text-center px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Exam Score (50)</th>
                <th className="text-center px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Total</th>
                <th className="text-center px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Grade</th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No students in this class. Add students first.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const s = scores[student.id] || { classScore: 0, examScore: 0 };
                  const total = s.classScore + s.examScore;
                  const { grade, remark } = getGrade(total);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className="text-sm font-medium text-gray-800">{student.name}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <input
                          type="number"
                          value={s.classScore || ''}
                          onChange={e => updateScore(student.id, 'classScore', parseInt(e.target.value) || 0)}
                          className="w-full text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          min="0"
                          max="50"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <input
                          type="number"
                          value={s.examScore || ''}
                          onChange={e => updateScore(student.id, 'examScore', parseInt(e.target.value) || 0)}
                          className="w-full text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          min="0"
                          max="50"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-bold ${
                          total >= 80 ? 'bg-green-100 text-green-700' :
                          total >= 68 ? 'bg-blue-100 text-blue-700' :
                          total >= 54 ? 'bg-yellow-100 text-yellow-700' :
                          total >= 40 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {total}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-8 rounded-lg text-xs font-bold ${
                          grade === 'A' ? 'bg-green-100 text-green-700' :
                          grade === 'P' ? 'bg-blue-100 text-blue-700' :
                          grade === 'AP' ? 'bg-yellow-100 text-yellow-700' :
                          grade === 'D' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs text-gray-600">{remark}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
