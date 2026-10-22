import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Clock3, LoaderCircle, MessageCircle,
  Send, ShieldCheck, Sparkles, Star, UserRound
} from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabaseClient.js';
import './recipe-reviews.css';

const REVIEWER_KEY_STORE = 'rannar-menu-reviewer-key';
const REVIEWER_NAME_STORE = 'rannar-menu-reviewer-name';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ratingLabels = ['', 'খুব একটা ভালো লাগেনি', 'আরও ভালো হতে পারত', 'ভালো', 'খুব ভালো', 'দারুণ হয়েছে'];

function safeGet(key) {
  try { return window.localStorage.getItem(key) || ''; } catch { return ''; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* Private browsing may block storage. */ }
}
function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}
function getReviewerKey() {
  const existing = safeGet(REVIEWER_KEY_STORE);
  if (UUID_PATTERN.test(existing)) return existing;
  const next = createUuid();
  safeSet(REVIEWER_KEY_STORE, next);
  return next;
}
function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
function countBn(value) {
  return Number(value || 0).toLocaleString('bn-BD');
}
function RatingStars({ value = 0, size = 17 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="review-stars" aria-label={String(value || 0) + ' out of 5'}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star} size={size} strokeWidth={1.7} fill={star <= rounded ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export default function RecipeReviews({ recipe, user = null }) {
  const recipeId = typeof recipe?.id === 'string' && UUID_PATTERN.test(recipe.id) ? recipe.id : '';
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reviewerKey, setReviewerKey] = useState('');
  const [displayName, setDisplayName] = useState(() => safeGet(REVIEWER_NAME_STORE));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(true);
  const userIsVerified = Boolean(user && (user.email_confirmed_at || user.phone_confirmed_at));
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadIssue, setLoadIssue] = useState('');
  const requestVersion = useRef(0);

  const loadReviews = useCallback(async () => {
    const requestId = ++requestVersion.current;
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      setLoadIssue('config');
      setReviews([]);
      setSummary(null);
      return;
    }
    if (!recipeId) {
      setLoading(false);
      setLoadIssue('recipe');
      setReviews([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    const existingReviewQuery = userIsVerified && user?.id
      ? supabase.from('recipe_reviews').select('id').eq('recipe_id', recipeId).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null });
    const [reviewResponse, summaryResponse, existingResponse] = await Promise.all([
      supabase
        .from('recipe_reviews')
        .select('id, display_name, rating, comment, created_at')
        .eq('recipe_id', recipeId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('recipe_review_summaries')
        .select('review_count, average_rating, one_star, two_star, three_star, four_star, five_star')
        .eq('recipe_id', recipeId)
        .maybeSingle(),
      existingReviewQuery
    ]);

    if (requestId !== requestVersion.current) return;
    setReviews(Array.isArray(reviewResponse.data) ? reviewResponse.data : []);
    setSummary(summaryResponse.data || null);
    setAlreadyReviewed(Boolean(existingResponse.data) || Boolean(user?.id && safeGet('rannar-menu-reviewed:' + recipeId + ':' + user.id)));
    setLoadIssue(reviewResponse.error ? 'reviews' : summaryResponse.error ? 'summary' : (userIsVerified && existingResponse.error) ? 'reviews' : '');
    setLoading(false);
  }, [recipeId, user?.id, userIsVerified]);

  useEffect(() => {
    setReviewerKey(getReviewerKey());
    setRating(0);
    setComment('');
    setHoneypot('');
    setFeedback(null);
    setAlreadyReviewed(false);
    loadReviews();
    return () => { requestVersion.current += 1; };
  }, [recipeId, loadReviews, user?.id]);

  const sortedReviews = useMemo(() => {
    const result = [...reviews];
    if (sortOrder === 'highest') {
      result.sort((a, b) => Number(b.rating) - Number(a.rating) || new Date(b.created_at) - new Date(a.created_at));
    } else if (sortOrder === 'lowest') {
      result.sort((a, b) => Number(a.rating) - Number(b.rating) || new Date(b.created_at) - new Date(a.created_at));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  }, [reviews, sortOrder]);

  const reviewCount = Number(summary?.review_count) || 0;
  const averageRating = reviewCount ? Number(summary?.average_rating) : 0;
  const distribution = [
    { stars: 5, value: Number(summary?.five_star) || 0 },
    { stars: 4, value: Number(summary?.four_star) || 0 },
    { stars: 3, value: Number(summary?.three_star) || 0 },
    { stars: 2, value: Number(summary?.two_star) || 0 },
    { stars: 1, value: Number(summary?.one_star) || 0 }
  ];
  const canSubmit = Boolean(supabaseConfigured && supabase && recipeId && reviewerKey && userIsVerified && !alreadyReviewed && !submitting);

  async function handleSubmit(event) {
    event.preventDefault();
    if (honeypot.trim()) return;
    if (!supabaseConfigured || !supabase || !recipeId || !reviewerKey || !userIsVerified || !user?.id) {
      setFeedback({ type: 'error', text: 'রিভিউ দিতে যাচাইকৃত অ্যাকাউন্টে লগইন করতে হবে।' });
      return;
    }
    const cleanName = displayName.trim();
    const cleanComment = comment.trim();
    if (rating < 1 || rating > 5) {
      setFeedback({ type: 'error', text: 'জমা দেওয়ার আগে ১ থেকে ৫ স্টারের মধ্যে একটি রেটিং বেছে নিন।' });
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 50) {
      setFeedback({ type: 'error', text: 'নাম ২–৫০ অক্ষরের মধ্যে লিখুন।' });
      return;
    }
    if (cleanComment.length < 5 || cleanComment.length > 1200) {
      setFeedback({ type: 'error', text: 'মন্তব্য কমপক্ষে ৫ অক্ষর এবং সর্বোচ্চ ১,২০০ অক্ষরের হতে হবে।' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from('recipe_reviews').insert({
        recipe_id: recipeId,
        user_id: user.id,
        reviewer_key: reviewerKey,
        display_name: cleanName,
        rating,
        comment: cleanComment
      });
      if (error) {
        if (error.code === '23505') {
          setAlreadyReviewed(true);
          setFeedback({ type: 'error', text: 'এই অ্যাকাউন্ট থেকে এই রেসিপিতে আগে একটি রিভিউ দেওয়া হয়েছে।' });
        } else {
          setFeedback({ type: 'error', text: 'রিভিউ জমা দেওয়া যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।' });
        }
        return;
      }
      safeSet(REVIEWER_NAME_STORE, cleanName);
      safeSet('rannar-menu-reviewed:' + recipeId + ':' + user.id, '1');
      setAlreadyReviewed(true);
      setDisplayName(cleanName);
      setRating(0);
      setComment('');
      setFeedback({ type: 'success', text: 'আপনার রেটিং ও মন্তব্য প্রকাশিত হয়েছে। ধন্যবাদ!' });
      await loadReviews();
    } catch {
      setFeedback({ type: 'error', text: 'সংযোগের সমস্যায় রিভিউ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="reviews-section" aria-labelledby="recipe-reviews-heading">
      <div className="reviews-heading">
        <div>
          <p className="reviews-kicker"><Sparkles size={14} /> সবার রান্নার অভিজ্ঞতা</p>
          <h3 id="recipe-reviews-heading">রেটিং ও পাঠকের মন্তব্য</h3>
          <p>রেসিপিটি রান্না করে কেমন হলো—আপনার সৎ অভিজ্ঞতা অন্যদের সিদ্ধান্ত নিতে সাহায্য করবে।</p>
        </div>
        <div className="reviews-total" aria-label={countBn(reviewCount) + ' টি রিভিউ'}>
          <MessageCircle size={17} />
          <strong>{countBn(reviewCount)}</strong>
          <span>টি রিভিউ</span>
        </div>
      </div>

      <div className="reviews-layout">
        <aside className="reviews-summary" aria-label="রেটিংয়ের সারাংশ">
          <div className="reviews-score">
            <strong>{reviewCount ? averageRating.toFixed(1) : '—'}</strong>
            <div><RatingStars value={averageRating} size={18} /><span>{reviewCount ? countBn(reviewCount) + ' জনের রেটিং' : 'এখনো কোনো রেটিং নেই'}</span></div>
          </div>
          <div className="rating-distribution">
            {distribution.map(item => (
              <div className="rating-bar-row" key={item.stars}>
                <span>{countBn(item.stars)} <Star size={12} fill="currentColor" /></span>
                <span className="rating-bar-track"><span style={{ width: (reviewCount ? Math.min(100, item.value / reviewCount * 100) : 0) + '%' }} /></span>
                <small>{countBn(item.value)}</small>
              </div>
            ))}
          </div>
        </aside>

        <div className="review-form-panel">
          <div className="review-form-title">
            <span className="review-form-icon"><UserRound size={18} /></span>
            <div><h4>আপনার অভিজ্ঞতা শেয়ার করুন</h4><p>একটি রেটিং দিন, সঙ্গে ছোট্ট মন্তব্য লিখুন।</p></div>
          </div>

          {!supabaseConfigured || !recipeId ? (
            <div className="review-notice" role="status">
              <AlertCircle size={17} />
              <span>{!supabaseConfigured ? 'লাইভ রিভিউ চালু করতে Supabase configuration প্রয়োজন।' : 'এই রেসিপির স্থায়ী database ID পাওয়া যায়নি, তাই এখানে রিভিউ জমা দেওয়া যাবে না।'}</span>
            </div>
          ) : (!userIsVerified || !user?.id) ? (
            <div className="review-notice" role="status">
              <ShieldCheck size={17} />
              <span>রেসিপির রেটিং ও পাঠকের মন্তব্য সবাই দেখতে পারবেন। এই সংস্করণে নতুন রিভিউ জমা দেওয়ার সুবিধা বন্ধ রাখা হয়েছে।</span>
            </div>
          ) : alreadyReviewed ? (
            <div className="review-notice review-notice-success" role="status">
              <CheckCircle2 size={17} />
              <span>এই ব্রাউজার থেকে এই রেসিপিতে আপনার রিভিউ জমা হয়েছে। অন্য পাঠকরাও এটি দেখতে পারবেন।</span>
            </div>
          ) : (
            <form className="review-form" onSubmit={handleSubmit}>
              <fieldset className="review-rating-field">
                <legend>আপনার রেটিং</legend>
                <div className="review-star-picker" role="group" aria-label="১ থেকে ৫ স্টার রেটিং">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      type="button"
                      className={value <= rating ? 'selected' : ''}
                      aria-label={countBn(value) + ' স্টার'}
                      aria-pressed={rating === value}
                      onClick={() => { setRating(value); setFeedback(null); }}
                    >
                      <Star size={25} strokeWidth={1.7} fill={value <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                  <span>{rating ? ratingLabels[rating] : 'স্টার বেছে নিন'}</span>
                </div>
              </fieldset>

              <label className="review-field">
                <span>আপনার নাম</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={50}
                  placeholder="যে নামে মন্তব্য দেখাতে চান"
                  required
                />
              </label>

              <label className="review-field">
                <span>আপনার মন্তব্য</span>
                <textarea
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                  minLength={5}
                  maxLength={1200}
                  rows={4}
                  placeholder="রান্নার স্বাদ, সহজতা বা নিজের কোনো টিপস লিখুন..."
                  required
                />
                <small>{countBn(comment.length)} / ১,২০০ অক্ষর</small>
              </label>

              <label className="review-honeypot" aria-hidden="true">
                Website
                <input value={honeypot} onChange={event => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" />
              </label>

              {feedback && <div className={'review-feedback ' + feedback.type} role="status">{feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{feedback.text}</div>}

              <button className="review-submit" type="submit" disabled={!canSubmit}>
                {submitting ? <LoaderCircle className="review-spin" size={17} /> : <Send size={16} />}
                {submitting ? 'জমা হচ্ছে…' : 'রেটিং ও মন্তব্য প্রকাশ করুন'}
              </button>
              <p className="review-privacy"><ShieldCheck size={14} /> মন্তব্যটি প্রকাশ্যে দেখা যাবে। পাসওয়ার্ড বা ব্যক্তিগত তথ্য লিখবেন না।</p>
            </form>
          )}

          {feedback && (!supabaseConfigured || !recipeId || alreadyReviewed) && (
            <div className={'review-feedback ' + feedback.type} role="status">{feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{feedback.text}</div>
          )}
        </div>
      </div>

      <div className="reviews-list-header">
        <div><h4>পাঠকদের মতামত</h4><span>{countBn(reviewCount)}টি রিভিউ · সর্বশেষ ৫০টি মন্তব্য দেখানো হচ্ছে</span></div>
        <label className="review-sort">সাজান
          <select value={sortOrder} onChange={event => setSortOrder(event.target.value)} aria-label="মন্তব্য সাজানোর ধরন">
            <option value="newest">সর্বশেষ</option>
            <option value="highest">সর্বোচ্চ রেটিং</option>
            <option value="lowest">সর্বনিম্ন রেটিং</option>
          </select>
        </label>
      </div>

      {loadIssue && (
        <div className="review-load-warning" role="status">
          <AlertCircle size={16} />
          <span>{loadIssue === 'config' ? 'লাইভ রিভিউ ডেটাবেস সংযুক্ত নয়; কোনো কাল্পনিক রেটিং দেখানো হচ্ছে না.' : loadIssue === 'recipe' ? 'এই preview recipe-এর জন্য live review যুক্ত করা যাচ্ছে না.' : 'রিভিউ ডেটাবেস থেকে তথ্য পুরোপুরি লোড হয়নি। সংযোগ ও database permissions যাচাই করুন.'}</span>
          <button type="button" onClick={loadReviews}>আবার চেষ্টা করুন</button>
        </div>
      )}

      {loading ? (
        <div className="reviews-loading"><LoaderCircle className="review-spin" size={20} /> রিভিউ লোড হচ্ছে…</div>
      ) : sortedReviews.length ? (
        <div className="reviews-list">
          {sortedReviews.map(item => (
            <article className="reader-review" key={item.id}>
              <div className="review-avatar" aria-hidden="true">{(item.display_name || 'পাঠক').trim().slice(0, 1)}</div>
              <div className="reader-review-body">
                <div className="reader-review-top">
                  <div><strong>{item.display_name}</strong><span><Clock3 size={12} /> {formatDate(item.created_at)}</span></div>
                  <RatingStars value={item.rating} size={15} />
                </div>
                <p>{item.comment}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !loadIssue && !loading && (
          <div className="reviews-empty">
            <span><MessageCircle size={22} /></span>
            <strong>এখনো কোনো মন্তব্য নেই</strong>
            <p>এই রেসিপিটি প্রথম রান্না করে আপনার অভিজ্ঞতা শেয়ার করুন।</p>
          </div>
        )
      )}
    </section>
  );
}
