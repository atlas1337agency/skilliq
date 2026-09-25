import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ScrollingText } from '../components/ScrollingText';
import { Award, PlayCircle, CheckCircle, Trophy, Zap, Gift, Quote, Star, X, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function Dashboard() {
  const { t } = useTranslation();
  const { progress, userName, user, courses, publicProfile } = useStore();
  
  const [reviewModalCourseId, setReviewModalCourseId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, boolean>>({});

  if (!user) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to view your dashboard and progress.</p>
      </div>
    );
  }

  const startedCourses = courses.filter(c => progress[c.id]);
  const completedCourses = startedCourses.filter(c => progress[c.id]?.isCompleted);
  
  // Real Gamification Metrics
  const level = publicProfile ? Math.floor(publicProfile.xp / 100) + 1 : 1;
  const xp = publicProfile ? publicProfile.xp : 0;
  const nextLevelXp = level * 100;
  
  const quotes = [
    "“First, solve the problem. Then, write the code.” – John Johnson",
    "“Talk is cheap. Show me the code.” – Linus Torvalds",
    "“Experience is the name everyone gives to their mistakes.” – Oscar Wilde",
    "“In order to be irreplaceable, one must always be different.” – Coco Chanel",
    "“It's not a bug. It's an undocumented feature!” – Anonymous"
  ];
  // Deterministic random quote based on xp
  const quoteIndex = (xp + level) % quotes.length;

  return (
    <div className="w-full px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{t('welcome_back')} {userName}</h1>
        <p className="text-muted-foreground text-lg">{t('track_your_progress')}</p>
      </div>

      {/* Roadmap & Achievements Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" /> 
          Hacker Roadmap & Achievements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Level Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-card border border-border p-6 rounded-2xl flex flex-col relative overflow-hidden"
          >
            <div className="absolute -end-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/20 text-primary rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-muted-foreground uppercase tracking-wider">Leveling</h3>
            </div>
            <div className="mt-auto">
              <div className="flex items-end gap-2 mb-1">
                <div className="text-4xl font-black text-foreground">LVL {level}</div>
                <div className="text-lg font-bold text-muted-foreground pb-1">({xp.toLocaleString()} XP)</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-3 mb-1">
                <div 
                  className="bg-primary h-full transition-all duration-150" 
                  style={{ width: `${(xp % 100)}%` }}
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {(100 - (xp % 100))} XP to Level {level + 1}
              </p>
            </div>
          </motion.div>

          {/* Badges Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="border border-border p-6 rounded-2xl flex flex-col relative overflow-hidden bg-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 text-purple-500 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-muted-foreground uppercase tracking-wider">Badges</h3>
            </div>
            <div className="mt-auto">
              <div className="flex flex-wrap gap-2">
                {publicProfile && publicProfile.badges.length > 0 ? (
                  publicProfile.badges.map(b => (
                    <div key={b.id} title={b.description} className="flex flex-col items-center p-2 bg-muted/50 border border-border rounded-lg hover:scale-110 cursor-help transition-transform">
                      <span className="text-2xl drop-shadow-sm">{b.icon}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">No badges yet. Start watching videos to earn some!</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Streak Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-card border border-border p-6 rounded-2xl flex flex-col relative overflow-hidden"
          >
            <div className="absolute -end-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-muted-foreground uppercase tracking-wider">Current Streak</h3>
            </div>
            <div className="mt-auto">
              <div className="flex items-end gap-2 mb-1">
                <div className="text-4xl font-black text-foreground">{publicProfile?.streak || 0}</div>
                <div className="text-lg font-bold text-muted-foreground pb-1">Days</div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
                Log in and watch videos consecutively to maintain your daily streak!
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Active Courses</h2>
      </div>

      {startedCourses.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t('no_courses_yet')}</h3>
          <p className="text-muted-foreground mb-6">Start your learning journey today.</p>
          <Link 
            to="/"
            className="px-6 py-3 bg-foreground text-background rounded-full font-bold shadow hover:shadow-lg hover:bg-foreground/90 transition-all active:scale-95 inline-block"
          >
            {t('explore_courses')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {startedCourses.map(course => {
            const courseProgress = progress[course.id];
            const percentComplete = Math.round((courseProgress.completedVideoIds.length / course.videos.length) * 100);
            const isCompleted = courseProgress.isCompleted;

            return (
              <div key={course.id} className="flex flex-col sm:flex-row bg-card rounded-2xl border border-border overflow-hidden">
                <div className="w-full sm:w-48 h-48 sm:h-auto relative bg-muted shrink-0">
                  {course.language && (
                    <div className="absolute top-2 start-2 z-10 bg-black/70 backdrop-blur text-white px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                      {course.language}
                    </div>
                  )}
                  {course.thumbnail?.trim() ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                       <span className="text-muted-foreground font-medium text-xs text-center line-clamp-2">{course.title}</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">{course.title}</h3>
                  <div className="flex mb-4 text-sm text-muted-foreground w-[90%]">
                    <ScrollingText>{course.instructor}</ScrollingText>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{percentComplete}% {t('completed')}</span>
                      <span className="text-muted-foreground">{courseProgress.completedVideoIds.length}/{course.videos.length} {t('videos')}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-4">
                      <div 
                        className={`h-full transition-all duration-150 ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} 
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {isCompleted ? (
                        <>
                          <button 
                            onClick={() => setReviewModalCourseId(course.id)}
                            disabled={submittedReviews[course.id]}
                            className="w-full py-2 px-2 bg-foreground text-background rounded-lg font-bold text-center hover:bg-foreground/90 active:scale-[0.98] transition-all text-xs sm:text-sm shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap overflow-hidden text-ellipsis"
                          >
                            {submittedReviews[course.id] ? 'Reviewed' : t('review_course')}
                          </button>
                          <Link 
                            to={`/course/${course.id}`}
                            className="w-full py-2 px-2 bg-muted text-foreground border border-border rounded-lg font-bold text-center hover:bg-muted/80 active:scale-[0.98] transition-all text-xs sm:text-sm shadow-sm hover:shadow whitespace-nowrap"
                          >
                            Re-watch
                          </Link>
                          <Link 
                            to={`/certificate/${course.id}`}
                            className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 active:scale-[0.98] transition-all text-xs sm:text-sm shadow-sm hover:shadow whitespace-nowrap"
                          >
                            <Award className="w-4 h-4" />
                            {t('certificate')}
                          </Link>
                        </>
                      ) : (
                        <Link 
                          to={`/course/${course.id}`}
                          className="col-span-2 py-2 px-3 bg-foreground text-background rounded-lg font-bold text-center hover:bg-foreground/90 active:scale-[0.98] transition-all text-sm shadow-sm hover:shadow"
                        >
                          {t('continue_learning')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalCourseId && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative"
          >
            <button 
              onClick={() => setReviewModalCourseId(null)}
              className="absolute top-4 end-4 p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-bold mb-2">Leave a Review</h3>
            <p className="text-muted-foreground text-sm mb-6">
              How was '{courses.find(c => c.id === reviewModalCourseId)?.title}'? Share your experience!
            </p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground opacity-30'}`} 
                  />
                </button>
              ))}
            </div>
            
            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review here... (Optional)"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm min-h-[100px] mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            
            <button 
              onClick={() => {
                setIsSubmittingReview(true);
                // Simulate network request
                setTimeout(() => {
                  setSubmittedReviews(prev => ({...prev, [reviewModalCourseId]: true}));
                  setIsSubmittingReview(false);
                  setReviewModalCourseId(null);
                  setReviewText('');
                  setReviewRating(5);
                }, 800);
              }}
              disabled={isSubmittingReview}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
