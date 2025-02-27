import { bangs } from "./bang";
import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="search-container">
      <h1 class="search-logo">Und*ck</h1>
      
      <form id="search-form" class="search-form">
        <input 
          type="text" 
          id="search-input" 
          class="search-input" 
          placeholder="Search with bangs (e.g. !w cats)"
          autofocus
        />
        <button type="submit" class="search-button">Search</button>
      </form>
      
      <div class="instructions">
        <p>Use DuckDuckGo's bangs, but faster. Add this URL as a custom search engine in your browser:</p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://bang.pujan.pm?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <p><small>Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all DuckDuckGo bangs</a> with minimal redirect time.</small></p>
      </div>
      
      <footer class="footer">
        <a href="https://pujan.pm" target="_blank">pujan.pm</a>
        •
        <a href="https://github.com/pujan-modha/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const searchForm = app.querySelector<HTMLFormElement>("#search-form")!;
  const searchInput = app.querySelector<HTMLInputElement>("#search-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `?q=${encodeURIComponent(query)}`;
    }
  });
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
