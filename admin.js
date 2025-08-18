// /public/admin.js (veya /admin.js)

// ==== Yardımcılar ====
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];
const setStatus = (msg, cls = "") => {
  const el = qs("#status");
  if (!el) return;
  el.className = cls;
  el.textContent = msg || "";
};
const downloadBlob = (name, str) => {
  const url = URL.createObjectURL(
    new Blob([str], { type: "application/json" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const isProd =
  location.hostname.endsWith(".vercel.app") ||
  location.hostname.endsWith(".org");

// ==== Dosya yolları ====
const FILES = {
  config: "public/content/config.json",
  categories: "public/content/categories.json",
  articles: "public/content/articles.json",
  landing: "public/content/landing.json",
  authors: "public/content/authors.json",
  pricing: "public/content/pricing.json",
  testimonials: "public/content/testimonials.json",
  faq: "public/content/faq.json",
};

// ==== Şema-tabanlı alan render (input/textarea/select/checkbox/list) ====
/**
 * field: {key, label, type, placeholder, options?, rows?, min?, max?}
 * type: text | textarea | number | date | checkbox | select
 */
function fieldHtml(f, val = "") {
  const id = `f-${f.key.replace(/[^\w-]/g, "_")}`;

  // TEXTAREA
  if (f.type === "textarea") {
    return `
      <label for="${id}">${f.label}</label>
      <textarea id="${id}" data-key="${f.key}" rows="${f.rows || 6}" placeholder="${f.placeholder || ""}">${val ?? ""}</textarea>
    `;
  }

  // SELECT
  if (f.type === "select") {
    const opts = (f.options || [])
      .map(
        (o) =>
          `<option value="${o.value}" ${o.value == val ? "selected" : ""}>${o.label}</option>`
      )
      .join("");
    return `
      <label for="${id}">${f.label}</label>
      <select id="${id}" data-key="${f.key}">
        ${opts}
      </select>
    `;
  }

  // CHECKBOX
  if (f.type === "checkbox") {
    return `
      <label class="chk"><input type="checkbox" id="${id}" data-key="${f.key}" ${val ? "checked" : ""}/> ${f.label}</label>
    `;
  }

  // IMAGE  ⬅️  YENİ
  if (f.type === "image") {
    return `
      <label for="${id}">${f.label}</label>
      <div class="row">
        <input id="${id}" data-key="${f.key}" type="text" value="${val ?? ""}" placeholder="${f.placeholder || "https://…"}" />
        <button type="button" class="btn mini pick-image" data-for="${id}">Yükle</button>
        <button type="button" class="btn mini copy-link" data-for="${id}">Kopyala</button>
      </div>
      <div class="thumb" data-preview="${id}">
        ${val ? `<img src="${val}" alt="">` : ``}
      </div>
    `;
  }

  // DEFAULT (text/number/date/url…)
  return `
    <label for="${id}">${f.label}</label>
    <input id="${id}" data-key="${f.key}" type="${f.type || "text"}" value="${val ?? ""}" placeholder="${f.placeholder || ""}" />
  `;
}

function collect(container, model = {}) {
  qsa("[data-key]", container).forEach((input) => {
    const key = input.dataset.key;
    if (input.type === "checkbox") model[key] = input.checked;
    else model[key] = input.value;
  });
  return model;
}

// ==== Şemalar ====
// Config parçalı editlensin: site/theme/seo/analytics
const SCHEMAS = {
  config_site: [
    { key: "site.name", type: "text", label: "Site Adı" },
    { key: "site.tagline", type: "text", label: "Slogan" },
    { key: "site.logo", type: "image", label: "Logo" }, // image
    { key: "site.favicon", type: "image", label: "Favicon" }, // image
    { key: "site.email", type: "text", label: "Email" },
    { key: "site.phone", type: "text", label: "Telefon" },
    { key: "site.address", type: "text", label: "Adres" },
  ],
  config_theme: [
    { key: "theme.primary", type: "text", label: "Primary Renk" },
    { key: "theme.secondary", type: "text", label: "Secondary Renk" },
    { key: "theme.fontHead", type: "text", label: "Başlık Fontu" },
    { key: "theme.fontBody", type: "text", label: "Gövde Fontu" },
    {
      key: "theme.layout",
      type: "select",
      label: "Layout",
      options: [
        { value: "full", label: "Full Width" },
        { value: "boxed", label: "Boxed" },
      ],
    },
    { key: "theme.header.sticky", type: "checkbox", label: "Sticky Header" },
    {
      key: "theme.header.transparent",
      type: "checkbox",
      label: "Transparent Header",
    },
    { key: "theme.darkMode", type: "checkbox", label: "Dark Mode" },
  ],
  config_seo: [
    { key: "seo.titleTemplate", type: "text", label: "Title Şablonu" },
    {
      key: "seo.metaDescription",
      type: "textarea",
      rows: 3,
      label: "Meta Description",
    },
    { key: "seo.ogImage", type: "image", label: "Varsayılan OG Görsel" }, // image
    { key: "seo.ogImage", type: "text", label: "Varsayılan OG Görsel" },
    { key: "seo.canonicalBase", type: "text", label: "Canonical Base URL" },
  ],
  config_analytics: [
    { key: "analytics.ga4", type: "text", label: "Google Analytics 4 ID" },
    { key: "analytics.gtm", type: "text", label: "GTM ID" },
    { key: "analytics.pixel", type: "text", label: "Facebook Pixel ID" },
  ],

  // Authors
  author_fields: [
    { key: "name", type: "text", label: "Ad" },
    { key: "role", type: "text", label: "Rol" },
    { key: "avatar", type: "image", label: "Avatar" }, // image
    { key: "bio", type: "textarea", rows: 3, label: "Biyografi" },
  ],

  // Category
  cat_fields: [
    { key: "name", type: "text", label: "Ad" },
    { key: "slug", type: "text", label: "Slug" },
    { key: "description", type: "textarea", rows: 3, label: "Açıklama" },
    { key: "color", type: "text", label: "Renk (hex)" },
    { key: "icon", type: "text", label: "İkon adı (lucide)" },
    { key: "cover", type: "image", label: "Kapak Görseli" }, // image (yeni)
    { key: "visible", type: "checkbox", label: "Görünür" },
  ],

  // Article
  article_fields_top: [
    { key: "title", type: "text", label: "Başlık" },
    { key: "slug", type: "text", label: "Slug" },
    { key: "date", type: "date", label: "Tarih" },
    { key: "categoryId", type: "text", label: "Kategori ID" },
    { key: "authorId", type: "text", label: "Yazar ID" },
    { key: "cover", type: "image", label: "Kapak Görseli" }, // image
  ],
  article_fields_meta: [
    {
      key: "status",
      type: "select",
      label: "Durum",
      options: [
        { value: "draft", label: "Taslak" },
        { value: "review", label: "İncelemede" },
        { value: "published", label: "Yayında" },
      ],
    },
    { key: "tags", type: "text", label: "Etiketler (virgülle)" },
    { key: "featured", type: "checkbox", label: "Featured" },
    { key: "readingTime", type: "number", label: "Okuma Süresi (dk)" },
    { key: "seo.title", type: "text", label: "SEO Title" },
    { key: "seo.description", type: "textarea", rows: 3, label: "SEO Desc" },
    { key: "seo.ogImage", type: "image", label: "SEO OG Görsel" }, // image
  ],

  // Landing
  hero_fields: [
    { key: "hero.title", type: "text", label: "Hero Başlık" },
    { key: "hero.tagline", type: "text", label: "Hero Tagline" },
    { key: "hero.cta", type: "text", label: "CTA Label" },
    { key: "hero.href", type: "text", label: "CTA Href" },
    { key: "hero.image", type: "image", label: "Hero Görsel" }, // image
  ],

  // Pricing
  pricing_fields: [
    { key: "title", type: "text", label: "Plan Adı" },
    { key: "price", type: "text", label: "Fiyat" },
    { key: "period", type: "text", label: "Periyot (mo/yr)" },
    { key: "badge", type: "text", label: "Rozet" },
    { key: "illustration", type: "image", label: "Plan Görseli" }, // image (opsiyonel)
    {
      key: "features",
      type: "textarea",
      rows: 4,
      label: "Özellikler (satır satır)",
    },
    { key: "ctaLabel", type: "text", label: "CTA Label" },
    { key: "ctaHref", type: "text", label: "CTA Href" },
  ],

  // Testimonials
  testi_fields: [
    { key: "name", type: "text", label: "Ad" },
    { key: "role", type: "text", label: "Rol" },
    { key: "avatar", type: "image", label: "Avatar" }, // image
    { key: "quote", type: "textarea", rows: 3, label: "Alıntı" },
  ],
};

// utils: get & set by path (a.b.c)
const get = (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj);
const set = (obj, path, val) => {
  const keys = path.split(".");
  let cur = obj;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = val;
    else cur = cur[k] ??= {};
  });
  return obj;
};

// ==== Global durum ====
let current = "config"; // aktif sekme anahtarı
let model = {}; // düzenlenen veri
let raw = ""; // ham json (debug)

// Global tıklama delegasyonu: image butonları
document.addEventListener("click", async (e) => {
  const pickBtn = e.target.closest(".pick-image");
  if (pickBtn) {
    const input = document.getElementById(pickBtn.dataset.for);
    if (!input) return;
    const file = await pickFile();
    if (file) {
      const url = await uploadAsset(file); // prod: /assets/…  | lokal: blob:
      input.value = url;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      const pv = document.querySelector(
        `[data-preview="${pickBtn.dataset.for}"]`
      );
      if (pv) pv.innerHTML = `<img src="${url}" alt="">`;
      setStatus("Görsel yüklendi", "ok");
    }
    return;
  }

  const copyBtn = e.target.closest(".copy-link");
  if (copyBtn) {
    const input = document.getElementById(copyBtn.dataset.for);
    if (!input) return;
    await navigator.clipboard.writeText(input.value || "");
    setStatus("Bağlantı kopyalandı", "ok");
  }
});

// ==== UI Bağlantıları ====
const titleEl = qs("#section-title");
const editor = qs("#editor");
const btnFormat = qs("#format");
const btnDownload = qs("#download");
const btnPublish = qs("#publish");

// ==== Yükleme/Saklama ====
async function load(name) {
  setStatus("Yükleniyor…");
  const res = await fetch(FILES[name], { cache: "no-store" });
  if (!res.ok) throw new Error(`${name} yüklenemedi`);
  model = await res.json();
  raw = JSON.stringify(model, null, 2);
  setStatus("Yüklendi", "ok");
}
async function save(name, payload) {
  if (!isProd) {
    downloadBlob(`${name}.json`, JSON.stringify(payload, null, 2));
    setStatus("Lokal: JSON indirildi", "ok");
    return;
  }
  setStatus("Kaydediliyor…");
  const res = await fetch("/api/save-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: FILES[name],
      content: JSON.stringify(payload, null, 2),
      message: `chore(admin): update ${name}.json`,
    }),
  });
  if (!res.ok) throw new Error("Kaydetme hatası");
  setStatus("Kaydedildi (deploy otomatik)", "ok");
}

