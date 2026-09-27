import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Trophy, 
  Flame, 
  Medal, 
  Crown, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Zap, 
  Target,
  UserPlus
} from 'lucide-react';
import { PublicProfile } from '../lib/gamification';
import { isSuperAdminEmail } from '../lib/admin';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

// Official Admin profile pinned at Rank #1
const OFFICIAL_ADMIN_PROFILE: PublicProfile = {
  uid: 'admin-atlas1337',
  displayName: 'Mr. Marouan Anouar',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  email: 'atlas1337agency@gmail.com',
  xp: 154200,
  streak: 365,
  lastActive: new Date().toISOString().split('T')[0],
  badges: [
    { id: 'admin_crown', name: 'Global Director', description: 'Global Director of ATLAS 1337 & SkilliQ', icon: '👑', unlockedAt: '2025-01-01' },
    { id: 'course_conqueror', name: 'Master Architect', description: 'Mastered all engineering paths', icon: '🏆', unlockedAt: '2025-01-01' },
    { id: 'streak_master', name: 'Streak Champion', description: '365+ Days Consistent Learning', icon: '🔥', unlockedAt: '2025-01-01' },
    { id: 'speed_demon', name: 'Elite Hacker', description: 'Cyber Defense & Architecture Expert', icon: '⚡', unlockedAt: '2025-01-01' }
  ]
};

