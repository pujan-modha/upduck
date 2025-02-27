import { bangs } from "./bang";
import "./global.css";

// Theme management
function getCurrentTheme(): "light" | "dark" {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setTheme(theme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  // Force a repaint to ensure theme is applied properly
  document.body.style.display = "none";
  document.body.offsetHeight; // Trigger a reflow
  document.body.style.display = "";
}

function toggleTheme(): void {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme: "light" | "dark"): void {
  const themeIcon =
    document.querySelector<HTMLImageElement>(".theme-switch img");
  if (themeIcon) {
    themeIcon.src = theme === "light" ? "/moon.svg" : "/sun.svg";
    themeIcon.alt =
      theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  }
}

// Initialize theme on page load
function initTheme(): void {
  setTheme(getCurrentTheme());
}

// Constants
const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

// Bang redirect functionality
function getBangredirectUrl(): string | null {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );

  return searchUrl || null;
}

function doRedirect(): void {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

// Main page rendering
function noSearchDefaultPageRender(): void {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="search-container">
      <button class="settings-button" aria-label="Settings">
        <img src="/gear.svg" alt="Settings" />
      </button>

      <button class="theme-switch" aria-label="Toggle theme">
        <img src="${getCurrentTheme() === "light" ? "/moon.svg" : "/sun.svg"}" 
             alt="${
               getCurrentTheme() === "light"
                 ? "Switch to dark mode"
                 : "Switch to light mode"
             }" />
      </button>
      
      <h1 class="search-logo">Search</h1>
      
      <form id="search-form" class="search-form">
        <input 
          type="text" 
          id="search-input" 
          class="search-input" 
          placeholder="Search with bangs (e.g. !w cats)"
          autofocus
        />
        <button type="submit" class="search-button">
          <span class="search-button-text">Search</span>
          <img src="/search.svg" alt="Search" class="search-icon" />
        </button>
      </form>
      
      <div class="instructions">
        <p>Add this URL as a custom search engine in your browser:</p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://search.pujan.pm?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <p><small>Enables <a href="https://duckduckgo.com/bang.html" target="_blank">DuckDuckGo bangs</a> with minimal redirect time.</small></p>
      </div>
      
      <footer class="footer">
        <a href="https://pujan.pm" target="_blank">pujan.pm</a>
        •
        <a href="https://github.com/pujan-modha/unduck" target="_blank">github</a>
      </footer>
    </div>
    
    <!-- Settings Modal -->
    <div class="modal-backdrop" id="settings-modal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2 class="modal-title">Settings</h2>
          <button class="modal-close" id="close-settings">&times;</button>
        </div>
        
        <div class="settings-row">
          <label class="settings-label">Default Bang (when no bang is specified):</label>
          <div class="bang-selector">
            <select id="default-bang">
              <option value="g" ${
                LS_DEFAULT_BANG === "g" ? "selected" : ""
              }>Google (!g)</option>
              <option value="b" ${
                LS_DEFAULT_BANG === "b" ? "selected" : ""
              }>Bing (!b)</option>
              <option value="ddg" ${
                LS_DEFAULT_BANG === "ddg" ? "selected" : ""
              }>DuckDuckGo (!ddg)</option>
              <option value="yt" ${
                LS_DEFAULT_BANG === "yt" ? "selected" : ""
              }>YouTube (!yt)</option>
              <option value="w" ${
                LS_DEFAULT_BANG === "w" ? "selected" : ""
              }>Wikipedia (!w)</option>
              <option value="custom" ${
                !["g", "b", "ddg", "yt", "w"].includes(LS_DEFAULT_BANG)
                  ? "selected"
                  : ""
              }>Custom</option>
            </select>
            <span id="bang-saved-indicator" class="bang-saved-indicator">Saved!</span>
          </div>
        </div>
        
        <div id="custom-bang-container" class="custom-bang-container" style="display: ${
          !["g", "b", "ddg", "yt", "w"].includes(LS_DEFAULT_BANG)
            ? "flex"
            : "none"
        }">
          <label class="settings-label">Custom Bang:</label>
          <input type="text" id="custom-bang-input" class="custom-bang-input" value="${
            !["g", "b", "ddg", "yt", "w"].includes(LS_DEFAULT_BANG)
              ? LS_DEFAULT_BANG
              : ""
          }" placeholder="e.g. gh">
          <button id="save-custom-bang" class="save-button">Save</button>
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
}

// Event listeners for the main page
function setupEventListeners(): void {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const searchForm = app.querySelector<HTMLFormElement>("#search-form")!;
  const searchInput = app.querySelector<HTMLInputElement>("#search-input")!;
  const themeSwitch = app.querySelector<HTMLButtonElement>(".theme-switch")!;
  const settingsButton =
    app.querySelector<HTMLButtonElement>(".settings-button")!;
  const settingsModal =
    document.querySelector<HTMLDivElement>("#settings-modal")!;
  const closeSettingsButton =
    document.querySelector<HTMLButtonElement>("#close-settings")!;
  const defaultBangSelect =
    document.querySelector<HTMLSelectElement>("#default-bang")!;
  const customBangContainer = document.querySelector<HTMLDivElement>(
    "#custom-bang-container"
  )!;
  const customBangInput =
    document.querySelector<HTMLInputElement>("#custom-bang-input")!;
  const saveCustomBangButton =
    document.querySelector<HTMLButtonElement>("#save-custom-bang")!;
  const bangSavedIndicator = document.querySelector<HTMLSpanElement>(
    "#bang-saved-indicator"
  )!;

  // Copy URL to clipboard
  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";
    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  // Search form submission
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `?q=${encodeURIComponent(query)}`;
    }
  });

  // Theme switching
  themeSwitch.addEventListener("click", toggleTheme);

  // Settings modal
  settingsButton.addEventListener("click", () => {
    settingsModal.classList.add("visible");
  });

  closeSettingsButton.addEventListener("click", () => {
    settingsModal.classList.remove("visible");
  });

  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove("visible");
    }
  });

  // Default bang selection
  defaultBangSelect.addEventListener("change", () => {
    const selectedValue = defaultBangSelect.value;

    if (selectedValue === "custom") {
      customBangContainer.style.display = "flex";
      customBangInput.focus();
    } else {
      customBangContainer.style.display = "none";
      localStorage.setItem("default-bang", selectedValue);
      showSavedIndicator();
    }
  });

  // Custom bang save
  saveCustomBangButton.addEventListener("click", () => {
    const customBang = customBangInput.value.trim();
    if (customBang) {
      localStorage.setItem("default-bang", customBang);
      showSavedIndicator();
    }
  });

  // Helper function to show saved indicator
  function showSavedIndicator() {
    bangSavedIndicator.classList.add("visible");
    setTimeout(() => {
      bangSavedIndicator.classList.remove("visible");
    }, 2000);
  }
}

// Initialize the application
initTheme();
doRedirect();
