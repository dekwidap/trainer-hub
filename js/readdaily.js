// ========================================
// KONFIGURASI
// ========================================

const REPORT_DATA_URL =
    "https://script.google.com/macros/s/AKfycby6R8oARo4TwyxRSbRD-ogXDWWI941c0F34FQqqQKzb1_UbUDfFa6A3xyU55GlJm4iZ/exec";

const REPORTS_PER_PAGE = 10;

// Cache browser
const REPORT_CACHE_KEY =
    "trainerHub_dailyReports_cache";


// ========================================
// STATE DATA
// ========================================

let allReports = [];
let filteredReports = [];
let reportCurrentPage = 1;


// ========================================
// ELEMEN HALAMAN
// ========================================

const periodFilter =
    document.getElementById("filterPeriod");

const monthFilter =
    document.getElementById("filterMonth");

const yearFilter =
    document.getElementById("filterYear");

const trainerFilter =
    document.getElementById("filterTrainer");

const monthFilterGroup = document.getElementById("monthFilterGroup");
const yearFilterGroup = document.getElementById("yearFilterGroup");

const tableBody =
    document.getElementById("reportTableBody");

const tableMessage =
    document.getElementById("reportTableMessage");

const refreshButton = document.getElementById("refreshReportData");

const pageInfo =
    document.getElementById("reportPageInfo");

const prevButton =
    document.getElementById("reportPrevPage");

const nextButton =
    document.getElementById("reportNextPage");


// ========================================
// FORMAT TANGGAL
// ========================================

function parseReportDate(value) {

    const parts =
        String(value)
            .split("-")
            .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(Number.isNaN)
    ) {
        return null;
    }

    const [year, month, day] = parts;

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    // Pastikan tanggal valid
    // dan tidak dinormalisasi
    // ke bulan atau hari berbeda.
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

    const date =
        parseReportDate(value);

    if (!date) {
        return value || "-";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


// ========================================
// CACHE - IDENTITAS PERIODE JAM
// ========================================

function getCurrentCachePeriod() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const hour =
        String(
            now.getHours()
        ).padStart(2, "0");

    return `${year}-${month}-${day}-${hour}`;
}


// ========================================
// CACHE - SIMPAN DATA
// ========================================

function saveReportsToCache(reports) {

    try {

        const cacheData = {

            period:
                getCurrentCachePeriod(),

            savedAt:
                new Date().toISOString(),

            reports:
                reports
        };

        localStorage.setItem(
            REPORT_CACHE_KEY,
            JSON.stringify(cacheData)
        );

        console.log(
            "[CACHE] Data berhasil disimpan."
        );

        console.log(
            "[CACHE] Periode:",
            cacheData.period
        );

    } catch (error) {

        console.warn(
            "[CACHE] Gagal menyimpan data:",
            error
        );
    }
}


// ========================================
// CACHE - BACA DATA
// ========================================

function getReportsFromCache() {

    try {

        const rawCache =
            localStorage.getItem(
                REPORT_CACHE_KEY
            );

        if (!rawCache) {

            console.log(
                "[CACHE] Belum ada cache."
            );

            return null;
        }

        const cacheData =
            JSON.parse(rawCache);

        if (
            !cacheData ||
            !Array.isArray(
                cacheData.reports
            ) ||
            !cacheData.period
        ) {

            console.warn(
                "[CACHE] Format cache tidak valid."
            );

            localStorage.removeItem(
                REPORT_CACHE_KEY
            );

            return null;
        }


        const currentPeriod =
            getCurrentCachePeriod();


        console.log(
            "[CACHE] Periode cache:",
            cacheData.period
        );

        console.log(
            "[CACHE] Periode sekarang:",
            currentPeriod
        );


        // ========================================
        // CACHE MASIH BERADA PADA JAM YANG SAMA
        // ========================================

        if (
            cacheData.period ===
            currentPeriod
        ) {

            console.log(
                "[CACHE] Cache masih valid."
            );

            return cacheData.reports;
        }


        // ========================================
        // CACHE SUDAH MASUK JAM BARU
        // ========================================

        console.log(
            "[CACHE] Jam sudah berubah. Cache perlu diperbarui."
        );

        return null;

    } catch (error) {

        console.warn(
            "[CACHE] Gagal membaca cache:",
            error
        );

        localStorage.removeItem(
            REPORT_CACHE_KEY
        );

        return null;
    }
}


// ========================================
// PROSES DATA LAPORAN
// ========================================

