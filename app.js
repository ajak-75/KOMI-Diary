/* KOMI's K-Culture Diary — app.js
   Vanilla JS thread-style feed. Data persists in localStorage (komidiary.v1).
   Dancheong palette accents: #4B7F9F #E05A47 #EB7A2D #6E946B #D9B44A */

(() => {
'use strict';

/* ---------- constants ---------- */
const STORE_KEY = 'komidiary.v1';
const LANG_KEY  = 'komidiary.lang';
const PAGE_URL  = 'https://ajak-75.github.io/KOMI-Diary/';
const MAX_PHOTOS = 4;            /* kept for older callers; same slots as MAX_MEDIA */
const MAX_MEDIA  = 4;
const MAX_EDGE   = 1280;
const JPEG_Q     = 0.82;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const DB_NAME    = 'komidiary.media';
const DB_STORE   = 'media';

const DC = ['#4B7F9F', '#E05A47', '#EB7A2D', '#6E946B', '#D9B44A']; // dancheong

const STAMP_SVG = '<svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true">'
  + [0,72,144,216,288].map((a,i)=>`<path d="M24 3.5c4.6 3.5 6.7 8.6 5.5 13.9-.6 2.6-2.9 4.6-5.5 4.6s-4.9-2-5.5-4.6C17.3 12.1 19.4 7 24 3.5Z" fill="${DC[i]}" transform="rotate(${a} 24 24)"/>`).join('')
  + '<circle cx="24" cy="24" r="4.6" fill="#D9B44A"/><circle cx="24" cy="24" r="2.1" fill="#fff"/></svg>';

/* ---------- i18n ---------- */
const LANGS = [
  { code:'en',  label:'English' },
  { code:'ko',  label:'한국어' },
  { code:'ja',  label:'日本語' },
  { code:'zh',  label:'中文' },
  { code:'es',  label:'Español' },
];

const T = {
  en: {
    tagline:'Everyday Korea with KOMI',
    home:'Home', search:'Search', post:'Post', mydiary:'My Diary',
    todayBanner:'Today\u2019s K-Culture Diary', transPending:'Translations for global fans coming soon',
    translate:'Translate', seeOriginal:'See original', translatedBy:'Translated for global fans',
    newPost:'New diary', cancel:'Cancel', publish:'Post', posted:'Posted \ud83c\udf8a',
    nickPlaceholder:"KOMI's Unnie", bodyPlaceholder:'How is life where you are today?', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'Photo', media:'Photo·Video', photoHint:`Up to ${MAX_MEDIA} photos or videos`, tooManyPhotos:`Up to ${MAX_MEDIA} photos or videos`,
    videoTooBig:'Videos up to 80MB', videoBad:'Could not add that video', photoBad:'Could not read that photo',
    translating:'Translating…', translateFail:'Could not translate \u2014 tap to try again', translateSame:'This post is already in this language',
    composeHint:'Your post is saved on this device.',
    comment:'Reply', commentPlaceholder:'Reply with kindness\u2026', send:'Send',
    like:'Like', repost:'Repost', share:'Share', copyLink:'Copy link', copied:'Link copied \ud83d\udd17',
    sharedTo:'Shared \ud83d\ude4c', shareFail:'Could not share \ud83d\ude22',
    reposted:'Reposted \ud83c\udf8a', unreposted:'Repost removed',
    deleted:'Deleted', confirmDelete:'Delete this diary?',
    myPosts:'My diaries', myLikes:'Liked',
    myTitle:'My Diary', searchTitle:'Search', searchPlaceholder:'Search text or #tag',
    trending:'Dancheong tags', results:'Results', clearFilter:'Show all',
    searchingFor:'Showing', emptyFeed:'No diaries yet.', emptySearch:'Nothing found.',
    emptyMine:'No diaries yet \u2014 write the first one!', emptyLikes:'No liked diaries yet.',
    emptyHomeTitle:'The first page is yours',
    emptyHomeSub:'A quiet white thread for everyday Korea. Leave your first K-culture diary \u2014 K-food, K-place, K-beauty.',
    emptyHomeCta:'Write the first diary',
    posts:'Diaries', likes:'Likes', followed:'Following KOMI \ud83d\udc9b', unfollowed:'Follow',
    offline:'You are offline \u2014 showing saved diaries', updated:'Feed refreshed',
    deleteComment:'Delete',
    dateLocale:'en-US', needText:'Write something first \u2728',
  },
  ko: {
    tagline:'코미와 함께하는 매일의 한국',
    home:'홈', search:'검색', post:'글쓰기', mydiary:'내 다이어리',
    todayBanner:'오늘의 K-컬쳐 다이어리', transPending:'글로벌 팬 번역이 곧 추가될 글이에요',
    translate:'번역 보기', seeOriginal:'원문 보기', translatedBy:'글로벌 팬을 위한 번역',
    newPost:'새 다이어리', cancel:'취소', publish:'게시', posted:'게시했어요 \ud83c\udf8a',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'오늘 당신이 있는 곳은 어떤 하루인가요?', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'사진', media:'사진·영상', photoHint:`사진·영상 ${MAX_MEDIA}개까지`, tooManyPhotos:`사진·영상은 ${MAX_MEDIA}개까지`,
    videoTooBig:'영상은 80MB까지 올릴 수 있어요', videoBad:'영상을 불러오지 못했어요', photoBad:'사진을 불러오지 못했어요',
    translating:'번역 중…', translateFail:'번역을 불러오지 못했어요 · 다시 눌러 주세요', translateSame:'이미 이 언어로 쓰인 글이에요',
    composeHint:'게시물은 이 기기에 저장돼요.',
    comment:'댓글', commentPlaceholder:'다정하게 답글 달기\u2026', send:'보내기',
    like:'좋아요', repost:'리포스트', share:'공유', copyLink:'링크 복사', copied:'링크를 복사했어요 \ud83d\udd17',
    sharedTo:'공유했어요 \ud83d\ude4c', shareFail:'공유할 수 없어요 \ud83d\ude22',
    reposted:'리포스트했어요 \ud83c\udf8a', unreposted:'리포스트를 취소했어요',
    deleted:'삭제했어요', confirmDelete:'이 다이어리를 삭제할까요?',
    myPosts:'내 다이어리', myLikes:'좋아요',
    myTitle:'내 다이어리', searchTitle:'검색', searchPlaceholder:'본문이나 #태그 검색',
    trending:'단청 태그', results:'검색 결과', clearFilter:'전체 보기',
    searchingFor:'표시 중', emptyFeed:'아직 다이어리가 없어요.', emptySearch:'검색 결과가 없어요.',
    emptyMine:'첫 다이어리를 써보세요!', emptyLikes:'아직 좋아요한 다이어리가 없어요.',
    emptyHomeTitle:'첫 장은 비워 두었어요',
    emptyHomeSub:'매일의 한국을 담는 조용한 흰 스레드. 오늘의 K-컬쳐 다이어리로 첫 장을 열어 주세요.',
    emptyHomeCta:'첫 다이어리 쓰기',
    posts:'다이어리', likes:'좋아요', followed:'코미 팔로우 중 \ud83d\udc9b', unfollowed:'팔로우',
    offline:'오프라인 \u2014 저장된 다이어리를 보여드려요', updated:'피드를 새로 불러왔어요',
    deleteComment:'삭제',
    dateLocale:'ko-KR', needText:'내용을 먼저 써주세요 \u2728',
  },
  ja: {
    tagline:'KOMIと毎日の韓国',
    home:'ホーム', search:'検索', post:'投稿', mydiary:'マイダイアリー',
    todayBanner:'今日のK-カルチャーダイアリー', transPending:'世界のファン向けの翻訳は準備中です',
    translate:'翻訳を見る', seeOriginal:'原文を見る', translatedBy:'グローバルファン向けの翻訳',
    newPost:'新しいダイアリー', cancel:'キャンセル', publish:'投稿', posted:'投稿しました \ud83c\udf8a',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'今日、あなたの街はどんな一日ですか？', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'写真', media:'写真・動画', photoHint:`写真・動画は${MAX_MEDIA}件まで`, tooManyPhotos:`写真・動画は${MAX_MEDIA}件まで`,
    videoTooBig:'動画は80MBまで', videoBad:'動画を読み込めませんでした', photoBad:'写真を読み込めませんでした',
    translating:'翻訳中…', translateFail:'翻訳できませんでした · もう一度押してください', translateSame:'この投稿はすでにこの言語です',
    composeHint:'投稿はこの端末に保存されます。',
    comment:'返信', commentPlaceholder:'やさしく返信しよう\u2026', send:'送信',
    like:'いいね', repost:'リポスト', share:'シェア', copyLink:'リンクをコピー', copied:'リンクをコピーしました \ud83d\udd17',
    sharedTo:'シェアしました \ud83d\ude4c', shareFail:'シェアできません \ud83d\ude22',
    reposted:'リポストしました \ud83c\udf8a', unreposted:'リポストを取り消しました',
    deleted:'削除しました', confirmDelete:'このダイアリーを削除しますか？',
    myPosts:'マイダイアリー', myLikes:'いいね',
    myTitle:'マイダイアリー', searchTitle:'検索', searchPlaceholder:'本文や #タグを検索',
    trending:'単青（タンチョン）タグ', results:'検索結果', clearFilter:'すべて表示',
    searchingFor:'表示中', emptyFeed:'まだダイアリーがありません。', emptySearch:'見つかりません。',
    emptyMine:'最初のダイアリーを書いてみましょう！', emptyLikes:'いいねしたダイアリーはまだありません。',
    emptyHomeTitle:'最初のページはあなたの番です',
    emptyHomeSub:'毎日の韓国をつなぐ静かな白いスレッド。今日のK-カルチャーダイアリーを書いてみましょう。',
    emptyHomeCta:'最初のダイアリーを書く',
    posts:'ダイアリー', likes:'いいね', followed:'フォロー中 \ud83d\udc9b', unfollowed:'フォロー',
    offline:'オフライン \u2014 保存済みのダイアリーを表示中', updated:'フィードを更新しました',
    deleteComment:'削除',
    dateLocale:'ja-JP', needText:'まず本文を書いてください \u2728',
  },
  zh: {
    tagline:'和KOMI一起过每天',
    home:'首页', search:'搜索', post:'发布', mydiary:'我的日记',
    todayBanner:'今日的K-文化日记', transPending:'面向全球粉丝的翻译即将上线',
    translate:'查看翻译', seeOriginal:'查看原文', translatedBy:'为全球粉丝提供的翻译',
    newPost:'新的日记', cancel:'取消', publish:'发布', posted:'已发布 \ud83c\udf8a',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'今天你所在的城市是什么样的呢？', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'照片', media:'照片·视频', photoHint:`最多${MAX_MEDIA}张照片或视频`, tooManyPhotos:`最多${MAX_MEDIA}张照片或视频`,
    videoTooBig:'视频最大80MB', videoBad:'无法读取该视频', photoBad:'无法读取该照片',
    translating:'正在翻译…', translateFail:'翻译失败 · 请再点一次', translateSame:'这篇已经是该语言了',
    composeHint:'帖子保存在这台设备上。',
    comment:'评论', commentPlaceholder:'温柔地回复\u2026', send:'发送',
    like:'点赞', repost:'转发', share:'分享', copyLink:'复制链接', copied:'链接已复制 \ud83d\udd17',
    sharedTo:'已分享 \ud83d\ude4c', shareFail:'无法分享 \ud83d\ude22',
    reposted:'已转发 \ud83c\udf8a', unreposted:'已取消转发',
    deleted:'已删除', confirmDelete:'要删除这篇日记吗？',
    myPosts:'我的日记', myLikes:'点赞',
    myTitle:'我的日记', searchTitle:'搜索', searchPlaceholder:'搜索正文或 #标签',
    trending:'丹青标签', results:'搜索结果', clearFilter:'显示全部',
    searchingFor:'正在显示', emptyFeed:'还没有日记。', emptySearch:'没有找到内容。',
    emptyMine:'来写第一篇日记吧！', emptyLikes:'还没有点赞的日记。',
    emptyHomeTitle:'第一页留给你',
    emptyHomeSub:'连接每日韩国的安静白色小屋。写下今天的K-文化日记吧。',
    emptyHomeCta:'写第一篇日记',
    posts:'日记', likes:'点赞', followed:'已关注 \ud83d\udc9b', unfollowed:'关注',
    offline:'离线中 \u2014 显示已保存的日记', updated:'信息流已更新',
    deleteComment:'删除',
    dateLocale:'zh-CN', needText:'请先输入内容 \u2728',
  },
  es: {
    tagline:'Corea de cada d\u00eda con KOMI',
    home:'Inicio', search:'Buscar', post:'Publicar', mydiary:'Mi diario',
    todayBanner:'Diario K-culture de hoy', transPending:'Pronto habr\u00e1 traducci\u00f3n para fans del mundo',
    translate:'Traducir', seeOriginal:'Ver original', translatedBy:'Traducido para fans del mundo',
    newPost:'Nuevo diario', cancel:'Cancelar', publish:'Publicar', posted:'Publicado \ud83c\udf8a',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'\u00bfC\u00f3mo es tu d\u00eda hoy desde donde est\u00e1s?', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'Foto', media:'Foto·V\u00eddeo', photoHint:`Hasta ${MAX_MEDIA} fotos o vídeos`, tooManyPhotos:`Hasta ${MAX_MEDIA} fotos o vídeos`,
    videoTooBig:'V\u00eddeos de hasta 80MB', videoBad:'No se pudo a\u00f1adir el v\u00eddeo', photoBad:'No se pudo leer la foto',
    translating:'Traduciendo…', translateFail:'No se pudo traducir \u2014 toca para reintentar', translateSame:'Esta publicaci\u00f3n ya est\u00e1 en este idioma',
    composeHint:'Tu publicaci\u00f3n se guarda en este dispositivo.',
    comment:'Responder', commentPlaceholder:'Responde con amabilidad\u2026', send:'Enviar',
    like:'Me gusta', repost:'Repostear', share:'Compartir', copyLink:'Copiar enlace', copied:'Enlace copiado \ud83d\udd17',
    sharedTo:'Compartido \ud83d\ude4c', shareFail:'No se pudo compartir \ud83d\ude22',
    reposted:'Reposteado \ud83c\udf8a', unreposted:'Repost eliminado',
    deleted:'Eliminado', confirmDelete:'\u00bfEliminar este diario?',
    myPosts:'Mis diarios', myLikes:'Me gusta',
    myTitle:'Mi diario', searchTitle:'Buscar', searchPlaceholder:'Busca texto o #etiqueta',
    trending:'Etiquetas dancheong', results:'Resultados', clearFilter:'Mostrar todo',
    searchingFor:'Mostrando', emptyFeed:'A\u00fan no hay diarios.', emptySearch:'Sin resultados.',
    emptyMine:'\u00a1Escribe el primer diario!', emptyLikes:'A\u00fan no hay diarios con me gusta.',
    emptyHomeTitle:'La primera p\u00e1gina es tuya',
    emptyHomeSub:'Un hilo blanco y tranquilo para la Corea de cada d\u00eda. Escribe tu primer diario K-culture.',
    emptyHomeCta:'Escribir el primer diario',
    posts:'Diarios', likes:'Me gusta', followed:'Siguiendo a KOMI \ud83d\udc9b', unfollowed:'Seguir',
    offline:'Sin conexi\u00f3n \u2014 mostrando diarios guardados', updated:'Feed actualizado',
    deleteComment:'Eliminar',
    dateLocale:'es-ES', needText:'Escribe algo primero \u2728',
  },
};

/* ---------- content ---------- */
const MIN = 60 * 1000;

/* ---------- utils ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const escAttr = (s) => esc(s).replace(/\n/g,' ');

const uid = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);

function getLang(){ return localStorage.getItem(LANG_KEY) || 'en'; }
function t(key){ const L = T[getLang()] || T.en; return (key in L) ? L[key] : (T.en[key] != null ? T.en[key] : key); }

function timeAgo(ts){
  const d = Date.now() - ts;
  const L = getLang();
  if (d < MIN) return L === 'ko' ? '\ubc29\uae08' : L === 'zh' ? '\u521a\u521a' : L === 'ja' ? '\u305f\u3063\u305f\u4eca' : L === 'es' ? 'ahora' : 'now';
  const m = Math.floor(d / MIN);
  if (m < 60) return L === 'ko' ? m + '\ubd84 \uc804' : L === 'zh' ? m + '\u5206\u949f\u524d' : L === 'ja' ? m + '\u5206\u524d' : L === 'es' ? 'hace ' + m + ' min' : m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return L === 'ko' ? h + '\uc2dc\uac04 \uc804' : L === 'zh' ? h + '\u5c0f\u65f6\u524d' : L === 'ja' ? h + '\u6642\u9593\u524d' : L === 'es' ? 'hace ' + h + ' h' : h + 'h';
  const day = Math.floor(h / 24);
  return L === 'ko' ? day + '\uc77c \uc804' : L === 'zh' ? day + '\u5929\u524d' : L === 'ja' ? day + '\u65e5\u524d' : L === 'es' ? 'hace ' + day + ' d' : day + 'd';
}

function fullDate(ts){
  try { return new Date(ts).toLocaleDateString(t('dateLocale'), { year:'numeric', month:'long', day:'numeric', weekday:'long' }); }
  catch(e) { return new Date(ts).toDateString(); }
}

/* ---------- media store (IndexedDB) ----------
   Photos and videos live in IndexedDB as blobs; localStorage keeps only the
   post text plus small {id, kind} references, so a clip does not blow the 5MB quota. */
let dbPromise = null;

function dbOpen(){
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((res, rej) => {
    if (!('indexedDB' in window)) { rej(new Error('no-idb')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error || new Error('idb-open'));
  });
  return dbPromise;
}

function mediaPut(id, blob, kind){
  return dbOpen().then(db => new Promise((res, rej) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ id, blob, kind, ts: Date.now() });
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  }));
}

