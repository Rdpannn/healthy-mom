import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Ganti dengan URL live GitHub Pages
const REDIRECT_URL = "https://rdpannn.github.io/healthy-mom/";

const supabase = createClient(
  "https://qfxrlwnkvuyiaggftxgx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHJsd25rdnV5aWFnZ2Z0eGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzg5OTAsImV4cCI6MjA2NTkxNDk5MH0.oBQy2vxIdwaiM7QuDk0iFnYYhwx4iqFe3476ed3lw_E"
);

function updateUI(user) {
  const greeting = document.getElementById("user-greeting");
  const userName = document.getElementById("user-name");
  const authButtons = document.getElementById("auth-buttons");
  const logoutBtn = document.getElementById("logout-wrapper");

  // Tambahkan semua hero button containers (slide 1 & slide 2)
  const heroButtons = [
    document.getElementById("hero-auth-buttons"),
    document.getElementById("hero-auth-buttons-2"),
  ];

  if (user) {
    const displayName =
      user.user_metadata?.full_name || user.email || "Pengguna";
    userName.textContent = displayName;

    greeting.classList.remove("d-none");
    greeting.style.display = "flex";
    authButtons.classList.add("d-none");
    logoutBtn.classList.remove("d-none");
    logoutBtn.style.display = "block";

    // Sembunyikan semua tombol hero
    heroButtons.forEach((el) => el && (el.style.display = "none"));
  } else {
    greeting.classList.add("d-none");
    greeting.style.display = "none";
    authButtons.classList.remove("d-none");
    logoutBtn.classList.add("d-none");
    logoutBtn.style.display = "none";

    // Tampilkan tombol hero kalau belum login
    heroButtons.forEach((el) => el && (el.style.display = "flex"));
  }
}

async function checkAuth() {
  await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  updateUI(user);
}

// Listener perubahan status auth
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") updateUI(session?.user);
  else if (event === "SIGNED_OUT") updateUI(null);
});

// Semua tombol login/sign-up (navbar dan hero)
[
  "login-btn",
  "signup-btn",
  "login-btn-hero",
  "signup-btn-hero",
  "login-btn-hero-2",
  "signup-btn-hero-2",
].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_URL,
      },
    });
  });
});

// Tombol logout
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

// Jalankan saat halaman dimuat
checkAuth();
