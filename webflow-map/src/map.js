// Store locations map shared by every brand (see brands/<id>/). One <script> + one container in Webflow:
//   <div id="<id>-map"></div><script src=".../<id>-map.js" defer></script>
// Stores come from the brand's Google Sheet; the bundled list shows first and is the fallback if the Sheet fails.
(() => {
  // Replaced at build time.
  const BRAND = __BRAND__;
  const CSS = __CSS__;
  const FALLBACK = __FALLBACK__; // [name, address, lat, lng, orderUrl]
  const PIN_SVG = __PIN__; // { viewBox, paths }

  const root = document.querySelector(`[data-${BRAND.id}-map], #${BRAND.id}-map`);
  if (!root || root.dataset.edmReady) return;
  root.dataset.edmReady = "1";
  // Webflow wraps embeds in a .w-embed div that shrinks to content inside flex parents
  // (e.g. #pickup uses align-items:flex-start), which left the map column 0px wide.
  const wrapper = root.parentElement;
  if (wrapper && wrapper.classList.contains("w-embed")) {
    wrapper.style.width = "100%";
    wrapper.style.alignSelf = "stretch";
  }

  const SHEET_CSV =
    root.dataset.sheet ||
    `https://docs.google.com/spreadsheets/d/${BRAND.sheet.id}/export?format=csv&gid=${BRAND.sheet.gid}`;
  const LOG = `[${BRAND.name} map]`;
  const T = (key, vars = {}) => BRAND.text[key].replace(/\{(\w+)\}/g, (_, k) => vars[k]);

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

  const pinSvg = ({ width, height }) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${PIN_SVG.viewBox}">${PIN_SVG.paths}</svg>`;
  const PIN = pinSvg(BRAND.pin);
  const PIN_LIST = pinSvg(BRAND.listPin);
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

  // Brand tint: gray (average of r,g,b) → each channel through the brand's 11-step table, linearly
  // interpolated (same math as an SVG feFuncTable). Precomputed for all 256 gray levels.
  const tintLut = (t) => {
    const lut = new Uint8ClampedArray(256 * 3);
    [t.r, t.g, t.b].forEach((list, ch) => {
      const v = list.trim().split(/\s+/).map(Number),
        n = v.length - 1;
      for (let i = 0; i < 256; i++) {
        const x = Math.min((i / 255) * n, n),
          k = Math.min(Math.floor(x), n - 1);
        lut[i * 3 + ch] = Math.round((v[k] + (x - k) * (v[k + 1] - v[k])) * 255);
      }
    });
    return lut;
  };

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
    const c = BRAND.columns,
      byCol = (k) => col(new RegExp(c[k].match, "i"), c[k].fallback);
    const iStatus = byCol("status"),
      iLat = byCol("lat"),
      iLng = byCol("lng");
    const iName = byCol("name"),
      iAddr = byCol("address"),
      iUrl = byCol("url");
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
      else console.warn(LOG, "No coordinates for", s.name, "-", s.address);
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
  root.classList.add("edm");
  root.innerHTML = `
    <div class="edm-top">
      <div class="edm-search">
        <input class="edm-si" type="text" placeholder="${esc(T("searchPlaceholder"))}" autocomplete="off" aria-label="${esc(T("searchPlaceholder"))}">
        ${ICON_SEARCH}
        <button type="button" class="edm-clear" aria-label="${esc(T("clearSearch"))}">&times;</button>
        <div class="edm-ac" role="listbox"></div>
      </div>
      <button type="button" class="edm-geo">${ICON_GEO}<span>${esc(T("useLocation"))}</span></button>
      <div class="edm-cnt"><span><b class="edm-n">0</b> <span class="edm-nl">${esc(T("locations"))}</span></span><span class="edm-sort"></span></div>
    </div>
    <div class="edm-listw"><div class="edm-list"></div></div>
    <div class="edm-map"><div class="edm-mapc"></div><div class="edm-load">${esc(T("loading"))}</div></div>`;
  const $ = (sel) => root.querySelector(sel);
  const input = $(".edm-si"),
    ac = $(".edm-ac"),
    clearBtn = $(".edm-clear"),
    list = $(".edm-list");
  const geoBtn = $(".edm-geo"),
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
    pinIcon,
    activeId = null;

  function popup(s) {
    return (
      `<div class="edm-pop"><div class="edm-pt">${esc(s.name)}</div><div class="edm-pa">${esc(s.address)}</div>` +
      `<a class="edm-po" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(T("order"))}</a></div>`
    );
  }

  function renderList() {
    let items = visible.slice(),
      outOfView = false;
    // Optionally list only the stores currently on screen, so opening a cluster narrows the list.
    if (BRAND.listFollowsMap && map && items.length) {
      const bounds = map.getBounds();
      items = items.filter((s) => bounds.contains([s.lat, s.lng]));
      outOfView = !items.length;
    }
    if (origin) items.sort((a, b) => miles(origin, a) - miles(origin, b));
    else items.sort((a, b) => a.name.localeCompare(b.name));
    $(".edm-n").textContent = items.length;
    $(".edm-nl").textContent = T(items.length === 1 ? "location" : "locations");
    $(".edm-sort").textContent = origin ? T("nearestTo", { label: originLabel }) : T("sortAZ");
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
      : `<div class="edm-empty">${esc(T(outOfView ? "noneInView" : "noMatch"))}</div>`;
    list.scrollTop = 0;
    const active = stores[activeId];
    if (active) markActive(active);
  }

  function markActive(s) {
    activeId = s.id;
    list.querySelectorAll(".edm-c.on").forEach((e) => e.classList.remove("on"));
    const card = list.querySelector(`[data-id="${s.id}"]`);
    if (!card) return;
    card.classList.add("on");
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
    activeId = null;
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
        .bindPopup(popup(s), { maxWidth: 300, autoPanPadding: [16, 16] })
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
      if (i === 0 && it.type === "store") html += `<div class="edm-ach">${esc(T("stores"))}</div>`;
      if (it.type === "place" && (i === 0 || acItems[i - 1].type === "store"))
        html += `<div class="edm-ach">${esc(T("searchNear"))}</div>`;
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
      list.innerHTML = `<div class="edm-empty">${esc(T("notFound", { q: text }))}</div>`;
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
  geoBtn.addEventListener("click", () => {
    touched = true;
    if (!navigator.geolocation) {
      geoLabel.textContent = T("locationUnsupported");
      return;
    }
    geoLabel.textContent = T("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        geoLabel.textContent = T("useLocation");
        input.value = "";
        clearBtn.classList.add("on");
        setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }, T("you"));
      },
      () => {
        geoLabel.textContent = T("locationBlocked");
        setTimeout(() => (geoLabel.textContent = T("useLocation")), 2500);
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
          touch: T("gestureTouch"),
          scroll: T("gestureScroll"),
          scrollMac: T("gestureScrollMac"),
        },
      },
    }).setView([40.4, -74.5], 7);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    // Esri's grayscale tiles are recolored pixel by pixel in a canvas. (A CSS/SVG filter on the
    // tile pane looked the same but Safari ignores SVG filters there, leaving the map gray.)
    const TintedTiles = L.GridLayer.extend({
      createTile(coords, done) {
        const tile = document.createElement("canvas"),
          size = this.getTileSize(),
          img = new Image();
        tile.width = size.x;
        tile.height = size.y;
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const ctx = tile.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, size.x, size.y);
          const data = ctx.getImageData(0, 0, size.x, size.y),
            px = data.data,
            lut = this.options.lut;
          for (let i = 0; i < px.length; i += 4) {
            const g = Math.round(0.33 * (px[i] + px[i + 1] + px[i + 2])) * 3;
            px[i] = lut[g];
            px[i + 1] = lut[g + 1];
            px[i + 2] = lut[g + 2];
          }
          ctx.putImageData(data, 0, 0);
          done(null, tile);
        };
        img.onerror = () => done(new Error("tile failed"), tile);
        img.src = L.Util.template(this.options.url, coords);
        return tile;
      },
    });
    new TintedTiles({
      url: TILES + "Base/MapServer/tile/{z}/{y}/{x}",
      lut: tintLut(BRAND.mapTint.land),
      attribution: "Tiles &copy; Esri",
      maxZoom: 16,
    }).addTo(map);
    new TintedTiles({
      url: TILES + "Reference/MapServer/tile/{z}/{y}/{x}",
      lut: tintLut(BRAND.mapTint.labels),
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
      iconSize: [BRAND.pin.width, BRAND.pin.height],
      iconAnchor: [BRAND.pin.width / 2, BRAND.pin.height],
      popupAnchor: [0, 3 - BRAND.pin.height],
      className: "",
    });
    map.on("dragstart", () => (touched = true));
    // Leaflet's autoPan can miss when the popup opens mid-zoom (e.g. from the list), leaving its top
    // and close button cut off on short mobile maps. Whenever the map settles with a popup open,
    // nudge it fully into view (our own panBy settles once more and then finds nothing to fix).
    let openPopup = null,
      userDragged = false;
    const keepPopupInView = () => {
      const el = openPopup && openPopup.getElement();
      if (!el) return;
      const box = map.getContainer().getBoundingClientRect(),
        p = el.getBoundingClientRect(),
        pad = 12;
      let dx = 0,
        dy = 0;
      if (p.top < box.top + pad) dy = p.top - box.top - pad;
      else if (p.bottom > box.bottom - pad) dy = p.bottom - box.bottom + pad;
      if (p.left < box.left + pad) dx = p.left - box.left - pad;
      else if (p.right > box.right - pad) dx = p.right - box.right + pad;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) map.panBy([dx, dy]);
    };
    map.on("dragstart", () => (userDragged = true));
    map.on("popupopen", (e) => {
      openPopup = e.popup;
      userDragged = false;
      setTimeout(keepPopupInView, 300);
    });
    map.on("popupclose", (e) => {
      if (openPopup === e.popup) openPopup = null;
    });
    map.on("moveend", () => {
      // Leave it alone when the visitor dragged the map away on purpose.
      if (userDragged) userDragged = false;
      else setTimeout(keepPopupInView, 50);
    });
    if (BRAND.listFollowsMap) map.on("moveend", renderList);

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
      (err) => console.warn(LOG, "Sheet unavailable, using bundled store list:", err),
    );
  }

  init().catch((err) => {
    console.error(LOG, err);
    $(".edm-load").textContent = T("unavailable");
  });
})();
