(function() {
    'use strict';

    var blackJackApp = angular.module('blackJack', [ 'btford.socket-io', 'ngAnimate' ]);

    blackJackApp.factory('socket', function (socketFactory) {
        return socketFactory;
    });


    blackJackApp.controller('GameCtrl', function($scope, $http, socket) {
        $scope.otherPlayers= {};
        $scope.data = {};
        $scope.isGameActive = false;
        $scope.isActive = false;

        $http.get('/player')
        .success(function(json) {
            $scope.playerName = json.playerData.name;
            $scope.isGameActive = true;
            $scope.otherPlayers = {};

            angular.merge($scope.data, json);

            socket = new socket();

            socket.on("message",function(data){
                if(data.otherPlayers && data.otherPlayers[$scope.playerName]){
                    //dont duplicate info about ourselves
                    return;
                }else{
                    if(data.winner){
                        $scope.isGameActive = false;
                    }
                    angular.merge($scope.data, data);
                }
            }.bind($scope));

            socket.on("connect",function(){
                socket.emit("playerJoin", {playerName: $scope.playerName});
                    //console.log("connected");
            });

            socket.connect();

        });

        $scope.deal = function(){
            $http.get('/player/' + $scope.playerName + '/cards')
                .success(function(json) {
                    $scope.isGameActive = true;
                    angular.merge($scope.data, json);
                });

        };

        $scope.hit = function(){
            $http.get('/player/' + $scope.playerName + '/hit')
            .success(function(json) {
                    angular.merge($scope.data, json);
            });
        };

        $scope.stand = function(){
            $http.get('/player/' + $scope.playerName + '/stand')
            .success(function(json) {
                //wait for ws message with winner
            });
        };

        $scope.reset = function(){
            $http.get('/player')
                .success(function(json) {
                    $scope.playerName=  json.playerData.name;
                    angular.merge($scope.data, json);
            });
        };

    });

})();

