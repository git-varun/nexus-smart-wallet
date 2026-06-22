import { SessionKeyModel, ISessionKey, ISessionPermission } from "../models";

export async function createSessionKey(data: Partial<ISessionKey>): Promise<ISessionKey> {
    const sessionKey = new SessionKeyModel(data);
    return sessionKey.save();
}

export async function findSessionKeyById(id: string): Promise<ISessionKey | null> {
    return SessionKeyModel.findById(id);
}

export async function findSessionKeyByPublicKey(publicKey: string): Promise<ISessionKey | null> {
    return SessionKeyModel.findOne({ publicKey: publicKey.toLowerCase() });
}

export async function findSessionKeysByOwner(ownerAddress: string, chainId: number): Promise<ISessionKey[]> {
    return SessionKeyModel.find({ ownerAddress: ownerAddress.toLowerCase(), chainId });
}

export async function revokeSessionKey(publicKey: string): Promise<ISessionKey | null> {
    return SessionKeyModel.findOneAndUpdate(
        { publicKey: publicKey.toLowerCase() },
        { $set: { isActive: false, revokedAt: new Date() } },
        { new: true }
    );
}

export async function updateSessionKeyPermissions(id: string, permissions: ISessionPermission[]): Promise<ISessionKey | null> {
    return SessionKeyModel.findByIdAndUpdate(
        id,
        { $set: { permissions } },
        { new: true }
    );
}

export async function findSessionKeyByIdAndUser(id: string, userId: string): Promise<ISessionKey | null> {
    const query = id.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: id, userId }
        : { publicKey: id.toLowerCase(), userId };
    return SessionKeyModel.findOne(query);
}

export async function findSessionKeysByUser(userId: string, filter?: { ownerAddress?: string; chainId?: number }): Promise<ISessionKey[]> {
    const query: any = { userId };
    if (filter?.ownerAddress) query.ownerAddress = filter.ownerAddress.toLowerCase();
    if (filter?.chainId) query.chainId = filter.chainId;
    return SessionKeyModel.find(query);
}

export async function deleteSessionKeyByIdAndUser(id: string, userId: string): Promise<ISessionKey | null> {
    const query = id.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: id, userId }
        : { publicKey: id.toLowerCase(), userId };
    return SessionKeyModel.findOneAndUpdate(
        query,
        { $set: { isActive: false, revokedAt: new Date() } },
        { new: true }
    );
}
