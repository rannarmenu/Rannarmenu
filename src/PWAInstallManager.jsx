import { useEffect, useState } from 'react';
import { ChefHat, X } from 'lucide-react';
import './pwa-install.css';

const TOAST_DURATION_MS = 10_000;

export default function PWAInstallManager() {
  const [isVisible, setIsVisible] = useState(false);
  const baseUrl = import.meta.env.BASE_URL || '/';

  useEffect(() => {
    // Install the new local-Mira service worker and refresh any tab it takes control of.
    // The versioned URL prompts installed PWAs to fetch this service worker immediately.
    const serviceWorkerVersion = 'local-mira-20261022';
    const serviceWorkerUrl = `${baseUrl}sw.js?v=${serviceWorkerVersion}`;
    const handleControllerChange = () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller || !controller.scriptURL.includes(`v=${serviceWorkerVersion}`)) return;
      try {
        const reloadKey = `rannar-menu-sw-reloaded-${serviceWorkerVersion}`;
        if (window.sessionStorage.getItem(reloadKey) === '1') return;
        window.sessionStorage.setItem(reloadKey, '1');
      } catch {
        // Storage is optional; the controller change itself only fires when a worker takes control.
      }
      window.location.reload();
    };

    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker
        .register(serviceWorkerUrl, { scope: baseUrl })
        .then(registration => registration.update())
        .catch(() => {
          // The website remains usable if service-worker registration is unavailable.
        });
    }

    // Prevent the browser from showing its own install/download prompt.
    const suppressInstallPrompt = (event) => event.preventDefault();
    window.addEventListener('beforeinstallprompt', suppressInstallPrompt);

    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments[pathSegments.length - 1] === 'admin') {
      return () => {
        window.removeEventListener('beforeinstallprompt', suppressInstallPrompt);
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        }
      };
    }

    setIsVisible(true);
    const hideTimer = window.setTimeout(() => setIsVisible(false), TOAST_DURATION_MS);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener('beforeinstallprompt', suppressInstallPrompt);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
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