// ==== Alan render'ı (config parça) ====
function renderGroup(title, schemaKeys) {
  const html = schemaKeys
    .map((k) => {
      const s = SCHEMAS[k];
      const rows = s.map((f) => fieldHtml(f, get(model, f.key))).join("");
      return `<fieldset><legend>${titleMap(k)}</legend>${rows}</fieldset>`;
    })
    .join("");
  editor.innerHTML = `<form id="f">${html}</form>`;
  titleEl.textContent = "Site Ayarları";
}

function titleMap(k) {
  if (k.includes("config_site")) return "Genel Bilgiler";
  if (k.includes("config_theme")) return "Tema";
  if (k.includes("config_seo")) return "SEO";
  if (k.includes("config_analytics")) return "Analytics";
  return k;
}

// Yardımcı: simple list editor
function renderList(title, items, fields, onChange) {
  titleEl.textContent = title;
  editor.innerHTML = `
    <div class="list">
      ${items
        .map(
          (it, idx) => `
        <details ${idx === 0 ? "open" : ""}>
          <summary>#${idx + 1} — ${it.title || it.name || it.id || it.q || "item"}</summary>
          <div class="grid">
            ${fields.map((f) => fieldHtml(f, get(it, f.key))).join("")}
          </div>
          <div class="row">
            <button data-act="up" data-i="${idx}">↑</button>
            <button data-act="down" data-i="${idx}">↓</button>
            <button data-act="del" data-i="${idx}">Sil</button>
          </div>
        </details>
      `
        )
        .join("")}
      <div class="actions"><button id="add">Yeni Ekle</button></div>
    </div>
  `;
  editor.onclick = (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    const i = +t.dataset.i;
    if (t.dataset.act === "del") items.splice(i, 1);
    if (t.dataset.act === "up" && i > 0)
      [items[i - 1], items[i]] = [items[i], items[i - 1]];
    if (t.dataset.act === "down" && i < items.length - 1)
      [items[i + 1], items[i]] = [items[i], items[i + 1]];
    onChange();
  };
  editor.onchange = () => {
    qsa("details").forEach((det, idx) => {
      const formPart = collect(det, {});
      // formPart düz, nested key yok — fields key’leri düz ise çalışır
      fields.forEach((f) =>
        set(
          items[idx],
          f.key,
          get(formPart, f.key) ??
            det.querySelector(`[data-key="${f.key}"]`)?.value
        )
      );
    });
    onChange();
  };

  editor.onchange = (e) => {
    const t = e.target;
    if (!t) return;
    const key = t.dataset.key;
    if (!key) return;
    const val = t.type === "checkbox" ? t.checked : t.value;
    set(model, key, val);

    // image alanları için küçük önizleme güncellemesi
    const prev = document.querySelector(`[data-preview="${t.id}"]`);
    if (prev && (t.type === "text" || t.type === "url")) {
      prev.innerHTML = t.value ? `<img src="${t.value}" alt="">` : "";
    }

    refresh();
  };

  qs("#add").onclick = (e) => {
    e.preventDefault();
    items.push({});
    onChange();
  };
}

