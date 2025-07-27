import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useChatContext } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { sanitizeMessage, containsInappropriateContent, validateFileUpload } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';
import { auditLogger, auditActions } from '@/utils/auditLog';
import {
  Send,
  Plus,
  Smile,
  Paperclip,
  Image,
  Mic,
  Camera,
  FileText,
  X
} from 'lucide-react';
import { ChatMessageType } from '@/types/communication';
import { EmojiPicker } from './EmojiPicker';
import { MediaUpload } from './MediaUpload';

interface MessageInputProps {
  onSendMessage: (content: string, type?: ChatMessageType, mediaUrl?: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const { uploadMedia } = useChatContext();
  const { language, user } = useAuth();
  const { t } = useTranslation(language);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;
    
    // Sanitize the message
    const sanitizedMessage = sanitizeMessage(message.trim());
    
    // Check for inappropriate content
    if (containsInappropriateContent(sanitizedMessage)) {
      toast({
        title: "Message blocked",
        description: "Your message contains inappropriate content and was not sent.",
        variant: "destructive"
      });
      return;
    }
    
    // Check message length
    if (sanitizedMessage.length > 1000) {
      toast({
        title: "Message too long",
        description: "Please keep your message under 1000 characters.",
        variant: "destructive"
      });
      return;
    }
    
    onSendMessage(sanitizedMessage);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, onSendMessage, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Limit input length in real-time
    if (value.length <= 1000) {
      setMessage(value);
    }
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (file: File, type: ChatMessageType) => {
    // Validate file before upload
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setUploadingFile(file);
    setShowAttachMenu(false);
    
    try {
      const mediaUrl = await uploadMedia(file, 'temp-chat-id'); // Will be replaced with actual chat ID
      if (mediaUrl) {
        // Log file upload for audit
        if (user) {
          await auditLogger.logFileUpload(user.id, file.name, file.size, file.type);
        }
        onSendMessage(file.name, type, mediaUrl);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'image');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'document');
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    // Voice recording implementation would go here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Stop recording and send audio
  };

  return (
    <div className="relative">
      {/* Upload Preview */}
      {uploadingFile && (
        <div className="p-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">{uploadingFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t('communication.uploading')}...
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setUploadingFile(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 z-50 mb-2">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-full left-0 z-50 mb-2 bg-card border rounded-lg shadow-lg p-2">
          <div className="grid grid-cols-2 gap-2 w-48">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start h-auto p-3"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="h-5 w-5 mr-2 text-purple-500" />
              <span className="text-sm">{t('communication.photo')}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="justify-start h-auto p-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              <span className="text-sm">{t('communication.document')}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="justify-start h-auto p-3"
            >
              <Camera className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-sm">{t('communication.camera')}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="justify-start h-auto p-3"
            >
              <Mic className="h-5 w-5 mr-2 text-red-500" />
              <span className="text-sm">{t('communication.audio')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end space-x-2 p-3">
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-10 w-10 rounded-full"
          onClick={() => setShowAttachMenu(!showAttachMenu)}
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={t('communication.typeMessage')}
            className="min-h-[40px] max-h-[120px] resize-none pr-10 rounded-full border-2"
            rows={1}
          />
          
          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 h-8 w-8 rounded-full"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Send/Record Button */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            size="sm"
            className="h-10 w-10 rounded-full p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            className="h-10 w-10 rounded-full p-0"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};