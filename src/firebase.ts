/**
 * SCU ArtCircle - Firebase & Emulator Service Gateway
 * Supports production Firebase credentials via environment variables,
 * or falls back to a full client-side simulated emulator (localStorage based).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Types
export interface AdminUser {
    uid: string;
    username: string;
    name: string;
    role: 'Super Admin' | 'Admin' | 'Editor' | 'Event Manager' | 'Gallery Manager';
    email: string;
    avatar: string;
    twoFactorEnabled?: boolean;
}

const DEFAULT_SETTINGS = {
    websiteName: 'SCU ArtCircle',
    logo: 'ASSETS/logos/logo.jpg',
    favicon: 'favicon.ico',
    footerText: '© 2026 SCU ArtCircle. All rights reserved. Created with ♥ for creativity.',
    email: 'info@scuartcircle.org',
    phone: '+1 (555) 123-4567',
    address: 'SCU Campus, Main Creative Center, Room 402',
    googleMaps: 'https://maps.google.com/?q=SCU+Campus',
    facebook: '#',
    instagram: '#',
    tiktok: '#',
    seoTitle: 'SCU ArtCircle - Where Creativity Takes The Stage',
    seoDescription: 'A creative community celebrating music, dance, visual arts, and literature at SCU.',
    metaKeywords: 'SCU, Art, Circle, Music, Dance, Drama, Visual Arts, Creative Community',
    openGraphImage: 'ASSETS/images/Singers.svg',
    analyticsCode: 'UA-XXXXX-Y',
    maintenanceMode: false
};

const DEFAULT_HERO = {
    logoUrl: 'ASSETS/logos/logo.jpg',
    videoUrl: 'ASSETS/videos/HeroVideo.webm',
    videoFallbackUrl: 'ASSETS/videos/HeroVideo.mov',
    title: 'Where Creativity',
    titleHighlight: 'Stage.',
    description: 'From soulful melodies to powerful performances, we bring ideas to life.',
    primaryButtonText: 'Upcoming Events',
    primaryButtonLink: '#events',
    secondaryButtonText: 'Explore Gallery',
    secondaryButtonLink: '#gallery',
    facebookLink: '#',
    instagramLink: '#',
    tiktokLink: '#',
    avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80'
    ],
    avatarText: 'A creative community celebrating music, dance, and visual arts.',
    upcomingEventCard: {
        title: 'Swara 2026',
        subtitle: 'Coming Soon',
        link: '#events'
    },
    joinCard: {
        title: 'Join Our Community',
        buttonText: 'Become a Member',
        link: '#contact'
    },
    visibility: {
        logo: true,
        avatars: true,
        socials: true,
        upcomingCard: true,
        joinCard: true
    }
};

const DEFAULT_ABOUT = {
    tag: 'OUR STORY',
    heading: 'Built on Creativity, Driven by Community',
    description: 'Founded with a vision to create a vibrant space for artistic expression, ArtCircle has grown into a creative hub where ideas come to life and talents shine.',
    buttonText: 'Learn More',
    buttonLink: '#',
    largeCardImage: 'ASSETS/images/Singers.svg',
    largeCardOverlayText: 'Dance. Express. Inspire.',
    largeCardLink: '#',
    slides: [
        { id: 1, image: 'ASSETS/images/Dancing girls.svg', title: 'Music', description: 'Creating unforgettable experiences through rhythm and melody.' },
        { id: 2, image: 'ASSETS/images/Awurudu Dramaa.jfif', title: 'Drama', description: 'Bringing stories to life through emotion, expression, and performance.' },
        { id: 3, image: 'ASSETS/images/Awurudu Dance.jpg', title: 'Dance', description: 'Expressing creativity through movement, energy, and passion.' },
        { id: 4, image: 'ASSETS/images/Visual Art.jpg', title: 'Visual Arts', description: 'From colors to concepts, we turn imagination into masterpieces.' }
    ],
    mission: {
        logoUrl: 'ASSETS/logos/Art circle logo.PNG',
        tag: 'OUR MISSION',
        heading: 'Empowering Artists. Enriching Lives.',
        description: 'We aim to nurture creativity, encourage collaboration, and provide opportunities for every artist to grow.',
        communityImage: 'ASSETS/images/Community.JPG'
    },
    stats: [
        { icon: 'fas fa-users', number: '500+', label: 'Active Members' },
        { icon: 'fas fa-music', number: '50+', label: 'Events Organized' },
        { icon: 'fas fa-trophy', number: '20+', label: 'Achievements' }
    ]
};

// Check if production keys exist
const useEmulator = !import.meta.env.VITE_FIREBASE_API_KEY;

// Production Firebase Instantiation
let productionApp: any = null;
let productionAuth: any = null;
let productionDb: any = null;
let productionStorage: any = null;

if (!useEmulator) {
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    productionApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    productionAuth = getAuth(productionApp);
    productionDb = getFirestore(productionApp);
    productionStorage = getStorage(productionApp);
}

// --------------------------------------------------------------------------
// MOCK EMULATOR LAYER (Local Storage Database)
// --------------------------------------------------------------------------

class MockFirebaseService {
    private dbKey = 'scu_art_circle_firebase_mock';
    private listeners: { [collection: string]: Function[] } = {};
    private authListeners: Function[] = [];
    private currentUser: AdminUser | null = null;

    constructor() {
        this.initMockDB();
        
        // Restore session if remembered
        const session = localStorage.getItem('scu_firebase_mock_session') || sessionStorage.getItem('scu_firebase_mock_session');
        if (session) {
            this.currentUser = JSON.parse(session);
        }
    }

    private initMockDB() {
        if (!localStorage.getItem(this.dbKey)) {
            const initialDB = {
                admins: [
                    { uid: 'uid-superadmin', username: 'superadmin', name: 'Admin User', role: 'Super Admin', email: 'admin@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', twoFactorEnabled: false },
                    { uid: 'uid-admin', username: 'admin', name: 'Creative Director', role: 'Admin', email: 'director@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80', twoFactorEnabled: false },
                    { uid: 'uid-editor', username: 'editor', name: 'Content Writer', role: 'Editor', email: 'editor@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', twoFactorEnabled: false },
                    { uid: 'uid-eventmgr', username: 'eventmgr', name: 'Event Coordinator', role: 'Event Manager', email: 'events@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', twoFactorEnabled: false },
                    { uid: 'uid-gallerymgr', username: 'gallerymgr', name: 'Gallery Curator', role: 'Gallery Manager', email: 'gallery@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', twoFactorEnabled: false }
                ],
                users: [],
                hero: [ { id: 'singleton', ...DEFAULT_HERO } ],
                about: [ { id: 'singleton', ...DEFAULT_ABOUT } ],
                categories: [
                    { id: 'music', title: 'Music', description: 'Express emotions through rhythm, vocals, and instruments.', icon: 'fas fa-music', displayOrder: 1, enabled: true },
                    { id: 'dance', title: 'Dance', description: 'Celebrate movement, culture, and performance.', icon: 'fa-solid fa-child', displayOrder: 2, enabled: true },
                    { id: 'drama', title: 'Drama', description: 'Bring stories to life through acting and stage performances.', icon: 'fas fa-masks-theater', displayOrder: 3, enabled: true },
                    { id: 'visual', title: 'Visual Arts', description: 'Transform imagination into paintings, designs, and creations.', icon: 'fas fa-palette', displayOrder: 4, enabled: true },
                    { id: 'literature', title: 'Literature', description: 'Share ideas through poetry, writing, and storytelling.', icon: 'fas fa-pen-nib', displayOrder: 5, enabled: true }
                ],
                events: [
                    {
                        id: 'swara-2026',
                        title: 'Swara 2026',
                        banner: 'ASSETS/images/Singers.svg',
                        description: "An unforgettable evening of music fusion.",
                        category: 'music',
                        venue: 'Main Auditorium',
                        date: '2026-07-15',
                        time: '18:30',
                        organizer: 'Music Dept',
                        guestArtists: 'Nadeemal',
                        registrationLink: '#',
                        maxParticipants: 1000,
                        countdownTimer: true,
                        featured: true,
                        galleryImages: [],
                        status: 'published'
                    }
                ],
                gallery: [
                    { id: 'g1', category: 'music', title: 'Lead Vocalist', src: 'ASSETS/images/Gallary/Swara Lead.JPG', size: 'size-tall', desc: 'Leading the stage with raw vocal power and emotional delivery at Swara 2026.', featured: true }
                ],
                team: [
                    { id: 't1', name: 'Kavishka Shenal', role: 'President', image: 'ASSETS/images/p.jpeg', bio: 'Digital visual artist and fine arts mentor.', email: 'kavishka@scuartcircle.org', phone: '+1 555-0100', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 1, active: true },
                    { id: 't2', name: 'Methupa Heras', role: 'Vice President', image: 'ASSETS/images/VP.jpeg', bio: 'Contemporary dancer.', email: 'methupa@scuartcircle.org', phone: '+1 555-0101', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 2, active: true }
                ],
                announcements: [
                    { id: 'a1', title: 'Swara 2026 Tickets Now Available', content: 'Get your tickets early!', image: 'ASSETS/images/Singers.svg', publishDate: '2026-07-01', expiryDate: '2026-07-16', pinned: true, scheduled: false, status: 'published' }
                ],
                memberships: [],
                contact_messages: [],
                settings: [ { id: 'singleton', ...DEFAULT_SETTINGS } ],
                notifications: [],
                analytics: [
                    { id: 'traffic', today: 140, weekly: 980, monthly: 3487, deviceTypes: { Mobile: 52, Desktop: 32, Tablet: 16 }, browserUsage: { Chrome: 65, Safari: 20, Firefox: 10, Edge: 5 }, locationStats: { Colombo: 45, Kandy: 25, Galle: 15, Other: 15 }, sources: { Search: 50, Direct: 30, Social: 20 }, views: { Home: 2400, Events: 1200, Gallery: 800 } }
                ],
                activity_logs: [
                    { id: 'l1', user: 'Admin User', role: 'Super Admin', action: 'initialized React CMS system', time: new Date().toLocaleString() }
                ],
                files: [
                    { id: 'f1', name: 'Singers.svg', type: 'image', size: 14500, url: 'ASSETS/images/Singers.svg', folder: '/' },
                    { id: 'f2', name: 'Community.JPG', type: 'image', size: 245000, url: 'ASSETS/images/Community.JPG', folder: '/' }
                ]
            };
            localStorage.setItem(this.dbKey, JSON.stringify(initialDB));
        }
    }

    private getRawDB(): any {
        return JSON.parse(localStorage.getItem(this.dbKey) || '{}');
    }

    private saveRawDB(db: any) {
        localStorage.setItem(this.dbKey, JSON.stringify(db));
    }

    // Auth Simulated Methods
    async mockLogin(username: string, pass: string, remember: boolean): Promise<AdminUser> {
        const db = this.getRawDB();
        // Plain text simulation matching standard password
        if (pass !== 'password123') throw new Error('AuthError: Incorrect password');
        const admin = db.admins.find((a: any) => a.username === username);
        if (!admin) throw new Error('AuthError: User not found');
        
        this.currentUser = admin;
        const sessionStr = JSON.stringify(admin);
        if (remember) {
            localStorage.setItem('scu_firebase_mock_session', sessionStr);
        } else {
            sessionStorage.setItem('scu_firebase_mock_session', sessionStr);
        }
        
        this.triggerAuthChange();
        this.addLog(admin.name, admin.role, "signed in via Auth Portal");
        return admin;
    }

    mockLogout() {
        if (this.currentUser) {
            this.addLog(this.currentUser.name, this.currentUser.role, "signed out of Auth Portal");
        }
        this.currentUser = null;
        localStorage.removeItem('scu_firebase_mock_session');
        sessionStorage.removeItem('scu_firebase_mock_session');
        this.triggerAuthChange();
    }

    getCurrentUser(): AdminUser | null {
        return this.currentUser;
    }

    onAuthChange(callback: Function) {
        this.authListeners.push(callback);
        // Immediate fire with current state
        callback(this.currentUser);
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }

    private triggerAuthChange() {
        this.authListeners.forEach(cb => cb(this.currentUser));
    }

    // Firestore Simulated Methods
    async getCollection(colName: string): Promise<any[]> {
        const db = this.getRawDB();
        return db[colName] || [];
    }

    async getDoc(colName: string, docId: string): Promise<any | null> {
        const db = this.getRawDB();
        const list = db[colName] || [];
        const item = list.find((d: any) => d.id === docId);
        return item || null;
    }

    async setDoc(colName: string, docId: string, data: any): Promise<void> {
        const db = this.getRawDB();
        if (!db[colName]) db[colName] = [];
        const index = db[colName].findIndex((d: any) => d.id === docId);
        
        const node = { id: docId, ...data };
        if (index !== -1) {
            db[colName][index] = node;
        } else {
            db[colName].push(node);
        }
        this.saveRawDB(db);
        this.triggerListeners(colName);
    }

    async addDoc(colName: string, data: any): Promise<string> {
        const db = this.getRawDB();
        if (!db[colName]) db[colName] = [];
        const newId = Math.random().toString(36).substring(2, 11);
        const node = { id: newId, ...data };
        db[colName].push(node);
        this.saveRawDB(db);
        this.triggerListeners(colName);
        return newId;
    }

    async updateDoc(colName: string, docId: string, data: any): Promise<void> {
        const db = this.getRawDB();
        const list = db[colName] || [];
        const index = list.findIndex((d: any) => d.id === docId);
        if (index !== -1) {
            list[index] = { ...list[index], ...data };
            db[colName] = list;
            this.saveRawDB(db);
            this.triggerListeners(colName);
        }
    }

    async deleteDoc(colName: string, docId: string): Promise<void> {
        const db = this.getRawDB();
        if (db[colName]) {
            db[colName] = db[colName].filter((d: any) => d.id !== docId);
            this.saveRawDB(db);
            this.triggerListeners(colName);
        }
    }

    subscribeCollection(colName: string, callback: Function) {
        if (!this.listeners[colName]) this.listeners[colName] = [];
        this.listeners[colName].push(callback);
        
        // Initial sync
        const db = this.getRawDB();
        callback(db[colName] || []);
        
        return () => {
            this.listeners[colName] = this.listeners[colName].filter(cb => cb !== callback);
        };
    }

    private triggerListeners(colName: string) {
        if (this.listeners[colName]) {
            const db = this.getRawDB();
            this.listeners[colName].forEach(cb => cb(db[colName] || []));
        }
    }

    private addLog(user: string, role: string, action: string) {
        const db = this.getRawDB();
        const nextId = Math.random().toString(36).substring(2, 9);
        db.activity_logs.unshift({
            id: nextId,
            user,
            role,
            action,
            time: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString()
        });
        this.saveRawDB(db);
        this.triggerListeners('activity_logs');
    }
}

export const mockFirebase = new MockFirebaseService();

// --------------------------------------------------------------------------
// EXPORT UNIFIED API SURFACE
// --------------------------------------------------------------------------

export const auth = useEmulator ? null : productionAuth;
export const db = useEmulator ? null : productionDb;
export const storage = useEmulator ? null : productionStorage;

export { useEmulator };