// ==== Sekme render ====
function refresh() {
  // JSON’u güncelle
  raw = JSON.stringify(model, null, 2);
}

async function show(tab) {
  current = tab;

  // Hangi sekme hangi dosyadan besleniyor?
  const FROM_CONFIG = ["config", "menu", "footer", "seo", "analytics"];
  const FROM_OWN = [
    "categories",
    "authors",
    "articles",
    "landing",
    "pricing",
    "testimonials",
    "faq",
  ];
  const NO_LOAD = ["media", "tools"]; // dosya yükleme gerektirmez

  try {
    if (FROM_CONFIG.includes(tab)) {
      await load("config");
    } else if (FROM_OWN.includes(tab)) {
      await load(tab);
    } else if (NO_LOAD.includes(tab)) {
      // model'e dokunma; sadece UI kuracağız
      setStatus("");
    } else {
      // Bilinmeyen bir sekme gelirse güvenli tarafta kal
      await load("config");
    }
  } catch (e) {
    console.error(e);
    setStatus("Yükleme hatası", "err");
    return;
  }
  // router
  if (tab === "config") {
    renderGroup("Site Ayarları", [
      "config_site",
      "config_theme",
      "config_seo",
      "config_analytics",
    ]);
  }
  if (tab === "menu") {
    renderList(
      "Menü",
      model.menu,
      [
        { key: "label", type: "text", label: "Etiket" },
        { key: "href", type: "text", label: "Link" },
        {
          key: "target",
          type: "select",
          label: "Target",
          options: [
            { value: "_self", label: "Aynı sekme" },
            { value: "_blank", label: "Yeni sekme" },
          ],
        },
      ],
      refresh
    );
  }
  if (tab === "footer") {
    // sadece basit sütun düzenleyici
    titleEl.textContent = "Footer";
    editor.innerHTML = `
      <h3>Sosyal</h3>
      <div id="soc"></div>
      <h3>Sütunlar</h3>
      <div id="cols"></div>
      <h3>Telif</h3>
      <label>Telif</label><input data-key="footer.copyright" value="${model.footer.copyright}">
    `;
    // Sosyal
    renderList(
      "Sosyal",
      model.footer.social,
      [
        { key: "icon", type: "text", label: "İkon" },
        { key: "href", type: "text", label: "URL" },
      ],
      refresh,
      qs("#soc")
    );
    // Sütunlar
    const mountCols = (root) => {
      root.innerHTML = "";
      model.footer.columns.forEach((col, i) => {
        const box = document.createElement("div");
        box.className = "colbox";
        box.innerHTML = `
          <label>Başlık</label><input data-col="${i}" data-k="title" value="${col.title || ""}">
          <div class="minilist" id="links-${i}"></div>
          <div class="row"><button data-act="addlink" data-i="${i}">Link Ekle</button></div>
        `;
        root.appendChild(box);
        const mountLinks = () => {
          const cont = qs(`#links-${i}`, root);
          cont.innerHTML = (col.links || [])
            .map(
              (ln, j) => `
            <div class="row">
              <input data-col="${i}" data-idx="${j}" data-k="label" value="${ln.label || ""}">
              <input data-col="${i}" data-idx="${j}" data-k="href" value="${ln.href || ""}">
              <button data-act="dellink" data-i="${i}" data-j="${j}">Sil</button>
            </div>
          `
            )
            .join("");
        };
        col.links ||= [];
        mountLinks();
      });
      root.onclick = (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const i = +b.dataset.i;
        if (b.dataset.act === "addlink")
          model.footer.columns[i].links.push({ label: "", href: "" });
        if (b.dataset.act === "dellink") {
          const j = +b.dataset.j;
          model.footer.columns[i].links.splice(j, 1);
        }
        mountCols(root);
        refresh();
      };
      root.onchange = (e) => {
        const t = e.target;
        if (t.dataset.col && !t.dataset.idx)
          model.footer.columns[t.dataset.col][t.dataset.k] = t.value;
        if (t.dataset.col && t.dataset.idx) {
          model.footer.columns[t.dataset.col].links[t.dataset.idx][
            t.dataset.k
          ] = t.value;
        }
        refresh();
      };
    };
    mountCols(qs("#cols"));
    editor.onchange = (e) => {
      const t = e.target;
      if (t?.dataset?.key) set(model, t.dataset.key, t.value);
      refresh();
    };
  }
  if (tab === "seo") {
    renderGroup("SEO", ["config_seo"]);
  }
  if (tab === "analytics") {
    renderGroup("Analytics", ["config_analytics"]);
  }

  if (tab === "categories") {
    renderList("Kategoriler", model, SCHEMAS.cat_fields, refresh);
  }
  if (tab === "authors") {
    renderList("Yazarlar", model, SCHEMAS.author_fields, refresh);
  }
  if (tab === "articles") {
    // basit liste
    titleEl.textContent = "Yazılar";
    editor.innerHTML = `
      <div class="list">
        ${model
          .map(
            (a, i) => `
          <details>
            <summary>#${i + 1} — ${a.title}</summary>
            <div class="grid">
              ${SCHEMAS.article_fields_top.map((f) => fieldHtml(f, get(a, f.key))).join("")}
              <label>Özet</label>
              <textarea data-key="excerpt" rows="3">${a.excerpt || ""}</textarea>
              ${SCHEMAS.article_fields_meta.map((f) => fieldHtml(f, get(a, f.key))).join("")}
              <label>Gövde (Markdown)</label>
              <textarea data-key="body" rows="12">${a.body || ""}</textarea>
              <button class="mini" data-upload="${i}">Görsel Yükle & Ekle</button>
            </div>
            <div class="row">
              <button data-act="up" data-i="${i}">↑</button>
              <button data-act="down" data-i="${i}">↓</button>
              <button data-act="del" data-i="${i}">Sil</button>
            </div>
          </details>
        `
          )
          .join("")}
        <div class="actions"><button id="add-post">Yeni Yazı</button></div>
      </div>
    `;
    editor.onclick = async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const i = +b.dataset.i;
      if (b.id === "add-post") {
        model.push({
          id: `a-${Date.now()}`,
          title: "Yeni Yazı",
          slug: "",
          date: "",
          categoryId: "",
          cover: "",
          excerpt: "",
          body: "",
          status: "draft",
          tags: "",
          featured: false,
          readingTime: 3,
          authorId: "",
        });
      }
      if (b.dataset.act === "del") model.splice(i, 1);
      if (b.dataset.act === "up" && i > 0)
        [model[i - 1], model[i]] = [model[i], model[i - 1]];
      if (b.dataset.act === "down" && i < model.length - 1)
        [model[i + 1], model[i]] = [model[i], model[i + 1]];
      if (b.dataset.upload) {
        const idx = +b.dataset.upload;
        const file = await pickFile();
        if (file) {
          const url = await uploadAsset(file);
          const ta = b.parentElement.querySelector('[data-key="body"]');
          ta.value = `${ta.value}\n\n![](${url})\n`;
          model[idx].body = ta.value;
          setStatus("Görsel eklendi", "ok");
        }
      }
      show("articles");
      refresh();
    };
    editor.onchange = (e) => {
      const det = e.target.closest("details");
      if (!det) return;
      const i = [...editor.querySelectorAll("details")].indexOf(det);
      const part = collect(det, {});
      Object.assign(model[i], part);
      // özel: tags virgülle string -> array istiyorsan mapping burada
      refresh();
    };
  }

  if (tab === "landing") {
    titleEl.textContent = "Landing";
    editor.innerHTML = `
      <h3>Hero</h3>
      <div class="grid">${SCHEMAS.hero_fields.map((f) => fieldHtml(f, get(model, f.key))).join("")}</div>
      <h3>Özellikler</h3>
      <div id="feat"></div>
      <div class="actions"><button id="addfeat">Özellik Ekle</button></div>
    `;
    const featsEl = qs("#feat");
    const mount = () => {
      featsEl.innerHTML = model.features
        .map(
          (x, i) => `
        <div class="card">
          <input data-k="title" data-i="${i}" value="${x.title || ""}" placeholder="Başlık">
          <input data-k="text"  data-i="${i}" value="${x.text || ""}"  placeholder="Açıklama">
          <input data-k="icon"  data-i="${i}" value="${x.icon || ""}"  placeholder="İkon adı">
          <button data-act="up" data-i="${i}">↑</button>
          <button data-act="down" data-i="${i}">↓</button>
          <button data-act="del" data-i="${i}">Sil</button>
        </div>
      `
        )
        .join("");
    };
    mount();
    editor.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const i = +b.dataset.i;
      if (b.id === "addfeat") {
        model.features.push({ title: "", text: "", icon: "" });
      }
      if (b.dataset.act === "del") model.features.splice(i, 1);
      if (b.dataset.act === "up" && i > 0)
        [model.features[i - 1], model.features[i]] = [
          model.features[i],
          model.features[i - 1],
        ];
      if (b.dataset.act === "down" && i < model.features.length - 1)
        [model.features[i + 1], model.features[i]] = [
          model.features[i],
          model.features[i + 1],
        ];
      mount();
      refresh();
    };
    editor.onchange = (e) => {
      const t = e.target;
      if (t.dataset.key)
        set(model, t.dataset.key, t.type === "checkbox" ? t.checked : t.value);
      if (t.dataset.k) model.features[t.dataset.i][t.dataset.k] = t.value;
      refresh();
    };
  }

  if (tab === "pricing") {
    renderList("Pricing Planları", model, SCHEMAS.pricing_fields, () => {
      // features textarea -> diziye çevir
      qsa("textarea[data-key='features']").forEach((ta, idx) => {
        model[idx].features = ta.value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      });
      refresh();
    });
  }

  if (tab === "testimonials") {
    renderList("Testimonials", model, SCHEMAS.testi_fields, refresh);
  }

  if (tab === "faq") {
    // q & a
    renderList(
      "Sık Sorulan Sorular",
      model,
      [
        { key: "q", type: "text", label: "Soru" },
        { key: "a", type: "textarea", rows: 3, label: "Cevap" },
      ],
      refresh
    );
  }

  if (tab === "media") {
    titleEl.textContent = "Görsel Yükle";
    editor.innerHTML = `
      <input type="file" id="file">
      <button id="upbtn">Yükle</button>
      <div id="out"></div>
    `;
    qs("#upbtn").onclick = async () => {
      const f = qs("#file").files?.[0];
      if (!f) return;
      const url = await uploadAsset(f);
      qs("#out").innerHTML = `<code>${url}</code>`;
      navigator.clipboard.writeText(url);
      setStatus("Yüklendi ve kopyalandı", "ok");
    };
  }

  if (tab === "tools") {
    titleEl.textContent = "Araçlar";
    editor.innerHTML = `
      <button id="genmeta">robots.txt + sitemap.xml üret / commit</button>
    `;
    qs("#genmeta").onclick = async () => {
      if (!isProd) {
        setStatus("Prod değil (env yok).", "warn");
        return;
      }
      setStatus("Üretiliyor…");
      const res = await fetch("/api/generate-meta", { method: "POST" });
      if (!res.ok) {
        setStatus("Hata", "err");
        return;
      }
      setStatus("Gönderildi (deploy)", "ok");
    };
  }

  // genel change yakalayıcı (config parçaları)
  editor.onchange = (e) => {
    const t = e.target;
    if (!t) return;
    const key = t.dataset.key;
    if (!key) return;
    const val = t.type === "checkbox" ? t.checked : t.value;
    set(model, key, val);
    refresh();
  };

  refresh();
}

// ==== Dosya/Upload yardımcıları ====
function pickFile() {
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = () => resolve(inp.files?.[0] || null);
    inp.click();
  });
}
async function uploadAsset(file) {
  if (!isProd) {
    // lokal: preview için blob url
    return URL.createObjectURL(file);
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload-asset", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json();
  return url; // /assets/xxx.ext
}

// ==== Yayınlama / Biçimlendirme / İndirme ====
btnFormat.onclick = () => {
  raw = JSON.stringify(model, null, 2);
  setStatus("Biçimlendirildi", "ok");
};
btnDownload.onclick = () =>
  downloadBlob(`${current}.json`, JSON.stringify(model, null, 2));
btnPublish.onclick = async () => {
  try {
    await save(current, model);
  } catch (e) {
    console.error(e);
    setStatus("Kaydetme hatası", "err");
  }
};

// ==== Tab gezintisi ====
qsa(".admin-nav [data-tab]").forEach((b) => {
  b.onclick = () => {
    // aktif sınıfı yönetimi (estetik)
    qsa(".admin-nav button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    show(b.dataset.tab);
  };
});

// İlk sekme
show("config").catch((e) => {
  console.error(e);
  setStatus("Yükleme hatası", "err");
});
