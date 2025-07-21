/**
 * Main Application for Transfer Tracker
 * Integrates all components and manages the application state
 */

class TransferTrackerApp {
    constructor() {
        this.dataLoader = new TransferDataLoader();
        this.networkViz = null;
        this.charts = null;
        this.currentData = null;
        this.filteredData = null;
        this.currentFilters = {
            league: 'all',
            position: 'all',
            season: 'all',
            maxFee: null,
            startDate: null,
            endDate: null
        };
        this.currentSort = {
            field: 'transfer_fee',
            order: 'desc'
        };
        this.searchTerm = '';
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Initialize visualizations
            this.initializeVisualizations();
            
            // Setup data loading callbacks
            this.setupDataCallbacks();
            
            // Hide loading state
            this.hideLoadingState();
            
            console.log('Transfer Tracker App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }
    
    /**
     * Load transfer data
     */
    async loadData(filename = null) {
        try {
            this.currentData = await this.dataLoader.loadTransferData(filename);
            this.filteredData = this.currentData;
            
            // Update UI with new data
            this.updateOverview();
            this.updateFilters();
            this.updateTable();
            
            // Update visualizations if they exist
            if (this.networkViz) {
                this.networkViz.updateData(this.filteredData.transfers);
            }
            
            if (this.charts) {
                this.charts.updateAllCharts(this.filteredData.transfers);
            }
            
            return this.currentData;
            
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showError('Failed to load transfer data: ' + error.message);
            throw error;
        }
    }
    
    /**
     * Initialize visualizations
     */
    initializeVisualizations() {
        try {
            // Initialize network visualization
            const networkContainer = document.getElementById('network-container');
            if (networkContainer && this.currentData) {
                this.networkViz = new TransferNetworkVisualization('network-container');
                this.networkViz.render(this.filteredData.transfers);
            }
            
            // Initialize charts
            if (this.currentData) {
                this.charts = new TransferCharts();
                this.charts.initializeAllCharts(this.filteredData.transfers);
            }
            
        } catch (error) {
            console.error('Failed to initialize visualizations:', error);
            this.showError('Failed to initialize visualizations: ' + error.message);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter controls
        const leagueFilter = document.getElementById('league-filter');
        const positionFilter = document.getElementById('position-filter');
        const seasonFilter = document.getElementById('season-filter');
        const maxFeeFilter = document.getElementById('max-fee-filter');
        const startDateFilter = document.getElementById('start-date-filter');
        const endDateFilter = document.getElementById('end-date-filter');
        const searchInput = document.getElementById('search-input');
        
        // Add event listeners for filters
        if (leagueFilter) {
            leagueFilter.addEventListener('change', (e) => {
                this.currentFilters.league = e.target.value;
                this.applyFilters();
            });
        }
        
        if (positionFilter) {
            positionFilter.addEventListener('change', (e) => {
                this.currentFilters.position = e.target.value;
                this.applyFilters();
            });
        }
        
        if (seasonFilter) {
            seasonFilter.addEventListener('change', (e) => {
                this.currentFilters.season = e.target.value;
                this.applyFilters();
            });
        }
        
        if (maxFeeFilter) {
            maxFeeFilter.addEventListener('input', (e) => {
                this.currentFilters.maxFee = e.target.value ? parseFloat(e.target.value) : null;
                this.applyFilters();
            });
        }
        
        if (startDateFilter) {
            startDateFilter.addEventListener('change', (e) => {
                this.currentFilters.startDate = e.target.value;
                this.applyFilters();
            });
        }
        
        if (endDateFilter) {
            endDateFilter.addEventListener('change', (e) => {
                this.currentFilters.endDate = e.target.value;
                this.applyFilters();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.applyFilters();
            });
        }
        
        // Clear filters button
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('export-csv');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Refresh data button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
        
        // Table sorting
        const tableHeaders = document.querySelectorAll('.sortable');
        tableHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const field = e.target.dataset.sort;
                if (field) {
                    this.sortData(field);
                }
            });
        });
        
