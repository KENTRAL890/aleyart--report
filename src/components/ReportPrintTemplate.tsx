import type { Assessment } from '../types';

interface ReportData {
  studentName: string;
  className: string;
  term: string;
  academicYear: string;
  position: number;
  totalStudents: number;
  totalScore: number;
  assessments: Assessment[];
  subjects: string[];
  subjectPositions: Record<string, number>;
  interest: string;
  conduct: string;
  attendance: string;
  classTeacherRemark: string;
  reportDate: string;
  nextTermDate: string;
  isJHS: boolean;
  aggregate?: number;
}

export function getReportHTML(data: ReportData): string {
  const getOrd = (n: number) => {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v-20)%10]||s[v]||s[0]);
  };

  const gradeColor = (g: string) => {
    if (g === 'A') return 'background:#c6f6d5;color:#22543d;';
    if (g === 'P') return 'background:#bee3f8;color:#2a4365;';
    if (g === 'AP') return 'background:#fefcbf;color:#744210;';
    if (g === 'D') return 'background:#fed7aa;color:#7b341e;';
    return 'background:#fed7d7;color:#822727;';
  };

  const subjectRows = data.subjects.map((subject, idx) => {
    const a = data.assessments.find(x => x.subject === subject);
    const pos = data.subjectPositions[subject] || '—';
    const bg = idx % 2 === 0 ? '#ffffff' : '#f7fafc';
    return `
      <tr style="background:${bg}">
        <td style="border:1px solid #c4cdd5;padding:7px 10px;text-align:left;font-weight:500;font-size:11px">${subject}</td>
        <td style="border:1px solid #c4cdd5;padding:7px 6px;text-align:center;font-size:11px">${a?.classScore ?? '—'}</td>
        <td style="border:1px solid #c4cdd5;padding:7px 6px;text-align:center;font-size:11px">${a?.examScore ?? '—'}</td>
        <td style="border:1px solid #c4cdd5;padding:7px 6px;text-align:center;font-weight:bold;font-size:12px">${a?.total ?? '—'}</td>
        <td style="border:1px solid #c4cdd5;padding:7px 6px;text-align:center;font-size:11px">${pos}</td>
        <td style="border:1px solid #c4cdd5;padding:7px 6px;text-align:center;font-weight:bold;font-size:11px;${a ? gradeColor(a.grade) : ''}">${a?.grade ?? '—'}</td>
        <td style="border:1px solid #c4cdd5;padding:7px 8px;text-align:left;font-size:10px;color:#555">${a?.remark ?? '—'}</td>
      </tr>`;
  }).join('');

  const aggregateSection = data.isJHS && data.aggregate !== undefined ? `
    <div style="margin:14px 0;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border:2px solid #3730a3;border-radius:10px;padding:14px;text-align:center">
      <div style="font-size:10px;font-weight:bold;color:#3730a3;text-transform:uppercase;letter-spacing:2px">Aggregate Score</div>
      <div style="font-size:36px;font-weight:900;color:#1e1b4b;margin:4px 0;font-family:Georgia,serif">${data.aggregate}</div>
      <div style="font-size:9px;color:#6366f1;font-style:italic">(4 Core Subjects + Best 2 Electives)</div>
    </div>` : '';

  return `
    <div style="width:210mm;min-height:297mm;padding:14mm 16mm;margin:0 auto;background:white;font-family:'Times New Roman',Georgia,serif;color:#1a1a1a;line-height:1.45;position:relative">
      
      <!-- Decorative top border -->
      <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#1e3a5f,#2563eb,#7c3aed,#2563eb,#1e3a5f)"></div>
      
      <!-- Header -->
      <div style="text-align:center;padding-bottom:14px;border-bottom:3px double #1e3a5f;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:6px">
          <div style="width:60px;height:60px;border:2.5px solid #1e3a5f;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f4ff,#dbeafe);flex-shrink:0">
            <div style="font-size:9px;font-weight:bold;color:#1e3a5f;text-align:center;line-height:1.2">ALEYART<br>ACADEMY</div>
          </div>
          <div>
            <h1 style="font-size:30px;font-weight:bold;color:#1e3a5f;text-transform:uppercase;letter-spacing:3px;margin:0;font-family:Georgia,serif">Aleyart Academy</h1>
            <p style="font-size:14px;color:#64748b;font-style:italic;margin:4px 0 0 0;letter-spacing:1px">"Seeking Wisdom"</p>
          </div>
        </div>
        <p style="font-size:10px;color:#94a3b8;margin:6px 0 0 0">📍 Odorkor-Official Town &nbsp;|&nbsp; 📮 P.O. Box 4183 &nbsp;|&nbsp; 📞 0553797233</p>
      </div>

      <!-- Report Title -->
      <div style="text-align:center;margin:14px 0">
        <div style="display:inline-block;padding:8px 32px;background:linear-gradient(135deg,#1e3a5f,#1e40af);color:white;font-size:15px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;border-radius:25px;box-shadow:0 3px 10px rgba(30,58,95,0.3)">
          ✦ &nbsp; Terminal Report Card &nbsp; ✦
        </div>
      </div>

      <!-- Student Info Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:14px">
        <div style="display:flex;align-items:center"><span style="font-weight:bold;color:#475569;min-width:120px;font-size:11px">Student Name:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;font-size:12px;font-weight:600;color:#0f172a;padding-bottom:2px">${data.studentName}</span></div>
        <div style="display:flex;align-items:center"><span style="font-weight:bold;color:#475569;min-width:120px;font-size:11px">Class:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;font-size:12px;color:#0f172a;padding-bottom:2px">${data.className}</span></div>
        <div style="display:flex;align-items:center"><span style="font-weight:bold;color:#475569;min-width:120px;font-size:11px">Term:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;font-size:12px;color:#0f172a;padding-bottom:2px">${data.term}</span></div>
        <div style="display:flex;align-items:center"><span style="font-weight:bold;color:#475569;min-width:120px;font-size:11px">Academic Year:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;font-size:12px;color:#0f172a;padding-bottom:2px">${data.academicYear}</span></div>
        <div style="display:flex;align-items:center"><span style="font-weight:bold;color:#475569;min-width:120px;font-size:11px">Position:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;padding-bottom:2px"><span style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#1e40af);color:white;padding:2px 12px;border-radius:12px;font-size:11px;font-weight:bold">${getOrd(data.position)}</span> <span style="font-size:11px;color:#64748b">out of ${data.totalStudents}</span></span></div>
        <div style="display:flex;align-items:center"><span style="font-weight:bold;color:#475569;min-width:120px;font-size:11px">Date:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;font-size:12px;color:#0f172a;padding-bottom:2px">${data.reportDate}</span></div>
      </div>

      <!-- Assessment Table -->
      <table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:11px;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
        <thead>
          <tr style="background:linear-gradient(135deg,#1e3a5f,#1e40af)">
            <th style="padding:9px 10px;text-align:left;color:white;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;border:1px solid #1e3a5f">Subject</th>
            <th style="padding:9px 6px;text-align:center;color:white;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;border:1px solid #1e3a5f">Class<br>Score (50)</th>
            <th style="padding:9px 6px;text-align:center;color:white;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;border:1px solid #1e3a5f">Exam<br>Score (50)</th>
            <th style="padding:9px 6px;text-align:center;color:white;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;border:1px solid #1e3a5f">Total<br>(100)</th>
            <th style="padding:9px 6px;text-align:center;color:white;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;border:1px solid #1e3a5f">Pos.</th>
            <th style="padding:9px 6px;text-align:center;color:white;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;border:1px solid #1e3a5f">Grade</th>
            <th style="padding:9px 8px;text-align:left;color:white;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;border:1px solid #1e3a5f">Remark</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
          <tr style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);font-weight:bold">
            <td style="border:1px solid #93a3b8;padding:9px 10px;font-size:12px;color:#1e3a5f" colspan="3">TOTAL SCORE</td>
            <td style="border:1px solid #93a3b8;padding:9px 6px;text-align:center;font-size:16px;color:#1e3a5f;font-weight:900">${data.totalScore}</td>
            <td style="border:1px solid #93a3b8;padding:9px" colspan="3"></td>
          </tr>
        </tbody>
      </table>

      ${aggregateSection}

      <!-- Grading Scale -->
      <div style="margin:12px 0">
        <div style="font-size:10px;font-weight:bold;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:16px;height:2px;background:#1e3a5f"></span>
          Grading Scale
          <span style="flex:1;height:1px;background:#cbd5e1"></span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:9px">
          <tr>
            <td style="border:1px solid #d1d5db;padding:4px 8px;text-align:center;font-weight:bold;background:#c6f6d5;width:12%">A</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;font-size:9px;background:#f0fdf4">80-100 → Advance</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;text-align:center;font-weight:bold;background:#bee3f8;width:12%">P</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;font-size:9px;background:#eff6ff">68-79 → Proficient</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;text-align:center;font-weight:bold;background:#fefcbf;width:12%">AP</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;font-size:9px;background:#fefce8">54-67 → Approaching Proficiency</td>
          </tr>
          <tr>
            <td style="border:1px solid #d1d5db;padding:4px 8px;text-align:center;font-weight:bold;background:#fed7aa">D</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;font-size:9px;background:#fff7ed">40-53 → Developing</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;text-align:center;font-weight:bold;background:#fed7d7">B</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px;font-size:9px;background:#fef2f2">0-39 → Beginning</td>
            <td style="border:1px solid #d1d5db;padding:4px 8px" colspan="2"></td>
          </tr>
        </table>
      </div>

      <!-- Teacher's Assessment -->
      <div style="margin:14px 0;padding:14px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
        <div style="font-size:10px;font-weight:bold;color:#1e3a5f;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:16px;height:2px;background:#1e3a5f"></span>
          Teacher's Assessment
        </div>
        <div style="display:grid;gap:8px">
          <div style="display:flex;align-items:flex-start"><span style="font-weight:bold;color:#475569;min-width:155px;font-size:11px">Interest:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;min-height:18px;font-size:11px;color:#0f172a;padding:0 4px 2px">${data.interest || ''}</span></div>
          <div style="display:flex;align-items:flex-start"><span style="font-weight:bold;color:#475569;min-width:155px;font-size:11px">Conduct:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;min-height:18px;font-size:11px;color:#0f172a;padding:0 4px 2px">${data.conduct || ''}</span></div>
          <div style="display:flex;align-items:flex-start"><span style="font-weight:bold;color:#475569;min-width:155px;font-size:11px">Attendance:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;min-height:18px;font-size:11px;color:#0f172a;padding:0 4px 2px">${data.attendance || ''}</span></div>
          <div style="display:flex;align-items:flex-start"><span style="font-weight:bold;color:#475569;min-width:155px;font-size:11px">Class Teacher's Remark:</span><span style="border-bottom:1px dotted #94a3b8;flex:1;min-height:18px;font-size:11px;color:#0f172a;padding:0 4px 2px">${data.classTeacherRemark || ''}</span></div>
        </div>
        ${data.nextTermDate ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px"><span style="font-weight:bold;color:#475569">Next Term Begins:</span> <span style="color:#0f172a">${data.nextTermDate}</span></div>` : ''}
      </div>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:32px;padding:0 10px">
        <div style="text-align:center;width:180px">
          <div style="border-top:1.5px solid #1e293b;margin-top:36px;padding-top:6px;font-size:10px;color:#475569;font-weight:500">Class Teacher's Signature</div>
        </div>
        <div style="text-align:center;width:180px">
          <div style="border-top:1.5px solid #1e293b;margin-top:36px;padding-top:6px;font-size:10px;color:#475569;font-weight:500">Head Teacher's Signature</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0">
        <p style="font-size:9px;color:#94a3b8;letter-spacing:0.5px">This is an official report from Aleyart Academy &nbsp;•&nbsp; "Seeking Wisdom"</p>
      </div>

      <!-- Decorative bottom border -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#1e3a5f,#2563eb,#7c3aed,#2563eb,#1e3a5f)"></div>
    </div>
  `;
}

export function getPrintStyles(): string {
  return `
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Georgia, serif; }
    @media print { 
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;
}
