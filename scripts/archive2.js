
import * as THREE from './lib/three.module.js';
import { SVGLoader } from './lib/SVGLoader.js';
// import { GeometryUtils } from './lib/GeometryUtils.js';

//global scene variables
const pts = 120;
const sphereSize = 1;
const glowColor = new THREE.Color('rgb(200,250,225)');
const loader = new THREE.TextureLoader();

//-----------------------
// Initialize 
//------------------------
window.addEventListener('load', init, false);

var scene, camera, renderer, container;
var _width, _height;
var mat;
const sphereGroup = new THREE.Group();

function init() {
  createWorld();
  
  createLights();
  
  // createStars();

  // createSmoke();



  createText();
  createLogo();
  scene.add(sphereGroup);
  sphereGroup.position.set(0,0,-4);

  animation();
}


function createWorld() {
  _width = window.innerWidth;
  _height= window.innerHeight;

  //---
  scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0x000000, 5, 15);
  camera = new THREE.PerspectiveCamera(100, _width/_height, 0.0001, 10000);
  scene.add(camera);
  
  const canvas = document.querySelector('#canvas');
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
  renderer.setClearColor( 'rgb(0,10,28)', 0.8 );
  renderer.setSize(_width, _height);

  // const controls = new THREE.OrbitControls (camera, renderer.domElement);
    
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  _width = window.innerWidth;
  _height = window.innerHeight;
  renderer.setSize(_width, _height);
  camera.aspect = _width / _height;
  camera.updateProjectionMatrix();
  console.log('- resize -');
}

//------------------
// Create Lights
//------------------

var _ambientLights, _lights;
function createLights() {
  // _ambientLights = new THREE.AmbientLight(0xFFFFFF, 1);
  // _ambientLights = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 1.4);
  _lights = new THREE.PointLight(0xFFFFFF, 2, 150, 100);
  _lights.position.set(0,0,4);
  sphereGroup.add(_lights);
  // scene.add(_ambientLights);
}

//------------------
// Create Starfield
//------------------

const starSystem = new THREE.Group();


var particles, starfield, materials = [],
  parameters, i, h, color, size;

function createCanvasMaterial(color, size) {
  var matCanvas = document.createElement('canvas');
  matCanvas.width = matCanvas.height = size;
  var matContext = matCanvas.getContext('2d');
  // create exture object from canvas.
  var texture = new THREE.Texture(matCanvas);


  // Draw a radial gradient
  var center = size / 2;
  var gradient = matContext.createRadialGradient(center, center, 0, center, center, size);
  gradient.addColorStop(0, color);
  gradient.addColorStop(.5, 'transparent');

  matContext.beginPath();
  matContext.arc(center, center, size/2, 0, 2 * Math.PI, false);
  matContext.closePath();
  matContext.fillStyle = gradient;
  matContext.fill();
  // need to set needsUpdate
  texture.needsUpdate = true;
  // return a texture made from the canvas
  return texture;
}

var starCount = 4000;
function createStars(){
   starfield = new THREE.Geometry();
   
   //geometry = THREE.SphereGeometry( 1, 2, 2 );
   for (i = 0; i < starCount; i++) {

     let vertex = new THREE.Vector3();
     vertex.x = Math.random() * 1000 - 500;
     vertex.y = Math.random() * 1000 - 500;
     vertex.z = Math.random() * 1000 - 500;

     starfield.vertices.push(vertex);
   }

  //particle colors and sizes
  parameters = [
     [
       [1., 0.8, 0.8],2
     ],
     [
       [0.8, 0.8, 1.0],2
     ],
     [
       [1., 1., 0.9],1
     ],
     [
       [0.8, 0.9, 1.0],1
     ],
     [
       [1., 1., 1.],2
     ]
   ];

  for (i = 0; i < parameters.length; i++) {

    color = parameters[i][0];
    size = parameters[i][1];
    let hexColor = new THREE.Color(color[0], color[1], color[2]).getHexString();
    
    materials[i] = new THREE.PointsMaterial({
      size: 1+Math.random()*size,
      map: createCanvasMaterial('#'+hexColor, 256),
      transparent: true,
      depthWrite: false
    });

    particles = new THREE.Points(starfield, materials[i]);

    particles.rotation.x = Math.random() * 6;
    particles.rotation.y = Math.random() * 6;
    particles.rotation.z = Math.random() * 6;

    starSystem.add(particles);
  }
  scene.add(starSystem);
}


//------------------
// Light Smoke
//------------------

let smokeGeometry, smokeCount;
let smokeParticles = new THREE.Object3D();
// smokeParticles.scale.set(0.2, 0.2, 0.2);
// smokeParticles.opacity = 0.8;
let simplex = new FastSimplexNoise();
let smokeParts = [];

let smokeMaterial, smokePositions, smokeColors, smokeSizes;

smokeMaterial = new THREE.PointsMaterial({
  size: 0.025,
  map: createCanvasMaterial('white', 256),
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false
});

let tSize = 3;
let base = 12;

function createSmoke(){
  smokeCount = base * base * base;

  smokeGeometry = new THREE.BufferGeometry();
  
  smokePositions = new Float32Array(smokeCount * 3);
  smokeColors = new Float32Array(smokeCount * 4);
  smokeSizes = new Float32Array(smokeCount);

  smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
  smokeGeometry.setAttribute('color', new THREE.BufferAttribute(smokeColors, 4));
  smokeGeometry.setAttribute('size', new THREE.BufferAttribute(smokeSizes, 1));

  for(let i = 0; i < logoAllPoints.length; i++) {
    let size = randCalc(0.1, 1.0);
    smokeParts.push({
      offset: 0,
      // position: new THREE.Vector3(
      //   randCalc(-tSize/2, tSize/2),
      //   randCalc(-tSize/2, tSize/2),
      //   randCalc(-tSize/2, tSize/2)
      // ),

      position: logoAllPoints[i],
      baseSize: size,
      size: size,
      r: 1,
      g: 1,
      b: 1,
      a: 0,
      life: 2,
      decay: randCalc(0.05, 0.15),
      firstRun: true
    });
  }

  const smokeMesh = new THREE.Points( smokeGeometry, smokeMaterial );
  smokeParticles.add(smokeMesh);
  smokeGeometry.attributes.position.needsUpdate = true;
  smokeGeometry.attributes.size.needsUpdate = true;

  smokeParticles.scale.multiplyScalar(0.0015);
  smokeParticles.position.y = 1;
  sphereGroup.add(smokeParticles);
  updateParticleAttributes();
  
  // var smokeScale =  new THREE.Vector3(0.1,0.1,0.1);
  // var smokeScaleTarget = new THREE.Vector3(0.02,0.02,0.02);
  
  // let smokeAppear = new TWEEN.Tween(smokeParticles.scale)
  //     .to({x: 0.03, y: 0.03, z: 0.03}, 3000 )
  //     .easing(TWEEN.Easing.Exponential.Out);

  // let smokeScale = new TWEEN.Tween(smokeParticles.scale)
  //     .to({x: 0.21, y: 0.21, z: 0.21}, 25000 )
  //     .easing(TWEEN.Easing.Linear.None);

  // let smokeExpand = new TWEEN.Tween(smokeParticles.scale)
  //     .to({x: 0.8, y: 0.8, z: 0.8}, 1000)
  //     .easing(TWEEN.Easing.Cubic.Out)

  
  // smokeAppear.chain(smokeScale);
  // smokeScale.chain(smokeExpand);
  // smokeAppear.start();

} 


//------
//LOGO
//-----

// values that are constant for all particles during a draw call
let logo_uniforms = {
    color: { value: new THREE.Color( 'white' ) },
};
      
let logo_shaderMaterial = new THREE.ShaderMaterial( 
{
  uniforms: logo_uniforms,
  vertexShader:   document.getElementById( 'pts_vertexshader' ).textContent,
  fragmentShader: document.getElementById( 'pts_fragmentshader' ).textContent,
  blending: THREE.AdditiveBlending,
  transparent: true
});


