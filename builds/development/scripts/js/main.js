//'use strict';

// THREEJS //
var camera, scene, renderer, controls;
var webcamMaterial;
var webcamTexture;
var webcamParams;
var spherePlanet_Array = [];
var objPositions = []
var particlesTotal = 512;
var amount;
var separation;
var offset;
var current = 0;

/*
var TWEEN;
var Tween;
*/
//var planetSphereAmount = 200;

/*
var planetSphere_Matrix_Grid = 6; // ( 6 x 6 x 6 )
var gx = 0;
var gy = 0;
var gz = 0;
*/

var fovAlgorithm;

var spherePlanet_Geom;
var spherePlanet_Mat;
var spherePlanet_Mesh;

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




function init()
{
	webcamSrc = document.getElementById( "webcam" );

	modernizr_checkFeatures();
}





function modernizr_checkFeatures()
{
	Modernizr.on('getusermedia', function( result )
    {
        if( result ) {
            supports_GetUserMedia = true;
        }  else {
            supports_GetUserMedia = false;
        }
    });

    Modernizr.on('webgl', function( result )
    {
        if( result ) {
            supports_WebGL = true;
        }  else {
            supports_WebGL = false;
        }
    });


    checkStatus_Features();
}





function checkStatus_Features ()
{

	if(  supports_GetUserMedia != undefined && supports_WebGL != undefined )
	{
	 	console.log( "MODERNIZR : Ready!" );
	 	init_Webcam();

	} else {
		
		console.log( "MODERNIZR : Not Ready" );

		setTimeout( function() {
			checkStatus_Features();
		}, 100 );

	}

}





function init_Webcam()
{
	console.log( "init_Webcam();" );


	webcamSrc = document.getElementById( "webcam" );


	navigator.getUserMedia = navigator.getUserMedia ||
	                         navigator.webkitGetUserMedia ||
	                         navigator.mozGetUserMedia;


	navigator.getUserMedia ( webcamContraints, streamConnect_Success, streamConnect_Failure ).then( loadWebcam_Success ).catch( loadWebcam_Failure );

}





