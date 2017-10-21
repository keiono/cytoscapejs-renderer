import React, {Component} from 'react'
import sigma from 'sigma'
import PropTypes from 'prop-types'

import {DEFAULT_SETTINGS, RENDERER_TYPE, PRESET_COLORS} from './SigmaConfig'

import CXStyleUtil from './CXStyleUtil'

import {CustomShapes} from './plugins/sigma.renderers.customShapes'
import {ShapeLibrary} from './plugins/shape-library'

import {addCustomMethods} from './customMethods'
import {CommandExecutor} from './CommandHandler'

// Renderer types supported by Sigma.js
const DEF_EDGE_WIDTH = 0.01


class SigmaRenderer extends Component {

  constructor (props, context) {
    super(props, context)

    this.state = {

      'initialized': false,
      nodeColors: {},
      edgeColors: {},
    }

  }


  shouldComponentUpdate(nextProps, nextState) {
    // Update is controlled by componentWillReceiveProps()
    return false
  }


  componentWillReceiveProps(nextProps) {

    const command = nextProps.command
    console.log("@@ Command: ")
    console.log(command)

    if (command !== this.props.command) {
      if(command.parameters === undefined || command.parameters === {}) {
        CommandExecutor(command.command, [this.cam])
      } else {
        //TODO: generalize this!

        const targetNode = this.s.graph.nodes(command.parameters)
        console.log(targetNode)
        CommandExecutor(command.command, [this.cam, targetNode])
      }
    }
  }

  componentDidMount () {

    const cxData = this.props.network.cxData
    let cyVS = null
    if(cxData !== undefined) {
      cyVS = cxData.cyVisualProperties
    }

    if(cyVS !== null) {
      this.styleUtil = new CXStyleUtil(this.props.network, cyVS)

    } else {
      this.styleUtil = new CXStyleUtil(this.props.network)

    }

    const nodes = this.props.network.elements.nodes
    const edges = this.props.network.elements.edges

    const graph = {
      nodes: [],
      edges: []
    }

    const nodesLen = nodes.length
    const colors = {}

    let i = nodesLen
    while(i--) {
      const node = nodes[i]
      const nodeData = node.data
      const sigmaNode = {
        'id': nodeData.id,
        'label': nodeData.Label,
        'x': node.position.x,
        'y': node.position.y,
        'size': nodeData.Size,
        props: nodeData,
        'color': this.styleUtil.getNodeColor(nodeData)
      }

      graph.nodes.push(sigmaNode)

      colors[nodeData.id] = sigmaNode.color
    }

    const hiddenEdges = {

    }

    edges.forEach((edge) => {

      const ed = edge.data
      const newEdge = {
        'id': ed.id,
        'source': ed.source,
        'target': ed.target,
        'size': DEF_EDGE_WIDTH,
        type: 'arrow',
        // 'color': this.styleUtil.getEdgeColor(ed.Data),
        // 'hover_color': this.styleUtil.getEdgeSelectedColor()
      }

      if(ed[this.props.edgeTypeTagName] !== 'Tree') {
        newEdge.color = '#FFAA00'

        const source = hiddenEdges[ed.source]
        const target = hiddenEdges[ed.target]

        if(source === undefined) {
          hiddenEdges[ed.source] = [newEdge]
        } else {
          source.push(newEdge)
        }

        if(target === undefined) {
          hiddenEdges[ed.target] = [newEdge]
        } else {
          target.push(newEdge)
        }
      } else {
        graph.edges.push(newEdge)
      }

    })

    this.hiddenEdges = hiddenEdges

    const settings = DEFAULT_SETTINGS


    // Add custom methods for neighbours
    addCustomMethods()

    // Create new instance of renderer with new camera
    this.s = new sigma({
      graph: graph,
      'settings': settings
    })
    this.cam = this.s.addCamera({isAnimated: true});

    this.addEventHandlers()

    this.colors = colors


    this.s.addRenderer({
      'container': this.sigmaView,
      'type': RENDERER_TYPE.WEBGL,
      'camera': this.cam
    });

    // CustomShapes.init(this.s)
    this.s.refresh()

  }


