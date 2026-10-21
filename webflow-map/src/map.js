// El Diez locations map. One <script> + one container in Webflow:
//   <div id="eldiez-map"></div><script src=".../eldiez-map.js" defer></script>
// Stores come from the Google Sheet ("Pickup" tab); the bundled list is the fallback if the Sheet fails.
(() => {
  const root = document.querySelector("[data-eldiez-map], #eldiez-map");
  if (!root || root.dataset.edmReady) return;
  root.dataset.edmReady = "1";
  // Webflow wraps embeds in a .w-embed div that shrinks to content inside flex parents
  // (e.g. #pickup uses align-items:flex-start), which left the map column 0px wide.
  const wrapper = root.parentElement;
  if (wrapper && wrapper.classList.contains("w-embed")) {
    wrapper.style.width = "100%";
    wrapper.style.alignSelf = "stretch";
  }

  // Replaced at build time.
  const CSS = __CSS__;
  const FALLBACK = __FALLBACK__; // [name, address, lat, lng, orderUrl]
  const SHEET_CSV = root.dataset.sheet || __SHEET__;

  const CDN = {
    leafletCss: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
    leafletJs: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
    clusterCss:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.1/MarkerCluster.min.css",
    clusterJs:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.1/leaflet.markercluster.js",
    gestureCss:
      "https://cdn.jsdelivr.net/npm/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.css",
    gestureJs:
      "https://cdn.jsdelivr.net/npm/leaflet-gesture-handling@1.2.2/dist/leaflet-gesture-handling.min.js",
  };
  // Esri: keyless basemap and geocoder.
  const TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_";
  const GEOCODER = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/";

  const CHILI =
    '<path d="M27.5982 37.5043C33.6828 37.4272 26.6733 42.2968 24.1191 42.4217C16.5589 44.1778 7.68067 40.4213 3.98696 33.7515C0.422388 26.9182-3.38146 13.4978 5.26884 9.00657C5.26884 9.00657 7.72055 7.84381 11.1484 8.55836C16.1904 9.61091 17.6394 16.0695 16.6158 20.5148C14.8364 28.2445 19.455 37.6054 27.5963 37.5025L27.5982 37.5043Z" fill="F1"/><path d="M13.3922 2.346C11.9812 3.86696 10.8379 5.62305 9.93777 7.46914C9.03761 9.34095 8.43181 11.3505 8.25899 13.4115C8.14885 14.4861 6.56501 14.4273 6.54222 13.3436C6.55551 12.7723 6.5783 12.1973 6.64666 11.6297C7.03218 8.21491 8.39761 4.9489 10.3138 2.07414C10.6195 1.61675 10.9481 1.16303 11.2975 0.731353C11.3526 0.663388 11.4494 0.551343 11.5045 0.485214C11.9755-0.0768792 12.8301-0.163212 13.4112 0.292341C14.0873 0.808512 14.074 1.84269 13.3903 2.346H13.3922Z" fill="F2"/>';
  const chili = (w, h, f1, f2) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 31 43">${CHILI.replace("F1", f1).replace("F2", f2)}</svg>`;
  const PIN = chili(30, 41, "#FF151A", "#FFA500");
  const PIN_LIST = chili(18, 25, "#FF151A", "#FFA500");
  const PIN_LIST_ON = chili(18, 25, "#fff", "rgba(255,255,255,.6)");
  const ICON_SEARCH =
    '<svg class="edm-sico" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
  const ICON_GEO =
    '<svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3A9 9 0 0013 3.06V1h-2v2.06A9 9 0 003.06 11H1v2h2.06A9 9 0 0011 20.94V23h2v-2.06A9 9 0 0020.94 13H23v-2h-2.06zM12 19a7 7 0 110-14 7 7 0 010 14z"/></svg>';

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hl = (t, q) => {
    const i = q ? t.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return esc(t);
    return (
      esc(t.slice(0, i)) +
      "<mark>" +
      esc(t.slice(i, i + q.length)) +
      "</mark>" +
      esc(t.slice(i + q.length))
    );
  };
  const miles = (a, b) => {
    const r = Math.PI / 180;
    const x =
      Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
    return 7918 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  const validCoord = (lat, lng) => lat > 18 && lat < 72 && lng > -170 && lng < -60;
  const loadCss = (href) =>
    document.head.insertAdjacentHTML("beforeend", `<link rel="stylesheet" href="${href}">`);
  const loadJs = (src) =>
    new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = () => fail(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  const getJson = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

  function parseCsv(text) {
    const rows = [];
    let row = [],
      field = "",
      quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else field += c;
    }
    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  // "Live" or a launch date that already passed means the store is open. Dates may omit the year.
  function isOpen(status, today) {
    const s = status.trim().toLowerCase();
    if (!s || s === "live" || s === "open") return true;
    const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (!m) return false;
    let year = m[3] ? +m[3] : today.getFullYear();
    if (year < 100) year += 2000;
    let d = new Date(year, m[1] - 1, m[2]);
    // Without a year, a date more than ~6 months ahead is last year's launch.
    if (!m[3] && d - today > 182 * 864e5) d = new Date(year - 1, m[1] - 1, m[2]);
    return d <= today;
  }

  const known = new Map();
  FALLBACK.forEach(([name, , lat, lng, url]) => {
    known.set(url, { lat, lng });
    known.set(norm(name), { lat, lng });
  });

  async function geocodeAddress(address) {
    const j = await getJson(
      `${GEOCODER}findAddressCandidates?f=json&countryCode=USA&maxLocations=1&SingleLine=${encodeURIComponent(address)}`,
    );
    const c = j.candidates && j.candidates[0];
    return c && c.score > 80 ? { lat: c.location.y, lng: c.location.x } : null;
  }

  async function loadStores() {
    // Google's export can be slow (5s+) or blocked on some networks; give up after 8s.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);
    const text = await fetch(SHEET_CSV, { signal: abort.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .finally(() => clearTimeout(timer));
    const [header, ...rows] = parseCsv(text);
    const col = (re, fallback) => {
      const i = header.findIndex((h) => re.test(h.trim()));
      return i < 0 ? fallback : i;
    };
    const iName = col(/title|name/i, 1),
      iAddr = col(/address/i, 2),
      iUrl = col(/el diez/i, 3);
    const iStatus = col(/launch|status/i, 0),
      iLat = col(/^lat/i, 5),
      iLng = col(/^(lng|lon)/i, 6);
    const today = new Date();
    const stores = [],
      missing = [];
    for (const r of rows) {
      const name = (r[iName] || "").trim(),
        address = (r[iAddr] || "").trim().replace(/\s+/g, " ");
      const url = (r[iUrl] || "").trim();
      if (!name || !address || !/^https?:\/\//.test(url) || !isOpen(r[iStatus] || "", today))
        continue;
      let lat = parseFloat(r[iLat]),
        lng = parseFloat(r[iLng]);
      const s = { name, address, url };
      if (!validCoord(lat, lng)) ({ lat, lng } = known.get(url) || known.get(norm(name)) || {});
      if (validCoord(lat, lng)) stores.push(Object.assign(s, { lat, lng }));
      else missing.push(s);
    }
    // New rows without coordinates: geocode the address (a handful at most).
    for (const s of missing.slice(0, 25)) {
      const p = await geocodeAddress(s.address).catch(() => null);
      if (p) stores.push(Object.assign(s, p));
      else console.warn("[El Diez map] No coordinates for", s.name, "-", s.address);
    }
    if (stores.length < FALLBACK.length / 2) throw new Error("Sheet returned too few stores");
    return stores;
  }

  const fallbackStores = () =>
    FALLBACK.map(([name, address, lat, lng, url]) => ({ name, address, lat, lng, url }));

  // ---------- markup ----------
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
  root.classList.add("edm", "collapsed");
  root.innerHTML = `
    <div class="edm-top">
      <div class="edm-search">
        <input class="edm-si" type="text" placeholder="Search by zip, city or store" autocomplete="off" aria-label="Search by zip, city or store">
        ${ICON_SEARCH}
        <button type="button" class="edm-clear" aria-label="Clear search">&times;</button>
        <div class="edm-ac" role="listbox"></div>
      </div>
      <button type="button" class="edm-geo">${ICON_GEO}<span>Use my location</span></button>
      <div class="edm-cnt"><span><b class="edm-n">0</b> <span class="edm-nl">locations</span></span><span class="edm-sort"></span></div>
    </div>
    <div class="edm-listw"><div class="edm-list"></div><button type="button" class="edm-more"></button></div>
    <div class="edm-map"><div class="edm-mapc"></div><div class="edm-load">Loading locations…</div></div>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <!-- Esri grays: water ~0.82, land ~0.92, roads 1. Water → mid blue, land → near-white blue. -->
      <filter id="edm-land" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
        <feComponentTransfer><feFuncR type="table" tableValues="0 0 0 0 0 0 .1 .3 .68 .93 1"/><feFuncG type="table" tableValues=".35 .4 .45 .5 .55 .6 .65 .7 .84 .965 1"/><feFuncB type="table" tableValues=".6 .65 .7 .75 .8 .85 .9 .93 .98 1 1"/></feComponentTransfer>
      </filter>
      <!-- Label text (~0.19) → dark navy #003A73, white halo stays white. -->
      <filter id="edm-labels" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/>
        <feComponentTransfer><feFuncR type="table" tableValues="0 0 0 0 .15 .3 .45 .6 .75 .9 1"/><feFuncG type="table" tableValues=".2 .22 .227 .227 .33 .44 .55 .66 .77 .89 1"/><feFuncB type="table" tableValues=".4 .43 .45 .45 .53 .61 .69 .77 .85 .93 1"/></feComponentTransfer>
      </filter>
    </svg>`;
  const $ = (sel) => root.querySelector(sel);
  const input = $(".edm-si"),
    ac = $(".edm-ac"),
    clearBtn = $(".edm-clear"),
    list = $(".edm-list");
  const more = $(".edm-more"),
    geoBtn = $(".edm-geo"),
    geoLabel = $(".edm-geo span");
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  // ---------- state ----------
  let L,
    map,
    cluster,
    stores = [],
    markers = [],
    visible = [];
  let origin = null,
    originLabel = "",
    originMarker = null,
    acItems = [],
    acIdx = -1,
    suggestTimer,
    suggestSeq = 0;
  // Sheet data that arrived after the visitor started using the map; applied on the next reset.
  let touched = false,
    pendingStores = null,
    pinIcon;

  function popup(s) {
    return (
      `<div class="edm-pop"><div class="edm-pt">${esc(s.name)}</div><div class="edm-pa">${esc(s.address)}</div>` +
      `<a class="edm-po" href="${esc(s.url)}" target="_blank" rel="noopener">Pick up or delivery</a></div>`
    );
  }

  function renderList() {
    const items = visible.slice();
    if (origin) items.sort((a, b) => miles(origin, a) - miles(origin, b));
    else items.sort((a, b) => a.name.localeCompare(b.name));
    $(".edm-n").textContent = items.length;
    $(".edm-nl").textContent = items.length === 1 ? "location" : "locations";
    $(".edm-sort").textContent = origin ? `Nearest to ${originLabel}` : "A → Z";
    list.innerHTML = items.length
      ? items
          .map(
            (s) =>
              `<button type="button" class="edm-c" data-id="${s.id}"><span class="edm-cico">${PIN_LIST}</span>` +
              `<span class="edm-cinf"><span class="edm-cn">${esc(s.name)}</span><span class="edm-ca" style="display:block">${esc(s.address)}</span></span>` +
              (origin ? `<span class="edm-cd">${miles(origin, s).toFixed(1)} mi</span>` : "") +
              "</button>",
          )
          .join("")
      : '<div class="edm-empty">No stores match. Press Enter to search that area.</div>';
    more.style.display = items.length > 3 ? "" : "none";
    more.textContent = root.classList.contains("collapsed")
      ? `View all ${items.length} locations`
      : "Show less";
    list.scrollTop = 0;
  }

  function markActive(s) {
    list.querySelectorAll(".edm-c.on").forEach((e) => {
      e.classList.remove("on");
      e.querySelector(".edm-cico").innerHTML = PIN_LIST;
    });
    const card = list.querySelector(`[data-id="${s.id}"]`);
    if (!card) return;
    card.classList.add("on");
    card.querySelector(".edm-cico").innerHTML = PIN_LIST_ON;
    list.scrollTop =
      card.offsetTop - list.offsetTop - list.clientHeight / 2 + card.clientHeight / 2;
  }

  function select(s) {
    markActive(s);
    if (isMobile()) $(".edm-map").scrollIntoView({ behavior: "smooth", block: "center" });
    cluster.zoomToShowLayer(markers[s.id], () => {
      map.setView([s.lat, s.lng], Math.max(map.getZoom(), 14));
      markers[s.id].openPopup();
    });
  }

  // Show only these stores on the map and in the list, and frame them.
  function showStores(subset, fit = true) {
    visible = subset;
    cluster.clearLayers();
    cluster.addLayers(subset.map((s) => markers[s.id]));
    renderList();
    if (fit && subset.length) {
      map.fitBounds(L.latLngBounds(subset.map((s) => [s.lat, s.lng])), {
        padding: [40, 40],
        maxZoom: 13,
      });
    }
  }

  function setOrigin(point, label) {
    origin = point;
    originLabel = label;
    if (originMarker) map.removeLayer(originMarker);
    originMarker = L.marker([point.lat, point.lng], {
      icon: L.divIcon({
        html: '<div class="edm-me"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: "",
      }),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map);
    showStores(stores, false);
    const nearest = stores
      .slice()
      .sort((a, b) => miles(point, a) - miles(point, b))
      .slice(0, 3);
    map.fitBounds(L.latLngBounds([[point.lat, point.lng], ...nearest.map((s) => [s.lat, s.lng])]), {
      padding: [50, 50],
      maxZoom: 13,
    });
  }

  function resetAll() {
    origin = null;
    if (originMarker) map.removeLayer(originMarker);
    originMarker = null;
    input.value = "";
    clearBtn.classList.remove("on");
    closeAC();
    touched = false;
    if (pendingStores) {
      setStores(pendingStores);
      pendingStores = null;
    } else showStores(stores);
  }

  function setStores(list) {
    stores = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    stores.forEach((s, i) => (s.id = i));
    markers = stores.map((s) =>
      L.marker([s.lat, s.lng], { icon: pinIcon, title: s.name, alt: s.name })
        .bindPopup(popup(s), { maxWidth: 300 })
        .on("click", () => {
          touched = true;
          markActive(s);
        }),
    );
    showStores(stores);
  }

  const signature = (list) =>
    list
      .map((s) => [s.name, s.address, s.lat, s.lng, s.url].join("|"))
      .sort()
      .join("\n");

  // ---------- search ----------
  const matches = (q) => {
    const n = q.toLowerCase();
    return stores.filter(
      (s) => s.name.toLowerCase().includes(n) || s.address.toLowerCase().includes(n),
    );
  };
  function closeAC() {
    ac.classList.remove("open");
    ac.innerHTML = "";
    acItems = [];
    acIdx = -1;
  }
  function paintAC(q, places) {
    const storeHits = q.length > 1 ? matches(q).slice(0, 5) : [];
    acItems = [
      ...storeHits.map((s) => ({ type: "store", s })),
      ...places.map((p) => ({ type: "place", p })),
    ];
    if (!acItems.length) return closeAC();
    let html = "";
    acItems.forEach((it, i) => {
      if (i === 0 && it.type === "store") html += '<div class="edm-ach">Stores</div>';
      if (it.type === "place" && (i === 0 || acItems[i - 1].type === "store"))
        html += '<div class="edm-ach">Search near</div>';
      html +=
        it.type === "store"
          ? `<button type="button" class="edm-aci" data-i="${i}"><div class="edm-acn">${hl(it.s.name, q)}</div><div class="edm-aca">${hl(it.s.address, q)}</div></button>`
          : `<button type="button" class="edm-aci" data-i="${i}"><div class="edm-acn">${esc(it.p.text.replace(/, USA$/, ""))}</div></button>`;
    });
    ac.innerHTML = html;
    acIdx = -1;
    ac.classList.add("open");
  }
  function paintActive() {
    ac.querySelectorAll(".edm-aci").forEach((e) =>
      e.classList.toggle("act", +e.dataset.i === acIdx),
    );
  }

  async function suggestPlaces(q) {
    const seq = ++suggestSeq;
    let places = [];
    if (q.length > 2) {
      const center = map.getCenter();
      places = await getJson(
        `${GEOCODER}suggest?f=json&countryCode=USA&maxSuggestions=4&category=Postal,Populated%20Place` +
          `&location=${center.lng},${center.lat}&text=${encodeURIComponent(q)}`,
      ).then(
        (j) => j.suggestions || [],
        () => [],
      );
    }
    if (seq === suggestSeq && input.value.trim() === q) paintAC(q, places);
  }

  async function searchPlace(text, magicKey) {
    const j = await getJson(
      `${GEOCODER}findAddressCandidates?f=json&countryCode=USA&maxLocations=1&SingleLine=${encodeURIComponent(text)}` +
        (magicKey ? `&magicKey=${encodeURIComponent(magicKey)}` : ""),
    ).catch(() => ({}));
    const c = j.candidates && j.candidates[0];
    if (!c) {
      list.innerHTML = `<div class="edm-empty">We couldn't find “${esc(text)}”. Try a zip code or city.</div>`;
      return;
    }
    input.value = c.address.replace(/, USA$/, "");
    setOrigin({ lat: c.location.y, lng: c.location.x }, c.address.split(",")[0]);
  }

  function pick(it) {
    closeAC();
    if (it.type === "store") {
      input.value = it.s.name;
      showStores([it.s], false);
      select(it.s);
    } else void searchPlace(it.p.text, it.p.magicKey);
  }

  input.addEventListener("input", () => {
    const q = input.value.trim();
    clearBtn.classList.toggle("on", !!q);
    if (!q) return resetAll();
    touched = true;
    const hits = matches(q);
    if (hits.length) showStores(hits);
    else {
      visible = [];
      renderList();
    }
    paintAC(q, []);
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(() => void suggestPlaces(q), 250);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return closeAC();
    if (e.key === "ArrowDown" && acItems.length) {
      e.preventDefault();
      acIdx = Math.min(acIdx + 1, acItems.length - 1);
      paintActive();
    } else if (e.key === "ArrowUp" && acItems.length) {
      e.preventDefault();
      acIdx = Math.max(acIdx - 1, 0);
      paintActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      if (acIdx >= 0) return pick(acItems[acIdx]);
      closeAC();
      // A zip code always means "stores near here", even if one store's address contains it.
      if (/^\d{5}$/.test(q)) return void searchPlace(q);
      const hits = matches(q);
      if (hits.length === 1) pick({ type: "store", s: hits[0] });
      else if (!hits.length) void searchPlace(q);
    }
  });
  ac.addEventListener("click", (e) => {
    const b = e.target.closest(".edm-aci");
    if (b) pick(acItems[+b.dataset.i]);
  });
  clearBtn.addEventListener("click", () => {
    resetAll();
    input.focus();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".edm-search")) closeAC();
  });
  list.addEventListener("click", (e) => {
    const card = e.target.closest(".edm-c");
    if (!card) return;
    touched = true;
    select(stores[+card.dataset.id]);
  });
  more.addEventListener("click", () => {
    root.classList.toggle("collapsed");
    renderList();
    if (root.classList.contains("collapsed"))
      list.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  geoBtn.addEventListener("click", () => {
    touched = true;
    if (!navigator.geolocation) {
      geoLabel.textContent = "Location not supported";
      return;
    }
    geoLabel.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(
      (p) => {
        geoLabel.textContent = "Use my location";
        input.value = "";
        clearBtn.classList.add("on");
        setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }, "you");
      },
      () => {
        geoLabel.textContent = "Location blocked";
        setTimeout(() => (geoLabel.textContent = "Use my location"), 2500);
      },
      { timeout: 10000 },
    );
  });

  // ---------- map ----------
  async function init() {
    [CDN.leafletCss, CDN.clusterCss, CDN.gestureCss].forEach(loadCss);
    const sheetPromise = loadStores();
    if (!window.L) await loadJs(CDN.leafletJs);
    L = window.L;
    if (!L.markerClusterGroup) await loadJs(CDN.clusterJs);
    if (!window.leafletGestureHandling) await loadJs(CDN.gestureJs);

    map = L.map($(".edm-mapc"), {
      zoomControl: false,
      gestureHandling: true,
      gestureHandlingOptions: {
        text: {
          touch: "Use two fingers to move the map",
          scroll: "Use ctrl + scroll to zoom the map",
          scrollMac: "Use ⌘ + scroll to zoom the map",
        },
      },
    }).setView([40.4, -74.5], 7);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(TILES + "Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
      maxZoom: 16,
    }).addTo(map);
    L.tileLayer(TILES + "Reference/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 16,
      pane: "shadowPane",
    }).addTo(map);

    // Nearby stores merge into one numbered bubble when zoomed out and split apart when zooming in.
    cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 15,
      iconCreateFunction: (c) => {
        const n = c.getChildCount(),
          size = n > 30 ? 54 : n > 10 ? 46 : 38;
        return L.divIcon({
          html: `<div class="edm-cl" style="width:${size}px;height:${size}px">${n}</div>`,
          iconSize: [size, size],
          className: "",
        });
      },
    });
    map.addLayer(cluster);

    pinIcon = L.divIcon({
      html: `<div class="edm-mk">${PIN}</div>`,
      iconSize: [30, 41],
      iconAnchor: [15, 41],
      popupAnchor: [0, -38],
      className: "",
    });
    map.on("dragstart", () => (touched = true));

    // Show the bundled list right away, then swap in the Sheet when it arrives.
    const bundled = fallbackStores();
    setStores(bundled);
    $(".edm-load").classList.add("off");
    sheetPromise.then(
      (fresh) => {
        if (signature(fresh) === signature(bundled)) return;
        if (touched) pendingStores = fresh;
        else setStores(fresh);
      },
      (err) => console.warn("[El Diez map] Sheet unavailable, using bundled store list:", err),
    );
  }

  init().catch((err) => {
    console.error("[El Diez map]", err);
    $(".edm-load").textContent = "Map unavailable";
  });
})();
