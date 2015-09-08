angular.module('directionServicesApp').directive('dsRoutes', ['Router',
  function(Router) {
    return {
      templateUrl: 'assets/angular/templates/ds_routes.html',

      link: function($scope, element, attrs) {
        $scope.originInput = element.find('#origin_address');
        $scope.destinationInput = element.find('#destination_address');
        $scope.waypointsInput = element.find('#waypoints');
        $scope.mapContainer = element.find('#map');
        $scope.checkboxes = element.find("input[type='checkbox']");
        $scope.fitMap();

        Router.init($scope.mapContainer, $scope.originInput, $scope.destinationInput, $scope.waypointsInput);
      },

      controller: ['$scope', '$window', '$timeout', 'Router',
        function($scope, $window, $timeout, Router) {
          $scope.arrival = {
            date: undefined,
            time: undefined
          };
          $scope.departure = {
            date: undefined,
            time: undefined
          };
          $scope.options = {
            mode: 'driving',
            waypoints: [],
            optimize: false,
            avoid: [],
            transitOptions: {
              arrivalTime: undefined,
              departureTime: undefined,
              modes: [],
              routingPreference: undefined
            }
          };
          $scope.routingInProgress = false;

          $scope.addWaypoint = function() {
            if ($scope.waypointsInput.val() !== '' && !$scope.reachedWaypointsLimit()) {
              var waypoint = Router.addWaypoint();
              var locationString = waypoint.position.lat() + ',' + waypoint.position.lng();
              $scope.options.waypoints.push({ location: locationString, title: waypoint.title });
              $scope.waypointsInput.val('');
              $scope.clearRoutes()
            }
          };

          $scope.removeWaypoint = function(index) {
            $scope.options.waypoints.splice(index, 1);
            Router.removeWaypoint(index);
            $scope.clearRoutes()
          };

          $scope.reachedWaypointsLimit = function() {
            return $scope.options.waypoints.length == 3;
          };

          $scope.togglePreferredTravelMode = function(mode) {
            var index = $scope.options.transitOptions.modes.indexOf(mode);
            if (index >= 0) {
              $scope.options.transitOptions.modes.splice(index, 1);
            } else {
              $scope.options.transitOptions.modes.push(mode);
            }
          };

          $scope.toggleAvoidPreference = function(preference) {
            var index = $scope.options.avoid.indexOf(preference);
            if (index >= 0) {
              $scope.options.avoid.splice(index, 1);
            } else {
              $scope.options.avoid.push(preference);
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
            $scope.options.origin = Router.location('origin');
            $scope.options.destination = Router.location('destination');
            $scope.clearRoutes();
            Router.clear({ keepMarkers: true });
            $scope.routingInProgress = true;
            Router.route($scope.options).then(function(routes) {
              $scope.routes = routes;
              $scope.displayedRoute = 0;
              $scope.routingInProgress = false;

              // wait for displaying the list with routes
              $timeout(function() {
                Router.fitMap();
                $scope.displayRoute(0);
              }, 200);
            });
          };

          $scope.displayRoute = function(index) {
            Router.display(index);
            $scope.displayedRoute = index;
          };

          $scope.clear = function() {
            $scope.originInput.val('');
            $scope.destinationInput.val('');
            $scope.waypointsInput.val('');
            $scope.checkboxes.attr('checked', false);
            $scope.options.mode = 'driving';
            $scope.options.waypoints = [];
            $scope.options.avoid = [];
            $scope.clearRoutes();
            Router.clear();
          };

          $scope.clearRoutes = function() {
            $scope.routes = [];
            // wait for removing the list with routes
            $timeout(function() { Router.fitMap(); }, 200);
          };

          $scope.resetDestination = function() {
            if ($scope.destinationInput.val() === '') {
              Router.reset('destination');
              Router.clear({ keepMarkers: true });
            }

            if (Router.routes.polylines.length === 0) {
              $scope.clearRoutes();
            }
          };

          $scope.resetOrigin = function() {
            if ($scope.originInput.val() === '') {
              Router.reset('origin');
              Router.clear({ keepMarkers: true });
            }

            if (Router.routes.polylines.length === 0) {
              $scope.clearRoutes();
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
