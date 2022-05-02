// imports & includes
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';

import { Atlas, preloadMeshes } from './MeshLoader';

// board details object
type SceneDefinition = {
  rows: number;
  columns: number;
  tiles: Array<{ r: number; c: number; d: number; tid: number }>;
};

// sceneloader class
export class SceneLoader {
  scene: BABYLON.Scene;                 // global scene var
  light: BABYLON.HemisphericLight;      // global light var
  camera: BABYLON.ArcRotateCamera;      // global camera var
  assetsManager: BABYLON.AssetsManager; // global assetmanager
  detailLevel: number;                  // level of detail variable (NOT WORKING)

  glbDef: SceneDefinition;              // global scene definition
  glbGUI: GUI.AdvancedDynamicTexture;   // global gui variable

  playerAnimator: BABYLON.AnimationGroup; // clara animation
  clara: BABYLON.AbstractMesh;            // clara herself 
  
  directionFacing: number;          // direction clara is facing (0 - north, 1 - east, 2 - south, 3 - west)
  startPosition: BABYLON.Vector3;   // clara's start position
  currentPosition: BABYLON.Vector3; // clara's current position
  movementGrid = [];                // board grid

  claraXCoord: number;              // xcoord in grid
  claraYCoord: number;              // ycoord in grid

  justMoved = false;

