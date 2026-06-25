import { useState, useRef } from 'react';
import { useData } from '../store/DataContext';
import { ALL_CLASSES, TERMS, ACADEMIC_YEARS, numberToWords } from '../types';
import type { FeePayment } from '../types';
import { DollarSign, Plus, Search, Printer, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';

function generateReceiptNumber() {
  return 'RCP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

export default function FeesPage() {
  const { data, currentUser, addFeePayment, updateFeePayment, updateStudentFees } = useData();
  const isAdmin = currentUser?.role === 'admin';
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedClass, setSelectedClass] = useState<string>(
    isAdmin ? ALL_CLASSES[0] : (currentUser?.assignedClass || ALL_CLASSES[0])
  );
  const [search, setSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEditFeeModal, setShowEditFeeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentTerm, setPaymentTerm] = useState(TERMS[0]);
  const [paymentYear, setPaymentYear] = useState(ACADEMIC_YEARS[0]);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [editFeeAmount, setEditFeeAmount] = useState(0);
  const [editingPayment, setEditingPayment] = useState<FeePayment | null>(null);

  const students = data.students
    .filter(s => s.className === selectedClass)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalFeesExpected = students.reduce((sum, s) => sum + s.totalFees, 0);
  const totalFeesCollected = students.reduce((sum, s) => sum + s.feesPaid, 0);
  const totalFeesOwed = students.reduce((sum, s) => sum + Math.max(0, s.feesBalance), 0);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      const updated: FeePayment = { ...editingPayment, amount: paymentAmount };
      await updateFeePayment(updated);
      setEditingPayment(null);
    } else {
      const payment: FeePayment = {
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        studentId: selectedStudent,
        studentName: data.students.find(s => s.id === selectedStudent)?.name || '',
        className: selectedClass,
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        receiptNumber: generateReceiptNumber(),
        term: paymentTerm,
        academicYear: paymentYear,
      };
      await addFeePayment(payment);
      setSelectedReceipt(payment);
      setShowReceiptModal(true);
    }
    setShowPaymentModal(false);
    setPaymentAmount(0);
    setSelectedStudent('');
  };

  const handleEditFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      await updateStudentFees(selectedStudent, editFeeAmount);
    }
    setShowEditFeeModal(false);
  };

  const openPaymentForStudent = (studentId: string) => {
    setSelectedStudent(studentId);
    setPaymentAmount(0);
    setEditingPayment(null);
    setShowPaymentModal(true);
  };

  const openEditFees = (studentId: string, currentFees: number) => {
    setSelectedStudent(studentId);
    setEditFeeAmount(currentFees);
    setShowEditFeeModal(true);
  };

  const viewReceipt = (payment: FeePayment) => {
    setSelectedReceipt(payment);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Fee Receipt - Aleyart Academy</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Georgia', serif; padding: 20px; }
                .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #1e40af; padding: 30px; }
                .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
                .school-name { font-size: 24px; font-weight: bold; color: #1e40af; }
                .school-info { font-size: 12px; color: #666; margin-top: 5px; }
                .receipt-title { font-size: 18px; font-weight: bold; margin: 15px 0; text-align: center; text-decoration: underline; }
                .details { margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ccc; }
                .label { font-weight: bold; color: #333; }
                .value { color: #000; }
                .amount-box { background: #f0f7ff; border: 2px solid #1e40af; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px; }
                .amount-figure { font-size: 28px; font-weight: bold; color: #1e40af; }
                .amount-words { font-size: 12px; color: #666; font-style: italic; margin-top: 5px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 11px; color: #888; }
                .signature { margin-top: 40px; display: flex; justify-content: space-between; }
                .sig-line { width: 200px; border-top: 1px solid #000; padding-top: 5px; text-align: center; font-size: 12px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const studentPayments = selectedStudent
    ? data.feePayments.filter(p => p.studentId === selectedStudent).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isAdmin && (
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <DollarSign className="w-8 h-8 opacity-50 mb-2" />
          <p className="text-2xl font-bold">GH₵ {totalFeesExpected.toLocaleString()}</p>
          <p className="text-blue-100 text-sm">Total Expected</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <CheckCircle className="w-8 h-8 opacity-50 mb-2" />
          <p className="text-2xl font-bold">GH₵ {totalFeesCollected.toLocaleString()}</p>
          <p className="text-green-100 text-sm">Collected</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <AlertCircle className="w-8 h-8 opacity-50 mb-2" />
          <p className="text-2xl font-bold">GH₵ {totalFeesOwed.toLocaleString()}</p>
          <p className="text-red-100 text-sm">Outstanding</p>
        </div>
      </div>

      {/* Students Fee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Student Fees - {selectedClass}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Fees</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">{student.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">GH₵ {student.totalFees.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600">GH₵ {student.feesPaid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                    GH₵ {Math.max(0, student.feesBalance).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      student.feeStatus === 'completed' ? 'bg-green-50 text-green-700' :
                      student.feeStatus === 'partial' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {student.feeStatus === 'completed' ? '✓ Completed' : student.feeStatus === 'partial' ? '◐ Partial' : '○ Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openPaymentForStudent(student.id)}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                        title="Record Payment"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1" />Pay
                      </button>
                      <button
                        onClick={() => openEditFees(student.id, student.totalFees)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Fees"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History for selected student */}
      {selectedStudent && studentPayments.length > 0 && !showPaymentModal && !showReceiptModal && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Payment History - {data.students.find(s => s.id === selectedStudent)?.name}
            </h3>
            <button onClick={() => setSelectedStudent('')} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Receipt #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Term</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {studentPayments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-blue-600 font-mono">{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.date}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">GH₵ {p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.term} - {p.academicYear}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewReceipt(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPayment(p);
                            setPaymentAmount(p.amount);
                            setPaymentTerm(p.term);
                            setPaymentYear(p.academicYear);
                            setShowPaymentModal(true);
                          }}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingPayment ? 'Edit Payment' : 'Record Payment'}
              </h3>
              <button onClick={() => { setShowPaymentModal(false); setEditingPayment(null); }} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                  {data.students.find(s => s.id === selectedStudent)?.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (GH₵)</label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select
                    value={paymentTerm}
                    onChange={e => setPaymentTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <select
                    value={paymentYear}
                    onChange={e => setPaymentYear(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {paymentAmount > 0 && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-medium">Amount in words:</p>
                  <p className="text-sm text-blue-800 italic">{numberToWords(paymentAmount)}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPaymentModal(false); setEditingPayment(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-green-800">
                  {editingPayment ? 'Update Payment' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fee Modal */}
      {showEditFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Edit Total Fees</h3>
              <button onClick={() => setShowEditFeeModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleEditFees} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                  {data.students.find(s => s.id === selectedStudent)?.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fees (GH₵)</label>
                <input
                  type="number"
                  value={editFeeAmount || ''}
                  onChange={e => setEditFeeAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditFeeModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700">
                  Update Fees
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Fee Receipt</h3>
              <div className="flex gap-2">
                <button onClick={handlePrintReceipt} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button onClick={() => setShowReceiptModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div ref={printRef} className="p-6">
              <div className="receipt" style={{ border: '2px solid #1e40af', padding: '24px', borderRadius: '8px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #1e40af', paddingBottom: '15px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e40af' }}>ALEYART ACADEMY</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Odorkor-Official Town | P.O. Box 4183 | Tel: 0553797233</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '12px', textDecoration: 'underline' }}>FEE PAYMENT RECEIPT</div>
                </div>

                {/* Details */}
                <div style={{ margin: '16px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ccc' }}>
                    <span style={{ fontWeight: 'bold' }}>Receipt No:</span>
                    <span>{selectedReceipt.receiptNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ccc' }}>
                    <span style={{ fontWeight: 'bold' }}>Date:</span>
                    <span>{selectedReceipt.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ccc' }}>
                    <span style={{ fontWeight: 'bold' }}>Student Name:</span>
                    <span>{selectedReceipt.studentName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ccc' }}>
                    <span style={{ fontWeight: 'bold' }}>Class:</span>
                    <span>{selectedReceipt.className}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ccc' }}>
                    <span style={{ fontWeight: 'bold' }}>Term / Year:</span>
                    <span>{selectedReceipt.term} - {selectedReceipt.academicYear}</span>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ background: '#eff6ff', border: '2px solid #1e40af', padding: '16px', margin: '20px 0', textAlign: 'center', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>AMOUNT PAID</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>GH₵ {selectedReceipt.amount.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
                    ({numberToWords(selectedReceipt.amount)})
                  </div>
                </div>

                {/* Signature */}
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '180px', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '12px' }}>
                    Received By
                  </div>
                  <div style={{ width: '180px', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '12px' }}>
                    School Stamp
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #eee', fontSize: '10px', color: '#999' }}>
                  This is a computer-generated receipt. Thank you for your payment.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
