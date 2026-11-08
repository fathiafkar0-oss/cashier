import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../api';
import toast from 'react-hot-toast';
import { Users, AlertTriangle, ArrowRight, Utensils, RefreshCw } from 'lucide-react';
import Ornament from '../../components/brand/Ornament';

export default function TableSelection() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await customerApi.get('/tables');
      if (res.data.success) {
        setTables(res.data.data);
      }
    } catch (err) {
      toast.error('Gagal memuat daftar meja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSelectTable = (table) => {
    if (table.status !== 'AVAILABLE') {
      toast.error(`Meja ${table.table_number} sedang digunakan.`);
      return;
    }
    setSelectedTable(table);
    setConfirmed(false);
    setIsModalOpen(true);
  };

  const handleProceedToMenu = () => {
    if (!confirmed) {
      toast.error('Anda wajib menyetujui pernyataan konfirmasi meja.');
      return;
    }
    localStorage.setItem('selected_table', JSON.stringify(selectedTable));
    setIsModalOpen(false);
    toast.success(`Meja ${selectedTable.table_number} dipilih. Selamat memesan!`);
    navigate('/menu');
  };

  return (
    <div className="theme-light flex min-h-screen flex-col bg-canvas text-ink">
      <header className="theme-dark relative bg-canvas text-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Utensils className="h-5 w-5 text-soft" />
            <span className="text-sm font-bold">MICRODINE</span>
          </div>
          <button
            onClick={fetchTables}
            className="grid h-10 w-10 place-items-center rounded-full text-soft transition hover:bg-raised hover:text-ink"
            title="Segarkan Meja"
            aria-label="Segarkan daftar meja"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mx-auto max-w-5xl px-5 pb-2 pt-10 sm:px-8 sm:pt-14">
          <h1 className="max-w-xl text-[2.625rem] font-extrabold leading-[1.05] tracking-normal sm:text-6xl">
            Anda duduk di meja mana?
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-soft">
            Pilih meja Anda, lalu pesan langsung dari HP tanpa perlu antre.
          </p>
        </div>

        <Ornament className="mx-auto max-w-5xl px-5 py-7 sm:px-8" />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-6 sm:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">Denah meja</h2>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1.5 text-success">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              Tersedia
            </span>
            <span className="flex items-center gap-1.5 text-faint">
              <span className="h-2.5 w-2.5 rounded-full border border-dashed border-faint" />
              Terisi
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-raised" />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-2xl bg-panel px-6 py-14 text-center">
            <p className="font-semibold">Daftar meja belum tersedia</p>
            <button onClick={fetchTables} className="mt-3 text-sm font-semibold text-accent-text underline underline-offset-4">
              Muat ulang meja
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tables.map((table) => (
              <TableTile key={table.id} table={table} onSelect={handleSelectTable} />
            ))}
          </div>
        )}
      </main>

      {/* Modal Dialog Konfirmasi Table Lock (Wajib Persyaratan Rubrik POS) */}
      {isModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex animate-fadeIn items-end justify-center bg-abyss/70 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-confirm-title"
            className="w-full max-w-md animate-slideUp rounded-t-3xl bg-panel p-6 sm:rounded-3xl sm:p-7"
          >
            <div className="mb-5 flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-xl font-extrabold text-on-accent">
                {selectedTable.table_number}
              </span>
              <div>
                <h3 id="table-confirm-title" className="text-xl font-bold tracking-tight">Perhatian</h3>
                <p className="text-sm text-soft">Konfirmasi Meja {selectedTable.table_number}</p>
              </div>
            </div>

            <p className="mb-2 text-sm leading-relaxed">
              Pastikan Anda sudah berada di meja yang benar, yaitu <strong>{selectedTable.table_number}</strong>.
            </p>
            <p className="mb-5 flex gap-2 text-sm leading-relaxed text-soft">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <span>
                Setelah transaksi dibuat, Anda <strong className="text-ink">tidak diperbolehkan berpindah meja</strong> selama transaksi berlangsung agar pesanan diantar dengan tepat.
              </span>
            </p>

            <label className="mb-6 flex cursor-pointer select-none items-start gap-3 rounded-xl bg-raised p-4 transition hover:bg-raised-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-abyss"
              />
              <span className="text-sm leading-normal">
                Saya sudah memastikan nomor meja saya benar dan tidak akan berpindah meja selama transaksi berlangsung.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-md border border-line-strong px-4 py-3.5 text-sm font-semibold transition hover:bg-raised"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!confirmed}
                onClick={handleProceedToMenu}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3.5 text-sm font-bold transition ${
                  confirmed
                    ? 'bg-accent text-on-accent hover:bg-accent-hover active:scale-95'
                    : 'cursor-not-allowed bg-raised text-faint'
                }`}
              >
                <span>Lanjutkan</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Meja dilihat dari atas: jumlah kursi mengikuti kapasitas meja. */
function TableTile({ table, onSelect }) {
  const isAvailable = table.status === 'AVAILABLE';
  const seats = Math.min(table.capacity || 0, 12);
  const topSeats = Math.ceil(seats / 2);
  const bottomSeats = seats - topSeats;
  const seatClass = isAvailable ? 'bg-periwinkle group-hover:bg-abyss' : 'bg-line';

  const renderSeats = (count) => (
    <div className="flex h-2 justify-center gap-1.5">
      {[...Array(count)].map((_, i) => (
        <span key={i} className={`h-2 w-6 max-w-[18%] rounded-full transition ${seatClass}`} />
      ))}
    </div>
  );

  return (
    <button
      disabled={!isAvailable}
      onClick={() => onSelect(table)}
      aria-label={`Meja ${table.table_number}, kapasitas ${table.capacity} orang, ${isAvailable ? 'tersedia' : 'terisi'}`}
      className={`group flex w-full flex-col gap-1.5 text-center ${isAvailable ? 'active:scale-95' : 'cursor-not-allowed'} transition-transform`}
    >
      {renderSeats(topSeats)}
      <div
        className={`flex h-24 flex-col items-center justify-center rounded-2xl transition ${
          isAvailable
            ? 'bg-panel group-hover:bg-abyss group-hover:text-timid'
            : 'border border-dashed border-line-strong text-faint'
        }`}
      >
        <span className="text-2xl font-extrabold tracking-tight">{table.table_number}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs font-medium opacity-75">
          <Users className="h-3.5 w-3.5" />
          {isAvailable ? `${table.capacity} orang` : 'Terisi'}
        </span>
      </div>
      {renderSeats(bottomSeats)}
    </button>
  );
}
