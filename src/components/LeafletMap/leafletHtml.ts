// Self-contained Leaflet page rendered inside a WebView (native) or iframe (web).
// Tiles come from OpenStreetMap; their usage policy requires the attribution below.
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const leafletHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e5e3df; }
  .leaflet-control-attribution { font-size: 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  function send(message) {
    var data = JSON.stringify(message);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(data);
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(data, '*');
    }
  }

  var map = L.map('map', { zoomControl: false }).setView([20, 0], 2);
  L.tileLayer(${JSON.stringify(TILE_URL)}, {
    maxZoom: 19,
    attribution: ${JSON.stringify(TILE_ATTRIBUTION)}
  }).addTo(map);

  var markerLayer = L.layerGroup().addTo(map);
  var userMarker = null;

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  map.on('moveend', function () {
    var bounds = map.getBounds();
    var center = map.getCenter();
    send({
      type: 'moveend',
      region: {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
        longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest())
      }
    });
  });

  window.handleMessage = function (message) {
    switch (message.type) {
      case 'ping':
        send({ type: 'ready' });
        break;
      case 'setView':
        map.setView([message.latitude, message.longitude], message.zoom, { animate: message.animate });
        break;
      case 'fitBounds':
        if (message.points.length === 1) {
          map.setView(message.points[0], 16);
        } else if (message.points.length > 1) {
          map.fitBounds(message.points, {
            paddingTopLeft: [message.padding[3], message.padding[0]],
            paddingBottomRight: [message.padding[1], message.padding[2]]
          });
        }
        break;
      case 'setMarkers':
        markerLayer.clearLayers();
        message.markers.forEach(function (m) {
          var marker = L.circleMarker([m.latitude, m.longitude], {
            radius: 10, weight: 3, color: '#ffffff', fillColor: m.color || '#e53935', fillOpacity: 1
          });
          if (m.title) {
            marker.bindTooltip('<b>' + escapeHtml(m.title) + '</b>' + (m.description ? '<br/>' + escapeHtml(m.description) : ''));
          }
          marker.on('click', function () { send({ type: 'markerPress', id: m.id }); });
          marker.addTo(markerLayer);
        });
        break;
      case 'setUserLocation':
        if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
        if (message.location) {
          userMarker = L.circleMarker([message.location.latitude, message.location.longitude], {
            radius: 8, weight: 3, color: '#ffffff', fillColor: '#1a73e8', fillOpacity: 1, interactive: false
          }).addTo(map);
        }
        break;
    }
  };

  // Web (iframe) receives messages through postMessage
  window.addEventListener('message', function (event) {
    try {
      var message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (message && message.type) window.handleMessage(message);
    } catch (e) {}
  });

  send({ type: 'ready' });
</script>
</body>
</html>`;
