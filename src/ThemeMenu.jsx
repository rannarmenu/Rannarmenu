import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, Moon, MoreVertical, Sun } from 'lucide-react';

const THEME_KEY = 'rannar-menu-theme';
const VALID_THEMES = ['light', 'dark', 'system'];

function readTheme() {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return VALID_THEMES.includes(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(preference) {
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const isDark = preference === 'dark' || (preference === 'system' && systemDark);
  const root = document.documentElement;
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#111712' : '#f8f7f2');
}

const OPTIONS = [
  { value: 'light', label: 'লাইট মোড', description: 'উজ্জ্বল ও পরিচ্ছন্ন', Icon: Sun },
  { value: 'dark', label: 'ডার্ক মোড', description: 'কম আলোতে আরামদায়ক', Icon: Moon },
  { value: 'system', label: 'সিস্টেম অনুযায়ী', description: 'ডিভাইসের পছন্দ অনুসরণ করবে', Icon: Monitor },
];

export default function ThemeMenu() {
  const [preference, setPreference] = useState(readTheme);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    applyTheme(preference);
    try { window.localStorage.setItem(THEME_KEY, preference); } catch {}

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemThemeChange = () => {
      if (preference === 'system') applyTheme('system');
    };
    if (preference === 'system' && media) {
      if (media.addEventListener) media.addEventListener('change', onSystemThemeChange);
      else media.addListener?.(onSystemThemeChange);
    }
    const onStorage = event => {
      if (event.key === THEME_KEY) {
        const next = VALID_THEMES.includes(event.newValue) ? event.newValue : 'system';
        setPreference(next);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      if (preference === 'system' && media) {
        if (media.removeEventListener) media.removeEventListener('change', onSystemThemeChange);
        else media.removeListener?.(onSystemThemeChange);
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [preference]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = event => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const chooseTheme = value => {
    setPreference(value);
    try { window.localStorage.setItem(THEME_KEY, value); } catch {}
    applyTheme(value);
    setOpen(false);
  };

  return (
    <div className="theme-menu-wrap" ref={wrapperRef}>
      <button
        type="button"
        className="theme-menu-trigger"
        aria-label="থিম সেটিংস খুলুন"
        aria-haspopup="menu"
        aria-expanded={open}
        title="থিম সেটিংস"
        onClick={() => setOpen(value => !value)}
      >
        <MoreVertical size={20} strokeWidth={2.1} aria-hidden="true" />
      </button>
      {open && (
        <div className="theme-menu-panel" role="menu" aria-label="থিম নির্বাচন">
          <div className="theme-menu-heading">
            <strong>থিম সেটিংস</strong>
            <small>Rannar Menu যেভাবে দেখতে চান</small>
          </div>
          <div className="theme-menu-options">
            {OPTIONS.map(({ value, label, description, Icon }) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={preference === value}
                className={preference === value ? 'theme-menu-option is-selected' : 'theme-menu-option'}
                onClick={() => chooseTheme(value)}
              >
                <span className="theme-menu-option-icon"><Icon size={18} aria-hidden="true" /></span>
                <span className="theme-menu-option-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <Check className="theme-menu-check" size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="theme-menu-footer">পছন্দটি এই ব্রাউজারে সংরক্ষিত থাকবে</p>
        </div>
      )}
    </div>
  );
}
