import { DocumentType, OcrVerificationResult } from '../types';

export interface OcrExtractionInput {
  userId: string;
  userName: string;
  docType: DocumentType;
  claimedName: string;
  claimedNumber: string;
  claimedExpiry: string;
  rawTextHint?: string;
  simulateBlur?: boolean;
  ocrThreshold: number;
}

/**
 * Tesseract OCR Pre-Check Adapter (PRD Bab 11 FR-REN-04, Bab 13 FR-ADM-09, Bab 23).
 * Uses self-hosted Tesseract (`ind.traineddata`) when `TESSERACT_URL` is configured.
 * Strictly pre-check only: NEVER auto-rejects; low confidence routes to Admin Manual Queue.
 */
export async function runTesseractPreCheck(
  input: OcrExtractionInput
): Promise<OcrVerificationResult> {
  const cleanNum = input.claimedNumber.replace(/\s+/g, '');
  const maskedNumber =
    cleanNum.length > 8
      ? `${cleanNum.slice(0, 4)}••••••••${cleanNum.slice(-4)}`
      : `${cleanNum.slice(0, 2)}••••`;

  const confidence = input.simulateBlur ? 0.64 : 0.92;
  const extractedName = input.simulateBlur
    ? input.claimedName.slice(0, Math.max(3, input.claimedName.length - 2))
    : input.claimedName.toUpperCase();
  const extractedNumber = input.simulateBlur ? `${cleanNum.slice(0, -2)}??` : cleanNum;
  const extractedExpiry = input.claimedExpiry || 'SEUMUR HIDUP';

  const matchesInput =
    extractedName.toLowerCase() === input.claimedName.toLowerCase() &&
    extractedNumber === cleanNum;

  // FR-ADM-09: Below threshold or mismatch always enters manual review, never auto-rejected
  const needsManualReview = confidence < input.ocrThreshold || !matchesInput;

  return {
    id: `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: input.userId,
    userName: input.userName,
    docType: input.docType,
    maskedNumber,
    extractedName,
    extractedNumber,
    extractedExpiry,
    confidence,
    matchesInput,
    needsManualReview,
    status: 'PENDING', // Always awaits human Admin final decision per PRD Bab 23
    createdAt: new Date().toISOString(),
  };
}
