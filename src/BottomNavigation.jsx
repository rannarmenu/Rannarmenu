import React from 'react';
import { Home, BookOpen, Heart, Info } from 'lucide-react';

const ITEMS = [
  { page: 'home', label: 'হোম', Icon: Home },
  { page: 'recipes', label: 'রেসিপি', Icon: BookOpen },
  { page: 'saved', label: 'সেভ করা', Icon: Heart },
  { page: 'about', label: 'আমাদের কথা', Icon: Info },
];

export default function BottomNavigation({ activePage = 'home', onNavigate, savedCount = 0 }) {
  const current = activePage === 'recipe' ? 'recipes' : activePage;

  return (
    <nav className="bottom-navigation" aria-label="প্রধান নেভিগেশন">
      {ITEMS.map(({ page, label, Icon }) => {
        const active = current === page;
        return (
          <button
            key={page}
            type="button"
            className={active ? 'bottom-nav-item is-active' : 'bottom-nav-item'}
            aria-current={active ? 'page' : undefined}
            onClick={() => onNavigate(page)}
          >
            <span className="bottom-nav-icon">
              <Icon size={20} strokeWidth={active ? 2.25 : 1.8} aria-hidden="true" />
              {page === 'saved' && savedCount > 0 && (
                <span className="bottom-nav-count" aria-label={savedCount + 'টি সংরক্ষিত রেসিপি'}>
                  {savedCount > 99 ? '99+' : savedCount}
                </span>
              )}
            </span>
            <span className="bottom-nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
