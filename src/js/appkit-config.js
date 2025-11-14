// AppKit Configuration for Voting DApp
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, sepolia, hardhat } from '@reown/appkit/networks';

// Get project ID from environment
const projectId = process.env.WALLETCONNECT_PROJECT_ID || '6b87a3c69cbd8b52055d7aef763148d6';

// Metadata for the app
const metadata = {
  name: 'Decentralized Voting System',
  description: 'A secure blockchain-based voting platform',
  url: 'https://voting-dapp.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create Ethers adapter
const ethersAdapter = new EthersAdapter();

// Create and export AppKit instance
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks: [mainnet, sepolia, hardhat],
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: []
  },
  themeMode: 'light'
});

export default appKit;
