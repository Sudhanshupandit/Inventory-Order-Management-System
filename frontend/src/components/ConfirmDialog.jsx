import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { IconAlert } from './Icons';

const ConfirmContext = createContext(() => Promise.resolve(false));

/* Promise-based themed confirm() replacement.
   Usage:  const confirm = useConfirm();
           if (!(await confirm({ title, message, danger: true }))) return; */
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { options, resolve }

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => setState({ options, resolve }));
  }, []);

  const close = useCallback(
    (result) => {
      setState((s) => {
        if (s) s.resolve(result);
        return null;
      });
    },
    []
  );

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  const opts = state?.options || {};

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={() => close(false)}>
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className={`confirm-icon ${opts.danger ? 'danger' : ''}`}>
              <IconAlert size={24} />
            </div>
            <h3 className="confirm-title">{opts.title || 'Are you sure?'}</h3>
            {opts.message && <p className="confirm-message">{opts.message}</p>}
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => close(false)}>
                {opts.cancelText || 'Cancel'}
              </button>
              <button
                className={`btn ${opts.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => close(true)}
                autoFocus
              >
                {opts.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
