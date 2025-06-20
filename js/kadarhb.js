import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://qfxrlwnkvuyiaggftxgx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHJsd25rdnV5aWFnZ2Z0eGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzg5OTAsImV4cCI6MjA2NTkxNDk5MH0.oBQy2vxIdwaiM7QuDk0iFnYYhwx4iqFe3476ed3lw_E"
);

// Global untuk dua tanggal
let tanggalPre = null;
let tanggalPost = null;

document.addEventListener("DOMContentLoaded", () => {
  // Kalender Pre-Test
  flatpickr("#calendar-pre", {
    inline: true,
    dateFormat: "Y-m-d",
    onChange: (selectedDates, dateStr) => {
      tanggalPre = dateStr;
      document.getElementById("tanggal-pre").value = dateStr;
    },
  });

  // Kalender Post-Test
  flatpickr("#calendar-post", {
    inline: true,
    dateFormat: "Y-m-d",
    onChange: (selectedDates, dateStr) => {
      tanggalPost = dateStr;
      document.getElementById("tanggal-post").value = dateStr;
    },
  });

  loadRiwayatHB();
});

// Simpan data HB (kedua tanggal disimpan ke Supabase)
document
  .getElementById("form-kadarhb")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("Silakan login terlebih dahulu.");

    const preValue = parseFloat(document.getElementById("pre-test").value);
    const postValue = parseFloat(document.getElementById("post-test").value);

    if (isNaN(preValue) && isNaN(postValue)) {
      return alert("Minimal isi salah satu nilai kadar HB.");
    }

    const updates = [];

    if (!isNaN(preValue) && tanggalPre) {
      updates.push(
        supabase.from("kadar_hb").upsert(
          {
            user_email: user.email,
            tanggal_input: tanggalPre,
            pre_test_hb: preValue,
          },
          { onConflict: ["user_email", "tanggal_input"] }
        )
      );
    }

    if (!isNaN(postValue) && tanggalPost) {
      updates.push(
        supabase.from("kadar_hb").upsert(
          {
            user_email: user.email,
            tanggal_input: tanggalPost,
            post_test_hb: postValue,
          },
          { onConflict: ["user_email", "tanggal_input"] }
        )
      );
    }

    const results = await Promise.all(updates);
    const error = results.find((r) => r.error);

    if (error) {
      alert("Gagal menyimpan data: " + error.error.message);
    } else {
      alert("Data HB berhasil disimpan!");
      document.getElementById("form-kadarhb").reset();
      tanggalPre = null;
      tanggalPost = null;
      loadRiwayatHB();
    }
  });

// Tampilkan riwayat kadar HB
async function loadRiwayatHB() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("kadar_hb")
    .select("*")
    .eq("user_email", user.email)
    .order("tanggal_input", { ascending: false });

  const body = document.getElementById("riwayat-hb-body");
  body.innerHTML = "";

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!data || data.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-4">
          <i class="fas fa-info-circle me-2"></i>
          Belum ada data kadar HB
        </td>
      </tr>`;
    return;
  }

  data.forEach((item) => {
    const row = `
      <tr>
        <td>${item.tanggal_input}</td>
        <td>${item.pre_test_hb ?? "-"}</td>
        <td>${item.post_test_hb ?? "-"}</td>
      </tr>`;
    body.innerHTML += row;
  });
}

document.getElementById("riwayat-tab").addEventListener("click", loadRiwayatHB);
