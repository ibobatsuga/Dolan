'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Navigation,
  Scale,
  Receipt,
  Globe,
  ScanText,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Booking,
  ClaimDispute,
  GeofenceEvent,
  GpsTelemetry,
  NotificationLog,
  OcrVerificationResult,
  PaymentLedgerEntry,
  Province,
  ProvinceStatus,
  VehicleListing,
} from '@/lib/types';

interface AdminOpsData {
  provinces: Province[];
  ocrQueue: OcrVerificationResult[];
  disputes: ClaimDispute[];
  ledger: PaymentLedgerEntry[];
  bookings: Booking[];
  vehicles: VehicleListing[];
  geofenceEvents: GeofenceEvent[];
  notifications: NotificationLog[];
  telemetry: { source: string; positions: GpsTelemetry[] };
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminOpsPage() {
  const [data, setData] = useState<AdminOpsData | null>(null);
  const [tab, setTab] = useState<'ocr' | 'gps' | 'disputes' | 'ledger' | 'provinces'>('provinces');
  const [msg, setMsg] = useState<string | null>(null);

  const loadAdmin = useCallback(async () => {
    const res = await fetch('/api/admin');
    const json = (await res.json()) as AdminOpsData;
    setData(json);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin')
      .then((res) => res.json() as Promise<AdminOpsData>)
      .then((json) => {
        if (active) setData(json);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleOcrDecision = async (ocrId: string, decision: 'VERIFIED' | 'REJECTED') => {
    await fetch('/api/ocr', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ocrId,
        decision,
        reason: decision === 'REJECTED' ? 'Foto SIM buram; mohon unggah ulang' : undefined,
        adminName: 'Admin Ops DIY #1',
      }),
    });
    setMsg(`Dokumen ${ocrId} diputuskan: ${decision}.`);
    loadAdmin();
  };

  const handleResolveDispute = async (
    disputeId: string,
    depositAction: 'RELEASE_FULL' | 'DEDUCT_PARTIAL' | 'HOLD_FULL',
    approvedAmount: number
  ) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'RESOLVE_DISPUTE',
        disputeId,
        depositAction,
        approvedAmount,
        decisionNote: `Keputusan admin (${depositAction}) berdasarkan bukti checklist dua pihak.`,
      }),
    });
    setMsg(`Tiket sengketa ${disputeId} diselesaikan (${depositAction}).`);
    loadAdmin();
  };

  const handleUpdateProvinceStatus = async (provinceId: string, status: ProvinceStatus) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_PROVINCE', provinceId, status }),
    });
    setMsg(`Status provinsi ${provinceId} diubah menjadi ${status} tanpa deploy.`);
    loadAdmin();
  };

  const handleUpdateRegionNumbers = async (
    provinceId: string,
    patch: { post6hBufferMinutes?: number; dpProportionPct?: number; platformCommissionPct?: number }
  ) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_PROVINCE', provinceId, configPatch: patch }),
    });
    setMsg(`Parameter aturan bisnis provinsi diperbarui live.`);
    loadAdmin();
  };

  const handleSimulateGeofenceAlert = async () => {
    // Simulate Brio passing outside DIY bounds to Solo/Boyolali via Traccar webhook
    await fetch('/api/webhooks/traccar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'TRACCAR-DIY-001',
        lat: -7.531,
        lng: 110.95,
        speedKmh: 65,
      }),
    });
    setMsg('Simulasi webhook Traccar terkirim: alert keluar geofence DIY tercatat.');
    loadAdmin();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3f1] text-[#14171f]">
      <Navbar theme="ledger" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white border border-[#e2e0dc] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[#5b616e]">
              Panel Operasional Dolan • Kontrol Multi-Provinsi, Verifikasi OCR, GPS Traccar & Escrow
            </span>
            <h1 className="text-2xl font-semibold mt-0.5">Admin & Kendali Platform</h1>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div>
              <span className="text-[#5b616e] block">Provinsi Aktif</span>
              <strong className="text-base">
                {data?.provinces.filter((p) => p.status === 'ACTIVE').length ?? 1} /{' '}
                {data?.provinces.length ?? 4}
              </strong>
            </div>
            <div>
              <span className="text-[#5b616e] block">Antrean OCR</span>
              <strong className="text-base text-[#1d5fbf]">
                {data?.ocrQueue.filter((o) => o.status === 'PENDING').length ?? 0}
              </strong>
            </div>
            <div>
              <span className="text-[#5b616e] block">Sengketa Terbuka</span>
              <strong className="text-base">
                {data?.disputes.filter((d) => d.status === 'OPEN').length ?? 0}
              </strong>
            </div>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-white border border-[#1d5fbf] text-xs font-medium text-[#14171f]">
            {msg}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 border-b border-[#e2e0dc] pb-3">
          {(
            [
              ['provinces', 'Infrastruktur Multi-Provinsi', Globe],
              ['ocr', 'Antrean Verifikasi OCR', ScanText],
              ['gps', 'Monitor GPS & Geofence', Navigation],
              ['disputes', 'Meja Sengketa & Escrow', Scale],
              ['ledger', 'Ledger & Rekonsiliasi', Receipt],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                tab === id
                  ? 'bg-[#14171f] text-white'
                  : 'bg-white border border-[#e2e0dc] text-[#4b505b]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: MULTI-PROVINCE INFRASTRUCTURE & CONFIG WITHOUT DEPLOY */}
        {tab === 'provinces' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(data?.provinces || []).map((prov) => (
              <div key={prov.id} className="bg-white border border-[#e2e0dc] rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-[#1d5fbf] font-semibold">
                      {prov.code} • /{prov.slug} • {prov.timezone}
                    </span>
                    <h2 className="text-lg font-semibold">{prov.name}</h2>
                    <p className="text-xs text-[#5b616e] mt-0.5">
                      Koridor: {prov.popularCorridors.join(', ')}
                    </p>
                  </div>
                  <select
                    value={prov.status}
                    onChange={(e) =>
                      handleUpdateProvinceStatus(prov.id, e.target.value as ProvinceStatus)
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] text-xs font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE (Publik)</option>
                    <option value="PILOT_READY">PILOT_READY</option>
                    <option value="EXPANSION_PLANNED">EXPANSION_PLANNED</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#efede9] text-xs">
                  <div>
                    <label className="block text-[#5b616e] mb-1">Paruh Jam 6j (mnt)</label>
                    <input
                      type="number"
                      defaultValue={prov.config.post6hBufferMinutes}
                      onBlur={(e) =>
                        handleUpdateRegionNumbers(prov.id, {
                          post6hBufferMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 rounded bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5b616e] mb-1">Proporsi DP (%)</label>
                    <input
                      type="number"
                      defaultValue={prov.config.dpProportionPct}
                      onBlur={(e) =>
                        handleUpdateRegionNumbers(prov.id, {
                          dpProportionPct: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 rounded bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5b616e] mb-1">Komisi (%)</label>
                    <input
                      type="number"
                      defaultValue={prov.config.platformCommissionPct}
                      onBlur={(e) =>
                        handleUpdateRegionNumbers(prov.id, {
                          platformCommissionPct: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 rounded bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#5b616e] font-mono flex flex-wrap justify-between gap-2 pt-1">
                  <span>
                    OSRM: Rp {prov.config.osrmRatePerKm}/km + Rp {prov.config.osrmRatePerMinute}/mnt
                  </span>
                  <span>
                    Jeda Sopir Min: {prov.config.driverMinRestMinutes / 60} jam • OCR ≥{' '}
                    {Math.round(prov.config.ocrAutoPassThreshold * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: OCR VERIFICATION QUEUE */}
        {tab === 'ocr' && (
          <div className="bg-white border border-[#e2e0dc] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#efede9]">
              <h2 className="text-base font-semibold">
                Antrean Verifikasi KTP & SIM A (Tesseract Pre-Check • Keputusan Akhir Manusia)
              </h2>
            </div>
            <div className="divide-y divide-[#efede9]">
              {(data?.ocrQueue || []).map((o) => (
                <div key={o.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{o.userName}</span>
                      <span className="px-2 py-0.5 rounded bg-[#f4f3f1] font-mono">{o.docType}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          o.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : o.status === 'REJECTED'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="font-mono text-[#5b616e]">
                      Ekstrak OCR: {o.extractedName} • {o.maskedNumber} • Akurasi{' '}
                      <strong>{Math.round(o.confidence * 100)}%</strong>
                      {o.needsManualReview && ' (Masuk wajib tinjau manual FR-ADM-09)'}
                    </p>
                  </div>
                  {o.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOcrDecision(o.id, 'VERIFIED')}
                        className="px-3 py-1.5 rounded-lg bg-[#14171f] text-white text-xs font-semibold cursor-pointer"
                      >
                        Setujui Dokumen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOcrDecision(o.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Tolak + Minta Ulang
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TRACCAR GPS & GEOFENCE */}
        {tab === 'gps' && (
          <div className="space-y-5">
            <div className="bg-white border border-[#e2e0dc] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">
                  Monitor Armada Ber-GPS Traccar ({data?.telemetry.source})
                </h2>
                <p className="text-xs text-[#5b616e]">
                  Keluar geofence memicu log & tiket operasional (bukan denda otomatis).
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimulateGeofenceAlert}
                className="px-3.5 py-2 rounded-lg bg-[#14171f] text-white text-xs font-semibold cursor-pointer"
              >
                Simulasi Alert Keluar Zona DIY
              </button>
            </div>

            <div className="bg-white border border-[#e2e0dc] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#1d5fbf]" /> Log Alert Geofence & Overdue
              </h3>
              {(data?.geofenceEvents || []).map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-lg bg-[#f4f3f1] text-xs flex justify-between gap-4">
                  <div>
                    <span className="font-mono font-semibold text-[#1d5fbf]">{ev.bookingCode}</span> •{' '}
                    <strong>{ev.eventType}</strong>
                    <p className="text-[#4b505b] mt-0.5">{ev.detail}</p>
                  </div>
                  <span className="font-mono text-[11px] shrink-0">
                    {new Date(ev.createdAt).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DISPUTES & ESCROW */}
        {tab === 'disputes' && (
          <div className="bg-white border border-[#e2e0dc] rounded-xl divide-y divide-[#efede9]">
            <div className="p-5">
              <h2 className="text-base font-semibold">
                Meja Sengketa & Pelepasan Escrow Deposit (FR-ADM-03 & FR-ADM-04)
              </h2>
            </div>
            {(data?.disputes || []).map((d) => (
              <div key={d.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#1d5fbf]">{d.bookingCode}</span>
                    <span className="px-2 py-0.5 rounded bg-[#f4f3f1] font-semibold">{d.category}</span>
                    <span className="px-2 py-0.5 rounded bg-[#f4f3f1]">{d.status}</span>
                  </div>
                  <p className="text-sm font-medium">{d.description}</p>
                  <p className="font-mono text-[#5b616e]">
                    Klaim diajukan: {formatRp(d.claimedAmount)}
                    {d.decisionNote && ` • Keputusan: ${d.decisionNote}`}
                  </p>
                </div>

                {d.status === 'OPEN' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolveDispute(d.id, 'RELEASE_FULL', 0)}
                      className="px-3 py-1.5 rounded-lg border border-[#d8d5cf] text-xs font-semibold cursor-pointer"
                    >
                      Lepas Penuh ke Penyewa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveDispute(d.id, 'DEDUCT_PARTIAL', d.claimedAmount)}
                      className="px-3 py-1.5 rounded-lg bg-[#14171f] text-white text-xs font-semibold cursor-pointer"
                    >
                      Potong {formatRp(d.claimedAmount)} & Lepas Sisa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: PAYMENT LEDGER */}
        {tab === 'ledger' && (
          <div className="bg-white border border-[#e2e0dc] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#efede9] flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1d5fbf]" /> Ledger Pembayaran Idempoten (FR-ADM-02)
              </h2>
              <span className="text-xs text-[#5b616e]">
                {data?.notifications.length ?? 0} log notifikasi WhatsApp Cloud API
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#e2e0dc] text-left text-[#5b616e]">
                    <th className="py-3 px-4 font-medium">Kode</th>
                    <th className="py-3 px-4 font-medium">Tipe</th>
                    <th className="py-3 px-4 font-medium">Gateway</th>
                    <th className="py-3 px-4 font-medium">Idempotency Key</th>
                    <th className="py-3 px-4 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efede9]">
                  {(data?.ledger || []).map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 px-4 font-mono font-semibold">{l.bookingCode}</td>
                      <td className="py-3 px-4">{l.type}</td>
                      <td className="py-3 px-4 font-mono">{l.gateway}</td>
                      <td className="py-3 px-4 font-mono text-[#5b616e]">{l.idempotencyKey}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                        {formatRp(l.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
