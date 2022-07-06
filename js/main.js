import * as THREE from '../build/three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { RGBELoader } from './RGBELoader.js';
import { VRButton } from './WebVR.js';
import { VirtualPad } from './virtualpad.js';
import { OrbitControls } from './OrbitControls.js';
import { PointerLockControls } from './PointerLockControls.js';

const debugMode = false;
const domtip = $("#tip");
const domtipText = $("#tip_text");
const domtipCopy = $("#tip_copy");
const domtipExpl = $("#tip_icon_expl");
const domtipPhoto = $("#tip_icon_photo");
const domCover = $("#cover");
const domDebug = document.getElementById('debug_camera');
const domDialog = $("#dialog");
const domDialogMain = $("#dialog_main");
const domCanvas = document.getElementById('canvas');

const TipBase = function(id, label, impl, doc, pic = false) {
	this.id = id;
	this.label = label;
	this.impl = impl;
	this.doc = doc;
	this.pic = pic;
};
const toolTips = {
	inf_1: new TipBase("inf_1", "情報学部1号館"),
	inf_2: new TipBase("inf_2", "情報学部2号館", true, true, true),
	s_port: new TipBase("s-port", "S-Port", true, true, true),
	innovation: new TipBase("innovation", "イノベーション社会連携推進機構"),
	south_hall: new TipBase("south_hall", "南会館", true, true, true),
	sanaru_hall: new TipBase("sanaru_hall", "佐鳴会館", true, true),
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
	eng_6: new TipBase("eng_6", "工学部6号館", true, false, true),
	eng_3: new TipBase("eng_3", "工学部3号館"),
	nanodevice: new TipBase("nanodevice", "ナノデバイス作製・評価センター"),
	electronics: new TipBase("electronics", "電子工学研究所"),
	Hikarisoki: new TipBase("Hikarisoki", "光創起イノベーション研究拠点棟", true, true, true),
	inf_graduate: new TipBase("inf_graduate", "創造科学技術大学院"),
	lecture_building: new TipBase("lecture_building", "共通講義棟", true, true, true),
	sogo: new TipBase("sogo", "総合研究棟"),
	hei: new TipBase("hei", "スタッフクレジット", true),
	tokeitou: new TipBase("tokeitou", "時計塔"),
	mother: new TipBase("mother", "「母」"),
	keijiban: new TipBase("keijiban", "学生掲示板"),
	statue_of_kenjiro: new TipBase("statue_of_kenjiro", "高柳健次郎", true, true, true),
	toilet: new TipBase("toilet", "小ネタ", true, true)
};


var doneFade = false;

var tooltip = {
	visible: false,
	prevFrameVisible: false,
	label: '',
	targetId: ''
};

var dialog = {
	visible: false,
	height: 0
};

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
	getHorizontal : function(source) {	// must return -1.0 ~ 1.0
		if(!source || !source.gamepad)
			return 0;
		let index = 1;
		if(source.profiles && source.profiles.length > 0) {
			const name = source.profiles[0];
			if(name.includes('oculus-touch') || name.includes('Oculus Touch'))
				index = 3;
		}
		return -source.gamepad.axes[index];
	},
	getVertical : function(source) {	// must return -1.0 ~ 1.0
		if(!source || !source.gamepad)
			return 0;
		let index = 0;
		if(source.profiles && source.profiles.length > 0) {
			const name = source.profiles[0];
			if(name.includes('oculus-touch') || name.includes('Oculus Touch'))
				index = 2;
		}
		return source.gamepad.axes[index];
	}
};
var settingsChangedEvent = new Event('settingschanged');
var settings = {
	_enableAntialias: true,
	_enableFog: false,
	_enableShadow: false,
	_cycleSun: false,
	_cycleSpeed: 10000,
	_halfFramerate : false,

	set enableAntialias(val) {
		this._enableAntialias = val;
		window.dispatchEvent(settingsChangedEvent);
	},
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
	set cycleSpeed(val) {
		this._cycleSpeed = val;
		window.dispatchEvent(settingsChangedEvent);
	},
	get enableAntialias() {
		return this._enableAntialias;
	},
	get enableFog() {
		return this._enableFog;
	},
	get enableShadow() {
		return this._enableShadow;
	},
	get cycleSun() {
		return this._cycleSun;
	},
	get cycleSpeed() {
		return this._cycleSpeed;
	}
};

(function loadSavedSettings() {
	if (localStorage.hasOwnProperty("savedata")) {
		const savedata = JSON.parse(localStorage.getItem("savedata"));
		settings._enableAntialias = (savedata[0] != 1);
		settings._halfFramerate = (savedata[1] == 1);
		settings._enableShadow = (savedata[2] == 1);
		settings._cycleSpeed = 6000;
		settings._cycleSun = (savedata[3] == 1);
	}
	if (localStorage.hasOwnProperty("settings")) {
		try {
			const loadedSettings = JSON.parse(localStorage.getItem("settings"));
			for(let key of Object.keys(loadedSettings) ) {
				if(key.startsWith("_"))
					settings[key] = loadedSettings[key];
			}
		} catch(err) { }
	}

	window.vcConfig = settings;
})();

class VirtualCampusApp {
	constructor() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		this.renderer = null;
		this.scene = null;
		this.camera = null;
		this.vrCamera = null;
		this.controls = null;	// orbit control

		this.walkthrough = null;

		this.currentScene = null;

		this.frameCounter = 0;
		this.currentTime = null;
		this.prevTime = null;
		this.uiController = null;
	}

	main() {
		UIKit.init();
		this.uiController = new UIController(this);
	}

	init() {
		this.initializeRenderer();
		this.setupScene();
		this.setupFirstPersonMode();
		this.resetRenderer();

		window.addEventListener('mousemove', this.onMouseMove.bind(this));
		window.addEventListener('settingschanged', () => this.settingsChanged.bind(this));
		window.dispatchEvent(settingsChangedEvent);

		this.currentScene = new CampusSceneMain();
		this.scene.add(this.currentScene.scene);
		this.currentScene.app = this;
		this.currentScene.preInit();
	}

	isFirstPersonMode() {
		return this.walkthrough.isLocked || this.renderer.xr.isPresenting;
	}

	initializeRenderer() {
		try {
			this.renderer = new THREE.WebGLRenderer({
				canvas: domCanvas,
				antialias: settings._enableAntialias
			});

			this.renderer.setClearColor(0x345CAA);
			this.renderer.setPixelRatio(1);
			this.renderer.setSize(this.width, this.height);
			this.renderer.shadowMap.enabled = settings.enableShadow;
		} catch(exception) {
			console.log(exception);
			this.renderer = null;
			UIKit.messageException();
			return;
		}

		// VRが動きそうか確認
		if(VRButton.enableVR()) {
			this.renderer.xr.enabled = true;
		}
	}

	setupScene() {
		// シーンを作成
		this.scene = new THREE.Scene();
		if(settings.enableFog) {
			this.scene.fog = new THREE.Fog(0xFFFFFF, 50, 1500);
		}

		// カメラを作成
		this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.maxDistance = 600;
		this.controls.noKeys = true;
		this.controls.maxPolarAngle = Math.PI * 0.495;

		//const loader = new GLTFLoader();

		this.vrCamera = this.camera;
		// VR移動用のカメラ準備
		if(VRButton.enableVR()) {
			this.vrCamera = new THREE.Object3D();
			this.vrCamera.add(this.camera);
			this.scene.add(this.vrCamera);
		}

		this.resizeCanvas();
		window.addEventListener('resize', this.resizeCanvas.bind(this), false);
	}

	resizeCanvas() {
		const t = (navigator.userAgent.includes('iPad') || navigator.userAgent.includes('iPhone'))? 350 : 0;
		setTimeout(() => {
			this.width = window.innerWidth;
			this.height = window.innerHeight;
			this.renderer.setSize(this.width, this.height);
			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();
		}, t);
	}

	setupFirstPersonMode() {
		// 移動関連のコンポーネント初期化
		this.walkthrough = new PointerLockControls(this.camera, document.getElementById('canvas'));
		this.walkthrough.addEventListener('lock', () => {
			player.birdPos = new THREE.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z);
			if(this.currentScene) {
				this.currentScene.joinFirstPersonMode(false);
			}
			if(!this.walkthrough.desktopMode) {
				VirtualPad.show();
			}
			this.controls.enabled = false;
		});
		this.walkthrough.addEventListener('unlock', () => {
			this.camera.matrixWorld = player.birdMatrix;
			this.camera.position.x = player.birdPos.x;
			this.camera.position.y = player.birdPos.y;
			this.camera.position.z = player.birdPos.z;
			if(this.currentScene) {
				this.currentScene.leaveFirstPersonMode(false);
			}
			this.uiController.leaveFirstPersonMode(false);
			if(!this.walkthrough.desktopMode) {
				VirtualPad.hide();
			}
			this.controls.enabled = true;
		});

		if(!this.walkthrough.desktopMode) {
			VirtualPad.init();
			UIKit.hideVRInstruction();
		}
	}

	setupVRMode() {
		window.addEventListener('enter_vr', () => {
			if(this.currentScene) {
				this.currentScene.joinFirstPersonMode(true);
			}
			this.controls.enabled = false;
		});
		window.addEventListener('exit_vr', () => {
			if(this.currentScene) {
				this.currentScene.leaveFirstPersonMode(true);
			}
			this.controls.enabled = true;
		});
	}

	tick() {
		this.currentTime = performance.now();
		this.uiController.tick();
		if(this.currentScene) {
			this.currentScene.update();
		}

		if(!vcConfig._halfFramerate || vcConfig._halfFramerate && this.frameCounter == 0) {
			this.renderer.render(this.scene, this.camera);
		}
		this.frameCounter = (this.frameCounter + 1) % 2;

		if(this.currentScene) {
			this.currentScene.postUpdate();
		}

		if(debugMode && domDebug) {
			domDebug.innerHTML = "[Camera Parameter]<br>X Position："+this.camera.position.x+"<br>Y Position："+this.camera.position.y+"<br>Z Position："+this.camera.position.z+"<br>X Rotation："+this.camera.rotation.x+"<br>Y Rotation："+this.camera.rotation.y+"<br>Z Rotation："+this.camera.rotation.z+"<br>X Scale："+this.camera.scale.x+"<br>Y Scale："+this.camera.scale.y+"<br>Z Scale："+this.camera.scale.z;
		}

		if(this.isFirstPersonMode()) {
			domtip.hide();
			this.movingUpdate();
		} else if(!dialog.visible) {
			this.controls.update();
		}

		this.prevTime = this.currentTime;
	}

	movingUpdate() {
		const delta = (this.currentTime - this.prevTime) / 1000.0;
		if(this.renderer.xr.isPresenting && player.hasController && player.controller) {
			let vec = new THREE.Vector3();
			vec.setFromMatrixColumn( this.camera.matrixWorld, 0 );
			vec.y = 0;
			//vec.normalize();
			let vec2 = vec.clone();
			vec.crossVectors( this.camera.up, vec);
			this.vrCamera.position.addScaledVector( vec, player.getHorizontal(player.controller) * player.speed * delta );
			this.vrCamera.position.addScaledVector( vec2, player.getVertical(player.controller) * player.speed * delta);
			return;
		}

		if(this.walkthrough.isLocked) {
			let dir = new THREE.Vector3();
			if(!this.walkthrough.desktopMode) {
				let d = VirtualPad.getVector();
				dir.z = -d.y;
				dir.x = d.x;
			} else {
				dir.z = Number(player.inputs[0]) - Number(player.inputs[2]);
				dir.x = Number(player.inputs[3]) - Number(player.inputs[1]);
			}
			dir.normalize();
			this.walkthrough.moveRight(dir.x * player.speed * delta);
			this.walkthrough.moveForward(dir.z * player.speed * delta);
		}

	}

	resetRenderer() {
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.gammaFactor = 2.2;
		this.camera.position.set(329.9886609379634,240.83169594230232,-35.899973772662483);
		//this.camera.rotation.set(-1.8099243120012465,0.7840724844004205,1.9031279561056308);
		this.camera.rotation.set(-1.7797746081524712, 0.5992171831356755, 1.930462008083521);
		this.renderer.setAnimationLoop(this.tick.bind(this));

		try {
			const moveController = this.renderer.xr.getController(player.getControllerIndex());
			moveController.addEventListener( 'connected', (evt) => {
				if(evt && evt.data ) {
					player.controller = evt.data;
				}
			});
			moveController.addEventListener( 'disconnected', (evt) => {
				player.controller = null;
			});
			player.hasController = true;
		} catch(err) {
			player.controller = null;
		}
	}

	notifySceneLoadingFinished() {
		if(this.currentScene) {
			this.currentScene.init();
		}
	}

	onMouseMove(ev) {
		if(this.currentScene) {
			this.currentScene.onMouseMove(ev);
		}
	}

	settingsChanged() {
		if(true || this.renderer.antialias != this.settings.enableAntialias) {
			let newRenderer = new THREE.WebGLRenderer({
				canvas: domCanvas,
				antialias: settings.enableAntialias
			});

			newRenderer.setClearColor(0x345CAA);
			newRenderer.setPixelRatio(1);
			newRenderer.setSize(this.width, this.height);
			newRenderer.xr.enabled = this.renderer.xr.enabled;

			newRenderer.shadowMap.enabled = this.renderer.shadowMap.enabled;
			if(debugMode)
				console.log(newRenderer);
			this.renderer.dispose();
			this.renderer = null;
			this.renderer = newRenderer;
			this.resetRenderer();
		}

		if(window.vcConfig.enableFog) {
			this.scene.fog = new THREE.Fog(0xFFFFFF, 50, 1500);
		} else {
			this.scene.fog = null;
		}
		this.renderer.shadowMap.enabled = window.vcConfig.enableShadow;

		if(this.currentScene) {
			this.currentScene.settingsChanged();
		}
	}

	canMoveOn(cam, vec, scale) {
		let vv = vec.clone();
		vv.applyQuaternion( this.camera.quaternion );
		vv.y = 0;
		//vv.normalize();
		const caster = new THREE.Raycaster(cam.position, vv, 0.01, scale+0.1);
		//const caster2 = new THREE.Raycaster(new THREE.Vector3(cam.position.x, cam.position.y-0.8, cam.position.z), vv, 0.01, scale+0.1);
		const intersects = caster.intersectObjects( this.scene.children, true);
		const intersects2 = caster.intersectObjects( this.scene.children, true);
		return intersects.length <= 0 && intersects2.length <= 0;
	}
}

class CampusScene {
	constructor() {
		this.app = null;
		this.scene = new THREE.Scene();
	}

	/**
	 * constructorの次に呼ばれます。普通、各種外部リソースの読み込みを行います
	 */
	preInit() {}
	/**
	 * preInitの読み込みの処理が完了したタイミングで呼ばれます
	 */
	init() {}
	/**
	 * 毎フレームの描画の前に呼ばれます
	 */
	update() {}
	/**
	 * 毎フレームの描画の後に呼ばれます
	 */
	postUpdate() {}

	/**
	 * マウスが移動したときに呼ばれます
	 * @param {Object} evt MouseMoveイベントのオブジェクト
	 */
	onMouseMove(evt) {}

	/**
	 * 親のVirtualCampusAppに読み込みが完了したことを通知します
	 */
	notifyLoaded() {
		if(this.app) {
			this.app.notifySceneLoadingFinished();
		}
	}

	/**
	 * 設定が変更されたときに呼ばれます。が、今はリロードが発生するので意味がありません
	 */
	settingsChanged() {}

	/**
	 * 一人称視点モードに入ったときに呼ばれます
	 * @param {boolean} isVR VRモード
	 */
	joinFirstPersonMode(isVR) {}

	/**
	 * 一人称視点モードから解除されたときに呼ばれます
	 * @param {boolean} isVR VRモード
	 */
	leaveFirstPersonMode(isVR) {}

	/**
	 * 0時を0，24時を1として、このアプリ内の時刻を返します
	 * @returns {Number} 時刻(小数) 0.0～1.0
	 */
	calcInAppTime(cycleSpeed) {
		if(!cycleSpeed) {
			cycleSpeed = settings.cycleSpeed;
		}
		const date = new Date();
		const now = (((date.getHours() * 60*60*1000 + date.getMinutes() * 60*1000+date.getSeconds() * 1000 +date.getMilliseconds()) * cycleSpeed) % 86400000) / 86400000;
		return now;
	}

}

class CampusSceneMain extends CampusScene {

	constructor() {
		super();
		this.model = null;

		this.ambientLight = null;
		this.sun = null;
		this.skyDome = null;

		this.nightWindows = [];
		this.parentMap = {};
		this.needles = [];

		this.toolTipRaycaster = new THREE.Raycaster();
		this.extendedTextures = {};
	}

	preInit() {
		const loader = new GLTFLoader();
		loader.load('model/campus.glb', (gltf) => {
			this.model = gltf.scene;
			if(debugMode)
				console.log(this.model);
			let targets = [...gltf.scene.children];

			while(targets.length > 0) {
				let child = targets.pop();
				for(let cc of child.children) {
					targets.push(cc);
				}
				if(child.name && !child.name.includes('tree') && !child.name.includes('leaf')) {
					let parent = child;
					while(parent.parent && parent.parent != this.model && (parent = parent.parent));
					this.parentMap[child.name] = parent.name;
				}
				if(child.type == "Mesh") {
					let isFloor = this.parentMap[child.name] && this.parentMap[child.name].includes('floor');
					child.receiveShadow = isFloor;
					child.castShadow = !isFloor;
				}

				if(child.type == "Mesh" && child.material) {
					child.material.side = THREE.FrontSide;
					child.material.metalness = Math.min(0.8, child.material.metalness);
					if(child.material.name.toLowerCase() == 'window') {
						this.nightWindows.push(child.material);
					}
				}
				if(child.name.startsWith("hari")) {
					this.needles.push(child);
				}
			}
			this.model.scale.y = 0.01;
			this.scene.add(gltf.scene);
			this.applyClock();
			UIKit.setProgress(1);
			UIKit.lightenScreen();
			UIKit.hideLoadingCover();
			UIKit.hideProgressBar();
			this.notifyLoaded();

		}, (error) => {
			if(!error || error.total == 0)
				return;
			const p = Math.min(1, error.loaded/(error.total+1));
			UIKit.setProgress(p);
		}, (error) => {
			console.log(error);
		});

		new RGBELoader().load( 'img/vr_background.hdr', (skyTexture) => {
			skyTexture.flipY = false;
			const sky = new THREE.Mesh( new THREE.SphereGeometry( 700, 32, 16 ), new THREE.MeshBasicMaterial( { map: skyTexture } ) );
			sky.material.side = THREE.BackSide;
			sky.scale.x = -1;
			sky.scale.y = -1;
			sky.rotation.y = Math.PI/2;
			sky.visible = false;
			this.skyDome = sky;
			this.scene.add(sky);
		});

		this.sun = new THREE.DirectionalLight(0xFFFFFF, 2);
		this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
		this.sun.position.set(0, 200, 180);
		this.scene.add(this.ambientLight);
		this.scene.add(this.sun);
	}

	init() {

		UIKit.addTapEvent(window, () => {
			if(!(!dialog.visible && tooltip.targetId != "" && toolTips[tooltip.targetId].impl == true) || !tooltip.visible || this.app.isFirstPersonMode())
				return;
			this.app.controls.enabled = false;
			if(toolTips[tooltip.targetId] && toolTips[tooltip.targetId].impl) {
				UIKit.darkenScreen();
				UIKit.showDialogFromPath(tooltip.label, `contents/${toolTips[tooltip.targetId].id}.html`);
			} else {
				UIKit.setDialogContent('');
			}

			doneFade = false;
			dialog.visible = true;
		});

	}


	update() {
		if(this.model && this.model.scale.y < 1) {
			this.model.scale.y = Math.min(1, (this.model.scale.y+.2)*(this.model.scale.y+.2)*(3-2*(this.model.scale.y+.2)));
		}
		if(settings.cycleSun) {
			this.calcSunPosition();
		} else {
			this.ambientLight.intensity = 0.6;
			this.applyClock();
		}

		// フェード処理
		if (!doneFade && domCover.css("opacity") <= 0) {
			domCover.css("display", "none");
			if(VRButton.enableVR() && !document.getElementById('VRButton')) {
				document.body.appendChild(VRButton.createButton(this.app.renderer));
			}
			doneFade = true;
		}

	}


