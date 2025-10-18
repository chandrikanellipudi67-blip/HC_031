import React from 'react';
import { usePHR } from '@/features/phr/PHRContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import jsPDF from 'jspdf';

const ExportShare: React.FC = () => {
  const { currentUser, exportRecordsAsText } = usePHR();
  const patientId = currentUser?.id || 'patient-1';
  const text = exportRecordsAsText(patientId);

  const downloadJson = () => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${patientId}-records.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const lines = splitTextToSize(text, 90);
    doc.setFontSize(12);
    let y = 20;
    doc.text(`Patient Records for ${patientId}`, 10, y);
    y += 8;
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 10, y);
      y += 6;
    });
    doc.save(`${patientId}-records.pdf`);
  };

  function escapeHtml(unsafe: string) {
    return unsafe
      .split('&').join('&amp;')
      .split('<').join('&lt;')
      .split('>').join('&gt;');
  }

  function splitTextToSize(text: string, size: number) {
    const paragraphs = text.split('\n');
    const out: string[] = [];
    paragraphs.forEach((p) => {
      let s = p;
      while (s.length > size) {
        out.push(s.slice(0, size));
        s = s.slice(size);
      }
      out.push(s);
    });
    return out;
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Export / Share</h1>
        <Card className="p-4 border-border/50">
          <CardContent>
            <p className="mb-4">Download your records as JSON or export as a formatted PDF.</p>
            <div className="flex gap-2">
              <Button className="bg-blue-600 text-white" onClick={downloadJson}>Download JSON</Button>
              <Button className="bg-green-600 text-white" onClick={downloadPdf}>Export PDF</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportShare;
