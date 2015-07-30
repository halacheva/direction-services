'use strict';

(function () {
  var directionServicesApp = angular.module('directionServicesApp', ['ngResource', 'ngAnimate']);

  directionServicesApp.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode(true);
  }]);
})();


