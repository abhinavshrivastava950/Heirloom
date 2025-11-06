# 🚀 CLI Integration Guide - Heirloom Contract

## 📺 **NEW: CLI Commands in Frontend!**

Your frontend now includes a **CLI Commands** tab that shows all the Stellar CLI commands you need, with your actual values filled in automatically!

## ✨ Features Added

### 1. **CLI Commands Tab**
- Click the "CLI Commands" tab in the UI
- See all commands pre-filled with your wallet address, beneficiary, and contract ID
- One-click copy to clipboard for each command
- Real-time updates based on your form inputs

### 2. **Smart Command Generation**
The frontend automatically generates CLI commands using:
- Your connected wallet address
- The beneficiary you entered
- The check-in period you specified
- The deposit amount you typed
- The current contract ID

### 3. **Reference Guide**
Includes setup commands for:
- Network configuration
- Account creation and funding
- Contract deployment
- All contract operations

## 🎯 How to Use

### Option A: **UI Only (Recommended for Demo)**
1. Connect Freighter wallet
2. Use the Owner Dashboard to:
   - Initialize contract
   - Deposit funds
   - Check-in
   - Withdraw
3. Use Beneficiary Portal to claim

✅ **No CLI needed!** Everything works in the browser.

### Option B: **UI + CLI Reference**
1. Connect wallet and fill in the forms
2. Click "CLI Commands" tab
3. Copy the commands you need
4. Run them in your terminal

This is useful for:
- Backend automation
- Testing without browser
- Scripting deployments

### Option C: **Pure CLI (Advanced)**
Follow the commands in the CLI tab from scratch.

## 📋 CLI Commands Available

### 1. **Deploy**
```bash
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/heirloom_contract.wasm \
  --source owner \
  --network testnet
```

### 2. **Initialize**
```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source owner \
  --network testnet \
  -- \
  initialize \
  --owner YOUR_PUBLIC_KEY \
  --beneficiary BENEFICIARY_PUBLIC_KEY \
  --check_in_period 300 \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

### 3. **Deposit**
```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source owner \
  --network testnet \
  -- \
  deposit \
  --from YOUR_PUBLIC_KEY \
  --amount 1000000000
```

### 4. **Check In**
```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source owner \
  --network testnet \
  -- \
  check_in \
  --owner YOUR_PUBLIC_KEY
```

### 5. **Get Info**
```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source owner \
  --network testnet \
  -- \
  get_info
```

### 6. **Claim (Beneficiary)**
```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source beneficiary \
  --network testnet \
  -- \
  claim \
  --beneficiary BENEFICIARY_PUBLIC_KEY
```

### 7. **Emergency Withdrawal (Owner)**
```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source owner \
  --network testnet \
  -- \
  owner_withdraw \
  --owner YOUR_PUBLIC_KEY
```

## 🔧 Initial Setup (One-Time)

### Step 1: Configure Network
```bash
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

### Step 2: Create Identity
```bash
# Generate keys
stellar keys generate owner --network testnet

# Fund account
stellar keys fund owner --network testnet
```

### Step 3: Deploy Contract
```bash
# Build
stellar contract build

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/heirloom_contract.wasm \
  --source owner \
  --network testnet
```

Save the contract ID! (Or use the default one already deployed)

## 💡 Best Practices

### For Hackathon Demo:
1. ✅ **Use the UI** - It's beautiful and impressive
2. ✅ **Show CLI tab** - Demonstrates technical depth
3. ✅ **Mention both options** - UI for users, CLI for automation

### For Production:
1. Deploy once via CLI
2. Share contract ID with users
3. Users interact via UI only
4. Backend services can use CLI for automation

## 🎬 Demo Flow with CLI Integration

### Scene 1: UI Demo (2 minutes)
- Show wallet connection
- Initialize, deposit, check-in via UI
- Highlight beautiful interface

### Scene 2: CLI Reference (30 seconds)
- Click "CLI Commands" tab
- Show pre-filled commands
- Copy a command
- Mention: "All of this can also be automated via CLI"

### Scene 3: Technical Depth (30 seconds)
- Explain the smart contract functions in `lib.rs`
- Show how UI calls match CLI commands
- Demonstrate flexibility: UI for users, CLI for automation

## 🚀 Current Deployed Contract

**Contract ID:** `CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5`

This contract is already deployed on Stellar Testnet and ready to use!

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Owner UI     │  │ Beneficiary  │  │ CLI Tab  │ │
│  │ - Initialize │  │ - Claim      │  │ - Copy   │ │
│  │ - Deposit    │  │              │  │ - Ref    │ │
│  │ - Check-in   │  │              │  │          │ │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │                 │                │       │
│         └─────────┬───────┴────────────────┘       │
│                   │                                 │
│          ┌────────▼────────┐                        │
│          │ Stellar SDK     │                        │
│          │ + Freighter API │                        │
│          └────────┬────────┘                        │
└───────────────────┼─────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Stellar Testnet    │
         │  ┌──────────────┐   │
         │  │  Smart       │   │
         │  │  Contract    │   │
         │  │  (Rust)      │   │
         │  └──────────────┘   │
         └─────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Stellar CLI        │
         │  (Alternative)      │
         │  - Deploy           │
         │  - Invoke           │
         │  - Query            │
         └─────────────────────┘
```

## 🎯 Key Points for Hackathon

1. **Dual Interface**: UI for users + CLI for automation
2. **No Backend Required**: Frontend directly interacts with blockchain
3. **Type Safety**: Rust smart contract ensures security
4. **Real Blockchain**: Deployed on Stellar Testnet
5. **Production Ready**: Can be used as-is with mainnet deployment

## 🔗 Resources

- **Frontend**: http://localhost:3000
- **Contract ID**: `CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5`
- **Network**: Stellar Testnet
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5

---

## 🎉 You're All Set!

Your frontend now has:
- ✅ Beautiful UI for users
- ✅ CLI commands for developers
- ✅ Copy-to-clipboard functionality
- ✅ Real-time command generation
- ✅ Complete reference documentation

**Perfect for your hackathon demo!** 🚀
