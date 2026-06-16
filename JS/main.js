// ==========================================
// EXISTING HEADER SLIDER LOGIC
// ==========================================
const slides = document.querySelectorAll(".small-card .slide");
const nextBtn = document.querySelector(".small-card .next-btn");
const prevBtn = document.querySelector(".small-card .prev-btn");

let currentSlide = 0;

function showSlide(index) {
    if (slides.length > 0) {
        slides.forEach((slide) => {
            slide.classList.remove("active");
        });
        slides[index].classList.add("active");
    }
}

if (nextBtn && prevBtn && slides.length > 0) {
    nextBtn.addEventListener("click", () => {
        currentSlide++;
        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }
        showSlide(currentSlide);
    });

    prevBtn.addEventListener("click", () => {
        currentSlide--;
        if (currentSlide < 0) {
            currentSlide = slides.length - 1;
        }
        showSlide(currentSlide);
    });

    showSlide(currentSlide);
}

// ==========================================
// EXISTING SMOOTH SCROLLING LOGIC
// ==========================================
const nav = document.querySelector("nav");
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
        if (nav) {
            nav.classList.remove('active');
        }
    });
});

// ==========================================
// NEW PREMIUM INTERACTIVE COMPONENTS LOGIC
// ==========================================

// Global Backdrop Blur Handles
const backdrop = document.getElementById('overlay-backdrop');

function showBackdrop(onClickCallback) {
    if (backdrop) {
        backdrop.classList.add('active');
        // Clear previous event listener
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

/* ------------------------------------------
   1. EVENTS SECTION: Spotlight & Drawer
------------------------------------------ */
const eventCards = document.querySelectorAll('.event-card');
const drawer = document.getElementById('premium-drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerBody = document.getElementById('drawer-body');

// Spotlight cursor-tracking light reflections
eventCards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });

    // Details/RSVP click behavior
    card.addEventListener('click', e => {
        e.preventDefault();
        
        const title = card.getAttribute('data-title');
        const date = card.getAttribute('data-date');
        const time = card.getAttribute('data-time');
        const location = card.getAttribute('data-location');
        const desc = card.getAttribute('data-desc');

        if (drawer && drawerBody) {
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

            // Open Drawer
            drawer.classList.add('active');
            showBackdrop(closeDrawer);

            // Handle RSVP Submit
            const rsvpForm = document.getElementById('drawer-rsvp-form');
            if (rsvpForm) {
                rsvpForm.addEventListener('submit', event => {
                    event.preventDefault();
                    const name = document.getElementById('rsvp-name').value;
                    closeDrawer();
                    showToast(`Congratulations ${name}! You are registered for ${title}.`);
                });
            }
        }
    });
});

function closeDrawer() {
    if (drawer) drawer.classList.remove('active');
    hideBackdrop();
}

if (drawerClose) {
    drawerClose.addEventListener('click', closeDrawer);
}

/* ------------------------------------------
   2. GALLERY SECTION: Filtering & Lightbox
------------------------------------------ */
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

// Show More / Less variables
const galleryWrapper = document.getElementById('gallery-grid-wrapper');
const galleryGrid = document.getElementById('gallery-grid');
const galleryActions = document.getElementById('gallery-actions');
const showMoreBtn = document.getElementById('gallery-show-more-btn');
const initialMaxHeight = 1210; // 4 rows height limit

let filteredItems = Array.from(galleryItems);
let currentLightboxIndex = 0;

// Initialize Show More button visibility based on grid content height
function updateShowMoreVisibility() {
    if (galleryWrapper && galleryGrid && galleryActions) {
        // Temporarily clear wrapper max-height to read the true grid height
        const isExpanded = galleryWrapper.classList.contains('expanded');
        galleryWrapper.style.maxHeight = 'none';
        const gridHeight = galleryGrid.scrollHeight;
        
        // Restore height limit based on expanded state
        if (isExpanded) {
            galleryWrapper.style.maxHeight = gridHeight + 'px';
        } else {
            galleryWrapper.style.maxHeight = initialMaxHeight + 'px';
        }

        // Only show button if the grid height exceeds our initial 4-row limit
        if (gridHeight > initialMaxHeight) {
            galleryActions.style.display = 'flex';
        } else {
            galleryActions.style.display = 'none';
            // Ensure wrapper expands fully if it doesn't exceed the limit
            galleryWrapper.style.maxHeight = 'none';
        }
    }
}

// Filter Category
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
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

        // Reset expanded state when switching categories
        if (galleryWrapper && showMoreBtn) {
            galleryWrapper.classList.remove('expanded');
            showMoreBtn.classList.remove('expanded');
            showMoreBtn.querySelector('span').textContent = 'Show More';
        }
        
        // Update visibility of the Show More button for the new filter layout
        setTimeout(updateShowMoreVisibility, 50);
    });
});

