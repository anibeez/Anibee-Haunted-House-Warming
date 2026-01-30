import { Amplify } from "https://cdn.jsdelivr.net/npm/@aws-amplify/core@6.16.0/+esm";
import { generateClient } from "https://cdn.jsdelivr.net/npm/aws-amplify@6.16.0/api/+esm";
import { getUrl, uploadData } from "https://cdn.jsdelivr.net/npm/aws-amplify@6.16.0/storage/+esm";

let client;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const GALLERY_IMAGE_PREFIX = "gallery/";
const GALLERY_MANIFEST = "src/media/images/gallery.json";

const galleryGrid = document.querySelector("#gallery-grid");
const filterButtons = document.querySelectorAll(".filter-button");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxClose = document.querySelector(".lightbox__close");
const galleryEmpty = document.querySelector("#gallery-empty");
const uploadForm = document.querySelector("#gallery-upload-form");
const uploadStatus = document.querySelector("#gallery-upload-status");

const fallbackImages = [];

let allImages = [];
let activeFilter = "all";

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
    return false;
  }
};

const setActiveFilter = (filter) => {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("filter-button--active", isActive);
  });
  renderGallery();
};

const openLightbox = (image) => {
  if (!lightbox) {
    return;
  }
  lightboxImage.src = image.src;
  lightboxImage.alt = image.caption || "Gallery image";
  lightboxCaption.textContent = image.caption || "";
  if (typeof lightbox.showModal === "function") {
    lightbox.showModal();
  } else {
    lightbox.setAttribute("open", "true");
  }
};

const closeLightbox = () => {
  if (!lightbox) {
    return;
  }
  if (typeof lightbox.close === "function") {
    lightbox.close();
  } else {
    lightbox.removeAttribute("open");
  }
};

const renderGallery = () => {
  if (!galleryGrid) {
    return;
  }
  galleryGrid.innerHTML = "";

  const images = allImages.filter((image) => {
    if (activeFilter === "all") {
      return true;
    }
    return image.tags?.includes(activeFilter);
  });

  if (galleryEmpty) {
    galleryEmpty.hidden = images.length > 0;
  }

  images.forEach((image) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "gallery-card";

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.caption || "Gallery image";
    img.loading = "lazy";

    const caption = document.createElement("span");
    caption.textContent = image.caption || "";

    card.append(img, caption);
    card.addEventListener("click", () => openLightbox(image));
    galleryGrid.appendChild(card);
  });
};

const normalizeImage = async (item) => {
  if (!item) {
    return null;
  }

  const { url } = await getUrl({
    path: item.imageKey,
    options: { expiresIn: 3600 },
  });

  return {
    id: item.id,
    src: url.toString(),
    caption: item.caption ?? "",
    tags: item.tags ?? [],
    created_at: item.submittedAt ?? item.createdAt ?? new Date().toISOString(),
  };
};

const loadGallery = async () => {
  let manifestImages = [];
  try {
    const response = await fetch(GALLERY_MANIFEST);
    if (!response.ok) {
      throw new Error("Unable to load gallery manifest.");
    }
    manifestImages = await response.json();
  } catch (error) {
    manifestImages = fallbackImages;
  }

  if (!client) {
    allImages = manifestImages;
    renderGallery();
    return;
  }

  try {
    const { data, errors } = await client.models.GalleryImage.list({
      limit: 200,
    });

    if (errors && errors.length) {
      throw new Error("Unable to load gallery data.");
    }

    const remoteImages = await Promise.all(data.map((item) => normalizeImage(item)));
    const normalized = remoteImages.filter(Boolean);
    allImages = [...normalized, ...manifestImages].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  } catch (error) {
    allImages = manifestImages;
  }

  renderGallery();
};

const uploadImage = async (file) => {
  const key = `${GALLERY_IMAGE_PREFIX}${crypto.randomUUID()}-${file.name}`;
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

const submitUpload = async ({ caption, tags, imageKey, submittedAt }) => {
  if (!client) {
    throw new Error("Amplify is not configured.");
  }
  const { data, errors } = await client.models.GalleryImage.create({
    caption,
    tags,
    imageKey,
    submittedAt,
  });

  if (errors && errors.length) {
    throw new Error("Unable to upload image.");
  }

  return data;
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveFilter(button.dataset.filter));
});

if (lightbox) {
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

uploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!uploadForm || !uploadStatus) {
    return;
  }

  if (!client) {
    uploadStatus.textContent = "Uploads are unavailable right now.";
    return;
  }

  uploadStatus.textContent = "";
  const formData = new FormData(uploadForm);
  const imageFile = formData.get("image");
  const caption = formData.get("caption").toString().trim();
  const tag = formData.get("tag").toString();

  if (!imageFile || !imageFile.size) {
    uploadStatus.textContent = "Please choose a photo to upload.";
    return;
  }

  if (imageFile.size > MAX_IMAGE_SIZE) {
    uploadStatus.textContent = "Please upload an image smaller than 5MB.";
    return;
  }

  try {
    const imageKey = await uploadImage(imageFile);
    const tags = tag ? [tag] : [];
    const submittedAt = new Date().toISOString();

    await submitUpload({
      caption,
      tags,
      imageKey,
      submittedAt,
    });

    await loadGallery();
    uploadForm.reset();
    uploadStatus.textContent = "Photo uploaded! Thanks for sharing.";
  } catch (error) {
    uploadStatus.textContent = "Uploads are unavailable right now.";
  }
});

const initialize = async () => {
  await configureAmplify();
  await loadGallery();
};

initialize();
