import $ from "jquery";
import * as THREE from './build/three.module.js';
import {
    RGBELoader
} from './jsm/loaders/RGBELoader.js';
import {
    GLTFLoader
} from './jsm/loaders/GLTFLoader';
import {
    EffectComposer
} from './jsm/postprocessing/EffectComposer.js';
import {
    RenderPass
} from './jsm/postprocessing/RenderPass.js';
import {
    ShaderPass
} from './jsm/postprocessing/ShaderPass.js';
import {
    OutlinePass
} from './jsm/postprocessing/OutlinePass.js';
import {
    FXAAShader
} from './jsm/shaders/FXAAShader.js';
import {
    TWEEN
} from './jsm/Tween.js';
import {
    OrbitControls
} from './jsm/controls/OrbitControls.js';
import {
    render
} from "@testing-library/react";
import {
    DRACOLoader
} from './jsm/loaders/DRACOLoader.js';

let camera, scene, renderer, envMap, mesh360, furniture = [],
    furnitureSelected, circle;
var controls, antialias = true,
    pixel = 1;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var targetRotationX = 0.725;
var targetRotationOnMouseDownX = 0;
var targetRotationY = -0.19;
var targetRotationOnMouseDownY = 0;
var mouseX = 0;
var mouseXOnMouseDown = 0;
var mouseY = 0;
var mouse = {
    x: 0,
    y: 0
};
var mouseYOnMouseDown = 0;
var blocked_bottom = false,
    blocked_top = false,
    finalRotationY, raycaster = new THREE.Raycaster(),
    mobile = false;
let composer, effectFXAA, outlinePass, deltaX2, touchX2, objectsSelected = [];
var objectSelected, objectsInFront = [],
    looking = false,
    drag = false,
    scene3d, fov = 45,
    wall;

