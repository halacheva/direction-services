angular.module('directionServicesApp').directive('dsRoutes', ['Router',
  function(Router) {
    return {
      templateUrl: 'assets/angular/templates/ds_routes.html',

      link: function($scope, element, attrs) {
        $scope.originInput = element.find('#origin_address');
        $scope.destinationInput = element.find('#destination_address');
        $scope.waypointsInput = element.find('#waypoints');
        $scope.mapContainer = element.find('#map');
        $scope.fitMap();

        Router.init($scope.mapContainer, $scope.originInput, $scope.destinationInput, $scope.waypointsInput);
      },

      controller: ['$scope', '$window','Router',
        function($scope, $window, Router) {
          $scope.origin = '';
          $scope.destination = '';
          $scope.waypoint = '';
          $scope.arrival = {
            date: undefined,
            time: undefined
          };
          $scope.departure = {
            date: undefined,
            time: undefined
          };
          $scope.options = {
            travelMode: 'DRIVING',
            durationInTraffic: true,
            waypoints: [],
            optimizeWaypoints: false,
            avoidHighways: false,
            avoidTolls: false,
            transitOptions: {
              arrivalTime: undefined,
              departureTime: undefined,
              modes: []
            }
          };

          $scope.addWaypoint = function() {
            if ($scope.waypointsInput.val() !== '') {
              var waypoint = { location: $scope.waypointsInput.val() };
              $scope.options.waypoints.push(waypoint);
            }
          };

          $scope.removeWaypoint = function(index) {
            $scope.options.waypoints.splice(index, 1);
          };

          $scope.toggleTravelMode = function(mode) {
            var index = $scope.options.transitOptions.modes.indexOf(mode);
            if (index >= 0) {
              $scope.options.transitOptions.modes.splice(index, 1);
            } else {
              $scope.options.transitOptions.modes.push(mode);
            }
          };

          $scope.setDateTime = function(type) {
            if ($scope[type].date && $scope[type].time) {
              var year = $scope[type].date.getFullYear();
              var month = $scope[type].date.getMonth();
              var day = $scope[type].date.getDate();
              var hours = $scope[type].time.getHours();
              var minutes = $scope[type].time.getMinutes();

              $scope.options.transitOptions[type + 'Time'] =  new Date(year, month, day, hours, minutes);
            } else {
              $scope.options.transitOptions[type + 'Time'] = undefined;
            }
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
            $scope.waypoint = '';
            $scope.options.waypoints = [];
            $scope.routes = [];
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

          $scope.fitMap = function() {
            $scope.mapContainer.height($window.innerHeight - 42);
          };
        }
      ]
    };
  }
]);
