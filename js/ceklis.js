import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase init
const supabase = createClient(
  "https://qfxrlwnkvuyiaggftxgx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHJsd25rdnV5aWFnZ2Z0eGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzg5OTAsImV4cCI6MjA2NTkxNDk5MH0.oBQy2vxIdwaiM7QuDk0iFnYYhwx4iqFe3476ed3lw_E"
);

// Global state
let selectedDate = null;
let selectedTime = null;

// Inisialisasi Flatpickr
document.addEventListener("DOMContentLoaded", () => {
  flatpickr("#inline-calendar", {
    inline: true,
    defaultDate: "today",
    dateFormat: "Y-m-d",
    onChange: (selectedDates, dateStr) => {
      selectedDate = dateStr;
      checkFormValidity();
    },
    onReady: (_, dateStr) => {
      selectedDate = dateStr;
      checkFormValidity();
    },
  });

  flatpickr("#inline-time", {
    enableTime: true,
    noCalendar: true,
    inline: true,
    dateFormat: "H:i",
    time_24hr: true,
    defaultHour: 8,
    defaultMinute: 0,
    onChange: (selectedDates, timeStr) => {
      selectedTime = timeStr;
      checkFormValidity();
    },
    onReady: (_, __, fp) => {
      selectedTime = fp.formatDate(fp.selectedDates[0], "H:i");
      checkFormValidity();
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const inputTanggal = document.getElementById("tanggal-hari-ini");
  if (inputTanggal) inputTanggal.value = today;

  loadRiwayat();
});

function checkFormValidity() {
  const btn = document.querySelector('#form-jadwal button[type="submit"]');
  if (btn) {
    btn.disabled = !(selectedDate && selectedTime);
  }
}

// Simpan ke Supabase & buka Google Calendar manual
document.getElementById("form-jadwal").addEventListener("submit", async (e) => {
  e.preventDefault();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return alert("Silakan login terlebih dahulu.");

  if (!selectedDate || !selectedTime) {
    return alert("Silakan pilih tanggal dan waktu terlebih dahulu.");
  }

  const datetime = new Date(`${selectedDate}T${selectedTime}`);

  const { error } = await supabase.from("jadwal_konsumsi").insert({
    user_email: user.email,
    tanggal: selectedDate,
    waktu: selectedTime,
    status: "Terjadwal",
  });

  if (error) return alert("Gagal simpan jadwal: " + error.message);

  const isoTime = datetime.toISOString();
  const endTime = new Date(datetime.getTime() + 15 * 60000).toISOString();

  const calTitle = encodeURIComponent(
    "Hey Moms, 30 Menit lagi jadwal kamu minum tablet FE!"
  );
  const calDetails = encodeURIComponent(
    "Yuk, jangan lupa minum tablet FE hari ini, Bunda! Ini penting untuk menjaga kesehatan Bunda dan si kecil. Setelah itu, upload fotonya di HealthyMom ya! ❤️"
  );

  const calURL = `https://www.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${
    isoTime.replace(/[-:]/g, "").split(".")[0]
  }Z/${endTime.replace(/[-:]/g, "").split(".")[0]}Z&details=${calDetails}`;

  window.open(calURL, "_blank");
  alert("Jadwal berhasil dibuat. Semangat, Bunda! 💪");
});

// Upload bukti foto konsumsi hari ini (tanpa pilih jadwal)
document.getElementById("form-upload").addEventListener("submit", async (e) => {
  e.preventDefault();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return alert("Silakan login terlebih dahulu.");

  const today = new Date().toISOString().split("T")[0];
  const waktuSekarang = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Cek apakah sudah pernah upload hari ini
  const { data: existing, error: checkError } = await supabase
    .from("jadwal_konsumsi")
    .select("*")
    .eq("user_email", user.email)
    .eq("tanggal", today)
    .not("bukti_url", "is", null)
    .limit(1);

  if (checkError) return alert("Gagal cek data: " + checkError.message);
  if (existing.length > 0) {
    return alert(
      "Kamu sudah upload bukti konsumsi hari ini. Silakan kembali besok 😊"
    );
  }

  const file = document.getElementById("bukti-foto").files[0];
  if (!file) return alert("Pilih foto terlebih dahulu.");

  const filename = `${user.id}_${Date.now()}_${file.name}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("fotokonsumsi")
      .upload(filename, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("fotokonsumsi").getPublicUrl(filename);

    const { data: existingRow, error: rowError } = await supabase
      .from("jadwal_konsumsi")
      .select("*")
      .eq("user_email", user.email)
      .eq("tanggal", today)
      .limit(1);

    if (rowError) throw rowError;

    if (existingRow.length > 0) {
      await supabase
        .from("jadwal_konsumsi")
        .update({
          status: "Terkonfirmasi",
          bukti_url: publicUrl,
        })
        .eq("user_email", user.email)
        .eq("tanggal", today);
    } else {
      await supabase.from("jadwal_konsumsi").insert({
        user_email: user.email,
        tanggal: today,
        waktu: waktuSekarang,
        status: "Terkonfirmasi",
        bukti_url: publicUrl,
      });
    }

    alert("Foto berhasil diupload sebagai bukti konsumsi hari ini!");
    document.getElementById("form-upload").reset();
    loadRiwayat();
  } catch (error) {
    console.error("Upload error:", error);
    alert("Gagal upload foto: " + error.message);
  }
});

// Load Riwayat Konsumsi
async function loadRiwayat() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("jadwal_konsumsi")
    .select("*")
    .eq("user_email", user.email)
    .not("bukti_url", "is", null)
    .order("tanggal", { ascending: false });

  const body = document.getElementById("riwayat-body");
  body.innerHTML = "";

  if (error) return console.error("Error loading riwayat:", error);

  if (data.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4">
          <i class="fas fa-info-circle me-2"></i>
          Belum ada riwayat konsumsi yang tercatat
        </td>
      </tr>`;
    return;
  }

  for (const item of data) {
    const fotoUrl = item.bukti_url.startsWith("http")
      ? item.bukti_url
      : `https://qfxrlwnkvuyiaggftxgx.supabase.co/storage/v1/object/public/fotokonsumsi/${item.bukti_url}`;

    const row = `
      <tr>
        <td>${item.tanggal}</td>
        <td>${item.waktu}</td>
        <td><span class="badge bg-success">Terkonfirmasi</span></td>
        <td>
          <div class="bukti-foto-container">
            <img src="${fotoUrl}" alt="Bukti konsumsi" class="bukti-foto-thumbnail" loading="lazy">
            <a href="${fotoUrl}" target="_blank" class="btn btn-sm btn-primary btn-view-photo mt-1">
              <i class="fas fa-search-plus me-1"></i> Lihat
            </a>
          </div>
        </td>
      </tr>`;
    body.innerHTML += row;
  }
}

// Tab switching
document.getElementById("riwayat-tab").addEventListener("click", loadRiwayat);
