const slides = document.querySelectorAll(".small-card .slide");
const nextBtn = document.querySelector(".small-card .next-btn");
const prevBtn = document.querySelector(".small-card .prev-btn");

let currentSlide = 0;

function showSlide(index) {
    slides.forEach((slide) => {
        slide.classList.remove("active");
    });

    slides[index].classList.add("active");
}

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