function processReportData(reports) {

    allReports =
        reports.filter(function (report) {

            return (
                parseReportDate(
                    report.tanggal
                ) !== null
            );
        });


    console.log(
        "[DATA] Total laporan:",
        allReports.length
    );


    console.log(
        "[DATA] Data laporan pertama:",
        allReports[0]
    );


    console.log(
        "[DATA] Report ID pertama:",
        allReports[0]?.reportId
    );


    initializeFilters();

    applyFilters();


}


// ========================================
// INISIALISASI FILTER
// ========================================

function initializeFilters() {
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const years = new Set([currentYear]);

    allReports.forEach(function (report) {
        const date = parseReportDate(report.tanggal);

        if (date) {
            years.add(date.getFullYear());
        }
    });

    // ========================================
    // DAFTAR TAHUN
    // ========================================

    yearFilter.replaceChildren();

    [...years]
        .sort((a, b) => a - b)
        .forEach(function (year) {
            const option = document.createElement("option");

            option.value = String(year);
            option.textContent = String(year);

            yearFilter.appendChild(option);
        });

    // Default bulan dan tahun = sekarang
    monthFilter.value = String(currentMonth);
    yearFilter.value = String(currentYear);

    // ========================================
    // DAFTAR TRAINER
    // ========================================

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

    // ========================================
    // DEFAULT FILTER
    // ========================================

    periodFilter.value = "today";

    monthFilterGroup.hidden = true;
    yearFilterGroup.hidden = true;
}

// ========================================
// FILTER DATA
// ========================================
function applyFilters() {
    const selectedPeriod = periodFilter.value;
    const selectedMonth = Number(monthFilter.value);
    const selectedYear = Number(yearFilter.value);
    const selectedTrainer = trainerFilter.value;

    const now = new Date();

    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    filteredReports = allReports.filter(function (report) {
        const date = parseReportDate(report.tanggal);

        if (!date) return false;

        let matchesPeriod = false;

        // ========================================
        // HARI INI
        // ========================================

        if (selectedPeriod === "today") {
            matchesPeriod =
                date.getFullYear() === todayYear &&
                date.getMonth() + 1 === todayMonth &&
                date.getDate() === todayDay;
        }

        // ========================================
        // BULAN
        // ========================================

        if (selectedPeriod === "month") {
            matchesPeriod =
                date.getFullYear() === selectedYear &&
                date.getMonth() + 1 === selectedMonth;
        }

        // ========================================
        // FILTER TRAINER
        // ========================================

        const matchesTrainer =
            !selectedTrainer ||
            report.trainer === selectedTrainer;

        return matchesPeriod && matchesTrainer;
    });

    reportCurrentPage = 1;

    renderTable();
}



// ========================================
// TAMPILKAN TABEL DAN PAGINATION
// ========================================

function renderTable() {

    const sortedReports =
        [...filteredReports];


    const totalReports =
        sortedReports.length;


    const totalPages =
        Math.ceil(
            totalReports /
            REPORTS_PER_PAGE
        );


    // Pastikan halaman tetap valid
    // setelah filter berubah.
    if (
        totalPages > 0 &&
        reportCurrentPage > totalPages
    ) {

        reportCurrentPage =
            totalPages;
    }


    const startIndex =
        (reportCurrentPage - 1) *
        REPORTS_PER_PAGE;


    const pageReports =
        sortedReports.slice(
            startIndex,
            startIndex +
            REPORTS_PER_PAGE
        );


    tableBody.replaceChildren();


    if (
        pageReports.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );

        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan = 8;


        cell.textContent =
            "Tidak ada laporan untuk filter yang dipilih.";


        row.appendChild(cell);

        tableBody.appendChild(row);

    } else {

        pageReports.forEach(
            function (report) {

                const row =
                    document.createElement(
                        "tr"
                    );


                const values = [

                    report.bulan,

                    formatReportDate(
                        report.tanggal
                    ),

                    report.trainer,

                    report.property,

                    report.taskCategory,

                    report.status,

                    report.komponen,

                    report.detail

                ];


                values.forEach(
                    function (value) {

                        const cell =
                            document.createElement(
                                "td"
                            );


                        cell.textContent =
                            value || "-";


                        row.appendChild(
                            cell
                        );
                    }
                );


                tableBody.appendChild(
                    row
                );
            }
        );
    }


    tableMessage.textContent =
        "Menampilkan " +
        totalReports +
        " laporan sesuai filter.";


    pageInfo.textContent =
        totalPages > 0

            ? "Halaman " +
            reportCurrentPage +
            " dari " +
            totalPages

            : "Halaman 0 dari 0";


    prevButton.disabled =
        reportCurrentPage <= 1;


    nextButton.disabled =
        totalPages === 0 ||
        reportCurrentPage >= totalPages;
}


