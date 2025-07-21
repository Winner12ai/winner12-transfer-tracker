/**
 * Network Visualization using D3.js
 * Creates an interactive transfer network showing clubs and players
 */

class TransferNetworkVisualization {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = d3.select(`#${containerId}`);
        this.width = 0;
        this.height = 500;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.tooltip = null;
        
        this.init();
    }
    
    init() {
        // Clear existing content
        this.container.selectAll('*').remove();
        
        // Get container dimensions
        const containerRect = this.container.node().getBoundingClientRect();
        this.width = containerRect.width || 800;
        
        // Create SVG
        this.svg = this.container
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background-color', '#f8f9fa')
            .style('border-radius', '8px');
        
        // Create tooltip
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.select('.network-group')
                    .attr('transform', event.transform);
            });
        
        this.svg.call(zoom);
        
        // Create main group for network elements
        this.networkGroup = this.svg.append('g')
            .attr('class', 'network-group');
        
        // Add legend
        this.createLegend();
    }
    
    createLegend() {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, 20)`);
        
        const legendData = [
            { type: 'club', color: '#0d6efd', label: 'Clubs' },
            { type: 'player', color: '#198754', label: 'Players' },
            { type: 'high-value', color: '#dc3545', label: 'High Value (>€50M)' },
            { type: 'medium-value', color: '#ffc107', label: 'Medium Value (€10-50M)' },
            { type: 'low-value', color: '#0dcaf0', label: 'Low Value (<€10M)' }
        ];
        
        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);
        
        legendItems.append('circle')
            .attr('r', 8)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 5)
            .style('font-size', '12px')
            .style('font-weight', '500')
            .text(d => d.label);
        
        // Add legend background
        const legendBBox = legend.node().getBBox();
        legend.insert('rect', ':first-child')
            .attr('x', -10)
            .attr('y', -10)
            .attr('width', legendBBox.width + 20)
            .attr('height', legendBBox.height + 20)
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .attr('stroke', '#dee2e6')
            .attr('rx', 5);
    }
    
    processTransferData(transfers) {
        const clubs = new Map();
        const players = new Map();
        const links = [];
        
        transfers.forEach(transfer => {
            const playerId = `player_${transfer.player_id}`;
            const fromClubId = `club_${transfer.from_club_id}`;
            const toClubId = `club_${transfer.to_club_id}`;
            
            // Add clubs
            if (!clubs.has(fromClubId) && transfer.from_club_name) {
                clubs.set(fromClubId, {
                    id: fromClubId,
                    name: transfer.from_club_name,
                    league: transfer.from_club_league,
                    type: 'club',
                    transfers: 0,
                    totalSpent: 0,
                    totalReceived: 0
                });
            }
            
            if (!clubs.has(toClubId) && transfer.to_club_name) {
                clubs.set(toClubId, {
                    id: toClubId,
                    name: transfer.to_club_name,
                    league: transfer.to_club_league,
                    type: 'club',
                    transfers: 0,
                    totalSpent: 0,
                    totalReceived: 0
                });
            }
            
            // Add player
            if (!players.has(playerId)) {
                players.set(playerId, {
                    id: playerId,
                    name: transfer.player_name,
                    age: transfer.player_age,
                    position: transfer.player_position,
                    nationality: transfer.player_nationality,
                    type: 'player',
                    marketValue: transfer.market_value
                });
            }
            
            // Update club statistics
            if (clubs.has(fromClubId)) {
                const fromClub = clubs.get(fromClubId);
                fromClub.transfers++;
                fromClub.totalReceived += transfer.transfer_fee || 0;
            }
            
            if (clubs.has(toClubId)) {
                const toClub = clubs.get(toClubId);
                toClub.transfers++;
                toClub.totalSpent += transfer.transfer_fee || 0;
            }
            
            // Create links
            if (transfer.from_club_name && transfer.to_club_name) {
                links.push({
                    source: fromClubId,
                    target: playerId,
                    type: 'from',
                    fee: transfer.transfer_fee || 0,
                    date: transfer.transfer_date
                });
                
                links.push({
                    source: playerId,
                    target: toClubId,
                    type: 'to',
                    fee: transfer.transfer_fee || 0,
                    date: transfer.transfer_date
                });
            }
        });
        
        // Combine nodes
        this.nodes = [...clubs.values(), ...players.values()];
        this.links = links;
        
        return { nodes: this.nodes, links: this.links };
    }
    
    render(transfers) {
        const { nodes, links } = this.processTransferData(transfers);
        
        if (nodes.length === 0) {
            this.showNoDataMessage();
            return;
        }
        
        // Clear existing elements
        this.networkGroup.selectAll('*').remove();
        
        // Create force simulation
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => this.getNodeRadius(d) + 5));
        
        // Create links
        const link = this.networkGroup.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', d => `link ${this.getLinkClass(d.fee)}`)
            .attr('stroke-width', d => this.getLinkWidth(d.fee));
        
        // Create nodes
        const node = this.networkGroup.selectAll('.node')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', d => `node ${d.type}`)
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(this.drag());
        
        // Add labels
        const labels = this.networkGroup.selectAll('.node-label')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'node-label')
            .text(d => this.getNodeLabel(d))
            .style('font-size', d => `${Math.max(10, this.getNodeRadius(d) / 3)}px`);
        
        // Add event listeners
        node.on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.onNodeClick(event, d));
        
        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y + 5);
        });
    }
    
    getNodeRadius(node) {
        if (node.type === 'club') {
            return Math.max(15, Math.min(40, 15 + (node.transfers * 2)));
        } else {
            return Math.max(8, Math.min(20, 8 + (node.marketValue / 10)));
        }
    }
    
    getNodeColor(node) {
        if (node.type === 'club') {
            return '#0d6efd';
        } else {
            return '#198754';
        }
    }
    
    getNodeLabel(node) {
        if (node.name.length > 15) {
            return node.name.substring(0, 12) + '...';
        }
        return node.name;
    }
    
    getLinkClass(fee) {
        if (fee > 50) return 'high-value';
        if (fee > 10) return 'medium-value';
        return 'low-value';
    }
    
    getLinkWidth(fee) {
        if (fee > 50) return 4;
        if (fee > 10) return 2;
        return 1;
    }
    
    showTooltip(event, node) {
        let content = '';
        
        if (node.type === 'club') {
            content = `
                <strong>${node.name}</strong><br>
                League: ${node.league || 'Unknown'}<br>
                Transfers: ${node.transfers}<br>
                Total Spent: €${node.totalSpent.toFixed(1)}M<br>
                Total Received: €${node.totalReceived.toFixed(1)}M
            `;
        } else {
            content = `
                <strong>${node.name}</strong><br>
                Age: ${node.age}<br>
                Position: ${node.position}<br>
                Nationality: ${node.nationality}<br>
                Market Value: €${node.marketValue.toFixed(1)}M
            `;
        }
        
        this.tooltip
            .style('opacity', 1)
            .html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }
    
    onNodeClick(event, node) {
        // Highlight connected nodes and links
        this.highlightConnections(node);
        
        // Dispatch custom event for other components
        const customEvent = new CustomEvent('nodeSelected', {
            detail: { node: node }
        });
        document.dispatchEvent(customEvent);
    }
    
    highlightConnections(selectedNode) {
        // Reset all styles
        this.networkGroup.selectAll('.node')
            .style('opacity', 0.3);
        
        this.networkGroup.selectAll('.link')
            .style('opacity', 0.1);
        
        // Highlight selected node
        this.networkGroup.selectAll('.node')
            .filter(d => d.id === selectedNode.id)
            .style('opacity', 1)
            .style('stroke-width', 4);
        
        // Highlight connected nodes and links
        const connectedNodeIds = new Set();
        
        this.links.forEach(link => {
            if (link.source.id === selectedNode.id || link.target.id === selectedNode.id) {
                connectedNodeIds.add(link.source.id);
                connectedNodeIds.add(link.target.id);
                
                this.networkGroup.selectAll('.link')
                    .filter(d => d === link)
                    .style('opacity', 1);
            }
        });
        
        this.networkGroup.selectAll('.node')
            .filter(d => connectedNodeIds.has(d.id))
            .style('opacity', 1);
    }
    
    resetHighlight() {
        this.networkGroup.selectAll('.node')
            .style('opacity', 1)
            .style('stroke-width', 2);
        
        this.networkGroup.selectAll('.link')
            .style('opacity', 0.6);
    }
    
    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
    
    showNoDataMessage() {
        this.networkGroup.selectAll('*').remove();
        
        this.networkGroup.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('fill', '#6c757d')
            .text('No transfer data available');
    }
    
    resize() {
        const containerRect = this.container.node().getBoundingClientRect();
        this.width = containerRect.width || 800;
        
        this.svg
            .attr('width', this.width);
        
        if (this.simulation) {
            this.simulation
                .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                .alpha(0.3)
                .restart();
        }
    }
    
    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        if (this.simulation) {
            this.simulation.stop();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransferNetworkVisualization;
}