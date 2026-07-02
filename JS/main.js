/**
 * SCU ArtCircle - Main Website Engine
 * Dynamically loads and renders content from local db.js database state,
 * handles user registrations, contact forms, and lightbox curations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get database state
    const db = getDB();
    
    // Check Maintenance Mode
    if (db.settings && db.settings.maintenanceMode) {
        renderMaintenanceScreen();
        return;
    }

    // Render Website Sections from DB
    renderHeroSection(db);
    renderAboutSection(db);
    renderCategoriesSection(db);
    renderEventsSection(db);
    renderGallerySection(db);
    renderTeamSection(db);
    renderFAQSection(db);
    renderFooterSection(db);
    
    // Initialize Interactive Actions & Event Listeners
    initInteractiveEngine();
});

// Render Maintenance screen
function renderMaintenanceScreen() {
    document.body.innerHTML = `
        <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0B0B0B; color: #fff; text-align: center; font-family: 'Outfit', sans-serif; padding: 20px;">
            <img src="ASSETS/logos/logo.jpg" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid #D8B15C; margin-bottom: 24px; box-shadow: 0 0 30px rgba(216, 177, 92, 0.4);">
            <h1 style="font-size: 3rem; margin-bottom: 10px; font-weight: 700; letter-spacing: -1px;">SCU ArtCircle<span style="color:#D8B15C;">.</span></h1>
            <h2 style="font-size: 1.3rem; color: #D8B15C; margin-bottom: 24px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px;">Be Back Soon</h2>
            <p style="color: rgba(255,255,255,0.6); max-width: 450px; line-height: 1.7; font-size: 0.95rem; font-family: 'Poppins', sans-serif;">
                We are currently upgrading our creative stages to bring you an even better artistic experience. We will be back online shortly!
            </p>
        </div>
    `;
    document.body.style.background = '#0B0B0B';
    document.body.style.padding = '0';
}

// 1. Render Hero Section
function renderHeroSection(db) {
    const h = db.hero;
    
    // Set Logo notch and Navbar visibility
    const notch = document.querySelector('.notch');
    if (notch) {
        notch.style.display = h.visibility.logo ? 'flex' : 'none';
        if (h.logoUrl) {
            const logoImg = notch.querySelector('img');
            if (logoImg) logoImg.src = h.logoUrl;
        }
    }
    
    // Hero Background Video/Image
    const bgContainer = document.querySelector('.hero-bg');
    if (bgContainer) {
        const isVideo = h.videoUrl.endsWith('.webm') || h.videoUrl.endsWith('.mp4') || h.videoUrl.endsWith('.mov');
        if (isVideo) {
            bgContainer.innerHTML = `
                <video autoplay muted loop playsinline id="hero-background-video">
                    <source src="${h.videoUrl}" type="video/webm">
                    ${h.videoFallbackUrl ? `<source src="${h.videoFallbackUrl}" type="video/quicktime">` : ''}
                </video>
            `;
        } else {
            bgContainer.innerHTML = `<div style="width:100%; height:100%; background: url('${h.videoUrl}') no-repeat center center/cover; opacity: 0.45;"></div>`;
        }
    }
    
    // Community Avatars
    const communityDiv = document.querySelector('.hero-content .community');
    if (communityDiv) {
        if (h.visibility.avatars) {
            communityDiv.style.display = 'flex';
            const avatarContainer = communityDiv.querySelector('.avatars');
            if (avatarContainer && h.avatars) {
                avatarContainer.innerHTML = h.avatars.map(src => `<img src="${src}" alt="Creative Member">`).join('');
            }
            const avatarText = communityDiv.querySelector('p');
            if (avatarText) avatarText.textContent = h.avatarText;
        } else {
            communityDiv.style.display = 'none';
        }
    }
    
    // Main Headings & Description
    const h1 = document.querySelector('.hero-content h1');
    if (h1) {
        h1.innerHTML = `${h.title}<br>Takes The <span>${h.titleHighlight}</span>`;
    }
    const desc = document.querySelector('.hero-content .hero-description');
    if (desc) {
        desc.textContent = h.description;
    }
    
    // Buttons
    const primaryBtn = document.querySelector('.hero-content .btn-primary');
    if (primaryBtn) {
        primaryBtn.textContent = h.primaryButtonText;
        primaryBtn.href = h.primaryButtonLink;
    }
    const secondaryBtn = document.querySelector('.hero-content .btn-secondary');
    if (secondaryBtn) {
        secondaryBtn.textContent = h.secondaryButtonText;
        secondaryBtn.href = h.secondaryButtonLink;
    }
    
    // Social Buttons
    const socialContainer = document.querySelector('.hero-sidebar .social-links');
    if (socialContainer) {
        if (h.visibility.socials) {
            socialContainer.style.display = 'flex';
            const fb = socialContainer.querySelector('.facebook');
            if (fb) fb.href = h.facebookLink;
            const ig = socialContainer.querySelector('.instagram');
            if (ig) ig.href = h.instagramLink;
            const tt = socialContainer.querySelector('.tiktok');
            if (tt) tt.href = h.tiktokLink;
        } else {
            socialContainer.style.display = 'none';
        }
    }
    
    // Floating Upcoming Card
    const floatingCard = document.querySelector('.hero-sidebar .floating-card');
    if (floatingCard) {
        if (h.visibility.upcomingCard) {
            floatingCard.style.display = 'block';
            const cardH3 = floatingCard.querySelector('h3');
            const cardH2 = floatingCard.querySelector('h2');
            const cardP = floatingCard.querySelector('p');
            const cardA = floatingCard.querySelector('a');
            
            if (h.upcomingEventCard) {
                if (cardH2) cardH2.textContent = h.upcomingEventCard.title;
                if (cardP) cardP.textContent = h.upcomingEventCard.subtitle;
                if (cardA) cardA.href = h.upcomingEventCard.link;
            }
        } else {
            floatingCard.style.display = 'none';
        }
    }
    
    // Floating Join Card
    const downloadCard = document.querySelector('.hero-sidebar .download-card');
    if (downloadCard) {
        if (h.visibility.joinCard) {
            downloadCard.style.display = 'block';
            const cardH3 = downloadCard.querySelector('h3');
            const cardBtn = downloadCard.querySelector('button');
            
            if (h.joinCard) {
                if (cardH3) cardH3.textContent = h.joinCard.title;
                if (cardBtn) {
                    cardBtn.textContent = h.joinCard.buttonText;
                    cardBtn.onclick = (e) => {
                        e.preventDefault();
                        openMembershipDrawer();
                    };
                }
            }
        } else {
            downloadCard.style.display = 'none';
        }
    }
    
    // Hook other Join buttons on the page
    document.querySelectorAll('.nav-btn, .join-content .btn-primary').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            openMembershipDrawer();
        };
    });
    
    // Hook any nav action link that says "Join Us"
    document.querySelectorAll('.nav-link-alt, .footer-links a').forEach(link => {
        if (link.textContent.trim().toLowerCase().includes('join us')) {
            link.onclick = (e) => {
                e.preventDefault();
                openMembershipDrawer();
            };
        }
    });
}

// 2. Render About Section
function renderAboutSection(db) {
    const a = db.about;
    const grid = document.querySelector('.about-grid');
    
    if (grid) {
        // Populating intro text
        const intro = grid.querySelector('.about-intro');
        if (intro) {
            const tag = intro.querySelector('.section-tag');
            if (tag) tag.textContent = a.tag;
            
            const h2 = intro.querySelector('h2');
            if (h2) {
                // Break title into spans
                h2.innerHTML = a.heading.replace(/<span>/g, '').replace(/<\/span>/g, '').replace(/(Creativity|Community)/g, '<span>$1</span>');
            }
            
            const p = intro.querySelector('p');
            if (p) p.textContent = a.description;
            
            const btn = intro.querySelector('.learn-btn');
            if (btn) {
                btn.textContent = a.buttonText;
                btn.href = a.buttonLink;
                btn.innerHTML += ' <i class="fas fa-arrow-right"></i>';
            }
        }
        
        // Large card
        const largeCard = grid.querySelector('.large-card');
        if (largeCard) {
            const img = largeCard.querySelector('img');
            if (img) img.src = a.largeCardImage;
            const overlayP = largeCard.querySelector('.card-overlay p');
            if (overlayP) overlayP.textContent = a.largeCardOverlayText;
            const overlayBtn = largeCard.querySelector('.card-overlay button');
            if (overlayBtn) {
                overlayBtn.onclick = () => {
                    window.location.href = a.largeCardLink;
                };
            }
        }
        
        // Small Card Sliders list
        const sliderContainer = grid.querySelector('.slider-container');
        if (sliderContainer) {
            const controlsHtml = `
                <div class="slider-controls">
                    <button class="prev-btn"><i class="fas fa-arrow-left"></i></button>
                    <button class="next-btn"><i class="fas fa-arrow-right"></i></button>
                </div>
            `;
            
            let slidesHtml = '';
            a.slides.forEach((s, idx) => {
                slidesHtml += `
                    <div class="slide ${idx === 0 ? 'active' : ''}">
                        <img src="${s.image}" alt="${s.title}">
                        <div class="card-content">
                            <h3>${s.title}</h3>
                            <p>${s.description}</p>
                        </div>
                    </div>
                `;
            });
            
            sliderContainer.innerHTML = slidesHtml + controlsHtml;
        }
    }
    
    // Mission statement
    const missionSection = document.querySelector('.mission-section');
    if (missionSection) {
        const logo = missionSection.querySelector('.mission-logo img');
        if (logo) logo.src = a.mission.logoUrl;
        
        const info = missionSection.querySelector('div:nth-child(2)');
        if (info) {
            const tag = info.querySelector('.section-tag');
            if (tag) tag.textContent = a.mission.tag;
            const h2 = info.querySelector('h2');
            if (h2) h2.textContent = a.mission.heading;
            const p = info.querySelector('p');
            if (p) p.textContent = a.mission.description;
        }
        
        const communityCard = missionSection.querySelector('.community-card img');
        if (communityCard) communityCard.src = a.mission.communityImage;
        
        // Stats
        const statsGrid = missionSection.querySelector('.stats-grid');
        if (statsGrid && a.stats) {
            statsGrid.innerHTML = a.stats.map(s => `
                <div class="stat-card">
                    <i class="${s.icon}"></i>
                    <h3>${s.number}</h3>
                    <p>${s.label}</p>
                </div>
            `).join('');
        }
    }
}

// 3. Render Categories Section
function renderCategoriesSection(db) {
    const grid = document.querySelector('.department-grid');
    if (grid && db.categories) {
        grid.innerHTML = '';
        db.categories
            .filter(c => c.enabled)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .forEach(c => {
                grid.innerHTML += `
                    <div class="department-card">
                        <div class="icon-box">
                            <i class="${c.icon}"></i>
                        </div>
                        <h3>${c.title}</h3>
                        <p>${c.description}</p>
                    </div>
                `;
            });
    }
}

// 4. Render Events Section
function renderEventsSection(db) {
    const grid = document.querySelector('.event-grid');
    if (grid && db.events) {
        grid.innerHTML = '';
        
        // Sort events by date ascending
        const liveEvents = db.events.filter(e => e.status === 'published');
        
        if (liveEvents.length === 0) {
            grid.innerHTML = `<div style="grid-column: span 3; text-align:center; color:rgba(255,255,255,0.4); padding: 40px;">No upcoming events scheduled. Check back later!</div>`;
            return;
        }
        
        liveEvents.forEach(e => {
            // Formulate short date label e.g. "JUL 15"
            let dateLabel = "TBD";
            if (e.date) {
                const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                try {
                    const dateParts = e.date.split('-');
                    const mNum = parseInt(dateParts[1]) - 1;
                    const dayNum = dateParts[2];
                    dateLabel = `${months[mNum]} ${dayNum}`;
                } catch(err) {
                    dateLabel = e.date;
                }
            }
            
            // Time range display
            const timeStr = formatTimeAMPM(e.time);
            
            grid.innerHTML += `
                <div class="event-card" 
                     data-id="${e.id}"
                     data-title="${e.title}" 
                     data-date="${dateLabel}" 
                     data-time="${timeStr}"
                     data-location="${e.venue}" 
                     data-desc="${e.description}">
                    <div class="event-card-border-glow"></div>
                    <div class="event-card-content">
                        <span class="event-date">${dateLabel}</span>
                        <h3>${e.title}</h3>
                        <p>${e.description.length > 80 ? e.description.substring(0, 80) + '...' : e.description}</p>
                        <a href="#" class="event-details-trigger">${e.featured ? 'Register' : 'View Details'} <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            `;
        });
    }
}

// 5. Render Gallery Section
function renderGallerySection(db) {
    const grid = document.getElementById('gallery-grid');
    if (grid && db.gallery) {
        // Clear all except the fade-overlay
        grid.innerHTML = '<div class="gallery-fade-overlay" id="gallery-fade-overlay"></div>';
        
        db.gallery.forEach(item => {
            const isVideo = item.src.endsWith('.mp4') || item.src.startsWith('data:video');
            const mediaHtml = isVideo
                ? `<video src="${item.src}" muted playsinline loop style="width:100%; height:100%; object-fit:cover;"></video>`
                : `<img src="${item.src}" alt="${item.title}">`;
                
            const catLabel = item.category === 'music' ? 'Music' 
                            : item.category === 'dance' ? 'Dance' 
                            : item.category === 'drama' ? 'Drama' 
                            : item.category === 'visual' ? 'Visual Arts' : item.category;
            
            // Insert before the overlay
            const el = document.createElement('div');
            el.className = `gallery-item ${item.size || ''}`;
            el.setAttribute('data-category', item.category);
            el.setAttribute('data-title', item.title);
            el.setAttribute('data-desc', item.desc || '');
            el.innerHTML = `
                ${mediaHtml}
                <div class="gallery-item-overlay">
                    <span class="gallery-item-cat">${catLabel}</span>
                    <h3 class="gallery-item-title">${item.title}</h3>
                </div>
            `;
            grid.insertBefore(el, document.getElementById('gallery-fade-overlay'));
        });
    }
}

// 6. Render Team Section
function renderTeamSection(db) {
    const grid = document.querySelector('.team-grid');
    if (grid && db.team) {
        grid.innerHTML = '';
        db.team
            .filter(t => t.active)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .forEach(m => {
                grid.innerHTML += `
                    <div class="member-card" data-name="${m.name}" data-role="${m.role}" data-img="${m.image}" data-bio="${m.bio}">
                        <div class="member-card-img-wrapper">
                            <img src="${m.image}" alt="${m.name} - ${m.role}">
                            <div class="member-card-overlay">
                                <div class="member-socials">
                                    <a href="${m.linkedin || '#'}" class="social-icon"><i class="fab fa-linkedin-in"></i></a>
                                    <a href="${m.instagram || '#'}" class="social-icon"><i class="fab fa-instagram"></i></a>
                                    <a href="${m.twitter || '#'}" class="social-icon"><i class="fab fa-twitter"></i></a>
                                </div>
                                <button class="view-bio-btn">Read Manifesto</button>
                            </div>
                        </div>
                        <div class="member-card-info">
                            <h3>${m.name}</h3>
                            <span class="member-role">${m.role}</span>
                        </div>
                    </div>
                `;
            });
    }
}

// 7. Render FAQ Section
function renderFAQSection(db) {
    const container = document.querySelector('.faq-container');
    if (container && db.faqs) {
        container.innerHTML = db.faqs.map(f => `
            <div class="faq-item">
                <button class="faq-question">
                    <span>${f.question}</span>
                    <span class="faq-icon"><i class="fas fa-plus"></i></span>
                </button>
                <div class="faq-answer">
                    <p>${f.answer}</p>
                </div>
            </div>
        `).join('');
    }
}

// 8. Render Footer Section
function renderFooterSection(db) {
    const copyright = document.querySelector('footer .footer-bottom p');
    if (copyright) {
        copyright.innerHTML = `&copy; 2026 ${db.settings.websiteName}. All rights reserved. Created by <span>Kavishka Shenal</span>.`;
    }
    const logoBrand = document.querySelector('.footer-brand .footer-logo');
    if (logoBrand) {
        logoBrand.innerHTML = `
            <img src="${db.hero.logoUrl}" alt="Logo">
            <span class="logo-main">${db.settings.websiteName.replace(' SCU', '').replace('SCU ', '')}</span><span class="logo-dot">.</span>
        `;
    }
}

// ==========================================================================
// INTERACTIVE ENGINE (SLIDERS, DRAWER, LIGHTBOX, MODALS, CONTACT INTAKE)
// ==========================================================================

function initInteractiveEngine() {
    // Backdrop blur Handles
    const backdrop = document.getElementById('overlay-backdrop');
    
    function showBackdrop(onClickCallback) {
        if (backdrop) {
            backdrop.classList.add('active');
            const newBackdrop = backdrop.cloneNode(true);
            backdrop.parentNode.replaceChild(newBackdrop, backdrop);
            newBackdrop.addEventListener('click', onClickCallback);
        }
    }
    
    function hideBackdrop() {
        const backdropEl = document.getElementById('overlay-backdrop');
        if (backdropEl) {
            backdropEl.classList.remove('active');
        }
    }
    
    /* 1. SLIDER INTRO CARD LOGIC */
    const slides = document.querySelectorAll(".small-card .slide");
    const nextBtn = document.querySelector(".small-card .next-btn");
    const prevBtn = document.querySelector(".small-card .prev-btn");
    let currentSlide = 0;
    
    function showSlide(index) {
        if (slides.length > 0) {
            slides.forEach(slide => slide.classList.remove("active"));
            slides[index].classList.add("active");
        }
    }
    
    if (nextBtn && prevBtn && slides.length > 0) {
        nextBtn.onclick = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        };
        prevBtn.onclick = () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        };
    }
    
    /* 2. EVENTS DRAWER & Spotlight */
    const eventCards = document.querySelectorAll('.event-card');
    const drawer = document.getElementById('premium-drawer');
    const drawerClose = document.getElementById('drawer-close');
    const drawerBody = document.getElementById('drawer-body');
    
    eventCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
        
        card.addEventListener('click', e => {
            e.preventDefault();
            const id = card.getAttribute('data-id');
            const title = card.getAttribute('data-title');
            const date = card.getAttribute('data-date');
            const time = card.getAttribute('data-time');
            const location = card.getAttribute('data-location');
            const desc = card.getAttribute('data-desc');
            
            if (drawer && drawerBody) {
                drawer.querySelector('.drawer-header h3').textContent = "Event Registration";
                drawerBody.innerHTML = `
                    <h4>${title}</h4>
                    <div class="drawer-meta">
                        <div class="drawer-meta-item"><i class="far fa-calendar"></i> ${date}</div>
                        <div class="drawer-meta-item"><i class="far fa-clock"></i> ${time}</div>
                        <div class="drawer-meta-item"><i class="fas fa-location-dot"></i> ${location}</div>
                    </div>
                    <p class="drawer-desc">${desc}</p>
                    
                    <h5 class="drawer-form-title">Reserve Your Spot</h5>
                    <form class="drawer-form" id="drawer-rsvp-form">
                        <input type="text" placeholder="Full Name" required id="rsvp-name">
                        <input type="email" placeholder="Email Address" required id="rsvp-email">
                        <button type="submit">Complete RSVP</button>
                    </form>
                `;
                
                drawer.classList.add('active');
                showBackdrop(closeDrawer);
                
                // RSVP Handler
                document.getElementById('drawer-rsvp-form').addEventListener('submit', evt => {
                    evt.preventDefault();
                    const name = document.getElementById('rsvp-name').value;
                    const email = document.getElementById('rsvp-email').value;
                    
                    const db = getDB();
                    const nextId = db.rsvpRegistrations.length > 0 ? Math.max(...db.rsvpRegistrations.map(r => r.id)) + 1 : 1;
                    db.rsvpRegistrations.push({
                        id: nextId,
                        name,
                        email,
                        eventId: id,
                        submittedAt: new Date().toISOString()
                    });
                    saveDB(db);
                    
                    closeDrawer();
                    showToast(`Congratulations ${name}! You are registered for ${title}.`);
                });
            }
        });
    });
    
    function closeDrawer() {
        if (drawer) drawer.classList.remove('active');
        hideBackdrop();
    }
    if (drawerClose) drawerClose.onclick = closeDrawer;

    /* 3. GALLERY Lightbox & filters */
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('premium-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxCategory = document.getElementById('lightbox-category');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    
    const galleryWrapper = document.getElementById('gallery-grid-wrapper');
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryActions = document.getElementById('gallery-actions');
    const showMoreBtn = document.getElementById('gallery-show-more-btn');
    const initialMaxHeight = 1210;
    
    let filteredItems = Array.from(galleryItems);
    let currentLightboxIndex = 0;
    
    function updateShowMoreVisibility() {
        if (galleryWrapper && galleryGrid && galleryActions) {
            const isExpanded = galleryWrapper.classList.contains('expanded');
            galleryWrapper.style.maxHeight = 'none';
            const gridHeight = galleryGrid.scrollHeight;
            
            if (isExpanded) {
                galleryWrapper.style.maxHeight = gridHeight + 'px';
            } else {
                galleryWrapper.style.maxHeight = initialMaxHeight + 'px';
            }
            
            if (gridHeight > initialMaxHeight) {
                galleryActions.style.display = 'flex';
            } else {
                galleryActions.style.display = 'none';
            }
        }
    }
    
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            filteredItems = [];
            
            galleryItems.forEach(item => {
                const cat = item.getAttribute('data-category');
                if (filter === 'all' || cat === filter) {
                    item.classList.remove('hidden');
                    filteredItems.push(item);
                } else {
                    item.classList.add('hidden');
                }
            });
            
            if (galleryWrapper && showMoreBtn) {
                galleryWrapper.classList.remove('expanded');
                showMoreBtn.classList.remove('expanded');
                showMoreBtn.querySelector('span').textContent = 'Show More';
            }
            setTimeout(updateShowMoreVisibility, 50);
        };
    });
    
    if (showMoreBtn) {
        showMoreBtn.onclick = () => {
            const isExpanded = galleryWrapper.classList.contains('expanded');
            if (!isExpanded) {
                galleryWrapper.classList.add('expanded');
                showMoreBtn.classList.add('expanded');
                showMoreBtn.querySelector('span').textContent = 'Show Less';
                galleryWrapper.style.maxHeight = galleryGrid.scrollHeight + 'px';
            } else {
                galleryWrapper.classList.remove('expanded');
                showMoreBtn.classList.remove('expanded');
                showMoreBtn.querySelector('span').textContent = 'Show More';
                galleryWrapper.style.maxHeight = initialMaxHeight + 'px';
                document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
            }
        };
    }
    
    galleryItems.forEach(item => {
        item.onclick = () => {
            currentLightboxIndex = filteredItems.indexOf(item);
            if (currentLightboxIndex !== -1) openLightbox();
        };
    });
    
    function openLightbox() {
        if (!lightbox || filteredItems.length === 0) return;
        const activeItem = filteredItems[currentLightboxIndex];
        const imgEl = activeItem.querySelector('img, video');
        const title = activeItem.getAttribute('data-title');
        const catName = activeItem.querySelector('.gallery-item-cat').textContent;
        const desc = activeItem.getAttribute('data-desc');
        
        if (lightboxImg && imgEl) {
            lightboxImg.src = imgEl.src;
        }
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxCategory) lightboxCategory.textContent = catName;
        if (lightboxDesc) lightboxDesc.textContent = desc;
        
        lightbox.classList.add('active');
        
        if (lightboxPrev) lightboxPrev.style.display = filteredItems.length > 1 ? 'flex' : 'none';
        if (lightboxNext) lightboxNext.style.display = filteredItems.length > 1 ? 'flex' : 'none';
    }
    
    function closeLightbox() {
        if (lightbox) lightbox.classList.remove('active');
    }
    if (lightboxClose) lightboxClose.onclick = closeLightbox;
    
    if (lightboxPrev) {
        lightboxPrev.onclick = () => {
            currentLightboxIndex = (currentLightboxIndex - 1 + filteredItems.length) % filteredItems.length;
            openLightbox();
        };
    }
    if (lightboxNext) {
        lightboxNext.onclick = () => {
            currentLightboxIndex = (currentLightboxIndex + 1) % filteredItems.length;
            openLightbox();
        };
    }
    
    // Keyboard Lightbox navigation
    document.addEventListener('keydown', e => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && filteredItems.length > 1) {
            currentLightboxIndex = (currentLightboxIndex - 1 + filteredItems.length) % filteredItems.length;
            openLightbox();
        }
        if (e.key === 'ArrowRight' && filteredItems.length > 1) {
            currentLightboxIndex = (currentLightboxIndex + 1) % filteredItems.length;
            openLightbox();
        }
    });
    
    /* 4. TEAM MODAL Manifesto Bios */
    const teamCards = document.querySelectorAll('.member-card');
    const modal = document.getElementById('premium-modal');
    const modalClose = document.getElementById('modal-close');
    const modalBody = document.getElementById('modal-body');
    
    teamCards.forEach(card => {
        const bioBtn = card.querySelector('.view-bio-btn');
        if (bioBtn) {
            bioBtn.onclick = (e) => {
                e.stopPropagation();
                const name = card.getAttribute('data-name');
                const role = card.getAttribute('data-role');
                const img = card.getAttribute('data-img');
                const bio = card.getAttribute('data-bio');
                
                if (modal && modalBody) {
                    modalBody.innerHTML = `
                        <img src="${img}" alt="${name}" class="modal-img" style="width:100%; height:250px; object-fit:cover; border-radius:18px; margin-bottom:20px; border:2px solid var(--gold);">
                        <h4 class="modal-name" style="font-family:'Outfit'; font-size:1.4rem; color:white;">${name}</h4>
                        <span class="modal-role" style="color:var(--gold); font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">${role}</span>
                        <p class="modal-bio" style="color:rgba(255,255,255,0.7); line-height:1.6; margin-top:14px; font-style:italic;">"${bio}"</p>
                    `;
                    modal.classList.add('active');
                    showBackdrop(closeModal);
                }
            };
        }
    });
    
    function closeModal() {
        if (modal) modal.classList.remove('active');
        hideBackdrop();
    }
    if (modalClose) modalClose.onclick = closeModal;
    
    /* 5. FAQ ACCORDION items */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.onclick = () => {
                const isOpen = item.classList.contains('active');
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    const otherAns = otherItem.querySelector('.faq-answer');
                    if (otherAns) otherAns.style.maxHeight = null;
                });
                if (!isOpen) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            };
        }
    });
    
    /* 6. CONTACT FORM SUBMISSION */
    const contactForm = document.getElementById('art-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            const nameInput = document.getElementById('form-name');
            const emailInput = document.getElementById('form-email');
            const messageInput = document.getElementById('form-message');
            const submitBtn = contactForm.querySelector('.contact-submit-btn');
            
            if (submitBtn) {
                const origText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Sending Message...</span>';
                
                // Save to database contactMessages
                const db = getDB();
                const nextId = db.contactMessages.length > 0 ? Math.max(...db.contactMessages.map(c => c.id)) + 1 : 1;
                db.contactMessages.unshift({
                    id: nextId,
                    name: nameInput.value,
                    email: emailInput.value,
                    message: messageInput.value,
                    submittedAt: new Date().toISOString(),
                    read: false,
                    attachments: []
                });
                saveDB(db);
                
                setTimeout(() => {
                    showToast(`Thank you, ${nameInput.value}! Your message has been sent successfully.`);
                    contactForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origText;
                }, 1000);
            }
        });
    }
    
    // Auto-calculates first render limit heights
    setTimeout(updateShowMoreVisibility, 400);
}

