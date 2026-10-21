
/* =========================
   ACTIVE NAVIGATION
   Menandai menu sesuai halaman yang dibuka
========================= */

const currentPage = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll("a.nav-link[href]").forEach(function (link) {
    const linkPage = link.getAttribute("href").split("/").pop();

    if (linkPage === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
    } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
    }
});





const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

const THEME_KEY = "trainerHubTheme";

// Ikon matahari
const sunIcon = `
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.42 1.42"/>
    <path d="m17.65 17.65 1.42 1.42"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m4.93 19.07 1.42-1.42"/>
    <path d="m17.65 6.35 1.42-1.42"/>
`;

// Ikon bulan
const moonIcon = `
    <path d="M20.9 13A9 9 0 0 1 11 3.1
    9 9 0 1 0 20.9 13Z"/>
`;

// Mengatur ikon dan label tombol sesuai tema
function updateThemeButton(isDark) {
    themeIcon.innerHTML = isDark ? moonIcon : sunIcon;

    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Aktifkan light mode" : "Aktifkan dark mode"
    );
}

// Membaca tema terakhir ketika halaman dibuka
const savedTheme = localStorage.getItem(THEME_KEY);
const isDarkInitially = savedTheme === "dark";

document.documentElement.classList.toggle("dark-mode", isDarkInitially);
document.body.classList.toggle("dark-mode", isDarkInitially);

updateThemeButton(isDarkInitially);

// Mengganti dan menyimpan tema ketika tombol diklik

themeToggle.addEventListener("click", function () {
    const isDark = !document.documentElement.classList.contains("dark-mode");

    document.documentElement.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("dark-mode", isDark);

    localStorage.setItem(
        THEME_KEY,
        isDark ? "dark" : "light"
    );

    updateThemeButton(isDark);
});





/* =========================
   MOBILE NAVIGATION
========================= */

const menuToggle = document.getElementById("menuToggle");
const headerNav = document.getElementById("headerNav");

if (menuToggle && headerNav) {
    const menuIcon = `
        <i data-lucide="menu" aria-hidden="true"></i>
    `;

    const closeIcon = `
        <i data-lucide="x" aria-hidden="true"></i>
    `;

    function setMenuState(isOpen) {
        headerNav.classList.toggle("is-open", isOpen);

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Tutup navigasi" : "Buka navigasi"
        );
        menuToggle.setAttribute(
            "title",
            isOpen ? "Tutup menu" : "Buka menu"
        );

        menuToggle.innerHTML = isOpen ? closeIcon : menuIcon;

        // Render ulang ikon Lucide setelah HTML ikon berubah
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Buka atau tutup menu
    menuToggle.addEventListener("click", function () {
        const isOpen = headerNav.classList.contains("is-open");
        setMenuState(!isOpen);
    });

    // Tutup menu hanya setelah tautan halaman dipilih,
    // bukan ketika tombol dropdown diklik.
    headerNav.querySelectorAll("a.nav-link[href]").forEach(function (link) {
        link.addEventListener("click", function () {
            setMenuState(false);
        });
    });

    // Tutup menu menggunakan tombol Escape
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setMenuState(false);
        }
    });

    // Pastikan menu tertutup saat berpindah ke desktop
    window.addEventListener("resize", function () {
        if (window.innerWidth > 700) {
            setMenuState(false);
        }
    });
}



document.querySelectorAll(".nav-dropdown").forEach(function (dropdown) {
    const toggle = dropdown.querySelector(".nav-dropdown-toggle");

    if (!toggle) return;

    toggle.addEventListener("click", function (event) {
        // Desktop menggunakan hover, bukan klik
        if (window.innerWidth > 700) {
            event.preventDefault();
            return;
        }

        // Mobile menggunakan klik
        event.preventDefault();
        event.stopPropagation();

        const isOpen = dropdown.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Tutup dropdown saat klik di luar, khusus mobile
    document.addEventListener("click", function (event) {
        if (
            window.innerWidth <= 700 &&
            !dropdown.contains(event.target)
        ) {
            dropdown.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });
});
