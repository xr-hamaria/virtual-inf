/**
 * @author mrdoob / http://mrdoob.com
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Based on @tojiro's vr-samples-utils.js
 */

var supportOldAPI = false;

var WEBVR = {

	createButton: function ( renderer ) {

		var eventEnterVR = new CustomEvent('enter_vr', {  });
		var eventExitVR = new CustomEvent('exit_vr', {  });

		function showEnterVR( device ) {
			button.style.display = '';
			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'ENTER VR';
			button.onmouseenter = function () { button.style.opacity = '1.0'; };
			button.onmouseleave = function () { button.style.opacity = '0.5'; };

			button.onclick = function () {
				device.isPresenting ? device.exitPresent() : device.requestPresent( [ { source: renderer.domElement } ] );
			};

			//renderer.xr.setDevice( device );

		}

		function showEnterXR( device ) {
			var currentSession = null;
			function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				renderer.xr.setSession( session );
				button.textContent = 'EXIT XR';

				currentSession = session;
				window.dispatchEvent(eventEnterVR);

			}

			function onSessionEnded( event ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				renderer.xr.setSession( null );
				button.textContent = 'ENTER XR';

				currentSession = null;
				window.dispatchEvent(eventExitVR);

			}

			//

			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'ENTER XR';

			button.onmouseenter = function () { button.style.opacity = '1.0'; };
			button.onmouseleave = function () { button.style.opacity = '0.5'; };

			button.onclick = function () {

				if ( currentSession === null ) {

					device.requestSession( { exclusive: true } ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

			//renderer.xr.setDevice( device );

		}

		function showVRNotFound() {

			button.style.display = '';

			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';

			button.textContent = 'VR NOT FOUND';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;

			//renderer.xr.setDevice( null );

		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'transparent';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '0.5';
			element.style.outline = 'none';
			element.style.zIndex = '999';

		}

		var isWebXR = false;
/*
		if ( 'xr' in navigator ) {

			isWebXR = true;

			var button = document.createElement( 'button' );
			button.style.display = 'none';

			stylizeElement( button );

			navigator.xr.requestDevice().then( function ( device ) {

				device.supportsSession( { exclusive: true } ).then( function () {

					showEnterXR( device );

				} ).catch( showVRNotFound );

			} ).catch( showVRNotFound );

			return button;

		} else
		*/
		if ( 'getVRDisplays' in navigator ) {

			var button = document.createElement( 'button' );
			button.style.display = 'none';

			stylizeElement( button );

			window.addEventListener( 'vrdisplayconnect', function ( event ) {

				showEnterVR( event.display );

			}, false );

			window.addEventListener( 'vrdisplaydisconnect', function ( event ) {

				showVRNotFound();

			}, false );

			window.addEventListener( 'vrdisplaypresentchange', function ( event ) {

				button.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';

			}, false );

			window.addEventListener( 'vrdisplayactivate', function ( event ) {

				event.display.requestPresent( [ { source: renderer.domElement } ] );

			}, false );

			navigator.getVRDisplays()
				.then( function ( displays ) {

					if ( displays.length > 0 ) {

						showEnterVR( displays[ 0 ] );

					} else {

						showVRNotFound();

					}

				} );

			return button;

		} else {

			var message = document.createElement( 'a' );
			message.href = 'https://webvr.info';
			message.innerHTML = 'WEBVR NOT SUPPORTED';

			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';

			stylizeElement( message );

			return message;

		}

	},

	// DEPRECATED

	checkAvailability: function () {
		console.warn( 'WEBVR.checkAvailability has been deprecated.' );
		return new Promise( function () {} );
	},

	getMessageContainer: function () {
		console.warn( 'WEBVR.getMessageContainer has been deprecated.' );
		return document.createElement( 'div' );
	},

	getButton: function () {
		console.warn( 'WEBVR.getButton has been deprecated.' );
		return document.createElement( 'div' );
	},

	getVRDisplay: function () {
		console.warn( 'WEBVR.getVRDisplay has been deprecated.' );
	}

};


var WEBXR = {
	createButton: function ( renderer, options ) {
		if ( options ) {
			console.error( 'THREE.VRButton: The "options" parameter has been removed. Please set the reference space type via renderer.xr.setReferenceSpaceType() instead.' );
		}
		
		var eventEnterVR = new CustomEvent('enter_vr', {  });
		var eventExitVR = new CustomEvent('exit_vr', {  });

		function showEnterVR( /*device*/ ) {
			var currentSession = null;
			function onSessionStarted( session ) {
				session.addEventListener( 'end', onSessionEnded );
				renderer.xr.setSession( session );
				button.textContent = 'EXIT VR';
				currentSession = session;
				window.dispatchEvent(eventEnterVR);
			}

			function onSessionEnded( /*event*/ ) {
				currentSession.removeEventListener( 'end', onSessionEnded );
				button.textContent = 'ENTER VR';
				currentSession = null;
				window.dispatchEvent(eventExitVR);
			}

			button.style.display = '';
			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';
			button.textContent = 'ENTER VR';

			button.onmouseenter = function () {
				button.style.opacity = '1.0';
			};

			button.onmouseleave = function () {
				button.style.opacity = '0.5';
			};

			button.onclick = function () {
				if ( currentSession === null ) {

					// WebXR's requestReferenceSpace only works if the corresponding feature
					// was requested at session creation time. For simplicity, just ask for
					// the interesting ones as optional features, but be aware that the
					// requestReferenceSpace call will fail if it turns out to be unavailable.
					// ('local' is always available for immersive sessions and doesn't need to
					// be requested separately.)

					var sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor' ] };
					navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( onSessionStarted );

				} else {
					currentSession.end();
				}
			};
		}
		function disableButton() {
			button.style.display = '';
			button.style.cursor = 'auto';
			button.style.left = 'calc(50% - 75px)';
			button.style.width = '150px';
			button.onmouseenter = null;
			button.onmouseleave = null;
			button.onclick = null;
		}

		function showWebXRNotFound() {
			disableButton();
			button.textContent = 'VR NOT SUPPORTED';
		}

		function stylizeElement( element ) {
			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'rgba(0,0,0,0.1)';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '0.5';
			element.style.outline = 'none';
			element.style.zIndex = '999';
		}

		if ( 'xr' in navigator ) {
			var button = document.createElement( 'button' );
			button.id = 'VRButton';
			button.style.display = 'none';
			stylizeElement( button );
			navigator.xr.isSessionSupported( 'immersive-vr' ).then( function ( supported ) {
				supported ? showEnterVR() : showWebXRNotFound();
			} );
			return button;
		} else {
			var message = document.createElement( 'a' );
			if ( window.isSecureContext === false ) {
				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message
			} else {
				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';
			}


			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';
			stylizeElement( message );
			return message;
		}
	}
};


var VRButton = {
	
	createButton : function(renderer, options) {

		console.log('getVRDisplays' in navigator);
		if ( supportOldAPI && 'getVRDisplays' in navigator ) {
			return WEBVR.createButton(renderer);
		}

		return WEBXR.createButton(renderer);

	},

	enableVR : function() {
		return 'xr' in navigator || (supportOldAPI && 'getVRDisplays' in navigator);
	}
};


export { VRButton };
