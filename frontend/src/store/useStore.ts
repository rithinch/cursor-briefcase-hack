import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Application } from '../types';

interface StoredApp extends Application {
  api_key_visible?: string;
}

interface AppState {
  user: User | null;
  applications: StoredApp[];

  setUser: (user: User) => void;
  clearUser: () => void;

  setApplications: (apps: Application[]) => void;
  addApplication: (app: Application & { api_key?: string }) => void;
  updateApplication: (app: Application) => void;
  removeApplication: (appId: string) => void;
  setApiKey: (appId: string, key: string) => void;
  clearApiKey: (appId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      applications: [],

      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null, applications: [] }),

      setApplications: (apps) =>
        set((s) => ({
          applications: apps.map((a) => {
            const existing = s.applications.find((e) => e.id === a.id);
            return { ...a, api_key_visible: existing?.api_key_visible };
          }),
        })),

      addApplication: (app) =>
        set((s) => ({
          applications: [
            { ...app, api_key_visible: app.api_key },
            ...s.applications,
          ],
        })),

      updateApplication: (app) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === app.id ? { ...app, api_key_visible: a.api_key_visible } : a
          ),
        })),

      removeApplication: (appId) =>
        set((s) => ({
          applications: s.applications.filter((a) => a.id !== appId),
        })),

      setApiKey: (appId, key) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === appId ? { ...a, api_key_visible: key } : a
          ),
        })),

      clearApiKey: (appId) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === appId ? { ...a, api_key_visible: undefined } : a
          ),
        })),
    }),
    {
      name: 'pulp-store',
      partialize: (s) => ({ user: s.user, applications: s.applications }),
    }
  )
);
