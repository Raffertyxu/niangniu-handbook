// 酿牛熟成學院 排行榜後端（Google Apps Script）
// 分數存在本專案的指令碼屬性，不建立任何檔案，不佔雲端硬碟空間。
// 用法：新增 Apps Script 專案 → 貼上本檔 → 執行 setup() 並授權 → 部署為網頁應用程式
// （執行身分：我；存取權：所有人），把網址填進 index.html 的 BOARD_URL。

const PLAYERS = ['YoYo', 'RAE', 'Ryson', 'Livia', 'Joanne'];
const KEY = 'scores';

function load_() {
  const raw = PropertiesService.getScriptProperties().getProperty(KEY);
  const data = raw ? JSON.parse(raw) : {};
  PLAYERS.forEach(n => { if (!data[n]) data[n] = { name: n, best: 0, right: 0, total: 0, stars: 0, lastScore: 0, updated: '' }; });
  return data;
}

// 在編輯器手動執行一次，確認讀寫正常；執行紀錄會印出目前的排行資料
function setup() {
  const data = load_();
  PropertiesService.getScriptProperties().setProperty(KEY, JSON.stringify(data));
  Logger.log(JSON.stringify(data));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const data = load_();
  return json_({ rows: PLAYERS.map(n => data[n]) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (PLAYERS.indexOf(d.name) < 0) return json_({ ok: false });
    const data = load_();
    const old = data[d.name];
    const better = (+d.best || 0) >= (+old.best || 0);
    data[d.name] = {
      name: d.name,
      best: Math.max(+old.best || 0, +d.best || 0),
      right: better ? +d.right || 0 : old.right,
      total: better ? +d.total || 0 : old.total,
      stars: Math.max(+old.stars || 0, +d.stars || 0),
      lastScore: +d.score || 0,
      updated: new Date().toISOString()
    };
    PropertiesService.getScriptProperties().setProperty(KEY, JSON.stringify(data));
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
