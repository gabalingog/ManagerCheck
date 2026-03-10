import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './../../supabaseClient';
import { useAuth } from './../../authContext';
import './ReviewReplies.css';

// ── Reusable Composer ────────────────────────────────────────────────────────
const Composer = ({ user, placeholder, onSubmit, onCancel, autoFocus }) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 50);
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(text.trim());
    setText('');
    setSubmitting(false);
  };

  return (
    <div className="rr-composer">
      <div className="rr-composer-avatar rr-composer-avatar--anon" />
      <div className="rr-composer-body">
        <textarea
          ref={ref}
          className="rr-composer-input"
          placeholder={placeholder || 'Write a reply...'}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            if (e.key === 'Escape') { setText(''); onCancel?.(); }
          }}
        />
        <div className="rr-composer-actions">
          <span className="rr-hint">⌘↵ to submit · Esc to cancel</span>
          <div className="rr-composer-btns">
            {onCancel && (
              <button className="rr-btn-cancel" onClick={() => { setText(''); onCancel(); }}>
                Cancel
              </button>
            )}
            <button
              className="rr-btn-submit"
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
            >
              {submitting ? <span className="rr-spinner" /> : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Single Reply (recursive) ─────────────────────────────────────────────────
const Reply = ({
  reply, allReplies, depth, user,
  onDelete, onAddReply, deletingId, formatTimeAgo,
  showAllMap, setShowAllMap,
}) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const MAX_DEPTH = 4;

  const isDeleted = !!reply.deleted_at;
  const children = allReplies.filter(r => r.parent_reply_id === reply.id);
  const showAll = !!showAllMap[reply.id];
  const defaultVisible = depth === 0 ? 1 : 0;
  const visibleChildren = showAll ? children : children.slice(0, defaultVisible);
  const hiddenCount = children.length - defaultVisible;

  const handleSubmitNestedReply = async (text) => {
    await onAddReply(text, reply.id);
    setShowReplyBox(false);
  };

  return (
    <div className={`rr-reply${depth > 0 ? ' rr-reply--nested' : ''}`}>
      <div
        className={`rr-reply-avatar${isDeleted ? ' rr-reply-avatar--deleted' : ''}`}
        data-depth={Math.min(depth, 3)}
      />

      <div className="rr-reply-content-wrap">
        {isDeleted ? (
          <div className="rr-reply-content rr-reply-content--deleted">
            <p className="rr-deleted-text">This reply has been deleted.</p>
          </div>
        ) : (
          <div className="rr-reply-content">
            <div className="rr-reply-header">
              <span className="rr-reply-time">{formatTimeAgo(reply.created_at)}</span>
              {user && reply.user_id === user.id && (
                <button
                  className="rr-delete-btn"
                  onClick={() => onDelete(reply.id, children.length > 0)}
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
        )}

        {/* Only allow replying to non-deleted replies */}
        {!isDeleted && user && depth < MAX_DEPTH && (
          <button
            className="rr-inline-reply-btn"
            onClick={() => setShowReplyBox(prev => !prev)}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 17 4 12 9 7"/>
              <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
            </svg>
            Reply
          </button>
        )}

        {showReplyBox && user && (
          <div className="rr-nested-composer">
            <Composer
              user={user}
              placeholder="Write a reply..."
              onSubmit={handleSubmitNestedReply}
              onCancel={() => setShowReplyBox(false)}
              autoFocus
            />
          </div>
        )}

        {children.length > 0 && (
          <div className="rr-children">
            <div className="rr-thread-line rr-thread-line--child" />
            <div className="rr-children-list">
              {visibleChildren.map(child => (
                <Reply
                  key={child.id}
                  reply={child}
                  allReplies={allReplies}
                  depth={depth + 1}
                  user={user}
                  onDelete={onDelete}
                  onAddReply={onAddReply}
                  deletingId={deletingId}
                  formatTimeAgo={formatTimeAgo}
                  showAllMap={showAllMap}
                  setShowAllMap={setShowAllMap}
                />
              ))}
              {children.length > defaultVisible && hiddenCount > 0 && (
                <button
                  className="rr-expand-btn rr-expand-btn--child"
                  onClick={() => setShowAllMap(prev => ({ ...prev, [reply.id]: !showAll }))}
                >
                  {showAll ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="18 15 12 9 6 15"/>
                      </svg>
                      Hide
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const ReviewReplies = ({ reviewId, reviewType = 'manager' }) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopLevelComposer, setShowTopLevelComposer] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showAllTop, setShowAllTop] = useState(false);
  const [showAllMap, setShowAllMap] = useState({});

  useEffect(() => {
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
    fetchReplies();
  }, [reviewId, reviewType]);

  const handleAddReply = async (text, parentReplyId = null) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('review_replies')
      .insert([{
        review_id: reviewId,
        review_type: reviewType,
        user_id: user.id,
        display_name: 'Anonymous', // always anonymous
        content: text,
        parent_reply_id: parentReplyId || null,
        parent_display_name: null, // no names shown
      }])
      .select()
      .single();

    if (!error && data) {
      setReplies(prev => [...prev, data]);
    }
  };

  // const getDescendantIds = (id, allReplies) => {
  //   const children = allReplies.filter(r => r.parent_reply_id === id);
  //   return children.flatMap(c => [c.id, ...getDescendantIds(c.id, allReplies)]);
  // };

  const handleDelete = async (replyId, hasChildren) => {
    if (!window.confirm('Delete this reply?')) return;
    setDeletingId(replyId);

    if (hasChildren) {
      // Soft delete — keep the row, wipe the content so thread stays intact
      const { error } = await supabase
        .from('review_replies')
        .update({ content: null, display_name: null, deleted_at: new Date().toISOString() })
        .eq('id', replyId);
      if (!error) {
        setReplies(prev => prev.map(r =>
          r.id === replyId
            ? { ...r, content: null, display_name: null, deleted_at: new Date().toISOString() }
            : r
        ));
      }
    } else {
      // Hard delete — no children, safe to remove completely
      await supabase.from('review_replies').delete().eq('id', replyId);
      setReplies(prev => prev.filter(r => r.id !== replyId));
    }

    setDeletingId(null);
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

  const topLevelReplies = replies.filter(r => !r.parent_reply_id);
  const visibleTopLevel = showAllTop ? topLevelReplies : topLevelReplies.slice(0, 1);
  const hiddenTopCount = topLevelReplies.length - 1;
  // don't count soft-deleted replies in the total (they're placeholders, not real replies)
  const totalReplies = replies.filter(r => !r.deleted_at).length;

  return (
    <div className="rr-root">
      <div className="rr-action-row">
        <button
          className={`rr-reply-trigger${!user ? ' rr-reply-trigger--disabled' : ''}`}
          onClick={() => user && setShowTopLevelComposer(prev => !prev)}
          title={!user ? 'Sign in to reply' : ''}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="9 17 4 12 9 7"/>
            <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
          </svg>
          Reply
        </button>
        {totalReplies > 0 && (
          <span className="rr-count-pill">
            {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>

      {showTopLevelComposer && user && (
        <Composer
          user={user}
          placeholder="Write a reply..."
          onSubmit={async (text) => {
            await handleAddReply(text, null);
            setShowTopLevelComposer(false);
          }}
          onCancel={() => setShowTopLevelComposer(false)}
          autoFocus
        />
      )}

      {!loading && topLevelReplies.length > 0 && (
        <div className="rr-thread">
          <div className="rr-thread-line" />
          <div className="rr-replies-list">
            {visibleTopLevel.map(reply => (
              <Reply
                key={reply.id}
                reply={reply}
                allReplies={replies}
                depth={0}
                user={user}
                onDelete={handleDelete}
                onAddReply={handleAddReply}
                deletingId={deletingId}
                formatTimeAgo={formatTimeAgo}
                showAllMap={showAllMap}
                setShowAllMap={setShowAllMap}
              />
            ))}

            {topLevelReplies.length > 1 && (
              <button
                className="rr-expand-btn"
                onClick={() => setShowAllTop(prev => !prev)}
              >
                {showAllTop ? (
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
                    View {hiddenTopCount} more {hiddenTopCount === 1 ? 'reply' : 'replies'}
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