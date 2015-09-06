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
      markers: []
    };

    var style = [
      { letter: 'A', color: 'FF0000' },
      { letter: 'B', color: '00FF7F' },
      { letter: 'C', color: '87CEEB' },
      { letter: 'D', color: 'FFFF00' },
      { letter: 'E', color: 'EE82EE' }
    ];

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
        addresses.waypoints.markers.push(new google.maps.Marker({
          position: places[0].geometry.location,
          title: places[0].formatted_address,
          map: map,
        }));

        updateViewPort();
      },

      removeWaypoint: function(index) {
        if (typeof addresses.waypoints.markers[index] !== 'undefined') {
          addresses.waypoints.markers[index].setMap(null);
          addresses.waypoints.markers[index] = undefined;
          updateViewPort();
        }
      },

      clear: clear,

      display: function(index) {
        hidePolylines();
        routes.polylines[index].setMap(map);
      },

      reset: function(type) {
        resetAddress(type);
      },

      route: function(options) {
        var deferred = $q.defer();
        var url = '/routes?options=' + JSON.stringify(options);
        $http.get(url).then(function(response) {
          if (response.data.length > 0) {
            routes.data = response.data;
            drawRoutes();
            deferred.resolve(routes.data);
          }
        });

        return deferred.promise;
      },
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
      var places = addresses[type].searchBox.getPlaces();
      onPlacesFound(type, places);
      updateViewPort();
    }

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
      }
    }

    function positionMarker(type, place) {
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
      routes.data[0].legs.forEach(function(leg, index) {
        if (index == 0) {
          drawRouteMarker(leg.start_location);
        }

        drawRouteMarker(leg.end_location);
      });

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
      if (route.provider == 'Google') {
        return google.maps.geometry.encoding.decodePath(route.overview_polyline.points);
      } else if (route.provider == 'MapQuest') {
        var path = [];

        route.path.forEach(function(point) {
          path.push(new google.maps.LatLng(point.lat, point.lng));
        });

        return path;
      }
    }

    function drawRouteMarker(position) {
      var index = routes.markers.length;
      var icon =  "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=";
      var icon = icon + style[index].letter + "|" + style[index].color + "|000000";

      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(position.lat, position.lng),
        map: map,
        icon: icon
      });

      routes.markers.push(marker);
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

      map.fitBounds(bounds);
    }

    function clear() {
      resetAddress('origin');
      resetAddress('destination');
      hidePolylines();
      routes.polylines = [];
      clearRoutesMarkers();
      clearWaypoints();
    };

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

    function clearRoutesMarkers() {
      routes.markers.forEach(function(marker) {
        marker.setMap(null);
      });

      routes.markers = [];
    }

    function clearWaypoints() {
      addresses.waypoints.markers.forEach(function(waypoint) {
        if (typeof waypoint !== 'undefined') {
          waypoint.setMap(null);
        }
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
  }]
);