function mediaGet(id){
  return dbOpen().then(db => new Promise((res, rej) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const r = tx.objectStore(DB_STORE).get(id);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  }));
}

function mediaDel(id){
  return dbOpen().then(db => new Promise((res) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  })).catch(() => false);
}

const newMediaId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* id -> {url, kind}: object URLs resolved once per session */
const mediaURLs = new Map();

function resolveMedia(posts){
  const missing = [];
  (posts || []).forEach(p => (p.media || []).forEach(m => {
    if (m && m.id && !mediaURLs.has(m.id) && !missing.some(x => x.id === m.id)) missing.push(m);
  }));
  if (!missing.length) return Promise.resolve(false);
  return missing.reduce((chain, m) => chain.then(async (changed) => {
    try {
      const rec = await mediaGet(m.id);
      if (rec && rec.blob) {
        mediaURLs.set(m.id, { url: URL.createObjectURL(rec.blob), kind: rec.kind || m.kind });
        return true;
      }
    } catch (e) { /* leave the placeholder */ }
    return changed;
  }), Promise.resolve(false));
}

/* Older versions kept photo data-URLs inside localStorage posts. Move them into
   IndexedDB once, so the post text and the media live where each belongs. */
async function migrateLegacyPhotos(){
  let changed = false;
  for (const p of state.diaries) {
    if (!Array.isArray(p.photos) || !p.photos.length) continue;
    if (Array.isArray(p.media) && p.media.length) { delete p.photos; changed = true; continue; }
    const media = [];
    let ok = true;
    for (const src of p.photos) {
      if (typeof src !== 'string' || src.indexOf('data:') !== 0) { ok = false; break; }
      try {
        const blob = await (await fetch(src)).blob();
        const id = newMediaId();
        await mediaPut(id, blob, 'image');
        media.push({ id, kind: 'image' });
      } catch (e) { ok = false; break; }
    }
    if (ok && media.length === p.photos.length) {
      p.media = media;
      delete p.photos;
      changed = true;
    }
  }
  if (changed) save(state);
  return changed;
}

