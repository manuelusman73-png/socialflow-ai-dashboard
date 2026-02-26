# Stellar SDK Usage Guide

## Overview

Complete guide for integrating Stellar blockchain functionality into SocialFlow using the official Stellar SDK.

---

## Table of Contents

1. [Installation](#installation)
2. [Network Configuration](#network-configuration)
3. [Account Operations](#account-operations)
4. [Asset Management](#asset-management)
5. [Payments & Transfers](#payments--transfers)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)

---

## Installation

```bash
npm install @stellar/stellar-sdk
```

### TypeScript Support

The Stellar SDK includes TypeScript definitions out of the box.

```typescript
import * as StellarSdk from '@stellar/stellar-sdk';
```

---

## Network Configuration

### Initialize Server Connection

```typescript
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Stellar network configuration
 */
export enum StellarNetwork {
  PUBLIC = 'PUBLIC',
  TESTNET = 'TESTNET'
}

/**
 * Creates a Horizon server instance
 * @param {StellarNetwork} network - Target network
 * @returns {StellarSdk.Horizon.Server} Configured server instance
 */
export function createServer(network: StellarNetwork): StellarSdk.Horizon.Server {
  const serverUrl = network === StellarNetwork.PUBLIC
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
  
  return new StellarSdk.Horizon.Server(serverUrl);
}

/**
 * Gets network passphrase for transaction building
 * @param {StellarNetwork} network - Target network
 * @returns {string} Network passphrase
 */
export function getNetworkPassphrase(network: StellarNetwork): string {
  return network === StellarNetwork.PUBLIC
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;
}
```

### Example Usage

```typescript
const server = createServer(StellarNetwork.TESTNET);
const networkPassphrase = getNetworkPassphrase(StellarNetwork.TESTNET);
```

---

## Account Operations

### Load Account

```typescript
/**
 * Loads account details from the network
 * @param {string} publicKey - Account public key
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<StellarSdk.Horizon.AccountResponse>} Account details
 * @throws {Error} If account doesn't exist
 */
export async function loadAccount(
  publicKey: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<StellarSdk.Horizon.AccountResponse> {
  const server = createServer(network);
  
  try {
    return await server.loadAccount(publicKey);
  } catch (error) {
    throw new Error(`Account ${publicKey} not found on ${network}`);
  }
}
```

### Get Account Balances

```typescript
/**
 * Retrieves all balances for an account
 * @param {string} publicKey - Account public key
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<Balance[]>} Array of account balances
 */
export interface Balance {
  asset: string;
  balance: string;
  limit?: string;
}

export async function getAccountBalances(
  publicKey: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<Balance[]> {
  const account = await loadAccount(publicKey, network);
  
  return account.balances.map(balance => ({
    asset: balance.asset_type === 'native' 
      ? 'XLM' 
      : `${balance.asset_code}:${balance.asset_issuer}`,
    balance: balance.balance,
    limit: 'limit' in balance ? balance.limit : undefined
  }));
}
```

### Example

```typescript
// Load account
const account = await loadAccount('GACCOUNT...');
console.log('Sequence:', account.sequence);

// Get balances
const balances = await getAccountBalances('GACCOUNT...');
balances.forEach(b => {
  console.log(`${b.asset}: ${b.balance}`);
});
```

---

## Asset Management

### Create Custom Asset

```typescript
/**
 * Creates a custom Stellar asset
 * @param {string} code - Asset code (1-12 characters)
 * @param {string} issuer - Issuer public key
 * @returns {StellarSdk.Asset} Asset instance
 */
export function createAsset(code: string, issuer: string): StellarSdk.Asset {
  if (code === 'XLM') {
    return StellarSdk.Asset.native();
  }
  return new StellarSdk.Asset(code, issuer);
}
```

### Establish Trustline

```typescript
/**
 * Creates a trustline to an asset
 * @param {string} accountKey - Account public key
 * @param {StellarSdk.Asset} asset - Asset to trust
 * @param {string} limit - Trust limit (optional, defaults to max)
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<string>} Transaction XDR for signing
 */
export async function createTrustline(
  accountKey: string,
  asset: StellarSdk.Asset,
  limit?: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<string> {
  const server = createServer(network);
  const account = await server.loadAccount(accountKey);
  
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: getNetworkPassphrase(network)
  })
    .addOperation(StellarSdk.Operation.changeTrust({
      asset,
      limit: limit || '922337203685.4775807' // Max limit
    }))
    .setTimeout(180)
    .build();
  
  return transaction.toXDR();
}
```

### Issue Custom Asset

```typescript
/**
 * Issues a custom asset to a distribution account
 * @param {string} issuerKey - Issuer account public key
 * @param {string} distributorKey - Distribution account public key
 * @param {string} assetCode - Asset code
 * @param {string} amount - Amount to issue
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<string>} Transaction XDR for signing
 */
export async function issueAsset(
  issuerKey: string,
  distributorKey: string,
  assetCode: string,
  amount: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<string> {
  const server = createServer(network);
  const issuerAccount = await server.loadAccount(issuerKey);
  const asset = new StellarSdk.Asset(assetCode, issuerKey);
  
  const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: getNetworkPassphrase(network)
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: distributorKey,
      asset,
      amount
    }))
    .setTimeout(180)
    .build();
  
  return transaction.toXDR();
}
```

### Complete Asset Creation Flow

```typescript
/**
 * Complete flow for creating and distributing a custom asset
 */
async function createBrandToken() {
  const network = StellarNetwork.TESTNET;
  
  // 1. Define asset
  const assetCode = 'BRAND';
  const issuerPublicKey = 'GISSUER...';
  const distributorPublicKey = 'GDISTRIBUTOR...';
  
  // 2. Create trustline (distributor trusts issuer)
  const trustlineXdr = await createTrustline(
    distributorPublicKey,
    createAsset(assetCode, issuerPublicKey),
    '1000000',
    network
  );
  
  // Sign and submit trustline transaction
  const signedTrustline = await signTransaction(trustlineXdr);
  await submitTransaction(signedTrustline, network);
  
  // 3. Issue tokens
  const issueXdr = await issueAsset(
    issuerPublicKey,
    distributorPublicKey,
    assetCode,
    '1000000',
    network
  );
  
  // Sign and submit issuance transaction
  const signedIssuance = await signTransaction(issueXdr);
  await submitTransaction(signedIssuance, network);
  
  console.log('Asset created and distributed successfully!');
}
```

---

## Payments & Transfers

### Simple Payment

```typescript
/**
 * Creates a payment transaction
 * @param {string} sourceKey - Source account public key
 * @param {string} destinationKey - Destination account public key
 * @param {StellarSdk.Asset} asset - Asset to send
 * @param {string} amount - Amount to send
 * @param {string} memo - Optional memo
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<string>} Transaction XDR for signing
 */
export async function createPayment(
  sourceKey: string,
  destinationKey: string,
  asset: StellarSdk.Asset,
  amount: string,
  memo?: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<string> {
  const server = createServer(network);
  const sourceAccount = await server.loadAccount(sourceKey);
  
  const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: getNetworkPassphrase(network)
  });
  
  // Add memo if provided
  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo));
  }
  
  const transaction = txBuilder
    .addOperation(StellarSdk.Operation.payment({
      destination: destinationKey,
      asset,
      amount
    }))
    .setTimeout(180)
    .build();
  
  return transaction.toXDR();
}
```

### Batch Payments

```typescript
/**
 * Creates a transaction with multiple payments
 * @param {string} sourceKey - Source account public key
 * @param {PaymentDetails[]} payments - Array of payment details
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<string>} Transaction XDR for signing
 */
export interface PaymentDetails {
  destination: string;
  asset: StellarSdk.Asset;
  amount: string;
}

export async function createBatchPayments(
  sourceKey: string,
  payments: PaymentDetails[],
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<string> {
  const server = createServer(network);
  const sourceAccount = await server.loadAccount(sourceKey);
  
  let txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: (StellarSdk.BASE_FEE * payments.length).toString(),
    networkPassphrase: getNetworkPassphrase(network)
  });
  
  // Add all payment operations
  payments.forEach(payment => {
    txBuilder = txBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination: payment.destination,
        asset: payment.asset,
        amount: payment.amount
      })
    );
  });
  
  const transaction = txBuilder.setTimeout(180).build();
  return transaction.toXDR();
}
```

### Path Payment

```typescript
/**
 * Creates a path payment (automatic currency conversion)
 * @param {string} sourceKey - Source account public key
 * @param {string} destinationKey - Destination account public key
 * @param {StellarSdk.Asset} sendAsset - Asset to send
 * @param {string} sendMax - Maximum amount to send
 * @param {StellarSdk.Asset} destAsset - Asset to receive
 * @param {string} destAmount - Amount to receive
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<string>} Transaction XDR for signing
 */
export async function createPathPayment(
  sourceKey: string,
  destinationKey: string,
  sendAsset: StellarSdk.Asset,
  sendMax: string,
  destAsset: StellarSdk.Asset,
  destAmount: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<string> {
  const server = createServer(network);
  const sourceAccount = await server.loadAccount(sourceKey);
  
  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: getNetworkPassphrase(network)
  })
    .addOperation(StellarSdk.Operation.pathPaymentStrictReceive({
      sendAsset,
      sendMax,
      destination: destinationKey,
      destAsset,
      destAmount,
      path: [] // Stellar will find the best path
    }))
    .setTimeout(180)
    .build();
  
  return transaction.toXDR();
}
```

### Example: Send Tip

```typescript
/**
 * Sends a tip to a content creator
 */
async function sendTip(
  fromAccount: string,
  toCreator: string,
  amount: string
) {
  try {
    // Create payment transaction
    const xdr = await createPayment(
      fromAccount,
      toCreator,
      StellarSdk.Asset.native(), // XLM
      amount,
      'Tip for great content! 🎉',
      StellarNetwork.TESTNET
    );
    
    // Sign with wallet
    const signedXdr = await signWithWallet(xdr);
    
    // Submit transaction
    const result = await submitTransaction(signedXdr, StellarNetwork.TESTNET);
    
    console.log('Tip sent!', result.hash);
    return result;
  } catch (error) {
    console.error('Failed to send tip:', error);
    throw error;
  }
}
```

---

## Advanced Features

### Transaction Submission

```typescript
/**
 * Submits a signed transaction to the network
 * @param {string} signedXdr - Signed transaction XDR
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse>}
 */
export async function submitTransaction(
  signedXdr: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse> {
  const server = createServer(network);
  const transaction = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    getNetworkPassphrase(network)
  );
  
  try {
    return await server.submitTransaction(transaction as StellarSdk.Transaction);
  } catch (error: any) {
    // Parse Horizon error
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      throw new Error(`Transaction failed: ${JSON.stringify(codes)}`);
    }
    throw error;
  }
}
```

### Stream Account Activity

```typescript
/**
 * Streams real-time account activity
 * @param {string} publicKey - Account to monitor
 * @param {Function} onPayment - Callback for payment events
 * @param {StellarNetwork} network - Target network
 * @returns {Function} Cleanup function to stop streaming
 */
export function streamAccountPayments(
  publicKey: string,
  onPayment: (payment: any) => void,
  network: StellarNetwork = StellarNetwork.TESTNET
): () => void {
  const server = createServer(network);
  
  const closeStream = server
    .payments()
    .forAccount(publicKey)
    .cursor('now')
    .stream({
      onmessage: (payment) => {
        onPayment(payment);
      },
      onerror: (error) => {
        console.error('Stream error:', error);
      }
    });
  
  return closeStream;
}
```

### Example: Real-time Tip Notifications

```typescript
/**
 * Monitors account for incoming tips
 */
function monitorTips(accountKey: string) {
  const stopStream = streamAccountPayments(
    accountKey,
    async (payment) => {
      if (payment.type === 'payment' && payment.to === accountKey) {
        // Incoming payment detected
        const amount = payment.amount;
        const from = payment.from;
        
        // Show notification
        showNotification({
          title: 'New Tip Received! 🎉',
          message: `${amount} XLM from ${from}`,
          type: 'success'
        });
        
        // Update UI
        await refreshBalance();
      }
    },
    StellarNetwork.TESTNET
  );
  
  // Cleanup on component unmount
  return stopStream;
}
```

### Fee Bump Transaction

```typescript
/**
 * Creates a fee bump transaction to speed up a stuck transaction
 * @param {string} innerTxXdr - Original transaction XDR
 * @param {string} feeSourceKey - Account paying the additional fee
 * @param {string} newFee - New total fee
 * @param {StellarNetwork} network - Target network
 * @returns {Promise<string>} Fee bump transaction XDR
 */
export async function createFeeBump(
  innerTxXdr: string,
  feeSourceKey: string,
  newFee: string,
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<string> {
  const innerTx = StellarSdk.TransactionBuilder.fromXDR(
    innerTxXdr,
    getNetworkPassphrase(network)
  ) as StellarSdk.Transaction;
  
  const feeBumpTx = StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
    feeSourceKey,
    newFee,
    innerTx,
    getNetworkPassphrase(network)
  );
  
  return feeBumpTx.toXDR();
}
```

---

## Best Practices

### 1. Error Handling

```typescript
/**
 * Comprehensive error handling for Stellar operations
 */
async function safeTransaction(operation: () => Promise<any>) {
  try {
    return await operation();
  } catch (error: any) {
    // Network errors
    if (error.message?.includes('Network Error')) {
      throw new Error('Network connection failed. Please check your internet.');
    }
    
    // Account not found
    if (error.message?.includes('Account not found')) {
      throw new Error('Account does not exist. Please fund it first.');
    }
    
    // Insufficient balance
    if (error.response?.data?.extras?.result_codes?.operations?.includes('op_underfunded')) {
      throw new Error('Insufficient balance for this operation.');
    }
    
    // Transaction failed
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      throw new Error(`Transaction failed: ${JSON.stringify(codes)}`);
    }
    
    throw error;
  }
}
```

### 2. Fee Management

```typescript
/**
 * Calculates appropriate fee based on network conditions
 */
async function calculateOptimalFee(
  network: StellarNetwork = StellarNetwork.TESTNET
): Promise<string> {
  const server = createServer(network);
  
  try {
    const feeStats = await server.feeStats();
    // Use 90th percentile for reliable inclusion
    return feeStats.fee_charged.p90;
  } catch {
    // Fallback to base fee
    return StellarSdk.BASE_FEE;
  }
}
```

### 3. Transaction Validation

```typescript
/**
 * Validates transaction before submission
 */
function validateTransaction(tx: StellarSdk.Transaction): boolean {
  // Check operations
  if (tx.operations.length === 0) {
    throw new Error('Transaction has no operations');
  }
  
  // Check timeout
  const now = Math.floor(Date.now() / 1000);
  if (tx.timeBounds && tx.timeBounds.maxTime !== '0' && parseInt(tx.timeBounds.maxTime) < now) {
    throw new Error('Transaction has expired');
  }
  
  // Check signatures
  if (tx.signatures.length === 0) {
    throw new Error('Transaction is not signed');
  }
  
  return true;
}
```

### 4. Retry Logic

```typescript
/**
 * Retries failed operations with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 5. Memo Best Practices

```typescript
/**
 * Creates appropriate memo for different use cases
 */
function createMemo(type: 'text' | 'id' | 'hash', value: string | number): StellarSdk.Memo {
  switch (type) {
    case 'text':
      // For human-readable messages (max 28 bytes)
      return StellarSdk.Memo.text(value as string);
    
    case 'id':
      // For numeric identifiers (uint64)
      return StellarSdk.Memo.id(value.toString());
    
    case 'hash':
      // For 32-byte hashes
      return StellarSdk.Memo.hash(value as string);
    
    default:
      return StellarSdk.Memo.none();
  }
}
```

---

## Common Patterns

### Pattern 1: Reward Distribution

```typescript
/**
 * Distributes rewards to multiple recipients
 */
async function distributeRewards(
  sourceAccount: string,
  recipients: Array<{ address: string; amount: string }>,
  asset: StellarSdk.Asset
) {
  const payments: PaymentDetails[] = recipients.map(r => ({
    destination: r.address,
    asset,
    amount: r.amount
  }));
  
  const xdr = await createBatchPayments(
    sourceAccount,
    payments,
    StellarNetwork.TESTNET
  );
  
  const signedXdr = await signWithWallet(xdr);
  return await submitTransaction(signedXdr, StellarNetwork.TESTNET);
}
```

### Pattern 2: Asset Swap

```typescript
/**
 * Swaps one asset for another using path payments
 */
async function swapAssets(
  accountKey: string,
  fromAsset: StellarSdk.Asset,
  toAsset: StellarSdk.Asset,
  amount: string
) {
  const xdr = await createPathPayment(
    accountKey,
    accountKey, // Send to self
    fromAsset,
    amount,
    toAsset,
    amount, // Adjust based on exchange rate
    StellarNetwork.TESTNET
  );
  
  const signedXdr = await signWithWallet(xdr);
  return await submitTransaction(signedXdr, StellarNetwork.TESTNET);
}
```

---

## Additional Resources

- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Developer Docs](https://developers.stellar.org/)
- [Horizon API Reference](https://developers.stellar.org/api/horizon)
- [Stellar Laboratory](https://laboratory.stellar.org/) - Test transactions

---

**Last Updated:** February 25, 2026  
**Maintained By:** SocialFlow Labs
