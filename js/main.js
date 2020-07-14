/*
静岡大学 バーチャル情報学部
Prototype / Rev.12

(c)2020 Shizuoka University all rights reserved.
Developed by Shizuoka University xR Association "Hamaria"
*/

import { VRButton } from './WebVR.js';

var controls;
var html = "";
var mouse = { x: 0, y: 0 };
var targetList = [];
var renderer, scene, camera, controls, material, mesh;
var chip = 0;
var chip_tx = "";
var chip_id = "";
var fade = 0;
var walkthrough = null;
var prevTime, curTime;
var player = {
	speed: 7.0,
	controller: null,
	inputs: [false, false, false, false],
	birdMatrix : null,
	birdPos: new THREE.Vector3(),
	getControllerIndex : function() {
		return 0;
	},
	getHorizontal : function(pad) {	//must return -1.0 ~ 1.0
		return -pad.axes[3];
	},
	getVertical : function(pad) {	//must return -1.0 ~ 1.0
		return pad.axes[2];
	}
};


window.addEventListener('DOMContentLoaded', init);

$(window).on('touchmove.noScroll', function(e) {
	e.preventDefault();
});

function init() {
	// レンダラーを作成
	renderer = new THREE.WebGLRenderer({
		canvas: document.querySelector('#canvas'),
		antialias: true
	});
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer.setClearColor(0x345CAA);
	renderer.setPixelRatio(1);
	renderer.setSize(width, height);
	
	// VRボタンの有効をチェック後有効化
	if(VRButton.enableVR()) {
		renderer.xr.enabled = true;
		document.body.appendChild(VRButton.createButton(renderer));
	}

	// シーンを作成
	scene = new THREE.Scene();

	// カメラを作成
	camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
	controls = new THREE.OrbitControls(camera);

	const loader = new THREE.GLTFLoader();

	let vrCamera = camera;
	// VR移動用のカメラ準備
	if(VRButton.enableVR()) {
		vrCamera = new THREE.Object3D();
		vrCamera.add(camera);
		scene.add(vrCamera);
	}

	// 移動関連のコンポーネント初期化
	walkthrough = new THREE.PointerLockControls(camera, document.querySelector('#canvas') );
	walkthrough.addEventListener('lock', () => {
		player.birdPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
		camera.position.set(116, 1.2, -50);
	});
	walkthrough.addEventListener('unlock', () => {
		camera.matrixWorld = player.birdMatrix;
		camera.position.x = player.birdPos.x;
		camera.position.y = player.birdPos.y;
		camera.position.z = player.birdPos.z;
		$("#information").show(500);
		$("#copyright").show(500);
		$("#vr_mode").hide(500);
	});
	window.addEventListener('enter_vr', () => {
		if(camera != vrCamera)
			vrCamera.position.set(116, 1.2, -50);
	});


	// 全体モデル
	var model = null;
	loader.load(
		'model/campus.glb',
		function (gltf) {
			model = gltf.scene;
			//model.scale.set(100,100,100);
			//model.position.set(0, -400, 0);
			scene.add(gltf.scene);
			for(let child of gltf.scene.children) {
				if(child.material && child.name == "floor_asphalt") {
					child.material.polygonOffset = true;
					child.material.polygonOffsetFactor = 1;
					child.material.polygonOffsetUnits = 10;
				}
				if(child.material && child.name == "floor_brick") {
					child.material.polygonOffset = true;
					child.material.polygonOffsetFactor = 1;
					child.material.polygonOffsetUnits = -1;
				}
			}
			$("#cover").css("opacity",0);
		},
		function (error) {
			console.log(error);
		}
	);
	
	renderer.gammaOutput = true;
	renderer.gammaFactor = 2.2;

	scene.add(new THREE.AmbientLight(0xFFFFFF, 1));
	const sun = new THREE.DirectionalLight(0xFFFFFF, 1);
	sun.position.set(1, 1, 1);
	scene.add(sun);

	//camera.position.set(32998.86609379634,23683.169594230232,-3589.9973772662483);
	//camera.position.set(32998.86609379634,23683.169594230232,-3589.9973772662483);
	camera.position.set(329.9886609379634,240.83169594230232,-35.899973772662483);
	camera.rotation.set(-1.8099243120012465,0.7840724844004205,1.9031279561056308)
	//tick();
	renderer.setAnimationLoop(tick);

	const moveController = renderer.xr.getController(player.getControllerIndex());
	moveController.addEventListener( 'connected', (evt) => {
		player.controller = evt.data.gamepad;
	});
	moveController.addEventListener( 'disconnected', (evt) => {
		player.controller = null;
	});

	// 移動用のキーボード処理
	function keyCheck(evt, val) {
		switch ( evt.keyCode ) {
			case 38: // up
			case 87: // w
				player.inputs[0] = val;
				break;
			case 37: // left
			case 65: // a
				player.inputs[1] = val;
				break;
			case 40: // down
			case 83: // s
				player.inputs[2] = val;
				break;
			case 39: // right
			case 68: // d
				player.inputs[3] = val;
				break;
		}
	}

	document.addEventListener( 'keydown', (evt) => keyCheck(evt, true), false );
	document.addEventListener( 'keyup', (evt) => keyCheck(evt, false), false );

	//移動処理
	function tickMove() {
		const delta = (curTime - prevTime) / 1000.0;
		if(renderer.xr.isPresenting && player.controller) {
			let vec = new THREE.Vector3();
			vec.setFromMatrixColumn( camera.matrixWorld, 0 );
			vec.y = 0;
			vec.crossVectors( camera.up, vec);
			vrCamera.position.addScaledVector( vec, player.getHorizontal(player.controller) * player.speed * delta );
			vec.setFromMatrixColumn( camera.matrixWorld, 0 );
			vec.y = 0;
			vrCamera.position.addScaledVector( vec, player.getVertical(player.controller) * player.speed * delta);
			return;
		}

		if(walkthrough.isLocked) {
			let dir = new THREE.Vector3();
			dir.z = Number(player.inputs[0]) - Number(player.inputs[2]);
			dir.x = Number(player.inputs[3]) - Number(player.inputs[1]);
			dir.normalize();
			walkthrough.moveRight(dir.x * player.speed * delta);
			walkthrough.moveForward(dir.z * player.speed * delta);
		}
		
	}

	function tick() {
		curTime = performance.now();
		/*
		if (model != null) {
			console.log(model);
		}
		*/

		if(!walkthrough.isLocked && !renderer.xr.isPresenting) {
			controls.update();
		}

		tickMove();

		renderer.render(scene, camera);
		
		// デバッグ用情報の表示
		html = "[Camera Parameter]<br>X Position："+camera.position.x+"<br>Y Position："+camera.position.y+"<br>Z Position："+camera.position.z+"<br>X Rotation："+camera.rotation.x+"<br>Y Rotation："+camera.rotation.y+"<br>Z Rotation："+camera.rotation.z+"<br>X Scale："+camera.scale.x+"<br>Y Scale："+camera.scale.y+"<br>Z Scale："+camera.scale.z;
		$("#debug_camera").html(html);
		
		// フェード処理
		if (fade == 0 && $("#cover").css("opacity") <= 0) {
			$("#cover").css("display", "none");
			fade = 1;
		}
		
		// ツールチップ処理
		if (chip == 0) {
			$("#chip").hide();
		}
		if (chip == 1) {
			$("#chip").show();
		}
		$("#chip").text(chip_tx);
		prevTime = curTime;
	}
}

