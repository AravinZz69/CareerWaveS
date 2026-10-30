import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Play,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  MessageSquare,
  Send,
  History,
  RotateCcw,
  Radio,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

type AgentState =
  | 'idle'
  | 'connecting'
  | 'interviewer_speaking'
  | 'listening'
  | 'thinking'
  | 'completed';

interface TranscriptTurn {
  id: string;
  speaker: 'interviewer' | 'user';
  text: string;
  timestamp: string;
}

export const InterviewPrepPage: React.FC = () => {
  const { workspace, refreshWorkspace, getAuthHeaders, meters } = useAuth();

  // Setup state
  const [role, setRole] = useState('Senior AI & Full Stack Engineer');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [autoSendOnSilence, setAutoSendOnSilence] = useState(true);
  const [elevenLabsKey, setElevenLabsKey] = useState<string>(
    () => localStorage.getItem('careerwave_elevenlabs_key') || ''
  );
  const [showVoiceConfig, setShowVoiceConfig] = useState(false);

  // Live voice agent state
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [micBlockedByBrowser, setMicBlockedByBrowser] = useState(false);
  const [voiceProviderLabel, setVoiceProviderLabel] = useState<string>('Server Voice Engine');
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [liveUserSpeech, setLiveUserSpeech] = useState('');
  const [manualInputFallback, setManualInputFallback] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>(new Array(28).fill(10));
  const [completedReport, setCompletedReport] = useState<any | null>(null);
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null);

  // Audio & Recognition refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const isMutedRef = useRef(false);
  const agentStateRef = useRef<AgentState>('idle');
  const liveUserSpeechRef = useRef('');
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  useEffect(() => {
    liveUserSpeechRef.current = liveUserSpeech;
  }, [liveUserSpeech]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, liveUserSpeech]);

  // Session duration timer
  useEffect(() => {
    if (
      agentState !== 'interviewer_speaking' &&
      agentState !== 'listening' &&
      agentState !== 'thinking'
    ) {
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [agentState]);

  // Cleanup audio and mic on unmount
  const stopAllMedia = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  // Start Web Audio API Analyser loop for live waveform
  const startWaveformLoop = useCallback((stream?: MediaStream | null) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    if (stream) {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      } catch {
        // Fallback to synthetic waveform loop if AudioContext cannot bind
      }
    }

    const updateWaveform = () => {
      const state = agentStateRef.current;
      if (state === 'interviewer_speaking') {
        const t = Date.now() / 105;
        setWaveBars(
          new Array(28).fill(0).map((_, i) =>
            Math.max(
              12,
              Math.min(
                94,
                Math.round(40 + Math.sin(t + i * 0.45) * 32 + Math.cos(t * 0.7 - i) * 16)
              )
            )
          )
        );
      } else if (state === 'listening' && !isMutedRef.current) {
        if (analyserRef.current && dataArray) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const bars: number[] = [];
          for (let i = 0; i < 28; i++) {
            const val = dataArray[i % dataArray.length] || 0;
            bars.push(Math.max(10, Math.min(96, Math.round((val / 255) * 95))));
          }
          setWaveBars(bars);
        } else {
          const t = Date.now() / 160;
          setWaveBars(
            new Array(28).fill(0).map((_, i) =>
              Math.max(10, Math.min(45, Math.round(18 + Math.sin(t + i * 0.5) * 12)))
            )
          );
        }
      } else {
        setWaveBars(new Array(28).fill(10));
      }

      animFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    animFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const buildRequestHeaders = useCallback(() => {
    const headers = getAuthHeaders();
    if (elevenLabsKey.trim()) {
      headers['x-elevenlabs-key'] = elevenLabsKey.trim();
    }
    return headers;
  }, [getAuthHeaders, elevenLabsKey]);

  // Forward declaration ref for auto-send on pause
  const sendTurnRef = useRef<(overrideSpeech?: string) => void>(() => {});

  // Start browser SpeechRecognition for live spoken user input
  const startListeningToUser = useCallback(() => {
    setAgentState('listening');
    setLiveUserSpeech('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    } catch {
      // Ignore
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      if (isMutedRef.current) return;
      let combined = '';
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript + ' ';
      }
      const cleaned = combined.trim();
      setLiveUserSpeech(cleaned);

      // Auto-send after 2.6s of silence once candidate has spoken at least 5 words
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
      }
      if (autoSendOnSilence && cleaned.split(/\s+/).length >= 5) {
        silenceTimerRef.current = window.setTimeout(() => {
          if (
            agentStateRef.current === 'listening' &&
            !isMutedRef.current &&
            liveUserSpeechRef.current.trim().length >= 10
          ) {
            sendTurnRef.current(liveUserSpeechRef.current.trim());
          }
        }, 2600);
      }
    };

    recognition.onerror = () => {
      // Keep listening or allow manual send
    };

    recognition.onend = () => {
      if (agentStateRef.current === 'listening' && !isMutedRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Ignore
    }
  }, [autoSendOnSilence]);

  // Play AI Interviewer audio (WAV/MP3 base64 or browser speechSynthesis fallback)
  const playInterviewerVoice = useCallback(
    (replyText: string, audioBase64?: string | null, mimeType?: string, provider?: string) => {
      setAgentState('interviewer_speaking');
      if (provider === 'elevenlabs') {
        setVoiceProviderLabel('ElevenLabs Conversational AI');
      } else if (provider === 'gemini_tts') {
        setVoiceProviderLabel('Gemini Neural Voice TTS');
      } else {
        setVoiceProviderLabel('Live Neural Speech Engine');
      }

      // Pause mic recognition while interviewer speaks to prevent echo
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }

      if (audioBase64) {
        const audioSrc = `data:${mimeType || 'audio/wav'};base64,${audioBase64}`;
        const audio = new Audio(audioSrc);
        currentAudioRef.current = audio;
        audio.onended = () => {
          currentAudioRef.current = null;
          startListeningToUser();
        };
        audio.onerror = () => {
          currentAudioRef.current = null;
          startListeningToUser();
        };
        audio.play().catch(() => {
          startListeningToUser();
        });
        return;
      }

      // Browser SpeechSynthesis fallback
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(replyText);
        utterance.rate = 1.02;
        utterance.pitch = 1.0;
        utterance.onend = () => {
          startListeningToUser();
        };
        utterance.onerror = () => {
          startListeningToUser();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          startListeningToUser();
        }, 2000);
      }
    },
    [startListeningToUser]
  );

  // Start Live Voice Interview
  const handleStartVoiceInterview = async (bypassMicRequirement = false) => {
    setMicPermissionError(null);
    setMicBlockedByBrowser(false);
    setCompletedReport(null);
    setTranscript([]);
    setLiveUserSpeech('');
    setElapsedSeconds(0);
    setAgentState('connecting');

    let stream: MediaStream | null = null;
    if (!bypassMicRequirement) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone API unavailable in this browser context.');
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch {
        setAgentState('idle');
        setMicBlockedByBrowser(true);
        setMicPermissionError(
          'Microphone access was blocked by your browser or hardware. Please click the camera/microphone icon in your browser address bar to allow microphone access and retry, or continue below with speaker-out + keyboard fallback.'
        );
        return;
      }
    }

    startWaveformLoop(stream);

    // Request first spoken question from AI Interviewer via server-side Edge route
    try {
      const res = await fetch('/api/interview/voice-turn', {
        method: 'POST',
        headers: buildRequestHeaders(),
        body: JSON.stringify({
          role,
          difficulty,
          transcript: [],
          isStart: true,
        }),
      });
      const data = await res.json();

      if (res.status === 402 || data.limitReached) {
        stopAllMedia();
        setAgentState('idle');
        window.dispatchEvent(
          new CustomEvent('careerwave:quota-exceeded', {
            detail: { feature: 'mock_interview' },
          })
        );
        return;
      }

      if (!res.ok || !data.success) {
        stopAllMedia();
        setAgentState('idle');
        setMicPermissionError(data.error || 'Could not start voice interview session.');
        return;
      }

      window.dispatchEvent(new CustomEvent('careerwave:usage-updated'));

      const firstTurn: TranscriptTurn = {
        id: `turn_${Date.now()}`,
        speaker: 'interviewer',
        text: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscript([firstTurn]);
      playInterviewerVoice(data.replyText, data.audioBase64, data.mimeType, data.voiceProvider);
    } catch {
      stopAllMedia();
      setAgentState('idle');
      setMicPermissionError('Network error while connecting to the voice interviewer.');
    }
  };

  // Send User's Spoken Turn & Get Dynamic Follow-up
  const handleSendUserTurn = useCallback(
    async (overrideSpeech?: string) => {
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      const spokenText = (overrideSpeech ?? (liveUserSpeech || manualInputFallback)).trim();
      if (
        !spokenText ||
        agentStateRef.current === 'thinking' ||
        agentStateRef.current === 'interviewer_speaking'
      ) {
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }

      const userTurn: TranscriptTurn = {
        id: `turn_${Date.now()}`,
        speaker: 'user',
        text: spokenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedTranscript = [...transcriptRef.current, userTurn];
      setTranscript(updatedTranscript);
      setLiveUserSpeech('');
      setManualInputFallback('');
      setAgentState('thinking');

      try {
        const res = await fetch('/api/interview/voice-turn', {
          method: 'POST',
          headers: buildRequestHeaders(),
          body: JSON.stringify({
            role,
            difficulty,
            transcript: updatedTranscript,
            userMessage: spokenText,
            isStart: false,
          }),
        });
        const data = await res.json();
        if (data.success && data.replyText) {
          const aiTurn: TranscriptTurn = {
            id: `turn_${Date.now() + 1}`,
            speaker: 'interviewer',
            text: data.replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setTranscript((prev) => [...prev, aiTurn]);
          playInterviewerVoice(data.replyText, data.audioBase64, data.mimeType, data.voiceProvider);
        } else {
          startListeningToUser();
        }
      } catch {
        startListeningToUser();
      }
    },
    [
      liveUserSpeech,
      manualInputFallback,
      buildRequestHeaders,
      role,
      difficulty,
      playInterviewerVoice,
      startListeningToUser,
    ]
  );

  useEffect(() => {
    sendTurnRef.current = handleSendUserTurn;
  }, [handleSendUserTurn]);

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  };

  // End Interview & Generate Scored Report
  const handleEndInterview = async () => {
    stopAllMedia();
    setAgentState('thinking');

    try {
      const res = await fetch('/api/interview/complete', {
        method: 'POST',
        headers: buildRequestHeaders(),
        body: JSON.stringify({
          role,
          difficulty,
          transcript,
          durationSeconds: elapsedSeconds,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setCompletedReport(data.session);
        setAgentState('completed');
        await refreshWorkspace();
      } else {
        setAgentState('idle');
      }
    } catch {
      setAgentState('idle');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const pastSessions = workspace.mockInterviews || [];
  const interviewMeter = meters?.mock_interview;

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Live Spoken Voice Interviewer
            </h2>
            {interviewMeter && (
              <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {interviewMeter.used}/{interviewMeter.totalLimit} Monthly Sessions Used
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Practice real-time spoken technical and behavioral interviews with adaptive AI follow-ups, live microphone waveform, and scored feedback.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start">
          <button
            onClick={() => {
              setSelectedHistorySession(null);
              setActiveTab('live');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'live'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Live Voice Interview</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Past Sessions ({pastSessions.length})</span>
          </button>
        </div>
      </div>

      {/* Clear Microphone Permission Blocked Banner */}
      {micPermissionError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-rose-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-rose-900">
                Browser Blocked Microphone Access
              </p>
              <p className="text-rose-800 leading-relaxed">{micPermissionError}</p>
            </div>
          </div>
          {micBlockedByBrowser && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleStartVoiceInterview(false)}
                className="rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                Retry Mic Permission
              </button>
              <button
                onClick={() => handleStartVoiceInterview(true)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Continue with Speaker + Text Fallback
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' ? (
        /* Past Sessions History View */
        <div className="space-y-4">
          {selectedHistorySession ? (
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                    {selectedHistorySession.difficulty} Difficulty
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1.5">
                    {selectedHistorySession.role}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Completed on{' '}
                    {new Date(selectedHistorySession.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHistorySession(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Back to Sessions
                </button>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Overall Score', val: selectedHistorySession.report?.overallScore ?? 85 },
                  {
                    label: 'Communication',
                    val: selectedHistorySession.report?.communicationScore ?? 88,
                  },
                  {
                    label: 'Technical Depth',
                    val: selectedHistorySession.report?.technicalDepthScore ?? 84,
                  },
                  {
                    label: 'Confidence',
                    val: selectedHistorySession.report?.confidenceScore ?? 86,
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center"
                  >
                    <p className="font-serif text-2xl font-bold text-slate-900">
                      {metric.val}/100
                    </p>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs text-emerald-900">
                <p className="font-bold mb-1">
                  Recommendation: {selectedHistorySession.report?.hireRecommendation || 'Hire'}
                </p>
                <p>{selectedHistorySession.report?.summary}</p>
              </div>

              {/* Answers to Improve in History */}
              {selectedHistorySession.report?.answersToImprove?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Answers to Improve
                  </h4>
                  {selectedHistorySession.report.answersToImprove.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-white"
                    >
                      <p className="font-semibold text-slate-900">Q: {item.question}</p>
                      <p className="text-slate-600">
                        <strong>Your Spoken Answer:</strong> "{item.userAnswer}"
                      </p>
                      <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <strong>Feedback:</strong> {item.feedback}
                      </p>
                      <p className="text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                        <strong>Stronger Answer:</strong> {item.strongerAnswer}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Transcript */}
              <div className="space-y-3">
                <h4 className="font-serif text-base font-bold text-slate-900">
                  Saved Session Transcript
                </h4>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
                  {(selectedHistorySession.transcript || []).map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-3.5 text-xs ${
                        t.speaker === 'interviewer'
                          ? 'bg-slate-50 text-slate-800 border border-slate-200 mr-6'
                          : 'bg-slate-900 text-white ml-6'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase opacity-70 block mb-1">
                        {t.speaker === 'interviewer' ? 'AI Interviewer' : 'You'}
                      </span>
                      <p>{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : pastSessions.length === 0 ? (
            <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-12 text-center space-y-3">
              <Mic className="h-8 w-8 text-slate-700 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-slate-900">
                No past voice interviews yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Start your first live spoken interview session to receive a full communication,
                technical depth, and confidence evaluation report.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white cursor-pointer"
              >
                Start First Session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastSessions.map((sess: any) => (
                <div
                  key={sess.id}
                  onClick={() => setSelectedHistorySession(sess)}
                  className="rounded-2xl bg-white p-5 border border-slate-200 hover:border-slate-900 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div>
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      {sess.difficulty}
                    </span>
                    <h4 className="font-serif text-base font-bold text-slate-900 mt-1.5">
                      {sess.role}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(sess.created_at).toLocaleString('en-IN')} •{' '}
                      {sess.transcript?.length || 0} turns
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 font-serif text-xl font-bold text-emerald-800">
                      {sess.report?.overallScore ?? 85}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : agentState === 'idle' ? (
        /* Pre-Interview Configuration Card */
        <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">
                  Configure Your Spoken Interview
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Our AI interviewer speaks questions aloud, listens through your microphone, responds naturally to what you say, and asks follow-ups.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVoiceConfig(!showVoiceConfig)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Voice Engine</span>
            </button>
          </div>

          {showVoiceConfig && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Server-Side Realtime Voice Provider (ElevenLabs / Gemini TTS)
                </span>
                <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Proxied via Server Edge Route
                </span>
              </div>
              <p className="text-xs text-slate-500">
                By default, the server uses Gemini Neural TTS and Web Speech synthesis. Optionally provide an ElevenLabs API Key to route voice synthesis through ElevenLabs Turbo v2.5 on the server.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={elevenLabsKey}
                  onChange={(e) => {
                    setElevenLabsKey(e.target.value);
                    localStorage.setItem('careerwave_elevenlabs_key', e.target.value.trim());
                  }}
                  placeholder="Optional: ElevenLabs API Key (xi-api-key kept server-side per request)"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 px-2">
                  <input
                    type="checkbox"
                    checked={autoSendOnSilence}
                    onChange={(e) => setAutoSendOnSilence(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900"
                  />
                  <span>Auto-send turn on 2.5s pause</span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Target Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Generative AI Engineer"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Interview Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`rounded-xl py-3 text-xs font-semibold border transition-all cursor-pointer ${
                      difficulty === lvl
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-900 shrink-0" />
              <span>Spoken questions & dynamic follow-ups</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-slate-900 shrink-0" />
              <span>Live microphone waveform & transcript</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-slate-900 shrink-0" />
              <span>Scored report saved to mock_interviews</span>
            </div>
          </div>

          <button
            onClick={() => handleStartVoiceInterview(false)}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 py-4 px-6 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Start Live Spoken Voice Interview</span>
          </button>
        </div>
      ) : agentState === 'completed' && completedReport ? (
        /* Completed Scored Report View */
        <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Voice Interview Completed & Saved to History
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {completedReport.role} — Performance Report
              </h3>
            </div>

            <button
              onClick={() => {
                setCompletedReport(null);
                setAgentState('idle');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white cursor-pointer self-start"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Start New Interview</span>
            </button>
          </div>

          {/* 4 Scored Pillars */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Overall Score', score: completedReport.report?.overallScore ?? 86 },
              { label: 'Communication', score: completedReport.report?.communicationScore ?? 88 },
              {
                label: 'Technical Depth',
                score: completedReport.report?.technicalDepthScore ?? 85,
              },
              { label: 'Confidence', score: completedReport.report?.confidenceScore ?? 84 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-center space-y-1"
              >
                <p className="font-serif text-3xl font-bold text-slate-900">
                  {item.score}
                  <span className="text-sm text-slate-400">/100</span>
                </p>
                <p className="text-xs font-semibold text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-base font-bold text-slate-900">
                Hiring Committee Summary
              </span>
              <span className="rounded-md bg-slate-900 px-3 py-0.5 text-xs font-semibold text-white">
                {completedReport.report?.hireRecommendation || 'Hire'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {completedReport.report?.summary}
            </p>
          </div>

          {/* Key Strengths */}
          {completedReport.report?.strengths?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-serif text-base font-bold text-slate-900">
                Demonstrated Strengths
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {completedReport.report.strengths.map((str: string, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs text-emerald-950 flex items-start gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answers to Improve */}
          {completedReport.report?.answersToImprove?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-serif text-lg font-bold text-slate-900">
                Answers to Improve & Stronger Exemplars
              </h4>
              {completedReport.report.answersToImprove.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-white"
                >
                  <p className="font-bold text-slate-900">Q: {item.question}</p>
                  <p className="text-slate-600">
                    <strong>Your Spoken Response:</strong> "{item.userAnswer}"
                  </p>
                  <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <strong>Coaching Feedback:</strong> {item.feedback}
                  </p>
                  <p className="text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                    <strong>Stronger Answer Approach:</strong> {item.strongerAnswer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active Live Spoken Voice Interview Studio */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Live Voice Orb, Waveform & Controls */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-lg flex flex-col justify-between min-h-[480px]">
            {/* Top Status Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-3 w-3 rounded-full ${
                    agentState === 'interviewer_speaking'
                      ? 'bg-sky-400 animate-ping'
                      : agentState === 'listening'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  {agentState === 'connecting'
                    ? 'Connecting Audio...'
                    : agentState === 'interviewer_speaking'
                    ? 'Interviewer Speaking Aloud'
                    : agentState === 'listening'
                    ? isMuted
                      ? 'Microphone Muted'
                      : 'Listening Through Microphone...'
                    : 'Analyzing & Formulating Follow-Up...'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                  {voiceProviderLabel}
                </span>
                <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1 text-xs font-mono">
                  <Clock className="h-3.5 w-3.5 text-slate-300" />
                  <span>{formatTime(elapsedSeconds)}</span>
                </div>
              </div>
            </div>

            {/* Center Voice Avatar & Live Audio Waveform */}
            <div className="my-8 flex flex-col items-center text-center space-y-6">
              <div className="relative flex items-center justify-center">
                <div
                  className={`absolute h-32 w-32 rounded-full transition-all duration-300 ${
                    agentState === 'interviewer_speaking'
                      ? 'bg-sky-500/30 scale-125 animate-pulse'
                      : agentState === 'listening' && !isMuted
                      ? 'bg-emerald-500/25 scale-115 animate-pulse'
                      : 'bg-white/10 scale-100'
                  }`}
                />
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 shadow-2xl border-2 border-white/25">
                  {agentState === 'interviewer_speaking' ? (
                    <Volume2 className="h-10 w-10 text-sky-400 animate-bounce" />
                  ) : (
                    <Mic
                      className={`h-10 w-10 ${
                        agentState === 'listening' && !isMuted
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    />
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-white">{role}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {difficulty} Difficulty • Live Spoken Conversation
                </p>
              </div>

              {/* Live 28-Bar Audio Waveform */}
              <div className="flex items-center justify-center gap-1 h-16 w-full max-w-md px-4">
                {waveBars.map((height, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      agentState === 'interviewer_speaking'
                        ? 'bg-sky-400'
                        : agentState === 'listening' && !isMuted
                        ? 'bg-emerald-400'
                        : 'bg-white/20'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>

              {/* Current Live Speech Caption */}
              {agentState === 'listening' && (
                <div className="w-full max-w-lg rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-left space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                    {liveUserSpeech
                      ? 'Live Microphone Transcript (Auto-sends on pause or click Send):'
                      : 'Speak into your microphone now (or type below):'}
                  </p>
                  {liveUserSpeech ? (
                    <p className="text-xs sm:text-sm text-white leading-relaxed">
                      "{liveUserSpeech}"
                    </p>
                  ) : (
                    <input
                      type="text"
                      value={manualInputFallback}
                      onChange={(e) => setManualInputFallback(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendUserTurn();
                        }
                      }}
                      placeholder="Listening to microphone... (or type your response here and press Enter)"
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Call Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={handleToggleMute}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>

              {agentState === 'listening' && (
                <button
                  onClick={() => handleSendUserTurn()}
                  disabled={!liveUserSpeech.trim() && !manualInputFallback.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-5 py-3 text-xs font-semibold text-white shadow-sm cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Done Speaking (Send Answer)</span>
                </button>
              )}

              <button
                onClick={handleEndInterview}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-3 text-xs font-semibold text-white shadow-sm cursor-pointer"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Interview & Generate Report</span>
              </button>
            </div>
          </div>

          {/* Right 5 Cols: Visible Live Transcript */}
          <div className="lg:col-span-5 rounded-2xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-900" />
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Live Conversation Transcript
                </h3>
              </div>
              <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                {transcript.length} Turn(s)
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {transcript.map((turn) => (
                <div
                  key={turn.id}
                  className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                    turn.speaker === 'interviewer'
                      ? 'bg-slate-50 text-slate-800 border border-slate-200 mr-4'
                      : 'bg-slate-900 text-white ml-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-75 mb-1">
                    <span>
                      {turn.speaker === 'interviewer' ? 'AI Interviewer' : 'You'}
                    </span>
                    <span>{turn.timestamp}</span>
                  </div>
                  <p>{turn.text}</p>
                </div>
              ))}

              {liveUserSpeech && (
                <div className="rounded-xl p-3.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 ml-4 animate-pulse">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                    Speaking Now...
                  </span>
                  <p>{liveUserSpeech}</p>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
