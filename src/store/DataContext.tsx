import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Student, Assessment, FeePayment, TerminalReport } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DataStore {
  users: User[];
  students: Student[];
  assessments: Assessment[];
  feePayments: FeePayment[];
  terminalReports: TerminalReport[];
}

interface DataContextType {
  data: DataStore;
  currentUser: User | null;
  loading: boolean;
  useSupabase: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Users
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Students
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  moveStudent: (studentId: string, newClass: string) => Promise<void>;
  
  // Assessments
  saveAssessments: (assessments: Assessment[]) => Promise<void>;
  deleteClassAssessments: (className: string, term: string, academicYear: string) => Promise<void>;
  getStudentAssessments: (studentId: string, term: string, academicYear: string) => Assessment[];
  getClassAssessments: (className: string, term: string, academicYear: string) => Assessment[];
  
  // Fees
  addFeePayment: (payment: FeePayment) => Promise<void>;
  updateFeePayment: (payment: FeePayment) => Promise<void>;
  updateStudentFees: (studentId: string, totalFees: number) => Promise<void>;
  
  // Terminal Reports
  saveTerminalReport: (report: TerminalReport) => Promise<void>;
  getTerminalReports: (className: string, term: string, academicYear: string) => TerminalReport[];
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_KEY = 'aleyart_academy_data';
const USER_KEY = 'aleyart_current_user';

const defaultAdmin: User = {
  id: 'admin-1',
  username: 'admin',
  password: 'admin123',
  role: 'admin',
  fullName: 'Administrator',
};

// Helper to convert snake_case to camelCase
const toCamelCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
};

// Helper to convert camelCase to snake_case
const toSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
};

function loadLocalData(): DataStore {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return {
    users: [defaultAdmin],
    students: [],
    assessments: [],
    feePayments: [],
    terminalReports: [],
  };
}

