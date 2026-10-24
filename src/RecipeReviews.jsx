import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, Clock3, LoaderCircle, MessageCircle, ShieldCheck, Sparkles, Star
} from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabaseClient.js';
import './recipe-reviews.css';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export default function RecipeReviews({ recipe }) {
  const recipeId = typeof recipe?.id === 'string' && UUID_PATTERN.test(recipe.id) ? recipe.id : '';
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(true);
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
    try {
      const [reviewResponse, summaryResponse] = await Promise.all([
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
          .maybeSingle()
      ]);

      if (requestId !== requestVersion.current) return;
      setReviews(Array.isArray(reviewResponse.data) ? reviewResponse.data : []);
      setSummary(summaryResponse.data || null);
      setLoadIssue(reviewResponse.error ? 'reviews' : summaryResponse.error ? 'summary' : '');
    } catch {
      if (requestId !== requestVersion.current) return;
      setReviews([]);
      setSummary(null);
      setLoadIssue('reviews');
    } finally {
      if (requestId === requestVersion.current) setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    void loadReviews();
    return () => { requestVersion.current += 1; };
  }, [loadReviews]);

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
          <span className="review-form-icon"><ShieldCheck size={18} /></span>
          <div>
            <h4>রেটিং ও পাঠকের মন্তব্য</h4>
            <p>এই সংস্করণে নতুন রিভিউ জমা দেওয়া বন্ধ রাখা হয়েছে।</p>
          </div>
        </div>
        <div className="review-notice" role="status">
          <AlertCircle size={17} />
          <span>আগে প্রকাশিত রেটিং ও মন্তব্য সবাই দেখতে পারবেন। নতুন মন্তব্য যোগ করা বা রেটিং জমা দেওয়ার সুবিধা বর্তমানে বন্ধ।</span>
        </div>
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
