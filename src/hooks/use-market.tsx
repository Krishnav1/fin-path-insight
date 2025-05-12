"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Market = "global" | "india"

type MarketProviderProps = {
  children: React.ReactNode
  defaultMarket?: Market
  storageKey?: string
}

type MarketProviderState = {
  market: Market
  setMarket: (market: Market) => void
}

const initialState: MarketProviderState = {
  market: "global",
  setMarket: () => null,
}

const MarketProviderContext = createContext<MarketProviderState>(initialState)

export function MarketProvider({
  children,
  defaultMarket = "global",
  storageKey = "fin-insight-market",
  ...props
}: MarketProviderProps) {
  const [market, setMarket] = useState<Market>(
    () => (localStorage.getItem(storageKey) as Market) || defaultMarket
  )

  useEffect(() => {
    if (market) {
      localStorage.setItem(storageKey, market)
    }
  }, [market, storageKey])

  // Initialize market on page load
  useEffect(() => {
    // Apply market from localStorage on initial render
    const savedMarket = localStorage.getItem(storageKey) as Market
    if (savedMarket) {
      setMarket(savedMarket)
    } else if (defaultMarket) {
      localStorage.setItem(storageKey, defaultMarket)
      setMarket(defaultMarket)
    }
  }, [defaultMarket, storageKey])

  const value = {
    market,
    setMarket: (market: Market) => {
      localStorage.setItem(storageKey, market)
      setMarket(market)
    },
  }

  return (
    <MarketProviderContext.Provider {...props} value={value}>
      {children}
    </MarketProviderContext.Provider>
  )
}

export const useMarket = () => {
  const context = useContext(MarketProviderContext)

  if (context === undefined)
    throw new Error("useMarket must be used within a MarketProvider")

  return context
}
