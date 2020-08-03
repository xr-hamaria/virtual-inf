/*
静岡大学 バーチャル情報学部
Ver.1.0.2 (2020-08-04)

(c)2020 Shizuoka University all rights reserved.
Developed by Shizuoka University xR Association "Hamaria"
*/

import { VRButton } from './WebVR.js';
import { VirtualPad } from './virtualpad.js';

const debugMode = false;
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
var model, skyDome, shizuppi;
var toolTipRaycaster = new THREE.Raycaster();
var player = {
	hasController: false,
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
		return pad && pad.axes ? -pad.axes[3] : 0;
	},
	getVertical : function(pad) {	// must return -1.0 ~ 1.0
		return pad && pad.axes ? pad.axes[2] : 0;
	}
};
var settingsChangedEvent = new Event('settingschanged');
var settings = {
	_enableFog: false,
	_enableShadow: false,
	_cycleSun: false,
	set enableFog(val) {
		this._enableFog = val;
		window.dispatchEvent(settingsChangedEvent);
	},
	set enableShadow(val) {
		this._enableShadow = val;
		window.dispatchEvent(settingsChangedEvent);
	},
	set cycleSun(val) {
		this._cycleSun = val;
		window.dispatchEvent(settingsChangedEvent);
	},
	get enableFog() {
		return this._enableFog;
	},
	get enableShadow() {
		return this._enableShadow;
	},
	get cycleSun() {
		return this._cycleSun;
	}
};
const domtip = $("#tip");
const domCover = $("#cover");
const domDebug = $("#debug_camera");
const domDialog = $("#dialog");
const domCanvas = document.getElementById('canvas');
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
	Hikarisoki: new TipBase("Hikarisoki", "光創起イノベーション研究拠点棟"),
	inf_graduate: new TipBase("inf_graduate", "創造科学技術大学院"),
	lecture_building: new TipBase("lecture_building", "共通講義棟", true, true, true),
	sogo: new TipBase("sogo", "総合研究棟"),
	hei: new TipBase("hei", "スタッフクレジット", true),
	tokeitou: new TipBase("tokeitou", "時計塔"),
	mother: new TipBase("mother", "「母」"),
	keijiban: new TipBase("keijiban", "学生掲示板")
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
		if(cancel)
			return;
		
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
	if(!(dialog == 0 && tip_id != "" && toolTip[tip_id].impl == true) || tip == 0 || walkthrough.isLocked)
		return;
	$("#dialog_title").text(tip_tx);
	$("#cover").css("display", "block").css("opacity",0.3);
	if(toolTip[tip_id] && toolTip[tip_id].impl) {
		$("#dialog_main").load(`contents/${toolTip[tip_id].id}.html`);
	} else {
		$("#dialog_main").html('');
	}
	domDialog.show(500);
	fade = 0;
	dialog = 1;
	
});

