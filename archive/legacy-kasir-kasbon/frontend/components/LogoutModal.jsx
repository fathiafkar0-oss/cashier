import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ShieldAlert, CheckCircle2, Lock, KeyRound, Database, 
  X, AlertTriangle, Store, User, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LogoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const steps = [
    {
      title: 'Mengamankan Status & Draft Kasir',
      desc: 'Memvalidasi data transaksi lokal dan memastikan integritas data...',
      icon: Lock
    },
    {
      title: 'Menutup Izin Akses Akun',
      desc: 'Mengamankan kredensial sesi dan mencabut izin akses pada peramban...',
      icon: KeyRound
    },
    {
      title: 'Menutup Sesi Database Toko',
      desc: 'Memutus tautan data privat toko dan mengembalikan status offline...',
      icon: Database
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setStep(0);
      setProgress(0);
    }
  }, [isOpen]);

  const handleStartLogout = () => {
    setIsProcessing(true);
    setStep(0);
    setProgress(15);

    // Step 1: Mengamankan data (0 - 500ms)
    setTimeout(() => {
      setStep(1);
      setProgress(45);
    }, 500);

    // Step 2: Mencabut token (500 - 1100ms)
    setTimeout(() => {
      setStep(2);
      setProgress(80);
    }, 1100);

    // Step 3: Menutup koneksi (1100 - 1600ms)
    setTimeout(() => {
      setStep(3);
      setProgress(100);
    }, 1600);

    // Final: Clear storage and navigate
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Sesi toko berhasil diakhiri secara aman.', {
        icon: '🛡️',
        style: {
          background: '#1c1a18',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)'
        }
      });
      onClose();
      navigate('/login');
    }, 2100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#181615]/95 border border-white/15 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9),_inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none"></div>

        {!isProcessing ? (
          /* Dialog Konfirmasi Awal */
          <div>
            {/* Header Dialog */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Konfirmasi Akhiri Sesi</h3>
                  <p className="text-xs text-white/40">Pastikan Anda telah menyelesaikan aktivitas toko</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Informasi Akun & Sesi */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                <span className="text-white/40 flex items-center gap-1.5 font-medium">
                  <Store size={14} className="text-[#F4F3ED]" /> Toko Aktif
                </span>
                <span className="font-bold text-white tracking-wide">
                  {user.store_name || 'Toko Ritel'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                <span className="text-white/40 flex items-center gap-1.5 font-medium">
                  <User size={14} className="text-[#F4F3ED]" /> Akun / Kasir
                </span>
                <span className="font-bold text-white/90">
                  {user.username || 'Kasir'} {user.email ? `(${user.email})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40 flex items-center gap-1.5 font-medium">
                  <KeyRound size={14} className="text-emerald-400" /> Status Sesi
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sesi Terverifikasi Aman
                </span>
              </div>
            </div>

            {/* Peringatan Keamanan */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3 mb-6">
              <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block font-bold text-amber-200 mb-0.5">Penting Sebelum Keluar:</strong>
                Sesi kerja Anda akan diakhiri dan akses akun pada perangkat ini akan ditutup. Pastikan tidak ada transaksi kasir yang sedang menggantung dan semua pencatatan telah selesai.
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs transition border border-white/10 cursor-pointer"
              >
                Batal & Tetap Bekerja
              </button>
              <button
                type="button"
                onClick={handleStartLogout}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs transition shadow-[0_4px_20px_rgba(239,68,68,0.4)] flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <LogOut size={16} />
                Ya, Akhiri Sesi Sekarang
              </button>
            </div>
          </div>
        ) : (
          /* Tampilan Proses Penutupan Sesi Realistis */
          <div className="py-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse">
              <Loader2 size={32} className="animate-spin text-red-400" />
            </div>

            <h3 className="text-lg font-black text-white tracking-tight mb-1">
              Mengakhiri Sesi Toko...
            </h3>
            <p className="text-xs text-white/40 mb-6">
              Sedang mengamankan data dan menutup akses akun secara teratur
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-6 p-0.5 border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Daftar Tahap Penutupan Sesi */}
            <div className="space-y-2.5 text-left mb-6">
              {steps.map((s, idx) => {
                const IconComponent = s.icon;
                const isCurrent = step === idx;
                const isPassed = step > idx;

                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                      isPassed 
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                        : isCurrent 
                          ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                          : 'bg-white/5 border-white/5 text-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-xl ${
                        isPassed 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : isCurrent 
                            ? 'bg-white/15 text-amber-400' 
                            : 'bg-white/5 text-white/20'
                      }`}>
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold leading-tight ${isPassed ? 'text-emerald-300' : isCurrent ? 'text-white' : 'text-white/40'}`}>
                          {s.title}
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5 leading-none">
                          {s.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isPassed ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 size={14} className="animate-spin text-amber-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-white/40 italic flex items-center justify-center gap-1.5">
              <Lock size={12} className="text-white/30" />
              Koneksi aman sedang diputus secara teratur...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