let vbLogo;
let logoAllPoints = [];
function createLogo(){

  // instantiate a loader
  const loader = new SVGLoader();

  const logoPointCount = 300;
  // load a SVG resource
  loader.load(
    // resource URL
    '/vb_logo.svg',
    // called when the resource is loaded
    function ( data ) {
      // console.log(data);
      const paths = data.paths;
      vbLogo = new THREE.Group();

      for ( let p = 0; p < paths.length; p ++ ) {

        const path = paths[ p ];
        
        const shapes = path.toShapes( true );
        
        for ( let s = 0; s < shapes.length; s ++ ) {
          const s_shape = shapes[ s ];
          const logoPath_geometry = new THREE.ShapeGeometry( s_shape );

          logoPath_geometry.computeBoundingBox();
          logoPath_geometry.computeVertexNormals();

          let pointCount = logoPointCount+Math.random()*logoPointCount;
          if(p<3){
            pointCount = logoPointCount*4+Math.random()*logoPointCount;
          }else if(p<6){
            pointCount = logoPointCount*5+Math.random()*logoPointCount;
          }
          fillWithPoints(logoPath_geometry, pointCount);

          let logo_vertices = [];

          logoPath_geometry.vertices.forEach(function(vertex) {
            vertex.startPoint = vertex.clone();
            vertex.direction = vertex.clone().normalize();
            logo_vertices.push(vertex.x, vertex.y, vertex.z);
            logoAllPoints.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
          });

          
          logoPath_geometry.verticesNeedUpdate = true;

          const logo_bufferGeometry = new THREE.BufferGeometry().fromGeometry( logoPath_geometry );

          // console.log('lpg', logoPath_geometry);

          // console.log('lpbuff', logo_bufferGeometry);

          // console.log('vertices', logo_vertices);

          logo_bufferGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(logo_vertices), 3 ) );
          const numVertices = logo_bufferGeometry.attributes.position.count;
          const alphas = new Float32Array( numVertices * 1 ); // 1 values per vertex
          const sizes = new Float32Array( numVertices * 1 ); // 1 values per vertex

          // console.log('nv',numVertices);

          for( var i = 0; i < numVertices; i ++ ) {
              // set alpha randomly
              alphas[ i ] = Math.random();
              sizes[ i ] = Math.random()*1.5;
          }

          logo_bufferGeometry.setAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
          logo_bufferGeometry.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

          // console.log(logo_bufferGeometry);
          // var cubeGeometry = new THREE.CubeGeometry( 50, 50, 50, 20, 20, 20 );
          // var discTexture = THREE.ImageUtils.loadTexture( 'images/disc.png' );

          let logo_points = new THREE.Points(logo_bufferGeometry, logo_shaderMaterial);

          // let logo = new THREE.Mesh(logoPath_geometry, new THREE.MeshNormalMaterial());

          vbLogo.add( logo_points );
          // vbLogo.add( logo );
        }
      }

      vbLogo.scale.set(0, -0, 0);
      vbLogo.position.set(-0.5, 0.5, 0);
      sphereGroup.add( vbLogo );
    },      
    // called when loading is in progresses
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( 'An error happened', error );
    }
  );

  let logoScaleTarget = new THREE.Vector3(0.15,-0.15,0.15);

  let logoPosTarget = new THREE.Vector3(-3, 3, 0);
  setTimeout(function(){

    let vbLogoScaleIn = new TWEEN.Tween(vbLogo.scale)
      .to(logoScaleTarget, 1200)
      .easing(TWEEN.Easing.Cubic.InOut)
      .delay(1000) //25500
      .onStart(function(){
        let vbLogoPosIn = new TWEEN.Tween(vbLogo.position)
          .easing(TWEEN.Easing.Cubic.InOut)
          .to(logoPosTarget, 1200)
          .start();
      })
      .start();
   
      createSmoke();
      console.log(logoAllPoints);

  }, 1000)

}




//-----------------------
// FILL WITH POINTS HELPER

function fillWithPoints(geometry, pointNumber) {
  geometry.computeBoundingBox();
  for (var i = 0; i < pointNumber; i++) {
    setRandomPoint(geometry);
  }
}

function setRandomPoint(geometry) {
  var point = new THREE.Vector3(
    THREE.Math.randFloat(geometry.boundingBox.min.x, geometry.boundingBox.max.x),
    THREE.Math.randFloat(geometry.boundingBox.min.y, geometry.boundingBox.max.y),
    0// THREE.Math.randFloat(geometry.boundingBox.min.z, geometry.boundingBox.max.z)
  );
  //console.log(point);
  if (isPointInside(point, geometry)) {
    geometry.vertices.push(point);
  } else {
    setRandomPoint(geometry);
  }
}

var a = new THREE.Vector3();
var b = new THREE.Vector3();
var c = new THREE.Vector3();
var face = new THREE.Face3();

