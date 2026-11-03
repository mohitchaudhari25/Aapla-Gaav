/**
 * Utility functions for AaplaGaav Grievance Redressal (Complaint Management)
 * Handles unique 10-digit tracking ID generation, extraction, and relative/exact timestamps.
 */

/**
 * Extracts or generates a unique 10-digit Tracking ID from a complaint record.
 * Checks tracking_id column, description tag [ट्रॅकिंग आयडी: XXXXXXXXXX],
 * or generates a persistent deterministic 10-digit ID from the record UUID.
 */
export function getTrackingId(item) {
  if (!item) return '2026000001';
  
  // 1. Direct column if exists
  if (item.tracking_id) {
    const clean = String(item.tracking_id).replace(/\D/g, '');
    if (clean.length === 10) return clean;
    return clean.padStart(10, '0').slice(-10);
  }
  
  // 2. Tag in description [ट्रॅकिंग आयडी: 2026XXXXXX] or [Tracking ID: ...]
  if (item.description) {
    const match = item.description.match(/\[(?:ट्रॅकिंग आयडी|Tracking ID):\s*(\d+)\]/i);
    if (match && match[1]) {
      const idStr = match[1];
      if (idStr.length === 10) return idStr;
      if (idStr.length < 10) {
        // Normalize 2-digit legacy to 10-digit
        return `20260000${idStr.padStart(2, '0')}`;
      }
      return idStr.slice(0, 10);
    }
  }

  // 3. Fallback: derive deterministic 10-digit ID from UUID string
  if (item.id && typeof item.id === 'string') {
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
      hash = ((hash << 5) - hash) + item.id.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash) % 1000000;
    const sixDigits = String(positiveHash).padStart(6, '0');
    return `2026${sixDigits}`;
  }

  return '2026100001';
}
/**
 * Extracts or generates a clean 2-digit sequential or identifier ID (e.g. 01, 02)
 * As requested in notebook notes: specific two digit id.
 */
export function getTwoDigitId(item, index) {
  if (typeof index === 'number' && index >= 0) {
    return String(index + 1).padStart(2, '0');
  }
  if (!item) return '01';
  if (item.short_id) return String(item.short_id).padStart(2, '0');
  if (item.tracking_id) {
    const clean = String(item.tracking_id).replace(/\D/g, '');
    if (clean.length <= 2) return clean.padStart(2, '0');
    return clean.slice(-2);
  }
  if (item.description) {
    const match = item.description.match(/\[(?:ट्रॅकिंग आयडी|तक्रार आयडी|Complaint ID|ID):\s*(\d+)\]/i);
    if (match && match[1]) {
      return match[1].slice(-2).padStart(2, '0');
    }
  }
  if (item.id && typeof item.id === 'string') {
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
      hash = (hash * 31 + item.id.charCodeAt(i)) & 0xff;
    }
    const num = (Math.abs(hash) % 99) + 1;
    return String(num).padStart(2, '0');
  }
  return '01';
}


/**
 * Extracts category from complaint description tag [प्रकार: ...]
 */
export function parseComplaintCategory(description, fallback = 'सामान्य') {
  if (!description) return fallback;
  const match = description.match(/\[(?:प्रकार|Category):\s*([^\]]+)\]/i);
  return match && match[1] ? match[1].trim() : fallback;
}

/**
 * Strips metadata tags from description to display clean user text
 */
export function cleanComplaintDescription(description) {
  if (!description) return '';
  return description
    .replace(/\[(?:ट्रॅकिंग आयडी|Tracking ID):\s*[^\]]+\]/gi, '')
    .replace(/\[(?:प्रकार|Category):\s*[^\]]+\]/gi, '')
    .replace(/\[(?:ठिकाण|Location):\s*[^\]]+\]/gi, '')
    .trim();
}

/**
 * Generates an unused unique 10-digit Tracking ID based on existing complaints.
 * Format: 2026 + 6 random digits (e.g. 2026849201)
 */
export function generateUnique10DigitTrackingId(existingDescriptions = []) {
  const usedIds = new Set();

  for (const desc of existingDescriptions) {
    if (!desc) continue;
    const match = desc.match(/\[(?:ट्रॅकिंग आयडी|Tracking ID):\s*(\d+)\]/i);
    if (match && match[1]) {
      usedIds.add(match[1]);
    }
  }

  // Try generating unique 10-digit ID
  for (let attempt = 0; attempt < 50; attempt++) {
    const random6 = Math.floor(100000 + Math.random() * 900000);
    const candidateId = `2026${random6}`;
    if (!usedIds.has(candidateId)) {
      return candidateId;
    }
  }

  const timestampSuffix = String(Date.now()).slice(-6);
  return `2026${timestampSuffix}`;
}

/**
 * Formats complaint submission date into Exact Date/Time and Relative Time
 * E.g. Exact: "01 Nov 2026, 04:30 PM", Relative: "10 min ago"
 */
export function formatComplaintDateTime(dateString, lang = 'mr') {
  const isEn = lang === 'en';
  if (!dateString) {
    const noDate = isEn ? 'Date not available' : 'तारीख उपलब्ध नाही';
    return {
      exact: noDate,
      relative: '',
      display: noDate,
    };
  }

  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return { exact: dateString, relative: '', display: dateString };
  }

  // Exact Time: e.g. "01 Nov 2026, 04:30 PM"
  const dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const exact = `${dateStr}, ${timeStr}`;

  // Relative Time calculation:
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  if (isEn) {
    if (diffSec < 60) relative = 'Just now';
    else if (diffMin < 60) relative = `${diffMin} min ago`;
    else if (diffHours < 24) relative = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    else if (diffDays === 1) relative = '1 day ago';
    else relative = `${diffDays} days ago`;
  } else {
    if (diffSec < 60) relative = 'आत्ताच';
    else if (diffMin < 60) relative = `${diffMin} मिनिटांपूर्वी`;
    else if (diffHours < 24) relative = `${diffHours} ${diffHours === 1 ? 'तासापूर्वी' : 'तासांपूर्वी'}`;
    else if (diffDays === 1) relative = '१ दिवसापूर्वी';
    else relative = `${diffDays} दिवसांपूर्वी`;
  }

  const display = relative ? `${exact} • ${relative}` : exact;

  return { exact, relative, display };
}
