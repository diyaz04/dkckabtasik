import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CheckCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function CheckinScanner({ onClose, onScanSuccess }: Props) {
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        setScanResult(decodedText);
        onScanSuccess(decodedText);
      },
      (error) => {
        // Ignored, continuous scanning
      }
    );

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-brand-brown-dark text-white">
          <h3 className="font-bold">Scan QR Check-in</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 flex-1 relative">
          {!scanResult ? (
            <div id="reader" className="w-full h-full overflow-hidden rounded-xl border border-gray-200 bg-black"></div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="w-16 h-16 text-brand-green mb-4" />
              <p className="font-bold text-gray-800">QR Berhasil Discan!</p>
              <p className="text-xs text-gray-500 mt-2 font-mono break-all px-4">{scanResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
