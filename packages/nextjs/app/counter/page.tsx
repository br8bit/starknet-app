"use client";

import { useDeployedContractInfo } from "~~/hooks/scaffold-stark/useDeployedContractInfo";
import { ContractCodeStatus } from "~~/utils/scaffold-stark/contract";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import dynamic from "next/dynamic";
import { Counter } from "~~/components/counter";
import { useTheme } from "next-themes";
import { useEffect } from "react";

// const Counter = dynamic(
//   () => import("~~/components/counter/Counter").then((mod) => mod.Counter)
// );

export default function CounterPage() {
  const { targetNetwork } = useTargetNetwork();
  const { status } = useDeployedContractInfo("CounterContract");
  const { theme, setTheme } = useTheme();
  
  // Enforce dark theme on this page
  useEffect(() => {
    if (theme !== "dark") {
      setTheme("dark");
    }
  }, [theme, setTheme]);
  
  // Extract network name safely
  const networkName = targetNetwork?.name?.toString() || targetNetwork?.network?.toString() || 'Unknown';

  if (status === ContractCodeStatus.NOT_FOUND) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-700">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Contract Not Found</h1>
          <p className="text-lg mb-4 text-center text-gray-300">
            No contract found by the name of "CounterContract" on chain "{networkName}"!
          </p>
          <p className="text-center text-gray-400">Please deploy the contract first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 bg-gray-900 min-h-screen">
      <div className="w-full max-w-4xl px-4">
        <Counter />
      </div>
    </div>
  );
}