import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Clock, AlertTriangle, Users, Car, Eye, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: 'emergency' | 'theft' | 'vandalism' | 'accident' | 'suspicious' | 'other';
  location: string;
  latitude: number;
  longitude: number;
  status: 'new' | 'investigating' | 'resolved';
  created_at: string;
  user_id: string;
}

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
}

const categoryConfig = {
  emergency: { 
    label: 'Emergency', 
    icon: AlertTriangle, 
    className: 'text-safety-emergency border-safety-emergency bg-safety-emergency/10' 
  },
  theft: { 
    label: 'Theft', 
    icon: Shield, 
    className: 'text-safety-theft border-safety-theft bg-safety-theft/10' 
  },
  vandalism: { 
    label: 'Vandalism', 
    icon: Users, 
    className: 'text-safety-vandalism border-safety-vandalism bg-safety-vandalism/10' 
  },
  accident: { 
    label: 'Accident', 
    icon: Car, 
    className: 'text-safety-accident border-safety-accident bg-safety-accident/10' 
  },
  suspicious: { 
    label: 'Suspicious Activity', 
    icon: Eye, 
    className: 'text-safety-suspicious border-safety-suspicious bg-safety-suspicious/10' 
  },
  other: { 
    label: 'Other', 
    icon: Shield, 
    className: 'text-safety-other border-safety-other bg-safety-other/10' 
  }
};

const statusConfig = {
  new: { label: 'New', className: 'bg-status-new text-white' },
  investigating: { label: 'Investigating', className: 'bg-status-investigating text-white' },
  resolved: { label: 'Resolved', className: 'bg-status-resolved text-white' }
};

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  const categoryInfo = categoryConfig[incident.category];
  const statusInfo = statusConfig[incident.status];
  const Icon = categoryInfo.icon;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${onClick ? 'hover:border-primary/50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground line-clamp-1">{incident.title}</h3>
          </div>
          <Badge className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{incident.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Badge variant="outline" className={categoryInfo.className}>
            {categoryInfo.label}
          </Badge>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {incident.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}