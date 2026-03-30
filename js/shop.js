(function () {
  "use strict";

  var cart = [];

  function $(sel) {
    return document.querySelector(sel);
  }

  function renderProducts() {
    var grid = $("#shop-grid");
    if (!grid || !window.OAKST_CATALOG) return;
    grid.innerHTML = "";
    OAKST_CATALOG.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "card";
      card.innerHTML =
        '<img src="' +
        (p.image || "") +
        '" alt="" width="120" height="120" style="border-radius:10px;object-fit:cover;margin-bottom:0.75rem;" loading="lazy" />' +
        "<h3>" +
        escapeHtml(p.name) +
        "</h3>" +
        "<p class=\"shop-price\">" +
        OakStreetOrders.formatMoney(p.price) +
        " · <span class=\"shop-sku\">" +
        escapeHtml(p.sku) +
        "</span></p>" +
        '<label class="shop-qty-label">Qty <input type="number" min="1" value="1" data-qty="' +
        escapeAttr(p.id) +
        '" class="shop-qty-input" /></label>' +
        '<div style="display:flex; gap:0.5rem; margin-top:0.5rem;">' +
        '<button type="button" class="btn btn--primary shop-add" data-id="' +
        escapeAttr(p.id) +
        '" style="flex:1">Add to cart</button>' +
        '<a href="tel:+8801602002105" class="btn btn--secondary" title="Call to order" style="padding:0.5rem 0.85rem; display:flex; align-items:center; text-decoration:none; border-radius:4px;">📞</a>' +
        '</div>';
      grid.appendChild(card);
    });

    grid.querySelectorAll(".shop-add").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var inp = grid.querySelector('[data-qty="' + id + '"]');
        var qty = Math.max(1, parseInt(inp && inp.value, 10) || 1);
        var prod = OAKST_CATALOG.find(function (x) {
          return x.id === id;
        });
        if (!prod) return;
        var line = cart.find(function (c) {
          return c.productId === id;
        });
        if (line) line.qty += qty;
        else
          cart.push({
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            price: prod.price,
            qty: qty,
            image: prod.image,
          });
        renderCart();
        showToast("Added to cart");
      });
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  function renderCart() {
    var el = $("#shop-cart-body");
    var sumEl = $("#shop-cart-total");
    if (!el) return;
    if (!cart.length) {
      el.innerHTML = "<tr><td colspan=\"4\" style=\"color:var(--color-text-muted);padding:1rem;\">Cart is empty. Add products above.</td></tr>";
      if (sumEl) sumEl.textContent = OakStreetOrders.formatMoney(0);
      return;
    }
    var total = 0;
    el.innerHTML = "";
    cart.forEach(function (line) {
      var sub = line.price * line.qty;
      total += sub;
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(line.name) +
        "</td><td>" +
        line.qty +
        '</td><td class="money">' +
        OakStreetOrders.formatMoney(sub) +
        '</td><td><button type="button" class="btn btn--secondary shop-remove" data-product-id="' +
        escapeAttr(line.productId) +
        '" style="padding:0.35rem 0.65rem;font-size:0.85rem;">Remove</button></td>';
      el.appendChild(tr);
    });
    el.querySelectorAll(".shop-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pid = btn.getAttribute("data-product-id");
        cart = cart.filter(function (c) {
          return c.productId !== pid;
        });
        renderCart();
      });
    });
    if (sumEl) sumEl.textContent = OakStreetOrders.formatMoney(total);
  }

  function showToast(msg) {
    var t = $("#shop-toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-visible");
    clearTimeout(showToast._h);
    showToast._h = setTimeout(function () {
      t.classList.remove("is-visible");
    }, 2400);
  }

  function initCheckout() {
    var form = $("#shop-checkout-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!cart.length) {
        showToast("Your cart is empty.");
        return;
      }
      var name = $("#shop-name").value.trim();
      var phone = $("#shop-phone").value.trim();
      var addr = $("#shop-address").value.trim();
      if (!name || !phone) {
        showToast("Please enter name and phone.");
        return;
      }
      var total = cart.reduce(function (s, l) {
        return s + l.price * l.qty;
      }, 0);
      var order = OakStreetOrders.addOrder({
        customerName: name,
        customerPhone: phone,
        customerAddress: addr,
        items: cart.map(function (l) {
          return {
            productId: l.productId,
            name: l.name,
            sku: l.sku,
            price: l.price,
            qty: l.qty,
            image: l.image,
          };
        }),
        total: total,
        paymentMethod: "COD",
      });
      cart = [];
      renderCart();
      form.reset();
      showToast("Order placed! ID: " + order.id);
      var successMsg = "Your order " + order.id + " was sent. We will call you at " + phone + ".";
      $("#shop-order-result").textContent = successMsg;

      // Task 6: Trigger email notification via mailto
      var subject = "New Order: " + order.id;
      var body = "Order Details:\n" +
                 "----------------\n" +
                 "Order ID: " + order.id + "\n" +
                 "Customer: " + name + "\n" +
                 "Phone: " + phone + "\n" +
                 "Address: " + addr + "\n\n" +
                 "Items:\n" + order.items.map(function(i) { return "- " + i.name + " (x" + i.qty + ")"; }).join("\n") + "\n\n" +
                 "Total: " + OakStreetOrders.formatMoney(total);

      window.location.href = "mailto:ulrafi3623@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderProducts();
    renderCart();
    initCheckout();
  });
})();
