
THREE.PointerLockControls = function ( camera, domElement ) {

	if ( domElement === undefined ) {

		console.warn( 'THREE.PointerLockControls: The second parameter "domElement" is now mandatory.' );
		domElement = document.body;

	}

	this.domElement = domElement;
	this.isLocked = false;

	// Set to constrain the pitch of the camera
	// Range is 0 to Math.PI radians
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var lockEvent = { type: 'lock' };
	var unlockEvent = { type: 'unlock' };

	var euler = new THREE.Euler( 0, 0, 0, 'YXZ' );

	var PI_2 = Math.PI / 2;

	var vec = new THREE.Vector3();
	var touchVec = new THREE.Vector3();
    //var scope = window;
	function onMouseMove( event ) {

		if(scope.isLocked === false && !isDesktop()) {
			const ts = event.changedTouches;
			if(ts.length == 1) {
				touchVec.x = ts[0].screenX;
				touchVec.y = ts[0].screenY;
			}
		}

		if ( scope.isLocked === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		if(!isDesktop()) {
			const ts = event.changedTouches;
			if(ts.length == 1) {
				movementX = ts[0].screenX - touchVec.x;
				movementY = ts[0].screenY - touchVec.y;
				touchVec.x = ts[0].screenX;
				touchVec.y = ts[0].screenY;
			}
		}

		euler.setFromQuaternion( camera.quaternion );

		euler.y -= movementX * 0.002;
		euler.x -= movementY * 0.002;

		euler.x = Math.max( PI_2 - scope.maxPolarAngle, Math.min( PI_2 - scope.minPolarAngle, euler.x ) );

		camera.quaternion.setFromEuler( euler );

		scope.dispatchEvent( changeEvent );

	}

	function onPointerlockChange() {
		if ( scope.domElement.ownerDocument.pointerLockElement === scope.domElement ) {
			scope.dispatchEvent( lockEvent );
			scope.isLocked = true;
		} else {
			scope.dispatchEvent( unlockEvent );
			scope.isLocked = false;
		}
	}

	function onPointerlockError() {
		console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );
	}

	function onTouchDown(event) {
		const ts = event.changedTouches;
		if(ts.length == 1) {
			touchVec.x = ts[0].screenX;
			touchVec.y = ts[0].screenY;
		}
	}

	function isDesktop() {
		const ua = navigator.userAgent.toLowerCase();
		return !((('ontouchend' in document) && ua.indexOf('macintosh') > 0) || ua.indexOf('iphone') > 0 || ua.indexOf('ipod') > 0 || ua.indexOf('ipad') > 0 || ua.indexOf('android') > 0 && ua.indexOf('mobile') > 0 || ua.indexOf('android') > 0);
	}

	this.connect = function () {
		if(isDesktop()) {
			scope.domElement.ownerDocument.addEventListener( 'mousemove', onMouseMove, false );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockchange', onPointerlockChange, false );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockerror', onPointerlockError, false );
		} else {
			scope.domElement.addEventListener( 'touchmove', onMouseMove, false );
			scope.domElement.addEventListener( 'touchstart', onTouchDown, false );
		}
	};

	this.disconnect = function () {
		if(isDesktop()) {
			scope.domElement.ownerDocument.removeEventListener( 'mousemove', onMouseMove, false );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockchange', onPointerlockChange, false );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockerror', onPointerlockError, false );
		} else {
			scope.domElement.removeEventListener( 'touchstart', onTouchDown, false );
			scope.domElement.removeEventListener( 'touchmove', onMouseMove, false );
		}
	};

	this.dispose = function () {
		this.disconnect();
	};

	this.getObject = function () { // retaining this method for backward compatibility
		return camera;
	};

	this.getDirection = function () {
		var direction = new THREE.Vector3( 0, 0, - 1 );
		return function ( v ) {
			return v.copy( direction ).applyQuaternion( camera.quaternion );
		};
	}();

	this.moveForward = function ( distance ) {

		// move forward parallel to the xz-plane
		// assumes camera.up is y-up

		vec.setFromMatrixColumn( camera.matrix, 0 );
		vec.crossVectors( camera.up, vec );
		camera.position.addScaledVector( vec, distance );
	};

	this.moveRight = function ( distance ) {
		vec.setFromMatrixColumn( camera.matrix, 0 );
		camera.position.addScaledVector( vec, distance );
	};

	this.lock = function () {
		if(isDesktop()) {
			this.domElement.requestPointerLock();
		} else {
			scope.dispatchEvent( lockEvent );
			scope.isLocked = true;
		}
	};

	this.unlock = function () {
		if(isDesktop()) {
			scope.domElement.ownerDocument.exitPointerLock();
		} else {
			scope.dispatchEvent( unlockEvent );
			scope.isLocked = false;
		}
	};

	this.desktopMode = isDesktop();

	this.connect();

};

THREE.PointerLockControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.PointerLockControls.prototype.constructor = THREE.PointerLockControls;

//export { PointerLockControls };