async function ensureMedia(){
  let changed = false;
  try { changed = await resolveMedia(state.diaries); } catch (e) {}
  try { if (await migrateLegacyPhotos()) changed = true; } catch (e) {}
  try { if (await resolveMedia(state.diaries)) changed = true; } catch (e) {}
  if (changed) render();
}

/* ---------- data ---------- */
let state = null;

function load(){
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch(e) { d = null; }
  if (!d || !Array.isArray(d.diaries)) {
    d = {
      v: 1,
      me: { nick: "KOMI's Unnie", handle: '@me', following: false },
      diaries: [],
      filterTag: null, searchQuery: '', meTab: 'mine',
    };
    save(d);
  }
  /* one-time cleanup: drop the old built-in sample diaries (ids 'seed*') that
     earlier visits cached in localStorage, so the first page starts empty. */
  if (Array.isArray(d.diaries)) {
    const kept = d.diaries.filter(p => !(p && typeof p.id === 'string' && p.id.indexOf('seed') === 0));
    if (kept.length !== d.diaries.length) {
      d.diaries = kept;
      if (d.filterTag && !kept.some(p => (p.tags || []).indexOf(d.filterTag) >= 0)) d.filterTag = null;
      save(d);
    }
  }
  if (typeof d.filterTag !== 'string') d.filterTag = null;
  if (typeof d.searchQuery !== 'string') d.searchQuery = '';
  if (d.meTab !== 'mine' && d.meTab !== 'likes') d.meTab = 'mine';
  if (!d.me || typeof d.me !== 'object') d.me = { nick: "KOMI's Unnie", handle: '@me', following: false };
  if (typeof d.me.following !== 'boolean') d.me.following = false;
  state = d;
}

