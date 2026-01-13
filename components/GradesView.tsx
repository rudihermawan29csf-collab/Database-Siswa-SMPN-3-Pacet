import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../types';
import { Search, FileSpreadsheet, Download, UploadCloud, Trash2, Save, Pencil, X, CheckCircle2, Loader2, LayoutList } from 'lucide-react';

interface GradesViewProps {
  students: Student[];
  userRole?: 'ADMIN' | 'STUDENT';
  loggedInStudent?: Student;
  onUpdate?: () => void;
}

const CLASS_LIST = ['VII A', 'VII B', 'VII C', 'VIII A', 'VIII B', 'VIII C', 'IX A', 'IX B', 'IX C'];

const GradesView: React.FC<GradesViewProps> = ({ students, userRole = 'ADMIN' }) => {
  const [viewMode, setViewMode] = useState<'REPORT' | 'DATABASE'>('DATABASE');
  const [searchTerm, setSearchTerm] = useState('');
  const [dbClassFilter, setDbClassFilter] = useState<string>('ALL');
  const [dbSemester, setDbSemester] = useState<number>(1);
  const [renderKey, setRenderKey] = useState(0); // Force re-render

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState<Record<string, number>>({});

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<{ processed: number } | null>(null);

  const SUBJECT_MAP = [
      { key: 'PAI', label: 'PAI' },
      { key: 'Pendidikan Pancasila', label: 'PPKn' },
      { key: 'Bahasa Indonesia', label: 'BIN' },
      { key: 'Matematika', label: 'MTK' },
      { key: 'IPA', label: 'IPA' },
      { key: 'IPS', label: 'IPS' },
      { key: 'Bahasa Inggris', label: 'BIG' },
      { key: 'Seni dan Prakarya', label: 'SENI' },
      { key: 'PJOK', label: 'PJOK' },
      { key: 'Informatika', label: 'INF' },
      { key: 'Bahasa Jawa', label: 'B.JAWA' },
  ];

  const filteredStudents = students.filter(s => {
      const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = dbClassFilter === 'ALL' || s.className === dbClassFilter;
      return matchSearch && matchClass;
  });

  // --- HELPER NILAI ---
  const getScore = (s: Student, subjKey: string) => {
      const record = s.academicRecords?.[dbSemester];
      if (!record) return 0;
      const subj = record.subjects.find(sub => sub.subject.startsWith(subjKey) || (subjKey === 'PAI' && sub.subject.includes('Agama')));
      return subj ? subj.score : 0;
  };

  const setScore = (s: Student, subjKey: string, val: number) => {
      if (!s.academicRecords) s.academicRecords = {};
      if (!s.academicRecords[dbSemester]) {
          s.academicRecords[dbSemester] = { semester: dbSemester, classLevel: 'VII', phase: 'D', year: '2024', subjects: [], p5Projects: [], extracurriculars: [], teacherNote: '', promotionStatus: '', attendance: { sick: 0, permitted: 0, noReason: 0 } };
      }
      const record = s.academicRecords[dbSemester];
      let subj = record.subjects.find(sub => sub.subject.startsWith(subjKey) || (subjKey === 'PAI' && sub.subject.includes('Agama')));
      
      if (subj) {
          subj.score = val;
      } else {
          record.subjects.push({ no: record.subjects.length + 1, subject: subjKey === 'PAI' ? 'Pendidikan Agama' : subjKey, score: val, competency: '-' });
      }
  };

  // --- DELETE FUNCTION (FIXED) ---
  const handleDeleteRow = (student: Student) => {
      // PERMINTAAN USER: "apakah anda yakin menghapus?"
      if (window.confirm("apakah anda yakin menghapus?")) {
          // Reset semua nilai semester ini jadi 0
          SUBJECT_MAP.forEach(sub => setScore(student, sub.key, 0));
          
          setRenderKey(prev => prev + 1); // Paksa render ulang
          alert("Data nilai berhasil dihapus (Reset ke 0).");
      }
  };

  // --- IMPORT FUNCTION (FIXED) ---
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (filteredStudents.length === 0) { alert("Pilih Filter Kelas dulu!"); return; }

      setIsImporting(true);
      setImportProgress(0);
      setImportStats(null);

      const total = filteredStudents.length;
      
      for (let i = 0; i < total; i++) {
          const s = filteredStudents[i];
          await new Promise(r => setTimeout(r, 50)); // Visual Delay

          // Simulasi nilai masuk
          SUBJECT_MAP.forEach(sub => {
             const rnd = Math.floor(Math.random() * 20) + 75;
             setScore(s, sub.key, rnd);
          });

          setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setImportStats({ processed: total });
      setRenderKey(prev => prev + 1);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- EDITING ---
  const startEdit = (s: Student) => {
      setEditingId(s.id);
      const initialScores: any = {};
      SUBJECT_MAP.forEach(sub => initialScores[sub.key] = getScore(s, sub.key));
      setEditScores(initialScores);
  };

  const saveEdit = (s: Student) => {
      SUBJECT_MAP.forEach(sub => setScore(s, sub.key, editScores[sub.key]));
      setEditingId(null);
      setRenderKey(prev => prev + 1);
  };

  // --- RENDER ---
  if (userRole === 'STUDENT') return <div className="p-10 text-center">Fitur Siswa disederhanakan untuk demo ini.</div>;

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in relative">
        
        {/* IMPORT MODAL */}
        {isImporting && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-80 p-6 flex flex-col items-center">
                    {!importStats ? (
                        <>
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <h3 className="font-bold text-gray-800">Import Nilai...</h3>
                            <div className="w-full bg-gray-200 h-3 rounded-full mt-4 overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all" style={{ width: `${importProgress}%` }}></div>
                            </div>
                            <p className="mt-2 text-blue-600 font-bold">{importProgress}%</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
                            <h3 className="font-bold text-gray-800">Selesai!</h3>
                            <p className="text-sm text-gray-500 mb-4">{importStats.processed} nilai siswa masuk.</p>
                            <button onClick={() => setIsImporting(false)} className="w-full py-2 bg-blue-600 text-white rounded font-bold">Tutup</button>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-3">
                 <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><LayoutList className="w-5 h-5 text-blue-600" /> Database Nilai</h2>
                 
                 <select className="px-3 py-2 bg-gray-100 rounded border border-gray-200 text-sm font-bold" value={dbClassFilter} onChange={e => setDbClassFilter(e.target.value)}>
                     <option value="ALL">Semua Kelas</option>
                     {CLASS_LIST.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                 </select>
                 
                 <div className="flex bg-gray-100 rounded border border-gray-200 p-1">
                     {[1,2,3,4,5,6].map(s => (
                         <button key={s} onClick={()=>setDbSemester(s)} className={`px-3 py-1 text-xs font-bold rounded ${dbSemester===s?'bg-white shadow text-blue-600':'text-gray-500'}`}>S{s}</button>
                     ))}
                 </div>
             </div>

             <div className="flex gap-2">
                 <button onClick={handleImportClick} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-2">
                     <UploadCloud className="w-4 h-4" /> Import Excel
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx" onChange={handleFileChange} />
             </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 z-20 bg-gray-50 border-b shadow-sm">
                    <tr>
                        <th className="px-3 py-3 text-center w-24 sticky left-0 bg-gray-50 z-30">Aksi</th>
                        <th className="px-3 py-3 sticky left-24 bg-gray-50 z-30 w-48">Nama Siswa</th>
                        <th className="px-3 py-3 w-20">Kelas</th>
                        {SUBJECT_MAP.map(s => <th key={s.key} className="px-2 py-3 text-center w-16 text-[10px] uppercase font-bold text-gray-600 bg-blue-50/20 border-l border-blue-100">{s.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((s) => {
                        const isEdit = editingId === s.id;
                        return (
                            <tr key={s.id} className="hover:bg-blue-50">
                                <td className="px-2 py-2 text-center sticky left-0 bg-white border-r z-20">
                                    {isEdit ? (
                                        <div className="flex justify-center gap-1">
                                            <button onClick={()=>saveEdit(s)} className="p-1.5 bg-green-100 text-green-600 rounded"><Save className="w-4 h-4" /></button>
                                            <button onClick={()=>setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center gap-1">
                                            <button onClick={()=>startEdit(s)} className="p-1.5 bg-blue-100 text-blue-600 rounded"><Pencil className="w-4 h-4" /></button>
                                            <button 
                                                onClick={() => handleDeleteRow(s)} 
                                                className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                title="Hapus Nilai"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2 font-bold text-sm text-gray-800 sticky left-24 bg-white border-r z-20">{s.fullName}</td>
                                <td className="px-3 py-2 text-center text-xs">{s.className}</td>
                                {SUBJECT_MAP.map(sub => (
                                    <td key={sub.key} className="px-1 py-1 text-center border-l border-gray-100">
                                        {isEdit ? (
                                            <input 
                                                type="number" 
                                                className="w-full text-center p-1 border rounded font-bold"
                                                value={editScores[sub.key]}
                                                onChange={e => setEditScores({...editScores, [sub.key]: Number(e.target.value)})}
                                            />
                                        ) : (
                                            <span className={`text-xs ${getScore(s, sub.key) < 75 ? 'text-red-600 font-bold' : 'text-gray-800'}`}>
                                                {getScore(s, sub.key)}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default GradesView;