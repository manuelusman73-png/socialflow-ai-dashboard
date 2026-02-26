# Identity Verification Guide

## Overview

Complete guide for implementing decentralized identity verification in SocialFlow using Stellar's SEP-10 (Stellar Web Authentication) and identity verification services.

---

## Table of Contents

1. [Introduction](#introduction)
2. [SEP-10 Authentication](#sep-10-authentication)
3. [Identity Verification Flow](#identity-verification-flow)
4. [KYC Integration](#kyc-integration)
5. [Best Practices](#best-practices)

---

## Introduction

SocialFlow implements identity verification for:

- Creator verification badges
- Payment compliance (KYC/AML)
- Premium feature access
- Trust and safety

---

## SEP-10 Authentication

### Setup

```bash
npm install @stellar/stellar-sdk stellar-sdk-sep10
```

### Generate Challenge

```typescript
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Generates SEP-10 authentication challenge
 * @param {string} clientAccountId - Client's public key
 * @param {string} serverAccountId - Server's public key
 * @param {string} homeDomain - Application domain
 * @param {number} timeout - Challenge timeout in seconds
 * @returns {string} Challenge transaction XDR
 */
export function generateChallenge(
  clientAccountId: string,
  serverAccountId: string,
  homeDomain: string,
  timeout: number = 300
): string {
  const serverKeypair = StellarSdk.Keypair.fromSecret(process.env.SERVER_SECRET!);
  
  const challenge = StellarSdk.WebAuth.buildChallengeTx(
    serverKeypair,
    clientAccountId,
    homeDomain,
    timeout,
    StellarSdk.Networks.PUBLIC
  );
  
  return challenge;
}
```

### Verify Challenge Response

```typescript
/**
 * Verifies signed SEP-10 challenge
 * @param {string} challengeXdr - Signed challenge transaction
 * @param {string} serverAccountId - Server's public key
 * @param {string} homeDomain - Application domain
 * @returns {Promise<string>} Verified client public key
 */
export async function verifyChallenge(
  challengeXdr: string,
  serverAccountId: string,
  homeDomain: string
): Promise<string> {
  const serverKeypair = StellarSdk.Keypair.fromSecret(process.env.SERVER_SECRET!);
  
  const result = StellarSdk.WebAuth.readChallengeTx(
    challengeXdr,
    serverAccountId,
    StellarSdk.Networks.PUBLIC,
    homeDomain
  );
  
  return result.clientAccountID;
}
```

### Complete Authentication Flow

```typescript
/**
 * Complete SEP-10 authentication flow
 */
export class SEP10Auth {
  private serverKeypair: StellarSdk.Keypair;
  private homeDomain: string;
  
  constructor(serverSecret: string, homeDomain: string) {
    this.serverKeypair = StellarSdk.Keypair.fromSecret(serverSecret);
    this.homeDomain = homeDomain;
  }
  
  /**
   * Step 1: Generate challenge for client
   */
  generateChallenge(clientPublicKey: string): string {
    return StellarSdk.WebAuth.buildChallengeTx(
      this.serverKeypair,
      clientPublicKey,
      this.homeDomain,
      300,
      StellarSdk.Networks.PUBLIC
    );
  }
  
  /**
   * Step 2: Verify signed challenge
   */
  async verifyChallenge(signedChallengeXdr: string): Promise<{
    clientPublicKey: string;
    token: string;
  }> {
    const result = StellarSdk.WebAuth.readChallengeTx(
      signedChallengeXdr,
      this.serverKeypair.publicKey(),
      StellarSdk.Networks.PUBLIC,
      this.homeDomain
    );
    
    // Generate JWT token
    const token = this.generateJWT(result.clientAccountID);
    
    return {
      clientPublicKey: result.clientAccountID,
      token
    };
  }
  
  /**
   * Generates JWT token for authenticated session
   */
  private generateJWT(publicKey: string): string {
    // Implementation depends on your JWT library
    return `jwt_token_for_${publicKey}`;
  }
}
```

---

## Identity Verification Flow

### Request Verification

```typescript
/**
 * Initiates identity verification process
 * @param {string} userId - User identifier
 * @param {object} userData - User information
 * @returns {Promise<string>} Verification session ID
 */
export async function requestVerification(
  userId: string,
  userData: {
    fullName: string;
    email: string;
    dateOfBirth: string;
    country: string;
  }
): Promise<string> {
  // Store verification request
  const sessionId = generateSessionId();
  
  await storeVerificationRequest({
    sessionId,
    userId,
    userData,
    status: 'pending',
    createdAt: new Date()
  });
  
  return sessionId;
}
```

### Submit Documents

```typescript
/**
 * Submits identity documents for verification
 * @param {string} sessionId - Verification session ID
 * @param {File} idDocument - Government ID document
 * @param {File} selfie - Selfie photo
 * @returns {Promise<void>}
 */
export async function submitDocuments(
  sessionId: string,
  idDocument: File,
  selfie: File
): Promise<void> {
  // Upload to secure storage (IPFS or encrypted storage)
  const idCID = await uploadToIPFS(idDocument);
  const selfieCID = await uploadToIPFS(selfie);
  
  // Update verification session
  await updateVerificationSession(sessionId, {
    idDocumentCID: idCID,
    selfieCID: selfieCID,
    status: 'documents_submitted',
    submittedAt: new Date()
  });
  
  // Trigger verification process
  await triggerVerificationReview(sessionId);
}
```

### Check Verification Status

```typescript
/**
 * Checks identity verification status
 * @param {string} sessionId - Verification session ID
 * @returns {Promise<VerificationStatus>}
 */
export interface VerificationStatus {
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  message?: string;
  verifiedAt?: Date;
}

export async function checkVerificationStatus(
  sessionId: string
): Promise<VerificationStatus> {
  const session = await getVerificationSession(sessionId);
  
  return {
    status: session.status,
    message: session.statusMessage,
    verifiedAt: session.verifiedAt
  };
}
```

---

## KYC Integration

### Third-Party KYC Service

```typescript
import axios from 'axios';

/**
 * Integrates with third-party KYC provider
 */
export class KYCService {
  private apiKey: string;
  private apiUrl: string;
  
  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }
  
  /**
   * Initiates KYC verification
   */
  async initiateKYC(userData: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    address: string;
  }): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}/kyc/initiate`,
      userData,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    
    return response.data.verificationId;
  }
  
  /**
   * Checks KYC status
   */
  async checkKYCStatus(verificationId: string): Promise<{
    status: string;
    riskLevel?: string;
  }> {
    const response = await axios.get(
      `${this.apiUrl}/kyc/${verificationId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    
    return response.data;
  }
}
```

### Verification Badge System

```typescript
/**
 * Awards verification badge to user
 * @param {string} userId - User identifier
 * @param {string} verificationType - Type of verification
 * @returns {Promise<void>}
 */
export async function awardVerificationBadge(
  userId: string,
  verificationType: 'identity' | 'creator' | 'business'
): Promise<void> {
  await updateUserProfile(userId, {
    verified: true,
    verificationType,
    verifiedAt: new Date()
  });
  
  // Optionally issue on-chain verification credential
  await issueVerificationCredential(userId, verificationType);
}
```

---

## Best Practices

### 1. Data Privacy

```typescript
/**
 * Encrypts sensitive user data
 */
import crypto from 'crypto';

function encryptSensitiveData(data: string, key: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptSensitiveData(encrypted: string, key: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 2. Secure Document Storage

```typescript
/**
 * Stores documents with encryption
 */
async function storeSecureDocument(
  file: File,
  userId: string
): Promise<string> {
  // Encrypt file
  const fileBuffer = await file.arrayBuffer();
  const encrypted = encryptSensitiveData(
    Buffer.from(fileBuffer).toString('base64'),
    process.env.ENCRYPTION_KEY!
  );
  
  // Upload encrypted file
  const cid = await uploadToIPFS(new Blob([encrypted]));
  
  // Store reference with access control
  await storeDocumentReference({
    userId,
    cid,
    encrypted: true,
    uploadedAt: new Date()
  });
  
  return cid;
}
```

### 3. Compliance Logging

```typescript
/**
 * Logs verification events for compliance
 */
async function logVerificationEvent(
  userId: string,
  event: string,
  metadata: object
): Promise<void> {
  await createAuditLog({
    userId,
    event,
    metadata,
    timestamp: new Date(),
    ipAddress: getClientIP()
  });
}
```

### 4. Rate Limiting

```typescript
/**
 * Rate limits verification requests
 */
const verificationAttempts = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const attempts = verificationAttempts.get(userId) || 0;
  const maxAttempts = 3;
  
  if (attempts >= maxAttempts) {
    throw new Error('Too many verification attempts. Please try again later.');
  }
  
  verificationAttempts.set(userId, attempts + 1);
  return true;
}
```

---

## Additional Resources

- [SEP-10 Specification](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md)
- [Stellar Web Authentication](https://developers.stellar.org/docs/encyclopedia/web-authentication)
- [KYC Best Practices](https://www.stellar.org/learn/kyc-best-practices)

---

**Last Updated:** February 25, 2026  
**Maintained By:** SocialFlow Labs
