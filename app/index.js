/**
 * Main JS file for project.
 */

import Popover from './shared/popover.js';
import StribPopup from './shared/popup.js';
import utilsFn from './utils.js';

/********** CONSTANTS **********/

const adaptive_ratio = 1.07; // Height/width ratio for adaptive map sizing
const popover_thresh = 500; // The width of the map when tooltips turn to popvers
const utils = utilsFn({});
const isMobile = (window.innerWidth <= popover_thresh || document.body.clientWidth) <= popover_thresh || utils.isMobile();

mapboxgl.accessToken = 'pk.eyJ1IjoiY2pkZDNiIiwiYSI6ImNqZWJtZWVsYjBoYTAycm1raTltdnpvOWgifQ.aPWEg8C-5IJ0_7cXusY-1g';

/********** INITIALIZE MAP **********/

// Set adaptive sizing
let mapHeight = window.innerWidth * adaptive_ratio;
document.getElementById("map").style.height = mapHeight.toString() + "px";

// Init map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/cjdd3b/cjmt2qdtt1bvv2stn3fp6bt33',
  center: [-94.6859, 47.7296],
  zoom: 2,
  maxBounds: [-97.25, 43.4, -89.53, 49.5],
  scrollZoom: false
});

// Setup basic map features
if (utils.isMobile()) {
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
} else {
  map.addControl(new mapboxgl.NavigationControl());
  map.dragPan.disable();
  map.getCanvas().style.cursor = 'pointer';
}

/********** INITIALIZE GEOCODER **********/

// Make and attach geocoder
let geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    bbox: [-97.25, 43.4, -89.53, 49.5],
    zoom: 12,
    placeholder: "Search for an address"
});

geocoder.on('result', function(ev) {
  // var center = map.getCenter();
  // console.log(center);
  // console.log(map.queryRenderedFeatures(center, {layers:['mnprecinctsgeo']}));
  // console.log(ev);
  // console.log(ev.result.center);
  // var f = map.queryRenderedFeatures(ev.result.center, {layers:['mnprecinctsgeo']});
  // console.log(f);
  // console.log(ev.result.center);
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

/********** MAP BEHAVIORS **********/

map.on('load', function() {
  // Init popups and popovers
  let popup = new StribPopup(map);
  let popover = new Popover('#map-popover');

  map.addLayer({
    "id": "precincts-highlighted",
    "type": "line",
    "source": "composite",
    "source-layer": "mnprecinctsgeo",
    "paint": {
      "line-color": "#000000"
    },
      "filter": ['in', 'id', '']
  }, 'place-city-sm'); // Place polygon under these labels.

  // Only allow dragpan after you zoom in
  map.on('zoomend', function(e) {
    if (map.getZoom() < 5 ) {
      map.dragPan.disable();
    } else {
      map.dragPan.enable();
    }
  });

  // Capture mousemove events on desktop and touch/block on mobile or small viewports
  if (isMobile) {
    map.on('click', 'mnprecinctsgeo', function(e) {
      let f = e.features[0];

      // Create and populate popover if mobile or small viewport
      let precinct = f.properties.precinct;
      let dfl_votes = f.properties.dfl_votes;
      let gop_votes = f.properties.gop_votes;
      let dfl_pct = f.properties.dfl_pct;
      let gop_pct = f.properties.gop_pct;

      popover.open(precinct, dfl_votes, gop_votes, dfl_pct, gop_pct);

      // Scroll into view if popover is off the screen. jQuery assumed to
      // be on page because of Strib environment.
      if (!popover.is_in_viewport()) {
        $('html, body').animate({
          'scrollTop' : $("#map").offset().top
        });
      }

      // Highlight precinct on touch
      map.setFilter("precincts-highlighted", ['==', 'id', f.properties.id]);
      map.flyTo({center: e.lngLat, zoom: 9});
    });
  // Handle mouseover events in desktop and non-mobile viewports
  } else {
    map.on('mousemove', 'mnprecinctsgeo', function(e) {
      popup.open(e);
    });

    map.on('mouseleave', 'mnprecinctsgeo', function() {
      popup.close();
    });
  }
});