	calcSunPosition() {
		const now = this.calcInAppTime();
		this.applyClock(now);
		const rad = (now + 0.375) * Math.PI * 2;
		this.sun.position.set(Math.cos(rad) * 200, Math.sin(rad) * -200, this.sun.position.z);
		this.ambientLight.intensity = 0.1 * now;
		if(this.nightWindows.length > 0)
			this.nightWindows[0].emissive.setHex(now < 0.25 || now > 0.75 ? 0xf4ef9b : 0x0);

		if(this.skyDome) {
			const overlay = 1.0 - (Math.max(0, Math.sin(6.2 * now + 1.6)) * 1.0);
			this.skyDome.material.color.setRGB(overlay, overlay, overlay);
		}
	}

	applyClock(now) {
		if(!now) {
			now = this.calcInAppTime(1);
		}
		for(let c of this.needles) {
			c.children[0].rotation.x = -now * Math.PI * 2 * 24;
			c.children[1].rotation.x = -now * Math.PI * 2 * 2;
		}
	}

	onMouseMove(ev) {

		if(!dialog.visible) {
			if(!(this.scene && this.app.controls) || this.app.isFirstPersonMode())
				return;

			if(ev.target && ev.target.nodeName == "IMG") {
				tooltip.visible = false;
				return;
			}
			let hit = false;
			let size = new THREE.Vector2();
			// 画面上のマウスクリック位置
			const x = ev.clientX;
			const y = ev.clientY;
			this.app.renderer.getSize(size);
			// マウスクリック位置を正規化
			let mouse = new THREE.Vector2();
			mouse.x =  ( x / size.x ) * 2 - 1;
			mouse.y = -( y / size.y ) * 2 + 1;

			// 取得したX、Y座標でrayの位置を更新
			this.toolTipRaycaster.setFromCamera( mouse, this.app.camera );
			// オブジェクトの取得
			const intersects = this.toolTipRaycaster.intersectObjects(this.scene.children, true);
			for (let i = 0; i < intersects.length; i++) {
				const parent = this.parentMap[intersects[i].object.name];
				if(parent && toolTips[parent]) {
					domtip.css("left", x).css("top", y);
					tooltip.targetId = parent;
					tooltip.label = toolTips[parent].label;
					tooltip.visible = true;
					hit = true;
					break;
				}
			}
			if (!hit) {
				tooltip.visible = false;
			}

		}

		// ツールチップ処理
		if(!this.app.isFirstPersonMode()) {
			if(tooltip.prevFrameVisible != tooltip.visible) {
				if (!tooltip.visible) {
					domtip.hide();
				}
				if (tooltip.visible && !UIKit.isMenuOpen()) {
					domtip.show();
				}

				if (tooltip.targetId && tooltip.targetId.length > 0) {
					domtipText.html("<span>" + tooltip.label + "</span>");
					domtipExpl.css("opacity", toolTips[tooltip.targetId].doc ? 1 : 0.3);
					domtipPhoto.css("opacity", toolTips[tooltip.targetId].pic ? 1: 0.3);
					domtipCopy.html(domtip.html());
					domtip.css("width", domtipCopy.css("width")).css("height", domtipCopy.css("height"));
				}
			}

			if (dialog.visible && dialog.height != domDialog.height()) {
				dialog.height = domDialog.height();
				domDialogMain.height(dialog.height - 105);
			}


		}
		tooltip.prevFrameVisible = tooltip.visible;
	}

	settingsChanged() {
		if(this.sun) {
			this.sun.castShadow = window.vcConfig.enableShadow;
			if(window.vcConfig.enableShadow) {
				this.sun.shadow.camera.right = 200;
				this.sun.shadow.camera.left = -200;
				this.sun.shadow.camera.top = -200;
				this.sun.shadow.camera.bottom = 200;
			}
		}
	}

	joinFirstPersonMode(isVR) {
		if(isVR) {
			if(this.app.camera != this.app.vrCamera)
				this.app.vrCamera.position.set(116, player.eyeHeight, -50);
		} else {
			this.app.camera.position.set(116, player.eyeHeight, -50);
		}

		this.skyDome.visible = true;
	}

	leaveFirstPersonMode(isVR) {
		if(isVR) {
			this.app.vrCamera.position.set(0, 0, 0);
		}
		this.skyDome.visible = false;
	}

}

