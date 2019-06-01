require([
    "esri/Map",
    "esri/layers/GeoJSONLayer",
    "esri/views/MapView",
    "esri/renderers/HeatmapRenderer",
    "esri/widgets/Legend",
    "esri/widgets/Search",
    "esri/renderers/ClassBreaksRenderer"
], function(Map, GeoJSONLayer, MapView, HeatmapRenderer, Legend, Search, ClassBreaksRenderer) {
    // Datos de los pisos
    const url =
        "http://localhost:8081/data/.housting-distrito-retiro-pacifico.geojson";

    // Ventana de información que se activará al seleccionar cada piso
    const template = {
        title: "Pisos en Madrid",
        content: "{descripcion} </br> {precio} € / {habitaciones} habitaciones"
    };

    const less400 = {
        type: "simple-marker", // autocasts as new SimpleFillSymbol()
        color: "#fffcd4",
        style: "circle",
        outline: {
            width: 0.2,
            color: [255, 255, 255, 0.5]
        }
    };

    const less600 = {
        type: "simple-marker", // autocasts as new SimpleFillSymbol()
        color: "#b1cdc2",
        style: "circle",
        outline: {
            width: 0.2,
            color: [255, 255, 255, 0.5]
        }
    };

    const more600 = {
        type: "simple-marker", // autocasts as new SimpleFillSymbol()
        color: "#38627a",
        style: "circle",
        outline: {
            width: 0.2,
            color: [255, 255, 255, 0.5]
        }
    };

    const more1000 = {
        type: "simple-marker", // autocasts as new SimpleFillSymbol()
        color: "#0d2644",
        style: "circle",
        outline: {
            width: 0.2,
            color: [255, 255, 255, 0.5]
        }
    };

    // Simbología por break points
    const renderer = {
        type: "class-breaks",
        field: "precio",
        classBreakInfos: [{
                minValue: 0,
                maxValue: 400,
                symbol: less400,
                label: "< 400"
            },
            {
                minValue: 400,
                maxValue: 600,
                symbol: less600,
                label: "400 - 600"
            },
            {
                minValue: 600,
                maxValue: 800,
                symbol: more600,
                label: "600 - 800"
            },
            {
                minValue: 800,
                maxValue: 1000,
                symbol: more1000,
                label: "> 1000"
            }
        ]
    };

    // Capa del mapa que va a contener los pisos a visualizar
    const geojsonLayer = new GeoJSONLayer({
        url: url,
        title: "Precio pisos en Madrid",
        copyright: "Loretus S.A",
        popupTemplate: template,
        renderer: renderer
    });

    // Mapa
    const map = new Map({
        basemap: "gray",
        layers: [geojsonLayer]
    });

    // Vista del mapa
    const view = new MapView({
        container: "viewDiv",
        center: [-3.675376, 40.405236],
        zoom: 15,
        map: map
    });

    view.ui.add(
        new Legend({
            view: view
        }),
        "bottom-left"
    );

    var searchWidget = new Search({
        view: view
    });

    view.ui.add(searchWidget, {
        position: "top-right"
    });
});