import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Success notification with theme-matched styling
export const notifySuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    style: {
      background: '#2C3E50', // Dark slate-blue matching your theme
      color: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    progressStyle: {
      background: '#4CAF50' // Green progress bar for success
    },
    toastClassName: 'custom-toast',
  });
};

// Error notification with theme-matched styling
export const notifyError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    style: {
      background: '#2C3E50', // Dark slate-blue matching your theme
      color: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    progressStyle: {
      background: '#F44336' // Red progress bar for error
    },
    toastClassName: 'custom-toast',
  });
};

// Warning notification with theme-matched styling
export const notifyWarning = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    style: {
      background: '#2C3E50', // Dark slate-blue matching your theme
      color: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    progressStyle: {
      background: '#FFC107' // Yellow progress bar for warning
    },
    toastClassName: 'custom-toast',
  });
};