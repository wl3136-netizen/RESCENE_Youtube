const TAGS = ["#리센느", "#원이", "#미나미", "#리브", "#메이", "#제나"];
const state = { videos: [], type: "all", tag: "all" };

const grid = document.querySelector("#videoGrid");
const status = document.querySelector("#status");
const template = document.querySelector("#videoCardTemplate");
const dialog = document.querySelector("#playerDialog");
const player = document.querySelector("#player");

function escapeText(value) { return String(value ?? ""); }
function formatDate(iso) { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso)); }
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`;
}

function renderTags() {
  const host = document.querySelector("#hashtags");
  host.replaceChildren();
  ["all", ...TAGS].forEach(tag => {
    const button = document.createElement("button");
    button.className = `hashtag${state.tag === tag ? " active" : ""}`;
    button.textContent = tag === "all" ? "전체 태그" : tag;
    button.onclick = () => { state.tag = tag; renderTags(); renderVideos(); };
    host.append(button);
  });
}

function renderVideos() {
  const filtered = state.videos.filter(video =>
    (state.type === "all" || video.format === state.type) &&
    (state.tag === "all" || video.tags.includes(state.tag))
  );
  grid.replaceChildren();
  status.textContent = filtered.length ? `신규 영상 ${filtered.length}개` : "조건에 맞는 신규 영상이 아직 없어요.";
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "다음 자동 업데이트에서 새 영상을 확인해 주세요 ♡";
    grid.append(empty);
    return;
  }
  filtered.forEach(video => {
    const card = template.content.cloneNode(true);
    const img = card.querySelector(".thumbnail");
    img.src = video.thumbnail;
    img.alt = `${escapeText(video.title)} 썸네일`;
    card.querySelector(".format-badge").textContent = video.format === "short" ? "SHORT" : "LONG";
    card.querySelector(".duration").textContent = formatDuration(video.durationSeconds);
    card.querySelector(".video-title").textContent = escapeText(video.title);
    card.querySelector(".channel").textContent = escapeText(video.channelTitle);
    card.querySelector(".date").textContent = formatDate(video.publishedAt);
    video.tags.forEach(tag => {
      const el = document.createElement("span"); el.className = "mini-tag"; el.textContent = tag;
      card.querySelector(".card-tags").append(el);
    });
    card.querySelector(".thumb-button").onclick = () => openPlayer(video.id, video.title);
    grid.append(card);
  });
}

function updateCounts() {
  document.querySelector("#countAll").textContent = state.videos.length;
  document.querySelector("#countShort").textContent = state.videos.filter(v => v.format === "short").length;
  document.querySelector("#countLong").textContent = state.videos.filter(v => v.format === "long").length;
}
function openPlayer(id, title) {
  player.title = title;
  player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
  dialog.showModal();
}
function closePlayer() { player.src = ""; dialog.close(); }

async function loadVideos() {
  status.textContent = "새 영상을 불러오고 있어요.";
  try {
    const response = await fetch(`data.json?t=${Date.now()}`);
    if (!response.ok) throw new Error("data load failed");
    const data = await response.json();
    state.videos = Array.isArray(data.videos) ? data.videos : [];
    state.videos.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    document.querySelector("#updatedAt").textContent = data.updatedAt
      ? `마지막 업데이트 ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(data.updatedAt))}`
      : "첫 업데이트 준비 중";
    updateCounts(); renderVideos();
  } catch { status.textContent = "목록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요."; }
}

document.querySelectorAll(".tab").forEach(tab => tab.onclick = () => {
  document.querySelectorAll(".tab").forEach(t => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", t === tab); });
  state.type = tab.dataset.type; renderVideos();
});
document.querySelector("#refreshButton").onclick = loadVideos;
document.querySelector("#closePlayer").onclick = closePlayer;
dialog.addEventListener("click", event => { if (event.target === dialog) closePlayer(); });
renderTags(); loadVideos();
setInterval(loadVideos, 5 * 60 * 1000);
