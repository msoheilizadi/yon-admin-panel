import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import AudioPlayer from "./AudioPlayer";

// ── ترجمه مقادیر خام به فارسی ──────────────────────────────────────────────
// ── ترجمه مقادیر خام به فارسی ──────────────────────────────────────────────
const EXPERIENCE_MAP = {
  مبتدی: "کاملاً مبتدی",
  آشنا: "کمی آشنا (تجربه پراکنده)",
  متوسط: "متوسط (منظم در گذشته)",
  پیشرفته: "پیشرفته (تمرین‌کننده حرفه‌ای)",
};

const BEST_TIME_MAP = {
  صبح: "صبح زود",
  روز: "در طول روز",
  عصر: "عصر (بعد از کار)",
  شب: "شب (قبل از خواب)",
};

const DURATION_MAP = {
  "۵_دقیقه": "۵ دقیقه",
  "۱۰_دقیقه": "۱۰ دقیقه",
  "۲۰_دقیقه": "۲۰ دقیقه",
  منعطف: "منعطف",
};

function translateField(map, value) {
  if (!value) return "-";
  return map[value] ?? value; // اگر در نقشه نبود، خود مقدار را نشان بده
}

// ── دانلود PDF از بک‌اند ────────────────────────────────────────────────────
async function downloadPDF(req) {
  try {
    // 1. Fetch the raw HTML string from the backend
    const res = await api.get(`/admin/personalizations/${req.id}/pdf`);

    // 2. Open a new temporary window
    const win = window.open("", "_blank");

    // 3. Write the backend's HTML into the new window
    win.document.write(res.data);
    win.document.close();

    // 4. Automatically open the print dialog (Save as PDF) once loaded
    win.onload = () => {
      win.print();
      win.onafterprint = () => win.close();
    };
  } catch (err) {
    console.error("Failed to fetch HTML from backend, using fallback:", err);
    // 5. Fallback to the local frontend print function if backend fails
    printAnswersFallback(req);
  }
}

