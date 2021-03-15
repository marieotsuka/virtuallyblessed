import * as THREE from './lib/three.module.js';
import { SVGLoader } from './lib/SVGLoader.js';
import * as dat from './lib/dat.gui.module.js';
const gui = new dat.GUI();

//-----------------------
// Initialize 
//------------------------
window.addEventListener('load', init, false);

let scene, camera, renderer, container;
let _width, _height;

const durationSeconds = 50;
const animationDuration = durationSeconds*1000;

const colors = [
'rgb(240, 255, 250)',
'rgb(255, 255, 255)',
'rgb(250, 250, 255)'
]

let glow = new THREE.Color( colors[0]);

function glowColor(){
  let i = Math.floor(Math.random() * colors.length);
  return new THREE.Color( colors[i] );
}

let sphereGroup = new THREE.Group(); //everything related to orb
let controls = new function(){
  this.noise = 0.1;
  this.time = 0.1;
  this.velocity = 0.1;
  this.k = 0.1;
  this.scale = 0.3;
};

function init() {
  createWorld();
  
  createStars();

  createText();
  createLogo();
  makeExplosion();

  scene.add(sphereGroup);
  sphereGroup.position.set(0,0,-4);
  let _lights = new THREE.PointLight(0xFFFFFF, 2, 150, 100);
  _lights.position.set(0,0,4);
  sphereGroup.add(_lights);

  makeGUI(controls);
  animation();
}

