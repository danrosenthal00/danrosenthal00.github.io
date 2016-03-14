
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined") {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    if (stroke) {
        this.stroke();
    }
    if (fill) {
        this.fill();
    }
};

CanvasRenderingContext2D.prototype.wrapText = function(text, x, y, maxWidth, lineHeight) {
	var words = text.split(' ');
	var line = '';
	var lines = [];

	for(var n = 0; n < words.length; n++) {
	  var testLine = line + words[n] + ' ';
	  var metrics = this.measureText(testLine);
	  var testWidth = metrics.width;
	  if (testWidth > maxWidth && n > 0) {
		lines.push({
			text: line,
			yPosition: y 
		});
		line = words[n] + ' ';
		y += lineHeight;		
	  }
	  else{
		line += words[n] + ' ';
	  }  
	  
	  if(n == words.length-1 && line.length > 0){
		lines.push({
			text: line,
			yPosition: y 
		});	
	  }
	}
	
	var yAdjustment = (lines.length-1)*lineHeight/2
	for(var i = 0; i < lines.length; i++){
		this.fillText(lines[i].text, x, lines[i].yPosition - yAdjustment);
	}
}


var myMeter = myMeter || {};
myMeter.mobile = (function (module, $){
	var loadData = function(){
		//Load json from server here
		module.data = [
			{
				usage: "7",
				usageType: "kwh",
				timePeriod: "Thursday",
				averageTemperature: "85",
				billLastYear: "35",
				neighborCompare: "14"
			},
			{
				usage: "20",
				usageType: "kwh",
				timePeriod: "Wednesday",
				averageTemperature: "68",
				billLastYear: "-25",
				neighborCompare: "-12"
			},
			{
				usage: "13",
				usageType: "kwh",
				timePeriod: "Tuesday",
				averageTemperature: "72",
				billLastYear: "-10",
				neighborCompare: "-7"
			},
			{
				usage: "15",
				usageType: "kwh",
				timePeriod: "Monday",
				averageTemperature: "74",
				billLastYear: "5",
				neighborCompare: "3"
			},
			{
				usage: "10",
				usageType: "kwh",
				timePeriod: "Sunday",
				averageTemperature: "69",
				billLastYear: "10",
				neighborCompare: "5"
			},
			{
				usage: "5",
				usageType: "kwh",
				timePeriod: "Saturday",
				averageTemperature: "70",
				billLastYear: "-20",
				neighborCompare: "-5"
			},
			{
				usage: "12",
				usageType: "kwh",
				timePeriod: "Friday",
				averageTemperature: "71",
				billLastYear: "13",
				neighborCompare: "7"
			}
		];
	}

	//Globals
	var timelineContext;
	var breakdownContext;
	var spacing;
	var radius;
	var yPosition;
	var multiplier;
	
	//Color Scheme
	var primary = '#14a7d9';
	var primaryDark = '';
	var averageTemperaturePositive = '#f4d03f';
	var averageTemperatureNegative = '';
	var lastYearsBillPositive = '#d91e18';
	var lastYearsBillNegative = '#26a65b';
	var neighborPositive = '#e87e04';
	var neighborNegative = '#663399';
	
	//Fonts
	var fontSize = 10;
	var fontSizeLarge = 13;
	var lineHeight = 14;
	var font = fontSize + 'pt Helvetica';
	var fontLarge = fontSizeLarge + 'pt Helvetica';
	
	//Timline defaults
	var timlineSpacing = 175
	var timlinePositionX = window.innerWidth/2;
	var timlinePositionY = 90;
	var bubbleRadiusBase = 35;
	var bubbleRadiusMinimum = 27;
	var bubbleLabelSize = timlinePositionX-15;
	var comparisonBarBase = 40;
	var comparisonBarWidth = 10;
	var spikeRotationDegrees = 35;
	var spikeRotationOffsetDegrees = 90;
	var rotation = spikeRotationDegrees*Math.PI/180;
	var rotationOffset = spikeRotationOffsetDegrees*Math.PI/180;
		
	//Breakdown defaults
	var brakedownHeight = 150;
	var brakedownBubbleRadius = 50;
	var brakedownBubbleOffsetX = 15;
	var breakdownBubbleOffsetY = brakedownHeight - brakedownBubbleRadius - 15;
	var brakedownPillOffset = 15;
	var brakedownPillSpacing = 10;
	var breakdownPillHeight = 35;
	var breakdownPillWidth = window.innerWidth-(2*brakedownBubbleRadius)-brakedownBubbleOffsetX-(2*brakedownPillOffset);
	var breakdownLabelOffset = 25;
	
	//Event tracking
	var lockScroll = false;
	var lastScrollTop = 0;
	var timelinePosition = 0;
	
	var PIXEL_RATIO = (function () {
		var ctx = document.createElement("canvas").getContext("2d"),
			dpr = window.devicePixelRatio || 1,
			bsr = ctx.webkitBackingStorePixelRatio ||
				  ctx.mozBackingStorePixelRatio ||
				  ctx.msBackingStorePixelRatio ||
				  ctx.oBackingStorePixelRatio ||
				  ctx.backingStorePixelRatio || 1;
			if(dpr > 2) dpr = 2;

		return dpr / bsr;
	})();
		
	var createHiDPICanvas = function(id, w, h, ratio) {
		if (!ratio) { ratio = PIXEL_RATIO; }
		var can = document.getElementById(id);
		can.width = w * ratio;
		can.height = h * ratio;
		can.style.width = w + "px";
		can.style.height = h + "px";
		can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
		return can;
	}
	
	var drawTimeline = function (){
		var timelineHeight = myMeter.mobile.data.length*timlineSpacing;
		var canvasHeight = timelineHeight+window.innerHeight-timlineSpacing-150;
		var canvas = createHiDPICanvas('UsageCanvas', window.innerWidth, canvasHeight);
		timelineContext = canvas.getContext('2d');		
		
		timelineContext.beginPath();
		timelineContext.moveTo(timlinePositionX, 0);
		timelineContext.lineTo(timlinePositionX, canvasHeight);
		timelineContext.lineWidth = 5;
		timelineContext.strokeStyle = '#bfbfbf';
		timelineContext.stroke();
		
		spacing = timelineHeight/(myMeter.mobile.data.length+1);
		for(i = timelinePosition+1; i < myMeter.mobile.data.length; i++){
			var maxValue = Number(myMeter.mobile.data[0].usage);
			var minValue = Number(myMeter.mobile.data[0].usage);
			myMeter.mobile.data.forEach(function(datum){
				if(Number(datum.usage) > maxValue) maxValue = Number(datum.usage);
				if(Number(datum.usage) < minValue) minValue = Number(datum.usage);
			});
			multiplier = bubbleRadiusBase/(maxValue-minValue);
			radius = (Number(myMeter.mobile.data[i].usage)-minValue+((maxValue-minValue)/2))*multiplier;
			if(radius < bubbleRadiusMinimum) radius = bubbleRadiusMinimum;			
			yPosition = (i*spacing)+timlinePositionY;
			
			//Usage label
			timelineContext.beginPath();
			timelineContext.rect(timlinePositionX, yPosition-15, -bubbleLabelSize, 30);
			timelineContext.fillStyle = 'rgba(191,191,191,0.75)';
			timelineContext.fill();
			timelineContext.lineWidth = 1;
			timelineContext.strokeStyle = 'rgba(191,191,191,0.75)';
			timelineContext.stroke();
			
			//Usage label text
			timelineContext.font = font;
			timelineContext.fillStyle = '#000000';
			timelineContext.textAlign = 'left';
			timelineContext.textBaseline = 'middle';
			timelineContext.fillText(myMeter.mobile.data[i].timePeriod, timlinePositionX-bubbleLabelSize+5, yPosition);
			
			drawAverageTemperatureComparison();
			
			drawLastYearsBillComparison();
			
			drawNeighborComparison();
			
			//Usage bubble
			timelineContext.beginPath();
			timelineContext.arc(timlinePositionX, yPosition, radius, 0, 2 * Math.PI, false);
			timelineContext.fillStyle = primary;
			timelineContext.fill();
			
			//Usage bubble text
			timelineContext.font = fontLarge;
			timelineContext.fillStyle = '#ffffff';
			timelineContext.textAlign = 'center';
			timelineContext.textBaseline = 'middle';
			timelineContext.fillText(myMeter.mobile.data[i].usage + " " + myMeter.mobile.data[i].usageType, timlinePositionX, yPosition);

		}
		drawUsageBreakdown(window.innerWidth, brakedownHeight);
	}
	
	var drawUsageBreakdown = function(width, height){
		var canvas = createHiDPICanvas('UsageBreakdownCanvas',width,height);
		breakdownContext = canvas.getContext('2d');
		
		breakdownContext.beginPath();
		breakdownContext.rect(0, 0, width, height);
		breakdownContext.fillStyle = 'rgba(191,191,191,1)';
		breakdownContext.lineWidth = 1;
		breakdownContext.fill();
		
		//Usage bubble text
		breakdownContext.font = font;
		breakdownContext.fillStyle = '#000000';
		breakdownContext.textAlign = 'center';
		breakdownContext.textBaseline = 'middle';
		breakdownContext.fillText(myMeter.mobile.data[timelinePosition].timePeriod, brakedownBubbleX, breakdownLabelOffset);
				
		//Usage bubble
		var brakedownBubbleX = brakedownBubbleOffsetX+brakedownBubbleRadius;
		breakdownContext.beginPath();
		breakdownContext.arc(brakedownBubbleX, breakdownBubbleOffsetY, brakedownBubbleRadius, 0, 2 * Math.PI, false);
		breakdownContext.fillStyle = primary;
		breakdownContext.fill();
		
		//Usage bubble label text
		breakdownContext.font = font;
		breakdownContext.fillStyle = '#000000';
		breakdownContext.textAlign = 'center';
		breakdownContext.textBaseline = 'middle';
		breakdownContext.fillText(myMeter.mobile.data[timelinePosition].timePeriod, brakedownBubbleX, breakdownLabelOffset);
		
		//Usage bubble text
		breakdownContext.font = fontLarge;
		breakdownContext.fillStyle = '#ffffff';
		breakdownContext.textAlign = 'center';
		breakdownContext.textBaseline = 'middle';
		breakdownContext.fillText(myMeter.mobile.data[timelinePosition].usage + " " + myMeter.mobile.data[timelinePosition].usageType, brakedownBubbleX, breakdownBubbleOffsetY);
		
		var pillX = brakedownPillOffset+brakedownBubbleX+brakedownBubbleRadius;
		var pillY = (height/2)-(breakdownPillHeight*1.5)-brakedownPillSpacing;
		breakdownContext.fillStyle = averageTemperaturePositive;
		breakdownContext.roundRect(pillX, pillY, breakdownPillWidth, breakdownPillHeight, breakdownPillHeight/2, true, false)
		
		var textX = pillX+breakdownPillWidth/2;
		var textY = pillY+breakdownPillHeight/2;
		breakdownContext.font = font;
		breakdownContext.fillStyle = '#ffffff';
		breakdownContext.textAlign = 'center';
		breakdownContext.textBaseline = 'middle';
		breakdownContext.wrapText(myMeter.mobile.data[timelinePosition].averageTemperature+"° average temperature", textX, textY, breakdownPillWidth, lineHeight);
				
		pillY = (height/2)-(breakdownPillHeight/2);
		breakdownContext.fillStyle = Number(myMeter.mobile.data[timelinePosition].billLastYear) > 0 ? lastYearsBillPositive : lastYearsBillNegative;
		breakdownContext.roundRect(pillX, pillY, breakdownPillWidth, breakdownPillHeight, breakdownPillHeight/2, true, false)
		
		var symbol = Number(myMeter.mobile.data[timelinePosition].billLastYear) > 0 ? "+" : "-";
		var text = Number(myMeter.mobile.data[timelinePosition].billLastYear) > 0 ? " more than last year" : " less than last year";
		textY = pillY+breakdownPillHeight/2;
		breakdownContext.font = font;
		breakdownContext.fillStyle = '#ffffff';
		breakdownContext.textAlign = 'center';
		breakdownContext.textBaseline = 'middle';
		breakdownContext.wrapText(symbol+"$"+Math.abs(Number(myMeter.mobile.data[timelinePosition].billLastYear))+text, textX, textY, breakdownPillWidth, lineHeight);
		
		pillY = (height/2)+(breakdownPillHeight*.5)+(brakedownPillSpacing);
		breakdownContext.fillStyle = Number(myMeter.mobile.data[timelinePosition].neighborCompare) > 0 ? neighborPositive : neighborNegative;
		breakdownContext.roundRect(pillX, pillY, breakdownPillWidth, breakdownPillHeight, breakdownPillHeight/2, true, false)
		
		symbol = Number(myMeter.mobile.data[timelinePosition].neighborCompare) > 0 ? "+" : "-";
		text = Number(myMeter.mobile.data[timelinePosition].neighborCompare) > 0 ? " more than your neighbors" : " less than your neighbors";
		textY = pillY+breakdownPillHeight/2;
		breakdownContext.font = font;
		breakdownContext.fillStyle = '#ffffff';
		breakdownContext.textAlign = 'center';
		breakdownContext.textBaseline = 'middle';
		breakdownContext.wrapText(symbol+"$"+Math.abs(Number(myMeter.mobile.data[timelinePosition].neighborCompare))+text, textX, textY, breakdownPillWidth, lineHeight);
	}
	
	var drawAverageTemperatureComparison = function(){
		maxValue = Number(myMeter.mobile.data[0].averageTemperature);
		minValue = Number(myMeter.mobile.data[0].averageTemperature);
		myMeter.mobile.data.forEach(function(datum){
			if(Number(datum.averageTemperature) > maxValue) maxValue = Number(datum.averageTemperature);
			if(Number(datum.averageTemperature) < minValue) minValue = Number(datum.averageTemperature);
		});
		multiplier = comparisonBarBase/(maxValue-minValue);
		var barLength = (Number(myMeter.mobile.data[i].averageTemperature)-minValue+((maxValue-minValue)/2))*multiplier+radius;
		
		
		timelineContext.save();
		timelineContext.translate(timlinePositionX, yPosition);
		timelineContext.rotate(-rotation+rotationOffset);
		timelineContext.beginPath();
		timelineContext.moveTo(0, 0);
		timelineContext.lineTo(0, -barLength);
		timelineContext.lineWidth = comparisonBarWidth;
		timelineContext.strokeStyle = averageTemperaturePositive;
		timelineContext.stroke();
		
		if(i != 0){
			timelineContext.translate(0, -barLength-25);
			timelineContext.rotate(rotation-rotationOffset);
			timelineContext.font = font;
			timelineContext.fillStyle = '#000000';
			timelineContext.textAlign = 'center';
			timelineContext.textBaseline = 'middle';
			timelineContext.fillText(myMeter.mobile.data[i].averageTemperature+"°", 0, 0);				
		}
		timelineContext.restore();
	}
	
	var drawLastYearsBillComparison = function(){
		maxValue = Number(myMeter.mobile.data[0].billLastYear);
		minValue = Number(myMeter.mobile.data[0].billLastYear);
		myMeter.mobile.data.forEach(function(datum){
			if(Number(datum.billLastYear) > maxValue) maxValue = Number(datum.billLastYear);
			if(Number(datum.billLastYear) < minValue) minValue = Number(datum.billLastYear);
		});
		multiplier = comparisonBarBase/(maxValue-minValue);
		barLength = (Number(myMeter.mobile.data[i].billLastYear)-minValue+((maxValue-minValue)/2))*multiplier+radius;
		timelineContext.save();
		timelineContext.translate(timlinePositionX, yPosition);
		timelineContext.rotate(rotationOffset);
		timelineContext.beginPath();
		timelineContext.moveTo(0, 0);
		timelineContext.lineTo(0, -barLength);
		timelineContext.lineWidth = comparisonBarWidth;
		timelineContext.strokeStyle = Number(myMeter.mobile.data[i].billLastYear) > 0 ? lastYearsBillPositive : lastYearsBillNegative;
		timelineContext.stroke();
		
		if(i != 0){
			var symbol = Number(myMeter.mobile.data[i].billLastYear) > 0 ? "+" : "-";
			timelineContext.translate(0, -barLength-25);
			timelineContext.rotate(-rotationOffset);
			timelineContext.font = font;
			timelineContext.fillStyle = '#000000';
			timelineContext.textAlign = 'center';
			timelineContext.textBaseline = 'middle';
			timelineContext.fillText(symbol+"$"+Math.abs(Number(myMeter.mobile.data[i].billLastYear)), 0, 0);
		}			
		timelineContext.restore();
	}
	
	var drawNeighborComparison = function(){
		maxValue = Number(myMeter.mobile.data[0].neighborCompare);
		minValue = Number(myMeter.mobile.data[0].neighborCompare);
		myMeter.mobile.data.forEach(function(datum){
			if(Number(datum.neighborCompare) > maxValue) maxValue = Number(datum.neighborCompare);
			if(Number(datum.neighborCompare) < minValue) minValue = Number(datum.neighborCompare);
		});
		multiplier = comparisonBarBase/(maxValue-minValue);
		barLength = (Number(myMeter.mobile.data[i].neighborCompare)-minValue+((maxValue-minValue)/2))*multiplier+radius;
		timelineContext.save();
		timelineContext.translate(timlinePositionX, yPosition);
		timelineContext.rotate(rotation+rotationOffset);
		timelineContext.beginPath();
		timelineContext.moveTo(0, 0);
		timelineContext.lineTo(0, -barLength);
		timelineContext.lineWidth = comparisonBarWidth;
		timelineContext.strokeStyle = Number(myMeter.mobile.data[i].neighborCompare) > 0 ? neighborPositive : neighborNegative;
		timelineContext.stroke();
		
		if(i != 0){
			var symbol = Number(myMeter.mobile.data[i].neighborCompare) > 0 ? "+" : "-";
			timelineContext.translate(0, -barLength-25);
			timelineContext.rotate(-rotation-rotationOffset);
			timelineContext.font = font;
			timelineContext.fillStyle = '#000000';
			timelineContext.textAlign = 'center';
			timelineContext.textBaseline = 'middle';
			timelineContext.fillText(symbol+"$"+Math.abs(Number(myMeter.mobile.data[i].neighborCompare)), 0, 0);				
		}
		timelineContext.restore();
	}
	
	var scrollTopAnimate = function($element, position){
		$element.animate({
			marginTop: -position
		}, 150);
	}
	
	var swipeEventHandler = function(event, direction, distance, duration, fingerCount){
		if(direction == 'up'){
			if(timelinePosition >= myMeter.mobile.data.length-1) return false;			
			timelinePosition++;
			scrollTopAnimate($('#UsageContainer'), timelinePosition*spacing);
		}
		if(direction == 'down'){
			if(timelinePosition <= 0) return false;
			timelinePosition--;
			scrollTopAnimate($('#UsageContainer'), timelinePosition*spacing);
		}
		drawTimeline();
	}
	
	module.initialize = function (){
		$('#WindowWraper').height(window.innerHeight);
		$('.footer .tab').on('click', function(){
			$('.footer .active').removeClass('active');
			$(this).addClass('active');
		})
		loadData();
		drawTimeline();
		$("body").swipe( {
			swipe:function(event, direction, distance, duration, fingerCount) {
			  swipeEventHandler(event, direction, distance, duration, fingerCount);
			},
			threshold:0
		});
	}
	return module;
}(myMeter.mobile || {}, jQuery));

$(document).ready(function(){
	myMeter.mobile.initialize();
})