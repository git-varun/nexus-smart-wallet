import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSession extends Document {
    userId: string;
    refreshToken: string;
    deviceIdentifier: string;
    userAgent?: string;
    ipAddress?: string;
    usedRefreshTokens: string[];
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>({
    userId: { type: String, required: true },
    refreshToken: { type: String, required: true, unique: true },
    deviceIdentifier: { type: String, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    usedRefreshTokens: { type: [String], default: [] },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Indexing for performance and index reports
UserSessionSchema.index({ userId: 1 });
UserSessionSchema.index({ usedRefreshTokens: 1 });
UserSessionSchema.index({ deviceIdentifier: 1 });
UserSessionSchema.index({ userId: 1, deviceIdentifier: 1, isRevoked: 1 });

export const UserSessionModel = mongoose.model<IUserSession>('UserSession', UserSessionSchema);
