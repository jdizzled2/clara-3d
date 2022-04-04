import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/loaders/glTF/2.0/glTFLoader";

import { Atlas, preloadMeshes } from "./MeshLoader";

type SceneDefinition = {
  rows: number;
  columns: number;
  tiles: Array<{ r: number; c: number; d: number; tid: number }>;
};

export class SceneLoader {
  scene: BABYLON.Scene;
  light: BABYLON.HemisphericLight;
  assetsManager: BABYLON.AssetsManager;

  async initCanvas(canvas: HTMLCanvasElement) {
    let engine = new BABYLON.Engine(canvas, true);

    let createScene = () => {
      let scene = new BABYLON.Scene(engine);
      this.scene = scene;

      //this.scene.clearColor = BABYLON.Color3.White();
      //scene.clearColor = new BABYLON.Color4(0,0,0,0);

      let camera = new BABYLON.ArcRotateCamera(
        "camera",
        0,
        BABYLON.Tools.ToRadians(25),
        30,
        new BABYLON.Vector3(11, -2, 13.5),
        scene
      );

      /* NEED TO IMPORT BABYLON/GUI */
      // if (btn. == pos1 ) some if statement
      // top camera settings
      // camera.lowerBetaLimit = BABYLON.Tools.ToRadians(25);
      // camera.upperBetaLimit = BABYLON.Tools.ToRadians(25);
      // camera.lowerRadiusLimit = 30;
      // camera.upperRadiusLimit = 30;

      // mid camera settings limit to only circling around map at set distance
      // camera.lowerBetaLimit = Math.PI/2;
      // camera.upperBetaLimit = Math.PI/3;
      // camera.lowerRadiusLimit = 30;
      // camera.upperRadiusLimit = 30;

      // pov camera? maybe

      // camera.angularSensibilityX/Z changes camera sensitivity
      // higher the value is, slower camera moves
      camera.angularSensibilityX = 5000;
      camera.angularSensibilityY = 5000;

      camera.checkCollisions = true;
      camera.attachControl("canvas", true);

      /* NEED TO GET SHADOWS WORKING */
      let light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(1, 1, 0),
        scene
      );
      this.light = light;

      scene.enableDepthRenderer();
      return scene;
    };

    window.addEventListener("resize", function () {
      engine.resize();
    });

    var scene = createScene();

    this.assetsManager = new BABYLON.AssetsManager(scene);

    console.log("Preloading ...");
    await preloadMeshes(this.assetsManager);
    console.log("Loaded");

