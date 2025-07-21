#!/usr/bin/env python3
"""
Transfer Data Fetcher
Fetches football transfer data from Transfermarkt API and processes it using pandas
"""

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import time
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TransferDataFetcher:
    """
    Fetches and processes football transfer data from Transfermarkt API
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = "https://transfermarkt-api.vercel.app"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Winner12-Transfer-Tracker/1.0',
            'Accept': 'application/json'
        })
        
    def fetch_transfers(self, league_id: str = "GB1", season: str = "2025") -> List[Dict]:
        """
        Fetch transfer data for a specific league and season
        
        Args:
            league_id: League identifier (e.g., 'GB1' for Premier League)
            season: Season year (e.g., '2025')
            
        Returns:
            List of transfer records
        """
        try:
            url = f"{self.base_url}/transfers"
            params = {
                'league_id': league_id,
                'season': season
            }
            
            logger.info(f"Fetching transfers for {league_id} season {season}")
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            return data.get('transfers', [])
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching transfer data: {e}")
            return []
    
    def fetch_player_details(self, player_id: str) -> Dict:
        """
        Fetch detailed information about a specific player
        
        Args:
            player_id: Player identifier
            
        Returns:
            Player details dictionary
        """
        try:
            url = f"{self.base_url}/players/{player_id}"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching player details for {player_id}: {e}")
            return {}
    
    def process_transfer_data(self, transfers: List[Dict]) -> pd.DataFrame:
        """
        Process raw transfer data into a structured pandas DataFrame
        
        Args:
            transfers: List of transfer records
            
        Returns:
            Processed DataFrame
        """
        if not transfers:
            return pd.DataFrame()
        
        # Normalize the data structure
        processed_data = []
        
        for transfer in transfers:
            record = {
                'player_id': transfer.get('player', {}).get('id', ''),
                'player_name': transfer.get('player', {}).get('name', ''),
                'player_age': transfer.get('player', {}).get('age', 0),
                'player_position': transfer.get('player', {}).get('position', ''),
                'player_nationality': transfer.get('player', {}).get('nationality', ''),
                'from_club_id': transfer.get('from_club', {}).get('id', ''),
                'from_club_name': transfer.get('from_club', {}).get('name', ''),
                'from_club_league': transfer.get('from_club', {}).get('league', ''),
                'to_club_id': transfer.get('to_club', {}).get('id', ''),
                'to_club_name': transfer.get('to_club', {}).get('name', ''),
                'to_club_league': transfer.get('to_club', {}).get('league', ''),
                'transfer_fee': self._parse_transfer_fee(transfer.get('fee', '')),
                'transfer_fee_currency': transfer.get('fee_currency', 'EUR'),
                'transfer_date': transfer.get('date', ''),
                'transfer_type': transfer.get('type', ''),
                'contract_duration': transfer.get('contract_duration', ''),
                'season': transfer.get('season', ''),
                'market_value': transfer.get('player', {}).get('market_value', 0)
            }
            processed_data.append(record)
        
        df = pd.DataFrame(processed_data)
        
        # Data type conversions
        if not df.empty:
            df['transfer_date'] = pd.to_datetime(df['transfer_date'], errors='coerce')
            df['player_age'] = pd.to_numeric(df['player_age'], errors='coerce')
            df['transfer_fee'] = pd.to_numeric(df['transfer_fee'], errors='coerce')
            df['market_value'] = pd.to_numeric(df['market_value'], errors='coerce')
        
        return df
    
    def _parse_transfer_fee(self, fee_string: str) -> float:
        """
        Parse transfer fee string to numeric value
        
        Args:
            fee_string: Fee string (e.g., '€100M', 'Free transfer')
            
        Returns:
            Numeric fee value in millions
        """
        if not fee_string or fee_string.lower() in ['free', 'free transfer', 'loan', '-']:
            return 0.0
        
        # Remove currency symbols and spaces
        fee_clean = fee_string.replace('€', '').replace('£', '').replace('$', '').replace(' ', '')
        
        try:
            if 'M' in fee_clean:
                return float(fee_clean.replace('M', ''))
            elif 'K' in fee_clean:
                return float(fee_clean.replace('K', '')) / 1000
            else:
                return float(fee_clean) / 1000000  # Convert to millions
        except ValueError:
            return 0.0
    
    def generate_transfer_summary(self, df: pd.DataFrame) -> Dict:
        """
        Generate summary statistics from transfer data
        
        Args:
            df: Transfer DataFrame
            
        Returns:
            Summary statistics dictionary
        """
        if df.empty:
            return {}
        
        summary = {
            'total_transfers': len(df),
            'total_spending': df['transfer_fee'].sum(),
            'average_fee': df['transfer_fee'].mean(),
            'median_fee': df['transfer_fee'].median(),
            'most_expensive_transfer': {
                'player': df.loc[df['transfer_fee'].idxmax(), 'player_name'] if not df['transfer_fee'].isna().all() else '',
                'fee': df['transfer_fee'].max(),
                'from_club': df.loc[df['transfer_fee'].idxmax(), 'from_club_name'] if not df['transfer_fee'].isna().all() else '',
                'to_club': df.loc[df['transfer_fee'].idxmax(), 'to_club_name'] if not df['transfer_fee'].isna().all() else ''
            },
            'transfers_by_position': df['player_position'].value_counts().to_dict(),
            'transfers_by_month': df.groupby(df['transfer_date'].dt.month)['transfer_fee'].sum().to_dict() if 'transfer_date' in df.columns else {},
            'top_spending_clubs': df.groupby('to_club_name')['transfer_fee'].sum().nlargest(10).to_dict(),
            'top_selling_clubs': df.groupby('from_club_name')['transfer_fee'].sum().nlargest(10).to_dict()
        }
        
        return summary
    
    def save_to_json(self, data: Dict, filename: str) -> None:
        """
        Save data to JSON file
        
        Args:
            data: Data to save
            filename: Output filename
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            logger.info(f"Data saved to {filename}")
        except Exception as e:
            logger.error(f"Error saving data to {filename}: {e}")

def main():
    """
    Main function to demonstrate the transfer data fetcher
    """
    fetcher = TransferDataFetcher()
    
    # Fetch Premier League transfers for 2025
    transfers = fetcher.fetch_transfers(league_id="GB1", season="2025")
    
    if transfers:
        # Process the data
        df = fetcher.process_transfer_data(transfers)
        
        # Generate summary
        summary = fetcher.generate_transfer_summary(df)
        
        # Save processed data
        output_data = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'league': 'Premier League',
                'season': '2025',
                'total_records': len(df)
            },
            'summary': summary,
            'transfers': df.to_dict('records')
        }
        
        fetcher.save_to_json(output_data, 'data/transfers_2025.json')
        
        print(f"Processed {len(df)} transfers")
        print(f"Total spending: €{summary.get('total_spending', 0):.1f}M")
    else:
        print("No transfer data found")

if __name__ == "__main__":
    main()