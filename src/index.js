import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM.js';
import TileWMS from 'ol/source/TileWMS';

import angular from 'angular';

(function() {
    angular
        .module('simpleMapModule', [])
        .config(['MAPSERVER', 'LAYERS', 'TiledLayerProvider', function(MAPSERVER, LAYERS, TiledLayerProvider) {
            TiledLayerProvider.createTiledLayer(MAPSERVER, LAYERS);
        }])
        .constant('MAPSERVER', 'https://geodash.gov.bd/geoserver/wms')
        .constant('CONSTANTS', {})
        .constant('LAYERS', [
            'geonode:primary_schools_2',
            'geonode:osm_transport_points'
        ])
        .run(InitProject)
        .controller('MainController', MainController)
        .factory('LayerService', LayerService)
        .provider('TiledLayer', function TiledLayer() {
            let list = [];
            let object = {};
            let response = {
                get: () => {
                    return object;
                },
                getList: () => {
                    return list;
                },
                getByName: (name) => {
                    return object[name];
                },


            };

            function newTileLayer(serverUrl, name) {
                return new TileLayer({
                    source: new TileWMS({
                        url: serverUrl,
                        params: {
                            'LAYERS': name,
                            'TILED': true
                        },
                        // crossOrigin: 'anonymous',
                        serverType: 'geoserver',
                        transition: 0
                    })
                });
            }

            this.createTiledLayer = function(serverUrl, layers) {
                object = layers.reduce((acc, name) => {
                    acc[name] = newTileLayer(serverUrl, name);
                    return acc;
                }, {});
                list = Object.entries(object).map(l => l[1]);

            };
            this.$get = [() => {
                return response;
            }];
        });

    InitProject.$inject = ['$rootScope', 'TiledLayer', 'LayerService'];
    MainController.$inject = ['LAYERS', '$rootScope', 'TiledLayer'];
    LayerService.$inject = ['$http', '$q'];


    function InitProject($rootScope, TiledLayer, LayerService) {

        let _map = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                ...TiledLayer.getList()

            ],
            view: new View({
                center: [23.8103, 90.4125],
                zoom: 2
            })
        });
        const _view = _map.getView();
        const _viewResolution = view.getResolution();

        function showFeatureInfo(url) {
            LayerService.get(url)
                .then(function(res) {
                    console.log(res);
                });
        }

        function getLayerFeatureInfo(evt) {
            let layers = TiledLayer.get();
            for (let k in layers) {
                if (!layers[k].getVisible()) {
                    continue;
                }
                let wmsSource = layers[k].getSource();
                var url = wmsSource.getGetFeatureInfoUrl(
                    evt.coordinate,
                    _viewResolution,
                    'EPSG:3857', { 'INFO_FORMAT': 'application/json' });
                showFeatureInfo(url);
            }
        }

        _map.on('singleclick', _getLayerFeatureInfo);

        $rootScope.Map = _map;
    }

    function LayerService($http, $q) {
        function get(url, params) {
            var deffered = $q.defer();
            let uri = url + Object.entries(params || {}).reduce((p, c, i) => i == 0 ? p + c.join('=') : p + '&' + c.join('='), '?');
            $http.get(uri)
                .then(function(res) {
                    deffered.resolve(res);
                }, function() {
                    deffered.reject(arguments);
                });
            return $q.promise;
        }

        return {
            get: get
        };
    }

    function MainController(LAYERS, $rootScope, TiledLayer) {
        const self = this;
        const _map = $rootScope.Map;
        self.Layers = LAYERS;
        self.onLayerVisibilityChange = function(name, isVisible) {
            let layer = TiledLayer.getByName(name);
            if (layer) {
                layer.setVisible(isVisible);
            }
        };
    }

})();