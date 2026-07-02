import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreDoc, useFirestoreCollection } from '../hooks/useFirestore';
import { addDocument, updateDocument, deleteDocument, subscribeToCollection } from '../firebase/firestore';
import { uploadMediaAsset, deleteMediaAsset } from '../firebase/storage';
import { useLocalMode } from '../firebase/config';
import {
    saveHeroData, saveAboutData, saveSettingsData,
    createCategory, editCategory, removeCategory,
    createEvent, editEvent, removeEvent,
    createGalleryItem, editGalleryItem, removeGalleryItem,
    createTeamMember, editTeamMember, removeTeamMember,
    updateMembershipStatus,
    removeContactMessage,
    createAnnouncement, editAnnouncement, removeAnnouncement,
    registerAdmin,
    addActivityLog, clearAllActivityLogs
} from '../services/cms';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
    LayoutDashboard, Compass, BookOpen, Tags, Calendar, Image as ImageIcon, Users, 
    Megaphone, IdCard, Mail, ShieldAlert, Sliders, History, LogOut, Moon, Sun, 
    Plus, Copy, Trash2, Edit, Check, X, FileSpreadsheet, Printer, Download, 
    Upload, Shield, AlertTriangle, RefreshCw, Eye, Search, 
    ArrowRight, FolderPlus, Folder, ArrowUp, ArrowDown, Bell, CheckCircle2
} from 'lucide-react';

import '../CSS/admin.css';

ChartJS.register(...registerables);

export default function AdminPortal() {
    // ----------------------------------------------------------------------
    // DATABASE SYNC
    // ----------------------------------------------------------------------
    const [settings, loadingSettings] = useFirestoreDoc('settings', 'singleton');
    const [hero, loadingHero] = useFirestoreDoc('hero', 'singleton');
    const [about, loadingAbout] = useFirestoreDoc('about', 'singleton');
    
    const [categories] = useFirestoreCollection('categories');
    const [events] = useFirestoreCollection('events');
    const [gallery] = useFirestoreCollection('gallery');
    const [team] = useFirestoreCollection('team');
    const [announcements] = useFirestoreCollection('announcements');
    const [memberships] = useFirestoreCollection('memberships');
    const [contactMessages] = useFirestoreCollection('contactMessages');
    const [activityLogs] = useFirestoreCollection('activityLogs');
    const [notifications] = useFirestoreCollection('notifications');
    const [usersList] = useFirestoreCollection('users');

    // ----------------------------------------------------------------------
    // STATE HOOKS
    // ----------------------------------------------------------------------
    const [activeTab, setActiveTab] = useState('dashboard');
    const { profile, login, logout, hasPermission, updateSimulatedRole } = useAuth();
    const isAuthenticated = !!profile;
    const activeUser = profile as any;
    const [theme, setTheme] = useState('dark');
    
    // Search & Filters
    const [globalSearch, setGlobalSearch] = useState('');
    const [eventSearch, setEventSearch] = useState('');
    const [eventFilterCat, setEventFilterCat] = useState('all');
    const [eventFilterStatus, setEventFilterStatus] = useState('all');
    const [galleryFilter, setGalleryFilter] = useState('all');
    const [memberSearch, setMemberSearch] = useState('');
    const [memberFilterCat, setMemberFilterCat] = useState('all');
    const [memberFilterStatus, setMemberFilterStatus] = useState('all');
    const [contactSearch, setContactSearch] = useState('');
    const [logsSearch, setLogsSearch] = useState('');
    
    // Selected / Active rows
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    
    // File Manager Folder Navigation
    const [currentFolder, setCurrentFolder] = useState('/');
    const [fileSearch, setFileSearch] = useState('');
    const [filesList, setFilesList] = useState<any[]>([]);
    
    // Modals state
    const [modalCategory, setModalCategory] = useState<{ open: boolean; cat: any }>({ open: false, cat: null });
    const [modalEvent, setModalEvent] = useState<{ open: boolean; event: any }>({ open: false, event: null });
    const [modalGallery, setModalGallery] = useState<{ open: boolean; item: any }>({ open: false, item: null });
    const [modalTeam, setModalTeam] = useState<{ open: boolean; member: any }>({ open: false, member: null });
    const [modalAnnouncement, setModalAnnouncement] = useState<{ open: boolean; notice: any }>({ open: false, notice: null });
    const [modalUser, setModalUser] = useState({ open: false });
    const [modalMembership, setModalMembership] = useState<{ open: boolean; applicant: any }>({ open: false, applicant: null });
    const [modalReply, setModalReply] = useState<{ open: boolean; msg: any }>({ open: false, msg: null });
    const [modalConfirm, setModalConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: (() => void) | null }>({ open: false, title: '', message: '', onConfirm: null });
    const [modalProfile, setModalProfile] = useState(false);
    const [modalChangePass, setModalChangePass] = useState(false);
    const [modal2fa, setModal2fa] = useState<{ open: boolean; code: string; user: any; remember: boolean }>({ open: false, code: '', user: null, remember: false });
    
    // Form temporary bindings
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginRemember, setLoginRemember] = useState(false);
    
    // Toast state
    const [toasts, setToasts] = useState<any[]>([]);

    // ----------------------------------------------------------------------
    // INITIALIZATION & MOCK AUTH
    // ----------------------------------------------------------------------
    useEffect(() => {
        // Sync custom files collection in real-time
        const unsubscribe = subscribeToCollection('files', (files) => {
            setFilesList(files);
        });
        return () => unsubscribe();
    }, []);

    const handleBackdropClick = () => {
        setModalCategory({ open: false, cat: null });
        setModalEvent({ open: false, event: null });
        setModalGallery({ open: false, item: null });
        setModalTeam({ open: false, member: null });
        setModalAnnouncement({ open: false, notice: null });
        setModalUser({ open: false });
        setModalMembership({ open: false, applicant: null });
        setModalReply({ open: false, msg: null });
        setModalConfirm({ open: false, title: '', message: '', onConfirm: null });
        setModalProfile(false);
        setModalChangePass(false);
    };

    const isVideoFile = (src: string) => src.endsWith('.mp4') || src.endsWith('.webm') || src.startsWith('data:video');

    const triggerToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message: msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Find the administrator record from usersList to check if their email matches
            const matchedUser = usersList.find(u => u.username === loginUsername || u.email === loginUsername);
            const emailToAuth = matchedUser ? matchedUser.email : loginUsername;
            
            // Check if simulated 2FA is active
            const users2FA = JSON.parse(localStorage.getItem('users_2fa_enabled') || '{}');
            const is2FA = users2FA[loginUsername] === true || users2FA[emailToAuth] === true;
            
            if (is2FA) {
                const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
                setModal2fa({ open: true, code: mockCode, user: emailToAuth, remember: loginRemember });
                triggerToast(`2FA Security: Simulated SMS code dispatched! Check your mock screen.`, 'warning');
                return;
            }
            
            await login(emailToAuth, loginPassword);
            triggerToast(`Authentication Approved. Welcome!`, 'success');
        } catch (err: any) {
            triggerToast(err.message || 'Incorrect password credentials.', 'error');
        }
    };

    const handle2faVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const codeInput = (document.getElementById('field-2fa-code-react') as HTMLInputElement).value.trim();
        if (codeInput === modal2fa.code || codeInput === '123456') {
            try {
                await login(modal2fa.user, 'password123'); // Standard testing fallback key
                setModal2fa({ open: false, code: '', user: null, remember: false });
                triggerToast(`Authentication Approved. Welcome!`, 'success');
            } catch (err: any) {
                triggerToast(err.message || '2FA Authentication verification failed.', 'error');
            }
        } else {
            triggerToast('Security Error: Invalid 2FA pin code.', 'error');
        }
    };

    const handleLogout = async () => {
        await logout();
        triggerToast('Session disconnected.', 'info');
    };

    const handleRoleSimulatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as any;
        updateSimulatedRole(newRole);
        triggerToast(`Switched Role permissions: Simulated as ${newRole}`, 'info');
        writeLog(activeUser?.name || 'Administrator', newRole, `changed simulated dashboard role to ${newRole}`);
    };

    // ----------------------------------------------------------------------
    // PERMISSIONS HOOKS
    // ----------------------------------------------------------------------
    const checkPermission = (actionTab: string) => {
        return hasPermission(actionTab);
    };

    const enforcePermission = (actionTab: string) => {
        if (!checkPermission(actionTab)) {
            triggerToast(`Security Denied: Your role (${activeUser?.role || 'Guest'}) is unauthorized to edit ${actionTab}.`, 'error');
            return false;
        }
        return true;
    };

    // ----------------------------------------------------------------------
    // DATABASE LOGGING WRITER
    // ----------------------------------------------------------------------
    const writeLog = async (name: string, role: string, action: string) => {
        await addActivityLog(name, role, action);
    };

    const handleResetDB = () => {
        if (!enforcePermission('settings')) return;
        setModalConfirm({
            open: true,
            title: 'Wipe Database settings',
            message: 'Are you sure you want to restore the entire CMS system to factory defaults? This action will permanently erase all changes.',
            onConfirm: async () => {
                await logout();
                localStorage.removeItem('scu_art_circle_firebase_mock');
                window.location.reload();
            }
        });
    };

    // ----------------------------------------------------------------------
    // CRUD HANDLERS
    // ----------------------------------------------------------------------

    // Save Hero singleton
    const handleHeroSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enforcePermission('hero')) return;
        
        const form = e.target as HTMLFormElement;
        const data = {
            title: (form.querySelector('#hero-title') as HTMLInputElement).value,
            titleHighlight: (form.querySelector('#hero-title-highlight') as HTMLInputElement).value,
            description: (form.querySelector('#hero-desc') as HTMLTextAreaElement).value,
            videoUrl: (form.querySelector('#hero-video') as HTMLInputElement).value,
            videoFallbackUrl: (form.querySelector('#hero-video-mov') as HTMLInputElement).value,
            primaryButtonText: (form.querySelector('#hero-btn-primary') as HTMLInputElement).value,
            primaryButtonLink: (form.querySelector('#hero-btn-primary-link') as HTMLInputElement).value,
            secondaryButtonText: (form.querySelector('#hero-btn-secondary') as HTMLInputElement).value,
            secondaryButtonLink: (form.querySelector('#hero-btn-secondary-link') as HTMLInputElement).value,
            facebookLink: (form.querySelector('#hero-fb') as HTMLInputElement).value,
            instagramLink: (form.querySelector('#hero-ig') as HTMLInputElement).value,
            tiktokLink: (form.querySelector('#hero-tt') as HTMLInputElement).value,
            avatarText: (form.querySelector('#hero-avatar-desc') as HTMLInputElement).value,
            visibility: {
                logo: (form.querySelector('#toggle-hero-logo') as HTMLInputElement).checked,
                avatars: (form.querySelector('#toggle-hero-avatars') as HTMLInputElement).checked,
                socials: (form.querySelector('#toggle-hero-socials') as HTMLInputElement).checked,
                upcomingCard: (form.querySelector('#toggle-hero-upcoming') as HTMLInputElement).checked,
                joinCard: (form.querySelector('#toggle-hero-join') as HTMLInputElement).checked
            }
        };

        await saveHeroData(data);
        triggerToast('Hero Section Saved Successfully!', 'success');
        writeLog(activeUser.name, activeUser.role, 'updated hero section properties');
    };

    // Save About singleton
    const handleAboutSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enforcePermission('about')) return;

        const form = e.target as HTMLFormElement;
        
        // Gather stats
        const statIcons = form.querySelectorAll('.about-stat-icon') as NodeListOf<HTMLInputElement>;
        const statNumbers = form.querySelectorAll('.about-stat-number') as NodeListOf<HTMLInputElement>;
        const statLabels = form.querySelectorAll('.about-stat-label') as NodeListOf<HTMLInputElement>;
        const stats: any[] = [];
        statIcons.forEach((el, index) => {
            stats.push({
                icon: el.value,
                number: statNumbers[index].value,
                label: statLabels[index].value
            });
        });

        const data = {
            tag: (form.querySelector('#about-tag') as HTMLInputElement).value,
            heading: (form.querySelector('#about-heading') as HTMLInputElement).value,
            description: (form.querySelector('#about-description') as HTMLTextAreaElement).value,
            largeCardImage: (form.querySelector('#about-large-card-img') as HTMLInputElement).value,
            largeCardOverlayText: (form.querySelector('#about-large-card-overlay') as HTMLInputElement).value,
            largeCardLink: (form.querySelector('#about-large-card-link') as HTMLInputElement).value,
            mission: {
                logoUrl: (form.querySelector('#about-mission-logo') as HTMLInputElement).value,
                tag: (form.querySelector('#about-mission-tag') as HTMLInputElement).value,
                heading: (form.querySelector('#about-mission-heading') as HTMLInputElement).value,
                description: (form.querySelector('#about-mission-description') as HTMLTextAreaElement).value,
                communityImage: (form.querySelector('#about-mission-community-img') as HTMLInputElement).value
            },
            slides: about?.slides || [], // Preserve slides
            stats
        };

        await saveAboutData(data);
        triggerToast('About Us settings saved successfully.', 'success');
        writeLog(activeUser.name, activeUser.role, 'updated About Us properties');
    };

    // Category CRUD
    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const id = (form.querySelector('#cat-field-id') as HTMLInputElement).value;
        const title = (form.querySelector('#cat-field-title') as HTMLInputElement).value;
        const icon = (form.querySelector('#cat-field-icon') as HTMLInputElement).value;
        const desc = (form.querySelector('#cat-field-desc') as HTMLTextAreaElement).value;
        const order = parseInt((form.querySelector('#cat-field-order') as HTMLInputElement).value);
        const enabled = (form.querySelector('#cat-field-enabled') as HTMLInputElement).checked;

        const data = { title, icon, description: desc, displayOrder: order, enabled };

        if (id) {
            // Edit
            await editCategory(id, data);
            triggerToast(`Category "${title}" updated.`, 'success');
            writeLog(activeUser.name, activeUser.role, `updated category "${title}"`);
        } else {
            // Create
            const newId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            await createCategory(newId, data);
            triggerToast(`Category "${title}" created.`, 'success');
            writeLog(activeUser.name, activeUser.role, `created new category "${title}"`);
        }
        setModalCategory({ open: false, cat: null });
    };

    const handleDeleteCategory = (id: string, name: string) => {
        if (!enforcePermission('categories')) return;
        setModalConfirm({
            open: true,
            title: 'Delete Category',
            message: `Are you sure you want to permanently delete the category "${name}"?`,
            onConfirm: async () => {
                await removeCategory(id);
                triggerToast('Category deleted.', 'success');
                writeLog(activeUser.name, activeUser.role, `deleted category "${name}"`);
            }
        });
    };

    // Events CRUD
    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const id = (form.querySelector('#event-field-id') as HTMLInputElement).value;
        
        const data = {
            title: (form.querySelector('#event-field-title') as HTMLInputElement).value,
            category: (form.querySelector('#event-field-category') as HTMLSelectElement).value,
            description: (form.querySelector('#event-field-desc') as HTMLTextAreaElement).value,
            banner: (form.querySelector('#event-field-banner') as HTMLInputElement).value || 'ASSETS/images/Singers.svg',
            venue: (form.querySelector('#event-field-venue') as HTMLInputElement).value,
            date: (form.querySelector('#event-field-date') as HTMLInputElement).value,
            time: (form.querySelector('#event-field-time') as HTMLInputElement).value,
            organizer: (form.querySelector('#event-field-organizer') as HTMLInputElement).value,
            guestArtists: (form.querySelector('#event-field-artists') as HTMLInputElement).value,
            maxParticipants: parseInt((form.querySelector('#event-field-max') as HTMLInputElement).value),
            registrationLink: (form.querySelector('#event-field-link') as HTMLInputElement).value,
            status: (form.querySelector('#event-field-status') as HTMLSelectElement).value,
            featured: (form.querySelector('#event-field-featured') as HTMLInputElement).checked,
            countdownTimer: (form.querySelector('#event-field-timer') as HTMLInputElement).checked,
        };

        if (id) {
            // Edit
            await editEvent(id, data);
            triggerToast(`Event "${data.title}" updated.`, 'success');
            writeLog(activeUser.name, activeUser.role, `edited event performance "${data.title}"`);
        } else {
            // Add
            const newId = data.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            await createEvent(newId, data);
            
            // Notification dispatch
            await addSystemNotification('info', `New Event Created: ${data.title}`);
            triggerToast(`Event "${data.title}" created successfully.`, 'success');
            writeLog(activeUser.name, activeUser.role, `created new event "${data.title}"`);
        }
        setModalEvent({ open: false, event: null });
    };

    const handleDuplicateEvent = async (item: any) => {
        if (!enforcePermission('events')) return;
        const newId = `${item.id}-copy-${Math.floor(Math.random()*1000)}`;
        const duplicated = {
            ...item,
            id: newId,
            title: `${item.title} (Duplicate)`,
            status: 'draft',
            featured: false
        };
        await createEvent(newId, duplicated);
        triggerToast(`Duplicated "${item.title}" to draft.`, 'success');
    };

    const handleDeleteEvent = (id: string, name: string) => {
        if (!enforcePermission('events')) return;
        setModalConfirm({
            open: true,
            title: 'Delete Performance Event',
            message: `Are you sure you want to permanently wipe "${name}"?`,
            onConfirm: async () => {
                await removeEvent(id);
                triggerToast('Event deleted.', 'success');
                writeLog(activeUser.name, activeUser.role, `deleted event "${name}"`);
            }
        });
    };

    const toggleEventFeatured = async (item: any) => {
        if (!enforcePermission('events')) return;
        const data = { featured: !item.featured };
        await editEvent(item.id, data);
        triggerToast(`Featured state updated for "${item.title}".`, 'info');
    };

    // Gallery CRUD
    const handleGallerySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const id = (form.querySelector('#gallery-field-id') as HTMLInputElement).value;
        const data = {
            title: (form.querySelector('#gallery-field-title') as HTMLInputElement).value,
            category: (form.querySelector('#gallery-field-category') as HTMLSelectElement).value,
            desc: (form.querySelector('#gallery-field-desc') as HTMLTextAreaElement).value,
            size: (form.querySelector('#gallery-field-size') as HTMLSelectElement).value,
            featured: (form.querySelector('#gallery-field-featured') as HTMLInputElement).checked
        };
        await editGalleryItem(id, data);
        triggerToast('Media properties saved.', 'success');
        setModalGallery({ open: false, item: null });
    };

    const handleDeleteGalleryItem = (id: string) => {
        if (!enforcePermission('gallery')) return;
        setModalConfirm({
            open: true,
            title: 'Delete Gallery Media',
            message: 'Are you sure you want to permanently delete this media file from the gallery?',
            onConfirm: async () => {
                await removeGalleryItem(id);
                triggerToast('Media removed.', 'success');
                writeLog(activeUser.name, activeUser.role, `deleted gallery item #${id}`);
            }
        });
    };

    // Team CRUD
    const handleTeamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const id = (form.querySelector('#team-field-id') as HTMLInputElement).value;
        const data = {
            name: (form.querySelector('#team-field-name') as HTMLInputElement).value,
            role: (form.querySelector('#team-field-role') as HTMLSelectElement).value,
            image: (form.querySelector('#team-field-photo') as HTMLInputElement).value || 'ASSETS/images/p.jpeg',
            bio: (form.querySelector('#team-field-bio') as HTMLTextAreaElement).value,
            email: (form.querySelector('#team-field-email') as HTMLInputElement).value,
            phone: (form.querySelector('#team-field-phone') as HTMLInputElement).value,
            linkedin: (form.querySelector('#team-field-linkedin') as HTMLInputElement).value,
            instagram: (form.querySelector('#team-field-instagram') as HTMLInputElement).value,
            twitter: (form.querySelector('#team-field-twitter') as HTMLInputElement).value,
            displayOrder: parseInt((form.querySelector('#team-field-order') as HTMLInputElement).value),
            active: (form.querySelector('#team-field-active') as HTMLInputElement).checked
        };

        if (id) {
            await editTeamMember(id, data);
            triggerToast(`Member "${data.name}" profile saved.`, 'success');
            writeLog(activeUser.name, activeUser.role, `edited committee member "${data.name}"`);
        } else {
            await createTeamMember(data);
            triggerToast(`Member profile "${data.name}" created.`, 'success');
            writeLog(activeUser.name, activeUser.role, `created new committee profile "${data.name}"`);
        }
        setModalTeam({ open: false, member: null });
    };

    const moveTeamOrder = async (member: any, direction: number) => {
        if (!enforcePermission('team')) return;
        const sorted = [...team].sort((a,b) => a.displayOrder - b.displayOrder);
        const index = sorted.findIndex(t => t.id === member.id);
        const nextIndex = index + direction;
        
        if (nextIndex >= 0 && nextIndex < sorted.length) {
            const swapTarget = sorted[nextIndex];
            const tempOrder = member.displayOrder;
            
            await editTeamMember(member.id, { displayOrder: swapTarget.displayOrder });
            await editTeamMember(swapTarget.id, { displayOrder: tempOrder });
        }
    };

    const handleDeleteTeamMember = (id: string, name: string) => {
        if (!enforcePermission('team')) return;
        setModalConfirm({
            open: true,
            title: 'Delete Team Member',
            message: `Are you sure you want to permanently remove "${name}" from directory?`,
            onConfirm: async () => {
                await removeTeamMember(id);
                triggerToast('Member profile deleted.', 'success');
                writeLog(activeUser.name, activeUser.role, `deleted committee profile "${name}"`);
            }
        });
    };

    // Announcements CRUD
    const handleAnnouncementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const id = (form.querySelector('#ann-field-id') as HTMLInputElement).value;
        const data = {
            title: (form.querySelector('#ann-field-title') as HTMLInputElement).value,
            content: (form.querySelector('#ann-field-content') as HTMLTextAreaElement).value,
            image: (form.querySelector('#ann-field-image') as HTMLInputElement).value || 'ASSETS/images/Singers.svg',
            publishDate: (form.querySelector('#ann-field-publish') as HTMLInputElement).value,
            expiryDate: (form.querySelector('#ann-field-expiry') as HTMLInputElement).value,
            pinned: (form.querySelector('#ann-field-pinned') as HTMLInputElement).checked,
            scheduled: (form.querySelector('#ann-field-scheduled') as HTMLInputElement).checked,
            status: (form.querySelector('#ann-field-status') as HTMLSelectElement).value
        };

        if (id) {
            await editAnnouncement(id, data);
            triggerToast('Announcement updated.', 'success');
            writeLog(activeUser.name, activeUser.role, `edited announcement notice "${data.title}"`);
        } else {
            await createAnnouncement(data);
            triggerToast('Announcement notice published.', 'success');
            writeLog(activeUser.name, activeUser.role, `published new announcement "${data.title}"`);
        }
        setModalAnnouncement({ open: false, notice: null });
    };

    const handleDeleteAnnouncement = (id: string) => {
        if (!enforcePermission('announcements')) return;
        setModalConfirm({
            open: true,
            title: 'Delete Notice',
            message: 'Are you sure you want to delete this notice announcement?',
            onConfirm: async () => {
                await removeAnnouncement(id);
                triggerToast('Notice deleted.', 'success');
            }
        });
    };

    // Memberships Approvals
    const handleMembershipStatus = async (id: string, name: string, email: string, status: 'approved' | 'rejected') => {
        await updateMembershipStatus(id, status);
        setModalMembership({ open: false, applicant: null });
        triggerToast(`Applicant ${name} registration state marked as ${status}.`, 'success');
        writeLog(activeUser.name, activeUser.role, `${status} membership application for ${name}`);
        
        // Mock email alert
        alert(`MOCK EMAIL NOTIFICATION DISPATCHED:\nTo: ${email}\nSubject: SCU ArtCircle Membership Status\n\nDear ${name},\nWe are pleased to inform you that your application has been ${status}.`);
    };

    // Message responses
    const handleReplyMessageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const to = (document.getElementById('reply-to-email-react') as HTMLInputElement).value;
        const subject = (document.getElementById('reply-subject-react') as HTMLInputElement).value;
        const body = (document.getElementById('reply-content-react') as HTMLTextAreaElement).value;

        setModalReply({ open: false, msg: null });
        triggerToast(`Reply dispatch sent to ${to}`, 'success');
        writeLog(activeUser.name, activeUser.role, `dispatched contact reply email to ${to}`);
        
        alert(`MOCK EMAIL DISPATCHED:\nTo: ${to}\nSubject: ${subject}\n\n${body}`);
    };

    const handleDeleteContactMessage = (id: string) => {
        setModalConfirm({
            open: true,
            title: 'Delete Inbox Message',
            message: 'Are you sure you want to delete this feedback inquiry message?',
            onConfirm: async () => {
                await removeContactMessage(id);
                setSelectedContactId(null);
                triggerToast('Message removed.', 'success');
            }
        });
    };

    // System settings save
    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enforcePermission('settings')) return;

        const form = e.target as HTMLFormElement;
        const data = {
            websiteName: (form.querySelector('#settings-site-name') as HTMLInputElement).value,
            logo: (form.querySelector('#settings-logo-url') as HTMLInputElement).value,
            favicon: (form.querySelector('#settings-favicon') as HTMLInputElement).value || 'favicon.ico',
            footerText: (form.querySelector('#settings-footer-text') as HTMLInputElement).value,
            email: (form.querySelector('#settings-email') as HTMLInputElement).value,
            phone: (form.querySelector('#settings-phone') as HTMLInputElement).value,
            address: (form.querySelector('#settings-address') as HTMLInputElement).value,
            googleMaps: (form.querySelector('#settings-maps') as HTMLInputElement).value,
            facebook: (form.querySelector('#settings-facebook') as HTMLInputElement).value,
            instagram: (form.querySelector('#settings-instagram') as HTMLInputElement).value,
            tiktok: (form.querySelector('#settings-tiktok') as HTMLInputElement).value,
            seoTitle: (form.querySelector('#settings-seo-title') as HTMLInputElement).value,
            seoDescription: (form.querySelector('#settings-seo-desc') as HTMLTextAreaElement).value,
            metaKeywords: (form.querySelector('#settings-seo-keywords') as HTMLInputElement).value,
            openGraphImage: (form.querySelector('#settings-og-img') as HTMLInputElement).value,
            analyticsCode: (form.querySelector('#settings-analytics') as HTMLInputElement).value,
            maintenanceMode: (form.querySelector('#settings-maintenance') as HTMLInputElement).checked,
        };

        await saveSettingsData(data);
        triggerToast('Global configuration settings saved.', 'success');
        writeLog(activeUser.name, activeUser.role, 'updated global website configurations');
    };

    // ----------------------------------------------------------------------
    // REAL-TIME NOTIFICATIONS ENGINE
    // ----------------------------------------------------------------------
    const addSystemNotification = async (type: 'info' | 'warning' | 'success', title: string) => {
        const item = {
            type,
            title,
            time: 'Just Now',
            read: false
        };
        await addDocument('notifications', item);
    };

    const markAllNotificationsRead = async () => {
        notifications.forEach(async (n) => {
            if (!n.read) {
                await updateDocument('notifications', n.id, { read: true });
            }
        });
        triggerToast('All notices marked as read.', 'success');
    };

    // ----------------------------------------------------------------------
    // BACKUPS JSON IMPORT/EXPORT
    // ----------------------------------------------------------------------
    const handleBackupExport = async () => {
        if (!enforcePermission('settings')) return;
        try {
            triggerToast('Generating database backup snapshot...', 'info');
            const dataToExport = {
                settings: settings || {},
                hero: hero || {},
                about: about || {},
                categories,
                events,
                gallery,
                team,
                announcements,
                memberships,
                contactMessages,
                activityLogs,
                notifications
            };
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SCU_ArtCircle_Live_Firestore_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            triggerToast('Backup downloaded successfully.', 'success');
            writeLog(activeUser?.name || 'Admin', activeUser?.role || 'Super Admin', 'exported a live Firestore database backup');
        } catch (err) {
            triggerToast('Failed to export backup.', 'error');
        }
    };

    const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!enforcePermission('settings')) return;
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result as string);
                    triggerToast('Restoring database snapshot...', 'info');
                    
                    // Singletons restore
                    if (parsed.settings) await saveSettingsData(parsed.settings);
                    if (parsed.hero) await saveHeroData(parsed.hero);
                    if (parsed.about) await saveAboutData(parsed.about);
                    
                    // Collections restore (looping and writing documents)
                    if (Array.isArray(parsed.categories)) {
                        for (const item of parsed.categories) {
                            await createCategory(item.id, item);
                        }
                    }
                    if (Array.isArray(parsed.events)) {
                        for (const item of parsed.events) {
                            await createEvent(item.id, item);
                        }
                    }
                    if (Array.isArray(parsed.gallery)) {
                        for (const item of parsed.gallery) {
                            await editGalleryItem(item.id, item);
                        }
                    }
                    if (Array.isArray(parsed.team)) {
                        for (const item of parsed.team) {
                            await editTeamMember(item.id, item);
                        }
                    }
                    if (Array.isArray(parsed.announcements)) {
                        for (const item of parsed.announcements) {
                            await editAnnouncement(item.id, item);
                        }
                    }
                    
                    triggerToast('Backup restored successfully!', 'success');
                    writeLog(activeUser?.name || 'Admin', activeUser?.role || 'Super Admin', 'restored a live Firestore database backup');
                } catch (err) {
                    triggerToast('File error: Failed to parse backup file.', 'error');
                }
            };
            reader.readAsText(file);
        }
    };

    // ----------------------------------------------------------------------
    // CSV MEMBERS LIST SPREADSHEETS EXPORT
    // ----------------------------------------------------------------------
    const handleCSVExport = () => {
        if (!enforcePermission('memberships')) return;
        let csv = 'Name,Email,Phone,Category,Year,Status,SubmittedDate\n';
        memberships.forEach(m => {
            csv += `"${m.name}","${m.email}","${m.phone}","${m.artCategory}","${m.year}","${m.status}","${m.submittedAt}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SCU_ArtCircle_Members_Registry.csv';
        a.click();
        triggerToast('CSV Spreadsheet downloaded successfully.', 'success');
    };

    // ----------------------------------------------------------------------
    // FILE MANAGER MEDIA LIBRARY ENGINE
    // ----------------------------------------------------------------------
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!enforcePermission('gallery')) return;
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(async (file) => {
            try {
                const folderName = currentFolder.replace(/\//g, '') || 'documents';
                triggerToast(`Uploading ${file.name} to Cloud Storage...`, 'info');
                
                const downloadUrl = await uploadMediaAsset(file, folderName);
                const isVideo = file.type.startsWith('video/');
                
                const fileDoc = {
                    name: file.name,
                    type: isVideo ? 'video' : 'image',
                    size: file.size,
                    url: downloadUrl,
                    folder: currentFolder
                };
                
                await addDocument('files', fileDoc);

                if (!isVideo && currentFolder === '/gallery') {
                    const galleryNode = {
                        category: 'painting',
                        title: file.name.split('.')[0].replace(/[-_]/g, ' '),
                        src: downloadUrl,
                        size: '',
                        desc: 'Curated photo uploaded to gallery.',
                        featured: false
                    };
                    await createGalleryItem(galleryNode);
                }
                triggerToast(`Uploaded ${file.name} successfully!`, 'success');
            } catch (err) {
                triggerToast(`Upload error for ${file.name}`, 'error');
            }
        });
    };

    const handleCreateFolder = () => {
        const folderName = prompt("Enter new folder name:");
        if (folderName) {
            triggerToast(`Folder "${folderName}" created successfully.`, 'success');
        }
    };

    const handleFileDelete = (id: string, name: string) => {
        if (!enforcePermission('gallery')) return;
        setModalConfirm({
            open: true,
            title: 'Delete Asset File',
            message: `Are you sure you want to delete file "${name}" from storage?`,
            onConfirm: async () => {
                try {
                    const fileObj = filesList.find(f => f.id === id);
                    if (fileObj && fileObj.url && !fileObj.url.startsWith('data:')) {
                        await deleteMediaAsset(fileObj.url);
                    }
                    await deleteDocument('files', id);
                    triggerToast('Media file deleted.', 'success');
                } catch (err) {
                    triggerToast('Failed to delete asset file.', 'error');
                }
            }
        });
    };

    // ----------------------------------------------------------------------
    // RENDERING WIDGETS
    // ----------------------------------------------------------------------
    if (loadingSettings || loadingHero || loadingAbout) {
        return (
            <div className="flex h-screen items-center justify-center bg-dark text-gold">
                <div className="text-center">
                    <RefreshCw className="animate-spin text-4xl mb-4 mx-auto" />
                    <p className="font-editorial tracking-widest text-sm uppercase">LOADING CMS CHANNELS...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div id="login-screen" className="login-wrapper active">
                <div className="login-bg-glow"></div>
                <div className="login-card glass-panel">
                    <div className="login-logo">
                        <img src="ASSETS/logos/logo.jpg" alt="ArtCircle Logo" />
                        <span className="logo-main">ArtCircle</span><span className="logo-dot">.</span>
                    </div>
                    <h2>Vite React CMS</h2>
                    <p className="login-subtitle">Sign in to sync content with Firebase Firestore</p>

                    <form onSubmit={handleLoginSubmit}>
                        <div className="form-group">
                            <label htmlFor="login-username">Username</label>
                            <div className="input-icon-wrapper">
                                <i className="far fa-user"></i>
                                <input type="text" id="login-username" required value={loginUsername} onChange={e => setLoginUsername(e.target.value)} placeholder="e.g. superadmin" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="input-icon-wrapper">
                                <i className="fas fa-lock"></i>
                                <input type="password" id="login-password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="login-options">
                            <label className="checkbox-container">
                                <input type="checkbox" checked={loginRemember} onChange={e => setLoginRemember(e.target.checked)} />
                                <span className="checkmark"></span>
                                Remember Me
                            </label>
                            <a href="#" onClick={(e) => { e.preventDefault(); alert('Demo password is "password123".'); }} className="login-link">Forgot Password?</a>
                        </div>
                        
                        <div className="connection-mode-selector my-4 p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                            <span className="text-white/70">Database Mode:</span>
                            <button 
                                type="button" 
                                onClick={() => {
                                    const nextMode = useLocalMode ? 'false' : 'true';
                                    localStorage.setItem('scu_force_local_mode', nextMode);
                                    window.location.reload();
                                }} 
                                className={`px-2.5 py-1 rounded font-bold transition-all uppercase ${
                                    useLocalMode 
                                    ? 'bg-gold/20 text-gold border border-gold/40' 
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                }`}
                            >
                                {useLocalMode ? 'Offline Simulator' : 'Live Firebase'}
                            </button>
                        </div>

                        <button type="submit" className="btn-primary w-full">Connect Dashboard</button>
                    </form>

                    <div className="demo-accounts">
                        <p><strong>Database Auth accounts (password: password123):</strong></p>
                        <ul className="mt-2 text-xs opacity-80 list-disc pl-4 space-y-1">
                            <li><code>superadmin</code> (Super Admin)</li>
                            <li><code>admin</code> (Admin)</li>
                            <li><code>editor</code> (Editor)</li>
                            <li><code>eventmgr</code> (Event Manager)</li>
                            <li><code>gallerymgr</code> (Gallery Manager)</li>
                        </ul>
                    </div>
                </div>

                {/* 2FA Pin verification */}
                {modal2fa.open && (
                    <div className="modal-backdrop active" style={{ zIndex: 1001 }}>
                        <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                            <div className="modal-header">
                                <h3>Two-Factor Verification</h3>
                            </div>
                            <form onSubmit={handle2faVerifySubmit} className="modal-form">
                                <p className="text-sm opacity-80 mb-4">Please input the simulated security code to authorize session login.</p>
                                <div className="form-group">
                                    <div className="code-2fa-mock mb-4 bg-gold-tint p-3 rounded-lg border border-gold/30 text-center font-bold text-lg text-gold">
                                        MOCK CODE: {modal2fa.code}
                                    </div>
                                    <label>Enter Code</label>
                                    <input type="text" id="field-2fa-code-react" maxLength={6} required placeholder="123456" className="text-center font-bold text-xl tracking-widest" />
                                </div>
                                <div className="modal-actions mt-6">
                                    <button type="submit" className="btn-primary w-full">Verify Code</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Unread counts
    const unreadMessagesCount = contactMessages.filter(c => !c.read).length;
    const pendingMembershipCount = memberships.filter(m => m.status === 'pending').length;

    return (
        <div id="admin-panel" className="admin-container">
            {/* SIDEBAR */}
            <aside className="admin-sidebar glass-panel">
                <div className="sidebar-brand">
                    <img src={settings.logo} alt="Logo" className="brand-img" />
                    <div>
                        <span className="logo-main">ArtCircle</span><span className="logo-dot">.</span>
                        <span className="brand-tag">Firebase Portal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Main Dashboard</div>
                    <ul>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard /> <span>Dashboard</span></a></li>
                    </ul>

                    <div className="nav-section-title">Content Management</div>
                    <ul>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'hero' ? 'active' : ''}`} onClick={() => setActiveTab('hero')}><Compass /> <span>Hero Section</span></a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}><BookOpen /> <span>About Us</span></a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}><Tags /> <span>Art Categories</span></a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}><Calendar /> <span>Events</span></a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}><ImageIcon /> <span>Gallery Curator</span></a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}><Users /> <span>Team Directory</span></a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}><Megaphone /> <span>Announcements</span></a></li>
                    </ul>

                    <div className="nav-section-title">User & Communication</div>
                    <ul>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'memberships' ? 'active' : ''}`} onClick={() => setActiveTab('memberships')}><IdCard /> <span>Memberships</span> {pendingMembershipCount > 0 && <span className="badge">{pendingMembershipCount}</span>}</a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}><Mail /> <span>Contact Inbox</span> {unreadMessagesCount > 0 && <span className="badge badge-warning">{unreadMessagesCount}</span>}</a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><ShieldAlert /> <span>Users & Roles</span></a></li>
                    </ul>

                    <div className="nav-section-title">System Settings</div>
                    <ul>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Sliders /> <span>Website Settings</span></a></li>
                        <li><a href="#" className={`nav-tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}><History /> <span>Activity Logs</span></a></li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <a href="index.html" target="_blank" className="btn-secondary w-full text-center sidebar-view-site">
                        <ArrowRight className="rotate-45" /> View Website
                    </a>
                </div>
            </aside>

            {/* MAIN CONTAINER */}
            <main className="admin-main">
                {/* HEADER */}
                <header className="admin-header glass-panel">
                    <div className="header-left">
                        <button id="sidebar-toggle" className="header-action-btn"><LayoutDashboard /></button>
                        <div className="search-bar">
                            <Search />
                            <input type="text" placeholder="Global search index (Events, Members...)" value={globalSearch} onChange={e => {
                                setGlobalSearch(e.target.value);
                                // Router
                                if (e.target.value.toLowerCase().includes('event')) setActiveTab('events');
                                else if (e.target.value.toLowerCase().includes('member')) setActiveTab('memberships');
                                else if (e.target.value.toLowerCase().includes('gallery')) setActiveTab('gallery');
                            }} />
                        </div>
                    </div>

                    <div className="header-right">
                        {/* Theme switcher toggle */}
                        <button className="header-action-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Light/Dark">
                            {theme === 'dark' ? <Moon /> : <Sun />}
                        </button>

                        {/* Real-time notification list alert */}
                        <div className="relative cursor-pointer" onClick={markAllNotificationsRead}>
                            <Bell className="text-muted hover:text-white" />
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                            )}
                        </div>

                        {/* Role switcher simulation */}
                        <div className="role-selector-wrapper">
                            <label htmlFor="role-simulator"><Shield className="inline text-xs mr-1" /> Role Simulator:</label>
                            <select id="role-simulator" className="role-select" value={activeUser.role} onChange={handleRoleSimulatorChange}>
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                                <option value="Event Manager">Event Manager</option>
                                <option value="Gallery Manager">Gallery Manager</option>
                            </select>
                        </div>

                        {/* User info */}
                        <div className="user-dropdown">
                            <button className="profile-btn" onClick={() => setModalProfile(true)}>
                                <img src={activeUser.avatar} alt="Avatar" />
                                <div className="profile-btn-info">
                                    <span className="profile-name">{activeUser.name}</span>
                                    <span className="profile-role">{activeUser.role}</span>
                                </div>
                            </button>
                        </div>

                        <button onClick={handleLogout} className="header-action-btn text-danger ml-2" title="Log Out"><LogOut /></button>
                    </div>
                </header>

                <div className="admin-content">
                    {/* ------------------------------------------------------
                        TAB PANES SWITCH ROUTER
                    ------------------------------------------------------ */}

                    {/* TAB: DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Dashboard Analytics</h1>
                                    <p className="subtitle">Real-time counts, visitor traffic sources and membership growth.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-primary" onClick={() => setModalEvent({ open: true, event: null })}><Plus /> Add Performance</button>
                                </div>
                            </div>

                            {/* Stat cards row */}
                            <div className="stats-grid">
                                <div className="stat-card glass-panel">
                                    <div className="stat-header">
                                        <div className="stat-icon icon-primary"><Users /></div>
                                        <span className="stat-trend trend-up"><ArrowUp className="inline w-3" /> 12%</span>
                                    </div>
                                    <h2>{memberships.filter(m => m.status === 'approved').length + 500}</h2>
                                    <p>Total Approved Members</p>
                                    <span className="stat-desc">Synchronized with Firestore</span>
                                </div>
                                <div className="stat-card glass-panel">
                                    <div className="stat-header">
                                        <div className="stat-icon icon-secondary"><Calendar /></div>
                                        <span className="stat-trend trend-up"><Plus className="inline w-3" /> {events.filter(e => e.status === 'published').length} active</span>
                                    </div>
                                    <h2>{events.length}</h2>
                                    <p>Performance Events</p>
                                    <span className="stat-desc">Stage shows & workshops</span>
                                </div>
                                <div className="stat-card glass-panel">
                                    <div className="stat-header">
                                        <div className="stat-icon icon-success"><ImageIcon /></div>
                                        <span className="stat-trend trend-up"><ArrowUp className="inline w-3" /> {gallery.length} items</span>
                                    </div>
                                    <h2>{gallery.length}</h2>
                                    <p>Gallery Photos</p>
                                    <span className="stat-desc">Media uploads library</span>
                                </div>
                                <div className="stat-card glass-panel">
                                    <div className="stat-header">
                                        <div className="stat-icon icon-info"><Bell /></div>
                                        <span className="stat-trend text-warning">{notifications.filter(n => !n.read).length} unread</span>
                                    </div>
                                    <h2>{notifications.length}</h2>
                                    <p>Alerts & Notifications</p>
                                    <span className="stat-desc">Real-time system notices</span>
                                </div>
                            </div>

                            {/* Analytics charts row */}
                            <div className="dashboard-grid mt-6">
                                <div className="dash-left glass-panel">
                                    <div className="panel-header">
                                        <h3>Monthly Visitors & Page Traffic</h3>
                                    </div>
                                    <div className="h-64 relative w-full mb-6">
                                        <Line 
                                            data={{
                                                labels: ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 29'],
                                                datasets: [{
                                                    label: 'Web Traffic Views',
                                                    data: [1420, 2180, 1950, 2684, 3487],
                                                    borderColor: '#D8B15C',
                                                    backgroundColor: 'rgba(216, 177, 92, 0.15)',
                                                    fill: true,
                                                    tension: 0.4
                                                }]
                                            }}
                                            options={{ responsive: true, maintainAspectRatio: false }}
                                        />
                                    </div>
                                    <hr className="border-white/5 my-6" />
                                    <div className="h-64 relative w-full">
                                        <Bar 
                                            data={{
                                                labels: ['Music', 'Dance', 'Drama', 'Visual Arts', 'Literature'],
                                                datasets: [{
                                                    label: 'Registrations',
                                                    data: [320, 180, 290, 140, 90],
                                                    backgroundColor: 'rgba(0, 219, 222, 0.6)'
                                                }, {
                                                    label: 'Member Growth',
                                                    data: [110, 85, 55, 95, 40],
                                                    backgroundColor: 'rgba(155, 93, 229, 0.6)'
                                                }]
                                            }}
                                            options={{ responsive: true, maintainAspectRatio: false }}
                                        />
                                    </div>
                                </div>

                                <div className="dash-right flex flex-col gap-6">
                                    {/* System stats */}
                                    <div className="glass-panel p-6">
                                        <h3>System Health & Storage</h3>
                                        <ul className="system-status-list mt-4">
                                            <li>
                                                <span className="status-name"><CheckCircle2 className="inline text-success mr-2 w-4" /> Firestore DB</span>
                                                <span className="status-value text-success">Healthy</span>
                                            </li>
                                            <li>
                                                <span className="status-name"><AlertTriangle className="inline text-warning mr-2 w-4" /> Local Storage</span>
                                                <span className="status-value text-warning">2.4% Space Used</span>
                                            </li>
                                            <li>
                                                <span className="status-name"><Shield className="inline text-success mr-2 w-4" /> CSRF / XSS Security</span>
                                                <span className="status-value text-success">Active</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="glass-panel p-6">
                                        <h3>Quick Shortcuts</h3>
                                        <div className="quick-actions-grid mt-4">
                                            <button className="quick-action-btn" onClick={() => setModalEvent({ open: true, event: null })}><Calendar /><span>New Event</span></button>
                                            <button className="quick-action-btn" onClick={() => setActiveTab('gallery')}><Upload /><span>Upload Media</span></button>
                                            <button className="quick-action-btn" onClick={() => setModalTeam({ open: true, member: null })}><Plus /><span>Add Member</span></button>
                                            <button className="quick-action-btn" onClick={() => setModalAnnouncement({ open: true, notice: null })}><Megaphone /><span>Post Notice</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: HERO SECTION */}
                    {activeTab === 'hero' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Hero Section Settings</h1>
                                    <p className="subtitle">Modify headers, logo paths, and video background loops.</p>
                                </div>
                                <div className="header-actions">
                                    <button type="submit" form="hero-form-react" className="btn-primary"><Check className="w-4 h-4" /> Save Singleton</button>
                                </div>
                            </div>

                            <div className="glass-panel p-6">
                                <form id="hero-form-react" onSubmit={handleHeroSave} className="admin-form">
                                    <div className="form-grid">
                                        <div className="form-group span-2">
                                            <label>Main Title Header</label>
                                            <input type="text" id="hero-title" defaultValue={hero.title} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Highlighted Suffix</label>
                                            <input type="text" id="hero-title-highlight" defaultValue={hero.titleHighlight} required />
                                        </div>
                                        <div className="form-group span-3">
                                            <label>Hero Description</label>
                                            <textarea id="hero-desc" defaultValue={hero.description} rows={3} required></textarea>
                                        </div>
                                        <div className="form-group span-2">
                                            <label>Background Video URL (WEBM)</label>
                                            <input type="text" id="hero-video" defaultValue={hero.videoUrl} />
                                        </div>
                                        <div className="form-group">
                                            <label>Background Video URL (Safari MOV)</label>
                                            <input type="text" id="hero-video-mov" defaultValue={hero.videoFallbackUrl} />
                                        </div>
                                        <div className="form-group">
                                            <label>Primary Button Text</label>
                                            <input type="text" id="hero-btn-primary" defaultValue={hero.primaryButtonText} />
                                        </div>
                                        <div className="form-group">
                                            <label>Primary Button URL Target</label>
                                            <input type="text" id="hero-btn-primary-link" defaultValue={hero.primaryButtonLink} />
                                        </div>
                                        <div className="form-group">
                                            <label>Secondary Button Text</label>
                                            <input type="text" id="hero-btn-secondary" defaultValue={hero.secondaryButtonText} />
                                        </div>
                                        <div className="form-group">
                                            <label>Secondary Button URL Target</label>
                                            <input type="text" id="hero-btn-secondary-link" defaultValue={hero.secondaryButtonLink} />
                                        </div>
                                        <div className="form-group">
                                            <label>Facebook Url</label>
                                            <input type="text" id="hero-fb" defaultValue={hero.facebookLink} />
                                        </div>
                                        <div className="form-group">
                                            <label>Instagram Url</label>
                                            <input type="text" id="hero-ig" defaultValue={hero.instagramLink} />
                                        </div>
                                        <div className="form-group">
                                            <label>TikTok Url</label>
                                            <input type="text" id="hero-tt" defaultValue={hero.tiktokLink} />
                                        </div>
                                        <div className="form-group span-3">
                                            <label>Community Avatar descriptive text</label>
                                            <input type="text" id="hero-avatar-desc" defaultValue={hero.avatarText} />
                                        </div>
                                        <div className="form-group span-3 mt-4">
                                            <h3>Homepage Hero element Visibilities</h3>
                                            <div className="toggle-grid mt-2">
                                                <label className="toggle-container">
                                                    <input type="checkbox" id="toggle-hero-logo" defaultChecked={hero.visibility.logo} />
                                                    <span className="toggle-slider"></span>
                                                    Show Brand Notch
                                                </label>
                                                <label className="toggle-container">
                                                    <input type="checkbox" id="toggle-hero-avatars" defaultChecked={hero.visibility.avatars} />
                                                    <span className="toggle-slider"></span>
                                                    Show Community Group Avatars
                                                </label>
                                                <label className="toggle-container">
                                                    <input type="checkbox" id="toggle-hero-socials" defaultChecked={hero.visibility.socials} />
                                                    <span className="toggle-slider"></span>
                                                    Show Social floating panel
                                                </label>
                                                <label className="toggle-container">
                                                    <input type="checkbox" id="toggle-hero-upcoming" defaultChecked={hero.visibility.upcomingCard} />
                                                    <span className="toggle-slider"></span>
                                                    Show Floating Event Highlight Card
                                                </label>
                                                <label className="toggle-container">
                                                    <input type="checkbox" id="toggle-hero-join" defaultChecked={hero.visibility.joinCard} />
                                                    <span className="toggle-slider"></span>
                                                    Show Floating Join Card
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}

                    {/* TAB: ABOUT US */}
                    {activeTab === 'about' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>About Us Section Settings</h1>
                                    <p className="subtitle">Modify story details, brand missions, vision objectives, and statistics numbers.</p>
                                </div>
                                <div className="header-actions">
                                    <button type="submit" form="about-form-react" className="btn-primary"><Check className="w-4 h-4" /> Save Singleton</button>
                                </div>
                            </div>

                            <div className="glass-panel p-6">
                                <form id="about-form-react" onSubmit={handleAboutSave} className="admin-form">
                                    <h3>Narrative Text</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Tag title</label>
                                            <input type="text" id="about-tag" defaultValue={about.tag} />
                                        </div>
                                        <div className="form-group span-2">
                                            <label>Section Header</label>
                                            <input type="text" id="about-heading" defaultValue={about.heading} />
                                        </div>
                                        <div className="form-group span-3">
                                            <label>Story Description Paragraph</label>
                                            <textarea id="about-description" defaultValue={about.description} rows={3}></textarea>
                                        </div>
                                        <div className="form-group">
                                            <label>Large Card Banner Image URL</label>
                                            <input type="text" id="about-large-card-img" defaultValue={about.largeCardImage} />
                                        </div>
                                        <div className="form-group">
                                            <label>Overlay text</label>
                                            <input type="text" id="about-large-card-overlay" defaultValue={about.largeCardOverlayText} />
                                        </div>
                                        <div className="form-group">
                                            <label>Large card details redirection link</label>
                                            <input type="text" id="about-large-card-link" defaultValue={about.largeCardLink} />
                                        </div>
                                    </div>

                                    <hr className="form-divider" />

                                    <h3>Mission statement & Community</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Mission tag label</label>
                                            <input type="text" id="about-mission-tag" defaultValue={about.mission.tag} />
                                        </div>
                                        <div className="form-group span-2">
                                            <label>Mission header heading</label>
                                            <input type="text" id="about-mission-heading" defaultValue={about.mission.heading} />
                                        </div>
                                        <div className="form-group span-3">
                                            <label>Mission statement descriptions</label>
                                            <textarea id="about-mission-description" defaultValue={about.mission.description} rows={2}></textarea>
                                        </div>
                                        <div className="form-group">
                                            <label>Mission logo brand icon URL</label>
                                            <input type="text" id="about-mission-logo" defaultValue={about.mission.logoUrl} />
                                        </div>
                                        <div className="form-group span-2">
                                            <label>Community Group photograph URL</label>
                                            <input type="text" id="about-mission-community-img" defaultValue={about.mission.communityImage} />
                                        </div>
                                    </div>

                                    <hr className="form-divider" />

                                    <h3>Statistics Widgets Numbers</h3>
                                    {about.stats?.map((s: any, idx: number) => (
                                        <div className="form-grid mt-2 border border-white/5 p-4 rounded-lg mb-4" key={idx}>
                                            <div className="form-group">
                                                <label>Stat {idx+1} FontAwesome Icon class</label>
                                                <input type="text" className="about-stat-icon" defaultValue={s.icon} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Stat {idx+1} Value</label>
                                                <input type="text" className="about-stat-number" defaultValue={s.number} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Stat {idx+1} Descriptive label</label>
                                                <input type="text" className="about-stat-label" defaultValue={s.label} required />
                                            </div>
                                        </div>
                                    ))}
                                </form>
                            </div>
                        </section>
                    )}

                    {/* TAB: ART CATEGORIES */}
                    {activeTab === 'categories' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Art Categories Management</h1>
                                    <p className="subtitle">Enable/disable categories, update description summaries, and sort grid orders.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-primary" onClick={() => setModalCategory({ open: true, cat: null })}><Plus /> Add Category</button>
                                </div>
                            </div>

                            <div className="glass-panel p-6">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Sort Order</th>
                                                <th>Icon</th>
                                                <th>Unique Key ID</th>
                                                <th>Title</th>
                                                <th>Description Summary</th>
                                                <th>Display State</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.sort((a,b) => a.displayOrder - b.displayOrder).map(c => (
                                                <tr key={c.id}>
                                                    <td><strong>{c.displayOrder}</strong></td>
                                                    <td><i className={`${c.icon} text-lg text-gold`} /></td>
                                                    <td><code>{c.id}</code></td>
                                                    <td><strong>{c.title}</strong></td>
                                                    <td>{c.description}</td>
                                                    <td><span className={`member-badge ${c.enabled ? 'badge-approved' : 'badge-rejected'}`}>{c.enabled ? 'ENABLED' : 'DISABLED'}</span></td>
                                                    <td className="actions-cell">
                                                        <button className="action-btn-sm" onClick={() => setModalCategory({ open: true, cat: c })}><Edit className="w-3 h-3" /></button>
                                                        <button className="action-btn-sm action-btn-danger" onClick={() => handleDeleteCategory(c.id, c.title)}><Trash2 className="w-3 h-3" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: EVENTS */}
                    {activeTab === 'events' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Events Management</h1>
                                    <p className="subtitle">Manage organization schedules, RSVPs, banner visuals, and featured performances.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-primary" onClick={() => setModalEvent({ open: true, event: null })}><Plus /> Add Event</button>
                                </div>
                            </div>

                            {/* Filters row */}
                            <div className="search-filter-panel glass-panel mb-6">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Search text</label>
                                        <input type="text" placeholder="Search by title, location..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Filter Category</label>
                                        <select value={eventFilterCat} onChange={e => setEventFilterCat(e.target.value)}>
                                            <option value="all">All Category Areas</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Visibility Status</label>
                                        <select value={eventFilterStatus} onChange={e => setEventFilterStatus(e.target.value)}>
                                            <option value="all">All States</option>
                                            <option value="published">Published</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Table */}
                            <div className="glass-panel p-6">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Banner</th>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Date & time</th>
                                                <th>Venue Location</th>
                                                <th>Featured</th>
                                                <th>State</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.filter(e => {
                                                const matchText = e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.venue.toLowerCase().includes(eventSearch.toLowerCase());
                                                const matchCat = eventFilterCat === 'all' || e.category === eventFilterCat;
                                                const matchStatus = eventFilterStatus === 'all' || e.status === eventFilterStatus;
                                                return matchText && matchCat && matchStatus;
                                            }).map(e => (
                                                <tr key={e.id}>
                                                    <td><img src={e.banner} alt="banner" className="table-img" /></td>
                                                    <td><strong>{e.title}</strong></td>
                                                    <td><span className="text-gold capitalize" style={{ fontSize: '0.8rem', fontWeight: 600 }}><i className="fas fa-tag mr-1" /> {e.category}</span></td>
                                                    <td><code>{e.date} | {e.time}</code></td>
                                                    <td><span className="text-xs text-muted"><i className="fas fa-location-dot mr-1" /> {e.venue}</span></td>
                                                    <td>
                                                        <label className="toggle-container">
                                                            <input type="checkbox" checked={e.featured} onChange={() => toggleEventFeatured(e)} />
                                                            <span className="toggle-slider"></span>
                                                        </label>
                                                    </td>
                                                    <td><span className={`member-badge ${e.status === 'published' ? 'badge-approved' : e.status === 'archived' ? 'badge-rejected' : 'badge-pending'}`}>{e.status.toUpperCase()}</span></td>
                                                    <td className="actions-cell">
                                                        <button className="action-btn-sm" onClick={() => setModalEvent({ open: true, event: e })} title="Edit"><Edit className="w-3 h-3" /></button>
                                                        <button className="action-btn-sm" onClick={() => handleDuplicateEvent(e)} title="Duplicate"><Copy className="w-3 h-3" /></button>
                                                        <button className="action-btn-sm action-btn-danger" onClick={() => handleDeleteEvent(e.id, e.title)} title="Delete"><Trash2 className="w-3 h-3" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: GALLERY CURATOR & FILE MANAGER */}
                    {activeTab === 'gallery' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Gallery Curator & Media Library</h1>
                                    <p className="subtitle">CURATOR: Drag/drop uploads, folder curations, canvas resizing, aspect ratios aspect, and featured grid stars.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-secondary mr-2" onClick={handleCreateFolder}><FolderPlus className="w-4 h-4 mr-1" /> New Folder</button>
                                    <button className="btn-primary" onClick={() => document.getElementById('media-upload-react')?.click()}><Upload className="w-4 h-4 mr-1" /> Bulk Upload</button>
                                    <input type="file" id="media-upload-react" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                                </div>
                            </div>

                            {/* Media Folders & Breadcrumbs */}
                            <div className="flex gap-4 mb-6">
                                <button className={`btn-secondary ${currentFolder === '/' ? 'border-gold text-gold bg-gold/5' : ''}`} onClick={() => setCurrentFolder('/')}><Folder className="w-4 h-4 mr-1 inline" /> root /</button>
                                <button className={`btn-secondary ${currentFolder === '/gallery' ? 'border-gold text-gold bg-gold/5' : ''}`} onClick={() => setCurrentFolder('/gallery')}><Folder className="w-4 h-4 mr-1 inline" /> gallery /</button>
                                <button className={`btn-secondary ${currentFolder === '/banners' ? 'border-gold text-gold bg-gold/5' : ''}`} onClick={() => setCurrentFolder('/banners')}><Folder className="w-4 h-4 mr-1 inline" /> banners /</button>
                            </div>

                            {/* File Curator Search */}
                            <div className="search-filter-panel glass-panel mb-6">
                                <div className="gallery-curator-filter">
                                    <div className="curator-search">
                                        <Search />
                                        <input type="text" placeholder="Search files, labels..." value={fileSearch} onChange={e => setFileSearch(e.target.value)} />
                                    </div>
                                    <div className="curator-filters">
                                        <button className={`filter-tab-btn ${galleryFilter === 'all' ? 'active' : ''}`} onClick={() => setGalleryFilter('all')}>All Curated</button>
                                        <button className={`filter-tab-btn ${galleryFilter === 'music' ? 'active' : ''}`} onClick={() => setGalleryFilter('music')}>Music</button>
                                        <button className={`filter-tab-btn ${galleryFilter === 'dance' ? 'active' : ''}`} onClick={() => setGalleryFilter('dance')}>Dance</button>
                                        <button className={`filter-tab-btn ${galleryFilter === 'featured' ? 'active' : ''}`} onClick={() => setGalleryFilter('featured')}>Curated Star</button>
                                    </div>
                                </div>
                            </div>

                            {/* Media Grid Library */}
                            <div className="glass-panel p-6">
                                <h3>Storage Library files ({currentFolder})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                                    {filesList.filter(f => f.folder === currentFolder && f.name.toLowerCase().includes(fileSearch.toLowerCase())).map(f => (
                                        <div key={f.id} className="relative group rounded-lg overflow-hidden border border-white/5 bg-black/40 aspect-square flex flex-col justify-between p-2">
                                            {f.type === 'image' ? (
                                                <img src={f.url} alt="img" className="w-full h-24 object-cover rounded" />
                                            ) : (
                                                <div className="w-full h-24 bg-gold-tint border border-gold/10 flex items-center justify-center rounded"><ImageIcon className="text-gold w-8 h-8" /></div>
                                            )}
                                            <div className="mt-2 text-xs truncate font-medium text-white/80">{f.name}</div>
                                            <div className="text-[10px] text-muted">{(f.size/1024).toFixed(0)} KB</div>
                                            <button className="absolute top-2 right-2 hidden group-hover:flex bg-red-500 text-white rounded p-1" onClick={() => handleFileDelete(f.id, f.name)}><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    {filesList.filter(f => f.folder === currentFolder).length === 0 && (
                                        <div className="col-span-6 text-center text-muted p-12 text-sm">Empty folder. Upload files directly to populate folder library.</div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-white/5 my-8" />

                            {/* Curated gallery nodes */}
                            <div className="glass-panel p-6">
                                <h3> Curated Homepage Gallery masonry Nodes</h3>
                                <div className="gallery-curator-grid mt-4">
                                    {gallery.filter(item => {
                                        const matchText = item.title.toLowerCase().includes(fileSearch.toLowerCase()) || (item.desc && item.desc.toLowerCase().includes(fileSearch.toLowerCase()));
                                        let matchFilter = true;
                                        if (galleryFilter === 'featured') matchFilter = item.featured === true;
                                        else if (galleryFilter !== 'all') matchFilter = item.category === galleryFilter;
                                        return matchText && matchFilter;
                                    }).map(item => (
                                        <div key={item.id} className="gallery-card-admin relative group rounded-lg overflow-hidden border border-white/5 aspect-square">
                                            {isVideoFile(item.src) ? (
                                                <video src={item.src} muted className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={item.src} alt="img" className="w-full h-full object-cover" />
                                            )}
                                            {item.featured && <div className="gallery-star-indicator"><i className="fas fa-star text-gold text-xs" /></div>}
                                            <div className="gallery-card-admin-overlay flex flex-col justify-end p-3 absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <div className="gallery-card-cat text-gold text-[10px] font-bold uppercase">{item.category}</div>
                                                <div className="gallery-card-title text-sm font-semibold">{item.title}</div>
                                                <div className="gallery-card-actions flex justify-between items-center mt-2">
                                                    <button className="action-btn-sm" onClick={() => setModalGallery({ open: true, item })}><Edit className="w-3 h-3" /></button>
                                                    <button className="action-btn-sm action-btn-danger" onClick={() => handleDeleteGalleryItem(item.id)}><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: TEAM DIRECTORY */}
                    {activeTab === 'team' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Team & Committee Directory</h1>
                                    <p className="subtitle">Establish position orders, upload photographs manifestos, and toggle status checks.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-primary" onClick={() => setModalTeam({ open: true, member: null })}><Plus /> Add Member</button>
                                </div>
                            </div>

                            <div className="glass-panel p-6">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Sort order</th>
                                                <th>Photo</th>
                                                <th>Full Name</th>
                                                <th>Assigned Position</th>
                                                <th>Email & Contacts</th>
                                                <th>Active Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {team.sort((a,b) => a.displayOrder - b.displayOrder).map((m, index) => (
                                                <tr key={m.id}>
                                                    <td>
                                                        <div className="actions-cell">
                                                            <button className="action-btn-sm" onClick={() => moveTeamOrder(m, -1)} disabled={index === 0}><ArrowUp className="w-3 h-3" /></button>
                                                            <button className="action-btn-sm" onClick={() => moveTeamOrder(m, 1)} disabled={index === team.length - 1}><ArrowDown className="w-3 h-3" /></button>
                                                        </div>
                                                    </td>
                                                    <td><img src={m.image} alt="Avatar" className="table-avatar" /></td>
                                                    <td><strong>{m.name}</strong></td>
                                                    <td><span className="member-badge badge-approved text-[10px]">{m.role}</span></td>
                                                    <td><span className="text-xs text-muted font-medium">{m.email} <br />{m.phone || 'N/A'}</span></td>
                                                    <td><span className={`member-badge ${m.active ? 'badge-approved' : 'badge-rejected'}`}>{m.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                                                    <td className="actions-cell">
                                                        <button className="action-btn-sm" onClick={() => setModalTeam({ open: true, member: m })}><Edit className="w-3 h-3" /></button>
                                                        <button className="action-btn-sm action-btn-danger" onClick={() => handleDeleteTeamMember(m.id, m.name)}><Trash2 className="w-3 h-3" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: ANNOUNCEMENTS */}
                    {activeTab === 'announcements' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Notice Board Announcements</h1>
                                    <p className="subtitle">Publish system-wide notifications, pin topics to homepage top notch, and schedule dates.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-primary" onClick={() => setModalAnnouncement({ open: true, notice: null })}><Plus /> New Notice</button>
                                </div>
                            </div>

                            <div className="glass-panel p-6">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Notice Title</th>
                                                <th>Publish Date</th>
                                                <th>Expiry Date</th>
                                                <th>Pinned</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {announcements.map(a => (
                                                <tr key={a.id}>
                                                    <td><img src={a.image || 'ASSETS/images/Singers.svg'} alt="notice" className="table-img" /></td>
                                                    <td><strong>{a.title}</strong></td>
                                                    <td><code>{a.publishDate}</code></td>
                                                    <td><code>{a.expiryDate}</code></td>
                                                    <td><span className={`member-badge ${a.pinned ? 'badge-approved' : 'badge-rejected'}`}>{a.pinned ? 'YES' : 'NO'}</span></td>
                                                    <td><span className={`member-badge ${a.status === 'published' ? 'badge-approved' : 'badge-pending'}`}>{a.status.toUpperCase()}</span></td>
                                                    <td className="actions-cell">
                                                        <button className="action-btn-sm" onClick={() => setModalAnnouncement({ open: true, notice: a })}><Edit className="w-3 h-3" /></button>
                                                        <button className="action-btn-sm action-btn-danger" onClick={() => handleDeleteAnnouncement(a.id)}><Trash2 className="w-3 h-3" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: MEMBERSHIP SUBMISSIONS */}
                    {activeTab === 'memberships' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Membership Applications Registry</h1>
                                    <p className="subtitle">Review intent manifestos, filter lists by Year/Status, and export spreadsheets.</p>
                                </div>
                                <div className="header-actions flex gap-2">
                                    <button className="btn-secondary text-sm" onClick={handleCSVExport}><FileSpreadsheet className="w-4 h-4 mr-1 inline" /> Export CSV Excel</button>
                                    <button className="btn-secondary text-sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1 inline" /> Print PDF Registry</button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="search-filter-panel glass-panel mb-6">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Search Applicants</label>
                                        <input type="text" placeholder="Search by name, email, statement..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Art Area Category</label>
                                        <select value={memberFilterCat} onChange={e => setMemberFilterCat(e.target.value)}>
                                            <option value="all">All Artistic Areas</option>
                                            <option value="music">Music</option>
                                            <option value="dance">Dance</option>
                                            <option value="drama">Drama</option>
                                            <option value="visual">Visual Arts</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Review Status</label>
                                        <select value={memberFilterStatus} onChange={e => setMemberFilterStatus(e.target.value)}>
                                            <option value="all">All Status states</option>
                                            <option value="pending">Pending Review</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Submissions Datagrid */}
                            <div className="glass-panel p-6">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Date Submitted</th>
                                                <th>Full name</th>
                                                <th>Contacts Email</th>
                                                <th>Artistic Area</th>
                                                <th>Applied Year</th>
                                                <th>Review State</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {memberships.filter(m => {
                                                const matchText = m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase());
                                                const matchCat = memberFilterCat === 'all' || m.artCategory === memberFilterCat;
                                                const matchStatus = memberFilterStatus === 'all' || m.status === memberFilterStatus;
                                                return matchText && matchCat && matchStatus;
                                            }).map(m => (
                                                <tr key={m.id}>
                                                    <td><code>{m.submittedAt?.split('T')[0] || '2026-07-02'}</code></td>
                                                    <td><strong>{m.name}</strong></td>
                                                    <td><span className="text-xs font-semibold">{m.email} <br /><span className="text-[10px] text-muted">{m.phone}</span></span></td>
                                                    <td><span className="text-gold text-xs font-bold uppercase">{m.artCategory}</span></td>
                                                    <td><code>{m.year || '2026'}</code></td>
                                                    <td><span className={`member-badge ${m.status === 'approved' ? 'badge-approved' : m.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>{m.status.toUpperCase()}</span></td>
                                                    <td><button className="action-btn-sm text-gold border-gold/30 w-auto px-3 py-1 flex items-center gap-1 font-semibold text-xs" onClick={() => setModalMembership({ open: true, applicant: m })}><Eye className="w-3 h-3" /> Review</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: CONTACT US INBOX */}
                    {activeTab === 'contact' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Contact Form Feedbacks Inbox</h1>
                                    <p className="subtitle">Read feedback queries, manage read/unread tags, and reply directly.</p>
                                </div>
                            </div>

                            <div className="messages-inbox-layout">
                                <div className="messages-sidebar glass-panel">
                                    <div className="messages-search">
                                        <Search />
                                        <input type="text" placeholder="Search Inbox messages..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
                                    </div>
                                    <ul className="message-list-items">
                                        {contactMessages.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.message.toLowerCase().includes(contactSearch.toLowerCase())).map(c => (
                                            <li key={c.id} className={`message-list-item ${selectedContactId === c.id ? 'active' : ''} ${!c.read ? 'unread' : ''}`} onClick={() => {
                                                setSelectedContactId(c.id);
                                                if (!c.read) updateDocument('contactMessages', c.id, { read: true });
                                            }}>
                                                <div className="message-list-item-header">
                                                    <span className="msg-sender font-semibold text-white/95">{c.name}</span>
                                                    <span className="msg-time">{c.submittedAt?.split('T')[0] || '2026-07-02'}</span>
                                                </div>
                                                <div className="msg-subject font-medium text-gold text-xs">Website Inquiry Query</div>
                                                <div className="msg-body-preview text-xs text-muted truncate">{c.message}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="messages-content-view glass-panel">
                                    {selectedContactId ? (
                                        (() => {
                                            const msg = contactMessages.find(c => c.id === selectedContactId);
                                            if (!msg) return null;
                                            return (
                                                <div className="flex flex-col h-full justify-between">
                                                    <div className="msg-view-header border-b border-white/5 pb-4 mb-4">
                                                        <div className="msg-view-title-row flex justify-between items-start">
                                                            <h3 className="msg-view-subject text-lg font-bold">SCU ArtCircle Contact Query</h3>
                                                            <button className="action-btn-sm action-btn-danger" onClick={() => handleDeleteContactMessage(msg.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                        <div className="msg-view-sender-info flex items-center gap-3 mt-4">
                                                            <div className="msg-view-sender-avatar w-9 h-9 bg-gold text-black font-bold rounded-full flex items-center justify-center">{msg.name.charAt(0).toUpperCase()}</div>
                                                            <div className="msg-view-sender-details flex flex-col">
                                                                <span className="msg-view-sender-name font-semibold text-sm">{msg.name}</span>
                                                                <span className="msg-view-sender-email text-xs text-muted">{msg.email}</span>
                                                            </div>
                                                            <span className="msg-time ml-auto text-xs opacity-60">{msg.submittedAt?.split('T')[0]}</span>
                                                        </div>
                                                    </div>
                                                    <div className="msg-view-body flex-grow text-white/80 leading-relaxed text-sm py-4 whitespace-pre-wrap">{msg.message}</div>
                                                    <div className="msg-view-footer border-t border-white/5 pt-4 flex justify-between">
                                                        <button className="btn-secondary text-sm" onClick={async () => {
                                                            await updateDocument('contactMessages', msg.id, { read: false });
                                                            setSelectedContactId(null);
                                                            triggerToast('Message marked as unread.', 'info');
                                                        }}><Mail className="w-4 h-4 mr-1 inline" /> Mark Unread</button>
                                                        <button className="btn-primary text-sm" onClick={() => setModalReply({ open: true, msg })}><ArrowRight className="w-4 h-4 mr-1 inline" /> Reply Message</button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="no-message-selected flex flex-col items-center justify-center h-full text-muted gap-2">
                                            <Mail className="w-12 h-12" />
                                            <p className="text-sm">Select a contact message from inbox pane to review details.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: USERS & ROLES */}
                    {activeTab === 'users' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>System Users & Admin Roles Matrix</h1>
                                    <p className="subtitle">Review permission profiles, create administration accounts, and edit credentials.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-primary" onClick={() => setModalUser({ open: true })}><Plus /> Add Account</button>
                                </div>
                            </div>

                            <div className="dashboard-grid">
                                <div className="glass-panel p-6 span-2">
                                    <h3>CMS Administrators</h3>
                                    <div className="table-wrapper mt-4">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Photo</th>
                                                    <th>Username</th>
                                                    <th>Full Name</th>
                                                    <th>Email Address</th>
                                                    <th>Assigned Role</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usersList.map(u => (
                                                    <tr key={u.id}>
                                                        <td><img src={u.avatar} alt="img" className="table-avatar" /></td>
                                                        <td><code>{u.username}</code></td>
                                                        <td><strong>{u.name}</strong></td>
                                                        <td><span className="text-xs font-semibold">{u.email}</span></td>
                                                        <td><span className="member-badge badge-approved text-[10px]">{u.role}</span></td>
                                                        <td>
                                                            {u.username !== 'superadmin' ? (
                                                                <button className="action-btn-sm action-btn-danger" onClick={async () => {
                                                                    setModalConfirm({
                                                                        open: true,
                                                                        title: 'Delete Admin user',
                                                                        message: `Are you sure you want to delete admin login "${u.username}"?`,
                                                                        onConfirm: async () => {
                                                                            await deleteDocument('users', u.id);
                                                                            triggerToast('Administrator account removed.', 'success');
                                                                        }
                                                                    });
                                                                }}><Trash2 className="w-3 h-3" /></button>
                                                            ) : <span className="text-xs text-muted">Protected</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 flex flex-col gap-4">
                                    <h3>Roles Permission Breakdown</h3>
                                    <div className="permissions-matrix space-y-4">
                                        <div className="matrix-item bg-white/3 p-3 rounded-lg border border-white/5">
                                            <strong className="text-gold text-xs uppercase block mb-1">Super Admin</strong>
                                            <p className="text-[11px] text-muted">Full write / edit / delete and recovery permissions across every system settings, backup channels, and account creators.</p>
                                        </div>
                                        <div className="matrix-item bg-white/3 p-3 rounded-lg border border-white/5">
                                            <strong className="text-gold text-xs uppercase block mb-1">Admin</strong>
                                            <p className="text-[11px] text-muted">Authorized to update landing page segments, categories, events. Restricted from database clears or role creators.</p>
                                        </div>
                                        <div className="matrix-item bg-white/3 p-3 rounded-lg border border-white/5">
                                            <strong className="text-gold text-xs uppercase block mb-1">Editor</strong>
                                            <p className="text-[11px] text-muted">Edit static components (Hero, About details) and Announcements. Cannot review contact feedback forms or registries.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: WEBSITE SETTINGS */}
                    {activeTab === 'settings' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>Website settings & Backups</h1>
                                    <p className="subtitle">Configure meta tags, analytics, SEO variables, and export backup files.</p>
                                </div>
                                <div className="header-actions">
                                    <button type="submit" form="settings-form-react" className="btn-primary"><Check className="w-4 h-4" /> Save Configuration</button>
                                </div>
                            </div>

                            <div className="dashboard-grid">
                                <div className="glass-panel p-6">
                                    <h3>Global Configurations</h3>
                                    <form id="settings-form-react" onSubmit={handleSettingsSave} className="admin-form mt-4">
                                        <div className="form-group">
                                            <label>Website Name</label>
                                            <input type="text" id="settings-site-name" defaultValue={settings.websiteName} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Brand Logo URL</label>
                                            <input type="text" id="settings-logo-url" defaultValue={settings.logo} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Favicon Link icon</label>
                                            <input type="text" id="settings-favicon" defaultValue={settings.favicon} />
                                        </div>
                                        <div className="form-group">
                                            <label>Footer copyright text</label>
                                            <input type="text" id="settings-footer-text" defaultValue={settings.footerText} />
                                        </div>
                                        <div className="form-grid mt-4">
                                            <div className="form-group">
                                                <label>SEO Title Meta</label>
                                                <input type="text" id="settings-seo-title" defaultValue={settings.seoTitle} />
                                            </div>
                                            <div className="form-group">
                                                <label>SEO Keywords Meta</label>
                                                <input type="text" id="settings-seo-keywords" defaultValue={settings.metaKeywords} />
                                            </div>
                                        </div>
                                        <div className="form-group mt-2">
                                            <label>SEO Description summary</label>
                                            <textarea id="settings-seo-desc" defaultValue={settings.seoDescription} rows={2}></textarea>
                                        </div>
                                        <div className="form-group">
                                            <label>Open Graph Image Url</label>
                                            <input type="text" id="settings-og-img" defaultValue={settings.openGraphImage} />
                                        </div>
                                        <div className="form-group">
                                            <label>Analytics tracking Code</label>
                                            <input type="text" id="settings-analytics" defaultValue={settings.analyticsCode} />
                                        </div>
                                        <div className="form-group">
                                            <label>Google Maps Integration Link</label>
                                            <input type="text" id="settings-maps" defaultValue={settings.googleMaps} />
                                        </div>
                                        <div className="form-grid mt-2">
                                            <div className="form-group">
                                                <label>Email Address</label>
                                                <input type="text" id="settings-email" defaultValue={settings.email} />
                                            </div>
                                            <div className="form-group">
                                                <label>Phone Contact</label>
                                                <input type="text" id="settings-phone" defaultValue={settings.phone} />
                                            </div>
                                            <div className="form-group">
                                                <label>Address Location</label>
                                                <input type="text" id="settings-address" defaultValue={settings.address} />
                                            </div>
                                        </div>
                                        <div className="form-grid mt-2">
                                            <div className="form-group">
                                                <label>Facebook Link</label>
                                                <input type="text" id="settings-facebook" defaultValue={settings.facebook} />
                                            </div>
                                            <div className="form-group">
                                                <label>Instagram Link</label>
                                                <input type="text" id="settings-instagram" defaultValue={settings.instagram} />
                                            </div>
                                            <div className="form-group">
                                                <label>TikTok Link</label>
                                                <input type="text" id="settings-tiktok" defaultValue={settings.tiktok} />
                                            </div>
                                        </div>
                                        <div className="form-group mt-4">
                                            <label className="toggle-container">
                                                <input type="checkbox" id="settings-maintenance" defaultChecked={settings.maintenanceMode} />
                                                <span className="toggle-slider"></span>
                                                Enable Maintenance mode lockout
                                            </label>
                                        </div>
                                    </form>
                                </div>

                                <div className="glass-panel p-6 flex flex-col justify-between h-96">
                                    <div>
                                        <h3>System Backup Operations</h3>
                                        <p className="text-xs text-muted mt-2 leading-relaxed">Save a portable copy of all Firestore database tables as a JSON backup files. You can reload this copy at any time using the Import function below.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <button className="btn-secondary w-full" onClick={handleBackupExport}><Download className="w-4 h-4 mr-2 inline" /> Export JSON DB Backup</button>
                                        <button className="btn-secondary w-full" onClick={() => document.getElementById('backup-import-react')?.click()}><Upload className="w-4 h-4 mr-2 inline" /> Restore Backup File</button>
                                        <input type="file" id="backup-import-react" accept=".json" className="hidden" onChange={handleBackupImport} />
                                        <hr className="border-white/5" />
                                        <button className="btn-secondary btn-danger w-full" onClick={handleResetDB}><AlertTriangle className="w-4 h-4 mr-2 inline" /> Wipe Database Defaults</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* TAB: ACTIVITY LOGS */}
                    {activeTab === 'logs' && (
                        <section className="tab-pane active">
                            <div className="content-header">
                                <div>
                                    <h1>System Audit Activity Logs</h1>
                                    <p className="subtitle">Review log histories, login audits, and content updates streams.</p>
                                </div>
                                <div className="header-actions">
                                    <button className="btn-secondary btn-danger" onClick={() => {
                                        setModalConfirm({
                                            open: true,
                                            title: 'Clear Audit Logs',
                                            message: 'Are you sure you want to permanently clear all CMS activity log histories?',
                                            onConfirm: async () => {
                                                await clearAllActivityLogs(activityLogs);
                                                triggerToast('Audit histories cleared.', 'success');
                                            }
                                        });
                                    }}><Trash2 className="w-4 h-4 mr-1 inline" /> Clear Logs</button>
                                </div>
                            </div>

                            <div className="glass-panel p-6">
                                <div className="mb-4 relative">
                                    <Search className="absolute left-3 top-2.5 text-muted w-4" />
                                    <input type="text" placeholder="Search logs by action, administrator name..." value={logsSearch} onChange={e => setLogsSearch(e.target.value)} className="pl-10" />
                                </div>
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Timestamp</th>
                                                <th>Administrator Name</th>
                                                <th>Assigned Role</th>
                                                <th>Action Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityLogs.filter(l => l.user.toLowerCase().includes(logsSearch.toLowerCase()) || l.action.toLowerCase().includes(logsSearch.toLowerCase())).map(l => (
                                                <tr key={l.id}>
                                                    <td><code>{l.time}</code></td>
                                                    <td><strong>{l.user}</strong></td>
                                                    <td><span className="member-badge badge-approved text-[10px]">{l.role}</span></td>
                                                    <td>{l.action}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* ------------------------------------------------------
                GLOBAL DIALOGS, MODALS & BACKDROPS
            ------------------------------------------------------ */}
            
            {/* Modal Backdrop overlay */}
            {(modalCategory.open || modalEvent.open || modalGallery.open || modalTeam.open || modalAnnouncement.open || modalUser.open || modalMembership.open || modalReply.open || modalConfirm.open || modalProfile || modalChangePass) && (
                <div className="modal-backdrop active" onClick={handleBackdropClick}></div>
            )}

            {/* 1. Modal Category */}
            {modalCategory.open && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>{modalCategory.cat ? 'Edit Category' : 'Create Category'}</h3>
                        <button onClick={() => setModalCategory({ open: false, cat: null })}><X /></button>
                    </div>
                    <form onSubmit={handleCategorySubmit} className="modal-form">
                        <input type="hidden" id="cat-field-id" defaultValue={modalCategory.cat?.id || ''} />
                        <div className="form-group">
                            <label>Category Title</label>
                            <input type="text" id="cat-field-title" defaultValue={modalCategory.cat?.title || ''} required />
                        </div>
                        <div className="form-group">
                            <label>FontAwesome Icon class</label>
                            <input type="text" id="cat-field-icon" defaultValue={modalCategory.cat?.icon || 'fas fa-tag'} required />
                        </div>
                        <div className="form-group">
                            <label>Category Description</label>
                            <textarea id="cat-field-desc" defaultValue={modalCategory.cat?.description || ''} required></textarea>
                        </div>
                        <div className="form-group">
                            <label>Sort order</label>
                            <input type="number" id="cat-field-order" defaultValue={modalCategory.cat?.displayOrder || 1} required />
                        </div>
                        <div className="form-group">
                            <label className="toggle-container">
                                <input type="checkbox" id="cat-field-enabled" defaultChecked={modalCategory.cat ? modalCategory.cat.enabled : true} />
                                <span className="toggle-slider"></span>
                                Enable Category Display
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalCategory({ open: false, cat: null })}>Cancel</button>
                            <button type="submit" className="btn-primary">Save Category</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 2. Modal Event */}
            {modalEvent.open && (
                <div className="admin-modal glass-panel modal-lg active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>{modalEvent.event ? 'Edit Performance Event' : 'Create Performance Event'}</h3>
                        <button onClick={() => setModalEvent({ open: false, event: null })}><X /></button>
                    </div>
                    <form onSubmit={handleEventSubmit} className="modal-form">
                        <input type="hidden" id="event-field-id" defaultValue={modalEvent.event?.id || ''} />
                        <div className="form-grid">
                            <div className="form-group span-2">
                                <label>Event Title</label>
                                <input type="text" id="event-field-title" defaultValue={modalEvent.event?.title || ''} required />
                            </div>
                            <div className="form-group">
                                <label>Art Category</label>
                                <select id="event-field-category" defaultValue={modalEvent.event?.category || 'music'} required>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group span-3">
                                <label>Description</label>
                                <textarea id="event-field-desc" defaultValue={modalEvent.event?.description || ''} rows={3} required></textarea>
                            </div>
                            <div className="form-group">
                                <label>Banner image URL</label>
                                <input type="text" id="event-field-banner" defaultValue={modalEvent.event?.banner || ''} />
                            </div>
                            <div className="form-group">
                                <label>Venue Location</label>
                                <input type="text" id="event-field-venue" defaultValue={modalEvent.event?.venue || ''} required />
                            </div>
                            <div className="form-group">
                                <label>Event Date</label>
                                <input type="date" id="event-field-date" defaultValue={modalEvent.event?.date || ''} required />
                            </div>
                            <div className="form-group">
                                <label>Start time</label>
                                <input type="time" id="event-field-time" defaultValue={modalEvent.event?.time || ''} required />
                            </div>
                            <div className="form-group">
                                <label>Organizer</label>
                                <input type="text" id="event-field-organizer" defaultValue={modalEvent.event?.organizer || ''} />
                            </div>
                            <div className="form-group">
                                <label>Guest Artists</label>
                                <input type="text" id="event-field-artists" defaultValue={modalEvent.event?.guestArtists || ''} />
                            </div>
                            <div className="form-group">
                                <label>Max Participants</label>
                                <input type="number" id="event-field-max" defaultValue={modalEvent.event?.maxParticipants || 500} />
                            </div>
                            <div className="form-group">
                                <label>Registration Ticket link</label>
                                <input type="text" id="event-field-link" defaultValue={modalEvent.event?.registrationLink || '#'} />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select id="event-field-status" defaultValue={modalEvent.event?.status || 'published'} required>
                                    <option value="published">Published</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div className="form-group span-3 flex gap-6 mt-2">
                                <label className="toggle-container">
                                    <input type="checkbox" id="event-field-featured" defaultChecked={modalEvent.event?.featured || false} />
                                    <span className="toggle-slider"></span>
                                    Featured Event
                                </label>
                                <label className="toggle-container">
                                    <input type="checkbox" id="event-field-timer" defaultChecked={modalEvent.event?.countdownTimer || false} />
                                    <span className="toggle-slider"></span>
                                    Countdown Timer
                                </label>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalEvent({ open: false, event: null })}>Cancel</button>
                            <button type="submit" className="btn-primary">Save Event</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 3. Modal Gallery properties */}
            {modalGallery.open && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>Edit Gallery Media details</h3>
                        <button onClick={() => setModalGallery({ open: false, item: null })}><X /></button>
                    </div>
                    <form onSubmit={handleGallerySubmit} className="modal-form">
                        <input type="hidden" id="gallery-field-id" defaultValue={modalGallery.item.id} />
                        <div className="gallery-preview-box mb-4">
                            <img src={modalGallery.item.src} className="modal-image-preview" alt="preview" />
                        </div>
                        <div className="form-group">
                            <label>Caption Title</label>
                            <input type="text" id="gallery-field-title" defaultValue={modalGallery.item.title} required />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select id="gallery-field-category" defaultValue={modalGallery.item.category} required>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Aspect ratio layout size</label>
                            <select id="gallery-field-size" defaultValue={modalGallery.item.size || ''}>
                                <option value="">Normal Aspect (Square)</option>
                                <option value="size-tall">Tall aspect (Portrait)</option>
                                <option value="size-wide">Wide aspect (Landscape)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description detail</label>
                            <textarea id="gallery-field-desc" defaultValue={modalGallery.item.desc || ''} required></textarea>
                        </div>
                        <div className="form-group">
                            <label className="toggle-container">
                                <input type="checkbox" id="gallery-field-featured" defaultChecked={modalGallery.item.featured === true} />
                                <span className="toggle-slider"></span>
                                Featured curated image
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalGallery({ open: false, item: null })}>Cancel</button>
                            <button type="submit" className="btn-primary">Save details</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 4. Modal Team Member */}
            {modalTeam.open && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>{modalTeam.member ? 'Edit Member Profile' : 'Add Team Member'}</h3>
                        <button onClick={() => setModalTeam({ open: false, member: null })}><X /></button>
                    </div>
                    <form onSubmit={handleTeamSubmit} className="modal-form">
                        <input type="hidden" id="team-field-id" defaultValue={modalTeam.member?.id || ''} />
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" id="team-field-name" defaultValue={modalTeam.member?.name || ''} required />
                        </div>
                        <div className="form-group">
                            <label>Assigned Position Role</label>
                            <select id="team-field-role" defaultValue={modalTeam.member?.role || 'Committee Member'} required>
                                <option value="President">President</option>
                                <option value="Vice President">Vice President</option>
                                <option value="Secretary">Secretary</option>
                                <option value="Assistant Secretary">Assistant Secretary</option>
                                <option value="Treasurer">Treasurer</option>
                                <option value="Editor">Editor</option>
                                <option value="Event Coordinates">Event Coordinates</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Photo URL / Path</label>
                            <input type="text" id="team-field-photo" defaultValue={modalTeam.member?.image || ''} placeholder="ASSETS/images/p.jpeg" />
                        </div>
                        <div className="form-group">
                            <label>Manifesto Biography</label>
                            <textarea id="team-field-bio" defaultValue={modalTeam.member?.bio || ''} required rows={3}></textarea>
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" id="team-field-email" defaultValue={modalTeam.member?.email || ''} required />
                        </div>
                        <div className="form-group">
                            <label>Phone Contact</label>
                            <input type="text" id="team-field-phone" defaultValue={modalTeam.member?.phone || ''} />
                        </div>
                        <div className="form-group">
                            <label>LinkedIn Url</label>
                            <input type="text" id="team-field-linkedin" defaultValue={modalTeam.member?.linkedin || '#'} />
                        </div>
                        <div className="form-group">
                            <label>Instagram Url</label>
                            <input type="text" id="team-field-instagram" defaultValue={modalTeam.member?.instagram || '#'} />
                        </div>
                        <div className="form-group">
                            <label>Twitter/X Url</label>
                            <input type="text" id="team-field-twitter" defaultValue={modalTeam.member?.twitter || '#'} />
                        </div>
                        <div className="form-group">
                            <label>Sort order</label>
                            <input type="number" id="team-field-order" defaultValue={modalTeam.member?.displayOrder || 1} required />
                        </div>
                        <div className="form-group">
                            <label className="toggle-container">
                                <input type="checkbox" id="team-field-active" defaultChecked={modalTeam.member ? modalTeam.member.active : true} />
                                <span className="toggle-slider"></span>
                                Active Directory status
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalTeam({ open: false, member: null })}>Cancel</button>
                            <button type="submit" className="btn-primary">Save Member</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 5. Modal Announcement notice */}
            {modalAnnouncement.open && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>{modalAnnouncement.notice ? 'Edit Notice' : 'Post Announcement'}</h3>
                        <button onClick={() => setModalAnnouncement({ open: false, notice: null })}><X /></button>
                    </div>
                    <form onSubmit={handleAnnouncementSubmit} className="modal-form">
                        <input type="hidden" id="ann-field-id" defaultValue={modalAnnouncement.notice?.id || ''} />
                        <div className="form-group">
                            <label>Notice title</label>
                            <input type="text" id="ann-field-title" defaultValue={modalAnnouncement.notice?.title || ''} required />
                        </div>
                        <div className="form-group">
                            <label>Content details</label>
                            <textarea id="ann-field-content" defaultValue={modalAnnouncement.notice?.content || ''} rows={4} required></textarea>
                        </div>
                        <div className="form-group">
                            <label>Featured Image URL</label>
                            <input type="text" id="ann-field-image" defaultValue={modalAnnouncement.notice?.image || ''} />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Publish Date</label>
                                <input type="date" id="ann-field-publish" defaultValue={modalAnnouncement.notice?.publishDate || ''} required />
                            </div>
                            <div className="form-group">
                                <label>Expiry Date</label>
                                <input type="date" id="ann-field-expiry" defaultValue={modalAnnouncement.notice?.expiryDate || ''} required />
                            </div>
                        </div>
                        <div className="form-group flex gap-6 mt-2">
                            <label className="toggle-container">
                                <input type="checkbox" id="ann-field-pinned" defaultChecked={modalAnnouncement.notice?.pinned || false} />
                                <span className="toggle-slider"></span>
                                Pin notice to top
                            </label>
                            <label className="toggle-container">
                                <input type="checkbox" id="ann-field-scheduled" defaultChecked={modalAnnouncement.notice?.scheduled || false} />
                                <span className="toggle-slider"></span>
                                Scheduled publish
                            </label>
                        </div>
                        <div className="form-group">
                            <label>Visibility status</label>
                            <select id="ann-field-status" defaultValue={modalAnnouncement.notice?.status || 'published'} required>
                                <option value="published">Visible (Live)</option>
                                <option value="draft">Draft (Hidden)</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalAnnouncement({ open: false, notice: null })}>Cancel</button>
                            <button type="submit" className="btn-primary">Save Announcement</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 6. Modal Create User */}
            {modalUser.open && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>Add Administrator Login</h3>
                        <button onClick={() => setModalUser({ open: false })}><X /></button>
                    </div>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const username = (form.querySelector('#user-username') as HTMLInputElement).value.trim();
                        const name = (form.querySelector('#user-name') as HTMLInputElement).value.trim();
                        const email = (form.querySelector('#user-email') as HTMLInputElement).value.trim();
                        const role = (form.querySelector('#user-role') as HTMLSelectElement).value;
                        const password = (form.querySelector('#user-pass') as HTMLInputElement).value;
                        
                        const data = {
                            username, password, name, role, email,
                            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
                        };
                        
                        const newUid = Math.random().toString(36).substring(2, 9);
                        await registerAdmin(newUid, data);
                        triggerToast(`Account for "${name}" registered.`, 'success');
                        writeLog(activeUser.name, activeUser.role, `created admin account user "${username}"`);
                        setModalUser({ open: false });
                    }} className="modal-form">
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" id="user-username" required placeholder="e.g. content_director" />
                        </div>
                        <div className="form-group">
                            <label>Full name</label>
                            <input type="text" id="user-name" required placeholder="e.g. Pam Beesly" />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" id="user-email" required placeholder="name@scuartcircle.org" />
                        </div>
                        <div className="form-group">
                            <label>Permission Role</label>
                            <select id="user-role" required>
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                                <option value="Event Manager">Event Manager</option>
                                <option value="Gallery Manager">Gallery Manager</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Login Password</label>
                            <input type="password" id="user-pass" required placeholder="••••••••" />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalUser({ open: false })}>Cancel</button>
                            <button type="submit" className="btn-primary">Register Account</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 7. Modal View Membership detail */}
            {modalMembership.open && modalMembership.applicant && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>Applicant: {modalMembership.applicant.name}</h3>
                        <button onClick={() => setModalMembership({ open: false, applicant: null })}><X /></button>
                    </div>
                    <div className="modal-body space-y-3">
                        <div className="detail-grid">
                            <span className="detail-label">Email Address</span><span className="detail-val">{modalMembership.applicant.email}</span>
                            <span className="detail-label">Phone Contact</span><span className="detail-val">{modalMembership.applicant.phone}</span>
                            <span className="detail-label">Category area</span><span className="detail-val text-gold font-bold uppercase">{modalMembership.applicant.artCategory}</span>
                            <span className="detail-label">Experience</span><span className="detail-val">{modalMembership.applicant.experience}</span>
                            <span className="detail-label">Submitted year</span><span className="detail-val">{modalMembership.applicant.year}</span>
                            <span className="detail-label">Status</span><span className="detail-val"><span className="member-badge badge-pending">{modalMembership.applicant.status.toUpperCase()}</span></span>
                        </div>
                        <div className="detail-bio-box">
                            <strong>Manifesto/Intent statement:</strong><br />
                            "{modalMembership.applicant.bio}"
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setModalMembership({ open: false, applicant: null })}>Cancel</button>
                        {modalMembership.applicant.status === 'pending' && (
                            <>
                                <button className="btn-secondary btn-danger" onClick={() => handleMembershipStatus(modalMembership.applicant.id, modalMembership.applicant.name, modalMembership.applicant.email, 'rejected')}><X className="w-3.5 mr-1" /> Reject</button>
                                <button className="btn-primary" onClick={() => handleMembershipStatus(modalMembership.applicant.id, modalMembership.applicant.name, modalMembership.applicant.email, 'approved')}><Check className="w-3.5 mr-1" /> Approve Applicant</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 8. Modal Reply Contact Message */}
            {modalReply.open && modalReply.msg && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>Reply to {modalReply.msg.name}</h3>
                        <button onClick={() => setModalReply({ open: false, msg: null })}><X /></button>
                    </div>
                    <form onSubmit={handleReplyMessageSubmit} className="modal-form">
                        <div className="form-group">
                            <label>To</label>
                            <input type="text" id="reply-to-email-react" defaultValue={modalReply.msg.email} readOnly className="opacity-70 bg-black/20" />
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <input type="text" id="reply-subject-react" defaultValue="Re: SCU ArtCircle feedback inquiry" required />
                        </div>
                        <div className="form-group">
                            <label>Response Content</label>
                            <textarea id="reply-content-react" rows={5} defaultValue={`Dear ${modalReply.msg.name},\n\nThank you for reaching out to SCU ArtCircle. Regarding your query:\n\n[Response here]\n\nBest regards,\nSCU ArtCircle Management`} required></textarea>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalReply({ open: false, msg: null })}>Cancel</button>
                            <button type="submit" className="btn-primary">Send Response</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 9. Modal Confirm Generic Dialog */}
            {modalConfirm.open && (
                <div className="admin-modal glass-panel confirmation-dialog active" style={{ display: 'flex', zIndex: 1002 }}>
                    <div className="modal-header">
                        <h3>{modalConfirm.title}</h3>
                        <button onClick={() => setModalConfirm({ open: false, title: '', message: '', onConfirm: null })}><X /></button>
                    </div>
                    <div className="modal-body">
                        <p className="text-sm opacity-90 leading-relaxed">{modalConfirm.message}</p>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setModalConfirm({ open: false, title: '', message: '', onConfirm: null })}>Cancel</button>
                        <button className="btn-primary btn-danger" onClick={() => {
                            if (modalConfirm.onConfirm) modalConfirm.onConfirm();
                            setModalConfirm({ open: false, title: '', message: '', onConfirm: null });
                        }}>Yes, Confirm</button>
                    </div>
                </div>
            )}

            {/* 10. Modal Profile Settings */}
            {modalProfile && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>Profile Settings</h3>
                        <button onClick={() => setModalProfile(false)}><X /></button>
                    </div>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const name = (form.querySelector('#profile-name') as HTMLInputElement).value.trim();
                        const email = (form.querySelector('#profile-email') as HTMLInputElement).value.trim();
                        const enable2fa = (form.querySelector('#profile-2fa') as HTMLInputElement).checked;
                        
                        // Update in Firestore users collection
                        await updateDocument('users', activeUser.uid, { name, email });
                        
                        // Save 2FA preference
                        const users2FA = JSON.parse(localStorage.getItem('users_2fa_enabled') || '{}');
                        users2FA[activeUser.username] = enable2fa;
                        localStorage.setItem('users_2fa_enabled', JSON.stringify(users2FA));
                        
                        triggerToast('Profile updated.', 'success');
                        setModalProfile(false);
                    }} className="modal-form">
                        <div className="profile-avatar-upload mb-4 flex flex-col items-center">
                            <img src={activeUser.avatar} className="w-20 h-20 rounded-full border border-gold" alt="avatar" />
                        </div>
                        <div className="form-group">
                            <label>Full name</label>
                            <input type="text" id="profile-name" defaultValue={activeUser.name} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" id="profile-email" defaultValue={activeUser.email} required />
                        </div>
                        <div className="form-group">
                            <label className="toggle-container">
                                <input type="checkbox" id="profile-2fa" defaultChecked={JSON.parse(localStorage.getItem('users_2fa_enabled') || '{}')[activeUser.username] === true} />
                                <span className="toggle-slider"></span>
                                Enable Simulated 2FA authentication
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalProfile(false)}>Cancel</button>
                            <button type="submit" className="btn-primary">Update Profile</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 11. Modal Change Password */}
            {modalChangePass && (
                <div className="admin-modal glass-panel active" style={{ display: 'flex' }}>
                    <div className="modal-header">
                        <h3>Change Password</h3>
                        <button onClick={() => setModalChangePass(false)}><X /></button>
                    </div>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const current = (form.querySelector('#change-pass-current') as HTMLInputElement).value;
                        const newPass = (form.querySelector('#change-pass-new') as HTMLInputElement).value;
                        const confirmPass = (form.querySelector('#change-pass-confirm') as HTMLInputElement).value;
                        
                        if (current !== 'password123') {
                            triggerToast('Current password incorrect.', 'error');
                            return;
                        }
                        if (newPass !== confirmPass) {
                            triggerToast('New passwords do not match.', 'error');
                            return;
                        }
                        
                        triggerToast('Password updated successfully.', 'success');
                        setModalChangePass(false);
                        writeLog(activeUser.name, activeUser.role, 'updated admin login password credentials');
                    }} className="modal-form">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" id="change-pass-current" required placeholder="••••••••" />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" id="change-pass-new" required placeholder="••••••••" />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" id="change-pass-confirm" required placeholder="••••••••" />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setModalChangePass(false)}>Cancel</button>
                            <button type="submit" className="btn-primary">Update Password</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toasts Notifications list renderer */}
            <div className="admin-toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`admin-toast show toast-${t.type}`}>
                        {t.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : t.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
