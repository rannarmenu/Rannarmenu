import { useEffect, useState } from 'react';
import { ChefHat, X } from 'lucide-react';
import './pwa-install.css';

const TOAST_DURATION_MS = 10_000;

export default function PWAInstallManager() {
  const [isVisible, setIsVisible] = useState(false);
  const baseUrl = import.meta.env.BASE_URL || '/';

  useEffect(() => {
    // Keep offline/PWA support, but never show an app-install/download prompt.
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker
        .register(`${baseUrl}sw.js`, { scope: baseUrl })
        .catch(() => {
          // The website remains usable if service-worker registration is unavailable.
        });
    }

    const currentPath = window.location.pathname.replace(/\\/+$/, '');
    if (currentPath.endsWith('/admin')) return undefined;

    setIsVisible(true);
    const hideTimer = window.setTimeout(() => setIsVisible(false), TOAST_DURATION_MS);
    return () => window.clearTimeout(hideTimer);
  }, [baseUrl]);

  if (!isVisible) return null;

  return (
    <div className="pwa-welcome-toast" role="status" aria-live="polite">
      <span className="pwa-welcome-toast-icon" aria-hidden="true">
        <ChefHat size={19} strokeWidth={1.9} />
      </span>
      <span className="pwa-welcome-toast-copy">
        <strong>Rannar Menu-তে স্বাগতম</strong>
        <small>আপনার পছন্দের রেসিপি খুঁজে নিন</small>
      </span>
      <button
        className="pwa-welcome-toast-close"
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="স্বাগত বার্তা বন্ধ করুন"
      >
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