// ── فال‌بک پرینت مرورگر (بدون jsPDF) ───────────────────────────────────────
function printAnswersFallback(req) {
  const experience = translateField(EXPERIENCE_MAP, req.experience);
  const bestTime = translateField(BEST_TIME_MAP, req.best_time);
  const duration = translateField(DURATION_MAP, req.duration);
  const status = req.status === "completed" ? "تکمیل شده" : "در انتظار فایل";

  const win = window.open("", "_blank");
  win.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8"/>
      <title>پاسخ‌های ${req.User?.name || ""}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Vazirmatn', Tahoma, sans-serif;
          background: #F9F7F2; color: #4A4238;
          padding: 48px; direction: rtl;
        }
        .header { border-bottom: 3px solid #8B5E3C; padding-bottom: 20px; margin-bottom: 32px; }
        .header h1 { font-size: 22px; color: #281814; margin-bottom: 6px; }
        .header p  { font-size: 13px; color: #968F85; }
        .card {
          background: #EBE6DE; border-radius: 16px;
          padding: 24px 28px; margin-bottom: 16px;
        }
        .card-label { font-size: 13px; color: #968F85; margin-bottom: 4px; }
        .card-value { font-size: 16px; font-weight: 600; color: #281814; }
        .footer { margin-top: 40px; font-size: 11px; color: #968F85; text-align: center; }
        @media print {
          body { background: white; padding: 32px; }
          .card { background: #f5f2ee; border: 1px solid #DED7C9; }
          @page { margin: 20mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>پاسخ‌های پرسشنامه شخصی‌سازی</h1>
        <p>${req.User?.name || "-"} &nbsp;|&nbsp; ${req.User?.email || "-"} &nbsp;|&nbsp; ${new Date().toLocaleDateString("fa-IR")}</p>
      </div>
      <div class="card"><div class="card-label">تجربه قبلی</div><div class="card-value">${experience}</div></div>
      <div class="card"><div class="card-label">بهترین زمان</div><div class="card-value">${bestTime}</div></div>
      <div class="card"><div class="card-label">مدت زمان</div><div class="card-value">${duration}</div></div>
      <div class="card"><div class="card-label">وضعیت</div><div class="card-value">${status}</div></div>
      <div class="footer">این سند توسط پنل مدیریت یون ویتال تولید شده است</div>
      <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

// ── کامپوننت اصلی ────────────────────────────────────────────────────────────
export default function PersonalizationsManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/admin/personalizations");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpload = async (id, file) => {
    if (!file) return;
    const data = new FormData();
    data.append("audio", file);
    setUploadingId(id);
    try {
      await api.post(`/admin/personalizations/${id}/audio`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchRequests();
    } catch (err) {
      alert("خطا در آپلود: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا مطمئن هستید؟ این درخواست حذف خواهد شد.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/personalizations/${id}`);
      fetchRequests();
    } catch (err) {
      alert("خطا در حذف: " + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (req) => {
    setDownloadingId(req.id);
    await downloadPDF(req);
    setDownloadingId(null);
  };

  if (loading)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px",
          color: "#968F85",
          fontFamily: "Vazirmatn, Tahoma, sans-serif",
        }}
      >
        در حال بارگذاری...
      </div>
    );

  return (
    <div
      style={{
        fontFamily: "Vazirmatn, Tahoma, sans-serif",
        direction: "rtl",
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 8px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{ fontSize: 20, color: "#281814", margin: 0, fontWeight: 700 }}
        >
          🧠 مدیریت مراقبه‌های شخصی
        </h2>
        <p style={{ margin: "6px 0 0", color: "#968F85", fontSize: 13 }}>
          {requests.length} درخواست ثبت شده
        </p>
      </div>

      {requests.length === 0 ? (
        <div
          style={{
            background: "#EBE6DE",
            borderRadius: 20,
            padding: "60px 24px",
            textAlign: "center",
            color: "#968F85",
          }}
        >
          هیچ درخواستی ثبت نشده است
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                background: "#EBE6DE",
                borderRadius: 20,
                padding: "20px 24px",
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr 1.6fr auto",
                alignItems: "center",
                gap: 16,
                border: "1px solid #DED7C9",
              }}
            >
              {/* User info */}
              <div>
                <div
                  style={{ fontWeight: 600, color: "#281814", fontSize: 15 }}
                >
                  {req.User?.name || "-"}
                </div>
                <div style={{ fontSize: 12, color: "#968F85", marginTop: 2 }}>
                  {req.User?.email || "-"}
                </div>
              </div>

              {/* Duration — فارسی */}
              <div>
                <div
                  style={{ fontSize: 11, color: "#968F85", marginBottom: 2 }}
                >
                  مدت زمان
                </div>
                <div
                  style={{ fontWeight: 600, color: "#4A4238", fontSize: 14 }}
                >
                  {translateField(DURATION_MAP, req.duration)}
                </div>
              </div>

              {/* Status badge */}
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      req.status === "completed" ? "#d4edda" : "#fff3cd",
                    color: req.status === "completed" ? "#2d6a4f" : "#856404",
                  }}
                >
                  {req.status === "completed" ? "✓ تکمیل شده" : "⏳ در انتظار"}
                </span>
              </div>

              {/* Download PDF — از بک‌اند */}
              <div>
                <button
                  onClick={() => handleDownload(req)}
                  disabled={downloadingId === req.id}
                  style={{
                    background: "#281814",
                    color: "#F9F7F2",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: downloadingId === req.id ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseOut={(e) =>
                    (e.currentTarget.style.opacity =
                      downloadingId === req.id ? "0.6" : "1")
                  }
                >
                  {downloadingId === req.id ? "⏳ ..." : "⬇ دانلود پاسخ‌ها"}
                </button>
              </div>

              {/* Audio — از AudioPlayer کامپوننت */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {req.audioUrl ? (
                  <>
                    {/* ✅ استفاده از AudioPlayer سفارشی — حالت compact */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <AudioPlayer src={req.audioUrl} compact />
                    </div>
                    <label
                      title="جایگزینی فایل"
                      style={{
                        cursor: "pointer",
                        width: 30,
                        height: 30,
                        background: "#DED7C9",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        flexShrink: 0,
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#c9c0b4")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#DED7C9")
                      }
                    >
                      ✏️
                      <input
                        type="file"
                        accept="audio/*"
                        style={{ display: "none" }}
                        disabled={uploadingId === req.id}
                        onChange={(e) =>
                          handleUpload(req.id, e.target.files[0])
                        }
                      />
                    </label>
                  </>
                ) : (
                  <label
                    style={{
                      cursor: "pointer",
                      padding: "7px 14px",
                      background: "#F9F7F2",
                      border: "1.5px dashed #8B5E3C",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "#8B5E3C",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    📤 آپلود فایل
                    <input
                      type="file"
                      accept="audio/*"
                      style={{ display: "none" }}
                      disabled={uploadingId === req.id}
                      onChange={(e) => handleUpload(req.id, e.target.files[0])}
                    />
                  </label>
                )}
                {uploadingId === req.id && (
                  <span style={{ fontSize: 11, color: "#8B5E3C" }}>
                    در حال آپلود...
                  </span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(req.id)}
                disabled={deletingId === req.id}
                style={{
                  background: "transparent",
                  color: "#c0392b",
                  border: "1.5px solid #c0392b",
                  borderRadius: 10,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  opacity: deletingId === req.id ? 0.5 : 1,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#c0392b";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#c0392b";
                }}
              >
                {deletingId === req.id ? "..." : "🗑 حذف"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
