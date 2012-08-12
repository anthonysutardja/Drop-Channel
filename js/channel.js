var BASE_URL = "http://gamma.firebase.com/anthony/";

filepicker.setKey('AFTakle7HQemqmsw6-CoUz');

var base = new Firebase(BASE_URL);
var world_locations = base.child('locations');
var myloc;
var first_init = false;

var click_virgin = true;

var file_obj = {};

world_locations.once('value', function(data){
	var locations = data.val();
	if (locations == null){
		locations = [];
	}
	checkLocations(locations);
});
var checkLocations = function(locations){
	//check user's position
	
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(genSuccessCallback(locations), ErrorCallback, {enableHighAccuracy: true});
		$("#main").append('<div id="splash" class="virg">Click anywhere to add a file.</div>');
	  	//navigator.geolocation.getCurrentPosition(genSuccessCallback(locations), ErrorCallback, {enableHighAccuracy: true, maximumAge:1000*60*5});
	} else {
	  	alert("This browser does not have geolocation support.");
	  	$("#main").append('<div id="splash">Could not locate :(</div>');
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
		var final_location;
		if ( found.length === 0 ){
			//Add a new center
			final_location = currentLoc;
			locations.push({'latitude' : currentLoc._lat, 'longitude' : currentLoc._lon});
			world_locations.set(locations);
		}else{
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
		//do something with final_location
		myloc = base.child(coordToString(final_location.latitude, final_location.longitude));
		UI.setChannel('red');
	};
	return ret;
};
var ErrorCallback = function(position){
	alert("Could not retrieve location.");
	console.log('error');
};

var coordToString = function(lat,lon){
	var ret_str = lat.toString()+lon.toString();
	return ret_str.replace(".","").replace(".","");
};

var UI = {
	'channel' : null,
	'color' : "",
	'setChannel' : function(color){
		//clear all items
		$('#main').removeClass(UI.color);
		$('#main').html("");
		if (click_virgin){
			
			$("#main").append('<div id="splash" class="virg"><span>Click anywhere to add a file.</span><p class="teeny">Everyone in a 50 meter radius will see your drop!</p></div>');
		}
		UI.color = color;	
		//change background color
		
		$('#main').addClass(color);
		
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
		file_obj[file.uid] = snapshot.ref();
		file_obj[file.uid].on('value', UI.redraw);
		//ref.child("top").set(css.top)
		//draw shit on canvas.

		$('#main').append('<div id="'+file.uid+'" class="file"><div id="handle" class="filename '+UI.color+'">'+file.filename+'</div><a href="'+file.url+'"><div class="icon"></div></a><div class="author">'+file.author+'</div></div>').children("#"+file.uid).css('top', file.top).css('left', file.left);
		$('#'+file.uid).bind('dragstart',function( event ){
		                return $(event.target).is('#handle');
		                })
		        .bind('drag',function( event ){
		                $( this ).css({
		                        top: event.offsetY,
		                        left: event.offsetX
		                });
		                file_obj[file.uid].child("top").set(event.offsetY);
		                file_obj[file.uid].child("left").set(event.offsetX);                
		        });
	
		//add event handlers for dragging
	},
	'eraseItem' : function(snapshot){
		//remove UI element
		var file = snapshot.val();
		$('#'+file.uid).remove();
		delete file_obj[file.uid];
	},
	'addItem' : function(auth, url, top, left, filename){
		//add item
		var author = auth || "Guest";
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
	},
	'redraw' : function(snapshot){
		var file = snapshot.val();
		if (file != null){
			$('#'+file.uid).css({'top' : file.top, 'left' : file.left});
		}
		//otherwise let the other event handle it.
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















