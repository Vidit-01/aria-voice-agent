import { useEffect, useRef } from 'react';

const IDLE_IMAGE_SRC = '/landing/woman.png';
const SPEAKING_IMAGE_SRC = '/landing/talking.gif';
const SPEAKING_THRESHOLD = 30;

export default function VoiceBlob({ className = '' }) {
  const blobRef = useRef(null);
  const characterRef = useRef(null);

  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(0);

  const audioLevelRef = useRef(0);
  const smoothLevelRef = useRef(0);

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
    const characterEl = characterRef.current;
    const dataArray = dataArrayRef.current;

    if (analyser && blobEl && characterEl && dataArray) {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        sum += dataArray[i];
      }
      const current = sum / dataArray.length;
      audioLevelRef.current = current;

      smoothLevelRef.current = smoothLevelRef.current * 0.9 + current * 0.1;
      const smooth = smoothLevelRef.current;

      const normalized = Math.min(1, smooth / 100);
      const scale = 1 + normalized * 0.2;
      const glow = 28 + normalized * 38;
      const blur = 10 + normalized * 10;

      blobEl.style.transform = `scale(${scale})`;
      blobEl.style.boxShadow = `0 20px 45px rgba(37, 99, 235, 0.16), 0 0 ${glow}px rgba(125, 211, 252, 0.62), inset 0 0 ${blur}px rgba(255, 255, 255, 0.3)`;

      const shouldSpeak = smooth > SPEAKING_THRESHOLD;
      const nextSrc = shouldSpeak ? SPEAKING_IMAGE_SRC : IDLE_IMAGE_SRC;
      if (characterEl.getAttribute('src') !== nextSrc) {
        characterEl.setAttribute('src', nextSrc);
      }
    }

    rafRef.current = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    let mounted = true;

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
      <div className="blob" ref={blobRef}>
        <img
          ref={characterRef}
          src={IDLE_IMAGE_SRC}
          alt="AI assistant"
          className="blobCharacter"
          onError={(event) => {
            const img = event.currentTarget;
            if (img.src.includes('talking.gif')) {
              img.src = IDLE_IMAGE_SRC;
            }
          }}
        />
      </div>
    </div>
  );
}
