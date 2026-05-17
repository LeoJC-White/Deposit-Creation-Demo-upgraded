/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BalanceSheet {
  assets: {
    reserves: number;
    loans: number;
  };
  liabilities: {
    deposits: number;
  };
}

export interface BankState {
  id: number;
  name: string;
  balanceSheet: BalanceSheet;
}

export interface SimulationStep {
  stepIndex: number;
  description: string;
  banks: BankState[];
  systemAggregate: BalanceSheet;
  actionType: 'DEPOSIT' | 'LOAN' | 'INITIAL' | 'WITHDRAWAL' | 'REPAYMENT';
  highlightedBankId?: number;
}
