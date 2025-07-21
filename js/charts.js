/**
 * Chart.js Components for Transfer Tracker
 * Creates various charts to visualize transfer trends and statistics
 */

class TransferCharts {
    constructor() {
        this.charts = {};
        this.defaultColors = {
            primary: '#0d6efd',
            success: '#198754',
            warning: '#ffc107',
            danger: '#dc3545',
            info: '#0dcaf0',
            secondary: '#6c757d'
        };
        
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                }
            }
        };
    }
    
    /**
     * Create monthly spending chart
     */
    createMonthlySpendingChart(data) {
        const ctx = document.getElementById('monthly-spending-chart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.monthlySpending) {
            this.charts.monthlySpending.destroy();
        }
        
        // Process data
        const monthlyData = this.processMonthlyData(data);
        
        this.charts.monthlySpending = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Transfer Spending (€M)',
                    data: monthlyData.spending,
                    borderColor: this.defaultColors.primary,
                    backgroundColor: this.defaultColors.primary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.defaultColors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Number of Transfers',
                    data: monthlyData.count,
                    borderColor: this.defaultColors.success,
                    backgroundColor: this.defaultColors.success + '20',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: this.defaultColors.success,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    ...this.chartOptions.scales,
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#6c757d'
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    tooltip: {
                        ...this.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Spending: €${context.parsed.y.toFixed(1)}M`;
                                } else {
                                    return `Transfers: ${context.parsed.y}`;
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create position distribution chart
     */
    createPositionChart(data) {
        const ctx = document.getElementById('position-chart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.position) {
            this.charts.position.destroy();
        }
        
        // Process data
        const positionData = this.processPositionData(data);
        
        this.charts.position = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: positionData.labels,
                datasets: [{
                    data: positionData.values,
                    backgroundColor: [
                        this.defaultColors.warning,
                        this.defaultColors.info,
                        this.defaultColors.success,
                        this.defaultColors.danger
                    ],
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverBorderWidth: 5
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {},
                plugins: {
                    ...this.chartOptions.plugins,
                    tooltip: {
                        ...this.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create top spending clubs chart
     */
    createSpendingClubsChart(data) {
        const ctx = document.getElementById('spending-clubs-chart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.spendingClubs) {
            this.charts.spendingClubs.destroy();
        }
        
        // Process data
        const clubData = this.processClubSpendingData(data);
        
        this.charts.spendingClubs = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: clubData.labels,
                datasets: [{
                    label: 'Total Spending (€M)',
                    data: clubData.spending,
                    backgroundColor: this.generateGradientColors(clubData.spending.length),
                    borderColor: this.defaultColors.primary,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                ...this.chartOptions,
                indexAxis: 'y',
                plugins: {
                    ...this.chartOptions.plugins,
                    tooltip: {
                        ...this.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `Spending: €${context.parsed.x.toFixed(1)}M`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6c757d',
                            callback: function(value) {
                                return '€' + value + 'M';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create transfer fee distribution chart
     */
    createFeeDistributionChart(data) {
        const ctx = document.getElementById('fee-distribution-chart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.feeDistribution) {
            this.charts.feeDistribution.destroy();
        }
        
        // Process data
        const feeData = this.processFeeDistributionData(data);
        
        this.charts.feeDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: feeData.labels,
                datasets: [{
                    label: 'Number of Transfers',
                    data: feeData.values,
                    backgroundColor: [
                        this.defaultColors.success,
                        this.defaultColors.info,
                        this.defaultColors.warning,
                        this.defaultColors.danger
                    ],
                    borderColor: '#fff',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    tooltip: {
                        ...this.chartOptions.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                return `Transfers: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Process monthly data for spending chart
     */
    processMonthlyData(transfers) {
        const monthlyStats = {};
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        // Initialize months
        months.forEach((month, index) => {
            monthlyStats[index + 1] = { spending: 0, count: 0 };
        });
        
        // Process transfers
        transfers.forEach(transfer => {
            if (transfer.transfer_date) {
                const date = new Date(transfer.transfer_date);
                const month = date.getMonth() + 1;
                
                if (monthlyStats[month]) {
                    monthlyStats[month].spending += transfer.transfer_fee || 0;
                    monthlyStats[month].count += 1;
                }
            }
        });
        
        return {
            labels: months,
            spending: months.map((_, index) => monthlyStats[index + 1].spending),
            count: months.map((_, index) => monthlyStats[index + 1].count)
        };
    }
    
    /**
     * Process position data for pie chart
     */
    processPositionData(transfers) {
        const positions = {};
        
        transfers.forEach(transfer => {
            const position = transfer.player_position || 'Unknown';
            positions[position] = (positions[position] || 0) + 1;
        });
        
        // Sort by count
        const sortedPositions = Object.entries(positions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6); // Top 6 positions
        
        return {
            labels: sortedPositions.map(([position]) => position),
            values: sortedPositions.map(([, count]) => count)
        };
    }
    
    /**
     * Process club spending data
     */
    processClubSpendingData(transfers) {
        const clubSpending = {};
        
        transfers.forEach(transfer => {
            const club = transfer.to_club_name;
            if (club) {
                clubSpending[club] = (clubSpending[club] || 0) + (transfer.transfer_fee || 0);
            }
        });
        
        // Sort by spending and take top 10
        const sortedClubs = Object.entries(clubSpending)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        return {
            labels: sortedClubs.map(([club]) => club.length > 15 ? club.substring(0, 12) + '...' : club),
            spending: sortedClubs.map(([, spending]) => spending)
        };
    }
    
    /**
     * Process fee distribution data
     */
    processFeeDistributionData(transfers) {
        const ranges = {
            'Free': 0,
            '€0-10M': 0,
            '€10-50M': 0,
            '€50M+': 0
        };
        
        transfers.forEach(transfer => {
            const fee = transfer.transfer_fee || 0;
            
            if (fee === 0) {
                ranges['Free']++;
            } else if (fee <= 10) {
                ranges['€0-10M']++;
            } else if (fee <= 50) {
                ranges['€10-50M']++;
            } else {
                ranges['€50M+']++;
            }
        });
        
        return {
            labels: Object.keys(ranges),
            values: Object.values(ranges)
        };
    }
    
    /**
     * Generate gradient colors for charts
     */
    generateGradientColors(count) {
        const colors = [];
        const baseColors = [
            this.defaultColors.primary,
            this.defaultColors.success,
            this.defaultColors.warning,
            this.defaultColors.danger,
            this.defaultColors.info,
            this.defaultColors.secondary
        ];
        
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        
        return colors;
    }
    
    /**
     * Update all charts with new data
     */
    updateCharts(transfers) {
        this.createMonthlySpendingChart(transfers);
        this.createPositionChart(transfers);
        this.createSpendingClubsChart(transfers);
        this.createFeeDistributionChart(transfers);
    }
    
    /**
     * Resize all charts
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
    
    /**
     * Destroy all charts
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
    
    /**
     * Export chart as image
     */
    exportChart(chartName, filename) {
        const chart = this.charts[chartName];
        if (!chart) return;
        
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = filename || `${chartName}-chart.png`;
        link.href = url;
        link.click();
    }
    
    /**
     * Get chart statistics
     */
    getChartStats(transfers) {
        return {
            totalTransfers: transfers.length,
            totalSpending: transfers.reduce((sum, t) => sum + (t.transfer_fee || 0), 0),
            averageFee: transfers.length > 0 ? 
                transfers.reduce((sum, t) => sum + (t.transfer_fee || 0), 0) / transfers.length : 0,
            mostExpensive: transfers.reduce((max, t) => 
                (t.transfer_fee || 0) > (max.transfer_fee || 0) ? t : max, {}),
            uniqueClubs: new Set([
                ...transfers.map(t => t.from_club_name),
                ...transfers.map(t => t.to_club_name)
            ].filter(Boolean)).size,
            uniquePlayers: new Set(transfers.map(t => t.player_id).filter(Boolean)).size
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransferCharts;
}