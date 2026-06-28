import { Schema, model, Document } from "mongoose";

export interface ITokenMetadata extends Document {
    chainId: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    updatedAt: Date;
}

const tokenMetadataSchema = new Schema<ITokenMetadata>({
    chainId: { type: Number, required: true },
    address: { type: String, required: true, lowercase: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    decimals: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
});

tokenMetadataSchema.index({ chainId: 1, address: 1 }, { unique: true });

export const TokenMetadataModel = model<ITokenMetadata>("TokenMetadata", tokenMetadataSchema);
