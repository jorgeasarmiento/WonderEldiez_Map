# Mapa de locales El Diez — Webflow

Reemplaza el mapa de Google Maps de eldiezmexican.com (sección `#pickup`) por un mapa Leaflet que:

- **Agrupa los pines (clusters):** al alejar, los locales cercanos se juntan en una burbuja con el número; al acercar se separan. Desde zoom 15 se ven todos.
- **Lee las tiendas del Google Sheet** (pestaña _Pickup_). Wonder actualiza el Sheet y el mapa cambia solo, sin tocar Webflow.
- Muestra **solo tiendas abiertas**: estado `Live` o fecha de lanzamiento ya pasada.
- **Busca por zip, ciudad o nombre de tienda.** Zip o ciudad → ordena por distancia y muestra las más cercanas. Nombre → filtra lista y mapa.
- "Use my location" ordena por cercanía.
- Botón **Pick up or delivery** con el link de pedido de cada tienda.
- **Dos dedos para mover el mapa en el celular** y ctrl/⌘ + scroll en desktop, así el scroll de la página nunca queda atrapado.
- Diseño con las fuentes y colores del sitio (Salsa Grande, Taybenditos, Signpainter, Americane; azul `#008FF5`, rojo `#FF151A`, crema `#FDF2EA`).

## Instalación en Webflow (una sola vez)

1. En el Designer, dentro de `#pickup`, borrar el div `#eldiez-map` (`tot-map-container`) y el aviso `#click` ("Click an icon to find…").
2. En su lugar, agregar un **Embed** con el contenido de `paste/EMBED.html`:
   ```html
   <div id="eldiez-map"></div>
   <script
     src="https://jorgeasarmiento.github.io/WonderEldiez_Map/webflow-map/public/eldiez-map.js"
     defer
   ></script>
   ```
3. Page Settings → Custom Code → _Before `</body>` tag_: borrar el `<script src="https://maps.googleapis.com/...">` y el script con `locations`, `newLocations` e `initMap`.
4. Publicar en staging y revisar.

> **Hosting:** el script lo sirve GitHub Pages desde la rama `main` de `jorgeasarmiento/WonderEldiez_Map` (Settings → Pages → Deploy from a branch → `main` / root). El repo tiene que seguir público y con Pages activo.

## Cómo se actualiza

| Qué cambia                                   | Qué hacer                                                           |
| -------------------------------------------- | ------------------------------------------------------------------- |
| Tiendas (alta, baja, dirección, link, fecha) | Editar el Google Sheet. Nada más.                                   |
| Código o diseño del mapa                     | Editar `src/`, correr `vp run webflow:map`, commit y push a `main`. |

Después de un push, GitHub Pages publica en 1–2 minutos y los navegadores toman la versión nueva en máximo 10 minutos. No hay caché que limpiar.

## Formato del Sheet

Pestaña _Pickup_ (primera pestaña, `gid=0`). Columnas que usa el mapa, por nombre de encabezado:

- `Launch Date`: `Live` o fecha (`4/22` o `5/8/2026`). Fechas futuras se ocultan hasta ese día.
- `Location Title`, `Address`, `El Diez URL`: obligatorias; filas sin alguna de ellas se ignoran.
- `Latitude`, `Longitude`: opcionales. Hoy esas columnas no tienen encabezado (el mapa usa las columnas F y G). Si faltan, usa las coordenadas guardadas en `locations.json`; si la tienda es nueva, geocodifica la dirección.

El Sheet tiene que seguir compartido como "cualquier persona con el link puede ver".

## Archivos

| Archivo                     | Qué es                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/map.js`, `src/map.css` | Código fuente del mapa.                                                                                    |
| `locations.json`            | Respaldo: si el Sheet no responde se usa esta lista, y de acá salen las coordenadas que el Sheet no tiene. |
| `build.mjs`                 | Genera `public/eldiez-map.js`, `paste/EMBED.html` y `paste/preview.html`.                                  |
| `public/eldiez-map.js`      | El archivo que sirve GitHub Pages. Se commitea.                                                            |

Probar en local: servir la carpeta `webflow-map/` (por ejemplo `python3 -m http.server 4599 --directory webflow-map`) y abrir `http://127.0.0.1:4599/paste/preview.html`.

## Servicios externos (todos sin API key)

- Mapa base y geocodificador: Esri (World Light Gray Canvas, World Geocoding Service).
- Librerías: Leaflet 1.9.4 y MarkerCluster 1.5.1 (cdnjs), Leaflet.GestureHandling 1.2.2 (jsDelivr).
