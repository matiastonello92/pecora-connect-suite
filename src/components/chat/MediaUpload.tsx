import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

import { useToast } from '@/hooks/use-toast';
import { X, Upload, FileText, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { validateFileUpload } from '@/utils/security';

interface MediaUploadProps {
  file: File;
  onCancel: () => void;
  onSend: (file: File) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ file, onCancel, onSend }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [caption, setCaption] = useState('');
  const [isValidFile, setIsValidFile] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const { profile } = useEnhancedAuth();
  
  
  const { toast } = useToast();

  useEffect(() => {
    const validation = validateFileUpload(file);
    setIsValidFile(validation.isValid);
    setValidationError(validation.error || '');
    
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive"
      });
    }
  }, [file, toast]);

  const isImage = file.type.startsWith('image/');
  const fileSize = (file.size / 1024 / 1024).toFixed(2);

  const handleSend = () => {
    if (!isValidFile) {
      toast({
        title: "Cannot upload file",
        description: validationError,
        variant: "destructive"
      });
      return;
    }
    onSend(file);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        {/* File Validation Error */}
        {!isValidFile && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          </div>
        )}

        {/* File Preview */}
        <div className="mb-4">
          {isImage ? (
            <div className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
              <FileText className="h-12 w-12 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{fileSize} MB</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Caption Input */}
        {isImage && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-1">
              Uploading {uploadProgress}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!isValidFile}>
            <Upload className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};