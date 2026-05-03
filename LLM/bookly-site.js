(function () {
  const savedMood = localStorage.getItem("booklyMood") || "night";
  document.body.dataset.mood = savedMood;

  document.querySelectorAll("[data-set-mood]").forEach((button) => {
    if (button.dataset.setMood === savedMood) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      const mood = button.dataset.setMood || "night";
      localStorage.setItem("booklyMood", mood);
      document.body.dataset.mood = mood;
      document.querySelectorAll("[data-set-mood]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
})();