export function Leaderboard() {
  const { t, i18n } = useTranslation();
  const { user, publicProfile, language } = useStore();
  const isRtl = language === 'ar' || i18n.language === 'ar';

  const [rawLeaders, setRawLeaders] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Real-time listener for REAL Google/Gmail users from Firestore publicProfiles
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'publicProfiles'), orderBy('xp', 'desc'), limit(150));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realUsers: PublicProfile[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as PublicProfile;
        if (data && data.uid) {
          realUsers.push({
            ...data,
            uid: data.uid || docSnap.id,
            displayName: data.displayName || 'Google Learner',
            photoURL: data.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || 'Learner')}&background=random`,
            xp: Number(data.xp) || 0,
            streak: Number(data.streak) || 1,
            badges: Array.isArray(data.badges) ? data.badges : []
          });
        }
      });
      setRawLeaders(realUsers);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore snapshot listener error, falling back to getDocs", error);
      getDocs(q).then(snap => {
        const fallbackUsers: PublicProfile[] = [];
        snap.forEach(docSnap => {
          fallbackUsers.push(docSnap.data() as PublicProfile);
        });
        setRawLeaders(fallbackUsers);
      }).catch(err => {
        console.error("Failed to fetch publicProfiles", err);
      }).finally(() => {
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  // Process REAL leaderboard: Admin is ALWAYS Rank #1, followed by real users
  const sortedLeaders = useMemo(() => {
    // Clone real users
    const list = [...rawLeaders];

    // If current logged-in user is not yet in the snapshot, add them immediately
    if (user && user.uid) {
      const alreadyInList = list.some(p => p.uid === user.uid);
      if (!alreadyInList) {
        const myDisplayName = user.displayName?.trim() || (user.email ? user.email.split('@')[0] : 'Learner');
        const myPhotoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(myDisplayName)}&background=random`;
        
        list.push({
          uid: user.uid,
          displayName: isSuperAdminEmail(user.email) ? 'Mr. Marouan Anouar' : myDisplayName,
          photoURL: myPhotoURL,
          email: user.email || '',
          xp: publicProfile?.xp || 0,
          streak: publicProfile?.streak || 1,
          lastActive: new Date().toISOString().split('T')[0],
          badges: publicProfile?.badges || []
        });
      }
    }

    // Check if an admin account is present
    const adminIndex = list.findIndex(p => {
      const isEmail = isSuperAdminEmail(p.email || p.uid);
      const isName = p.displayName?.toLowerCase().includes('marouan') || p.displayName?.toLowerCase().includes('atlas');
      return isEmail || isName;
    });

    let adminProfile: PublicProfile;

    if (adminIndex !== -1) {
      // Hoist the real admin profile to #1 with top honors
      const found = list.splice(adminIndex, 1)[0];
      const maxOtherXp = list.length > 0 ? Math.max(...list.map(p => p.xp || 0)) : 100000;
      adminProfile = {
        ...found,
        displayName: 'Mr. Marouan Anouar',
        photoURL: found.photoURL || OFFICIAL_ADMIN_PROFILE.photoURL,
        xp: Math.max(found.xp || 0, maxOtherXp + 25000, 154200),
        streak: Math.max(found.streak || 0, 365),
        badges: found.badges?.length > 0 ? found.badges : OFFICIAL_ADMIN_PROFILE.badges
      };
    } else {
      // Pin the official Admin profile at #1
      const maxOtherXp = list.length > 0 ? Math.max(...list.map(p => p.xp || 0)) : 100000;
      adminProfile = {
        ...OFFICIAL_ADMIN_PROFILE,
        xp: Math.max(maxOtherXp + 25000, 154200)
      };
    }

    // Sort all other real users strictly by XP descending
    list.sort((a, b) => (b.xp || 0) - (a.xp || 0));

    // Dedup by UID
    const seenUids = new Set<string>();
    seenUids.add(adminProfile.uid);
    const uniqueList: PublicProfile[] = [];

    list.forEach(item => {
      if (item.uid && !seenUids.has(item.uid)) {
        seenUids.add(item.uid);
        uniqueList.push(item);
      }
    });

    // Admin is ALWAYS #1 at the top, followed by all real Google users
    return [adminProfile, ...uniqueList];
  }, [rawLeaders, user, publicProfile]);

  // Filter by search query
  const filteredLeaders = useMemo(() => {
    if (!searchQuery.trim()) return sortedLeaders;
    const queryLower = searchQuery.toLowerCase().trim();
    return sortedLeaders.filter(l => 
      l.displayName.toLowerCase().includes(queryLower) ||
      (l.email && l.email.toLowerCase().includes(queryLower))
    );
  }, [sortedLeaders, searchQuery]);

  // Current user's rank
  const myRankIndex = useMemo(() => {
    if (!user) return -1;
    return filteredLeaders.findIndex(l => l.uid === user.uid || (l.email && l.email.toLowerCase() === user.email?.toLowerCase()));
  }, [user, filteredLeaders]);

  // Pagination calculation
  const totalItems = filteredLeaders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentLeaders = filteredLeaders.slice(startIndex, endIndex);

  // Top 3 Podium Leaders (Real Users Only)
  const podiumTop3 = useMemo(() => {
    return [
      sortedLeaders[0], // #1 Admin
      sortedLeaders[1], // #2 Real user runner up (if exists)
      sortedLeaders[2]  // #3 Real user challenger (if exists)
    ].filter(Boolean);
  }, [sortedLeaders]);

  // Jump to user's page in pagination
  const jumpToMyRank = () => {
    if (myRankIndex !== -1) {
      const targetPage = Math.floor(myRankIndex / itemsPerPage) + 1;
      setCurrentPage(targetPage);
    }
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 text-start"
    >
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/90 to-amber-500/5 border border-border/80 p-6 sm:p-10 text-center shadow-sm">
        <div className="absolute top-0 end-0 -mt-12 -me-12 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-12 -ms-12 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>SkilliQ & ATLAS 1337 Hall of Fame</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            {t('global_leaderboard', 'Global Leaderboard')}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t('leaderboard_desc', 'Compete with developers worldwide. Earn XP by completing lessons, keep your streak alive, and unlock official badges.')}
          </p>

          {/* Real Users Count Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/60">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>
                {sortedLeaders.length} {isRtl ? 'مستخدم حقيقي مسجل' : 'Real Google Verified Learners'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/60">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRtl ? 'المشرف دائماً في الصدارة' : 'Mr. Marouan Anouar (Admin) #1'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP 3 PODIUM SHOWCASE (Real users only) */}
      {!searchQuery && podiumTop3.length > 0 && (
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 items-end max-w-4xl mx-auto">
            
            {/* RANK 2 (Runner-Up) */}
            {podiumTop3[1] ? (
              <div className="order-2 sm:order-1 flex flex-col items-center">
                <div className="w-full bg-card/90 backdrop-blur border border-slate-300 dark:border-slate-700/80 rounded-3xl p-5 text-center shadow-md relative hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                  <div className="absolute -top-4 start-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center font-black text-sm shadow-sm">
                    2
                  </div>

                  <div className="mt-2 relative inline-block mx-auto mb-3">
                    <img 
                      src={podiumTop3[1].photoURL} 
                      alt={podiumTop3[1].displayName} 
                      className="w-16 h-16 rounded-full border-2 border-slate-300 dark:border-slate-600 object-cover shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -end-1 text-base">🥈</span>
                  </div>

                  <h3 className="font-extrabold text-base text-foreground truncate max-w-full">
                    {podiumTop3[1].displayName}
                  </h3>
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-2">Runner-Up</span>

                  <div className="flex items-center justify-center gap-3 text-xs pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-orange-500" />
                      <span>{podiumTop3[1].streak}d</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{podiumTop3[1].xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="order-2 sm:order-1 hidden sm:flex flex-col items-center opacity-60">
                <div className="w-full border-2 border-dashed border-border/80 rounded-3xl p-6 text-center">
                  <Medal className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-bold text-foreground">Spot #2 Open</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Sign in with Google to claim!</p>
                </div>
              </div>
            )}

            {/* RANK 1: ADMIN CHAMPION (Center, Always Pinned) */}
            <div className="order-1 sm:order-2 flex flex-col items-center sm:-translate-y-3">
              <div className="w-full bg-gradient-to-b from-amber-500/10 via-card to-card border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-xl relative hover:shadow-2xl transition-all duration-200 hover:-translate-y-1.5">
                {/* Crown Header */}
                <div className="absolute -top-6 start-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="relative">
                    <Crown className="w-10 h-10 text-amber-500 fill-amber-400 drop-shadow-md animate-bounce" />
                    <span className="absolute -bottom-1 start-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
                      #1 Admin
                    </span>
                  </div>
                </div>

                <div className="mt-4 relative inline-block mx-auto mb-3">
                  <img 
                    src={podiumTop3[0].photoURL} 
                    alt={podiumTop3[0].displayName} 
                    className="w-20 h-20 rounded-full border-4 border-amber-500 object-cover shadow-lg ring-4 ring-amber-500/20"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -end-1 text-lg">👑</span>
                </div>

                <h3 className="font-black text-lg text-foreground truncate max-w-full flex items-center justify-center gap-1.5">
                  <span>{podiumTop3[0].displayName}</span>
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                </h3>
                
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                  Founder & Global Director
                </span>

                <div className="flex items-center justify-center gap-4 text-xs pt-3 border-t border-border/80">
                  <div className="flex items-center gap-1 text-orange-500 font-black">
                    <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                    <span>{podiumTop3[0].streak}d {isRtl ? 'تتابع' : 'Streak'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>{podiumTop3[0].xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RANK 3 (Challenger) */}
            {podiumTop3[2] ? (
              <div className="order-3 flex flex-col items-center">
                <div className="w-full bg-card/90 backdrop-blur border border-amber-700/30 rounded-3xl p-5 text-center shadow-md relative hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                  <div className="absolute -top-4 start-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-700 text-amber-100 border-2 border-white dark:border-slate-900 flex items-center justify-center font-black text-sm shadow-sm">
                    3
                  </div>

                  <div className="mt-2 relative inline-block mx-auto mb-3">
                    <img 
                      src={podiumTop3[2].photoURL} 
                      alt={podiumTop3[2].displayName} 
                      className="w-16 h-16 rounded-full border-2 border-amber-700/60 object-cover shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -end-1 text-base">🥉</span>
                  </div>

                  <h3 className="font-extrabold text-base text-foreground truncate max-w-full">
                    {podiumTop3[2].displayName}
                  </h3>
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-2">Challenger</span>

                  <div className="flex items-center justify-center gap-3 text-xs pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1 text-orange-500 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-orange-500" />
                      <span>{podiumTop3[2].streak}d</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{podiumTop3[2].xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="order-3 hidden sm:flex flex-col items-center opacity-60">
                <div className="w-full border-2 border-dashed border-border/80 rounded-3xl p-6 text-center">
                  <Medal className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-bold text-foreground">Spot #3 Open</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Sign in with Google to claim!</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 3. YOUR CURRENT RANK STRIP (If user is logged in) */}
      {user && myRankIndex !== -1 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-card border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-sm">
              #{myRankIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm sm:text-base">
                  {user.displayName || user.email || 'You'}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase">
                  {t('leaderboard_you_badge', 'YOU')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl ? 'أنت في المرتبة' : 'You are currently ranked'} #{myRankIndex + 1} {isRtl ? 'عالمياً' : 'worldwide'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={jumpToMyRank}
              className="px-4 py-2 bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
            >
              {t('leaderboard_find_me', 'Find My Rank')}
            </button>
          </div>
        </div>
      )}

      {/* 4. SEARCH & CONTROLS TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('leaderboard_search_placeholder', 'Search learners by name...')}
            className="w-full ps-10 pe-4 py-2.5 bg-card border border-border/80 rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
        </div>

        {/* Per-Page Selector (Only when there are multiple pages or users) */}
        {totalItems > 10 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto">
            <span>{t('leaderboard_per_page', 'Per page')}:</span>
            {[10, 25, 50].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer",
                  itemsPerPage === size
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/70 text-muted-foreground hover:text-foreground"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. MAIN LEADERBOARD TABLE & REAL USER ROWS */}
      <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Table Top Header */}
        <div className="px-5 py-4 border-b border-border/80 bg-muted/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="font-extrabold text-sm sm:text-base text-foreground">
              {t('top_hackers', 'Top Hackers & Developers')}
            </h2>
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            {t('leaderboard_showing', {
              start: totalItems === 0 ? 0 : startIndex + 1,
              end: endIndex,
              total: totalItems
            })}
          </div>
        </div>

        {/* Content Rows */}
        {loading ? (
          <div className="p-16 text-center text-muted-foreground space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">{t('loading_rank_data', 'Loading rank data...')}</p>
          </div>
        ) : currentLeaders.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-2">
            <Target className="w-10 h-10 mx-auto opacity-40 mb-2" />
            <p className="text-sm font-bold text-foreground">
              {isRtl ? 'لم يتم العثور على متعلمين يطابقون بحثك' : 'No learners found matching your search'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRtl ? 'جرب البحث باسم آخر أو إزالة التصفية' : 'Try searching with another name or clear filter'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {currentLeaders.map((profile, i) => {
              const globalIndex = startIndex + i;
              const isFirst = globalIndex === 0;
              const isSecond = globalIndex === 1;
              const isThird = globalIndex === 2;
              const isMe = user?.uid === profile.uid || (user?.email && profile.email && user.email.toLowerCase() === profile.email.toLowerCase());
              const isAdmin = isFirst || isSuperAdminEmail(profile.email || profile.uid);

              return (
                <div
                  key={profile.uid + globalIndex}
                  className={cn(
                    "flex items-center justify-between gap-3 sm:gap-6 p-3.5 sm:p-4 md:p-5 transition-colors",
                    isAdmin ? "bg-amber-500/5 hover:bg-amber-500/10" : isMe ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                  )}
                >
                  {/* Left: Rank & User Profile */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    
                    {/* Rank Badge */}
                    <div className="w-8 sm:w-10 flex items-center justify-center shrink-0">
                      {isFirst ? (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-sm ring-2 ring-amber-400/40">
                          <Crown className="w-4 h-4 fill-slate-950" />
                        </div>
                      ) : isSecond ? (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                          2
                        </div>
                      ) : isThird ? (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-700 text-amber-100 font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                          3
                        </div>
                      ) : (
                        <span className="font-bold text-xs sm:text-sm text-muted-foreground">
                          #{globalIndex + 1}
                        </span>
                      )}
                    </div>

                    {/* Google User Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 shadow-xs",
                          isAdmin ? "border-amber-500 ring-2 ring-amber-500/20" : isMe ? "border-primary" : "border-border"
                        )}
                        referrerPolicy="no-referrer"
                      />
                      {isAdmin && (
                        <span className="absolute -bottom-1 -end-1 text-xs">👑</span>
                      )}
                    </div>

                    {/* User Meta (Real Google Name & Badges) */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-foreground truncate max-w-[130px] min-[400px]:max-w-[180px] sm:max-w-xs">
                          {profile.displayName}
                        </span>

                        {isAdmin ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-[9px] uppercase tracking-wider shrink-0 flex items-center gap-1 border border-amber-500/30">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>{t('leaderboard_admin_badge', 'Official Admin')}</span>
                          </span>
                        ) : isMe ? (
                          <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary font-black text-[9px] uppercase tracking-wider shrink-0">
                            {t('leaderboard_you_badge', 'YOU')}
                          </span>
                        ) : null}
                      </div>

                      {/* Badges strip */}
                      <div className="hidden sm:flex items-center gap-1 mt-1">
                        {profile.badges && profile.badges.length > 0 ? (
                          profile.badges.slice(0, 4).map((badge, bIdx) => (
                            <span
                              key={badge.id + bIdx}
                              title={`${badge.name}: ${badge.description}`}
                              className="text-sm cursor-help hover:scale-125 transition-transform"
                            >
                              {badge.icon}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Google Verified Learner</span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right: Stats (Streak & Real XP) */}
                  <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                    
                    {/* Day Streak */}
                    <div className="text-center sm:text-end">
                      <div className="flex items-center justify-end gap-1 text-orange-500 font-black text-xs sm:text-sm">
                        <Flame className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", profile.streak > 2 && "fill-orange-500 animate-pulse")} />
                        <span>{profile.streak}</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider block">
                        {t('day_streak', 'Streak')}
                      </span>
                    </div>

                    {/* Total XP */}
                    <div className="text-end min-w-[70px] sm:min-w-[95px]">
                      <div className={cn(
                        "flex items-center justify-end gap-1 font-black text-xs sm:text-base leading-none",
                        isAdmin ? "text-amber-600 dark:text-amber-400" : "text-primary"
                      )}>
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>{profile.xp.toLocaleString()}</span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider block mt-0.5">
                        XP
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. SMART PAGINATION (If there are multiple pages) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Previous Page Button */}
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-card border border-border/80 text-foreground text-xs font-bold hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t('previous', 'Previous')}</span>
            </button>

            {/* Page Numbers Indicator */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                const isAdjacent = Math.abs(page - currentPage) <= 1;
                const isEdge = page === 1 || page === totalPages;

                if (!isAdjacent && !isEdge) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={page} className="px-1 text-muted-foreground text-xs">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      currentPage === page
                        ? "bg-primary text-primary-foreground shadow-xs scale-105"
                        : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-card border border-border/80 text-foreground text-xs font-bold hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <span>{t('next', 'Next')}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
