import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'agent' | 'confirmatrice1' | 'confirmatrice2' | 'admin' | 'qualite' | 'technique';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<string, { password: string; user: User }> = {
  'agent@ebi.com': {
    password: 'agent123',
    user: { id: '1', name: 'agent 1', email: 'agent@ebi.com', role: 'agent' }
  },
  'conf1@ebi.com': {
    password: 'conf123',
    user: { id: '2', name: 'confirmatrice 1', email: 'conf1@ebi.com', role: 'confirmatrice1' }
  },
  'conf2@ebi.com': {
    password: 'conf123',
    user: { id: '3', name: 'confirmatrice 2', email: 'conf2@ebi.com', role: 'confirmatrice2' }
  },
  'admin@ebi.com': {
    password: 'admin123',
    user: { id: '4', name: 'admin ',  email: 'admin@ebi.com', role: 'admin' }
  },
  'qualite@ebi.com': {
    password: 'qualite123',
    user: { id: '5', name: 'service qualité ', email: 'qualite@ebi.com', role: 'qualite' }
  },
  'tech@ebi.com': {
    password: 'tech123',
    user: { id: '6', name: 'technique 1', email: 'tech@ebi.com', role: 'technique' }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    const userEntry = mockUsers[email];
    if (userEntry && userEntry.password === password) {
      setUser(userEntry.user);
      localStorage.setItem('user', JSON.stringify(userEntry.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
