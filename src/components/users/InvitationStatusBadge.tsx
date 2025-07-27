import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, CheckCircle, AlertCircle, XCircle, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface InvitationStatus {
  status: 'pending' | 'completed' | 'expired' | 'failed';
  createdAt: Date;
  expiresAt?: Date;
  completedAt?: Date;
  emailSent?: boolean;
  email: string;
}

interface InvitationStatusBadgeProps {
  invitation: InvitationStatus;
}

export const InvitationStatusBadge = ({ invitation }: InvitationStatusBadgeProps) => {
  const getStatusIcon = () => {
    switch (invitation.status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'expired':
        return <AlertCircle className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusVariant = () => {
    switch (invitation.status) {
      case 'pending':
        return 'secondary' as const;
      case 'completed':
        return 'default' as const;
      case 'expired':
        return 'destructive' as const;
      case 'failed':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusText = () => {
    switch (invitation.status) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Registered';
      case 'expired':
        return 'Expired';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getTooltipContent = () => {
    const timeAgo = formatDistanceToNow(invitation.createdAt, { addSuffix: true });
    
    let content = `Invitation sent ${timeAgo}`;
    
    if (invitation.expiresAt) {
      const expiresIn = formatDistanceToNow(invitation.expiresAt, { addSuffix: true });
      content += `\nExpires ${expiresIn}`;
    }
    
    if (invitation.completedAt) {
      const completedTime = formatDistanceToNow(invitation.completedAt, { addSuffix: true });
      content += `\nCompleted ${completedTime}`;
    }
    
    if (invitation.emailSent === false) {
      content += `\n⚠️ Email delivery failed`;
    }
    
    return content;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            {invitation.emailSent === false && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email Failed
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="whitespace-pre-line">
            {getTooltipContent()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};