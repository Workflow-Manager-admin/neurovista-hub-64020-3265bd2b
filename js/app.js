// PUBLIC_INTERFACE
/**
 * MindMeld OS: Tabbed Sidebar App Framework
 * Handles sidebar, tab opening/closing, and loads module HTML into tab content area.
 */
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const navItems = document.querySelectorAll(".mmos-sidebar-nav li");
  const tabBar = document.getElementById("tab-bar");
  const tabContent = document.getElementById("tab-content");

  // Map of opened { moduleName: {tabEl, contentEl, title, ...} }
  const openedTabs = {};

  // Display name for modules
  const moduleNames = {
    "brain-games": "Brain Games",
    "illusions": "Optical Illusions",
    "memory-trainer": "Memory Trainer",
    "mindful-breathing": "Mindful Breathing",
    "ai-chatbot": "AI Chatbot",
    "youtube-downloader": "YouTube Downloader",
    "trivia-flashcards": "Trivia Flashcards"
  };

  // Sidebar toggling
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // Sidebar nav open module as tab handler
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
      const module = item.getAttribute("data-module");
      openTab(module);
    });
  });

  function openTab(module) {
    if (openedTabs[module]) {
      // Already opened, just activate
      setActiveTab(module);
      return;
    }
    // Create tab element
    const tabEl = document.createElement("button");
    tabEl.className = "mmos-tab active";
    tabEl.textContent = moduleNames[module] || module;
    // Tab close (except for default tab)
    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.setAttribute("title", "Close tab");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", e => {
      e.stopPropagation();
      closeTab(module);
    });
    tabEl.appendChild(closeBtn);
    tabEl.addEventListener("click", () => setActiveTab(module));
    tabBar.appendChild(tabEl);

    openedTabs[module] = { tabEl };

    setActiveTab(module);
    // Load HTML module content dynamically into #tab-content
    fetch(`modules/${module}.html`)
      .then(r => r.ok ? r.text() : `<div style="text-align:center;padding:60px 0;">Module missing.</div>`)
      .then(html => {
        if (openedTabs[module]) openedTabs[module].content = html;
        // Only show if now active
        if (getActiveTab() === module) tabContent.innerHTML = html;
      })
      .catch(() => {
        if (openedTabs[module]) openedTabs[module].content = "Module load failed.";
      });
  }

  // Set one tab as active, update UI and display correct content
  function setActiveTab(module) {
    // Remove .active everywhere
    Array.from(tabBar.children).forEach(btn => btn.classList.remove("active"));
    Object.keys(openedTabs).forEach(m => openedTabs[m].tabEl.classList.remove("active"));
    // Activate this
    if (openedTabs[module]) openedTabs[module].tabEl.classList.add("active");
    // Show content or loading
    tabContent.innerHTML = openedTabs[module] && openedTabs[module].content
      ? openedTabs[module].content
      : `<div style="text-align:center;padding:60px 0;">Loading module...</div>`;
    // Set sidebar highlight
    navItems.forEach(item => item.classList.toggle("active", item.getAttribute("data-module") === module));
  }

  // Returns the module string of the current active tab
  function getActiveTab() {
    const active = Object.keys(openedTabs).find(m => openedTabs[m].tabEl.classList.contains("active"));
    return active || null;
  }

  // Close given tab and switch to last tab or welcome
  function closeTab(module) {
    const { tabEl } = openedTabs[module] || {};
    if (tabEl) tabBar.removeChild(tabEl);
    delete openedTabs[module];

    // Activate next: last tab in open or welcome if none
    const openTabNames = Object.keys(openedTabs);
    if (openTabNames.length) {
      setActiveTab(openTabNames[openTabNames.length - 1]);
    } else {
      tabContent.innerHTML = document.querySelector(".mmos-welcome").outerHTML;
      navItems.forEach(item => item.classList.remove("active"));
    }
  }
});