        // Tab navigation
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (e) => {
                const targetId = e.target.getAttribute('data-bs-target');
                this.handleTabChange(targetId);
            });
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    /**
     * Setup data loading callbacks
     */
    setupDataCallbacks() {
        this.dataLoader.onLoading((isLoading) => {
            if (isLoading) {
                this.showLoadingState();
            } else {
                this.hideLoadingState();
            }
        });
        
        this.dataLoader.onError((error) => {
            this.showError('Data loading error: ' + error.message);
        });
    }
    
    /**
     * Apply current filters to data
     */
    applyFilters() {
        if (!this.currentData || !this.currentData.transfers) {
            return;
        }
        
        // Apply filters
        let filtered = this.dataLoader.filterTransfers(this.currentData.transfers, this.currentFilters);
        
        // Apply search
        if (this.searchTerm) {
            filtered = this.dataLoader.searchTransfers(filtered, this.searchTerm);
        }
        
        // Apply sorting
        filtered = this.dataLoader.sortTransfers(filtered, this.currentSort.field, this.currentSort.order);
        
        // Update filtered data
        this.filteredData = {
            ...this.currentData,
            transfers: filtered,
            summary: this.dataLoader.calculateSummary(filtered)
        };
        
        // Update UI
        this.updateOverview();
        this.updateTable();
        
        // Update visualizations
        if (this.networkViz) {
            this.networkViz.updateData(this.filteredData.transfers);
        }
        
        if (this.charts) {
            this.charts.updateAllCharts(this.filteredData.transfers);
        }
    }
    
    /**
     * Clear all filters
     */
    clearFilters() {
        // Reset filters
        this.currentFilters = {
            league: 'all',
            position: 'all',
            season: 'all',
            maxFee: null,
            startDate: null,
            endDate: null
        };
        this.searchTerm = '';
        
        // Reset form controls
        const leagueFilter = document.getElementById('league-filter');
        const positionFilter = document.getElementById('position-filter');
        const seasonFilter = document.getElementById('season-filter');
        const maxFeeFilter = document.getElementById('max-fee-filter');
        const startDateFilter = document.getElementById('start-date-filter');
        const endDateFilter = document.getElementById('end-date-filter');
        const searchInput = document.getElementById('search-input');
        
        if (leagueFilter) leagueFilter.value = 'all';
        if (positionFilter) positionFilter.value = 'all';
        if (seasonFilter) seasonFilter.value = 'all';
        if (maxFeeFilter) maxFeeFilter.value = '';
        if (startDateFilter) startDateFilter.value = '';
        if (endDateFilter) endDateFilter.value = '';
        if (searchInput) searchInput.value = '';
        
        // Apply filters
        this.applyFilters();
    }
    
    /**
     * Sort data by field
     */
    sortData(field) {
        // Toggle sort order if same field
        if (this.currentSort.field === field) {
            this.currentSort.order = this.currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.order = 'desc';
        }
        
        // Update sort indicators
        this.updateSortIndicators();
        
        // Apply filters (which includes sorting)
        this.applyFilters();
    }
    
    /**
     * Update sort indicators in table headers
     */
    updateSortIndicators() {
        const headers = document.querySelectorAll('.sortable');
        headers.forEach(header => {
            const field = header.dataset.sort;
            const icon = header.querySelector('.sort-icon');
            
            if (icon) {
                if (field === this.currentSort.field) {
                    icon.className = `sort-icon fas fa-sort-${this.currentSort.order === 'asc' ? 'up' : 'down'}`;
                } else {
                    icon.className = 'sort-icon fas fa-sort';
                }
            }
        });
    }
    
    /**
     * Update overview section
     */
    updateOverview() {
        if (!this.filteredData || !this.filteredData.summary) {
            return;
        }
        
        const summary = this.filteredData.summary;
        
        // Update overview cards
        this.updateElement('total-transfers', summary.total_transfers?.toLocaleString() || '0');
        this.updateElement('total-spending', `€${(summary.total_spending / 1000000).toFixed(1)}M`);
        this.updateElement('average-fee', `€${(summary.average_fee / 1000000).toFixed(1)}M`);
        this.updateElement('median-fee', `€${(summary.median_fee / 1000000).toFixed(1)}M`);
        
        // Update most expensive transfer
        if (summary.most_expensive_transfer && summary.most_expensive_transfer.player) {
            this.updateElement('most-expensive-player', summary.most_expensive_transfer.player);
            this.updateElement('most-expensive-fee', `€${(summary.most_expensive_transfer.fee / 1000000).toFixed(1)}M`);
            this.updateElement('most-expensive-clubs', 
                `${summary.most_expensive_transfer.from_club} → ${summary.most_expensive_transfer.to_club}`);
        }
    }
    
    /**
     * Update filters dropdown options
     */
    updateFilters() {
        if (!this.currentData || !this.currentData.transfers) {
            return;
        }
        
        const transfers = this.currentData.transfers;
        
        // Update league filter
        const leagues = [...new Set([
            ...transfers.map(t => t.from_club_league),
            ...transfers.map(t => t.to_club_league)
        ])].filter(Boolean).sort();
        
        this.updateSelectOptions('league-filter', leagues);
        
        // Update position filter
        const positions = [...new Set(transfers.map(t => t.player_position))].filter(Boolean).sort();
        this.updateSelectOptions('position-filter', positions);
        
        // Update season filter
        const seasons = [...new Set(transfers.map(t => t.season))].filter(Boolean).sort();
        this.updateSelectOptions('season-filter', seasons);
    }
    
    /**
     * Update select options
     */
    updateSelectOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Keep the 'all' option
        const allOption = select.querySelector('option[value="all"]');
        select.innerHTML = '';
        
        if (allOption) {
            select.appendChild(allOption);
        }
        
        // Add new options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }
    
    /**
     * Update data table
     */
    updateTable() {
        const tableBody = document.getElementById('transfers-table-body');
        if (!tableBody || !this.filteredData || !this.filteredData.transfers) {
            return;
        }
        
        const transfers = this.filteredData.transfers;
        
        if (transfers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        <i class="fas fa-search fa-2x mb-2"></i>
                        <p>No transfers found matching your criteria</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = transfers.map(transfer => `
            <tr>
                <td>
                    <div class="fw-bold">${this.escapeHtml(transfer.player_name)}</div>
                    <small class="text-muted">${transfer.player_age} years</small>
                </td>
                <td>
                    <span class="badge position-badge position-${transfer.player_position.toLowerCase()}">
                        ${this.escapeHtml(transfer.player_position)}
                    </span>
                </td>
                <td>
                    <img src="https://flagcdn.com/16x12/${this.getCountryCode(transfer.player_nationality)}.png" 
                         alt="${transfer.player_nationality}" class="me-1">
                    ${this.escapeHtml(transfer.player_nationality)}
                </td>
                <td>${this.escapeHtml(transfer.from_club_name)}</td>
                <td>${this.escapeHtml(transfer.to_club_name)}</td>
                <td>
                    <span class="badge fee-badge ${this.getFeeBadgeClass(transfer.transfer_fee)}">
                        ${this.formatTransferFee(transfer.transfer_fee)}
                    </span>
                </td>
                <td>${this.formatDate(transfer.transfer_date)}</td>
                <td>
                    <span class="badge bg-secondary">${this.escapeHtml(transfer.season)}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="app.showTransferDetails('${transfer.player_id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    /**
     * Handle tab changes
     */
    handleTabChange(targetId) {
        // Resize charts when switching to charts tab
        if (targetId === '#charts-tab' && this.charts) {
            setTimeout(() => {
                this.charts.resizeAllCharts();
            }, 100);
        }
        
        // Update network visualization when switching to network tab
        if (targetId === '#network-tab' && this.networkViz) {
            setTimeout(() => {
                this.networkViz.resize();
            }, 100);
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (this.charts) {
            this.charts.resizeAllCharts();
        }
        
        if (this.networkViz) {
            this.networkViz.resize();
        }
    }
    
    /**
     * Export filtered data
     */
    exportData() {
        if (!this.filteredData || !this.filteredData.transfers) {
            this.showError('No data to export');
            return;
        }
        
        const filename = `transfers_${new Date().toISOString().split('T')[0]}.csv`;
        this.dataLoader.exportToCSV(this.filteredData.transfers, filename);
    }
    
    /**
     * Refresh data
     */
    async refreshData() {
        try {
            this.dataLoader.clearCache();
            await this.loadData();
            this.showSuccess('Data refreshed successfully');
        } catch (error) {
            this.showError('Failed to refresh data: ' + error.message);
        }
    }
    
    /**
     * Show transfer details modal
     */
    showTransferDetails(playerId) {
        if (!this.currentData || !this.currentData.transfers) {
            return;
        }
        
        const transfer = this.currentData.transfers.find(t => t.player_id === playerId);
        if (!transfer) {
            this.showError('Transfer details not found');
            return;
        }
        
        // Create and show modal with transfer details
        this.createTransferModal(transfer);
    }
    
    /**
     * Create transfer details modal
     */
    createTransferModal(transfer) {
        const modalHtml = `
            <div class="modal fade" id="transferModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user me-2"></i>
                                ${this.escapeHtml(transfer.player_name)} Transfer Details
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-user me-2"></i>Player Information</h6>
                                    <ul class="list-unstyled">
                                        <li><strong>Name:</strong> ${this.escapeHtml(transfer.player_name)}</li>
                                        <li><strong>Age:</strong> ${transfer.player_age} years</li>
                                        <li><strong>Position:</strong> ${this.escapeHtml(transfer.player_position)}</li>
                                        <li><strong>Nationality:</strong> ${this.escapeHtml(transfer.player_nationality)}</li>
                                        <li><strong>Market Value:</strong> ${this.formatTransferFee(transfer.market_value)}</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-exchange-alt me-2"></i>Transfer Information</h6>
                                    <ul class="list-unstyled">
                                        <li><strong>From:</strong> ${this.escapeHtml(transfer.from_club_name)}</li>
                                        <li><strong>To:</strong> ${this.escapeHtml(transfer.to_club_name)}</li>
                                        <li><strong>Fee:</strong> ${this.formatTransferFee(transfer.transfer_fee)}</li>
                                        <li><strong>Date:</strong> ${this.formatDate(transfer.transfer_date)}</li>
                                        <li><strong>Type:</strong> ${this.escapeHtml(transfer.transfer_type)}</li>
                                        <li><strong>Season:</strong> ${this.escapeHtml(transfer.season)}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existingModal = document.getElementById('transferModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('transferModal'));
        modal.show();
    }
    
    /**
     * Utility functions
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTransferFee(fee) {
        if (!fee || fee === 0) {
            return 'Free';
        }
        
        if (fee >= 1000000) {
            return `€${(fee / 1000000).toFixed(1)}M`;
        } else if (fee >= 1000) {
            return `€${(fee / 1000).toFixed(0)}K`;
        } else {
            return `€${fee.toLocaleString()}`;
        }
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }
    
    getFeeBadgeClass(fee) {
        if (!fee || fee === 0) return 'bg-success';
        if (fee >= 100000000) return 'bg-danger';
        if (fee >= 50000000) return 'bg-warning';
        if (fee >= 10000000) return 'bg-info';
        return 'bg-secondary';
    }
    
    getCountryCode(country) {
        // Simple country to code mapping - extend as needed
        const countryMap = {
            'England': 'gb-eng',
            'Spain': 'es',
            'Germany': 'de',
            'France': 'fr',
            'Italy': 'it',
            'Brazil': 'br',
            'Argentina': 'ar',
            'Portugal': 'pt',
            'Netherlands': 'nl',
            'Belgium': 'be'
        };
        
        return countryMap[country] || 'xx';
    }
    
    showLoadingState() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
    }
    
    hideLoadingState() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    }
    
    showError(message) {
        console.error(message);
        // You can implement a toast notification system here
        alert('Error: ' + message);
    }
    
    showSuccess(message) {
        console.log(message);
        // You can implement a toast notification system here
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TransferTrackerApp();
});