(() => {
  "use strict";

  // Apply theme immediately to minimize flash of unstyled content
  var savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  function initUI() {
    var themeToggle = document.getElementById("theme-toggle");
    var themeText = document.getElementById("theme-text");
    var themeIcon = document.getElementById("theme-icon");
    var settingsTrigger = document.getElementById("settings-trigger");
    var settingsPanel = document.getElementById("settings-panel");
    var sidebarToggle = document.getElementById("sidebar-toggle");
    var sidebar = document.querySelector(".sidebar");

    var moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    var sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';

    // Sync UI with current theme state
    if (themeText) {
      themeText.textContent = savedTheme.charAt(0).toUpperCase() + savedTheme.slice(1);
    }
    if (themeIcon) {
      themeIcon.innerHTML = savedTheme === "dark" ? moonSvg : sunSvg;
    }
    if (themeToggle && themeToggle.type === "checkbox") {
      themeToggle.checked = savedTheme === "dark";
    }

    if (themeToggle) {
      themeToggle.addEventListener(themeToggle.type === "checkbox" ? "change" : "click", function() {
        var isLight = document.documentElement.getAttribute("data-theme") === "light";
        var newTheme = isLight ? "dark" : "light";
        
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        
        if (themeText) {
          themeText.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
        }
        if (themeIcon) {
          themeIcon.innerHTML = newTheme === "dark" ? moonSvg : sunSvg;
        }
        
        // Re-render dashboard components to reflect theme change
        render();
      });
    }

    // Sidebar Toggle with Overlay for Mobile
    var overlay = document.querySelector(".sidebar-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "sidebar-overlay";
      document.body.appendChild(overlay);
    }

    function toggleSidebar() {
      var isOpen = sidebar.classList.toggle("is-open");
      sidebar.classList.toggle("is-expanded");
      overlay.classList.toggle("is-visible", isOpen);
    }

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", toggleSidebar);
      overlay.addEventListener("click", toggleSidebar);
    }

    if (settingsTrigger && settingsPanel) {
      settingsTrigger.addEventListener("click", function() {
        settingsPanel.classList.toggle("is-open");
        settingsTrigger.classList.toggle("active");
      });
    }

    // Set current date
    var dateEl = document.getElementById("current-date");
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString("en-US", { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
    }
  }

  function render() {
    var summary = OakStreetOrders.summarize();
    var allOrders = OakStreetOrders.load();
    var statsGrid = document.querySelector("#stats-grid");
    var recentBody = document.querySelector("#recent-orders-body");

    // Render Summary Cards
    if (statsGrid) {
      statsGrid.innerHTML =
      '<article class="card">' +
      '<div class="hero__badge">Lifetime</div>' +
      "<h3>Total Orders</h3>" +
      '<p style="font-size: 2rem; font-weight: 700; color: var(--color-primary); margin: 0.5rem 0;">' +
      summary.counts.All +
      "</p>" +
      "</article>" +
      '<article class="card">' +
      '<div class="hero__badge" style="background: rgba(232, 148, 26, 0.1); color: #e65100;">Action Required</div>' +
      "<h3>New Orders</h3>" +
      '<p style="font-size: 2rem; font-weight: 700; color: #e65100; margin: 0.5rem 0;">' +
      summary.counts.Processing +
      "</p>" +
      "</article>" +
      '<article class="card">' +
      '<div class="hero__badge" style="background: rgba(74, 124, 89, 0.1); color: #2e7d32;">Potential</div>' +
      "<h3>Pending Revenue</h3>" +
      '<p style="font-size: 2rem; font-weight: 700; color: #2e7d32; margin: 0.5rem 0;">' +
      OakStreetOrders.formatMoney(summary.newOrdersTotal) +
      "</p>" +
      "</article>";
    }

    // Render Weekly Sales Chart
    var chartContainer = document.querySelector("#sales-chart-container");
    if (chartContainer) {
      var dailyData = [];
      var maxVal = 0;

      // Get last 7 days
      for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var dateStr = d.toISOString().split('T')[0];
        var label = d.toLocaleDateString("en-US", { weekday: 'short' });
        
        var dayTotal = allOrders
          .filter(function(o) { return o.createdAt.startsWith(dateStr); })
          .reduce(function(sum, o) { return sum + (o.total || 0); }, 0);
        
        if (dayTotal > maxVal) maxVal = dayTotal;
        dailyData.push({ label: label, value: dayTotal });
      }

      chartContainer.innerHTML = '<div style="display: flex; align-items: flex-end; justify-content: space-around; height: 180px; border-bottom: 2px solid var(--color-border); padding-bottom: 10px;">' +
        dailyData.map(function(d) {
          var height = maxVal > 0 ? (d.value / maxVal * 100) : 0;
          return '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">' +
            '<div style="font-size: 0.7rem; font-weight: 700; color: var(--color-accent-hover);">' + (d.value > 0 ? OakStreetOrders.formatMoney(d.value) : '') + '</div>' +
            '<div style="width: 60%; background: linear-gradient(to top, var(--color-accent), var(--color-accent-bright)); height: ' + height + '%; min-height: 4px; border-radius: 4px 4px 0 0; transition: height 0.3s ease; box-shadow: 0 4px 12px rgba(201, 162, 39, 0.2);"></div>' +
            '<div style="font-size: 0.75rem; color: var(--color-text-muted);">' + d.label + '</div>' +
            '</div>';
        }).join('') +
        '</div>';
    }

    if (recentBody) {
      // Professional view: Prioritize orders that need confirmation
      var pending = allOrders.filter(function(o) { return o.status === "Processing"; }).slice(0, 5);
      var recent = allOrders.slice(0, 5);
      
      var orders = pending.length > 0 ? pending : recent;
      var title = pending.length > 0 ? "⚠️ Orders Needing Confirmation" : "Recent Business Activity";
      
      var titleEl = document.querySelector("h2");
      if (titleEl) titleEl.textContent = title;

      if (orders.length === 0) {
        recentBody.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No orders found in local storage.</td></tr>';
        return;
      }

      recentBody.innerHTML = orders.map(function (o) {
        return (
          '<tr style="border-top: 1px solid var(--color-border);">' +
          '<td style="padding: 1rem; font-family: monospace; font-size: 0.85rem;">' + o.id + '</td>' +
          '<td style="padding: 1rem; font-size: 0.9rem;">' + OakStreetOrders.formatDate(o.createdAt) + '</td>' +
          '<td style="padding: 1rem;">' + o.customerName + '</td>' +
          '<td style="padding: 1rem; font-weight: 600;">' + OakStreetOrders.formatMoney(o.total) + '</td>' +
          '<td style="padding: 1rem;">' +
          (o.status === "Processing" 
            ? '<button class="btn btn--primary btn--confirm" data-id="'+o.id+'" style="padding:0.25rem 0.65rem; font-size:0.75rem;">Confirm Now</button>' 
            : '<span class="hero__badge" style="margin:0;">' + o.status + "</span>"
          ) +
          '</td>' +
          "</tr>"
        );
      }).join("");

      recentBody.querySelectorAll(".btn--confirm").forEach(function(btn) {
          btn.addEventListener("click", function() {
              var id = btn.getAttribute("data-id");
              OakStreetOrders.patchOrder(id, { status: "Confirmed" });
              render();
          });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    initUI();
    render();
  });

  window.addEventListener("oakstreet:orders-updated", render);
})();
