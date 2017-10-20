import sigma from 'sigma'

const DEF_ZOOM_RATIO = 1.2


const fit = (camera) => {

  console.log("Camera: ")
  console.log(camera)

  sigma.misc.animation.camera(
    camera,
    {
      'angle': 0,
      'ratio': 1,
      'x': 0,
      'y': 0,
    },
    {'duration': 500},
  )

}

const zoomToNode = (camera, node, ratio=0.001) => {

  sigma.misc.animation.camera(
    camera,
    {
      x: node[camera.readPrefix + 'x'],
      y: node[camera.readPrefix + 'y'],
      ratio: ratio
    },
    {
      duration: 450
    }
  );


}

const zoomIn = (camera, zoomRatio = DEF_ZOOM_RATIO) => {

  sigma.misc.animation.camera(
    camera,
    {'ratio': camera.ratio / zoomRatio},
    {'duration': 150},
  );

}

const zoomOut = (camera, zoomRatio = DEF_ZOOM_RATIO) => {

  sigma.misc.animation.camera(
    camera,
    {'ratio': camera.ratio * zoomRatio},
    {'duration': 150},
  );

}


const commands = {
  fit,
  zoomToNode,
  zoomIn,
  zoomOut,
}

export const CommandExecutor = (commandName, args=[]) => {

  const command = commands[commandName]
  if (command !== undefined) {

    // If such command is available, execute it.
    command(...args)

  } else {
    console.warn(`Command is not available: ${commandName}`)
  }

}
