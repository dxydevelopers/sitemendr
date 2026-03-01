import React from 'react';

interface PaymentWallProps {
  amountDue: number;
  daysOverdue: number;
  reactivationLink: string;
  contactSupport?: boolean;
}

const PaymentWall: React.FC<PaymentWallProps> = ({
  amountDue,
  daysOverdue,
  reactivationLink,
  contactSupport = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 text-center">
          <div className="flex justify-center mb-4">
            <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Website Temporarily Unavailable</h1>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              This website is currently suspended due to an outstanding payment.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Amount Due</div>
              <div className="text-3xl font-bold text-gray-900">${amountDue.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-1">
                Next Billing: Monthly
                {daysOverdue > 0 && (
                  <span className="text-red-600 ml-2">
                    ({daysOverdue} days overdue)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={reactivationLink}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Pay Now & Reactivate
            </a>

            {contactSupport && (
              <a
                href="/contact"
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </a>
            )}
          </div>

          {/* Footer Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Payment will instantly reactivate your website.
              <br />
              Need help? Our support team is here to assist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentWall;