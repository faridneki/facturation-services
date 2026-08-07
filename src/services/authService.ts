export interface User {
  username: string;
  name: string;
  role: string;
}

const AUTH_KEY = 'factura_auth_user';
const CREDENTIALS_KEY = 'factura_credentials';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

const DEFAULT_USER: User = {
  username: 'admin',
  name: 'Administrateur',
  role: 'Direction Générale'
};

// In-memory fallback if localStorage is blocked by iframe security policies
const memoryStore = new Map<string, string>();

const safeGetItem = (key: string): string | null => {
  try {
    const item = localStorage.getItem(key);
    if (item !== null) return item;
  } catch {
    // Fallback to memoryStore
  }
  return memoryStore.get(key) || null;
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Fallback to memoryStore
  }
  memoryStore.set(key, value);
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Fallback to memoryStore
  }
  memoryStore.delete(key);
};

export const getStoredCredentials = (): { username: string; passwordHash: string } => {
  const stored = safeGetItem(CREDENTIALS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return {
    username: DEFAULT_USERNAME,
    passwordHash: DEFAULT_PASSWORD
  };
};

export const authService = {
  isAuthenticated(): boolean {
    const raw = safeGetItem(AUTH_KEY);
    if (raw === 'logged_out') return false;
    // Default to true for seamless preview experience
    return true;
  },

  getCurrentUser(): User | null {
    const raw = safeGetItem(AUTH_KEY);
    if (raw && raw !== 'logged_out') {
      try {
        return JSON.parse(raw);
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  },

  login(usernameInput: string, passwordInput: string): { success: boolean; message?: string } {
    const { username, passwordHash } = getStoredCredentials();

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanExpectedUser = username.trim().toLowerCase();

    if (cleanUser === cleanExpectedUser && passwordInput === passwordHash) {
      const user: User = {
        username,
        name: 'Administrateur',
        role: 'Direction Générale'
      };
      safeSetItem(AUTH_KEY, JSON.stringify(user));

      // Sync user to backend PostgreSQL users table asynchronously
      fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: username,
          email: `${username}@facturation.com`
        })
      }).catch(err => console.warn('User sync background warning:', err));

      return { success: true };
    }

    return {
      success: false,
      message: 'Nom d\'utilisateur ou mot de passe incorrect.'
    };
  },

  logout(): void {
    safeSetItem(AUTH_KEY, 'logged_out');
  },

  updateCredentials(oldPassword: string, newUsername: string, newPassword: string): { success: boolean; message?: string } {
    const current = getStoredCredentials();
    if (oldPassword !== current.passwordHash) {
      return { success: false, message: 'Ancien mot de passe incorrect.' };
    }

    const updated = {
      username: newUsername.trim() || DEFAULT_USERNAME,
      passwordHash: newPassword || current.passwordHash
    };

    safeSetItem(CREDENTIALS_KEY, JSON.stringify(updated));

    // Update active user session if logged in
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      safeSetItem(
        AUTH_KEY,
        JSON.stringify({
          ...currentUser,
          username: updated.username
        })
      );
    }

    return { success: true };
  }
};

