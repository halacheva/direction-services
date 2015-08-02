angular.module('directionServicesApp').directive('dsMap', ['DirectionsManager',
  function(DirectionsManager) {
  return {
    templateUrl: 'assets/angular/templates/ds_map.html',
    link: function(scope, element, attrs) {
      var fromAddress = element.find('#from_address');
      var toAddress = element.find('#to_address');

      DirectionsManager.init(element.find('#map'));
      DirectionsManager.loadSearchServices(fromAddress, toAddress);

      fromAddress.on('blur', function() {
        if (this.value === '') {
          DirectionsManager.removeMarker('from');
        }
      });

      toAddress.on('blur', function() {
        if (this.value === '') {
          DirectionsManager.removeMarker('to');
        }
      });
    }
  }
}]);

