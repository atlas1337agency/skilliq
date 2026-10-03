import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface FormSubmission {
  id: string;
  type: 'dmca' | 'contact' | 'creator';
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: number;
  updatedAt?: number;
  
  // Contact form fields
  name?: string;
  email?: string;
  subject?: string;
  message?: string;

  // DMCA form fields
  takedownName?: string;
  takedownEmail?: string;
  takedownUrl?: string;
  takedownReason?: string;
  takedownDetails?: string;

  // Creator form fields
  creatorName?: string;
  channelUrl?: string;
  notes?: string;

  // Admin resolution fields
  resolvedAt?: number;
  resolvedBy?: string;
  adminNotes?: string;
}

export async function submitForm(data: Partial<FormSubmission>): Promise<FormSubmission> {
  const type = data.type || 'contact';
  const id = data.id || `sub_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const submission: FormSubmission = {
    id,
    type,
    status: data.status || 'pending',
    createdAt: data.createdAt || Date.now(),
    name: data.name || data.takedownName || data.creatorName || '',
    email: data.email || data.takedownEmail || '',
    subject: data.subject || '',
    message: data.message || '',
    takedownName: data.takedownName || data.name || '',
    takedownEmail: data.takedownEmail || data.email || '',
    takedownUrl: data.takedownUrl || '',
    takedownReason: data.takedownReason || 'Removal Request',
    takedownDetails: data.takedownDetails || '',
    creatorName: data.creatorName || data.name || '',
    channelUrl: data.channelUrl || '',
    notes: data.notes || '',
  };

  // 1. Save to Firestore
  try {
    const docRef = doc(db, 'form_submissions', id);
    await setDoc(docRef, submission);
  } catch (err) {
    console.warn('Firestore form_submissions save error (will fallback to API):', err);
  }

  // 2. Also save to server API for resilient backup & offline sync
  try {
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch (err) {
    console.warn('API form_submissions save error:', err);
  }

  return submission;
}

export async function updateSubmissionStatus(
  id: string, 
  status: 'pending' | 'reviewed' | 'resolved', 
  adminNotes?: string,
  resolvedBy?: string
): Promise<void> {
  // Update Firestore
  try {
    const docRef = doc(db, 'form_submissions', id);
    await updateDoc(docRef, {
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(resolvedBy ? { resolvedBy } : {}),
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Firestore update submission status warning:', err);
  }

  // Update server API
  try {
    await fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes: adminNotes, resolvedBy }),
    });
  } catch (err) {
    console.warn('API update submission status warning:', err);
  }
}

export async function deleteSubmission(id: string): Promise<void> {
  // Delete Firestore
  try {
    const docRef = doc(db, 'form_submissions', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete submission warning:', err);
  }

  // Delete server API
  try {
    await fetch(`/api/submissions/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('API delete submission warning:', err);
  }
}
