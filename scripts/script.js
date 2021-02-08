import * as THREE from './lib/three.module.js';
import { SVGLoader } from './lib/SVGLoader.js';


//-----------------------
// Initialize 
//------------------------
window.addEventListener('load', init, false);

let scene, camera, renderer, container;
let _width, _height;

const animationDuration = 35000;

let sphereGroup = new THREE.Group(); //everything related to orb

function init() {
  createWorld();
  
  createStars();

  // createSmoke();

  createText();
  // createLogo();

  scene.add(sphereGroup);
  sphereGroup.position.set(0,0,-4);

  animation();
}


function createWorld() {
  _width = window.innerWidth;
  _height= window.innerHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(100, _width/_height, 0.0001, 10000);
  scene.add(camera);
  
  const canvas = document.querySelector('#canvas');
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
  renderer.setClearColor( 'rgb(0,10,28)', 0.8 );
  renderer.setSize(_width, _height);
    
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



// Make circular gradient texture

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

//------------------
// Create Starfield
//------------------

const starSystem = new THREE.Group();
let star_points, star_materials = [];
let starfield, parameters, i, h, color, size;
let starCount = 3000;
function createStars(){
   
   starfield = new THREE.Geometry();
   
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
    
    star_materials[i] = new THREE.PointsMaterial({
      size: 1+Math.random()*size,
      map: createCanvasMaterial('#'+hexColor, 256),
      transparent: true,
      depthWrite: false
    });

    star_points = new THREE.Points(starfield, star_materials[i]);

    star_points.rotation.x = Math.random() * 6;
    star_points.rotation.y = Math.random() * 6;
    star_points.rotation.z = Math.random() * 6;

    starSystem.add(star_points);
  }
  scene.add(starSystem);
}




//-------------
// ADD TEXT
//-------------

// values that are constant for all particles during a draw call
let txt_uniforms = {
    color: { value: new THREE.Color( 'white' ) }
    // map: createCanvasMaterial('#ffffff', 1)
};
      
let txt_shaderMaterial = new THREE.ShaderMaterial( 
{
  uniforms: txt_uniforms,
  vertexShader:   document.getElementById( 'txt_vertexshader' ).textContent,
  fragmentShader: document.getElementById( 'txt_fragmentshader' ).textContent,
  blending: THREE.AdditiveBlending,
  transparent: true
});


let lettersBase, letterInfos, textMaterial;
function createText( ){

  lettersBase = new THREE.Object3D();
  sphereGroup.add(lettersBase);
  lettersBase.position.y = -0.4;
  
  const fontLoader = new THREE.FontLoader();
  fontLoader.load('https://threejsfundamentals.org/threejs/resources/threejs/fonts/helvetiker_regular.typeface.json', (font) => {
    const spaceSize = 0.1;
    let totalWidth = 0.5; 
    let maxHeight = 0;    
    const letterGeometries = {
      ' ': { width: spaceSize, height: 0 }, // prepopulate space ' '
    };
    
    const size = new THREE.Vector3();
    const str = '   For the item(s) we are about to receive, for those that made it possible, and for those with whom we are about to share it, we are thankful.        ';
    
    letterInfos = str.split('').map((letter, ndx) => {
      //store each letter's shapes if it hasn't been stored yet
      if (!letterGeometries[letter]) {
        const charGeo = new THREE.TextGeometry(letter, {
          font: font,
          size: 0.14,
          height: 0.002,
          wireframe: true,
          curveSegments: 8,
          bevelEnabled: false
        }); 

        charGeo.computeBoundingBox();
        charGeo.boundingBox.getSize(size);
        charGeo.computeFaceNormals();
        charGeo.computeVertexNormals();

        let txt_ptcount = 200;
        fillWithPoints(charGeo, txt_ptcount);

         const char_vertices = [];
          charGeo.vertices.forEach(function(vertex) {
            vertex.startPoint = vertex.clone();
            vertex.direction = vertex.clone().normalize();
            char_vertices.push(vertex.x, vertex.y, vertex.z);
          });

          charGeo.verticesNeedUpdate = true;

          let charBufferGeo = new THREE.BufferGeometry().fromGeometry( charGeo );

          charBufferGeo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(char_vertices), 3 ) );

          const numVertices = charBufferGeo.attributes.position.count;
          const alphas = new Float32Array( numVertices * 1 ); // 1 values per vertex
          const sizes = new Float32Array( numVertices * 1 ); // 1 values per vertex

          for( var i = 0; i < numVertices; i ++ ) {
              // set alpha randomly
              alphas[ i ] = 1;
              sizes[ i ] = 2;
          }

          charBufferGeo.setAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
          charBufferGeo.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

          letterGeometries[letter] = {
              charBufferGeo, //charBufferGeo
              width: size.x *0.58, 
              height: size.y,
          };

      } //end if       

      // let textMaterial = new THREE.PointsMaterial({
      //   color: 'white',
      //   size: 0.001,
      //   transparent: true,
      //   blending: THREE.AdditiveBlending,
      //   opacity: 1
      // });


      // textMaterial.needsUpdate = true;

      const {charBufferGeo, width, height} = letterGeometries[letter]; 
      const letterPoints = charBufferGeo
          ? new THREE.Points(charBufferGeo, txt_shaderMaterial)
          : null;
      totalWidth += width;
      maxHeight = Math.max(maxHeight, height);
     return {
        letterPoints,
        width
      };    
    }); //finish splitting text

    let t = 0;
    const radius = totalWidth / Math.PI;
    for (const {letterPoints, width} of letterInfos) {
      if (letterPoints) {
        // console.log(letterPoints);
        const offset = new THREE.Object3D();
        lettersBase.add(offset);
        offset.add(letterPoints);
        offset.rotation.y = t / totalWidth * Math.PI * 2;
        letterPoints.position.z = radius;
        letterPoints.position.y = -maxHeight / 2;
      }
      t += width;
    }
    
  });

  setTimeout(appearText, 800);
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

