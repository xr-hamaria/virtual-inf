/*
静岡大学 バーチャル情報学部
Prototype / Rev.14

(c)2020 Shizuoka University all rights reserved.
Developed by Shizuoka University xR Association "Hamaria"
*/

import { VRButton } from './WebVR.js';
import { VirtualPad } from './virtualpad.js';

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
var clicker = {prev:{}, next: {}}
var player = {
	speed: 7.0,
	controller: null,
	inputs: [false, false, false, false],
	birdMatrix : null,
	birdPos: new THREE.Vector3(),
	getControllerIndex : function() {
		return 0;
	},
	getHorizontal : function(pad) {	// must return -1.0 ~ 1.0
		return -pad.axes[3];
	},
	getVertical : function(pad) {	// must return -1.0 ~ 1.0
		return pad.axes[2];
	}
};

const domChip = $("#chip");
const domCover = $("#cover");
const domDebug = $("#debug_camera");
const domDialog = $("#dialog");

var parentMap = {};
const ChipBase = function(id, label, impl = false) {
	this.id = id;
	this.label = label;
	this.impl = impl;
};
const toolChips = {
	inf_1: new ChipBase("inf_1", "情報学部1号館"),
	inf_2: new ChipBase("inf_2", "情報学部2号館"),
	s_port: new ChipBase("s-port", "S-Port", true),
	innovation: new ChipBase("innovation", "イノベーション社会連携推進機構"),
	south_hall: new ChipBase("south_hall", "南会館"),
	sanaru_hall: new ChipBase("sanaru_hall", "佐鳴会館"),
	kagai: new ChipBase("kagai", "課外活動共同施設"),
	takayanagi: new ChipBase("takayanagi", "高柳記念未来技術創造館"),
	budo: new ChipBase("budo", "武道場"),
	gym: new ChipBase("gym", "体育館"),
	north_hall: new ChipBase("north_hall", "北会館"),
	eng_8: new ChipBase("eng_8", "工学部8号館"),
	eng_7: new ChipBase("eng_7", "工学部7号館"),
	eng_4: new ChipBase("eng_4", "工学部4号館"),
	eng_5: new ChipBase("eng_5", "工学部5号館"),
	monozukuri_house: new ChipBase("monozukuri_house", "ものづくり館"),
	monozukuri_center: new ChipBase("monozukuri_center", "ものづくりセンター"),
	eng_1: new ChipBase("eng_1", "工学部1号館"),
	eng_2: new ChipBase("eng_2", "工学部2号館"),
	eng_6: new ChipBase("eng_6", "工学部6号館"),
	eng_3: new ChipBase("eng_3", "工学部3号館"),
	nanodevice: new ChipBase("nanodevice", "ナノデバイス"),
	electronics: new ChipBase("electronics", "電子工学研究拠点"),
	hikari_soki: new ChipBase("hikari_soki", "光創起イノベーション研究拠点"),
	inf_graduate: new ChipBase("inf_graduate", "創造科学技術大学院"),
	lecture_building: new ChipBase("lecture_building", "共通講義棟"),
	sogo: new ChipBase("sogo", "総合研究棟"),
};

window.addEventListener('DOMContentLoaded', init);

$(window).on('touchmove.noScroll', function(e) {
	e.preventDefault();
});

document.getElementById('canvas').addEventListener('mousedown', (evt) => {
	clicker.prev = {x:evt.screenX, y:evt.screenY};
});
document.getElementById('canvas').addEventListener('touchstart', (evt) => {
	clicker.prev = {x:evt.screenX, y:evt.screenY};
});
document.getElementById('canvas').addEventListener('touchend', (evt) => {
	let d = (evt.screenX - clicker.prev.x) * (evt.screenX - clicker.prev.x) + (evt.screenY - clicker.prev.y) * (evt.screenY - clicker.prev.y);
	if(d <= 16) {
		bodyClick();
	}
});
document.getElementById('canvas').addEventListener('mouseup', (evt) => {
	let d = (evt.screenX - clicker.prev.x) * (evt.screenX - clicker.prev.x) + (evt.screenY - clicker.prev.y) * (evt.screenY - clicker.prev.y);
	if(d <= 16) {
		bodyClick();
	}
});

function bodyClick() {
	if(chip == 0)
		return;
	$("#dialog_title").text(chip_tx);
	$("#cover").css("display", "block").css("opacity",0.3);;
	domDialog.show(500);
	if(toolChips[chip_id] && toolChips[chip_id].impl) {
		$("#dialog_main").load(`contents/${toolChips[chip_id].id}.html`);
	} else {
		$("#dialog_main").html('');
	}
	fade = 0;
	dialog = 1;
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
		if(!walkthrough.desktopMode) {
			VirtualPad.show();
		}
	});
	walkthrough.addEventListener('unlock', () => {
		camera.matrixWorld = player.birdMatrix;
		camera.position.x = player.birdPos.x;
		camera.position.y = player.birdPos.y;
		camera.position.z = player.birdPos.z;
		$("#information").show(500);
		$("#copyright").show(500);
		$("#vr_mode").hide(500);
		$("#VRButton").hide(500);
		if(!walkthrough.desktopMode) {
			VirtualPad.hide();
		}
	});

	if(!walkthrough.desktopMode) {
		VirtualPad.init();
	}
	window.addEventListener('enter_vr', () => {
		if(camera != vrCamera)
			vrCamera.position.set(116, 1.4, -50);
	});
	window.addEventListener('exit_vr', () => {
		vrCamera.position.set(0, 0, 0);
	});
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
			if(!walkthrough.desktopMode) {
				let d = VirtualPad.getVector();
				dir.z = -d.y;
				dir.x = d.x;
			} else {
				dir.z = Number(player.inputs[0]) - Number(player.inputs[2]);
				dir.x = Number(player.inputs[3]) - Number(player.inputs[1]);
			}
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

		if(!isFirstPersonMode()) {
			controls.update();
		} else {
			domChip.hide();
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
			if(VRButton.enableVR())
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
		
			if (dialog == 1) {
				if (dy != domDialog.height()) {
					dy = domDialog.height();
					$("#dialog_main").height(dy - 62);
				}
			}
		
			domChip.text(chip_tx);
		}
		prevTime = curTime;
	}
}

window.onmousemove = function (ev){
	if(walkthrough && walkthrough.isLocked)
		return;
	var hit = false;
	
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
		const parent = parentMap[intersects[i].object.name];
		if(parent && toolChips[parent]) {
			domChip.css("left", x).css("top", y);
			chip_id = parent;
			chip_tx = toolChips[parent].label;
			chip = 1;
			hit = true;
			break;
		}
	}
	if (!hit) { 
		chip = 0;
	}
}

// VRモードへ切り替え
window.changeVRMode = () => {
	player.birdPos = camera.position;
	player.birdMatrix = camera.matrixWorld;
	walkthrough.lock();
	$("#information").hide(500);
	$("#copyright").hide(500);
	$("#vr_mode").show(500);
	$("#VRButton").show(500);
};

// VRモードの終了
window.closeVRMode = () => {
	walkthrough.unlock();
	$("#information").show(500);
	$("#copyright").show(500);
	$("#vr_mode").hide(500);
	$("#VRButton").hide(500);
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