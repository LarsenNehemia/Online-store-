"use strict";

/* ---------- Data ---------- */
const PRODUCTS = [
  {
    id: 1,
    name: "Arc Desk Lamp",
    category: "Lighting",
    price: 64,
    rating: 4.8,
    desc: "Dimmable LED with a weighted base.",
    color: "#e07a5f",
  },
  {
    id: 2,
    name: "Linen Notebook",
    category: "Stationery",
    price: 18,
    rating: 4.6,
    desc: "160 pages, lay-flat binding.",
    color: "#3d5a80",
  },
  {
    id: 3,
    name: "Ceramic Mug",
    category: "Kitchen",
    price: 22,
    rating: 4.4,
    desc: "Hand-glazed, holds 350 ml.",
    color: "#81b29a",
  },
  {
    id: 4,
    name: "Walnut Monitor Riser",
    category: "Desk",
    price: 89,
    rating: 4.9,
    desc: "Solid walnut with a cable slot.",
    color: "#6d4c41",
  },
  {
    id: 5,
    name: "Felt Desk Mat",
    category: "Desk",
    price: 39,
    rating: 4.5,
    desc: "Wool felt, 80 x 40 cm.",
    color: "#7b6d8d",
  },
  {
    id: 6,
    name: "Glass Carafe Set",
    category: "Kitchen",
    price: 35,
    rating: 4.2,
    desc: "Carafe and two tumblers.",
    color: "#2a9d8f",
  },
  {
    id: 7,
    name: "Brass Pen",
    category: "Stationery",
    price: 48,
    rating: 4.7,
    desc: "Refillable, machined from solid brass.",
    color: "#b08d57",
  },
  {
    id: 8,
    name: "Clip-on Reading Light",
    category: "Lighting",
    price: 27,
    rating: 4.1,
    desc: "Rechargeable, three brightness levels.",
    color: "#bc4749",
  },
];

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
const debounce = (fn, ms = 200) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};

/* localStorage can throw (private mode, quota), so wrap it. */
const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

/* ---------- Theme ---------- */
const Theme = {
  init() {
    const saved = storage.get("theme", null);
    if (saved) document.documentElement.dataset.theme = saved;
    $("#theme-toggle")?.addEventListener("click", () => {
      const dark =
        document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme &&
          matchMedia("(prefers-color-scheme: dark)").matches);
      const next = dark ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      storage.set("theme", next);
    });
  },
};

