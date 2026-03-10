import React, { useState } from 'react';
import { supabase } from './../../supabaseClient';
import './SuggestChanges.css';

/**
 * SuggestChanges — sidebar button for both RateManager and RateRestaurant
 *
 * Props:
 *   reviewType     — "manager" | "restaurant"
 *   contextName    — manager name or restaurant name
 *   subContextName — restaurant name or address
 */
const SuggestChanges = ({ reviewType, contextName, subContextName }) => {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setSubmitted(false);
    setError('');
    setSuggestion('');
  };

  const handleClose = () => {
    setOpen(false);
    setSuggestion('');
    setError('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!suggestion.trim()) {
      setError('Please enter your suggestion before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { error: fnError } = await supabase.functions.invoke('send-suggestion', {
        body: {
          suggestion: suggestion.trim(),
          reviewType,
          contextName,
          subContextName,
        },
      });

      if (fnError) throw fnError;
      setSubmitted(true);
    } catch (err) {
      console.error('Suggestion error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pageType = reviewType === 'manager' ? 'Manager' : 'Restaurant';

  return (
    <>
      {/* ── TRIGGER BUTTON ── */}
      <button className="sc-trigger-btn" onClick={handleOpen}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        SUGGEST CHANGES
      </button>

      {/* ── MODAL ── */}
      {open && (
        <>
          <div className="sc-overlay" onClick={handleClose} />
          <div className="sc-modal" role="dialog" aria-modal="true">
            <button className="sc-close" onClick={handleClose} aria-label="Close">✕</button>

            {submitted ? (
              <div className="sc-success">
                <div className="sc-success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2 className="sc-title">Thanks for your input</h2>
                <p className="sc-subtitle">Your suggestion has been sent to the ManagerCheck team. We'll review it shortly.</p>
                <button className="sc-btn-primary" onClick={handleClose}>Done</button>
              </div>
            ) : (
              <>
                <div className="sc-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span className="sc-eyebrow">Suggest Changes</span>
                </div>

                <p className="sc-subtitle">
                  For <strong>{contextName}</strong>
                  {subContextName ? <> · {subContextName}</> : null}
                </p>

                <div className="sc-input-group">
                  <label className="sc-label">
                    Your suggestion <span className="sc-required">*</span>
                  </label>
                  <textarea
                    className="sc-textarea"
                    placeholder={``}
                    value={suggestion}
                    onChange={e => { setSuggestion(e.target.value); setError(''); }}
                    rows={5}
                    autoFocus
                  />
                  {error && <p className="sc-error">{error}</p>}
                </div>

                <div className="sc-actions">
                  <button className="sc-btn-primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Sending…' : 'Submit'}
                  </button>
                  <button className="sc-btn-secondary" onClick={handleClose} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default SuggestChanges;