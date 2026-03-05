"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function QRCodePage() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const token = searchParams.get("token");
  const referenceNo = searchParams.get("referenceNo");
  const amount = searchParams.get("amount");
  const detail = searchParams.get("detail");
  const backgroundUrl = searchParams.get("backgroundUrl");

  useEffect(() => {
    // Auto-submit form on load
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  if (!token || !referenceNo || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500">Invalid QR Code parameters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading QR Code...</p>
      </div>

      <form
        ref={formRef}
        action="https://api.feelfreepay.com/ffp/gateway/qrcode"
        method="POST"
        className="hidden"
      >
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="referenceNo" value={referenceNo} />
        <input type="hidden" name="amount" value={amount} />
        {detail && <input type="hidden" name="detail" value={detail} />}
        {backgroundUrl && (
          <input type="hidden" name="backgroundUrl" value={backgroundUrl} />
        )}
      </form>
    </div>
  );
}
