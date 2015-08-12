angular.module('directionServicesApp').directive('dsRoutes', ['Router',
  function(Router) {
    return {
      templateUrl: 'assets/angular/templates/ds_routes.html',

      link: function($scope, element, attrs) {
        $scope.originInput = element.find('#origin_address');
        $scope.destinationInput = element.find('#destination_address');
        $scope.waypointsInput = element.find('#waypoints');

        Router.init(element.find('#map'), $scope.originInput, $scope.destinationInput, $scope.waypointsInput);
      },

      controller: ['$scope', 'Router',
        function($scope, Router) {
          $scope.origin = '';
          $scope.destination = '';
          $scope.options = {
            travelMode: 'DRIVING',
            durationInTraffic: true,
            waypoints: [],
            optimizeWaypoints: false,
            avoidHighways: false,
            avoidTolls: false
          };

          $scope.addWaypoint = function() {
            var waypoint = { location: $scope.waypointsInput.val() };
            $scope.options.waypoints.push(waypoint);
          };

          $scope.removeWaypoint = function(index) {
            $scope.options.waypoints.splice(index, 1);
          };

          $scope.findRoutes = function() {
            Router.route($scope.options).then(function(result) {
              $scope.routes = result.routes;
              $scope.displayedRoute = 0;
            });
          };

          $scope.displayRoute = function(index) {
            Router.display(index);
            $scope.displayedRoute = index;
          };

          $scope.calculateTotalDistance = function(legs) {
            var total = 0;

            legs.forEach(function(leg) {
              total += leg.distance.value;
            });

            return Math.round(total / 1000).toString() + 'km';
          };

          $scope.calculateTotalDuration = function(legs) {
            var total = 0;

            legs.forEach(function(leg) {
              total += leg.duration.value;
            });

            var date = new Date(total * 1000);
            var hours = date.getUTCHours().toString();
            var minutes = date.getUTCMinutes().toString();
            return hours + ' hours ' + minutes + ' mins';
          };

          $scope.clear = function() {
            $scope.origin = '';
            $scope.destination = '';
            Router.clear();
          };

          $scope.resetDestination = function() {
            if ($scope.destination === '') {
              Router.reset('destination');
            }
          };

          $scope.resetOrigin = function() {
            if ($scope.origin === '') {
              Router.reset('origin');
            }
          };
        }
      ]
    };
  }
]);
