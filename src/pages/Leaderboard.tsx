import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Flame, Medal, Target, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicProfile } from '../lib/gamification';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function Leaderboard() {
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const q = query(collection(db, 'publicProfiles'), orderBy('xp', 'desc'), limit(100));
        const snap = await getDocs(q);
        const data: PublicProfile[] = [];
        snap.forEach(d => {
          data.push(d.data() as PublicProfile);
        });
        setLeaders(data);
      } catch (err) {
        console.error('Error fetching leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const totalPages = Math.ceil(leaders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeaders = leaders.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center space-y-4 pt-4 sm:pt-8">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
            <Trophy className="w-10 h-10 sm:w-16 sm:h-16 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{t('global_leaderboard')}</h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-4">
            {t('leaderboard_desc')}
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center animate-pulse text-muted-foreground font-medium">
            {t('loading_rank_data')}
          </div>
        ) : (
          <div className="bg-card border border-border sm:rounded-3xl rounded-2xl overflow-hidden shadow-xl mb-12">
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-border bg-muted/30 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-bold sm:text-xl">{t('top_hackers')}</h2>
            </div>
            
            <div className="divide-y divide-border">
              {currentLeaders.map((profile, i) => {
                const actualRank = startIndex + i;
                return (
                <div key={profile.uid} className={cn("flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 hover:bg-muted/20 transition-colors", actualRank < 3 && "bg-primary/5")}>
                  {/* Rank */}
                  <div className="flex items-center gap-4 sm:w-16 shrink-0">
                    <span className={cn(
                      "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-black text-sm sm:text-lg",
                      actualRank === 0 ? "bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/20" :
                      actualRank === 1 ? "bg-slate-300 text-slate-800 shadow-md" :
                      actualRank === 2 ? "bg-amber-700 text-amber-100 shadow-md" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {actualRank + 1}
                    </span>
                    <div className="sm:hidden flex-1 flex items-center gap-3">
                      <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full border border-border" referrerPolicy="no-referrer" />
                      <p className="font-bold text-foreground line-clamp-1">{profile.displayName}</p>
                    </div>
                  </div>

                  {/* Desktop User Info */}
                  <div className="hidden sm:flex items-center gap-4 flex-1">
                    <img src={profile.photoURL} alt="" className="w-12 h-12 rounded-full border border-border" referrerPolicy="no-referrer" />
                    <div>
                      <p className="font-bold text-lg text-foreground">{profile.displayName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {profile.badges?.map(b => (
                          <span key={b.id} title={b.description} className="text-lg drop-shadow-sm cursor-help hover:scale-125 transition-transform">{b.icon}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Badges */}
                  <div className="sm:hidden flex items-center gap-2 ps-12 rtl:pe-12 rtl:ps-0">
                    {profile.badges?.map(b => (
                      <span key={b.id} title={b.description} className="text-base drop-shadow-sm">{b.icon}</span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 ps-12 sm:ps-0 rtl:pe-12 rtl:sm:pe-0 sm:ms-auto rtl:sm:me-auto rtl:sm:ms-0">
                    <div className="text-center sm:text-end rtl:sm:text-start flex items-center sm:items-end rtl:sm:items-start flex-col">
                      <div className="flex items-center gap-1.5 text-orange-500">
                        <Flame className={cn("w-4 h-4 sm:w-5 sm:h-5", profile.streak > 2 && "fill-orange-500 animate-pulse")} />
                        <span className="font-black text-base sm:text-xl leading-none">{profile.streak}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{t('day_streak')}</span>
                    </div>

                    <div className="text-center sm:text-end rtl:sm:text-start flex items-center sm:items-end rtl:sm:items-start flex-col">
                      <div className="flex items-center gap-1.5 text-blue-500">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-black text-base sm:text-2xl leading-none">{profile.xp.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{t('total_xp')}</span>
                    </div>
                  </div>
                </div>
              )})}

              {leaders.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('no_hackers_yet')}</p>
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors rtl:flex-row-reverse"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  {t('previous')}
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors rtl:flex-row-reverse"
                >
                  {t('next')}
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
