import React from 'react';

interface PaymentReminderProps {
  daysLeft: number;
  amountDue: number;
  updatePaymentLink: string;
  onDismiss?: () => void;
}

const PaymentReminder: React.FC<PaymentReminderProps> = ({
  daysLeft,
  amountDue,
  updatePaymentLink,
  onDismiss
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-medium">
              Payment Due Soon - {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
            </p>
            <p className="text-sm opacity-90">
              Your website hosting expires soon. Amount due: ${amountDue.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href={updatePaymentLink}
            className="bg-white text-yellow-600 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Update Payment
          </a>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-white hover:text-yellow-200 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReminder;