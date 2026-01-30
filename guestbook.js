import { Amplify } from "https://cdn.jsdelivr.net/npm/aws-amplify@6.16.0/+esm";
import { generateClient } from "https://cdn.jsdelivr.net/npm/aws-amplify@6.16.0/api/+esm";
import { getUrl, uploadData } from "https://cdn.jsdelivr.net/npm/aws-amplify@6.16.0/storage/+esm";

let client;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const GUESTBOOK_IMAGE_PREFIX = "guestbook/";

const form = document.querySelector("#guestbook-form");
const statusEl = document.querySelector("#guestbook-status");
const entriesContainer = document.querySelector("#guestbook-entries");
const template = document.querySelector("#guestbook-entry-template");

const configureAmplify = async () => {
  try {
    const response = await fetch("./amplify_outputs.json");
    if (!response.ok) {
      throw new Error("Unable to load Amplify configuration.");
    }
    const outputs = await response.json();
    Amplify.configure(outputs);
    client = generateClient();
    return true;
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = "Guestbook entries are unavailable right now.";
    }
    return false;
  }
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const normalizeEntry = async (entry) => {
  if (!entry) {
    return null;
  }

  const imageKey = entry.imageKey ?? "";
  let imageUrl = "";

  if (imageKey) {
    const { url } = await getUrl({
      path: imageKey,
      options: { expiresIn: 3600 },
    });
    imageUrl = url.toString();
  }

  return {
    id: entry.id,
    name: entry.name ?? "",
    message: entry.message ?? "",
    image_url: imageUrl,
    image_alt: entry.imageAlt ?? "",
    created_at: entry.submittedAt ?? entry.createdAt ?? new Date().toISOString(),
  };
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

    const hasImage =
      typeof entry.image_url === "string" && entry.image_url.trim() !== "";

    if (hasImage) {
      imageEl.src = entry.image_url;
      imageEl.alt = entry.image_alt || "Guestbook upload";
    } else {
      imageEl.remove();
    }

    entriesContainer.appendChild(card);
  });
};

const fetchEntries = async () => {
  if (!client) {
    throw new Error("Amplify is not configured.");
  }
  const { data, errors } = await client.models.GuestbookEntry.list({
    limit: 200,
  });

  if (errors && errors.length) {
    throw new Error("Unable to fetch guestbook entries.");
  }

  const normalized = await Promise.all(data.map((entry) => normalizeEntry(entry)));
  return normalized
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const uploadImage = async (file) => {
  if (!file || !file.size) {
    return "";
  }

  const key = `${GUESTBOOK_IMAGE_PREFIX}${crypto.randomUUID()}-${file.name}`;
  const task = uploadData({
    path: key,
    data: file,
    options: {
      contentType: file.type || "application/octet-stream",
    },
  });

  const result = await task.result;
  return result.path;
};

const submitEntry = async ({ name, message, imageKey, imageAlt, submittedAt }) => {
  if (!client) {
    throw new Error("Amplify is not configured.");
  }
  const { data, errors } = await client.models.GuestbookEntry.create({
    name,
    message,
    imageKey,
    imageAlt,
    submittedAt,
  });

  if (errors && errors.length) {
    throw new Error("Unable to submit guestbook entry.");
  }

  return data;
};

const initialize = async () => {
  const configured = await configureAmplify();
  if (!configured) {
    return;
  }

  try {
    const entries = await fetchEntries();
    renderEntries(entries);
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = "Guestbook entries are unavailable right now.";
    }
  }
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form || !statusEl) {
    return;
  }

  if (!client) {
    statusEl.textContent = "Guestbook entries are unavailable right now.";
    return;
  }

  statusEl.textContent = "";
  const formData = new FormData(form);
  const name = formData.get("name").toString().trim();
  const message = formData.get("message").toString().trim();
  const imageFile = formData.get("image");
  const hasImage = imageFile && imageFile.size > 0;

  if (!message) {
    statusEl.textContent = "Please add a message before submitting.";
    return;
  }

  if (hasImage && imageFile.size > MAX_IMAGE_SIZE) {
    statusEl.textContent = "Please upload an image smaller than 5MB.";
    return;
  }

  try {
    const imageKey = hasImage ? await uploadImage(imageFile) : "";
    const submittedAt = new Date().toISOString();

    await submitEntry({
      name: name || "",
      message,
      imageKey,
      imageAlt: hasImage ? imageFile.name : "",
      submittedAt,
    });

    const entries = await fetchEntries();
    renderEntries(entries);
    form.reset();
    statusEl.textContent = "Thanks for signing the guestbook!";
  } catch (error) {
    statusEl.textContent = "We couldn't save your entry right now.";
  }
});

initialize();
