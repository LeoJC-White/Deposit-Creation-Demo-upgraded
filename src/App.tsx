/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Banknote, 
  Building2, 
  TrendingUp, 
  Info,
  RefreshCcw,
  PlusCircle,
  Coins,
  User
} from 'lucide-react';
import { BalanceSheet, BankState, SimulationStep } from './types';

const INITIAL_DEPOSIT = 1000;
const DEFAULT_RESERVE_RATIO = 0.9;

// Mini Character Component
const PixelCharacter = ({ direction = 1, isCarrying = false }: { direction?: number, isCarrying?: boolean }) => (
  <motion.div 
    className="relative"
    animate={{ y: [0, -4, 0] }}
    transition={{ duration: 0.4, repeat: Infinity }}
  >
    {/* Body */}
    <div className="w-6 h-8 bg-amber-200 border-2 border-slate-900 rounded-sm relative">
      {/* Eyes */}
      <div className={`absolute top-1 ${direction > 0 ? 'right-1' : 'left-1'} flex gap-0.5`}>
        <div className="w-1 h-1 bg-slate-900"></div>
        <div className="w-1 h-1 bg-slate-900"></div>
      </div>
      {/* Money if carrying */}
      {isCarrying && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-4 -right-2 bg-emerald-400 border border-slate-900 p-0.5"
          style={{ backgroundColor: direction === -100 ? '#ef4444' : '#34d399' }} // Visual hint for negative flow? No, direction is just 1 or -1.
        >
          <Coins className="w-3 h-3 text-emerald-900" />
        </motion.div>
      )}
    </div>
    {/* Legs */}
    <div className="flex justify-between px-1 -mt-1">
      <motion.div 
        animate={{ y: [2, 0, 2] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        className="w-1.5 h-2 bg-slate-900"
      />
      <motion.div 
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        className="w-1.5 h-2 bg-slate-900"
      />
    </div>
  </motion.div>
);

const MoneyFlowAnimation = ({ currentStep, mode }: { currentStep: SimulationStep; mode: 'EXPANSION' | 'CONTRACTION' }) => {
  const [pathData, setPathData] = useState<string | null>(null);
  const [points, setPoints] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [isReverse, setIsReverse] = useState(false);
  const isContractionRepayment = !!(mode === 'CONTRACTION' && currentStep.actionType === 'DEPOSIT' && currentStep.highlightedBankId);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePath = () => {
      // For DEPOSIT (Expansion)
      if (mode === 'EXPANSION' && currentStep.actionType === 'DEPOSIT' && currentStep.highlightedBankId && currentStep.highlightedBankId > 1) {
        setIsReverse(false);
        const prevBankId = currentStep.highlightedBankId - 1;
        const nextBankId = currentStep.highlightedBankId;
        
        const sourceEl = document.getElementById(`bank-${prevBankId}-loans`);
        const targetEl = document.getElementById(`bank-${nextBankId}-deposits`);
        
        const sourceCard = document.getElementById(`bank-card-${prevBankId}`);
        const targetCard = document.getElementById(`bank-card-${nextBankId}`);
        
        if (sourceEl && targetEl && sourceCard && targetCard && containerRef.current) {
          const sRect = sourceEl.getBoundingClientRect();
          const tRect = targetEl.getBoundingClientRect();
          const scRect = sourceCard.getBoundingClientRect();
          const tcRect = targetCard.getBoundingClientRect();
          const cRect = containerRef.current.getBoundingClientRect();
          
          const x1 = sRect.left + sRect.width / 2 - cRect.left;
          const y1 = sRect.bottom - cRect.top + 5;
          const x2 = tRect.left + tRect.width / 2 - cRect.left;
          const y2 = tRect.bottom - cRect.top + 5;

          setPoints({ x1, y1, x2, y2 });

          const scBottom = scRect.bottom - cRect.top;
          const tcBottom = tcRect.bottom - cRect.top;
          const margin = 20;
          const lowY = Math.max(scBottom, tcBottom) + margin;
          const r = 20;

          const d = `M ${x1} ${y1} L ${x1} ${lowY - r} Q ${x1} ${lowY}, ${x1 + (x2 > x1 ? r : -r)} ${lowY} L ${x2 - (x2 > x1 ? r : -r)} ${lowY} Q ${x2} ${lowY}, ${x2} ${lowY - r} L ${x2} ${y2}`;
          setPathData(d);
        }
      } 
      // For REPAYMENT (Contraction) - Money moving from Bank n+1 deposits BACK to Bank n loans
      else if (isContractionRepayment) {
        setIsReverse(true);
        const targetBankId = currentStep.highlightedBankId!;
        const sourceBankId = targetBankId + 1;
        
        const sourceEl = document.getElementById(`bank-${sourceBankId}-deposits`);
        const targetEl = document.getElementById(`bank-${targetBankId}-loans`);
        
        const sourceCard = document.getElementById(`bank-card-${sourceBankId}`);
        const targetCard = document.getElementById(`bank-card-${targetBankId}`);
        
        if (sourceEl && targetEl && sourceCard && targetCard && containerRef.current) {
          const sRect = sourceEl.getBoundingClientRect();
          const tRect = targetEl.getBoundingClientRect();
          const scRect = sourceCard.getBoundingClientRect();
          const tcRect = targetCard.getBoundingClientRect();
          const cRect = containerRef.current.getBoundingClientRect();
          
          // FOR CONTRACTION: Path starts at Source (Bank n+1) and ends at Target (Bank n)
          // This way markerEnd points to the target bank (Bank n)
          const x1 = sRect.left + sRect.width / 2 - cRect.left;
          const y1 = sRect.bottom - cRect.top + 5;
          const x2 = tRect.left + tRect.width / 2 - cRect.left;
          const y2 = tRect.bottom - cRect.top + 5;

          setPoints({ x1, y1, x2, y2 });

          const scBottom = scRect.bottom - cRect.top;
          const tcBottom = tcRect.bottom - cRect.top;
          const margin = 20;
          const lowY = Math.max(scBottom, tcBottom) + margin;
          const r = 20;

          // Universal path logic that handles both directions
          const d = `M ${x1} ${y1} L ${x1} ${lowY - r} Q ${x1} ${lowY}, ${x1 + (x2 > x1 ? r : -r)} ${lowY} L ${x2 - (x2 > x1 ? r : -r)} ${lowY} Q ${x2} ${lowY}, ${x2} ${lowY - r} L ${x2} ${y2}`;
          setPathData(d);
        }
      }
      else {
        setPathData(null);
        setPoints(null);
      }
    };

    const timer = setTimeout(updatePath, 200);
    window.addEventListener('resize', updatePath);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePath);
    };
  }, [currentStep, isContractionRepayment]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence mode="wait">
        {pathData && points ? (
          <motion.div
            key={`flow-anim-${currentStep.stepIndex}-${mode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg className="absolute inset-0 w-full h-full overflow-visible">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={isReverse ? "#ef4444" : "#10B981"} />
                </marker>
              </defs>
              <motion.path
                id="money-path-line"
                d={pathData}
                fill="transparent"
                stroke={isReverse ? "#ef4444" : "#10B981"}
                strokeWidth="3"
                strokeDasharray="10,10"
                initial={{ pathLength: 0, opacity: isContractionRepayment ? 0 : 1 }}
                animate={isContractionRepayment ? { 
                  pathLength: [0, 0, 1, 1],
                  opacity: [0, 0, 1, 1]
                } : { 
                  pathLength: 1,
                  opacity: 1
                }}
                transition={isContractionRepayment ? { 
                  duration: 5, 
                  times: [0, 0.4, 0.6, 1], 
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 1
                } : { 
                  duration: 1.5, 
                  ease: "easeInOut" 
                }}
                markerEnd="url(#arrowhead)"
              />
            </svg>

            <motion.div
              style={{ 
                position: 'absolute', 
                left: 0, 
                top: 0,
                offsetPath: `path("${pathData}")`,
                offsetRotate: '0deg'
              }}
              animate={isContractionRepayment ? { 
                offsetDistance: ["100%", "0%", "0%", "100%"]
              } : { 
                offsetDistance: ["0%", "100%"] 
              }}
              transition={isContractionRepayment ? { 
                duration: 5, 
                times: [0, 0.4, 0.6, 1], 
                ease: "easeInOut", 
                repeat: Infinity, 
                repeatDelay: 1 
              } : { 
                duration: 3, 
                ease: "easeInOut", 
                repeat: Infinity, 
                repeatDelay: 0.5 
              }}
            >
              <div className="-translate-x-1/2 -translate-y-[120%]">
                <ContractionPixelCharacter 
                  isContractionRepayment={isContractionRepayment}
                  isForwardPath={points.x2 > points.x1}
                />
              </div>
            </motion.div>
          </motion.div>

        ) : (currentStep.actionType === 'LOAN' || currentStep.actionType === 'REPAYMENT' || currentStep.actionType === 'WITHDRAWAL') && currentStep.highlightedBankId ? (
          <motion.div
            key={`effect-anim-${currentStep.stepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BankLoanEffect 
              bankId={currentStep.highlightedBankId} 
              containerRef={containerRef} 
              isWithdrawal={currentStep.actionType === 'WITHDRAWAL'} 
              isRepayment={currentStep.actionType === 'REPAYMENT'}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for contraction character to handle visual direction flips in sequence
const ContractionPixelCharacter = ({ isContractionRepayment, isForwardPath }: { isContractionRepayment: boolean, isForwardPath: boolean }) => {
  const [direction, setDirection] = useState(1);
  const [isCarrying, setIsCarrying] = useState(true);

  useEffect(() => {
    if (!isContractionRepayment) {
      // Default behavior for expansion: facing the direction of path movement
      setDirection(isForwardPath ? 1 : -1);
      setIsCarrying(true);
      return;
    }

    // Sequence for contraction repayment:
    // Path is defined as Bank n+1 -> Bank n (Right to Left usually, so isForwardPath is false)
    // Borrower starts at Bank n (100% offset)
    // 0-40%: Move 100% -> 0% (n -> n+1). Facing RIGHT if n+1 is on the right.
    // 40-60%: Wait at 0% (n+1)
    // 60-100%: Move 0% -> 100% (n+1 -> n). Facing LEFT if n+1 is on the right.
    
    let stage = 0;
    const interval = setInterval(() => {
      stage = (stage + 1) % 50; // Each 100ms = 2% of 5s
      
      const nIsOnLeft = !isForwardPath; // Usually Bank n is left of n+1
      
      if (stage < 20) { // 0-40% (n -> n+1)
        setDirection(nIsOnLeft ? 1 : -1); 
        setIsCarrying(false);
      } else if (stage < 30) { // 40-60% wait
        setDirection(nIsOnLeft ? 1 : -1);
        setIsCarrying(true);
      } else { // 60-100% (n+1 -> n)
        setDirection(nIsOnLeft ? -1 : 1);
        setIsCarrying(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isContractionRepayment, isForwardPath]);

  return <PixelCharacter direction={direction} isCarrying={isCarrying} />;
};



const BankLoanEffect = ({ bankId, containerRef, isWithdrawal, isRepayment }: { bankId: number, containerRef: React.RefObject<HTMLDivElement>, isWithdrawal?: boolean, isRepayment?: boolean }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const update = () => {
      const elId = isWithdrawal ? `bank-${bankId}-deposits` : `bank-${bankId}-loans`;
      const el = document.getElementById(elId);
      if (el && containerRef.current) {
        const rect = el.getBoundingClientRect();
        const cRect = containerRef.current.getBoundingClientRect();
        setPos({
          x: rect.left + rect.width / 2 - cRect.left,
          y: rect.top + rect.height / 2 - cRect.top
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [bankId, containerRef, isWithdrawal]);

  if (pos.x === 0) return null;

  return (
    <motion.div
      style={{ position: 'absolute', x: pos.x - 12, y: pos.y - 40 }}
      animate={{ y: isRepayment ? [pos.y - 60, pos.y - 40, pos.y - 60] : [pos.y - 40, pos.y - 60, pos.y - 40] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mb-2"
        >
          <Coins className={`w-6 h-6 ${isWithdrawal ? 'text-red-400' : 'text-emerald-400'} drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]`} />
        </motion.div>
        <PixelCharacter isCarrying={false} direction={isRepayment ? -1 : 1} />
        <span className={`text-[8px] font-black uppercase mt-1 bg-slate-900 border px-2 py-0.5 rounded-full shadow-lg ${
          isWithdrawal ? 'text-red-400 border-red-400' : isRepayment ? 'text-orange-400 border-orange-400' : 'text-emerald-400 border-emerald-900/50'
        }`}>
          {isWithdrawal ? 'Withdrawal' : isRepayment ? 'CALL BACK NOTICE' : 'Borrower Action'}
        </span>
        {isRepayment && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-orange-500 text-white text-[7px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap"
          >
            LOAN REPAYMENT REQUESTED
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [reserveRatio, setReserveRatio] = useState(DEFAULT_RESERVE_RATIO);
  const [mode, setMode] = useState<'EXPANSION' | 'CONTRACTION'>('EXPANSION');

  // Helper for deep cloning bank states to avoid reference sharing between steps
  const cloneBanks = (banks: BankState[]): BankState[] => 
    banks.map(b => ({
      ...b,
      balanceSheet: {
        assets: { ...b.balanceSheet.assets },
        liabilities: { ...b.balanceSheet.liabilities }
      }
    }));

  // Generate steps based on mode and reserve ratio
  const steps = useMemo(() => {
    const generatedSteps: SimulationStep[] = [];
    let currentBanks: BankState[] = [];
    
    if (mode === 'EXPANSION') {
      // Step 0: Initial Stage
      generatedSteps.push({
        stepIndex: 0,
        description: "Initial State: The banking system has no activity.",
        banks: [],
        systemAggregate: { assets: { reserves: 0, loans: 0 }, liabilities: { deposits: 0 } },
        actionType: 'INITIAL'
      });

      // Step 1: Initial Deposit into Bank 1
      currentBanks = [{
        id: 1,
        name: "Bank 1",
        balanceSheet: {
          assets: { reserves: INITIAL_DEPOSIT, loans: 0 },
          liabilities: { deposits: INITIAL_DEPOSIT }
        }
      }];
      generatedSteps.push({
        stepIndex: 1,
        description: `Individual deposits $${INITIAL_DEPOSIT} of cash into Bank 1. At this initial moment, Bank 1 holds the full amount as reserves and has issued no loans.`,
        banks: cloneBanks(currentBanks),
        systemAggregate: { 
          assets: { reserves: INITIAL_DEPOSIT, loans: 0 }, 
          liabilities: { deposits: INITIAL_DEPOSIT } 
        },
        actionType: 'DEPOSIT',
        highlightedBankId: 1
      });

      let lastDepositAmount = INITIAL_DEPOSIT;
      let bankCount = 1;

      for (let i = 0; i < 8; i++) {
        const currentBankIndex = currentBanks.length - 1;
        const loanAmount = lastDepositAmount * (1 - reserveRatio);
        const keptReserves = lastDepositAmount * reserveRatio;

        if (loanAmount < 0.1) break;

        currentBanks[currentBankIndex].balanceSheet.assets.reserves = keptReserves;
        currentBanks[currentBankIndex].balanceSheet.assets.loans += loanAmount;
        
        const totalReserves = currentBanks.reduce((sum, b) => sum + b.balanceSheet.assets.reserves, 0);
        const totalLoans = currentBanks.reduce((sum, b) => sum + b.balanceSheet.assets.loans, 0);
        const totalDeposits = currentBanks.reduce((sum, b) => sum + b.balanceSheet.liabilities.deposits, 0);

        generatedSteps.push({
          stepIndex: generatedSteps.length,
          description: `${currentBanks[currentBankIndex].name} retains $${keptReserves.toFixed(2)} (${(reserveRatio * 100).toFixed(0)}%) as required reserves and lends out the excess $${loanAmount.toFixed(2)} to a borrower.`,
          banks: cloneBanks(currentBanks),
          systemAggregate: {
            assets: { reserves: totalReserves, loans: totalLoans },
            liabilities: { deposits: totalDeposits }
          },
          actionType: 'LOAN',
          highlightedBankId: currentBanks[currentBankIndex].id
        });

        bankCount++;
        const nextBankName = `Bank ${bankCount}`;
        const nextBank: BankState = {
          id: bankCount,
          name: nextBankName,
          balanceSheet: {
            assets: { reserves: loanAmount, loans: 0 },
            liabilities: { deposits: loanAmount }
          }
        };
        
        currentBanks.push(nextBank);
        lastDepositAmount = loanAmount;

        const totalReservesAfter = currentBanks.reduce((sum, b) => sum + b.balanceSheet.assets.reserves, 0);
        const totalLoansAfter = currentBanks.reduce((sum, b) => sum + b.balanceSheet.assets.loans, 0);
        const totalDepositsAfter = currentBanks.reduce((sum, b) => sum + b.balanceSheet.liabilities.deposits, 0);

        generatedSteps.push({
          stepIndex: generatedSteps.length,
          description: `The $${loanAmount.toFixed(2)} loan is spent and redeposited into ${nextBankName}. Total deposits in the system increase, creating new money.`,
          banks: cloneBanks(currentBanks),
          systemAggregate: {
            assets: { reserves: totalReservesAfter, loans: totalLoansAfter },
            liabilities: { deposits: totalDepositsAfter }
          },
          actionType: 'DEPOSIT',
          highlightedBankId: bankCount
        });
      }
    } else {
      // CONTRACTION MODE
      // 1. Build the "Full" state first
      let fullBanks: BankState[] = [];
      let lastDep = INITIAL_DEPOSIT;
      for(let i=1; i<=8; i++) {
        const loanAmt = lastDep * (1 - reserveRatio);
        const resAmt = lastDep * reserveRatio;
        fullBanks.push({
          id: i,
          name: `Bank ${i}`,
          balanceSheet: {
            assets: { reserves: resAmt, loans: loanAmt },
            liabilities: { deposits: lastDep }
          }
        });
        lastDep = loanAmt;
        if (lastDep < 0.1) break;
      }

      currentBanks = cloneBanks(fullBanks);
      
      const calcAgg = (banks: BankState[]) => ({
        assets: {
          reserves: banks.reduce((s, b) => s + b.balanceSheet.assets.reserves, 0),
          loans: banks.reduce((s, b) => s + b.balanceSheet.assets.loans, 0)
        },
        liabilities: {
          deposits: banks.reduce((s, b) => s + b.balanceSheet.liabilities.deposits, 0)
        }
      });

      // Step 0: Full State
      generatedSteps.push({
        stepIndex: 0,
        description: "Initial State (Full Capacity): The banking system is fully loaned out based on the reserve requirement.",
        banks: cloneBanks(currentBanks),
        systemAggregate: calcAgg(currentBanks),
        actionType: 'INITIAL'
      });

      // Step 1: Big Withdrawal from Bank 1
      const withdrawalAmount = 100; // Updated from $500 to $100 as per user request
      currentBanks[0].balanceSheet.liabilities.deposits -= withdrawalAmount;
      currentBanks[0].balanceSheet.assets.reserves -= withdrawalAmount;

      generatedSteps.push({
        stepIndex: 1,
        description: `A depositor withdraws $${withdrawalAmount.toFixed(2)} from Bank 1. This reduces both the bank's deposits and its actual reserves.`,
        banks: cloneBanks(currentBanks),
        systemAggregate: calcAgg(currentBanks),
        actionType: 'WITHDRAWAL',
        highlightedBankId: 1
      });

      // Iterative contraction
      for (let i = 0; i < currentBanks.length; i++) {
        const bank = currentBanks[i];
        const requiredReserves = bank.balanceSheet.liabilities.deposits * reserveRatio;
        const reservesShortfall = requiredReserves - bank.balanceSheet.assets.reserves;

        if (reservesShortfall > 0.01 && bank.balanceSheet.assets.loans > 0) {
          const calledLoans = Math.min(reservesShortfall, bank.balanceSheet.assets.loans);
          
          // Step 1: Bank asks for repayment (Notice of loan call back)
          // Loans issued in bank n remain unchanged at this EXACT step
          generatedSteps.push({
            stepIndex: generatedSteps.length,
            description: `NOTICE OF CALL BACK: ${bank.name} is below its required reserve ratio. It has formally issued a call-back notice for $${calledLoans.toFixed(2)} in loans to recover its liquidity.`,
            banks: cloneBanks(currentBanks),
            systemAggregate: calcAgg(currentBanks),
            actionType: 'REPAYMENT',
            highlightedBankId: bank.id
          });

          // Step 2: The actual repayment (The borrower runs back from Bank n+1 to Bank n)
          if (i + 1 < currentBanks.length) {
            const nextBank = currentBanks[i+1];
            const reduction = Math.min(calledLoans, nextBank.balanceSheet.liabilities.deposits);
            
            // Update the state for THIS step
            nextBank.balanceSheet.liabilities.deposits -= reduction;
            nextBank.balanceSheet.assets.reserves -= reduction;
            bank.balanceSheet.assets.loans -= reduction;
            bank.balanceSheet.assets.reserves += reduction;

            generatedSteps.push({
              stepIndex: generatedSteps.length,
              description: `REPAYMENT: The borrower withdraws $${reduction.toFixed(2)} from ${nextBank.name} and repays the debt to ${bank.name}. This removes ${reduction.toFixed(2)} from the money supply.`,
              banks: cloneBanks(currentBanks),
              systemAggregate: calcAgg(currentBanks),
              actionType: 'DEPOSIT', // Using DEPOSIT type to trigger the "Between Banks" animation tool
              highlightedBankId: bank.id // We'll logic this in the animation component
            });
          } else {
            // End of domestic chain - simply repay from "outside"
            bank.balanceSheet.assets.loans -= calledLoans;
            bank.balanceSheet.assets.reserves += calledLoans;
            
            generatedSteps.push({
              stepIndex: generatedSteps.length,
              description: `The borrower repays the $${calledLoans.toFixed(2)} loan using outside cash, restoring ${bank.name}'s reserves.`,
              banks: cloneBanks(currentBanks),
              systemAggregate: calcAgg(currentBanks),
              actionType: 'REPAYMENT',
              highlightedBankId: bank.id
            });
          }
        }
      }
    }

    return generatedSteps;
  }, [reserveRatio, mode]);

  const currentStep = steps[currentStepIndex];
  const moneyMultiplier = 1 / reserveRatio;
  const theoreticalMax = INITIAL_DEPOSIT * moneyMultiplier;

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const reset = () => {
    setCurrentStepIndex(0);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-x-hidden p-4 md:p-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-700 pb-6 gap-6">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">
            The Money <span className="text-emerald-400">Multiplier</span>
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
              Deposit {mode === 'EXPANSION' ? 'Creation' : 'Contraction'} Mechanism
            </p>
            <div className="h-4 w-[2px] bg-slate-700" />
            <button 
              onClick={() => {
                setMode(mode === 'EXPANSION' ? 'CONTRACTION' : 'EXPANSION');
                setCurrentStepIndex(0);
              }}
              className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all ${
                mode === 'EXPANSION' 
                ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              }`}
            >
              Switch to {mode === 'EXPANSION' ? 'Contraction' : 'Creation'}
            </button>
          </div>
        </div>
        
        <div className="text-left md:text-right relative">
          <div className="hidden md:block text-8xl font-black text-slate-800 absolute -top-8 -right-4 -z-0 opacity-50 select-none">
            {currentStepIndex.toString().padStart(2, '0')}
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-emerald-400 uppercase">Current Phase</p>
            <p className="text-2xl font-bold uppercase tracking-tight">
              {currentStep.actionType === 'INITIAL' ? 'Setup' : 
               currentStep.actionType === 'DEPOSIT' ? 'Deposit Stage' : 
               currentStep.actionType === 'LOAN' ? 'Loan Issuance' :
               currentStep.actionType === 'WITHDRAWAL' ? 'Withdrawal' : 'Loan Repayment'}
            </p>
          </div>
        </div>
      </header>

      {/* Configuration Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-slate-800/50 p-4 border border-slate-700 rounded-xl">
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reserve Requirement</span>
            <span className="text-emerald-400 font-mono font-bold">{(reserveRatio * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={reserveRatio} 
            onChange={(e) => {
              setReserveRatio(parseFloat(e.target.value));
              setCurrentStepIndex(0);
            }}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
        <button 
          onClick={reset}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2"
        >
          <RefreshCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Main Visualization Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <MoneyFlowAnimation currentStep={currentStep} mode={mode} />
        
        {/* Left: Individual Banks */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
              <span className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
              Commercial Banks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {currentStep.banks.length === 0 ? (
                <div className="col-span-full h-64 border-2 border-slate-800 border-dashed rounded-2xl flex items-center justify-center text-slate-600 font-mono text-sm uppercase tracking-widest">
                  Initial deposit required to spark system
                </div>
              ) : (
                currentStep.banks.map((bank: BankState) => (
                  <TAccount 
                    key={bank.id} 
                    bank={bank} 
                    isActive={currentStep.highlightedBankId === bank.id} 
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/50 p-6 rounded-xl mt-auto">
            <p className="text-sm leading-relaxed text-slate-300">
              <strong className="text-emerald-400 font-black uppercase tracking-tighter mr-2">Core Mechanism:</strong> 
              {currentStep.description}
            </p>
          </div>
        </section>

        {/* Right: Aggregate System */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-100 text-slate-900 rounded-2xl p-8 flex flex-col h-full shadow-2xl sticky top-8">
            <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-slate-900 pb-2 tracking-tighter">System Aggregate</h2>
            
            {/* Top Controls */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 py-3 rounded-xl transition-all group border-b-4 border-slate-400 active:border-b-0 active:translate-y-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase">Back</span>
              </button>
              <button 
                onClick={nextStep}
                disabled={currentStepIndex === steps.length - 1}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-black disabled:opacity-50 py-3 rounded-xl transition-all group border-b-4 border-black active:border-b-0 active:translate-y-1"
              >
                <span className="font-black text-[10px] uppercase">Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-10 flex-1">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Deposits (M1 Money)</p>
                <p className="text-6xl font-black tracking-tighter leading-none">
                  ${currentStep.systemAggregate.liabilities.deposits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <div className="w-full bg-slate-300 h-3 mt-4 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (currentStep.systemAggregate.liabilities.deposits / theoreticalMax) * 100)}%` }}
                    className="bg-emerald-500 h-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  ></motion.div>
                </div>
                <p className="text-[10px] font-bold mt-2 text-slate-400 uppercase">
                  {reserveRatio === 0 ? 'N/A (Multiplication is theoretically infinite)' : `${((currentStep.systemAggregate.liabilities.deposits / theoreticalMax) * 100).toFixed(1)}% of Theoretical Capacity (${theoreticalMax.toLocaleString()})`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border-l-4 border-slate-300 pl-4">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Reserves</p>
                  <p className="text-2xl font-bold font-mono tracking-tight">${currentStep.systemAggregate.assets.reserves.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="border-l-4 border-emerald-400 pl-4">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Loans</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600">${currentStep.systemAggregate.assets.loans.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="bg-slate-200 p-5 rounded-xl border border-slate-300">
                <p className="text-[10px] font-black uppercase mb-1 text-slate-600 tracking-wider">Money Multiplier</p>
                <p className="text-4xl font-black tracking-tight leading-none">
                  {reserveRatio === 0 ? '∞' : `${(1/reserveRatio).toFixed(1)}x`}
                </p>
                <p className="text-[9px] mt-2 text-slate-500 leading-tight uppercase font-bold">
                  {reserveRatio === 0 ? '0% reserve means infinite expansion capacity' : 'Theoretical system capacity: Initial Deposit * (1/RRR)'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-12 grid grid-cols-2 gap-4 pt-8 border-t border-slate-300">
              <button 
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center justify-center gap-2 bg-slate-300 hover:bg-slate-400 disabled:opacity-50 py-4 rounded-xl transition-all group border-b-4 border-slate-400 active:border-b-0 active:translate-y-1"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-black text-xs uppercase">Back</span>
              </button>
              <button 
                onClick={nextStep}
                disabled={currentStepIndex === steps.length - 1}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-black disabled:opacity-50 py-4 rounded-xl transition-all group border-b-4 border-black active:border-b-0 active:translate-y-1"
              >
                <span className="font-black text-xs uppercase">Next Step</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Meta */}
      <footer className="mt-12 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 transition-all duration-300 rounded-full ${
                idx <= currentStepIndex ? 'bg-emerald-500 w-8 md:w-12' : 'bg-slate-800 w-4 md:w-6'
              }`}
            />
          ))}
        </div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          Phase {currentStepIndex + 1} of {steps.length} — {currentStep.description.split('.')[0]}
        </p>
      </footer>
    </div>
  );
}

const TAccount: React.FC<{ bank: BankState, isActive?: boolean }> = ({ bank, isActive }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      id={`bank-card-${bank.id}`}
      className={`relative min-h-[400px] transition-all group ${
        isActive 
          ? 'scale-[1.02] z-20' 
          : 'z-10'
      }`}
    >
      {/* The Stone Facade (Architectural Frame) */}
      <div className={`absolute inset-0 bg-[#dcdcdc] rounded-t-lg border-x-4 border-t-8 border-[#b8b8b8] shadow-2xl transition-all ${
        isActive ? 'shadow-emerald-500/20' : ''
      }`}>
        {/* Decorative Top Ledge (Pediment Style) */}
        <div className="absolute -top-4 -left-4 -right-4 h-6 bg-[#d0d0d0] border-b-2 border-[#a0a0a0] shadow-sm rounded-t-sm" />
        
        {/* Engraved Bank Name Section */}
        <div className="pt-6 pb-4 px-6 text-center">
          <h3 className="text-2xl font-serif font-bold text-[#606060] uppercase tracking-[0.2em] opacity-80 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
            {bank.name.toUpperCase()}
          </h3>
        </div>

        {/* The Inner Frame (Display Area) */}
        <div className={`mx-6 mb-6 p-8 bg-white rounded border border-[#c0c0c0] shadow-inner flex flex-col h-[calc(100%-100px)] transition-all ${
          isActive ? 'bg-emerald-50/30 ring-2 ring-emerald-500/10' : ''
        }`}>
          {/* Top Metadata Layer */}
          <div className="relative text-right mb-1">
            <span className="text-[10px] text-slate-700 font-mono font-bold uppercase tracking-tighter">INST. ID: {bank.id.toString().padStart(3, '0')}</span>
          </div>
          
          {/* Main Divider Line */}
          <div className="h-[1px] bg-slate-300 w-full mb-6" />

          {/* Balance Sheet Content */}
          <div className="grid grid-cols-2 gap-10 flex-1">
            {/* Assets Column */}
            <div className="space-y-6">
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">ASSETS</p>
              <div className="space-y-4">
                <div className="border-l-4 border-slate-900 pl-3 py-1">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">RESERVES</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                    ${bank.balanceSheet.assets.reserves.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div id={`bank-${bank.id}-loans`} className="border-l-4 border-emerald-800 pl-3 py-1">
                  <p className="text-[9px] text-emerald-800/70 uppercase font-black mb-1">LOANS ISSUED</p>
                  <p className={`text-3xl font-black tracking-tighter leading-none ${bank.balanceSheet.assets.loans > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
                    ${bank.balanceSheet.assets.loans.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Liabilities Column */}
            <div className="space-y-6">
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">LIABILITIES</p>
              <div className="space-y-4">
                <div id={`bank-${bank.id}-deposits`} className="border-l-4 border-slate-900 pl-3 py-1">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">TOTAL DEPOSITS</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                    ${bank.balanceSheet.liabilities.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="pt-6">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>EQUITY RATIO</span>
                    <span className="font-mono">1.0:1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Base of the building */}
        <div className="absolute -bottom-1 -left-2 -right-2 h-4 bg-[#b0b0b0] rounded shadow-md border-t-2 border-[#909090]" />
      </div>

      {/* Active Label Layer */}
      {isActive && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl z-30"
        >
          Active Stage
        </motion.div>
      )}
    </motion.div>
  );
};