function save(d){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); }
  catch(e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      toast(getLang() === 'ko' ? '\uc800\uc7a5 \uacf5\uac04\uc774 \ubd80\uc871\ud574\uc694 \u2014 \uc0ac\uc9c4\uc744 \uc9c0\uc6cc\uc8fc\uc138\uc694'
        : getLang() === 'ja' ? '\u4fdd\u5b58\u5bb9\u91cf\u4e0d\u8db3 \u2014 \u5199\u771f\u3092\u524a\u9664\u3057\u3066\u304f\u3060\u3055\u3044'
        : getLang() === 'zh' ? '\u5b58\u50a8\u7a7a\u95f4\u4e0d\u8db3 \u2014 \u8bf7\u5220\u9664\u4e00\u4e9b\u7167\u7247'
        : getLang() === 'es' ? 'Espacio lleno \u2014 borra alguna foto'
        : 'Storage full \u2014 please remove some photos');
    }
  }
}

function findPost(id){ return state.diaries.find(p => p.id === id) || null; }

/* ---------- comments ---------- */
function addComment(pid, text){
  const p = findPost(pid); if (!p) return;
  p.comments.push({ id: 'c' + uid(), nick: state.me.nick, handle: state.me.handle, text, ts: Date.now() });
  save(state); render();
}

function deleteComment(pid, cid){
  const p = findPost(pid); if (!p) return;
  p.comments = p.comments.filter(c => c.id !== cid);
  save(state); render();
}

/* ---------- media pipeline ---------- */
function readAsDataURL(file){
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}

function loadImage(src){
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}

/* Photos are re-encoded to a modest JPEG so a phone photo stays a few hundred KB. */
async function downscaleImageBlob(file){
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  let { width: w, height: h } = img;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
  let canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  let q = JPEG_Q;
  let blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
  while (blob && blob.size > 1.2e6 && q > 0.4) {
    q -= 0.14;
    blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
  }
  if (blob && blob.size > 1.2e6) {
    const s = 0.7, nw = Math.round(w * s), nh = Math.round(h * s);
    const small = document.createElement('canvas');
    small.width = nw; small.height = nh;
    small.getContext('2d').drawImage(img, 0, 0, nw, nh);
    blob = await new Promise(res => small.toBlob(res, 'image/jpeg', 0.7));
  }
  return blob;
}

/* ---------- compose ---------- */
let draftMedia = [];   /* { kind, blob, url } — object URLs for the preview strip */

function openCompose(){
  $('#nickInput').value = state.me && state.me.nick ? state.me.nick : "KOMI's Unnie";
  $('#bodyInput').value = '';
  $('#tagInput').value = '';
  $('#bodyCount').textContent = '0';
  draftMedia.forEach(m => { try { URL.revokeObjectURL(m.url); } catch (e) {} });
  draftMedia = [];
  $('#mediaInput').value = '';
  renderDraftMedia();
  openSheet($('#composeSheet'));
  setTimeout(() => $('#bodyInput').focus(), 260);
}

function renderDraftMedia(){
  const strip = $('#photoStrip');
  strip.hidden = draftMedia.length === 0;
  strip.innerHTML = draftMedia.map((m, i) => (
    '<div class="photo-thumb' + (m.kind === 'video' ? ' is-video' : '') + '">'
    + (m.kind === 'video'
        ? '<video src="' + escAttr(m.url) + '" muted playsinline preload="metadata"></video><span class="thumb-play" aria-hidden="true">\u25b6</span>'
        : '<img src="' + escAttr(m.url) + '" alt="">')
    + '<button type="button" class="rm" data-i="' + i + '" aria-label="Remove">\u2715</button></div>'
  )).join('');
}

async function addMediaFiles(files){
  for (const f of Array.from(files || [])) {
    if (draftMedia.length >= MAX_MEDIA) { toast(t('tooManyPhotos')); break; }
    const isImage = /^image\//.test(f.type);
    const isVideo = /^video\//.test(f.type);
    if (!isImage && !isVideo) continue;
    if (isVideo && f.size > MAX_VIDEO_BYTES) { toast(t('videoTooBig')); continue; }
    try {
      if (isImage) {
        const blob = await downscaleImageBlob(f);
        if (!blob) throw new Error('encode');
        draftMedia.push({ kind: 'image', blob, url: URL.createObjectURL(blob) });
      } else {
        draftMedia.push({ kind: 'video', blob: f, url: URL.createObjectURL(f) });
      }
    } catch (e) {
      toast(t(isVideo ? 'videoBad' : 'photoBad'));
    }
  }
  renderDraftMedia();
}

async function storeDraftMedia(items){
  const refs = [];
  for (const m of items) {
    try {
      const id = newMediaId();
      await mediaPut(id, m.blob, m.kind);
      mediaURLs.set(id, { url: m.url, kind: m.kind });   /* reuse the preview URL */
      refs.push({ id, kind: m.kind });
    } catch (e) {
      /* IndexedDB unavailable: keep a photo inline, drop a video we cannot hold */
      if (m.kind === 'image') {
        try { refs.push({ id: newMediaId(), kind: 'image', data: await readAsDataURL(m.blob) }); } catch (e2) {}
      }
    }
  }
  return refs;
}

