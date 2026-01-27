const CONFIG = {
  API_BASE_URL: "",
  VENMO_USERNAME: "Anibee-Zingalis",
  DEFAULT_FUNDS: [
    {
      fund_id: "stairs",
      name: "Back Steps",
      description: "Safe, sturdy steps for the patio entrance.",
      goal: 1500,
      current: 825,
    },
    {
      fund_id: "mower",
      name: "Lawn Mower",
      description: "Keep the yard tidy all season long.",
      goal: 700,
      current: 300,
    },
    {
      fund_id: "paint",
      name: "Living Room Paint",
      description: "Warm, cozy color for our main gathering space.",
      goal: 450,
      current: 120,
    },
  ],
};

const fundsGrid = document.querySelector("#funds-grid");
const template = document.querySelector("#fund-card-template");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const buildVenmoUrl = (fundName, amount) => {
  const note = `Housewarming - ${fundName.toUpperCase()}`;
  const params = new URLSearchParams({
    txn: "pay",
    amount: amount.toString(),
    note,
  });

  return `https://venmo.com/${CONFIG.VENMO_USERNAME}?${params.toString()}`;
};

const updateProgress = (card, fund) => {
  const percent = Math.min(100, Math.round((fund.current / fund.goal) * 100));
  const progressBar = card.querySelector(".card__progress-bar");
  progressBar.style.setProperty("--progress", `${percent}%`);
  progressBar.setAttribute("aria-valuenow", percent.toString());
  progressBar.setAttribute("aria-valuemax", fund.goal.toString());
  progressBar.setAttribute("aria-valuetext", `${percent}% funded`);

  card.querySelector(
    ".card__progress-amount"
  ).textContent = `${formatCurrency(fund.current)} pledged`;
  card.querySelector(
    ".card__progress-goal"
  ).textContent = `${formatCurrency(fund.goal)} goal`;
};

const renderFund = (fund) => {
  const card = template.content.cloneNode(true);
  const cardRoot = card.querySelector(".card");
  card.querySelector(".card__title").textContent = fund.name;
  card.querySelector(".card__description").textContent = fund.description;

  const form = card.querySelector(".card__form");
  const status = card.querySelector(".card__status");

  updateProgress(cardRoot, fund);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    const formData = new FormData(form);
    const amount = Number(formData.get("amount"));
    const name = formData.get("name").toString().trim();
    const message = formData.get("message").toString().trim();

    if (!amount || amount <= 0) {
      status.textContent = "Please enter a valid amount.";
      return;
    }

    const payload = {
      fund_id: fund.fund_id,
      amount,
      name: name || undefined,
      message: message || undefined,
    };

    try {
      if (CONFIG.API_BASE_URL) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/pledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Unable to record pledge.");
        }

        const data = await response.json();
        window.location.href = data.redirect_url;
        return;
      }

      const venmoUrl = buildVenmoUrl(fund.name, amount);
      fund.current += amount;
      updateProgress(cardRoot, fund);
      status.textContent = "Redirecting you to Venmo...";
      window.location.href = venmoUrl;
    } catch (error) {
      status.textContent = "We couldn't connect right now. Please try again.";
    }
  });

  fundsGrid.appendChild(card);
};

const loadFunds = async () => {
  if (!CONFIG.API_BASE_URL) {
    CONFIG.DEFAULT_FUNDS.forEach(renderFund);
    return;
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/funds`);
    const data = await response.json();
    data.forEach(renderFund);
  } catch (error) {
    CONFIG.DEFAULT_FUNDS.forEach(renderFund);
  }
};

loadFunds();
