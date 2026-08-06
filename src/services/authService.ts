export interface User {
  username: string;
  name: string;
  role: string;
}

const AUTH_KEY = 'factura_auth_user';
const CREDENTIALS_KEY = 'factura_credentials';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

export const getStoredCredentials = (): { username: string; passwordHash: string } => {
  const stored = localStorage.getItem(CREDENTIALS_KEY);
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
    return localStorage.getItem(AUTH_KEY) !== null;
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));

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
    localStorage.removeItem(AUTH_KEY);
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

    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updated));

    // Update active user session if logged in
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      localStorage.setItem(
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
