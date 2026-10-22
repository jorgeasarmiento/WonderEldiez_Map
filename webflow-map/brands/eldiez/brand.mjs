// El Diez — eldiezmexican.com
// Embed in Webflow: <div id="eldiez-map"></div><script src="<scriptUrl>" defer></script>
export default {
  id: "eldiez", // → public/eldiez-map.js, container #eldiez-map
  name: "El Diez", // used in console messages
  scriptUrl: "https://jorgeasarmiento.github.io/WonderEldiez_Map/webflow-map/public/eldiez-map.js",

  // "Pickup" tab of the stores sheet, shared as "anyone with the link can view".
  sheet: { id: "1TzDvvtenMzvmn6xlU-kiehZotL1nPmWW2yoGZYJ09gk", gid: 0 },
  // Header regex per column, and the column index to use when no header matches.
  columns: {
    status: { match: "launch|status", fallback: 0 },
    name: { match: "title|name", fallback: 1 },
    address: { match: "address", fallback: 2 },
    url: { match: "el diez", fallback: 3 },
    lat: { match: "^lat", fallback: 5 },
    lng: { match: "^(lng|lon)", fallback: 6 },
  },

  // true: the list only shows the stores visible on the map (opening a cluster narrows it).
  listFollowsMap: false,

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
    viewAll: "View all {n} locations",
    showLess: "Show less",
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

  // Pin sizes; the shape lives in pin.svg and its colors in theme.css (--pin-1, --pin-2).
  pin: { width: 30, height: 41 },
  listPin: { width: 18, height: 25 },

  // Recolors Esri's grayscale basemap. Each list maps gray 0→1 (11 evenly spaced steps)
  // to that RGB channel. Esri grays: water ~0.82, land ~0.92, roads 1, label text ~0.19.
  mapTint: {
    // Water → light blue (~#B7DBFA), land → near-white blue.
    land: {
      r: "0 0 0 0 0 0 .1 .3 .68 .93 1",
      g: ".35 .4 .45 .5 .55 .6 .65 .7 .84 .965 1",
      b: ".6 .65 .7 .75 .8 .85 .9 .93 .98 1 1",
    },
    // Label text → dark navy #003A73, white halo stays white.
    labels: {
      r: "0 0 0 0 .15 .3 .45 .6 .75 .9 1",
      g: ".2 .22 .227 .227 .33 .44 .55 .66 .77 .89 1",
      b: ".4 .43 .45 .45 .53 .61 .69 .77 .85 .93 1",
    },
  },
};
