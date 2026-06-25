import { useState, useRef, useMemo } from 'react';
import { useData } from '../store/DataContext';
import {
  ALL_CLASSES, getSubjectsForClass, getAggregateGrade,
  TERMS, ACADEMIC_YEARS, CORE_SUBJECTS_JHS
} from '../types';
import type { TerminalReport } from '../types';
import { FileText, Printer, Save, ChevronDown, ChevronUp, Eye, X, Sparkles } from 'lucide-react';

// Suggestions based on performance
const getInterestSuggestions = () => [
  'Reading and Writing',
  'Mathematics and Problem Solving',
  'Science and Experiments',
  'Sports and Physical Activities',
  'Music and Creative Arts',
  'Computer and Technology',
  'Drama and Public Speaking',
  'Drawing and Painting',
  'Leadership Activities',
  'Group Discussions',
];

const getConductSuggestions = (avgScore: number) => {
  if (avgScore >= 80) return ['Excellent', 'Outstanding', 'Exemplary', 'Very Responsible', 'Highly Disciplined'];
  if (avgScore >= 68) return ['Very Good', 'Good', 'Responsible', 'Well-behaved', 'Respectful'];
  if (avgScore >= 54) return ['Good', 'Satisfactory', 'Fair', 'Cooperative', 'Improving'];
  if (avgScore >= 40) return ['Satisfactory', 'Needs Improvement', 'Fair', 'Average', 'Could be better'];
  return ['Needs Improvement', 'Must Improve', 'Requires Attention', 'Below Expectation'];
};

const getRemarkSuggestions = (avgScore: number, _position: number, _totalStudents: number) => {
  if (avgScore >= 80) {
    return [
      'An outstanding student with excellent academic performance. Keep it up!',
      'Exceptional performance! A role model to other students.',
      'Brilliant work this term. Continue to strive for excellence.',
      'A hardworking and dedicated student. Excellent results!',
      'Outstanding achievement! Your hard work has paid off.',
    ];
  }
  if (avgScore >= 68) {
    return [
      'A very good performance. Keep up the good work!',
      'Good academic standing. With more effort, you can reach the top.',
      'Commendable effort this term. Continue to work hard.',
      'A promising student with great potential. Stay focused!',
      'Very good results. Aim higher next term!',
    ];
  }
  if (avgScore >= 54) {
    return [
      'A fair performance. There is room for improvement.',
      'Satisfactory work. More dedication is needed.',
      'Average performance. Put in more effort next term.',
      'You can do better. Focus more on your studies.',
      'Needs to pay more attention in class. Keep trying!',
    ];
  }
  if (avgScore >= 40) {
    return [
      'Performance is below expectation. More effort is required.',
      'Needs significant improvement. Please work harder.',
      'Must put in extra effort to improve grades.',
      'Struggling academically. Extra support is recommended.',
      'Below average performance. Seek help from teachers.',
    ];
  }
  return [
    'Performance is very poor. Urgent attention needed.',
    'Serious improvement required. Extra classes recommended.',
    'Must work much harder. Parent-teacher meeting advised.',
    'Academic performance is concerning. Needs immediate support.',
    'Requires intensive support and close monitoring.',
  ];
};

