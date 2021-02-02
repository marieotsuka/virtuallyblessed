
import * as THREE from './lib/three.module.js';
import { SVGLoader } from './lib/SVGLoader.js';
// import { GeometryUtils } from './lib/GeometryUtils.js';

//global scene variables
const pts = 120;
const sphereSize = 1;
const glowColor = new THREE.Color('rgb(200,250,225)');
const loader = new THREE.TextureLoader();

// rgb(200,250,225)



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
  
  createStars();

  createSmoke();

  // createText();
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
  scene.background = new THREE.Color('rgb(0,10,28)');

  camera = new THREE.PerspectiveCamera(100, _width/_height, 0.0001, 10000);
  scene.add(camera);
  
  const canvas = document.querySelector('#canvas');
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
  renderer.setSize(_width, _height);

  // document.body.appendChild(renderer.domElement);
  //---
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
  gradient.addColorStop(.5, 'black');

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
     vertex.x = Math.random() * 2000 - 500;
     vertex.y = Math.random() * 2000 - 500;
     vertex.z = Math.random() * 2000 - 500;

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
smokeParticles.scale.set(0.2, 0.2, 0.2);
// smokeParticles.opacity = 0.8;
let simplex = new FastSimplexNoise();
let smokeParts = [];

let smokeMaterial, smokePositions, smokeColors, smokeSizes;

smokeMaterial = new THREE.PointsMaterial({
  size: 0.02,
  map: createCanvasMaterial('white', 256),
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false
});

