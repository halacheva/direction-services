'use strict';

angular.module('directionServicesApp').factory('Router', ['$window', '$http', '$q',
  function($window, $http, $q) {
    var map, geocoder;
    // Holds all elements for each address: marker, searchBox, input
    var addresses = {
      origin: {},
      destination: {},
      waypoints: {}
    };

    var routes = {
      data: [],
      polylines: [],
    };

    var style = [ 'A', 'B', 'C', 'D', 'E' ];

    return {
      init: function(mapElement, originInput, destinationInput, waypointsInput) {
        map = new google.maps.Map(mapElement[0], {
          draggableCursor: 'crosshair',
          zoom: 10,
          center: { lat: 42.6954322, lng: 23.3239467 } // Sofia coordinates
        });

        loadServices(originInput, destinationInput, waypointsInput);
      },

      addWaypoint: function() {
        var places = addresses.waypoints.searchBox.getPlaces();
        var marker = new google.maps.Marker({
          position: places[0].geometry.location,
          title: places[0].formatted_address,
          map: map,
        });

        addresses.waypoints.markers.push(marker);
        updateViewPort();
        updateIcons();
        clear({ keepMarkers: true });

        return marker;
      },

      removeWaypoint: function(index) {
        addresses.waypoints.markers[index].setMap(null);
        addresses.waypoints.markers.splice(index, 1);
        updateViewPort();
        updateIcons();
        clear({ keepMarkers: true });
      },

      clear: clear,

      display: function(index) {
        hidePolylines();
        routes.polylines[index].setMap(map);
      },

      location: function(type) {
        return addresses[type].marker.position.lat() + ',' + addresses[type].marker.position.lng();
      },

      reset: function(type) {
        resetAddress(type);
        updateIcons();
      },

      route: function(options) {
        var deferred = $q.defer();
        var url = '/routes?options=' + JSON.stringify(options);
        $http.get(url).then(function(response) {
          if (response.data.length > 0) {
            addresses.origin.marker.setDraggable(false);
            addresses.destination.marker.setDraggable(false);
            routes.data = response.data;
            drawRoutes();
            deferred.resolve(routes.data);
          }
        });

        return deferred.promise;
      },

      routes: routes
    };

    // Private methods

    function loadServices(originInput, destinationInput, waypointsInput) {
      geocoder = new google.maps.Geocoder();

      // Origin
      addresses.origin = {
        input: originInput,
        searchBox: new google.maps.places.SearchBox(originInput[0])
      };

      google.maps.event.addListener(addresses.origin.searchBox, 'places_changed', function() {
        addressSearch('origin');
      });

      // Destination
      addresses.destination = {
        input: destinationInput,
        searchBox: new google.maps.places.SearchBox(destinationInput[0])
      };

      google.maps.event.addListener(addresses.destination.searchBox, 'places_changed', function() {
        addressSearch('destination');
      });

      // Waypoints
      addresses.waypoints = {
        input: waypointsInput,
        searchBox: new google.maps.places.SearchBox(waypointsInput[0]),
        markers: []
      };

      // Google Maps Click
      google.maps.event.addListener(map, 'click', function(event) {
        locationSearch(event.latLng);
      });
    }

    function addressSearch(type) {
      clear({ keepMarkers: true });
      var places = addresses[type].searchBox.getPlaces();
      onPlacesFound(type, places);
      updateViewPort();
    }

    function clear(options) {
      var options = options || {};
      hidePolylines();
      routes.polylines = [];

      if (!options.keepMarkers) {
        resetAddress('origin');
        resetAddress('destination');
        clearWaypoints();
      }
    };

    function locationSearch(location, type) {
      var type = selectAddressType(type);

      if (typeof type !== 'undefined') {
        geocoder.geocode({ location: location }, function(places, status) {
          onPlacesFound(type, places, true);
        });
      }
    }

    function selectAddressType(type) {
      if (typeof addresses[type] !== 'undefined') {
        return type;
      } if (typeof addresses.origin.marker === 'undefined') {
        return 'origin';
      } else if (typeof addresses.destination.marker === 'undefined') {
        return 'destination';
      }
    }

    function onPlacesFound(type, places, updateInputValue) {
      resetAddress(type);

      if (places.length > 0) {
        positionMarker(type, places[0]);

        if (updateInputValue) {
          addresses[type].input.val(places[0].formatted_address);
        }

        toggleMapCursor();
        updateIcons();
      }
    }

    function positionMarker(type, place, index) {
      var location = place.geometry.location;
      var title = place.formatted_address;

      addresses[type].marker = new google.maps.Marker({
        position: location,
        title: title,
        map: map,
        draggable: true,
        type: type
      });

      google.maps.event.addListener(addresses[type].marker, 'dragend', function(event) {
        locationSearch(event.latLng, type);
      });
    }

    function drawRoutes() {
      routes.data.forEach(function(route) {
        var path = buildPath(route);

        var polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '#00B3FD',
          strokeOpacity: 1.0,
          strokeWeight: 5
        });

        routes.polylines.push(polyline);
      });
      routes.polylines[0].setMap(map);
    }

    function buildPath(route) {
      if (route.provider === 'Google') {
        return google.maps.geometry.encoding.decodePath(route.overview_polyline.points);
      } else if (route.provider === 'MapQuest') {
        var path = [];

        route.path.forEach(function(point) {
          path.push(new google.maps.LatLng(point.lat, point.lng));
        });

        return path;
      }
    }

    function updateViewPort() {
      var bounds = new google.maps.LatLngBounds();
      if (typeof addresses.origin.marker !== 'undefined') {
        bounds.extend(addresses.origin.marker.position);
      }

      if (typeof addresses.destination.marker !== 'undefined') {
        bounds.extend(addresses.destination.marker.position);
      }

      addresses.waypoints.markers.forEach(function(waypoint) {
        if (typeof waypoint !== 'undefined') {
          bounds.extend(waypoint.position);
        }
      });

      if (bounds.isEmpty()) {
        map.setCenter({ lat: 42.6954322, lng: 23.3239467 });
        map.setZoom(10);
      } else {
        map.fitBounds(bounds);
      }
    }

    function resetAddress(type) {
      if (typeof addresses[type].marker !== 'undefined') {
        addresses[type].marker.setMap(null);
        addresses[type].marker = undefined;
      }

      toggleMapCursor();
    }

    function hidePolylines() {
      routes.polylines.forEach(function(polyline) {
        polyline.setMap(null);
      });
    }

    function clearWaypoints() {
      addresses.waypoints.markers.forEach(function(marker) {
        marker.setMap(null);
      });
      addresses.waypoints.markers = [];
    }

    function toggleMapCursor() {
      if (typeof addresses.origin.marker !== 'undefined' && typeof addresses.destination.marker !== 'undefined') {
        map.draggableCursor = undefined;
      } else {
        map.draggableCursor = 'crosshair';
      }
    }

    function updateIcons(type) {
      var index = 0
      if (typeof addresses.origin.marker !== 'undefined') {
        addresses.origin.marker.setIcon(iconURL(index));
        index = index + 1;
      }

      addresses.waypoints.markers.forEach(function(marker) {
        marker.setIcon(iconURL(index));
        index = index + 1;
      });

      if (typeof addresses.destination.marker !== 'undefined') {
        addresses.destination.marker.setIcon(iconURL(index));
      }
    }

    function iconURL(index) {
      var icon = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=';
      return icon + style[index] + '|F75C53';
    }

  }]
);
