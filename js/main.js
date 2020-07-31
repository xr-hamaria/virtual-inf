/*
静岡大学 バーチャル情報学部
Prototype / Rev.15

(c)2020 Shizuoka University all rights reserved.
Developed by Shizuoka University xR Association "Hamaria"
*/

import { VRButton } from './WebVR.js';
import { VirtualPad } from './virtualpad.js';

var html = "";
var renderer, scene, camera, controls;
var tip = 0;
var tip_tx = "";
var tip_id = "";
var dialog = 0;
var dy = 0;
var fade = 0;
var walkthrough = null;
var prevTime, curTime;
var player = {
	speed: 7.0,
	eyeHeight: 1.4,
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

const domtip = $("#tip");
const domCover = $("#cover");
const domDebug = $("#debug_camera");
const domDialog = $("#dialog");

var parentMap = {};
const TipBase = function(id, label, impl, doc, pic = false) {
	this.id = id;
	this.label = label;
	this.impl = impl;
	this.doc = doc;
	this.pic = pic;
};
const toolTip = {
	inf_1: new TipBase("inf_1", "情報学部1号館"),
	inf_2: new TipBase("inf_2", "情報学部2号館", true, true, true),
	s_port: new TipBase("s-port", "S-Port", true, true, true),
	innovation: new TipBase("innovation", "イノベーション社会連携推進機構"),
	south_hall: new TipBase("south_hall", "南会館", true, true, true),
	sanaru_hall: new TipBase("sanaru_hall", "佐鳴会館"),
	kagai: new TipBase("kagai", "課外活動共同施設"),
	takayanagi: new TipBase("takayanagi", "高柳記念未来技術創造館"),
	budo: new TipBase("budo", "武道場"),
	gym: new TipBase("gym", "体育館"),
	north_hall: new TipBase("north_hall", "北会館", true, true, true),
	eng_8: new TipBase("eng_8", "工学部8号館"),
	eng_7: new TipBase("eng_7", "工学部7号館"),
	eng_4: new TipBase("eng_4", "工学部4号館"),
	eng_5: new TipBase("eng_5", "工学部5号館"),
	monozukuri_house: new TipBase("monozukuri_house", "ものづくり館"),
	monozukuri_center: new TipBase("monozukuri_center", "ものづくりセンター"),
	eng_1: new TipBase("eng_1", "工学部1号館"),
	eng_2: new TipBase("eng_2", "工学部2号館"),
	eng_6: new TipBase("eng_6", "工学部6号館"),
	eng_3: new TipBase("eng_3", "工学部3号館"),
	nanodevice: new TipBase("nanodevice", "ナノデバイス作製・評価センター"),
	electronics: new TipBase("electronics", "電子工学研究所"),
	hikari_soki: new TipBase("hikari_soki", "光創起イノベーション研究拠点棟"),
	inf_graduate: new TipBase("inf_graduate", "創造科学技術大学院"),
	lecture_building: new TipBase("lecture_building", "共通講義棟", true, true, true),
	sogo: new TipBase("sogo", "総合研究棟"),
	hei: new TipBase("hei", "スタッフクレジット", true)
};

window.addEventListener('DOMContentLoaded', init);

$(window).on('touchmove.noScroll', function(e) {
	e.preventDefault();
});

function tapHandler(dom, callback) {
	let clickPos = {x:0,y:0};
	let cancel = false;
	dom.addEventListener('mousedown', evt => {
		clickPos = {x:evt.screenX, y:evt.screenY};
		cancel = false;
	}, false);
	
	dom.addEventListener('touchstart', evt => {
		clickPos = {x:evt.screenX, y:evt.screenY};
		cancel = false;
	}, false);
	function upHandler(evt) {
		const d = (evt.screenX - clickPos.x) * (evt.screenX - clickPos.x) + (evt.screenY - clickPos.y) * (evt.screenY - clickPos.y);
		if(d <= 16) {
			callback();
		}
	}
	dom.addEventListener('touchend', evt => upHandler(evt), false);
	dom.addEventListener('mouseup', evt => upHandler(evt), false);

	
	// for iOS
	function preventScroll(evt) {
		if(evt.touches.length >= 2) {
			evt.preventDefault();
		}
	}
	document.addEventListener('touchstart', evt => preventScroll(evt),  { passive: false });
	document.addEventListener('touchmove', evt => preventScroll(evt),  { passive: false });

}

tapHandler(window, () => {
	if(dialog == 0 && tip_id != "" && toolTip[tip_id].impl == true) {
		if(tip == 0)
			return;
		$("#dialog_title").text(tip_tx);
		$("#cover").css("display", "block").css("opacity",0.3);
		domDialog.show(500);
		if(toolTip[tip_id] && toolTip[tip_id].impl) {
			$("#dialog_main").load(`contents/${toolTip[tip_id].id}.html`);
		} else {
			$("#dialog_main").html('');
		}
		fade = 0;
		dialog = 1;
	}
});

function init() {
	// レンダラーを作成
	renderer = new THREE.WebGLRenderer({
		canvas: document.getElementById('canvas'),
		antialias: true,
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

	window.addEventListener('resize', () => {
		width = window.innerWidth;
		height = window.innerHeight;
		renderer.setSize(width, height);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}, false);
	
	// 移動関連のコンポーネント初期化
	walkthrough = new THREE.PointerLockControls(camera, document.getElementById('canvas') );
	walkthrough.addEventListener('lock', () => {
		player.birdPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
		camera.position.set(116, player.eyeHeight, -50);
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
		$("#VRButton").show(500);
		if(!walkthrough.desktopMode) {
			VirtualPad.hide();
		}
	});

	if(!walkthrough.desktopMode) {
		VirtualPad.init();
	}
	window.addEventListener('enter_vr', () => {
		if(camera != vrCamera)
			vrCamera.position.set(116, player.eyeHeight, -50);
	});
	window.addEventListener('exit_vr', () => {
		vrCamera.position.set(0, 0, 0);
	});
	const domProgressBar = $("#progressbar-front");

	// 全体モデル
	var model = null;
	loader.load(
		'model/campus.glb',
		function (gltf) {
			model = gltf.scene;
			scene.add(gltf.scene);
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

				if(child.type == "Mesh" && child.material) {
					child.material.side = THREE.FrontSide;
				}

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
			domProgressBar.css('transform', `scaleX(1)`);
			$("#cover").css("opacity",0);
			$("#cover_loading").hide();
			domProgressBar.hide();
			$("#progressbar").hide();
		},
		function (error) {
			const p = error.loaded/(error.total+1);
			domProgressBar.css('transform', `scaleX(${p})`);
		}
	);
	renderer.gammaOutput = true;
	renderer.gammaFactor = 2.2;

	scene.add(new THREE.AmbientLight(0xFFFFFF, 1));
	const sun = new THREE.DirectionalLight(0xFFFFFF, 1);
	sun.position.set(1, 50, 1);
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

	function canMoveOn(cam, vec, scale) {
		let vv = vec.clone();
		vv.applyQuaternion( camera.quaternion );
		vv.y = 0;
		vv.normalize();
		const caster = new THREE.Raycaster(cam.position, vv, 0.01, scale+0.1);
		const intersects = caster.intersectObjects( scene.children, true);
		return intersects.length <= 0;
	}

	function tickMove() {
		const delta = (curTime - prevTime) / 1000.0;
		if(renderer.xr.isPresenting && player.controller) {
			let vec = new THREE.Vector3();
			vec.setFromMatrixColumn( camera.matrixWorld, 0 );
			vec.y = 0;
			//vec.normalize();
			let vec2 = vec.clone();
			vec.crossVectors( camera.up, vec);
			vrCamera.position.addScaledVector( vec, player.getHorizontal(player.controller) * player.speed * delta );
			vrCamera.position.addScaledVector( vec2, player.getVertical(player.controller) * player.speed * delta);
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
			if(dialog == 0) {
				controls.update();
			}
		} else {
			domtip.hide();
		}

		tickMove();

		renderer.render(scene, camera);
		
		// デバッグ用情報の表示
		html = "[Camera Parameter]<br>X Position："+camera.position.x+"<br>Y Position："+camera.position.y+"<br>Z Position："+camera.position.z+"<br>X Rotation："+camera.rotation.x+"<br>Y Rotation："+camera.rotation.y+"<br>Z Rotation："+camera.rotation.z+"<br>X Scale："+camera.scale.x+"<br>Y Scale："+camera.scale.y+"<br>Z Scale："+camera.scale.z;
		domDebug.html(html);
		
		// フェード処理
		if (fade == 0 && domCover.css("opacity") <= 0) {
			domCover.css("display", "none");
			if(VRButton.enableVR() && !document.getElementById('VRButton')) {
				document.body.appendChild(VRButton.createButton(renderer));
			}
			fade = 1;
		}
		
		// ツールチップ処理
		if(!isFirstPersonMode()) {
			if (tip == 0) {
				domtip.hide();
			}
			if (tip == 1) {
				domtip.show();
			}
			
			if (dialog == 1) {
				if (dy != domDialog.height()) {
					dy = domDialog.height();
					$("#dialog_main").height(dy - 105);
				}
			}
			
			if (tip_id != "") {
				var tip_html = "";
				tip_html += "<span>"+tip_tx+"</span>";
				if (toolTip[tip_id].doc) {
					tip_html += "<img src='img/icon/icon-expl.png' class='icon-first'>";
				}
				if (toolTip[tip_id].pic) {
					tip_html += "<img src='img/icon/icon-photo.png'>";
				}
				domtip.html(tip_html);
			}
		}
		prevTime = curTime;
	}
}

window.addEventListener('mousemove', function (ev){
	if(!(scene && controls) || (walkthrough && walkthrough.isLocked))
		return;
	var hit = false;
	let size = new THREE.Vector2();
	// 画面上のマウスクリック位置
	var x = event.clientX;
	var y = event.clientY;
	renderer.getSize(size);
	// マウスクリック位置を正規化
	var mouse = new THREE.Vector2();
	mouse.x =  ( x / size.x ) * 2 - 1;
	mouse.y = -( y / size.y ) * 2 + 1;
	
	// Raycasterインスタンス作成
	var raycaster = new THREE.Raycaster();
	// 取得したX、Y座標でrayの位置を更新
	raycaster.setFromCamera( mouse, camera );
	// オブジェクトの取得
	var intersects = raycaster.intersectObjects(scene.children, true);
	for (var i = 0; i < intersects.length; i++) {
		const parent = parentMap[intersects[i].object.name];
		if(parent && toolTip[parent]) {
			domtip.css("left", x).css("top", y);
			tip_id = parent;
			tip_tx = toolTip[parent].label;
			tip = 1;
			hit = true;
			break;
		}
	}
	if (!hit) { 
		tip = 0;
	}
});

// VRモードへ切り替え
window.changeVRMode = () => {
	player.birdPos = camera.position;
	player.birdMatrix = camera.matrixWorld;
	walkthrough.lock();
	$("#information").hide(500);
	$("#copyright").hide(500);
	$("#vr_mode").show(500);
	$("#VRButton").hide(500);
};

// VRモードの終了
window.closeVRMode = () => {
	walkthrough.unlock();
	$("#information").show(500);
	$("#copyright").show(500);
	$("#vr_mode").hide(500);
	$("#VRButton").show(500);
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