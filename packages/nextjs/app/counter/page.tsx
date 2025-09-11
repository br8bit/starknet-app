"use client";

import { useDeployedContractInfo } from "~~/hooks/scaffold-stark/useDeployedContractInfo";
import { ContractCodeStatus } from "~~/utils/scaffold-stark/contract";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import dynamic from "next/dynamic";
import { Counter } from "~~/components/counter";

// const Counter = dynamic(
//   () => import("~~/components/counter/Counter").then((mod) => mod.Counter)
// );

export default function CounterPage() {
  const { targetNetwork } = useTargetNetwork();
  const { status } = useDeployedContractInfo("CounterContract");
  
  // Extract network name safely
  const networkName = targetNetwork?.name?.toString() || targetNetwork?.network?.toString() || 'Unknown';

  if (status === ContractCodeStatus.NOT_FOUND) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Contract Not Found</h1>
        <p className="text-lg mb-4">
          No contract found by the name of "CounterContract" on chain "{networkName}"!
        </p>
        <p>Please deploy the contract first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <Counter />
    </div>
  );
}