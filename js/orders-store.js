/**
 * Shared order storage — website checkout + admin dashboard (same browser origin).
 * Use a local server from the project root (e.g. Live Server) so / and /admin share localStorage.
 */
(function (global) {
  var STORAGE_KEY = "oakstreet_orders_v1";

  var STATUS_LABELS = {
    All: "All",
    Processing: "New Orders",
    Confirmed: "Confirmed",
    "Ready To Delivery": "Ready To Delivery",
    "In-Courier": "In-Courier",
    Cancelled: "Cancelled",
    Hold: "Hold",
    "Ship Later": "Ship Later",
    Paid: "Paid",
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function save(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    try {
      global.dispatchEvent(new CustomEvent("oakstreet:orders-updated"));
    } catch (err) {}
  }

  function generateId() {
    return "ORD-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /**
   * @param {object} data
   * @param {string} data.customerName
   * @param {string} data.customerPhone
   * @param {string} data.customerAddress
   * @param {Array<{productId:string,name:string,sku:string,price:number,qty:number,image?:string}>} data.items
   * @param {number} data.total
   */
  function addOrder(data) {
    var orders = load();
    var order = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      customerName: String(data.customerName || "").trim(),
      customerPhone: String(data.customerPhone || "").trim(),
      customerAddress: String(data.customerAddress || "").trim(),
      items: data.items || [],
      total: Math.round(Number(data.total) || 0),
      paid: 0,
      paymentMethod: data.paymentMethod || "COD",
      status: "Processing",
      courier: "",
    };
    orders.unshift(order);
    save(orders);
    return order;
  }

  function patchOrder(id, patch) {
    var orders = load();
    var i = orders.findIndex(function (o) {
      return o.id === id;
    });
    if (i === -1) return null;
    Object.keys(patch).forEach(function (k) {
      orders[i][k] = patch[k];
    });
    save(orders);
    return orders[i];
  }

  function deleteOrder(id) {
    var orders = load();
    var filtered = orders.filter(function (o) {
      return o.id !== id;
    });
    if (filtered.length !== orders.length) {
      save(filtered);
      return true;
    }
    return false;
  }

  function summarize() {
    var orders = load();
    var counts = {
      All: orders.length,
      Processing: 0,
      Confirmed: 0,
      "Ready To Delivery": 0,
      "In-Courier": 0,
      Cancelled: 0,
      Hold: 0,
      "Ship Later": 0,
      Paid: 0,
    };
    var newOrdersTotal = 0;
    orders.forEach(function (o) {
      var s = o.status || "Processing";
      if (counts.hasOwnProperty(s)) counts[s]++;
      if (s === "Processing") newOrdersTotal += o.total || 0;
    });
    return { counts: counts, newOrdersTotal: newOrdersTotal };
  }

  function formatMoney(n) {
    var settings = window.adminSettings ? window.adminSettings.loadSettings() : {currency: '$'};
    return (settings.currency || '$') + " " + (Number(n) || 0).toLocaleString();
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return iso;
    }
  }

  global.OakStreetOrders = {
    STORAGE_KEY: STORAGE_KEY,
    STATUS_LABELS: STATUS_LABELS,
    load: load,
    save: save,
    addOrder: addOrder,
    patchOrder: patchOrder,
    deleteOrder: deleteOrder,
    summarize: summarize,
    formatMoney: formatMoney,
    formatDate: formatDate,
  };
})(window);
