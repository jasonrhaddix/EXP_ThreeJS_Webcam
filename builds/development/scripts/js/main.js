//*******************************************************************//
//*******************************************************************//
// Author : Jason R. Haddix
// Date : June / 2016 
// Liscence : 
/*
MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


//*******************************************************************//
//*******************************************************************//
// VARIABLES
//*******************************************************************//
//*******************************************************************//

// THREEJS //
var camera, scene, renderer, controls;
var webcamMaterial;
var webcamTexture;
var webcamParams;
var sphere_Array = [];
var objPositions = []
var particlesTotal = 512;
var amount;
var separation;
var offset;
var current = 0;
var fovAlgorithm;
var sphere_Geom;
var sphere_Mat;
var sphere_Mesh;
var sphereMap_Mat;
var sphereMap_Geom;
var sphereMap_Mesh;
var anaglyphEffect;


// WEBCAM //
var webcamSrc;
var navigator;
var webcamContraints = { video:true, audio:false };


// MODERNIZR // 
var supports_GetUserMedia;
var supports_WebGL;


/*
var composer;
var chromaticAberrationPass;
WAGNER.vertexShadersPath = 'scripts/js/_lib/wagner/vertex-shaders';
WAGNER.fragmentShadersPath = 'scripts/js/_lib/wagner/fragment-shaders';
*/

//*******************************************************************//
//*******************************************************************//



function init()
{
	webcamSrc = document.getElementById( "webcam" );

	modernizr_checkFeatures();
}





function modernizr_checkFeatures()
{
	Modernizr.on('getusermedia', function( result )
    {
        supports_GetUserMedia = (result) ? true : false;
        
    });

    Modernizr.on('webgl', function( result )
    {
        supports_WebGL = (result) ? true : false;
    });


    checkStatus_Features();
}





function checkStatus_Features ()
{
	if(  supports_GetUserMedia != undefined && supports_WebGL != undefined )
	{
	 	init_Webcam();

	} else {
		
		setTimeout( function() {
			checkStatus_Features();
		}, 100 );

	}

}





function init_Webcam()
{
	webcamSrc = document.getElementById( "webcam" );

	navigator.getUserMedia = navigator.getUserMedia ||
	                         navigator.webkitGetUserMedia ||
	                         navigator.mozGetUserMedia;

	navigator.getUserMedia ( webcamContraints, streamConnect_Success, streamConnect_Failure ).then( loadWebcam_Success ).catch( loadWebcam_Failure );

}





function streamConnect_Success( stream )
{
	webcamSrc.src = window.URL.createObjectURL(stream);

    webcamSrc.onloadedmetadata = function( e )
    {
    	webcamSrc.play();
    };

	initWorld_ThreeJS();
	threeJS_Render();

}


function streamConnect_Failure( err )
{
	console.log("The following error occurred: " + err.name);

}





function loadWebcam_Success()
{
	console.log( "loadWebcam_Success();" );

	var videoTracks = stream.getVideoTracks();

	stream.onended = function()
	{
		console.log('Stream ended');
	};

	console.log( stream );
	window.stream = stream; // make variable available to browser console
	webcamSrc.srcObject = stream;

	initWorld_ThreeJS();

}


function loadWebcam_Failure()
{
	if (error.name === 'ConstraintNotSatisfiedError')
	{
		errorMsg('The resolution ' + constraints.video.width.exact + 'x' + constraints.video.width.exact + ' px is not supported by your device.');

	} else if (error.name === 'PermissionDeniedError')
	{
		errorMsg('Permissions have not been granted to use your camera and ' + 'microphone, you need to allow the page access to your devices in ' + 'order for the demo to work.');
	}

	errorMsg('getUserMedia error: ' + error.name, error);
}


function errorMsg(msg, error)
{
	document.getElementById( "error-element" ).innerHTML += '<p>' + msg + '</p>';

	if (typeof error !== 'undefined') {
		console.error(error);
	}

}





