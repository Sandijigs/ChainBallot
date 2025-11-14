// Modern version with AppKit integration
import { BrowserProvider, Contract } from 'ethers';
import { appKit } from './appkit-config.js';
import votingArtifacts from '../../build/contracts/Voting.json';

// Global state
window.AppWithAppKit = {
  provider: null,
  signer: null,
  contract: null,
  account: null,

  // Initialize AppKit connection
  async initWallet() {
    try {
      // Subscribe to account changes
      appKit.subscribeAccount(async ({ address, isConnected }) => {
        if (isConnected && address) {
          this.account = address;
          await this.loadContract();
          await this.loadVotingData();
          $("#accountAddress").html("Your Account: " + address);
        } else {
          this.account = null;
          $("#accountAddress").html("Not connected");
        }
      });

      // Subscribe to network changes
      appKit.subscribeNetwork(({ chainId }) => {
        console.log('Network changed:', chainId);
        if (this.account) {
          this.loadContract();
          this.loadVotingData();
        }
      });

      // Check if already connected
      const state = appKit.getState();
      if (state.selectedNetworkId && appKit.getAddress()) {
        this.account = appKit.getAddress();
        await this.loadContract();
        await this.loadVotingData();
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
    }
  },

  // Load contract instance
  async loadContract() {
    try {
      // Get wallet provider from AppKit
      const walletProvider = appKit.getWalletProvider();
      if (!walletProvider) {
        console.error("No wallet provider available");
        return;
      }

      this.provider = new BrowserProvider(walletProvider);
      this.signer = await this.provider.getSigner();

      // Get deployed contract address (you may need to update this)
      const networkId = await this.provider.getNetwork().then(n => n.chainId);
      const deployedNetwork = votingArtifacts.networks[networkId];

      if (!deployedNetwork) {
        console.error("Contract not deployed on this network");
        return;
      }

      this.contract = new Contract(
        deployedNetwork.address,
        votingArtifacts.abi,
        this.signer
      );

      console.log("Contract loaded:", this.contract.target);
    } catch (error) {
      console.error("Error loading contract:", error);
    }
  },

  // Load voting data
  async loadVotingData() {
    if (!this.contract) {
      console.log("Contract not loaded yet");
      return;
    }

    try {
      // Get candidate count
      const countCandidates = await this.contract.getCountCandidates();

      // Setup event handlers
      $(document).ready(() => {
        // Add candidate handler
        $('#addCandidate').off('click').on('click', async () => {
          const nameCandidate = $('#name').val();
          const partyCandidate = $('#party').val();

          if (!nameCandidate || !partyCandidate) {
            alert("Please enter both name and party");
            return;
          }

          try {
            const tx = await this.contract.addCandidate(nameCandidate, partyCandidate);
            await tx.wait();
            alert("Candidate added successfully!");
            window.location.reload();
          } catch (error) {
            console.error("Error adding candidate:", error);
            alert("Error adding candidate: " + error.message);
          }
        });

        // Add dates handler
        $('#addDate').off('click').on('click', async () => {
          const startDate = Math.floor(Date.parse(document.getElementById("startDate").value) / 1000);
          const endDate = Math.floor(Date.parse(document.getElementById("endDate").value) / 1000);

          if (!startDate || !endDate) {
            alert("Please select both start and end dates");
            return;
          }

          try {
            const tx = await this.contract.setDates(startDate, endDate);
            await tx.wait();
            console.log("Dates set successfully");
            alert("Voting dates set successfully!");
            window.location.reload();
          } catch (error) {
            console.error("Error setting dates:", error);
            alert("Error setting dates: " + error.message);
          }
        });
      });

      // Get and display dates
      try {
        const dates = await this.contract.getDates();
        const startDate = new Date(Number(dates[0]) * 1000);
        const endDate = new Date(Number(dates[1]) * 1000);
        $("#dates").text(startDate.toDateString() + " - " + endDate.toDateString());
      } catch (error) {
        console.error("Error getting dates:", error);
      }

      // Load candidates
      $("#boxCandidate").empty();
      for (let i = 0; i < Number(countCandidates); i++) {
        try {
          const candidate = await this.contract.getCandidate(i + 1);
          const id = candidate[0];
          const name = candidate[1];
          const party = candidate[2];
          const voteCount = candidate[3];

          const viewCandidates = `<tr><td> <input class="form-check-input" type="radio" name="candidate" value="${id}" id="${id}">`
            + name + "</td><td>" + party + "</td><td>" + voteCount.toString() + "</td></tr>";
          $("#boxCandidate").append(viewCandidates);
        } catch (error) {
          console.error("Error loading candidate:", error);
        }
      }

      // Check if user has voted
      try {
        const hasVoted = await this.contract.checkVote();
        if (!hasVoted) {
          $("#voteButton").attr("disabled", false);
        } else {
          $("#voteButton").attr("disabled", true);
          $("#msg").html("<p>You have already voted</p>");
        }
      } catch (error) {
        console.error("Error checking vote status:", error);
      }

    } catch (error) {
      console.error("Error loading voting data:", error);
    }
  },

  // Vote function
  async vote() {
    if (!this.contract) {
      alert("Please connect your wallet first");
      return;
    }

    const candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p>Please vote for a candidate.</p>");
      return;
    }

    try {
      const tx = await this.contract.vote(parseInt(candidateID));
      $("#msg").html("<p>Processing your vote...</p>");

      await tx.wait();

      $("#voteButton").attr("disabled", true);
      $("#msg").html("<p>Voted successfully!</p>");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error voting:", error);
      $("#msg").html("<p>Error: " + error.message + "</p>");
    }
  }
};

// Initialize on load
window.addEventListener("load", () => {
  window.AppWithAppKit.initWallet();
});

// Export for use in other modules
export default window.AppWithAppKit;
