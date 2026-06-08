// components/AudioPlayer.jsx
import { useEffect, useRef, useState } from 'react';

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function AudioPlayer({ src, title, subtitle, compact = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [cur, setCur]           = useState(0);
  const [dur, setDur]           = useState(0);
  const [vol, setVol]           = useState(0.8);
  const trackRef = useRef(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded  = () => setDur(a.duration || 0);
    const onTime    = () => setCur(a.currentTime);
    const onEnded   = () => { setPlaying(false); setCur(0); };
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = vol;
  }, [vol]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play(); setPlaying(true); }
  };

  const seek = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * dur;
    setCur(pct * dur);
  };

  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  const btnSize  = compact ? 32 : 40;
  const iconSize = compact ? 14 : 16;

  const PlayIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor"
      style={{ marginRight: playing ? 0 : -2 }}>
      {playing
        ? <><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>
        : <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10-6.86a1 1 0 0 0 0-1.72l-10-6.86A1 1 0 0 0 8 5.14z"/>
      }
    </svg>
  );

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <audio ref={audioRef} src={src} preload="metadata" />
        <button onClick={toggle} aria-label={playing ? 'pause' : 'play'} style={{
          width: btnSize, height: btnSize, borderRadius: '50%',
          background: '#281814', color: '#F9F7F2',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'opacity .15s',
        }}
          onMouseOver={e => e.currentTarget.style.opacity = '.75'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <PlayIcon />
        </button>
        <div ref={trackRef} onClick={seek} style={{
          flex: 1, height: 4, borderRadius: 4,
          background: '#DED7C9', cursor: 'pointer', position: 'relative',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 4,
            background: '#8B5E3C', pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', top: '50%', left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: '#281814', pointerEvents: 'none',
          }}/>
        </div>
        <span style={{
          fontSize: 11, color: '#968F85',
          whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
          minWidth: 32,
        }}>
          {fmt(cur)}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: '#EBE6DE', borderRadius: 16,
      padding: '16px 20px', display: 'flex',
      flexDirection: 'column', gap: 12,
      border: '1px solid #DED7C9',
    }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={toggle} aria-label={playing ? 'pause' : 'play'} style={{
          width: btnSize, height: btnSize, borderRadius: '50%',
          background: '#281814', color: '#F9F7F2',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'opacity .15s',
        }}
          onMouseOver={e => e.currentTarget.style.opacity = '.75'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <PlayIcon />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && <div style={{
            fontSize: 14, fontWeight: 600, color: '#281814',
            marginBottom: 2, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 12, color: '#968F85' }}>{subtitle}</div>}
        </div>
        <div style={{
          fontSize: 12, color: '#968F85',
          whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt(cur)} / {dur > 0 ? fmt(dur) : '--:--'}
        </div>
      </div>

      <div ref={trackRef} onClick={seek} style={{
        position: 'relative', height: 4, borderRadius: 4,
        background: '#DED7C9', cursor: 'pointer',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 4,
          background: '#8B5E3C', pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', top: '50%', left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: 12, height: 12, borderRadius: '50%',
          background: '#281814', pointerEvents: 'none',
        }}/>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#968F85" strokeWidth="2" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
        <input type="range" min="0" max="100" value={vol * 100}
          onChange={e => setVol(e.target.value / 100)}
          aria-label="volume"
          style={{ width: 72, accentColor: '#8B5E3C' }}
        />
      </div>
    </div>
  );
}