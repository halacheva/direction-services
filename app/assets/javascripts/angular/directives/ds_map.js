angular.module('directionServicesApp').directive('dsMap', function() {
  return {
    templateUrl: 'assets/angular/templates/ds_map.html',
    link: function(scope, element, attrs) {
      var map = new google.maps.Map(element.find('#map').get(0), {
        zoom: 8,
        center: { lat: -34.397, lng: 150.644 }
      });
    }
  }
});
