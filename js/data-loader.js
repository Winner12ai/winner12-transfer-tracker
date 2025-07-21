/**
 * Data Loader for Transfer Tracker
 * Handles loading and processing of transfer data from JSON files
 */

class TransferDataLoader {
    constructor() {
        this.cache = new Map();
        this.baseUrl = './data/';
        this.defaultDataFile = 'transfers_2025.json';
        this.loadingCallbacks = [];
        this.errorCallbacks = [];
    }
    
    /**
     * Load transfer data from JSON file
     */
    async loadTransferData(filename = this.defaultDataFile) {
        try {
            this.showLoading(true);
            
            // Check cache first
            if (this.cache.has(filename)) {
                const cachedData = this.cache.get(filename);
                if (this.isCacheValid(cachedData)) {
                    this.showLoading(false);
                    return cachedData.data;
                }
            }
            
            // Fetch data from file
            const response = await fetch(this.baseUrl + filename);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validate data structure
            const validatedData = this.validateData(data);
            
            // Cache the data
            this.cache.set(filename, {
                data: validatedData,
                timestamp: Date.now(),
                ttl: 5 * 60 * 1000 // 5 minutes TTL
            });
            
            this.showLoading(false);
            return validatedData;
            
        } catch (error) {
            this.showLoading(false);
            console.error('Error loading transfer data:', error);
            this.handleError(error);
            
            // Return sample data if available
            return this.getSampleData();
        }
    }
    
    /**
     * Load multiple data files
     */
    async loadMultipleFiles(filenames) {
        try {
            const promises = filenames.map(filename => this.loadTransferData(filename));
            const results = await Promise.all(promises);
            
            // Combine all transfer data
            const combinedData = {
                metadata: {
                    generated_at: new Date().toISOString(),
                    sources: filenames,
                    total_records: 0
                },
                summary: {},
                transfers: []
            };
            
            results.forEach((data, index) => {
                if (data && data.transfers) {
                    combinedData.transfers.push(...data.transfers);
                    combinedData.metadata.total_records += data.transfers.length;
                }
            });
            
            // Recalculate summary
            combinedData.summary = this.calculateSummary(combinedData.transfers);
            
            return combinedData;
            
        } catch (error) {
            console.error('Error loading multiple files:', error);
            this.handleError(error);
            return this.getSampleData();
        }
    }
    
