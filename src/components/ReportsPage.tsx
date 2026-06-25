import { useState, useRef, useMemo } from 'react';
import { useData } from '../store/DataContext';
import {
  ALL_CLASSES, getSubjectsForClass, getAggregateGrade,
  TERMS, ACADEMIC_YEARS, CORE_SUBJECTS_JHS
} from '../types';
import type { TerminalReport } from '../types';
import { FileText, Printer, Save, ChevronDown, ChevronUp, Eye, X, Sparkles, Trophy, Star } from 'lucide-react';
import { getReportHTML, getPrintStyles } from './ReportPrintTemplate';

// Suggestions
const interestSuggestions = [
  'Reading and Writing', 'Mathematics', 'Science Experiments', 'Sports',
  'Music and Dance', 'Computer Studies', 'Drama', 'Drawing and Painting',
  'Leadership', 'Group Discussions',
];
const conductByScore = (avg: number) => {
  if (avg >= 80) return ['Excellent','Outstanding','Exemplary','Very Responsible','Highly Disciplined'];
  if (avg >= 68) return ['Very Good','Good','Responsible','Well-behaved','Respectful'];
  if (avg >= 54) return ['Good','Satisfactory','Cooperative','Improving','Fair'];
  if (avg >= 40) return ['Satisfactory','Needs Improvement','Fair','Average'];
  return ['Needs Improvement','Must Improve','Requires Attention'];
};
const remarkByScore = (avg: number) => {
  if (avg >= 80) return [
    'An outstanding student with excellent results. Keep it up!',
    'Exceptional performance! A role model to others.',
    'Brilliant work this term. Continue striving for excellence.',
  ];
  if (avg >= 68) return [
    'A very good performance. Keep up the good work!',
    'Good academic standing. Aim even higher next term.',
    'Commendable effort. You have great potential!',
  ];
  if (avg >= 54) return [
    'A fair performance. There is room for improvement.',
    'Average work. More dedication is needed next term.',
    'You can do better. Focus more on your studies.',
  ];
  if (avg >= 40) return [
    'Performance is below expectation. More effort is required.',
    'Needs significant improvement. Please work harder.',
    'Struggling academically. Extra support is recommended.',
  ];
  return [
    'Very poor performance. Urgent attention needed.',
    'Serious improvement required. Extra classes recommended.',
    'Requires intensive support and close monitoring.',
  ];
};

