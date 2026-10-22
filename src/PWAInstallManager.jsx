import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, ChefHat, Smartphone, X } from 'lucide-react';
import './pwa-install.css';

const OPEN_DELAY_MS = 10_000;
const VISIBLE_DURATION_MS = 10_000;
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISSED_UNTIL_KEY = 'rannar-menu-pwa-dismissed-until';

function readDismissedUntil() {
  try {
    return Number(window.localStorage.getItem(DISMISSED_UNTIL_KEY) || 0);
  } catch {
    return 0;
  }
}

function isRunningAsApp() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.matchMedia?.('(display-mode: minimal-ui)').matches
    || window.navigator.standalone === true;
}

export default function PWAInstallManager() {
  const installPromptRef = useRef(null);
  const autoCloseTimerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const isIOS = typeof navigator !== 'undefined'
    && (/iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  useEffect(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker
        .register(`${baseUrl}sw.js`, { scope: baseUrl })
        .catch(() => {
          // Keep the site usable if a browser, host, or policy blocks service workers.
        });
    }

    const currentPath = window.location.pathname.replace(/\/+$/, '');
    const isAdminPage = currentPath.endsWith('/admin');
    if (isAdminPage || isRunningAsApp()) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      // Store the browser's one-use install event; it must only be prompted from a click.
      event.preventDefault();
      installPromptRef.current = event;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      if (autoCloseTimerRef.current) {
        window.clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      installPromptRef.current = null;
      setCanInstall(false);
      setIsOpen(false);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const showTimer = window.setTimeout(() => {
      if (readDismissedUntil() > Date.now()) return;
      setIsOpen(true);
      autoCloseTimerRef.current = window.setTimeout(() => {
        setIsOpen(false);
        setShowInstructions(false);
        autoCloseTimerRef.current = null;
      }, VISIBLE_DURATION_MS);
    }, OPEN_DELAY_MS);

    return () => {
      window.clearTimeout(showTimer);
      if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [baseUrl]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') dismissPrompt();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  function stopAutoCloseTimer() {
    if (autoCloseTimerRef.current) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }

  function dismissPrompt() {
    stopAutoCloseTimer();
    try {
      window.localStorage.setItem(
        DISMISSED_UNTIL_KEY,
        String(Date.now() + DISMISS_FOR_MS)
      );
    } catch {
      // A blocked storage API should never prevent the close button from working.
    }
    setIsOpen(false);
    setShowInstructions(false);
  }

  async function handleInstall() {
    stopAutoCloseTimer();
    const installPrompt = installPromptRef.current;

    if (!installPrompt) {
      // iOS Safari and some other browsers do not expose beforeinstallprompt.
      setShowInstructions(true);
      return;
    }

    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === 'accepted' || choice?.outcome === 'dismissed') {
        setIsOpen(false);
      }
    } catch {
      // Some browsers may revoke the event before the click; offer manual instructions.
      setShowInstructions(true);
    } finally {
      installPromptRef.current = null;
      setCanInstall(false);
      setIsInstalling(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="pwa-install-overlay">
      <section
        className={showInstructions ? 'pwa-install-dialog pwa-install-dialog-help' : 'pwa-install-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
      >
        <button
          className="pwa-install-close"
          type="button"
          onClick={dismissPrompt}
          aria-label="পপআপ বন্ধ করুন"
        >
          <X size={19} aria-hidden="true" />
        </button>

        <div className="pwa-install-brand">
          <img src={`${baseUrl}rannar-menu-logo.svg`} alt="" width="68" height="68" />
          <span className="pwa-install-brand-copy">
            <strong>Rannar Menu</strong>
            <small>আপনার প্রতিদিনের রান্নার সঙ্গী</small>
          </span>
          <span className="pwa-install-brand-check" aria-hidden="true"><Check size={15} /></span>
        </div>

        <div className="pwa-install-copy">
          <span className="pwa-install-eyebrow"><Smartphone size={14} /> ফোনে সঙ্গে রাখুন</span>
          <h2 id="pwa-install-title">{showInstructions ? 'অ্যাপ ইনস্টল করবেন যেভাবে' : 'Rannar Menu অ্যাপ ইনস্টল করুন'}</h2>
          <p id="pwa-install-description">
            {showInstructions
              ? 'আপনার ব্রাউজারের ইনস্টল অপশন ব্যবহার করে Rannar Menu হোম স্ক্রিনে যোগ করুন।'
              : 'সহজ রেসিপি, বাংলা ও Banglish সার্চ এবং পছন্দের রান্না—এক ট্যাপেই খুলুন।'}
          </p>

          {showInstructions ? (
            <div className="pwa-install-help" role="status">
              {isIOS ? (
                <ol>
                  <li>Safari-তে ওয়েবসাইটটি খুলুন।</li>
                  <li>নিচের <strong>Share</strong> আইকনে ট্যাপ করুন।</li>
                  <li><strong>Add to Home Screen</strong> বেছে নিয়ে <strong>Add</strong> চাপুন।</li>
                </ol>
              ) : (
                <ol>
                  <li>Chrome বা সমর্থিত ব্রাউজারের মেনু <strong>⋮</strong> খুলুন।</li>
                  <li><strong>Install app</strong> অথবা <strong>Add to Home screen</strong> চাপুন।</li>
                  <li>নিশ্চিত করলে অ্যাপের আইকন হোম স্ক্রিনে যুক্ত হবে।</li>
                </ol>
              )}
            </div>
          ) : (
            <div className="pwa-install-benefits">
              <span><Check size={15} /> হোম স্ক্রিন থেকে দ্রুত খুলুন</span>
              <span><Check size={15} /> আলাদা অ্যাপের মতো ব্যবহার করুন</span>
            </div>
          )}

          <button
            className="pwa-install-cta"
            type="button"
            onClick={showInstructions ? dismissPrompt : handleInstall}
            disabled={isInstalling}
          >
            {showInstructions ? <Check size={18} /> : <ArrowDownToLine size={18} />}
            {showInstructions
              ? 'ঠিক আছে'
              : isInstalling
                ? 'ইনস্টল অপশন খোলা হচ্ছে…'
                : canInstall
                  ? 'এখনই অ্যাপ ইনস্টল করুন'
                  : 'ইনস্টল করার নিয়ম দেখুন'}
          </button>
          {!showInstructions && (
            <button className="pwa-install-later" type="button" onClick={dismissPrompt}>
              পরে দেখব
            </button>
          )}
        </div>

        {!showInstructions && (
          <div className="pwa-install-timer" aria-hidden="true">
            <span />
          </div>
        )}
        <span className="pwa-install-footer"><ChefHat size={14} /> রান্না হোক আরও সহজ</span>
      </section>
    </div>
  );
}
