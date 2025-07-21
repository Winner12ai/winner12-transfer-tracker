# Winner12 Transfer Tracker 🏆⚽

An interactive football transfer tracking tool that provides comprehensive visualization and analysis of player transfers. Built with modern web technologies and powered by real-time transfer data.

## 🌟 Features

### 📊 Interactive Visualizations
- **Network Graph**: D3.js-powered interactive network showing transfer relationships between clubs
- **Transfer Charts**: Chart.js visualizations including:
  - Monthly spending trends
  - Position distribution analysis
  - Club spending comparisons
  - Transfer fee distributions

### 🔍 Advanced Filtering & Search
- Filter by league, position, season, and transfer fee range
- Date range filtering for specific transfer windows
- Real-time search across player names, clubs, and nationalities
- Multi-criteria filtering with instant results

### 📈 Data Analytics
- Comprehensive transfer statistics and summaries
- Top spending and selling clubs analysis
- Market value vs transfer fee comparisons
- Transfer trend analysis over time

### 💾 Data Management
- JSON-based data structure following awesome-json-datasets standards
- CSV export functionality for further analysis
- Caching system for improved performance
- Sample data included for demonstration

## 🚀 Quick Start

### Prerequisites
- Modern web browser with JavaScript enabled
- Python 3.8+ (for data processing)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Winner12ai/winner12-transfer-tracker.git
   cd winner12-transfer-tracker
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Serve the application**
   ```bash
   # Using Python's built-in server
   python -m http.server 8000
   
   # Or using Node.js live-server
   npx live-server
   ```

4. **Open in browser**
   Navigate to `http://localhost:8000`

## 📁 Project Structure

```
winner12-transfer-tracker/
├── index.html              # Main application page
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── app.js            # Main application controller
│   ├── data-loader.js    # Data loading and processing
│   ├── network-visualization.js  # D3.js network graph
│   └── charts.js         # Chart.js visualizations
├── src/
│   └── data_fetcher.py   # Python data fetching from APIs
├── data/
│   └── transfers_2025.json  # Sample transfer data
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🔧 Configuration

### Data Sources
The application supports multiple data sources:

1. **JSON Files**: Place your transfer data in the `data/` directory
2. **Transfermarkt API**: Configure API access in `src/data_fetcher.py`
3. **Custom APIs**: Extend the data loader for additional sources

### Data Format
Transfer data should follow this JSON structure:

```json
{
  "metadata": {
    "generated_at": "2025-01-21T10:00:00Z",
    "league": "Premier League",
    "season": "2025",
    "total_records": 15
  },
  "summary": {
    "total_transfers": 15,
    "total_spending": 850000000,
    "average_fee": 56666667
  },
  "transfers": [
    {
      "player_id": "unique_id",
      "player_name": "Player Name",
      "player_age": 25,
      "player_position": "Forward",
      "player_nationality": "Country",
      "from_club_name": "Source Club",
      "to_club_name": "Destination Club",
      "transfer_fee": 50000000,
      "transfer_date": "2025-01-15T00:00:00Z",
      "season": "2025"
    }
  ]
}
```

## 🎯 Usage

### Basic Navigation
1. **Overview Tab**: View summary statistics and key metrics
2. **Network Tab**: Explore transfer relationships in interactive graph
3. **Charts Tab**: Analyze trends with various chart types
4. **Data Tab**: Browse detailed transfer table with sorting

### Filtering Data
- Use the filter panel to narrow down transfers by:
  - League (Premier League, La Liga, etc.)
  - Player position (Forward, Midfielder, etc.)
  - Season and date ranges
  - Maximum transfer fee
- Search box supports player names, clubs, and nationalities
- Clear all filters with the "Clear Filters" button

### Exporting Data
- Click "Export CSV" to download filtered data
- Data includes all visible transfers with current filters applied

## 🛠️ Development

### Adding New Features

1. **New Visualizations**
   - Extend `charts.js` for Chart.js visualizations
   - Modify `network-visualization.js` for D3.js components

2. **Data Sources**
   - Update `data_fetcher.py` for new API integrations
   - Extend `data-loader.js` for client-side processing

3. **Filters**
   - Add new filter controls in `index.html`
   - Update filter logic in `app.js`

### Running Tests
```bash
# Python tests
pytest src/tests/

# JavaScript tests (if implemented)
npm test
```

### Code Quality
```bash
# Python formatting
black src/
isort src/
flake8 src/

# Type checking
mypy src/
```

## 📊 Data Processing

### Fetching Transfer Data

```python
from src.data_fetcher import TransferDataFetcher

# Initialize fetcher
fetcher = TransferDataFetcher()

# Fetch transfers for a specific league
transfers = fetcher.get_transfers_by_league('premier-league', '2025')

# Process and save data
processed_data = fetcher.process_transfers(transfers)
fetcher.save_to_json(processed_data, 'data/premier_league_2025.json')
```

### Data Validation
The application includes built-in data validation:
- Required fields checking
- Data type validation
- Date format verification
- Transfer fee normalization

## 🎨 Customization

### Styling
Modify `css/styles.css` to customize:
- Color schemes and themes
- Layout and spacing
- Chart and visualization styles
- Responsive breakpoints

### Branding
Update branding elements:
- Logo and favicon in `index.html`
- Application title and metadata
- Color variables in CSS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Transfermarkt** for transfer data and inspiration
- **D3.js** for powerful data visualization capabilities
- **Chart.js** for beautiful and responsive charts
- **Bootstrap** for responsive UI components
- **Font Awesome** for icons and visual elements

## 📞 Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Contact: [Your Contact Information]
- Documentation: [Link to detailed docs if available]

## 🔄 Changelog

### Version 1.0.0 (2025-01-21)
- Initial release
- Interactive network visualization
- Multi-chart dashboard
- Advanced filtering system
- CSV export functionality
- Sample data included

---

**Built with ❤️ by Winner12ai**

*Making football transfer data accessible and beautiful* ⚽📊