async function submitPost(){
  const nick = ($('#nickInput').value || '').trim() || "KOMI's Unnie";
  const body = ($('#bodyInput').value || '').trim();
  if (!body) { toast(t('needText')); return; }
  const tags = ($('#tagInput').value || '').split(/[\s,]+/).map(s => s.replace(/^#+/, '').trim().toLowerCase())
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
  const btn = $('#composeSubmit');
  if (btn) btn.disabled = true;
  let media = [];
  try { media = await storeDraftMedia(draftMedia); } catch (e) { media = []; }
  if (btn) btn.disabled = false;
  /* an inline fallback keeps photos readable even without IndexedDB */
  const inlinePhotos = media.filter(m => m.data).map(m => m.data);
  const refs = media.filter(m => !m.data);
  const p = {
    id: uid(), nick, handle: state.me.handle, avatar: null,
    body, tags, media: refs, translations: {}, mine: true, verified: false,
    ts: Date.now(), likes: 0, liked: false, reposts: 0, reposted: false, comments: [],
  };
  if (inlinePhotos.length) p.photos = inlinePhotos;
  state.diaries.unshift(p);
  state.me.nick = nick;
  save(state);
  draftMedia = [];
  closeSheet($('#composeSheet'));
  toast(t('posted'));
  if (state.filterTag && !p.tags.includes(state.filterTag)) state.filterTag = null;
  go('home', true);
}

/* ---------- sheet ---------- */
function openSheet(sheet){
  const scrim = $('#scrim');
  scrim.hidden = false; sheet.hidden = false;
  requestAnimationFrame(() => { scrim.classList.add('is-open'); sheet.classList.add('is-open'); });
}
function closeSheet(sheet){
  const scrim = $('#scrim');
  scrim.classList.remove('is-open'); sheet.classList.remove('is-open');
  setTimeout(() => { scrim.hidden = true; sheet.hidden = true; }, 230);
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2400);
}

/* ---------- share ---------- */
function postLink(p){ return PAGE_URL + '#d=' + p.id; }

async function sharePost(p){
  const data = { title: "KOMI's K-Culture Diary", text: p.body.slice(0, 120), url: postLink(p) };
  if (navigator.share) {
    try { await navigator.share(data); toast(t('sharedTo')); return; }
    catch(e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(data.url); toast(t('copied')); }
  catch(e) {
    const ta = document.createElement('textarea');
    ta.value = data.url; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(t('copied')); }
    catch(e2) { toast(data.url); }
    ta.remove();
  }
}

/* ---------- deep link ---------- */
function readDeepLink(){
  const m = (location.hash || '').match(/d=([A-Za-z0-9_\-]+)/);
  return m ? m[1] : null;
}

/* ---------- rendering ---------- */
let currentView = 'home';
let deepLinkedId = null;

function visiblePosts(){
  let list = state.diaries.slice();
  if (currentView === 'search') {
    const q = (state.searchQuery || '').trim().toLowerCase();
    const tag = state.filterTag;
    if (q) list = list.filter(p => p.body.toLowerCase().includes(q) || p.tags.some(x => x.includes(q)) || p.nick.toLowerCase().includes(q));
    if (tag) list = list.filter(p => p.tags.includes(tag));
  } else if (currentView === 'me') {
    if (state.meTab === 'likes') { list = list.filter(p => p.liked); }
    else { list = list.filter(p => p.mine); }
  }
  return list.sort((a, b) => b.ts - a.ts);
}

function render(){
  const y = window.scrollY;   /* a re-render (media, translation) must not jump the feed */
  renderLangUI();
  renderMain();
  markTabs();
  if (y) window.scrollTo(0, y);
}

function markTabs(){
  $$('.tab[data-view]').forEach(b => {
    const active = b.dataset.view === currentView || (b.dataset.view === 'search' && currentView === 'search');
    b.classList.toggle('is-active', active);
  });
}

function renderLangUI(){
  const code = getLang();
  $('#langCode').textContent = LANGS.some(l => l.code === code) ? code.toUpperCase() : 'EN';
  $$('#langMenu .lang-item').forEach(b => b.setAttribute('aria-selected', String(b.dataset.code === code)));
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#nickInput').placeholder = t('nickPlaceholder');
  $('#bodyInput').placeholder = t('bodyPlaceholder');
  $('#tagInput').placeholder = t('tagPlaceholder');
  document.documentElement.lang = code;
}

const ICO = {
  heart: (cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.3 4.9 13a4.9 4.9 0 0 1 0-6.9 4.7 4.7 0 0 1 6.8 0l.3.3.3-.3a4.7 4.7 0 0 1 6.8 0 4.9 4.9 0 0 1 0 6.9Z"/></svg>',
  bubble: '<svg class="ico" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.8a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.3-.6L4 21l1.6-4.3a8 8 0 0 1-1.1-4.9A8.4 8.4 0 0 1 13 3.5a8.4 8.4 0 0 1 8 8.3Z"/></svg>',
  repeat: (cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 21 6.5l-4 4"/><path d="M21 6.5H8a4 4 0 0 0-4 4v1"/><path d="M7 21.5l-4-4 4-4"/><path d="M3 17.5h13a4 4 0 0 0 4-4v-1"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2.5 11 13"/><path d="M21.5 2.5 15 21.5l-4-8.5-8.5-4Z"/></svg>',
  globe: '<svg class="globe" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg>',
};

function avatarHTML(p, size){
  const cls = 'avatar-' + size;
  if (p.avatar) return '<img class="avatar ' + cls + '" src="' + escAttr(p.avatar) + '" alt="" width="' + size + '" height="' + size + '">';
  const letter = (p.nick || '?').trim().charAt(0).toUpperCase();
  return '<span class="avatar-fallback ' + cls + '" aria-hidden="true">' + esc(letter) + '</span>';
}

function tagChipHTML(tag, i){
  const c = DC[i % DC.length];
  return '<button type="button" class="chip dc-chip" data-tag="' + escAttr(tag) + '" style="--dc: ' + c + '">#' + esc(tag) + '</button>';
}

/* A post's attachments: IndexedDB media refs, or legacy inline photo data-URLs. */
function postMediaItems(p){
  const items = [];
  if (Array.isArray(p.media) && p.media.length) {
    p.media.slice(0, MAX_MEDIA).forEach(m => {
      const hit = m.id ? mediaURLs.get(m.id) : null;
      items.push({ kind: m.kind || 'image', url: hit ? hit.url : null, id: m.id || '' });
    });
  } else if (Array.isArray(p.photos) && p.photos.length) {
    p.photos.slice(0, MAX_MEDIA).forEach((src, i) => items.push({ kind: 'image', url: src, id: 'ph' + i }));
  }
  return items;
}

function mediaHTML(p){
  const items = postMediaItems(p);
  if (!items.length) return '';
  const n = items.length;
  const vids = items.filter(x => x.kind === 'video').length;
  let inner = '';
  items.forEach((it, i) => {
    if (it.kind === 'video') {
      inner += it.url
        ? '<video class="ph-video" src="' + escAttr(it.url) + '" controls playsinline webkit-playsinline preload="metadata" data-video="' + i + '"></video>'
        : '<div class="ph-skel ph-video-skel"><span>\u25b6</span></div>';
    } else {
      inner += it.url
        ? '<img src="' + escAttr(it.url) + '" alt="" loading="lazy" data-photo="' + i + '">'
        : '<div class="ph-skel"></div>';
    }
  });
  return '<div class="post-photos" data-n="' + n + '" data-vids="' + vids + '">' + inner + '</div>';
}

function commentsHTML(p){
  if (!p.comments.length) return '';
  return p.comments.map(c => (
    '<div class="comment" data-cid="' + escAttr(c.id) + '">'
    + avatarHTML(c, 28)
    + '<div class="comment-main"><div class="comment-head">'
    + '<span class="comment-author">' + esc(c.nick) + '</span>'
    + '<span class="comment-time">' + timeAgo(c.ts) + '</span></div>'
    + '<p class="comment-text">' + esc(c.text) + '</p>'
    + (c.nick === state.me.nick ? '<button type="button" class="comment-del" data-del-comment="' + escAttr(c.id) + '">' + t('deleteComment') + '</button>' : '')
    + '</div></div>'
  )).join('');
}

/* ---------- translation ----------
   Posts the user writes herself are translated on demand and kept in memory,
   so the same post is never sent twice for the same language. */
let trState = {};            /* postId -> {lang, status:'loading'|'done'|'error', text, src, same} */
const trCache = new Map();   /* postId|lang -> {text, src, same} */

const TR_TARGET = { en: 'en', ko: 'ko', ja: 'ja', zh: 'zh-CN', es: 'es' };
const TR_LIBRE_TARGET = { en: 'en', ko: 'ko', ja: 'ja', zh: 'zh', es: 'es' };

function sameLang(a, b){
  if (!a || !b) return false;
  return String(a).slice(0, 2).toLowerCase() === String(b).slice(0, 2).toLowerCase();
}

async function trGoogle(text, target){
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl='
    + encodeURIComponent(target) + '&dt=t';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: 'q=' + encodeURIComponent(text),
  });
  if (!res.ok) throw new Error('gtx ' + res.status);
  const j = await res.json();
  const out = (j[0] || []).map(seg => (seg && seg[0]) || '').join('');
  if (!out.trim()) throw new Error('gtx empty');
  return { text: out, src: j[2] || null };
}

async function trClients5(text, target){
  const url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl='
    + encodeURIComponent(target) + '&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error('c5 ' + res.status);
  const j = await res.json();
  let out = '';
  if (Array.isArray(j)) {
    if (typeof j[0] === 'string') out = j.join(' ');
    else if (Array.isArray(j[0])) out = j.map(s => (Array.isArray(s) ? (s[0] || '') : (s || ''))).join('');
    else if (j[0] && Array.isArray(j[0].sentences)) out = j[0].sentences.map(s => s.trans || '').join('');
  } else if (j && Array.isArray(j.sentences)) {
    out = j.sentences.map(s => s.trans || '').join('');
  }
  if (!out.trim()) throw new Error('c5 empty');
  return { text: out, src: null };
}

async function trLibre(text, target){
  const res = await fetch('https://translate.astian.org/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: 'auto', target: TR_LIBRE_TARGET[target] || target, format: 'text' }),
  });
  if (!res.ok) throw new Error('libre ' + res.status);
  const j = await res.json();
  const out = (j && j.translatedText) || '';
  if (!out.trim()) throw new Error('libre empty');
  return { text: out, src: j.detectedLanguage && j.detectedLanguage.language ? j.detectedLanguage.language : null };
}

