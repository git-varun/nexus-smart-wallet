import mongoose, { Schema, Document } from 'mongoose';

export interface IRevokedToken extends Document {
    token: string;
    expiresAt: Date;
}

const RevokedTokenSchema = new Schema<IRevokedToken>({
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
});

// TTL index to automatically remove expired blacklisted tokens
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedTokenModel = mongoose.model<IRevokedToken>('RevokedToken', RevokedTokenSchema);
