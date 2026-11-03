// 酿牛熟成學院 排行榜後端（Google Apps Script）
// 用法：建立一個 Google 試算表 → 擴充功能 → Apps Script → 貼上本檔 → 部署為網頁應用程式
// （執行身分：我；存取權：所有人），把網址填進 index.html 的 BOARD_URL。

const SHEET = 'scores';
const PLAYERS = ['YoYo', 'RAE', 'Ryson', 'Livia', 'Joanne'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['name', 'best', 'right', 'total', 'stars', 'lastScore', 'updated']);
    PLAYERS.forEach(n => sh.appendRow([n, 0, 0, 0, 0, 0, '']));
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1).map(r => ({
    name: r[0], best: r[1], right: r[2], total: r[3], stars: r[4]
  }));
  return json_({ rows });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (PLAYERS.indexOf(d.name) < 0) return json_({ ok: false });
    const sh = sheet_();
    const vals = sh.getDataRange().getValues();
    const i = vals.findIndex(r => r[0] === d.name);
    const row = i > 0 ? i + 1 : sh.getLastRow() + 1;
    const old = i > 0 ? vals[i] : [d.name, 0, 0, 0, 0, 0, ''];
    const best = Math.max(+old[1] || 0, +d.best || 0);
    const better = (+d.best || 0) >= (+old[1] || 0);
    sh.getRange(row, 1, 1, 7).setValues([[
      d.name,
      best,
      better ? +d.right || 0 : old[2],
      better ? +d.total || 0 : old[3],
      Math.max(+old[4] || 0, +d.stars || 0),
      +d.score || 0,
      new Date()
    ]]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
