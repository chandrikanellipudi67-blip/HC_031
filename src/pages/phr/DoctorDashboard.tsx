import { usePHR } from '@/features/phr/PHRContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const { getRecordsForPatient } = usePHR();
  const navigate = useNavigate();

  // For demo we list patients from records
  const allRecords = getRecordsForPatient('');
  const patients = Array.from(new Set(allRecords.map(r => r.patientId))).slice(0, 20);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>

        <div className="space-y-3">
          {patients.length === 0 ? (
            <Card className="p-4 border-border/50">
              <CardContent>No patients yet</CardContent>
            </Card>
          ) : (
            patients.map(p => (
              <Card key={p} className="p-4 border-border/50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{p}</h3>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                </div>
                <div>
                  <Button onClick={() => navigate(`/phr/patient/${p}`)} className="bg-blue-600 text-white">Open</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard;
