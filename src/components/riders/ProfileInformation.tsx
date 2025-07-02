import { Rider } from '@/types';
import { format } from 'date-fns';
import { User, Phone, Mail, Calendar, Bike, Flag, FileText } from 'lucide-react';

interface ProfileInformationProps {
  rider: Rider;
}

export function ProfileInformation({ rider }: ProfileInformationProps) {
  const profileFields = [
    {
      label: 'Full Name',
      value: rider.fullName,
      icon: User,
    },
    {
      label: 'Email',
      value: rider.email,
      icon: Mail,
    },
    {
      label: 'Phone',
      value: rider.phone,
      icon: Phone,
    },
    {
      label: 'Nationality',
      value: rider.nationality,
      icon: Flag,
    },
    {
      label: 'Bike Type',
      value: rider.bikeType,
      icon: Bike,
    },
    {
      label: 'Visa Number',
      value: rider.visaNumber,
      icon: FileText,
    },
    {
      label: 'Join Date',
      value: format(new Date(rider.joinDate), 'dd MMMM yyyy'),
      icon: Calendar,
    },
    {
      label: 'Expected Start Date',
      value: format(new Date(rider.expectedStart), 'dd MMMM yyyy'),
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {profileFields.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.label} className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{field.label}</p>
                <p className="font-medium">{field.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {rider.notes && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-2">Notes</h4>
          <p className="text-sm text-muted-foreground">{rider.notes}</p>
        </div>
      )}

      {rider.assignedBikeId && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Bike className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Assigned Bike</p>
              <p className="text-sm text-muted-foreground">Bike ID: {rider.assignedBikeId}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}