# 🏛️ Heirloom - Digital Will on Stellar Blockchain

**Secure Your Digital Legacy with Automated Smart Contracts**

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple)](https://soroban.stellar.org)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange)](https://www.rust-lang.org)

---

## 🎯 Problem Statement

**$100+ billion in cryptocurrency is lost forever** when holders pass away without proper estate planning. Current solutions require:
- Expensive lawyers and legal fees
- Complex trust structures
- Manual execution by third parties
- Long probate court processes

**Result:** Families lose access to digital assets permanently.

---

## 💡 Our Solution

**Heirloom** is a trustless, automated "dead man's switch" smart contract on the Stellar blockchain that enables:

- ✅ **Automated inheritance** - No lawyers, no probate court
- ✅ **Trustless execution** - Code runs automatically on-chain
- ✅ **Owner control** - Withdraw anytime as emergency exit
- ✅ **Customizable periods** - Set your own check-in frequency
- ✅ **Transparent** - All transactions verifiable on blockchain

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Owner                         │
│  (Deposits assets + Regular check-ins)          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│          Heirloom Smart Contract                │
│  - Stores assets (XLM, tokens)                  │
│  - Tracks last check-in timestamp               │
│  - Enforces inactivity rules                    │
│  - Automated transfer after deadline            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│               Beneficiary                       │
│  (Claims assets after inactivity period)        │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Features

### Core Functionality

1. **Initialize Will**
   - Owner sets beneficiary address
   - Defines check-in period (e.g., 6 months)
   - Specifies token type (XLM or custom tokens)

2. **Deposit Assets**
   - Owner deposits crypto into contract
   - Assets held securely by smart contract
   - Multiple deposits supported

3. **Check-In System**
   - Owner performs periodic "I'm alive" check-ins
   - Resets inactivity timer
   - Simple, gas-efficient operation

4. **Automated Claiming**
   - After inactivity period expires
   - Beneficiary can claim all assets
   - Executed automatically by blockchain

5. **Emergency Withdrawal**
   - Owner can withdraw all funds anytime
   - Acts as "cancel will" function
   - Maintains owner sovereignty

### Security Features

- ✅ **Authorization checks** - Only owner/beneficiary can perform actions
- ✅ **Timestamp validation** - Prevents premature claims
- ✅ **Single initialization** - Cannot be re-initialized after deployment
- ✅ **Event logging** - All actions emit blockchain events
- ✅ **Audited logic** - Simple, verifiable code

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Smart Contract** | Rust + Soroban SDK |
| **Blockchain** | Stellar Network (Testnet) |
| **Frontend** | HTML/CSS/JavaScript |
| **Wallet** | Freighter Wallet Integration |
| **CLI Tools** | Stellar CLI v23.1.4 |
| **Testing** | Rust Unit Tests |

---

## 📦 Installation & Setup

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt
```

### Clone Repository

```bash
git clone https://github.com/yourusername/heirloom-contract.git
cd heirloom-contract
```

### Build Contract

```bash
stellar contract build
```

This generates: `target/wasm32v1-none/release/heirloom_contract.wasm`

### Run Tests

```bash
cargo test
```

Expected output:
```
running 6 tests
test test::test_check_in ... ok
test test::test_initialize ... ok
test test::test_deposit ... ok
test test::test_owner_withdraw ... ok
test test::test_claim_success ... ok
test test::test_claim_too_early - should panic ... ok

test result: ok. 6 passed; 0 failed
```

---

## 🎮 Usage Guide

### 1. Configure Network

```bash
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

### 2. Fund Account

```bash
stellar keys fund owner --network testnet
```

### 3. Deploy Contract

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/heirloom_contract.wasm \
  --source-account YOUR_SECRET_KEY \
  --network testnet
```

**Output:** Contract ID (save this!)

### 4. Initialize Contract

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- \
  initialize \
  --owner YOUR_PUBLIC_KEY \
  --beneficiary BENEFICIARY_PUBLIC_KEY \
  --check_in_period 15768000 \
  --token NATIVE_XLM_TOKEN_ADDRESS
```

Parameters:
- `check_in_period`: Seconds (e.g., 15768000 = 6 months)
- `token`: Use native XLM token address from testnet

### 5. Deposit Funds

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- \
  deposit \
  --from YOUR_PUBLIC_KEY \
  --amount 1000000000
```

**Note:** Amount in stroops (1 XLM = 10,000,000 stroops)

### 6. Check-In

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- \
  check_in \
  --owner YOUR_PUBLIC_KEY
```

### 7. View Contract Info

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- \
  get_info
```

### 8. Check Claim Status

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- \
  can_claim
```

### 9. Claim Assets (Beneficiary)

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- \
  claim \
  --beneficiary BENEFICIARY_PUBLIC_KEY
```

### 10. Emergency Withdrawal (Owner)

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source-account YOUR_SECRET_KEY \
  --network testnet \
  -- \
  owner_withdraw \
  --owner YOUR_PUBLIC_KEY
```

---

## 🧪 Demo Deployment

**Live Contract on Stellar Testnet:**

```
Contract ID: CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5
Network: Testnet
Status: ✅ Deployed and Tested
```

### Demo Transactions

| Action | Transaction Hash | Status |
|--------|-----------------|--------|
| Initialize | `88f0a7d0...4d9e1` | ✅ Success |
| Deposit 100 XLM | `7fdd31c8...c4ca4` | ✅ Success |
| Check-In | `6a9598b0...a3d0` | ✅ Success |
| Claim | `fb8f2e07...05dc` | ✅ Success |

View on [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5)

---

## 📊 Smart Contract Functions

### Public Functions

| Function | Description | Parameters | Auth Required |
|----------|-------------|------------|---------------|
| `initialize()` | Set up the will | owner, beneficiary, period, token | Owner |
| `deposit()` | Add assets to contract | from, amount | Owner |
| `check_in()` | Prove owner is active | owner | Owner |
| `claim()` | Beneficiary claims assets | beneficiary | Beneficiary |
| `owner_withdraw()` | Owner withdraws all funds | owner | Owner |
| `get_info()` | View contract details | - | None |
| `get_balance()` | Check contract balance | - | None |
| `can_claim()` | Check if claimable | - | None |

---

## 🎨 Frontend Demo

Open `frontend/index.html` to access the demo interface:

**Features:**
- 📋 One-click CLI command copying
- 📊 Live contract status display
- ⏱️ Real-time countdown timer
- 🎯 Step-by-step guide for judges
- 💡 Competition talking points

---

## 🧪 Testing

### Unit Tests Included

```rust
#[test]
fn test_initialize() { ... }

#[test]
fn test_deposit() { ... }

#[test]
fn test_check_in() { ... }

#[test]
fn test_claim_success() { ... }

#[test]
#[should_panic(expected = "Check-in period has not passed yet")]
fn test_claim_too_early() { ... }

#[test]
fn test_owner_withdraw() { ... }
```

All tests pass ✅

---

## 🔐 Security Considerations

### Implemented Security Measures

1. **Authorization Checks**
   ```rust
   owner.require_auth();  // Ensures caller is owner
   beneficiary.require_auth();  // Ensures caller is beneficiary
   ```

2. **Single Initialization**
   ```rust
   if env.storage().instance().has(&DataKey::IsInitialized) {
       panic!("Contract already initialized");
   }
   ```

3. **Timestamp Validation**
   ```rust
   let deadline = last_check_in + check_in_period;
   if current_time <= deadline {
       panic!("Check-in period has not passed yet");
   }
   ```

4. **Event Logging**
   - All state changes emit events
   - Provides audit trail on blockchain

### Future Security Enhancements

- [ ] Multi-signature support for large estates
- [ ] Tiered beneficiary system (primary, secondary)
- [ ] Partial unlock mechanisms
- [ ] Oracle integration for real-world death verification

---

## 🌟 Use Cases

### Personal Estate Planning
- Individual crypto holders protecting family
- Estimated 420M+ crypto users globally

### Business Continuity
- Company treasury management
- Founder succession planning

### DAO Treasuries
- Decentralized organization asset protection
- Automated fund distribution

### Trust Funds
- Generational wealth transfer
- Time-locked inheritance

---

## 📈 Market Opportunity

| Metric | Value |
|--------|-------|
| **Global Crypto Market Cap** | $2.5 Trillion |
| **Lost/Inaccessible Crypto** | $100+ Billion |
| **Crypto Users Worldwide** | 420+ Million |
| **Addressable Market** | 300M+ users need estate planning |
| **Current Solutions** | Expensive legal services ($5K-$50K) |
| **Heirloom Cost** | Near-zero (blockchain gas fees only) |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- Follow Rust style guidelines
- Add unit tests for new functions
- Update documentation
- Run `cargo fmt` before committing

---

## Contract details:

**Contract ID:** CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5
![alt text](<Screenshot 2025-11-02 151125.png>)

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Project Creator:** Abhinav Shrivastava  
**Email:** abhinavshrivastava950@gmail.com  
**GitHub:** https://github.com/abhinavshrivastava950

---

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For Soroban smart contract platform
- **Rust Community** - For excellent documentation
- **Freighter Wallet** - For Web3 wallet infrastructure
- **Risein** - For Giving me a chance to create this project

---

## 🔮 Future Scopes

### 🌐 Smart Contract Enhancements
- **Multiple beneficiaries with percentage splits** for flexible inheritance distribution.  
- **Support for NFTs and multiple token types**, enabling diverse digital asset management.  
- **Graduated vesting (partial releases over time)** to allow staged asset transfer.  
- **Conditional logic (e.g., release on specific dates or events)** for customizable will execution.  
- **Guardian system (requires N of M approvals)** for enhanced security and consensus.

---

### 📱 User Experience Improvements
- **Mobile application with biometric or facial recognition check-ins.**  
- **Email/SMS reminder system** to notify owners before inactivity deadlines.  
- **Integration with hardware wallets** for improved safety of private keys.  
- **Real-time dashboard** for monitoring check-ins, deadlines, and asset summaries.

---

### 🔏 Legal & Compliance Integration
- **Encrypted legal document storage** (e.g., will copies, identity proofs).  
- **Integration with traditional estate planning services** for hybrid digital–legal solutions.  
- **Compliance support (KYC/AML)** to align with regulatory frameworks.  
- **Professional service marketplace** for verified lawyers and executors.

---

### 🌉 Cross-Chain & Interoperability
- **Cross-chain compatibility** with Ethereum, Polygon, and other major networks.  
- **Oracle integration** for real-world event verification (e.g., certified death notices).  
- **Interoperable APIs** for institutions, DAOs, and fintech services.

---

**⭐ Star this repo if you found it useful!**

**🚀 Deploy your own Heirloom contract today and secure your digital legacy!**