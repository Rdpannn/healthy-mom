document.addEventListener("DOMContentLoaded", function () {
  const playBtn = document.getElementById("play-video-btn");
  const videoModal = new bootstrap.Modal(
    document.getElementById("video-modal")
  );
  const videoEl = document.getElementById("educational-video");

  playBtn.addEventListener("click", () => {
    videoModal.show();
    videoEl.play();
  });

  // Pause video saat modal ditutup
  document
    .getElementById("video-modal")
    .addEventListener("hidden.bs.modal", () => {
      videoEl.pause();
      videoEl.currentTime = 0;
    });
});
