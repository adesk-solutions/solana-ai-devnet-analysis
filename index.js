import { Connection, PublicKey } from '@solana/web3.js';
import OpenAI from "openai";
import fetch from 'node-fetch';

// API Configurations
const SOLANA_RPC_URL = "https://api.devnet.solana.com"; // Replace with your RPC URL
const OPENAI_API_KEY = "open-api-key"; // Replace with your OpenAI API Key

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: "open-api-key", // Replace with your OpenAI API Key
});

//const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
//const openai = new OpenAIApi(configuration);

// Helper Function to Get Wallet Balance
async function getWalletBalance(connection, walletAddress) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / 1_000_000_000; // Convert Lamports to SOL
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return null;
  }
}

// Fetch Token Accounts
async function getTokenHoldings(connection, walletAddress) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const response = await connection.getTokenAccountsByOwner(publicKey, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") });
    return response.value.map((token) => token.pubkey.toString());
  } catch (error) {
    console.error("Error fetching token holdings:", error);
    return [];
  }
}

// Analyze Tokens with OpenAI
async function analyzeTokensWithAI(tokens) {
    try {      
        // Summarize tokens into a concise prompt
        const tokenSummary = tokens.map((token) => 
            `Token: ${token.symbol}, Quantity: ${token.amount}, Project: ${token.project || "Unknown"}`
        ).join("\n");

        const prompt = `
        You are a sentiment analyst for Solana blockchain token holdings. Analyze the sentiment of the wallet owner based on the following token holdings:
        ${tokenSummary}

        Focus on:
        - Motivation of the owner (e.g., speculative, long-term holder, active user).
        - The ecosystem's vibe (e.g., NFT enthusiast, DeFi investor, memecoin trader).
        - Token diversity and balance.

        Additionally, create a summary table with the following columns:
        - Token
        - Quantity
        - Project
        - Sentiment (e.g., Stable, Speculative, Risky, Diverse).
        Respond concisely.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4", // Use GPT-4 for better understanding
            messages: [
                { role: "system", content: "You are a blockchain sentiment analyst." },
                { role: "user", content: prompt }
            ]
        });

        // Return the output
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error with OpenAI API:", error);
        return "AI sentiment analysis failed.";
    }
}



// Main Function
async function main() {
  const walletAddress = "7bTaD1BzPkzWzw27iVUNx8SACf6BWCTiSBLGy7H5NYDa"; // Replace with a wallet address
  const connection = new Connection(SOLANA_RPC_URL);

  console.log("Fetching wallet data...");
  
  // Get Wallet Balance
  const balance = await getWalletBalance(connection, walletAddress);
  console.log(`Wallet Balance: ${balance} SOL`);

  // Get Token Holdings
  const tokens = await getTokenHoldings(connection, walletAddress);
  console.log(`Number of Tokens: ${tokens.length}`);

  if (tokens.length > 0) {
    // Analyze with AI for testing purposes only
    /*const tokens = [
        { symbol: "BONK", amount: 10000, project: "Memecoin" },
        { symbol: "USDC", amount: 500, project: "Stablecoin" },
        { symbol: "NFT_XYZ", amount: 3, project: "NFT Marketplace" },
        { symbol: "SOL", amount: 1.5, project: "Native Solana Token" },
    ];

    const tokens2 = [
        { symbol: "SOL", amount: 2.0, project: "Native Solana Token" },
        { symbol: "MANGO", amount: 150, project: "DeFi Protocol" },
        { symbol: "COPE", amount: 500, project: "Memecoin & Community Token" },
        { symbol: "SAMO", amount: 10000, project: "Memecoin" },
        { symbol: "USDT", amount: 750, project: "Stablecoin" },
        { symbol: "STSOL", amount: 1.2, project: "Staking Derivative Token" },
    ];*/
    
    analyzeTokensWithAI(tokens).then(console.log);
    
    
    const aiInsights = await analyzeTokensWithAI(tokens2);
    console.log("\nAI Insights:");
    console.log(aiInsights);
  } else {
    console.log("No tokens found for this wallet.");
  }
}

// Run the Script
main().catch(console.error);
