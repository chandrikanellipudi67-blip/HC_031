import { usePHR } from '@/features/phr/PHRContext';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PatientRecord = () => {
  const { id } = useParams();
  const { getRecordsForPatient } = usePHR();
  // For demo we find record by id across all patients
  const records = getRecordsForPatient('');
  const record = records.find(r => r.id === id as string);

  if (!record) return <div className="p-6">Record not found</div>;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="p-4 border-border/50">
          <CardHeader>
            <CardTitle>{record.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{record.date}</p>
            <p className="mt-3">{record.notes}</p>
            <div className="mt-4">
              <Button variant="outline">Download PDF</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PatientRecord;
