
import { User } from '../types';

const SESSION_STORAGE_KEY = 'netops_ai_user';

const DUMMY_USERS: (User & { password: string })[] = [
    { id: 1, username: 'admin', password: 'adminpass' },
    { id: 2, username: 'neteng', password: 'netengpass' },
    { id: 3, username: 'operator', password: 'oppass' },
    { id: 4, username: 'guest', password: 'guestpass' },
];

export const login = (user: User) => {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
};

export const logout = () => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
  const userJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Failed to parse user from session storage', e);
      return null;
    }
  }
  return null;
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
    // Simple in-memory authentication, no database needed.
    const userRecord = DUMMY_USERS.find(u => u.username === username);

    if (userRecord && userRecord.password === password) {
        // Return user object without password
        const { password, ...userToReturn } = userRecord;
        return userToReturn;
    }
    return null;
};
