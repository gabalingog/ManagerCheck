import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './../../supabaseClient';
import { useAuth } from './../../authContext';
import './ReviewReplies.css';

const ReviewReplies = ({ reviewId, reviewType = 'manager' }) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchReplies();
  }, [reviewId]);

  const fetchReplies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('review_replies')
      .select('*')
      .eq('review_id', reviewId)
      .eq('review_type', reviewType)
      .order('created_at', { ascending: true });
    if (!error) setReplies(data || []);
    setLoading(false);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !user) return;
    setSubmitting(true);

    const displayName = user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || 'Anonymous';

    const { data, error } = await supabase
      .from('review_replies')
      .insert([{
        review_id: reviewId,
        review_type: reviewType,
        user_id: user.id,
        display_name: displayName,
        content: replyText.trim(),
      }])
      .select()
      .single();

    if (!error && data) {
      setReplies(prev => [...prev, data]);
      setReplyText('');
      setShowReplyBox(false);
      setShowAll(true);
    }
    setSubmitting(false);
  };

  const handleDelete = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return;
    setDeletingId(replyId);
    const { error } = await supabase
      .from('review_replies')
      .delete()
      .eq('id', replyId);
    if (!error) setReplies(prev => prev.filter(r => r.id !== replyId));
    setDeletingId(null);
  };

  const handleReplyClick = () => {
    if (!user) return;
    setShowReplyBox(prev => !prev);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const visibleReplies = showAll ? replies : replies.slice(0, 1);
  const hiddenCount = replies.length - 1;

  return (
    <div className="rr-root">
      {/* Thread connector line */}
      <div className="rr-action-row">
        <button
          className={`rr-reply-trigger ${!user ? 'rr-reply-trigger--disabled' : ''}`}
          onClick={handleReplyClick}
          title={!user ? 'Sign in to reply' : ''}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="9 17 4 12 9 7"/>
            <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
          </svg>
          Reply
        </button>

        {replies.length > 0 && (
          <span className="rr-count-pill">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>

      {/* Inline reply composer */}
      {showReplyBox && user && (
        <div className="rr-composer">
          <div className="rr-composer-avatar">
            {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
          </div>
          <div className="rr-composer-body">
            <textarea
              ref={textareaRef}
              className="rr-composer-input"
              placeholder="Write a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitReply();
                if (e.key === 'Escape') { setShowReplyBox(false); setReplyText(''); }
              }}
            />
            <div className="rr-composer-actions">
              <span className="rr-hint">⌘↵ to submit · Esc to cancel</span>
              <div className="rr-composer-btns">
                <button
                  className="rr-btn-cancel"
                  onClick={() => { setShowReplyBox(false); setReplyText(''); }}
                >Cancel</button>
                <button
                  className="rr-btn-submit"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || submitting}
                >
                  {submitting ? (
                    <span className="rr-spinner" />
                  ) : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replies thread */}
      {!loading && replies.length > 0 && (
        <div className="rr-thread">
          <div className="rr-thread-line" />
          <div className="rr-replies-list">
            {visibleReplies.map((reply, index) => (
              <div
                key={reply.id}
                className="rr-reply"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="rr-reply-avatar">
                  {reply.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="rr-reply-content">
                  <div className="rr-reply-header">
                    <span className="rr-reply-name">{reply.display_name}</span>
                    <span className="rr-reply-time">{formatTimeAgo(reply.created_at)}</span>
                    {user && reply.user_id === user.id && (
                      <button
                        className="rr-delete-btn"
                        onClick={() => handleDelete(reply.id)}
                        disabled={deletingId === reply.id}
                      >
                        {deletingId === reply.id ? '…' : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="rr-reply-text">{reply.content}</p>
                </div>
              </div>
            ))}

            {/* Show more / less toggle */}
            {replies.length > 1 && (
              <button
                className="rr-expand-btn"
                onClick={() => setShowAll(prev => !prev)}
              >
                {showAll ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    Hide replies
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewReplies;