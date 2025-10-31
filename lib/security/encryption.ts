import CryptoJS from 'crypto-js';

// ============================================================================
// Data Encryption Class
// ============================================================================

export class DataEncryption {
  private static SECRET_KEY =
    process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'medical-products-default-key-change-in-production';

  /**
   * Encrypts data using AES encryption
   */
  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, this.SECRET_KEY).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data encrypted with AES
   */
  static decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);

      if (!jsonString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypts a string value
   */
  static encryptString(value: string): string {
    try {
      return CryptoJS.AES.encrypt(value, this.SECRET_KEY).toString();
    } catch (error) {
      console.error('String encryption error:', error);
      throw new Error('Failed to encrypt string');
    }
  }

  /**
   * Decrypts a string value
   */
  static decryptString(encryptedValue: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      return decrypted;
    } catch (error) {
      console.error('String decryption error:', error);
      throw new Error('Failed to decrypt string');
    }
  }

  /**
   * Hashes data using SHA256
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Creates HMAC signature
   */
  static createHMAC(data: string, key?: string): string {
    const secretKey = key || this.SECRET_KEY;
    return CryptoJS.HmacSHA256(data, secretKey).toString();
  }

  /**
   * Verifies HMAC signature
   */
  static verifyHMAC(data: string, signature: string, key?: string): boolean {
    const expectedSignature = this.createHMAC(data, key);
    return expectedSignature === signature;
  }

  /**
   * Generates random encryption key
   */
  static generateKey(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Encrypts sensitive customer data
   */
  static encryptCustomerData(customer: any): any {
    return {
      ...customer,
      taxId: customer.taxId ? this.encryptString(customer.taxId) : undefined,
      creditLimit: customer.creditLimit
        ? this.encryptString(customer.creditLimit.toString())
        : undefined,
      email: customer.email ? this.encryptString(customer.email) : undefined,
    };
  }

  /**
   * Decrypts sensitive customer data
   */
  static decryptCustomerData(customer: any): any {
    return {
      ...customer,
      taxId: customer.taxId ? this.decryptString(customer.taxId) : undefined,
      creditLimit: customer.creditLimit
        ? parseFloat(this.decryptString(customer.creditLimit))
        : undefined,
      email: customer.email ? this.decryptString(customer.email) : undefined,
    };
  }

  /**
   * Encrypts sensitive patient data
   */
  static encryptPatientData(patient: any): any {
    return {
      ...patient,
      nationalId: patient.nationalId
        ? this.encryptString(patient.nationalId)
        : undefined,
      email: patient.email ? this.encryptString(patient.email) : undefined,
      phone: patient.phone ? this.encryptString(patient.phone) : undefined,
      address: patient.address ? this.encryptString(patient.address) : undefined,
    };
  }

  /**
   * Decrypts sensitive patient data
   */
  static decryptPatientData(patient: any): any {
    return {
      ...patient,
      nationalId: patient.nationalId
        ? this.decryptString(patient.nationalId)
        : undefined,
      email: patient.email ? this.decryptString(patient.email) : undefined,
      phone: patient.phone ? this.decryptString(patient.phone) : undefined,
      address: patient.address ? this.decryptString(patient.address) : undefined,
    };
  }

  /**
   * Encrypts payment information
   */
  static encryptPaymentData(payment: any): any {
    return {
      ...payment,
      referenceNumber: payment.referenceNumber
        ? this.encryptString(payment.referenceNumber)
        : undefined,
    };
  }

  /**
   * Decrypts payment information
   */
  static decryptPaymentData(payment: any): any {
    return {
      ...payment,
      referenceNumber: payment.referenceNumber
        ? this.decryptString(payment.referenceNumber)
        : undefined,
    };
  }
}

// ============================================================================
// Password Hashing Utilities
// ============================================================================

export class PasswordHasher {
  /**
   * Hashes password with salt
   */
  static hash(password: string, salt?: string): { hash: string; salt: string } {
    const passwordSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(password, passwordSalt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();

    return { hash, salt: passwordSalt };
  }

  /**
   * Verifies password against hash
   */
  static verify(password: string, hash: string, salt: string): boolean {
    const { hash: newHash } = this.hash(password, salt);
    return newHash === hash;
  }

  /**
   * Generates random password
   */
  static generatePassword(length: number = 12): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }
}

// ============================================================================
// Token Generation
// ============================================================================

export class TokenGenerator {
  /**
   * Generates random token
   */
  static generate(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Generates JWT-like token (simplified)
   */
  static generateJWT(payload: any, expiresIn: number = 3600): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    const encodedHeader = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(header))
    );
    const encodedPayload = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(tokenPayload))
    );

    const signature = DataEncryption.createHMAC(
      `${encodedHeader}.${encodedPayload}`
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies JWT-like token
   */
  static verifyJWT(token: string): { valid: boolean; payload?: any } {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');

      // Verify signature
      const expectedSignature = DataEncryption.createHMAC(
        `${encodedHeader}.${encodedPayload}`
      );

      if (signature !== expectedSignature) {
        return { valid: false };
      }

      // Decode payload
      const payloadString = CryptoJS.enc.Base64.parse(encodedPayload).toString(
        CryptoJS.enc.Utf8
      );
      const payload = JSON.parse(payloadString);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }
}

// ============================================================================
// Secure Storage
// ============================================================================

export class SecureStorage {
  /**
   * Stores encrypted data in localStorage
   */
  static setItem(key: string, value: any): void {
    try {
      const encrypted = DataEncryption.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage set error:', error);
      throw new Error('Failed to store data securely');
    }
  }

  /**
   * Retrieves and decrypts data from localStorage
   */
  static getItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      return DataEncryption.decrypt(encrypted) as T;
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }

  /**
   * Removes item from localStorage
   */
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all items from localStorage
   */
  static clear(): void {
    localStorage.clear();
  }
}
