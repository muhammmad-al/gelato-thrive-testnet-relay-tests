import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://rpc.thrive-testnet.t.raas.gelato.cloud";
const ADDRESSES = {
    feeToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    simpleCounter: "0xE27C1359cf02B49acC6474311Bd79d1f10b1f8De",
    counterERC2771: "0xF9B1b52f94dfB39B2E2Efac268474855E05A5f9d",
    gelatoRelayERC2771: "0x8aCE64CEA52b409F930f60B516F65197faD4B056",
    counterRelayContext: "0x317c56D44be1444302983c640532B20FBC0A3996",
    counterRelayContextERC2771: "0x9A51492cd20802c11F27816E47935C7643f66805",
    gelatoRelay1BalanceERC2771: "0x61F2976610970AFeDc1d83229e1E21bdc3D5cbE4",
    gelatoRelayConcurrentERC2771: "0xc7739c195618D314C08E8626C98f8573E4E43634",
    gelatoRelay1BalanceConcurrentERC2771: "0x2e8235caa6a16E64D7F73b8DBC257369FBF2972D"
};

async function main() {
    console.log("🔍 Debugging Contract Addresses on Thrive Testnet");
    console.log("================================================");
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    for (const [name, address] of Object.entries(ADDRESSES)) {
        await checkContract(provider, name, address);
    }
}

async function checkContract(provider: ethers.JsonRpcProvider, name: string, address: string) {
    try {
        const code = await provider.getCode(address);
        const hasCode = code !== "0x";
        
        console.log(`${hasCode ? "✅" : "❌"} ${name}: ${address}`);
        if (!hasCode) {
            console.log(`   └── No contract code found (EOA or non-existent)`);
        } else {
            console.log(`   └── Contract exists (${code.length} bytes)`);
            
            // Try to call increment() if it exists
            if (name.includes("counter") || name.includes("Counter")) {
                await tryIncrementCall(provider, address, name);
            }
        }
        console.log("");
        
    } catch (error) {
        console.log(`❌ ${name}: ${address}`);
        console.log(`   └── Error: ${error}`);
        console.log("");
    }
}

async function tryIncrementCall(provider: ethers.JsonRpcProvider, address: string, name: string) {
    try {
        const abi = ["function increment() view"];
        const contract = new ethers.Contract(address, abi, provider);
        
        // Try to call increment (as view function to avoid gas)
        await contract.increment.staticCall();
        console.log(`   └── increment() function exists`);
        
    } catch (error) {
        if (error instanceof Error && error.message.includes("call revert exception")) {
            console.log(`   └── increment() exists but reverted (normal for non-view function)`);
        } else {
            console.log(`   └── increment() function not found or incompatible`);
        }
    }
}

main()
    .then(() => {
        console.log("🎉 Contract debugging completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Debugging failed:", error);
        process.exit(1);
    });