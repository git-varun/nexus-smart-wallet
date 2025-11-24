// ------------------ Email ------------------
export function isEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ------------------ Username ------------------
export function isUsername(username: string): boolean {
    return /^[a-zA-Z0-9._-]{3,30}$/.test(username);
}

// ------------------ Strong Password ------------------
export function isStrongPassword(password: string): boolean {
    return (
        typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 64 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
}

// ------------------ Medium Password ------------------
export function isMediumPassword(password: string): boolean {
    return (
        typeof password === "string" &&
        password.length >= 6 &&
        /[a-zA-Z]/.test(password) &&
        /\d/.test(password)
    );
}

// ------------------ Phone (India default) ------------------
export function isPhone(phone: string, pattern: RegExp = /^[6-9]\d{9}$/): boolean {
    return pattern.test(phone);
}

// ------------------ Required ------------------
export function isRequired(value: any): boolean {
    return value !== undefined && value !== null && value !== "";
}

// ------------------ Alphanumeric ------------------
export function isAlphanumeric(val: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(val);
}

// ------------------ URL ------------------
export function isURL(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ------------------ ETH Wallet Address ------------------
export function isEthAddress(addr: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
}
