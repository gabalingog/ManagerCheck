import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from './../../supabaseClient';
import './ReportReview.css';

/**
 * ReportReview — per-review report button
 *
 * Props:
 *   reviewId       — the review's id
 *   reviewType     — "manager" | "restaurant"
 *   reviewSnippet  — first ~80 chars of the comment
 *   contextName    — manager or restaurant name
 */
const ReportReview = ({ reviewId, reviewType, reviewSnippet, contextName }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Harassment or bullying',
    'Hate speech or discrimination',
    'False or misleading information',
    'Spam or irrelevant content',
    'Other',
  ];

  const handleOpen = () => {
    setOpen(true);
    setSubmitted(false);
    setError('');
    setReason('');
    setDetails('');
  };

  const handleClose = () => {
    setOpen(false);
    setReason('');
    setDetails('');
    setError('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { error: fnError } = await supabase.functions.invoke('send-report', {
        body: {
          reviewId,
          reviewType,
          reviewSnippet,
          contextName,
          reason,
          details: details.trim(),
        },
      });

      if (fnError) throw fnError;
      setSubmitted(true);
    } catch (err) {
      console.error('Report error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const modal = open ? ReactDOM.createPortal(
    <>
      <div className="rr-overlay" onClick={handleClose} />
      <div className="rr-modal" role="dialog" aria-modal="true">
        <button className="rr-close" onClick={handleClose} aria-label="Close">✕</button>

        {submitted ? (
          <div className="rr-success">
            <div className="rr-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className="rr-title">Report submitted</h2>
            <p className="rr-subtitle">Thanks for letting us know. The ManagerCheck team will review this shortly.</p>
            <button className="rr-btn-primary" onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="rr-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              <span className="rr-eyebrow">Report Review</span>
            </div>

            <p className="rr-context">Reporting a review for <strong>{contextName}</strong></p>

            <div className="rr-input-group">
              <label className="rr-label">Reason <span className="rr-required">*</span></label>
              <div className="rr-reasons">
                {reasons.map(r => (
                  <button
                    key={r}
                    className={`rr-reason-btn ${reason === r ? 'active' : ''}`}
                    onClick={() => { setReason(r); setError(''); }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {error && <p className="rr-error">{error}</p>}
            </div>

            <div className="rr-input-group">
              <label className="rr-label">Additional details <span className="rr-optional">(optional)</span></label>
              <textarea
                className="rr-textarea"
                placeholder="Any additional context..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
              />
            </div>

            <div className="rr-actions">
              <button className="rr-btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit Report'}
              </button>
              <button className="rr-btn-secondary" onClick={handleClose} disabled={submitting}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button className="rr-trigger-btn" onClick={handleOpen} title="Report this review">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
          <line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
      </button>
      {modal}
    </>
  );
};

export default ReportReview;