  addEventHandlers = () => {

    this.s.bind('clickNode', e => {

      this.resetView()

      const node = e.data.node
      const nodeId = node.id
      const nodeProps = {}


      const neighbours = this.s.graph.adjacentNodes(nodeId)
      console.log(neighbours)

      const connectingEdges = this.s.graph.adjacentEdges(nodeId)
      console.log(connectingEdges)

      // Special case: Link node
      if(connectingEdges !== undefined) {

        const targetNodeId = connectingEdges[0].target
        const targetNode = this.s.graph.nodes(targetNodeId)


        if(targetNode.props.Label.startsWith('Hidden')) {
          CommandExecutor('zoomToNode', [this.cam, node])
          return
        }

      }

      this.s.settings('labelColor', 'node');
      this.s.settings('minEdgeSize', 0.1);
      this.s.settings('maxEdgeSize', 1);

      connectingEdges.forEach(edge => {
        const sourceId = edge.source
        const sourceNode = this.s.graph.nodes(sourceId)

        if(edge.source === nodeId) {
          // Out edge
          edge.color = PRESET_COLORS.SELECT
          edge.size = 10
        } else if (sourceNode.props.Label.startsWith('Hidden')) {
          edge.color = PRESET_COLORS.BLACK
          edge.size = 0.5
        } else if (sourceNode.props.NodeType !== 'Gene') {
          edge.color = PRESET_COLORS.SELECT
          edge.size = 2
        } else {
          edge.color = PRESET_COLORS.LIGHT
          edge.size = 2
        }
      })

      this.nodeSelected(node)
      nodeProps[nodeId] = node

      neighbours.forEach(node => {
        const nodeData = node.props
        if(nodeData.NodeType === 'Gene') {
          node.color = PRESET_COLORS.LIGHT
        } else if (nodeData.Label.startsWith('Hidden')) {

          // This is a special case.
          const linkNodes = this.s.graph.adjacentNodes(node.id)
          linkNodes.forEach(linkNode => {
            linkNode.color = PRESET_COLORS.BLACK
          })
          const linkEdges = this.s.graph.adjacentEdges(node.id)
          linkEdges.forEach(linkEdge => {
            linkEdge.color = PRESET_COLORS.BLACK
            linkEdge.type = 'fast'
          })

          node.size = 0.1
          node.color = PRESET_COLORS.BLACK
        } else {
          node.color = PRESET_COLORS.SELECT
        }
      })

      node.color = PRESET_COLORS.SELECT

      this.s.refresh()


      // Move camera to node
      CommandExecutor('zoomToNode', [this.cam, node, 0.01])

      this.props.eventHandlers.selectNodes([nodeId], nodeProps)
    })

    // this.cam.bind('coordinatesUpdated', e => {
    //   console.log('CAMERA EVENT:')
    //   console.log(e)
    //
    // })

    this.s.bind('doubleClickStage', (e) => {

      console.log('RESET^^^^^^^^^^^^^^^')
      console.log(e.type, e.data.captor);

      this.s.settings('labelColor', 'node');
      this.s.settings('minEdgeSize', 0.001);
      this.s.settings('maxEdgeSize', 0.3);

      const nodes = this.s.graph.nodes()
      const edges = this.s.graph.edges()

      let i = nodes.length
      while(i--) {
        const node = nodes[i]
        node.color = this.colors[node.id]
      }

      let j = edges.length

      // Reset edges
      while(j--) {
        edges[j].color = PRESET_COLORS.GRAY
        edges[j].size = DEF_EDGE_WIDTH
      }

      this.resetNodePositions()

      const currentHidden = this.state.currentHiddenEdges

      if(currentHidden !== undefined) {
        currentHidden.forEach(hiddenEdge => {
          this.s.graph.dropEdge(hiddenEdge.id)
        })
      }

      this.setState({currentHiddenEdges: undefined})

      this.s.refresh()

    });

    // this.s.bind('doubleClickStage', (e) => {
    //
    //   CommandExecutor('fit', [this.cam])
    // });

  }

