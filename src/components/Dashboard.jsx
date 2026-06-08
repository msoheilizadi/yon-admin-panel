import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axiosConfig";
import AudioPlayer from "./AudioPlayer";

export default function Dashboard() {
  const { logout, admin } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    album: "",
    duration: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchSongs = async () => {
    try {
      const res = await api.get("/admin/songs");
      setSongs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این آهنگ اطمینان دارید؟")) return;
    try {
      await api.delete(`/admin/songs/${id}`);
      fetchSongs();
    } catch (err) {
      alert("خطا در حذف");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !audioFile) {
      alert("انتخاب تصویر و فایل صوتی الزامی است");
      return;
    }
    const data = new FormData();
    data.append("image", imageFile);
    data.append("audio", audioFile);
    for (let key in formData) {
      if (formData[key]) data.append(key, formData[key]);
    }

    setUploading(true);
    try {
      await api.post("/admin/songs", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("آهنگ با موفقیت اضافه شد");
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        category: "",
        album: "",
        duration: "",
      });
      setImageFile(null);
      setAudioFile(null);
      fetchSongs();
    } catch (err) {
      alert("خطا در آپلود: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading)
    return (
      <div className="admin-container" style={{ textAlign: "center" }}>
        در حال بارگذاری...
      </div>
    );

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>📀 پنل مدیریت محتوا</h1>
        <div className="user-info">
          <span>خوش آمدید {admin?.name}</span>
          <button onClick={logout} className="logout-btn">
            خروج
          </button>
        </div>
      </div>

      <div className="add-song-section">
        <h2>➕ افزودن آهنگ جدید</h2>
        <form
          onSubmit={handleSubmit}
          className="song-form"
          encType="multipart/form-data"
        >
          <input
            name="title"
            placeholder="عنوان"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <input
            name="subtitle"
            placeholder="زیر عنوان"
            value={formData.subtitle}
            onChange={handleChange}
          />
          <textarea
            name="description"
            placeholder="توضیحات"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="full-width"
          />
          <input
            name="category"
            placeholder="دسته‌بندی"
            value={formData.category}
            onChange={handleChange}
          />
          <input
            name="album"
            placeholder="آلبوم"
            value={formData.album}
            onChange={handleChange}
          />
          <input
            name="duration"
            type="number"
            placeholder="مدت (ثانیه)"
            value={formData.duration}
            onChange={handleChange}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            required
          />
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files[0])}
            required
          />
          <button type="submit" disabled={uploading} className="full-width">
            {uploading ? "در حال آپلود..." : "آپلود و ذخیره"}
          </button>
        </form>
      </div>

      <div className="songs-list">
        <h2>📋 لیست آهنگ‌ها</h2>
        {songs.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text)" }}>
            هیچ آهنگی یافت نشد
          </p>
        )}
        <div className="songs-grid">
          {songs.map((song) => (
            <div key={song.id} className="song-card">
              <img
                src={song.imageUrl}
                alt={song.title}
                className="song-cover"
              />
              <div className="song-info">
                <div className="song-title">{song.title}</div>
                {song.subtitle && (
                  <div className="song-subtitle">{song.subtitle}</div>
                )}
                <AudioPlayer
                  src={song.audioUrl}
                  title={song.title}
                  subtitle={song.subtitle}
                  compact
                />
                <button
                  onClick={() => handleDelete(song.id)}
                  className="delete-btn"
                >
                  🗑 حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
