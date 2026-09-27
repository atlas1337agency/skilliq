import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isSuperAdminEmail } from './admin';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email?: string;
  xp: number;
  streak: number;
  lastActive: string;
  badges: Badge[];
}

export const XP_REWARDS = {
  VIDEO_WATCHED: 10,
  COURSE_COMPLETED: 100,
  DAILY_LOGIN: 5,
};

export const AVAILABLE_BADGES = {
  FIRST_STEP: { id: 'first_step', name: 'First Step', description: 'Watched your first video', icon: '🎯' },
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', description: 'Studied past midnight', icon: '🦉' },
  SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', description: 'Completed a course in under 24 hours', icon: '⚡' },
  STREAK_7: { id: 'streak_7', name: '7-Day Streak', description: 'Logged in for 7 days straight', icon: '🔥' },
  DAILY_SCHOLAR: { id: 'daily_scholar', name: 'Daily Scholar', description: 'Completed a Daily Tech Quest', icon: '🧠' },
  STREAK_MASTER: { id: 'streak_master', name: 'Streak Champion', description: 'Completed a 7-day reward cycle', icon: '👑' },
  COURSE_CONQUEROR: { id: 'course_conqueror', name: 'Course Conqueror', description: 'Completed your first course', icon: '🏆' },
};

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'publicProfiles', uid));
  if (snap.exists()) {
    return snap.data() as PublicProfile;
  }
  return null;
}

export async function initializeOrUpdateProfile(user: { uid: string; displayName?: string | null; photoURL?: string | null; email?: string | null }) {
  if (!user.uid) return null;
  
  const currentProfile = await getPublicProfile(user.uid);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isAdmin = isSuperAdminEmail(user.email);
  
  const resolvedDisplayName = user.displayName?.trim() || (user.email ? user.email.split('@')[0] : 'Learner');
  const resolvedPhotoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedDisplayName)}&background=random`;

  if (!currentProfile) {
    const adminBadges: Badge[] = isAdmin ? [
      { id: 'admin_crown', name: 'Global Director', description: 'Global Director of ATLAS 1337 & SkilliQ', icon: '👑', unlockedAt: now.toISOString() },
      { id: 'master_architect', name: 'Master Architect', description: 'Head of SkilliQ Academic Board', icon: '🏆', unlockedAt: now.toISOString() },
      { id: 'streak_master', name: 'Streak Champion', description: '365+ Days Consistent Learning', icon: '🔥', unlockedAt: now.toISOString() }
    ] : [];

    const newProfile: PublicProfile = {
      uid: user.uid,
      displayName: isAdmin ? 'Mr. Marouan Anouar' : resolvedDisplayName,
      photoURL: resolvedPhotoURL,
      email: user.email || '',
      xp: isAdmin ? 150000 : 0,
      streak: isAdmin ? 365 : 1,
      lastActive: todayStr,
      badges: adminBadges,
    };
    await setDoc(doc(db, 'publicProfiles', user.uid), newProfile);
    return newProfile;
  } else {
    // Process Streak
    let newStreak = currentProfile.streak;
    let earnedXP = 0;
    
    // Parse dates at midnight UTC
    const lastActiveDate = new Date(currentProfile.lastActive + 'T00:00:00Z');
    const todayDate = new Date(todayStr + 'T00:00:00Z');
    
    const msDiff = todayDate.getTime() - lastActiveDate.getTime();
    const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      newStreak += 1;
      earnedXP += XP_REWARDS.DAILY_LOGIN;
    } else if (daysDiff > 1) {
      newStreak = 1; // reset streak
      earnedXP += XP_REWARDS.DAILY_LOGIN;
    }

    // Always keep Google profile info up to date
    const updates: Partial<PublicProfile> = {};
    let changed = false;

    if (user.displayName && user.displayName !== currentProfile.displayName && !isAdmin) {
      updates.displayName = user.displayName;
      changed = true;
    }
    if (user.photoURL && user.photoURL !== currentProfile.photoURL) {
      updates.photoURL = user.photoURL;
      changed = true;
    }
    if (user.email && user.email !== currentProfile.email) {
      updates.email = user.email;
      changed = true;
    }

    if (isAdmin && currentProfile.xp < 150000) {
      updates.xp = 150000;
      updates.streak = Math.max(currentProfile.streak, 365);
      updates.displayName = 'Mr. Marouan Anouar';
      changed = true;
    }

    if (daysDiff > 0) {
      updates.lastActive = todayStr;
      updates.streak = newStreak;
      updates.xp = (currentProfile.xp || 0) + earnedXP;
      changed = true;
    }

    if (changed) {
      await updateDoc(doc(db, 'publicProfiles', user.uid), updates);
      return { ...currentProfile, ...updates };
    }

    return currentProfile;
  }
}

export async function awardXPAndBadges(uid: string, eventType: 'VIDEO_WATCHED' | 'COURSE_COMPLETED', overrides?: { nightOwl?: boolean, speedDemon?: boolean }) {
  if (!uid) return;
  const profile = await getPublicProfile(uid);
  if (!profile) return;

  let earnedXP = eventType === 'VIDEO_WATCHED' ? XP_REWARDS.VIDEO_WATCHED : XP_REWARDS.COURSE_COMPLETED;
  const newBadges = [...(profile.badges || [])];
  const now = new Date();

  if (eventType === 'VIDEO_WATCHED' && !newBadges.find(b => b.id === 'first_step')) {
    newBadges.push({ ...AVAILABLE_BADGES.FIRST_STEP, unlockedAt: now.toISOString() });
  }

  if (overrides?.nightOwl && !newBadges.find(b => b.id === 'night_owl')) {
    newBadges.push({ ...AVAILABLE_BADGES.NIGHT_OWL, unlockedAt: now.toISOString() });
  }

  if (overrides?.speedDemon && !newBadges.find(b => b.id === 'speed_demon')) {
    newBadges.push({ ...AVAILABLE_BADGES.SPEED_DEMON, unlockedAt: now.toISOString() });
  }

  await updateDoc(doc(db, 'publicProfiles', uid), {
    xp: profile.xp + earnedXP,
    badges: newBadges
  });

  return { xp: profile.xp + earnedXP, badges: newBadges, earnedXP };
}

export async function awardCustomXP(uid: string, xpAmount: number, newBadge?: { id: string; name: string; description: string; icon: string; unlockedAt?: string }) {
  if (!uid) return null;
  const profile = await getPublicProfile(uid);
  if (!profile) return null;

  const newBadges = [...(profile.badges || [])];
  if (newBadge && !newBadges.find(b => b.id === newBadge.id)) {
    newBadges.push({ 
      id: newBadge.id,
      name: newBadge.name,
      description: newBadge.description,
      icon: newBadge.icon,
      unlockedAt: newBadge.unlockedAt || new Date().toISOString() 
    });
  }

  const updatedXp = (profile.xp || 0) + xpAmount;
  await updateDoc(doc(db, 'publicProfiles', uid), {
    xp: updatedXp,
    badges: newBadges
  });

  return { ...profile, xp: updatedXp, badges: newBadges };
}

