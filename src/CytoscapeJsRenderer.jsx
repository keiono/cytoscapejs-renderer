import React, {Component} from 'react'
import cytoscape from 'cytoscape'
import regCose from 'cytoscape-cose-bilkent'


import * as config from './CytoscapeJsConfig'

// Register optional layout plugin

regCose(cytoscape)

/**
 * Renderer using Cytoscape.js
 */
class CytoscapeJsRenderer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      cyjs: null,
      rendered: false,
      currentLayout: null
    }
  }

  updateCyjs = network => {
    this.updateCyjsInternal(network, null)
  }

  updateCyjsInternal = (network, cyjs) => {

    // React only when network data is available.
    if (network === undefined || network === null) {
      return
    }

    if (network.elements.nodes.length === 0) {
      return
    }

    let cy = null

    if (cyjs === null) {
      cy = this.state.cyjs
    } else {
      cy = cyjs
    }

    cy.remove(cy.elements('node'))
    cy.remove(cy.elements('edge'))
    cy.add(network.elements.nodes)
    cy.add(network.elements.edges)

    const layout = this.props.rendererOptions.layout

    if (layout !== undefined && layout !== null) {
      this.applyLayout(layout)
    } else {
      this.applyLayout('cose')
    }


    cy.fit()
    this.setEventListener(cy)

    // At least executed one time.
    this.setState({rendered: true})
  }

  componentDidMount() {
    // Create Cytoscape.js instance here, only once!
    const netStyleProp = this.props.networkStyle

    let visualStyle = null

    if(netStyleProp === undefined) {
      visualStyle = config.DEF_VS
    } else {
      visualStyle = netStyleProp.style
    }

    // Use default visual style if not available.
    if (visualStyle === undefined || visualStyle === null) {
      visualStyle = config.DEF_VS
    }

    const cy = cytoscape(
      Object.assign(
        {
          container: this.cyjs,
          elements: [],
          style: visualStyle,
          layout: {
            name: config.DEF_LAYOUT
          }
        }))
    this.state.cyjs = cy

    // Render actual network
    this.updateCyjsInternal(this.props.network, cy)
  }


  shouldComponentUpdate(nextProps, nextState) {
    // Update is controlled by componentWillReceiveProps()
    return false
  }

  /**
   * This is the main function to determin whether update is necessary or not.
   */
  componentWillReceiveProps(nextProps) {
    // Check status of network data
    if (nextProps === undefined || nextProps.network === undefined) {
      return
    }

    const command = nextProps.command
    if (command !== this.props.command) {
      this.runCommand(command);
    }

    // console.log("=========== Applying layout!");
    // this.applyLayout('concentric')

    // Check visual style
    const newVs = nextProps.networkStyle
    const currentVs = this.props.networkStyle

    if (newVs !== undefined && newVs !== null) {
      if(currentVs === null || currentVs === undefined) {
        this.state.cyjs.style(newVs.style)
      } else {
        const name = currentVs.name
        const newName = newVs.name
        if (name !== newName) {
          this.state.cyjs.style(newVs.style)
        }

      }
    }

    if (nextProps.network === this.props.network) {
      return
    }

    if (this.props.networkId === nextProps.networkId) {
      return
    }

    this.updateCyjs(nextProps.network)
    // this.applyLayout('concentric')

    // const command = nextProps.command
    // if(command !== this.props.command) {
    //   this.runCommand(command);
    // }
  }

  runCommand = command => {

    // Execute Cytoscape command
    if (command === null) {
      return
    }

    // Disable handler
    this.state.cyjs.off(config.SUPPORTED_EVENTS)

    const cy = this.state.cyjs
    const commandName = command.command
    const commandParams = command.parameters

    if (commandName === 'fit') {
      cy.fit()
    } else if (commandName === 'zoomIn') {
      cy.zoom(cy.zoom() * 1.2)
    } else if (commandName === 'zoomOut') {
      cy.zoom(cy.zoom() * 0.8)
    } else if (commandName === 'findPath') {
      const startId = commandParams.startId
      const endId = commandParams.endId
      this.findPath(startId, endId)

      // Select neighbour
      const sourceNode = cy.$('#' + startId)
      const sourcePos = sourceNode.position()
      let idx = 0

      sourceNode.incomers().select().nodes()
        .forEach(node => {
          if (node.data('Gene_or_Term') === 'Gene') {
            node.position({
              x: 1600,
              y: sourcePos.y + (idx * 30)
            })
            idx++
          }
        });

    } else if (commandName === 'select') {
      const idList = commandParams.idList

      let selected = idList.map(id => (id.replace(/\:/, '\\:')))
      selected = selected.map(id => ('#' + id))

      const strVal = selected.toString()
      const target = cy.elements(strVal)

      cy.elements().addClass('faded')
      target.removeClass('faded')

      target.select()
      if(commandParams.selectedColor !== undefined) {
        target.style({
          'background-color': commandParams.selectedColor
        })
      }
    } else if (commandName === 'unselect') {
      const idList = commandParams.idList

      let selected = idList.map(id => (id.replace(/\:/, '\\:')))
      selected = selected.map(id => ('#' + id))

      const strVal = selected.toString()
      const target = cy.elements(strVal)

      target.unselect()
    } else if (commandName === 'focus') {

      const idList = commandParams.idList
      let selected = idList.map(id => (id.replace(/\:/, '\\:')))
      selected = selected.map(id => ('#' + id))
      const strVal = selected.toString()

      const target = cy.elements(strVal)
      cy.elements().addClass('faded')
      cy.elements().removeClass('focused')
      target.removeClass('faded')
      target.addClass('focused')

      cy.fit(target, 400)

    } else if (commandName === 'filter') {
      const options = commandParams.options
      const filterType = options.type

      if (filterType === 'numeric') {
        const range = options.range
        const toBeShown = cy.elements(range)

        cy.edges().addClass('dark')
        toBeShown.removeClass('dark')
      }
    }

    // Callback
    this.props.eventHandlers.commandFinished(command);

    // Enable it again
    this.state.cyjs.on(config.SUPPORTED_EVENTS, this.cyEventHandler)
  }

  applyLayout = layout => {
    const cy = this.state.cyjs;

    if (layout !== undefined) {

      let layoutAlgorithm = null;

      if(layout === 'cose-bilkent') {
        const layoutOptions = {
          name: 'cose-bilkent',
          animate: 'end',
          nodeDimensionsIncludeLabels: true,
          animationEasing: 'ease-out',
          animationDuration: 1500,
          randomize: true,
          idealEdgeLength: 280
        }
        layoutAlgorithm = cy.layout(layoutOptions)
      } else {
        layoutAlgorithm = cy.layout({
          name: layout
        })
      }


      layoutAlgorithm.run()


      this.setState({currentLayout: layout})
    }
  }

  findPath = (s, g) => {
    const aStar = this.state.cyjs.elements().aStar({root: "#" + s, goal: "#" + g});
    aStar.path.select();
  }


  cyEventHandler = event => {
    console.log("########################## CY EVENT")
    console.log(event)


    this.state.cyjs.off(config.SUPPORTED_EVENTS)

    const cy = this.state.cyjs
    // const eventType = event.originalEvent.type;
    const target = event.target;
    const eventType = event.type;

    if (target === undefined || target === null) {
      return
    }

    const nodeProps = {}
    const edgeProps = {}

    console.log(eventType)


    switch (eventType) {
      case config.CY_EVENTS.boxstart:
        this.setState({boxSelection: true})
        break;

      case config.CY_EVENTS.boxselect:

        // Handle multiple selection
        if (this.state.boxSelection) {
          const nodes = cy.$('node:selected').map(node => {

            const nodeData = node.data()
            nodeProps[nodeData.id] = nodeData

            return nodeData.id
          });
          const edges = cy.$('edge:selected').map(edge => edge.data().id);

          this.props.eventHandlers.selectNodes(nodes, nodeProps)
          this.props.eventHandlers.selectEdges(edges)
          this.setState({boxSelection: false});
        }
        break;
      case config.CY_EVENTS.select:
        if (!this.state.boxSelection) {
          if (target.isNode()) {
            const nodeData = target.data()
            const nodeId = nodeData.id
            nodeProps[nodeId] = nodeData
            this.props.eventHandlers.selectNodes([nodeId], nodeProps)
          } else {
            const edgeData = target.data()
            const edgeId = edgeData.id
            edgeProps[edgeId] = edgeData
            this.props.eventHandlers.selectEdges([edgeId], edgeProps)
          }
        }
        break;
      case config.CY_EVENTS.unselect:
        if (target.isNode()) {
          this.props.eventHandlers.deselectNodes([target.data().id])
        } else {
          this.props.eventHandlers.deselectEdges([target.data().id])
        }
        break;

      default:
        break;
    }
    this.state.cyjs.on(config.SUPPORTED_EVENTS, this.cyEventHandler)
  }

  /**
   * Translate Cytoscape.js events into action calls
   */
  setEventListener(cy) {
    cy.on(config.SUPPORTED_EVENTS, this.cyEventHandler)

    cy.on('tap', function (e) {
      if (e.target === cy) {
        cy.elements().removeClass('faded focused');
      }
    })
  }

  render() {
    return (
      <div ref={(cyjs) => this.cyjs = cyjs} style={this.props.style}/>
    )
  }
}

export default CytoscapeJsRenderer
