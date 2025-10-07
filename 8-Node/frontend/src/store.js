import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create()(
  persist(
    (set) => ({
      token: "12345",
      setToken: (token) => set(() => ({ token })),
    }),
    {
      name: "app-storage",
    }
  )
);

export default useAppStore;
