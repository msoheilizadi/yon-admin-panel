import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import MobilePreview from "./MobilePreview"; // ← NEW import

const CATEGORIES = [
  { id: "Music", label: "موسیقی", icon: "♪" },
  { id: "Meditation", label: "مراقبه", icon: "◎" },
  { id: "Sleep", label: "خواب", icon: "◗" },
  { id: "Kid", label: "کودک", icon: "✦" },
];

const sx = {
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "#fff",
    border: "1.5px solid #DED7C9",
    borderRadius: 20,
    fontSize: 13,
    color: "#281814",
    outline: "none",
    direction: "rtl",
    fontFamily: "Vazirmatn, Tahoma, sans-serif",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "#968F85",
    display: "block",
    marginBottom: 6,
    textAlign: "right",
    fontFamily: "Vazirmatn, Tahoma, sans-serif",
  },
  font: { fontFamily: "Vazirmatn, Tahoma, sans-serif" },
};

function FilePill({ label, icon, accept, file, onChange }) {
  const id = `fp-${label}`;
  return (
    <label htmlFor={id} style={{ cursor: "pointer", flexShrink: 0 }}>
      <input
        id={id}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => onChange(e.target.files[0])}
      />
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 16px",
          borderRadius: 40,
          transition: "all .2s",
          background: file ? "#281814" : "#fff",
          border: `1.5px solid ${file ? "#281814" : "#DED7C9"}`,
        }}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span
          style={{
            ...sx.font,
            fontSize: 12,
            fontWeight: 600,
            color: file ? "#fff" : "#968F85",
            whiteSpace: "nowrap",
          }}
        >
          {file
            ? file.name.slice(0, 16) + (file.name.length > 16 ? "…" : "")
            : label}
        </span>
      </div>
    </label>
  );
}

export default function FileManager() {
  const [activeCategory, setActiveCategory] = useState("Music");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumsList, setAlbumsList] = useState([]);
  const [groupedAlbums, setGroupedAlbums] = useState([]);

  // ← NEW: track which song is being previewed
  const [previewSong, setPreviewSong] = useState(null);

  // form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [duration, setDuration] = useState("");
  const [album, setAlbum] = useState("");
  const [newAlbum, setNewAlbum] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  // ← NEW: live preview state — built from form fields as admin fills the form
  const livePreviewSong =
    title || imageFile
      ? {
          title: title || "",
          subtitle: subtitle || "",
          album: album || "",
          duration: parseInt(duration) || 0,
          category: activeCategory,
          imageUrl: imageFile ? URL.createObjectURL(imageFile) : null,
        }
      : null;

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/songs");
      const all = Array.isArray(res.data) ? res.data : res.data.songs || [];
      const songs = all.filter((s) => s.category === activeCategory);
      setFiles(songs);
      const names = [...new Set(songs.map((s) => s.album).filter(Boolean))];
      setAlbumsList(names);
      const g = {};
      songs.forEach((s) => {
        const n = s.album || "تک‌آهنگ‌ها";
        if (!g[n]) g[n] = { id: n, title: n, coverUrl: s.imageUrl, tracks: [] };
        g[n].tracks.push(s);
      });
      setGroupedAlbums(Object.values(g));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    setSelectedAlbum(null);
    setAlbum("");
    setNewAlbum(false);
    setPreviewSong(null); // reset preview on category change
  }, [activeCategory]);

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setDuration("");
    setAlbum("");
    setNewAlbum(false);
    setImageFile(null);
    setAudioFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !audioFile) {
      alert("لطفاً تصویر و فایل صوتی را انتخاب کنید");
      return;
    }
    const data = new FormData();
    data.append("image", imageFile);
    data.append("audio", audioFile);
    data.append("category", activeCategory);
    if (title) data.append("title", title);
    if (subtitle) data.append("subtitle", subtitle);
    if (album) data.append("album", album);
    if (duration) data.append("duration", duration);
    setUploading(true);
    try {
      await api.post("/admin/songs", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      resetForm();
      fetchFiles();
      setPreviewSong(null);
    } catch (err) {
      alert("خطا: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف اطمینان دارید؟")) return;
    try {
      await api.delete(`/admin/songs/${id}`);
      fetchFiles();
    } catch {
      alert("خطا در حذف");
    }
  };

  const filteredFiles = selectedAlbum
    ? files.filter((f) => f.album === selectedAlbum)
    : files;

  const catLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label;

  return (
    <div
      style={{
        ...sx.font,
        maxWidth: 1200,
        margin: "0 auto",
        padding: "28px 20px",
        direction: "rtl",
      }}
    >
      {/* ── Header + category tabs ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              ...sx.font,
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              color: "#281814",
            }}
          >
            مدیریت فایل‌ها
          </h2>
          <p
            style={{ ...sx.font, fontSize: 12, color: "#968F85", marginTop: 3 }}
          >
            محتوای صوتی اپ
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{
                ...sx.font,
                padding: "8px 18px",
                borderRadius: 40,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all .2s",
                background: activeCategory === c.id ? "#281814" : "transparent",
                color: activeCategory === c.id ? "#fff" : "#968F85",
                outline:
                  activeCategory === c.id ? "none" : "1.5px solid #DED7C9",
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-column layout: form | mobile preview ── */}
      {/* ← NEW: side-by-side layout */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 28,
          alignItems: "flex-start",
        }}
      >
        {/* ── Upload form (left/main column) ── */}
        <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: "#EBE6DE",
              borderRadius: 32,
              padding: "24px 28px",
            }}
          >
            <p style={{ ...sx.label, marginBottom: 18, fontSize: 12 }}>
              افزودن قطعه جدید به {catLabel}
            </p>

            {/* Row 1: title / subtitle / duration */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 2, minWidth: 140 }}>
                <label style={sx.label}>عنوان *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: آرامش شب"
                  required
                  style={sx.input}
                />
              </div>
              <div style={{ flex: 2, minWidth: 140 }}>
                <label style={sx.label}>زیرعنوان</label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="مثال: ۱۰ دقیقه"
                  style={sx.input}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={sx.label}>مدت (ثانیه)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="۶۰۰"
                  style={sx.input}
                />
              </div>
            </div>

            {/* Row 2: album / files / submit */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {/* Album chips */}
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={sx.label}>آلبوم *</label>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: newAlbum ? 10 : 0,
                  }}
                >
                  {albumsList.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAlbum(a);
                        setNewAlbum(false);
                      }}
                      style={{
                        ...sx.font,
                        padding: "7px 15px",
                        borderRadius: 40,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        transition: "all .2s",
                        background:
                          album === a && !newAlbum ? "#281814" : "#fff",
                        color: album === a && !newAlbum ? "#fff" : "#281814",
                      }}
                    >
                      {a}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setNewAlbum(!newAlbum);
                      setAlbum("");
                    }}
                    style={{
                      ...sx.font,
                      padding: "7px 15px",
                      borderRadius: 40,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all .2s",
                      background: newAlbum ? "#8B5E3C" : "transparent",
                      color: newAlbum ? "#fff" : "#968F85",
                      border: "1.5px dashed #DED7C9",
                    }}
                  >
                    + آلبوم جدید
                  </button>
                </div>
                {newAlbum && (
                  <input
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder="نام آلبوم جدید"
                    required
                    autoFocus
                    style={{ ...sx.input, border: "1.5px solid #8B5E3C" }}
                  />
                )}
              </div>

              {/* File pills */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <FilePill
                  label="تصویر کاور"
                  icon="🖼"
                  accept="image/*"
                  file={imageFile}
                  onChange={setImageFile}
                />
                <FilePill
                  label="فایل صوتی"
                  icon="🎵"
                  accept="audio/*"
                  file={audioFile}
                  onChange={setAudioFile}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                style={{
                  ...sx.font,
                  padding: "13px 28px",
                  borderRadius: 40,
                  border: "none",
                  cursor: "pointer",
                  background: uploading ? "#968F85" : "#281814",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  alignSelf: "flex-end",
                  flexShrink: 0,
                  transition: "opacity .2s",
                }}
              >
                {uploading ? "در حال آپلود…" : "آپلود و ذخیره ↑"}
              </button>
            </div>
          </div>
        </form>

        {/* ── Mobile Preview (right column) ── */}
        {/* ← NEW: preview panel */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            background: "#EBE6DE",
            borderRadius: 32,
            minHeight: 200,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* live preview while filling form, otherwise shows selected song */}
          <MobilePreview song={livePreviewSong || previewSong} songs={files} />
        </div>
      </div>

      {/* ── Albums horizontal strip ── */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selectedAlbum && (
              <button
                onClick={() => setSelectedAlbum(null)}
                style={{
                  ...sx.font,
                  padding: "6px 14px",
                  borderRadius: 40,
                  cursor: "pointer",
                  background: "none",
                  border: "1.5px solid #DED7C9",
                  fontSize: 11,
                  color: "#968F85",
                }}
              >
                ← همه
              </button>
            )}
            <span
              style={{
                ...sx.font,
                fontSize: 13,
                fontWeight: 700,
                color: "#281814",
              }}
            >
              {selectedAlbum || `آلبوم‌های ${catLabel}`}
            </span>
          </div>
          <span style={{ ...sx.font, fontSize: 11, color: "#968F85" }}>
            {groupedAlbums.length} آلبوم
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {loading && (
            <p style={{ ...sx.font, color: "#968F85" }}>در حال بارگذاری…</p>
          )}
          {!loading &&
            groupedAlbums.map((alb) => (
              <div
                key={alb.id}
                onClick={() =>
                  setSelectedAlbum(
                    alb.title === selectedAlbum ? null : alb.title,
                  )
                }
                style={{
                  flexShrink: 0,
                  width: 170,
                  borderRadius: 28,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: `2px solid ${alb.title === selectedAlbum ? "#8B5E3C" : "transparent"}`,
                  transition: "all .2s",
                  transform:
                    alb.title === selectedAlbum ? "translateY(-3px)" : "none",
                }}
              >
                <div
                  style={{
                    height: 120,
                    background: "#C4B8AD",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {alb.coverUrl && (
                    <img
                      src={alb.coverUrl}
                      alt={alb.title}
                      style={{
                        width: "100%",
                        height: "110%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                      }}
                    />
                  )}
                  {alb.title === selectedAlbum && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(139,94,60,.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
                <div
                  style={{ padding: "10px 14px 12px", background: "#EBE6DE" }}
                >
                  <p
                    style={{
                      ...sx.font,
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#281814",
                      textAlign: "right",
                    }}
                  >
                    {alb.title}
                  </p>
                  <p
                    style={{
                      ...sx.font,
                      margin: "3px 0 0",
                      fontSize: 10,
                      color: "#968F85",
                      textAlign: "right",
                    }}
                  >
                    {alb.tracks.length} قطعه
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── Tracks list ── */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              ...sx.font,
              fontSize: 13,
              fontWeight: 700,
              color: "#281814",
            }}
          >
            {selectedAlbum ? `قطعات — ${selectedAlbum}` : "همه قطعات"}
          </span>
          <span style={{ ...sx.font, fontSize: 11, color: "#968F85" }}>
            {filteredFiles.length} قطعه
          </span>
        </div>

        {!loading && filteredFiles.length === 0 && (
          <p style={{ ...sx.font, color: "#968F85", textAlign: "right" }}>
            قطعه‌ای یافت نشد.
          </p>
        )}

        {filteredFiles.map((song) => (
          <div
            key={song.id}
            style={{
              display: "flex",
              alignItems: "center",
              background: "#EBE6DE",
              borderRadius: 20,
              marginBottom: 8,
              overflow: "hidden",
              // ← NEW: highlight on hover to hint it's clickable for preview
              cursor: "pointer",
              outline:
                previewSong?.id === song.id
                  ? "2px solid #8B5E3C"
                  : "2px solid transparent",
              transition: "outline .15s",
            }}
            onClick={() =>
              setPreviewSong(previewSong?.id === song.id ? null : song)
            }
          >
            <div
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
                background: "#C4B8AD",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {song.imageUrl ? (
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  ♪
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                padding: "10px 16px",
                direction: "rtl",
                textAlign: "right",
              }}
            >
              <p
                style={{
                  ...sx.font,
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#281814",
                }}
              >
                {song.title}
              </p>
              <p
                style={{
                  ...sx.font,
                  margin: "3px 0 0",
                  fontSize: 11,
                  color: "#968F85",
                }}
              >
                {[song.subtitle, song.album].filter(Boolean).join("  ·  ")}
              </p>
            </div>

            {/* ← NEW: preview badge */}
            <span
              style={{
                ...sx.font,
                fontSize: 10,
                color: previewSong?.id === song.id ? "#8B5E3C" : "#968F85",
                padding: "4px 10px",
                flexShrink: 0,
                fontWeight: 600,
              }}
            >
              {previewSong?.id === song.id ? "📱 نمایش" : "پیش‌نمایش"}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(song.id);
              }}
              style={{
                ...sx.font,
                padding: "6px 16px",
                borderRadius: 40,
                cursor: "pointer",
                margin: "0 12px",
                background: "none",
                border: "1.5px solid #DED7C9",
                fontSize: 11,
                color: "#c0392b",
                transition: "all .2s",
                flexShrink: 0,
              }}
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
