import { useState } from 'react';
import { usePHR } from '@/features/phr/PHRContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AddRecord = () => {
  const { addRecord, currentUser } = usePHR();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('General');
  const [notes, setNotes] = useState('');

  const patientId = currentUser?.id || 'patient-1';

  const handleSubmit = (e: any) => {
    e.preventDefault();
    addRecord({ patientId, title, type, notes, date: new Date().toISOString(), createdBy: currentUser?.id });
    navigate('/phr/patient');
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Add Health Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Type</label>
                <input value={type} onChange={(e) => setType(e.target.value)} className="w-full border p-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border p-2" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 text-white py-3 px-4">Save</Button>
                <Button variant="outline" onClick={() => navigate('/phr/patient')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AddRecord;