    engine.runRenderLoop(function () {
      scene.render();
    });
  }

  loadScene(definition: SceneDefinition) {
    let { rows, columns } = definition;

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
        // find if current tile exists
        let existingTile = definition.tiles.find(
          (t) => t.c === columnIndex && t.r === rowIndex
        );

        // if current tile exists, place lighter grass
        if (existingTile) {
          // if existing tile is tree, place darker grass
          if (existingTile.tid == 1) {
            // let mesh = Atlas.grass.get("GrassTop1.glb").createInstance("");
            // mesh.position = new BABYLON.Vector3(
            //   rowIndex * 2.1,
            //   0,
            //   columnIndex * 2.1
            // );
            // BABYLON.SceneLoader.ImportMesh(
            //   "",
            //   "./",
            //   "GrassTop1.glb",
            //   this.scene,
            //   function (meshes) {
            //     meshes.forEach((mesh) => {
            //       if (mesh.material) {
            //         mesh.material.needDepthPrePass = true;
            //       }
            //     });
            //     let tile = meshes[0];
            //     tile.position = new BABYLON.Vector3(
            //       rowIndex * 2.1,
            //       0,
            //       columnIndex * 2.1
            //     );
            //   }
            // );
            let top = Atlas.grass.get("GrassTop1.glb").createInstance("top");
            top.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              0,
              columnIndex * 2.1
            );
          }
          // if existing tile is water, place water tile
          else if (existingTile.tid == 2) {
            // need to get water block
            // if water tile on edge of map, place waterfall
          }
          // existing tile is game object (clara, leaf, ghost), place lighter grass
          else if (
            existingTile.tid == 4 ||
            existingTile.tid == 5 ||
            existingTile.tid == 6 ||
            existingTile.tid == 7 ||
            existingTile.tid == 8 ||
            existingTile.tid == 9 ||
            existingTile.tid == 10 ||
            existingTile.tid == 11 ||
            existingTile.tid == 12 ||
            existingTile.tid == 13 ||
            existingTile.tid == 14 ||
            existingTile.tid == 15
          ) {
            let top = Atlas.grass.get("GrassTop2.glb").createInstance("top");
            top.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              0,
              columnIndex * 2.1
            );
          }
        } else {
          let top = Atlas.grass.get("GrassTop2.glb").createInstance("top");
          top.position = new BABYLON.Vector3(
            rowIndex * 2.1,
            0,
            columnIndex * 2.1
          );
        }

        if (existingTile) {
          if (existingTile.tid == 1) {
            this.getTree(rowIndex * 2.1, columnIndex * 2.1);
            // BABYLON.SceneLoader.ImportMesh("", "./", "Tree7.glb", this.scene, function (meshes) {
            //   meshes.forEach((mesh) => {
            //     if (mesh.material) {
            //       mesh.material.needDepthPrePass = true;
            //     }
            //     // attempt at shadow generation, it did not work
            //     // var shadowGenerator = new BABYLON.ShadowGenerator(1024, this.light);
            //     // shadowGenerator.usePoissonSampling = true;

            //     // for (var i = 0; i < meshes.length; i++) {
            //     //   meshes[i].receiveShadows = true;
            //     //   //meshes[i].material = myMaterial;
            //     //   shadowGenerator.addShadowCaster(meshes[i], true);
            //     // }
            //   });
            //   let tile = meshes[0];
            //   tile.position = new BABYLON.Vector3(
            //     rowIndex *2.1,
            //     1.6,
            //     columnIndex * 2.1
            //   );
            // });
            // BABYLON.SceneLoader.ImportMesh("", "./", "GrassTop1.glb", this.scene, function (meshes) {
            //   meshes.forEach((mesh) => {
            //     if (mesh.material) {
            //       mesh.material.needDepthPrePass = true;
            //     }
            //   });
            //   let tile = meshes[0];
            //   tile.position = new BABYLON.Vector3(rowIndex*2.1, 0, columnIndex*2.1);
            // });
          } else if (existingTile.tid == 4) {
            var box = BABYLON.Mesh.CreateBox("Box", 1.0, this.scene);
            box.position = new BABYLON.Vector3(
              rowIndex * 2.1,
              1.5,
              columnIndex * 2.1
            );
          }
        } //else {
        //   BABYLON.SceneLoader.ImportMesh(
        //     "",
        //     "./",
        //     "GrassTop2.glb",
        //     this.scene,
        //     function (meshes) {
        //       meshes.forEach((mesh) => {
        //         if (mesh.material) {
        //           mesh.material.needDepthPrePass = true;
        //         }
        //       });
        //       let tile = meshes[0];
        //       tile.position = new BABYLON.Vector3(
        //         rowIndex * 2.1,
        //         0,
        //         columnIndex * 2.1
        //       );
        //     }
        //   );
        // }
      }
    }
    /* NEED TO GET BOTTOM OF ISLAND SCALING */ // island is 4.5 tiles x 4.5 tiles
    //let island = null;
    // let tile = Atlas.islands.get("Island.glb").createInstance("island");
    // tile.position = new BABYLON.Vector3(rows, 1.1, columns);
    // tile.scaling = new BABYLON.Vector3(2, 5, 2);

    BABYLON.SceneLoader.ImportMesh(
      "",
      "./",
      "island.glb",
      this.scene,
      function (meshes) {
        //island = meshes[0];
        meshes.forEach((mesh) => {
          // mesh.scaling = new BABYLON.Vector3(rows/5, 0, columns/5);
          if (mesh.material) {
            mesh.material.needDepthPrePass = true;
          }
          // mesh.scaling = new BABYLON.Vector3(rows/5, 5, columns/5);
          //mesh.position = new BABYLON.Vector3(rows,1.1, columns);
        });
        let tile = meshes[0];
        //console.log(meshes);
        //meshes[0].scaling = new BABYLON.Vector3(1, 0, 1);
        tile.position = new BABYLON.Vector3(rows, 1.1, columns);
        tile.scaling = new BABYLON.Vector3(2, 5, 2);
        // tile.position = new BABYLON.Vector3(rows, 1.1, columns);
      }
    );

    var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      "UI",
      true,
      this.scene
    );

    var slider = new GUI.Slider();
    slider.minimum = 0.1;
    slider.maximum = 20;
    slider.value = 5;
    slider.height = "60px";
    slider.width = "150px";
    slider.color = "#003399";
    slider.background = "grey";
    slider.left = "120px";
    slider.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    slider.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    slider.onValueChangedObservable.add(function (value) {
      // sphere.scaling = unitVec.scale(value);
      console.log(value);
    });

    advancedTexture.addControl(slider);
    //console.log(island);
    // this.scene.getMeshByName('Plane1_primitive0').scaling.x = rows/5;
    // this.scene.getMeshByName('Plane1_primitive0').scaling.y = 0;
    // this.scene.getMeshByName('Plane1_primitive0').scaling.z = columns/5;

    // for (let i = 0; Math.ceil((rows+columns)/4.5); i++) {
    //     BABYLON.SceneLoader.ImportMesh("", "./", "island.glb", this.scene, function (meshes) {
    //       meshes.forEach((mesh) => {
    //         if (mesh.material) {
    //           mesh.material.needDepthPrePass = true;
    //         }
    //       });
    //       let tile = meshes[0];
    //       tile.position = new BABYLON.Vector3(i*4.5, 1.1, i*4.5);
    //     });
    // }
    // for (let i = 0; i < rows+columns; i++) {
    //   BABYLON.SceneLoader.ImportMesh("", "./", "island.glb", this.scene, function (meshes) {
    //     meshes.forEach((mesh) => {
    //       if (mesh.material) {
    //         mesh.material.needDepthPrePass = true;
    //       }
    //     });
    //     let tile = meshes[0];
    //     tile.position = new BABYLON.Vector3(i, 1.1, i);
    //   });
    // }
  }

  // function to generate random tree
  // may want to add priority to smaller trees
  // need to add scaling for lower end systems
  getTree(xcoord, zoord) {
    let tree = "Tree";
    tree += Math.floor(Math.random() * 10) + 1;

    let mesh = Atlas.trees.get(tree + ".glb").createInstance("");
    mesh.position = new BABYLON.Vector3(xcoord, 1.6, zoord);
    mesh.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);

    // BABYLON.SceneLoader.ImportMesh(
    //   "",
    //   "./",
    //   tree + ".glb",
    //   this.scene,
    //   function (meshes) {
    //     meshes.forEach((mesh) => {
    //       if (mesh.material) {
    //         mesh.material.needDepthPrePass = true;
    //       }
    //     });
    //     let tile = meshes[0];
    //     tile.position = new BABYLON.Vector3(xcoord, 1.6, zoord);
    //     tile.rotation = new BABYLON.Vector3(0, Math.random() * 180, 0);
    //   }
    // );
  }
}
