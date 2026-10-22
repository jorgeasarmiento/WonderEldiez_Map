# Mapas de locales para Webflow (multi-marca)

Un solo motor de mapa (Leaflet) y una carpeta por marca. Cada marca genera su propio script y su propio Embed para Webflow; todas comparten las mismas funciones y arreglos.

| Marca     | Sitio             | Contenedor      | Script                                                                                |
| --------- | ----------------- | --------------- | ------------------------------------------------------------------------------------- |
| El Diez   | eldiezmexican.com | `#eldiez-map`   | https://jorgeasarmiento.github.io/WonderEldiez_Map/webflow-map/public/eldiez-map.js   |
| Pop Salad | popsalad.com      | `#popsalad-map` | https://jorgeasarmiento.github.io/WonderEldiez_Map/webflow-map/public/popsalad-map.js |

Qué hace el mapa:

- **Agrupa los pines (clusters):** al alejar, los locales cercanos se juntan en una burbuja con el número; al acercar se separan. Desde zoom 15 se ven todos.
- **Lee las tiendas del Google Sheet** de la marca. Se actualiza el Sheet y el mapa cambia solo, sin tocar Webflow.
- Aparece al instante con la lista guardada (`locations.json`) y cambia a los datos del Sheet cuando llegan (límite de 8 s; si el Sheet falla se queda con la lista guardada).
- Muestra **solo tiendas abiertas**: estado `Live` o fecha de lanzamiento ya pasada.
- **Busca por zip, ciudad o nombre de tienda.** Zip o ciudad → ordena por distancia. Nombre → filtra lista y mapa.
- "Use my location" ordena por cercanía.
- **Dos dedos para mover el mapa en el celular** y ctrl/⌘ + scroll en desktop.

## Estructura

```
webflow-map/
  src/
    map.js          motor compartido (lógica)
    base.css        layout compartido; colores y fuentes vienen del tema de cada marca
  brands/<id>/
    brand.mjs       Sheet, columnas, textos, tamaño del pin, tono del mapa base, URL del script
    theme.css       colores y fuentes (--primary, --accent, --bg, --pin-1, --label, …)
    pin.svg         forma del pin (paths con clase edm-pin-1 / edm-pin-2)
    locations.json  lista guardada: se muestra primero y es el respaldo
    preview.html    página de prueba local; {{MAP}} se reemplaza por el mapa
  build.mjs         genera lo de abajo para cada marca
  public/<id>-map.js       script que sirve GitHub Pages (se commitea)
  paste/<id>/EMBED.html    lo que se pega en Webflow
  paste/<id>/preview.html  vista previa local
```

Regenerar después de cualquier cambio en `src/` o `brands/`:

```bash
vp run webflow:map
```

Probar en local: servir `webflow-map/` (por ejemplo `python3 -m http.server 4599 --directory webflow-map`) y abrir `http://127.0.0.1:4599/paste/<id>/preview.html`.

## Instalación en Webflow (una vez por sitio)

1. Donde va el mapa, agregar un **Embed** con el contenido de `paste/<id>/EMBED.html`. Para El Diez:
   ```html
   <div id="eldiez-map"></div>
   <script
     src="https://jorgeasarmiento.github.io/WonderEldiez_Map/webflow-map/public/eldiez-map.js"
     defer
   ></script>
   ```
2. Borrar el mapa anterior y sus scripts. En los dos sitios es el mismo: el div `#eldiez-map` (`tot-map-container`), el aviso `#click`, el `<script src="https://maps.googleapis.com/...">` y el script con `locations`, `newLocations` e `initMap`.
3. Publicar en staging y revisar.

> **Hosting:** GitHub Pages sirve los scripts desde la rama `main` de `jorgeasarmiento/WonderEldiez_Map` (Settings → Pages → Deploy from a branch → `main` / root). El repo tiene que seguir público y con Pages activo. Después de un push, Pages publica en 1–2 minutos y los navegadores toman la versión nueva en máximo 10.

## Agregar una marca

1. Copiar `brands/eldiez/` a `brands/<id>/`.
2. En `brand.mjs`: cambiar `id`, `name`, `scriptUrl` (`…/public/<id>-map.js`), `sheet`, `columns`, `text` y `mapTint`.
3. En `theme.css`: colores y fuentes. En `pin.svg`: el pin. En `preview.html`: fuentes y fondo del sitio.
4. Reemplazar `locations.json` con sus tiendas.
5. `vp run webflow:map`, probar `paste/<id>/preview.html`, commit y push. El Embed queda en `paste/<id>/EMBED.html`.

## Cómo se actualiza

| Qué cambia                                   | Qué hacer                                                            |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Tiendas (alta, baja, dirección, link, fecha) | Editar el Google Sheet de la marca. Nada más.                        |
| Diseño o textos de una marca                 | Editar `brands/<id>/`, `vp run webflow:map`, commit y push a `main`. |
| Funciones del mapa (todas las marcas)        | Editar `src/`, `vp run webflow:map`, commit y push a `main`.         |

## Formato del Sheet (El Diez y Pop Salad)

Pestaña _Pickup_ (`gid=0`). Columnas por nombre de encabezado (configurables en `brand.mjs → columns`):

- `Launch Date`: `Live` o fecha (`4/22` o `5/8/2026`). Fechas futuras se ocultan hasta ese día.
- `Location Title`, `Address` y la URL de la marca (`El Diez URL` o `Pop Salad URL`): obligatorias; filas sin alguna de ellas se ignoran.
- `Latitude`, `Longitude`: opcionales. Hoy esas columnas no tienen encabezado (el mapa usa las columnas F y G). Si faltan, usa las coordenadas de `locations.json`; si la tienda es nueva, geocodifica la dirección.

El Sheet tiene que estar compartido como "cualquier persona con el link puede ver".

## Servicios externos (todos sin API key)

- Mapa base y geocodificador: Esri (World Light Gray Canvas, World Geocoding Service).
- Librerías: Leaflet 1.9.4 y MarkerCluster 1.5.1 (cdnjs), Leaflet.GestureHandling 1.2.2 (jsDelivr).
