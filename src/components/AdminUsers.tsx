import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Search } from 'lucide-react';
import { useStore } from '../store/useStore';

export function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const currentUser = useStore(s => s.user);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const usrs: any[] = [];
      snap.forEach(d => usrs.push(d.data()));
      setUsers(usrs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.uid && newRole !== 'admin') {
      alert("You cannot remove your own admin privileges directly.");
      return;
    }
    
    // Update state optimistically
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

  const filteredUsers = users.filter(u => 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) || 
    (u.displayName && u.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{t('manage_users', 'Manage Users')}</h2>
      </div>

      <div className="mb-4 relative">
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          placeholder={t('search_users', 'Search users by name or email...')} 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-background border border-border rounded-lg ps-10 pe-3 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-h-[300px]">
             <table className="w-full text-sm text-left">
               <thead className="bg-muted text-muted-foreground uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">User</th>
                   <th className="px-6 py-4">Email</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt="" className="w-8 h-8 rounded-full bg-muted" referrerPolicy="no-referrer" />
                           <span className="font-semibold">{u.displayName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <select
                           value={u.role || 'student'}
                           onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                           className="bg-background border border-border text-foreground px-3 py-1.5 rounded focus:ring-primary focus:border-primary font-medium"
                           disabled={u.email === 'marouananouar02@gmail.com'}
                        >
                          <option value="student">Student</option>
                          <option value="publisher">Publisher</option>
                          <option value="admin">Admin</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={async () => {
                            if (!window.confirm("Are you sure you want to completely remove this user? This action cannot be undone.")) return;
                            try {
                              const { deleteDoc, doc } = await import('firebase/firestore');
                              await deleteDoc(doc(db, 'users', u.uid));
                              setUsers(users.filter(user => user.uid !== u.uid));
                            } catch (err: any) {
                              console.error(err);
                              alert("Failed to remove user: " + err.message);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded text-sm font-bold transition-colors"
                          disabled={u.email === 'marouananouar02@gmail.com'}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                     <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                           No users found.
                        </td>
                     </tr>
                  )}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
}