function initWorld_ThreeJS()
{
	// Camera
	camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
	
	camera.position.x = 60;
	camera.position.y = 40;
	camera.position.z = -90;

	fovAlgorithm = 2 * Math.atan( ( (window.innerWidth) / camera.aspect ) / ( 2 * 1175 ) ) * ( 180 / Math.PI );

	camera.fov = fovAlgorithm;
	camera.updateProjectionMatrix();


	// Scene
	scene = new THREE.Scene();


	// Renderer
	renderer = new THREE.WebGLRenderer({ alpha: true });
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById("threejs-container").appendChild( renderer.domElement );


	// Controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enableZoom = false;


	// Lights
	scene.add( new THREE.AmbientLight( 0xffffff ) );
	// Add orbital lights


	// Webcam Texture / Material
	webcamTexture = new THREE.VideoTexture( webcamSrc );
	webcamTexture.minFilter = THREE.LinearFilter;
	webcamTexture.magFilter = THREE.LinearFilter;
	webcamTexture.format = THREE.RGBFormat;

	webcamParams = { map: webcamTexture };
	webcamMaterial = new THREE.MeshLambertMaterial( webcamParams );
	

	// Sphere Map
	sphereMap_Geom  = new THREE.SphereGeometry(150, 128, 128)
	sphereMap_Mat  = new THREE.MeshBasicMaterial({color: 0x000, wireframe: true, opacity:0.5})
	sphereMap_Mat.side  = THREE.BackSide;
	sphereMap_Mat.transparent = true;

	sphereMap_Mesh  = new THREE.Mesh(sphereMap_Geom, sphereMap_Mat)
	sphereMap_Mesh.matrixAutoUpdate = false;
	sphereMap_Mesh.updateMatrix();
	scene.add(sphereMap_Mesh);


	// Add Spheres
	for ( var i = 0; i < particlesTotal; i ++ )
	{
		sphere_Geom  = new THREE.SphereGeometry(1.5, 16, 16);	
		sphere_Mat  = new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: THREE.FaceColors });
		sphere_Mesh  = new THREE.Mesh(sphere_Geom, webcamMaterial)

		sphere_Array.push( sphere_Mesh );

		scene.add(sphere_Mesh);
	}


	window.addEventListener( 'resize', onWindowResize, false );
	loadObjectGeomsPos();
}







function loadObjectGeomsPos()
{
	// Cube
	var amount = 8;
	var separation = 6;
	var offset = ( ( amount - 1 ) * separation ) / 2;

	for ( var i = 0; i < particlesTotal; i ++ ) {

		var x = ( i % amount ) * separation;
		var y = Math.floor( ( i / amount ) % amount ) * separation;
		var z = Math.floor( i / ( amount * amount ) ) * separation;

		objPositions.push( x - offset, y - offset, z - offset );

	}

	// Cone
	var radius = 20;

	for ( var i = 0; i < particlesTotal; i ++ ) {

		var phi = Math.acos( -1 + ( 2 * i ) / particlesTotal );
		var theta = Math.sqrt( particlesTotal * Math.PI ) * phi;

		objPositions.push(
			radius * Math.cos( theta ) * Math.sin( phi ),
			radius * Math.sin( theta ) * Math.sin( phi ),
			radius * Math.cos( phi * 2)
			)
	}



	// Sphere
	var radius2 = 25;

	for ( var i = 0; i < particlesTotal; i ++ ) {

		var phi2 = Math.acos( -1 + ( 2 * i ) / particlesTotal );
		var theta2 = Math.sqrt( particlesTotal * Math.PI ) * phi2;

		objPositions.push(
			radius2 * Math.cos( theta2 ) * Math.sin( phi2 ),
			radius2 * Math.sin( theta2 ) * Math.sin( phi2 ),
			radius2 * Math.cos( phi2 )
		);

	}
	
	
	// Random
	for ( var i = 0; i < particlesTotal; i ++ ) {

		objPositions.push(
			Math.random() * 200 - 100,
			Math.random() * 200 - 100,
			Math.random() * 200 - 100
		);

	}
	

	setTimeout( tweenToPos, 1000 );

}





function tweenToPos()
{
	var offset = current * particlesTotal * 3;
	var duration = 2000;

	for ( var i = 0, j = offset; i < particlesTotal; i ++, j += 3 ) {

		var object = sphere_Array[ i ];

		new TWEEN.Tween( object.position )
			.to( {
				x: objPositions[ j ],
				y: objPositions[ j + 1 ],
				z: objPositions[ j + 2 ]
			}, Math.random() * duration + duration )
			.easing( TWEEN.Easing.Exponential.InOut )
			.start();

	}

	new TWEEN.Tween( this )
		.to( {}, duration * 5 )
		.onComplete( tweenToPos )
		.start();

	current = ( current + 1 ) % 4;

}





function threeJS_Animate(time) {

	requestAnimationFrame( threeJS_Animate );
	threeJS_Render(time);
	
}





function threeJS_Render()
{

	requestAnimationFrame( threeJS_Render );

	TWEEN.update();
	controls.update();
	
	var time = performance.now();
	for ( var i = 0, l = sphere_Array.length; i < l; ++i  )
	{
		var object = sphere_Array[ i ];
		var scale = Math.sin( ( Math.floor( i / 0.5 ) + time ) * 0.002 ) * 0.4 + 1;
		
		object.scale.set( scale, scale, scale );

		/*
		var rotationY = object.rotation.y +=0.01;
		object.rotation.set( 0, rotationY, 0 );
		*/
	}


	camera.lookAt( scene.position );
	
	renderer.render( scene, camera );

}





function onWindowResize()
{
	anaglyphEffect.setSize( window.innerWidth, window.innerHeight );
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}