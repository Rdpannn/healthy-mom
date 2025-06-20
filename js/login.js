import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://qfxrlwnkvuyiaggftxgx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHJsd25rdnV5aWFnZ2Z0eGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzg5OTAsImV4cCI6MjA2NTkxNDk5MH0.oBQy2vxIdwaiM7QuDk0iFnYYhwx4iqFe3476ed3lw_E"
);

// Fungsi update UI berdasarkan status auth
function updateUI(user) {
  const greeting = document.getElementById("user-greeting");
  const userName = document.getElementById("user-name");
  const authButtons = document.getElementById("auth-buttons");
  const logoutBtn = document.getElementById("logout-wrapper");

  if (user) {
    // Ambil display name dari user metadata
    const displayName =
      user.user_metadata?.full_name || user.email || "Pengguna";

    // Update UI untuk user yang login
    userName.textContent = displayName;
    greeting.classList.remove("d-none");
    greeting.style.display = "flex"; // Pastikan tidak ada konflik dengan inline style
    authButtons.classList.add("d-none");
    logoutBtn.classList.remove("d-none");
    logoutBtn.style.display = "block"; // Pastikan tidak ada konflik dengan inline style
  } else {
    // Update UI untuk user yang logout
    greeting.classList.add("d-none");
    greeting.style.display = "none";
    authButtons.classList.remove("d-none");
    logoutBtn.classList.add("d-none");
    logoutBtn.style.display = "none";
  }
}

// Cek status auth saat pertama kali load
async function checkAuth() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  updateUI(user);
}

// Event listener untuk perubahan state auth
supabase.auth.onAuthStateChange((event, session) => {
  updateUI(session?.user);
});

// Tombol Login
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "https://rdpannn.github.io/healthy-mom/",
  },
});

// Tombol Sign Up
document.getElementById("signup-btn")?.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
  });
});

// Tombol Logout
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://rdpannn.github.io/healthy-mom/",
    },
  });
});

// Jalankan saat halaman dibuka
checkAuth();