async function translateText(text, target){
  const q = String(text || '').slice(0, 4000);
  let lastErr = null;
  for (const fn of [trGoogle, trClients5, trLibre]) {
    try {
      const out = await fn(q, target);
      if (out && out.text) return out;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('translate failed');
}

function translateRowHTML(p){
  const lang = getLang();
  const st = (trState[p.id] && trState[p.id].lang === lang) ? trState[p.id] : null;
  const isOpen = !!(st && st.status === 'done');
  let label = t('translate');
  if (st && st.status === 'loading') label = t('translating');
  else if (isOpen) label = t('seeOriginal');
  let body = '';
  if (isOpen) {
    body = '<div class="translate-body">' + esc(st.text)
      + '<div class="translate-meta">' + esc(st.same ? t('translateSame') : t('translatedBy')) + '</div></div>';
  } else if (st && st.status === 'error') {
    body = '<div class="translate-note">' + esc(t('translateFail')) + '</div>';
  }
  return '<div class="translate-row"><button type="button" class="translate-btn'
    + (st && st.status === 'loading' ? ' is-loading' : '') + '" data-translate="' + escAttr(p.id) + '">'
    + ICO.globe + '<span>' + esc(label) + '</span></button>' + body + '</div>';
}

async function startTranslate(p, lang){
  const cur = trState[p.id];
  if (cur && cur.lang === lang) {
    if (cur.status === 'done') { delete trState[p.id]; render(); return; }
    if (cur.status === 'loading') return;
  }
  const bundled = p.translations && p.translations[lang];
  if (bundled && bundled !== p.body) {
    trState[p.id] = { lang, status: 'done', text: bundled, same: false };
    render();
    return;
  }
  const key = p.id + '|' + lang;
  if (trCache.has(key)) {
    trState[p.id] = Object.assign({ lang, status: 'done' }, trCache.get(key));
    render();
    return;
  }
  trState[p.id] = { lang, status: 'loading' };
  render();
  try {
    const out = await translateText(p.body, TR_TARGET[lang] || lang);
    const entry = { text: out.text, src: out.src || null, same: sameLang(out.src, lang) };
    trCache.set(key, entry);
    trState[p.id] = Object.assign({ lang, status: 'done' }, entry);
  } catch (e) {
    trState[p.id] = { lang, status: 'error' };
  }
  render();
}

function postHTML(p){
  const tags = p.tags.map((tg, i) => tagChipHTML(tg, i)).join('');
  const followBtn = (!p.mine)
    ? '<button type="button" class="follow-btn' + (state.me.following ? ' is-following' : '') + '" data-follow="1">' + (state.me.following ? t('followed') : t('unfollowed')) + '</button>'
    : '';
  return (
    '<article class="post" id="p-' + escAttr(p.id) + '" data-pid="' + escAttr(p.id) + '">'
    + '<div class="post-top">'
    +   avatarHTML(p, 36)
    +   '<div class="post-headline">'
    +     '<div class="byline">'
    +       '<span class="byline-name">' + esc(p.nick) + '</span>'
    +       '<span class="byline-handle">' + esc(p.handle) + '</span>'
    +       '<span class="dot">\u00b7</span>'
    +       '<span class="byline-time" data-ts="' + p.ts + '">' + timeAgo(p.ts) + '</span>'
    +       followBtn
    +     '</div>'
    +     '<p class="post-body">' + esc(p.body) + '</p>'
    +     (tags ? '<div class="post-tags">' + tags + '</div>' : '')
    +   '</div>'
    + '</div>'
    + mediaHTML(p)
    + translateRowHTML(p)
    + '<div class="post-actions">'
    +   '<button type="button" class="act' + (p.liked ? ' is-liked' : '') + '" data-act="like" aria-pressed="' + (p.liked ? 'true' : 'false') + '">' + ICO.heart() + '<span class="cnt">' + (p.likes || '') + '</span></button>'
    +   '<button type="button" class="act" data-act="comment">' + ICO.bubble + '<span class="cnt">' + (p.comments.length || '') + '</span></button>'
    +   '<button type="button" class="act' + (p.reposted ? ' is-reposted' : '') + '" data-act="repost" aria-pressed="' + (p.reposted ? 'true' : 'false') + '">' + ICO.repeat() + '<span class="cnt">' + (p.reposts || '') + '</span></button>'
    +   '<button type="button" class="act" data-act="share">' + ICO.send + '</button>'
    +   (p.mine ? '<button type="button" class="act" data-act="delete" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9 7V4.5h6V7"/></svg></button>' : '')
    + '</div>'
    + '<div class="comments" hidden>'
    +   commentsHTML(p)
    +   '<form class="comment-form" data-cform="' + escAttr(p.id) + '">'
    +     avatarHTML({ nick: state.me.nick }, 28)
    +     '<input class="comment-input" type="text" maxlength="280" placeholder="' + escAttr(t('commentPlaceholder')) + '" aria-label="' + escAttr(t('comment')) + '">'
    +     '<button class="send-btn" type="submit" aria-label="' + escAttr(t('send')) + '">' + ICO.send + '</button>'
    +   '</form>'
    + '</div>'
    + '</article>'
  );
}

function todayBannerHTML(){
  const now = Date.now();
  return (
    '<div class="date-banner">'
    + '<span class="stamp" aria-hidden="true">' + STAMP_SVG + '</span>'
    + '<span class="date-copy"><b>' + esc(t('todayBanner')) + '</b><span>' + esc(fullDate(now)) + '</span></span>'
    + '</div>'
  );
}

function emptyHTML(msg){
  return '<div class="empty"><b>KOMI \ud83d\udc36</b>' + esc(msg) + '</div>';
}

function emptyHomeHTML(){
  return (
    '<div class="empty-home">'
    + '<img class="empty-flower" src="./img/dancheong-flower.svg" alt="" width="68" height="68">'
    + '<b class="empty-title">' + esc(t('emptyHomeTitle')) + '</b>'
    + '<p class="empty-sub">' + esc(t('emptyHomeSub')) + '</p>'
    + '<button type="button" class="pill primary empty-cta" data-empty-post="1">' + esc(t('emptyHomeCta')) + '</button>'
    + '</div>'
  );
}

function renderMain(){
  const main = $('#main');
  const v = currentView;

  if (v === 'home') {
    const posts = visiblePosts();
    main.innerHTML =
      '<div class="feed-head-pad"></div>'
      + todayBannerHTML()
      + (posts.length ? posts.map(postHTML).join('') : emptyHomeHTML());
    return;
  }
  if (v === 'search') {
    const tags = topTags();
    const note = (state.filterTag || state.searchQuery)
      ? '<div class="filter-note"><span>' + esc(t('searchingFor')) + ' <b>' + esc(state.filterTag ? '#' + state.filterTag : state.searchQuery) + '</b></span>'
        + '<button type="button" id="clearFilter">' + esc(t('clearFilter')) + '</button></div>'
      : '';
    main.innerHTML =
      '<div class="view-head"><h2 class="view-title">' + esc(t('searchTitle')) + '</h2></div>'
      + '<div class="search-wrap"><input id="searchInput" class="search-input" type="search" placeholder="' + escAttr(t('searchPlaceholder')) + '" value="' + escAttr(state.searchQuery || '') + '"></div>'
      + '<div class="tag-cloud">' + tags.map((tg, i) => tagChipHTML(tg, i)).join('') + '</div>'
      + note
      + (visiblePosts().length ? visiblePosts().map(postHTML).join('') : emptyHTML(state.searchQuery || state.filterTag ? t('emptySearch') : t('emptyFeed')));
    const si = $('#searchInput');
    if (si) {
      si.addEventListener('input', () => { state.searchQuery = si.value; save(state); refreshResultsKeepFocus(); });
    }
    return;
  }
  if (v === 'me') {
    const mine = state.diaries.filter(p => p.mine).length;
    const liked = state.diaries.filter(p => p.liked).length;
    const isLikes = state.meTab === 'likes';
    main.innerHTML =
      '<div class="view-head"><h2 class="view-title">' + esc(t('myTitle')) + '</h2>'
      + '<span class="view-sub">' + esc(state.me.nick) + '</span></div>'
      + '<div class="me-tabs">'
      + '<button type="button" class="me-tab' + (!isLikes ? ' is-active' : '') + '" data-metab="mine">' + esc(t('myPosts')) + '</button>'
      + '<button type="button" class="me-tab' + (isLikes ? ' is-active' : '') + '" data-metab="likes">' + esc(t('myLikes')) + '</button>'
      + '</div>'
      + '<div class="me-stats">'
      + '<div class="me-stat"><b>' + mine + '</b><span>' + esc(t('posts')) + '</span></div>'
      + '<div class="me-stat"><b>' + liked + '</b><span>' + esc(t('likes')) + '</span></div>'
      + '</div>'
      + (visiblePosts().length ? visiblePosts().map(postHTML).join('') : emptyHTML(isLikes ? t('emptyLikes') : t('emptyMine')));
    return;
  }
}

function refreshResultsKeepFocus(){
  const main = $('#main');
  if (currentView !== 'search') return renderMain();
  const pos = window.scrollY;
  const hadFocus = document.activeElement === $('#searchInput');
  const val = $('#searchInput') ? $('#searchInput').value : state.searchQuery;
  renderMain();
  const si = $('#searchInput');
  if (si) { si.value = val; if (hadFocus) { si.focus(); si.setSelectionRange(val.length, val.length); } }
  window.scrollTo(0, pos);
}

function topTags(){
  const m = {};
  state.diaries.forEach(p => p.tags.forEach(tg => { m[tg] = (m[tg] || 0) + 1; }));
  return Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, 10);
}

/* ---------- interactions ---------- */
function go(view, force){
  if (!force && currentView === view) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  currentView = view;
  render();
  window.scrollTo(0, 0);
}

function findPostElFrom(node){
  return node && node.closest ? node.closest('.post') : null;
}

function onMainClick(e){
  const target = e.target;

  const emptyPostBtn = target.closest('[data-empty-post]');
  if (emptyPostBtn) { openCompose(); return; }

  const translateBtn = target.closest('[data-translate]');
  if (translateBtn) {
    const postEl = findPostElFrom(translateBtn);
    const p = postEl ? findPost(postEl.dataset.pid) : null;
    if (p) startTranslate(p, getLang());
    return;
  }

  const delCommentBtn = target.closest('[data-del-comment]');
  if (delCommentBtn) { deleteComment(findPostElFrom(delCommentBtn).dataset.pid, delCommentBtn.dataset.delComment); return; }

  const followBtn = target.closest('[data-follow]');
  if (followBtn) {
    state.me.following = !state.me.following;
    save(state); render();
    return;
  }

  const chip = target.closest('[data-tag]');
  if (chip) {
    state.searchQuery = '';
    state.filterTag = chip.dataset.tag;
    go('search');
    return;
  }

  const clearBtn = target.closest('#clearFilter');
  if (clearBtn) { state.filterTag = null; state.searchQuery = ''; save(state); render(); return; }

  const photoEl = target.closest('[data-photo]');
  if (photoEl) {
    const postEl = findPostElFrom(photoEl);
    const p = postEl ? findPost(postEl.dataset.pid) : null;
    if (!p) return;
    const i = parseInt(photoEl.dataset.photo, 10) || 0;
    const item = postMediaItems(p)[i];
    if (item && item.url && item.kind === 'image') openViewer(item.url);
    return;
  }

  const actBtn = target.closest('[data-act]');
  if (actBtn) {
    const post = findPostElFrom(actBtn);
    const p = findPost(post.dataset.pid);
    if (!p) return;
    const act = actBtn.dataset.act;
    if (act === 'like') { p.liked = !p.liked; p.likes += p.liked ? 1 : -1; if (p.likes < 0) p.likes = 0; save(state); render(); }
    else if (act === 'repost') { p.reposted = !p.reposted; p.reposts += p.reposted ? 1 : -1; if (p.reposts < 0) p.reposts = 0; save(state); render(); toast(t(p.reposted ? 'reposted' : 'unreposted')); }
    else if (act === 'share') { sharePost(p); }
    else if (act === 'comment') { const box = post.querySelector('.comments'); box.hidden = false; const inp = box.querySelector('.comment-input'); inp.focus(); box.scrollIntoView({ block: 'nearest' }); }
    else if (act === 'delete') {
      if (confirm(t('confirmDelete'))) {
        (p.media || []).forEach(m => {
          if (!m || !m.id) return;
          mediaDel(m.id);
          mediaURLs.delete(m.id);
          trCache.delete(m.id);
        });
        delete trState[p.id];
        state.diaries = state.diaries.filter(x => x.id !== p.id);
        save(state); render(); toast(t('deleted'));
      }
    }
    return;
  }
}

function onMainSubmit(e){
  const form = e.target.closest('[data-cform]');
  if (!form) return;
  e.preventDefault();
  const pid = form.dataset.cform;
  const inp = form.querySelector('.comment-input');
  const text = (inp.value || '').trim();
  if (!text) return;
  addComment(pid, text);
}

function openViewer(src){
  $('#viewerImg').src = src;
  $('#viewer').hidden = false;
}
function closeViewer(){ $('#viewer').hidden = true; $('#viewerImg').src = ''; }

/* ---------- offline ---------- */
function updateOnline(){
  let bar = $('#offlineBar');
  if (!navigator.onLine) {
    if (!bar) { bar = document.createElement('div'); bar.id = 'offlineBar'; bar.className = 'offline-bar'; document.body.appendChild(bar); }
    bar.textContent = t('offline');
  } else if (bar) bar.remove();
}

/* ---------- boot ---------- */
function buildLangMenu(){
  $('#langMenu').innerHTML = LANGS.map(l => (
    '<button type="button" class="lang-item" role="option" data-code="' + l.code + '" aria-selected="false">'
    + '<span>' + esc(l.label) + '</span><span class="tick">\u2713</span></button>'
  )).join('');
}

function bind(){
  $('#composeBtn').addEventListener('click', openCompose);
  $('#composeBtn2').addEventListener('click', openCompose);
  $('#composeCancel').addEventListener('click', () => closeSheet($('#composeSheet')));
  $('#scrim').addEventListener('click', () => closeSheet($('#composeSheet')));
  $('#composeSubmit').addEventListener('click', submitPost);

  $('#bodyInput').addEventListener('input', () => { $('#bodyCount').textContent = String($('#bodyInput').value.length); });

  /* guard: a browser holding an older cached index.html must not break boot */
  const mediaInput = $('#mediaInput'), photoBtn = $('#photoBtn');
  if (photoBtn && mediaInput) {
    photoBtn.addEventListener('click', () => mediaInput.click());
    mediaInput.addEventListener('change', (e) => { addMediaFiles(e.target.files); e.target.value = ''; });
  }
  if ($('#photoStrip')) $('#photoStrip').addEventListener('click', (e) => {
    const rm = e.target.closest('.rm');
    if (rm) {
      const i = parseInt(rm.dataset.i, 10);
      const gone = draftMedia.splice(i, 1)[0];
      if (gone) { try { URL.revokeObjectURL(gone.url); } catch (err) {} }
      renderDraftMedia();
    }
  });

  const langBtn = $('#langBtn'), langMenu = $('#langMenu');
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); langMenu.hidden = !langMenu.hidden; langBtn.setAttribute('aria-expanded', String(!langMenu.hidden)); });
  langMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.lang-item');
    if (!item) return;
    localStorage.setItem(LANG_KEY, item.dataset.code);
    langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false');
    trState = {};          /* translations are per language: start fresh */
    render();
  });
  document.addEventListener('click', (e) => {
    if (!langMenu.hidden && !e.target.closest('#lang')) { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); }
  });

  $$('.tab[data-view]').forEach(btn => btn.addEventListener('click', () => go(btn.dataset.view)));

  const main = $('#main');
  main.addEventListener('click', onMainClick);
  main.addEventListener('submit', onMainSubmit);
  main.addEventListener('click', (e) => {
    const metaBtn = e.target.closest('[data-metab]');
    if (metaBtn) { state.meTab = metaBtn.dataset.metab; save(state); render(); return; }
  });

  $('#viewer').addEventListener('click', closeViewer);
  $('#viewerClose').addEventListener('click', closeViewer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeViewer(); if (!$('#composeSheet').hidden) closeSheet($('#composeSheet')); } });

  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
}

function boot(){
  buildLangMenu();
  load();
  bind();
  updateOnline();

  const dl = readDeepLink();
  if (dl) { deepLinkedId = dl; currentView = 'home'; render(); requestAnimationFrame(() => { const el = document.getElementById('p-' + dl); if (el) el.scrollIntoView({ block: 'center' }); }); }
  else render();

  ensureMedia();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
})();