$(document).ready(function () {

    //CHECK IF IS RUNNING ON MOBILE
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        mobile = true;
        // THIS WILL HELP IMPROVE PERFORMANCE
        pixel = 2;
        antialias = false;
        fov = 60;
        //MAKE UI RESPONSIVE ON MOBILE DEVICES
        $("#sidebar").css("width", "100vw");
        $(".bodyText p").css("font-size", "3.5vw");
        $(".bodyText").css("padding", "30px");
        $("#sidebar h1").css("padding", "30px");
        $(".close").css("padding", "30px");
        $(".info").css("padding", "30px");
        $(".info").css("width", "40px");
        $(".info").css("height", "40px");
        $(".two").css("left", "10px");
        $(".two").css("top", "75px");
        $("#product-title").css("font-size", "20px");
        $("#product-description").css("font-size", "10px");
        $(".two").css("transform", "none");
    }

    var currentMap = 0,
        currentNormalMap = 0;

    var matMap = [],
        matNormal = [];

    loadMap();
    loadNormalMap();

    function loadMap() {
        // instantiate a loader
        var loaderT = new THREE.TextureLoader();
        console.log('walls/' + currentMap + '_Color.jpg')
        // load a resource
        loaderT.load(
            // resource URL
            'walls/' + currentMap + '_Color.jpg',

            // onLoad callback
            function (map) {
                // in this example we create the material when the texture is loaded
                map.wrapS = THREE.RepeatWrapping;
                map.wrapT = THREE.RepeatWrapping;
                matMap.push(map);

                if (currentMap < 4) {
                    currentMap++;
                    loadMap();
                }
            },

            // onProgress callback currently not supported
            undefined,

            // onError callback
            function (err) {
                console.error('An error happened.');
            }
        );
    }

    function loadNormalMap() {
        // instantiate a loader
        var loaderN = new THREE.TextureLoader();

        // load a resource
        loaderN.load(
            // resource URL
            'walls/' + currentNormalMap + '_Normal.jpg',

            // onLoad callback
            function (map) {
                // in this example we create the material when the texture is loaded
                map.wrapS = THREE.RepeatWrapping;
                map.wrapT = THREE.RepeatWrapping;
                matNormal.push(map);

                if (currentNormalMap < 4) {
                    currentNormalMap++;
                    loadNormalMap();
                }
            },

            // onProgress callback currently not supported
            undefined,

            // onError callback
            function (err) {
                console.error('An error happened.');
            }
        );
    }

    $('body').on('click touchstart', '.option', function () {
        wall.material.map = null;
        wall.material.normalMap = null;
        wall.material.map = matMap[$(this).data("id")];
        wall.material.normalMap = matNormal[$(this).data("id")];
        wall.material.needsUpdate = true;
    })

    init(); //INITIATE THE EXPERIENCE

    function init() {

        //CANVAS
        const container = document.getElementById('viewer-3d');

        //SCENE SETUP
        scene = new THREE.Scene();
        console.log(scene)
        scene.frustumCulled = false;

        //CAMERA SETUP
        camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.01, 2000);
        camera.position.set(3.9, 1.5, 2.4);
        camera.rotation.order = 'YXZ';

        // 360 SPHERE OF THE EXTERIOR
        var geometry360 = new THREE.SphereGeometry(25, 25, 25);
        geometry360.scale(1, 1, -1);
        var texture362 = new THREE.TextureLoader().load('/autumn_park2.jpg'); //EXTERIOR PANORAMA IMAGE https://polyhaven.com/hdris
        texture362.encoding = THREE.sRGBEncoding;
        var material360 = new THREE.MeshBasicMaterial({
            map: texture362
        });
        mesh360 = new THREE.Mesh(geometry360, material360);
        mesh360.scale.set(0.5, 0.5, 0.5);
        mesh360.position.y = 1;
        scene.add(mesh360);

        // LIGHTS
        // White directional light at half intensity shining from the top.
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        directionalLight.castShadow = true;
        directionalLight.position.y = 3;
        //if (mobile)
        //    directionalLight.shadow.normalBias = 0.1;
        if (!mobile)
            scene.add(directionalLight);

        const light = new THREE.AmbientLight(0x404040); // soft white light
        light.intensity = 3;
        scene.add(light);

        //RENDERER
        renderer = new THREE.WebGLRenderer({
            antialias: antialias
        });
        renderer.setPixelRatio(window.devicePixelRatio / pixel);
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (mobile)
            renderer.shadowMap.enabled = false;
        else
            renderer.shadowMap.enabled = true;
        renderer.physicallyCorrectLights = true;
        renderer.toneMapping = 4;
        renderer.domElement.id = "canvas-3d";
        renderer.domElement.style.position = "absolute";
        container.appendChild(renderer.domElement);

        var pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        // HDRI
        new RGBELoader()
            .setDataType(THREE.UnsignedByteType)
            .setPath('')
            .load('photo_studio_01_1k.hdr', function (texture2) { // https://polyhaven.com/hdris
                envMap = pmremGenerator.fromEquirectangular(texture2).texture;
                scene.environment = envMap;
                texture2.dispose();
                pmremGenerator.dispose();
            });

        // LOADER SCENE

        const manager = new THREE.LoadingManager();
        manager.onStart = function (url, itemsLoaded, itemsTotal) {};
        manager.onLoad = function () {
            $("#loading").css("opacity", "0");
            $("#loading").css("pointer-events", "none");
        };
        manager.onProgress = function (url, itemsLoaded, itemsTotal) {};
        manager.onError = function (url) {};

        // model
        const draco = new DRACOLoader();
        draco.setDecoderConfig({
            type: 'js'
        });
        draco.setDecoderPath('draco/');

        var loader = new GLTFLoader(manager);
        loader.setDRACOLoader(draco);
        loader.load(
            // resource URL
            '/Furniture/scene4.glb',
            // called when the resource is loaded
            function (gltf) {

                gltf.scene.traverse(function (child) {
                    //ADD ROUGHNESS TO THE FLOOR
                    if (child.name == "SM_Floor_5") {
                        child.material.roughness = 0.25;
                    } else if (child.name == "UCX_SM_DoorFrame_Inner") {
                        child.position.x = 17.25;
                    }
                    //SHADOWS SETUP
                    child.receiveShadow = true;
                    child.castShadow = true;
                    // FURNITURE BRIGHTNESS
                    if (child.material) {
                        child.frustumCulled = false;
                        child.material.transparent = true;
                        var material2 = child.material.clone();
                        child.material = material2;
                        // if (child.parent.parent.name == "furniture") {
                        //     child.material.envMapIntensity = 4;
                        // } else
                        //     child.material.envMapIntensity = 1.5;
                        // MAKE THE WINDOWS TRANSPARENT
                        if (child.material.name == "Material.008" || child.material.name == "Material.016" || child.material.name == "Material.009") {
                            child.material = new THREE.MeshBasicMaterial();
                            child.material.transparent = true;
                            child.material.opacity = 0.24;
                        }

                        if (child.name == "SM_Wall_Front") {
                            wall = child;
                        }

                        if (child.material.map) {
                            child.material.map.encoding = THREE.sRGBEncoding;
                        }
                    }
                })

                scene.add(gltf.scene);
                furniture.push(gltf.scene);
                scene3d = gltf.scene;
            },
            // called while loading is progressing
            function (xhr) {
                document.getElementById("txt-loading").textContent = parseInt(xhr.loaded / xhr.total * 100) + "%";
            }
        );

        // POSTPROCESSING FOR THE OUTLINE HOVER EFFECT

        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        //OUTLINE EFFECT WHEN HOVER
        outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
        outlinePass.edgeStrength = 3;
        outlinePass.edgeGlow = 0;
        outlinePass.edgeThickness = 1;
        outlinePass.pulsePeriod = 0;
        outlinePass.visibleEdgeColor.set('#ffffff');
        outlinePass.hiddenEdgeColor.set('#190a05');
        composer.addPass(outlinePass);

        //ANTIALISING WHEN USING POST PROCESSING
        effectFXAA = new ShaderPass(FXAAShader);
        effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        composer.addPass(effectFXAA);

        //CIRCLE WHEN MOUSE HOVER ON THE FLOOR
        const map = new THREE.TextureLoader().load('textures/circle.png');
        const geometry = new THREE.PlaneGeometry(0.6, 0.6);
        const material = new THREE.MeshBasicMaterial({
            map: map,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            polygonOffsetFactor: -1,
            polygonOffset: true
        });
        circle = new THREE.Mesh(geometry, material);
        circle.rotation.x = Math.PI / 2;
        scene.add(circle);

        //ORBIT CONTROLS
        controls = new OrbitControls(camera, renderer.domElement);
        controls.autoRotate = false;
        controls.enableZoom = false;
        controls.enableRotate = true;
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.autoRotateSpeed = 0.75;
        controls.minDistance = 1.6;
        controls.enabled = false;

        window.addEventListener('resize', onWindowResize);
        renderer.domElement.addEventListener('touchstart', onDocumentTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onDocumentTouchMove, false);
        renderer.domElement.addEventListener('touchend', onDocumentTouchEnd, false);
        if (!mobile) {
            renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
            renderer.domElement.addEventListener('mousemove', raycastHover, false);
        }

        animate(); // INITIATE THE RENDER CICLE
    }

    // Listen for orientation changes
    window.addEventListener("orientationchange", function () {
        checkOrientation();
        onWindowResize()
    }, false);

    function checkOrientation() {
        if (window.orientation == 90 || window.orientation == -90) { //landscape
            if ($("#sidebar").css("right") != "0px") {
                $("#sidebar").css("right", -window.innerHeight + "px");
            }
        } else {
            if ($("#sidebar").css("right") != "0px") {
                $("#sidebar").css("right", -window.innerWidth + "px");
            }
        }
    }

    window['stopAutoRotation'] = function () {
        if (controls.autoRotate)
            controls.autoRotate = false;
    }

    // THE FUNCTON BELOW HANDLEs THE OBJECT HOVER

    function raycastHover(e) {
        e.preventDefault();
        //1. sets the mouse position with a coordinate system where the center
        //   of the screen is the origin
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        //2. set the picking ray from the camera position and mouse coordinates
        raycaster.setFromCamera(mouse, camera);

        //3. compute intersections
        var intersects = raycaster.intersectObjects(furniture, true);
        if (intersects.length > 0) {
            for (var j = intersects.length - 1; j > -1; j--) {
                if (intersects[j].object != objectSelected) {
                    if (intersects[j].object.parent.parent.name == "furniture" || intersects[j].object.name == "SM_Wall_Front") {
                        if (furnitureSelected != intersects[j].object) {
                            furnitureSelected = intersects[j].object;
                            addSelectedObject(furnitureSelected.parent);
                            outlinePass.selectedObjects = objectsSelected;
                        } else {
                            document.body.style.cursor = "pointer";
                        }
                        circle.visible = false;
                    } else {
                        if (furnitureSelected) {
                            outlinePass.selectedObjects = [];
                            furnitureSelected = null;
                            objectsSelected = [];
                        }
                        if (intersects[j].object.parent.name == "ground") {
                            document.body.style.cursor = "pointer";
                            circle.visible = true;
                            circle.position.set(intersects[j].point.x, intersects[j].point.y + 0.015, intersects[j].point.z);
                        } else {
                            document.body.style.cursor = "grab";
                            circle.visible = false;
                        }
                    }
                }
            }
        } else {
            if (furnitureSelected) {
                outlinePass.selectedObjects = [];
                furnitureSelected = null;
                objectsSelected = [];
            }
            document.body.style.cursor = "grab";
            circle.visible = false;
        }
    }

    function raycastToHideObjects() {

        raycaster.setFromCamera(new THREE.Vector2(-0.1, 0), camera);

        var intersects = raycaster.intersectObjects(furniture, true);
        if (intersects.length > 0) {
            for (var j = intersects.length - 1; j > -1; j--) {
                if (intersects[j].distance < 1.25) {
                    if (objectSelected != intersects[j].object) {

                        objectsInFront.push(intersects[j].object);
                        intersects[j].object.material.depthTest = false;
                        intersects[j].object.material.opacity = 0.25;
                    }
                }
            }
        }

        scene3d.traverse(function (child) {
            if (child.material) {
                if (child.material.opacity == 0.25) {
                    if (!objectsInFront.includes(child)) {
                        if (child.material.name != "Material.008" && child.material.name != "Material.016") {

                            child.material.opacity = 1;
                            child.material.depthTest = true;
                        }
                    }
                }
            }
        });

        objectsInFront = [];
    }

    // THE FUNCTON BELOW HANDLES THE OBJECT SELECTION
    var navigating = false;

    function raycastSelect(event) {
        if (!navigating) {
            event.preventDefault();
            //1. sets the mouse position with a coordinate system where the center
            //   of the screen is the origin
            if (mobile) {
                mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
            } else {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            }

            //2. set the picking ray from the camera position and mouse coordinates
            raycaster.setFromCamera(mouse, camera);

            //3. compute intersections
            var intersects = raycaster.intersectObjects(furniture, true);
            if (intersects.length > 0) {
                for (var j = 0; j < intersects.length; j++) {
                    if (intersects[j].object.material.name != "ground") {

                        if (looking) {
                            looking = false;
                            controls.enabled = false;
                        }

                        if (intersects[j].object != objectSelected) {
                            // THE CODE BELOW HANDLES THE CAMERA POSITION FOR EACH OBJECT IN THE SCENE

                            if (intersects[j].object.parent.name == "Dalian_Velvet_Sofa_Pale_Green_Blackglb") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(-3.224, 0.772, -1.145), new THREE.Vector3(-0.267, 0.471, 0),
                                    "Dalian_Velvet_Sofa_Pale_Green_Black", "Lorem ipsum dolor sit amet");
                                break;
                            } else if (intersects[j].object.parent.name == "Dalian_Velvet_Sofa_Pale_Green_Blackglb_1") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(-2.668, 1.031, -1.087), new THREE.Vector3(-0.439, 0.143, 0),
                                    "Dalian_Velvet_Sofa_Pale_Green_Black", "Lorem ipsum dolor sit amet")
                                break;
                            } else if (intersects[j].object.parent.name == "Dalian_Velvet_Sofa_Pale_Green_Blackglb_2") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(-3.641, 1.195, -0.793), new THREE.Vector3(-0.555, 1.104, 0),
                                    "Dalian_Velvet_Sofa_Pale_Green_Black", "Lorem ipsum dolor sit amet")
                                break;
                            } else if (intersects[j].object.parent.name == "Dalian_Velvet_Sofa_Pale_Green_Blackglb_3") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(-3.088, 0.778, -0.439), new THREE.Vector3(-0.270, -0.893, 0),
                                    "Dalian_Velvet_Sofa_Pale_Green_Black", "Lorem ipsum dolor sit amet")
                                break;
                            } else if (intersects[j].object.parent.name == "DalianCenterTable_Blackglb") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(-2.598, 0.894, -0.231), new THREE.Vector3(-0.432, 0.574, 0),
                                    "DalianCenterTable_Black", "Lorem ipsum dolor sit amet")
                                break;
                            } else if (intersects[j].object.parent.name == "NavigliDiningChair_Blackglb") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(-0.206, 0.990, -0.955), new THREE.Vector3(-0.38, -0.919, 0),
                                    "NavigliDiningChair_Black", "Lorem ipsum dolor sit amet")
                                break;
                            } else if (intersects[j].object.parent.name == "ElginStudyTable_Blackglb") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(2.257, 0.858, -1.670), new THREE.Vector3(-0.251, 0.854, 0),
                                    "ElginStudyTable_Black", "Lorem ipsum dolor sit amet")
                                break;
                            } else if (intersects[j].object.parent.name == "AshevilleOfficeChair_Blackglb") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(2.772, 1.370, 0.341), new THREE.Vector3(-0.609, -0.062, 0),
                                    "AshevilleOfficeChair_Black", "Lorem ipsum dolor sit amet")
                                break;
                            } else if (intersects[j].object.name == "SM_Wall_Front") {
                                objectSelected = intersects[j].object;
                                cameraTransition(intersects[j].object, new THREE.Vector3(-2.582, 1.5, 0.276), new THREE.Vector3(-0.084, -1.54, 0),
                                    "Wall", "Lorem ipsum dolor sit amet")
                                break;
                            }
                        }
                    } else {
                        $("#texture-picker").css("display", "none");
                        circle.visible = true;
                        $(".two").css("opacity", 0);
                        tweenCamera(200, circle.scale, new THREE.Vector3(1.25, 1.25, 1.25));
                        tweenCamera(200, circle.material, {
                            opacity: 0.25
                        });

                        setTimeout(function () {
                            tweenCamera(200, circle.scale, new THREE.Vector3(1, 1, 1));
                            tweenCamera(200, circle.material, {
                                opacity: 1
                            });
                        }, 200);

                        if (!navigating) {
                            targetRotationX = camera.rotation.y;
                            targetRotationY = camera.rotation.x;
                            looking = false;
                            controls.enabled = false;
                            objectSelected = null;
                            tweenCamera(1500, camera.position, new THREE.Vector3(intersects[j].point.x, 1.5, intersects[j].point.z));
                        }
                    }
                }
            }
        }
    }

    function cameraTransition(object, position, rotation, productName, productDescription) {

        if (productName != "Wall")
            $("#texture-picker").css("display", "none");
        else
            $("#texture-picker").css("display", "flex");

        $("#product-title").text("");
        $("#product-title").append(productName + ' <span id="product-description">' + productDescription + '</span>');
        $(".two").css("opacity", 1);

        tweenCamera(1000, camera.position, position);
        tweenCamera(1000, camera.rotation, rotation);
        looking = true;
        navigating = true;

        setTimeout(function () {

            if (looking && productName != "Wall") {
                var bb = new THREE.Box3();
                bb.setFromObject(object);
                bb.getCenter(controls.target);
                controls.enabled = true;
                controls.autoRotate = true;
            } else {
                targetRotationX = camera.rotation.y;
                targetRotationY = camera.rotation.x;
                looking = false;
            }

            setTimeout(function () {
                navigating = false;
            }, 100);
        }, 1000);
    }

    // ADD SELECTED OBJECT TO RECEIVE THE OUTLINE EFFECT

    function addSelectedObject(object) {
        objectsSelected = [];
        for (var i = 0; i < object.children.length; i++)
            objectsSelected.push(object.children[i]);
    }

    // MAKE THE CANVAS RESPONSIVE

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        render()
    }

    //THE CODE BELOW HANDLES THE SMOOTH CONTROLLER ROTATION

    function onDocumentTouchStart(event) {

        event.preventDefault();

        mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
        targetRotationOnMouseDownX = targetRotationX;

        mouseYOnMouseDown = event.touches[0].pageY - windowHalfY;
        targetRotationOnMouseDownY = targetRotationY;

        if (controls.autoRotate) {
            controls.autoRotate = false;
        }

        drag = false;
    }

    function onDocumentTouchMove(event) {

        event.preventDefault();

        mouseX = event.touches[0].pageX - windowHalfX;
        targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * 0.005;

        mouseY = event.touches[0].pageY - windowHalfY;
        deltaX2 = event.touches[0].pageY - touchX2;
        touchX2 = event.touches[0].pageY;

        if (deltaX2 < 0) {
            if (!blocked_bottom) {
                targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * 0.005;
            }
        } else {
            if (!blocked_top) {
                targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * 0.005;
            }
        }

        drag = true;
    }

    function onDocumentTouchEnd(event) {
        if (!drag) {
            raycastSelect(event);
        }
    }

    function onDocumentMouseDown(event) {
        event.preventDefault();

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        document.addEventListener('mouseout', onDocumentMouseOut, false);

        mouseXOnMouseDown = event.clientX - windowHalfX;
        targetRotationOnMouseDownX = targetRotationX;

        mouseYOnMouseDown = event.clientY - windowHalfY;
        targetRotationOnMouseDownY = targetRotationY;

        drag = false;
    }

    function onDocumentMouseMove(event) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;

        if (event.movementY < 0) {
            if (!blocked_bottom) {
                targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (0.005);
            }
        } else {
            if (!blocked_top) {
                targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (0.005);
            }
        }

        targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * (0.005);
        drag = true;
    }

    function onDocumentMouseUp(event) {
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
        document.removeEventListener('mouseout', onDocumentMouseOut, false);

        if (!drag && !mobile) {
            raycastSelect(event);
        }
    }

    function onDocumentMouseOut(event) {
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
        document.removeEventListener('mouseout', onDocumentMouseOut, false);
    }

    // RENDER LOOP

    function animate() {

        requestAnimationFrame(animate);

        //THERE IS NO NEED FOR THE OUTLINE POST PROCESSING EFFECT ON MOBILE DEVICES

        if (mobile)
            renderer.render(scene, camera);
        else
            composer.render();

        TWEEN.update();

        // CAMERA ROTATION CONTROLLER

        if (!navigating) {
            if (!looking) {
                //horizontal rotation   
                camera.rotation.y += (targetRotationX - camera.rotation.y) * 0.1;

                //vertical rotation 
                finalRotationY = (targetRotationY - camera.rotation.x);

                if (camera.rotation.x <= 1 && camera.rotation.x >= -1) {
                    camera.rotation.x += finalRotationY * 0.1;
                }

                if (camera.rotation.x > 1) {
                    blocked_top = true;
                    camera.rotation.x = 1
                } else
                    blocked_top = false;

                if (camera.rotation.x < -1) {
                    blocked_bottom = true;
                    camera.rotation.x = -1
                } else
                    blocked_bottom = false;
            } else {
                raycastToHideObjects();
            }

            // ENABLE ORBIT CONTROLS WHEN THE OBJECT IS SELECTED
            if (controls.enabled)
                controls.update();
        }
    }

    window["mouseUp"] = function (event) {
        if (!mobile) {
            raycastSelect(event);

            setTimeout(function () {
                scene3d.traverse(function (child) {
                    if (child.material)
                        child.visible = true;
                });
            }, 500);
        }
    }

    window["touchmove"] = function (event) {
        drag = true;
    }

    window["touchstart"] = function (event) {
        drag = false;
    }

    window["touchend"] = function (event) {
        if (!drag) {
            raycastSelect(event);
        }
    }

    // TWEEN CAMERA TRANSITION FUNCTION POINT TO POINT

    function tweenCamera(duration, ini, final) {
        new TWEEN.Tween(ini).to(final, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }

    // CLICK UI EVENTS
    $('body').on('touchstart click', '.close, .info', function () {

        if (window.orientation == 90 || window.orientation == -90) { //landscape
            if ($("#sidebar").css("right") == "0px") {
                $("#sidebar").css("right", -window.innerWidth + "px");
            } else {
                $("#sidebar").css("right", "0px");
            }
        } else {
            if ($("#sidebar").css("right") == "0px") {
                $("#sidebar").css("right", -window.innerHeight + "px");
            } else {
                $("#sidebar").css("right", "0px");
            }
        }

        console.log(camera.position)
        console.log(camera.rotation)
    });
});