/* ---------- Cart (state is { [productId]: quantity }) ---------- */
const Cart = {
  items: storage.get("cart", {}),
  save() {
    storage.set("cart", this.items);
    this.render();
  },
  add(id) {
    this.items[id] = (this.items[id] || 0) + 1;
    this.save();
  },
  change(id, delta) {
    const qty = (this.items[id] || 0) + delta;
    if (qty <= 0) delete this.items[id];
    else this.items[id] = qty;
    this.save();
  },
  clear() {
    this.items = {};
    this.save();
  },
  lines() {
    return Object.entries(this.items)
      .map(([id, qty]) => ({
        product: PRODUCTS.find((p) => p.id === Number(id)),
        qty,
      }))
      .filter((l) => l.product);
  },
  count() {
    return this.lines().reduce((n, l) => n + l.qty, 0);
  },
  total() {
    return this.lines().reduce((sum, l) => sum + l.product.price * l.qty, 0);
  },

  init() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="backdrop" hidden></div>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div class="total"><h2 style="margin:0">Your cart</h2><button class="btn ghost" data-close>Close</button></div>
        <ul id="cart-list"></ul>
        <div class="total"><span>Total</span><span id="cart-total"></span></div>
        <button class="btn" id="checkout">Checkout</button>
      </aside>`,
    );
    this.drawer = $(".drawer");
    this.backdrop = $(".backdrop");
    $("#cart-toggle").addEventListener("click", () => this.open());
    this.backdrop.addEventListener("click", () => this.close());
    this.drawer.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) return this.close();
      const btn = e.target.closest("[data-delta]");
      if (btn) this.change(btn.dataset.id, Number(btn.dataset.delta));
    });
    $("#checkout").addEventListener("click", () => {
      alert(
        `Thanks! This demo has no payment step. Order total: ${money(this.total())}`,
      );
      this.clear();
      this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
    this.render();
  },
  open() {
    this.drawer.classList.add("open");
    this.backdrop.hidden = false;
    $("[data-close]", this.drawer).focus();
  },
  close() {
    this.drawer.classList.remove("open");
    this.backdrop.hidden = true;
    $("#cart-toggle").focus();
  },

  render() {
    $("#cart-count").textContent = this.count();
    const lines = this.lines();
    $("#cart-list").innerHTML = lines.length
      ? lines
          .map(
            ({ product: p, qty }) => `
          <li><div><strong>${p.name}</strong><br><span class="muted">${money(p.price)} each</span></div>
          <div class="qty">
            <button data-id="${p.id}" data-delta="-1" aria-label="Remove one ${p.name}">-</button>
            <span>${qty}</span>
            <button data-id="${p.id}" data-delta="1" aria-label="Add one ${p.name}">+</button>
          </div></li>`,
          )
          .join("")
      : `<li class="muted">Your cart is empty. Add something from the products page.</li>`;
    $("#cart-total").textContent = money(this.total());
    $("#checkout").disabled = lines.length === 0;
  },
};

/* ---------- Product listing ---------- */
const Catalog = {
  state: { query: "", category: "all", sort: "featured" },

  init() {
    this.grid = $("#product-grid");
    if (!this.grid) return;
    const limit = Number(this.grid.dataset.limit) || Infinity;

    // The products page has controls; the home page just shows featured items.
    const category = $("#category");
    if (category) {
      [...new Set(PRODUCTS.map((p) => p.category))]
        .sort()
        .forEach((c) =>
          category.insertAdjacentHTML("beforeend", `<option>${c}</option>`),
        );
      $("#search").addEventListener(
        "input",
        debounce((e) => this.update({ query: e.target.value })),
      );
      category.addEventListener("change", (e) =>
        this.update({ category: e.target.value }),
      );
      $("#sort").addEventListener("change", (e) =>
        this.update({ sort: e.target.value }),
      );
    }
    this.grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (btn) Cart.add(btn.dataset.add);
    });
    this.limit = limit;
    this.render();
  },

  update(patch) {
    Object.assign(this.state, patch);
    this.render();
  },

  visible() {
    const { query, category, sort } = this.state;
    const q = query.trim().toLowerCase();
    const sorters = {
      featured: () => 0,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
    };
    return PRODUCTS.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || `${p.name} ${p.desc} ${p.category}`.toLowerCase().includes(q)),
    )
      .sort(sorters[sort])
      .slice(0, this.limit);
  },

  render() {
    const list = this.visible();
    this.grid.innerHTML = list.length
      ? list
          .map(
            (p) => `
        <article class="card">
          <div class="swatch" style="background:${p.color}" aria-hidden="true">${p.name[0]}</div>
          <div class="body">
            <span class="muted">${p.category}</span>
            <h3>${p.name}</h3>
            <p style="margin:0">${p.desc}</p>
            <div class="row">
              <span class="price">${money(p.price)}</span>
              <button class="btn" data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to cart</button>
            </div>
          </div>
        </article>`,
          )
          .join("")
      : `<div class="empty">No products match your search. Try a different word or reset the category.</div>`;
    const count = $("#result-count");
    if (count)
      count.textContent = `${list.length} product${list.length === 1 ? "" : "s"} shown`;
  },
};

/* ---------- Contact form validation ---------- */
const ContactForm = {
  init() {
    const form = $("#contact-form");
    if (!form) return;
    const validate = (field) => {
      let msg = "";
      if (field.validity.valueMissing) msg = "This field is required.";
      else if (field.validity.typeMismatch)
        msg = "Enter a valid email address.";
      else if (field.validity.tooShort)
        msg = `Use at least ${field.minLength} characters.`;
      field.setCustomValidity(msg);
      field.setAttribute("aria-invalid", String(Boolean(msg)));
      $(`[data-error-for="${field.name}"]`, form).textContent = msg;
      return !msg;
    };
    form.addEventListener(
      "blur",
      (e) => e.target.name && validate(e.target),
      true,
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = [...form.elements].filter((f) => f.name);
      const allValid = fields.map(validate).every(Boolean); // map first so every field shows its error
      const status = $("#form-status");
      if (!allValid) {
        status.textContent = "Fix the highlighted fields and try again.";
        fields.find((f) => !f.validity.valid)?.focus();
        return;
      }
      // A real site would POST this to a server here.
      console.log("Contact form:", Object.fromEntries(new FormData(form)));
      form.reset();
      status.textContent = "Message sent. We reply within one business day.";
    });
  },
};

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach((a) => {
    if (a.getAttribute("href") === current)
      a.setAttribute("aria-current", "page");
  });
  Theme.init();
  Cart.init();
  Catalog.init();
  ContactForm.init();
});