function isPointInside(point, geometry) {
  var retVal = false;
  for (var i = 0; i < geometry.faces.length; i++) {
    face = geometry.faces[i];
    a = geometry.vertices[face.a];
    b = geometry.vertices[face.b];
    c = geometry.vertices[face.c];
    //console.log(face, a, b, c);
    if (ptInTriangle(point, a, b, c)) {
      var retVal = true;
      break;
    }
  }
  return retVal;
}

function ptInTriangle(p, p0, p1, p2) {
  // credits: http://jsfiddle.net/PerroAZUL/zdaY8/1/
    var A = 1/2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    var sign = A < 0 ? -1 : 1;
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;
    
    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
}

//---------------------


//-------------
// ADD TEXT
//-------------

let lettersBase, letterInfos, textMaterial;
function createText( ){

  lettersBase = new THREE.Object3D();
  sphereGroup.add(lettersBase);
  lettersBase.position.y = -0.2;
  

    const loader = new THREE.FontLoader();
    loader.load('https://threejsfundamentals.org/threejs/resources/threejs/fonts/helvetiker_regular.typeface.json', (font) => {
      const spaceSize = 0.11;
      let totalWidth = 0.5; 
      let maxHeight = 0;    
      const letterGeometries = {
        ' ': { width: spaceSize, height: 0 }, // prepopulate space ' '
      };
      
      const size = new THREE.Vector3();
      const str = ' For the item(s) we are about to receive, for those that made it possible, and for those with whom we are about to share it, we are thankful.        ';
      
      letterInfos = str.split('').map((letter, ndx) => {
        //store each letter's shapes if it hasn't been stored yet
        if (!letterGeometries[letter]) {
          const charGeo = new THREE.TextGeometry(letter, {
            font: font,
            size: 0.13,
            height: 0.001,
            wireframe: true,
            curveSegments: 8,
            bevelEnabled: false
          }); 

        charGeo.computeBoundingBox();
        charGeo.boundingBox.getSize(size); 
        letterGeometries[letter] = {
            charGeo, //charBufferGeo
            width: size.x *0.58, 
            height: size.y,
          };

        } //end if       

        // MESH NORMAL FOR TESTING
        let mat = new THREE.MeshPhongMaterial({
          color: 'white',
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0
        });

        const {charGeo, width, height} = letterGeometries[letter]; 
        const letterMesh = charGeo
            ? new THREE.Mesh(charGeo, mat)
            : null;
        totalWidth += width;
        maxHeight = Math.max(maxHeight, height);
       return {
          letterMesh,
          width
        };    
      }); //finish splitting text

      let t = 0;
      const radius = totalWidth / Math.PI;
      for (const {letterMesh, width} of letterInfos) {
        if (letterMesh) {
          // console.log(letterMesh);
          const offset = new THREE.Object3D();
          lettersBase.add(offset);
          offset.add(letterMesh);
          offset.rotation.y = t / totalWidth * Math.PI * 2;
          letterMesh.position.z = radius;
          letterMesh.position.y = -maxHeight / 2;
        }
        t += width;
      }
      
    });

    setTimeout(appearText, 1000);
}

function appearText(){

  console.log(lettersBase);
  lettersBase.children.forEach(l=>{
    // let letteropacity = l.children[0].material.opacity;
    
    // l.children[0].material.opacity = 1.0;

    let fadeinTxt = new TWEEN.Tween(l.children[0].material)
    .to({opacity: 1.0}, 4000)
    .repeat(1)
    .yoyo(true)
    .delay(100)
    .repeatDelay(20000)
    .start()

  });

  // let rotateTxt = new TWEEN.Tween(lettersBase.rotation)
  //   .onStart(function(){

  //     console.log (lettersBase.rotation);
  //   })
  //   .to({y: lettersBase.rotation.y - Math.PI}, 3000)
  //   .onComplete(function() {console.log('finished rotation', lettersBase.rotation)})
  //   .start();

  // console.log(l.children[0].material.opacity);
   
}

function animateText(time){
  // console.log(time);
  if (time > 10 && time < 300){
    lettersBase.rotation.y = time * -0.02;
  }
  
}


//ANIMATE

let start = Date.now();
let time = Date.now() * 0.003;
// const clock = new Clock();
// const delta = clock.getDelta();

