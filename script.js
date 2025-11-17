// Provider: The Guardian Open Platform (supports a public test key)
const GUARDIAN_BASE = "https://content.guardianapis.com/search";
const GUARDIAN_API_KEY = "test"; // public test key for development

const pageSize = 12;
let page = 1;
let mode = "category"; // "category" | "search"
let currentCategory = "general";
let currentQuery = "";
let curSelectedNav = null;
let isLoading = false;

window.addEventListener("load", () => {
    currentCategory = "general";
    page = 1;
    loadArticles(true);
});

function buildUrl() {
    const params = new URLSearchParams();
    params.set("page-size", String(pageSize));
    params.set("page", String(page));
    params.set("api-key", GUARDIAN_API_KEY);
    params.set("show-fields", "thumbnail,trailText");

    if (mode === "category") {
        // Guardian supported sections
        const guardianSections = [
            "politics",
            "sport",
            "business",
            "technology",
            "health",
            "science",
            "culture",
            "environment",
            "world"
        ];
        // Map our nav labels to Guardian sections where possible
        const map = {
            sports: "sport",
            entertainment: "culture",
            weather: null // use keyword
        };

        const mapped = map[currentCategory] ?? currentCategory;

        if (mapped && guardianSections.includes(mapped)) {
            params.set("section", mapped);
        } else if (currentCategory !== "general") {
            params.set("q", currentCategory);
        }
        return `${GUARDIAN_BASE}?${params.toString()}`;
    } else {
        // Search mode
        params.set("q", currentQuery);
        return `${GUARDIAN_BASE}?${params.toString()}`;
    }
}

async function loadArticles(reset = false) {
    const cardsContainer = document.getElementById("cardscontainer");
    const newsCardTemplate = document.getElementById("template-news-card");

    if (reset) {
        showSkeletons(cardsContainer, 6);
    }

    try {
        const res = await fetch(buildUrl());
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        const articles = (data.response && Array.isArray(data.response.results)) ? data.response.results : [];

        if (articles.length === 0) {
            if (reset) cardsContainer.innerHTML = '<p class="no-results">No articles found.</p>';
            toggleLoadMoreVisibility(false);
            return;
        }

        if (reset) cardsContainer.innerHTML = "";
        articles.forEach((article) => {
            const cardClone = newsCardTemplate.content.cloneNode(true);
            fillDataInCard(cardClone, article);
            cardsContainer.appendChild(cardClone);
        });

        toggleLoadMoreVisibility(articles.length === pageSize);
    } catch (err) {
        console.error(err);
        if (reset) cardsContainer.innerHTML = '<p class="no-results">Error loading news. Please try again.</p>';
        showToast("Failed to load news. Check your connection and try again.");
        toggleLoadMoreVisibility(false);
    }
}

function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDesc = cardClone.querySelector("#news-desc");

    const imgUrl = (article.fields && article.fields.thumbnail) || "https://via.placeholder.com/400x200";
    newsImg.src = imgUrl;
    const title = article.webTitle || "Untitled";
    const descriptionHTML = (article.fields && article.fields.trailText) || "";
    // Strip HTML tags from trailText for safe display
    const temp = document.createElement("div");
    temp.innerHTML = descriptionHTML;
    const description = temp.textContent || temp.innerText || "";

    newsTitle.innerHTML = `${title.slice(0, 80)}${title.length > 80 ? "..." : ""}`;
    newsDesc.innerHTML = `${description.slice(0, 180)}${description.length > 180 ? "..." : ""}`;

    const date = article.webPublicationDate ? new Date(article.webPublicationDate).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }) : "";
    const source = "The Guardian";
    newsSource.innerHTML = `${source}${date ? " · " + date : ""}`;

    cardClone.firstElementChild.addEventListener("click", () => {
        if (article.webUrl) {
            window.open(article.webUrl, "_blank");
        }
    });
}

function onNavItemClick(id) {
    mode = "category";
    currentCategory = id;
    page = 1;
    loadArticles(true);
    const navItem = document.getElementById(id);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = navItem;
    curSelectedNav.classList.add("active");
}

const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

searchButton.addEventListener("click", () => {
    const query = searchText.value.trim();
    if (!query) return;
    mode = "search";
    currentQuery = query;
    page = 1;
    loadArticles(true);
    curSelectedNav?.classList.remove("active");
    curSelectedNav = null;
});

// Trigger search on Enter key
searchText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchButton.click();
    }
});

const loadMoreBtn = document.getElementById("load-more");
function toggleLoadMoreVisibility(show) {
    if (!loadMoreBtn) return;
    loadMoreBtn.style.display = show ? "inline-block" : "none";
}

loadMoreBtn?.addEventListener("click", () => {
    page += 1;
    loadArticles(false);
});

// Mobile menu toggle
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.querySelector(".nav-links");
menuToggle?.addEventListener("click", () => {
    navLinks?.classList.toggle("open");
});

// Keyboard accessibility for nav items
document.querySelectorAll(".nav-item").forEach((el) => {
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            onNavItemClick(el.id);
        }
    });
});

// Skeleton helpers
function showSkeletons(container, count) {
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "card skeleton";
        skeleton.innerHTML = `
            <div class="card-header"><div class="skeleton-image"></div></div>
            <div class="card-content">
                <h3 class="skeleton-line"></h3>
                <h6 class="skeleton-line"></h6>
                <p class="skeleton-line long"></p>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

// Toast helper
const toastEl = document.getElementById("toast");
function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3000);
}