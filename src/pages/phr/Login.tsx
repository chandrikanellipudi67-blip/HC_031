import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePHR } from '@/features/phr/PHRContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const { signIn } = usePHR();
  const navigate = useNavigate();
  const [role, setRole] = useState<'patient' | 'doctor' | 'guardian'>('patient');
  const [id, setId] = useState('patient-1');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    signIn(id, role);
    if (role === 'doctor') navigate('/phr/doctor');
    else navigate('/phr/patient');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Healthcare Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full border p-2">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <input value={id} onChange={(e) => setId(e.target.value)} className="w-full border p-2" />
            </div>

            <Button type="submit" className="w-full py-4 text-lg bg-blue-600 text-white">Enter</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
