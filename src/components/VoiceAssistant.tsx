import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X } from 'lucide-react';

export function VoiceAssistant({ onClose, t }: { onClose: () => void, t: (key: string) => string }) {
  const [isListening, setIsListening] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    const connect = async () => {
      sessionRef.current = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64Audio);
            }
          },
          onerror: (err) => console.error(err),
          onclose: () => console.log("Live session closed"),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: t("You are a helpful legal assistant."),
        },
      });
    };
    connect();

    return () => {
      stopListening();
      sessionRef.current?.close();
    };
  }, []);

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    
    // Simple PCM playback (assuming 24kHz, 16-bit mono)
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcmData = new Int16Array(bytes.buffer);
    const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768;
    }
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const startListening = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = inputData[i] * 32767;
      }
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      sessionRef.current?.sendRealtimeInput({ media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } });
    };
    
    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
    setIsListening(true);
  };

  const stopListening = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
    setIsListening(false);
  };

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-4 right-4"><X /></button>
      <h2 className="text-2xl font-bold mb-8">{t("Voice Assistant")}</h2>
      <button 
        onClick={isListening ? stopListening : startListening}
        className={`p-8 rounded-full ${isListening ? 'bg-red-500' : 'bg-pink-500'} text-white shadow-lg`}
      >
        {isListening ? <MicOff size={48} /> : <Mic size={48} />}
      </button>
      <p className="mt-4 text-gray-600">{isListening ? t("Listening...") : t("Tap to speak")}</p>
    </div>
  );
}
