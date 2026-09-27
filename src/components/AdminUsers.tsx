import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Loader2, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  Download, 
  Trash2, 
  UserX, 
  BookOpen, 
  Award, 
  Mail, 
  ExternalLink 
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { isSuperAdminEmail } from '../lib/admin';
import { cn } from '../lib/utils';

interface AdminUserData {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  enrolledCount?: number;
  completedCount?: number;
  xp?: number;
  streak?: number;
}

export function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'publisher' | 'student' | 'blocked'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const currentUser = useStore(s => s.user);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch from 'users' collection
      const usersSnap = await getDocs(collection(db, 'users'));
      const userMap = new Map<string, AdminUserData>();

      usersSnap.forEach(d => {
        const data = d.data();
        userMap.set(d.id, {
          uid: d.id,
          email: data.email || '',
          displayName: data.displayName || 'Learner',
          photoURL: data.photoURL || '',
          role: data.role || (isSuperAdminEmail(data.email) ? 'admin' : 'student'),
          enrolledCount: 0,
          completedCount: 0
        });
      });

      // 2. Fetch publicProfiles to merge XP, streak, and any additional registered users
      try {
        const publicSnap = await getDocs(collection(db, 'publicProfiles'));
        publicSnap.forEach(d => {
          const p = d.data();
          const existing = userMap.get(d.id);
          if (existing) {
            existing.xp = p.xp || 0;
            existing.streak = p.streak || 1;
            if (!existing.photoURL && p.photoURL) existing.photoURL = p.photoURL;
            if (!existing.displayName && p.displayName) existing.displayName = p.displayName;
          } else {
            userMap.set(d.id, {
              uid: d.id,
              email: p.email || '',
              displayName: p.displayName || 'Learner',
              photoURL: p.photoURL || '',
              role: isSuperAdminEmail(p.email) ? 'admin' : 'student',
              xp: p.xp || 0,
              streak: p.streak || 1,
              enrolledCount: 0,
              completedCount: 0
            });
          }
        });
      } catch (profErr) {
        console.warn("Could not merge public profiles in admin view", profErr);
      }

      setUsers(Array.from(userMap.values()));
    } catch (err) {
      console.error("Error fetching users for admin", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.uid && newRole !== 'admin') {
      alert("You cannot remove your own admin privileges.");
      return;
    }
    
    // Optimistic UI update
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

  const handleDeleteUser = async (userId: string, userEmail?: string) => {
    if (isSuperAdminEmail(userEmail)) {
      alert("Cannot delete primary administrator account.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this user? All their data will be removed.")) {
      return;
    }

    const prevUsers = [...users];
    setUsers(users.filter(u => u.uid !== userId));

    try {
      await deleteDoc(doc(db, 'users', userId));
      try {
        await deleteDoc(doc(db, 'publicProfiles', userId));
      } catch (e) {
        // ignore if not present
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete user: " + err.message);
      setUsers(prevUsers);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      let csv = "\uFEFFUser ID,Email,Display Name,Role,XP,Streak\n";
      users.forEach(u => {
        const safeName = (u.displayName || 'Unknown').replace(/"/g, '""');
        const safeEmail = (u.email || '').replace(/"/g, '""');
        csv += `"${u.uid}","${safeEmail}","${safeName}","${u.role || 'student'}",${u.xp || 0},${u.streak || 1}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Skilliq_Users_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error", err);
      alert("Failed to export users CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) || 
        (u.displayName && u.displayName.toLowerCase().includes(search.toLowerCase())) ||
        u.uid.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            <span>{t('manage_users', 'User Management')}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {users.length} Total
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage authenticated Google accounts, roles, access permissions, and export records.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting || users.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border/80 hover:bg-muted text-foreground text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>{isExporting ? 'Exporting...' : 'Export Users (CSV)'}</span>
        </button>
      </div>

      {/* Search & Role Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input 
            type="text" 
            placeholder={t('search_users', 'Search users by name, email, or UID...')} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 bg-card border border-border/80 rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          {(['all', 'admin', 'publisher', 'student', 'blocked'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold capitalize transition-all cursor-pointer text-xs shrink-0",
                roleFilter === role
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Display (Responsive: Table on Laptop/Tablet, Cards on Mobile) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold">Loading registered users from Firestore...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/80 p-6">
          <UserX className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm font-bold text-foreground">No users found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or role filters.</p>
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          
          {/* DESKTOP & TABLET TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs rtl:text-right">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/80">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5 text-center">XP & Streak</th>
                  <th className="px-5 py-3.5 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map(u => {
                  const isAdminUser = isSuperAdminEmail(u.email);

                  return (
                    <tr key={u.uid} className="hover:bg-muted/30 transition-colors">
                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || 'U')}&background=random`} 
                            alt="" 
                            className="w-9 h-9 rounded-full border border-border object-cover bg-muted" 
                            referrerPolicy="no-referrer" 
                          />
                          <div>
                            <span className="font-bold text-foreground block truncate max-w-[180px]">
                              {u.displayName || 'Anonymous'}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground truncate block max-w-[150px]">
                              {u.uid}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 text-muted-foreground font-mono">
                        {u.email || '—'}
                      </td>

                      {/* Role Selector */}
                      <td className="px-5 py-3.5">
                        <select
                          value={u.role || 'student'}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                          disabled={isAdminUser}
                          className="bg-card border border-border/80 text-foreground px-2.5 py-1.5 rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="student">Student</option>
                          <option value="publisher">Publisher</option>
                          <option value="admin">Admin</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </td>

                      {/* XP & Streak */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-bold text-primary">{(u.xp || 0).toLocaleString()} XP</span>
                          <span className="text-orange-500 font-bold">• {u.streak || 1}d</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-end">
                        <button
                          onClick={() => handleDeleteUser(u.uid, u.email)}
                          disabled={isAdminUser}
                          title={isAdminUser ? "Primary Admin cannot be removed" : "Delete User"}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden divide-y divide-border/60">
            {filteredUsers.map(u => {
              const isAdminUser = isSuperAdminEmail(u.email);

              return (
                <div key={u.uid} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || 'U')}&background=random`} 
                        alt="" 
                        className="w-10 h-10 rounded-full border border-border object-cover bg-muted shrink-0" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-foreground block truncate">
                          {u.displayName || 'Anonymous'}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block font-mono">
                          {u.email || u.uid}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteUser(u.uid, u.email)}
                      disabled={isAdminUser}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg shrink-0 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary text-[11px]">{(u.xp || 0).toLocaleString()} XP</span>
                      <span className="text-orange-500 font-bold text-[11px]">🔥 {u.streak || 1}d</span>
                    </div>

                    <select
                      value={u.role || 'student'}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      disabled={isAdminUser}
                      className="bg-card border border-border/80 text-foreground px-2 py-1 rounded-lg text-xs font-bold"
                    >
                      <option value="student">Student</option>
                      <option value="publisher">Publisher</option>
                      <option value="admin">Admin</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
