import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, BookOpen, Award, Activity, Clock, ShieldAlert, ChevronLeft, ChevronRight, Globe, TrendingUp, Key } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
}

interface ProgressData {
  courseId: string;
  completedVideoIds: string[];
  currentVideoId: string;
  isCompleted: boolean;
  completionDate?: string;
}

interface UserWithProgress extends UserData {
  progress: ProgressData[];
}

// Generate weekly mock data mixed with real user count
const generateTrafficData = (topValue: number) => {
  const data = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let base = Math.max(10, Math.floor(topValue / 2));
  for (let i = 0; i < 7; i++) {
    base = base + Math.floor(Math.random() * 20) - 5;
    if (base < 0) base = 5;
    data.push({
      name: days[i],
      visitors: base,
      pageViews: base * (Math.floor(Math.random() * 3) + 2)
    });
  }
  return data;
};

export function AdminAnalytics() {
  const { courses } = useStore();
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [topLocations, setTopLocations] = useState<any[]>([
     { country: 'United States', flag: '🇺🇸', percent: 45 },
     { country: 'United Kingdom', flag: '🇬🇧', percent: 18 },
     { country: 'Germany', flag: '🇩🇪', percent: 12 },
     { country: 'India', flag: '🇮🇳', percent: 9 },
     { country: 'Other', flag: '🌍', percent: 16 },
  ]);
  const [isDemoData, setIsDemoData] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const usersPerPage = 10;

  const handleRoleChange = async (userId: string, newRole: string) => {
    const currentUser = useStore.getState().user;
    if (userId === currentUser?.uid && newRole !== 'admin') {
      alert("You cannot remove your own admin privileges directly.");
      return;
    }
    
    const prevUsers = [...users];
    setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err: any) {
      console.error(err);
      alert("Failed to update user role: " + err.message);
      setUsers(prevUsers);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.uid !== userId));
    } catch (err: any) {
      console.error(err);
      alert("Failed to remove user: " + err.message);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList: UserData[] = [];
        usersSnap.forEach(d => {
          usersList.push(d.data() as UserData);
        });

        const usersProgressPromises = usersList.map(async (u) => {
          const progSnap = await getDocs(collection(db, `users/${u.uid}/progress`));
          const progs: ProgressData[] = [];
          progSnap.forEach(p => {
            progs.push(p.data() as ProgressData);
          });
          return { ...u, progress: progs };
        });

        const fullUsers = await Promise.all(usersProgressPromises);
        
        fullUsers.sort((a, b) => {
          const aComps = a.progress.filter(p => p.isCompleted).length;
          const bComps = b.progress.filter(p => p.isCompleted).length;
          return bComps - aComps;
        });

        setUsers(fullUsers);
        
        // Fetch Live Traffic from API
        try {
          const apiBaseUrl = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${apiBaseUrl}/api/analytics`);
          let data;
          const textRes = await res.text();
          try {
            data = JSON.parse(textRes);
          } catch(e) {
            throw new Error(`Invalid API response. Check Vercel logs or deployment. (Response: ${textRes.substring(0, 30)}...)`);
          }
          
          if (data && !data.useDemo && data.traffic) {
             setIsDemoData(false);
             setNeedsSetup(false);
             setNeedsAuth(false);
             
             // Format Traffic Data
             const rows = data.traffic.rows || [];
             // GA4 returns ascending date normally, but we need to ensure sort just in case
             rows.sort((a: any, b: any) => a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value));
             
             const _trafficData = rows.map((row: any) => ({
                name: row.dimensionValues[0].value.substring(4,6) + '/' + row.dimensionValues[0].value.substring(6,8), // display MM/DD
                visitors: parseInt(row.metricValues[0].value),
                pageViews: parseInt(row.metricValues[1].value)
             }));
             if (_trafficData.length > 0) setTrafficData(_trafficData);

             // Format Locations Data
             const locRows = data.locations.rows || [];
             let totalUsers = 0;
             locRows.forEach((r: any) => totalUsers += parseInt(r.metricValues[0].value));
             
             if (totalUsers > 0) {
               const _topLocations = locRows.slice(0, 5).map((row: any) => {
                 let pct = Math.round((parseInt(row.metricValues[0].value) / totalUsers) * 100);
                 return {
                   country: row.dimensionValues[0].value,
                   flag: '📍', 
                   percent: pct
                 }
               });
               setTopLocations(_topLocations);
             } else {
               setTopLocations([]);
             }

          } else {
             // Fallback to Demo
             setIsDemoData(true);
             if (data.needsSetup) setNeedsSetup(true);
             if (data.needsAuth) setNeedsAuth(true);
             if (data.error) setErrorMsg(data.error);
             setTrafficData(generateTrafficData(fullUsers.length * 5 || 50));
          }
        } catch(e: any) {
             setIsDemoData(true);
             setErrorMsg(e?.message || "Failed to parse API response");
             setTrafficData(generateTrafficData(fullUsers.length * 5 || 50));
        }
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAuthGoogleAnalytics = async () => {
    if (window.self !== window.top) {
      alert("Please open the app in a new tab to link Google Analytics. You can click the link below the button.");
      return;
    }
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const redirectUri = (apiBaseUrl || window.location.origin) + '/api/analytics/oauth/callback';
      const res = await fetch(`${apiBaseUrl}/api/analytics/oauth/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      alert("Failed to initialize Google Analytics Auth.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse font-medium text-muted-foreground">Loading Analytics...</div>;
  }

  const totalUsers = users.length;
  const totalCertificates = users.reduce((acc, u) => acc + u.progress.filter(p => p.isCompleted).length, 0);
  const activeLearners = users.filter(u => u.progress.length > 0).length;

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-75">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 md:p-6 rounded-2xl flex items-center justify-start gap-4 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-0.5 md:mb-1">Total Users</p>
            <p className="text-2xl md:text-3xl font-black">{totalUsers}</p>
          </div>
        </div>
        
        <div className="bg-card border border-border p-4 md:p-6 rounded-2xl flex items-center justify-start gap-4 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-0.5 md:mb-1">Active Learners</p>
            <p className="text-2xl md:text-3xl font-black">{activeLearners}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-4 md:p-6 rounded-2xl flex items-center justify-start gap-4 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-0.5 md:mb-1">Certs Issued</p>
            <p className="text-2xl md:text-3xl font-black">{totalCertificates}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-4 md:p-6 rounded-2xl flex items-center justify-start gap-4 shadow-sm">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-0.5 md:mb-1">Total Courses</p>
            <p className="text-2xl md:text-3xl font-black">{courses.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <div>
               <h2 className="text-lg md:text-xl font-bold tracking-tight">Traffic Overview {isDemoData && "(Preview)"}</h2>
               {isDemoData && <p className="text-xs md:text-sm text-muted-foreground">Demo Data. Complete OAuth Setup to see live traffic.</p>}
             </div>
             
              {isDemoData ? (
               <div className="flex flex-col items-end gap-2">
                 <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> DEMO
                 </div>
                 {errorMsg && (
                    <div className="text-xs text-red-500 mt-2 max-w-[250px] text-end border border-red-500/30 p-2 rounded bg-red-500/10 dark:bg-red-500/20">
                      <p className="font-bold mb-1">Analytics API Error:</p>
                      {errorMsg}
                    </div>
                 )}
                 {needsAuth && !needsSetup && (
                   <button onClick={handleAuthGoogleAnalytics} className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                     <Key className="w-3 h-3" /> Link Google Analytics
                   </button>
                 )}
                 {needsAuth && !needsSetup && window.self !== window.top && (
                    <div className="text-xs text-amber-500 mt-2 max-w-[200px] text-end">
                      Google OAuth requires a new tab. <a href={window.location.href} target="_blank" rel="noreferrer" className="underline font-bold">Open App in New Tab</a> to link.
                    </div>
                 )}
                 {needsAuth && !needsSetup && (
                   <div className="text-xs text-muted-foreground mt-2 max-w-[250px] text-end border border-border p-2 rounded bg-muted/20">
                     <p className="font-bold mb-1">Important:</p>
                     Add this exact URL to your <b>Authorized redirect URIs</b> in Google Cloud Console:
                     <code className="block mt-1 p-1 bg-background text-[10px] break-all border border-border rounded select-all cursor-pointer">
                       {(import.meta.env.VITE_API_URL || window.location.origin) + '/api/analytics/oauth/callback'}
                     </code>
                   </div>
                 )}
               </div>
             ) : (
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                   <TrendingUp className="w-3 h-3" /> LIVE
                </div>
             )}
          </div>
          <div className="flex-1 w-full h-[250px] min-h-[250px]">
            <ResponsiveContainer width="100%" height={250} minWidth={0}>
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-bold tracking-tight">Top Locations {isDemoData && "(Preview)"}</h2>
          </div>
          {isDemoData && (
             <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
               This is UI demonstration data. Add your <b>GOOGLE_CLIENT_ID</b> and <b>GOOGLE_CLIENT_SECRET</b> in settings, then link your account to get live API metrics.
             </p>
          )}
          <div className="space-y-4 flex-1">
             {topLocations.length === 0 && !isDemoData && (
               <p className="text-sm text-muted-foreground text-center py-4">No location active data yet for the last 7 days.</p>
             )}
             {topLocations.map((loc, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{loc.flag}</span>
                    <span className="text-sm font-medium">{loc.country}</span>
                  </div>
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${loc.percent}%` }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-end">{loc.percent}%</span>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">User Analytics & Live Progress</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Real-time view of all users and their mastery level.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs md:text-sm uppercase tracking-wider">
                <th className="p-3 md:p-4 font-semibold">User</th>
                <th className="p-3 md:p-4 font-semibold">Role</th>
                <th className="p-3 md:p-4 font-semibold">Learning Progress</th>
                <th className="p-3 md:p-4 font-semibold">Trophies / Certs</th>
                <th className="p-3 md:p-4 font-semibold">Live Activity</th>
                <th className="p-3 md:p-4 font-semibold text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentUsers.map(u => {
                const certificates = u.progress.filter(p => p.isCompleted).length;
                const activeCourses = u.progress.filter(p => !p.isCompleted).length;
                
                const latestProgress = [...u.progress].sort((a,b) => {
                  const d1 = a.completionDate ? new Date(a.completionDate).getTime() : 0;
                  const d2 = b.completionDate ? new Date(b.completionDate).getTime() : 0;
                  return d2 - d1;
                })[0];

                const courseInfo = latestProgress ? courses.find(c => c.id === latestProgress.courseId) : null;

                return (
                  <tr key={u.uid} className="hover:bg-muted/20 transition-colors group">
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}&background=random`} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
                        <div>
                          <p className="font-bold text-sm md:text-base text-foreground line-clamp-1">{u.displayName}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground font-mono line-clamp-1">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <select
                        value={u.role || 'student'}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                        className="bg-background border border-border text-foreground px-2 py-1 md:px-3 md:py-1.5 rounded focus:ring-primary focus:border-primary font-medium text-xs md:text-sm"
                        disabled={u.email === 'marouananouar02@gmail.com'}
                      >
                        <option value="student">Student</option>
                        <option value="publisher">Publisher</option>
                        <option value="admin">Admin</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex gap-3 md:gap-4">
                        <div className="text-center">
                          <p className="text-lg md:text-xl font-bold">{u.progress.length}</p>
                          <p className="text-[9px] md:text-[10px] uppercase text-muted-foreground font-bold">Enrolled</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg md:text-xl font-bold">{activeCourses}</p>
                          <p className="text-[9px] md:text-[10px] uppercase text-muted-foreground font-bold">Active</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      {certificates > 0 ? (
                        <div className="flex items-center gap-1.5 md:gap-2 text-emerald-600 dark:text-emerald-400">
                          <Award className="w-4 h-4 md:w-5 md:h-5 drop-shadow-md" />
                          <span className="font-black text-base md:text-lg">{certificates}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs md:text-sm font-medium">None</span>
                      )}
                    </td>
                    <td className="p-3 md:p-4 max-w-[200px]">
                      {latestProgress ? (
                        <div className="flex flex-col gap-0.5 md:gap-1">
                          <span className="text-[10px] md:text-xs font-semibold text-primary">{latestProgress.isCompleted ? 'Completed:' : 'Watching:'}</span>
                          <span className="text-xs md:text-sm font-medium line-clamp-2 md:line-clamp-1" title={courseInfo?.title || latestProgress.courseId}>
                            {courseInfo?.title || 'Unknown Course'}
                          </span>
                          <span className="text-[10px] md:text-xs text-muted-foreground font-mono">
                            {latestProgress.completedVideoIds.length} videos done
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> No activity
                        </span>
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-end">
                      <button
                        onClick={() => handleRemoveUser(u.uid)}
                        className="text-red-500 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap"
                        disabled={u.email === 'marouananouar02@gmail.com'}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-border bg-muted/10">
            <span className="text-xs md:text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{indexOfFirstUser + 1}</span> to{' '}
              <span className="font-medium text-foreground">
                {Math.min(indexOfLastUser, totalUsers)}
              </span>{' '}
              of <span className="font-medium text-foreground">{totalUsers}</span> users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 md:p-2 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      currentPage === number
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'hover:bg-muted text-muted-foreground font-medium'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
              <div className="sm:hidden text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 md:p-2 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
