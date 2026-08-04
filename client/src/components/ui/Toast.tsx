import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 3500,
        style: {
          background: '#1e1e2e',
          color: '#e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#1e1e2e',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1e1e2e',
          },
        },
      }}
    />
  );
}
