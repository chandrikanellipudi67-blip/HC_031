import { usePHR } from '@/features/phr/PHRContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Reminders = () => {
  const { currentUser, remindersForPatient } = usePHR();
  const navigate = useNavigate();
  const patientId = currentUser?.id || 'patient-1';
  const reminders = remindersForPatient(patientId);

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Reminders</h1>
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <Card className="p-4 border-border/50">
              <CardContent>No reminders</CardContent>
            </Card>
          ) : (
            reminders.map(r => (
              <Card key={r.id} className="p-3 border-border/50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.date}</p>
                </div>
                <div>
                  <Button variant="ghost">Snooze</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Reminders;
