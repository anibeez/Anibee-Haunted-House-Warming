const CONFIG = {
  API_BASE_URL: "",
  STORAGE_KEY: "haunted-guestbook-entries",
};

const form = document.querySelector("#guestbook-form");
const statusEl = document.querySelector("#guestbook-status");
const entriesContainer = document.querySelector("#guestbook-entries");
const template = document.querySelector("#guestbook-entry-template");

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const loadLocalEntries = () => {
  const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalEntries = (entries) => {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(entries));
};

const renderEntries = (entries) => {
  if (!entriesContainer || !template) {
    return;
  }

  entriesContainer.innerHTML = "";
  entries.forEach((entry) => {
    const card = template.content.cloneNode(true);
    const nameEl = card.querySelector(".message-card__name");
    const dateEl = card.querySelector(".message-card__date");
    const messageEl = card.querySelector(".message-card__message");
    const imageEl = card.querySelector(".message-card__image");

    nameEl.textContent = entry.name || "A friendly ghost";
    dateEl.textContent = formatDate(entry.created_at);
    messageEl.textContent = entry.message;

    if (entry.image_url) {
      console.log(entry.image_url)
      imageEl.src = entry.image_url;
      imageEl.alt = entry.image_alt || "Guestbook upload";
    } else {
      imageEl.remove();
    }

    entriesContainer.appendChild(card);
  });
};

const readImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });

const fetchEntries = async () => {
  if (!CONFIG.API_BASE_URL) {
    return loadLocalEntries();
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}/guestbook`);
  if (!response.ok) {
    throw new Error("Unable to fetch guestbook entries.");
  }
  return response.json();
};

const submitEntry = async (payload) => {
  if (!CONFIG.API_BASE_URL) {
    const entries = loadLocalEntries();
    const updated = [payload, ...entries];
    saveLocalEntries(updated);
    return updated;
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}/guestbook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to submit guestbook entry.");
  }

  return response.json();
};

const initialize = async () => {
  try {
    const entries = await fetchEntries();
    renderEntries(entries);
  } catch (error) {
    renderEntries(loadLocalEntries());
  }
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form || !statusEl) {
    return;
  }

  statusEl.textContent = "";
  const formData = new FormData(form);
  const name = formData.get("name").toString().trim();
  const message = formData.get("message").toString().trim();
  const imageFile = formData.get("image");

  if (!message) {
    statusEl.textContent = "Please add a message before submitting.";
    return;
  }

  if (imageFile && imageFile.size > 5 * 1024 * 1024) {
    statusEl.textContent = "Please upload an image smaller than 5MB.";
    return;
  }

  try {
    const imageUrl = imageFile ? await readImage(imageFile) : null;

    const payload = {
      name: name || "",
      message,
      image_url: imageUrl,
      image_alt: imageFile ? imageFile.name : "",
      created_at: new Date().toISOString(),
    };

    const entries = await submitEntry(payload);
    renderEntries(entries);
    form.reset();
    statusEl.textContent = "Thanks for signing the guestbook!";
  } catch (error) {
    statusEl.textContent = "We couldn't save your entry right now.";
  }
});

initialize();
