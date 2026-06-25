import { useState, useRef } from 'react';
import { useData } from '../store/DataContext';
import { ALL_CLASSES, TERMS, ACADEMIC_YEARS, getSubjectsForClass } from '../types';
import { Archive, Printer, Search, Eye, X } from 'lucide-react';

export default function ReportArchive() {
  const { data, currentUser } = useData();
  const isAdmin = currentUser?.role === 'admin';
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [search, setSearch] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewReportId, setPreviewReportId] = useState<string | null>(null);

  const reports = data.terminalReports
    .filter(r => r.className === selectedClass && r.term === selectedTerm && r.academicYear === selectedYear)
    .filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.position - b.position);

  const isJHS = parseInt(selectedClass.replace('Basic ', '')) >= 7;
  const subjects = getSubjectsForClass(selectedClass);

  const openPreview = (reportId: string) => {
    setPreviewReportId(reportId);
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
                .school-name { font-size: 28px; font-weight: bold; color: #1a365d; text-transform: uppercase; letter-spacing: 2px; }
                .school-motto { font-size: 13px; color: #4a5568; font-style: italic; margin: 4px 0; }
                .school-info { font-size: 11px; color: #666; }
                .report-title { font-size: 16px; font-weight: bold; text-align: center; margin: 12px 0; padding: 8px 20px; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
                .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
                .info-row { display: flex; align-items: center; }
                .info-label { font-weight: bold; min-width: 130px; color: #4a5568; font-size: 11px; }
                .info-value { color: #1a202c; font-size: 11px; border-bottom: 1px dotted #cbd5e0; flex: 1; padding-bottom: 2px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
                th { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 8px 6px; text-align: center; font-weight: bold; font-size: 9px; }
                th:first-child { text-align: left; }
                td { border: 1px solid #cbd5e0; padding: 6px; text-align: center; }
                td:first-child { text-align: left; font-weight: 500; }
                tr:nth-child(even) { background: #f8fafc; }
                .total-row { background: #edf2f7 !important; font-weight: bold; }
                .aggregate-box { background: linear-gradient(135deg, #ebf4ff 0%, #c3dafe 100%); border: 2px solid #1a365d; padding: 12px; text-align: center; margin: 12px 0; border-radius: 8px; }
                .remarks-section { margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
                .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
                .sig-block { width: 180px; text-align: center; }
                .sig-line { border-top: 1px solid #1a202c; margin-top: 40px; margin-bottom: 4px; }
                @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
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

  const previewReport = reports.find(r => r.id === previewReportId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <Archive className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Report Archive</h2>
          <p className="text-sm text-gray-500">View and print saved terminal reports</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Archived Reports */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h3 className="font-bold text-gray-800">
            Saved Reports ({reports.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{selectedClass} • {selectedTerm} • {selectedYear}</p>
        </div>

        {reports.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Archive className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 text-sm">No saved reports found for this selection.</p>
            <p className="text-gray-300 text-xs mt-1">Reports will appear here after you save them from Terminal Reports.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Score</th>
                  {isJHS && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aggregate</th>}
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Saved Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold text-white shadow-md ${
                        report.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                        report.position === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                        report.position === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                        'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>{report.position}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{report.studentName}</p>
                      <p className="text-xs text-gray-400">{report.assessments.length} subjects</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-gray-800">{report.totalScore}</span>
                    </td>
                    {isJHS && (
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">
                          {report.aggregate}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openPreview(report.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors">
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Archived Report - {previewReport.studentName}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
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
                  <div className="text-center pb-4 border-b-4 border-double border-blue-800 mb-4">
                    <div className="flex items-center justify-center gap-4 mb-2">
                      <div className="w-16 h-16 rounded-full border-2 border-blue-800 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                        <img src="/images/logo.png" alt="Logo" className="w-12 h-12 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Student Name:</span><span className="border-b border-dotted border-gray-400 flex-1">{previewReport.studentName}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Class:</span><span className="border-b border-dotted border-gray-400 flex-1">{previewReport.className}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Term:</span><span className="border-b border-dotted border-gray-400 flex-1">{previewReport.term}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Academic Year:</span><span className="border-b border-dotted border-gray-400 flex-1">{previewReport.academicYear}</span></div>
                    <div className="flex"><span className="font-semibold text-gray-600 w-32">Position:</span><span className="border-b border-dotted border-gray-400 flex-1"><span className="px-3 py-0.5 bg-blue-800 text-white text-xs font-bold rounded-full">{previewReport.position}{getOrdinalSuffix(previewReport.position)}</span> out of {previewReport.totalStudents}</span></div>
                  </div>

                  {/* Assessment Table */}
                  <table className="w-full border-collapse text-xs mb-4">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white">
                        <th className="py-2 px-2 text-left font-semibold border border-blue-900">Subject</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Class (50)</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Exam (50)</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Total (100)</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Position</th>
                        <th className="py-2 px-2 text-center font-semibold border border-blue-900">Grade</th>
                        <th className="py-2 px-2 text-left font-semibold border border-blue-900">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject, idx) => {
                        const assessment = previewReport.assessments.find(a => a.subject === subject);
                        const pos = previewReport.subjectPositions?.[subject] || '—';
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
                        <td className="py-2 px-2 border border-gray-400 text-center text-base text-blue-800">{previewReport.totalScore}</td>
                        <td className="py-2 px-2 border border-gray-400" colSpan={3}></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Aggregate for JHS */}
                  {isJHS && previewReport.aggregate && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-800 rounded-xl p-4 text-center mb-4">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Aggregate</p>
                      <p className="text-4xl font-bold text-blue-900 my-1">{previewReport.aggregate}</p>
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
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Interest:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewReport.interest || '—'}</span></div>
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Conduct:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewReport.conduct || '—'}</span></div>
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Attendance:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewReport.attendance || '—'}</span></div>
                      <div className="flex"><span className="font-semibold text-gray-600 w-40">Class Teacher's Remark:</span><span className="border-b border-dotted border-gray-400 flex-1 min-h-[20px]">{previewReport.classTeacherRemark || '—'}</span></div>
                    </div>
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
