import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  UserCheck, 
  ArrowUpDown, 
  Award,
  Upload,
  Download,
  FileSpreadsheet,
  FileDown,
  X,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StudentsList() {
  const { user } = useAuth();
  const isAdminOrSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const [students, setStudents] = useState([]);
  const [units, setUnits] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Aktif');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [showMutasiModal, setShowMutasiModal] = useState(null);
  const [mutasiStatus, setMutasiStatus] = useState('Naik Kelas');
  const [targetClassId, setTargetClassId] = useState('');

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editNis, setEditNis] = useState('');
  const [editNisn, setEditNisn] = useState('');
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('L');
  const [editUnitId, setEditUnitId] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState('Aktif');

  // New Student Form
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('L');
  const [unitId, setUnitId] = useState('');
  const [classId, setClassId] = useState('');
  const [parentFather, setParentFather] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  useEffect(() => {
    fetchInitialMaster();
    fetchStudents();
  }, [selectedUnit, selectedClass, selectedStatus]);

  const fetchInitialMaster = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        api.get('/master/units'),
        api.get('/master/classes')
      ]);
      if (uRes.data.success) setUnits(uRes.data.data);
      if (cRes.data.success) setClasses(cRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = `/master/students?status=${selectedStatus}`;
      if (selectedUnit) query += `&unit_id=${selectedUnit}`;
      if (selectedClass) query += `&class_id=${selectedClass}`;
      if (search) query += `&search=${search}`;

      const res = await api.get(query);
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // CREATE SINGLE STUDENT
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const pRes = await api.post('/master/parents', {
        father_name: parentFather || 'Wali Murid',
        phone: parentPhone || '081234567890'
      });

      const parentId = pRes.data.id;

      const res = await api.post('/master/students', {
        nis,
        nisn,
        name,
        gender,
        unit_id: unitId,
        class_id: classId,
        parent_id: parentId
      });

      if (res.data.success) {
        alert('Siswa baru berhasil ditambahkan!');
        setShowAddModal(false);
        setNis('');
        setNisn('');
        setName('');
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat siswa baru');
    }
  };

  // OPEN EDIT MODAL
  const handleOpenEditModal = (st) => {
    setEditingStudent(st);
    setEditNis(st.nis || '');
    setEditNisn(st.nisn || '');
    setEditName(st.name || '');
    setEditGender(st.gender || 'L');
    setEditUnitId(st.unit_id ? st.unit_id.toString() : '');
    setEditClassId(st.class_id ? st.class_id.toString() : '');
    setEditFatherName(st.father_name || '');
    setEditPhone(st.parent_phone || '');
    setEditStatus(st.status || 'Aktif');
  };

  // SAVE EDIT STUDENT
  const handleSaveEditStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await api.put(`/master/students/${editingStudent.id}`, {
        nis: editNis,
        nisn: editNisn,
        name: editName,
        gender: editGender,
        unit_id: editUnitId,
        class_id: editClassId,
        status: editStatus,
        father_name: editFatherName,
        phone: editPhone
      });

      if (res.data.success) {
        alert(res.data.message);
        setEditingStudent(null);
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui data siswa');
    }
  };

  // DELETE STUDENT
  const handleDeleteStudent = async (st) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data siswa "${st.name}" (NIS: ${st.nis}) beserta tagihannya?`)) {
      return;
    }

    try {
      const res = await api.delete(`/master/students/${st.id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus siswa');
    }
  };

  // MUTASI SISWA
  const handleMutasiStudent = async (e) => {
    e.preventDefault();
    if (!showMutasiModal) return;

    try {
      const res = await api.put(`/master/students/${showMutasiModal.id}/mutation`, {
        status: mutasiStatus === 'Naik Kelas' || mutasiStatus === 'Pindah Kelas' ? 'Aktif' : mutasiStatus,
        target_class_id: targetClassId || null
      });

      if (res.data.success) {
        alert(res.data.message);
        setShowMutasiModal(null);
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal proses mutasi siswa');
    }
  };

  // EXPORT SISWA KE FORMAT EXCEL (.XLSX)
  const handleExportExcel = () => {
    if (students.length === 0) {
      alert('Tidak ada data siswa untuk di-export.');
      return;
    }

    const exportData = students.map((st, idx) => ({
      'No': idx + 1,
      'NIS': st.nis,
      'NISN': st.nisn || '-',
      'Nama Siswa': st.name,
      'Jenis Kelamin': st.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
      'Unit Sekolah': st.unit_name,
      'Kelas': st.class_name,
      'Nama Orang Tua / Wali': st.father_name || 'Wali Murid',
      'No. WhatsApp Ortu': st.parent_phone || '-',
      'Status Siswa': st.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    XLSX.writeFile(workbook, `Data_Siswa_Cendekia_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // DOWNLOAD TEMPLATE IMPORT EXCEL (.XLSX)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NIS': '2026029001',
        'NISN': '0098765432',
        'Nama Siswa': 'Ahmad Fauzi',
        'Jenis Kelamin (L/P)': 'L',
        'Unit (KBTK/SDIT)': 'SDIT Cendekia',
        'Nama Kelas': 'Kelas 1 Umar',
        'Nama Orang Tua': 'Bpk. Hendra',
        'No WA Ortu': '081234567890'
      },
      {
        'NIS': '2026029002',
        'NISN': '0098765433',
        'Nama Siswa': 'Siti Nurhaliza',
        'Jenis Kelamin (L/P)': 'P',
        'Unit (KBTK/SDIT)': 'SDIT Cendekia',
        'Nama Kelas': 'Kelas 1 Umar',
        'Nama Orang Tua': 'Bpk. Slamet',
        'No WA Ortu': '081234567891'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import Siswa');

    XLSX.writeFile(workbook, 'Template_Import_Siswa_Cendekia.xlsx');
  };

  // BATCH IMPORT EXCEL FILE (.XLSX)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const parsedStudents = rawData.map(row => ({
          nis: (row['NIS'] || row['nis'] || '').toString().trim(),
          nisn: (row['NISN'] || row['nisn'] || '').toString().trim(),
          name: (row['Nama Siswa'] || row['Nama'] || row['name'] || '').toString().trim(),
          gender: (row['Jenis Kelamin (L/P)'] || row['Jenis Kelamin'] || row['L/P'] || 'L').toString().toUpperCase().startsWith('P') ? 'P' : 'L',
          unit_name: (row['Unit (KBTK/SDIT)'] || row['Unit'] || '').toString().trim(),
          class_name: (row['Nama Kelas'] || row['Kelas'] || '').toString().trim(),
          father_name: (row['Nama Orang Tua'] || row['Orang Tua'] || '').toString().trim(),
          parent_phone: (row['No WA Ortu'] || row['No WA'] || '').toString().trim()
        }));

        setImportLoading(true);
        const res = await api.post('/master/students/batch-import', { students: parsedStudents });
        if (res.data.success) {
          alert(res.data.message);
          setShowImportModal(false);
          fetchStudents();
        }
      } catch (err) {
        console.error(err);
        alert('Gagal membaca/mengimport file Excel: ' + (err.response?.data?.error || err.message));
      } finally {
        setImportLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Data Siswa (CRUD)</h1>
          <p className="text-xs text-slate-500">Tambah, Edit, Hapus, Mutasi Alumni &amp; Import/Export Excel (.xlsx)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          {isAdminOrSuperAdmin && (
            <>
              {/* Import Excel Button */}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel (.xlsx)</span>
              </button>

              {/* Add Student Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nama / NIS / NISN..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedUnit}
            onChange={(e) => {
              setSelectedUnit(e.target.value);
              setSelectedClass('');
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">Semua Unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="">Semua Kelas</option>
            {classes.filter(c => !selectedUnit || c.unit_id === parseInt(selectedUnit)).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {['Aktif', 'Lulus', 'Pindah', 'Keluar'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedStatus === st
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Memuat data siswa...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Tidak ada siswa ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">NIS / NISN</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">Jenjang &amp; Kelas</th>
                  <th className="py-3 px-4">Orang Tua / No. WA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi (Edit / Mutasi / Hapus)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {st.nis}
                      {st.nisn && <span className="block text-[10px] text-slate-400 font-mono">NISN: {st.nisn}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{st.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        st.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {st.gender}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{st.class_name}</div>
                      <div className="text-[11px] text-slate-400">{st.unit_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{st.father_name || 'Wali Murid'}</div>
                      <div className="text-[11px] text-emerald-600 font-mono">{st.parent_phone || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        st.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.status === 'Lulus'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isAdminOrSuperAdmin && (
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            title="Edit Data Siswa"
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300 text-xs inline-flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-600" />
                            <span>Edit</span>
                          </button>

                          {/* Mutasi Button */}
                          <button
                            onClick={() => setShowMutasiModal(st)}
                            title="Mutasi Status / Kelas"
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 text-xs inline-flex items-center gap-1"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                            <span>Mutasi</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteStudent(st)}
                            title="Hapus Siswa"
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-all text-xs font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL EDIT DATA SISWA */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Edit Data Siswa</h3>
              <button onClick={() => setEditingStudent(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIS</label>
                  <input
                    type="text"
                    required
                    value={editNis}
                    onChange={(e) => setEditNis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NISN</label>
                  <input
                    type="text"
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Siswa</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Pindah">Pindah</option>
                    <option value="Keluar">Keluar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Sekolah</label>
                  <select
                    required
                    value={editUnitId}
                    onChange={(e) => {
                      setEditUnitId(e.target.value);
                      setEditClassId('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">Pilih Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kelas</label>
                  <select
                    required
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.filter(c => !editUnitId || c.unit_id === parseInt(editUnitId)).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={editFatherName}
                    onChange={(e) => setEditFatherName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. WA Orang Tua</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT SISWA EXCEL (.XLSX) */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Import Data Siswa (.xlsx)</h3>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <FileDown className="w-4 h-4 text-emerald-600" />
                  Template Format Excel Khusus
                </p>
                <p className="text-slate-600 text-[11px]">
                  Unduh template format Excel (.xlsx) untuk mengisi data NIS, Nama, Jenis Kelamin, Kelas, dan Kontak Orang Tua.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl shadow-xs inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template Excel (.xlsx)</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Pilih File Excel (.xlsx / .xls):</label>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={importLoading}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
                {importLoading && (
                  <p className="text-xs font-bold text-amber-600 animate-pulse pt-1">
                    Sedang memproses &amp; meng-import data siswa...
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SISWA MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Tambah Siswa Baru</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">NIS (Nomor Induk Siswa)</label>
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 202601099"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">NISN (Opsional)</label>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 0098765432"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Siswa"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Sekolah</label>
                  <select
                    required
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">Pilih Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Kelas</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">Pilih Kelas</option>
                  {classes.filter(c => !unitId || c.unit_id === parseInt(unitId)).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Wali Murid</label>
                  <input
                    type="text"
                    value={parentFather}
                    onChange={(e) => setParentFather(e.target.value)}
                    placeholder="Bpk. Hendra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No WA Orang Tua</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MUTASI SISWA */}
      {showMutasiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
              Proses Mutasi Siswa: <span className="text-emerald-700">{showMutasiModal.name}</span>
            </h3>
            <form onSubmit={handleMutasiStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis Mutasi / Perubahan Status</label>
                <select
                  value={mutasiStatus}
                  onChange={(e) => setMutasiStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Naik Kelas">Naik Kelas (Pindah Kelas Baru)</option>
                  <option value="Pindah Kelas">Pindah Paralel Kelas</option>
                  <option value="Lulus">Lulus (Alumni)</option>
                  <option value="Pindah">Pindah Sekolah (Keluar)</option>
                  <option value="Keluar">Keluar / DO</option>
                </select>
              </div>

              {(mutasiStatus === 'Naik Kelas' || mutasiStatus === 'Pindah Kelas') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Kelas Tujuan Baru</label>
                  <select
                    required
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="">Pilih Kelas Tujuan</option>
                    {classes.filter(c => c.unit_id === showMutasiModal.unit_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMutasiModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Proses Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
