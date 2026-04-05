import { useEffect, useRef } from 'react';

const IDLE_IMAGE_SRC = '/may.png';
const SPEAKING_VIDEO_SRC = '/may.mp4';
const SPEAKING_THRESHOLD = 22;
const SWITCH_CHECK_INTERVAL_MS = 280;
const MIN_STATE_HOLD_MS = 900;

export default function VoiceBlob({ className = '', isAgentSpeaking = false }) {
  const blobRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(0);

  const audioLevelRef = useRef(0);
  const smoothLevelRef = useRef(0);
  const speakingRef = useRef(false);
  const aiSpeakingRef = useRef(isAgentSpeaking);
  const lastSwitchAtRef = useRef(0);
  const lastCheckAtRef = useRef(0);

  const setupAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new window.AudioContext();
    audioCtxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
  };

  const animate = () => {
    const analyser = analyserRef.current;
    const blobEl = blobRef.current;
    const imageEl = imageRef.current;
    const videoEl = videoRef.current;
    const dataArray = dataArrayRef.current;

    if (analyser && blobEl && imageEl && videoEl && dataArray) {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        sum += dataArray[i];
      }
      const current = sum / dataArray.length;
      audioLevelRef.current = current;

      smoothLevelRef.current = smoothLevelRef.current * 0.9 + current * 0.1;
      const smooth = smoothLevelRef.current;

      const normalized = Math.min(1, smooth / 55);
      const scale = 1.02 + normalized * 0.33;
      const glow = 56 + normalized * 70;
      const blur = 22 + normalized * 20;
      const now = performance.now();
      const shake = 0.42 + normalized * 2.35;
      const vibrateX = Math.sin(now * 0.078) * shake;
      const vibrateY = Math.cos(now * 0.1) * shake * 0.8;
      const fluidX = Math.sin(now * 0.004 + smooth * 0.025) * (0.008 + normalized * 0.038);
      const fluidY = Math.cos(now * 0.0046 + smooth * 0.02) * (0.008 + normalized * 0.032);
      const scaleX = scale * (1 + fluidX);
      const scaleY = scale * (1 - fluidY);
      const rotate = Math.sin(now * 0.0038) * (0.5 + normalized * 1.45);
      const morphAmpA = 1.4 + normalized * 4.2;
      const morphAmpB = 1.2 + normalized * 3.8;
      const r1 = 50 + Math.sin(now * 0.0022) * morphAmpA;
      const r2 = 50 + Math.cos(now * 0.0024) * morphAmpB;
      const r3 = 50 + Math.sin(now * 0.002 + 1.3) * morphAmpA;
      const r4 = 50 + Math.cos(now * 0.0021 + 0.8) * morphAmpB;
      const r5 = 50 + Math.cos(now * 0.0023) * morphAmpA;
      const r6 = 50 + Math.sin(now * 0.0025 + 0.7) * morphAmpB;
      const r7 = 50 + Math.cos(now * 0.002 + 1.6) * morphAmpA;
      const r8 = 50 + Math.sin(now * 0.0023 + 1.1) * morphAmpB;

      blobEl.style.transform = `translate3d(${vibrateX}px, ${vibrateY}px, 0) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;
      blobEl.style.borderRadius = `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`;
      blobEl.style.boxShadow = `0 18px 52px rgba(45, 84, 155, 0.18), 0 0 ${glow}px rgba(147, 197, 253, 0.56), inset 0 0 ${blur}px rgba(255, 255, 255, 0.46)`;

      if (now - lastCheckAtRef.current >= SWITCH_CHECK_INTERVAL_MS) {
        lastCheckAtRef.current = now;
        const shouldSpeak = aiSpeakingRef.current || smooth > SPEAKING_THRESHOLD;
        const canSwitch = now - lastSwitchAtRef.current >= MIN_STATE_HOLD_MS;

        if (shouldSpeak !== speakingRef.current && canSwitch) {
          lastSwitchAtRef.current = now;
          speakingRef.current = shouldSpeak;
          imageEl.style.opacity = shouldSpeak ? '0' : '1';
          videoEl.style.opacity = shouldSpeak ? '1' : '0';

          if (shouldSpeak) {
            void videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
            videoEl.currentTime = 0;
          }
        }
      }
    }

    rafRef.current = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    aiSpeakingRef.current = isAgentSpeaking;
  }, [isAgentSpeaking]);

  useEffect(() => {
    let mounted = true;
    const startedAt = performance.now();
    lastSwitchAtRef.current = startedAt;
    lastCheckAtRef.current = startedAt;

    const start = async () => {
      try {
        await setupAudio();
      } catch (error) {
        if (mounted) {
          console.warn('VoiceBlob audio setup failed:', error);
        }
      } finally {
        if (mounted) {
          rafRef.current = window.requestAnimationFrame(animate);
        }
      }
    };

    void start();

    return () => {
      mounted = false;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`voiceBlobWrap ${className}`}>
      <div className="blob" ref={blobRef} aria-hidden="true" />
      <div className="blobCharacterLayer">
        <img
          ref={imageRef}
          src={IDLE_IMAGE_SRC}
          alt="AI assistant"
          className="blobCharacter"
        />
        <video
          ref={videoRef}
          className="blobCharacterVideo"
          src={SPEAKING_VIDEO_SRC}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
