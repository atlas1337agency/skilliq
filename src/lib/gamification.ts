import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
};

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'publicProfiles', uid));
  if (snap.exists()) {
    return snap.data() as PublicProfile;
  }
  return null;
}

export async function initializeOrUpdateProfile(user: { uid: string; displayName?: string | null; photoURL?: string | null }) {
  if (!user.uid) return null;
  
  const currentProfile = await getPublicProfile(user.uid);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  if (!currentProfile) {
    const newProfile: PublicProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous Tracker',
      photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'A'}&background=random`,
      xp: 0,
      streak: 1,
      lastActive: todayStr,
      badges: [],
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
    } else if (daysDiff < 0) {
      // should never happen, but handle timezone skew gracefully
      return currentProfile;
    }

    if (daysDiff === 0) {
      // Already logged in today, no xp change, no streak change
      // Just update profile fields if changed
      const updates: Partial<PublicProfile> = {};
      let changed = false;
      if (user.displayName && user.displayName !== currentProfile.displayName) { updates.displayName = user.displayName; changed = true; }
      if (user.photoURL && user.photoURL !== currentProfile.photoURL) { updates.photoURL = user.photoURL; changed = true; }
      if (changed) { await updateDoc(doc(db, 'publicProfiles', user.uid), updates); }
      return { ...currentProfile, ...updates };
    }

    const newXp = currentProfile.xp + earnedXP;
    
    // Check for streak badge
    const newBadges = [...(currentProfile.badges || [])];
    if (newStreak >= 7 && !newBadges.find(b => b.id === 'streak_7')) {
      newBadges.push({ ...AVAILABLE_BADGES.STREAK_7, unlockedAt: now.toISOString() });
    }

    const updates: Partial<PublicProfile> = {
      lastActive: todayStr,
      streak: newStreak,
      xp: newXp,
      badges: newBadges
    };

    if (user.displayName) updates.displayName = user.displayName;
    if (user.photoURL) updates.photoURL = user.photoURL;

    await updateDoc(doc(db, 'publicProfiles', user.uid), updates);
    return { ...currentProfile, ...updates };
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
