const CONFIG = {
  API_BASE_URL: "/api",
};

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

const loadGallery = async () => {
  try {
    if (CONFIG.API_BASE_URL) {
      const response = await fetch(`${CONFIG.API_BASE_URL}/gallery`);
      if (!response.ok) {
        throw new Error("Unable to load gallery API.");
      }
      allImages = await response.json();
      renderGallery();
      return;
    }

    const response = await fetch(GALLERY_MANIFEST);
    if (!response.ok) {
      throw new Error("Unable to load gallery manifest.");
    }
    const data = await response.json();
    allImages = data;
  } catch (error) {
    try {
      const response = await fetch(GALLERY_MANIFEST);
      if (!response.ok) {
        throw new Error("Unable to load gallery manifest.");
      }
      allImages = await response.json();
    } catch (manifestError) {
      allImages = fallbackImages;
    }
  }
  renderGallery();
};

const readImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file || !file.size) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });

const submitUpload = async (payload) => {
  if (!CONFIG.API_BASE_URL) {
    throw new Error("Uploads require the API server.");
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}/gallery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to upload image.");
  }

  return response.json();
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

  uploadStatus.textContent = "";
  const formData = new FormData(uploadForm);
  const imageFile = formData.get("image");
  const caption = formData.get("caption").toString().trim();
  const tag = formData.get("tag").toString();

  if (!imageFile || !imageFile.size) {
    uploadStatus.textContent = "Please choose a photo to upload.";
    return;
  }

  if (imageFile.size > 5 * 1024 * 1024) {
    uploadStatus.textContent = "Please upload an image smaller than 5MB.";
    return;
  }

  try {
    const src = await readImage(imageFile);
    const tags = tag ? [tag] : [];
    const images = await submitUpload({
      src,
      caption,
      tags,
    });
    allImages = images;
    renderGallery();
    uploadForm.reset();
    uploadStatus.textContent = "Photo uploaded! Thanks for sharing.";
  } catch (error) {
    uploadStatus.textContent = "Uploads are unavailable right now.";
  }
});

loadGallery();
