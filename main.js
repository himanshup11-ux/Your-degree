// YourDegree home page interactions: carousels, tabs, counsellor switcher, search.
(function () {
  "use strict";

  // Carousel controls: "1/4" pill + dots. When the controls sit next to a
  // scrollable track, the arrows also scroll it one card at a time.
  function initCarousel(controls) {
    var pages = Number(controls.dataset.pages) || 1;
    var pagination = controls.querySelector("[data-pagination]");
    var prev = controls.querySelector("[data-carousel-prev]");
    var next = controls.querySelector("[data-carousel-next]");
    var track = controls.parentElement.querySelector("[data-carousel-track]");
    var index = 0;

    function render() {
      pagination.innerHTML = "";
      for (var i = 0; i < pages; i++) {
        if (i === index) {
          var active = document.createElement("span");
          active.className = "pagination__active";
          active.setAttribute("aria-live", "polite");
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
      if (track && track.firstElementChild) {
        var item = track.firstElementChild;
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        track.scrollTo({ left: index * (item.getBoundingClientRect().width + gap), behavior: "smooth" });
      }
      render();
    }

    prev.addEventListener("click", function () { goTo(index - 1); });
    next.addEventListener("click", function () { goTo(index + 1); });
    pagination.addEventListener("click", function (event) {
      var dot = event.target.closest(".pagination__dot");
      if (dot) goTo(Number(dot.dataset.index));
    });

    render();
  }

  // Tabs: toggle the active state within each tablist.
  function initTabs(tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (event) {
        var step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        var target = tabs[(i + step + tabs.length) % tabs.length];
        select(target);
        target.focus();
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
  initSearch();
})();
