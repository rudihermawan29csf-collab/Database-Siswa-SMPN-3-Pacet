import React, { useState } from 'react';
import { Save, School, Calendar, Users, Lock, Check, UploadCloud, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { MOCK_STUDENTS } from '../services/mockData';

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'ACADEMIC' | 'USERS'>('IDENTITY');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Mock Data
  const [schoolData, setSchoolData] = useState({
      name: 'SMP Negeri 3 Pacet',
      npsn: '20502xxx',
      address: 'Jalan Raya Pacet No. 12',
      headmaster: 'Didik Sulistyo, M.M.Pd',
      nip: '19660518198901 1 002'
  });

  const [academicData, setAcademicData] = useState({
      year: '2024/2025',
      semester: '1',
      reportDate: '2024-12-20'
  });

  const handleSave = () => {
      alert("Pengaturan berhasil disimpan.");
  };

  const handleInitialSync = async () => {
      if(!window.confirm("Ini akan menimpa data di Google Sheets dengan Data Mockup lokal. Lanjutkan?")) return;
      
      setIsSyncing(true);
      const success = await api.syncInitialData(MOCK_STUDENTS);
      setIsSyncing(false);
      
      if (success) alert("Sinkronisasi Berhasil!");
      else alert("Sinkronisasi Gagal. Cek Console.");
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
      >
          <Icon className="w-4 h-4" />
          {label}
      </button>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in space-y-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Pengaturan Sistem</h2>
            <div className="flex gap-2">
                <button 
                    onClick={handleInitialSync} 
                    disabled={isSyncing}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                    {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                    Sync Data Awal
                </button>
                <button onClick={handleSave} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-transform active:scale-95">
                    <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="flex border-b border-gray-200">
                <TabButton id="IDENTITY" label="Identitas Sekolah" icon={School} />
                <TabButton id="ACADEMIC" label="Tahun Ajaran" icon={Calendar} />
                <TabButton id="USERS" label="Manajemen User" icon={Users} />
            </div>

            <div className="p-6 flex-1 overflow-auto">
                {activeTab === 'IDENTITY' && (
                    <div className="max-w-2xl space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Sekolah</label>
                                <input type="text" className="w-full p-2 border rounded-lg text-sm" value={schoolData.name} onChange={e => setSchoolData({...schoolData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NPSN</label>
                                <input type="text" className="w-full p-2 border rounded-lg text-sm" value={schoolData.npsn} onChange={e => setSchoolData({...schoolData, npsn: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat Lengkap</label>
                            <textarea className="w-full p-2 border rounded-lg text-sm" rows={3} value={schoolData.address} onChange={e => setSchoolData({...schoolData, address: e.target.value})} />
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-sm font-bold text-gray-800 mb-3">Data Kepala Sekolah</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kepala Sekolah</label>
                                    <input type="text" className="w-full p-2 border rounded-lg text-sm" value={schoolData.headmaster} onChange={e => setSchoolData({...schoolData, headmaster: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NIP</label>
                                    <input type="text" className="w-full p-2 border rounded-lg text-sm" value={schoolData.nip} onChange={e => setSchoolData({...schoolData, nip: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ACADEMIC' && (
                    <div className="max-w-xl space-y-4">
                         <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                             <p className="text-sm text-blue-800">Pengaturan ini mempengaruhi input nilai dan kop laporan pada seluruh sistem.</p>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahun Pelajaran Aktif</label>
                            <select className="w-full p-2 border rounded-lg text-sm" value={academicData.year} onChange={e => setAcademicData({...academicData, year: e.target.value})}>
                                <option>2023/2024</option>
                                <option>2024/2025</option>
                                <option>2025/2026</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semester Aktif</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="sem" checked={academicData.semester === '1'} onChange={() => setAcademicData({...academicData, semester: '1'})} />
                                    <span className="text-sm">Ganjil (1)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="sem" checked={academicData.semester === '2'} onChange={() => setAcademicData({...academicData, semester: '2'})} />
                                    <span className="text-sm">Genap (2)</span>
                                </label>
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Rapor</label>
                            <input type="date" className="w-full p-2 border rounded-lg text-sm" value={academicData.reportDate} onChange={e => setAcademicData({...academicData, reportDate: e.target.value})} />
                         </div>
                    </div>
                )}

                {activeTab === 'USERS' && (
                    <div className="space-y-4">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-sm font-bold text-gray-700">Akun Terdaftar</h3>
                             <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border">Reset Password Masal</button>
                         </div>
                         <table className="w-full text-left border-collapse text-sm">
                             <thead className="bg-gray-50 border-b">
                                 <tr>
                                     <th className="p-3">Username</th>
                                     <th className="p-3">Role</th>
                                     <th className="p-3">Status</th>
                                     <th className="p-3 text-right">Aksi</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr className="border-b">
                                     <td className="p-3">admin@smpn3pacet.sch.id</td>
                                     <td className="p-3"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">ADMIN</span></td>
                                     <td className="p-3 text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Aktif</td>
                                     <td className="p-3 text-right"><button className="text-blue-600 hover:underline text-xs">Ubah Password</button></td>
                                 </tr>
                                 <tr className="border-b">
                                     <td className="p-3">siswa (All Students)</td>
                                     <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">STUDENT</span></td>
                                     <td className="p-3 text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Aktif</td>
                                     <td className="p-3 text-right"><button className="text-blue-600 hover:underline text-xs">Reset Default</button></td>
                                 </tr>
                             </tbody>
                         </table>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default SettingsView;