function makeGUI( controlobj){
  const gui = new dat.GUI();
  gui.add(controlobj, 'noise', 0.001, 2.0);
  gui.add(controlobj, 'time', 0.001, 2.0);
  gui.add(controlobj, 'velocity', 0.001, 2.0);
  gui.add(controlobj, 'k', 0.001, 2.0);
  gui.add(controlobj, 'scale', 0.01, 3.0);
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
let starCount = 4000;
function createStars(){

   starfield = new THREE.Geometry();
   
   for (i = 0; i < starCount; i++) {
     let vertex = new THREE.Vector3();
     vertex.x = Math.random() * 1000 - 300;
     vertex.y = Math.random() * 1000 - 300;
     vertex.z = Math.random() * 1000 - 300;
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

    color = glowColor();
    size = parameters[i][1];
    let hexColor = color.getHexString();
    
    star_materials[i] = new THREE.PointsMaterial({
      size: 1+Math.random(),
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




let lettersBase, letterInfos;
let textMaterial = new THREE.MeshPhongMaterial({
  color: glow,
  transparent: true,
  blending: THREE.AdditiveBlending,
  side: THREE.FrontSide,
  opacity: 0.7
});

function createText( ){

  lettersBase = new THREE.Object3D();
  sphereGroup.add(lettersBase);
  lettersBase.position.y = 0;
  
  const fontLoader = new THREE.FontLoader();
  fontLoader.load('https://threejsfundamentals.org/threejs/resources/threejs/fonts/helvetiker_regular.typeface.json', (font) => {
    const spaceSize = 0.03;
    let totalWidth = 6; 
    let maxHeight = 0;    
    const letterGeometries = {
      ' ': { width: spaceSize, height: 0 }, // prepopulate space ' '
    };
    
    const size = new THREE.Vector3();
    const str = '   For the item(s) we are about to receive, for those that made it possible, and for those with whom we are about to share it, we are thankful.       ';
    
    letterInfos = str.split('').map((letter, ndx) => {
      //store each letter's shapes if it hasn't been stored yet
      if (!letterGeometries[letter]) {
        const charGeo = new THREE.TextGeometry(letter, {
          font: font,
          size: 0.10,
          height: 0.001,
          wireframe: false,
          curveSegments: 8,
          bevelEnabled: false
        }); 

        charGeo.computeBoundingBox();
        charGeo.boundingBox.getSize(size);
        charGeo.computeFaceNormals();
        charGeo.computeVertexNormals();

        let txt_ptcount = 100;
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
              alphas[ i ] = Math.random();
              sizes[ i ] = Math.random()*3;
          }

          charBufferGeo.setAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
          charBufferGeo.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

          letterGeometries[letter] = {
              charBufferGeo, 
              charGeo,
              width: size.x *0.58, 
              height: size.y,
          };

      } //end if       




      // textMaterial.needsUpdate = true;

      const {charBufferGeo, charGeo, width, height} = letterGeometries[letter]; 
      const letterPoints = charBufferGeo
          ? new THREE.Points(charBufferGeo, txt_shaderMaterial)
          : null;

      const letterMesh = charGeo
          ? new THREE.Mesh(charGeo, textMaterial)
          : null;
      totalWidth += width;
      maxHeight = Math.max(maxHeight, height);
     return {
        letterPoints,
        letterMesh,
        width
      };    
    }); //finish splitting text

    let t = 0;
    const radius = totalWidth / Math.PI;
    for (const {letterPoints, letterMesh, width} of letterInfos) {
      if (letterPoints) {
        // console.log(letterPoints);
        const offset = new THREE.Object3D();
        lettersBase.add(offset);
        offset.add(letterPoints);
        offset.rotation.y = t / totalWidth * Math.PI * 2;
        letterPoints.position.z = radius;
        letterPoints.position.y = -maxHeight / 2;

        offset.add(letterMesh);
        letterMesh.position.z = radius;
        letterMesh.position.y = -maxHeight / 2;
      }
      t += width;
    }
    
  });

  setTimeout(appearText, 1500);
}


//------
//LOGO
//-----

// values that are constant for all particles during a draw call
let logo_uniforms = {
    color: { 
      value: new THREE.Color( 'white' ) 
    },
    elapsedTime : {
        type: "f",
        value: 0.0
    },
    duration : {
        type: "f",
        value: 0.0
    }
};
      
let logo_shaderMaterial = new THREE.ShaderMaterial( 
{
  uniforms: logo_uniforms,
  vertexShader:   document.getElementById( 'p_vertexshader' ).textContent,
  fragmentShader: document.getElementById( 'p_fragmentshader' ).textContent,
  blending: THREE.AdditiveBlending,
  transparent: true,
  wireframe: false
});


let vbLogo, logo_points, logoTotalPointCount;
let logoAllPoints = [];

let smokeParticles = new THREE.Object3D();
// smokeParticles.scale.set(0.2, 0.2, 0.2);
let logo_layer = new THREE.Object3D();

function createLogo(){

  vbLogo = new THREE.BufferGeometry();
  // instantiate a loader
  const loader = new SVGLoader();

  const logoPointCount = 300;
  // load a SVG resource
  loader.load(
    // resource URL
    'https://motsuka.com/virtuallyblessed/vb_logo.svg',
    // called when the resource is loaded
    function ( data ) {
      // console.log(data);
      const paths = data.paths;

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
            logoAllPoints.push(vertex.x*0.15 - 3.0, vertex.y*-0.15 + 2.5, vertex.z*0.15);
          });

          let logo_shape = new THREE.Mesh(logoPath_geometry, textMaterial);
          logo_layer.add(logo_shape);
          // logo_shape.material.opacity = 0;
        }
      }

      


      // //add in logo layer at end
      logo_layer.scale.set(.15, -.15, .15);
      logo_layer.position.set(-3, 2.5, 0);
      

      let _logolights = new THREE.PointLight(0xFFFFFF, 1, 40);
      _logolights.position.set(0, -1, 2);
      
      sphereGroup.add(_logolights);

      setTimeout(function(){
        
        let layerappear;
        console.log(logo_layer);
        logo_layer.children.forEach(layer =>{
          layer.material.opacity = 0;
          let layerappear = new TWEEN.Tween(layer.material)
          .to({opacity: 0.5},  1000).delay(3000);
          layerappear.start();
        });
        sphereGroup.add(logo_layer);
      }, animationDuration);
      
     
      //make Logo points on complete
      makeLogo();
    
     
    },      
    // called when loading is in progress
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( 'An error happened', error );
    }
  );



}

