import { ethers } from "hardhat";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import * as dotenv from "dotenv";

dotenv.config();

// Thrive Testnet Configuration
const CHAIN_ID = 1991;
const TARGET_CONTRACT = "0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De";
const API_KEY = process.env.GELATO_API_KEY!;

async function main() {
    console.log("🧪 Testing Gelato Relay on Thrive Testnet");
    console.log("==========================================");
    
    if (!API_KEY) {
        console.error("❌ GELATO_API_KEY not found in .env file");
        process.exit(1);
    }
    
    if (!process.env.PRIVATE_KEY) {
        console.error("❌ PRIVATE_KEY not found in .env file");
        process.exit(1);
    }

    console.log(`Target Contract: ${TARGET_CONTRACT}`);
    console.log(`Chain ID: ${CHAIN_ID}`);
    console.log("");

    // Test Method 1: sponsoredCall
    await testSponsoredCall();
}

async function testSponsoredCall() {
    console.log("1️⃣  Testing sponsoredCall");
    console.log("------------------------");
    
    try {
        const relay = new GelatoRelay();
        
        // Encode increment() function call
        const abi = ["function increment()"];
        const iface = new ethers.Interface(abi);
        const data = iface.encodeFunctionData("increment", []);

        const request = {
            chainId: BigInt(CHAIN_ID),
            target: TARGET_CONTRACT,
            data: data,
        };

        console.log("Sending sponsoredCall request...");
        const response = await relay.sponsoredCall(request, API_KEY);
        
        console.log("✅ SUCCESS!");
        console.log(`Task ID: ${response.taskId}`);
        console.log(`Track status: https://relay.gelato.digital/tasks/status/${response.taskId}`);
        console.log("");
        
        return response.taskId;
        
    } catch (error) {
        console.log("❌ FAILED!");
        console.error("Error:", error);
        console.log("");
        throw error;
    }
}

main()
    .then(() => {
        console.log("🎉 Test completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Test failed:", error);
        process.exit(1);
    });