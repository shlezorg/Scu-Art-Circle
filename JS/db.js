/**
 * SCU ArtCircle - LocalStorage Database Module
 * Manages the persistent data state for both public index.html and admin.html.
 */

const DEFAULT_DB = {
    theme: 'dark',
    auth: {
        currentUser: null,
        users: [
            { username: 'superadmin', password: 'password123', name: 'Admin User', role: 'Super Admin', email: 'admin@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80' },
            { username: 'admin', password: 'password123', name: 'Creative Director', role: 'Admin', email: 'director@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80' },
            { username: 'editor', password: 'password123', name: 'Content Writer', role: 'Editor', email: 'editor@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80' },
            { username: 'eventmgr', password: 'password123', name: 'Event Coordinator', role: 'Event Manager', email: 'events@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' },
            { username: 'gallerymgr', password: 'password123', name: 'Gallery Curator', role: 'Gallery Manager', email: 'gallery@scuartcircle.org', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' }
        ]
    },
    hero: {
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
    },
    about: {
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
    },
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
            description: "An unforgettable evening of classical and contemporary fusion music featuring SCU's finest performers, vocalists, and instrumentalists. Experience breathtaking solos, powerful orchestrations, and immersive visual storytelling. Tickets include access to the pre-show reception.",
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
        },
        {
            id: 'open-mic-night',
            title: 'Open Mic Night',
            banner: 'ASSETS/images/Community.JPG',
            description: "Step into the spotlight or cheer for your fellow creators! SCU Art Circle's Open Mic Night welcomes poetry readings, stand-up comedy, acoustic musical sets, and dramatic monologues. Cozy ambient seating and complimentary refreshments will be provided.",
            category: 'drama',
            venue: 'The Creative Loft',
            date: '2026-08-02',
            time: '19:00',
            organizer: 'Drama Dept',
            guestArtists: '',
            registrationLink: '#',
            maxParticipants: 150,
            countdownTimer: false,
            featured: false,
            galleryImages: [],
            status: 'published'
        },
        {
            id: 'art-exhibition',
            title: 'Art Exhibition',
            banner: 'ASSETS/images/Visual Art.jpg',
            description: "A highly anticipated, curated exhibition displaying oil paintings, digital illustrations, ceramic sculptures, and photographic essays. Meet the student artists behind the work during the gallery walkthrough, beginning at 2:00 PM. Art pieces will be available for purchase.",
            category: 'visual',
            venue: 'Fine Arts Gallery',
            date: '2026-09-10',
            time: '10:00',
            organizer: 'Visual Arts Dept',
            guestArtists: '',
            registrationLink: '#',
            maxParticipants: 500,
            countdownTimer: false,
            featured: false,
            galleryImages: [],
            status: 'published'
        }
    ],
    gallery: [
        { id: 1, category: 'music', title: 'Lead Vocalist', src: 'ASSETS/images/Gallary/Swara Lead.JPG', size: 'size-tall', desc: 'Leading the stage with raw vocal power and emotional delivery at Swara 2026.', featured: true },
        { id: 2, category: 'dance', title: 'Traditional Awurudu Dance', src: 'ASSETS/images/Gallary/Awurudu Dance.jpg', size: 'size-wide', desc: 'Vibrant traditional dance routine showcasing cultural richness and synchronization.', featured: true },
        { id: 3, category: 'drama', title: 'Awurudu Drama', src: 'ASSETS/images/Gallary/Aurudu Drama1.jfif', size: '', desc: 'A captivating moment of character chemistry and acting from our cultural drama section.', featured: false },
        { id: 4, category: 'visual', title: 'Canvas Painting', src: 'ASSETS/images/Gallary/Visual Art.jpg', size: '', desc: 'Rich textures and smooth strokes during our live canvas painting workshop.', featured: false },
        { id: 5, category: 'music', title: 'Swara Drummer', src: 'ASSETS/images/Gallary/Swara Drummer.JPG', size: '', desc: 'Powerful rhythmic drum solos driving the energy of the musical performance.', featured: false },
        { id: 6, category: 'dance', title: 'Dance Ensemble', src: 'ASSETS/images/Gallary/Awurudu d1.JPG', size: 'size-tall', desc: 'Group synchronization demonstrating the colorful moves of our cultural troupe.', featured: false },
        { id: 7, category: 'drama', title: 'Stage Presentation', src: 'ASSETS/images/Gallary/Announce-S.JPG', size: '', desc: 'Setting the scene and introducing dramatic acts during the annual showcase.', featured: false },
        { id: 8, category: 'visual', title: 'Exhibition Stand', src: 'ASSETS/images/Gallary/Base.JPG', size: 'size-wide', desc: 'A sleek structural display base arranged for the fine arts and sculpture exhibition.', featured: false },
        { id: 9, category: 'music', title: 'Rap Performance', src: 'ASSETS/images/Gallary/Rap.JPG', size: '', desc: 'A dynamic, high-tempo hip-hop performance that brought urban poetry to life.', featured: false },
        { id: 10, category: 'dance', title: 'Folk Dance', src: 'ASSETS/images/Gallary/Awurudu d2.JPG', size: '', desc: 'Traditional folk dance movements capturing the celebratory mood of the season.', featured: false },
        { id: 11, category: 'drama', title: 'Master of Ceremonies', src: 'ASSETS/images/Gallary/Anounce-Methupa.JPG', size: 'size-tall', desc: 'Vice President Methupa hosting and guiding the dramatic flow of our annual events.', featured: false },
        { id: 12, category: 'visual', title: 'Student Artist', src: 'ASSETS/images/Gallary/Yash.JPG', size: '', desc: 'ArtCircle member Yash presenting visual works during the interactive creative gallery walkthrough.', featured: false },
        { id: 13, category: 'music', title: 'Acoustic Soloist', src: 'ASSETS/images/Gallary/Swara singer 1.JPG', size: 'size-wide', desc: 'Intimate acoustic performance featuring expressive solos and delicate guitar melodies.', featured: false },
        { id: 14, category: 'dance', title: 'Cultural Formations', src: 'ASSETS/images/Gallary/Awurudu d3.JPG', size: '', desc: 'Complex stage alignments and choreography during the traditional dance display.', featured: false },
        { id: 15, category: 'drama', title: 'Drama Spotlight', src: 'ASSETS/images/Gallary/Duneth L.JPG', size: '', desc: 'Powerful character-driven performance during the spring drama evening showcase.', featured: false },
        { id: 16, category: 'music', title: 'Vocal Harmony', src: 'ASSETS/images/Gallary/Swara singer 2.JPG', size: 'size-tall', desc: 'Beautiful blend of vocal harmonies by our ensemble members during the Swara concert.', featured: false },
        { id: 17, category: 'dance', title: 'Dance Finale', src: 'ASSETS/images/Gallary/Awurudu d4.JPG', size: '', desc: 'The final stage grouping celebrating our rich heritage through synchronized rhythm.', featured: false },
        { id: 18, category: 'drama', title: 'Dramatic Dialogue', src: 'ASSETS/images/Gallary/Methuli.JPG', size: '', desc: 'Secretary Methuli delivering key dramatic acts during the annual spring showcase.', featured: false },
        { id: 19, category: 'music', title: 'Acoustic Session', src: 'ASSETS/images/Gallary/Swara singer 3.JPG', size: '', desc: 'Guitar backing vocals creating warm melodies during our acoustic session.', featured: false },
        { id: 20, category: 'dance', title: 'Modern Duet', src: 'ASSETS/images/Gallary/Dance Ses.JPG', size: 'size-wide', desc: 'Modern interpretive dance performance expressing complex emotion and fluid dynamics.', featured: false },
        { id: 21, category: 'music', title: 'Guest Soloist', src: 'ASSETS/images/Gallary/Nadeemal.JPG', size: '', desc: 'A thrilling guest solo that energized the entire audience at the annual main showcase.', featured: false },
        { id: 22, category: 'dance', title: 'Swara Stage Dance', src: 'ASSETS/images/Gallary/Swara Dance2.JPG', size: 'size-tall', desc: 'High-impact contemporary group choreography adding fluid motion to the concert.', featured: false },
        { id: 23, category: 'music', title: 'Vocal Solo', src: 'ASSETS/images/Gallary/Lead S.JPG', size: '', desc: 'A solo vocal act capturing key highlights and showcasing individual student talent.', featured: false },
        { id: 24, category: 'music', title: 'Vocal Ensemble', src: 'ASSETS/images/Gallary/Swara Singers.svg', size: '', desc: 'Group vocal choir blending traditional chants with modern acoustic backing.', featured: false },
        { id: 25, category: 'dance', title: 'Backing Dancers', src: 'ASSETS/images/Gallary/Swaraa Dance.svg', size: '', desc: 'Vibrant traditional dance backing performers that illuminated the Swara concert stages.', featured: false }
    ],
    team: [
        { id: 1, name: 'Kavishka Shenal', role: 'President', image: 'ASSETS/images/p.jpeg', bio: 'Kavishka is a digital visual artist and fine arts mentor. In his presidency, he aims to blur the boundaries between traditional crafts and emerging technological mediums, creating collaborative platforms across categories. His work has been exhibited in student design galleries citywide.', email: 'kavishka@scuartcircle.org', phone: '+1 555-0100', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 1, active: true },
        { id: 2, name: 'Methupa Heras', role: 'Vice President', image: 'ASSETS/images/VP.jpeg', bio: 'Jane is a contemporary dancer and theatrical choreographer. She believes that movement is a universal language capable of expressing the deepest layers of human emotion. Jane coordinates public art collaborations and works closely with municipal theater directories.', email: 'methupa@scuartcircle.org', phone: '+1 555-0101', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 2, active: true },
        { id: 3, name: 'Methuli Gamlath', role: 'Secretary', image: 'ASSETS/images/Sec.jpeg', bio: 'Alex is a classical pianist, music theorist, and literature enthusiast. He manages the documentation, schedule coordination, and institutional outreach for ArtCircle. Alex has a passion for writing short stories and composing classical arrangements.', email: 'methuli@scuartcircle.org', phone: '+1 555-0102', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 3, active: true },
        { id: 4, name: 'Thisara Sandakelum', role: 'Treasurer', image: 'ASSETS/images/Thisara.png', bio: 'Sarah is a graphic designer and financial strategist. She handles the budgeting, resource allocation, and ticket systems for all showcase performances. In her creative time, Sarah designs visual branding campaigns and experiments with motion graphics.', email: 'thisara@scuartcircle.org', phone: '+1 555-0103', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 4, active: true },
        { id: 5, name: 'Takshana Yogeswaran', role: 'Assistant Secretary', image: 'ASSETS/images/AS.jpeg', bio: 'Takshana is an architect and urban theorist. He is passionate about the intersection of space, culture, and community. Takshana leads the ArtCircle\'s public art installations and coordinates outreach with local government bodies.', email: 'takshana@scuartcircle.org', phone: '+1 555-0104', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 5, active: true },
        { id: 6, name: 'Duneth Sandaruwan', role: 'Editor', image: 'ASSETS/images/Editor.jpeg', bio: 'Duneth is an architect and urban theorist. He is passionate about the intersection of space, culture, and community. Takshana leads the ArtCircle\'s public art installations and coordinates outreach with local government bodies.', email: 'duneth@scuartcircle.org', phone: '+1 555-0105', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 6, active: true },
        { id: 7, name: 'Chanupa Gunarathne', role: 'Event Coordinates', image: 'ASSETS/images/EC chanupa.jpeg', bio: 'Chanupa is an architect and urban theorist. He is passionate about the intersection of space, culture, and community. Takshana leads the ArtCircle\'s public art installations and coordinates outreach with local government bodies.', email: 'chanupa@scuartcircle.org', phone: '+1 555-0106', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 7, active: true },
        { id: 8, name: 'Hasanthi Wanasighe', role: 'Event Coordinates', image: 'ASSETS/images/EC Hasanthi.jpeg', bio: 'Hasanthi is an architect and urban theorist. She is passionate about the intersection of space, culture, and community. Hasanthi leads the ArtCircle\'s public art installations and coordinates outreach with local government bodies.', email: 'hasanthi@scuartcircle.org', phone: '+1 555-0107', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 8, active: true },
        { id: 9, name: 'Milni Mehara', role: 'Event Coordinates', image: 'ASSETS/images/EC mehara.jpeg', bio: 'Mehara is an architect and urban theorist. She is passionate about the intersection of space, culture, and community. Hasanthi leads the ArtCircle\'s public art installations and coordinates outreach with local government bodies.', email: 'mehara@scuartcircle.org', phone: '+1 555-0108', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 9, active: true },
        { id: 10, name: 'Arthika Sivabalasundaram', role: 'Event Coordinates', image: 'ASSETS/images/EC Arthika.jpeg', bio: 'Arthika is an architect and urban theorist. She is passionate about the intersection of space, culture, and community. Hasanthi leads the ArtCircle\'s public art installations and coordinates outreach with local government bodies.', email: 'arthika@scuartcircle.org', phone: '+1 555-0109', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 10, active: true },
        { id: 11, name: 'Riveen Jarno', role: 'Event Coordinates', image: 'ASSETS/images/EC riveen.jpeg', bio: 'Riveen is an architect and urban theorist. He is passionate about the intersection of space, culture, and community. Riveen leads the ArtCircle\'s public art installations and coordinates outreach with local government bodies.', email: 'riveen@scuartcircle.org', phone: '+1 555-0110', linkedin: '#', instagram: '#', twitter: '#', displayOrder: 11, active: true }
    ],
    announcements: [
        { id: 1, title: 'Swara 2026 Tickets Now Available', content: 'Get your tickets early for the major musical showcase of the year! Limited seats remaining in the VIP section.', image: 'ASSETS/images/Singers.svg', publishDate: '2026-07-01', expiryDate: '2026-07-16', pinned: true, scheduled: false, status: 'published' },
        { id: 2, title: 'Visual Art Exhibition Registration Open', content: 'All visual artists are invited to submit their original work for our September exhibition. Submissions close on August 25th.', image: 'ASSETS/images/Visual Art.jpg', publishDate: '2026-07-02', expiryDate: '2026-08-26', pinned: false, scheduled: false, status: 'published' }
    ],
    memberships: [
        { id: 1, name: 'John D. Silva', email: 'john@example.com', phone: '+1 555-9011', artCategory: 'music', experience: '3 years playing guitar in school band', bio: 'I want to perform at Swara and jam with other musicians.', year: '2026', submittedAt: '2026-07-02T08:15:00Z', status: 'pending' },
        { id: 2, name: 'Sarah Mendis', email: 'sarah@example.com', phone: '+1 555-9012', artCategory: 'dance', experience: '5 years classical dance training', bio: 'Looking forward to participating in choreographies and cultural acts.', year: '2026', submittedAt: '2026-07-02T09:24:00Z', status: 'pending' },
        { id: 3, name: 'Ashen Perera', email: 'ashen@example.com', phone: '+1 555-9013', artCategory: 'visual', experience: 'Self-taught digital artist', bio: 'I would love to help design banners and exhibit drawings.', year: '2026', submittedAt: '2026-07-01T14:10:00Z', status: 'approved' },
        { id: 4, name: 'Nimasha Fernando', email: 'nimasha@example.com', phone: '+1 555-9014', artCategory: 'drama', experience: 'Acting roles in high school plays', bio: 'Eager to audition for the next cultural drama and learn stage management.', year: '2026', submittedAt: '2026-07-01T16:05:00Z', status: 'approved' }
    ],
    contactMessages: [
        { id: 1, name: 'Michael Scott', email: 'michael@dundermifflin.com', message: 'Hello! I would like to book the SCU Art Circle music team for a corporate event. Please let me know your rates and availability.', submittedAt: '2026-07-02T06:12:00Z', read: false, attachments: [] },
        { id: 2, name: 'Dwight Schrute', email: 'dwight@beetfarms.com', message: 'Do you offer agriculture-themed visual arts workshops? I want to exhibit beet paintings.', submittedAt: '2026-07-02T07:45:00Z', read: false, attachments: [] },
        { id: 3, name: 'Pam Beesly', email: 'pam@dundermifflin.com', message: 'Hi! I am a local artist and would love to volunteer as an advisor or guest speaker for your visual arts section.', submittedAt: '2026-07-01T11:20:00Z', read: true, attachments: [] }
    ],
    rsvpRegistrations: [
        { id: 1, name: 'Jim Halpert', email: 'jim@dundermifflin.com', eventId: 'swara-2026', submittedAt: '2026-07-02T08:30:00Z' }
    ],
    settings: {
        websiteName: 'SCU ArtCircle',
        maintenanceMode: false,
        analyticsVisitors: 3487,
        analyticsGrowth: 12
    },
    activityLogs: [
        { user: 'Admin User', role: 'Super Admin', action: 'added new event "Swara 2026"', time: '2 minutes ago' },
        { user: 'Editor User', role: 'Editor', action: 'uploaded 12 new images to gallery', time: '25 minutes ago' },
        { user: 'Admin User', role: 'Super Admin', action: 'approved a membership request', time: '1 hour ago' },
        { user: 'Editor User', role: 'Editor', action: 'published announcement "Art Workshop"', time: '2 hours ago' },
        { user: 'Admin User', role: 'Super Admin', action: 'updated website settings', time: '3 hours ago' }
    ],
    notifications: [
        { id: 1, type: 'info', title: 'System Backup Successful', time: '1 hour ago', read: false },
        { id: 2, type: 'warning', title: 'High Storage Usage (78%)', time: '4 hours ago', read: false },
        { id: 3, type: 'success', title: 'SSL Certificate Renewed', time: 'Yesterday', read: true }
    ],
    faqs: [
        { id: 1, question: 'How can I join ArtCircle?', answer: 'Complete the membership sign-up section under our contact form and attend our upcoming orientation session. We welcome creatives of all levels, fields, and experience ranges.' },
        { id: 2, question: 'Who can participate in events?', answer: 'All registered student members can participate in our workshops, closed exhibitions, and performances. Public showcases like Swara are open for student audiences and community guests alike.' },
        { id: 3, question: 'Do I need previous experience?', answer: 'Not at all! ArtCircle is built to foster growth. Whether you are an established performer, a seasoned painter, or someone who wants to explore a new artistic hobby, you will find resources and mentors to support your journey.' }
    ]
};

const DB_KEY = 'scu_art_circle_db';

// Initialize database
function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
    }
}

// Get the full database object
function getDB() {
    initDB();
    try {
        return JSON.parse(localStorage.getItem(DB_KEY));
    } catch (e) {
        console.error("Error parsing database from localStorage, resetting to default...", e);
        localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
        return DEFAULT_DB;
    }
}

// Save the database object
function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    // Trigger storage event manually for same-page listeners if needed
    window.dispatchEvent(new Event('storage'));
}

// Reset database to defaults
function resetDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB));
}

// Automatically initialize on import/load
initDB();
