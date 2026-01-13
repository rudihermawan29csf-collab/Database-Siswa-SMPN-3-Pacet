import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../types';
import { 
  CheckCircle2, XCircle, FileText, ChevronDown, Maximize2, AlertCircle, 
  User, Activity, BookOpen, MapPin, Users, Wallet, ExternalLink, Loader2,
  ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Minimize2, GripVertical, X, Save, Pencil
} from 'lucide-react';

interface VerificationViewProps {
  students: Student[];
  targetStudentId?: string;
  onUpdate?: () => void;
}

const DOCUMENT_TYPES = [
  { id: 'IJAZAH', label: 'Ijazah SD' },
  { id: 'AKTA', label: 'Akta Kelahiran' },
  { id: 'KK', label: 'Kartu Keluarga' },
  { id: 'KTP_AYAH', label: 'KTP Ayah' },
  { id: 'KTP_IBU', label: 'KTP Ibu' },
  { id: 'KIP', label: 'KIP / PKH' },
  { id: 'SKL', label: 'Surat Ket. Lulus' },
  { id: 'FOTO', label: 'Pas Foto' },
];

const VerificationView: React.FC<VerificationViewProps> = ({ students, targetStudentId, onUpdate }) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activeDocType, setActiveDocType] = useState<string>('IJAZAH');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); 
  const [layoutMode, setLayoutMode] = useState<'split' | 'full-doc' | 'full-data'>('split');
  const [activeDataTab, setActiveDataTab] = useState<string>('DAPO_PRIBADI');

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  // We manipulate the 'currentStudent' object directly in memory for this demo. 
  // In real app, you'd want a local copy of form state.

  // Logic States
  const [forceUpdate, setForceUpdate] = useState(0);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  // PDF States
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);

  const uniqueClasses = Array.from(new Set(students.map(s => s.className))).sort();
  const studentsInClass = students.filter(s => s.className === selectedClass);
  const currentStudent = students.find(s => s.id === selectedStudentId);
  const currentDoc = currentStudent?.documents.find(d => d.category === activeDocType);

  useEffect(() => { if (uniqueClasses.length > 0 && !selectedClass) setSelectedClass(uniqueClasses[0]); }, [uniqueClasses]);
  useEffect(() => { 
    if (targetStudentId) {
        const target = students.find(s => s.id === targetStudentId);
        if (target) { setSelectedClass(target.className); setSelectedStudentId(target.id); }
    } else if (studentsInClass.length > 0 && !selectedStudentId) { setSelectedStudentId(studentsInClass[0].id); }
  }, [targetStudentId, selectedClass, students]);

  useEffect(() => setZoomLevel(1.0), [selectedStudentId, activeDocType]);
  
  // Helper to update student data (mock)
  const handleDataChange = (path: string, value: string) => {
      if (!currentStudent) return;
      const keys = path.split('.');
      let current: any = currentStudent;
      for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      setForceUpdate(prev => prev + 1);
  };

  const FieldGroup = ({ label, value, path, fullWidth = false }: { label: string, value: string | number, path?: string, fullWidth?: boolean }) => (
    <div className={`mb-2 ${fullWidth ? 'w-full' : ''}`}>
      <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{label}</label>
      {isEditing && path ? (
          <input 
            type="text" 
            className="w-full p-1.5 bg-white border border-blue-300 rounded text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            value={value || ''}
            onChange={(e) => handleDataChange(path, e.target.value)}
          />
      ) : (
          <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-gray-900 text-xs font-medium break-words min-h-[30px] flex items-center">
            {(value !== null && value !== undefined && value !== '') ? value : '-'}
          </div>
      )}
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
      <div className="bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 uppercase border-y border-gray-200 mt-4 mb-2 first:mt-0">{title}</div>
  );

  // ... PDF Logic omitted for brevity (same as before) ...
  useEffect(() => {
    const loadPdf = async () => {
        setPdfDoc(null);
        setIsPdfLoading(false);
        if (!currentStudent || !currentDoc) return;
        if (currentDoc.type === 'PDF' || currentDoc.name.toLowerCase().endsWith('.pdf')) {
            setIsPdfLoading(true);
            try {
                // @ts-ignore
                const pdfjsLib = await import('pdfjs-dist');
                const pdfjs = pdfjsLib.default ? pdfjsLib.default : pdfjsLib;
                if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
                }

                const loadingTask = pdfjs.getDocument(currentDoc.url);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf); setNumPages(pdf.numPages); setIsPdfLoading(false);
            } catch (error) { setPdfError(true); setIsPdfLoading(false); }
        }
    };
    loadPdf();
  }, [currentStudent, activeDocType]);

  const handleApprove = () => { if (currentDoc) { currentDoc.status = 'APPROVED'; currentDoc.adminNote = 'Dokumen valid.'; setForceUpdate(prev => prev + 1); if (onUpdate) onUpdate(); } };
  const confirmReject = () => { if (currentDoc) { currentDoc.status = 'REVISION'; currentDoc.adminNote = rejectionNote; setRejectModalOpen(false); setForceUpdate(prev => prev + 1); if (onUpdate) onUpdate(); } };

  // --- RENDER TABS ---
  const renderDataTab = () => {
      if (!currentStudent) return null;
      switch(activeDataTab) {
          case 'DAPO_PRIBADI': return (
              <div className="space-y-1">
                  <SectionHeader title="Identitas Peserta Didik" />
                  <FieldGroup label="Nama Lengkap" value={currentStudent.fullName} path="fullName" fullWidth />
                  <div className="grid grid-cols-2 gap-2">
                      <FieldGroup label="NISN" value={currentStudent.nisn} path="nisn" />
                      <FieldGroup label="NIS" value={currentStudent.nis} path="nis" />
                  </div>
                  <FieldGroup label="Tempat Lahir" value={currentStudent.birthPlace} path="birthPlace" fullWidth />
                  <FieldGroup label="Tanggal Lahir" value={currentStudent.birthDate} path="birthDate" fullWidth />
                  <SectionHeader title="Data Akademik" />
                  <FieldGroup label="No Seri Ijazah" value={currentStudent.diplomaNumber} path="diplomaNumber" fullWidth />
                  <FieldGroup label="No Seri SKHUN" value={currentStudent.dapodik.skhun} path="dapodik.skhun" fullWidth />
              </div>
          );
          case 'DAPO_ALAMAT': return (
              <div className="space-y-1">
                  <SectionHeader title="Alamat" />
                  <FieldGroup label="Alamat Jalan" value={currentStudent.address} path="address" fullWidth />
                  <div className="grid grid-cols-2 gap-2">
                    <FieldGroup label="RT" value={currentStudent.dapodik.rt} path="dapodik.rt" />
                    <FieldGroup label="RW" value={currentStudent.dapodik.rw} path="dapodik.rw" />
                  </div>
                  <FieldGroup label="Dusun" value={currentStudent.dapodik.dusun} path="dapodik.dusun" />
                  <FieldGroup label="Desa/Kel" value={currentStudent.dapodik.kelurahan} path="dapodik.kelurahan" />
                  <FieldGroup label="Kecamatan" value={currentStudent.subDistrict} path="subDistrict" />
              </div>
          );
          case 'DAPO_ORTU': return (
              <div className="space-y-1">
                  <SectionHeader title="Ayah" />
                  <FieldGroup label="Nama Ayah" value={currentStudent.father.name} path="father.name" fullWidth />
                  <FieldGroup label="NIK Ayah" value={currentStudent.father.nik} path="father.nik" />
                  <SectionHeader title="Ibu" />
                  <FieldGroup label="Nama Ibu" value={currentStudent.mother.name} path="mother.name" fullWidth />
                  <FieldGroup label="NIK Ibu" value={currentStudent.mother.nik} path="mother.nik" />
              </div>
          );
           case 'DAPO_KIP': return (
              <div className="space-y-1">
                  <SectionHeader title="Kesejahteraan" />
                  <FieldGroup label="Penerima KIP" value={currentStudent.dapodik.kipReceiver} path="dapodik.kipReceiver" />
                  <FieldGroup label="Nomor KIP" value={currentStudent.dapodik.kipNumber} path="dapodik.kipNumber" />
                  <FieldGroup label="Nama di KIP" value={currentStudent.dapodik.kipName} path="dapodik.kipName" fullWidth />
              </div>
          );
          default: return null;
      }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
        {/* REJECT MODAL */}
        {rejectModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col">
                    <h3 className="font-bold text-red-600 mb-2">Tolak Dokumen</h3>
                    <textarea className="w-full p-2 border rounded text-sm mb-4" rows={3} value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} placeholder="Alasan..." />
                    <div className="flex justify-end gap-2"><button onClick={()=>setRejectModalOpen(false)} className="px-3 py-1 bg-gray-100 rounded">Batal</button><button onClick={confirmReject} className="px-3 py-1 bg-red-600 text-white rounded">Simpan</button></div>
                </div>
            </div>
        )}

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div className="flex gap-3 w-full lg:w-auto">
             <select className="pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>{uniqueClasses.map(c => <option key={c} value={c}>Kelas {c}</option>)}</select>
             <select className="pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium w-64" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>{studentsInClass.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select>
        </div>
        <div className="flex overflow-x-auto gap-1">{DOCUMENT_TYPES.map(type => {
            const doc = currentStudent?.documents.find(d => d.category === type.id);
            const color = doc?.status === 'APPROVED' ? 'text-green-600 bg-green-50' : doc?.status === 'REVISION' ? 'text-red-600 bg-red-50' : doc?.status === 'PENDING' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400';
            return <button key={type.id} onClick={() => setActiveDocType(type.id)} className={`px-3 py-1.5 rounded-md text-xs font-bold border ${activeDocType === type.id ? 'border-blue-500' : 'border-transparent'} ${color}`}>{type.label}</button>;
        })}</div>
      </div>

      {currentStudent ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden relative">
            {/* DATA PANE */}
            <div className={`bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm transition-all duration-300 ${layoutMode === 'full-doc' ? 'hidden' : 'w-full lg:w-96'}`}>
                <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> Data Buku Induk</h3>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                        {isEditing ? <><Save className="w-3 h-3" /> Selesai</> : <><Pencil className="w-3 h-3" /> Edit Data</>}
                    </button>
                </div>
                <div className="flex border-b border-gray-200">{['DAPO_PRIBADI', 'DAPO_ALAMAT', 'DAPO_ORTU', 'DAPO_KIP'].map(id => (
                    <button key={id} onClick={()=>setActiveDataTab(id)} className={`flex-1 py-2 text-[10px] font-bold border-b-2 ${activeDataTab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'}`}>{id.replace('DAPO_', '')}</button>
                ))}</div>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">{renderDataTab()}</div>
                    {currentDoc?.adminNote && <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-xs italic text-yellow-700">"Note: {currentDoc.adminNote}"</div>}
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
                    <button onClick={() => { setRejectionNote(''); setRejectModalOpen(true); }} disabled={!currentDoc} className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold disabled:opacity-50">Tolak</button>
                    <button onClick={handleApprove} disabled={!currentDoc} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">Setujui</button>
                </div>
            </div>

            {/* DOC VIEWER */}
            <div className={`flex flex-col bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${layoutMode === 'full-doc' ? 'w-full absolute inset-0 z-20' : 'flex-1 h-full'}`}>
                 <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 text-gray-300">
                     <span className="text-sm font-bold text-white">{currentDoc ? currentDoc.name : 'No Doc'}</span>
                     <div className="flex items-center gap-2">
                         <button onClick={()=>setZoomLevel(z=>z-0.2)} className="p-1 hover:bg-gray-700 rounded"><ZoomOut className="w-4 h-4" /></button>
                         <span className="text-xs">{Math.round(zoomLevel*100)}%</span>
                         <button onClick={()=>setZoomLevel(z=>z+0.2)} className="p-1 hover:bg-gray-700 rounded"><ZoomIn className="w-4 h-4" /></button>
                         <button onClick={()=>setLayoutMode(m=>m==='full-doc'?'split':'full-doc')} className="p-1 hover:bg-gray-700 rounded ml-2"><Maximize2 className="w-4 h-4" /></button>
                     </div>
                 </div>
                 <div className="flex-1 overflow-auto p-8 bg-gray-900/50 flex items-start justify-center">
                     {currentDoc ? (
                         <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
                             {currentDoc.type === 'IMAGE' ? <img src={currentDoc.url} className="max-w-full h-auto rounded" /> : <div className="bg-white p-10">PDF Viewer Placeholder</div>}
                         </div>
                     ) : <div className="text-gray-500 mt-20">Belum ada dokumen.</div>}
                 </div>
            </div>
        </div>
      ) : <div className="flex-1 flex items-center justify-center text-gray-400">Pilih siswa.</div>}
    </div>
  );
};

export default VerificationView;