let tSize = 4;
function createSmoke(){
  console.log('make smoke');

  let scale = 2;
  let base = 8;
  smokeCount = base * base * base;

  smokeGeometry = new THREE.BufferGeometry();
  
  smokePositions = new Float32Array(smokeCount * 3);
  smokeColors = new Float32Array(smokeCount * 4);
  smokeSizes = new Float32Array(smokeCount);

  smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
  smokeGeometry.setAttribute('color', new THREE.BufferAttribute(smokeColors, 4));
  smokeGeometry.setAttribute('size', new THREE.BufferAttribute(smokeSizes, 1));

  for(let i = 0; i < smokeCount; i++) {
    let size = randCalc(0.1, 1.0);
    smokeParts.push({
      offset: 0,
      position: new THREE.Vector3(
        randCalc(-tSize/2, tSize/2),
        randCalc(-tSize/2, tSize/2),
        randCalc(-tSize/2, tSize/2)
      ),
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

  sphereGroup.add(smokeParticles);
}


//------
//LOGO
//-----

let vbLogo;
function createLogo(){

  // instantiate a loader
  const loader = new SVGLoader();

  const logoPointCount = 250;
  // load a SVG resource
  loader.load(
    // resource URL
    '/vb_logo_text.svg',
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

          logoPath_geometry.vertices.forEach(function(vertex) {
            vertex.startPoint = vertex.clone();
            vertex.direction = vertex.clone().normalize();
          });

          logoPath_geometry.verticesNeedUpdate = true;

          let logo_points = new THREE.Points(logoPath_geometry, new THREE.PointsMaterial({
            color: 'white',
            size: 0.01,
            opacity: Math.random()
          }));


          vbLogo.add( logo_points );
        }
      }


      vbLogo.scale.y = -1;
      vbLogo.position.x = -2.75;
      vbLogo.position.y = 3;
      vbLogo.scale.multiplyScalar(0.008);

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



function animateLogo(time){
 
  

  for ( let i = 0; i < vbLogo.children.length; i ++ ) {
      const logoPoints = vbLogo.children[ i ];
      if ( logoPoints instanceof THREE.Points ) {
         console.log(logoPoints);
          logoPoints.rotation.y = Math.random() * 0.01;  
          // logoPoints.geometry.vertices.forEach(v =>{
          //   v.y = v.y+1;
          // }); 
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

//-------------
// ADD TEXT
//-------------

let lettersBase, letterInfos, textMaterial;
function createText( ){

  lettersBase = new THREE.Object3D();
  sphereGroup.add(lettersBase);
  
  // const letterMaterial = new THREE.MeshPhongMaterial({
  //   color: 'white',
  //   transparent: true,
  //   blending: THREE.AdditiveBlending,
  // });  

    // outer text glow
    // let outerText = new THREE.ShaderMaterial( 
    // {
    //     uniforms: 
    //   { 
    //     "c":   { type: "f", value: 1 },
    //     "p":   { type: "f", value: .4 },
    //     glowColor: { type: "c", value: glowColor },
    //     viewVector: { type: "v3", value: camera.position }
    //   },
    //   vertexShader:   document.getElementById( 'glowVertexShader'   ).textContent,
    //   fragmentShader: document.getElementById( 'glowFragmentShader' ).textContent,
    //   side: THREE.BackSide,
    //   blending: THREE.AdditiveBlending,
    //   transparent: true
    // } );

    // sphereGroup.add(outerText);

    const fontLoader = new THREE.FontLoader();
    fontLoader.load('https://threejsfundamentals.org/threejs/resources/threejs/fonts/helvetiker_regular.typeface.json', (font) => {
      const spaceSize = 0.1;
      let totalWidth = 0.3;
      let maxHeight = 0;
      const letterGeometries = {
        ' ': { width: spaceSize, height: 0.5 }, // prepopulate space ' '
      };
      const size = new THREE.Vector3();
      const str = 'For the item(s) we are about to receive, for those that made it possible, and for those with whom we are about to share it, we are thankful.';
      letterInfos = str.split('').map((letter, ndx) => {
        if (!letterGeometries[letter]) {
          const geometry = new THREE.TextGeometry(letter, {
            font: font,
            size: 0.2,
            height: 0.001,
            curveSegments: 8,
            bevelEnabled: false
          });
          geometry.computeBoundingBox();
          geometry.computeFaceNormals();
          // geometry.computeVertexNormals();
          // geometry.center();
          
          // console.log(geometry);
          fillWithPoints(geometry, 400);

          geometry.vertices.forEach(function(vertex) {
            vertex.startPoint = vertex.clone();
            vertex.direction = vertex.clone().normalize();
          });

          geometry.verticesNeedUpdate = true;

          // let letter_points = new THREE.Points(geometry, new THREE.PointsMaterial({
          //   color: 'white',
          //   size: 0.0001,
          //   sizeAttenuation: false
          // }));


          // geometry.computeBoundingBox();
          geometry.boundingBox.getSize(size);

          letterGeometries[letter] = {
            geometry,
            width:  size.x*.6, // no idea why size.x is double size
            height: size.y,
            alpha: Math.random()
          }


          textMaterial = new THREE.PointsMaterial({
            color: 'white',
            size: 0.001,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 1
          });


          textMaterial.needsUpdate = true;

          const {geo, width, height} = letterGeometries[letter];
          const pts = geo
              ? new THREE.Points(geo, textMaterial)
              : null;
          totalWidth += width;
          maxHeight = Math.max(maxHeight, height);
          return {
            pts,
            width,
          };

        }//end if
      });//end string split processing

      let t = 0;
      const radius = totalWidth / Math.PI;

      for (const {pts, width} of letterInfos) {
        if (pts) {
          const offset = new THREE.Object3D();
          lettersBase.add(offset);
          offset.add(pts);
          offset.rotation.y = t / totalWidth * Math.PI * 2;
          pts.position.z = radius;
          pts.position.y = -maxHeight / 2;
        }
        t += width;
      }

    });//finishh load

}



//ANIMATE

let start = Date.now();
// const clock = new Clock();
// const delta = clock.getDelta();

function animateText(t){
  // console.log(letterInfos);
  lettersBase.rotation.y = t * -0.08;
  // console.log(lettersBase.rotation.y);

}
function animation() {
  requestAnimationFrame(animation);
  

  let time = Date.now() * 0.003;
  let diff = (Date.now()-start)* 0.01;

  // console.log(diff); 

  if (diff > 30){
    // animateText(time)

    animateLogo(Date.now())
  }
  // rotate letters
  
 // starSystem.position.z += 0.3;
 // if (starSystem.position.z > 1000) {
 //   starSystem.position.z = 0.01
 // }
  
  

  animateSmoke(Date.now());

  renderer.render(scene, camera);
}




function updateParticleAttributes(position, size) {
    let i = smokeCount;
    while(i--) {
      let part = smokeParts[i];
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
  // console.log('animate smoke');

  let timedif = 0.00003*(time-start);
  
  let noiseScale = 0.1;
  let noiseTime = timedif * 0.00001;
  let noiseVelocity = 0.3;
  let k = 0.9;
  let j = smokeParts.length;

  while(j--) {
    let part = smokeParts[j];

    let xScaled = part.position.x * noiseScale;
    let yScaled = part.position.y * noiseScale;
    let zScaled = part.position.z * noiseScale;

    let noise1 = simplex.getRaw4DNoise(
      xScaled,
      yScaled,
      zScaled,
      noiseTime
    )* k + k;

    let noise2 = simplex.getRaw4DNoise(
      xScaled + 100,
      yScaled + 100,
      zScaled + 100,
      50 + noiseTime
    )* k + k;

    let noise3 = simplex.getRaw4DNoise(
      xScaled + 200,
      yScaled + 200,
      zScaled + 200,
      100 + noiseTime
    )* k + k;

    

   part.position.x += Math.sin(noise1 * Math.PI * 2) * noiseVelocity * timedif;
   part.position.y += Math.sin(noise2 * Math.PI * 2) * noiseVelocity * timedif;
   part.position.z += Math.sin(noise3 * Math.PI * 2) * noiseVelocity * timedif;

   // part.position.x = randCalc(-tSize/2, tSize/2);
   // part.position.y = randCalc(-tSize/2, tSize/2);
   // part.position.z = randCalc(-tSize/2, tSize/2);

   // console.log(part);
   //  console.log(smokePositions);    
    if(part.life > 0 ) {
      part.life -= part.decay * timedif;
    }
    
    if(part.life <= 0 || part.firstRun) {
      part.life = 2;
      
      part.position.x = randCalc(-tSize, tSize);
      part.position.y = randCalc(-tSize, tSize);
      part.position.z = randCalc(-tSize, tSize);

      // let hue = (timedif / 25 + randCalc(90)) % 360 + 110;
      let lightness = parseInt(Math.random()*100);
      let smokeColor = new THREE.Color('white');
      // this.color.set(`rgb(255,0,0)`);

      part.r = smokeColor.r;
      part.g = smokeColor.g;
      part.b = smokeColor.b;

      part.firstRun = false;
    }
    // part.a = part.life > 1 ? 2 - part.life : part.life;
    // part.size = mapCalc(1, 0, 1, part.baseSize * 4, part.baseSize * 1);

    updateParticleAttributes(true, true);
  }

  smokeParticles.rotation.y = (0.001) * time;
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


function randomVelocity() {
    var dx = 0.001 + 0.003*Math.random();
    var dy = 0.001 + 0.003*Math.random();
    var dz = 0.001 + 0.003*Math.random();
    if (Math.random() < 0.5) {
        dx = -dx;
    }
    if (Math.random() < 0.5) {
        dy = -dy;
    }
    if (Math.random() < 0.5) {
        dz = -dz;
    }
    return new THREE.Vector3(dx,dy,dz);
}
