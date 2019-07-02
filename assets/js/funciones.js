$(document).ready(function () {

	function visibilidadOsm(valor) {
		var capas = map.style._order;
		for (var i = capas.length - 1; i >= 0; i--) {
			if (capas[i] != 'satelite' && capas[i] != 'natural_earth' && capas[i] != 'building-3d') {
				map.setLayoutProperty(capas[i], 'visibility', valor);
			} else {
				if (map.getLayoutProperty('satelite', 'visibility') == 'none') {
					map.setLayoutProperty('satelite', 'visibility', 'visible');
				}
			}
		}
	}

	$('#osm').click(function (e) {
		if ($(this).is(':checked') == true) {
			visibilidadOsm('visible');
		} else {
			visibilidadOsm('none');
		}
	});

	$('#satelite').click(function (e) {
		if ($(this).is(':checked') == true) {
			map.setLayoutProperty('satelite', 'visibility', 'visible');
			opacidad(0.1);
			map.setLayoutProperty('background', 'visibility', 'none');
			//map.setLayoutProperty('water', 'visibility', 'none');
		} else {
			map.setLayoutProperty('satelite', 'visibility', 'none');
			opacidad(1);
		}
	});

	eclipse(); // inicia la capa de eclipse por defecto
	$('#eclipse-solar-2019').click(function (e) {
		if ($(this).is(':checked') == true) {
			eclipse();
		} else {
			map.removeLayer("penumbra");
			map.removeLayer("umbra");
			map.removeSource("penumbra");
			map.removeSource("umbra");
		}
	});

	$('#chk_sup_calles').click(function (e) {
		if ($(this).is(':checked') == true) {
			supCalles();
		} else {
			map.removeLayer("sup-calles-paved");
			map.removeLayer("sup-calles-unpaved");
		}
	});

	$('#chk_cruce_andes').click(function (e) {
		if ($(this).is(':checked') == true) {
			cruceAndes();
		} else {
			map.removeLayer("rutas");
			map.removeLayer("batallas");
			map.removeSource("cruce-andes");
		}
	});

	$('#chk_edificios_3d').click(function (e) {
		if ($(this).is(':checked') == true) {
			map.addLayer(edificios_3d);
		} else {
			map.removeLayer("osmbuildings");
		}
	});

	$('#chk_colectivos').click(function (e) {
		if ($(this).is(':checked') == true) {
			map.addLayer(colectivos);
			map.addLayer(colectivosRef);
		} else {
			map.removeLayer("colectivos-ref");
			map.removeLayer("colectivos");
		}
	});

	$('#chk_red_vial').click(function (e) {
		if ($(this).is(':checked') == true) {
			map.addLayer(red_vial);
		} else {
			map.removeLayer("red_vial");
		}
	});

	$('#chk_corriente_agua_l').click(function (e) {
		if ($(this).is(':checked') == true) {
			map.addLayer(corriente_agua_l);
			map.addLayer(corriente_agua_l_name);
		} else {
			map.removeLayer("corriente_agua_l");
			map.removeLayer("corriente_agua_l_name");
		}
	});

	$('#chk_espejo_agua').click(function (e) {
		if ($(this).is(':checked') == true) {
			map.addLayer(espejo_agua);
			map.addLayer(espejo_agua_label);
		} else {
			map.removeLayer("espejo_agua");
			map.removeLayer("espejo_agua_label");
		}
	});

	$('#chk_municipios').click(function (e) {
		if ($(this).is(':checked') == true) {
			map.addLayer(municipios);
		} else {
			map.removeLayer("municipios");
		}
	});

	$("#btnPanelDatos").click(function () {
		$("#features").toggleClass();
		if (!$("#features").hasClass("oculto")) {
			$("#btnPanelDatos").css("color", "#0074D9");
			$("#btnPanelDatos").css("background", "#dddddd");
			$("#btnPanelDatos").html("Ocultar datos de objetos");
		} else {
			$("#btnPanelDatos").css("color", "white");
			$("#btnPanelDatos").css("background", "#0074D9");
			$("#btnPanelDatos").html("Ver datos de objetos");
		}
	});


	function addZero(i) {
		if (i < 10) {
			i = "0" + i;
		}
		return i;
	}

var d, h, m, horaUtc, umbraFilter;
	function eclipse() {
		d = new Date();
		h = addZero(d.getUTCHours());
		m = addZero(d.getUTCMinutes());
		horaUtc = h + ':' + m + ':' + '00';

		// Actualiza el filtro de la sombra cada 10 seg reflejando la nueva hora
		window.setInterval(function () {
			d = new Date();
			h = addZero(d.getUTCHours());
			m = addZero(d.getUTCMinutes());
			horaUtc = h + ':' + m + ':' + '00';
			console.log(horaUtc);
			umbraFilter = ["==", 'UTCTime', horaUtc];
			map.setFilter('umbra', umbraFilter);
		}, 10000);

		map.addSource("penumbra", {
			"type": "geojson",
			"data": "map/capas/eclipse-penumbra-2019.geojson",
			"attribution": "<a href='https://svs.gsfc.nasa.gov/4713' target='_blank'>NASA's Scientific Visualization Studio</a>"
		});
		map.addLayer({
			"id": "penumbra",
			"type": "fill",
			"source": "penumbra",
			"paint": {
				"fill-color": '#000000',
				"fill-opacity": 0.05,
			}
		});
		/* 		map.addLayer({
					"id": "texto-penumbra",
					"type": "symbol",
					"source": "penumbra",
					"layout": {
						"text-field": ["get", "name"],
						"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
						"text-justify": "auto"
					}
				}); */
		map.addSource("umbra", {
			"type": "geojson",
			"data": "map/capas/eclipse-umbra-2019.geojson"
		});
		map.addLayer({
			"id": "umbra",
			"type": "fill",
			"source": "umbra",
			"paint": {
				"fill-color": '#000000',
				"fill-opacity": 0.8,
			},
			"filter": ["==", "UTCTime", horaUtc]
		});

		map.fitBounds([[-175.078125, -70.959697], [-40.781250, 8.754795]]);
	}

	function supCalles() {
		map.addLayer(
			{
				"id": "sup-calles-unpaved",
				"source": "openmaptiles",
				"source-layer": "transportation",
				"type": "line",
				"minzoom": 12,
				"filter": [
					"all",
					[
						"==",
						"$type",
						"LineString"
					],
					[
						"in",
						"class",
						"motorway",
						"trunk",
						"primary",
						"secondary",
						"tertiary",
						"minor",
						"service",
						"track",
						"path",
						"raceway",
						"transit"
					],
					[
						"==",
						"surface",
						"unpaved"
					]
				],
				"layout": {
					"line-cap": "round",
					"line-join": "round",
					"visibility": "visible"
				},
				"paint": {
					"line-color": "#e87400",
					"line-width": {
						"base": 1.55,
						"stops": [
							[
								4,
								0.25
							],
							[
								20,
								30
							]
						]
					}
				}
			}
		);

		map.addLayer(
			{
				"id": "sup-calles-paved",
				"source": "openmaptiles",
				"source-layer": "transportation",
				"type": "line",
				"minzoom": 12,
				"filter": [
					"all",
					[
						"==",
						"$type",
						"LineString"
					],
					[
						"in",
						"class",
						"motorway",
						"trunk",
						"primary",
						"secondary",
						"tertiary",
						"minor",
						"service",
						"track",
						"path",
						"raceway",
						"transit"
					],
					[
						"==",
						"surface",
						"paved"
					]
				],
				"layout": {
					"line-cap": "round",
					"line-join": "round",
					"visibility": "visible"
				},
				"paint": {
					"line-color": "#d742f5",
					"line-width": {
						"base": 1.55,
						"stops": [
							[
								4,
								0.25
							],
							[
								20,
								30
							]
						]
					}
				}
			}
		);
	}

	function cruceAndes() {
		map.addSource("cruce-andes", {
			"type": "geojson",
			"data": "map/capas/cruce-de-los-andes.geojson"
		});
		map.addLayer({
			"id": "rutas",
			"type": "line",
			"source": "cruce-andes",
			"layout": {
				"line-join": "round",
				"line-cap": "round"
			},
			"paint": {
				"line-width": {
					//"base": 4,
					"stops": [[4, 2], [5, 3], [12, 4]],
				},
				//"line-color": "#7983EF"
				"line-color": {
					property: 'ruta',
					type: 'categorical',
					stops: [
						['Paso de Come-Caballos', '#7983EF'],
						['Paso de Los Patos', '#2196f3'],
						['Paso del Planchón', '#e55e5e'],
						['Paso de Guana', '#3bb2d0'],
						['Paso del Potrillo', '#253494'],
						['Paso de Uspallata', '#fd8d3c']]
				}
			}
		});
		map.addLayer({
			"id": "batallas",
			"type": "circle",
			"source": "cruce-andes",
			"paint": {
				"circle-radius": 6,
				"circle-color": "red"
			},
			"filter": ["==", "$type", "Point"]
		});

		map.on('click', 'rutas', function (e) {
			/*
			console.log(popu);
				*/
			var content = e.features[0].properties;
			var popupContent = "<b>" + content.ruta + "</b><br><p>Altura máxima: " + content.altitud_maxima + "<br>Efectivos: " + content.efectivos + "<br>Fecha: " + content.fecha_inicio + "</p>"
			new mapboxgl.Popup()
				.setLngLat(e.lngLat)
				.setHTML(popupContent)
				.addTo(map);
		});

		// Change the cursor to a pointer when the mouse is over the places layer.
		map.on('mouseenter', 'rutas', function () {
			map.getCanvas().style.cursor = 'pointer';
		});

		// Change it back to a pointer when it leaves.
		map.on('mouseleave', 'rutas', function () {
			map.getCanvas().style.cursor = '';
		});

		map.fitBounds([[-79.83, -35.68], [-56.27, -26.47]]);
	}

	function editarMapa() {
		var z = Math.round(map.getZoom());
		if (z > 15) {
			var urlBase = 'http://www.openstreetmap.org/edit#map='
			var x = map.getCenter().lng;
			var y = map.getCenter().lat;
			var urlEdit = urlBase + z + '/' + y + '/' + x;
			window.open(urlEdit, '_blank');
		} else {
			alert("Acercar para editar");
		}
	}

	$('#editarMapa').click(function (e) {
		e.preventDefault();
		editarMapa();
		return false;
	});

	var featuresData;
	map.on('click', function (e) {
		featuresData = map.queryRenderedFeatures(e.point);
		if (featuresData.hasOwnProperty(0)) {
			document.getElementById('features').innerHTML = JSON.stringify(featuresData[0].properties, null, 2);
		}
	});
});

function opacidad(valor) {
	var capas = map.style._order;
	for (var i = capas.length - 1; i >= 0; i--) {
		if (map.getLayer(capas[i]).type == 'fill') {
			map.setPaintProperty(capas[i], 'fill-opacity', valor);
		}
	}
}

function ocultarPanel() {
	$('#panel').toggleClass('oculto');
}