  resetView = () => {

    const nodes = this.s.graph.nodes()
    const edges = this.s.graph.edges()

    let i = nodes.length
    while(i--) {
      const node = nodes[i]
      node.color = this.colors[node.id]
    }

    let j = edges.length

    // Reset edges
    while(j--) {
      edges[j].color = PRESET_COLORS.GRAY
      edges[j].size = DEF_EDGE_WIDTH
    }

  }

  nodeSelected = node => {

    console.log('2 Selected: ')
    console.log(node)
    console.log(this.hiddenEdges[node.id])

    const currentHidden = this.state.currentHiddenEdges

    if(currentHidden !== undefined) {
      currentHidden.forEach(hiddenEdge => {
        this.s.graph.dropEdge(hiddenEdge.id)
      })
    }
    this.setState({currentHiddenEdges: undefined})

    const nodes = this.s.graph.nodes()
    const edges = this.s.graph.edges()

    this.resetNodePositions()


    let i = nodes.length

    while(i--) {
      nodes[i].color = PRESET_COLORS.GRAY
    }

    let j = edges.length

    // while(j--) {
    //   edges[j].color = FADED_EDGE_COLOR
    // }

    // Highlight
    node.color = PRESET_COLORS.SELECT

    const hidden = this.hiddenEdges[node.id]

    const hiddenNodes = {}

    if(hidden !== undefined) {
      this.setState({currentHiddenEdges: hidden})

      let count = 0

      let circleCount = 0

      hidden.forEach(hiddenEdge => {
        this.s.graph.addEdge(hiddenEdge)

        const source = hiddenEdge.source
        const target = hiddenEdge.target
        const sn = this.s.graph.nodes(source)
        const tn = this.s.graph.nodes(target)
        hiddenNodes[sn.id] = [sn.x, sn.y]
        hiddenNodes[tn.id] = [tn.x, tn.y]


        let nNode = null
        if(source.id !== node.id) {
          nNode = this.s.graph.nodes(source)
        }else {
          nNode = this.s.graph.nodes(target)
        }


        const radius = circleCount * 2 + 9
        const newPos = project(count + circleCount*2, radius)
        count = count + 10
        if(count%36 === 0) {
          circleCount++
        }

        nNode.x = newPos[0] + node.x
        nNode.y = newPos[1] + node.y


        nNode.color = '#FF7700'
      })


      // Move camera
      sigma.misc.animation.camera(
        this.cam,
        {
          x: node[this.cam.readPrefix + 'x'],
          y: node[this.cam.readPrefix + 'y'],
          ratio: 0.02
        },
        {
          duration: 450
        }
      );
    }

    this.setState({currentHiddenNodes: hiddenNodes})


  }

  resetNodePositions = () => {
    const hiddenNodes = this.state.currentHiddenNodes

    if(hiddenNodes !== undefined) {
      const hiddenIds = Object.keys(hiddenNodes)
      console.log(hiddenIds)
      hiddenIds.forEach(key=> {
        this.s.graph.nodes(key).x = hiddenNodes[key][0]
        this.s.graph.nodes(key).y = hiddenNodes[key][1]
      })
    }

    this.setState({currentHiddenNodes: undefined})

  }

  edgeSelected = (edge) => {

    console.log('Edge Selected: ')
    console.log(edge)

  }

  render () {
    return (
      <div
        ref={sigmaView => this.sigmaView = sigmaView}
        style={this.props.style}
      />
    )
  }

}

SigmaRenderer.propTypes = {

  // Indicates hidden edge or not.
  edgeTypeTagName: PropTypes.string,

  // Network Style in CyVisualProperties object
  networkStyle: PropTypes.object,

  // Contains sigma.js options
  rendererOptions: PropTypes.object
}


SigmaRenderer.defaultProps = {

  edgeTypeTagName: 'Is_Tree_Edge',

  networkStyle: {

  },

  rendererOptions: {

    settings: DEFAULT_SETTINGS,

    rendererType: RENDERER_TYPE.CANVAS,
  }
}


const project = (x, y) => {
  const angle = (x - 90) / 180 * Math.PI
  const radius = y
  return [
    radius * Math.cos(angle),
    radius * Math.sin(angle)
  ];
}


export default SigmaRenderer