export default function ReportsPage() {
  const { data, currentUser, saveTerminalReport, getClassAssessments } = useData();
  const isAdmin = currentUser?.role === 'admin';
  const previewRef = useRef<HTMLDivElement>(null);

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [expandedStudent, setExpandedStudent] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextTermDate, setNextTermDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewStudent, setPreviewStudent] = useState('');

  const [reportFields, setReportFields] = useState<Record<string, {
    interest: string; conduct: string; classTeacherRemark: string; attendance: string;
  }>>({});

  const isJHS = parseInt(selectedClass.replace('Basic ', '')) >= 7;
  const subjects = getSubjectsForClass(selectedClass);
  const students = data.students.filter(s => s.className === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  const classAssessments = getClassAssessments(selectedClass, selectedTerm, selectedYear);

  const studentResults = useMemo(() => {
    return students.map(student => {
      const sa = classAssessments.filter(a => a.studentId === student.id);
      const totalScore = sa.reduce((s, a) => s + a.total, 0);
      const avgScore = sa.length > 0 ? totalScore / sa.length : 0;
      return { student, assessments: sa, totalScore, avgScore };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [students, classAssessments]);

  const rankedResults = useMemo(() => {
    return studentResults.map((r, idx) => {
      let position = idx + 1;
      if (idx > 0 && r.totalScore === studentResults[idx - 1].totalScore) {
        position = studentResults.findIndex(x => x.totalScore === r.totalScore) + 1;
      }
      return { ...r, position };
    });
  }, [studentResults]);

  const subjectPositions = useMemo(() => {
    const positions: Record<string, Record<string, number>> = {};
    subjects.forEach(subject => {
      const scores = students.map(s => ({
        id: s.id,
        total: classAssessments.find(a => a.studentId === s.id && a.subject === subject)?.total || 0,
      })).sort((a, b) => b.total - a.total);
      scores.forEach((item, idx) => {
        let pos = idx + 1;
        if (idx > 0 && item.total === scores[idx - 1].total) pos = scores.findIndex(x => x.total === item.total) + 1;
        if (!positions[item.id]) positions[item.id] = {};
        positions[item.id][subject] = pos;
      });
    });
    return positions;
  }, [students, classAssessments, subjects]);

  const calculateAggregate = (studentId: string) => {
    const sa = classAssessments.filter(a => a.studentId === studentId);
    const core = CORE_SUBJECTS_JHS.map(sub => {
      const a = sa.find(x => x.subject === sub);
      return a ? getAggregateGrade(a.total) : 9;
    });
    const elective = subjects.filter(s => !CORE_SUBJECTS_JHS.includes(s)).map(sub => {
      const a = sa.find(x => x.subject === sub);
      return a ? getAggregateGrade(a.total) : 9;
    }).sort((a, b) => a - b).slice(0, 2);
    return core.reduce((s, g) => s + g, 0) + elective.reduce((s, g) => s + g, 0);
  };

  const getFields = (id: string) => reportFields[id] || { interest: '', conduct: '', classTeacherRemark: '', attendance: '' };
  const setField = (id: string, field: string, value: string) => {
    setReportFields(prev => ({ ...prev, [id]: { ...getFields(id), [field]: value } }));
  };

  const saveReport = async (studentId: string) => {
    const r = rankedResults.find(x => x.student.id === studentId);
    if (!r) return;
    const f = getFields(studentId);
    const report: TerminalReport = {
      id: `report-${studentId}-${selectedTerm.replace(/\s/g, '_')}-${selectedYear}`,
      studentId, studentName: r.student.name, className: selectedClass,
      term: selectedTerm, academicYear: selectedYear, assessments: r.assessments,
      totalScore: r.totalScore, position: r.position, totalStudents: students.length,
      interest: f.interest, conduct: f.conduct, classTeacherRemark: f.classTeacherRemark,
      attendance: f.attendance,
      aggregate: isJHS ? calculateAggregate(studentId) : undefined,
      subjectPositions: subjectPositions[studentId] || {}, createdAt: new Date().toISOString(),
    };
    await saveTerminalReport(report);
    alert('Report saved!');
  };

  const saveAllReports = async () => {
    for (const r of rankedResults) {
      const f = getFields(r.student.id);
      await saveTerminalReport({
        id: `report-${r.student.id}-${selectedTerm.replace(/\s/g, '_')}-${selectedYear}`,
        studentId: r.student.id, studentName: r.student.name, className: selectedClass,
        term: selectedTerm, academicYear: selectedYear, assessments: r.assessments,
        totalScore: r.totalScore, position: r.position, totalStudents: students.length,
        interest: f.interest, conduct: f.conduct, classTeacherRemark: f.classTeacherRemark,
        attendance: f.attendance,
        aggregate: isJHS ? calculateAggregate(r.student.id) : undefined,
        subjectPositions: subjectPositions[r.student.id] || {}, createdAt: new Date().toISOString(),
      });
    }
    alert('All reports saved!');
  };

  const openPreview = (id: string) => { setPreviewStudent(id); setShowPreview(true); };

  const printReport = () => {
    const r = rankedResults.find(x => x.student.id === previewStudent);
    if (!r) return;
    const f = getFields(previewStudent);
    const html = getReportHTML({
      studentName: r.student.name, className: selectedClass,
      term: selectedTerm, academicYear: selectedYear,
      position: r.position, totalStudents: students.length, totalScore: r.totalScore,
      assessments: r.assessments, subjects, subjectPositions: subjectPositions[r.student.id] || {},
      interest: f.interest, conduct: f.conduct, attendance: f.attendance,
      classTeacherRemark: f.classTeacherRemark, reportDate, nextTermDate,
      isJHS, aggregate: isJHS ? calculateAggregate(previewStudent) : undefined,
    });
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<html><head><title>Report - ${r.student.name}</title><style>${getPrintStyles()}</style></head><body>${html}</body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const previewResult = rankedResults.find(x => x.student.id === previewStudent);
  const pf = previewStudent ? getFields(previewStudent) : { interest: '', conduct: '', classTeacherRemark: '', attendance: '' };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {isAdmin ? (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Class</label>
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium">{currentUser?.assignedClass}</div>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Term</label>
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Academic Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Report Date</label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Next Term</label>
            <input type="date" value={nextTermDate} onChange={e => setNextTermDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveAllReports}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
            <Save className="w-4 h-4" /> Save All Reports
          </button>
        </div>
      </div>

      {/* Rankings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Terminal Reports — {selectedClass}</h3>
              <p className="text-xs text-gray-500">{selectedTerm} • {selectedYear} • {students.length} Student{students.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {rankedResults.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 font-medium">No assessment data found</p>
              <p className="text-gray-300 text-sm mt-1">Enter assessments first, then come back here.</p>
            </div>
          ) : rankedResults.map(result => {
            const fields = getFields(result.student.id);
            const isOpen = expandedStudent === result.student.id;
            const conducts = conductByScore(result.avgScore);
            const remarks = remarkByScore(result.avgScore);
            return (
              <div key={result.student.id}>
                {/* Row */}
                <div
                  className={`flex items-center px-4 sm:px-6 py-4 cursor-pointer transition-all ${isOpen ? 'bg-blue-50/60' : 'hover:bg-gray-50/80'}`}
                  onClick={() => setExpandedStudent(isOpen ? '' : result.student.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Position Badge */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0 ${
                      result.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 ring-2 ring-yellow-300' :
                      result.position === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                      result.position === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-500' :
                      'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {result.position === 1 && <Trophy className="w-5 h-5" />}
                      {result.position === 2 && <Star className="w-5 h-5" />}
                      {result.position === 3 && <Star className="w-4 h-4" />}
                      {result.position > 3 && result.position}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{result.student.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium">Total: {result.totalScore}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md">{result.assessments.length}/{subjects.length} subjects</span>
                        {isJHS && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-medium">Agg: {calculateAggregate(result.student.id)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); openPreview(result.student.id); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors">
                      <Eye className="w-4 h-4" /><span className="hidden sm:inline">Preview</span>
                    </button>
                    <button onClick={e => { e.stopPropagation(); saveReport(result.student.id); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors">
                      <Save className="w-4 h-4" /><span className="hidden sm:inline">Save</span>
                    </button>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-4 sm:px-6 pb-6 bg-gradient-to-b from-blue-50/50 to-white border-t border-blue-100">
                    {/* Score table */}
                    <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200 shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                            <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider">Subject</th>
                            <th className="text-center px-2 py-3 text-[10px] font-semibold uppercase">Class (50)</th>
                            <th className="text-center px-2 py-3 text-[10px] font-semibold uppercase">Exam (50)</th>
                            <th className="text-center px-2 py-3 text-[10px] font-semibold uppercase">Total</th>
                            <th className="text-center px-2 py-3 text-[10px] font-semibold uppercase">Pos</th>
                            <th className="text-center px-2 py-3 text-[10px] font-semibold uppercase">Grade</th>
                            <th className="text-left px-3 py-3 text-[10px] font-semibold uppercase">Remark</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {subjects.map((sub, i) => {
                            const a = result.assessments.find(x => x.subject === sub);
                            const p = subjectPositions[result.student.id]?.[sub] || '—';
                            return (
                              <tr key={sub} className={i % 2 ? 'bg-gray-50/50' : ''}>
                                <td className="px-4 py-2.5 text-gray-700 font-medium text-xs">{sub}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600 text-xs">{a?.classScore ?? '—'}</td>
                                <td className="px-2 py-2.5 text-center text-gray-600 text-xs">{a?.examScore ?? '—'}</td>
                                <td className="px-2 py-2.5 text-center font-bold text-gray-800 text-sm">{a?.total ?? '—'}</td>
                                <td className="px-2 py-2.5 text-center"><span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">{p}</span></td>
                                <td className="px-2 py-2.5 text-center">
                                  {a && <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                    a.grade==='A'?'bg-green-100 text-green-700': a.grade==='P'?'bg-blue-100 text-blue-700':
                                    a.grade==='AP'?'bg-yellow-100 text-yellow-700': a.grade==='D'?'bg-orange-100 text-orange-700':
                                    'bg-red-100 text-red-700'
                                  }`}>{a.grade}</span>}
                                </td>
                                <td className="px-3 py-2.5 text-[10px] text-gray-500">{a?.remark || '—'}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-gradient-to-r from-slate-100 to-slate-50 font-bold">
                            <td className="px-4 py-3 text-slate-700" colSpan={3}>TOTAL SCORE</td>
                            <td className="px-2 py-3 text-center text-lg text-blue-700">{result.totalScore}</td>
                            <td colSpan={3}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Fields with suggestions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                      {/* Interest */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Student Interest
                        </label>
                        <input type="text" value={fields.interest} onChange={e => setField(result.student.id, 'interest', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                          placeholder="Type or pick below..." />
                        <div className="flex flex-wrap gap-1.5">
                          {interestSuggestions.slice(0,6).map(s => (
                            <button key={s} onClick={() => setField(result.student.id, 'interest', s)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${fields.interest===s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Conduct */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Student Conduct
                        </label>
                        <input type="text" value={fields.conduct} onChange={e => setField(result.student.id, 'conduct', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                          placeholder="Type or pick below..." />
                        <div className="flex flex-wrap gap-1.5">
                          {conducts.map(s => (
                            <button key={s} onClick={() => setField(result.student.id, 'conduct', s)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${fields.conduct===s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Attendance */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Attendance</label>
                        <input type="text" value={fields.attendance} onChange={e => setField(result.student.id, 'attendance', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. 85 out of 90 days" />
                      </div>
                      {/* Remark */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Class Teacher's Remark
                        </label>
                        <textarea value={fields.classTeacherRemark} onChange={e => setField(result.student.id, 'classTeacherRemark', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-2"
                          placeholder="Type or pick below..." rows={2} />
                        <div className="flex flex-col gap-1.5">
                          {remarks.map((s, i) => (
                            <button key={i} onClick={() => setField(result.student.id, 'classTeacherRemark', s)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-left transition-colors ${fields.classTeacherRemark===s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ PREVIEW MODAL ============ */}
      {showPreview && previewResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[860px] overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 z-10">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Preview — {previewResult.student.name}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={printReport}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-800 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors">
                    <Printer className="w-4 h-4" /> Print A4
                  </button>
                  <button onClick={() => setShowPreview(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* A4 Preview */}
              <div className="p-4 sm:p-8 bg-gray-200">
                <div ref={previewRef} className="bg-white shadow-xl mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm', padding: '14mm 16mm', position: 'relative', overflow: 'hidden' }}>
                  {/* Top gradient bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-purple-600" />

                  {/* Header */}
                  <div className="text-center pb-4 border-b-4 border-double border-blue-900 mb-4">
                    <div className="flex items-center justify-center gap-3 mb-1">
                      <div className="w-14 h-14 rounded-full border-2 border-blue-900 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex-shrink-0">
                        <img src="/images/logo.png" alt="" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                        <span className="text-[7px] font-bold text-blue-900 text-center leading-tight">ALEYART<br/>ACADEMY</span>
                      </div>
                      <div>
                        <h1 className="text-[26px] font-bold text-blue-900 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>ALEYART ACADEMY</h1>
                        <p className="text-[13px] text-slate-500 italic tracking-wide">"Seeking Wisdom"</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">📍 Odorkor-Official Town &nbsp;|&nbsp; 📮 P.O. Box 4183 &nbsp;|&nbsp; 📞 0553797233</p>
                  </div>

                  {/* Title pill */}
                  <div className="text-center my-3">
                    <span className="inline-block px-6 py-1.5 bg-gradient-to-r from-blue-900 to-indigo-800 text-white text-[13px] font-bold uppercase tracking-widest rounded-full shadow-md">
                      ✦ &nbsp;Terminal Report Card&nbsp; ✦
                    </span>
                  </div>

                  {/* Student info */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-[11px]">
                    <div className="flex"><span className="font-bold text-slate-500 w-[110px] flex-shrink-0">Student Name:</span><span className="font-semibold text-slate-800 border-b border-dotted border-slate-300 flex-1 pb-0.5">{previewResult.student.name}</span></div>
                    <div className="flex"><span className="font-bold text-slate-500 w-[110px] flex-shrink-0">Class:</span><span className="text-slate-800 border-b border-dotted border-slate-300 flex-1 pb-0.5">{selectedClass}</span></div>
                    <div className="flex"><span className="font-bold text-slate-500 w-[110px] flex-shrink-0">Term:</span><span className="text-slate-800 border-b border-dotted border-slate-300 flex-1 pb-0.5">{selectedTerm}</span></div>
                    <div className="flex"><span className="font-bold text-slate-500 w-[110px] flex-shrink-0">Academic Year:</span><span className="text-slate-800 border-b border-dotted border-slate-300 flex-1 pb-0.5">{selectedYear}</span></div>
                    <div className="flex items-center"><span className="font-bold text-slate-500 w-[110px] flex-shrink-0">Position:</span><span className="flex-1"><span className="inline-block px-3 py-0.5 bg-blue-900 text-white text-[10px] font-bold rounded-full">{getOrd(previewResult.position)}</span> <span className="text-slate-500 text-[10px]">out of {students.length}</span></span></div>
                    <div className="flex"><span className="font-bold text-slate-500 w-[110px] flex-shrink-0">Date:</span><span className="text-slate-800 border-b border-dotted border-slate-300 flex-1 pb-0.5">{reportDate}</span></div>
                  </div>

                  {/* Assessment table */}
                  <table className="w-full border-collapse text-[11px] mb-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white">
                        <th className="py-2 px-2 text-left text-[9px] font-semibold uppercase tracking-wide border border-blue-800">Subject</th>
                        <th className="py-2 px-1 text-center text-[9px] font-semibold uppercase border border-blue-800">Class<br/>Score (50)</th>
                        <th className="py-2 px-1 text-center text-[9px] font-semibold uppercase border border-blue-800">Exam<br/>Score (50)</th>
                        <th className="py-2 px-1 text-center text-[9px] font-semibold uppercase border border-blue-800">Total<br/>(100)</th>
                        <th className="py-2 px-1 text-center text-[9px] font-semibold uppercase border border-blue-800">Pos.</th>
                        <th className="py-2 px-1 text-center text-[9px] font-semibold uppercase border border-blue-800">Grade</th>
                        <th className="py-2 px-2 text-left text-[9px] font-semibold uppercase border border-blue-800">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, i) => {
                        const a = previewResult.assessments.find(x => x.subject === sub);
                        const p = subjectPositions[previewResult.student.id]?.[sub] || '—';
                        return (
                          <tr key={sub} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="py-1.5 px-2 border border-slate-300 font-medium">{sub}</td>
                            <td className="py-1.5 px-1 border border-slate-300 text-center">{a?.classScore ?? '—'}</td>
                            <td className="py-1.5 px-1 border border-slate-300 text-center">{a?.examScore ?? '—'}</td>
                            <td className="py-1.5 px-1 border border-slate-300 text-center font-bold text-[12px]">{a?.total ?? '—'}</td>
                            <td className="py-1.5 px-1 border border-slate-300 text-center text-[10px]">{p}</td>
                            <td className={`py-1.5 px-1 border border-slate-300 text-center font-bold text-[10px] ${
                              a?.grade==='A'?'bg-green-100 text-green-700':a?.grade==='P'?'bg-blue-100 text-blue-700':
                              a?.grade==='AP'?'bg-yellow-100 text-yellow-700':a?.grade==='D'?'bg-orange-100 text-orange-700':
                              a?.grade==='B'?'bg-red-100 text-red-700':''
                            }`}>{a?.grade ?? '—'}</td>
                            <td className="py-1.5 px-2 border border-slate-300 text-[9px] text-slate-500">{a?.remark ?? '—'}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gradient-to-r from-slate-100 to-blue-50 font-bold">
                        <td className="py-2 px-2 border border-slate-400 text-blue-900" colSpan={3}>TOTAL SCORE</td>
                        <td className="py-2 px-1 border border-slate-400 text-center text-[16px] text-blue-900">{previewResult.totalScore}</td>
                        <td className="py-2 border border-slate-400" colSpan={3}></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Aggregate */}
                  {isJHS && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-800 rounded-xl p-3 text-center mb-3">
                      <p className="text-[9px] font-bold text-indigo-800 uppercase tracking-widest">Aggregate Score</p>
                      <p className="text-[32px] font-black text-indigo-900 leading-none my-1" style={{ fontFamily: 'Georgia, serif' }}>{calculateAggregate(previewStudent)}</p>
                      <p className="text-[8px] text-indigo-500 italic">(4 Core Subjects + Best 2 Electives)</p>
                    </div>
                  )}

                  {/* Grading scale */}
                  <div className="mb-3">
                    <p className="text-[9px] font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span className="w-3 h-0.5 bg-blue-900 inline-block" /> Grading Scale <span className="flex-1 h-px bg-slate-200" />
                    </p>
                    <div className="grid grid-cols-5 gap-0 text-[8px] border border-slate-300 rounded overflow-hidden">
                      {[
                        { g: 'A', r: '80-100', d: 'Advance', c: 'bg-green-50 text-green-800' },
                        { g: 'P', r: '68-79', d: 'Proficient', c: 'bg-blue-50 text-blue-800' },
                        { g: 'AP', r: '54-67', d: 'Appr. Prof.', c: 'bg-yellow-50 text-yellow-800' },
                        { g: 'D', r: '40-53', d: 'Developing', c: 'bg-orange-50 text-orange-800' },
                        { g: 'B', r: '0-39', d: 'Beginning', c: 'bg-red-50 text-red-800' },
                      ].map(x => (
                        <div key={x.g} className={`${x.c} text-center py-1.5 border-r border-slate-200 last:border-r-0`}>
                          <div className="font-bold text-[11px]">{x.g}</div>
                          <div className="text-[7px] opacity-80">{x.r}</div>
                          <div className="text-[7px] font-medium">{x.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teacher's assessment */}
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 mb-3">
                    <p className="text-[9px] font-bold text-blue-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 flex items-center gap-2">
                      <span className="w-3 h-0.5 bg-blue-900 inline-block" /> Teacher's Assessment
                    </p>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex"><span className="font-semibold text-slate-500 w-[145px] flex-shrink-0">Interest:</span><span className="border-b border-dotted border-slate-300 flex-1 min-h-[16px] text-slate-800">{pf.interest}</span></div>
                      <div className="flex"><span className="font-semibold text-slate-500 w-[145px] flex-shrink-0">Conduct:</span><span className="border-b border-dotted border-slate-300 flex-1 min-h-[16px] text-slate-800">{pf.conduct}</span></div>
                      <div className="flex"><span className="font-semibold text-slate-500 w-[145px] flex-shrink-0">Attendance:</span><span className="border-b border-dotted border-slate-300 flex-1 min-h-[16px] text-slate-800">{pf.attendance}</span></div>
                      <div className="flex"><span className="font-semibold text-slate-500 w-[145px] flex-shrink-0">Teacher's Remark:</span><span className="border-b border-dotted border-slate-300 flex-1 min-h-[16px] text-slate-800">{pf.classTeacherRemark}</span></div>
                    </div>
                    {nextTermDate && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200 text-[11px]">
                        <span className="font-semibold text-slate-500">Next Term Begins:</span> <span className="text-slate-800">{nextTermDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-8 px-2">
                    <div className="text-center w-40"><div className="border-t-2 border-slate-800 mt-8 pt-1"><p className="text-[9px] text-slate-500">Class Teacher's Signature</p></div></div>
                    <div className="text-center w-40"><div className="border-t-2 border-slate-800 mt-8 pt-1"><p className="text-[9px] text-slate-500">Head Teacher's Signature</p></div></div>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-5 pt-2 border-t border-slate-200">
                    <p className="text-[8px] text-slate-400 tracking-wide">This is an official report from Aleyart Academy • "Seeking Wisdom"</p>
                  </div>

                  {/* Bottom gradient bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getOrd(n: number): string {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10]||s[v]||s[0]);
}