function streamConnect_Success( stream )
{
	
	console.log( stream );
    
    webcamSrc.src = window.URL.createObjectURL(stream);

    webcamSrc.onloadedmetadata = function( e )
    {
    	webcamSrc.play();
    };

	//return stream.date;

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

	/*
	if( !getUserMedia ) 
	{
	    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
	}
	*/


	var videoTracks = stream.getVideoTracks();

	
	console.log('Got stream with constraints:', constraints);
	console.log('Using video device: ' + videoTracks[0].label);
	console.log('Video Container : ' + video );
	

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
	
	camera.position.x = 60; // 5
	camera.position.y = 40;  // -5
	camera.position.z = -100;
/*
	camera.rotation.x = 1;																	
	camera.rotation.y = 0;
	camera.rotation.z = 0;
*/	
                                                                              /* focalMultiplier */
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


	var width = window.innerWidth || 2;
	var height = window.innerHeight || 2;

	anaglyphEffect = new THREE.AnaglyphEffect( renderer );
	anaglyphEffect.setSize( width, height );

/*
	composer = new WAGNER.Composer( renderer, { useRGBA: false } );
	chromaticAberrationPass = new WAGNER.ChromaticAberrationPass();
*/


	// Controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enableZoom = false;



	// Lights
	scene.add( new THREE.AmbientLight( 0xffffff ) );


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



	// Orbital Planets
	/*
	var grid = Math.pow( planetSphere_Matrix_Grid, 3 );
	gz = planetSphere_Matrix_Grid;
	gy = planetSphere_Matrix_Grid;
	gx = planetSphere_Matrix_Grid;

	var dt = 0;
	
	for ( var j = 0; j < gz; ++j )
	{
		for ( var k = 0; k < gy; ++k )
		{
			for ( var l = 0; l < gx; ++l )
			{
				++dt;
				var x = l * ( planetSphere_Matrix_Grid * 1.5 );
				var y = k * ( planetSphere_Matrix_Grid * 1.5 );
				var z = j * ( planetSphere_Matrix_Grid * 1.5 );
				
				spherePlanet_Geom  = new THREE.SphereGeometry(2, 16, 16);
				
				spherePlanet_Mat  = new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: THREE.FaceColors });
				
				spherePlanet_Mesh  = new THREE.Mesh(spherePlanet_Geom, webcamMaterial)
				spherePlanet_Mesh.delay = dt;
				spherePlanet_Mesh.position.set( x, y, z );
				//var meshScale = THREE.Math.randFloat( 2, 6 );
				//spherePlanet_Mesh.scale.set( meshScale, meshScale, meshScale );
				//spherePlanet_Mesh.rotation.y = THREE.Math.randFloat( 0, 5 );

				spherePlanet_Array.push( spherePlanet_Mesh );


				scene.add(spherePlanet_Mesh);
			}

			//console.log( gy, k );

			l = 0;
		}

		//console.log( gz, j );

		k = 0;
		*/

	for ( var i = 0; i < particlesTotal; i ++ )
	{
		/*
		var x = ( i % amount ) * separation;
		var y = Math.floor( ( i / amount ) % amount ) * separation;
		var z = Math.floor( i / ( amount * amount ) ) * separation;

		x -= offset;
		y -= offset;
		z -= offset;
		*/

		spherePlanet_Geom  = new THREE.SphereGeometry(1.5, 16, 16);	
		spherePlanet_Mat  = new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: THREE.FaceColors });
		spherePlanet_Mesh  = new THREE.Mesh(spherePlanet_Geom, webcamMaterial)
		//spherePlanet_Mesh.delay = dt;
		spherePlanet_Mesh.position.set( 0, 0, 0 );
		//var meshScale = THREE.Math.randFloat( 2, 6 );
		//spherePlanet_Mesh.scale.set( meshScale, meshScale, meshScale );
		//spherePlanet_Mesh.rotation.y = THREE.Math.randFloat( 0, 5 );

		spherePlanet_Array.push( spherePlanet_Mesh );


		scene.add(spherePlanet_Mesh);


		//objPositions.push( x - offset, y - offset, z - offset );
	}

	/*
	for ( var i = 0; i < planetSphereAmount; ++i)
	{
		var x = THREE.Math.randFloat( -100, 100 );
		var y = THREE.Math.randFloat( -100, 100 );
		var z = THREE.Math.randFloat( -100, 100 );
		var meshScale = THREE.Math.randFloat( 2, 6 );
		
		spherePlanet_Geom  = new THREE.SphereGeometry(1, 16, 16);
		
		spherePlanet_Mat  = new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: THREE.FaceColors });
		
		spherePlanet_Mesh  = new THREE.Mesh(spherePlanet_Geom, webcamMaterial)
		spherePlanet_Mesh.scale.set( meshScale, meshScale, meshScale );
		spherePlanet_Mesh.position.set( x, y, z );
		spherePlanet_Mesh.rotation.y = THREE.Math.randFloat( 0, 5 );

		spherePlanet_Array.push( spherePlanet_Mesh );


		scene.add(spherePlanet_Mesh);

	}*/

	

	window.addEventListener( 'resize', onWindowResize, false );
	//camera.rotation.set( -0.7, 0.85, 0.60 );

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

		var object = spherePlanet_Array[ i ];

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
	for ( var i = 0, l = spherePlanet_Array.length; i < l; ++i  )
	{
		var object = spherePlanet_Array[ i ];
		var scale = Math.sin( ( Math.floor( i / 0.5 ) + time ) * 0.002 ) * 0.4 + 1;
		
		object.scale.set( scale, scale, scale );

		/*
		var rotationY = object.rotation.y +=0.01;
		object.rotation.set( 0, rotationY, 0 );
		*/
	}


	camera.lookAt( scene.position );
	
	renderer.render( scene, camera );
	//anaglyphEffect.render( scene, camera );

/*
	composer.reset();
	composer.render( scene, camera );
	composer.pass( chromaticAberrationPass );
	composer.toScreen();
*/


	

	//console.log( camera.rotation.x, camera.rotation.y, camera.rotation.z )

/*
	raycaster.setFromCamera(mouse, threeJS_Camera);
	intersects = raycaster.intersectObjects( spherePlanet_Array	 );

	if (intersects.length > 0)
	{    	
	    //if (INTERSECTED != intersects[0].object) {

	    //if (INTERSECTED) INTERSECTED.face.color.setHex(INTERSECTED.currentHex);

	    INTERSECTED = intersects[0];
	    
	    INTERSECTED.face.color.setHex(0x00ccff)
	    intersects[0].object.geometry.colorsNeedUpdate = true;

	    //console.log( INTERSECTED.face.color );

	    tween = new TWEEN.Tween(INTERSECTED.face.color)
	    .to({r: 0, g: 0, b: 0}, 2000)
	    .easing(TWEEN.Easing.Quartic.Out)
	    .onUpdate(
		        function()
		        {
		            INTERSECTED.face.color.r = this.r;
	    			INTERSECTED.face.color.g = this.g;
	    			INTERSECTED.face.color.b = this.b;
		        }
		    )
	    .start();

	    intersetsArray.push(tween);

	    //this.update(time);
    } 


    if( intersetsArray.length > 0 ){
    	for( var i = 0; i < intersetsArray.length; ++i)
    	{
    		intersetsArray[i].update(time);

    	}
    	
    	console.log("update");	
    } 
	*/

}





function onWindowResize() {
	//composer.setSize( renderer.domElement.width, renderer.domElement.height );
	anaglyphEffect.setSize( window.innerWidth, window.innerHeight );
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}