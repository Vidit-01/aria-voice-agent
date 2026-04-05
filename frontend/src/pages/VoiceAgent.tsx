import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  BarVisualizer,
  useChat,
  useLocalParticipant,
  useTranscriptions,
  useTrackToggle,
} from '@livekit/components-react';
import { TokenSource, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './VoiceAgent.css';

const tokenSource = TokenSource.sandboxTokenServer('codeshashtra-tg6qxa');

function isBenignDisconnectError(err: unknown) {
  const message =
    typeof err === 'object' && err && 'message' in err
      ? String((err as { message: unknown }).message)
      : '';
  return (
    message.includes('Client initiated disconnect') ||
    message.includes('Abort connection attempt due to user initiated disconnect')
  );
}

type SummaryItem = {
  id: string;
  kind: 'chat' | 'transcript';
  timestamp: number;
  isMine: boolean;
  fromLabel: string;
  text: string;
};

export default function VoiceAgent() {
  useDocumentTitle('Voice Session');

  const sessionOptions = useMemo(() => ({ agentName: 'my-agent' }), []);
  const session = useSession(tokenSource, sessionOptions);
  const startSession = session.start;
  const endSession = session.end;

  useEffect(() => {
    let cancelled = false;

    void startSession().catch((err) => {
      if (cancelled && isBenignDisconnectError(err)) return;
      console.error('LiveKit session.start() failed', err);
    });

    return () => {
      cancelled = true;
      void endSession().catch((err) => {
        if (isBenignDisconnectError(err)) return;
        console.warn('LiveKit session.end() failed', err);
      });
    };
  }, [startSession, endSession]);

  return (
    <SessionProvider session={session}>
      <div data-lk-theme="default" className="appShell">
        <div className="appBg" aria-hidden="true" />

        <header className="vaTopBar">
          <Link to="/dashboard" className="vaBackButton">
            ← Dashboard
          </Link>
          <div className="brandMark" aria-label="Fateh">
            F
          </div>
        </header>

        <main className="mainGrid">
          <section className="card leftCard" aria-label="Voice assistant">
            <AgentPanel />
          </section>

          <aside className="rightColumn" aria-label="Side panels">
            <section className="card chatCard" aria-label="Chat">
              <ChatPanel />
            </section>
          </aside>
        </main>

        <RoomAudioRenderer />
      </div>
    </SessionProvider>
  );
}

function AgentPanel() {
  const agent = useAgent();
  const statusText = useMemo(() => {
    const state = agent.state ?? 'unknown';
    if (state === 'listening' || agent.canListen) return 'Listening...';
    if (state === 'speaking') return 'Speaking...';
    if (state === 'connecting') return 'Connecting...';
    return String(state).replaceAll('-', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }, [agent.canListen, agent.state]);

  const { enabled: micEnabled, pending: micPending, buttonProps } = useTrackToggle({
    source: Track.Source.Microphone,
    initialState: true,
  });

  return (
    <div className="agentPanel">
      <div className="agentAvatar" aria-hidden="true">
        <div className="agentAvatarInner" />
      </div>

      <div className="agentStatus">
        <div className="agentTitle">Fateh AI Counsellor</div>
        <div className="agentSubtitle">{statusText}</div>
      </div>

      <div className="micRow" aria-label="Microphone controls">
        <button
          {...buttonProps}
          className={`micButton ${micEnabled ? 'isOn' : 'isOff'}`}
          disabled={Boolean(buttonProps.disabled) || micPending}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          <span className="micButtonRing" aria-hidden="true" />
          <span className="micButtonIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path
                d="M12 14.5a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5.5a3 3 0 0 0 3 3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 11.5a7 7 0 0 1-14 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 18.5v3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 21.5h7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        <div className="waveWrap" aria-label="Voice activity">
          {agent.canListen && agent.microphoneTrack ? (
            <BarVisualizer
              track={agent.microphoneTrack}
              state={agent.state}
              barCount={18}
            />
          ) : (
            <div className="wavePlaceholder" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="micHint">
        {micPending ? 'Starting microphone...' : micEnabled ? 'Speak now' : 'Mic is off'}
      </div>
    </div>
  );
}

function ChatPanel() {
  const agent = useAgent();
  const { localParticipant } = useLocalParticipant();
  const { chatMessages, send, isSending } = useChat();
  const transcriptions = useTranscriptions();
  const [draft, setDraft] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  const mergedMessages = useMemo<SummaryItem[]>(() => {
    const localIdentity = localParticipant?.identity;
    const chat = chatMessages.map((m) => {
      const fromIdentity = m.from?.identity;
      const isMine =
        fromIdentity && localIdentity ? fromIdentity === localIdentity : false;
      const fromLabel = m.from?.name || fromIdentity || (isMine ? 'You' : 'User');
      return {
        kind: 'chat' as const,
        id: `chat:${m.id}`,
        timestamp: m.timestamp,
        isMine,
        fromLabel,
        text: m.message,
      };
    });

    const transcript = transcriptions.map((t) => {
      const fromIdentity = t.participantInfo?.identity;
      const isMine =
        fromIdentity && localIdentity ? fromIdentity === localIdentity : false;
      const fromLabel = isMine ? 'You' : fromIdentity || 'Transcript';
      return {
        kind: 'transcript' as const,
        id: `tr:${t.streamInfo?.id ?? `${fromLabel}:${t.streamInfo?.timestamp ?? 0}`}`,
        timestamp: t.streamInfo?.timestamp ?? 0,
        isMine,
        fromLabel,
        text: t.text,
      };
    });

    return [...chat, ...transcript].sort((a, b) => a.timestamp - b.timestamp);
  }, [chatMessages, localParticipant?.identity, transcriptions]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [mergedMessages.length]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    await send(text);
    setDraft('');
  }

  const isOnline = agent.state !== 'failed';
  const subtitle = `${isOnline ? 'Online' : 'Offline'} / ${
    agent.canListen ? 'Listening' : 'Idle'
  }`;

  return (
    <div className={`chatPanel ${isOpen ? 'isOpen' : 'isCollapsed'}`}>
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <div className="chatHeaderTitle">Fateh AI Counsellor</div>
          <div className="chatHeaderSubtitle">
            <span
              className={`presenceDot ${isOnline ? 'isOnline' : 'isOffline'}`}
              aria-hidden="true"
            />
            {subtitle}
          </div>
        </div>
        <button
          className="iconButton chatCloseButton"
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? 'Close' : 'Open'}
        </button>
      </div>

      {isOpen ? (
        <>
          <div className="chatBody" role="log" aria-label="Messages">
            {mergedMessages.length === 0 ? (
              <div className="chatEmpty">Start a conversation...</div>
            ) : (
              mergedMessages.map((m) => (
                <div
                  key={m.id}
                  className={`chatMsgRow ${m.isMine ? 'isMine' : 'isTheirs'}`}
                >
                  <div className="chatMsgMeta">
                    {m.kind === 'transcript' ? 'TRANSCRIPT' : 'MESSAGE'} • {m.fromLabel}
                  </div>
                  <div
                    className={`chatBubble ${m.kind === 'transcript' ? 'isTranscript' : ''}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <form className="chatComposer" onSubmit={onSubmit}>
            <input
              className="chatInput"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              aria-label="Message"
            />
            <button
              className="sendButton"
              type="submit"
              disabled={isSending || draft.trim().length === 0}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </>
      ) : (
        <div className="chatCollapsed">
          <div className="chatCollapsedTitle">Chat closed</div>
          <div className="chatCollapsedText">Reopen the chat to continue.</div>
        </div>
      )}
    </div>
  );
}
