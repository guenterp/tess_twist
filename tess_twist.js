'use strict';

var gl;
var program;
var points = [];
var numDivisions = 0;
var _fractal = false;
var _initialRotation = 0;
var _fill = 'solid';

var _triangle = [
  vec2(-(Math.sqrt(3)/2), -0.5),
  vec2(0, 1),                  
  vec2((Math.sqrt(3)/2), -0.5)
];

var _square = [
  vec2(-0.5, -0.5), vec2(0.5, -0.5),
  vec2(0.5, 0.5), vec2(0.5, 0.5),
  vec2(-0.5, 0.5), vec2(-0.5, -0.5),
];

var resetPoints = function() {
  points = [];
};

var calculateMidPoint = function(vec2PointA, vec2PointB) {
  return mix(vec2PointA, vec2PointB, 0.5);
};

var calculateDistance = function(vec2Point) {
  var xSquared = Math.pow(vec2Point[0], 2);
  var ySquared = Math.pow(vec2Point[1], 2);
  return Math.sqrt(xSquared + ySquared);
};

var addTriangle = function(bottomLeft, topMiddle, bottomRight) {
  points.push(bottomLeft, topMiddle, bottomRight);
};

var divideTriangle = function(a, b, c, count) {
  var ab,
    ac,
    bc;

  if (count === 0) {
      addTriangle(a, b, c);
  } else {
    ab = calculateMidPoint(a, b);
    ac = calculateMidPoint(a, c);
    bc = calculateMidPoint(b, c);

    divideTriangle(a, ab, ac, count-1);
    divideTriangle(c, ac, bc, count-1);
    divideTriangle(b, bc, ab, count-1);

    if (!_fractal) {
      divideTriangle(ac, ab, bc, count-1);
    }
  }
};

var addSquare = function(a, b, c, e) {
  points.push(a, b, c);
  points.push(c, e, a);
};

var divideSquare = function(a, b, c, e, count) {
  var ae,
    aebc,
    ab,
    bc,
    ce;

  if (count === 0) {
    addSquare(a, b, c, e);
  } else {
    ae = calculateMidPoint(a, e);
    ab = calculateMidPoint(a, b);
    bc = calculateMidPoint(b, c);
    ce = calculateMidPoint(c, e);
    aebc = calculateMidPoint(ae, bc);

    divideSquare(ab, b, bc, aebc, count-1);
    divideSquare(ae, aebc, ce, e, count-1);
    divideSquare(aebc, bc, c, ce, count-1);
    divideSquare(a, ab, aebc, ae, count-1);
  }
};

var render = function() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (_fill === 'solid') {
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
  }
  if (_fill === 'mesh') {
    for (var i=0; i<points.length; i+=3) {
      gl.drawArrays(gl.LINE_LOOP, i, 3);
    }
  }
};

var loadBuffer = function(data) {
  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, 'vPosition');
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
};

var calculateRotation = function(vec2Point, theta) {
  var distance = calculateDistance(vec2Point);
  var originalX = vec2Point[0];
  var originalY = vec2Point[1];
  var newX = (originalX * Math.cos(distance * theta)) - (originalY * Math.sin(distance * theta));
  var newY = (originalX * Math.sin(distance * theta)) + (originalY * Math.cos(distance * theta));
  return vec2(newX, newY);
};

var rotate = function(theta) {
    var radians = (Math.PI / 180) * theta;

    var rotatedPoints = points.map(function(vertex) {
      return calculateRotation(vertex, radians);
    });

    loadBuffer(rotatedPoints);
    render();
};

var doDivideTriangle = function(numDivisions) {
  resetPoints();
  divideTriangle(_triangle[0], _triangle[1], _triangle[2], numDivisions);
};

var doDivideSquare = function(numDivisions) {
  resetPoints();
  divideSquare(_square[0], _square[1], _square[2], _square[4], numDivisions);
  loadBuffer(points);
  render();
};

var updateObject = function(evt) {
  evt.preventDefault();
  if (evt.target.id === 'fractal') {
    if (document.getElementById('fractal').checked) {
      _fractal = true;
    } else {
      _fractal = false;
    }
  }
  if (document.getElementById('squareShape').checked) {
    document.getElementById('fractalGroup').style.visibility = 'hidden';
    doDivideSquare(document.getElementById('numDivisions').valueAsNumber);
  }
  if (document.getElementById('triangleShape').checked) {
    document.getElementById('fractalGroup').style.visibility = '';
    doDivideTriangle(document.getElementById('numDivisions').valueAsNumber);
  }
  var fills = document.getElementsByName('fill');
  for (var i = 0; i < fills.length; i++) {
    if (fills[i].checked) {
        _fill = fills[i].value;
        break;
    }
  }
  rotate(document.getElementById('theta').valueAsNumber);
};

var doReset = function(evt) {
  evt.preventDefault();
  resetPoints();
  _fractal = false;
  _fill = 'solid';
  divideTriangle(_triangle[0], _triangle[1], _triangle[2], numDivisions);
  rotate(_initialRotation);
  document.getElementById('theta').value = _initialRotation;
  document.getElementById('thetaValue').value = _initialRotation;
  document.getElementById('numDivisions').value = 0;
  document.getElementById('numDivisionsValue').value = 0;
  document.getElementById('fractal').checked = false;
  document.getElementById('fractalGroup').style.visibility = '';
  document.getElementById('triangleShape').checked = true;
  document.getElementById('fillSolid').checked = true;
  document.getElementById('fractalGroup').style.display = '';
};

window.onload = function init() {

  document.getElementById('settings').addEventListener('change', updateObject);
  document.getElementById('reset').addEventListener('click', doReset);

  var canvas = document.getElementById('gl-canvas');
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert( 'WebGL isn\'t available' ); }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1.0);

  program = initShaders(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);

  divideTriangle(_triangle[0], _triangle[1], _triangle[2], numDivisions);

  rotate(_initialRotation);
};
