import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import flatpickr from "https://cdn.jsdelivr.net/npm/flatpickr/+esm";

// Initialize Supabase client
const supabaseUrl = "https://qfxrlwnkvuyiaggftxgx.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHJsd25rdnV5aWFnZ2Z0eGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzg5OTAsImV4cCI6MjA2NTkxNDk5MH0.oBQy2vxIdwaiM7QuDk0iFnYYhwx4iqFe3476ed3lw_E";
const supabase = createClient(supabaseUrl, supabaseKey);

let selectedDate = null;

document.addEventListener("DOMContentLoaded", async function () {
  // Inisialisasi kalender
  initCalendar();

  // Setup tombol video
  setupVideoModal();

  // Cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await loadRiwayatMelody();
    setupUploadForm();
  } else {
    const tbody = document.getElementById("melody-riwayat-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center py-4">
            <div class="alert alert-warning">
              Silakan <a href="#" id="login-link" class="alert-link">login</a> untuk melihat riwayat.
            </div>
          </td>
        </tr>
      `;
      document.getElementById("login-link")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "login.html";
      });
    }
  }
});

function setupVideoModal() {
  const playBtn = document.getElementById("play-video-btn");
  const videoModalEl = document.getElementById("video-modal");
  const videoModal = new bootstrap.Modal(videoModalEl);
  const video = document.getElementById("educational-video");

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      videoModal.show();
      setTimeout(() => video?.play(), 300); // Delay kecil agar modal sempat terbuka
    });
  }

  videoModalEl?.addEventListener("hidden.bs.modal", () => {
    video?.pause();
    video.currentTime = 0;
  });
}

function setupUploadForm() {
  document
    .getElementById("form-upload-video")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleUpload();
    });
}

async function handleUpload() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Silakan login terlebih dahulu");

    const fileInput = document.getElementById("foto-video");
    if (!fileInput?.files?.length)
      throw new Error("Pilih foto terlebih dahulu");

    const file = fileInput.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `melody_${user.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("fotovideo")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("fotovideo").getPublicUrl(fileName);

    const { error: dbError } = await supabase.from("riwayat_video").insert({
      user_email: user.email,
      tanggal: selectedDate || new Date().toISOString().split("T")[0],
      bukti_foto: publicUrl,
    });

    if (dbError) throw dbError;

    alert("Bukti berhasil diupload!");
    document.getElementById("form-upload-video").reset();
    await loadRiwayatMelody();
  } catch (error) {
    console.error("Upload error:", error);
    alert(`Gagal upload: ${error.message}`);
  }
}

function initCalendar() {
  const calendarEl = document.getElementById("calendar-upload");
  if (calendarEl) {
    flatpickr(calendarEl, {
      inline: true,
      defaultDate: "today",
      dateFormat: "Y-m-d",
      onChange: (_, dateStr) => {
        selectedDate = dateStr;
      },
      onReady: (_, dateStr) => {
        selectedDate = dateStr;
      },
    });
  }
}

async function loadRiwayatMelody() {
  try {
    const tbody = document.getElementById("melody-riwayat-body");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Memuat data...</p>
        </td>
      </tr>
    `;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("riwayat_video")
      .select("*")
      .eq("user_email", user.email)
      .order("tanggal", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center py-4">
            <i class="fas fa-info-circle text-muted"></i>
            <p class="mt-2">Belum ada riwayat gerakan.</p>
          </td>
        </tr>
      `;
      return;
    }

    let rowsHTML = "";
    for (const item of data) {
      let imageUrl = item.bukti_foto;
      if (!imageUrl.startsWith("http")) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("fotovideo").getPublicUrl(imageUrl);
        imageUrl = publicUrl;
      }

      rowsHTML += `
        <tr>
          <td class="align-middle">${formatDate(item.tanggal)}</td>
          <td class="align-middle">
            <div class="d-flex flex-column align-items-center">
              <img src="${imageUrl}" 
                   alt="Bukti gerakan" 
                   class="img-thumbnail" 
                   style="max-width: 150px; max-height: 150px;"
                   onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=Gambar+Tidak+Tersedia'"/>
              <a href="${imageUrl}" 
                 target="_blank" 
                 class="btn btn-sm btn-outline-primary mt-2">
                <i class="fas fa-expand me-1"></i> Lihat Full
              </a>
            </div>
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHTML;
  } catch (error) {
    console.error("Error loading history:", error);
    const tbody = document.getElementById("melody-riwayat-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center py-4">
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Gagal memuat data: ${error.message}
            </div>
          </td>
        </tr>
      `;
    }
  }
}

function formatDate(dateString) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("id-ID", options);
}
