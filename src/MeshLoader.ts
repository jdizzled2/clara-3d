import * as BABYLON from "@babylonjs/core";

export const Atlas = {
  trees: new Map<string, BABYLON.Mesh>(),
  grass: new Map<string, BABYLON.Mesh>(),
  //islands: new Map<string, BABYLON.Mesh>(),
  players: new Map<string, BABYLON.Mesh>(),
  leaves: new Map<string, BABYLON.Mesh>(),
  // etc, lots
};

let tiles: { [index: string]: string[] } = {
  grass: ["GrassTop1.glb", "GrassTop2.glb"],
  //islands: ["Island.glb"],
  trees: [
    "Tree1.glb",
    "Tree2.glb",
    "Tree3.glb",
    "Tree4.glb",
    "Tree5.glb",
    "Tree6.glb",
    "Tree7.glb",
    "Tree8.glb",
    "Tree9.glb",
    "Tree10.glb",
  ],
  players: [],
  leaves: [],
};

export function preloadMeshes(assetsManager: BABYLON.AssetsManager) {
  let totalToLoad = Object.keys(tiles).reduce((p, n) => p + tiles[n].length, 0);

  return new Promise<void>((resolve, reject) => {
    for (let key of Object.keys(tiles)) {
      let paths = tiles[key];

      // for some reason the main mesh is on index 1 not 0 in all other meshes but island
      let meshIndex = key === "islands" ? 2 : 1;

      for (let path of paths) {
        const root = `./`;
        const name = ""; // `load ${root}${path}`;
        const meshTask = assetsManager.addMeshTask(name, "", root, path);

        // if we fail to load the mesh we reject this asynchronous task
        meshTask.onError = () => {
          reject();
        };

        meshTask.onSuccess = (task) => {
          // disable the original mesh and store it in the Atlas
          task.loadedMeshes[0].setEnabled(false);
          Atlas[key].set(path, task.loadedMeshes[meshIndex]);

          // we need a prepass for better depth rendering
          task.loadedMeshes.forEach((mesh) => {
            if (mesh.material) {
              mesh.material.needDepthPrePass = true;
            }
          });

          // check if we loaded everything
          totalToLoad--;

          if (totalToLoad == 0) {
            resolve();
          }
        };
      }
    }
    assetsManager.load();
  });
}
