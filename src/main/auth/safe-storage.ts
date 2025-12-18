import { ipcMain, safeStorage } from 'electron';

export const registerSaveStorageHandler = (): void => {
  // Implementation for registering safe storage handler
  ipcMain.handle('safe-storage-encrypt', async (_, _key: string, value: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn(
        'safeStorage is not available on this OS, falling back to plaintext (NOT RECOMMENDED for prod)'
      );
      return value; // Fallback for dev/linux without keyring
    }
    // safeStorage works with Buffers. We encrypt the string to a buffer.
    const encryptedBuffer = safeStorage.encryptString(value);
    // We return a hex string so it can be easily sent over IPC
    return encryptedBuffer.toString('hex');
  });

  ipcMain.handle('safe-storage-decrypt', async (_, _key: string, hexString: string) => {
    if (!safeStorage.isEncryptionAvailable()) return hexString;

    try {
      const encryptedBuffer = Buffer.from(hexString, 'hex');
      const decryptedString = safeStorage.decryptString(encryptedBuffer);
      return decryptedString;
    } catch {
      // If decryption fails (e.g. machine changed), return null so app logs user out
      return null;
    }
  });
};
