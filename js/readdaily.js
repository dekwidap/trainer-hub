

// ========================================
// KONFIGURASI
// ========================================

const REPORT_DATA_URL =
    "https://script.google.com/macros/s/AKfycby6R8oARo4TwyxRSbRD-ogXDWWI941c0F34FQqqQKzb1_UbUDfFa6A3xyU55GlJm4iZ/exec";

const REPORTS_PER_PAGE = 10;

let allReports = [];
let filteredReports = [];
let currentPage = 1;

// Urutan awal: tanggal paling lama ke paling baru.
let sortKey = "tanggal";
let sortDirection = "asc";


// ========================================
// ELEMEN HALAMAN
// ========================================

const monthFilter = document.getElementById("filterMonth");
const yearFilter = document.getElementById("filterYear");
const trainerFilter = document.getElementById("filterTrainer");

const tableBody = document.getElementById("reportTableBody");
const tableMessage = document.getElementById("reportTableMessage");

const pageInfo = document.getElementById("reportPageInfo");
const prevButton = document.getElementById("reportPrevPage");
const nextButton = document.getElementById("reportNextPage");




// ========================================
// FORMAT TANGGAL
// ========================================

function parseReportDate(value) {
    const parts = String(value).split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    const [year, month, day] = parts;

    const date = new Date(year, month - 1, day);

    // Pastikan tanggal valid dan tidak dinormalisasi
    // ke bulan atau hari yang berbeda.
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function formatReportDate(value) {
    const date = parseReportDate(value);

    if (!date) return value || "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(date);
}


// ========================================
// INISIALISASI FILTER
// ========================================

function initializeFilters() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const years = new Set([currentYear]);

    // Tahun juga diambil dari data agar laporan lama
    // tetap dapat difilter.
    allReports.forEach(function (report) {
        const date = parseReportDate(report.tanggal);

        if (date) {
            years.add(date.getFullYear());
        }
    });

    // Tambahkan satu tahun ke depan.
    years.add(currentYear + 1);

    yearFilter.replaceChildren();

    [...years]
        .sort((a, b) => a - b)
        .forEach(function (year) {
            const option = document.createElement("option");
            option.value = String(year);
            option.textContent = String(year);
            yearFilter.appendChild(option);
        });

    monthFilter.value = String(currentMonth);
    yearFilter.value = String(currentYear);

    // Ambil daftar trainer unik dari semua laporan.
    const trainers = [...new Set(
        allReports
            .map(report => String(report.trainer || "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "id"));

    trainerFilter.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Semua Trainer";
    trainerFilter.appendChild(allOption);

    trainers.forEach(function (trainer) {
        const option = document.createElement("option");
        option.value = trainer;
        option.textContent = trainer;
        trainerFilter.appendChild(option);
    });
}


// ========================================
// FILTER DATA
// ========================================

function applyFilters() {
    const selectedMonth = Number(monthFilter.value);
    const selectedYear = Number(yearFilter.value);
    const selectedTrainer = trainerFilter.value;

    filteredReports = allReports.filter(function (report) {
        const date = parseReportDate(report.tanggal);

        if (!date) return false;

        const matchesMonth =
            date.getMonth() + 1 === selectedMonth;

        const matchesYear =
            date.getFullYear() === selectedYear;

        const matchesTrainer =
            !selectedTrainer ||
            report.trainer === selectedTrainer;

        return matchesMonth && matchesYear && matchesTrainer;
    });

    currentPage = 1;
    renderTable();
}


// ========================================
// PENGURUTAN KOLOM
// ========================================

function compareReports(a, b) {
    let comparison = 0;

    if (sortKey === "tanggal") {
        const dateA = parseReportDate(a.tanggal);
        const dateB = parseReportDate(b.tanggal);

        comparison = dateA - dateB;
    } else {
        const valueA = String(a[sortKey] || "");
        const valueB = String(b[sortKey] || "");

        comparison = valueA.localeCompare(
            valueB,
            "id",
            { sensitivity: "base", numeric: true }
        );
    }

    return sortDirection === "asc"
        ? comparison
        : -comparison;
}

function updateSortIndicators() {
    document.querySelectorAll("[data-sort]").forEach(function (button) {
        const indicator = button.querySelector("span");

        if (!indicator) return;

        if (button.dataset.sort === sortKey) {
            indicator.textContent =
                sortDirection === "asc" ? "↑" : "↓";
        } else {
            indicator.textContent = "";
        }
    });
}


// ========================================
// TAMPILKAN TABEL DAN PAGINATION
// ========================================

function renderTable() {
    const sortedReports = [...filteredReports].sort(compareReports);

    const totalReports = sortedReports.length;
    const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);

    // Pastikan halaman tetap valid setelah filter berubah.
    if (totalPages > 0 && currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
    const pageReports = sortedReports.slice(
        startIndex,
        startIndex + REPORTS_PER_PAGE
    );

    tableBody.replaceChildren();

    if (pageReports.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.textContent =
            "Tidak ada laporan untuk filter yang dipilih.";

        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        pageReports.forEach(function (report) {
            const row = document.createElement("tr");

            const values = [
                report.bulan,
                formatReportDate(report.tanggal),
                report.trainer,
                report.property,
                report.taskCategory,
                report.status,
                report.komponen,
                report.detail
            ];

            values.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = value || "-";
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }

    tableMessage.textContent =
        "Menampilkan " + totalReports + " laporan sesuai filter.";

    pageInfo.textContent = totalPages > 0
        ? "Halaman " + currentPage + " dari " + totalPages
        : "Halaman 0 dari 0";

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled =
        totalPages === 0 || currentPage >= totalPages;

    updateSortIndicators();
}



// ========================================
// EVENT FILTER, SORTING, DAN PAGINATION
// ========================================

monthFilter.addEventListener("change", applyFilters);
yearFilter.addEventListener("change", applyFilters);
trainerFilter.addEventListener("change", applyFilters);

document.querySelectorAll("[data-sort]").forEach(function (button) {
    button.addEventListener("click", function () {
        const newKey = button.dataset.sort;

        if (sortKey === newKey) {
            sortDirection =
                sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortKey = newKey;
            sortDirection = "asc";
        }

        currentPage = 1;
        renderTable();
    });
});

prevButton.addEventListener("click", function () {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextButton.addEventListener("click", function () {
    const totalPages = Math.ceil(
        filteredReports.length / REPORTS_PER_PAGE
    );

    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});


// ========================================
// TERIMA DATA DARI GOOGLE APPS SCRIPT
// ========================================

window.handleReportData = function (result) {
    if (!result || !result.success || !Array.isArray(result.reports)) {
        tableMessage.textContent =
            "Gagal memuat laporan. Silakan muat ulang halaman.";

        tableBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.textContent = result?.message || "Respons data tidak valid.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    allReports = result.reports.filter(function (report) {
        return parseReportDate(report.tanggal) !== null;
    });

    console.log("Data laporan pertama:", allReports[0]);
    console.log("Report ID pertama:", allReports[0]?.reportId);

    initializeFilters();
    applyFilters();
};

// ========================================
// AMBIL DATA LAPORAN
// ========================================

tableMessage.textContent = "Memuat data laporan...";

const reportScript = document.createElement("script");

reportScript.src = REPORT_DATA_URL + "?action=readReports";
reportScript.async = true;

reportScript.onerror = function () {
    tableMessage.textContent =
        "Gagal terhubung ke server. Silakan muat ulang halaman.";
};

document.body.appendChild(reportScript);