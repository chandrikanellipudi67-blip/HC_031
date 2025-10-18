import { Call, Hospital, Danger, SecurityUser } from 'iconsax-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  icon: any;
  color: string;
  priority: 'critical' | 'high' | 'normal';
}

const emergencyContacts: EmergencyContact[] = [
  {
    name: 'Emergency (108)',
    number: '108',
    description: 'Fire, Police, Medical Emergency',
    icon: Danger,
    color: 'bg-red-500',
    priority: 'critical',
  },
  {
    name: 'Ambulance',
    number: '108',
    description: 'Medical emergency transport',
    icon: Hospital,
    color: 'bg-orange-500',
    priority: 'critical',
  },
  {
    name: 'Poison Control',
    number: '1-800-222-1222',
    description: '24/7 poison emergency hotline',
    icon: SecurityUser,
    color: 'bg-purple-500',
    priority: 'high',
  },
  {
    name: 'National Suicide Prevention',
    number: '988',
    description: '24/7 crisis support',
    icon: SecurityUser,
    color: 'bg-blue-500',
    priority: 'high',
  },
];

const EmergencyContactsList = () => {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Danger size={20} variant="Outline" className="text-red-500" />
          <h3 className="font-semibold text-red-700 dark:text-red-400">Emergency Notice</h3>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">
          If this is a life-threatening emergency, call 108 immediately. These numbers are for reference and may vary by location.
        </p>
      </div>

      {emergencyContacts.map((contact, index) => {
        const Icon = contact.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className={`${contact.color} p-6 flex items-center justify-center`}>
                  <Icon size={32} variant="Outline" className="text-white" />
                </div>
                
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{contact.name}</h3>
                    {contact.priority === 'critical' && (
                      <Badge variant="destructive" className="text-xs">Critical</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{contact.description}</p>
                  <Button
                    size="sm"
                    onClick={() => handleCall(contact.number)}
                    className="gap-2"
                  >
                    <Call size={16} variant="Outline" />
                    {contact.number}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EmergencyContactsList;
