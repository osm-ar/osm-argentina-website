let features = {},
	dataLayers = [];
horas = [
	"Inicio", "14:34", "14:36", "14:38", "14:40", "14:42", "14:44", "14:46", "14:48", "14:50", "14:52", "14:54", "14:56", "14:58", "15:00", "15:02", "15:04", "15:06", "15:08", "15:10", "15:12", "15:14", "15:16", "15:18", "15:20", "15:22", "15:24", "15:26", "15:28", "15:30", "15:32", "15:34", "15:36", "15:38", "15:40", "15:42", "15:44", "15:46", "15:48", "15:50", "15:52", "15:54", "15:56", "15:58", "16:00", "16:02", "16:04", "16:06", "16:08", "16:10", "16:12", "16:14", "16:16", "16:18", "16:20", "16:22", "16:24", "16:26", "16:28", "16:30", "16:32", "16:34", "16:36", "16:38", "16:40", "16:42", "16:44", "16:46", "16:48", "16:50", "16:52", "16:54", "16:56", "16:58", "17:00", "17:02", "17:04", "17:06", "17:08", "17:10", "17:12", "17:14", "17:16", "17:18", "17:20", "17:22", "17:24", "17:26", "17:28", "17:30", "17:32", "17:34", "17:36", "17:38", "17:40", "17:42", "17:44", "17:46", "17:48", "17:50", "17:52", "17:54", "Fin"];

/* function metersPerPixel(latitude, zoomLevel) {
	var earthCircumference = 40075017;
	var latitudeRadians = latitude * (Math.PI / 180);
	return earthCircumference * Math.cos(latitudeRadians) / Math.pow(2, zoomLevel + 8);
};
function pixelValue(latitude, meters, zoomLevel) {
	return meters / metersPerPixel(latitude, zoomLevel);
}; */
function createGeoJSONCircle(center, radiusInKm, points) {
	if (!points) points = 64;

	var coords = {
		latitude: center[1],
		longitude: center[0]
	};

	var km = radiusInKm;

	var ret = [];
	var distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
	var distanceY = km / 110.574;

	var theta, x, y;
	for (var i = 0; i < points; i++) {
		theta = (i / points) * (2 * Math.PI);
		x = distanceX * Math.cos(theta);
		y = distanceY * Math.sin(theta);

		ret.push([coords.longitude + x, coords.latitude + y]);
	}
	ret.push(ret[0]);

	return {
		"type": "geojson",
		"data": {
			"type": "FeatureCollection",
			"features": [{
				"type": "Feature",
				"geometry": {
					"type": "Polygon",
					"coordinates": [ret]
				}
			}]
		}
	};
};

function createCircleLayer(center, radiusInKm, points, color, opacity, overlay) {
	map.addSource("polygon", createGeoJSONCircle(center, radiusInKm, points));

	map.addLayer({
		"id": "polygon",
		"type": "fill",
		"source": "polygon",
		"layout": {},
		"paint": {
			"fill-color": color,
			"fill-opacity": opacity,
			"fill-outline-color": "gray"
		}
	},
		overlay
	);
}


function dataFilter() {
	fetch('map/capas/eclipse-solar-2020-umbra.geojson')
		.then(function (response) {
			return response.text();
		})
		.then(function (data) {
			let geojson = JSON.parse(data);
			geojson.features.forEach(feature => {
				features[feature.properties.hora] = {
					coords: feature.geometry.coordinates,
					properties: feature.properties
				};
			});
			bindButtons();
			// Inicia filtro
			filterBy(50);
		})
		.catch(function (err) {
			console.error(err);
		});
}

