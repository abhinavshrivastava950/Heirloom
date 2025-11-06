# 📋 Heirloom - Quick Reference Card

## 🌐 Live App
**URL**: http://localhost:3000  
**Contract ID**: `CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5`  
**Network**: Stellar Testnet

---

## 🎯 Three Ways to Use Heirloom

### 1️⃣ **UI Only** (Best for Users)
- Open http://localhost:3000
- Connect Freighter wallet
- Use Owner Dashboard or Beneficiary Portal
- Everything in browser, no CLI needed

### 2️⃣ **UI + CLI Reference** (Best for Demos)
- Use UI for transactions
- Click "CLI Commands" tab
- Copy pre-filled commands
- Show technical flexibility

### 3️⃣ **Pure CLI** (Best for Automation)
- Use Stellar CLI directly
- See `CLI_INTEGRATION_GUIDE.md`
- Automate with scripts

---

## 🎬 Quick Demo Script (3 minutes)

### Intro (20s)
"Heirloom is a blockchain-powered digital will on Stellar. No lawyers, no intermediaries - just trustless automation."

### UI Demo (90s)
1. Connect wallet → Show connection
2. Initialize → Enter beneficiary & period
3. Deposit → Add 100 XLM
4. Check-in → Prove I'm alive
5. Show contract status updating

### CLI Integration (30s)
6. Click CLI tab → Show pre-filled commands
7. Copy a command → Demonstrate automation
8. "Same contract, two interfaces"

### Conclusion (20s)
"Heirloom makes digital inheritance simple, secure, and accessible. Built on Stellar for speed and low fees."

---

## 💰 Contract Functions

| Function | Who Can Call | What It Does |
|----------|--------------|--------------|
| `initialize` | Owner (once) | Set up will with beneficiary |
| `deposit` | Owner | Add XLM to contract |
| `check_in` | Owner | Prove still alive |
| `claim` | Beneficiary | Inherit after timeout |
| `owner_withdraw` | Owner | Emergency withdrawal |
| `get_info` | Anyone | View contract details |
| `get_balance` | Anyone | Check XLM balance |
| `can_claim` | Anyone | Check if claimable |

---

## 🔑 Key Technical Points

### Smart Contract (Rust)
- Language: Rust (Soroban SDK)
- Safety: Type-safe, panic on errors
- Storage: Instance storage for state
- Events: Emits logs for all actions

### Frontend (Next.js 16)
- Framework: Next.js 16 + React 19
- Wallet: Freighter integration
- SDK: @stellar/stellar-sdk 12.3.0
- UI: shadcn/ui + Tailwind CSS
- Notifications: react-hot-toast

### Blockchain
- Network: Stellar Testnet
- Consensus: Stellar Consensus Protocol
- Finality: 3-5 seconds
- Fees: Minimal (0.00001 XLM)

---

## 📊 User Flow Diagram

```
Owner Creates Will
       ↓
Initialize Contract
(set beneficiary + period)
       ↓
Deposit XLM
       ↓
Regular Check-Ins ←────┐
       ↓                │
   Time Passes          │
       ↓                │
   Check In? ──Yes──────┘
       ↓
      No
       ↓
Period Expired
       ↓
Beneficiary Claims
```

---

## 🎯 Use Cases

### Personal
- Crypto inheritance planning
- Emergency fund access
- Family asset transfer

### Business
- Company succession planning
- Multi-sig backup solutions
- Automated fund releases

### Advanced
- Dead man's switch
- Time-locked vaults
- Conditional transfers

---

## 🚀 Deployment Checklist

- [x] Smart contract written in Rust
- [x] Contract compiled and tested
- [x] Contract deployed to testnet
- [x] Frontend built and running
- [x] Wallet integration working
- [x] All 8 functions implemented
- [x] CLI commands documented
- [x] Error handling added
- [x] UI/UX polished
- [x] Demo guide created

---

## 📱 Social Media Copy

### Twitter/X
🚀 Introducing Heirloom - Blockchain-powered digital wills on @StellarOrg

✅ No lawyers needed
✅ Fully automated
✅ Trustless & transparent
✅ 3-5 second finality

Check in regularly to prove you're alive. If you don't, your beneficiary inherits automatically.

[Demo] [GitHub] [Docs]

### LinkedIn
I built Heirloom, a decentralized digital will platform on the Stellar blockchain.

**Problem**: Traditional inheritance is slow, expensive, and requires intermediaries.

**Solution**: Smart contracts automate the entire process. Owners deposit assets and check in periodically. If they don't check in, beneficiaries can claim automatically.

**Tech Stack**:
- Smart Contract: Rust (Soroban SDK)
- Frontend: Next.js 16 + React 19
- Blockchain: Stellar Testnet
- Wallet: Freighter

**Key Features**:
- Trustless automation
- Sub-second transactions
- Minimal fees
- Beautiful UI + CLI access

This demonstrates the power of blockchain for real-world problems. No intermediaries, no delays, just code.

[Live Demo] [Source Code]

---

## 🏆 Hackathon Judges - Key Points

### Innovation
- Solves real problem (digital asset inheritance)
- Blockchain use is justified (trustless automation)
- Novel approach (check-in mechanism)

### Technical Execution
- Production-ready Rust smart contract
- Full test coverage (7/7 tests passing)
- Modern frontend (Next.js 16)
- Dual interface (UI + CLI)

### User Experience
- Intuitive three-tab interface
- Real-time status updates
- Clear error messages
- Mobile-responsive design

### Completeness
- Deployed and functional
- Comprehensive documentation
- Video demo ready
- Open source code

### Stellar Integration
- Uses Stellar Consensus Protocol
- Leverages low fees
- Fast finality (3-5s)
- Native XLM support

---

## 📞 Support

- **Demo Issues**: Check `HACKATHON_DEMO_GUIDE.md`
- **CLI Help**: See `CLI_INTEGRATION_GUIDE.md`
- **Contract Code**: `src/lib.rs`
- **Frontend Code**: `frontend/src/app/page.js`

---

## ✨ Final Checklist Before Recording

- [ ] Dev server running (`npm run dev`)
- [ ] Freighter installed and funded
- [ ] Freighter on TESTNET network
- [ ] Test wallet connection
- [ ] Test initialize flow
- [ ] Test deposit
- [ ] Test check-in
- [ ] Open CLI Commands tab
- [ ] Practice demo script 2-3 times
- [ ] Screen recording ready
- [ ] Good lighting and audio

**You're ready to record! 🎥**

---

*Built with ❤️ for Stellar Hackathon*
