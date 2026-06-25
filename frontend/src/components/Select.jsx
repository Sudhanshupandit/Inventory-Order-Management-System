import React, { useState, useRef, useEffect } from 'react';

/**
 * Theme-styled dropdown that replaces the native <select> so the open
 * menu and highlight match the app theme on both desktop and mobile.
 *
 * Props:
 *  - value: currently selected value (string)
 *  - onChange: (value) => void
 *  - options: [{ value, label, disabled }]
 *  - placeholder: text shown when nothing selected
 */
export default function Select({ value, onChange, options = [], placeholder = '-- Select --' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange(String(opt.value));
    setOpen(false);
  };

  return (
    <div className={`select ${open ? 'open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className={`select-trigger ${selected ? '' : 'placeholder'}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="select-trigger-label">{selected ? selected.label : placeholder}</span>
        <span className="select-arrow" aria-hidden="true">▾</span>
      </button>

      {open && (
        <ul className="select-menu" role="listbox">
          {options.length === 0 && (
            <li className="select-option disabled">No options available</li>
          )}
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={String(opt.value) === String(value)}
              className={[
                'select-option',
                String(opt.value) === String(value) ? 'selected' : '',
                opt.disabled ? 'disabled' : ''
              ].join(' ').trim()}
              onClick={() => handleSelect(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
