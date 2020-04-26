var canvas = document.querySelector("canvas");
var context = canvas.getContext('2d');

var radius = 5;  
var start = 0; 
var end = Math.PI * 2;  
var dragging = false;

 var red = '#FF0000';
 var blue = '#00008B';
 var skyblue = '#87CEEB';
 var yellow = '#FFFF00';
 var orange = '#FFA500';
 var green = '#008000';
 var purple = '#EE82EE'
 var white = '#FFFFFF';
 var black = '#000000';

context.lineWidth = radius * 2;  

var putPoint = function(e){
	if(dragging){
		context.lineTo(e.offsetX, e.offsetY);
		context.stroke();
		context.beginPath(); 
		context.arc(e.offsetX, e.offsetY, radius, start, end);
		context.fill();
		context.beginPath();
		context.moveTo(e.offsetX, e.offsetY);
	}
}

var engage = function(e){
	dragging = true;
	putPoint(e);
}

var disengage = function(){
	dragging = false;
	context.beginPath();
}

canvas.addEventListener('mousedown', engage);
canvas.addEventListener('mousemove', putPoint);
canvas.addEventListener('mouseup', disengage);
canvas.addEventListener('mouseleave', disengage);

function clearCanvas()
{
	context.clearRect(0, 0, canvas.width, canvas.height);
}

function setLineWidth (multiplicator){
	radius = multiplicator
	context.lineWidth = radius * 2;
}

function setLineColor (color){
	context.strokeStyle = color;
	context.setLineColor = color;
	context.fillStyle = color;
}