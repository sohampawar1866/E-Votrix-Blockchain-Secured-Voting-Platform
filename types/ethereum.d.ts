interface Window {
  ethereum?: {
    isMetaMask?: boolean
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (...args: any[]) => void) => void
    removeListener: (event: string, callback: (...args: any[]) => void) => void
    removeAllListeners: (event?: string) => void
  }
}

declare global {
  interface Window {
    ethereum?: Window["ethereum"]
  }
}

export {}
