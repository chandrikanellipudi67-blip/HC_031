import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchNormal1, Microphone2, CloseCircle } from 'iconsax-react';
import { toast } from 'sonner';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder }: SearchBarProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(transcript);
        setIsListening(false);
        toast.success('Voice search complete');
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice search failed. Please try again.');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onChange]);

  const handleVoiceSearch = () => {
    if (!recognition) {
      toast.error('Voice search not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('Listening... Speak now');
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <SearchNormal1 size={20} />
      </div>
      
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Search hospitals, clinics, pharmacies...'}
        className="pl-10 pr-24 h-12 text-base"
      />
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="h-8 w-8 p-0"
          >
            <CloseCircle size={20} />
          </Button>
        )}
        
        <Button
          size="sm"
          variant={isListening ? 'default' : 'ghost'}
          onClick={handleVoiceSearch}
          className={`h-8 w-8 p-0 ${isListening ? 'animate-pulse' : ''}`}
        >
          <Microphone2 size={20} variant="Outline" />
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;