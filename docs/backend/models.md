# Mongoose Models

 Mongoose schemas configured in the backend database.

## Collection: `accounts`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `userId` | `String` | ✅ True | ❌ False |
| `address` | `String` | ✅ True | ❌ False |
| `chainId` | `Number` | ✅ True | ❌ False |
| `isDeployed` | `Boolean` | ❌ False | ❌ False |
| `signerAddress` | `String` | ❌ False | ❌ False |
| `accountType` | `String` | ❌ False | ❌ False |
| `walletID` | `String` | ❌ False | ❌ False |
| `providerInfo` | `Map` | ❌ False | ❌ False |
| `isActive` | `Boolean` | ❌ False | ❌ False |
| `createdAt` | `Date` | ❌ False | ❌ False |
| `updatedAt` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `address: 1` | `{}` |
| `userId: 1, chainId: 1` | `{}` |
| `address: 1, chainId: 1` | ` unique: true ` |

## Collection: `nonces`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `signerAddress` | `String` | ✅ True | ❌ False |
| `chainId` | `Number` | ✅ True | ❌ False |
| `nonce` | `Number` | ✅ True | ❌ False |
| `updatedAt` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `signerAddress: 1, chainId: 1` | ` unique: true ` |

## Collection: `notificationevents`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `userId` | `String` | ✅ True | ❌ False |
| `eventId` | `String` | ✅ True | ✅ True |
| `type` | `String` | ✅ True | ❌ False |
| `payload` | `Schema.Types.Mixed` | ✅ True | ❌ False |
| `timestamp` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `timestamp: 1` | ` expireAfterSeconds: 86400 ` |
| `userId: 1, timestamp: 1` | `{}` |

## Collection: `portfolios`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `type` | `String` | ✅ True | ❌ False |
| `tokenAddress` | `String` | ❌ False | ❌ False |
| `tokenId` | `String` | ❌ False | ❌ False |
| `symbol` | `String` | ❌ False | ❌ False |
| `name` | `String` | ❌ False | ❌ False |
| `decimals` | `Number` | ❌ False | ❌ False |
| `balance` | `String` | ✅ True | ❌ False |
| `metadata` | `Schema.Types.Mixed` | ❌ False | ❌ False |
| `userId` | `String` | ✅ True | ❌ False |
| `address` | `String` | ✅ True | ❌ False |
| `chainId` | `Number` | ✅ True | ❌ False |
| `assets` | `[portfolioAssetSchema]` | ❌ False | ❌ False |
| `lastSyncedAt` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `address: 1, chainId: 1` | ` unique: true ` |
| `userId: 1` | `{}` |

## Collection: `revokedtokens`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `token` | `String` | ✅ True | ✅ True |
| `expiresAt` | `Date` | ✅ True | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `expiresAt: 1` | ` expireAfterSeconds: 0 ` |

## Collection: `sessionkeys`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `target` | `String` | ✅ True | ❌ False |
| `spendingLimit` | `String` | ✅ True | ❌ False |
| `userId` | `String` | ✅ True | ❌ False |
| `ownerAddress` | `String` | ✅ True | ❌ False |
| `publicKey` | `String` | ✅ True | ❌ False |
| `chainId` | `Number` | ✅ True | ❌ False |
| `expiresAt` | `Date` | ✅ True | ❌ False |
| `isActive` | `Boolean` | ❌ False | ❌ False |
| `revokedAt` | `Date` | ❌ False | ❌ False |
| `signature` | `String` | ❌ False | ❌ False |
| `createdAt` | `Date` | ❌ False | ❌ False |
| `updatedAt` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `ownerAddress: 1, chainId: 1` | `{}` |
| `publicKey: 1` | ` unique: true ` |
| `userId: 1` | `{}` |
| `userId: 1, ownerAddress: 1, chainId: 1` | `{}` |

## Collection: `tokenmetadatas`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `chainId` | `Number` | ✅ True | ❌ False |
| `address` | `String` | ✅ True | ❌ False |
| `symbol` | `String` | ✅ True | ❌ False |
| `name` | `String` | ✅ True | ❌ False |
| `decimals` | `Number` | ✅ True | ❌ False |
| `updatedAt` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `chainId: 1, address: 1` | ` unique: true ` |

