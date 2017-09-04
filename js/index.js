var odo;
var blink_emergency;
var blink_battery;

//window.addEventListener('load', function()
document.addEventListener("DOMContentLoaded", function(event)
{
    loadAJAX("views/1.json",

        function(data)
        {
            //console.log(data);
            var stream = "din_emcystop,din_ocur";

            var front = document.getElementsByClassName("front");
            var table = document.createElement("table");
            var tr = document.createElement("tr");

            for (i in data.dashboard)
            {
                console.log(data.dashboard[i].renderTo);

                switch (data.dashboard[i].renderTo) {
                    case "battery":
                    stream += ",udc";
                    break;
                case "speed":
                    stream += ",rpm";
                    break;
                }

                var td = document.createElement("td");
                var canvas = document.createElement("canvas");
                //canvas.style.cssText = "vertical-align: top";
                canvas.setAttribute("id", data.dashboard[i].renderTo);
                td.appendChild(canvas);
                tr.appendChild(td);
            }
            table.appendChild(tr);
            
            //var odometer = CANRead("distance");
     
            if(data.odometer)
            {
                var tr = document.createElement("tr");
                var td = document.createElement("td");
                td.colSpan = data.dashboard.length;

                var canvas = document.createElement("canvas");
                canvas.id = "odometer";
                canvas.height = 32;
                canvas.width = 200;

                td.appendChild(canvas);
                tr.appendChild(td);
                table.appendChild(tr);
            }
            
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.colSpan = data.dashboard.length;
            
            for (i in data.alerts)
            {
                //console.log(data.alerts[i].svg);
                
                var svg = document.createElement("svg");
                svg.id = data.alerts[i].id;
                svg.dataset.color = data.alerts[i].color;
                svg.classList.add("svg-inject");
                svg.classList.add("svg-grey");
                svg.style.width = getWidth()/12 + "px";
                svg.style.height = getWidth()/12 + "px";
                svg.setAttribute("data-src", "img/" + data.alerts[i].id + ".svg");
                //svg.setAttribute("data-fallback", "img/" + data.alerts[i].id + ".png");
                td.appendChild(svg);

                new SVGInjector().inject(svg);
            }

            tr.appendChild(td);
            table.appendChild(tr);
            front[0].appendChild(table);

            for (i in data.dashboard)
            {
                data.dashboard[i].width = getWidth() * data.dashboard[i].width;
                data.dashboard[i].height = getHeight() * data.dashboard[i].height;
                var gauge = new RadialGauge(data.dashboard[i]).draw();
            }

            if(data.odometer)
            {
                display = new SegmentDisplay("odometer",data.odometer);
                display.draw();
                display.setValue(data.odometer.count);
                //updateOdometer(data.odometer.count);
            }

			if(data.sounds)
			{
				xhr.open("GET", "sounds/" + data.sounds[i].id, true);
				xhr.responseType = "arraybuffer";
				xhr.onload = function(e){
					window.addEventListener("keydown", createPitchStep(data.sounds[i].pitchStep))
					window.addEventListener("keyup", createPitchStep(-data.sounds[i].pitchStep))
					engineStart(this.response);
				};
				xhr.send();
			}

            var array = ["1","2","3"];
            var back = document.getElementsByClassName("back");
            var div = document.createElement("div");
            var select = document.createElement("select");
            div.appendChild(select);
            back[0].appendChild(div);

            for (var i = 0; i < array.length; i++) {
                var option = document.createElement("option");
                option.value = array[i];
                option.text = "Dashboard " + array[i];
                select.appendChild(option);
            }

            document.gauges.forEach(function(gauge)
            {
                //console.log(gauge);

                gauge.value = gauge.options.maxValue;
                setTimeout(function()
                {
                    gauge.value = gauge.options.minValue;
                    //streamAJAX(stream);
                    
                }, gauge.options.animationDuration*1.5);
            });
        },
        function(xhr) { console.error(xhr); }
    );
});

function streamAJAX(path)
{
	var xhr = new XMLHttpRequest();
	var _alert = document.getElementsByClassName("alert");
	xhr.onreadystatechange = function()
	{
		//console.log("State change: "+ xhr.readyState);
		if(xhr.readyState == 3) {
			var newData = xhr.response.substr(xhr.seenBytes);
			if(newData !== "Unknown command sequence")
			{
				console.log(newData);
                
                /*
                blink_emergency = setInterval(function() 
                {
                    var svg = document.getElementById("emergency");

                    if(svg.className.baseVal.indexOf(svg.dataset.color) !== -1) {
                        svg.classList.remove("svg-orange");
                        svg.classList.add("svg-grey");
                    }else{
                        svg.classList.remove("svg-grey");
                        svg.classList.add("svg-orange");
                    }
                    new SVGInjector().inject(svg);
                }, 1000);
                clearInterval(blink_emergency);
                */

                /*
                var svg = document.getElementById("battery");
                svg.classList.add(svg.dataset.color);
                new SVGInjector().inject(svg);
                */

			}
			xhr.seenBytes = xhr.responseText.length;
			//console.log("seenBytes: " +xhr.seenBytes);
			_alert.style.display = "none";
		}else if (xhr.readyState == 4) {
			//console.log("Complete");
			//console.log(xhr.responseText);
			_alert.innerHTML = "Connection Lost";
			_alert.style.display = "block";
		}
	};
	xhr.addEventListener("error", function(e) {
	  console.log("error: " +e);
	});
	
	xhr.open('GET', "serial.php?stream=" + path, true);
	xhr.send();
};

function loadAJAX(path, success, error)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
					if(path.indexOf(".json") !== -1) {
						success(JSON.parse(xhr.responseText));
					}else{
						success(xhr.responseText);
					}
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
};

function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
};

function getHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
};

function updateOdometer(n) {
    n += 0.01
    odo.setValue(n);
    setTimeout(function(){updateOdometer(n)}, 80);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad();
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  var d = R * c;
  return d;
};

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
};