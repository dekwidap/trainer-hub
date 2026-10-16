
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Ikon matahari untuk Light Mode
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

// Ikon bulan untuk Dark Mode
const moonIcon = `
    <path d="M20.9 13A9 9 0 0 1 11 3.1
    9 9 0 1 0 20.9 13Z"/>
`;

themeToggle.addEventListener("click", function () {
    // Ganti tema halaman
    const isDark = document.body.classList.toggle("dark-mode");

    // Ganti ikon dan label aksesibilitas
    if (isDark) {
        themeIcon.innerHTML = moonIcon;
        themeToggle.setAttribute(
            "aria-label",
            "Aktifkan light mode"
        );
    } else {
        themeIcon.innerHTML = sunIcon;
        themeToggle.setAttribute(
            "aria-label",
            "Aktifkan dark mode"
        );
    }
});
