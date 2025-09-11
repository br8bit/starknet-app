"use client";

import { useState, useEffect } from "react";
import { useAccount } from "~~/hooks/useAccount";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-stark";
import { IntegerInput } from "~~/components/scaffold-stark/Input/IntegerInput";
import { Address } from "~~/components/scaffold-stark";
import { EventItem } from "./EventItem";

export const Counter = () => {
  const { account } = useAccount();
  const [newCounterValue, setNewCounterValue] = useState<string | bigint>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Read contract data
  const { data: counterValue, refetch: refetchCounter } = useScaffoldReadContract({
    contractName: "CounterContract",
    functionName: "get_counter",
  });

  // Get contract owner
  const { data: contractOwner } = useScaffoldReadContract({
    contractName: "CounterContract",
    functionName: "owner",
  });

  // Check if current user is the owner
  const isOwner = account?.address && contractOwner && 
    BigInt(account.address) === BigInt(contractOwner as string);

  // Write contract functions
  const { sendAsync: increment, isPending: isIncrementing } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "increment",
    args: [],
  });

  const { sendAsync: decrement, isPending: isDecrementing } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "decrement",
    args: [],
  });

  const { sendAsync: setCounter, isPending: isSetting } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "set_counter",
    args: [0n], // Placeholder, will be overridden when calling
  });

  const { sendAsync: reset, isPending: isResetting } = useScaffoldWriteContract({
    contractName: "CounterContract",
    functionName: "reset",
    args: [],
  });

  // Get contract events
  const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "CounterContract",
    eventName: "CounterChanged",
    fromBlock: 0n,
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleIncrement = async () => {
    try {
      await increment();
      setSuccess("Counter incremented successfully!");
      refetchCounter();
    } catch (e: any) {
      console.error("Error incrementing counter:", e);
      setError(e.message || "Error incrementing counter");
    }
  };

  const handleDecrement = async () => {
    try {
      await decrement();
      setSuccess("Counter decremented successfully!");
      refetchCounter();
    } catch (e: any) {
      console.error("Error decrementing counter:", e);
      setError(e.message || "Error decrementing counter");
    }
  };

  const handleSetCounter = async () => {
    if (!newCounterValue) {
      setError("Please enter a value");
      return;
    }

    try {
      // Convert to BigInt if it's a string
      const value = typeof newCounterValue === 'string' ? BigInt(newCounterValue) : newCounterValue;
      await setCounter({ args: [value] });
      setSuccess("Counter value set successfully!");
      setNewCounterValue("");
      refetchCounter();
    } catch (e: any) {
      console.error("Error setting counter:", e);
      // Provide more specific error message for common reset issues
      if (e.message && e.message.includes("Insufficient token allowance")) {
        setError("Insufficient STRK token allowance. You need to approve the contract to spend 1 STRK token. Please ensure you have at least 1 STRK token and have approved the contract to spend it.");
      } else if (e.message && e.message.includes("Insufficient token balance")) {
        setError("Insufficient STRK token balance. You need at least 1 STRK token to reset the counter.");
      } else {
        setError(e.message || "Error setting counter");
      }
    }
  };

  const handleReset = async () => {
    try {
      await reset();
      setSuccess("Counter reset successfully!");
      refetchCounter();
    } catch (e: any) {
      console.error("Error resetting counter:", e);
      // Provide more specific error message for common reset issues
      if (e.message && e.message.includes("Insufficient token allowance")) {
        setError("Insufficient STRK token allowance. You need to approve the contract to spend 1 STRK token. Please ensure you have at least 1 STRK token and have approved the contract to spend it.");
      } else if (e.message && e.message.includes("Insufficient token balance")) {
        setError("Insufficient STRK token balance. You need at least 1 STRK token to reset the counter.");
      } else {
        setError(e.message || "Error resetting counter. Make sure you have at least 1 STRK token and have approved the contract to spend it.");
      }
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Main Counter Card */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700 shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-white mb-6">Counter Contract</h2>
          
          {/* Display Counter Value */}
          <div className="text-7xl font-bold my-8 text-white">
            {counterValue !== undefined ? counterValue.toString() : "Loading..."}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-8 w-full max-w-md">
            <button
              className="flex-1 min-w-[100px] py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleIncrement}
              disabled={isIncrementing}
            >
              {isIncrementing ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Increase"
              )}
            </button>
            
            <button
              className="flex-1 min-w-[100px] py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDecrement}
              disabled={isDecrementing}
            >
              {isDecrementing ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Decrease"
              )}
            </button>
            
            <button
              className="flex-1 min-w-[100px] py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Reset"
              )}
            </button>
          </div>
          
          {/* Set Counter (Owner only) */}
          {isOwner && (
            <div className="w-full max-w-md bg-gray-700 rounded-xl p-6 mb-6 border border-gray-600">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">Owner Functions</h3>
                <p className="text-sm text-gray-300">Set counter to any value</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <div className="w-full">
                  <IntegerInput
                    value={newCounterValue}
                    onChange={setNewCounterValue}
                    placeholder="New counter value"
                    disabled={isSetting}
                    className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  className="w-full sm:w-auto py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSetCounter}
                  disabled={isSetting}
                >
                  {isSetting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Set"
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Display Owner Address */}
          <div className="w-full max-w-md bg-gray-700 rounded-xl p-4 mb-4 border border-gray-600">
            <div className="text-sm font-semibold text-gray-300 mb-1">Contract Owner</div>
            <div className="text-xs">
              <Address address={contractOwner ? `0x${contractOwner.toString(16)}` : ""} />
            </div>
            {isOwner && (
              <div className="mt-2 px-2 py-1 bg-green-900 text-green-300 text-xs rounded">You are the owner</div>
            )}
          </div>
          
          {/* Display Messages */}
          {error && (
            <div className="alert bg-red-900/50 border border-red-700 text-red-200 shadow-lg mb-4 rounded-xl w-full max-w-md">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {success && (
            <div className="alert bg-green-900/50 border border-green-700 text-green-200 shadow-lg mb-4 rounded-xl w-full max-w-md">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm">{success}</span>
              </div>
            </div>
          )}
          
          {/* Reset Instructions */}
          <div className="w-full max-w-md bg-amber-900/30 border border-amber-700 rounded-xl p-4 mt-4">
            <h3 className="font-bold text-amber-300 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Reset Function Requirements
            </h3>
            <ul className="text-sm text-amber-200 list-disc list-inside space-y-1">
              <li>At least 1 STRK token in your wallet</li>
              <li>Approve the contract to spend 1 STRK token</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Events Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Counter Events</h3>
          <div className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
            {events ? events.length : 0} events
          </div>
        </div>
        
        {isLoadingEvents ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-indigo-500"></span>
          </div>
        ) : events && events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No events found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {events && events.map((event: any, index: number) => (
              <EventItem key={index} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
