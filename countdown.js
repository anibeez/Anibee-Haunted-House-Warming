const targetDate = new Date("2024-10-24T14:00:00");

const updateCountdown = () => {
  const now = new Date();
  const totalMs = targetDate - now;

  const days = Math.max(0, Math.floor(totalMs / (1000 * 60 * 60 * 24)));
  const hours = Math.max(
    0,
    Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  );
  const minutes = Math.max(
    0,
    Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  );

  const daysEl = document.querySelector("#countdown-days");
  const hoursEl = document.querySelector("#countdown-hours");
  const minutesEl = document.querySelector("#countdown-minutes");

  if (!daysEl || !hoursEl || !minutesEl) {
    return;
  }

  daysEl.textContent = days.toString();
  hoursEl.textContent = hours.toString().padStart(2, "0");
  minutesEl.textContent = minutes.toString().padStart(2, "0");
};

updateCountdown();
setInterval(updateCountdown, 60000);
