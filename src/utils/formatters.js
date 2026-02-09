import { koboToNaira } from "./money.js";

export function formatTransactionForUser(tx) {
  return {
    id: tx.id,
    reference: tx.reference,
    type: tx.type,
    status: tx.status,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,

    amountKobo: tx.amount, 
    amount: koboToNaira(tx.amount), 

    entries: tx.entries.map(e => ({
      id: e.id,
      entryType: e.entryType,
      walletId: e.walletId,
      createdAt: e.createdAt,

      amountKobo: e.amount,  
      amount: koboToNaira(e.amount)
    }))
  };
}

export function formatTransactionsForUser(items = []) {
  return items.map(formatTransactionForUser);
}
