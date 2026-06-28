const getSessionEncryptionKey = (): string => {
    let key = sessionStorage.getItem('nexus_session_enc_key');
    if (!key) {
        key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('nexus_session_enc_key', key);
    }
    return key;
};

export const encryptPrivateKey = (pk: string): string => {
    const key = getSessionEncryptionKey();
    let result = '';
    for (let i = 0; i < pk.length; i++) {
        const charCode = pk.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return btoa(result);
};

export const decryptPrivateKey = (encrypted: string): string | null => {
    try {
        const key = getSessionEncryptionKey();
        const raw = atob(encrypted);
        let result = '';
        for (let i = 0; i < raw.length; i++) {
            const charCode = raw.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch {
        return null;
    }
};
