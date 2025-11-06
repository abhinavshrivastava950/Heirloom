// frontend/src/app/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  setAllowed,
  requestAccess,
  signTransaction,
  getNetworkDetails
} from '@stellar/freighter-api';

// Import from @stellar/stellar-sdk v12
import * as StellarSdk from '@stellar/stellar-sdk';

const {
  SorobanRpc,
  TransactionBuilder,
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
import { Clock, CheckCircle, Wallet, User, DollarSign, Send, RefreshCw, LogIn, AlertCircle, Shield, Heart } from 'lucide-react';

// --- Stellar Network Configuration ---
const NATIVE_TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";

const server = new SorobanRpc.Server(RPC_URL);
const horizon = new Horizon.Server(HORIZON_URL);

// Default contract for demo
const DEFAULT_CONTRACT = 'CDHBPMDG6HM6755ZRITJKGLZL7A6UY24Z4QFXZQA6ZDAATK7BYAM3RE5';

export default function HeirloomPage() {
  const [tab, setTab] = useState('owner');
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Wallet State
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [network, setNetwork] = useState('');
  const [freighterDetected, setFreighterDetected] = useState(true);

  // Contract State
  const [contractId, setContractId] = useState(DEFAULT_CONTRACT);
  const [isInitialized, setIsInitialized] = useState(false);

  // Form inputs
  const [beneficiary, setBeneficiary] = useState('');
  const [checkInPeriod, setCheckInPeriod] = useState('300'); // 5 mins for demo
  const [depositAmount, setDepositAmount] = useState('');

  // Connect Wallet
  const connectWallet = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        throw new Error("Please open this application in a web browser.");
      }

      let result;
      try {
        result = await requestAccess();
      } catch (accessError) {
        throw new Error("Freighter wallet is not installed.\n\nInstall from: https://www.freighter.app/");
      }

      const pubKey = typeof result === 'string' ? result : result?.address;
      
      if (!pubKey) {
        throw new Error("Failed to get public key from Freighter.");
      }

      let networkDetails;
      try {
        networkDetails = await getNetworkDetails();
      } catch (networkError) {
        throw new Error("Failed to get network details. Please unlock Freighter.");
      }

      const networkName = networkDetails.network;
      
      if (networkName !== 'TESTNET') {
        throw new Error("Please switch Freighter to TESTNET network!");
      }

      setPublicKey(pubKey);
      setNetwork(networkName);
      setIsConnected(true);
      toast.success("🎉 Wallet connected!");
      
      // Check contract status
      await getContractStatus(pubKey);
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
    }
  }, []);

  // Get Contract Status
  const getContractStatus = useCallback(async (currentPublicKey) => {
    const keyToUse = currentPublicKey || publicKey;
    if (!keyToUse || !contractId) return;

    setLoadingStatus(true);
    
    try {
      const contract = new Contract(contractId);
      const account = await horizon.loadAccount(keyToUse);
      
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(contract.call("get_info")).setTimeout(30).build();

      const simulated = await server.simulateTransaction(tx);
      
      if (!simulated.result || simulated.error) {
        setIsInitialized(false);
        setStatus(null);
        return;
      }
      
      const result = scValToNative(simulated.result.retval);
      const [owner, beneficiaryAddr, period, lastCheckin] = result;

      const balanceTx = new TransactionBuilder(account, {
        fee: "100", 
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(contract.call("get_balance")).setTimeout(30).build();
      
      const balanceSim = await server.simulateTransaction(balanceTx);
      const balance = balanceSim.result ? scValToNative(balanceSim.result.retval) : 0;

      const data = {
        owner: owner,
        beneficiary: beneficiaryAddr,
        period: Number(period),
        lastCheckin: new Date(Number(lastCheckin) * 1000).toLocaleString(),
        balance: (Number(balance) / 10000000).toFixed(7),
      };
      
      setStatus(data);
      setIsInitialized(true);
      toast.success('Contract loaded!');
    } catch (error) {
      console.error("Status fetch error:", error);
      setIsInitialized(false);
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [publicKey, contractId]);

  // Invoke Contract
  const invokeContract = useCallback(async (functionName, args, loadingMessage) => {
    if (isSubmitting) return;
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(loadingMessage || `Processing ${functionName}...`);

    try {
      const account = await horizon.loadAccount(publicKey);
      const contract = new Contract(contractId);
      const op = contract.call(functionName, ...args);
      
      const tx = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: NETWORK_PASSPHRASE,
      }).addOperation(op).setTimeout(30).build();

      const simulated = await server.simulateTransaction(tx);

      if (!simulated.result || simulated.error) {
        const errorMsg = simulated.error ? JSON.stringify(simulated.error) : "Unknown error";
        console.error("Simulation error:", simulated.error);
        
        if (functionName === "initialize" && errorMsg.includes("already initialized")) {
          throw new Error("Contract is already initialized! You can now deposit funds.");
        }
        
        throw new Error(`Transaction failed: ${errorMsg}`);
      }

      const prepared = SorobanRpc.assembleTransaction(tx, simulated);
      const signedXdr = await signTransaction(prepared.toXDR(), { 
        networkPassphrase: NETWORK_PASSPHRASE,
        accountToSign: publicKey
      });
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

      const sendResponse = await server.sendTransaction(signedTx);
      let txResponse = await server.getTransaction(sendResponse.hash);

      let waitTries = 10;
      while (txResponse.status === 'NOT_FOUND' && waitTries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await server.getTransaction(sendResponse.hash);
        waitTries--;
      }

      if (txResponse.status === 'SUCCESS') {
        toast.dismiss(toastId);
        toast.success(`✅ ${functionName} successful!`);
        await getContractStatus(publicKey);
      } else {
        throw new Error(`Transaction failed: ${txResponse.status}`);
      }
    } catch (error) {
      console.error("Contract error:", error);
      toast.dismiss(toastId);
      toast.error(error.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [publicKey, contractId, isSubmitting, getContractStatus]);

  // Initialize Contract
  const handleInitialize = async () => {
    if (!beneficiary || !checkInPeriod) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    if (!StrKey.isValidEd25519PublicKey(beneficiary)) {
      toast.error("Invalid beneficiary address.");
      return;
    }

    const ownerArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    const beneficiaryArg = nativeToScVal(Address.fromString(beneficiary), { type: "address" });
    const periodArg = nativeToScVal(parseInt(checkInPeriod), { type: "u64" });
    const tokenArg = nativeToScVal(Address.fromString(NATIVE_TOKEN_ID), { type: "address" });

    await invokeContract("initialize", [ownerArg, beneficiaryArg, periodArg, tokenArg], "Initializing contract...");
  };

  // Deposit
  const handleDeposit = async () => {
    if (!isInitialized) {
      toast.error("Please initialize the contract first!");
      return;
    }
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    
    const amountStroops = BigInt(Math.floor(parseFloat(depositAmount) * 10**7));
    const fromArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    const amountArg = nativeToScVal(amountStroops, { type: "i128" });
    
    await invokeContract("deposit", [fromArg, amountArg], "Depositing XLM...");
  };

  // Check In
  const handleCheckIn = async () => {
    const ownerArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    await invokeContract("check_in", [ownerArg], "Checking in...");
  };

  // Withdraw
  const handleWithdraw = async () => {
    if (!confirm("Withdraw all funds?")) return;
    const ownerArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    await invokeContract("owner_withdraw", [ownerArg], "Withdrawing...");
  };

  // Claim
  const handleClaim = async () => {
    const beneficiaryArg = nativeToScVal(Address.fromString(publicKey), { type: "address" });
    await invokeContract("claim", [beneficiaryArg], "Claiming assets...");
  };

  // Auto-connect on load
  useEffect(() => {
    const checkConnection = async () => {
      setTimeout(async () => {
        try {
          if (typeof window !== 'undefined') {
            try {
              const isAllowed = await setAllowed();
              setFreighterDetected(true);
              
              if (isAllowed) {
                connectWallet();
              }
            } catch (error) {
              setFreighterDetected(false);
            }
          }
        } catch (error) {
          setFreighterDetected(false);
        }
      }, 800);
    };
    checkConnection();
  }, [connectWallet]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-16 w-16 text-purple-600 mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Heirloom
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Secure Your Digital Legacy on Stellar</p>
          <p className="text-sm text-gray-500">Blockchain-Powered Digital Will • Trustless • Transparent</p>
        </div>

        {/* Freighter Warning */}
        {!isConnected && !freighterDetected && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Freighter Wallet Required</AlertTitle>
            <AlertDescription>
              Install Freighter extension from <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">freighter.app</a> and set to TESTNET
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Connection */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="success" className="flex items-center gap-1 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    Connected to {network}
                  </Badge>
                  <p className="text-sm text-muted-foreground font-mono break-all">{publicKey}</p>
                </div>
                <Button variant="outline" onClick={() => getContractStatus(publicKey)} disabled={loadingStatus}>
                  {loadingStatus ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Button size="lg" onClick={connectWallet} className="bg-purple-600 hover:bg-purple-700">
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Freighter Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <>
            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                className={`py-3 px-6 text-lg font-medium transition ${tab === 'owner' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTab('owner')}
              >
                <User className="h-5 w-5 inline mr-2" />
                Owner Dashboard
              </button>
              <button
                className={`py-3 px-6 text-lg font-medium transition ${tab === 'beneficiary' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTab('beneficiary')}
              >
                <Heart className="h-5 w-5 inline mr-2" />
                Beneficiary Portal
              </button>
            </div>

            {/* Contract Status */}
            <Card className="mb-6 shadow-lg">
              <CardHeader>
                <CardTitle>Contract Status</CardTitle>
                <CardDescription>Contract ID: {contractId.substring(0, 12)}...{contractId.substring(contractId.length - 8)}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStatus && <p className="text-muted-foreground">Loading...</p>}
                {!loadingStatus && !isInitialized && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Contract Not Initialized</AlertTitle>
                    <AlertDescription>Initialize the contract below to get started.</AlertDescription>
                  </Alert>
                )}
                {status && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Balance</p>
                      <p className="text-2xl font-bold text-purple-600">{status.balance} XLM</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Check-in Period</p>
                      <p className="text-2xl font-bold text-blue-600">{status.period}s</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Last Check-in</p>
                      <p className="text-lg font-mono text-green-700">{status.lastCheckin}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Tab */}
            {tab === 'owner' && (
              <div className="space-y-6">
                {!isInitialized && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>
                        <LogIn className="h-5 w-5 inline mr-2" />
                        Step 1: Initialize Your Will
                      </CardTitle>
                      <CardDescription>Set up your digital will with a beneficiary</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="beneficiary">Beneficiary Address</Label>
                        <Input 
                          id="beneficiary" 
                          placeholder="GXXXXXXX..." 
                          value={beneficiary} 
                          onChange={(e) => setBeneficiary(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground mt-1">Who inherits if you don't check in</p>
                      </div>
                      <div>
                        <Label htmlFor="period">Check-In Period (seconds)</Label>
                        <Input 
                          id="period" 
                          type="number" 
                          value={checkInPeriod} 
                          onChange={(e) => setCheckInPeriod(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground mt-1">300s = 5 min (demo), 86400s = 1 day</p>
                      </div>
                      <Button onClick={handleInitialize} disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700">
                        <LogIn className="h-4 w-4 mr-2" />
                        Initialize Contract
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {isInitialized && (
                  <>
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle>
                          <DollarSign className="h-5 w-5 inline mr-2" />
                          Deposit Funds
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="deposit">Amount (XLM)</Label>
                          <Input 
                            id="deposit" 
                            type="number" 
                            placeholder="100" 
                            value={depositAmount} 
                            onChange={(e) => setDepositAmount(e.target.value)} 
                          />
                        </div>
                        <Button onClick={handleDeposit} disabled={isSubmitting} className="w-full">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Deposit XLM
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle>
                          <CheckCircle className="h-5 w-5 inline mr-2" />
                          Prove You're Alive
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Check in regularly to prevent beneficiary claim
                        </p>
                        <Button onClick={handleCheckIn} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check-In Now
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle>Emergency Withdrawal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={handleWithdraw} disabled={isSubmitting} variant="destructive" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Withdraw All Funds
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Beneficiary Tab */}
            {tab === 'beneficiary' && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>
                    <Heart className="h-5 w-5 inline mr-2" />
                    Claim Inheritance
                  </CardTitle>
                  <CardDescription>Available if owner hasn't checked in</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>For Beneficiaries</AlertTitle>
                    <AlertDescription>
                      You can claim if the check-in period has expired
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleClaim} disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Claim All Assets
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
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
  const [freighterDetected, setFreighterDetected] = useState(true); // Assume true initially to avoid hydration mismatch

  // Form inputs
  const [beneficiary, setBeneficiary] = useState('');
  const [checkInPeriod, setCheckInPeriod] = useState('300'); // 5 mins for testing
  const [depositAmount, setDepositAmount] = useState('');

  // --- Wallet Connection ---
  const connectWallet = useCallback(async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error("Please open this application in a web browser.");
      }

      // Try to directly call requestAccess without checking window.freighter
      // The Freighter API should work even if window.freighter is undefined
      let result;
      try {
        // Request access - in v5, this returns an object {address: "G..."}
        result = await requestAccess();
      } catch (accessError) {
        // If requestAccess fails, Freighter is truly not installed
        console.error("Request access error:", accessError);
        throw new Error("Freighter wallet is not installed or not accessible.\n\nPlease:\n1. Install Freighter from https://www.freighter.app/\n2. Refresh the page after installation\n3. Make sure you're using Chrome/Brave/Edge\n4. Check that the extension is enabled in chrome://extensions/");
      }

      // Extract the public key from the result
      const pubKey = typeof result === 'string' ? result : result?.address;
      
      if (!pubKey) {
        throw new Error("Failed to get public key from Freighter. Please approve the connection request.");
      }

      // Get network details
      let networkDetails;
      try {
        networkDetails = await getNetworkDetails();
      } catch (networkError) {
        console.error("Network details error:", networkError);
        throw new Error("Failed to get network details. Please make sure Freighter is unlocked.");
      }

      const network = networkDetails.network;
      
      if (network !== 'TESTNET') {
        throw new Error("Please switch Freighter to TESTNET network!");
      }

      setPublicKey(pubKey);
      setNetwork(network);
      setIsConnected(true);
      toast.success("Wallet connected successfully!");
      getContractStatus(pubKey); // Fetch status immediately after connect
    } catch (error) {
      console.error("Wallet connection error:", error);
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
      if (!simulated.result || simulated.error) {
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

      if (!simulated.result || simulated.error) {
        const errorMsg = simulated.error ? JSON.stringify(simulated.error) : "Unknown error";
        
        // Check if it's a contract not initialized error
        if (errorMsg.includes("UnreachableCodeReached") || errorMsg.includes("InvalidAction")) {
          throw new Error("Contract not initialized. Please initialize the contract first before making deposits.");
        }
        
        throw new Error("Transaction simulation failed: " + errorMsg);
      }

      const prepared = SorobanRpc.assembleTransaction(tx, simulated);
      const signedXdr = await signTransaction(prepared.toXDR(), { 
        networkPassphrase: NETWORK_PASSPHRASE,
        accountToSign: publicKey
      });
      const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

      const sendResponse = await server.sendTransaction(signedTx);
      let txResponse = await server.getTransaction(sendResponse.hash);

      let waitTries = 10;
      while (txResponse.status === 'NOT_FOUND' && waitTries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        txResponse = await server.getTransaction(sendResponse.hash);
        waitTries--;
      }

      if (txResponse.status === 'SUCCESS') {
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
    const tokenArg = nativeToScVal(Address.fromString(NATIVE_TOKEN_ID), { type: "address" });

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
        try {
          if (typeof window !== 'undefined') {
            // Try to check if already allowed using setAllowed
            try {
              const isAllowed = await setAllowed();
              setFreighterDetected(true); // If setAllowed works, Freighter is installed
              
              if (isAllowed) {
                connectWallet();
              }
            } catch (error) {
              // If setAllowed throws, Freighter might not be installed
              console.log("Freighter detection error:", error);
              setFreighterDetected(false);
            }
          }
        } catch (error) {
          console.log("Freighter check error:", error);
          setFreighterDetected(false);
        }
      }, 800); // Increased timeout to give extension more time to load
    };
    checkConnection();
  }, [connectWallet]);
  
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary">🏛️ Heirloom Digital Will</h1>
        <p className="text-xl text-muted-foreground">Secure your legacy on the Stellar blockchain.</p>
      </div>

      {!isConnected && !freighterDetected && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Freighter Extension Required</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>To use this application, you need to:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Install the Freighter wallet extension from <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">freighter.app</a></li>
                <li>Open this application in Chrome, Brave, or Edge browser (not in VS Code)</li>
                <li>Make sure Freighter is set to <strong>TESTNET</strong> network</li>
                <li>Have a funded testnet account</li>
              </ol>
              <p className="mt-2 text-sm">Current URL: <code className="bg-muted px-1 py-0.5 rounded">http://localhost:3000</code></p>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
              {!loadingStatus && !status && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Contract Not Initialized</AlertTitle>
                  <AlertDescription>
                    Please initialize the contract first by filling in the beneficiary address and check-in period below, then clicking "Initialize".
                  </AlertDescription>
                </Alert>
              )}
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
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Owner:</strong> Your connected wallet ({publicKey?.slice(0, 8)}...)
                    <br />
                    <strong>Beneficiary:</strong> Enter a different Stellar address below who will inherit the assets.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="beneficiary">Beneficiary Address (starts with G)</Label>
                  <Input id="beneficiary" placeholder="GXXXXXXX..." value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} disabled={isSubmitting || !!status} />
                  <p className="text-xs text-muted-foreground mt-1">This is the person who will inherit your assets if you don't check in.</p>
                </div>
                <div>
                  <Label htmlFor="period">Check-In Period (seconds)</Label>
                  <Input id="period" type="number" value={checkInPeriod} onChange={(e) => setCheckInPeriod(e.target.value)} disabled={isSubmitting || !!status} />
                  <p className="text-xs text-muted-foreground mt-1">Default: 300 seconds (5 minutes for testing). Use 86400 for 1 day, 604800 for 1 week.</p>
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