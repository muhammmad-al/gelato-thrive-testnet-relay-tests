import { ethers } from "hardhat";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";
import * as dotenv from "dotenv";

dotenv.config();

// Thrive Testnet Configuration
const CHAIN_ID = 1991;
const RPC_URL = "https://rpc.thrive-testnet.t.raas.gelato.cloud";

// Use the actual relay context contracts
const ADDRESSES = {
    counterRelayContext: "0x317c56D44be1444302983c640532B20FBC0A3996", // Proxy to CounterRelayContext
    feeToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
};

async function main() {
    console.log("🧪 Testing callWithSyncFee with CounterRelayContext");
    console.log("==================================================");
    
    console.log(`Counter Relay Context: ${ADDRESSES.counterRelayContext}`);
    console.log(`Fee Token (Native ETH): ${ADDRESSES.feeToken}`);
    console.log(`Chain ID: ${CHAIN_ID}`);
    console.log("");

    // Test with most likely relay context functions
    const functionsToTry = [
        "increment",
        "incrementCounter", 
        "incrementContext",
        "incrementWithRelay",
        "execute"
    ];

    for (const funcName of functionsToTry) {
        await testCallWithSyncFee(funcName);
    }
}

async function testCallWithSyncFee(functionName: string) {
    console.log(`3️⃣  Testing callWithSyncFee with ${functionName}()`);
    console.log("─".repeat(50));
    
    try {
        // Check wallet balance
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        const balance = await provider.getBalance(wallet.address);
        
        console.log(`Wallet: ${wallet.address}`);
        console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
        
        const relay = new GelatoRelay();
        
        // Try the function
        const abi = [`function ${functionName}()`];
        const iface = new ethers.Interface(abi);
        const data = iface.encodeFunctionData(functionName, []);

        const request = {
            chainId: BigInt(CHAIN_ID),
            target: ADDRESSES.counterRelayContext,
            data: data,
            feeToken: ADDRESSES.feeToken, // Native ETH
            isRelayContext: true, // This contract should handle fees internally
        };

        // Add reasonable gas limit
        const options = {
            gasLimit: 500000,
        };

        console.log(`Sending callWithSyncFee with ${functionName}()...`);
        const response = await relay.callWithSyncFee(request, options);
        
        console.log("✅ SUCCESS!");
        console.log(`Task ID: ${response.taskId}`);
        console.log(`Track: https://relay.gelato.digital/tasks/status/${response.taskId}`);
        console.log("");
        
        // If we get here, this function works!
        return response.taskId;
        
    } catch (error) {
        console.log("❌ FAILED!");
        if (error instanceof Error) {
            if (error.message.includes("function") || error.message.includes("method")) {
                console.log(`   └── Function ${functionName}() doesn't exist or wrong signature`);
            } else {
                console.log(`   └── Error: ${error.message.substring(0, 100)}...`);
            }
        }
        console.log("");
    }
}

main()
    .then(() => {
        console.log("🎉 Relay context testing completed!");
        console.log("Check which function worked above!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Testing failed:", error);
        process.exit(1);
    });