window.onmousemove = function (ev){
	var hit = 0;
	
	// 画面上のマウスクリック位置
	var x = event.clientX;
	var y = event.clientY;
	
	// マウスクリック位置を正規化
	var mouse = new THREE.Vector2();
	mouse.x =  ( x / window.innerWidth ) * 2 - 1;
	mouse.y = -( y / window.innerHeight ) * 2 + 1;
	
	// Raycasterインスタンス作成
	var raycaster = new THREE.Raycaster();
	// 取得したX、Y座標でrayの位置を更新
	raycaster.setFromCamera( mouse, camera );
	// オブジェクトの取得
	var intersects = raycaster.intersectObjects(scene.children, true);
	for (var i = 0; i < intersects.length; i++) {
		if (intersects[i].object.name.indexOf("map_5.osm_buildings.002") != -1) {
			chip = 1;
			chip_tx = "情報学部2号館";
			chip_id = "map_5.osm_buildings.002";
		}
		if (intersects[i].object.name.indexOf("map_5.osm_buildings.005") != -1) {
			chip = 1;
			chip_tx = "共通講義棟";
			chip_id = "map_5.osm_buildings.005";
		}
		if (chip == 1) {
			$("#chip").css("left", x);
			$("#chip").css("top", y);
		}
		if (intersects[i].object.name.indexOf(chip_id) != -1) {
			hit++;
		}
	}
	if (hit == 0){ chip = 0; }
}

// VRモードへ切り替え
window.changeVRMode = () => {
	//walkthrough = true;
	player.birdPos = camera.position;
	player.birdMatrix = camera.matrixWorld;
	walkthrough.lock();

	$("#information").hide(500);
	$("#copyright").hide(500);
	$("#vr_mode").show(500);
};

// VRモードの終了
window.closeVRMode = () => {
	walkthrough.unlock();
	$("#information").show(500);
	$("#copyright").show(500);
	$("#vr_mode").hide(500);
};

// デバッグウインドウ
window.toggleDebugWindow = () => {
	$("#debug").slideToggle(500);
};