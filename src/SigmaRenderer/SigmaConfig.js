export const PRESET_COLORS = {
  LIGHT: '#3FB4BD',
  DARK: '#13363B',
  SELECT: '#DF4240',
  GRAY: '#ADABAD',
  WHITE: '#FEFEFE',
  BLACK: '#333333'
}

export const DEFAULT_SETTINGS = {

  'defaultLabelColor': '#333333',
  'defaultNodeColor': '#bbbbbb',
  'defaultEdgeColor': PRESET_COLORS.BLACK,
  defaultHoverLabelBGColor: '#EEEEFF',
  'labelColor': 'default',
  'edgeColor': 'source',
  'mouseZoomDuration': 0,
  'mouseInertiaDuration': 0,
  doubleClickEnabled: false,
  'labelThreshold': 10,
  'labelSizeRatio': 1.4,
  'zoomingRatio': 1.12,
  'labelSize': 'propertional',

  'zoomMin': 0.0001,
  minNodeSize: 0.1,
  maxNodeSize: 15,

  hideEdgesOnMove: true,
  minEdgeSize: 0.001,
  maxEdgeSize: 0.3,
  enableEdgeHovering: false,
  edgeHoverColor: 'edge',
  defaultEdgeHoverColor: '#000',
  edgeHoverSizeRatio: 1,
  edgeHoverExtremities: true
}

export const RENDERER_TYPE = {
  WEBGL: 'webgl',
  CANVAS: 'canvas'
}



export const PRESET_GRAPH_SIZE = {
  SMALL: 4000,
  MEDIUM: 10000,
  LARGE: 20000
}

export const SIZE_SENSITIVE_RENDERING_OPT = {
  SMALL: {
    minNodeSize: 3,
    maxNodeSize: 20,
    labelThreshold: 4,
    labelSizeRatio: 1,
    nodesPowRatio: 0.8,
    defaultEdgeType: 'curve'
  },
  MEDIUM: {

  },
  LARGE: {
    labelColor: 'default',
    defaultLabelColor: '#444444',
    edgeColor: 'default',
    defaultEdgeColor: '#DDDDDD',
    minEdgeSize: 0.001,
    maxEdgeSize: 0.1,
    minNodeSize: 0,
    maxNodeSize: 20,
    labelThreshold: 4,
    labelSizeRatio: 2,
    nodesPowRatio: 0.55,
    edgesPowRatio: 0.3
  }
}
