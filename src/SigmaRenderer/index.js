import React, {Component} from 'react'
import * as sg from 'sigma'
import PropTypes from 'prop-types'
import Immutable from 'immutable'

import CXStyleUtil from './CXStyleUtil'


const DEF_SIGMA_SETTINGS = {
  'defaultLabelColor': '#000000',
  'defaultNodeColor': '#00DDFF',
  'defaultEdgeColor': 'rgba(190,190,190,0.3)',
  'labelColor': 'node',
  'edgeColor': 'source',
  'mouseZoomDuration': 0,
  'mouseInertiaDuration': 0,
  'doubleClickZoomDuration': 5,
  'labelThreshold': 8,
  'zoomingRatio': 1.2,
  'labelSizeRatio': 3,
  'labelSize': 'propertional',

  'zoomMin': 0.003,
  'minEdgeSize': 0.5,
  'maxEdgeSize': 4,
  'enableEdgeHovering': true,
  'edgeHoverColor': 'edge',
  'defaultEdgeHoverColor': '#000',
  'edgeHoverSizeRatio': 1,
  'edgeHoverExtremities': true
}


class SigmaRenderer extends Component {

  constructor (props, context) {

    super(props, context)

    this.state = {
      'initialized': false
    }

    this.styleUtil = new CXStyleUtil()

  }

  componentDidMount () {

    console.log(`Mount: ${this.state.initialized}`)
    this.setState({'initialized': true})

    const nodes = this.props.network.elements.nodes
    const edges = this.props.network.elements.edges

    const s = new sg.sigma({'settings': DEF_SIGMA_SETTINGS})
    const cam = s.addCamera();


    nodes.forEach(node => {

      const nodeData = node.data
      const sigmaNode = {
        'id': nodeData.id,
        'label': nodeData.name,
        'x': node.position.x,
        'y': node.position.y,
        'size': nodeData.Size,
        'color': this.styleUtil.getNodeColor(nodeData)
      }

      s.graph.addNode(sigmaNode);

    })

    edges.forEach((edge) => {

      const ed = edge.data
      s.graph.addEdge({
        'id': ed.id,
        'source': ed.source,
        'target': ed.target,
        'size': 1,
        'color': '#FFFFFF',
        'hover_color': '#FF0000'
      });

    })


    this.addEventHandlers(s)


    s.addRenderer({
      'container': this.sigmaView,
      'type': this.props.rendererType,
      'camera': cam
    });
    s.refresh()


  }

  addEventHandlers = (s) => {

    s.bind('overNode outNode clickNode doubleClickNode rightClickNode', (e) => {

      this.nodeSelected(e.data.node)

    })


    if (this.props.rendererType !== 'webgl') {

      s.bind('overEdge outEdge clickEdge doubleClickEdge rightClickEdge', (e) => {

        console.log(e.type, e.data.edge, e.data.captor);

      });

    }

    s.bind('clickStage', (e) => {

      console.log(e.type, e.data.captor);

    });

    s.bind('doubleClickStage rightClickStage', (e) => {

      console.log(e.type, e.data.captor);

    });

  }

  nodeSelected = (node) => {

    console.log('Selected: ')
    console.log(node)

  }

  edgeSelected = (edge) => {

    console.log('Edge Selected: ')
    console.log(edge)

  }

  render () {

    return (
      <div
        ref={(sigmaView) => this.sigmaView = sigmaView}
          style={this.props.style}
      />
    )

  }

}

SigmaRenderer.propTypes = {
  // Renderer type: 'webgl' or 'canvas'
  'rendererType': PropTypes.string,

  // Network Style in CyVisualProperties object
  'networkStyle': PropTypes.object
}

SigmaRenderer.defaultProps = {'rendererType': 'canvas'}



export default SigmaRenderer
