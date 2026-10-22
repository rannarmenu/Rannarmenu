import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'rannar-menu-theme';
const VALID_THEMES = ['light', 'dark', 'system'];
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function preferenceIsDark(preference) {
  const systemIsDark = window.matchMedia?.(MEDIA_QUERY).matches ?? false;
  return preference === 'dark' || (preference === 'system' && systemIsDark);
}

function applyTheme(isDark) {
  const root = document.documentElement;
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    isDark ? '#0b0d10' : '#f8f7f2'
  );
}

function readPreference() {
  try {
    const preference = window.localStorage.getItem(THEME_KEY);
    return VALID_THEMES.includes(preference) ? preference : 'system';
  } catch {
    return 'system';
  }
}

/** One click switches between dark and light; previous system preferences remain compatible. */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.dataset.theme === 'dark'
  );

  useEffect(() => {
    const syncPreference = preference => {
      const nextIsDark = preferenceIsDark(preference);
      setIsDark(nextIsDark);
      applyTheme(nextIsDark);
    };

    const onStorage = event => {
      if (event.key !== THEME_KEY) return;
      syncPreference(VALID_THEMES.includes(event.newValue) ? event.newValue : 'system');
    };
    const onSystemThemeChange = () => {
      if (readPreference() === 'system') syncPreference('system');
    };
    const media = window.matchMedia?.(MEDIA_QUERY);

    window.addEventListener('storage', onStorage);
    if (media) {
      if (media.addEventListener) media.addEventListener('change', onSystemThemeChange);
      else media.addListener?.(onSystemThemeChange);
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      if (media) {
        if (media.removeEventListener) media.removeEventListener('change', onSystemThemeChange);
        else media.removeListener?.(onSystemThemeChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    applyTheme(nextIsDark);
    try {
      window.localStorage.setItem(THEME_KEY, nextIsDark ? 'dark' : 'light');
    } catch {
      // The toggle still works for the current page if storage is unavailable.
    }
  };

  const actionLabel = isDark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন';
  const Icon = isDark ? Sun : Moon;

  return (
    <div className="theme-toggle-wrap">
      <button
        type="button"
        className="theme-toggle-button"
        aria-label={actionLabel}
        title={actionLabel}
        aria-pressed={isDark}
        onClick={toggleTheme}
      >
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