class UIController {
	constructor(app) {
		this.app = app;	// parent
		this.clientWidth = 0;

		window.openSettings = this.openSettings.bind(this);
		window.toggleDebugWindow = this.toggleDebugWindow;
		window.openMenu = this.openMobileMenu.bind(this);
		window.closeMenu = this.closeMobileMenu.bind(this);
		window.changeVRMode = this.openVRMode.bind(this);
		window.closeVRMode = this.closeVRMode.bind(this);
		window.openHelp = this.openHelp.bind(this);
		window.closeDialog = this.closeDialog.bind(this);

		document.addEventListener('keydown', (evt) => this.keyCheck(evt, true), false );
		document.addEventListener('keyup', (evt) => this.keyCheck(evt, false), false );

		this.init();

	}

	init() {
		this.changeInstImage();
	}

	changeInstImage() {
		const ua = navigator.userAgent;
		if (ua.indexOf('iPhone') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0) {
			$("#inst_box").attr("src","img/inst_s.svg");
		} else if (ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0) {
			$("#inst_box").attr("src","img/inst_s.svg");
		} else {
			$("#inst_box").attr("src","img/inst.svg");
		}
	}

	tick() {
		if (this.clientWidth != document.body.clientWidth) {
			this.clientWidth = document.body.clientWidth;
			if (this.clientWidth > 1098) {
				$("#menu").show();
				$("#mobile_menu").hide();
				$("#mobile_menu_nt").hide();
			} else if (this.clientWidth <= 1098 && this.clientWidth > 598) {
				$("#menu").hide();
				$("#mobile_menu").show();
				$("#mobile_menu_nt").hide();
			} else if (this.clientWidth <= 598) {
				$("#menu").hide();
				$("#mobile_menu").hide();
				$("#mobile_menu_nt").show();
			}
		}
	}

	leaveFirstPersonMode(isVR) {
		this.showNormalUI();
	}

	showNormalUI() {
		$("#header").fadeIn(500);
		if (this.clientWidth > 1098) {
			$("#menu").fadeIn(500);
		} else if (this.clientWidth <= 1098 && this.clientWidth > 598) {
			$("#mobile_menu").fadeIn(500);
		} else if (this.clientWidth <= 598) {
			$("#mobile_menu_nt").fadeIn(500);
		}
		if (this.clientWidth > 598) {
			$("#inst_box").fadeIn(500);
		}
		$("#vr_menu").fadeOut(500);
		$("#vr_mode").hide(500);
		$("#VRButton").show(500);
	}


	openSettings() {
		this.closeMobileMenu();
		this.app.controls.enabled = false;
		UIKit.darkenScreen();
		UIKit.showDialogFromPath("設定", "contents/settings.html", ()=>{
			for(let key of Object.keys(window.vcConfig)) {
				if(typeof(window.vcConfig[key]) == 'boolean') {
					const elem = $("#chkbox" + key);
					if(elem.length > 0) {
						elem.attr("checked", window.vcConfig[key]).prop("checked", window.vcConfig[key]).change();
					}
				} else if(typeof(window.vcConfig[key]) == 'number') {
					const elem = $("#number" + key);
					if(elem.length > 0) {
						elem.attr("value", window.vcConfig[key]).change();
					}
				}
			}
		});
		doneFade = false;
		dialog.visible = true;
	}

	toggleDebugWindow() {
		$("#debug").slideToggle(500);
	}

	// モバイル用メニューの表示
	openMobileMenu() {
		UIKit.setMenuOpen(true);
		this.app.controls.enabled = false;
		$(".cover-mobile-menu").fadeIn(250);
		$("#mobile_menubar").css("left", "calc(100% - 300px)");
	}

	// モバイル用メニューを閉じる
	closeMobileMenu() {
		UIKit.setMenuOpen(false);
		this.app.controls.enabled = true;
		$("#mobile_menubar").css("left", "100%");
		$(".cover-mobile-menu").fadeOut(250);
	}

	// VRモードへ切り替え
	openVRMode() {
		this.closeMobileMenu();
		player.birdPos = this.app.camera.position;
		player.birdMatrix = this.app.camera.matrixWorld;
		this.app.walkthrough.lock();
		$("#header").fadeOut(500);
		$("#menu").fadeOut(500);
		$("#mobile_menu").fadeOut(500);
		$("#mobile_menu_nt").fadeOut(500);
		$("#inst_box").fadeOut(500);
		$("#vr_menu").fadeIn(500);
		if (this.clientWidth > 598) {
			$("#vr_mode").show(500);
		}
		$("#VRButton").hide(500);
	}

