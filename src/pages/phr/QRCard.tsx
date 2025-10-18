import React from 'react';
import { usePHR } from '@/features/phr/PHRContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const QRCard: React.FC = () => {
  const { currentUser, exportRecordsAsText } = usePHR();
  const patientId = currentUser?.id || 'patient-1';
  const payload = encodeURIComponent(exportRecordsAsText(patientId));

  // Use Google Chart API to generate a QR image URL (no extra dependency)
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${payload}&chld=L|1`;

  const download = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `${patientId}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="p-6 flex items-center justify-center">
      <Card className="p-6 border-border/50">
        <CardHeader>
          <CardTitle>Health QR Card</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="p-6 border border-border/40 bg-white">
              <img src={qrUrl} alt="Health QR" width={256} height={256} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Scan to import health record</p>
            <pre className="mt-3 max-h-40 overflow-auto w-full bg-muted/10 p-2 text-xs">{decodeURIComponent(payload)}</pre>
            <div className="mt-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-none" onClick={download}>Download PNG</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCard;
