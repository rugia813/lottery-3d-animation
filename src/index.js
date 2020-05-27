import * as THREE from "three";
import * as CANNON from "cannon";
import { Ball } from "./Ball";
export let world, scene, camera, renderer
export let atLeft = true
const timeStep = 1.0 / 60.0

const balls = []

function init() {
    initGraphics()
    initPhysics()
    createBalls()
}

function createBalls() {
    for (let i = 0; i <= 60; i++) {
        setTimeout(() => {
            balls.push(new Ball(scene, world))
            balls.push(new Ball(scene, world))
        }, 100 * i);
    }
}

function initGraphics() {
    scene = new THREE.Scene()
  
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(20, 20, 20)
    camera.lookAt(scene.position)

    renderer = new THREE.WebGLRenderer()
    renderer.setClearColor(0xeeeeee, 1.0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = 2
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    
    let ambientLight = new THREE.AmbientLight(0x404040, 4)
    scene.add(ambientLight)
    let spotLight = new THREE.SpotLight(0x999999)
    spotLight.position.set(-10, 30, 20)
    scene.add(spotLight)
    let pointLight = new THREE.PointLight(0xccffcc, 4, 30)
    pointLight.castShadow = true
    pointLight.position.set(0, 10, 0)
    scene.add(pointLight)

    let groundGeometry = new THREE.PlaneGeometry(200, 200, 32)
    let groundMaterial = new THREE.MeshLambertMaterial({
      color: 0xa5a5a5,
      side: THREE.DoubleSide
    })
    let ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    
    // 球網格
    // let sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
    // let sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x33aaaa })
    // sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    // sphere.castShadow = true
    // scene.add(sphere)

    var axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
}

function initPhysics() {
    world = new CANNON.World()
    world.gravity.set(0, -9.8, 0)
    world.broadphase = new CANNON.NaiveBroadphase()

    // let sphereShape = new CANNON.Sphere(1)
    Ball.sphereCM = new CANNON.Material()
    // sphereBody = new CANNON.Body({
    //     mass: 5,
    //     shape: sphereShape,
    //     position: new CANNON.Vec3(0, 10, 0),
    //     material: Ball.sphereCM
    // })
    // world.addBody(sphereBody)

    let groundShape = new CANNON.Plane()
    let groundCM = new CANNON.Material()
    let groundBody = new CANNON.Body({
        mass:0,
        shape: groundShape,
        material: groundCM
    })
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(groundBody)

    // let sphereGroundContact = new CANNON.ContactMaterial(groundCM, Ball.sphereCM, {
    //     friction: 0,
    //     restitution: .7
    // })
    // world.addContactMaterial(sphereGroundContact)

}

function render() {
    world.step(timeStep)
    if (balls) {
        balls.forEach(ball => {
            ball.sphere.position.copy(ball.sphereBody.position)
            ball.sphere.quaternion.copy(ball.sphereBody.quaternion)
        })
    }

    requestAnimationFrame(render)
    renderer.render(scene, camera)
}

init()
render()