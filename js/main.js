/*
静岡大学 バーチャル情報学部 試作品
Rev. 4 (2020-06-19)

(c) 2020 Shizuoka University all rights reserved.
Developed by Shizuoka University xR Association "Hamaria"
*/

var controls;
var html = "";
var mouse = { x: 0, y: 0 };
var targetList = [];
var renderer, scene, camera;
window.addEventListener('DOMContentLoaded', init);

function init() {
	// レンダラーを作成
	renderer = new THREE.WebGLRenderer({
		canvas: document.querySelector('#canvas'),
		antialias: true
	});
	width = window.innerWidth;
	height = window.innerHeight;
	renderer.setClearColor(0x5C65BB);
	renderer.setPixelRatio(1);
	renderer.setSize(width, height);

	// シーンを作成
	scene = new THREE.Scene();

	// カメラを作成
	camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000);
	camera.position.set(0, 2000, 40000);
	const controls = new THREE.OrbitControls(camera);

	const loader = new THREE.GLTFLoader();
	
	// 全体モデル
	let model = null;
	loader.load(
		'model/Except_Inf2.glb',
		function (gltf) {
			model = gltf.scene;
			model.scale.set(100,100,100);
			model.position.set(0, -400, 0);
			scene.add(gltf.scene);
		},
		function (error) {
			console.log(error);
		}
	);
	
	// 情報学部2号館
	let inf2 = null;
	loader.load(
		'model/inf2_v2.glb',
		function (gltf) {
			inf2 = gltf.scene;
			inf2.scale.set(100,100,100);
			inf2.position.set(0, -400, 0);
			scene.add(gltf.scene);
			targetList.push(inf2);
		},
		function (error) {
			console.log(error);
		}
	);
	
	renderer.gammaOutput = true;
	renderer.gammaFactor = 2.2;

    // 平行光源
	const light = new THREE.DirectionalLight(0xFFFFFF);
	light.intensity = 2; // 光の強さを倍に
	light.position.set(1, 1, 1);
	scene.add(light);
	camera.position.set(32998.86609379634,23683.169594230232,-3589.9973772662483);
	camera.rotation.set(-1.8099243120012465,0.7840724844004205,1.9031279561056308)
	tick();
	
	function tick() {
		/*
		if (model != null) {
			console.log(model);
		}
		*/
		controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(tick);
		html = "[Camera Parameter for Debug]<br>X Position："+camera.position.x+"<br>Y Position："+camera.position.y+"<br>Z Position："+camera.position.z+"<br>X Rotation："+camera.rotation.x+"<br>Y Rotation："+camera.rotation.y+"<br>Z Rotation："+camera.rotation.z+"<br>X Scale："+camera.scale.x+"<br>Y Scale："+camera.scale.y+"<br>Z Scale："+camera.scale.z
		$("#debug").html(html);
	}
}

window.onmouseup = function (ev){
	var a = 0;
	
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
		if (intersects[i].object.name == "Info_2_0" || intersects[i].object.name == "Info_2_1") {
			if (a == 0){
				a = 1;
				alert("情報学部2号館がクリックされました");
			}
		}
		//alert(intersects[i].object.name);
	}
}