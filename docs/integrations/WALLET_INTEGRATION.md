# Wallet Integration Guide

## Overview

This guide covers integrating Stellar wallets (Freighter and Albedo) into SocialFlow for secure, non-custodial blockchain operations.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supported Wallets](#supported-wallets)
3. [Installation](#installation)
4. [Freighter Integration](#freighter-integration)
5. [Albedo Integration](#albedo-integration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ and npm/yarn
- Basic understanding of Stellar blockchain
- User must have a Stellar wallet installed (browser extension or mobile)

**Required Dependencies:**
```bash
npm install @stellar/stellar-sdk @stellar/freighter-api albedo-js
```

---

## Supported Wallets

### Freighter

- **Type:** Browser extension wallet
- **Platforms:** Chrome, Firefox, Brave, Edge
- **Website:** https://freighter.app
- **Best For:** Desktop users, developers

### Albedo

- **Type:** Web-based wallet (no installation required)
- **Platforms:** Any modern browser
- **Website:** https://albedo.link
- **Best For:** Quick access, mobile users

---

## Installation

### 1. Install Dependencies

```bash
npm install @stellar/stellar-sdk @stellar/freighter-api albedo-js
```

### 2. Create Wallet Service

Create `services/walletService.ts`:

```typescript
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';
import albedo from 'albedo-js';
import * as StellarSdk from '@stellar/stellar-sdk';

export enum WalletType {
  FREIGHTER = 'freighter',
  ALBEDO = 'albedo'
}

export interface WalletConnection {
  publicKey: string;
  walletType: WalletType;
  network: 'PUBLIC' | 'TESTNET';
}

/**
 * Wallet service error codes
 */
export enum WalletErrorCode {
  NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
  USER_REJECTED = 'WALLET_USER_REJECTED',
  NETWORK_MISMATCH = 'WALLET_NETWORK_MISMATCH',
  SIGNING_FAILED = 'WALLET_SIGNING_FAILED',
  CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED'
}

export class WalletServiceError extends Error {
  constructor(
    public code: WalletErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'WalletServiceError';
  }
}
```

---

## Freighter Integration

### Check Installation

```typescript
/**
 * Checks if Freighter wallet is installed
 * @returns {Promise<boolean>} True if Freighter is available
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    return await isConnected();
  } catch {
    return false;
  }
}
```

### Connect Wallet

```typescript
/**
 * Connects to Freighter wallet and retrieves public key
 * @param {string} network - Network to connect to ('PUBLIC' or 'TESTNET')
 * @returns {Promise<WalletConnection>} Connection details
 * @throws {WalletServiceError} If connection fails
 */
export async function connectFreighter(
  network: 'PUBLIC' | 'TESTNET' = 'PUBLIC'
): Promise<WalletConnection> {
  try {
    // Check if installed
    const installed = await isFreighterInstalled();
    if (!installed) {
      throw new WalletServiceError(
        WalletErrorCode.NOT_INSTALLED,
        'Freighter wallet is not installed. Please install from https://freighter.app'
      );
    }

    // Get public key (triggers permission request)
    const publicKey = await getPublicKey();
    
    if (!publicKey) {
      throw new WalletServiceError(
        WalletErrorCode.USER_REJECTED,
        'User rejected wallet connection'
      );
    }

    return {
      publicKey,
      walletType: WalletType.FREIGHTER,
      network
    };
  } catch (error) {
    if (error instanceof WalletServiceError) {
      throw error;
    }
    throw new WalletServiceError(
      WalletErrorCode.CONNECTION_FAILED,
      'Failed to connect to Freighter wallet',
      error
    );
  }
}
```

### Sign Transaction

```typescript
/**
 * Signs a transaction using Freighter wallet
 * @param {string} xdr - Transaction XDR to sign
 * @param {string} network - Network passphrase
 * @returns {Promise<string>} Signed transaction XDR
 * @throws {WalletServiceError} If signing fails
 */
export async function signWithFreighter(
  xdr: string,
  network: 'PUBLIC' | 'TESTNET' = 'PUBLIC'
): Promise<string> {
  try {
    const networkPassphrase = network === 'PUBLIC'
      ? StellarSdk.Networks.PUBLIC
      : StellarSdk.Networks.TESTNET;

    const signedXdr = await signTransaction(xdr, {
      network: networkPassphrase,
      accountToSign: undefined // Use connected account
    });

    if (!signedXdr) {
      throw new WalletServiceError(
        WalletErrorCode.USER_REJECTED,
        'User rejected transaction signing'
      );
    }

    return signedXdr;
  } catch (error) {
    if (error instanceof WalletServiceError) {
      throw error;
    }
    throw new WalletServiceError(
      WalletErrorCode.SIGNING_FAILED,
      'Failed to sign transaction with Freighter',
      error
    );
  }
}
```

### Complete Example

```typescript
import { connectFreighter, signWithFreighter } from './services/walletService';
import * as StellarSdk from '@stellar/stellar-sdk';

async function sendPayment() {
  try {
    // 1. Connect wallet
    const connection = await connectFreighter('TESTNET');
    console.log('Connected:', connection.publicKey);

    // 2. Load account
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(connection.publicKey);

    // 3. Build transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: 'GDESTINATION...',
        asset: StellarSdk.Asset.native(),
        amount: '10'
      }))
      .setTimeout(180)
      .build();

    // 4. Sign with Freighter
    const signedXdr = await signWithFreighter(transaction.toXDR(), 'TESTNET');
    
    // 5. Submit transaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      StellarSdk.Networks.TESTNET
    );
    const result = await server.submitTransaction(signedTx);
    
    console.log('Success!', result.hash);
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

---

## Albedo Integration

### Connect Wallet

```typescript
/**
 * Connects to Albedo wallet
 * @param {string} network - Network to connect to ('public' or 'testnet')
 * @returns {Promise<WalletConnection>} Connection details
 * @throws {WalletServiceError} If connection fails
 */
export async function connectAlbedo(
  network: 'public' | 'testnet' = 'public'
): Promise<WalletConnection> {
  try {
    const result = await albedo.publicKey({
      require_existing: false
    });

    if (!result.pubkey) {
      throw new WalletServiceError(
        WalletErrorCode.USER_REJECTED,
        'User rejected wallet connection'
      );
    }

    return {
      publicKey: result.pubkey,
      walletType: WalletType.ALBEDO,
      network: network === 'public' ? 'PUBLIC' : 'TESTNET'
    };
  } catch (error) {
    if (error instanceof WalletServiceError) {
      throw error;
    }
    throw new WalletServiceError(
      WalletErrorCode.CONNECTION_FAILED,
      'Failed to connect to Albedo wallet',
      error
    );
  }
}
```

### Sign Transaction

```typescript
/**
 * Signs a transaction using Albedo wallet
 * @param {string} xdr - Transaction XDR to sign
 * @param {string} network - Network ('public' or 'testnet')
 * @returns {Promise<string>} Signed transaction XDR
 * @throws {WalletServiceError} If signing fails
 */
export async function signWithAlbedo(
  xdr: string,
  network: 'public' | 'testnet' = 'public'
): Promise<string> {
  try {
    const result = await albedo.tx({
      xdr,
      network,
      submit: false // Don't auto-submit
    });

    if (!result.signed_envelope_xdr) {
      throw new WalletServiceError(
        WalletErrorCode.USER_REJECTED,
        'User rejected transaction signing'
      );
    }

    return result.signed_envelope_xdr;
  } catch (error) {
    if (error instanceof WalletServiceError) {
      throw error;
    }
    throw new WalletServiceError(
      WalletErrorCode.SIGNING_FAILED,
      'Failed to sign transaction with Albedo',
      error
    );
  }
}
```

### Complete Example

```typescript
import { connectAlbedo, signWithAlbedo } from './services/walletService';
import * as StellarSdk from '@stellar/stellar-sdk';

async function createTrustline() {
  try {
    // 1. Connect wallet
    const connection = await connectAlbedo('testnet');
    console.log('Connected:', connection.publicKey);

    // 2. Load account
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(connection.publicKey);

    // 3. Build transaction
    const asset = new StellarSdk.Asset('USDC', 'GISSUER...');
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset,
        limit: '1000000'
      }))
      .setTimeout(180)
      .build();

    // 4. Sign with Albedo
    const signedXdr = await signWithAlbedo(transaction.toXDR(), 'testnet');
    
    // 5. Submit transaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      StellarSdk.Networks.TESTNET
    );
    const result = await server.submitTransaction(signedTx);
    
    console.log('Trustline created!', result.hash);
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

---

## Best Practices

### 1. Wallet Detection

```typescript
/**
 * Detects available wallets
 * @returns {Promise<WalletType[]>} List of available wallet types
 */
export async function detectAvailableWallets(): Promise<WalletType[]> {
  const wallets: WalletType[] = [];
  
  // Freighter is always available (browser-based)
  if (await isFreighterInstalled()) {
    wallets.push(WalletType.FREIGHTER);
  }
  
  // Albedo is always available (web-based)
  wallets.push(WalletType.ALBEDO);
  
  return wallets;
}
```

### 2. Network Validation

```typescript
/**
 * Validates account exists on specified network
 */
async function validateAccount(
  publicKey: string,
  network: 'PUBLIC' | 'TESTNET'
): Promise<boolean> {
  try {
    const serverUrl = network === 'PUBLIC'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org';
    
    const server = new StellarSdk.Horizon.Server(serverUrl);
    await server.loadAccount(publicKey);
    return true;
  } catch {
    return false;
  }
}
```

### 3. Error Handling UI

```typescript
function handleWalletError(error: unknown) {
  if (error instanceof WalletServiceError) {
    switch (error.code) {
      case WalletErrorCode.NOT_INSTALLED:
        showNotification({
          type: 'error',
          title: 'Wallet Not Found',
          message: 'Please install Freighter wallet',
          action: {
            label: 'Install',
            url: 'https://freighter.app'
          }
        });
        break;
      
      case WalletErrorCode.USER_REJECTED:
        showNotification({
          type: 'info',
          title: 'Action Cancelled',
          message: 'You rejected the wallet request'
        });
        break;
      
      case WalletErrorCode.NETWORK_MISMATCH:
        showNotification({
          type: 'error',
          title: 'Wrong Network',
          message: 'Please switch to the correct network in your wallet'
        });
        break;
      
      default:
        showNotification({
          type: 'error',
          title: 'Wallet Error',
          message: error.message
        });
    }
  }
}
```

### 4. Session Management

```typescript
interface WalletSession {
  connection: WalletConnection;
  connectedAt: Date;
  lastActivity: Date;
}

class WalletSessionManager {
  private session: WalletSession | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  async connect(walletType: WalletType, network: 'PUBLIC' | 'TESTNET') {
    const connection = walletType === WalletType.FREIGHTER
      ? await connectFreighter(network)
      : await connectAlbedo(network === 'PUBLIC' ? 'public' : 'testnet');

    this.session = {
      connection,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    return connection;
  }

  getSession(): WalletConnection | null {
    if (!this.session) return null;

    const now = Date.now();
    const lastActivity = this.session.lastActivity.getTime();

    if (now - lastActivity > this.SESSION_TIMEOUT) {
      this.disconnect();
      return null;
    }

    this.session.lastActivity = new Date();
    return this.session.connection;
  }

  disconnect() {
    this.session = null;
  }
}

export const walletSession = new WalletSessionManager();
```

---

## Troubleshooting

### Freighter Not Detected

**Problem:** `isFreighterInstalled()` returns false

**Solutions:**
1. Ensure Freighter extension is installed and enabled
2. Refresh the page after installation
3. Check browser console for errors
4. Try in a different browser

### User Rejection Errors

**Problem:** User keeps rejecting wallet requests

**Solutions:**
1. Provide clear explanation before requesting permission
2. Show preview of transaction details
3. Add "Why do we need this?" help text
4. Implement retry mechanism with user confirmation

### Network Mismatch

**Problem:** Transaction fails due to wrong network

**Solutions:**
```typescript
async function ensureCorrectNetwork(
  publicKey: string,
  expectedNetwork: 'PUBLIC' | 'TESTNET'
) {
  const isValid = await validateAccount(publicKey, expectedNetwork);
  
  if (!isValid) {
    throw new WalletServiceError(
      WalletErrorCode.NETWORK_MISMATCH,
      `Account not found on ${expectedNetwork}. Please switch networks in your wallet.`
    );
  }
}
```

### Transaction Signing Timeout

**Problem:** Signing takes too long and times out

**Solutions:**
1. Increase transaction timeout: `.setTimeout(300)` (5 minutes)
2. Show loading indicator to user
3. Implement retry mechanism
4. Cache transaction for later signing

---

## Security Considerations

### 1. Never Request Private Keys

```typescript
// ✅ Good: Use wallet signing
const signedXdr = await signWithFreighter(xdr);

// ❌ Bad: Never do this!
const privateKey = prompt('Enter your private key'); // NEVER!
```

### 2. Validate All Inputs

```typescript
function validatePublicKey(key: string): boolean {
  return StellarSdk.StrKey.isValidEd25519PublicKey(key);
}

function validateAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000;
}
```

### 3. Display Transaction Details

```typescript
// Always show users what they're signing
function displayTransactionSummary(tx: StellarSdk.Transaction) {
  return {
    operations: tx.operations.map(op => ({
      type: op.type,
      details: formatOperationDetails(op)
    })),
    fee: tx.fee,
    network: tx.networkPassphrase
  };
}
```

---

## Additional Resources

- [Freighter Documentation](https://docs.freighter.app/)
- [Albedo Documentation](https://albedo.link/docs)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Network Overview](https://developers.stellar.org/docs)

---

**Last Updated:** February 25, 2026  
**Maintained By:** SocialFlow Labs
