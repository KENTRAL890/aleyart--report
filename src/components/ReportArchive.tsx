import { useState } from 'react';
import { useData } from '../store/DataContext';
import { ALL_CLASSES, TERMS, ACADEMIC_YEARS, getSubjectsForClass } from '../types';
import { Archive, Printer, Search, Eye, X } from 'lucide-react';
import { getReportHTML, getPrintStyles } from './ReportPrintTemplate';

export default function ReportArchive() {
  const { data, currentUser } = useData();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedYear, setSelectedYear] = useState(ACADEMIC_YEARS[0]);
  const [search, setSearch] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const reports = data.terminalReports
    .filter(r => r.className === selectedClass && r.term === selectedTerm && r.academicYear === selectedYear)
    .filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.position - b.position);

  const isJHS = parseInt(selectedClass.replace('Basic ', '')) >= 7;
  const subjects = getSubjectsForClass(selectedClass);
  const report = reports.find(r => r.id === previewId);

  const printReport = (r: typeof reports[0]) => {
    const html = getReportHTML({
      studentName: r.studentName, className: r.className,
      term: r.term, academicYear: r.academicYear,
      position: r.position, totalStudents: r.totalStudents, totalScore: r.totalScore,
      assessments: r.assessments, subjects, subjectPositions: r.subjectPositions || {},
      interest: r.interest, conduct: r.conduct, attendance: r.attendance,
      classTeacherRemark: r.classTeacherRemark,
      reportDate: new Date(r.createdAt).toLocaleDateString(), nextTermDate: '',
      isJHS, aggregate: r.aggregate,
    });
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<html><head><title>Report - ${r.studentName}</title><style>${getPrintStyles()}</style></head><body>${html}</body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Student name..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Report list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h3 className="font-bold text-gray-800">Saved Reports ({reports.length})</h3>
          <p className="text-xs text-gray-500 mt-0.5">{selectedClass} • {selectedTerm} • {selectedYear}</p>
        </div>

        {reports.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Archive className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 text-sm font-medium">No saved reports found.</p>
            <p className="text-gray-300 text-xs mt-1">Save reports from Terminal Reports first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Pos</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Student</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Total</th>
                  {isJHS && <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Agg</th>}
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Saved</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold text-white shadow ${
                        r.position===1?'bg-gradient-to-br from-yellow-400 to-amber-500':
                        r.position===2?'bg-gradient-to-br from-slate-300 to-slate-400':
                        r.position===3?'bg-gradient-to-br from-orange-400 to-amber-500':
                        'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>{r.position}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{r.studentName}</p>
                      <p className="text-[10px] text-gray-400">{r.assessments.length} subjects</p>
                    </td>
                    <td className="px-4 py-3 text-center"><span className="text-base font-bold text-gray-800">{r.totalScore}</span></td>
                    {isJHS && (
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">{r.aggregate}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setPreviewId(r.id); setShowPreview(true); }}
                          className="flex items-center gap-1 px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button onClick={() => printReport(r)}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                          <Printer className="w-3.5 h-3.5" /> Print
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
      {showPreview && report && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-3 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[860px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-800 to-slate-900 sticky top-0 z-10">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Archive className="w-4 h-4" /> {report.studentName}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => printReport(report)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-800 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors">
                    <Printer className="w-4 h-4" /> Print A4
                  </button>
                  <button onClick={() => setShowPreview(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-8 bg-gray-200"
                dangerouslySetInnerHTML={{
                  __html: getReportHTML({
                    studentName: report.studentName, className: report.className,
                    term: report.term, academicYear: report.academicYear,
                    position: report.position, totalStudents: report.totalStudents, totalScore: report.totalScore,
                    assessments: report.assessments, subjects, subjectPositions: report.subjectPositions || {},
                    interest: report.interest, conduct: report.conduct, attendance: report.attendance,
                    classTeacherRemark: report.classTeacherRemark,
                    reportDate: new Date(report.createdAt).toLocaleDateString(), nextTermDate: '',
                    isJHS, aggregate: report.aggregate,
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
