import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StatusUpdateButtonProps {
  currentStatus: 'new' | 'investigating' | 'resolved';
  onStatusUpdate: (newStatus: 'new' | 'investigating' | 'resolved') => void;
  disabled?: boolean;
}

const statusConfig = {
  new: { label: 'New', className: 'bg-status-new text-white' },
  investigating: { label: 'Investigating', className: 'bg-status-investigating text-white' },
  resolved: { label: 'Resolved', className: 'bg-status-resolved text-white' }
};

export function StatusUpdateButton({ currentStatus, onStatusUpdate, disabled }: StatusUpdateButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge className={statusConfig[currentStatus].className}>
        {statusConfig[currentStatus].label}
      </Badge>
      <Select 
        value={currentStatus} 
        onValueChange={onStatusUpdate}
        disabled={disabled}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="investigating">Investigating</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}