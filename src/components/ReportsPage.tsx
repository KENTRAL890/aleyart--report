import { useState, useRef, useMemo } from 'react';
import { useData } from '../store/DataContext';
import {
  ALL_CLASSES, getSubjectsForClass, getAggregateGrade,
  TERMS, ACADEMIC_YEARS, CORE_SUBJECTS_JHS
} from '../types';
import type { TerminalReport } from '../types';
import { FileText, Printer, Save, ChevronDown, ChevronUp } from 'lucide-react';

export default function ReportsPage() {
  const { data, currentUser, saveTerminalReport, getClassAssessments } = useData();
  const isAdmin = currentUser?.role === 'admin';
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [expandedStudent, setExpandedStudent] = useState<string>('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextTermDate, setNextTermDate] = useState('');

  // Report fields per student
  const [reportFields, setReportFields] = useState<Record<string, {
    interest: string; conduct: string; classTeacherRemark: string; attendance: string;
  }>>({});

  const isJHS = parseInt(selectedClass.replace('Basic ', '')) >= 7;
  const subjects = getSubjectsForClass(selectedClass);
  const students = data.students.filter(s => s.className === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  const classAssessments = getClassAssessments(selectedClass, selectedTerm, selectedYear);

  // Calculate positions and totals for all students
  const studentResults = useMemo(() => {
    return students.map(student => {
      const studentAssessments = classAssessments.filter(a => a.studentId === student.id);
      const totalScore = studentAssessments.reduce((sum, a) => sum + a.total, 0);
      return { student, assessments: studentAssessments, totalScore };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [students, classAssessments]);

  // Assign positions
  const rankedResults = useMemo(() => {
    return studentResults.map((result, idx) => {
      let position = idx + 1;
      // Handle ties
      if (idx > 0 && result.totalScore === studentResults[idx - 1].totalScore) {
        // Find the first student with this score
        const firstIdx = studentResults.findIndex(r => r.totalScore === result.totalScore);
        position = firstIdx + 1;
      }
      return { ...result, position };
    });
  }, [studentResults]);

  // Subject positions
  const subjectPositions = useMemo(() => {
    const positions: Record<string, Record<string, number>> = {};
    subjects.forEach(subject => {
      const subjectScores = students.map(s => {
        const assessment = classAssessments.find(a => a.studentId === s.id && a.subject === subject);
        return { studentId: s.id, total: assessment?.total || 0 };
      }).sort((a, b) => b.total - a.total);

      subjectScores.forEach((item, idx) => {
        let pos = idx + 1;
        if (idx > 0 && item.total === subjectScores[idx - 1].total) {
          const firstIdx = subjectScores.findIndex(r => r.total === item.total);
          pos = firstIdx + 1;
        }
        if (!positions[item.studentId]) positions[item.studentId] = {};
        positions[item.studentId][subject] = pos;
      });
    });
    return positions;
  }, [students, classAssessments, subjects]);

  // Calculate aggregate for JHS students
  const calculateAggregate = (studentId: string) => {
    const studentAssessments = classAssessments.filter(a => a.studentId === studentId);

    // Core subjects grades
    const coreGrades = CORE_SUBJECTS_JHS.map(sub => {
      const assessment = studentAssessments.find(a => a.subject === sub);
      if (!assessment) return 9;
      return getAggregateGrade(assessment.total);
    });

    // Elective subjects (non-core) - pick best 2
    const electiveSubjects = subjects.filter(s => !CORE_SUBJECTS_JHS.includes(s));
    const electiveGrades = electiveSubjects.map(sub => {
      const assessment = studentAssessments.find(a => a.subject === sub);
      if (!assessment) return 9;
      return getAggregateGrade(assessment.total);
    }).sort((a, b) => a - b);

    const best2Electives = electiveGrades.slice(0, 2);
    const aggregate = coreGrades.reduce((sum, g) => sum + g, 0) + best2Electives.reduce((sum, g) => sum + g, 0);
    return aggregate;
  };

  const getReportFields = (studentId: string) => {
    return reportFields[studentId] || { interest: '', conduct: '', classTeacherRemark: '', attendance: '' };
  };

  const updateReportField = (studentId: string, field: string, value: string) => {
    setReportFields(prev => ({
      ...prev,
      [studentId]: { ...getReportFields(studentId), [field]: value },
    }));
  };

  const saveReport = async (studentId: string) => {
    const result = rankedResults.find(r => r.student.id === studentId);
    if (!result) return;

    const fields = getReportFields(studentId);
    const report: TerminalReport = {
      id: `report-${studentId}-${selectedTerm.replace(/\s/g, '_')}-${selectedYear}`,
      studentId,
      studentName: result.student.name,
      className: selectedClass,
      term: selectedTerm,
      academicYear: selectedYear,
      assessments: result.assessments,
      totalScore: result.totalScore,
      position: result.position,
      totalStudents: students.length,
      interest: fields.interest,
      conduct: fields.conduct,
      classTeacherRemark: fields.classTeacherRemark,
      attendance: fields.attendance,
      aggregate: isJHS ? calculateAggregate(studentId) : undefined,
      subjectPositions: subjectPositions[studentId] || {},
      createdAt: new Date().toISOString(),
    };
    await saveTerminalReport(report);
    alert('Report saved successfully!');
  };

  const saveAllReports = async () => {
    for (const result of rankedResults) {
      const fields = getReportFields(result.student.id);
      const report: TerminalReport = {
        id: `report-${result.student.id}-${selectedTerm.replace(/\s/g, '_')}-${selectedYear}`,
        studentId: result.student.id,
        studentName: result.student.name,
        className: selectedClass,
        term: selectedTerm,
        academicYear: selectedYear,
        assessments: result.assessments,
        totalScore: result.totalScore,
        position: result.position,
        totalStudents: students.length,
        interest: fields.interest,
        conduct: fields.conduct,
        classTeacherRemark: fields.classTeacherRemark,
        attendance: fields.attendance,
        aggregate: isJHS ? calculateAggregate(result.student.id) : undefined,
        subjectPositions: subjectPositions[result.student.id] || {},
        createdAt: new Date().toISOString(),
      };
      await saveTerminalReport(report);
    }
    alert('All reports saved!');
  };

  const printReport = (studentId: string) => {
    setSelectedStudent(studentId);
    setTimeout(() => {
      if (printRef.current) {
        const printContent = printRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Terminal Report - Aleyart Academy</title>
                <style>
                  @page { size: A4; margin: 10mm; }
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: 'Times New Roman', serif; font-size: 12px; }
                  .report-container { max-width: 210mm; margin: 0 auto; padding: 15px; }
                  .header { text-align: center; margin-bottom: 15px; }
                  .school-name { font-size: 24px; font-weight: bold; color: #1a365d; text-transform: uppercase; }
                  .school-motto { font-size: 11px; color: #666; font-style: italic; }
                  .school-info { font-size: 10px; color: #666; margin-top: 3px; }
                  .report-title { font-size: 16px; font-weight: bold; text-align: center; margin: 10px 0; padding: 6px; background: #1a365d; color: white; text-transform: uppercase; }
                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px; font-size: 12px; }
                  .info-item { display: flex; gap: 5px; }
                  .info-label { font-weight: bold; min-width: 120px; }
                  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
                  th, td { border: 1px solid #333; padding: 5px 8px; text-align: center; }
                  th { background: #1a365d; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                  td:first-child { text-align: left; }
                  .grade-section { margin-top: 10px; }
                  .grade-table { font-size: 9px; }
                  .grade-table th, .grade-table td { padding: 3px 5px; }
                  .remarks-section { margin-top: 10px; }
                  .remark-row { display: flex; margin: 5px 0; align-items: center; }
                  .remark-label { font-weight: bold; min-width: 160px; font-size: 11px; }
                  .remark-value { border-bottom: 1px dotted #333; flex: 1; padding: 2px 5px; font-size: 11px; min-height: 20px; }
                  .position-box { display: inline-block; background: #1a365d; color: white; padding: 3px 10px; font-weight: bold; border-radius: 3px; font-size: 13px; }
                  .signature-section { display: flex; justify-content: space-between; margin-top: 30px; }
                  .sig-line { width: 180px; border-top: 1px solid #000; padding-top: 5px; text-align: center; font-size: 10px; }
                  .aggregate-box { background: #f0f7ff; border: 2px solid #1a365d; padding: 10px; text-align: center; margin: 10px 0; border-radius: 5px; }
                  .aggregate-value { font-size: 24px; font-weight: bold; color: #1a365d; }
                  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
              </head>
              <body>${printContent}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    }, 100);
  };

  const selectedResult = rankedResults.find(r => r.student.id === selectedStudent);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {isAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Class</label>
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium">{currentUser?.assignedClass}</div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Term</label>
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Academic Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Report Date</label>
            <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Next Term Begins</label>
            <input type="date" value={nextTermDate} onChange={e => setNextTermDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveAllReports}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700">
            <Save className="w-4 h-4" />
            Save All Reports
          </button>
        </div>
      </div>

      {/* Class Position Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Class Rankings - {selectedClass}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{selectedTerm} • {selectedYear}</p>
        </div>

        <div className="divide-y divide-gray-100">
          {rankedResults.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No assessment data found. Enter assessments first.
            </div>
          ) : (
            rankedResults.map(result => {
              const fields = getReportFields(result.student.id);
              const isExpanded = expandedStudent === result.student.id;
              return (
                <div key={result.student.id}>
                  <div className="flex items-center px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedStudent(isExpanded ? '' : result.student.id)}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                        result.position <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {result.position}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{result.student.name}</p>
                        <p className="text-xs text-gray-500">Total: {result.totalScore} | Subjects: {result.assessments.length}/{subjects.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isJHS && (
                        <span className="hidden sm:inline-flex px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                          Aggregate: {calculateAggregate(result.student.id)}
                        </span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); printReport(result.student.id); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); saveReport(result.student.id); }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Save className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 bg-gray-50 border-t border-gray-100">
                      {/* Subject scores */}
                      <div className="overflow-x-auto mt-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-blue-900 text-white">
                              <th className="text-left px-3 py-2 text-xs">Subject</th>
                              <th className="text-center px-3 py-2 text-xs">Class Score</th>
                              <th className="text-center px-3 py-2 text-xs">Exam Score</th>
                              <th className="text-center px-3 py-2 text-xs">Total</th>
                              <th className="text-center px-3 py-2 text-xs">Position</th>
                              <th className="text-center px-3 py-2 text-xs">Grade</th>
                              <th className="text-left px-3 py-2 text-xs">Remark</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {subjects.map(subject => {
                              const assessment = result.assessments.find(a => a.subject === subject);
                              const pos = subjectPositions[result.student.id]?.[subject] || '—';
                              if (!assessment) {
                                return (
                                  <tr key={subject}>
                                    <td className="px-3 py-2 text-gray-700">{subject}</td>
                                    <td className="px-3 py-2 text-center text-gray-400">—</td>
                                    <td className="px-3 py-2 text-center text-gray-400">—</td>
                                    <td className="px-3 py-2 text-center text-gray-400">—</td>
                                    <td className="px-3 py-2 text-center text-gray-400">—</td>
                                    <td className="px-3 py-2 text-center text-gray-400">—</td>
                                    <td className="px-3 py-2 text-gray-400">—</td>
                                  </tr>
                                );
                              }
                              return (
                                <tr key={subject} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700 font-medium">{subject}</td>
                                  <td className="px-3 py-2 text-center">{assessment.classScore}</td>
                                  <td className="px-3 py-2 text-center">{assessment.examScore}</td>
                                  <td className="px-3 py-2 text-center font-bold">{assessment.total}</td>
                                  <td className="px-3 py-2 text-center">{pos}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                      assessment.grade === 'A' ? 'bg-green-100 text-green-700' :
                                      assessment.grade === 'P' ? 'bg-blue-100 text-blue-700' :
                                      assessment.grade === 'AP' ? 'bg-yellow-100 text-yellow-700' :
                                      assessment.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>{assessment.grade}</span>
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-600">{assessment.remark}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Report Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Student Interest</label>
                          <input type="text" value={fields.interest} onChange={e => updateReportField(result.student.id, 'interest', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Reading, Sports..." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Student Conduct</label>
                          <input type="text" value={fields.conduct} onChange={e => updateReportField(result.student.id, 'conduct', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Good, Excellent..." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Attendance</label>
                          <input type="text" value={fields.attendance} onChange={e => updateReportField(result.student.id, 'attendance', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., 85 out of 90 days" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class Teacher's Remark</label>
                          <input type="text" value={fields.classTeacherRemark} onChange={e => updateReportField(result.student.id, 'classTeacherRemark', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Hardworking student..." />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hidden Print Template */}
      {selectedStudent && selectedResult && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={printRef}>
            <div className="report-container">
              {/* Report Header */}
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a365d', textTransform: 'uppercase' }}>
                  ALEYART ACADEMY
                </div>
                <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                  "Excellence in Education"
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                  Odorkor-Official Town | P.O. Box 4183 | Tel: 0553797233
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0', padding: '6px', background: '#1a365d', color: 'white', textTransform: 'uppercase' }}>
                  TERMINAL REPORT CARD
                </div>
              </div>

              {/* Student Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Student Name:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{selectedResult.student.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Class:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{selectedClass}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Term:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{selectedTerm}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Academic Year:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{selectedYear}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Position:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{selectedResult.position}{getOrdinalSuffix(selectedResult.position)} out of {students.length}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Date:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{reportDate}</span>
                </div>
                {nextTermDate && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Next Term Begins:</span>
                    <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{nextTermDate}</span>
                  </div>
                )}
              </div>

              {/* Assessment Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase' }}>Subject</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'center', fontSize: '10px' }}>Class Score (50)</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'center', fontSize: '10px' }}>Exam Score (50)</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'center', fontSize: '10px' }}>Total (100)</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'center', fontSize: '10px' }}>Position</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'center', fontSize: '10px' }}>Grade</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'left', fontSize: '10px' }}>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => {
                    const assessment = selectedResult.assessments.find(a => a.subject === subject);
                    const pos = subjectPositions[selectedResult.student.id]?.[subject] || '—';
                    return (
                      <tr key={subject}>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left' }}>{subject}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'center' }}>{assessment?.classScore || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'center' }}>{assessment?.examScore || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>{assessment?.total || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'center' }}>{pos}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>{assessment?.grade || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left', fontSize: '10px' }}>{assessment?.remark || '—'}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                    <td style={{ border: '1px solid #333', padding: '5px 8px' }} colSpan={3}>TOTAL SCORE</td>
                    <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'center', fontSize: '14px' }}>{selectedResult.totalScore}</td>
                    <td style={{ border: '1px solid #333', padding: '5px 8px' }} colSpan={3}></td>
                  </tr>
                </tbody>
              </table>

              {/* Aggregate for JHS */}
              {isJHS && (
                <div style={{ background: '#f0f7ff', border: '2px solid #1a365d', padding: '10px', textAlign: 'center', margin: '10px 0', borderRadius: '5px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a365d' }}>AGGREGATE</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a365d' }}>{calculateAggregate(selectedStudent)}</div>
                  <div style={{ fontSize: '9px', color: '#666' }}>
                    (4 Core Subjects + Best 2 Electives)
                  </div>
                </div>
              )}

              {/* Grading Scale */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>GRADING SCALE:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #333', padding: '3px 5px', background: '#e5e7eb' }}>Grade</th>
                      <th style={{ border: '1px solid #333', padding: '3px 5px', background: '#e5e7eb' }}>Mark Range</th>
                      <th style={{ border: '1px solid #333', padding: '3px 5px', background: '#e5e7eb' }}>Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>A</td><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>80 - 100</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Advance</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>P</td><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>68 - 79</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Proficient</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>AP</td><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>54 - 67</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Approaching Proficiency</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>D</td><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>40 - 53</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Developing</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>B</td><td style={{ border: '1px solid #333', padding: '3px 5px', textAlign: 'center' }}>0 - 39</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Beginning</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks Section */}
              <div style={{ marginTop: '15px' }}>
                {(() => {
                  const fields = getReportFields(selectedStudent);
                  return (
                    <>
                      <div style={{ display: 'flex', margin: '8px 0', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Interest:</span>
                        <span style={{ borderBottom: '1px dotted #333', flex: 1, padding: '2px 5px', fontSize: '11px', minHeight: '20px' }}>{fields.interest}</span>
                      </div>
                      <div style={{ display: 'flex', margin: '8px 0', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Conduct:</span>
                        <span style={{ borderBottom: '1px dotted #333', flex: 1, padding: '2px 5px', fontSize: '11px', minHeight: '20px' }}>{fields.conduct}</span>
                      </div>
                      <div style={{ display: 'flex', margin: '8px 0', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Attendance:</span>
                        <span style={{ borderBottom: '1px dotted #333', flex: 1, padding: '2px 5px', fontSize: '11px', minHeight: '20px' }}>{fields.attendance}</span>
                      </div>
                      <div style={{ display: 'flex', margin: '8px 0', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Class Teacher's Remark:</span>
                        <span style={{ borderBottom: '1px dotted #333', flex: 1, padding: '2px 5px', fontSize: '11px', minHeight: '20px' }}>{fields.classTeacherRemark}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                <div style={{ width: '180px', borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'center', fontSize: '10px' }}>
                  Class Teacher's Signature
                </div>
                <div style={{ width: '180px', borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'center', fontSize: '10px' }}>
                  Head Teacher's Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