let tSize = 3.0;
const sphere = new THREE.BufferGeometry();
let spherePtsCount = 3000;
let sphere_uniforms = {
    color: { value: glow }
};
let sphere_shaderMaterial = new THREE.ShaderMaterial( 
{
  uniforms: sphere_uniforms,
  vertexShader: document.getElementById( 'pts_vertexshader' ).textContent,
  fragmentShader: document.getElementById( 'pts_fragmentshader' ).textContent,
  blending: THREE.AdditiveBlending,
  transparent: true
});

function makeExplosion(){

    let glow_geo = new THREE.Geometry();
    let v = new THREE.Vector3();
    glow_geo.vertices.push(v);
    let c = glowColor().getHexString();

    let glow_mat = new THREE.PointsMaterial({
      size: 1.0+Math.random(),
      map: createCanvasMaterial('#'+c, 256),
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    let glow = new THREE.Points( glow_geo, glow_mat);
   
    sphereGroup.add(glow);

    let glowIn = new TWEEN.Tween(glow.material)
      .to({size: 10, opacity: 0.5}, animationDuration - 1500);

    let glowMax = new TWEEN.Tween(glow.material)
      .to({size: 30, opacity: 1.0}, 1000);

    let glowSet = new TWEEN.Tween(glow.material)
      .to({size: 12, opacity: 0.6}, 1000);

    glowIn.chain(glowMax);
    glowMax.chain(glowSet);

    glowIn.start();


    const alphas = new Float32Array( spherePtsCount * 1 ); // 1 values per vertex
    const sizes = new Float32Array( spherePtsCount * 1 ); // 1 values per vertex
    const positions = new Float32Array( spherePtsCount * 3);

    for( var i = 0; i < spherePtsCount; i ++ ) {
        // set alpha randomly
        alphas[ i ] = Math.random();
        sizes[ i ] = Math.random()*2;
        
        var vec3 = new THREE.Vector3();
        vec3.x = THREE.Math.randFloatSpread(1);
        vec3.y = THREE.Math.randFloatSpread(1);
        vec3.z = THREE.Math.randFloatSpread(1);
        vec3.setLength(1.0);
        positions[i*3+0]  = vec3.x;
        positions[i*3+1]  = vec3.y;
        positions[i*3+2]  = vec3.z;

    }
    sphere.setAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
    sphere.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
    sphere.setAttribute( 'position', new THREE.BufferAttribute(positions, 3 ) );

    // sphere.setAttribute( 'origPosition', new THREE.BufferAttribute(positions, 3) );
    let sphere_points = new THREE.Points(sphere, sphere_shaderMaterial);
    // sphereGroup.add(sphere_points);

    sphere_points.scale.set(3.0,3.0,3.0);

    // let sphereGrow = new TWEEN.Tween(sphere_points.scale)
    //   .to({x:1.0,y:1.0,z:1.0}, animationDuration - 2000)

    // let sphereShrink = new TWEEN.Tween(sphere_points.scale)
    //   .to({x:0.01,y:0.01,z:0.01}, 1000)
    //   .easing(TWEEN.Easing.Exponential.Out);
    // let sphereExplode = new TWEEN.Tween(sphere_points.scale)
    //   .to({x:8.0,y:8.0,z:8.0}, 2000)
    //   .easing(TWEEN.Easing.Exponential.Out);

    // let sphereRotate = new TWEEN.Tween(sphere_points.rotation)
    //   .to({y: -6*Math.PI}, animationDuration);

    // sphereGrow.chain(sphereShrink);
    // sphereShrink.chain(sphereExplode);
    // sphereGrow.start();
    // sphereRotate.start();
}

let maxPos = [];
function makeLogo(){
    
    logoTotalPointCount = logoAllPoints.length/3;

    const alphas = new Float32Array( logoTotalPointCount * 1 ); // 1 values per vertex
    const sizes = new Float32Array( logoTotalPointCount * 1 ); // 1 values per vertex
    const positions = new Float32Array( logoTotalPointCount * 3);

    for( var i = 0; i < logoTotalPointCount; i ++ ) {
        // set alpha randomly
        alphas[ i ] = Math.random();
        sizes[ i ] = Math.random()*2;
        
        var vec3 = new THREE.Vector3();
        vec3.x = THREE.Math.randFloatSpread(1);
        vec3.y = THREE.Math.randFloatSpread(1);
        vec3.z = THREE.Math.randFloatSpread(1);
        vec3.setLength(tSize);
        // vec3.toArray(positions);

        positions[i*3+0]  = vec3.x;
        positions[i*3+1]  = vec3.y;
        positions[i*3+2]  = vec3.z;

    }

    maxPos = positions;
    // logopt_org_positions = positions;
    // console.log(positions);

    vbLogo.setAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
    vbLogo.setAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
    vbLogo.setAttribute( 'position', new THREE.BufferAttribute(positions, 3 ) );
    
    vbLogo.setAttribute( 'targetPosition', new THREE.BufferAttribute( new Float32Array(logoAllPoints), 3 ) );
    // vbLogo.setAttribute( 'origPosition', new THREE.BufferAttribute(positions, 3) );

    logo_points = new THREE.Points(vbLogo, logo_shaderMaterial);
    vbLogo.center();
    // vbLogo.postion.y = 1;
   
    smokeParticles.scale.set(0.3,0.3,0.3); //0.1
    smokeParticles.add( logo_points );    
    sphereGroup.add(smokeParticles);

    // let vbLogoScaleIn = new TWEEN.Tween(smokeParticles.scale)
    //   .to({x:1.0,y:1.0,z:1.0}, animationDuration - 2000);

    // let vbLogoScaleMax = new TWEEN.Tween(smokeParticles.scale)
    //   .to({x:3,y:3,z:3}, 300);
    // let vbLogoScaleSet = new TWEEN.Tween(smokeParticles.scale)
    //   .to({x:1.0,y:1.0,z:1.0}, 1000);

    // vbLogoScaleIn.chain(vbLogoScaleMax);
    // vbLogoScaleMax.chain(vbLogoScaleSet);

    let vbLogoRotate = new TWEEN.Tween(smokeParticles.rotation)
      .to({y: 6*Math.PI}, animationDuration - 3000);

    // vbLogoScaleIn.start();
    // vbLogoRotate.start();


    // console.log(vbLogo);

}

let simplex = new FastSimplexNoise();

function animateLogo(time){

    smokeParticles.scale.set(controls.scale, controls.scale, controls.scale);

    logo_shaderMaterial.uniforms.elapsedTime.value = time;
    logo_shaderMaterial.uniforms.duration.value = durationSeconds;
    logo_shaderMaterial.needsUpdate = true; 

    const logopt_alphas = vbLogo.attributes.alpha;   
    const logopt_sizes = vbLogo.attributes.size;
    const logopt_positions = vbLogo.attributes.position;
    

    const logopt_next_positions = vbLogo.attributes.targetPosition;
    
    const count = logoTotalPointCount; 
      
    let noiseScale = controls.noise; //((durationSeconds - time) / durationSeconds)
    let noiseTime = controls.time; //noiseScale * 2.0
    let noiseVelocity = controls.velocity;
    let k = controls.k;

    if(logopt_positions){


      let pos = logopt_positions.array;
   
      for( let j = 0; j < count; j ++ ) {
            
        // dynamically change sizes
        logopt_sizes.array[j] = 1.0 * ( 1 + Math.sin( 5 * j + time*10 ) );

        if(true){

          // pos[j] = Math.random();
          let xScaled = pos[j * 3 + 0] * noiseScale; 
          let yScaled = pos[j * 3 + 1] * noiseScale;
          let zScaled = pos[j * 3 + 2] * noiseScale;

          let noise1 = simplex.getRaw4DNoise(
            xScaled,
            yScaled,
            zScaled,
            noiseTime
          )* k;

          let noise2 = simplex.getRaw4DNoise(
            xScaled,
            yScaled,
            zScaled,
            noiseTime
          )* k;

          let noise3 = simplex.getRaw4DNoise(
            xScaled,
            yScaled,
            zScaled,
            noiseTime
          )* k;

          pos[j * 3 + 0] = maxPos[j * 3 + 0] - pos[j * 3 + 0] * Math.sin(noise1 * Math.PI) * noiseVelocity;
          pos[j * 3 + 1] = maxPos[j * 3 + 1] - pos[j * 3 + 1] * Math.sin(noise2 * Math.PI) * noiseVelocity;
          pos[j * 3 + 2] = maxPos[j * 3 + 2] - pos[j * 3 + 2] * Math.sin(noise3 * Math.PI) * noiseVelocity;
          // pos[j * 3 + 0] = maxPos[j * 3 + 0]- pos[j * 3 + 0] * Math.sin(noise1 * Math.PI) * noiseVelocity ;
          // pos[j * 3 + 1] = maxPos[j * 3 + 1]- pos[j * 3 + 1] * Math.sin(noise2 * Math.PI) * noiseVelocity ;
          // pos[j * 3 + 2] = maxPos[j * 3 + 2]- pos[j * 3 + 2] * Math.sin(noise3 * Math.PI) * noiseVelocity ;
          
        }else{
          // logopt_positions = vbLogo.attributes.origPosition;
        }
      }//endfor

      logopt_positions.needsUpdate = true;
      logopt_sizes.needsUpdate = true; 
    }
  
}


function animateSphere(time){

    const sphere_alphas = sphere.attributes.alpha;   
    const sphere_sizes = sphere.attributes.size;
    const sphere_positions = sphere.attributes.position;

    const sphere_next_positions = sphere.attributes.targetPosition;
    
    const count = spherePtsCount; 

    if(sphere_positions){

      let pos = sphere_positions.array;
   
      for( let j = 0; j < count; j ++ ) {
            
        // dynamically change sizes
        sphere_sizes.array[j] = 1.0 * ( 1 + Math.sin( 5 * j + time*10 ) );
        // if (time > durationSeconds - 6 && time < durationSeconds - 1 ){
        //   sphere_sizes.array[j] = sphere_sizes.array[j] * ( 1 + 0.001*time );
        // }else{
        //   sphere_sizes.array[j] = 1.0 * ( 1 + Math.sin( 5 * j + time*10 ) );
        // }

      }//endfor

      // sphere_positions.needsUpdate = true;
      sphere_sizes.needsUpdate = true; 
    }
  
}





// ADD ANIMATION

function animateStars(){
  starSystem.position.z += 0.1;
}

function appearText(){

  // let fadeInTxt = new TWEEN.Tween(lettersBase.material)
  //   .to({opacity: 1.0}, 1000);

  let rotateTxt = new TWEEN.Tween(lettersBase.rotation)
    .to({y: lettersBase.rotation.y - 1.0*Math.PI}, animationDuration)

  rotateTxt.start();
  // fadeInTxt.chain(rotateTxt);

  setTimeout(function(){
    sphereGroup.remove(lettersBase);
  }, animationDuration);
}

function animateText(time){
  // console.log(time);
  for ( let i = 0; i < lettersBase.children.length; i ++ ) {
        const  letterPts = lettersBase.children[ i ].children[0];

        if ( letterPts instanceof THREE.Points ) {
          // console.log(letterPts);

          const letter_alphas = letterPts.geometry.attributes.alpha;   
          const letter_sizes = letterPts.geometry.attributes.size;
          const letter_positions = letterPts.geometry.attributes.position;
          
          const count = letter_alphas.count; 

          for( let j = 0; j < count; j ++ ) {
              // dynamically change sizes
              if(time<2){
                letter_alphas.array[j] = time * 0.5;
              }else if (time<durationSeconds){
                letter_alphas.array[j] = 1;
              }else{
                letter_alphas.array[j] *= 0.95;
                if (letter_alphas.array[j]<0){
                  letter_alphas.array[j] = 0;
                }
              }
              letter_sizes.array[j] = 1.4 * ( 1 + Math.sin( 5 * j + time*10 ) );
              // letter_positions.array[j] = 0;
          }

          letter_alphas.needsUpdate = true;
          letter_sizes.needsUpdate = true;
          // letter_positions.needsUpdate = true;
          
        }
      }  
}

let start = Date.now();
function animation() {

  setTimeout( function() {
      requestAnimationFrame(animation);
  }, 1000 / 60 );

 
  let diff = (Date.now()-start)* 0.001; //seconds
        // console.log(clock);
  animateStars();
  animateText(diff);
  animateLogo(diff);
  // animateSphere(diff);

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

