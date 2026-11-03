import React from 'react';
import { useSettings } from '../../context/SettingsContext';

const STATUS_MAP = {
  // Received
  'प्राप्त': { mr: 'प्राप्त', en: 'Received', variant: 'badge-info' },
  'received': { mr: 'प्राप्त', en: 'Received', variant: 'badge-info' },
  'new': { mr: 'नवीन', en: 'New', variant: 'badge-info' },
  // In Progress
  'प्रक्रियेत': { mr: 'प्रक्रियेत', en: 'In Progress', variant: 'badge-warning' },
  'in progress': { mr: 'प्रक्रियेत', en: 'In Progress', variant: 'badge-warning' },
  'in_progress': { mr: 'प्रक्रियेत', en: 'In Progress', variant: 'badge-warning' },
  'pending': { mr: 'प्रलंबित', en: 'Pending', variant: 'badge-warning' },
  'draft': { mr: 'मसुदा', en: 'Draft', variant: 'badge-warning' },
  'मसुदा': { mr: 'मसुदा', en: 'Draft', variant: 'badge-warning' },
  'नियोजित': { mr: 'नियोजित', en: 'Planned', variant: 'badge-warning' },
  'planned': { mr: 'नियोजित', en: 'Planned', variant: 'badge-warning' },
  // Ongoing
  'चालू': { mr: 'चालू', en: 'Ongoing', variant: 'badge-info' },
  'ongoing': { mr: 'चालू', en: 'Ongoing', variant: 'badge-info' },
  // Resolved / Completed / Published
  'सोडवले': { mr: 'सोडवले', en: 'Resolved', variant: 'badge-success' },
  'resolved': { mr: 'सोडवले', en: 'Resolved', variant: 'badge-success' },
  'completed': { mr: 'पूर्ण', en: 'Completed', variant: 'badge-success' },
  'पूर्ण': { mr: 'पूर्ण', en: 'Completed', variant: 'badge-success' },
  'active': { mr: 'सक्रिय', en: 'Active', variant: 'badge-success' },
  'सक्रिय': { mr: 'सक्रिय', en: 'Active', variant: 'badge-success' },
  'published': { mr: 'प्रकाशित', en: 'Published', variant: 'badge-success' },
  'प्रकाशित': { mr: 'प्रकाशित', en: 'Published', variant: 'badge-success' },
  // Rejected / Failed
  'नाकारले': { mr: 'नाकारले', en: 'Rejected', variant: 'badge-error' },
  'rejected': { mr: 'नाकारले', en: 'Rejected', variant: 'badge-error' },
  'failed': { mr: 'अयशस्वी', en: 'Failed', variant: 'badge-error' },
  'cancelled': { mr: 'रद्द', en: 'Cancelled', variant: 'badge-error' },
  'रद्द': { mr: 'रद्द', en: 'Cancelled', variant: 'badge-error' },
  // Archived / Neutral
  'archived': { mr: 'संग्रहित', en: 'Archived', variant: 'badge-neutral' },
  'संग्रहित': { mr: 'संग्रहित', en: 'Archived', variant: 'badge-neutral' },
  'inactive': { mr: 'अक्रिय', en: 'Inactive', variant: 'badge-neutral' },
  'अक्रिय': { mr: 'अक्रिय', en: 'Inactive', variant: 'badge-neutral' },
  'verified': { mr: 'पडताळणी पूर्ण', en: 'Verified', variant: 'badge-success' },
  'पडताळणी पूर्ण': { mr: 'पडताळणी पूर्ण', en: 'Verified', variant: 'badge-success' },
  'admin': { mr: 'प्रशासक', en: 'Administrator', variant: 'badge-success' },
  'super_admin': { mr: 'मुख्य प्रशासक', en: 'Super Admin', variant: 'badge-success' },
};

export default function Badge({ status, label, children, variant }) {
  const { language } = useSettings();
  const rawText = label || children || status || '';
  const key = String(rawText).trim().toLowerCase();

  const mapped = STATUS_MAP[key];
  const displayText = mapped ? mapped[language] || mapped.mr : rawText;

  const getVariant = () => {
    if (variant) return `badge-${variant}`;
    if (mapped) return mapped.variant;
    return 'badge-neutral';
  };

  return (
    <span className={`badge ${getVariant()}`}>
      {displayText}
    </span>
  );
}