    /**
     * Validate data structure
     */
    validateData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format: not an object');
        }
        
        // Ensure required structure
        const validatedData = {
            metadata: data.metadata || {
                generated_at: new Date().toISOString(),
                league: 'Unknown',
                season: '2025',
                total_records: 0
            },
            summary: data.summary || {},
            transfers: []
        };
        
        // Validate transfers array
        if (Array.isArray(data.transfers)) {
            validatedData.transfers = data.transfers.map(transfer => this.validateTransfer(transfer));
            validatedData.metadata.total_records = validatedData.transfers.length;
        } else if (Array.isArray(data)) {
            // Handle case where data is directly an array of transfers
            validatedData.transfers = data.map(transfer => this.validateTransfer(transfer));
            validatedData.metadata.total_records = validatedData.transfers.length;
        }
        
        // Recalculate summary if missing
        if (!validatedData.summary || Object.keys(validatedData.summary).length === 0) {
            validatedData.summary = this.calculateSummary(validatedData.transfers);
        }
        
        return validatedData;
    }
    
    /**
     * Validate individual transfer record
     */
    validateTransfer(transfer) {
        return {
            player_id: transfer.player_id || '',
            player_name: transfer.player_name || 'Unknown Player',
            player_age: parseInt(transfer.player_age) || 0,
            player_position: transfer.player_position || 'Unknown',
            player_nationality: transfer.player_nationality || 'Unknown',
            from_club_id: transfer.from_club_id || '',
            from_club_name: transfer.from_club_name || 'Unknown Club',
            from_club_league: transfer.from_club_league || 'Unknown League',
            to_club_id: transfer.to_club_id || '',
            to_club_name: transfer.to_club_name || 'Unknown Club',
            to_club_league: transfer.to_club_league || 'Unknown League',
            transfer_fee: parseFloat(transfer.transfer_fee) || 0,
            transfer_fee_currency: transfer.transfer_fee_currency || 'EUR',
            transfer_date: transfer.transfer_date || new Date().toISOString(),
            transfer_type: transfer.transfer_type || 'Permanent',
            contract_duration: transfer.contract_duration || '',
            season: transfer.season || '2025',
            market_value: parseFloat(transfer.market_value) || 0
        };
    }
    
    /**
     * Calculate summary statistics
     */
    calculateSummary(transfers) {
        if (!transfers || transfers.length === 0) {
            return {
                total_transfers: 0,
                total_spending: 0,
                average_fee: 0,
                median_fee: 0,
                most_expensive_transfer: {},
                transfers_by_position: {},
                transfers_by_month: {},
                top_spending_clubs: {},
                top_selling_clubs: {}
            };
        }
        
        const fees = transfers.map(t => t.transfer_fee).filter(f => f > 0).sort((a, b) => a - b);
        const totalSpending = transfers.reduce((sum, t) => sum + t.transfer_fee, 0);
        
        // Find most expensive transfer
        const mostExpensive = transfers.reduce((max, t) => 
            t.transfer_fee > (max.transfer_fee || 0) ? t : max, {});
        
        // Group by position
        const byPosition = {};
        transfers.forEach(t => {
            byPosition[t.player_position] = (byPosition[t.player_position] || 0) + 1;
        });
        
        // Group by month
        const byMonth = {};
        transfers.forEach(t => {
            if (t.transfer_date) {
                const month = new Date(t.transfer_date).getMonth() + 1;
                byMonth[month] = (byMonth[month] || 0) + t.transfer_fee;
            }
        });
        
        // Top spending clubs
        const spendingClubs = {};
        transfers.forEach(t => {
            if (t.to_club_name) {
                spendingClubs[t.to_club_name] = (spendingClubs[t.to_club_name] || 0) + t.transfer_fee;
            }
        });
        
        // Top selling clubs
        const sellingClubs = {};
        transfers.forEach(t => {
            if (t.from_club_name) {
                sellingClubs[t.from_club_name] = (sellingClubs[t.from_club_name] || 0) + t.transfer_fee;
            }
        });
        
        return {
            total_transfers: transfers.length,
            total_spending: totalSpending,
            average_fee: transfers.length > 0 ? totalSpending / transfers.length : 0,
            median_fee: fees.length > 0 ? fees[Math.floor(fees.length / 2)] : 0,
            most_expensive_transfer: {
                player: mostExpensive.player_name || '',
                fee: mostExpensive.transfer_fee || 0,
                from_club: mostExpensive.from_club_name || '',
                to_club: mostExpensive.to_club_name || ''
            },
            transfers_by_position: byPosition,
            transfers_by_month: byMonth,
            top_spending_clubs: this.getTopEntries(spendingClubs, 10),
            top_selling_clubs: this.getTopEntries(sellingClubs, 10)
        };
    }
    
    /**
     * Get top entries from object
     */
    getTopEntries(obj, limit = 10) {
        return Object.entries(obj)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .reduce((result, [key, value]) => {
                result[key] = value;
                return result;
            }, {});
    }
    
    /**
     * Filter transfers based on criteria
     */
    filterTransfers(transfers, filters) {
        if (!transfers || !Array.isArray(transfers)) {
            return [];
        }
        
        return transfers.filter(transfer => {
            // League filter
            if (filters.league && filters.league !== 'all') {
                if (transfer.from_club_league !== filters.league && 
                    transfer.to_club_league !== filters.league) {
                    return false;
                }
            }
            
            // Position filter
            if (filters.position && filters.position !== 'all') {
                if (transfer.player_position !== filters.position) {
                    return false;
                }
            }
            
            // Fee range filter
            if (filters.maxFee !== undefined) {
                if (transfer.transfer_fee > filters.maxFee) {
                    return false;
                }
            }
            
            // Season filter
            if (filters.season && filters.season !== 'all') {
                if (transfer.season !== filters.season) {
                    return false;
                }
            }
            
            // Date range filter
            if (filters.startDate || filters.endDate) {
                const transferDate = new Date(transfer.transfer_date);
                if (filters.startDate && transferDate < new Date(filters.startDate)) {
                    return false;
                }
                if (filters.endDate && transferDate > new Date(filters.endDate)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    /**
     * Search transfers by text
     */
    searchTransfers(transfers, searchTerm) {
        if (!searchTerm || !transfers) {
            return transfers;
        }
        
        const term = searchTerm.toLowerCase();
        
        return transfers.filter(transfer => {
            return (
                transfer.player_name.toLowerCase().includes(term) ||
                transfer.from_club_name.toLowerCase().includes(term) ||
                transfer.to_club_name.toLowerCase().includes(term) ||
                transfer.player_position.toLowerCase().includes(term) ||
                transfer.player_nationality.toLowerCase().includes(term)
            );
        });
    }
    
    /**
     * Sort transfers
     */
    sortTransfers(transfers, sortBy, sortOrder = 'desc') {
        if (!transfers || !Array.isArray(transfers)) {
            return [];
        }
        
        return [...transfers].sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            // Handle different data types
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
    
    /**
     * Export data to CSV
     */
    exportToCSV(transfers, filename = 'transfers.csv') {
        if (!transfers || transfers.length === 0) {
            console.warn('No data to export');
            return;
        }
        
        const headers = [
            'Player Name', 'Age', 'Position', 'Nationality',
            'From Club', 'To Club', 'Transfer Fee (€M)', 'Date', 'Season'
        ];
        
        const csvContent = [
            headers.join(','),
            ...transfers.map(t => [
                `"${t.player_name}"`,
                t.player_age,
                `"${t.player_position}"`,
                `"${t.player_nationality}"`,
                `"${t.from_club_name}"`,
                `"${t.to_club_name}"`,
                t.transfer_fee,
                `"${t.transfer_date}"`,
                `"${t.season}"`
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    /**
     * Check if cached data is still valid
     */
    isCacheValid(cachedData) {
        return cachedData && 
               cachedData.timestamp && 
               (Date.now() - cachedData.timestamp) < cachedData.ttl;
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Show/hide loading indicator
     */
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
        
        // Notify callbacks
        this.loadingCallbacks.forEach(callback => callback(show));
    }
    
    /**
     * Handle errors
     */
    handleError(error) {
        console.error('Data loading error:', error);
        
        // Show user-friendly error message
        this.showErrorMessage(`Failed to load transfer data: ${error.message}`);
        
        // Notify error callbacks
        this.errorCallbacks.forEach(callback => callback(error));
    }
    
    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        // Create or update error alert
        let errorAlert = document.getElementById('error-alert');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.id = 'error-alert';
            errorAlert.className = 'alert alert-warning alert-dismissible fade show';
            errorAlert.style.position = 'fixed';
            errorAlert.style.top = '20px';
            errorAlert.style.right = '20px';
            errorAlert.style.zIndex = '9999';
            errorAlert.style.maxWidth = '400px';
            
            document.body.appendChild(errorAlert);
        }
        
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorAlert && errorAlert.parentNode) {
                errorAlert.remove();
            }
        }, 5000);
    }
    
    /**
     * Get sample data for demo purposes
     */
    getSampleData() {
        return {
            metadata: {
                generated_at: new Date().toISOString(),
                league: 'Sample Data',
                season: '2025',
                total_records: 3
            },
            summary: {
                total_transfers: 3,
                total_spending: 150,
                average_fee: 50,
                median_fee: 50,
                most_expensive_transfer: {
                    player: 'Sample Player',
                    fee: 100,
                    from_club: 'Sample FC',
                    to_club: 'Example United'
                }
            },
            transfers: [
                {
                    player_id: 'sample1',
                    player_name: 'Sample Player 1',
                    player_age: 25,
                    player_position: 'Forward',
                    player_nationality: 'England',
                    from_club_name: 'Sample FC',
                    to_club_name: 'Example United',
                    transfer_fee: 100,
                    transfer_date: '2025-01-15',
                    season: '2025'
                },
                {
                    player_id: 'sample2',
                    player_name: 'Sample Player 2',
                    player_age: 28,
                    player_position: 'Midfielder',
                    player_nationality: 'Spain',
                    from_club_name: 'Demo City',
                    to_club_name: 'Test Athletic',
                    transfer_fee: 50,
                    transfer_date: '2025-01-20',
                    season: '2025'
                },
                {
                    player_id: 'sample3',
                    player_name: 'Sample Player 3',
                    player_age: 22,
                    player_position: 'Defender',
                    player_nationality: 'Brazil',
                    from_club_name: 'Mock United',
                    to_club_name: 'Placeholder FC',
                    transfer_fee: 0,
                    transfer_date: '2025-01-25',
                    season: '2025'
                }
            ]
        };
    }
    
    /**
     * Add loading callback
     */
    onLoading(callback) {
        this.loadingCallbacks.push(callback);
    }
    
    /**
     * Add error callback
     */
    onError(callback) {
        this.errorCallbacks.push(callback);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransferDataLoader;
}