	// VRモードの終了
	closeVRMode() {
		this.app.walkthrough.unlock();
		this.showNormalUI();
	}

	// 操作説明の表示
	openHelp() {
		this.closeMobileMenu();
		this.app.controls.enabled = false;
		UIKit.darkenScreen();
		UIKit.showDialogFromPath("操作説明", "contents/help.html");
		doneFade = false;
		dialog.visible = true;
	}

	// ダイアログを閉じる
	closeDialog() {
		if (!dialog.visible) return false;
		// 設定画面の処理
		if ($("#dialog_title").text() == "設定") {
			for(let key of Object.keys(window.vcConfig)) {
				if(typeof(window.vcConfig[key]) == 'boolean') {
					const elem = $("#chkbox" + key);
					if(elem.length > 0) {
						window.vcConfig[key] = elem.prop("checked");
					}
				} else if(typeof(window.vcConfig[key]) == 'number') {
					const elem = $("#number" + key);
					if(elem.length > 0) {
						window.vcConfig[key] = parseInt(elem.val());
					}
				}
			}
			localStorage.setItem("settings", JSON.stringify(window.vcConfig));
			location.reload();
		}
		// ここまで
		if ($("video")[0]) $("video")[0].pause();
		dialog.visible = false;

		UIKit.lightenScreen();
		UIKit.hideDialog();
		this.app.controls.enabled = true;
	}

	keyCheck(evt, val) {
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
			case 112:
				if(!val && this.app.isFirstPersonMode()) {
					$('#vr_mode').toggle();
				}
				break;
		}
	}

}

class UIKit {
	static getInstance() {
		return uikitInstance;
	}

	constructor() {
		this.domProgressBar = $("#progressbar-front");
		this.isMenuOpen = false;
	}

	static init() {
		$(window).on('touchmove.noScroll', function(e) {
			e.preventDefault();
		});
	}

	static showProgressBar() {
		UIKit.getInstance().domProgressBar.show();
		$("#progressbar").show();
	}

	static hideProgressBar() {
		UIKit.getInstance().domProgressBar.hide();
		$("#progressbar").hide();
	}

	static isMenuOpen() {
		return UIKit.getInstance().isMenuOpen;
	}

	static setMenuOpen(isOpen) {
		UIKit.getInstance().isMenuOpen = isOpen;
	}

	static messageException() {
		$('#cover_loading').hide(100);
		$('#progressbar').hide(100);
		$('#cover').delay(100).html('<p style="color:white;font-size:1.5em;">ご利用の環境では、本コンテンツを利用できません。</p>');
	}

	static hideVRInstruction() {
		$('#inst_vr').css('display', 'none');
	}

	static hideLoadingCover() {
		$("#cover_loading").hide();
	}

	/**
	 * プログレスバーの値を設定します
	 * @param {number} p 進捗度 0.0 ~ 1.0
	 */
	static setProgress(p) {
		UIKit.getInstance().domProgressBar.css('transform', `scaleX(${p})`);
	}

	/**
	 * Pathの内容を読み込んでダイアログを表示します
	 * @param {string} title タイトル
	 * @param {string} path 読み込むファイルパス
	 */
	static showDialogFromPath(title, path, callback) {
		$("#dialog_title").text(title);
		const dom = $("#dialog_main");
		dom.html("読み込み中。しばらくお待ち下さい...");
		dom.load(path, () => {
			if(callback)
				callback();
			domDialog.show(500);
		});
	}

	static setDialogContent(innerHtml) {
		$("#dialog_main").html(innerHtml);
	}

	static hideDialog() {
		domtip.css("opacity", 1);
		$("#cover_loading").hide();
		$("#dialog").hide(500);
	}
	/**
	 * 画面を暗くします
	 */
	static darkenScreen() {
		$("#cover").css("display", "block").css("opacity", 0.3);
	}

	/**
	 * 画面を明るくします
	 */
	static lightenScreen() {
		$("#cover").css("opacity", 0);
	}

	static addTapEvent(dom, callback) {
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


}
const uikitInstance = new UIKit();


const app = new VirtualCampusApp();
document.addEventListener('DOMContentLoaded', () => {
	app.init();
});
app.main();
