/**
 * MindMeld OS: Sidebar, Tab, and Dynamic Module Loader
 * Handles sidebar navigation, tab creation, dynamic loading of HTML modules, tab switching, and safe tab closing.
 * Uses only markup hooks present in index.html.
 */
/**
 * Theme Toggle: Light/Dark Mode with localStorage
 */
(function themeToggleInit() {
  // PUBLIC_INTERFACE
  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mmos-theme", theme);
    updateThemeButton(theme);
  };

  // PUBLIC_INTERFACE
  const updateThemeButton = (theme) => {
    const btn = document.getElementById("theme-toggle-icon");
    if (!btn) return;
    if (theme === "dark") {
      btn.textContent = "🌙";
    } else {
      btn.textContent = "🌞";
    }
  };

  // Get stored preference, or system preference
  let preferred = localStorage.getItem("mmos-theme");
  if (!preferred) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    preferred = mql.matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", preferred);
  document.addEventListener("DOMContentLoaded", () => updateThemeButton(preferred));

  // Setup button logic
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const current = (document.documentElement.getAttribute("data-theme") === "dark") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
    });
    // Update icon in case theme was set before DOMContentLoaded fires
    updateThemeButton(document.documentElement.getAttribute("data-theme"));
  });

  // For a11y: update theme if system changes (does not override manual user choice)
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    if (!localStorage.getItem("mmos-theme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  });
})();
// PUBLIC_INTERFACE
document.addEventListener("DOMContentLoaded", () => {
  // Key DOM hooks (must match index.html)
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const navItems = document.querySelectorAll("#sidebar-nav li");
  const tabBar = document.getElementById("tab-bar");
  const tabContent = document.getElementById("tab-content");
  const welcomeBlock = document.getElementById("mmos-welcome");

  // Track open tabs: { [module]: {tabEl, loadedHTML} }
  const openedTabs = {};

  // Map data-module attribute to user-facing name
  const moduleDisplayNames = {
    "brain-games": "Brain Games",
    "illusions": "Optical Illusions",
    "pattern-recognition": "Pattern Recognition",
    "memory-trainer": "Memory Trainer",
    "mindful-breathing": "Mindful Breathing",
    "ai-chatbot": "AI Chatbot",
    "youtube-downloader": "YouTube Downloader",
    "trivia-flashcards": "Trivia Flashcards",
    "rich-ui-ux": "Rich UI & UX"
  };

  // Sidebar: handle collapsing
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // Sidebar: Handle clicks to open/activate modules as tabs
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const module = item.getAttribute("data-module");
      // Sidebar highlight (nav item active)
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
      // Open or focus tab for this module
      openModuleTab(module);
    });
  });

  // Main function: open (or activate/focus) the module tab
  // PUBLIC_INTERFACE
  function openModuleTab(module) {
    // Prevent duplicate tabs
    if (openedTabs[module]) {
      setActiveTab(module);
      return;
    }
    // Clear welcome block if first tab
    if (isWelcomeDisplayed()) {
      tabContent.innerHTML = '';
    }

    // Tab element creation
    const tabEl = document.createElement("button");
    tabEl.className = "mmos-tab active";
    tabEl.type = "button";
    tabEl.setAttribute("data-module", module);

    const label = document.createElement("span");
    label.textContent = moduleDisplayNames[module] || module;
    tabEl.appendChild(label);

    // Add close button unless it's a "single" tab (here, always allow close)
    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("title", "Close tab");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(module);
    });
    tabEl.appendChild(closeBtn);

    tabEl.addEventListener("click", () => setActiveTab(module));
    tabBar.appendChild(tabEl);

    // Add to openedTabs state
    openedTabs[module] = {
      tabEl,
      loadedHTML: null // will fetch below
    };

    // Activate this tab (deactivate others)
    setActiveTab(module);

    // Begin loading module HTML into this tab
    const modulePath = `modules/${module}.html`;
    fetch(modulePath)
      .then((r) =>
        r.ok
          ? r.text()
          : `<div style="text-align:center;padding:54px 0;">Module not implemented...</div>`
      )
      .then((html) => {
        if (openedTabs[module]) {
          openedTabs[module].loadedHTML = html;
          // Only display if currently active
          if (getActiveTab() === module) {
            tabContent.innerHTML = html;
          }
        }
      })
      .catch(() => {
        if (openedTabs[module]) {
          openedTabs[module].loadedHTML =
            "<div style='text-align:center;padding:54px 0;color:#ff416c;'>Failed to load module.</div>";
          if (getActiveTab() === module) {
            tabContent.innerHTML = openedTabs[module].loadedHTML;
          }
        }
      });
  }

  // Set a tab as active: highlights, content, sidebar state
  // PUBLIC_INTERFACE
  function setActiveTab(module) {
    // Tab-bar: highlight only this tab
    Array.from(tabBar.children).forEach((t) =>
      t.classList.remove("active")
    );
    if (openedTabs[module] && openedTabs[module].tabEl)
      openedTabs[module].tabEl.classList.add("active");

    // Sidebar: set matching sidebar entry to active
    navItems.forEach(item =>
      item.classList.toggle(
        "active",
        item.getAttribute("data-module") === module
      )
    );

    // Main panel: show module's content (or spinner if not loaded yet)
    if (openedTabs[module]) {
      const html = openedTabs[module].loadedHTML;
      tabContent.innerHTML = html
        ? html
        : `<div style="text-align:center;padding:54px 0;">Loading module...</div>`;
    }
    // Clear out welcome block if present and a tab is activated
    if (isWelcomeDisplayed()) {
      tabContent.innerHTML = "";
    }
  }

  // Which tab is active? Returns module string or null
  // PUBLIC_INTERFACE
  function getActiveTab() {
    return Object.keys(openedTabs).find(
      (m) => openedTabs[m].tabEl.classList.contains("active")
    ) || null;
  }

  // Close a tab, safely updating state and focusing the last open tab if any
  // PUBLIC_INTERFACE
  function closeTab(module) {
    if (!openedTabs[module]) return;
    const { tabEl } = openedTabs[module];
    if (tabEl && tabEl.parentElement === tabBar) {
      tabBar.removeChild(tabEl);
    }
    delete openedTabs[module];

    // If closing active, select last tab (or first if exists), else no selection
    const tabNames = Object.keys(openedTabs);
    if (tabNames.length) {
      setActiveTab(tabNames[tabNames.length - 1]);
    } else {
      // All tabs closed: show welcome block again in tab content area
      if (welcomeBlock) {
        tabContent.innerHTML = welcomeBlock.outerHTML;
      } else {
        tabContent.innerHTML = "<h3>Welcome!</h3><p>Select a feature to start.</p>";
      }
      // Remove all .active from sidebar
      navItems.forEach(item => item.classList.remove("active"));
    }
  }

  // Return true if only welcome is shown (no tab is open)
  function isWelcomeDisplayed() {
    return tabBar.children.length === 0 || Object.keys(openedTabs).length === 0;
  }

  // Optionally: Open a default tab on initial load
  // const DEFAULT_MODULE = "brain-games";
  // openModuleTab(DEFAULT_MODULE);
});