function init() {
	changeInstImage();
	// レンダラーを作成
	renderer = new THREE.WebGLRenderer({
		canvas: domCanvas,
		antialias: true
	});
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer.setClearColor(0x345CAA);
	renderer.setPixelRatio(1);
	renderer.setSize(width, height);
	renderer.shadowMap.enabled = settings.enableShadow;
	// VRボタンの有効をチェック後有効化
	if(VRButton.enableVR()) {
		renderer.xr.enabled = true;
	}

	// シーンを作成
	scene = new THREE.Scene();
	if(settings.enableFog) {
		scene.fog = new THREE.Fog(0xFFFFFF, 50, 1500);
	}

	// カメラを作成
	camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
	controls = new THREE.OrbitControls(camera);
	controls.maxDistance = 600;
	controls.noKeys = true;
	controls.maxPolarAngle = Math.PI * 0.495;
	
	const loader = new THREE.GLTFLoader();

	let vrCamera = camera;
	// VR移動用のカメラ準備
	if(VRButton.enableVR()) {
		vrCamera = new THREE.Object3D();
		vrCamera.add(camera);
		scene.add(vrCamera);
	}
	function resizeCanvas() {
		const t = (navigator.userAgent.includes('iPad') || navigator.userAgent.includes('iPhone'))? 350 : 0;
		setTimeout(() => {
			width = window.innerWidth;
			height = window.innerHeight;
			renderer.setSize(width, height);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		}, t);
	}
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas, false);
	
	// 移動関連のコンポーネント初期化
	walkthrough = new THREE.PointerLockControls(camera, document.getElementById('canvas') );
	walkthrough.addEventListener('lock', () => {
		player.birdPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
		camera.position.set(116, player.eyeHeight, -50);
		skyDome.visible = true;
		if(!walkthrough.desktopMode) {
			VirtualPad.show();
		}
		controls.enabled = false;
	});
	walkthrough.addEventListener('unlock', () => {
		camera.matrixWorld = player.birdMatrix;
		camera.position.x = player.birdPos.x;
		camera.position.y = player.birdPos.y;
		camera.position.z = player.birdPos.z;
		skyDome.visible = false;
		$("#information").show(500);
		$("#copyright").show(500);
		$("#vr_mode").hide(500);
		$("#VRButton").show(500);
		if(!walkthrough.desktopMode) {
			VirtualPad.hide();
		}
		controls.enabled = true;
	});

	if(!walkthrough.desktopMode) {
		VirtualPad.init();
		$('#vrend_esc').css('display', 'none');
	}
	window.addEventListener('enter_vr', () => {
		if(camera != vrCamera)
			vrCamera.position.set(116, player.eyeHeight, -50);
		skyDome.visible = true;
		controls.enabled = false;

	});
	window.addEventListener('exit_vr', () => {
		vrCamera.position.set(0, 0, 0);
		skyDome.visible = false;
		controls.enabled = true;
	});
	const domProgressBar = $("#progressbar-front");
	// 全体モデル
	loader.load(
		'model/campus.glb',
		function (gltf) {
			model = gltf.scene;
			if(debugMode)
				console.log(model);
			let targets = [...gltf.scene.children];

			let i = 0;
			while(targets.length > 0) {
				i++;
				let child = targets.pop();
				for(let cc of child.children) {
					targets.push(cc);
				}
				if(child.name && !child.name.includes('tree') && !child.name.includes('leaf')) {
					let parent = child;
					while(parent.parent && parent.parent != model && (parent = parent.parent));
					parentMap[child.name] = parent.name;
				}
				if(child.type == "Mesh") {
					let isFloor = parentMap[child.name] && parentMap[child.name].includes('floor');
					child.receiveShadow = isFloor;
					child.castShadow = !isFloor;
				}

				if(child.type == "Mesh" && child.material) {
					child.material.side = THREE.FrontSide;
					child.material.metalness = Math.min(0.8, child.material.metalness);
				}
			}
			scene.add(gltf.scene);
			domProgressBar.css('transform', `scaleX(1)`);
			$("#cover").css("opacity",0);
			$("#cover_loading").hide();
			domProgressBar.hide();
			$("#progressbar").hide();
		},
		function (error) {
			if(!error || error.total == 0)
				return;
			const p = Math.min(1, error.loaded/(error.total+1));
			domProgressBar.css('transform', `scaleX(${p})`);
		},
		function(error) {
			console.log(error);
		}
	);
	new THREE.RGBELoader().load( 'img/vr_background.hdr', (skyTexture) => {
		skyTexture.flipY = false;
		const sky = new THREE.Mesh( new THREE.SphereGeometry( 700, 32, 16 ), new THREE.MeshBasicMaterial( { map: skyTexture } ) );
		sky.material.side = THREE.BackSide;
		sky.scale.x = -1;
		sky.scale.y = -1;
		sky.rotation.y = Math.PI/2;
		sky.visible = false;
		skyDome = sky;
		scene.add(sky);
	});

	/// todo: add shizuppi- loading here
	/*
	loader.load('model/shizuppi.gltf', (gltf) => {
		shizuppi = gltf.scene; 
		scene.add(shizuppi);
	});
	*/
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.gammaFactor = 2.2;

	scene.add(new THREE.AmbientLight(0xFFFFFF, 0.6));
	const sun = new THREE.DirectionalLight(0xFFFFFF, 2);
	sun.position.set(0, 200, 180);
	scene.add(sun);

	camera.position.set(329.9886609379634,240.83169594230232,-35.899973772662483);
	camera.rotation.set(-1.8099243120012465,0.7840724844004205,1.9031279561056308)
	renderer.setAnimationLoop(tick);

	try {
		const moveController = renderer.xr.getController(player.getControllerIndex());
		moveController.addEventListener( 'connected', (evt) => {
			if(evt && evt.data && evt.data.gamepad)
				player.controller = evt.data.gamepad;
		});
		moveController.addEventListener( 'disconnected', (evt) => {
			player.controller = null;
		});
		player.hasController = true;
	} catch(err) {
		player.controller = null;
	}

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
			case 113:
				break;
		}
	}

	document.addEventListener( 'keydown', (evt) => keyCheck(evt, true), false );
	document.addEventListener( 'keyup', (evt) => keyCheck(evt, false), false );

	window.addEventListener('settingschanged', () => {
		if(settings.enableFog) {
			scene.fog = new THREE.Fog(0xFFFFFF, 50, 1500);
		} else {
			scene.fog = null;
		}
		renderer.shadowMap.enabled = settings.enableShadow;
		sun.castShadow = settings.enableShadow;
		if(settings.enableShadow) {
			sun.shadow.camera.right = 200;
			sun.shadow.camera.left = -200;
			sun.shadow.camera.top = -200;
			sun.shadow.camera.bottom = 200;
		}
	});
	window.vcConfig = settings;
	function isFirstPersonMode() {
		return walkthrough.isLocked || renderer.xr.isPresenting;
	}

	function canMoveOn(cam, vec, scale) {
		let vv = vec.clone();
		vv.applyQuaternion( camera.quaternion );
		vv.y = 0;
		//vv.normalize();
		const caster = new THREE.Raycaster(cam.position, vv, 0.01, scale+0.1);
		const caster2 = new THREE.Raycaster(new THREE.Vector3(cam.position.x, cam.position.y-0.8, cam.position.z), vv, 0.01, scale+0.1);
		const intersects = caster.intersectObjects( scene.children, true);
		const intersects2 = caster.intersectObjects( scene.children, true);
		return intersects.length <= 0 && intersects2.length <= 0;
	}

	function tickMove() {
		const delta = (curTime - prevTime) / 1000.0;
		if(renderer.xr.isPresenting && player.hasController && player.controller) {
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
	let timer = 0;
	function tick() {
		curTime = performance.now();
		if(settings.cycleSun) {
			timer++;
			sun.position.set(Math.cos((timer % 360) / 360 * Math.PI * 2) * 200, Math.sin((timer % 360) / 360 * Math.PI * 2) * 200, sun.position.z);
		}

		if(!isFirstPersonMode()) {
			if(dialog == 0 && model) {
				controls.update();
			}
		} else {
			domtip.hide();
		}

		tickMove();

		renderer.render(scene, camera);
		
		// デバッグ用情報の表示
		if(debugMode) {
			html = "[Camera Parameter]<br>X Position："+camera.position.x+"<br>Y Position："+camera.position.y+"<br>Z Position："+camera.position.z+"<br>X Rotation："+camera.rotation.x+"<br>Y Rotation："+camera.rotation.y+"<br>Z Rotation："+camera.rotation.z+"<br>X Scale："+camera.scale.x+"<br>Y Scale："+camera.scale.y+"<br>Z Scale："+camera.scale.z;
			domDebug.html(html);
		}
		
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

	if(ev.target && ev.target.nodeName == "IMG") {
		tip = 0;
		return;
	}
	let hit = false;
	let size = new THREE.Vector2();
	// 画面上のマウスクリック位置
	const x = event.clientX;
	const y = event.clientY;
	renderer.getSize(size);
	// マウスクリック位置を正規化
	let mouse = new THREE.Vector2();
	mouse.x =  ( x / size.x ) * 2 - 1;
	mouse.y = -( y / size.y ) * 2 + 1;
	
	// 取得したX、Y座標でrayの位置を更新
	toolTipRaycaster.setFromCamera( mouse, camera );
	// オブジェクトの取得
	const intersects = toolTipRaycaster.intersectObjects(scene.children, true);
	for (let i = 0; i < intersects.length; i++) {
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

function changeInstImage() {
	var ua = navigator.userAgent;
	if (ua.indexOf('iPhone') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0) {
		$("#inst_box").attr("src","img/inst_s.png");
	} else if (ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0) {
		$("#inst_box").attr("src","img/inst_s.png");
	} else {
		$("#inst_box").attr("src","img/inst.png");
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

window.openHelp = () => {
	$("#dialog_title").text("操作説明");
	$("#cover").css("display", "block").css("opacity",0.3);
	domDialog.show(500);
	$("#dialog_main").load("contents/help.html");
	fade = 0;
	dialog = 1;
}

// デバッグウインドウ
window.toggleDebugWindow = () => {
	$("#debug").slideToggle(500);
};

// ダイアログを閉じる
window.closeDialog = () => {
	if(dialog == 0) return false;
	dialog = 0;
	$("#dialog").hide(500);
	$("#cover").css("opacity",0);
	$("#cover_loading").hide();
};