// ========================================
// EVENT FILTER
// ========================================

periodFilter.addEventListener("change", function () {
    const isMonth = periodFilter.value === "month";

    monthFilterGroup.hidden = !isMonth;
    yearFilterGroup.hidden = !isMonth;

    applyFilters();
});

monthFilter.addEventListener(
    "change",
    applyFilters
);


yearFilter.addEventListener(
    "change",
    applyFilters
);


trainerFilter.addEventListener(
    "change",
    applyFilters
);


// ========================================
// PAGINATION
// ========================================

prevButton.addEventListener(
    "click",
    function () {

        if (reportCurrentPage > 1) {

            reportCurrentPage--;

            renderTable();
        }
    }
);


nextButton.addEventListener(
    "click",
    function () {

        const totalPages =
            Math.ceil(
                filteredReports.length /
                REPORTS_PER_PAGE
            );


        if (
            reportCurrentPage <
            totalPages
        ) {

            reportCurrentPage++;

            renderTable();
        }
    }
);


// ========================================
// TERIMA DATA DARI GOOGLE APPS SCRIPT
// ========================================

window.handleReportData =
    function (result) {

        if (
            !result ||
            !result.success ||
            !Array.isArray(
                result.reports
            )
        ) {

            tableMessage.textContent =
                "Gagal memuat laporan. Silakan muat ulang halaman.";


            tableBody.replaceChildren();


            const row =
                document.createElement(
                    "tr"
                );


            const cell =
                document.createElement(
                    "td"
                );


            cell.colSpan = 8;


            cell.textContent =
                result?.message ||
                "Respons data tidak valid.";


            row.appendChild(cell);

            tableBody.appendChild(row);


            return;
        }


        // ========================================
        // SIMPAN DATA TERBARU KE CACHE
        // ========================================

        saveReportsToCache(
            result.reports
        );


        // ========================================
        // PROSES DATA
        // ========================================

        processReportData(
            result.reports
        );

        refreshButton.disabled = false;

        refreshButton.innerHTML = `
            <i data-lucide="rotate-ccw"></i>
            Refresh Data
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }
    };


// ========================================
// AMBIL DATA TERBARU DARI GOOGLE APPS SCRIPT
// ========================================

function fetchLatestReports() {

    console.log(
        "[SERVER] Mengambil data terbaru dari Apps Script..."
    );


    tableMessage.textContent =
        "Memuat data laporan terbaru...";


    const reportScript =
        document.createElement(
            "script"
        );


    reportScript.src =
        REPORT_DATA_URL +
        "?action=readReports&t=" +
        Date.now();


    reportScript.async = true;


    reportScript.onerror =
        function () {

            tableMessage.textContent =
                "Gagal terhubung ke server. Silakan muat ulang halaman.";
        };


    document.body.appendChild(
        reportScript
    );
}


// ========================================
// LOAD DATA
// CACHE → APPS SCRIPT
// ========================================

function loadReports() {

    const cachedReports =
        getReportsFromCache();


    // ========================================
    // CACHE MASIH VALID
    // ========================================

    if (cachedReports) {

        console.log(
            "[CACHE] Menggunakan data dari browser."
        );


        tableMessage.textContent =
            "Memuat data laporan...";


        processReportData(
            cachedReports
        );


        return;
    }


    // ========================================
    // CACHE TIDAK ADA
    // ATAU SUDAH BERGANTI JAM
    // ========================================

    console.log(
        "[CACHE] Meminta data terbaru dari server."
    );


    fetchLatestReports();
}


// ========================================
// MULAI LOAD DATA
// ========================================

loadReports();


// ========================================
// HELPER TANGGAL LAPORAN
// ========================================

function getTodayReportDate() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
}

function refreshReportData() {
    if (refreshButton.disabled) return;

    refreshButton.disabled = true;

    refreshButton.innerHTML = `
        <i data-lucide="rotate-ccw"></i>
        Memuat...
    `;

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    tableMessage.textContent = "Mengambil data terbaru...";

    const refreshScript = document.createElement("script");

    refreshScript.src =
        REPORT_DATA_URL +
        "?action=readReports&t=" +
        Date.now();

    refreshScript.async = true;

    refreshScript.onerror = function () {
        tableMessage.textContent =
            "Gagal mengambil data terbaru.";

        refreshButton.disabled = false;

        refreshButton.innerHTML = `
            <i data-lucide="rotate-ccw"></i>
            Refresh Data
        `;

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

        refreshScript.remove();
    };

    document.body.appendChild(refreshScript);
}
refreshButton.addEventListener("click", refreshReportData);