export default function ReportsPage() {
  const { data, currentUser, saveTerminalReport, getClassAssessments } = useData();
  const isAdmin = currentUser?.role === 'admin';
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [expandedStudent, setExpandedStudent] = useState<string>('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextTermDate, setNextTermDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewStudent, setPreviewStudent] = useState<string>('');

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
      const avgScore = studentAssessments.length > 0 ? totalScore / studentAssessments.length : 0;
      return { student, assessments: studentAssessments, totalScore, avgScore };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [students, classAssessments]);

  // Assign positions
  const rankedResults = useMemo(() => {
    return studentResults.map((result, idx) => {
      let position = idx + 1;
      if (idx > 0 && result.totalScore === studentResults[idx - 1].totalScore) {
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
    const coreGrades = CORE_SUBJECTS_JHS.map(sub => {
      const assessment = studentAssessments.find(a => a.subject === sub);
      if (!assessment) return 9;
      return getAggregateGrade(assessment.total);
    });
    const electiveSubjects = subjects.filter(s => !CORE_SUBJECTS_JHS.includes(s));
    const electiveGrades = electiveSubjects.map(sub => {
      const assessment = studentAssessments.find(a => a.subject === sub);
      if (!assessment) return 9;
      return getAggregateGrade(assessment.total);
    }).sort((a, b) => a - b);
    const best2Electives = electiveGrades.slice(0, 2);
    return coreGrades.reduce((sum, g) => sum + g, 0) + best2Electives.reduce((sum, g) => sum + g, 0);
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

  const openPreview = (studentId: string) => {
    setPreviewStudent(studentId);
    setShowPreview(true);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Terminal Report - Aleyart Academy</title>
              <style>
                @page { size: A4; margin: 8mm; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Times New Roman', Georgia, serif; font-size: 11px; line-height: 1.4; color: #1a1a1a; }
                .report-page { width: 210mm; min-height: 297mm; padding: 12mm; margin: 0 auto; background: white; }
                .header { text-align: center; padding-bottom: 12px; border-bottom: 3px double #1a365d; margin-bottom: 12px; }
                .logo-section { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 8px; }
                .school-crest { width: 70px; height: 70px; border: 2px solid #1a365d; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #1a365d; background: linear-gradient(135deg, #f0f7ff 0%, #e0edff 100%); }
                .school-name { font-size: 28px; font-weight: bold; color: #1a365d; text-transform: uppercase; letter-spacing: 2px; }
                .school-motto { font-size: 13px; color: #4a5568; font-style: italic; margin: 4px 0; }
                .school-info { font-size: 11px; color: #666; }
                .report-title { font-size: 16px; font-weight: bold; text-align: center; margin: 12px 0; padding: 8px 20px; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
                .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
                .info-row { display: flex; align-items: center; }
                .info-label { font-weight: bold; min-width: 130px; color: #4a5568; font-size: 11px; }
                .info-value { color: #1a202c; font-size: 11px; border-bottom: 1px dotted #cbd5e0; flex: 1; padding-bottom: 2px; }
                .position-badge { display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 3px 12px; border-radius: 15px; font-weight: bold; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
                th { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 8px 6px; text-align: center; font-weight: bold; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
                th:first-child { text-align: left; border-radius: 4px 0 0 0; }
                th:last-child { border-radius: 0 4px 0 0; }
                td { border: 1px solid #cbd5e0; padding: 6px; text-align: center; }
                td:first-child { text-align: left; font-weight: 500; }
                tr:nth-child(even) { background: #f8fafc; }
                tr:hover { background: #edf2f7; }
                .total-row { background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%) !important; font-weight: bold; }
                .total-row td { border-top: 2px solid #1a365d; font-size: 12px; }
                .grade-A { background: #c6f6d5 !important; color: #22543d; font-weight: bold; }
                .grade-P { background: #bee3f8 !important; color: #2a4365; font-weight: bold; }
                .grade-AP { background: #fefcbf !important; color: #744210; font-weight: bold; }
                .grade-D { background: #fed7aa !important; color: #7b341e; font-weight: bold; }
                .grade-B { background: #fed7d7 !important; color: #822727; font-weight: bold; }
                .aggregate-box { background: linear-gradient(135deg, #ebf4ff 0%, #c3dafe 100%); border: 2px solid #1a365d; padding: 12px; text-align: center; margin: 12px 0; border-radius: 8px; }
                .aggregate-label { font-size: 11px; font-weight: bold; color: #1a365d; text-transform: uppercase; letter-spacing: 1px; }
                .aggregate-value { font-size: 32px; font-weight: bold; color: #1a365d; margin: 4px 0; }
                .aggregate-note { font-size: 9px; color: #4a5568; font-style: italic; }
                .grading-scale { margin: 10px 0; }
                .grading-scale h4 { font-size: 10px; font-weight: bold; color: #1a365d; margin-bottom: 6px; text-transform: uppercase; }
                .grading-scale table { font-size: 9px; }
                .grading-scale th { padding: 4px 6px; font-size: 8px; }
                .grading-scale td { padding: 3px 6px; }
                .remarks-section { margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
                .remarks-section h4 { font-size: 11px; font-weight: bold; color: #1a365d; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                .remark-row { display: flex; margin: 8px 0; align-items: flex-start; }
                .remark-label { font-weight: bold; min-width: 160px; color: #4a5568; font-size: 10px; }
                .remark-value { border-bottom: 1px dotted #718096; flex: 1; min-height: 18px; color: #1a202c; font-size: 10px; padding: 2px 4px; }
                .signatures { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; }
                .sig-block { width: 180px; text-align: center; }
                .sig-line { border-top: 1px solid #1a202c; margin-bottom: 4px; }
                .sig-label { font-size: 10px; color: #4a5568; }
                .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #718096; }
                @media print { 
                  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  .report-page { padding: 10mm; }
                }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
      }
    }
  };

  const previewResult = rankedResults.find(r => r.student.id === previewStudent);
  const previewFields = previewStudent ? getReportFields(previewStudent) : { interest: '', conduct: '', classTeacherRemark: '', attendance: '' };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
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
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
            <Save className="w-4 h-4" />
            Save All Reports
          </button>
        </div>
      </div>

      {/* Class Position Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Terminal Reports - {selectedClass}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{selectedTerm} • {selectedYear} • {students.length} Students</p>
        </div>

        <div className="divide-y divide-gray-100">
          {rankedResults.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p>No assessment data found. Enter assessments first.</p>
            </div>
          ) : (
            rankedResults.map(result => {
              const fields = getReportFields(result.student.id);
              const isExpanded = expandedStudent === result.student.id;
              const conductSuggestions = getConductSuggestions(result.avgScore);
              const remarkSuggestions = getRemarkSuggestions(result.avgScore, result.position, students.length);
              
              return (
                <div key={result.student.id} className="bg-white">
                  {/* Student Row */}
                  <div 
                    className={`flex items-center px-4 sm:px-6 py-4 cursor-pointer transition-all hover:bg-gray-50 ${isExpanded ? 'bg-blue-50' : ''}`}
                    onClick={() => setExpandedStudent(isExpanded ? '' : result.student.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        result.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                        result.position === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                        result.position === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                        'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {result.position}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{result.student.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>Total: <strong className="text-gray-700">{result.totalScore}</strong></span>
                          <span>•</span>
                          <span>Subjects: {result.assessments.length}/{subjects.length}</span>
                          {isJHS && (
                            <>
                              <span>•</span>
                              <span className="text-purple-600 font-medium">Aggregate: {calculateAggregate(result.student.id)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openPreview(result.student.id); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); saveReport(result.student.id); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 bg-gradient-to-b from-blue-50 to-white border-t border-blue-100">
                      {/* Subject scores table */}
                      <div className="overflow-x-auto mt-4 rounded-xl border border-gray-200 shadow-sm">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white">
                              <th className="text-left px-4 py-3 text-xs font-semibold">Subject</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold">Class (50)</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold">Exam (50)</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold">Total</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold">Position</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold">Grade</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold">Remark</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {subjects.map((subject, idx) => {
                              const assessment = result.assessments.find(a => a.subject === subject);
                              const pos = subjectPositions[result.student.id]?.[subject] || '—';
                              return (
                                <tr key={subject} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-2.5 text-gray-700 font-medium">{subject}</td>
                                  <td className="px-3 py-2.5 text-center text-gray-600">{assessment?.classScore ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center text-gray-600">{assessment?.examScore ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center font-bold text-gray-800">{assessment?.total ?? '—'}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                      {pos}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {assessment && (
                                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        assessment.grade === 'A' ? 'bg-green-100 text-green-700' :
                                        assessment.grade === 'P' ? 'bg-blue-100 text-blue-700' :
                                        assessment.grade === 'AP' ? 'bg-yellow-100 text-yellow-700' :
                                        assessment.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>{assessment.grade}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-gray-500">{assessment?.remark || '—'}</td>
                                </tr>
                              );
                            })}
                            <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold">
                              <td className="px-4 py-3" colSpan={3}>TOTAL SCORE</td>
                              <td className="px-3 py-3 text-center text-lg text-blue-700">{result.totalScore}</td>
                              <td className="px-3 py-3" colSpan={3}></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Report Fields with Suggestions */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                        {/* Interest */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase mb-2">
                            Student Interest
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                          </label>
                          <input 
                            type="text" 
                            value={fields.interest} 
                            onChange={e => updateReportField(result.student.id, 'interest', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                            placeholder="Enter or select below..." 
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {getInterestSuggestions().slice(0, 5).map(suggestion => (
                              <button
                                key={suggestion}
                                onClick={() => updateReportField(result.student.id, 'interest', suggestion)}
                                className="px-2 py-1 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded text-xs transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Conduct */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase mb-2">
                            Student Conduct
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                          </label>
                          <input 
                            type="text" 
                            value={fields.conduct} 
                            onChange={e => updateReportField(result.student.id, 'conduct', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                            placeholder="Enter or select below..." 
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {conductSuggestions.map(suggestion => (
                              <button
                                key={suggestion}
                                onClick={() => updateReportField(result.student.id, 'conduct', suggestion)}
                                className="px-2 py-1 bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 rounded text-xs transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Attendance */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">Attendance</label>
                          <input 
                            type="text" 
                            value={fields.attendance} 
                            onChange={e => updateReportField(result.student.id, 'attendance', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., 85 out of 90 days" 
                          />
                        </div>

                        {/* Class Teacher Remark */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase mb-2">
                            Class Teacher's Remark
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                          </label>
                          <textarea 
                            value={fields.classTeacherRemark} 
                            onChange={e => updateReportField(result.student.id, 'classTeacherRemark', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2 resize-none"
                            placeholder="Enter or select below..."
                            rows={2}
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {remarkSuggestions.slice(0, 3).map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => updateReportField(result.student.id, 'classTeacherRemark', suggestion)}
                                className="px-2 py-1 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded text-xs transition-colors text-left"
                              >
                                {suggestion.length > 50 ? suggestion.slice(0, 50) + '...' : suggestion}
                              </button>
                            ))}
                          </div>
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

      {/* Preview Modal */}
      {showPreview && previewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Report Preview - {previewResult.student.name}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button onClick={() => setShowPreview(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100">
              <div ref={printRef}>
                <div className="report-page bg-white rounded-xl shadow-lg p-6 sm:p-8 mx-auto" style={{ maxWidth: '210mm' }}>
                  {/* Header */}
                  <div className="header text-center pb-4 border-b-4 border-double border-blue-800 mb-4">
                    <div className="flex items-center justify-center gap-4 mb-2">
                      <div className="w-16 h-16 rounded-full border-2 border-blue-800 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                        <img src="/images/logo.png" alt="Logo" className="w-12 h-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 tracking-wide">ALEYART ACADEMY</h1>
                        <p className="text-sm text-gray-600 italic mt-1">"Seeking Wisdom"</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Odorkor-Official Town | P.O. Box 4183 | Tel: 0553797233</p>
                  </div>

                  {/* Report Title */}
                  <div className="text-center my-4">
                    <h2 className="inline-block px-8 py-2 bg-gradient-to-r from-blue-800 to-indigo-800 text-white text-sm font-bold uppercase tracking-wider rounded-lg shadow-md">
                      Terminal Report Card
                    </h2>
                  </div>

                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4 text-sm">
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Student Name:</span><span className="border-b border-dotted border-gray-400 flex-1">{previewResult.student.name}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Class:</span><span className="border-b border-dotted border-gray-400 flex-1">{selectedClass}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Term:</span><span className="border-b border-dotted border-gray-400 flex-1">{selectedTerm}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Academic Year:</span><span className="border-b border-dotted border-gray-400 flex-1">{selectedYear}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Position:</span><span className="border-b border-dotted border-gray-400 flex-1"><span className="px-3 py-0.5 bg-blue-800 text-white text-xs font-bold rounded-full">{previewResult.position}{getOrdinalSuffix(previewResult.position)}</span> out of {students.length}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Date:</span><span className="border-b border-dotted border-gray-400 flex-1">{reportDate}</span></div>
                  </div>

                  {/* Assessment Table */}
                  <table className="w-full border-collapse text-xs mb-4">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white">
                        <th className="py-2 px-2 text-left font-semibold border border-blue-900">Subject</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Class Score (50)</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Exam Score (50)</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Total (100)</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Position</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Grade</th>
                        <th className="py-2 px-2 text-left font-semibold border border-blue-900">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject, idx) => {
                        const assessment = previewResult.assessments.find(a => a.subject === subject);
                        const pos = subjectPositions[previewResult.student.id]?.[subject] || '—';
                        return (
                          <tr key={subject} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-1.5 px-2 border border-gray-300 font-medium">{subject}</td>
                            <td className="py-1.5 px-2 border border-gray-300 text-center">{assessment?.classScore ?? '—'}</td>
                            <td className="py-1.5 px-2 border border-gray-300 text-center">{assessment?.examScore ?? '—'}</td>
                            <td className="py-1.5 px-2 border border-gray-300 text-center font-bold">{assessment?.total ?? '—'}</td>
                            <td className="py-1.5 px-2 border border-gray-300 text-center">{pos}</td>
                            <td className={`py-1.5 px-2 border border-gray-300 text-center font-bold ${
                              assessment?.grade === 'A' ? 'bg-green-100 text-green-700' :
                              assessment?.grade === 'P' ? 'bg-blue-100 text-blue-700' :
                              assessment?.grade === 'AP' ? 'bg-yellow-100 text-yellow-700' :
                              assessment?.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                              assessment?.grade === 'B' ? 'bg-red-100 text-red-700' : ''
                            }`}>{assessment?.grade ?? '—'}</td>
                            <td className="py-1.5 px-2 border border-gray-300 text-[10px]">{assessment?.remark ?? '—'}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 font-bold">
                        <td className="py-2 px-2 border border-gray-400" colSpan={3}>TOTAL SCORE</td>
                        <td className="py-2 px-2 border border-gray-400 text-center text-base text-blue-800">{previewResult.totalScore}</td>
                        <td className="py-2 px-2 border border-gray-400" colSpan={3}></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Aggregate for JHS */}
                  {isJHS && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-800 rounded-xl p-4 text-center mb-4">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Aggregate</p>
                      <p className="text-4xl font-bold text-blue-900 my-1">{calculateAggregate(previewStudent)}</p>
                      <p className="text-[10px] text-gray-500 italic">(4 Core Subjects + Best 2 Electives)</p>
                    </div>
                  )}

                  {/* Grading Scale */}
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Grading Scale</h4>
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="py-1 px-2 border border-gray-300">Grade</th>
                          <th className="py-1 px-2 border border-gray-300">Mark Range</th>
                          <th className="py-1 px-2 border border-gray-300">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-green-50"><td className="py-1 px-2 border border-gray-300 text-center font-bold">A</td><td className="py-1 px-2 border border-gray-300 text-center">80 - 100</td><td className="py-1 px-2 border border-gray-300">Advance</td></tr>
                        <tr className="bg-blue-50"><td className="py-1 px-2 border border-gray-300 text-center font-bold">P</td><td className="py-1 px-2 border border-gray-300 text-center">68 - 79</td><td className="py-1 px-2 border border-gray-300">Proficient</td></tr>
                        <tr className="bg-yellow-50"><td className="py-1 px-2 border border-gray-300 text-center font-bold">AP</td><td className="py-1 px-2 border border-gray-300 text-center">54 - 67</td><td className="py-1 px-2 border border-gray-300">Approaching Proficiency</td></tr>
                        <tr className="bg-orange-50"><td className="py-1 px-2 border border-gray-300 text-center font-bold">D</td><td className="py-1 px-2 border border-gray-300 text-center">40 - 53</td><td className="py-1 px-2 border border-gray-300">Developing</td></tr>
                        <tr className="bg-red-50"><td className="py-1 px-2 border border-gray-300 text-center font-bold">B</td><td className="py-1 px-2 border border-gray-300 text-center">0 - 39</td><td className="py-1 px-2 border border-gray-300">Beginning</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks Section */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 pb-2 border-b border-gray-200">Teacher's Assessment</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Interest:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewFields.interest || '—'}</span></div>
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Conduct:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewFields.conduct || '—'}</span></div>
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Attendance:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewFields.attendance || '—'}</span></div>
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Class Teacher's Remark:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewFields.classTeacherRemark || '—'}</span></div>
                    </div>
                    {nextTermDate && (
                      <div className="mt-3 pt-2 border-t border-gray-200 text-sm">
                        <span className="font-semibold text-gray-600">Next Term Begins:</span> <span>{nextTermDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-8 pt-4">
                    <div className="text-center w-44">
                      <div className="border-t border-black mb-1 mt-8"></div>
                      <p className="text-xs text-gray-600">Class Teacher's Signature</p>
                    </div>
                    <div className="text-center w-44">
                      <div className="border-t border-black mb-1 mt-8"></div>
                      <p className="text-xs text-gray-600">Head Teacher's Signature</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-6 pt-3 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400">This is an official report from Aleyart Academy • "Seeking Wisdom"</p>
                  </div>
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
