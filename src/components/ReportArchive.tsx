import { useState, useRef } from 'react';
import { useData } from '../store/DataContext';
import {
  ALL_CLASSES, TERMS, ACADEMIC_YEARS, getSubjectsForClass
} from '../types';
import { Archive, Printer, Search } from 'lucide-react';

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
  const [printingReport, setPrintingReport] = useState<string | null>(null);

  const reports = data.terminalReports
    .filter(r => r.className === selectedClass && r.term === selectedTerm && r.academicYear === selectedYear)
    .filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.position - b.position);

  const isJHS = parseInt(selectedClass.replace('Basic ', '')) >= 7;
  const subjects = getSubjectsForClass(selectedClass);

  const printReport = (reportId: string) => {
    setPrintingReport(reportId);
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
                  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
                  th, td { border: 1px solid #333; padding: 5px 8px; text-align: center; }
                  th { background: #1a365d; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                  td:first-child { text-align: left; }
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
      setPrintingReport(null);
    }, 100);
  };

  const reportToPrint = reports.find(r => r.id === printingReport);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Archive className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Report Archive</h2>
          <p className="text-sm text-gray-500">View and print saved terminal reports</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            Saved Reports ({reports.length})
          </h3>
        </div>

        {reports.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No saved reports found for this selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-16">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Score</th>
                  {isJHS && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aggregate</th>}
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Saved Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white ${
                        report.position <= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-blue-500'
                      }`}>{report.position}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{report.studentName}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-800">{report.totalScore}</td>
                    {isJHS && <td className="px-4 py-3 text-center text-sm font-bold text-purple-600">{report.aggregate}</td>}
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => printReport(report.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden Print Template for archived report */}
      {reportToPrint && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={printRef}>
            <div className="report-container">
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Student Name:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{reportToPrint.studentName}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Class:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{reportToPrint.className}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Term:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{reportToPrint.term}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Academic Year:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{reportToPrint.academicYear}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '120px' }}>Position:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1 }}>{reportToPrint.position} out of {reportToPrint.totalStudents}</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'left' }}>Subject</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white' }}>Class Score (50)</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white' }}>Exam Score (50)</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white' }}>Total (100)</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white' }}>Position</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white' }}>Grade</th>
                    <th style={{ border: '1px solid #333', padding: '5px 8px', background: '#1a365d', color: 'white', textAlign: 'left' }}>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => {
                    const assessment = reportToPrint.assessments.find(a => a.subject === subject);
                    const pos = reportToPrint.subjectPositions[subject] || '—';
                    return (
                      <tr key={subject}>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left' }}>{subject}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px' }}>{assessment?.classScore || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px' }}>{assessment?.examScore || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', fontWeight: 'bold' }}>{assessment?.total || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px' }}>{pos}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', fontWeight: 'bold' }}>{assessment?.grade || '—'}</td>
                        <td style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left', fontSize: '10px' }}>{assessment?.remark || '—'}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                    <td style={{ border: '1px solid #333', padding: '5px 8px' }} colSpan={3}>TOTAL SCORE</td>
                    <td style={{ border: '1px solid #333', padding: '5px 8px', fontSize: '14px' }}>{reportToPrint.totalScore}</td>
                    <td style={{ border: '1px solid #333', padding: '5px 8px' }} colSpan={3}></td>
                  </tr>
                </tbody>
              </table>

              {isJHS && (
                <div style={{ background: '#f0f7ff', border: '2px solid #1a365d', padding: '10px', textAlign: 'center', margin: '10px 0', borderRadius: '5px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a365d' }}>AGGREGATE</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a365d' }}>{reportToPrint.aggregate}</div>
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>GRADING SCALE:</div>
                <table style={{ fontSize: '9px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #333', padding: '3px 5px', background: '#e5e7eb' }}>Grade</th>
                      <th style={{ border: '1px solid #333', padding: '3px 5px', background: '#e5e7eb' }}>Mark Range</th>
                      <th style={{ border: '1px solid #333', padding: '3px 5px', background: '#e5e7eb' }}>Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px' }}>A</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>80-100</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Advance</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px' }}>P</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>68-79</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Proficient</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px' }}>AP</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>54-67</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Approaching Proficiency</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px' }}>D</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>40-53</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Developing</td></tr>
                    <tr><td style={{ border: '1px solid #333', padding: '3px 5px' }}>B</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>0-39</td><td style={{ border: '1px solid #333', padding: '3px 5px' }}>Beginning</td></tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Interest:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1, fontSize: '11px' }}>{reportToPrint.interest}</span>
                </div>
                <div style={{ display: 'flex', margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Conduct:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1, fontSize: '11px' }}>{reportToPrint.conduct}</span>
                </div>
                <div style={{ display: 'flex', margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Attendance:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1, fontSize: '11px' }}>{reportToPrint.attendance}</span>
                </div>
                <div style={{ display: 'flex', margin: '8px 0' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '160px', fontSize: '11px' }}>Class Teacher's Remark:</span>
                  <span style={{ borderBottom: '1px dotted #333', flex: 1, fontSize: '11px' }}>{reportToPrint.classTeacherRemark}</span>
                </div>
              </div>

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
