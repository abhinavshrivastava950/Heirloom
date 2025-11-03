// frontend/src/app/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as FreighterApi from '@stellar/freighter-api';

// Import from @stellar/stellar-sdk v13
import * as StellarSdk from '@stellar/stellar-sdk';

const {
  SorobanRpc,
  TransactionBuilder,
  xdr,
  Networks,
  Contract,
  Horizon,
  StrKey,
  scValToNative,
  nativeToScVal,
  Address
} = StellarSdk;

// Import our UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Wallet, User, DollarSign, Send, RefreshCw, LogIn, AlertCircle } from 'lucide-react';

// --- Heirloom Contract Configuration ---
const HEIRLOOM_CONTRACT_ID = 'CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5';
const NATIVE_TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // Native XLM Token on Testnet
const NETWORK_PASSPHRASE = Networks.TESTNET;
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

// Initialize servers
const server = new SorobanRpc.Server(RPC_URL);
const horizon = new Horizon.Server(HORIZON_URL);
// ----------------------------------------

export default function HeirloomPage() {
  const [tab, setTab] = useState('owner');
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Wallet State
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [network, setNetwork] = useState('');

  // Form inputs
  const [beneficiary, setBeneficiary] = useState('');
  const [checkInPeriod, setCheckInPeriod] = useState('300'); // 5 mins for testing
  const [depositAmount, setDepositAmount] = useState('');

  // --- Wallet Connection ---
  const connectWallet = useCallback(async () => {
    try {
      const isInstalled = await FreighterApi.isInstalled();
      if (!isInstalled) {
        throw new Error("Freighter wallet not found. Please install it.");
      }

      await FreighterApi.requestAccess();
      const pubKey = await FreighterApi.getPublicKey();
      if (!pubKey) {
        throw new Error("Wallet connection failed. Please unlock Freighter.");
      }

      const net = await FreighterApi.getNetwork();
      if (net !== 'TESTNET') {
        throw new Error("Please switch Freighter to TESTNET!");
      }

      setPublicKey(pubKey);
      setNetwork(net);
      setIsConnected(true);
      toast.success("Wallet connected!");
      getContractStatus(pubKey); // Fetch status immediately after connect
    } catch (error) {
      toast.error(error.message || "An unknown error occurred.");
    }
  }, []); // Add empty dependency array

  // --- Contract Interaction Helpers ---

  // Read-only function
  const getContractStatus = useCallback(async (currentPublicKey) => {
    const keyToUse = currentPublicKey || publicKey;
    if (!keyToUse) return; // Don't fetch if no key

    setLoadingStatus(true);
    const toastId = toast.loading('Fetching contract status...');
    
    try {
      const contract = new Contract(HEIRLOOM_CONTRACT_ID);
      // Use a real account for simulation
      const account = await horizon.loadAccount(keyToUse);
      
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(contract.call("get_info")).setTimeout(30).build();

      const simulated = await server.simulateTransaction(tx);
      if (SorobanRpc.isSimulationError(simulated) || !simulated.result) {
        throw new Error('Contract not initialized.');
      }
      
      const result = scValToNative(simulated.result.retval);
      const [owner, beneficiary, period, lastCheckin] = result;

      const balanceTx = new TransactionBuilder(account, {
        fee: "100", 
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(contract.call("get_balance")).setTimeout(30).build();
      
      const balanceSim = await server.simulateTransaction(balanceTx);
      const balance = scValToNative(balanceSim.result.retval);

      const data = {
        owner: owner,
        beneficiary: beneficiary,
        period: Number(period),
        lastCheckin: new Date(Number(lastCheckin) * 1000).toLocaleString(),
        balance: (Number(balance) / 10000000).toFixed(7),
      };
      setStatus(data);
      toast.dismiss(toastId);
      toast.success('Contract status updated!');
    } catch (error) {
      console.error("Status fetch error:", error);
      toast.dismiss(toastId);
      toast.error(error.message.includes('Contract not initialized') ? 'Contract is not initialized.' : 'Failed to fetch status.');
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [publicKey]);

  // Write function
  const invokeContract = useCallback(async (functionName, args, loadingMessage) => {
    if (isSubmitting) return;
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(loadingMessage || `Submitting ${functionName}...`);

    try {
      const account = await horizon.loadAccount(publicKey);
      const contract = new Contract(HEIRLOOM_CONTRACT_ID);
      const op = contract.call(functionName, ...args);
      
      const tx = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(op).setTimeout(30).build();

      const simulated = await server.simulateTransaction(tx);

      if (SorobanRpc.isSimulationError(simulated)) {
        throw new Error("Transaction simulation failed: " + (simulated.error || "Unknown error"));
      }

      const prepared = SorobanRpc.assembleTransaction(tx, simulated);
      const signedXdr = await FreighterApi.signTransaction(prepared.toXDR(), { network: "TESTNET" });
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

      const sendResponse = await server.sendTransaction(signedTx);
      let txResponse = await server.getTransaction(sendResponse.hash);

      let waitTries = 10;
      while (txResponse.status === SorobanRpc.GetTransactionStatus.NOT_FOUND && waitTries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await server.getTransaction(sendResponse.hash);
        waitTries--;
      }

      if (txResponse.status === SorobanRpc.GetTransactionStatus.SUCCESS) {
        toast.dismiss(toastId);
        toast.success("Transaction successful!");
        await getContractStatus(publicKey);
      } else {
        throw new Error(`Transaction failed: ${txResponse.status}`);
      }
    } catch (error) {
      console.error("Contract Invocation Error:", error);
      toast.dismiss(toastId);
      toast.error(error.message || "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }, [publicKey, isSubmitting, getContractStatus]);

  // --- UI Event Handlers ---
  const handleInitialize = async () => {
    if (!beneficiary || !checkInPeriod) {
      toast.error("Please fill in all fields."); return;
    }
    if (!StrKey.isValidEd25519PublicKey(beneficiary)) {
      toast.error("Invalid Beneficiary Address."); return;
    }

    const ownerArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    const beneficiaryArg = nativeToScVal(Address.fromString(beneficiary), { type: "address" });
    const periodArg = nativeToScVal(parseInt(checkInPeriod), { type: "u64" });
    const tokenArg = nativeToScVal(Address.contract(Buffer.from(NATIVE_TOKEN_ID, 'hex')), { type: "address" });

    await invokeContract("initialize", [ownerArg, beneficiaryArg, periodArg, tokenArg], "Initializing...");
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount."); return;
    }
    const amountStroops = BigInt(Math.floor(parseFloat(depositAmount) * 10**7));

    const fromArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    const amountArg = nativeToScVal(amountStroops, { type: "i128" });
    
    await invokeContract("deposit", [fromArg, amountArg], "Submitting deposit...");
  };

  const handleCheckIn = async () => {
    const ownerArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    await invokeContract("check_in", [ownerArg], "Submitting check-in...");
  };

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw all funds?")) return;
    const ownerArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    await invokeContract("owner_withdraw", [ownerArg], "Withdrawing all funds...");
  };

  const handleClaim = async () => {
    const beneficiaryArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    await invokeContract("claim", [beneficiaryArg], "Attempting to claim assets...");
  };

  // Check connection on page load
  useEffect(() => {
    const checkConnection = async () => {
      // Give Freighter a moment to inject itself
      setTimeout(async () => {
        const connected = await FreighterApi.isConnected();
        if (connected) {
          connectWallet();
        }
      }, 500);
    };
    checkConnection();
  }, [connectWallet]);
  
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary">🏛️ Heirloom Digital Will</h1>
        <p className="text-xl text-muted-foreground">Secure your legacy on the Stellar blockchain.</p>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Wallet Connection</CardTitle></CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Wallet Connected ({network})
                </Badge>
                <p className="text-sm text-muted-foreground font-mono mt-2 break-all">{publicKey}</p>
              </div>
              <Button variant="outline" onClick={() => getContractStatus(publicKey)} disabled={loadingStatus}>
                {loadingStatus ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Refresh Status"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg font-medium">Please connect your wallet to interact.</p>
              <Button size="lg" onClick={connectWallet}>
                <Wallet className="h-5 w-5 mr-2" />
                Connect Freighter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isConnected && (
        <>
          <div className="flex border-b mb-6">
            <button
              className={`py-2 px-4 text-lg font-medium ${tab === 'owner' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              onClick={() => setTab('owner')}
            >
              Owner Dashboard
            </button>
            <button
              className={`py-2 px-4 text-lg font-medium ${tab === 'beneficiary' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              onClick={() => setTab('beneficiary')}
            >
              Beneficiary Portal
            </button>
          </div>
          
          <Card className="mb-6">
            <CardHeader><CardTitle>Contract Status</CardTitle></CardHeader>
            <CardContent>
              {loadingStatus && <p>Loading status...</p>}
              {!loadingStatus && !status && <p>Contract not yet initialized.</p>}
              {status && (
                <div className="space-y-2 font-mono text-sm">
                  <p><strong>Balance:</strong> {status.balance} XLM</p>
                  <p><strong>Owner:</strong> {status.owner}</p>
                  <p><strong>Beneficiary:</strong> {status.beneficiary}</p>
                  <p><strong>Last Check-In:</strong> {status.lastCheckin}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className={`space-y-6 ${tab !== 'owner' ? 'block' : 'hidden'}`}>
            <Card>
              <CardHeader>
                <CardTitle>Claim Inheritance</CardTitle>
                <CardDescription>If the owner's check-in period has expired, you can claim the assets here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="info" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>For Beneficiaries</AlertTitle>
                  <AlertDescription>
                    This action will only succeed if you are the designated beneficiary AND the inactivity period has passed.
                  </AlertDescription>
                </Alert>
                <Button size="lg" onClick={handleClaim} disabled={isSubmitting || !status}>
                  <DollarSign className="h-5 w-5 mr-2" /> Claim All Assets
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className={`space-y-6 ${tab !== 'owner' ? 'hidden' : 'block'}`}>
            <Card>
              <CardHeader>
                <CardTitle>1. Initialize Contract (One-time setup)</CardTitle>
                <CardDescription>Set the owner, beneficiary, and check-in period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="beneficiary">Beneficiary Address</Label>
                  <Input id="beneficiary" placeholder="G..." value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} disabled={isSubmitting || !!status} />
                </div>
                <div>
                  <Label htmlFor="period">Check-In Period (seconds)</Label>
                  <Input id="period" type="number" value={checkInPeriod} onChange={(e) => setCheckInPeriod(e.target.value)} disabled={isSubmitting || !!status} />
                </div>
                <Button onClick={handleInitialize} disabled={isSubmitting || !!status}>
                  <LogIn className="h-4 w-4 mr-2" /> Initialize
                </Button>
                {!!status && <p className="text-sm text-green-600">Contract is already initialized.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>2. Deposit Funds</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deposit">Amount (XLM)</Label>
                  <Input id="deposit" type="number" placeholder="100" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} disabled={isSubmitting || !status} />
                </div>
                <Button onClick={handleDeposit} disabled={isSubmitting || !status}>
                  <DollarSign className="h-4 w-4 mr-2" /> Deposit
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>3. Check-In (I'm Alive)</CardTitle></CardHeader>
              <CardContent>
                <Button onClick={handleCheckIn} disabled={isSubmitting || !status}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Check-In Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Emergency Withdrawal</CardTitle></CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleWithdraw} disabled={isSubmitting || !status}>
                  <Send className="h-4 w-4 mr-2" /> Withdraw All
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}