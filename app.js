const CONFIG = {
  VENMO_USERNAME: "Anibee-Zingalis",
  DEFAULT_FUNDS: [
    {
      fund_id: "stairs",
      name: "Back Stairs",
      description: "Safe, sturdy steps for the patio entrance.",
      image: "src/media/images/gift_stair.png",
    },
    {
      fund_id: "snowblower",
      name: "Snow Blower",
      description: "Clear the driveway when the winter ghosts roll in.",
      image: "src/media/images/gift_snowblower.png",
    },
    {
      fund_id: "outlets",
      name: "Basement Outlets",
      description: "Extra outlets for cozy movie nights downstairs.",
      image: "src/media/images/gift_outlets.png",
    },
    {
      fund_id: "mower",
      name: "Lawn Mower",
      description: "Keep the yard tidy all season long.",
      image: "src/media/images/gift_lawnmower.png",
    },
    {
      fund_id: "pets",
      name: "General Pet Care",
      description: "Feeding, Cleaning, and Homing the little beasts.",
      image: "src/media/images/gift_pet.png",
    },
  ],
};

const fundsGrid = document.querySelector("#funds-grid");
const template = document.querySelector("#fund-card-template");

const buildVenmoUrl = (fundName, amount) => {
  const note = `Housewarming - ${fundName.toUpperCase()}`;
  const params = new URLSearchParams({
    txn: "pay",
    amount: amount.toString(),
    note,
  });

  return `https://venmo.com/${CONFIG.VENMO_USERNAME}?${params.toString()}`;
};

const renderFund = (fund) => {
  const card = template.content.cloneNode(true);
  card.querySelector(".card__title").textContent = fund.name;
  card.querySelector(".card__description").textContent = fund.description;

  const form = card.querySelector(".card__form");
  const status = card.querySelector(".card__status");
  const toggle = card.querySelector(".gift-card__toggle");
  const image = card.querySelector(".gift-card__image");

  if (fund.image) {
    image.src = fund.image;
    image.alt = `${fund.name} illustration`;
  } else {
    image.remove();
  }

  toggle.addEventListener("click", () => {
    form.classList.toggle("gift-card__form--active");
  });

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

    try {
      const venmoUrl = buildVenmoUrl(fund.name, amount);
      status.textContent = "Redirecting you to Venmo...";
      window.location.href = venmoUrl;
    } catch (error) {
      status.textContent = "We couldn't connect right now. Please try again.";
    }
  });

  fundsGrid.appendChild(card);
};

const loadFunds = async () => {
  CONFIG.DEFAULT_FUNDS.forEach(renderFund);
};

loadFunds();
