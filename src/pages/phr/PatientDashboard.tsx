import { useState } from 'react';
import { usePHR } from '@/features/phr/PHRContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const { currentUser, getRecordsForPatient, remindersForPatient } = usePHR();
  const navigate = useNavigate();
  const patientId = currentUser?.id || 'patient-1';
  const records = getRecordsForPatient(patientId);
  const reminders = remindersForPatient(patientId);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Your personal health overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="xl" className="bg-blue-600 text-white" onClick={() => navigate('/phr/add')}>Add Record</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/phr/reminders')}>Reminders</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-border/50">
            <CardContent>
              <h3 className="text-sm font-medium text-muted-foreground">Total Records</h3>
              <p className="text-2xl font-bold">{records.length}</p>
            </CardContent>
          </Card>

          <Card className="p-4 border-border/50">
            <CardContent>
              <h3 className="text-sm font-medium text-muted-foreground">Upcoming Reminders</h3>
              <p className="text-2xl font-bold">{reminders.length}</p>
            </CardContent>
          </Card>

          <Card className="p-4 border-border/50">
            <CardContent>
              <h3 className="text-sm font-medium text-muted-foreground">Export & Share</h3>
              <p className="text-sm text-muted-foreground mb-3">Export your records or generate a QR health card</p>
              <div className="flex gap-2">
                <Button size="lg" onClick={() => navigate('/phr/export')} className="bg-blue-600 text-white">Export</Button>
                <Button size="lg" className="bg-green-600 text-white" onClick={() => navigate('/phr/qr')}>QR Card</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {records.length === 0 ? (
            <Card className="p-6 border-border/50">
              <CardContent>
                <p className="text-muted-foreground">No records yet. Click "Add Record" to create your first health record.</p>
              </CardContent>
            </Card>
          ) : (
            records.map((r) => (
              <Card key={r.id} className="border-border/50 p-4">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{r.title}</h3>
                      <p className="text-sm text-muted-foreground">{r.notes}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/phr/record/${r.id}`)}>Open</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
