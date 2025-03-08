import React from 'react';

const TermsAndPolicyModal = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 mt-16">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Terms of Service & Policies
          </h2>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="font-medium text-red-600">
                Important Notice Regarding Design Property
              </p>
              <p className="text-gray-700">
                By accepting these terms, you acknowledge that all designs and creative works remain the intellectual property of their respective owners. Any unauthorized use, reproduction, or theft of designs may result in:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Immediate account suspension or permanent ban</li>
                <li>Potential legal action by the owner</li>
                <li>Financial penalties as prescribed by law</li>
              </ul>
            </div>

            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-800">Important Policies:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Full payment/Partial Payment is required before the commencement of any project work.</li>
                <li>No fully refunds will be issued once project production has begun.</li>
                <li>By proceeding with the payment, you acknowledge and agree to these terms.</li>
              </ul>
            </div>

            <div className="text-sm">
              <p className="italic text-gray-600">
                By clicking "Accept & Continue", you confirm that you have read, understood, and agree to abide by all terms and policies stated above.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={onDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4FBDBA]"
            >
              Decline & Logout
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-[#4FBDBA] rounded-md hover:bg-[#4FBDBA]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4FBDBA]"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndPolicyModal;