// MobilePreview.jsx
import React, { useState, useEffect, useRef } from "react";

// Hide web scrollbars so it looks like a native mobile app
const injectStyles = () => {
  if (
    typeof document !== "undefined" &&
    !document.getElementById("mobile-preview-styles")
  ) {
    const style = document.createElement("style");
    style.id = "mobile-preview-styles";
    style.innerHTML = `
      .native-scroll::-webkit-scrollbar { display: none; }
      .native-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
  }
};

/* ─── CONSTANTS & SCALING ───────────────────────────────────────────────── */
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const PREVIEW_WIDTH = 240;
const SCALE = PREVIEW_WIDTH / PHONE_WIDTH; // ~0.615
const PREVIEW_HEIGHT = PHONE_HEIGHT * SCALE;

const FONTS = {
  regular: "Vazirmatn, Tahoma, sans-serif",
  bold: "Vazirmatn, Tahoma, sans-serif",
};

/* ─── HELPERS ───────────────────────────────────────────────────────────── */
const fmt = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function buildAlbums(songs) {
  if (!songs || songs.length === 0) return [];
  const map = {};
  songs.forEach((song) => {
    const albumName = song.album || "تک‌آهنگ‌ها";
    if (!map[albumName]) {
      map[albumName] = {
        title: albumName,
        subtitle: "مجموعه قطعات صوتی",
        coverUrl: song.imageUrl || null,
        tracks: [],
      };
    }
    map[albumName].tracks.push(song);
    if (!map[albumName].coverUrl && song.imageUrl) {
      map[albumName].coverUrl = song.imageUrl;
    }
  });
  return Object.values(map);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MobilePreview({ song, songs }) {
  useEffect(() => {
    injectStyles();
  }, []);

  const [screen, setScreen] = useState("player");
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [activeSong, setActiveSong] = useState(song || null);

  const albums = buildAlbums(songs);

  useEffect(() => {
    if (song) {
      setActiveSong(song);
      setScreen("player");
      if (song.album) {
        const parentAlbum = albums.find((a) => a.title === song.album);
        if (parentAlbum) setActiveAlbum(parentAlbum);
      }
    }
  }, [song]);

  useEffect(() => {
    if (albums.length > 0 && !activeAlbum && !song) {
      setScreen("albums");
    }
  }, [albums.length]);

  const goBack = () => {
    if (screen === "player") setScreen("songs");
    else if (screen === "songs") setScreen("albums");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          fontWeight: 700,
          color: "#968F85",
        }}
      >
        نمای موبایل
      </p>

      {/* The Physical Phone Shell */}
      <div
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          borderRadius: 38,
          backgroundColor: "#111",
          border: "6px solid #1c1c1c",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 100,
            height: 22,
            backgroundColor: "#1c1c1c",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            zIndex: 999,
          }}
        />

        {/* The Scaled Virtual Screen */}
        <div
          style={{
            width: PHONE_WIDTH,
            height: PHONE_HEIGHT,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
            backgroundColor: "#F9F9F4",
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            flexDirection: "column",
            fontFamily: FONTS.regular,
            overflow: "hidden", // Strict containment
          }}
        >
          {screen === "albums" && (
            <AlbumListScreen
              albums={albums}
              onAlbumPress={(alb) => {
                setActiveAlbum(alb);
                setScreen("songs");
              }}
            />
          )}

          {screen === "songs" && (
            <SongListScreen
              album={activeAlbum}
              onBack={goBack}
              onSongPress={(s) => {
                setActiveSong(s);
                setScreen("player");
              }}
            />
          )}

          {screen === "player" && (
            <PlayerScreen
              song={activeSong}
              onBack={albums.length > 0 || activeAlbum ? goBack : null}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCREENS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Album List ── */
function AlbumListScreen({ albums, onAlbumPress }) {
  if (!albums || albums.length === 0)
    return <div style={sys.center}>بدون اطلاعات</div>;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: "#F9F9F4",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 100,
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      />

      <div
        className="native-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "20px 40px 80px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {albums.map((alb, i) => (
          <div
            key={i}
            onClick={() => onAlbumPress(alb)}
            style={{
              marginBottom: 40,
              alignItems: "center",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "100%",
                height: 200,
                borderRadius: 40,
                overflow: "hidden",
                backgroundColor: "#ddd",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                position: "relative",
              }}
            >
              {alb.coverUrl ? (
                <img
                  src={alb.coverUrl}
                  style={{
                    width: "100%",
                    height: "110%",
                    objectFit: "cover",
                    position: "absolute",
                    top: 0,
                  }}
                  alt=""
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                  }}
                >
                  🎵
                </div>
              )}
            </div>
            <div
              style={{
                width: "100%",
                marginTop: 15,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#222",
                  marginBottom: 6,
                  textAlign: "right",
                }}
              >
                {alb.title}
              </span>
              <span style={{ fontSize: 13, color: "#888", textAlign: "right" }}>
                {alb.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Song List ── */
function SongListScreen({ album, onBack, onSongPress }) {
  if (!album) return null;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: "#281814",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 110,
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-end",
          padding: "0 20px 20px",
        }}
      >
        <div onClick={onBack} style={{ cursor: "pointer", padding: 10}}>
          <ChevronRightIcon color="#fff" />
        </div>
      </div>

      {/* minHeight: 0 here is critical for scroll bounding */}
      <div
        className="native-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: "#F9F9F4",
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          paddingTop: 30,
          overflowY: "auto",
        }}
      >
        <div style={{ paddingBottom: 50, paddingHorizontal: 20 }}>
          {album.tracks.map((s, i) => (
            <div key={i} style={{ marginBottom: 5 }}>
              <div
                onClick={() => onSongPress(s)}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "18px 0",
                  justifyContent: "flex-end",
                  cursor: "pointer",
                  paddingRight: '20px',
                  paddingLeft: '20px'
                }}
              >
                {/* Text Block - minWidth: 0 prevents long text from breaking the row */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 110,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    paddingRight: 10,
                    paddingBottom: 5,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        padding: 2,
                        marginLeft: 4,
                        marginTop: 10,
                        marginBottom: -20,
                        flexShrink: 0,
                      }}
                    >
                      <BookmarkIcon />
                    </div>

                    {/* minWidth: 0 prevents flex child from expanding beyond parent bounds */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: 10,
                      }}
                    >
                      <span
                        style={{
                          width: "100%",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#231f20",
                          marginBottom: 4,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.title}
                      </span>
                      <span
                        style={{
                          width: "100%",
                          fontSize: 11,
                          color: "#231f20",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.subtitle || s.album || "بدون زیرنویس"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider - flexShrink: 0 keeps it exactly 1px */}
                <div
                  style={{
                    width: 1,
                    height: 110,
                    backgroundColor: "#ddd",
                    margin: "0 10px",
                    flexShrink: 0,
                  }}
                />

                {/* Thumbnail - flexShrink: 0 keeps it exactly 170x130 */}
                <div
                  style={{
                    width: 170,
                    height: 130,
                    borderRadius: 25,
                    overflow: "hidden",
                    backgroundColor: "#ccc",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      alt=""
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 30,
                      }}
                    >
                      🎵
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  height: 1,
                  backgroundColor: "#d1d0d0",
                  marginTop: 8,
                  marginHorizontal: 5,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Player ── */
function PlayerScreen({ song, onBack }) {
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setCur(0);
    setDur(0);
  }, [song?.id]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDur(a.duration || 0);
    const onTime = () => setCur(a.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setCur(0);
    };
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
  }, [song?.audioUrl]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => {});
      setPlaying(true);
    }
  };

  const skip = (secs) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(
      0,
      Math.min(a.duration || 0, a.currentTime + secs),
    );
  };

  const seekClick = (e) => {
    if (!dur || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current) audioRef.current.currentTime = pct * dur;
    setCur(pct * dur);
  };

  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  if (!song)
    return (
      <div style={{ ...sys.center, backgroundColor: "#111", color: "#555" }}>
        بدون آهنگ
      </div>
    );

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <img
        src={song.imageUrl || ""}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#333",
        }}
        alt=""
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 110,
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            padding: "0 20px",
          }}
        >
          {onBack && (
            <div onClick={onBack} style={{ cursor: "pointer", padding: 10 }}>
              <ChevronRightIcon color="#fff" />
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="native-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            marginTop: -30,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: 40,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              alignItems: "center",
              marginBottom: 80,
              display: "flex",
              flexDirection: "column",
              padding: "0 20px",
              width: "100%",
            }}
          >
            <span
              style={{
                width: "100%",
                fontSize: 22,
                color: "white",
                marginBottom: 8,
                fontWeight: 700,
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {song.title || "عنوان قطعه"}
            </span>
            <span
              style={{
                width: "100%",
                fontSize: 16,
                color: "#e0e0e0",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {song.subtitle || song.album || "زیرنویس"}
            </span>
          </div>

          <div
            style={{
              width: "100%",
              alignItems: "center",
              marginBottom: 60,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 30,
                marginBottom: 30,
              }}
            >
              <div
                onClick={() => skip(-15)}
                style={{
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <SkipBackIcon />
                <span style={{ color: "white", fontSize: 10, marginTop: 2 }}>
                  15-
                </span>
              </div>

              <div
                onClick={toggle}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                }}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </div>

              <div
                onClick={() => skip(15)}
                style={{
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <SkipForwardIcon />
                <span style={{ color: "white", fontSize: 10, marginTop: 2 }}>
                  15+
                </span>
              </div>
            </div>

            <div
              style={{
                width: "80%",
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                ref={trackRef}
                onClick={seekClick}
                style={{
                  position: "relative",
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    backgroundColor: "rgba(255,255,255,0.4)",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      width: `${pct}%`,
                      backgroundColor: "#fff",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${pct}%`,
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#fff",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: -5,
                }}
              >
                <span style={{ color: "#ddd", fontSize: 12 }}>{fmt(cur)}</span>
                <span style={{ color: "#ddd", fontSize: 12 }}>
                  {dur > 0 ? fmt(dur) : "--:--"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ paddingHorizontal: 30, width: "100%" }}>
            <span
              style={{
                fontSize: 14,
                color: "white",
                textAlign: "center",
                lineHeight: "24px",
                display: "block",
                direction: "rtl",
              }}
            >
              {song.description}
            </span>
          </div>
        </div>
      </div>

      {song.audioUrl && (
        <audio ref={audioRef} src={song.audioUrl} preload="metadata" />
      )}
    </div>
  );
}

/* ─── NATIVE APP ICONS REPLICATED AS SVGS ─────────────────────────────────── */

const ChevronLeftIcon = ({ color = "#aaaaaa" }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRightIcon = ({ color = "#aaaaaa" }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const BookmarkIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#666"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const PlayIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 512 512"
    fill="#333"
    style={{ marginLeft: 4 }}
  >
    <path d="M133 440a35.37 35.37 0 01-17.5-4.67c-12-6.8-19.46-20-19.5-33.81V110.5c0-13.81 7.45-27 19.5-33.81a35.33 35.33 0 0135.53-.29l252 145.5a35.1 35.1 0 010 60.2l-252 145.5A35.33 35.33 0 01133 440z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 512 512" fill="#333">
    <path d="M208 432h-48a16 16 0 01-16-16V96a16 16 0 0116-16h48a16 16 0 0116 16v320a16 16 0 01-16 16zM352 432h-48a16 16 0 01-16-16V96a16 16 0 0116-16h48a16 16 0 0116 16v320a16 16 0 01-16 16z" />
  </svg>
);

const SkipBackIcon = () => (
  <svg width="30" height="30" viewBox="0 0 512 512" fill="#fff">
    <path d="M112 64a16 16 0 0116 16v136.43L360.77 77.11a35.13 35.13 0 0135.77-.44c12 6.8 19.46 20 19.46 33.83v291c0 13.83-7.46 27-19.46 33.83a35.14 35.14 0 01-35.77-.45L128 295.57V432a16 16 0 01-32 0V80a16 16 0 0116-16z" />
  </svg>
);

const SkipForwardIcon = () => (
  <svg width="30" height="30" viewBox="0 0 512 512" fill="#fff">
    <path d="M400 64a16 16 0 00-16 16v136.43L151.23 77.11a35.13 35.13 0 00-35.77-.44C103.46 83.47 96 96.67 96 110.5v291c0 13.83 7.46 27 19.46 33.83a35.14 35.14 0 0035.77-.45L384 295.57V432a16 16 0 0032 0V80a16 16 0 00-16-16z" />
  </svg>
);

const sys = {
  center: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
