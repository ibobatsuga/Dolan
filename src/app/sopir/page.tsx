'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin, Phone, Fuel, Clock, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DriverAssignment, DriverProfile, FullBbmTerms, PackageType } from '@/lib/types';

interface DriverTask {
  assignment: DriverAssignment;
  bookingCode?: string;
  startAt?: string;
  endAt?: string;
  durationHours?: number;
  pickupLocationName?: string;
  renterName?: string;
  renterPhone?: string;
  packageType?: PackageType;
  packageSnapshot?: FullBbmTerms;
  vehicleName?: string;
  plateMasked?: string;
}

export default function DriverPage() {
  const [driverId, setDriverId] = useState('drv-bagus');
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [allDrivers, setAllDrivers] = useState<DriverProfile[]>([]);
  const [tasks, setTasks] = useState<DriverTask[]>([]);

  const loadTasks = useCallback(async () => {
    const res = await fetch(`/api/driver?driverId=${driverId}`);
    const json = (await res.json()) as {
      driver: DriverProfile;
      allDrivers: DriverProfile[];
      tasks: DriverTask[];
    };
    setDriver(json.driver);
    setAllDrivers(json.allDrivers);
    setTasks(json.tasks);
  }, [driverId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/driver?driverId=${driverId}`)
      .then((res) => res.json())
      .then(
        (json: {
          driver: DriverProfile;
          allDrivers: DriverProfile[];
          tasks: DriverTask[];
        }) => {
          if (!active) return;
          setDriver(json.driver);
          setAllDrivers(json.allDrivers);
          setTasks(json.tasks);
        }
      );
    return () => {
      active = false;
    };
  }, [driverId]);

  const updateStatus = async (assignmentId: string, status: DriverAssignment['status']) => {
    await fetch('/api/driver', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId, status }),
    });
    loadTasks();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3f1] text-[#14171f]">
      <Navbar theme="ledger" />

      <main className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="bg-white border border-[#e2e0dc] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[#5b616e]">
              Aplikasi Sopir Mitra • Akses Terbatas Jadwal Tugas (FR-MIT-09)
            </span>
            <h1 className="text-2xl font-semibold mt-0.5">
              Tugas Hari Ini — {driver?.name || 'Memuat...'}
            </h1>
            <p className="text-xs text-[#5b616e] mt-1">
              Data keuangan mitra disembunyikan dari layar sopir.
            </p>
          </div>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] text-sm font-medium"
          >
            {allDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white border border-[#e2e0dc] rounded-xl p-8 text-center">
            <p className="text-base font-medium mb-1">Belum ada tugas terjadwal untuk sopir ini</p>
            <p className="text-xs text-[#5b616e]">
              Mitra dapat menugaskan sopir dari halaman SaaS Mitra untuk booking mode dengan sopir / Full BBM.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.assignment.id}
                className="bg-white border border-[#e2e0dc] rounded-xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#efede9]">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#1d5fbf]">
                      {task.bookingCode}
                    </span>
                    <h2 className="text-lg font-semibold">
                      {task.vehicleName} ({task.plateMasked})
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#14171f] text-white text-xs font-semibold">
                    {task.assignment.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#1d5fbf] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-[#5b616e] block">Titik Jemput</span>
                      <span className="font-medium">{task.pickupLocationName}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#1d5fbf] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-[#5b616e] block">Jadwal ({task.durationHours} Jam)</span>
                      <span className="font-mono text-xs font-semibold">
                        {task.startAt &&
                          new Date(task.startAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                        →{' '}
                        {task.endAt &&
                          new Date(task.endAt).toLocaleString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-[#1d5fbf] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-[#5b616e] block">Kontak Tamu</span>
                      <span className="font-medium">
                        {task.renterName} • <span className="font-mono">{task.renterPhone}</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[#5b616e] block">Jeda Istirahat Wajib</span>
                    <span className="font-mono text-xs font-semibold">
                      Min. {task.assignment.minRestMinutes / 60} jam pasca-tugas
                    </span>
                  </div>
                </div>

                {task.packageType === 'FULL_BBM_DRIVER' && task.packageSnapshot && (
                  <div className="rounded-lg bg-[#f4f3f1] border border-[#e2e0dc] p-3.5 text-xs space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-[#1d5fbf]">
                      <Fuel className="w-4 h-4" /> Batas Paket Full BBM + Sopir (Wajib Diikuti)
                    </div>
                    <p>Wilayah: {task.packageSnapshot.wilayah}</p>
                    <p>Batas Maks: {task.packageSnapshot.maxKm} km</p>
                  </div>
                )}

                {/* Large outdoor touch targets per Bab 17 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {(
                    [
                      ['EN_ROUTE', 'Berangkat'],
                      ['ARRIVED', 'Tiba Jemput'],
                      ['IN_TRIP', 'Mulai Jalan'],
                      ['COMPLETED', 'Selesai'],
                    ] as const
                  ).map(([st, label]) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateStatus(task.assignment.id, st)}
                      className={`py-3 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                        task.assignment.status === st
                          ? 'bg-[#1d5fbf] text-white'
                          : 'bg-[#14171f] text-white hover:bg-[#2a2f3d]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
