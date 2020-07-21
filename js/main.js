/*
静岡大学 バーチャル情報学部
Prototype / Rev.13

(c)2020 Shizuoka University all rights reserved.
Developed by Shizuoka University xR Association "Hamaria"
*/

import { VRButton } from './WebVR.js';

var controls;
var html = "";
var renderer, scene, camera, controls;
var chip = 0;
var chip_tx = "";
var chip_id = "";
var dialog = 0;
var dy = 0;
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

document.body.onclick = function() {
	if(chip == 1) {
		$("#dialog_title").text(chip_tx);
		$("#cover").css("display", "block");
		$("#cover").css("opacity",0.3);
		$("#dialog").show(500);
		if(chip_tx == "S-Port") {
			$("#dialog_main").load("contents/s-port.html");
		}
		fade = 0;
		dialog = 1;
	}
}

function init() {
	// レンダラーを作成
	renderer = new THREE.WebGLRenderer({
		canvas: document.getElementById('canvas'),
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
	}

	// シーンを作成
	scene = new THREE.Scene();

	// カメラを作成
	camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
	controls = new THREE.OrbitControls(camera);
	controls.maxDistance = 600;

	const loader = new THREE.GLTFLoader();

	let vrCamera = camera;
	// VR移動用のカメラ準備
	if(VRButton.enableVR()) {
		vrCamera = new THREE.Object3D();
		vrCamera.add(camera);
		scene.add(vrCamera);
	}

	// 移動関連のコンポーネント初期化
	walkthrough = new THREE.PointerLockControls(camera, document.getElementById('canvas') );
	walkthrough.addEventListener('lock', () => {
		player.birdPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
		camera.position.set(116, 1.4, -50);
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
			vrCamera.position.set(116, 1.4, -50);
	});
	window.addEventListener('exit_vr', () => {
		vrCamera.position.set(0, 0, 0);
	});
	let parentMap = {};
	// 全体モデル
	var model = null;
	loader.load(
		'model/campus.glb',
		function (gltf) {
			model = gltf.scene;
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

			let targets = [...gltf.scene.children];
			while(targets.length > 0) {
				let child = targets.pop();
				for(let cc of child.children) {
					targets.push(cc);
				}
				if(child.name) {
					let parent = child;
					while(parent.parent && parent.parent != model && (parent = parent.parent));
					parentMap[child.name] = parent.name;
				}
			}
			$("#cover").css("opacity",0);
			$("#cover_loading").hide();
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

	camera.position.set(329.9886609379634,240.83169594230232,-35.899973772662483);
	camera.rotation.set(-1.8099243120012465,0.7840724844004205,1.9031279561056308)
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

	function isFirstPersonMode() {
		return walkthrough.isLocked || renderer.xr.isPresenting;
	}

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

	const domChip = $("#chip");
	const domCover = $("#cover");
	const domDebug = $("#debug_camera");
	function tick() {
		curTime = performance.now();
		/*
		if (model != null) {
			console.log(model);
		}
		*/

		if(!isFirstPersonMode()) {
			controls.update();
		}

		tickMove();

		renderer.render(scene, camera);
		
		// デバッグ用情報の表示
		html = "[Camera Parameter]<br>X Position："+camera.position.x+"<br>Y Position："+camera.position.y+"<br>Z Position："+camera.position.z+"<br>X Rotation："+camera.rotation.x+"<br>Y Rotation："+camera.rotation.y+"<br>Z Rotation："+camera.rotation.z+"<br>X Scale："+camera.scale.x+"<br>Y Scale："+camera.scale.y+"<br>Z Scale："+camera.scale.z;
		domDebug.html(html);
		
		// フェード処理
		if (fade == 0 && domCover.css("opacity") <= 0) {
			domCover.css("display", "none");
			fade = 1;
			document.body.appendChild(VRButton.createButton(renderer));
		}
		
		// ツールチップ処理
		if(!isFirstPersonMode()) {
			if (chip == 0) {
				domChip.hide();
			}
			if (chip == 1) {
				domChip.show();
			}
			domChip.text(chip_tx);
		}

		
		if (dialog == 1) {
			if (dy != $("#dialog").height()) {
				dy = $("#dialog").height();
				$("#dialog_main").height(dy - 62);
			}
		}
		
		$("#chip").text(chip_tx);
		prevTime = curTime;
	}
}

window.onmousemove = function (ev){
	if(walkthrough && walkthrough.isLocked)
		return;
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
		if (intersects[i].object.name.indexOf("Plane.002") != -1) {
			chip = 1;
			chip_tx = "情報学部2号館";
			chip_id = "Plane.002";
		}
		if (intersects[i].object.name.indexOf("map_5.osm_buildings.005") != -1) {
			chip = 1;
			chip_tx = "共通講義棟";
			chip_id = "map_5.osm_buildings.005";
		}
		if (intersects[i].object.name.indexOf("map_5.osm_buildings.030") != -1) {
			chip = 1;
			chip_tx = "S-Port";
			chip_id = "map_5.osm_buildings.030";
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

// ダイアログを閉じる
window.closeDialog = () => {
	dialog = 0;
	$("#dialog").hide(500);
	$("#cover").css("opacity",0);
	$("#cover_loading").hide();
};