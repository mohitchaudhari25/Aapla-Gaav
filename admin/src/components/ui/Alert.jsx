import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export default function Alert({ type = 'error', message, title, children, className = '' }) {
  const content = message || children;
  if (!content) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="flex-shrink-0" />;
      case 'warning': return <AlertTriangle size={18} className="flex-shrink-0" />;
      case 'info': return <Info size={18} className="flex-shrink-0" />;
      case 'error':
      default:
        return <AlertCircle size={18} className="flex-shrink-0" />;
    }
  };

  return (
    <div className={`alert alert-${type} ${className}`} role="alert">
      {getIcon()}
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '2px' }}>{title}</div>}
        <div>{content}</div>
      </div>
    </div>
  );
}
