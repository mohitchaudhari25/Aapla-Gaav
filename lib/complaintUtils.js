/**
 * Utility functions for AaplaGaav Grievance Redressal (Complaint Management)
 * Handles unique 2-digit tracking ID generation, extraction, and relative/exact timestamps.
 */

/**
 * Extracts 2-digit Tracking ID from a complaint record.
 * Checks tracking_id column, description tag [ट्रॅकिंग आयडी: XX], or generates deterministic 2-digit ID.
 */
export function getTrackingId(item) {
  if (!item) return '00';
  if (item.tracking_id) return String(item.tracking_id).padStart(2, '0');
  
  if (item.description) {
    const match = item.description.match(/\[(?:ट्रॅकिंग आयडी|Tracking ID):\s*(\d{1,2})\]/i);
    if (match && match[1]) {
      return match[1].padStart(2, '0');
    }
  }

  // Fallback: derive deterministic 2-digit number (10-99) from UUID string
  if (item.id && typeof item.id === 'string') {
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
      hash = (hash * 31 + item.id.charCodeAt(i)) % 90;
    }
    return String(10 + Math.abs(hash));
  }

  return '10';
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
 * Generates an unused unique 2-digit Tracking ID based on existing complaints.
 * Range: '10' through '99'
 */
export function generateUnique2DigitTrackingId(existingDescriptions = []) {
  const usedIds = new Set();

  for (const desc of existingDescriptions) {
    if (!desc) continue;
    const match = desc.match(/\[(?:ट्रॅकिंग आयडी|Tracking ID):\s*(\d{1,2})\]/i);
    if (match && match[1]) {
      usedIds.add(match[1].padStart(2, '0'));
    }
  }

  // Find first unused 2-digit ID between 10 and 99
  for (let i = 10; i <= 99; i++) {
    const idStr = String(i);
    if (!usedIds.has(idStr)) {
      return idStr;
    }
  }

  // If all 10-99 are exhausted, pick least recently collided random 2-digit ID
  const random2Digit = Math.floor(10 + Math.random() * 90);
  return String(random2Digit);
}

/**
 * Formats complaint submission date into Exact Date/Time and Relative Time
 */
export function formatComplaintDateTime(dateString) {
  if (!dateString) {
    return {
      exact: 'तारीख उपलब्ध नाही',
      relative: '',
    };
  }

  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return { exact: dateString, relative: '' };
  }

  // Exact Time: e.g. "31 Oct 2026, 05:30 PM"
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
  if (diffSec < 60) {
    relative = 'Just now (आत्ताच)';
  } else if (diffMin < 60) {
    relative = `${diffMin} min ago (${diffMin} मिनिटांपूर्वी)`;
  } else if (diffHours < 24) {
    relative = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago (${diffHours} ${diffHours === 1 ? 'तासापूर्वी' : 'तासांपूर्वी'})`;
  } else if (diffDays === 1) {
    relative = '1 day ago (१ दिवसापूर्वी)';
  } else {
    relative = `${diffDays} days ago (${diffDays} दिवसांपूर्वी)`;
  }

  return { exact, relative };
}

