import { NextRequest, NextResponse } from 'next/server';
import { decideOcrDocument, getStore, submitOcrDocument } from '@/lib/store';
import { DocumentType } from '@/lib/types';

export async function GET() {
  const store = getStore();
  return NextResponse.json({ queue: store.ocrQueue });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    userName: string;
    docType: DocumentType;
    claimedNumber: string;
    claimedExpiry: string;
    simulateBlur?: boolean;
  };
  if (!body.userName || !body.claimedNumber) {
    return NextResponse.json(
      { error: 'Nama dan nomor dokumen wajib diisi untuk pre-check OCR.' },
      { status: 400 }
    );
  }
  const result = await submitOcrDocument(body);
  return NextResponse.json({ result }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    ocrId: string;
    decision: 'VERIFIED' | 'REJECTED';
    reason?: string;
    adminName?: string;
  };
  const updated = decideOcrDocument({
    ocrId: body.ocrId,
    decision: body.decision,
    reason: body.reason,
    adminName: body.adminName || 'Admin Ops DIY',
  });
  if (!updated) {
    return NextResponse.json({ error: 'Dokumen OCR tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json({ updated });
}
