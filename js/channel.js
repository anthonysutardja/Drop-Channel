var BASE_URL = "http://gamma.firebase.com/anthony/";

filepicker.setKey('AFTakle7HQemqmsw6-CoUz');

var base = new Firebase(BASE_URL);
var world_locations = base.child('locations');
var myloc;
var first_init = false;


world_locations.once('value', function(data){
	var locations = data.val();
	console.log(data);
	if (locations == null){
		locations = [];
	}
	checkLocations(locations);
});
var checkLocations = function(locations){
	//check user's position
	
	if (navigator.geolocation) {
	  	navigator.geolocation.getCurrentPosition(genSuccessCallback(locations), ErrorCallback, {enableHighAccuracy: true, maximumAge:1000*60*5});
	} else {
	  	alert("This browser does not have geolocation support.");
	}
};

var genSuccessCallback = function(locations){
	var ret = function(position){
		var found = [];
		var currentLoc = new LatLon(position.coords.latitude, position.coords.longitude);
		var potentialLoc;
		var distance;

		for ( var i = 0 ; i < locations.length; i++){
			potentialLoc = new LatLon(locations[i].latitude, locations[i].longitude);
			distance = parseFloat(potentialLoc.distanceTo(currentLoc))*1000; //was in KM, needs to be in Meters
			if ( (position.coords.accuracy - ( distance - 50)) >= 0){
				found.push({'location': locations[i], 'distance' : distance});
			}
		}
		console.log(found);
		var final_location;
		if ( found.length === 0 ){
			//Add a new center
			final_location = currentLoc;
			locations.push({'latitude' : currentLoc._lat, 'longitude' : currentLoc._lon});
			world_locations.set(locations);
		}else{
			console.log('executed');
			//Find nearest location
			var min_dist = found[0].distance;
			final_location = found[0].location;
			for ( var j = 1; j < found.length ; j++){
				if ( found[j].distance < min_dist ){
					min_dist = found[j].distance;
					final_location = found[j].location;
				};
			}
		}
		console.log(final_location);
		console.log(coordToString(final_location.latitude, final_location.longitude));
		//do something with final_location
		myloc = base.child(coordToString(final_location.latitude, final_location.longitude));
		UI.setChannel('red');
	};
	return ret;
};
var ErrorCallback = function(position){
	alert("Could not retrieve location.");
};

var coordToString = function(lat,lon){
	var ret_str = lat.toString()+lon.toString();
	return ret_str.replace(".","").replace(".","");
};

var UI = {
	'channel' : null,
	'setChannel' : function(color){
		//clear all items
		
		//change tab color
		
		//change background color
		
		if (UI.channel){
			UI.channel.off('child_added', UI.drawItem);
			UI.channel.off('child_removed', UI.eraseItem);
		}
		UI.channel = myloc.child(color);
		UI.channel.on('child_added', UI.drawItem);
		UI.channel.on('child_removed', UI.eraseItem);
	},
	'drawItem' : function(snapshot){
		//callback function for data
		//check
		var file = snapshot.val();
		//draw shit on canvas.

		$('#main').append('<div id="'+file.uid+'" class="file"><center><div class="filename">'+file.filename+'</div><a href="'+file.url+'"><div class="icon"></div></a><div class="author">'+file.author+'</div></center></div>').children("#"+file.uid).css('top', file.top).css('left', file.left);
	
		//add event handlers for dragging
	},
	'eraseItem' : function(snapshot){
		//remove UI element
		var file = snapshot.val();
		//do shit
	},
	'addItem' : function(auth, url, top, left, filename){
		//add item
		var author = author || "Guest";
        var delivery = {
            'uid' : generateUID(),
            'author' : author,
            'url' : url,
            'top' : top,
            'left' : left,
            'filename' : filename
        };
        var item = UI.channel.push(delivery);
        item.removeOnDisconnect();
	},
	'deleteItem' : function(){
		// DONT DO ANY UI SHIT HERE
	}
};



function generateUID(){
	var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var ret_str = "";
	for ( var i = 0; i < 16; i++){
		ret_str += charset[Math.floor(Math.random()*charset.length)];
	}
	return ret_str;
}