function animateStars(){
  starSystem.position.z += 0.4;
}

function animation() {
  // animation.timeScale = 1/5 ; 


  setTimeout( function() {

          requestAnimationFrame(animation);

      }, 1000 / 30 );

  
  // animation.timeScale = 1/5 ; 

 
  let diff = (Date.now()-start)* 0.01;

  // console.log(diff); 

  animateStars();
  animateText(diff);
  animateLogo(diff);
  // setTimeout( animateSmoke(Date.now()),1000);


  TWEEN.update();
  renderer.render(scene, camera);
}


function animateLogo(time){
    
  
  for ( let i = 0; i < vbLogo.children.length; i ++ ) {
      const  logoPoints = vbLogo.children[ i ];

      if ( logoPoints instanceof THREE.Points ) {
        // console.log(logoPoints);

        const logopt_alphas = logoPoints.geometry.attributes.alpha;   
        const logopt_sizes = logoPoints.geometry.attributes.size;
        const logopt_positions = logoPoints.geometry.attributes.position;
        const logopt_orig_positions = logopt_positions;
        
        const count = logopt_alphas.count; 
        for( let j = 0; j < count; j ++ ) {
            // dynamically change alphas and sizes
            logopt_alphas.array[j] = 1.0 + Math.sin( 2 * j + time ) ;
            logopt_sizes.array[j] = 1.0 * ( 1 + Math.sin( 5 * j + time ) );
            // logopt_positions.array[j] = time * Math.random() * 1000; 
        }

        logopt_positions.needsUpdate = true;
        logopt_alphas.needsUpdate = true; // important!
        logopt_sizes.needsUpdate = true;
        
       
        // logoPoints.geometry.verticesNeedUpdate = true;

        // positions.needsUpdate = true; // important!
        // console.log(logoPoints);


        // logoPoints.geometry.attributes.forEach(v =>{
        //   v.y = v.startPoint.y + Math.random() * delta;
        //   v.x = v.startPoint.x + Math.random() * delta;
        // }); 

        


  //         logoPoints.material.opacity = Math.random();

  //         // logoPoints.rotation.y = Math.random() * 0.01;  
  //         logoPoints.geometry.vertices.forEach(v =>{
  //           v.y = v.startPoint.y + Math.random() * delta;
  //           v.x = v.startPoint.x + Math.random() * delta;
  //         }); 

  //         logoPoints.geometry.verticesNeedUpdate = true;
      }
    }

  // vbLogo.children.forEach(function(shape){
  //   shape.geometry.vertices.forEach(function(vertex){
  //     // console.log(vertex);
  //     vertex.y = vertex.y * 100;
  //     // translateX = Math.sin(time * 0.001) * 5;
  // //   // particles.rotation.y = Math.random() * 6;
  // //   // particles.rotation.z = Math.random() * 6;
  //     // vertex.copy(vertex.startPoint).addScaledVector(vertex.direction, 50 + Math.sin(time * 0.001) * 50);
  //   });
  // });
}


function updateParticleAttributes(position, size) {
    let i = logoAllPoints.length; //smokeCount
    while(i--) {
      let part = smokeParts[i];
      // console.log(part);

      if(position) {
        smokePositions[i * 3 + 0] = part.position.x;
        smokePositions[i * 3 + 1] = part.position.y;
        smokePositions[i * 3 + 2] = part.position.z;
      }
      if(size) {
        smokeSizes[i] = part.size;
      }
    }
    if(position) {
      smokeGeometry.attributes.position.needsUpdate = true;
    }
    if(size) {
      smokeGeometry.attributes.size.needsUpdate = true;
    }
  }

function animateSmoke(time){
  console.log('animate smoke', smokeParts);

    updateParticleAttributes(true, true);

  // smokeParticles.rotation.y = (0.001) * time;
}



/// helpers

function randCalc(min, max, ease){
  if(max === undefined) {
    max = min;
    min = 0;
  }
  let random = Math.random();
  if(ease) {
    random = ease(Math.random(), 0, 1, 1);
  }
  return random * (max - min) + min;
}

function mapCalc(val, inputMin, inputMax, outputMin, outputMax) {
  return ((outputMax - outputMin) * ((val - inputMin) / (inputMax - inputMin))) + outputMin;
}