var filterBy = function (hora) {
	let filters = ['==', 'hora', horas[hora]],
		_zoom = map.getZoom(),
		_center = features[horas[hora]].coords,
		_ancho = parseInt(features[horas[hora]].properties.ancho, 10) / 2,
		ancho;

	if (!map.getSource('polygon')) {
		createCircleLayer(_center, _ancho, 64, '#000000', 0.7, 'umbra');
		dataLayers.push("polygon");
	} else {
		map.getSource('polygon')
			.setData(createGeoJSONCircle(_center, _ancho).data);
	}

	map.setFilter('umbra', filters);
	map.flyTo({ center: _center, zoom: _zoom });

	// Etiqueta de hora
	let timeLabel = document.getElementById('hora'),
		timeArray = horas[hora].split(':');
	if (!isNaN(timeArray[0])) {
		let d = new Date(),
			timeDiff = d.getTimezoneOffset() / 60,
			utcTimeStr = horas[hora] + ' (UTC)',
			localHour = timeArray[0] - timeDiff + ':' + timeArray[1],
			localTimeStr = localHour,
			timeDiffStr,
			tzFullName = d.toLocaleDateString(undefined, { timeZoneName: 'long' }),
			tzName = tzFullName.substr(tzFullName.search(' '));
		switch (Math.sign(timeDiff)) {
			case 1:
				timeDiffStr = ` (-${timeDiff} ${tzName})`;
				break;
			case -1:
				timeDiffStr = ` (+${timeDiff * -1} ${tzName})`;
				break;
			default:
				timeDiffStr = '';
				break;
		}
		timeLabel.textContent = localTimeStr + `${timeDiffStr} || ` + utcTimeStr;
	} else {
		timeLabel.textContent = horas[hora];
	}
	document.getElementById('slider').value = hora;
}

function move(to) {
	let slider = document.getElementById('slider'),
		hr = parseInt(slider.value, 10),
		max = parseInt(slider.max, 10),
		min = parseInt(slider.min, 10);
	switch (to) {
		case 'forward':
			(hr < max) ? filterBy(hr + 1) : null;
			break;
		case 'backward':
			(hr > min) ? filterBy(hr - 1) : null;
			break;
		case 'start':
			filterBy(min);
			break;
		case 'end':
			filterBy(max);
			break;
		default:
			break;
	}
}

/* 
let	timer, counter = 0;
function play() {
	let slider = document.getElementById('slider'),
		max = slider.max, min = slider.min;
	if (slider.value != min) { move('start'); }
	counter++;
	if (counter < 0) timer = setTimeout(function () {
			move('forward');
	}, 0);
}

function stop() {
	counter = -1;
} */

/* 
function play() {
	move('start');
	let max = document.getElementById('slider').max;
	for (let i = 0; i < max; i++) {
		if (playing = false) { break; }
		console.log(playing);
		setTimeout(() => {
			move('forward');
		}, i * 2000);
		playing = true;
	}
}

function stop() {
	playing = false;
} */

