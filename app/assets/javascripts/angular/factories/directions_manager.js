'use strict';

angular.module('directionServicesApp').factory('DirectionsManager', ['$window', '$http',
  function($window, $http) {
    return {
      markers: {},

      init: function(map) {
        this.map = new google.maps.Map(map[0], {
          zoom: 10,
          center: { lat: 42.6954322, lng: 23.3239467 } // Sofia coordinates
        });
      },

      loadSearchServices: function(fromInput, toInput) {
        var that = this;

        this.fromSearchBox = new google.maps.places.SearchBox(fromInput[0]);
        this.fromPlacesService = new google.maps.places.PlacesService(fromInput[0]);
        google.maps.event.addListener(this.fromSearchBox, 'places_changed', function() {
          that.positionMarker(that.fromPlacesService, 'from', fromInput);
        });

        this.toSearchBox = new google.maps.places.SearchBox(toInput[0]);
        this.toPlacesService = new google.maps.places.PlacesService(toInput[0]);
        google.maps.event.addListener(this.toSearchBox, 'places_changed', function() {
          that.positionMarker(that.toPlacesService, 'to', toInput);
        });
      },

      positionMarker: function(service, type, input) {
        var that = this;
        service.textSearch({ query: input.val() }, function(places, status) {
          that.removeMarker(type);

          if (places.length > 0) {
            var location = places[0].geometry.location;
            var title = places[0].formatted_address;

            that.markers[type] = new google.maps.Marker({
              position: location,
              title: title.toString(),
              map: that.map
            });
            that.updateViewPort();
          }
        });
      },

      updateViewPort: function() {
        var bounds = new google.maps.LatLngBounds();
        if (typeof this.markers.from !== 'undefined') {
          bounds.extend(this.markers.from.position);
        }

        if (typeof this.markers.to !== 'undefined') {
          bounds.extend(this.markers.to.position);
        }

        this.map.fitBounds(bounds);
      },

      removeMarker: function(type) {
        if (typeof this.markers[type] !== 'undefined') {
          this.markers[type].setMap(null);
          this.markers[type] = undefined;
        }
      }
    };
  }]
);