// ADD ANIMATION

function animateStars(){
  starSystem.position.z += 0.4;
}

function appearText(){

  // console.log(lettersBase);
  // lettersBase.children.forEach(l=>{
  //   // let letteropacity = l.children[0].material.opacity;
    
  //   // l.children[0].material.opacity = 1.0;

  //   let fadeinTxt = new TWEEN.Tween(l.children[0].material)
  //   .to({opacity: 1.0}, 4000)
  //   .repeat(1)
  //   .yoyo(true)
  //   .delay(100)
  //   .repeatDelay(20000)
  //   .start()

  // });

  let rotateTxt = new TWEEN.Tween(lettersBase.rotation)
    .to({y: lettersBase.rotation.y - 1.88*Math.PI}, animationDuration)
    .start();
   
}
function animateText(time){
  // console.log(time);
  for ( let i = 0; i < lettersBase.children.length; i ++ ) {
        const  logoPoints = lettersBase.children[ i ].children[0];

        if ( logoPoints instanceof THREE.Points ) {
          // console.log(logoPoints);

          const logopt_alphas = logoPoints.geometry.attributes.alpha;   
          const logopt_sizes = logoPoints.geometry.attributes.size;
          const logopt_positions = logoPoints.geometry.attributes.position;
          const logopt_orig_positions = logopt_positions;
          
          const count = logopt_alphas.count; 

          for( let j = 0; j < count; j ++ ) {
              // dynamically change sizes
              if(time<2){
                logopt_alphas.array[j] = time * 0.5;
              }else if (time<20){
                logopt_alphas.array[j] = 1;
              }else{
                logopt_alphas.array[j] *= 0.95;
                if (logopt_alphas.array[j]<0){
                  logopt_alphas.array[j] = 0;
                }
              }
              logopt_sizes.array[j] = 1.2 * ( 1 + Math.sin( 5 * j + time*10 ) );
              // logopt_positions.array[j] = time * Math.random() * 1000; 
          }

          logopt_alphas.needsUpdate = true;
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

  // console.log(lettersBase);
  // console.log(lettersBase.children[0].children[0].rotation);

  // if (time > 10 && time < 280){
  //   lettersBase.rotation.y = time * -0.02;
  // }
  
}

let start = Date.now();
function animation() {

  setTimeout( function() {
      requestAnimationFrame(animation);

  }, 1000 / 30 );

 
  let diff = (Date.now()-start)* 0.001;
        // console.log(clock);
  // animateStars();
  animateText(diff);
  // animateLogo(diff);
  // setTimeout( animateSmoke(Date.now()),1000);

  TWEEN.update();
  renderer.render(scene, camera);
}





//-----------------------
// FILL WITH POINTS HELPER
//-----------------------

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