  // canvas initiation
  async initCanvas(canvas: HTMLCanvasElement) {
    let engine = new BABYLON.Engine(canvas, true);

    // create scene function
    var createScene = () => {
      let scene = new BABYLON.Scene(engine);
      this.scene = scene;
      scene.clearColor = BABYLON.Color3.White() as unknown as BABYLON.Color4;

      // create camera
      let camera = new BABYLON.ArcRotateCamera(
        "camera",
        0,
        BABYLON.Tools.ToRadians(25),
        30,
        BABYLON.Vector3.Zero(),
        //new BABYLON.Vector3(11, -2, 13.5),
        scene
      );
      //camera.setTarget(new BABYLON.Vector3(11, -2, 13.5));
      // camera.target.x = 11;
      // camera.target.y = -2;
      // camera.target.z = 13.5;
      

      // set camera default camera angle (cam2)
      // camera.lowerBetaLimit = Math.PI/2;
      // camera.upperBetaLimit = Math.PI/3;
      // camera.lowerRadiusLimit = 30;
      // camera.upperRadiusLimit = 30;

      // set camera sensitivity
      camera.angularSensibilityX = 5000;
      camera.angularSensibilityY = 5000;

      camera.checkCollisions = true;
      camera.attachControl("canvas", true);
      this.camera = camera;

      // create gui overlay
      var claraGUI = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
        "UI",
        true,
        this.scene
      );
      this.glbGUI = claraGUI;

      // create and setup camera button stack
      var cameraPanel = new GUI.StackPanel();
      cameraPanel.isVertical = false;
      cameraPanel.height = "50px";
      cameraPanel.width = "150px";
      cameraPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      cameraPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

      // create and setup detail slider stack
      var sliderPanel = new GUI.StackPanel();
      sliderPanel.width = "220px";
      sliderPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      sliderPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      
      // add stacks to gui
      claraGUI.addControl(cameraPanel);
      claraGUI.addControl(sliderPanel);

      // create camera angle buttons
      //    - cam1 = angle 1 (higher)
      //    - cam2 = angle 2 (lower)
      //    - cam3 = angle 3 (limited-free range) - NEEDS TO BE IMPLEMENTED

      // create and setup cam1 button
      var cam1 = GUI.Button.CreateImageOnlyButton("cam1", "/top-down.png");
      cam1.width = "50px";
      cam1.height = "50px";
      cam1.color = "transparent";
      cam1.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = BABYLON.Tools.ToRadians(25);
        camera.upperBetaLimit = BABYLON.Tools.ToRadians(25);
        camera.lowerRadiusLimit = 30;
        camera.upperRadiusLimit = 30;
      });

      // create and setup cam2 button
      var cam2 = GUI.Button.CreateImageOnlyButton("cam2", "/side-view.png");
      cam2.width = "50px";
      cam2.height = "50px";
      cam2.color = "transparent";
      cam2.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = Math.PI / 2;
        camera.upperBetaLimit = Math.PI / 3;
        camera.lowerRadiusLimit = 30;
        camera.upperRadiusLimit = 30;
      });

      // create and setup cam3 button
      var cam3 = GUI.Button.CreateImageOnlyButton("cam3", "/free-view.png");
      cam3.width = "50px";
      cam3.height = "50px";
      cam3.color = "transparent";
      cam3.onPointerClickObservable.add(function () {
        camera.lowerBetaLimit = 0;
        camera.upperBetaLimit = 0;
        camera.lowerRadiusLimit = 0;
        camera.upperRadiusLimit = 0;
      });
      
      // add buttons to camera stack
      cameraPanel.addControl(cam1);
      cameraPanel.addControl(cam2);
      cameraPanel.addControl(cam3);

      this.detailLevel = 3; // temp hardcoded detaillevel option

      // create and setup detail slider heading
      var detailSliderHeading = new GUI.TextBlock();
      detailSliderHeading.text = "Detail Level: High";
      detailSliderHeading.height = "20px";
      detailSliderHeading.color = "black";

      // create and setup detail slider
      var detailSlider = new GUI.Slider();
      detailSlider.minimum = 1;
      detailSlider.maximum = 3;
      detailSlider.value = 3;
      detailSlider.height = "20px";
      detailSlider.width = "200px";
      detailSlider.onValueChangedObservable.add(function (value) {
        if (value == 1) {
          detailSliderHeading.text = "Detail Level: Low";
          this.detailLevel = 1;
          console.log(this.detailLevel);
        } else if (value > 1 && value != 3) {
          detailSlider.value = 2;
          detailSliderHeading.text = "Detail Level: Medium";
          this.detailLevel = 2;
          console.log(this.detailLevel);
        } else if (value == 3) {
          detailSliderHeading.text = "Detail Level: High";
          this.detailLevel = 3;
          console.log(this.detailLevel);
        }
      });

      // add detail slider and heading to slider stack
      sliderPanel.addControl(detailSliderHeading);
      sliderPanel.addControl(detailSlider);

      let turnRight = GUI.Button.CreateSimpleButton("turnRight", "turnRight");
      turnRight.width = 0.2;
      turnRight.height = "40px";
      turnRight.color = "white";
      turnRight.background = "green";
      turnRight.width = "150px";
      turnRight.onPointerClickObservable.add(() => {
        this.claraTurnRightFunction();
      });

      sliderPanel.addControl(turnRight);

      //reload the scene button
      let reloadButton = GUI.Button.CreateSimpleButton("Re-load", "Re-load");
      reloadButton.width = 0.2;
      reloadButton.height = "40px";
      reloadButton.color = "white";
      reloadButton.background = "green";
      reloadButton.width = "150px";
      reloadButton.onPointerClickObservable.add(async () => {
        //here we will reload the scene
        console.log("Scene reload has been called");

        var scene = createScene();
        this.assetsManager = new BABYLON.AssetsManager(scene);
         await preloadMeshes(this.assetsManager);
        engine.runRenderLoop(function(){
          scene.render();
        })
        this.loadScene(this.glbDef);
      });
      sliderPanel.addControl(reloadButton);

      /* NEED TO GET SHADOWS WORKING */
      // create light
      let light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1, 1, 0),
        scene
      );
      this.light = light;

      // Keyboard events
      var inputMap = {};
      scene.actionManager = new BABYLON.ActionManager(scene);
      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
          inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      }));
      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
          inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
      }));

      var animating = true;

      scene.onBeforeRenderObservable.add(() => {
        var keydown = false;
       
        //Manage the movements of the character (e.g. position, direction)
        if (inputMap["w"] || inputMap["W"]) {
          this.claraMoveForwardFunction();
            
            keydown = true;
        }
        if (inputMap["s"]) { //if clara wants to move backwards
          
          keydown = true;
        }
        if (inputMap["a"]) {
          
            keydown = true;
        }
        if (inputMap["d"]) {
          this.claraTurnRightFunction();
          
            keydown = true;
        }
        if (inputMap["b"]) {          

            keydown = true;
        }

         //Manage animations to be played  
         if (keydown) {
          if (!animating) {
              animating = true;
              if (inputMap["w"] || inputMap["a"] || inputMap["s"] || inputMap["d"]) {
                  //Walk backwards
                  this.playerAnimator.start(true, 1, 60, 160);
              }
          }
      }
      
        });

      // enable depth renderering and return scene
      scene.enableDepthRenderer();
      return scene;
    };

    // screen resizing
    window.addEventListener("resize", function () {
      engine.resize();
    });

    // create scene
    var scene = createScene();
    // assign asset manager
    this.assetsManager = new BABYLON.AssetsManager(scene);

    // load meshes
    console.log("Preloading ...");
    await preloadMeshes(this.assetsManager);
    console.log("Loaded");

    // render scene
    engine.runRenderLoop(function () {
      scene.render();
    });
  }

  // load scene function
  loadScene(definition: SceneDefinition) {
    // assign rows n cols
    let { rows, columns } = definition;
    this.glbDef = definition;

    // this.camera.target = new BABYLON.Vector3(11, -2, 13.5);

    //this.camera.target.x = 11;
    this.camera.target.x = rows;
    this.camera.target.y = (rows - columns);
    this.camera.target.z = columns;

    // create board loop
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      // initializing movementGrid
      this.movementGrid[rowIndex] = [];
      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        // filling movementGrid
        this.movementGrid[rowIndex][columnIndex] = 0;

        // find current tile
        let existingTile = definition.tiles.find(
          (t) => t.c === columnIndex && t.r === rowIndex
        );

        // if current tile exists check specifications
        // else place light grass
        if (existingTile) {
          // tid == 1, place dark grass + tree
          if (existingTile.tid == 1) {
            let top = Atlas.topTiles.get("GrassTop1.glb").createInstance("top");
            top.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              0,
              columnIndex * 2.1
            );
            this.getTree(rowIndex * 2.1, columnIndex * 2.1);
            this.movementGrid[rowIndex][columnIndex] = 1;
          }
          // tid == 2, place water
          else if (existingTile.tid == 2) {
            let top = Atlas.topTiles.get("WaterTop.glb").createInstance("top");
            /*
               if tile on edge, put waterfall
            */
            this.movementGrid[rowIndex][columnIndex] = 2;
          }
          // existing tile is game object (clara, leaf, ghost), place lighter grass
          else if (
            [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].indexOf(
              existingTile.tid
            ) > -1
          ) {
            let top = Atlas.topTiles.get("GrassTop2.glb").createInstance("top");
            top.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              0,
              columnIndex * 2.1
            );
            switch (existingTile.tid) {
              case 4: {
                
                BABYLON.SceneLoader.ImportMesh(
                  "",
                  "./",
                  "clara.glb",
                  this.scene,
                  (meshes, ps, skeletons, ags) => {
                    meshes.forEach((mesh) => {
                      if (mesh.material) {
                        mesh.material.needDepthPrePass = true;
                      }
                    });
                    let tile = meshes[0];
                    tile.position = new BABYLON.Vector3(
                      rowIndex * 2.1,
                      1,
                      columnIndex * 2.1
                    );
                    this.clara = meshes[0];
                    this.initialiseClara();

                    this.playerAnimator = ags[0];
                    this.playerAnimator.stop();

                    //var skeleton = skeletons[0];
                    //sc.stopAnimation(skeleton);
                    //sc.beginAnimation(skeleton, 0, 29, true, 2.0);
                  }
                );
                this.startPosition = new BABYLON.Vector3(rowIndex*2.1, 1, columnIndex *2.1);            // assign clara's starting positioning for resets
                //console.log("tile ", this.clara.position);
                this.directionFacing = existingTile.d;        // assign clara's current direction
                this.movementGrid[rowIndex][columnIndex] = 4; // assign clara in movement grid
                this.claraXCoord = rowIndex;      // log clara's current x coord in grid
                this.claraYCoord = columnIndex;   // log clara's current y coord in grid
                break;
              }
              case 5: {
                // leaf
                this.movementGrid[rowIndex][columnIndex] = 5;
                break;
              }
              case 6: {
                // mushroom
                this.movementGrid[rowIndex][columnIndex] = 6;
                break;
              }
              case 7: {
                // ghost
                this.movementGrid[rowIndex][columnIndex] = 7;
                break;
              }
              case 8: {
                // ghostWall
                this.movementGrid[rowIndex][columnIndex] = 8;
                break;
              }
              case 9: {
                // ghostHealer
                this.movementGrid[rowIndex][columnIndex] = 9;
                break;
              }
              case 10: {
                // home
                this.movementGrid[rowIndex][columnIndex] = 10;
                break;
              }
              case 11: {
                // dot
                this.movementGrid[rowIndex][columnIndex] = 11;
                break;
              }
              case 12: {
                // earth
                this.movementGrid[rowIndex][columnIndex] = 12;
                break;
              }
              case 13: {
                // gold
                this.movementGrid[rowIndex][columnIndex] = 13;
                break;
              }
              case 14: {
                // brokenGold
                this.movementGrid[rowIndex][columnIndex] = 14;
                break;
              }
              case 15: {
                // pheromone
                this.movementGrid[rowIndex][columnIndex] = 15;
                break;
              }
              default: {
                break;
              }
            }
          }
        }
        // undefined tile == place light grass (path)
        else {
          let top = Atlas.topTiles.get("GrassTop2.glb").createInstance("top");
          top.position = new BABYLON.Vector3(
            rowIndex * 2.1,
            0,
            columnIndex * 2.1
          );
        }

        if ((Math.floor(Math.random() * 10)) >= 2) {
          this.chooseItem(rowIndex * 2.1, columnIndex * 2.1);
        }
      }
    }

    /* 
        NEED TO GET BOTTOM OF ISLAND SCALING 
        - below works except on long islands
        - island is 4.5 tiles x 4.5 tiles
    */ 
    BABYLON.SceneLoader.ImportMesh(
      "",
      "./",
      "island.glb",
      this.scene,
      function (meshes) {
        meshes.forEach((mesh) => {
          if (mesh.material) {
            mesh.material.needDepthPrePass = true;
          }
        });
        let tile = meshes[0];
        var rowCentre = (rows * 2.1 - 2.1) / 2;
        var colCentre = (columns * 2.1 - 2.1) / 2;
        tile.position = new BABYLON.Vector3(rowCentre, 1.5, colCentre);
        tile.scaling = new BABYLON.Vector3(rows / 4.5, 1.8, columns / 4.5);
      }
    );

    console.log("test grid = ", this.movementGrid);
    console.log("current direction = ", this.directionFacing);

    // create and set up control stack
    var controlPanel = new GUI.StackPanel();
    controlPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    controlPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.glbGUI.addControl(controlPanel);

    let wBTN = GUI.Button.CreateSimpleButton("Move", "W");
    wBTN.width = "100px";
    wBTN.height = "100px";
    wBTN.color = "white";
    wBTN.background = "grey";
    wBTN.onPointerClickObservable.add(() => {
      setTimeout(async () => {
        this.claraMoveForwardFunction();
      });
    });

    controlPanel.addControl(wBTN);
  }

  // function to generate random tree
  // tree preferences:
  //    - Group 1: Tree1 - Tree7 (<50KB)
  //    - Group 2: Tree1 - Tree12 (<80KB)
  //    - Group 3: Tree1 - Tree15 (<200KB)
  getTree(xcoord: number, zcoord: number) {
    let tree = "Tree";

    if (this.detailLevel == 1) {
      tree += Math.floor(Math.random() * 7) + 1;
    } else if (this.detailLevel == 2) {
      tree += Math.floor(Math.random() * 12) + 1;
    } else if (this.detailLevel == 3) {
      tree += Math.floor(Math.random() * 15) + 1;
    }

    let mesh = Atlas.trees.get(tree + ".glb").createInstance("");
    mesh.position = new BABYLON.Vector3(xcoord, 1.6, zcoord);
    mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
  }

  // function to get decorative item
  // tall grasses:
  //    - Group 1: TallGrass1 (<=36KB)
  //    - Group 2: TallGrass1 - TallGrass4 (<=37KB)
  //    - Group 3: TallGrass1 - TallGrass5 (<=38KB)
  //
  // grass sets:
  //    - Group 1: GrassSet1 (<90KB)
  //    - Group 2: GrassSet1 - GrassSet3 (<130KB)
  //    - Group 3: GrassSet1 - GrassSet5 (<150KB)
  //
  // mushrooms:
  //    - Group 1: Mushrooms1 - Mushrooms2 (<40KB)
  //    - Group 2: Mushrooms1 - Mushrooms3 (<50KB)
  //    - Group 3: Mushrooms1 - Mushrooms4 (<60KB)
  chooseItem(xcoord: number, zcoord: number) {
    let item = "";
    let choice = Math.floor(Math.random() * 3);

    xcoord += (Math.random() * 1);
    zcoord += (Math.random() * 1);

    // switch to pick item
    switch (choice) {
      // case 0 = GrassSet
      case 0: {
        item = "GrassSet";
        if (this.detailLevel == 1) {
          item += Math.floor(Math.random() * 1) + 1;
          let mesh = Atlas.grass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, 1, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 2) {
          item += Math.floor(Math.random() * 4) + 1;
          let mesh = Atlas.grass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, 1, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 3) {
          item += Math.floor(Math.random() * 5) + 1;
          let mesh = Atlas.grass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, 1, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        break;
      }
      // case 1 = TallGrass
      case 1: {
        item = "TallGrass";
        if (this.detailLevel == 1) {
          item += Math.floor(Math.random() * 1) + 1;
          let mesh = Atlas.tallGrass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, 1, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 2) {
          item += Math.floor(Math.random() * 3) + 1;
          let mesh = Atlas.tallGrass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, 1, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        else if (this.detailLevel == 3) {
          item += Math.floor(Math.random() * 5) + 1;
          let mesh = Atlas.tallGrass.get(item + ".glb").createInstance("");
          mesh.position = new BABYLON.Vector3(xcoord, 1, zcoord);
          mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        }
        break;
      }
      // case 2 = Stones
      case 2: {
        item = "Stones" + (Math.floor(Math.random() * 2) + 1);
        let mesh = Atlas.stones.get(item + ".glb").createInstance("");
        mesh.position = new BABYLON.Vector3(xcoord, 1, zcoord);
        mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        break;
      }
      // case 3 = Mushrooms
      case 3: {
        /*
          NOT SURE IF WE SHOULD INCLUDE MUSHROOMS IF CLIENT WANTS TO USE THESE FOR MUSHROOM ITEMS
        */
        // item = "Mushrooms";
        // if (this.detailLevel == 1) {
        //   item += Math.floor(Math.random() * 2) + 1;
        //   let mesh = Atlas.mushrooms.get(item + ".glb").createInstance("");
        //   mesh.position = new BABYLON.Vector3(xcoord, 1.3, zcoord);
        //   mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        // }
        // else if (this.detailLevel == 2) {
        //   item += Math.floor(Math.random() * 3) + 1;
        //   let mesh = Atlas.mushrooms.get(item + ".glb").createInstance("");
        //   mesh.position = new BABYLON.Vector3(xcoord, 1.5, zcoord);
        //   mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        // }
        // else if (this.detailLevel == 3) {
        //   item += Math.floor(Math.random() * 4) + 1;
        //   let mesh = Atlas.mushrooms.get(item + ".glb").createInstance("");
        //   mesh.position = new BABYLON.Vector3(xcoord, 1.5, zcoord);
        //   mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
        // }
        break;
      }
      default: {
        break;
      }
    }
  } 

  checkMove() {
    switch (this.directionFacing) {
      case 0: {
        if (this.movementGrid[this.claraXCoord-1][this.claraYCoord] == 1
          || this.movementGrid[this.claraXCoord-1][this.claraYCoord] == 2) {
           return false;
         }
         this.claraXCoord -= 1;
         return true;
      }
      case 1: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord+1] == 1
          || this.movementGrid[this.claraXCoord][this.claraYCoord+1] == 2) {
           return false;
         }
         this.claraYCoord += 1;
         return true;
      }
      case 2: {
        if (this.movementGrid[this.claraXCoord+1][this.claraYCoord] == 1
          || this.movementGrid[this.claraXCoord+1][this.claraYCoord] == 2) {
           return false;
         }
         this.claraXCoord += 1;
         return true;
      }
      case 3: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord-1] == 1
          || this.movementGrid[this.claraXCoord][this.claraYCoord-1] == 2) {
           return false;
         }
         this.claraYCoord -= 1;
         return true;
      }
      default: {
        break;
      }
    }
  }

  fillGUI() {

  }

  checkMushroomMove(){
    switch (this.directionFacing) {
      case 0: {
        //check if ahead of mushroom is a tree or water
        if (this.movementGrid[this.claraXCoord-2][this.claraYCoord] == 1 ||
           this.movementGrid[this.claraXCoord-2][this.claraYCoord] == 2) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord-2][this.claraYCoord]);
           return false;
         }
         this.claraXCoord -= 1;
         return true;
      }
      case 1: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord+2] == 1 ||
           this.movementGrid[this.claraXCoord][this.claraYCoord+2] == 2) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord][this.claraYCoord+2]);
           return false;
         }
         this.claraYCoord += 1;
         return true;
      }
      case 2: {
        if (this.movementGrid[this.claraXCoord+2][this.claraYCoord] == 1 ||
           this.movementGrid[this.claraXCoord+2][this.claraYCoord] == 2) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord+2][this.claraYCoord]);
           return false;
         }
         this.claraXCoord += 1;
         return true;
      }
      case 3: {
        if (this.movementGrid[this.claraXCoord][this.claraYCoord-2] == 1 ||
           this.movementGrid[this.claraXCoord][this.claraYCoord-2] == 2) {
            console.log("ahead of mushroom is: " + this.movementGrid[this.claraXCoord][this.claraYCoord-2]);
           return false;
         }
         this.claraYCoord -= 1;
         return true;
      }
      default: {
        break;
      }
    }
  }

  initialiseClara(){
    if(this.directionFacing == 0){
      console.log("Clara starting direction: " + this.directionFacing);
      this.clara.rotate(BABYLON.Vector3.Up(), -1.5708); //turn clara left
      console.log("Clara starting direction: " + this.directionFacing);
    } else if(this.directionFacing == 2){
      this.clara.rotate(BABYLON.Vector3.Up(), 1.5708);  //turn clara right
    } else if(this.directionFacing == 3){
      this.clara.rotate(BABYLON.Vector3.Up(), 3.1416);  //turn clara around
    }
  }

  async customAnimationFunctionClara(nextPosition){
    setTimeout(async () => {
      var anim =  BABYLON.Animation.CreateAndStartAnimation("anim", 
                  this.clara, 
                  "position", 
                  60, 
                  60, 
                  this.currentPosition,
                  nextPosition,
                  //new BABYLON.Vector3(this.currentPosition._x-2.1, this.currentPosition._y, this.currentPosition._z), 
                  BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE); 

      this.playerAnimator.stop();
      this.playerAnimator.start(true, 1, 60, 160); //walk
      await anim.waitAsync();
      this.playerAnimator.stop();
      this.playerAnimator.start(true, 1, 0, 58); //idle
    });
  }

  claraTurnRightFunction(){
    if(!this.justMoved){
      this.justMoved = true;
      setTimeout(() => this.justMoved = false, 300);

      this.clara.rotate(BABYLON.Vector3.Up(), 1.5708);

      if (this.directionFacing != 3) {
        this.directionFacing++;
      }
      else {
        this.directionFacing = 0;
      }
      console.log("facing = ", this.directionFacing);
    }
    else{
      console.log("yo just wait");
    }

  }

  claraMoveForwardFunction(){
    if(!this.justMoved){
      if (this.checkMove() ) {



    //this.currentPosition = this.clara.position;
    this.justMoved = true;
    this.currentPosition = this.clara.position;
    setTimeout(() => this.justMoved = false, 1000); //after 1 second, becomes, false, allows the code to continue, prevents button being spammed


    console.log(this.currentPosition);


    var nextPosition;
    switch(this.directionFacing) {
      case 0: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x-2.1, this.currentPosition._y, this.currentPosition._z);
        //this.clara.movePOV(0,0,-2.1);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      case 1: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x, this.currentPosition._y, this.currentPosition._z+2.1);
        //this.clara.movePOV(2.1,0,0);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      case 2: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x+2.1, this.currentPosition._y, this.currentPosition._z);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      case 3: {
        nextPosition = new BABYLON.Vector3(this.currentPosition._x, this.currentPosition._y, this.currentPosition._z-2.1);
      // this.clara.movePOV(0,0,-2.1);
        //this.clara.movePOV(0,0,2.1);
        break;
      }
      default: {
        break;
      }
    }
      var anim =  this.customAnimationFunctionClara(nextPosition);
    }
    else {
      console.log("current postion is: " + this.currentPosition);
      console.log("invalid move!!!");
    }
  }
  else{
    console.log("yo can u just wait??");
  }
}

}