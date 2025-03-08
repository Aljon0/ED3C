import React from 'react';

const alertStyles = {
  success: { 
    bg: 'bg-green-500', 
    text: 'text-white',
    border: 'border-green-600'
  },
  error: { 
    bg: 'bg-red-500', 
    text: 'text-white',
    border: 'border-red-600'
  },
  warning: { 
    bg: 'bg-yellow-500', 
    text: 'text-black',
    border: 'border-yellow-600'
  },
  default: {
    bg: 'bg-blue-500',
    text: 'text-white',
    border: 'border-blue-600'
  }
};

export const Alert = ({ 
  type = 'default', 
  message, 
  isOpen, 
  onClose, 
  duration = 3000 
}) => {
  const styles = alertStyles[type] || alertStyles.default;

  React.useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen || !message) return null;

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg
        ${styles.bg} ${styles.text} ${styles.border}
        transition-all duration-300 ease-in-out
        animate-bounce
      `}
    >
      <div className="flex items-center justify-between">
        <span className="mr-4">{message}</span>
        <button 
          onClick={onClose} 
          className="ml-2 focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};