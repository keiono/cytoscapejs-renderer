import React, {Component} from 'react'
import * as sg from 'sigma'


const SIGMA_SETTINGS = {
  // 'defaultLabelColor': '#000000',
  // 'defaultNodeColor': '#00DDFF',
  // 'defaultEdgeColor': 'rgba(190,190,190,0.3)',
  'labelColor': 'node',
  'edgeColor': 'source',
  'mouseZoomDuration': 0,
  'mouseInertiaDuration': 0,
  'doubleClickZoomDuration': 5,
  labelThreshold: 8,
  'zoomingRatio': 1.2,
  labelSizeRatio: 3,
  // 'nodesPowRatio': 0.001,
  // 'edgesPowRatio': 0.1,
  'labelSize': 'propertional',
  // 'defaultNodeBorderColor': '#FFFFFF'

}

const getColor = type => {
  if(type === undefined) {
    return '#777777'
  } else if(type === 'Gene') {
    return 'rgba(190,255,190,0.2)'
  } else if(type === 'Term') {
    return '#AAFFAA'
  } else {
    return '#777777'
  }
}

const getEdgeColor = type => {
  if(type === 'Tree') {
    return '#666666'
  } else {
    return 'rgba(190,255,190,0.2)'
  }
}

class SigmaRenderer extends Component {

  constructor(props, context) {

    super(props, context);

  }

  componentDidMount() {

    const nodes = this.props.network.elements.nodes
    const edges = this.props.network.elements.edges

    const s = new sg.sigma({'settings': {'zoomMin': 0.003}})
    const cam = s.addCamera();


    nodes.forEach(node => {

      const nodeData = node.data
      const sigmaNode = {
        id: nodeData.id,
        label: nodeData.name,
        x: node.position.x,
        y: node.position.y,
        size: nodeData.Size + 2,
        color: getColor(nodeData.NodeType)
      }

      s.graph.addNode(sigmaNode);
    })

    edges.forEach((edge) => {

      const ed = edge.data
      s.graph.addEdge({
        'id': ed.id,
        'source': ed.source,
        'target': ed.target,
        'size': 0.5,
        color: getEdgeColor(ed.Is_Tree_Edge)
      });

    })


    s.addRenderer({
      container: this.sigmaView,
      type: 'webgl',
      camera: cam,
      settings: SIGMA_SETTINGS
    });
    s.refresh();

  }

  render() {
    return (
      <div ref={(sigmaView) => this.sigmaView = sigmaView} style={this.props.style}/>
    )
  }

}


export default SigmaRenderer