// Global Member Signup drawer launcher (called from Hero Join buttons)
function openMembershipDrawer() {
    const drawer = document.getElementById('premium-drawer');
    const body = document.getElementById('drawer-body');
    const headerTitle = drawer.querySelector('.drawer-header h3');
    
    if (drawer && body) {
        headerTitle.textContent = "Become a Member";
        body.innerHTML = `
            <p style="color: rgba(255,255,255,0.7); margin-bottom: 20px; font-size: 0.9rem;">
                Submit this application to join the SCU Art Circle creative family.
            </p>
            <form class="drawer-form" id="membership-signup-form">
                <input type="text" placeholder="Full Name" required id="member-name">
                <input type="email" placeholder="Email Address" required id="member-email">
                <input type="text" placeholder="Phone Number" required id="member-phone">
                
                <select id="member-category" required style="margin-bottom: 16px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); width:100%; padding:12px; border-radius:10px;">
                    <option value="" disabled selected>Select Artistic Area</option>
                    <option value="music">Music</option>
                    <option value="dance">Dance</option>
                    <option value="drama">Drama</option>
                    <option value="visual">Visual Arts</option>
                    <option value="literature">Literature</option>
                </select>
                
                <input type="text" placeholder="Years of experience / Skills" required id="member-exp">
                <textarea placeholder="Tell us about yourself and why you want to join..." required id="member-bio" style="margin-bottom: 16px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); width:100%; padding:12px; border-radius:10px; height: 100px; font-family:sans-serif;"></textarea>
                
                <button type="submit">Submit Application</button>
            </form>
        `;
        
        // Show drawer and backdrop
        const backdrop = document.getElementById('overlay-backdrop');
        drawer.classList.add('active');
        if (backdrop) {
            backdrop.classList.add('active');
            // Bind backdrops click
            const newBackdrop = backdrop.cloneNode(true);
            backdrop.parentNode.replaceChild(newBackdrop, backdrop);
            newBackdrop.onclick = () => {
                drawer.classList.remove('active');
                newBackdrop.classList.remove('active');
            };
        }
        
        // Handle Submit
        document.getElementById('membership-signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const db = getDB();
            const name = document.getElementById('member-name').value;
            const email = document.getElementById('member-email').value;
            const phone = document.getElementById('member-phone').value;
            const cat = document.getElementById('member-category').value;
            const exp = document.getElementById('member-exp').value;
            const bio = document.getElementById('member-bio').value;
            
            const nextId = db.memberships.length > 0 ? Math.max(...db.memberships.map(m => m.id)) + 1 : 1;
            db.memberships.unshift({
                id: nextId,
                name,
                email,
                phone,
                artCategory: cat,
                experience: exp,
                bio,
                year: new Date().getFullYear().toString(),
                submittedAt: new Date().toISOString(),
                status: 'pending'
            });
            saveDB(db);
            
            drawer.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
            
            showToast(`Thank you, ${name}! Your membership request has been submitted. Check your email for updates.`);
        });
    }
}

// Custom Toast Alert System
function showToast(message, icon = 'fa-circle-check') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'premium-toast';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 4500);
}

// Format Helpers
function formatTimeAMPM(timeStr) {
    if (!timeStr) return '';
    try {
        const parts = timeStr.split(':');
        const hour = parseInt(parts[0]);
        const min = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${min} ${ampm}`;
    } catch(e) {
        return timeStr;
    }
}