// Show More click listener
if (showMoreBtn && galleryWrapper && galleryGrid) {
    showMoreBtn.addEventListener('click', () => {
        const isExpanded = galleryWrapper.classList.contains('expanded');
        
        if (!isExpanded) {
            // Expand
            galleryWrapper.classList.add('expanded');
            showMoreBtn.classList.add('expanded');
            showMoreBtn.querySelector('span').textContent = 'Show Less';
            
            // Set dynamic max-height to grid scroll height
            const gridHeight = galleryGrid.scrollHeight;
            galleryWrapper.style.maxHeight = gridHeight + 'px';
        } else {
            // Collapse
            galleryWrapper.classList.remove('expanded');
            showMoreBtn.classList.remove('expanded');
            showMoreBtn.querySelector('span').textContent = 'Show More';
            
            // Reset to initial height
            galleryWrapper.style.maxHeight = initialMaxHeight + 'px';
            
            // Scroll gallery header back into view smoothly
            const gallerySection = document.getElementById('gallery');
            if (gallerySection) {
                gallerySection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

// Initial calculation on load
window.addEventListener('load', () => {
    updateShowMoreVisibility();
});
// Also run immediately in case load event already fired
setTimeout(updateShowMoreVisibility, 500);

// Lightbox triggers
galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        currentLightboxIndex = filteredItems.indexOf(item);
        if (currentLightboxIndex !== -1) {
            openLightbox();
        }
    });
});

function openLightbox() {
    if (!lightbox || filteredItems.length === 0) return;
    
    const activeItem = filteredItems[currentLightboxIndex];
    const imgEl = activeItem.querySelector('img');
    const title = activeItem.getAttribute('data-title');
    const catName = activeItem.querySelector('.gallery-item-cat').textContent;
    const desc = activeItem.getAttribute('data-desc');

    if (lightboxImg) lightboxImg.src = imgEl.src;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCategory) lightboxCategory.textContent = catName;
    if (lightboxDesc) lightboxDesc.textContent = desc;

    lightbox.classList.add('active');

    // Arrow Visibility
    if (lightboxPrev) lightboxPrev.style.display = filteredItems.length > 1 ? 'flex' : 'none';
    if (lightboxNext) lightboxNext.style.display = filteredItems.length > 1 ? 'flex' : 'none';
}

function closeLightbox() {
    if (lightbox) lightbox.classList.remove('active');
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
}

if (lightboxPrev) {
    lightboxPrev.addEventListener('click', () => {
        currentLightboxIndex--;
        if (currentLightboxIndex < 0) {
            currentLightboxIndex = filteredItems.length - 1;
        }
        openLightbox();
    });
}

if (lightboxNext) {
    lightboxNext.addEventListener('click', () => {
        currentLightboxIndex++;
        if (currentLightboxIndex >= filteredItems.length) {
            currentLightboxIndex = 0;
        }
        openLightbox();
    });
}

// Lightbox keyboard navigation
document.addEventListener('keydown', e => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && filteredItems.length > 1) {
        currentLightboxIndex--;
        if (currentLightboxIndex < 0) currentLightboxIndex = filteredItems.length - 1;
        openLightbox();
    }
    if (e.key === 'ArrowRight' && filteredItems.length > 1) {
        currentLightboxIndex++;
        if (currentLightboxIndex >= filteredItems.length) currentLightboxIndex = 0;
        openLightbox();
    }
});

/* ------------------------------------------
   3. TEAM SECTION: Manifesto Bios Modal
------------------------------------------ */
const teamCards = document.querySelectorAll('.member-card');
const modal = document.getElementById('premium-modal');
const modalClose = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body');

teamCards.forEach(card => {
    const bioBtn = card.querySelector('.view-bio-btn');
    if (bioBtn) {
        bioBtn.addEventListener('click', e => {
            e.stopPropagation(); // Prevent card hover/other clicks
            
            const name = card.getAttribute('data-name');
            const role = card.getAttribute('data-role');
            const img = card.getAttribute('data-img');
            const bio = card.getAttribute('data-bio');

            if (modal && modalBody) {
                modalBody.innerHTML = `
                    <img src="${img}" alt="${name}" class="modal-img">
                    <h4 class="modal-name">${name}</h4>
                    <span class="modal-role">${role}</span>
                    <p class="modal-bio">"${bio}"</p>
                `;

                modal.classList.add('active');
                showBackdrop(closeModal);
            }
        });
    }
});

function closeModal() {
    if (modal) modal.classList.remove('active');
    hideBackdrop();
}

if (modalClose) {
    modalClose.addEventListener('click', closeModal);
}

/* ------------------------------------------
   4. FAQ SECTION: Accordion Collapses
------------------------------------------ */
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (question && answer) {
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');

            // Close all others first for accordion feel
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                const otherAns = otherItem.querySelector('.faq-answer');
                if (otherAns) {
                    otherAns.style.maxHeight = null;
                }
            });

            if (!isOpen) {
                item.classList.add('active');
                // Set max-height dynamically to content scrollHeight
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    }
});

/* ------------------------------------------
   5. CONTACT SECTION: Submit & Toast Alerts
------------------------------------------ */
const contactForm = document.getElementById('art-contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', e => {
        e.preventDefault();

        const nameInput = document.getElementById('form-name');
        const submitBtn = contactForm.querySelector('.contact-submit-btn');

        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Sending Message...</span>';

            // Simulate server delivery
            setTimeout(() => {
                showToast(`Thank you, ${nameInput.value}! Your message has been sent successfully.`);
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1200);
        }
    });
}

// Custom Toast Alert System
function showToast(message, icon = 'fa-circle-check') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'premium-toast';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    // Dynamic scale-in trigger
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // Self dismiss
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 4500);
}