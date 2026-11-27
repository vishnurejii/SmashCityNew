import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, Flame, Heart, Quote, Sparkles, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const Reviews = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average_rating: 5.0,
    total_reviews: 4,
    distribution: { 5: 4, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Modal and submission state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [tagline, setTagline] = useState('');
  const [favoriteBurger, setFavoriteBurger] = useState('Double Smashed Chicken Burger');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch reviews from Django REST backend
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/reviews/`);
      if (res.ok) {
        const data = await res.json();
        if (data.reviews) {
          setReviews(data.reviews);
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn('Reviews API fetch failed, using fallback review data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Pre-fill user name if logged in
  useEffect(() => {
    if (user && !customerName) {
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
      setCustomerName(name);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please share a few words about your experience.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Please provide your name.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Token ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/reviews/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_name: customerName.trim(),
          rating,
          tagline: tagline.trim() || 'Unbelievably good!',
          favorite_burger: favoriteBurger,
          comment: comment.trim(),
          customer_role: isAuthenticated ? 'Verified Customer' : 'Smash City Fan'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(true);
        // Refresh live review list
        await fetchReviews();
        // Reset form
        setComment('');
        setTagline('');
        setTimeout(() => {
          setSuccessToast(false);
          setIsModalOpen(false);
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Could not connect to the review service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="relative py-28 bg-[#0a0a0a] text-white overflow-hidden border-t border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[400px] h-[400px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header with Rating Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-widest text-amber-400">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Smash Fanatic Reviews
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-chunky tracking-tight text-white leading-none">
              LOVED BY <span className="text-amber-400">THOUSANDS</span>
            </h2>
            <p className="text-white/60 font-medium text-base sm:text-lg max-w-xl">
              Real feedback from burger enthusiasts who crave our sizzling smashed edges, pillowy brioche buns, and house sauces.
            </p>
          </div>

          {/* Right Header Stats & Action Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-xs text-white/50 font-bold uppercase tracking-wider mt-1">
                  {stats.total_reviews} Verified Ratings
                </div>
              </div>
              <div className="h-9 w-px bg-white/10" />
              <div className="text-3xl font-chunky text-amber-400">
                {stats.average_rating.toFixed(1)}
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg hover:shadow-amber-400/20 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Drop a Review
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-400/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-xl hover:shadow-2xl"
            >
              {/* Star Rating & Quote Icon */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-white/10 group-hover:text-amber-400/30 transition-colors" />
                </div>

                {/* Tagline */}
                {rev.tagline && (
                  <h4 className="text-base font-bold text-white mb-2 leading-snug line-clamp-2">
                    "{rev.tagline}"
                  </h4>
                )}

                {/* Comment Body */}
                <p className="text-white/70 text-sm leading-relaxed mb-6 font-light">
                  {rev.comment}
                </p>
              </div>

              {/* Author & Favorite Burger Footer */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {rev.customer_name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </h5>
                    <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
                      {rev.customer_role || 'Smash City Fan'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    {rev.created_formatted}
                  </span>
                </div>

                {rev.favorite_burger && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20 w-fit">
                    <Heart className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>Fav: {rev.favorite_burger}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 bg-gradient-to-r from-amber-500/10 via-white/5 to-red-500/10 border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Tried our hand-crafted smashed burgers yet?</h3>
              <p className="text-sm text-white/60">Every review helps us perfect the crunch, sear, and secret sauce.</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-white text-black hover:bg-amber-400 font-bold text-xs tracking-wider uppercase rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Leave Your Feedback
          </button>
        </div>

      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#141414] border border-white/15 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
            
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Customer Voice
              </div>
              <h3 className="text-2xl font-chunky text-white">SHARE YOUR EXPERIENCE</h3>
              <p className="text-xs text-white/60 mt-1">
                Tell the community how you enjoyed your SmashCity burger and delivery.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Success Overlay Toast */}
            {successToast && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Thank you! Your review is now live on the site.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">
                    {rating} out of 5 Stars
                  </span>
                </div>
              </div>

              {/* Name & Favorite Burger in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., Alex Walker"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
                    Favorite Burger
                  </label>
                  <select
                    value={favoriteBurger}
                    onChange={(e) => setFavoriteBurger(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none transition-colors"
                  >
                    <option value="Double Smashed Chicken Burger">Double Smashed Chicken</option>
                    <option value="Classic Cheese Smasher">Classic Cheese Smasher</option>
                    <option value="Smoky Bacon BBQ Smash">Smoky Bacon BBQ Smash</option>
                    <option value="Truffle Mushroom Smasher">Truffle Mushroom Smasher</option>
                    <option value="Spicy Ghost Pepper Smasher">Spicy Ghost Pepper Smasher</option>
                    <option value="Build Your Burger (Custom)">Build Your Burger (Custom)</option>
                  </select>
                </div>
              </div>

              {/* Headline / Tagline */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
                  Headline / Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g., Best burger I've had in 2026!"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
                  Your Review / Feedback *
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the crust, toppings, delivery speed, or overall vibe..."
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Review
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Reviews;
