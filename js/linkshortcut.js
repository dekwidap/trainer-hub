/* ==================================================
   LINK SHORTCUT
   Filter kategori dan keyword
================================================== */

const categoryFilter = document.getElementById("categoryFilter");
const keywordFilter = document.getElementById("keywordFilter");

const linkSections = document.querySelectorAll(".link-section");

function filterLinkCards() {
    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "all";

    const keyword = keywordFilter
        ? keywordFilter.value.trim().toLowerCase()
        : "";

    linkSections.forEach(function (section) {
        const sectionCategory = section.dataset.category;

        // Periksa apakah kategori sesuai
        const categoryMatch =
            selectedCategory === "all" ||
            sectionCategory === selectedCategory;

        let visibleCards = 0;

        // Periksa setiap kartu link
        const cards = section.querySelectorAll(".link-card");

        cards.forEach(function (card) {
            const title = card.querySelector("h3")?.textContent || "";
            const description = card.querySelector("p")?.textContent || "";

            const searchableText =
                (title + " " + description).toLowerCase();

            const keywordMatch =
                keyword === "" || searchableText.includes(keyword);

            const showCard = categoryMatch && keywordMatch;

            card.hidden = !showCard;

            if (showCard) {
                visibleCards++;
            }
        });

        // Sembunyikan kategori jika tidak ada kartu yang cocok
        section.hidden = !categoryMatch || visibleCards === 0;
    });
}

// Event filter kategori
if (categoryFilter) {
    categoryFilter.addEventListener("change", filterLinkCards);
}

// Event pencarian keyword
if (keywordFilter) {
    keywordFilter.addEventListener("input", filterLinkCards);
}

// Jalankan filter saat halaman pertama kali dibuka
filterLinkCards();