const GALLERY_MANIFEST = "src/media/images/gallery.json";

const galleryGrid = document.querySelector("#gallery-grid");
const filterButtons = document.querySelectorAll(".filter-button");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxClose = document.querySelector(".lightbox__close");

const fallbackImages = [
  {
    src: "src/media/images/homepage_banner.png",
    caption: "First look at the haunted housewarming vibes.",
    tags: ["party"],
  },
];

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

  images.forEach((image) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "gallery-card";

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.caption || "Gallery image";

    const caption = document.createElement("span");
    caption.textContent = image.caption || "";

    card.append(img, caption);
    card.addEventListener("click", () => openLightbox(image));
    galleryGrid.appendChild(card);
  });
};

const loadGallery = async () => {
  try {
    const response = await fetch(GALLERY_MANIFEST);
    if (!response.ok) {
      throw new Error("Unable to load gallery manifest.");
    }
    const data = await response.json();
    allImages = data;
  } catch (error) {
    allImages = fallbackImages;
  }
  renderGallery();
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

loadGallery();