## Collection: `transactions`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `userId` | `String` | ✅ True | ❌ False |
| `accountId` | `String` | ✅ True | ❌ False |
| `hash` | `String` | ❌ False | ❌ False |
| `userOpHash` | `String` | ❌ False | ❌ False |
| `to` | `String` | ❌ False | ❌ False |
| `value` | `String` | ❌ False | ❌ False |
| `data` | `String` | ❌ False | ❌ False |
| `bundlerID` | `String` | ❌ False | ❌ False |
| `paymasterID` | `String` | ❌ False | ❌ False |
| `walletID` | `String` | ❌ False | ❌ False |
| `gasUsed` | `String` | ❌ False | ❌ False |
| `status` | `String` | ❌ False | ❌ False |
| `chainId` | `Number` | ✅ True | ❌ False |
| `queuedAt` | `Date` | ❌ False | ❌ False |
| `startedAt` | `Date` | ❌ False | ❌ False |
| `submittedAt` | `Date` | ❌ False | ❌ False |
| `confirmedAt` | `Date` | ❌ False | ❌ False |
| `completedAt` | `Date` | ❌ False | ❌ False |
| `executionDuration` | `Number` | ❌ False | ❌ False |
| `queueDuration` | `Number` | ❌ False | ❌ False |
| `blockchainDuration` | `Number` | ❌ False | ❌ False |
| `retryCount` | `Number` | ❌ False | ❌ False |
| `failureReason` | `String` | ❌ False | ❌ False |
| `workerId` | `String` | ❌ False | ❌ False |
| `requestId` | `String` | ❌ False | ❌ False |
| `rpcEndpoint` | `String` | ❌ False | ❌ False |
| `idempotencyKey` | `String` | ❌ False | ✅ True |
| `sessionKeyAddress` | `String` | ❌ False | ❌ False |
| `calls` | `[` | ✅ True | ❌ False |
| `value` | `String` | ❌ False | ❌ False |
| `data` | `String` | ❌ False | ❌ False |
| `createdAt` | `Date` | ❌ False | ❌ False |
| `updatedAt` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `userId: 1, chainId: 1, createdAt: -1` | `{}` |
| `status: 1, createdAt: 1` | `{}` |
| `hash: 1` | ` unique: true, sparse: true ` |
| `userOpHash: 1` | ` unique: true, sparse: true ` |
| `status: 1, chainId: 1, accountId: 1` | `{}` |

## Collection: `users`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `email` | `String` | ❌ False | ✅ True |
| `username` | `String` | ❌ False | ✅ True |
| `displayName` | `String` | ❌ False | ❌ False |
| `profileImageUrl` | `String` | ❌ False | ❌ False |
| `avatarConfig` | `String` | ❌ False | ❌ False |
| `style` | `String` | ❌ False | ❌ False |
| `backgroundColor` | `String` | ❌ False | ❌ False |
| `textColor` | `String` | ❌ False | ❌ False |
| `pattern` | `String` | ❌ False | ❌ False |
| `preferences` | `String` | ❌ False | ❌ False |
| `language` | `String` | ❌ False | ❌ False |
| `notifications` | `Boolean` | ❌ False | ❌ False |
| `privacy` | `Boolean` | ❌ False | ❌ False |
| `showOnlineStatus` | `Boolean` | ❌ False | ❌ False |
| `password` | `String` | ✅ True | ❌ False |
| `createdAt` | `Date` | ❌ False | ❌ False |
| `lastLogin` | `Date` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|

## Collection: `usersessions`
### Schema Fields
| Field | Type | Required | Unique |
|---|---|---|---|
| `userId` | `String` | ✅ True | ❌ False |
| `refreshToken` | `String` | ✅ True | ✅ True |
| `deviceIdentifier` | `String` | ✅ True | ❌ False |
| `userAgent` | `String` | ❌ False | ❌ False |
| `ipAddress` | `String` | ❌ False | ❌ False |
| `usedRefreshTokens` | `[String]` | ❌ False | ❌ False |
| `expiresAt` | `Date` | ✅ True | ❌ False |
| `isRevoked` | `Boolean` | ❌ False | ❌ False |

### Configured Indexes
| Keys | Options |
|---|---|
| `userId: 1` | `{}` |
| `usedRefreshTokens: 1` | `{}` |
| `deviceIdentifier: 1` | `{}` |
| `userId: 1, deviceIdentifier: 1, isRevoked: 1` | `{}` |
