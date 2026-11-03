/**
 * Utility functions for AaplaGaav Admin Panel Grievance Redressal
 * Handles unique 10-digit tracking ID extraction and exact/relative timestamps.
 */

export function getTrackingId(item) {
  if (!item) return '2026000001';
  
  if (item.tracking_id) {
    const clean = String(item.tracking_id).replace(/\D/g, '');
    if (clean.length === 10) return clean;
    return clean.padStart(10, '0').slice(-10);
  }
  
  if (item.description) {
    const match = item.description.match(/\[(?:ट्रॅकिंग आयडी|Tracking ID):\s*(\d+)\]/i);
    if (match && match[1]) {
      const idStr = match[1];
      if (idStr.length === 10) return idStr;
      if (idStr.length < 10) {
        return `20260000${idStr.padStart(2, '0')}`;
      }
      return idStr.slice(0, 10);
    }
  }

  // Fallback deterministic 10-digit ID derived from UUID
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

export function parseComplaintCategory(description, fallback = 'सामान्य') {
  if (!description) return fallback;
  const match = description.match(/\[(?:प्रकार|Category):\s*([^\]]+)\]/i);
  return match && match[1] ? match[1].trim() : fallback;
}

export function cleanComplaintDescription(description) {
  if (!description) return '';
  return description
    .replace(/\[(?:ट्रॅकिंग आयडी|Tracking ID):\s*[^\]]+\]/gi, '')
    .replace(/\[(?:प्रकार|Category):\s*[^\]]+\]/gi, '')
    .replace(/\[(?:ठिकाण|Location):\s*[^\]]+\]/gi, '')
    .trim();
}

export function formatComplaintDateTime(dateString, language = 'mr') {
  if (!dateString) {
    return {
      exact: language === 'en' ? 'Date unavailable' : 'तारीख उपलब्ध नाही',
      relative: '',
      display: language === 'en' ? 'Date unavailable' : 'तारीख उपलब्ध नाही',
    };
  }

  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return { exact: dateString, relative: '', display: dateString };
  }

  const dateStr = d.toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const exact = `${dateStr}, ${timeStr}`;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  if (language === 'en') {
    if (diffSec < 60) relative = 'Just now';
    else if (diffMin < 60) relative = `${diffMin} min ago`;
    else if (diffHours < 24) relative = `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'} ago`;
    else if (diffDays === 1) relative = '1 day ago';
    else relative = `${diffDays} days ago`;
  } else {
    if (diffSec < 60) relative = 'आत्ताच';
    else if (diffMin < 60) relative = `${diffMin} मिनिटांपूर्वी`;
    else if (diffHours < 24) relative = `${diffHours} ${diffHours === 1 ? 'तासापूर्वी' : 'तासांपूर्वी'}`;
    else if (diffDays === 1) relative = '१ दिवसापूर्वी';
    else relative = `${diffDays} दिवसांपूर्वी`;
  }

  const display = relative ? `${exact} (${relative})` : exact;

  return { exact, relative, display };
}

