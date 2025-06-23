import { ethers } from "hardhat";
import { GelatoRelay, CallWithERC2771Request } from "@gelatonetwork/relay-sdk";
import * as dotenv from "dotenv";

dotenv.config();

// Thrive Testnet Configuration
const CHAIN_ID = 1991;
const RPC_URL = "https://rpc.thrive-testnet.t.raas.gelato.cloud";

// Contract addresses - using the ones that exist
const ADDRESSES = {
    counterERC2771: "0xF9B1b52f94dfB39B2E2Efac268474855E05A5f9d",
    gelatoRelay1BalanceERC2771: "0x61F2976610970AFeDc1d83229e1E21bdc3D5cbE4", // Trusted forwarder
};

const API_KEY = process.env.GELATO_API_KEY!;

async function main() {
    console.log("🧪 Testing sponsoredCallERC2771 (FIXED) on Thrive Testnet");
    console.log("========================================================");
    
    if (!API_KEY) {
        console.error("❌ GELATO_API_KEY not found in .env file");
        process.exit(1);
    }
    
    if (!process.env.PRIVATE_KEY) {
        console.error("❌ PRIVATE_KEY not found in .env file");
        process.exit(1);
    }

    console.log(`ERC2771 Counter Contract: ${ADDRESSES.counterERC2771}`);
    console.log(`Trusted Forwarder: ${ADDRESSES.gelatoRelay1BalanceERC2771}`);
    console.log(`Chain ID: ${CHAIN_ID}`);
    console.log("");

    // Test Method 2: sponsoredCallERC2771 - FIXED VERSION
    await testSponsoredCallERC2771Fixed();
}

async function testSponsoredCallERC2771Fixed() {
    console.log("2️⃣  Testing sponsoredCallERC2771 (FIXED)");
    console.log("---------------------------------------");
    console.log("Using correct configuration from documentation");
    console.log("");
    
    try {
        // Setup provider and signer
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        
        console.log(`Signer address: ${wallet.address}`);
        
        // FIXED: Use correct config key and forwarder address
        const relay = new GelatoRelay({
            contract: {
                relay1BalanceERC2771: ADDRESSES.gelatoRelay1BalanceERC2771 
            }
        });
        
        // Encode increment() function call
        const abi = ["function increment()"];
        const iface = new ethers.Interface(abi);
        const data = iface.encodeFunctionData("increment", []);

        
        const request: CallWithERC2771Request = {
            user: wallet.address,
            chainId: BigInt(CHAIN_ID),
            target: ADDRESSES.counterERC2771,
            data: data,
        };

        console.log("Sending sponsoredCallERC2771 request (FIXED)...");
        console.log("(This will require signing with your wallet)");
        
        const response = await relay.sponsoredCallERC2771(request, provider, API_KEY);
        
        console.log("✅ SUCCESS!");
        console.log(`Task ID: ${response.taskId}`);
        console.log(`Track status: https://relay.gelato.digital/tasks/status/${response.taskId}`);
        console.log("");
        
        return response.taskId;
        
    } catch (error) {
        console.log("❌ FAILED!");
        console.error("Error:", error);
        console.log("");
        
        // Check if it's the forwarder issue specifically
        if (error instanceof Error) {
            if (error.message.includes("forwarder") || error.message.includes("contract")) {
                console.log("💡 This confirms the forwarder contracts are missing on Thrive testnet");
            }
            if (error.message.includes("nonce")) {
                console.log("💡 Let's try concurrent mode...");
                return await testConcurrentMode();
            }
        }
        
        throw error;
    }
}

async function testConcurrentMode() {
    console.log("\n🔄 Trying concurrent mode...");
    
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        
        // Try with concurrent forwarder (if it exists)
        const relay = new GelatoRelay({
            contract: {
                relay1BalanceConcurrentERC2771: "0x2e8235caa6a16E64D7F73b8DBC257369FBF2972D"
            }
        });
        
        const abi = ["function increment()"];
        const iface = new ethers.Interface(abi);
        const data = iface.encodeFunctionData("increment", []);

        const request: CallWithERC2771Request = {
            user: wallet.address,
            chainId: BigInt(CHAIN_ID),
            target: ADDRESSES.counterERC2771,
            data: data,
            isConcurrent: true, // Enable concurrent mode
        };

        const response = await relay.sponsoredCallERC2771(request, provider, API_KEY);
        
        console.log("✅ CONCURRENT MODE SUCCESS!");
        console.log(`Task ID: ${response.taskId}`);
        return response.taskId;
        
    } catch (error) {
        console.log("❌ Concurrent mode also failed");
        console.log("This confirms: ERC2771 forwarders are not deployed on Thrive testnet");
        throw error;
    }
}

main()
    .then(() => {
        console.log("🎉 ERC2771 testing completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 ERC2771 testing failed - forwarders missing:", error);
        process.exit(1);
    });