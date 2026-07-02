import { 
  getDocument, 
  setDocument, 
  addDocument, 
  updateDocument, 
  deleteDocument,
  getCollectionData
} from '../firebase/firestore';

// --------------------------------------------------------------------------
// 1. HERO SECTION (SINGLETON)
// --------------------------------------------------------------------------
export async function getHeroData() {
  return await getDocument('hero', 'singleton');
}

export async function saveHeroData(data: any) {
  await setDocument('hero', 'singleton', data);
}

// --------------------------------------------------------------------------
// 2. ABOUT US SECTION (SINGLETON)
// --------------------------------------------------------------------------
export async function getAboutData() {
  return await getDocument('about', 'singleton');
}

export async function saveAboutData(data: any) {
  await setDocument('about', 'singleton', data);
}

// --------------------------------------------------------------------------
// 3. WEBSITE SETTINGS (SINGLETON)
// --------------------------------------------------------------------------
export async function getSettingsData() {
  return await getDocument('settings', 'singleton');
}

export async function saveSettingsData(data: any) {
  await setDocument('settings', 'singleton', data);
}

// --------------------------------------------------------------------------
// 4. ART CATEGORIES
// --------------------------------------------------------------------------
export async function fetchCategories() {
  return await getCollectionData('categories');
}

export async function createCategory(id: string, data: any) {
  await setDocument('categories', id, data);
}

export async function editCategory(id: string, data: any) {
  await updateDocument('categories', id, data);
}

export async function removeCategory(id: string) {
  await deleteDocument('categories', id);
}

// --------------------------------------------------------------------------
// 5. EVENTS PERFORMANCES
// --------------------------------------------------------------------------
export async function fetchEvents() {
  return await getCollectionData('events');
}

export async function createEvent(id: string, data: any) {
  await setDocument('events', id, data);
}

export async function editEvent(id: string, data: any) {
  await updateDocument('events', id, data);
}

export async function removeEvent(id: string) {
  await deleteDocument('events', id);
}

// --------------------------------------------------------------------------
// 6. GALLERY MASONRY
// --------------------------------------------------------------------------
export async function fetchGallery() {
  return await getCollectionData('gallery');
}

export async function createGalleryItem(data: any) {
  return await addDocument('gallery', data);
}

export async function editGalleryItem(id: string, data: any) {
  await updateDocument('gallery', id, data);
}

export async function removeGalleryItem(id: string) {
  await deleteDocument('gallery', id);
}

// --------------------------------------------------------------------------
// 7. TEAM DIRECTORY
// --------------------------------------------------------------------------
export async function fetchTeamMembers() {
  return await getCollectionData('team');
}

export async function createTeamMember(data: any) {
  return await addDocument('team', data);
}

export async function editTeamMember(id: string, data: any) {
  await updateDocument('team', id, data);
}

export async function removeTeamMember(id: string) {
  await deleteDocument('team', id);
}

// --------------------------------------------------------------------------
// 8. MEMBERSHIP APPLICATIONS
// --------------------------------------------------------------------------
export async function fetchMemberships() {
  return await getCollectionData('memberships');
}

export async function createMembership(data: any) {
  return await addDocument('memberships', data);
}

export async function updateMembershipStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
  await updateDocument('memberships', id, { status });
}

// --------------------------------------------------------------------------
// 9. CONTACT INBOX MESSAGES
// --------------------------------------------------------------------------
export async function fetchContactMessages() {
  return await getCollectionData('contactMessages');
}

export async function createContactMessage(data: any) {
  return await addDocument('contactMessages', data);
}

export async function markContactMessageRead(id: string, read: boolean) {
  await updateDocument('contactMessages', id, { read });
}

export async function removeContactMessage(id: string) {
  await deleteDocument('contactMessages', id);
}

// --------------------------------------------------------------------------
// 10. ANNOUNCEMENTS NOTICES
// --------------------------------------------------------------------------
export async function fetchAnnouncements() {
  return await getCollectionData('announcements');
}

export async function createAnnouncement(data: any) {
  return await addDocument('announcements', data);
}

export async function editAnnouncement(id: string, data: any) {
  await updateDocument('announcements', id, data);
}

export async function removeAnnouncement(id: string) {
  await deleteDocument('announcements', id);
}

// --------------------------------------------------------------------------
// 11. USERS & ROLES
// --------------------------------------------------------------------------
export async function fetchAdmins() {
  return await getCollectionData('users');
}

export async function registerAdmin(uid: string, data: any) {
  await setDocument('users', uid, data);
}

export async function removeAdmin(uid: string) {
  await deleteDocument('users', uid);
}

// --------------------------------------------------------------------------
// 12. ACTIVITY AUDIT LOGS
// --------------------------------------------------------------------------
export async function fetchActivityLogs() {
  return await getCollectionData('activityLogs');
}

export async function addActivityLog(user: string, role: string, action: string) {
  const log = {
    user,
    role,
    action,
    time: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString()
  };
  return await addDocument('activityLogs', log);
}

export async function clearAllActivityLogs(logsList: any[]) {
  for (const log of logsList) {
    await deleteDocument('activityLogs', log.id);
  }
}
