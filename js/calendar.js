
document.addEventListener("DOMContentLoaded", function () {

    const calendarGrid = document.getElementById("calendarGrid");
    const calendarMonthTitle = document.getElementById("calendarMonthTitle");

    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    const todayBtn = document.getElementById("todayBtn");

    let currentDate = new Date();



    /*
* ========================================
* DATA SPREADSHEET B
* ========================================
*/
    const CALENDAR_DATA_URL =
        "https://script.google.com/macros/s/AKfycbxMbIqB8v567N0Tuxf7tHc8NndHrBQ4ygBuSQSfS1AP7yXZJkrO8bfBihBpYgsHmsz4dQ/exec";


    /*
    * Data jadwal yang sudah diubah
    * menjadi format yang digunakan Calendar.
    */
    let scheduleData = {};


    /*
    * Daftar trainer dari Spreadsheet.
    */
    let trainerList = [];

    const CALENDAR_CACHE_KEY = "pms_calendar_schedule_cache_v1";
    const CALENDAR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 jam


    function getCalendarCache() {
        try {
            const cached = localStorage.getItem(CALENDAR_CACHE_KEY);

            if (!cached) {
                return null;
            }

            const parsed = JSON.parse(cached);

            if (
                !parsed.timestamp ||
                !parsed.data
            ) {
                return null;
            }

            const cacheAge =
                Date.now() - parsed.timestamp;

            if (cacheAge > CALENDAR_CACHE_TTL) {
                localStorage.removeItem(CALENDAR_CACHE_KEY);
                return null;
            }

            return parsed.data;

        } catch (error) {
            console.warn(
                "Calendar cache tidak dapat dibaca:",
                error
            );

            return null;
        }
    }


    function saveCalendarCache(data) {
        try {
            localStorage.setItem(
                CALENDAR_CACHE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    data: data
                })
            );

        } catch (error) {
            console.warn(
                "Calendar cache tidak dapat disimpan:",
                error
            );
        }
    }

    function updateCalendarCacheStatus() {
        const refreshButton =
            document.getElementById("refreshCalendarData");

        if (!refreshButton) return;

        const headerActions =
            refreshButton.parentElement;

        if (!headerActions) return;

        let status =
            headerActions.querySelector(".calendar-cache-status");

        if (!status) {
            status = document.createElement("span");
            status.className = "calendar-cache-status";

            headerActions.appendChild(status);
        }

        try {
            const cached =
                localStorage.getItem(CALENDAR_CACHE_KEY);

            if (!cached) {
                status.textContent =
                    "Belum pernah diperbarui";

                return;
            }

            const parsed =
                JSON.parse(cached);

            if (!parsed.timestamp) {
                status.textContent =
                    "Belum pernah diperbarui";

                return;
            }

            const date =
                new Date(parsed.timestamp);

            status.textContent =
                "Terakhir diperbarui: " +
                date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }) +
                ", " +
                date.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                });

        } catch (error) {
            status.textContent =
                "Status pembaruan tidak tersedia";
        }
    }





    function loadCalendarJsonp() {
        return new Promise(function (resolve, reject) {

            const callbackName =
                "calendarCallback_" + Date.now();

            const script =
                document.createElement("script");

            const requestUrl =
                CALENDAR_DATA_URL +
                "?callback=" +
                encodeURIComponent(callbackName) +
                "&nocache=" +
                Date.now();

            let finished = false;

            const cleanup = function () {

                if (finished) return;

                finished = true;

                clearTimeout(timeout);

                delete window[callbackName];

                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };

            window[callbackName] =
                function (data) {

                    cleanup();

                    resolve(data);
                };

            script.src = requestUrl;

            script.onerror =
                function () {

                    cleanup();

                    reject(
                        new Error(
                            "Gagal menghubungi server jadwal."
                        )
                    );
                };

            const timeout =
                setTimeout(function () {

                    cleanup();

                    reject(
                        new Error(
                            "Server jadwal tidak merespons."
                        )
                    );

                }, 15000);

            document.head.appendChild(script);
        });
    }
    function showCalendarLoading() {
        const calendarCard = document.querySelector(".calendar-card");

        if (!calendarCard) return;

        let overlay = calendarCard.querySelector(".calendar-loading-overlay");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "calendar-loading-overlay";

            overlay.innerHTML = `
            <div class="calendar-loading-content">
                <div class="calendar-loading-spinner"></div>

                <div class="calendar-loading-title">
                    Memperbarui jadwal...
                </div>

                <div class="calendar-loading-text">
                    Kalender sedang disinkronkan
                </div>
            </div>
        `;

            calendarCard.appendChild(overlay);
        }

        requestAnimationFrame(function () {
            overlay.classList.add("is-visible");
        });
    }

    function hideCalendarLoading() {
        const overlay =
            document.querySelector(".calendar-loading-overlay");

        if (!overlay) return;

        overlay.classList.remove("is-visible");
    }

    function showCalendarError(message) {
        console.error("Calendar Error:", message);

        alert(message);
    }



    /*
    * ========================================
    * LOAD DATA DARI GOOGLE SPREADSHEET
    * ========================================
    */
    async function loadScheduleData() {

        const cachedData = getCalendarCache();

        // =====================================================
        // 1. JIKA CACHE MASIH VALID
        // =====================================================

        if (cachedData) {

            console.log(
                "Calendar menggunakan data dari browser cache."
            );

            trainerList =
                cachedData.trainers || [];

            scheduleData =
                cachedData.scheduleData || {};


            renderCalendar();
            updateCalendarCacheStatus();

            return;
        }


        // =====================================================
        // 2. JIKA BELUM ADA CACHE
        //    AMBIL DATA DARI SERVER
        // =====================================================

        try {

            showCalendarLoading();

            console.log(
                "Calendar mengambil data terbaru dari server..."
            );

            const result =
                await loadCalendarJsonp();

            if (
                !result ||
                !result.success
            ) {
                throw new Error(
                    result?.error ||
                    "Data jadwal tidak valid."
                );
            }


            // -------------------------------------------------
            // Simpan daftar trainer
            // -------------------------------------------------

            trainerList =
                result.trainers || [];


            // -------------------------------------------------
            // Ubah data server menjadi format Calendar
            // -------------------------------------------------

            const newScheduleData = {};

            (result.data || []).forEach(
                function (dayData) {

                    newScheduleData[
                        dayData.date
                    ] =
                        (dayData.trainers || [])
                            .map(
                                function (trainer) {

                                    return {
                                        trainer:
                                            trainer.name,

                                        shift:
                                            trainer.code,

                                        label:
                                            trainer.label
                                    };

                                }
                            );

                }
            );


            scheduleData =
                newScheduleData;


            // -------------------------------------------------
            // Simpan ke browser cache
            // -------------------------------------------------

            saveCalendarCache({
                trainers:
                    trainerList,

                scheduleData:
                    scheduleData,

            });


            console.log(
                "Data Calendar berhasil disimpan ke browser cache."
            );


            renderCalendar();

        } catch (error) {

            console.error(
                "Calendar Data Error:",
                error
            );


            // =================================================
            // FALLBACK:
            // Jika server gagal tetapi cache lama tersedia
            // =================================================

            const oldCache =
                getCalendarCache();


            if (oldCache) {

                console.warn(
                    "Server gagal. Menggunakan cache Calendar."
                );

                trainerList =
                    oldCache.trainers || [];

                scheduleData =
                    oldCache.scheduleData || {};

                renderCalendar();

                return;
            }


            showCalendarError(
                "Gagal memuat jadwal: " +
                error.message
            );

        }
    }


    /*
    * ========================================
    * FORMAT DATE
    * ========================================
    */

    function formatDateKey(year, month, day) {

        const monthString = String(month + 1).padStart(2, "0");
        const dayString = String(day).padStart(2, "0");

        return `${year}-${monthString}-${dayString}`;
    }


    /*
    * ========================================
    * RENDER CALENDAR
    * ========================================
    */

    function renderCalendar() {

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthName = currentDate.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric"
        });

        calendarMonthTitle.textContent =
            monthName.charAt(0).toUpperCase() + monthName.slice(1);


        calendarGrid.innerHTML = "";


        /*
        * Hari pertama bulan
        */

        const firstDay = new Date(year, month, 1);

        /*
        * JS:
        * Minggu = 0
        * Senin  = 1
        *
        * Kita ingin:
        * Senin = 0
        */

        let startingDay = firstDay.getDay();

        startingDay = startingDay === 0
            ? 6
            : startingDay - 1;


        /*
        * Jumlah hari dalam bulan
        */

        const daysInMonth = new Date(
            year,
            month + 1,
            0
        ).getDate();


        /*
        * Cell kosong sebelum tanggal 1
        */

        for (let i = 0; i < startingDay; i++) {

            const emptyCell = document.createElement("div");

            emptyCell.className = "calendar-day is-empty";

            calendarGrid.appendChild(emptyCell);
        }


        /*
        * Buat tanggal
        */

        for (let day = 1; day <= daysInMonth; day++) {

            const dayCell = document.createElement("div");

            dayCell.className = "calendar-day";


            const dateKey = formatDateKey(
                year,
                month,
                day
            );


            /*
            * Cek apakah hari ini
            */

            const today = new Date();

            const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();


            if (isToday) {
                dayCell.classList.add("is-today");
            }


            /*
            * Nomor tanggal
            */

            const dayNumber = document.createElement("div");

            dayNumber.className = "calendar-day-number";

            dayNumber.textContent = day;


            dayCell.appendChild(dayNumber);


            /*
            * Daftar shift
            */

            const shiftContainer = document.createElement("div");

            shiftContainer.className = "calendar-shifts";


            const schedules =
                scheduleData[dateKey] || [];


            schedules.slice(0, 4).forEach(schedule => {

                const shiftItem = document.createElement("div");

                shiftItem.className =
                    "calendar-shift calendar-shift-" +
                    schedule.shift.toLowerCase();


                const shiftCode = document.createElement("span");

                shiftCode.className = "calendar-shift-code";

                shiftCode.textContent = schedule.shift;


                const trainerName = document.createElement("span");

                trainerName.className = "calendar-shift-name";

                trainerName.textContent = schedule.trainer;


                shiftItem.appendChild(shiftCode);
                shiftItem.appendChild(trainerName);


                shiftContainer.appendChild(shiftItem);
            });


            /*
            * Jika lebih dari 4 trainer
            */

            if (schedules.length > 4) {

                const more = document.createElement("div");

                more.className = "calendar-more";

                more.textContent =
                    `+${schedules.length - 4} lainnya`;

                shiftContainer.appendChild(more);
            }


            dayCell.appendChild(shiftContainer);


            calendarGrid.appendChild(dayCell);
        }


        /*
        * Isi cell kosong setelah tanggal terakhir
        */

        const totalCells =
            startingDay + daysInMonth;

        const remainingCells =
            (7 - (totalCells % 7)) % 7;


        for (let i = 0; i < remainingCells; i++) {

            const emptyCell = document.createElement("div");

            emptyCell.className = "calendar-day is-empty";

            calendarGrid.appendChild(emptyCell);
        }


        /*
        * Refresh icon Lucide
        */

        if (window.lucide) {
            lucide.createIcons();
        }
    }


    /*
    * ========================================
    * UPDATE DATA MANUAL
    * ========================================
    */

    const refreshCalendarButton =
        document.getElementById("refreshCalendarData");

    if (refreshCalendarButton) {

        refreshCalendarButton.addEventListener(
            "click",
            async function () {
                refreshCalendarButton.disabled = true;

                refreshCalendarButton.classList.add("is-loading");

                refreshCalendarButton.innerHTML =
                    `<i data-lucide="loader-circle"></i> Memperbarui...`;

                if (window.lucide) {
                    lucide.createIcons();
                }

                showCalendarLoading();

                try {

                    /*
                    * HAPUS CACHE LAMA
                    */
                    localStorage.removeItem(
                        CALENDAR_CACHE_KEY
                    );

                    /*
                    * AMBIL DATA LANGSUNG DARI SERVER
                    */
                    const result =
                        await loadCalendarJsonp();

                    if (
                        !result ||
                        !result.success
                    ) {
                        throw new Error(
                            result?.error ||
                            "Data jadwal tidak valid."
                        );
                    }

                    /*
                    * UPDATE TRAINER
                    */
                    trainerList =
                        result.trainers || [];

                    /*
                    * UPDATE JADWAL
                    */
                    const newScheduleData = {};

                    (result.data || []).forEach(
                        function (dayData) {

                            newScheduleData[
                                dayData.date
                            ] =
                                (dayData.trainers || [])
                                    .map(
                                        function (trainer) {

                                            return {
                                                trainer:
                                                    trainer.name,

                                                shift:
                                                    trainer.code,

                                                label:
                                                    trainer.label
                                            };

                                        }
                                    );
                        }
                    );

                    scheduleData =
                        newScheduleData;

                    /*
                    * SIMPAN DATA BARU
                    */
                    saveCalendarCache({
                        trainers:
                            trainerList,

                        scheduleData:
                            scheduleData
                    });

                    updateCalendarCacheStatus();

                    /*
                    * RENDER ULANG
                    */
                    renderCalendar();

                    console.log(
                        "Calendar berhasil mengambil data TERBARU."
                    );

                } catch (error) {

                    console.error(
                        "Calendar Update Error:",
                        error
                    );

                    alert(
                        "Gagal memperbarui data jadwal.\n\n" +
                        error.message
                    );

                } finally {

                    hideCalendarLoading();

                    refreshCalendarButton.disabled = false;

                    refreshCalendarButton.classList.remove("is-loading");

                    refreshCalendarButton.innerHTML =
                        `<i data-lucide="rotate-ccw"></i> Update Data`;

                    if (window.lucide) {
                        lucide.createIcons();
                    }
                }
            }
        );
    }






    /*
    * ========================================
    * BULAN SEBELUMNYA
    * ========================================
    */

    prevMonthBtn.addEventListener("click", function () {
        currentDate.setDate(1);

        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        renderCalendar();
    });


    /*
    * ========================================
    * BULAN BERIKUTNYA
    * ========================================
    */

    nextMonthBtn.addEventListener("click", function () {
        currentDate.setDate(1);

        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        renderCalendar();
    });


    /*
    * ========================================
    * TODAY
    * ========================================
    */

    todayBtn.addEventListener("click", function () {

        currentDate = new Date();

        renderCalendar();
    });

    loadScheduleData();

});
