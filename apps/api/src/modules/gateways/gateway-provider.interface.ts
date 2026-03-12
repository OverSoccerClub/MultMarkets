export interface CreateDepositDto {
  amount: number;
  txId: string;
  expiration?: number;
}

export interface DepositResponse {
  transactionId?: string;
  qrCode: string;
  paymentUrl?: string;
  metadata?: any;
}

export interface WithdrawalResponse {
  transactionId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'FAILED';
  metadata?: any;
}

export interface StatusResponse {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  transactionId?: string;
  metadata?: any;
}

export interface PaymentGatewayProvider {
  createDeposit(dto: CreateDepositDto, config?: any): Promise<DepositResponse>;
  initiateWithdrawal(amount: number, txId: string, pixKey: string, config?: any): Promise<WithdrawalResponse>;
  confirmWithdrawal(txId: string, config?: any): Promise<WithdrawalResponse>;
  getStatus(txId: string, type: 'CASH_IN' | 'CASH_OUT', config?: any): Promise<StatusResponse>;
}
