// YourDegree home page interactions: carousels, tabs, counsellor switcher, videos, nav menus, smooth scroll, search.
(function () {
  "use strict";

  // Carousels: a scrollable track plus "1/4" pill + dots. data-step="page"
  // moves a full viewport of cards; otherwise one card per step.
  function initCarousel(controls) {
    var pagination = controls.querySelector("[data-pagination]");
    var prev = controls.querySelector("[data-carousel-prev]");
    var next = controls.querySelector("[data-carousel-next]");
    var track = controls.parentElement.querySelector("[data-carousel-track]");
    var index = 0;
    var pages = 1;

    // data-repeat="n" fills the track with n copies of its cards.
    var repeat = Number(track.dataset.repeat) || 1;
    var originals = Array.prototype.slice.call(track.children);
    for (var r = 1; r < repeat; r++) {
      originals.forEach(function (card) { track.appendChild(card.cloneNode(true)); });
    }

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      if (track.dataset.step === "page") return track.clientWidth + gap;
      return track.firstElementChild.getBoundingClientRect().width + gap;
    }

    function measure() {
      var max = track.scrollWidth - track.clientWidth;
      pages = Math.max(1, Math.round(max / step()) + 1);
      index = Math.min(index, pages - 1);
    }

    function render() {
      pagination.innerHTML = "";
      for (var i = 0; i < pages; i++) {
        if (i === index) {
          var active = document.createElement("span");
          active.className = "pagination__active";
          active.innerHTML =
            '<span class="pagination__current">' + (i + 1) + "</span>" +
            '<span class="pagination__total">/<span>' + pages + "</span></span>";
          pagination.appendChild(active);
        } else {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "pagination__dot";
          dot.setAttribute("aria-label", "Go to slide " + (i + 1));
          dot.dataset.index = String(i);
          pagination.appendChild(dot);
        }
      }
      prev.disabled = index === 0;
      next.disabled = index === pages - 1;
    }

    function goTo(i) {
      index = Math.max(0, Math.min(pages - 1, i));
      track.scrollTo({ left: index * step(), behavior: "smooth" });
      render();
    }

    prev.addEventListener("click", function () { goTo(index - 1); });
    next.addEventListener("click", function () { goTo(index + 1); });
    pagination.addEventListener("click", function (event) {
      var dot = event.target.closest(".pagination__dot");
      if (dot) goTo(Number(dot.dataset.index));
    });

    // Keep the indicator in sync with swipes and trackpad scrolling.
    var settle;
    track.addEventListener("scroll", function () {
      clearTimeout(settle);
      settle = setTimeout(function () {
        var i = Math.round(track.scrollLeft / step());
        if (i !== index) { index = i; render(); }
      }, 80);
    }, { passive: true });

    window.addEventListener("resize", function () { measure(); render(); });

    measure();
    render();
  }

  // Tabs: toggle the active tab and show its panel.
  function initTabs(tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !active;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (event) {
        var dir = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        var target = tabs[(i + dir + tabs.length) % tabs.length];
        select(target);
        target.focus();
      });
    });
  }

  // Video boxes: play data-src when set; until real videos exist, say so.
  function initVideos() {
    document.querySelectorAll("[data-video]").forEach(function (box) {
      var button = box.querySelector(".video-box__play");
      if (!button) return;
      button.addEventListener("click", function () {
        var src = box.dataset.src;
        if (src) {
          var video = document.createElement("video");
          video.src = src;
          video.controls = true;
          video.autoplay = true;
          video.playsInline = true;
          box.appendChild(video);
          return;
        }
        var notice = box.querySelector(".video-box__notice");
        if (!notice) {
          notice = document.createElement("span");
          notice.className = "video-box__notice";
          notice.setAttribute("role", "status");
          box.appendChild(notice);
        }
        notice.textContent = "Video coming soon";
        clearTimeout(notice.timer);
        notice.timer = setTimeout(function () { notice.remove(); }, 2500);
      });
    });
  }

  // Counsellor portraits: rotate the five slots around the featured centre.
  function initPortraits() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".portraits__item"));
    if (!items.length) return;
    // Visual order left → right, by slot modifier.
    var slots = [1, 2, 5, 4, 3];
    var order = items.map(function (item) {
      return Number(item.className.match(/portraits__item--(\d)/)[1]);
    });

    function apply() {
      items.forEach(function (item, i) {
        item.className = "portraits__item portraits__item--" + order[i];
      });
    }

    function shift(direction) {
      order = order.map(function (slot) {
        var pos = slots.indexOf(slot);
        return slots[(pos + direction + slots.length) % slots.length];
      });
      apply();
    }

    var prev = document.querySelector("[data-portrait-prev]");
    var next = document.querySelector("[data-portrait-next]");
    if (prev) prev.addEventListener("click", function () { shift(1); });
    if (next) next.addEventListener("click", function () { shift(-1); });
  }

  // Navigation mega menus: open on hover (or click/keyboard), blur the page behind.
  function initMegaMenus() {
    var header = document.querySelector(".site-header");
    var overlay = document.querySelector("[data-nav-overlay]");
    var items = Array.prototype.slice.call(document.querySelectorAll(".nav-item[data-menu]"));
    if (!header || !items.length) return;
    var current = null;
    var closeTimer;

    function panelFor(item) {
      return document.getElementById(item.dataset.menu);
    }

    function open(item) {
      clearTimeout(closeTimer);
      if (current === item) return;
      if (current) close(true);
      current = item;
      item.classList.add("is-open");
      item.querySelector("button").setAttribute("aria-expanded", "true");
      panelFor(item).classList.add("is-open");
      header.classList.add("is-menu-open");
      overlay.classList.add("is-visible");
    }

    function close(switching) {
      if (!current) return;
      var item = current;
      current = null;
      item.classList.remove("is-open");
      item.querySelector("button").setAttribute("aria-expanded", "false");
      var panel = panelFor(item);
      panel.classList.remove("is-open");
      var uni = panel.querySelector("[data-uni-menu]");
      if (uni) resetUniversities(uni);
      if (!switching) {
        header.classList.remove("is-menu-open");
        overlay.classList.remove("is-visible");
      }
    }

    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { close(false); }, 160);
    }

    items.forEach(function (item) {
      var button = item.querySelector("button");
      var panel = panelFor(item);
      item.addEventListener("mouseenter", function () { open(item); });
      item.addEventListener("mouseleave", scheduleClose);
      panel.addEventListener("mouseenter", function () { clearTimeout(closeTimer); });
      panel.addEventListener("mouseleave", scheduleClose);
      button.addEventListener("click", function () {
        if (current === item) close(false); else open(item);
      });
      // Close after following a link inside the menu.
      panel.addEventListener("click", function (event) {
        if (event.target.closest("a")) close(false);
      });
    });

    overlay.addEventListener("click", function () { close(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && current) {
        var button = current.querySelector("button");
        close(false);
        button.focus();
      }
    });
    document.addEventListener("focusin", function (event) {
      if (current && !current.contains(event.target) && !panelFor(current).contains(event.target)) close(false);
    });
  }

  // Top University menu: hovering a university expands its programs block.
  function resetUniversities(menu) {
    menu.classList.remove("is-expanded");
    menu.querySelectorAll("[data-uni-row]").forEach(function (row) { row.classList.remove("is-active"); });
  }

  function initUniversityMenu() {
    var menu = document.querySelector("[data-uni-menu]");
    if (!menu) return;
    var rows = Array.prototype.slice.call(menu.querySelectorAll("[data-uni-row]"));
    rows.forEach(function (row) {
      function activate() {
        rows.forEach(function (r) { r.classList.toggle("is-active", r === row); });
        menu.classList.add("is-expanded");
      }
      row.addEventListener("mouseenter", activate);
      row.addEventListener("focusin", activate);
    });
  }

  // Smooth, eased wheel scrolling for the whole page. Off for reduced-motion
  // users and touch input (wheel events only); horizontal wheels pass through.
  function initSmoothScroll() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var root = document.documentElement;
    root.classList.add("has-smooth-scroll");
    var target = window.scrollY;
    var current = window.scrollY;
    var running = false;

    function maxScroll() {
      return root.scrollHeight - window.innerHeight;
    }

    function frame() {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.5) current = target;
      window.scrollTo({ top: current, behavior: "instant" });
      if (current !== target) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function start() {
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }
    }

    window.addEventListener("wheel", function (event) {
      if (event.ctrlKey || event.defaultPrevented) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      var delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      if (!running) target = current = window.scrollY;
      target = Math.max(0, Math.min(maxScroll(), target + delta));
      start();
    }, { passive: false });

    // Keyboard, scrollbar and programmatic scrolls move the page directly.
    window.addEventListener("scroll", function () {
      if (!running) target = current = window.scrollY;
    }, { passive: true });

    // In-page links glide to their section.
    document.addEventListener("click", function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link || link.getAttribute("href").length < 2) return;
      var section = document.getElementById(link.getAttribute("href").slice(1));
      if (!section) return;
      event.preventDefault();
      if (!running) current = window.scrollY;
      target = Math.max(0, Math.min(maxScroll(), section.getBoundingClientRect().top + window.scrollY));
      history.pushState(null, "", link.getAttribute("href"));
      start();
    });
  }

  // Search: jump to the programs section with the chosen filters in the URL.
  function initSearch() {
    var form = document.querySelector(".search-pill");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var params = new URLSearchParams(new FormData(form));
      Array.from(params.keys()).forEach(function (key) {
        if (!params.get(key)) params.delete(key);
      });
      var query = params.toString();
      history.replaceState(null, "", (query ? "?" + query : location.pathname) + "#programs");
      document.getElementById("programs").scrollIntoView({ behavior: "smooth" });
    });
  }

  document.querySelectorAll("[data-carousel-controls]").forEach(initCarousel);
  document.querySelectorAll('[role="tablist"]').forEach(initTabs);
  initPortraits();
  initVideos();
  initMegaMenus();
  initUniversityMenu();
  initSmoothScroll();
  initSearch();
})();
