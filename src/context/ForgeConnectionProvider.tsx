import { createContext, ReactNode, useState } from 'react';
import { PAT_KEY } from '../services/types';

interface ForgeConnection {
  isActive: boolean;
  connectToForge: () => void;
}

export const ForgeConnectionContext = createContext<ForgeConnection>({
  isActive: false,
  connectToForge: () => {},
});

export function ForgeConnectionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [isActive, setIsActive] = useState<boolean>(() => !!sessionStorage.getItem(PAT_KEY));

  const connectToForge = () => {
    setIsActive(true);
  };

  return (
    <ForgeConnectionContext.Provider value={{ isActive, connectToForge }}>
      {children}
    </ForgeConnectionContext.Provider>
  );
}
