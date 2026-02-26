# IPFS Integration Guide

## Overview

Complete guide for integrating IPFS (InterPlanetary File System) into SocialFlow for decentralized media storage and content distribution.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Setup](#setup)
3. [Upload Media](#upload-media)
4. [Retrieve Content](#retrieve-content)
5. [Pinning Services](#pinning-services)
6. [Best Practices](#best-practices)

---

## Introduction

IPFS provides decentralized storage for SocialFlow media assets:

- Profile images and avatars
- Post images and videos
- Analytics data backups
- Content archives

---

## Setup

### Install Dependencies

```bash
npm install ipfs-http-client
```

### Initialize IPFS Client

```typescript
import { create, IPFSHTTPClient } from 'ipfs-http-client';

/**
 * Creates an IPFS client instance
 * @param {string} gateway - IPFS gateway URL
 * @returns {IPFSHTTPClient} Configured IPFS client
 */
export function createIPFSClient(
  gateway: string = 'https://ipfs.infura.io:5001'
): IPFSHTTPClient {
  return create({ url: gateway });
}

// Initialize client
const ipfs = createIPFSClient();
```

---

## Upload Media

### Upload Single File

```typescript
/**
 * Uploads a file to IPFS
 * @param {File} file - File to upload
 * @returns {Promise<string>} IPFS CID (Content Identifier)
 */
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const added = await ipfs.add(file);
    return added.cid.toString();
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}
```

### Upload with Metadata

```typescript
/**
 * Uploads file with metadata to IPFS
 * @param {File} file - File to upload
 * @param {object} metadata - File metadata
 * @returns {Promise<{cid: string, metadata: object}>}
 */
export async function uploadWithMetadata(
  file: File,
  metadata: {
    name: string;
    description?: string;
    author?: string;
  }
): Promise<{cid: string, metadata: object}> {
  const fileBuffer = await file.arrayBuffer();
  
  const content = {
    file: new Uint8Array(fileBuffer),
    metadata: {
      ...metadata,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      type: file.type
    }
  };
  
  const added = await ipfs.add(JSON.stringify(content));
  return {
    cid: added.cid.toString(),
    metadata: content.metadata
  };
}
```

### Example: Upload Post Image

```typescript
async function uploadPostImage(imageFile: File, postId: string) {
  try {
    const cid = await uploadToIPFS(imageFile);
    const ipfsUrl = `https://ipfs.io/ipfs/${cid}`;
    
    // Save CID to post record
    await updatePost(postId, { imageCID: cid, imageUrl: ipfsUrl });
    
    console.log('Image uploaded to IPFS:', ipfsUrl);
    return ipfsUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

---

## Retrieve Content

### Get File from IPFS

```typescript
/**
 * Retrieves content from IPFS
 * @param {string} cid - Content identifier
 * @returns {Promise<Uint8Array>} File content
 */
export async function getFromIPFS(cid: string): Promise<Uint8Array> {
  const chunks = [];
  
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk);
  }
  
  return new Uint8Array(Buffer.concat(chunks));
}
```

### Generate Gateway URL

```typescript
/**
 * Generates public gateway URL for IPFS content
 * @param {string} cid - Content identifier
 * @param {string} gateway - Gateway domain
 * @returns {string} Public URL
 */
export function getIPFSUrl(
  cid: string,
  gateway: string = 'https://ipfs.io'
): string {
  return `${gateway}/ipfs/${cid}`;
}
```

### Example: Display IPFS Image

```typescript
function IPFSImage({ cid }: { cid: string }) {
  const imageUrl = getIPFSUrl(cid);
  
  return (
    <img 
      src={imageUrl} 
      alt="IPFS content"
      onError={(e) => {
        // Fallback to alternative gateway
        e.currentTarget.src = getIPFSUrl(cid, 'https://cloudflare-ipfs.com');
      }}
    />
  );
}
```

---

## Pinning Services

### Pin Content

```typescript
/**
 * Pins content to ensure persistence
 * @param {string} cid - Content to pin
 * @returns {Promise<void>}
 */
export async function pinContent(cid: string): Promise<void> {
  try {
    await ipfs.pin.add(cid);
    console.log(`Content pinned: ${cid}`);
  } catch (error) {
    console.error('Pinning failed:', error);
    throw error;
  }
}
```

### Unpin Content

```typescript
/**
 * Unpins content to free up storage
 * @param {string} cid - Content to unpin
 * @returns {Promise<void>}
 */
export async function unpinContent(cid: string): Promise<void> {
  try {
    await ipfs.pin.rm(cid);
    console.log(`Content unpinned: ${cid}`);
  } catch (error) {
    console.error('Unpinning failed:', error);
  }
}
```

### Using Pinata (Pinning Service)

```typescript
import axios from 'axios';

/**
 * Pins content using Pinata service
 * @param {string} cid - Content to pin
 * @param {string} apiKey - Pinata API key
 * @returns {Promise<void>}
 */
export async function pinWithPinata(
  cid: string,
  apiKey: string
): Promise<void> {
  await axios.post(
    'https://api.pinata.cloud/pinning/pinByHash',
    { hashToPin: cid },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
}
```

---

## Best Practices

### 1. Content Validation

```typescript
/**
 * Validates file before upload
 */
function validateFile(file: File): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  
  if (file.size > maxSize) {
    throw new Error('File too large (max 10MB)');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported');
  }
  
  return true;
}
```

### 2. Progress Tracking

```typescript
/**
 * Uploads file with progress tracking
 */
async function uploadWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  let uploaded = 0;
  
  const added = await ipfs.add(file, {
    progress: (bytes) => {
      uploaded += bytes;
      const percent = (uploaded / file.size) * 100;
      onProgress(percent);
    }
  });
  
  return added.cid.toString();
}
```

### 3. Gateway Fallback

```typescript
/**
 * Tries multiple gateways for reliability
 */
const IPFS_GATEWAYS = [
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
  'https://gateway.pinata.cloud'
];

async function fetchWithFallback(cid: string): Promise<Response> {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}/ipfs/${cid}`);
      if (response.ok) return response;
    } catch {
      continue;
    }
  }
  throw new Error('All gateways failed');
}
```

### 4. Caching Strategy

```typescript
/**
 * Caches IPFS content locally
 */
class IPFSCache {
  private cache = new Map<string, Uint8Array>();
  
  async get(cid: string): Promise<Uint8Array> {
    if (this.cache.has(cid)) {
      return this.cache.get(cid)!;
    }
    
    const content = await getFromIPFS(cid);
    this.cache.set(cid, content);
    return content;
  }
  
  clear() {
    this.cache.clear();
  }
}
```

---

## Additional Resources

- [IPFS Documentation](https://docs.ipfs.tech/)
- [IPFS HTTP Client](https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs-http-client)
- [Pinata Pinning Service](https://www.pinata.cloud/)

---

**Last Updated:** February 25, 2026  
**Maintained By:** SocialFlow Labs