function bindButtons() {
	let s = selector => document.getElementsByName(selector)[0];
	//s('play').addEventListener('click', function () { play() });
	s('start').addEventListener('click', function () { move('start') });
	s('back').addEventListener('click', function () { move('backward') });
	s('next').addEventListener('click', function () { move('forward') });
	s('end').addEventListener('click', function () { move('end') });
}

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

	$('#eclipse-solar').click(function (e) {
		let eclipseSlider = document.getElementsByClassName('map-overlay')[0];
		if ($(this).is(':checked') == true) {
			eclipse();
			eclipseSlider.setAttribute('style', 'visibility: true');
		} else {
			map.removeLayer("penumbra");
			map.removeLayer("umbra");
			map.removeSource("penumbra");
			map.removeSource("umbra");
			eclipseSlider.setAttribute('style', 'visibility: hidden');
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

	function addSlider() {
		let title = 'Eclipse solar 14 de diciembre de 2020',
			umbraNote = 'El ícono de la sombra muestra la ubicación, no su tamaño real',
			htmlStr = `<div id="sliderPanel" class="map-overlay-inner"><h2>${title}</h2><div style="margin: auto; padding: 0; display: table;"><!--<button name="play" type="button"></button>--><button name="start" title="Inicio" type="button"><i class="fas fa-angle-double-left"></i></button><button name="back" title="Atrás" type="button"><i class="fas fa-angle-left"></i></button><button name="next" title="Adelante" type="button"><i class="fas fa-angle-right"></i></button><button name="end" title="Fin" type="button"><i class="fas fa-angle-double-right"></i></button></div></br><label id="hora"></label><input id="slider" type="range" min="0" max="${horas.length - 1}" step="1" value="50" />${umbraNote}</div>`;
		timeSlider = document.createElement('div');
		timeSlider.classList.add("map-overlay");
		timeSlider.innerHTML = htmlStr;
		document.body.append(timeSlider);
	}

	function eclipse() {

		function addEclipseSrc() {
			map.addSource("penumbra", {
				"type": "geojson",
				"data": "map/capas/eclipse-solar-2020-penumbra.geojson",
				"attribution": "<a href='https://es.wikipedia.org/wiki/Eclipse_solar_del_14_de_diciembre_de_2020' target='_blank'>Wikipedia</a>"
			});
			map.addSource("umbra", {
				"type": "geojson",
				"data": "map/capas/eclipse-solar-2020-umbra.geojson",
				"attribution": "<a href='https://moonblink.info/Eclipse/eclipse/2020_12_14' target='_blank'>© Moonblink by Ian Cameron Smith</a>"
			});
		}
		function addEclipseLyrs() {
			/* map.addLayer({
				"id": "texto-penumbra",
				"type": "symbol",
				"source": "penumbra",
				"layout": {
					"text-field": ["get", "name"],
					"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
					"text-justify": "auto"
				}
			}); */
			map.addLayer({
				"id": "penumbra",
				"type": "fill",
				"source": "penumbra",
				"paint": {
					"fill-color": '#000000',
					"fill-opacity": 0.05
				}
			});
			if (!map.hasImage('eclipse')) {
				map.loadImage(
					'assets/img/eclipse_chico.png',
					function (error, image) {
						if (error) throw error;
						map.addImage('eclipse', image)
					});
			}

			map.addLayer({
				"id": "umbra",
				"type": "symbol",
				"source": "umbra",
				"layout": {
					"icon-image": "eclipse",
					"icon-size": 0.35
				}
			});

			dataLayers.push("umbra");
			dataLayers.push("penumbra");
		}
		dataFilter();
		addEclipseSrc();
		addEclipseLyrs();

		document
			.getElementById('slider')
			.addEventListener('input', function (e) {
				var hora = parseInt(e.target.value, 10);
				filterBy(hora);
			});
	}

	map.on('load', function () {
		addSlider();
		eclipse(); // inicia la capa de eclipse por defecto
		addSky();
	});

	/* Eclipse 2019
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
		map.addLayer({
			"id": "texto-penumbra",
			"type": "symbol",
			"source": "penumbra",
			"layout": {
				"text-field": ["get", "name"],
				"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
				"text-justify": "auto"
			}
		});
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
 */

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

	function addSky() {
		map.addLayer({
			'id': 'sky',
			'type': 'sky',
			'paint': {
				// set up the sky layer to use a color gradient
				'sky-type': 'gradient',
				'sky-gradient': [
					'interpolate',
					['linear'],
					['sky-radial-progress'],
					0.8,
					'rgba(135, 206, 235, 1.0)',
					1,
					'rgba(0,0,0,0.1)'
				],
				'sky-gradient-center': [0, 0],
				'sky-gradient-radius': 90,
				'sky-opacity': [
					'interpolate',
					['exponential', 0.1],
					['zoom'],
					5,
					0,
					22,
					1
				]
			}
		});
	}

	function editarMapa() {
		var z = Math.round(map.getZoom());
		if (z > 15) {
			var urlBase = 'https://www.openstreetmap.org/edit#map='
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
		if (map.getLayer(capas[i]).type == 'fill' && dataLayers.indexOf(capas[i]) < 0) {
			map.setPaintProperty(capas[i], 'fill-opacity', valor);
		}
	}
}

function ocultarPanel() {
	$('#panel').toggleClass('oculto');
}