const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
  navigation.classList.toggle("is-open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
    navigation.classList.remove("is-open");
  });
});

const photoUpload = document.querySelector("#photo-upload");
const photoPreview = document.querySelector("#profile-preview");
const photoPlaceholder = document.querySelector("#portrait-placeholder");
const photoButton = document.querySelector("#photo-button");
let currentPhotoUrl;

function openPhotoDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser does not support local photo storage."));
      return;
    }
    const request = indexedDB.open("kamna-portfolio", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("profile")) database.createObjectStore("profile");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open photo storage."));
  });
}

async function storePhoto(photo) {
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("profile", "readwrite");
    transaction.objectStore("profile").put(photo, "photo");
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Could not save the photo.")); };
    transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Photo saving was cancelled.")); };
  });
}

async function readPhoto() {
  const database = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("profile", "readonly");
    const request = transaction.objectStore("profile").get("photo");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("Could not load the saved photo."));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

function showPhoto(photo, saved) {
  if (currentPhotoUrl) URL.revokeObjectURL(currentPhotoUrl);
  currentPhotoUrl = URL.createObjectURL(photo);
  photoPreview.src = currentPhotoUrl;
  photoPreview.hidden = false;
  photoPlaceholder.hidden = true;
  photoButton.textContent = saved ? "Photo saved on this device · change" : "+ Add your photo";
}

readPhoto().then((savedPhoto) => {
  if (savedPhoto) showPhoto(savedPhoto, true);
}).catch((error) => {
  console.warn("Saved profile photo could not be loaded:", error);
});

photoUpload.addEventListener("change", async () => {
  const photo = photoUpload.files[0];
  if (!photo) return;
  if (!photo.type.startsWith("image/")) {
    photoUpload.value = "";
    return;
  }
  showPhoto(photo, false);
  try {
    await storePhoto(photo);
    photoButton.textContent = "Photo saved on this device · change";
  } catch (error) {
    photoButton.textContent = "Photo preview only · try again";
    console.error("Could not save profile photo:", error);
  }
});

const themeButton = document.querySelector(".theme-toggle");

function setTheme(theme, save = true) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  themeButton.textContent = dark ? "☀" : "☾";
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  themeButton.title = dark ? "Switch to light mode" : "Switch to dark mode";
  if (save) {
    try { localStorage.setItem("kamna-portfolio-theme", theme); } catch (error) { console.info("Theme preference will last for this visit only.", error); }
  }
}

let preferredTheme = "light";
try { preferredTheme = localStorage.getItem("kamna-portfolio-theme") || "light"; } catch (error) { console.info("Theme preference storage is unavailable.", error); }
setTheme(preferredTheme === "dark" ? "dark" : "light", false);
themeButton.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

document.querySelector("#year").textContent = new Date().getFullYear();

document.querySelector(".project-visual img").addEventListener("error", (event) => {
  event.currentTarget.hidden = true;
  event.currentTarget.parentElement.classList.add("image-missing");
});

const cursorOrb = document.querySelector(".cursor-orb");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (finePointer && !reducedMotion && cursorOrb) {
  document.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    document.body.classList.add("cursor-on");
    const interactive = event.target.closest("a, button, label, input, select, textarea, summary, [role='button']");
    cursorOrb.classList.toggle("is-hovering", Boolean(interactive));
  });
  document.addEventListener("pointerdown", () => cursorOrb.classList.add("is-clicking"));
  document.addEventListener("pointerup", () => cursorOrb.classList.remove("is-clicking"));
  document.addEventListener("pointerleave", () => document.body.classList.remove("cursor-on"));
}

document.querySelector("#whatsapp-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const message = [
    "Hi Kamna,",
    `My name is ${formData.get("name").trim()}.`,
    `My email is ${formData.get("email").trim()}.`,
    "",
    formData.get("message").trim()
  ].join("\n");
  const whatsappUrl = `https://wa.me/918982635878?text=${encodeURIComponent(message)}`;
  const whatsappWindow = window.open(whatsappUrl, "_blank");
  if (whatsappWindow) whatsappWindow.opener = null;
  else window.location.assign(whatsappUrl);
});

const roleRotator = document.querySelector("#role-rotator");
if (roleRotator && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const roles = ["MCA-AIML student", "AI & ML learner", "curious problem solver"];
  let roleIndex = 0;
  let characterIndex = roles[0].length;
  let deleting = true;
  window.setInterval(() => {
    const currentRole = roles[roleIndex];
    if (deleting) {
      characterIndex -= 1;
      roleRotator.textContent = `"${currentRole.slice(0, characterIndex)}"`;
      if (characterIndex <= 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    } else {
      characterIndex += 1;
      roleRotator.textContent = `"${roles[roleIndex].slice(0, characterIndex)}"`;
      if (characterIndex >= roles[roleIndex].length) deleting = true;
    }
  }, 105);
}

const copyEmailButton = document.querySelector(".copy-email");
copyEmailButton.addEventListener("click", async () => {
  const email = copyEmailButton.dataset.copyEmail;
  try {
    await navigator.clipboard.writeText(email);
  } catch (error) {
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = email;
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.append(temporaryInput);
    temporaryInput.select();
    document.execCommand("copy");
    temporaryInput.remove();
  }
  copyEmailButton.textContent = "Email copied";
  window.setTimeout(() => { copyEmailButton.textContent = "Copy email address"; }, 1800);
});

const progressBar = document.querySelector("#reading-progress-bar");
const floatingTop = document.querySelector(".floating-top");
let scrollUpdatePending = false;
function updateScrollDetails() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
  floatingTop.classList.toggle("is-visible", window.scrollY > 420);
  scrollUpdatePending = false;
}
window.addEventListener("scroll", () => {
  if (!scrollUpdatePending) {
    window.requestAnimationFrame(updateScrollDetails);
    scrollUpdatePending = true;
  }
}, { passive: true });
updateScrollDetails();

if ("IntersectionObserver" in window) {
  const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-25% 0px -65% 0px" });
  document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
}

const revealMotionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (revealMotionAllowed && "IntersectionObserver" in window) {
  const revealItems = document.querySelectorAll(".hero-copy, .hero-visual, .profile-card, .skill-card, .project-feature, .education-item, .contact-methods > a, .message-form");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item, index) => {
    item.classList.add("reveal-on-scroll");
    item.style.transitionDelay = `${(index % 3) * 75}ms`;
    revealObserver.observe(item);
  });
}
