// Búsqueda con Nominatim
var bbox, searchLat, searchLon, respuesta = "", lugar = "";

$("#buscarLugar").bind("keypress", {}, keypressInBox);

function keypressInBox(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode                        
        e.preventDefault();
        lugar = $("#buscarLugar")[0].value;
        buscar(lugar);
    }
};

function viajar(bbox) {
	map.fitBounds(
		[
			[ bbox[2], bbox[0] ],
			[ bbox[3], bbox[1] ]
		], {
			padding: { top: 10, bottom:25, left: 15, right: 5 },
			duration: 0
	});
};

function buscar(lugar) {
	$.getJSON("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + lugar, function(data) {
		$.each(data, function(key, val) {
			bbox = val.boundingbox;
		});
		viajar(bbox);
	});
}