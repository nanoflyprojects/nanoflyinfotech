/**
 * Nano Fly InfoTech — Shared Site Components
 * ------------------------------------------
 * Single source of truth for the topbar, header/navigation, footer,
 * and WhatsApp floating button so this markup never has to be
 * duplicated across every HTML page.
 *
 * Each page only needs:
 *   <body data-page="home">              <!-- home | about | services | plans | contact -->
 *     <div id="topbar-mount"></div>
 *     <div id="header-mount"></div>
 *     ... page content ...
 *     <div id="footer-mount"></div>
 *   </body>
 *
 * This script must be included BEFORE assets/js/main.js so the header/
 * footer exist in the DOM before main.js wires up sticky-header,
 * scroll-top, mobile nav, etc.
 */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "919487772786";
  var DEFAULT_WA_MESSAGE = "Hi Nano Fly InfoTech! I'd like to know more about your services.";

  function waLink(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message || DEFAULT_WA_MESSAGE);
  }
  // Expose helper globally so other pages (e.g. plans.html) can build
  // per-plan WhatsApp links without repeating the phone number anywhere.
  window.nanoflyWaLink = waLink;

  // Absolute paths so links resolve the same way regardless of which
  // page/folder depth they're rendered from. Combined with Netlify's
  // pretty-URL support (or Vercel's cleanUrls: true), these resolve to
  // e.g. nanoflyinfotech.com/about instead of /about.html.
  var NAV_LINKS = [
    { page: "home", label: "Home", href: "/" },
    { page: "about", label: "About Us", href: "/about" },
    { page: "services", label: "Services", href: "/services" },
    { page: "plans", label: "Plans", href: "/plans" },
    { page: "contact", label: "Contact Us", href: "/contact" }
  ];

  function topbarHTML() {
    return (
      '<section id="topbar" class="py-1" style="background-color:#128275;">' +
      '<div class="container text-white px-2 px-md-3">' +
      '<div class="d-none d-md-flex align-items-center justify-content-between fs-7">' +
      '<div class="d-flex align-items-center gap-4">' +
      '<div class="d-flex align-items-center">' +
      '<i class="bi bi-envelope me-2"></i>' +
      '<a href="mailto:" class="text-white text-decoration-none">nanofly.works@gmail.com</a>' +
      '</div>' +
      '<div class="d-flex gap-3">' +
      '<a href="https://www.facebook.com/nanoflyinfotech/" class="text-white" aria-label="Facebook"><i class="bi bi-facebook"></i></a>' +
      '<a href="https://www.instagram.com/nanoflyinfotech/" class="text-white" aria-label="Instagram"><i class="bi bi-instagram"></i></a>' +
      '<a href="https://www.linkedin.com/company/nano-fly-works/" class="text-white" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>' +
      '<a href="https://www.threads.com/nanoflyinfotech/" class="text-white" aria-label="Threads"><i class="bi bi-threads"></i></a>' +
      '</div>' +
      '</div>' +
      '<div class="d-flex gap-4">' +
      '<div class="d-flex align-items-center"><i class="bi bi-phone me-2"></i> 9487772786</div>' +
      '<div class="d-flex align-items-center"><i class="bi bi-phone me-2"></i> 9344229558</div>' +
      '</div>' +
      '</div>' +
      '<div class="d-md-none py-1">' +
      '<div class="d-flex justify-content-between align-items-center mb-2 fs-7">' +
      '<div class="d-flex align-items-center">' +
      '<i class="bi bi-envelope me-2"></i>' +
      '<a href="mailto:nanofly.works@gmail.com" class="text-white text-decoration-none">nanofly.works@gmail.com</a>' +
      '</div>' +
      '<div class="d-flex align-items-center"><i class="bi bi-phone me-2"></i> 9487772786</div>' +
      '</div>' +
      '<div class="d-flex justify-content-between align-items-center fs-7">' +
      '<div class="d-flex gap-3">' +
      '<a href="https://www.facebook.com/nanoflyinfotech/" class="text-white" aria-label="Facebook"><i class="bi bi-facebook"></i></a>' +
      '<a href="https://www.instagram.com/nanoflyinfotech/" class="text-white" aria-label="Instagram"><i class="bi bi-instagram"></i></a>' +
      '<a href="https://www.linkedin.com/company/nano-fly-works/" class="text-white" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>' +
      '<a href="https://www.threads.com/nanoflyinfotech/" class="text-white" aria-label="Threads"><i class="bi bi-threads"></i></a>' +
      '</div>' +
      '<div class="d-flex align-items-center"><i class="bi bi-phone me-2"></i> 9344229558</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function headerHTML(activePage) {
    var items = NAV_LINKS.map(function (link) {
      var classes = [];
      if (link.page === activePage) classes.push("active");
      if (link.page === "contact") classes.push("nav-cta");
      var classAttr = classes.length ? ' class="' + classes.join(" ") + '"' : "";
      return '<li><a href="' + link.href + '"' + classAttr + ">" + link.label + "</a></li>";
    }).join("");

    return (
      '<header id="header" class="header d-flex align-items-center">' +
      '<div class="container-fluid container-xl d-flex align-items-center justify-content-between">' +
      '<a href="/" class="logo d-flex align-items-center">' +
      '<img src="assets/img/white 2.webp" class="img-fluid" alt="Nano Fly InfoTech logo">' +
      '</a>' +
      '<nav id="navbar" class="navbar"><ul>' + items + '</ul></nav>' +
      '<i class="mobile-nav-toggle mobile-nav-show bi bi-list"></i>' +
      '<i class="mobile-nav-toggle mobile-nav-hide d-none bi bi-x"></i>' +
      '</div>' +
      '</header>'
    );
  }

  function footerHTML() {
    return (
      '<footer id="footer" class="footer">' +
      '<img src="assets/img/white 1.webp" class="img-fluid" alt="Nano Fly InfoTech" style="display:block;margin-left:auto;margin-right:auto;width:200px;">' +
      '<div class="container">' +
      '<div class="row gy-4">' +
      '<div class="col-lg-5 col-md-12 footer-info">' +
      '<a href="/" class="logo d-flex align-items-center"></a>' +
      '<p>Our key goals include enhancing brand visibility, driving client acquisition and retention, and delivering impactful marketing solutions. We aim to offer innovative educational programs, support professional development, and maximize ROI for our clients as we build strong partnerships and expand our reach.</p>' +
      '<div class="social-links d-flex mt-4">' +
      '<a href="https://www.threads.com/nanoflyinfotech/" class="threads" aria-label="Threads"><i class="bi bi-threads"></i></a>' +
      '<a href="https://www.facebook.com/nanoflyinfotech/" class="facebook" aria-label="Facebook"><i class="bi bi-facebook"></i></a>' +
      '<a href="https://www.instagram.com/nanoflyinfotech/" class="instagram" aria-label="Instagram"><i class="bi bi-instagram"></i></a>' +
      '<a href="https://www.linkedin.com/company/nano-fly-works/" class="linkedin" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>' +
      '</div>' +
      '</div>' +
      '<div class="col-lg-2 col-6 footer-links">' +
      '<h4>Useful Links</h4>' +
      '<ul>' +
      '<li><a href="/">Home</a></li>' +
      '<li><a href="/about">About us</a></li>' +
      '<li><a href="/services">Services</a></li>' +
      '<li><a href="/plans">Plans</a></li>' +
      '<li><a href="/contact">Contact us</a></li>' +
      '</ul>' +
      '</div>' +
      '<div class="col-lg-2 col-6 footer-links">' +
      '<h4>Our Services</h4>' +
      '<ul>' +
      '<li><a href="/services">Digital Marketing</a></li>' +
      '<li><a href="/services">Social Media Management</a></li>' +
      '<li><a href="/plans">Website Development</a></li>' +
      '<li><a href="/services">SEO Optimization</a></li>' +
      '<li><a href="/services">Educational Solutions</a></li>' +
      '</ul>' +
      '</div>' +
      '<div class="col-lg-3 col-md-12 footer-contact text-center text-md-start">' +
      '<h4>Contact Us</h4>' +
      '<p>' +
      '1/272A Sri Ganapathy Nagar, <br>' +
      'Marutham Veethi, Thiruppalai, <br>' +
      'Madurai-625014, Tamil Nadu, India <br><br>' +
      '<strong>Phone:</strong> +91 94877 72786, +91 93442 29558<br>' +
      '<strong>Email:</strong> nanofly.works@gmail.com<br>' +
      '</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="container mt-3">' +
      '<div class="copyright text-center small" style="color:rgba(255,255,255,0.6);">' +
      "&copy; " + new Date().getFullYear() + ' <strong>Nano Fly InfoTech</strong>. All Rights Reserved.' +
      '</div>' +
      '</div>' +
      '</footer>'
    );
  }

  function whatsappFloatHTML() {
    return (
      '<a href="' + waLink() + '" class="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">' +
      '<i class="bi bi-whatsapp"></i>' +
      '</a>'
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var body = document.body;
    var activePage = body.getAttribute("data-page") || "home";

    var topbarMount = document.getElementById("topbar-mount");
    if (topbarMount) topbarMount.outerHTML = topbarHTML();

    var headerMount = document.getElementById("header-mount");
    if (headerMount) headerMount.outerHTML = headerHTML(activePage);

    var footerMount = document.getElementById("footer-mount");
    if (footerMount) footerMount.outerHTML = footerHTML();

    // Floating WhatsApp button, appended once, on every page.
    // (The scroll-top button has been removed; WhatsApp now occupies that
    // bottom-right corner instead of bottom-left.)
    if (!document.querySelector(".whatsapp-float")) {
      document.body.insertAdjacentHTML("beforeend", whatsappFloatHTML());
    }

    // Wire up every ".nanofly-wa-link" on the page (header button, hero CTAs,
    // contact panel, plans CTA, etc.) so no page needs to repeat this logic.
    document.querySelectorAll(".nanofly-wa-link").forEach(function (a) {
      if (a.getAttribute("href") === "#" || !a.getAttribute("href")) {
        a.setAttribute("href", waLink());
      }
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  });
})();
