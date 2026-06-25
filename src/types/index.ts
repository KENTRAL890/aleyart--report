// UUID generator that works in all browsers
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'teacher';
  fullName: string;
  assignedClass?: string;
}

export interface Student {
  id: string;
  name: string;
  className: string;
  gender: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  totalFees: number;
  feesPaid: number;
  feesBalance: number;
  feeStatus: 'pending' | 'partial' | 'completed';
}

export interface Assessment {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  subject: string;
  classScore: number;
  examScore: number;
  total: number;
  grade: string;
  remark: string;
  term: string;
  academicYear: string;
}

export interface TerminalReport {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  term: string;
  academicYear: string;
  assessments: Assessment[];
  totalScore: number;
  position: number;
  totalStudents: number;
  interest: string;
  conduct: string;
  classTeacherRemark: string;
  attendance: string;
  aggregate?: number;
  subjectPositions: Record<string, number>;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  date: string;
  receiptNumber: string;
  term: string;
  academicYear: string;
}

export type ClassName = 
  | 'Basic 1' | 'Basic 2' | 'Basic 3' | 'Basic 4' | 'Basic 5' | 'Basic 6'
  | 'Basic 7' | 'Basic 8';

export const ALL_CLASSES: ClassName[] = [
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'Basic 7', 'Basic 8'
];

export const BASIC_1_TO_6_SUBJECTS = [
  'English Language', 'Mathematics', 'Science', 'Computing', 
  'Creative Arts', 'RME', 'History', 'French', 'Ga/Twi'
];

export const BASIC_7_TO_8_SUBJECTS = [
  'English Language', 'Mathematics', 'Science', 'Computing',
  'Creative Arts', 'RME', 'Social Studies', 'Career Tech', 'French', 'Ga/Twi'
];

export const CORE_SUBJECTS_JHS = ['English Language', 'Mathematics', 'Science', 'Social Studies'];

export function getSubjectsForClass(className: string): string[] {
  const num = parseInt(className.replace('Basic ', ''));
  if (num >= 7) return BASIC_7_TO_8_SUBJECTS;
  return BASIC_1_TO_6_SUBJECTS;
}

export function getGrade(total: number): { grade: string; remark: string } {
  if (total >= 80) return { grade: 'A', remark: 'Advance' };
  if (total >= 68) return { grade: 'P', remark: 'Proficient' };
  if (total >= 54) return { grade: 'AP', remark: 'Approaching Proficiency' };
  if (total >= 40) return { grade: 'D', remark: 'Developing' };
  return { grade: 'B', remark: 'Beginning' };
}

export function getAggregateGrade(percentage: number): number {
  if (percentage >= 90) return 1;
  if (percentage >= 80) return 2;
  if (percentage >= 70) return 3;
  if (percentage >= 60) return 4;
  if (percentage >= 55) return 5;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 7;
  if (percentage >= 35) return 8;
  return 9;
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
  };

  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);
  
  let result = convert(wholePart);
  if (decimalPart > 0) {
    result += ' Ghana Cedis and ' + convert(decimalPart) + ' Pesewas';
  } else {
    result += ' Ghana Cedis';
  }
  return result;
}

export const TERMS = ['Term 1', 'Term 2', 'Term 3'];
export const ACADEMIC_YEARS = ['2024/2025', '2025/2026', '2026/2027'];
