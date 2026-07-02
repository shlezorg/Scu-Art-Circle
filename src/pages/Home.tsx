import React, { useState } from 'react';
import { useFirestoreDoc, useFirestoreCollection } from '../hooks/useFirestore';
import { addDocument } from '../firebase/firestore';
import { createContactMessage, createMembership } from '../services/cms';

// CSS Imports
import '../CSS/style.css';
import '../CSS/Sections/about.css';
import '../CSS/Sections/departments.css';
import '../CSS/Sections/events.css';
import '../CSS/Sections/gallery.css';
import '../CSS/Sections/team.css';
import '../CSS/Sections/join.css';
import '../CSS/Sections/faq.css';
import '../CSS/Sections/contact.css';
import '../CSS/Sections/footer.css';

export default function Home() {
    // ----------------------------------------------------------------------
    // DATABASE BINDINGS
    // ----------------------------------------------------------------------
    const [settings, loadingSettings] = useFirestoreDoc('settings', 'singleton');
    const [hero, loadingHero] = useFirestoreDoc('hero', 'singleton');
    const [about, loadingAbout] = useFirestoreDoc('about', 'singleton');
    const [categories] = useFirestoreCollection('categories');
    const [events] = useFirestoreCollection('events');
    const [gallery] = useFirestoreCollection('gallery');
    const [team] = useFirestoreCollection('team');

    // ----------------------------------------------------------------------
    // COMPONENT INTERACTIVE STATES
    // ----------------------------------------------------------------------
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
    
    // Modals, Drawers & Lightboxes
    const [rsvpDrawer, setRsvpDrawer] = useState<{ open: boolean; event: any }>({ open: false, event: null });
    const [membershipDrawer, setMembershipDrawer] = useState(false);
    const [lightbox, setLightbox] = useState<{ open: boolean; index: number; list: any[] }>({ open: false, index: 0, list: [] });
    const [manifestoModal, setManifestoModal] = useState<{ open: boolean; member: any }>({ open: false, member: null });
    const [galleryFilter, setGalleryFilter] = useState('all');

    // Contact Form State
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMsg, setContactMsg] = useState('');
    const [sendingContact, setSendingContact] = useState(false);

    // RSVP Form State
    const [rsvpName, setRsvpName] = useState('');
    const [rsvpEmail, setRsvpEmail] = useState('');

    // Membership Form State
    const [memberName, setMemberName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberPhone, setMemberPhone] = useState('');
    const [memberCategory, setMemberCategory] = useState('');
    const [memberExp, setMemberExp] = useState('');
    const [memberBio, setMemberBio] = useState('');
    const [submittingMember, setSubmittingMember] = useState(false);

    // Helper functions
    const triggerToast = (msg: string) => {
        setToast({ message: msg, show: true });
        setTimeout(() => setToast({ message: '', show: false }), 4500);
    };

    // Close drawers on backdrop click
    const handleBackdropClick = () => {
        setRsvpDrawer({ open: false, event: null });
        setMembershipDrawer(false);
        setManifestoModal({ open: false, member: null });
    };

    // ----------------------------------------------------------------------
    // FORM SUBMISSIONS
    // ----------------------------------------------------------------------
    
    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingContact(true);

        const data = {
            name: contactName,
            email: contactEmail,
            message: contactMsg,
            submittedAt: new Date().toISOString(),
            read: false,
            attachments: []
        };

        try {
            await createContactMessage(data);
            await addDocument('notifications', {
                type: 'warning',
                title: `New contact message from ${contactName}`,
                time: 'Just Now',
                read: false
            });
            triggerToast(`Thank you, ${contactName}! Your message has been sent successfully.`);
            setContactName('');
            setContactEmail('');
            setContactMsg('');
        } catch (err) {
            triggerToast('Failed to send message. Please try again.');
        } finally {
            setSendingContact(false);
        }
    };

    const handleRsvpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const event = rsvpDrawer.event;
        if (!event) return;

        const data = {
            name: rsvpName,
            email: rsvpEmail,
            eventId: event.id,
            submittedAt: new Date().toISOString()
        };

        try {
            await addDocument('rsvpRegistrations', data);
            triggerToast(`Congratulations ${rsvpName}! You are registered for ${event.title}.`);
            setRsvpName('');
            setRsvpEmail('');
            setRsvpDrawer({ open: false, event: null });
        } catch (err) {
            triggerToast('Failed to register. Please try again.');
        }
    };

    const handleMembershipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingMember(true);

        const data = {
            name: memberName,
            email: memberEmail,
            phone: memberPhone,
            artCategory: memberCategory,
            experience: memberExp,
            bio: memberBio,
            year: new Date().getFullYear().toString(),
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };

        try {
            await createMembership(data);
            await addDocument('notifications', {
                type: 'success',
                title: `New Member Applied: ${memberName}`,
                time: 'Just Now',
                read: false
            });
            triggerToast(`Thank you, ${memberName}! Your membership request has been submitted.`);
            setMemberName('');
            setMemberEmail('');
            setMemberPhone('');
            setMemberCategory('');
            setMemberExp('');
            setMemberBio('');
            setMembershipDrawer(false);
        } catch (err) {
            triggerToast('Failed to submit application. Please try again.');
        } finally {
            setSubmittingMember(false);
        }
    };

    // ----------------------------------------------------------------------
    // RENDERING LOGIC HELPERS
    // ----------------------------------------------------------------------
    if (loadingSettings || loadingHero || loadingAbout) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B', color: '#D8B15C' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: '16px' }}></i>
                    <p style={{ fontFamily: 'Outfit', letterSpacing: '1px' }}>LOADING CREATIVE GATEWAY...</p>
                </div>
            </div>
        );
    }

    if (settings?.maintenanceMode) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B', color: '#fff', textAlign: 'center', fontFamily: 'Outfit, sans-serif', padding: '20px' }}>
                <img src={settings.logo} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #D8B15C', marginBottom: '24px', boxShadow: '0 0 30px rgba(216, 177, 92, 0.4)' }} alt="Logo" />
                <h1 style={{ fontSize: '3rem', marginBottom: '10px', fontWeight: '700', letterSpacing: '-1px' }}>{settings.websiteName}<span style={{ color: '#D8B15C' }}>.</span></h1>
                <h2 style={{ fontSize: '1.3rem', color: '#D8B15C', marginBottom: '24px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '2px' }}>Be Back Soon</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '450px', lineHeight: '1.7', fontSize: '0.95rem', fontFamily: 'Poppins, sans-serif' }}>
                    {settings.footerText || "We are currently upgrading our creative stages to bring you an even better artistic experience. We will be back online shortly!"}
                </p>
            </div>
        );
    }

    // Filters for Gallery
    const filteredGallery = gallery.filter(item => {
        if (galleryFilter === 'all') return true;
        return item.category === galleryFilter;
    });

    const isVideoFile = (src: string) => src.endsWith('.mp4') || src.endsWith('.webm') || src.startsWith('data:video');

    return (
        <div className="home-root">
            {/* HERO SECTION */}
            <section className="hero-frame">
                {/* Background Video/Image */}
                <div className="hero-bg">
                    {isVideoFile(hero.videoUrl) ? (
                        <video autoPlay muted loop playsInline>
                            <source src={hero.videoUrl} type="video/webm" />
                            {hero.videoFallbackUrl && <source src={hero.videoFallbackUrl} type="video/quicktime" />}
                        </video>
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: `url('${hero.videoUrl}') no-repeat center center/cover`, opacity: 0.45 }}></div>
                    )}
                </div>

                {/* The Central Top Notch Logo */}
                {hero.visibility?.logo && (
                    <div className="notch">
                        <div className="logo">
                            <a href="#">
                                <img src={hero.logoUrl} alt="ArtCircle Logo" />
                                <span className="logo-main">{settings.websiteName.replace('SCU ', '')}</span><span className="logo-dot">.</span>
                            </a>
                        </div>
                    </div>
                )}

                {/* Navbar */}
                <header className="navbar">
                    <nav>
                        <ul>
                            <li><a href="#" className="active">Home</a></li>
                            <li><a href="#events">Events</a></li>
                            <li><a href="#gallery">Gallery</a></li>
                        </ul>
                    </nav>

                    <div className="nav-actions">
                        <a href="#about" className="nav-link-alt">About Us</a>
                        <a href="#join" className="nav-link-alt" onClick={(e) => { e.preventDefault(); setMembershipDrawer(true); }}>Join Us</a>
                        <button className="nav-btn" onClick={() => setMembershipDrawer(true)}>Join Art Circle</button>
                    </div>
                </header>

                {/* Main Body Content Layout */}
                <main className="hero-main-layout">
                    {/* Left Side Content */}
                    <div className="hero-content">
                        {hero.visibility?.avatars && (
                            <div className="community">
                                <div className="avatars">
                                    {hero.avatars?.map((src: string, index: number) => (
                                        <img key={index} src={src} alt="Creative Community Member" />
                                    ))}
                                </div>
                                <p>{hero.avatarText}</p>
                            </div>
                        )}

                        <h1 dangerouslySetInnerHTML={{ __html: `${hero.title}<br>Takes The <span>${hero.titleHighlight}</span>` }}></h1>
                        <p className="hero-description">{hero.description}</p>

                        <div className="hero-buttons">
                            <a href={hero.primaryButtonLink} className="btn-primary">{hero.primaryButtonText}</a>
                            <a href={hero.secondaryButtonLink} className="btn-secondary">{hero.secondaryButtonText}</a>
                        </div>
                    </div>

                    {/* Right Side Stacked Panels */}
                    <div className="hero-sidebar">
                        {hero.visibility?.socials && (
                            <div className="social-links">
                                <a href={hero.facebookLink} target="_blank" rel="noreferrer" className="social-btn facebook"><i className="fab fa-facebook-f"></i></a>
                                <a href={hero.instagramLink} target="_blank" rel="noreferrer" className="social-btn instagram"><i className="fab fa-instagram"></i></a>
                                <a href={hero.tiktokLink} target="_blank" rel="noreferrer" className="social-btn tiktok"><i className="fab fa-tiktok"></i></a>
                            </div>
                        )}

                        {hero.visibility?.upcomingCard && hero.upcomingEventCard && (
                            <div className="floating-card">
                                <h3>Upcoming Events</h3>
                                <h2>{hero.upcomingEventCard.title}</h2>
                                <p>{hero.upcomingEventCard.subtitle}</p>
                                <a href={hero.upcomingEventCard.link}>View Details <i className="fas fa-arrow-right"></i></a>
                            </div>
                        )}

                        {hero.visibility?.joinCard && hero.joinCard && (
                            <div className="download-card">
                                <h3>{hero.joinCard.title}</h3>
                                <button onClick={() => setMembershipDrawer(true)}>{hero.joinCard.buttonText}</button>
                            </div>
                        )}
                    </div>
                </main>
            </section>

            {/* ABOUT SHOWCASE */}
            <section className="about-showcase" id="about">
                <div className="about-grid">
                    <div className="about-intro">
                        <span className="section-tag">{about.tag}</span>
                        <h2 dangerouslySetInnerHTML={{ __html: about.heading.replace(/(Creativity|Community)/g, '<span>$1</span>') }}></h2>
                        <p>{about.description}</p>
                        <a href={about.buttonLink} className="learn-btn">
                            {about.buttonText} <i className="fas fa-arrow-right"></i>
                        </a>
                    </div>

                    <div className="about-card large-card">
                        <img src={about.largeCardImage} alt="Dance Performance" />
                        <div className="card-overlay">
                            <p>{about.largeCardOverlayText}</p>
                            <button onClick={() => window.location.href = about.largeCardLink}>
                                <i className="fas fa-arrow-up-right-from-square"></i>
                            </button>
                        </div>
                    </div>

                    <div className="about-card small-card">
                        <div className="slider-container">
                            {about.slides?.map((s: any, idx: number) => (
                                <div key={s.id} className={`slide ${idx === currentSlide ? 'active' : ''}`}>
                                    <img src={s.image} alt={s.title} />
                                    <div className="card-content">
                                        <h3>{s.title}</h3>
                                        <p>{s.description}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="slider-controls">
                                <button className="prev-btn" onClick={() => setCurrentSlide((prev) => (prev - 1 + about.slides.length) % about.slides.length)}>
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                                <button className="next-btn" onClick={() => setCurrentSlide((prev) => (prev + 1) % about.slides.length)}>
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mission + Stats */}
                <div className="mission-section">
                    <div className="mission-info">
                        <div className="mission-logo">
                            <img src={about.mission.logoUrl} alt="ArtCircle Logo" />
                        </div>
                        <div>
                            <span className="section-tag">{about.mission.tag}</span>
                            <h2>{about.mission.heading}</h2>
                            <p>{about.mission.description}</p>
                        </div>
                    </div>

                    <div className="stats-grid">
                        {about.stats?.map((s: any, index: number) => (
                            <div className="stat-card" key={index}>
                                <i className={s.icon}></i>
                                <h3>{s.number}</h3>
                                <p>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="community-card">
                        <img src={about.mission.communityImage} alt="Community" />
                    </div>
                </div>
            </section>

            {/* ART CATEGORIES */}
            <section className="departments" id="departments">
                <div className="section-header">
                    <span className="section-tag">OUR CATEGORIES</span>
                    <h2>Explore Every Form of <span>Creativity</span></h2>
                    <p>Discover the diverse artistic communities within ArtCircle, where every passion finds its stage.</p>
                </div>

                <div className="department-grid">
                    {categories.filter(c => c.enabled).sort((a,b) => a.displayOrder - b.displayOrder).map(c => (
                        <div className="department-card" key={c.id}>
                            <div className="icon-box">
                                <i className={c.icon}></i>
                            </div>
                            <h3>{c.title}</h3>
                            <p>{c.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* EVENTS SECTION */}
            <section className="events" id="events">
                <div className="volumetric-glow blob-1"></div>
                <div className="volumetric-glow blob-2"></div>

                <div className="section-header">
                    <span className="section-tag">UPCOMING EVENTS</span>
                    <h2>Experience Our Next <span>Performance</span></h2>
                </div>

                <div className="event-grid">
                    {events.filter(e => e.status === 'published').map(e => {
                        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                        let dateLabel = e.date;
                        try {
                            const dateParts = e.date.split('-');
                            const mNum = parseInt(dateParts[1]) - 1;
                            dateLabel = `${months[mNum]} ${dateParts[2]}`;
                        } catch(err) {}

                        return (
                            <div key={e.id} className="event-card" onClick={() => setRsvpDrawer({ open: true, event: e })}>
                                <div className="event-card-border-glow"></div>
                                <div className="event-card-content">
                                    <span className="event-date">{dateLabel}</span>
                                    <h3>{e.title}</h3>
                                    <p>{e.description.length > 100 ? e.description.substring(0, 100) + '...' : e.description}</p>
                                    <a href="#" className="event-details-trigger" onClick={(evt) => evt.preventDefault()}>{e.featured ? 'Register' : 'View Details'} <i className="fas fa-arrow-right"></i></a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* GALLERY CURATOR SHOWCASE */}
            <section className="gallery-preview" id="gallery">
                <div className="section-header">
                    <span className="section-tag">GALLERY</span>
                    <h2>Moments That Define <span>ArtCircle</span></h2>
                </div>

                <div className="gallery-filter-bar">
                    <button className={`filter-btn ${galleryFilter === 'all' ? 'active' : ''}`} onClick={() => setGalleryFilter('all')}>All Works</button>
                    <button className={`filter-btn ${galleryFilter === 'music' ? 'active' : ''}`} onClick={() => setGalleryFilter('music')}>Music</button>
                    <button className={`filter-btn ${galleryFilter === 'dance' ? 'active' : ''}`} onClick={() => setGalleryFilter('dance')}>Dance</button>
                    <button className={`filter-btn ${galleryFilter === 'drama' ? 'active' : ''}`} onClick={() => setGalleryFilter('drama')}>Drama</button>
                    <button className={`filter-btn ${galleryFilter === 'visual' ? 'active' : ''}`} onClick={() => setGalleryFilter('visual')}>Visual Arts</button>
                </div>

                <div className="gallery-grid-wrapper" id="gallery-grid-wrapper" style={{ maxHeight: 'none' }}>
                    <div className="gallery-grid" id="gallery-grid">
                        {filteredGallery.map((item, index) => (
                            <div key={item.id} className={`gallery-item ${item.size || ''}`} onClick={() => setLightbox({ open: true, index, list: filteredGallery })}>
                                {isVideoFile(item.src) ? (
                                    <video src={item.src} muted playsInline loop style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
                                ) : (
                                    <img src={item.src} alt={item.title} />
                                )}
                                <div className="gallery-item-overlay">
                                    <span className="gallery-item-cat" style={{ textTransform: 'capitalize' }}>{item.category}</span>
                                    <h3 className="gallery-item-title">{item.title}</h3>
                                </div>
                            </div>
                        ))}
                        <div className="gallery-fade-overlay" id="gallery-fade-overlay" style={{ display: 'none' }}></div>
                    </div>
                </div>
            </section>

            {/* COMMITTEE MEMBERS */}
            <section className="team" id="team">
                <div className="section-header">
                    <span className="section-tag">OUR TEAM</span>
                    <h2>Meet the People Behind <span>ArtCircle</span></h2>
                </div>

                <div className="team-grid">
                    {team.filter(t => t.active).sort((a,b) => a.displayOrder - b.displayOrder).map(m => (
                        <div className="member-card" key={m.id}>
                            <div className="member-card-img-wrapper">
                                <img src={m.image} alt={m.name} />
                                <div className="member-card-overlay">
                                    <div className="member-socials">
                                        <a href={m.linkedin || '#'} className="social-icon"><i className="fab fa-linkedin-in"></i></a>
                                        <a href={m.instagram || '#'} className="social-icon"><i className="fab fa-instagram"></i></a>
                                        <a href={m.twitter || '#'} className="social-icon"><i className="fab fa-twitter"></i></a>
                                    </div>
                                    <button className="view-bio-btn" onClick={() => setManifestoModal({ open: true, member: m })}>Read Bio</button>
                                </div>
                            </div>
                            <div className="member-card-info">
                                <h3>{m.name}</h3>
                                <span className="member-role">{m.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* JOIN US */}
            <section className="join-section" id="join">
                <div className="join-content">
                    <span className="section-tag">BECOME A MEMBER</span>
                    <h2>Ready to Share Your <span>Talent?</span></h2>
                    <p>Join a community of artists, performers, and creators who inspire each other every day.</p>
                    <div className="join-buttons">
                        <a href="#join" className="btn-primary" onClick={(e) => { e.preventDefault(); setMembershipDrawer(true); }}>Join ArtCircle</a>
                        <a href="#contact" className="btn-secondary">Contact Us</a>
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="faq-section" id="faq">
                <div className="section-header">
                    <span className="section-tag">FAQ</span>
                    <h2>Frequently Asked <span>Questions</span></h2>
                </div>

                <div className="faq-container">
                    {/* Simulated FAQs */}
                    {[
                        { q: "How can I join ArtCircle?", a: "Complete the membership sign-up section under our contact form and attend our upcoming orientation session." },
                        { q: "Who can participate in events?", a: "All registered student members can participate in our workshops, closed exhibitions, and performances." },
                        { q: "Do I need previous experience?", a: "Not at all! ArtCircle is built to foster growth. Whether you are an established performer or a beginner, you are welcome." }
                    ].map((f, i) => (
                        <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`}>
                            <button className="faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                                <span>{f.q}</span>
                                <span className="faq-icon"><i className="fas fa-plus"></i></span>
                            </button>
                            {activeFaq === i && (
                                <div className="faq-answer" style={{ maxHeight: '100px' }}>
                                    <p>{f.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* CONTACT SECTION */}
            <section className="contact-section" id="contact">
                <div className="section-header">
                    <span className="section-tag">CONTACT</span>
                    <h2>Let's Create Something <span>Together</span></h2>
                </div>

                <form className="contact-form" onSubmit={handleContactSubmit}>
                    <div className="contact-form-grid">
                        <div className="form-group">
                            <input type="text" id="form-name" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder=" " />
                            <label htmlFor="form-name">Your Name</label>
                        </div>
                        <div className="form-group">
                            <input type="email" id="form-email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder=" " />
                            <label htmlFor="form-email">Email Address</label>
                        </div>
                    </div>
                    <div className="form-group textarea-group">
                        <textarea id="form-message" required value={contactMsg} onChange={(e) => setContactMsg(e.target.value)} placeholder=" "></textarea>
                        <label htmlFor="form-message">Your Message</label>
                    </div>

                    <button type="submit" disabled={sendingContact} className="btn-primary contact-submit-btn">
                        <span>{sendingContact ? 'Sending Message...' : 'Send Message'}</span>
                    </button>
                </form>
            </section>

            {/* FOOTER */}
            <footer>
                <div className="footer-grid">
                    <div className="footer-col footer-brand">
                        <div className="footer-logo">
                            <img src={hero.logoUrl} alt="Logo" />
                            <span className="logo-main">{settings.websiteName.replace('SCU ', '')}</span><span className="logo-dot">.</span>
                        </div>
                        <p className="footer-desc">{settings.seoDescription}</p>
                    </div>

                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><a href="#"><i className="fas fa-chevron-right"></i>Home</a></li>
                            <li><a href="#about"><i className="fas fa-chevron-right"></i>About Us</a></li>
                            <li><a href="#events"><i className="fas fa-chevron-right"></i>Events</a></li>
                            <li><a href="#gallery"><i className="fas fa-chevron-right"></i>Gallery</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Contact Info</h4>
                        <ul className="footer-info">
                            <li><i className="fas fa-map-marker-alt"></i><span>{settings.address}</span></li>
                            <li><i className="fas fa-envelope"></i><span>{settings.email}</span></li>
                            <li><i className="fas fa-phone-alt"></i><span>{settings.phone}</span></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p dangerouslySetInnerHTML={{ __html: settings.footerText }}></p>
                </div>
            </footer>

            {/* DRAWERS, MODALS & BACKDROP OVERLAYS */}
            {(rsvpDrawer.open || membershipDrawer || manifestoModal.open) && (
                <div className="overlay-backdrop active" onClick={handleBackdropClick}></div>
            )}

            {/* RSVP Drawer */}
            <div className={`premium-drawer ${rsvpDrawer.open ? 'active' : ''}`}>
                <div className="drawer-header">
                    <h3>Event Registration</h3>
                    <button className="drawer-close-btn" onClick={() => setRsvpDrawer({ open: false, event: null })}><i className="fas fa-xmark"></i></button>
                </div>
                {rsvpDrawer.event && (
                    <div className="drawer-body">
                        <h4>{rsvpDrawer.event.title}</h4>
                        <div className="drawer-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
                            <div><i className="far fa-calendar"></i> {rsvpDrawer.event.date}</div>
                            <div><i className="far fa-clock"></i> {rsvpDrawer.event.time}</div>
                            <div><i className="fas fa-location-dot"></i> {rsvpDrawer.event.venue}</div>
                        </div>
                        <p className="drawer-desc" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>{rsvpDrawer.event.description}</p>
                        
                        <h5 className="drawer-form-title" style={{ color: 'var(--gold)', marginBottom: '10px' }}>Reserve Your Spot</h5>
                        <form className="drawer-form" onSubmit={handleRsvpSubmit}>
                            <input type="text" placeholder="Full Name" required value={rsvpName} onChange={e => setRsvpName(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '12px' }} />
                            <input type="email" placeholder="Email Address" required value={rsvpEmail} onChange={e => setRsvpEmail(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '16px' }} />
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>Complete RSVP</button>
                        </form>
                    </div>
                )}
            </div>

            {/* Membership Registration Drawer */}
            <div className={`premium-drawer ${membershipDrawer ? 'active' : ''}`}>
                <div className="drawer-header">
                    <h3>Become a Member</h3>
                    <button className="drawer-close-btn" onClick={() => setMembershipDrawer(false)}><i className="fas fa-xmark"></i></button>
                </div>
                <div className="drawer-body">
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px', fontSize: '0.9rem' }}>
                        Submit this application to join the SCU Art Circle creative family.
                    </p>
                    <form className="drawer-form" onSubmit={handleMembershipSubmit}>
                        <input type="text" placeholder="Full Name" required value={memberName} onChange={e => setMemberName(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '12px' }} />
                        <input type="email" placeholder="Email Address" required value={memberEmail} onChange={e => setMemberEmail(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '12px' }} />
                        <input type="text" placeholder="Phone Number" required value={memberPhone} onChange={e => setMemberPhone(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '12px' }} />
                        
                        <select required value={memberCategory} onChange={e => setMemberCategory(e.target.value)} style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '12px' }}>
                            <option value="" disabled>Select Artistic Area</option>
                            <option value="music">Music</option>
                            <option value="dance">Dance</option>
                            <option value="drama">Drama</option>
                            <option value="visual">Visual Arts</option>
                            <option value="literature">Literature</option>
                        </select>
                        
                        <input type="text" placeholder="Years of experience / Skills" required value={memberExp} onChange={e => setMemberExp(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '12px' }} />
                        <textarea placeholder="Tell us about yourself and why you want to join..." required value={memberBio} onChange={e => setMemberBio(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '100%', marginBottom: '16px', height: '100px', fontFamily: 'sans-serif' }}></textarea>
                        
                        <button type="submit" disabled={submittingMember} className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>
                            {submittingMember ? 'Submitting Application...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Team Manifesto Modal */}
            <div className={`premium-modal ${manifestoModal.open ? 'active' : ''}`} style={{ display: manifestoModal.open ? 'block' : 'none' }}>
                <button className="modal-close" onClick={() => setManifestoModal({ open: false, member: null })}><i className="fas fa-xmark"></i></button>
                {manifestoModal.member && (
                    <div className="modal-body">
                        <img src={manifestoModal.member.image} alt={manifestoModal.member.name} className="modal-img" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '14px', marginBottom: '16px', border: '1.5px solid var(--gold)' }} />
                        <h4 className="modal-name" style={{ fontFamily: 'Outfit', fontSize: '1.4rem', color: '#fff' }}>{manifestoModal.member.name}</h4>
                        <span className="modal-role" style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{manifestoModal.member.role}</span>
                        <p className="modal-bio" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: '14px', fontStyle: 'italic' }}>"{manifestoModal.member.bio}"</p>
                    </div>
                )}
            </div>

            {/* Lightbox for Gallery */}
            {lightbox.open && lightbox.list.length > 0 && (
                <div className="premium-lightbox active">
                    <button className="lightbox-close" onClick={() => setLightbox({ open: false, index: 0, list: [] })}><i className="fas fa-xmark"></i></button>
                    <button className="lightbox-btn lightbox-prev" onClick={() => setLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.list.length) % prev.list.length }))}><i className="fas fa-chevron-left"></i></button>
                    
                    <div className="lightbox-content-wrapper">
                        {isVideoFile(lightbox.list[lightbox.index].src) ? (
                            <video src={lightbox.list[lightbox.index].src} controls autoPlay muted playsInline className="lightbox-img"></video>
                        ) : (
                            <img src={lightbox.list[lightbox.index].src} alt={lightbox.list[lightbox.index].title} className="lightbox-img" />
                        )}
                    </div>
                    
                    <button className="lightbox-btn lightbox-next" onClick={() => setLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.list.length }))}><i className="fas fa-chevron-right"></i></button>
                    
                    <div className="lightbox-caption">
                        <h4 className="lightbox-title">{lightbox.list[lightbox.index].title}</h4>
                        <span className="lightbox-category" style={{ textTransform: 'capitalize' }}>{lightbox.list[lightbox.index].category}</span>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>{lightbox.list[lightbox.index].desc}</p>
                    </div>
                </div>
            )}

            {/* Toast System */}
            {toast.show && (
                <div className="toast-container" id="toast-container">
                    <div className="premium-toast show">
                        <i className="fas fa-circle-check"></i>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