function saveLocalData(data: DataStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: JSON.stringify(data),
  }));
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataStore>(loadLocalData);
  const [loading, setLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);
  const channelsRef = useRef<RealtimeChannel[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Initialize and check Supabase connection
  useEffect(() => {
    const initSupabase = async () => {
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, using local storage');
        setLoading(false);
        return;
      }

      try {
        // Refresh PostgREST schema cache
        await supabase.rpc('reload_schema').then(() => {}, () => {});
        
        // Test connection by fetching users
        const { data: users, error } = await supabase.from('users').select('*');
        
        if (error) {
          console.error('Supabase connection error:', error);
          setLoading(false);
          return;
        }

        console.log('Supabase connected successfully!');
        setUseSupabase(true);

        // Fetch all data
        const [studentsRes, assessmentsRes, paymentsRes, reportsRes] = await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('assessments').select('*'),
          supabase.from('fee_payments').select('*'),
          supabase.from('terminal_reports').select('*'),
        ]);

        setData({
          users: (users || []).map(u => toCamelCase(u) as unknown as User),
          students: (studentsRes.data || []).map(s => toCamelCase(s) as unknown as Student),
          assessments: (assessmentsRes.data || []).map(a => toCamelCase(a) as unknown as Assessment),
          feePayments: (paymentsRes.data || []).map(p => toCamelCase(p) as unknown as FeePayment),
          terminalReports: (reportsRes.data || []).map(r => ({
            ...toCamelCase(r),
            assessments: r.assessments || [],
            subjectPositions: r.subject_positions || {},
          }) as unknown as TerminalReport),
        });

        // Set up real-time subscriptions
        setupRealtimeSubscriptions();
        
      } catch (err) {
        console.error('Failed to initialize Supabase:', err);
      }
      
      setLoading(false);
    };

    initSupabase();

    return () => {
      // Cleanup subscriptions
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Users channel
    const usersChannel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        setData(prev => {
          const users = [...prev.users];
          if (payload.eventType === 'INSERT') {
            users.push(toCamelCase(payload.new) as unknown as User);
          } else if (payload.eventType === 'UPDATE') {
            const idx = users.findIndex(u => u.id === payload.new.id);
            if (idx >= 0) users[idx] = toCamelCase(payload.new) as unknown as User;
          } else if (payload.eventType === 'DELETE') {
            return { ...prev, users: users.filter(u => u.id !== payload.old.id) };
          }
          return { ...prev, users };
        });
      })
      .subscribe();

    // Students channel
    const studentsChannel = supabase
      .channel('students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        setData(prev => {
          const students = [...prev.students];
          if (payload.eventType === 'INSERT') {
            students.push(toCamelCase(payload.new) as unknown as Student);
          } else if (payload.eventType === 'UPDATE') {
            const idx = students.findIndex(s => s.id === payload.new.id);
            if (idx >= 0) students[idx] = toCamelCase(payload.new) as unknown as Student;
          } else if (payload.eventType === 'DELETE') {
            return { ...prev, students: students.filter(s => s.id !== payload.old.id) };
          }
          return { ...prev, students };
        });
      })
      .subscribe();

    // Assessments channel
    const assessmentsChannel = supabase
      .channel('assessments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, (payload) => {
        setData(prev => {
          const assessments = [...prev.assessments];
          if (payload.eventType === 'INSERT') {
            assessments.push(toCamelCase(payload.new) as unknown as Assessment);
          } else if (payload.eventType === 'UPDATE') {
            const idx = assessments.findIndex(a => a.id === payload.new.id);
            if (idx >= 0) assessments[idx] = toCamelCase(payload.new) as unknown as Assessment;
          } else if (payload.eventType === 'DELETE') {
            return { ...prev, assessments: assessments.filter(a => a.id !== payload.old.id) };
          }
          return { ...prev, assessments };
        });
      })
      .subscribe();

    // Fee payments channel
    const paymentsChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_payments' }, (payload) => {
        setData(prev => {
          const feePayments = [...prev.feePayments];
          if (payload.eventType === 'INSERT') {
            feePayments.push(toCamelCase(payload.new) as unknown as FeePayment);
          } else if (payload.eventType === 'UPDATE') {
            const idx = feePayments.findIndex(p => p.id === payload.new.id);
            if (idx >= 0) feePayments[idx] = toCamelCase(payload.new) as unknown as FeePayment;
          } else if (payload.eventType === 'DELETE') {
            return { ...prev, feePayments: feePayments.filter(p => p.id !== payload.old.id) };
          }
          return { ...prev, feePayments };
        });
      })
      .subscribe();

    // Terminal reports channel
    const reportsChannel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'terminal_reports' }, (payload) => {
        setData(prev => {
          const terminalReports = [...prev.terminalReports];
          if (payload.eventType === 'INSERT') {
            terminalReports.push({
              ...toCamelCase(payload.new),
              assessments: payload.new.assessments || [],
              subjectPositions: payload.new.subject_positions || {},
            } as unknown as TerminalReport);
          } else if (payload.eventType === 'UPDATE') {
            const idx = terminalReports.findIndex(r => r.id === payload.new.id);
            if (idx >= 0) terminalReports[idx] = {
              ...toCamelCase(payload.new),
              assessments: payload.new.assessments || [],
              subjectPositions: payload.new.subject_positions || {},
            } as unknown as TerminalReport;
          } else if (payload.eventType === 'DELETE') {
            return { ...prev, terminalReports: terminalReports.filter(r => r.id !== payload.old.id) };
          }
          return { ...prev, terminalReports };
        });
      })
      .subscribe();

    channelsRef.current = [usersChannel, studentsChannel, assessmentsChannel, paymentsChannel, reportsChannel];
  };

  // Cross-tab sync for local storage
  useEffect(() => {
    if (useSupabase) return;
    
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setData(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [useSupabase]);

  const persistLocal = useCallback((newData: DataStore) => {
    setData(newData);
    saveLocalData(newData);
  }, []);

  // Login
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    let user: User | undefined;
    
    if (useSupabase) {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password);
      
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }
      
      if (users && users.length > 0) {
        user = toCamelCase(users[0]) as unknown as User;
      }
    } else {
      user = data.users.find(u => u.username === username && u.password === password);
    }
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  }, [data.users, useSupabase]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  // Users
  const addUser = useCallback(async (user: User) => {
    if (useSupabase) {
      const { error } = await supabase.from('users').insert({
        username: user.username,
        password: user.password,
        role: user.role,
        full_name: user.fullName,
        assigned_class: user.assignedClass || null,
      }).select();
      if (error) {
        console.error('Failed to add user:', error.message, error.details, error.hint);
        alert('Failed to add teacher: ' + error.message + (error.details ? '\nDetails: ' + error.details : '') + (error.hint ? '\nHint: ' + error.hint : ''));
      }
    } else {
      persistLocal({ ...data, users: [...data.users, user] });
    }
  }, [data, persistLocal, useSupabase]);

  const updateUser = useCallback(async (user: User) => {
    if (useSupabase) {
      const { error } = await supabase.from('users').update({
        username: user.username,
        password: user.password,
        role: user.role,
        full_name: user.fullName,
        assigned_class: user.assignedClass || null,
      }).eq('id', user.id);
      if (error) {
        console.error('Failed to update user:', error.message, error.details);
        alert('Failed to update teacher: ' + error.message);
      }
    } else {
      persistLocal({ ...data, users: data.users.map(u => u.id === user.id ? user : u) });
    }
  }, [data, persistLocal, useSupabase]);

  const deleteUser = useCallback(async (id: string) => {
    if (useSupabase) {
      await supabase.from('users').delete().eq('id', id);
    } else {
      persistLocal({ ...data, users: data.users.filter(u => u.id !== id) });
    }
  }, [data, persistLocal, useSupabase]);

  // Students
  const addStudent = useCallback(async (student: Student) => {
    if (useSupabase) {
      const { error } = await supabase.from('students').insert({
        name: student.name,
        class_name: student.className,
        gender: student.gender,
        date_of_birth: student.dateOfBirth || null,
        parent_name: student.parentName || null,
        parent_phone: student.parentPhone || null,
        total_fees: student.totalFees,
        fees_paid: student.feesPaid,
        fees_balance: student.feesBalance,
        fee_status: student.feeStatus,
      }).select();
      if (error) {
        console.error('Failed to add student:', error.message, error.details, error.hint);
        alert('Failed to add student: ' + error.message + (error.hint ? '\nHint: ' + error.hint : ''));
      }
    } else {
      persistLocal({ ...data, students: [...data.students, student] });
    }
  }, [data, persistLocal, useSupabase]);

  const updateStudent = useCallback(async (student: Student) => {
    if (useSupabase) {
      const { error } = await supabase.from('students').update({
        name: student.name,
        class_name: student.className,
        gender: student.gender,
        date_of_birth: student.dateOfBirth || null,
        parent_name: student.parentName || null,
        parent_phone: student.parentPhone || null,
        total_fees: student.totalFees,
        fees_paid: student.feesPaid,
        fees_balance: student.feesBalance,
        fee_status: student.feeStatus,
      }).eq('id', student.id);
      if (error) {
        console.error('Failed to update student:', error.message, error.details);
        alert('Failed to update student: ' + error.message);
      }
    } else {
      persistLocal({ ...data, students: data.students.map(s => s.id === student.id ? student : s) });
    }
  }, [data, persistLocal, useSupabase]);

  const deleteStudent = useCallback(async (id: string) => {
    if (useSupabase) {
      await supabase.from('students').delete().eq('id', id);
    } else {
      persistLocal({
        ...data,
        students: data.students.filter(s => s.id !== id),
        assessments: data.assessments.filter(a => a.studentId !== id),
        feePayments: data.feePayments.filter(f => f.studentId !== id),
        terminalReports: data.terminalReports.filter(r => r.studentId !== id),
      });
    }
  }, [data, persistLocal, useSupabase]);

  const moveStudent = useCallback(async (studentId: string, newClass: string) => {
    if (useSupabase) {
      await supabase.from('students').update({ class_name: newClass }).eq('id', studentId);
    } else {
      persistLocal({
        ...data,
        students: data.students.map(s => s.id === studentId ? { ...s, className: newClass } : s),
      });
    }
  }, [data, persistLocal, useSupabase]);

  // Assessments
  const saveAssessments = useCallback(async (assessments: Assessment[]) => {
    if (useSupabase) {
      const records = assessments.map(a => ({
        student_id: a.studentId,
        student_name: a.studentName,
        class_name: a.className,
        subject: a.subject,
        class_score: a.classScore,
        exam_score: a.examScore,
        total: a.total,
        grade: a.grade,
        remark: a.remark,
        term: a.term,
        academic_year: a.academicYear,
      }));
      const { error } = await supabase.from('assessments').upsert(records, { onConflict: 'student_id,subject,term,academic_year' });
      if (error) {
        console.error('Failed to save assessments:', error.message, error.details);
        alert('Failed to save assessments: ' + error.message);
      }
    } else {
      const existingIds = new Set(assessments.map(a => a.id));
      const filtered = data.assessments.filter(a => !existingIds.has(a.id));
      persistLocal({ ...data, assessments: [...filtered, ...assessments] });
    }
  }, [data, persistLocal, useSupabase]);

  const deleteClassAssessments = useCallback(async (className: string, term: string, academicYear: string) => {
    if (useSupabase) {
      await supabase.from('assessments')
        .delete()
        .eq('class_name', className)
        .eq('term', term)
        .eq('academic_year', academicYear);
    } else {
      persistLocal({
        ...data,
        assessments: data.assessments.filter(a =>
          !(a.className === className && a.term === term && a.academicYear === academicYear)
        ),
      });
    }
  }, [data, persistLocal, useSupabase]);

  const getStudentAssessments = useCallback((studentId: string, term: string, academicYear: string) => {
    return data.assessments.filter(a =>
      a.studentId === studentId && a.term === term && a.academicYear === academicYear
    );
  }, [data.assessments]);

  const getClassAssessments = useCallback((className: string, term: string, academicYear: string) => {
    return data.assessments.filter(a =>
      a.className === className && a.term === term && a.academicYear === academicYear
    );
  }, [data.assessments]);

  // Fees
  const addFeePayment = useCallback(async (payment: FeePayment) => {
    const student = data.students.find(s => s.id === payment.studentId);
    if (!student) return;
    
    const newFeesPaid = student.feesPaid + payment.amount;
    const newBalance = student.totalFees - newFeesPaid;
    const updatedStudent: Student = {
      ...student,
      feesPaid: newFeesPaid,
      feesBalance: newBalance,
      feeStatus: newBalance <= 0 ? 'completed' : 'partial',
    };

    if (useSupabase) {
      const { error: payError } = await supabase.from('fee_payments').insert({
        student_id: payment.studentId,
        student_name: payment.studentName,
        class_name: payment.className,
        amount: payment.amount,
        date: payment.date,
        receipt_number: payment.receiptNumber,
        term: payment.term,
        academic_year: payment.academicYear,
      });
      if (payError) {
        console.error('Failed to add payment:', payError.message);
        alert('Failed to record payment: ' + payError.message);
        return;
      }
      const { error: stuError } = await supabase.from('students').update({
        fees_paid: newFeesPaid,
        fees_balance: newBalance,
        fee_status: updatedStudent.feeStatus,
      }).eq('id', student.id);
      if (stuError) {
        console.error('Failed to update student fees:', stuError.message);
      }
    } else {
      persistLocal({
        ...data,
        students: data.students.map(s => s.id === student.id ? updatedStudent : s),
        feePayments: [...data.feePayments, payment],
      });
    }
  }, [data, persistLocal, useSupabase]);

  const updateFeePayment = useCallback(async (payment: FeePayment) => {
    if (useSupabase) {
      const snakePayment = toSnakeCase(payment as unknown as Record<string, unknown>);
      await supabase.from('fee_payments').update(snakePayment).eq('id', payment.id);
      
      // Recalculate student fees
      const { data: payments } = await supabase
        .from('fee_payments')
        .select('amount')
        .eq('student_id', payment.studentId);
      
      const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const student = data.students.find(s => s.id === payment.studentId);
      if (student) {
        const newBalance = student.totalFees - totalPaid;
        await supabase.from('students').update({
          fees_paid: totalPaid,
          fees_balance: newBalance,
          fee_status: newBalance <= 0 ? 'completed' : (totalPaid > 0 ? 'partial' : 'pending'),
        }).eq('id', student.id);
      }
    } else {
      const newData = { ...data, feePayments: data.feePayments.map(f => f.id === payment.id ? payment : f) };
      const studentPayments = newData.feePayments.filter(f => f.studentId === payment.studentId);
      const totalPaid = studentPayments.reduce((sum, f) => sum + f.amount, 0);
      const student = data.students.find(s => s.id === payment.studentId);
      if (student) {
        const newBalance = student.totalFees - totalPaid;
        newData.students = newData.students.map(s => s.id === student.id ? {
          ...s,
          feesPaid: totalPaid,
          feesBalance: newBalance,
          feeStatus: newBalance <= 0 ? 'completed' as const : (totalPaid > 0 ? 'partial' as const : 'pending' as const),
        } : s);
      }
      persistLocal(newData);
    }
  }, [data, persistLocal, useSupabase]);

  const updateStudentFees = useCallback(async (studentId: string, totalFees: number) => {
    const student = data.students.find(s => s.id === studentId);
    if (!student) return;
    
    const newBalance = totalFees - student.feesPaid;
    const updatedStudent = {
      ...student,
      totalFees,
      feesBalance: newBalance,
      feeStatus: newBalance <= 0 ? 'completed' as const : (student.feesPaid > 0 ? 'partial' as const : 'pending' as const),
    };

    if (useSupabase) {
      await supabase.from('students').update({
        total_fees: totalFees,
        fees_balance: newBalance,
        fee_status: updatedStudent.feeStatus,
      }).eq('id', studentId);
    } else {
      persistLocal({
        ...data,
        students: data.students.map(s => s.id === studentId ? updatedStudent : s),
      });
    }
  }, [data, persistLocal, useSupabase]);

  // Terminal Reports
  const saveTerminalReport = useCallback(async (report: TerminalReport) => {
    if (useSupabase) {
      const { error } = await supabase.from('terminal_reports').upsert({
        id: report.id,
        student_id: report.studentId,
        student_name: report.studentName,
        class_name: report.className,
        term: report.term,
        academic_year: report.academicYear,
        assessments: report.assessments,
        total_score: report.totalScore,
        position: report.position,
        total_students: report.totalStudents,
        interest: report.interest,
        conduct: report.conduct,
        class_teacher_remark: report.classTeacherRemark,
        attendance: report.attendance,
        aggregate: report.aggregate,
        subject_positions: report.subjectPositions,
        created_at: report.createdAt,
      }, { onConflict: 'student_id,term,academic_year' });
      if (error) {
        console.error('Failed to save report:', error.message);
        alert('Failed to save report: ' + error.message);
      }
    } else {
      const exists = data.terminalReports.findIndex(r => r.id === report.id);
      let newReports;
      if (exists >= 0) {
        newReports = data.terminalReports.map(r => r.id === report.id ? report : r);
      } else {
        newReports = [...data.terminalReports, report];
      }
      persistLocal({ ...data, terminalReports: newReports });
    }
  }, [data, persistLocal, useSupabase]);

  const getTerminalReports = useCallback((className: string, term: string, academicYear: string) => {
    return data.terminalReports.filter(r =>
      r.className === className && r.term === term && r.academicYear === academicYear
    );
  }, [data.terminalReports]);

  return (
    <DataContext.Provider value={{
      data,
      currentUser,
      loading,
      useSupabase,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      addStudent,
      updateStudent,
      deleteStudent,
      moveStudent,
      saveAssessments,
      deleteClassAssessments,
      getStudentAssessments,
      getClassAssessments,
      addFeePayment,
      updateFeePayment,
      updateStudentFees,
      saveTerminalReport,
      getTerminalReports,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
