import React, {Component} from 'react'
import * as sg from 'sigma'
import PropTypes from 'prop-types'
import Immutable, {Map} from 'immutable'

import {DEFAULT_SETTINGS, RENDERER_TYPE} from './SigmaConfig'

import CXStyleUtil from './CXStyleUtil'

// Renderer types supported by Sigma.js


class SigmaRenderer extends Component {

  constructor (props, context) {
    super(props, context)

    this.state = {
      'initialized': false
    }


    this.styleUtil = new CXStyleUtil()
  }

  componentDidMount () {

    const nodes = this.props.network.elements.nodes
    const edges = this.props.network.elements.edges

    const graph = {
      nodes: [],
      edges: []
    }

    const nodesLen = nodes.length
    const colors = new Array(nodesLen)

    let i = nodesLen
    while(i--) {
      const node = nodes[i]
      const nodeData = node.data
      const sigmaNode = {
        'id': nodeData.id,
        'label': nodeData.name,
        'x': node.position.x,
        'y': node.position.y,
        'size': nodeData.Size * 2,
        'color': this.styleUtil.getNodeColor(nodeData)
      }

      graph.nodes.push(sigmaNode)

      colors[i] = node.color
    }

    const hiddenEdges = {

    }

    edges.forEach((edge) => {

      const ed = edge.data
      const newEdge = {
        'id': ed.id,
        'source': ed.source,
        'target': ed.target,
        'size': 1,
        type: 'curve',
        'color': this.styleUtil.getEdgeColor(ed.Data),
        'hover_color': this.styleUtil.getEdgeSelectedColor()
      }

      if(ed.Is_Tree_Edge !== 'Tree') {
        newEdge.color = '#FFAA00'
        newEdge['type'] = 'curve'

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
    const rendererOptions = this.props.rendererOptions
    let rendererType = rendererOptions.rendererType

    // This is not compatible with WegGL renderer.
    if(rendererType === undefined || rendererType === RENDERER_TYPE.WEBGL) {
      settings.enableEdgeHovering = false
    }

    // Create new instance of renderer with new camera
    this.s = new sg.sigma({
      graph: graph,
      'settings': settings
    })
    this.cam = this.s.addCamera();

    this.addEventHandlers()

    this.colors = colors

    if(rendererType === undefined) {
      rendererType = RENDERER_TYPE.CANVAS
      settings.enableEdgeHovering = true
    }

    this.s.addRenderer({
      'container': this.sigmaView,
      'type': rendererType,
      'camera': this.cam
    });
    this.s.refresh()

  }


  addEventHandlers = () => {

    this.s.bind('clickNode', e => {

      this.nodeSelected(e.data.node)

    })


    if (this.props.rendererType !== undefined && this.props.rendererType !== RENDERER_TYPE.WEBGL) {

      this.s.bind('overEdge clickEdge', (e) => {

        console.log(e.type, e.data.edge, e.data.captor);

      });

    }

    this.s.bind('clickStage', (e) => {

      console.log('RESET^^^^^^^^^^^^^^^')
      console.log(e.type, e.data.captor);

      const nodes = this.s.graph.nodes()
      let i = nodes.length
      while(i--) {
        nodes[i].color = this.colors[i]
      }

      const currentHidden = this.state.currentHiddenEdges

      if(currentHidden !== undefined) {
        currentHidden.forEach(hiddenEdge => {
          this.s.graph.dropEdge(hiddenEdge.id)
        })
      }

      this.setState({currentHiddenEdges: undefined})

      this.s.refresh()

    });

    this.s.bind('doubleClickStage', (e) => {

      console.log("RESTE*******************************")
      console.log(e.type, e.data.captor);

      sg.misc.animation.camera(
        this.cam,
        {x: 0, y: 0, angle: 0, ratio: 1},
        {duration: 350}
      )

    });

  }

  nodeSelected = (node) => {

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
    let i = nodes.length

    while(i--) {
      nodes[i].color = '#EEEEEE'
    }

    // Highlight
    node.color = "#FF7700"

    const hidden = this.hiddenEdges[node.id]


    if(hidden !== undefined) {
      this.setState({currentHiddenEdges: hidden})

      let count = 0

      hidden.forEach(hiddenEdge => {
        this.s.graph.addEdge(hiddenEdge)

        const source = hiddenEdge.source
        const target = hiddenEdge.target

        let nNode = null
        if(source.id !== node.id) {
          nNode = this.s.graph.nodes(source)
        }else {

          nNode = this.s.graph.nodes(target)
        }

        const newPos = project(count, 10)
        count = count + 10

        nNode.x = newPos[0] + node.x
        nNode.y = newPos[1] + node.y

        nNode.color = '#FF7700'
      })
    }

    this.s.refresh()

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

  // Network Style in CyVisualProperties object
  networkStyle: PropTypes.object,

  // Contains sigma.js options
  rendererOptions: PropTypes.object
}


SigmaRenderer.defaultProps = {

  networkStyle: {

  },

  rendererOptions: {

    settings: DEFAULT_SETTINGS,

    rendererType: RENDERER_TYPE.WEBGL,
  }
}

const flipColor = nodes => {

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
