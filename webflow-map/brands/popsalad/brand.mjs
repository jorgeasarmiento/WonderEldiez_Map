// Pop Salad — popsalad.com
// Embed in Webflow: <div id="popsalad-map"></div><script src="<scriptUrl>" defer></script>
export default {
  id: "popsalad", // → public/popsalad-map.js, container #popsalad-map
  name: "Pop Salad", // used in console messages
  scriptUrl: "https://jorgeasarmiento.github.io/Wonder_Maps/webflow-map/public/popsalad-map.js",

  // Same stores sheet as El Diez ("Pickup" tab); Pop Salad has its own URL column.
  sheet: { id: "1TzDvvtenMzvmn6xlU-kiehZotL1nPmWW2yoGZYJ09gk", gid: 0 },
  // Header regex per column, and the column index to use when no header matches.
  columns: {
    status: { match: "launch|status", fallback: 0 },
    name: { match: "title|name", fallback: 1 },
    address: { match: "address", fallback: 2 },
    url: { match: "pop salad", fallback: 4 },
    lat: { match: "^lat", fallback: 5 },
    lng: { match: "^(lng|lon)", fallback: 6 },
  },

  // true: the list only shows the stores visible on the map (opening a cluster narrows it).
  listFollowsMap: true,

  text: {
    searchPlaceholder: "Search by zip, city or store",
    clearSearch: "Clear search",
    useLocation: "Use my location",
    locating: "Locating…",
    locationBlocked: "Location blocked",
    locationUnsupported: "Location not supported",
    location: "location",
    locations: "locations",
    sortAZ: "A → Z",
    nearestTo: "Nearest to {label}",
    you: "you",
    stores: "Stores",
    searchNear: "Search near",
    noMatch: "No stores match. Press Enter to search that area.",
    noneInView: "No stores in this part of the map. Zoom out to see more.",
    notFound: "We couldn't find “{q}”. Try a zip code or city.",
    order: "Pick up or delivery",
    loading: "Loading locations…",
    unavailable: "Map unavailable",
    gestureTouch: "Use two fingers to move the map",
    gestureScroll: "Use ctrl + scroll to zoom the map",
    gestureScrollMac: "Use ⌘ + scroll to zoom the map",
  },

  // Onion pin (viewBox 36.7 × 40.1); colors in theme.css.
  pin: { width: 34, height: 37 },
  listPin: { width: 22, height: 24 },

  // Recolors Esri's grayscale basemap. Each list maps gray 0→1 (11 evenly spaced steps)
  // to that RGB channel. Esri grays: water ~0.82, land ~0.92, roads 1, label text ~0.19.
  mapTint: {
    // Water → light periwinkle (~#C9D1FF), land → pale cream yellow (~#FFF9DE), roads white.
    land: {
      r: "0 0 0 0 0 0 .1 .3 .753 1 1",
      g: "0 .05 .1 .15 .2 .3 .4 .5 .794 .97 1",
      b: ".6 .65 .7 .75 .8 .85 .9 .95 1 .84 1",
    },
    // Label text → Pop Salad blue #0602F5, white halo stays white.
    labels: {
      r: ".02 .02 .024 .024 .15 .3 .45 .6 .75 .9 1",
      g: "0 .005 .008 .008 .15 .3 .45 .6 .75 .9 1",
      b: ".9 .94 .96 .96 .965 .97 .975 .98 .985 .99 1",
    },
  },
};
