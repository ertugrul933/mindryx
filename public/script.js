// Common
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => r.querySelectorAll(s);

function setNavShadow() {
  const nav = $(".navbar");
  if (window.scrollY > 20) nav.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)";
  else nav.style.boxShadow = "none";
}
window.addEventListener("scroll", setNavShadow);
$("#year").textContent = String(new Date().getFullYear());

// Mobile menu
const menuToggle = $(".menu-toggle");
const navLinks = $(".nav-links");
menuToggle.addEventListener("click", () => {
  const d = getComputedStyle(navLinks).display;
  navLinks.style.display = d === "none" ? "block" : "none";
});

// Animations on view
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.2 }
);
$$(".fade-in, .slide-up, .zoom-in").forEach((el) => io.observe(el));

// Load landing.json
async function loadJSON(p) {
  const r = await fetch(p);
  return r.json();
}
(async function () {
  const l = await loadJSON("public/content/landing.json");

  // Hero
  $("#heroTitle").innerHTML = l.hero.title;
  $("#heroSubtitle").textContent = l.hero.subtitle;
  $("#heroPrimary").textContent = l.hero.primaryCtaText;
  $("#heroPrimary").href = l.hero.primaryCtaHref || "#";
  $("#heroSecondary").textContent = l.hero.secondaryCtaText;
  $("#heroSecondary").href = l.hero.secondaryCtaHref || "#";
  $("#heroImage").src = l.hero.image;

  // Features
  const fwrap = $("#featuresWrap");
  fwrap.innerHTML = l.features
    .map(
      (f) => `
    <div class="card slide-up">
      <h3>${f.title}</h3>
      <p>${f.text}</p>
    </div>`
    )
    .join("");

  // Solutions
  $("#solutionsTitle").textContent = l.solutions.title;
  $("#solutionsImage").src = l.solutions.image;
  $("#solutionsHeading").textContent = l.solutions.heading;
  $("#solutionsText").textContent = l.solutions.text;
  $("#solutionsCta").textContent = l.solutions.ctaText;
  $("#solutionsCta").href = l.solutions.ctaHref || "#";

  // Pricing
  const pwrap = $("#pricingWrap");
  pwrap.innerHTML = l.pricing
    .map(
      (p) => `
    <div class="card ${p.highlight ? "highlight" : ""} slide-up">
      <h3>${p.name}</h3>
      <p><strong>${p.price} ${p.period || ""}</strong></p>
      <ul style="list-style:none;padding-left:0;margin:8px 0 14px;">
        ${(p.bullets || []).map((b) => `<li>• ${b}</li>`).join("")}
      </ul>
      <a href="${p.ctaHref || "#"}" class="btn ${p.highlight ? "primary" : "ghost"}">${p.ctaText}</a>
    </div>`
    )
    .join("");

  // FAQ
  const qwrap = $("#faqWrap");
  qwrap.innerHTML = l.faqs
    .map(
      (it) => `
    <div class="faq-item">
      <h4 class="faq-q">${it.q} <span>+</span></h4>
      <p class="faq-a">${it.a}</p>
    </div>`
    )
    .join("");
  $$(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
      const a = q.nextElementSibling;
      a.style.display = a.style.display === "block" ? "none" : "block";
      q.querySelector("span").textContent =
        a.style.display === "block" ? "-" : "+";
    });
  });

  // Re-observe new nodes
  $$(".fade-in, .slide-up, .zoom-in").forEach((el) => io.observe(el));
})();
