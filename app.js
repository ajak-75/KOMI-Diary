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
const MAX_VIDEO_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 15;          /* recommended: 10s, hard cap: 15s */
const VIDEO_SECONDS_SLACK = 0.25;      /* metadata rounding must not block a 15.0s clip */
const TOP_TAG_LIMIT = 8;
const DEFAULT_TAGS = ['MyCity', 'DailyVibes', 'KCulture', 'KFood'];   /* only while no tag is written yet */
const DB_NAME    = 'komidiary.media';
const DB_STORE   = 'media';

const DC = ['#4B7F9F', '#E05A47', '#EB7A2D', '#6E946B', '#D9B44A']; // dancheong

/* Free round dancheong stickers for the diaries — one per post. The artwork is
   cut out of the sticker sheet the user sent, with its white paper removed. */
const STICKERS = [1, 2, 3, 4, 5];
const stickerSrc = (n) => './img/dancheong-' + n + '.png';
const validSticker = (n) => (STICKERS.indexOf(Number(n)) >= 0 ? Number(n) : 0);

const STAMP_SVG = '<svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true">'
  + [0,72,144,216,288].map((a,i)=>`<path d="M24 3.5c4.6 3.5 6.7 8.6 5.5 13.9-.6 2.6-2.9 4.6-5.5 4.6s-4.9-2-5.5-4.6C17.3 12.1 19.4 7 24 3.5Z" fill="${DC[i]}" transform="rotate(${a} 24 24)"/>`).join('')
  + '<circle cx="24" cy="24" r="4.6" fill="#D9B44A"/><circle cx="24" cy="24" r="2.1" fill="#fff"/></svg>';

/* ---------- i18n ----------
   The app greets a visitor in the language her phone reports. Five languages
   are written out here in full; eleven more arrive with i18n-world.js; any
   other code is machine-translated once on the first visit and kept on the
   device, so the next visit opens in her language with no request at all. */
const LANGS = [
  { code:'en',  label:'English' },
  { code:'ko',  label:'한국어' },
  { code:'ja',  label:'日本語' },
  { code:'zh',  label:'中文' },
  { code:'es',  label:'Español' },
  { code:'pt',  label:'Português' },
  { code:'fr',  label:'Français' },
  { code:'de',  label:'Deutsch' },
  { code:'it',  label:'Italiano' },
  { code:'ru',  label:'Русский' },
  { code:'vi',  label:'Tiếng Việt' },
  { code:'th',  label:'ไทย' },
  { code:'id',  label:'Bahasa Indonesia' },
  { code:'hi',  label:'हिन्दी' },
  { code:'ar',  label:'العربية' },
  { code:'tr',  label:'Türkçe' },
];

/* languages written right to left */
const RTL = ['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ps', 'sd', 'ug', 'ckb', 'ku'];

/* each language's own locale, for dates, month names and "3m ago" */
const LOCALES = {
  en:'en-US', ko:'ko-KR', ja:'ja-JP', zh:'zh-CN', 'zh-TW':'zh-TW', es:'es-ES',
  pt:'pt-BR', fr:'fr-FR', de:'de-DE', it:'it-IT', ru:'ru-RU', vi:'vi-VN',
  th:'th-TH', id:'id-ID', hi:'hi-IN', ar:'ar-EG', tr:'tr-TR',
};

const T = {
  en: {
    tagline:'K-Culture & Daily Vibes with Kemi',
    meRole:'Kemi \u00b7 K-culture diarist',
    home:'Home', search:'Search', post:'Post', mydiary:'My Diary',
    todayBanner:'Today\u2019s K-Culture Diary', transPending:'Translations for global fans coming soon',
    translate:'Translate', seeOriginal:'See original', translatedBy:'Translated for global fans',
    newPost:'New diary', cancel:'Cancel', publish:'Post', posted:'Posted \ud83c\udf8a',
    editPost:'Edit diary', save:'Save', savedPost:'Updated \ud83c\udf8a', edited:'(edited)', edit:'Edit',
    nickPlaceholder:"KOMI's Unnie", bodyPlaceholder:'How is life where you are today?', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'Photo', media:'Photo·Video', photoHint:`Up to ${MAX_MEDIA} photos or videos (video: 10s · 15MB)`, tooManyPhotos:`Up to ${MAX_MEDIA} photos or videos`,
    videoTooBig:'Videos up to 15MB', videoTooLong:'Please use a video of 15 seconds or less', videoBad:'Could not add that video', photoBad:'Could not read that photo',
    translating:'Translating…', translateFail:'Could not translate \u2014 tap to try again', translateSame:'This post is already in this language',
    composeHint:'Your post is saved on this device.',
    stickerTitle:'\ud83c\udf38 Dancheong Sticker (Free)', stickerHint:'One per diary \u00b7 tap again to remove',
    comment:'Reply', commentPlaceholder:'Reply warmly to a fellow Kemi\u2026', send:'Send',
    like:'Like', repost:'Repost', share:'Share', copyLink:'Copy link', copied:'Link copied \ud83d\udd17',
    sharedTo:'Shared \ud83d\ude4c', shareFail:'Could not share \ud83d\ude22',
    reposted:'Reposted \ud83c\udf8a', unreposted:'Repost removed',
    deleted:'Deleted', confirmDelete:'Delete this diary?',
    myPosts:'My diaries', myLikes:'Liked',
    myTitle:'My Diary', searchTitle:'Search', searchPlaceholder:'Search text or #tag',
    trending:'Dancheong tags', popTags:'Popular tags', results:'Results', clearFilter:'Show all',
    searchingFor:'Showing', emptyFeed:'No diaries yet.', emptySearch:'Nothing found.',
    emptyMine:'No diaries yet \u2014 write the first one!', emptyLikes:'No liked diaries yet.',
    emptyHomeTitle:'The first page is yours',
    emptyHomeSub:'A white thread where Kemi around the world share K-culture and their own everyday. Leave your first K-culture diary \u2014 K-food, K-place, K-beauty.',
    emptyHomeCta:'Write the first diary',
    posts:'Diaries', likes:'Likes', followed:'Together as Kemi \ud83d\udc9b', unfollowed:'Follow',
    offline:'You are offline \u2014 showing saved diaries', updated:'Feed refreshed',
    deleteComment:'Delete',
    dateLocale:'en-US', needText:'Write something first \u2728',
    shop:'MOMO Shop', shopSub:'The tsundere shop where Momo sells only to Kemi',
    shopLine:'Kemi, order it and forget about it! It\u2019ll show up like a surprise gift later! \ud83c\udf81',
    shopAdd:'+ Add a product', shopShelf:'Momo\u2019s shelf',
    shopNew:'New product', shopEdit:'Edit product',
    shopNameL:'Product', shopNamePh:'e.g. Hyaluronic Serum 50ml',
    shopPriceL:'Price', shopPricePh:'$18 \u00b7 24,000\u20a9',
    shopLinkL:'Shop link', shopLinkPh:'https://...',
    shopNoteL:'Momo\u2019s tsundere line',
    shopNotePh:'e.g. Do the dishes first, then buy it \ud83d\ude20',
    shopHint:'Products are saved on this device. One photo.',
    shopPhoto:'Product photo', shopOpen:'Shop', shopNoLink:'No link',
    shopEmpty:'Nothing on the shelf yet', shopEmptySub:'Only what Momo picks herself goes up here. Add the first product \u2014 a serum, a snack, anything.',
    shopSaved:'Product added \ud83d\uded2', shopUpdated:'Product updated \ud83d\uded2',
    shopDeleted:'Product removed', shopConfirmDelete:'Take this product down?',
    shopNeedName:'Give the product a name first \u2728', shopLinkBad:'A link has to start with https://',
    shopPhotoBad:'Could not read that photo',

    /* \ud83d\udc98 K-Star Kemi Match */
    matchInviteTitle:'\ud83d\udc98 K-Star Kemi Match',
    matchInviteSub:'Your sign \u00d7 your bias\u2019s sign, just for fun',
    matchTitle:'K-Star Kemi Match',
    matchLead:'Type your favorite star\u2019s name and birthday \u2014 KOMI reads your two zodiac signs and tells you the Kemi between you.',
    starNameL:'My favorite K-star', starNamePh:'e.g. BTS Jungkook',
    starBdayL:'Star\u2019s birthday', myBdayL:'My birthday',
    matchGo:'See our Kemi \u2728',
    matchNeedName:'Tell us your favorite star first \u2728',
    matchNeedDate:'Please fill in both birthdays',
    matchBadDate:'That date doesn\u2019t exist \u2014 check the month and day', matchYear:'Put the year in four digits (e.g. 1997)',
    matchScoreL:'Kemi score', matchMyZodiac:'My sign', matchStarZodiac:'Bias\u2019s sign',
    matchColorL:'Today\u2019s lucky Obangsaek',
    matchShare:'Brag on my diary', matchFilled:'Filled in \u2014 edit it your way, then post \ud83c\udf8a',
    matchKeyring:'Soon in MOMO Shop: an abalone keyring of your sign \u00d7 your bias\u2019s sign \ud83d\udd11',
    matchFine:'Just for fun \u00b7 the real zodiac year follows Lunar New Year',
    matchBody:'\ud83d\udc98 K-Star Kemi Match \ud83d\udc98\nMy bias {star} {szemoji} {sz} \u00d7 me {mzemoji} {mz}\nKemi score {pct}% \u00b7 {rel}\nToday\u2019s lucky Obangsaek: {color}\n{line}',
    rel_h6:'Six Harmony \u00b7 a natural pair', rel_trine:'Three Harmony \u00b7 stronger together',
    rel_same:'Same sign \u00b7 like looking in a mirror', rel_fine:'Easy-going \u00b7 warming up slowly',
    rel_clash:'Opposite signs \u00b7 sparks fly',
    col_blue:'Blue (Cheong)', col_red:'Red (Jeok)', col_yellow:'Yellow (Hwang)', col_white:'White (Baek)', col_black:'Black (Heuk)',

    /* 📜 Kemi Promise (community guidelines) — lives in My Diary, out of the feed */
    close:'Close',
    promiseBtn:'Kemi Promise',
    promiseBtnSub:'Five promises for a kind Kemi',
    promiseTitle:'📜 Kemi Promise',
    promiseSub:'Five promises for sharing K-culture and our own everyday kindly, together.',
    promiseFoot:'A post that breaks them is held back after a warning.',
    p1t:'Respect each other', p1d:'No swearing, insults or hate speech.',
    p2t:'No ads or spam', p2d:'No unsolicited ads, spam or sketchy links.',
    p3t:'Respect photos & copyright', p3d:'Do not take someone else’s photos or work without permission.',
    p4t:'Keep personal info private', p4d:'No phone numbers, home addresses or bank details.',
    p5t:'Share with a warm heart', p5d:'Share K-culture and your own day with a kind heart.',
    warnTitle:'Check the Kemi Promise',
    warnWord:'This looks like swearing, insults, gambling, adult or spam wording.',
    warnLink:'External or spam links cannot be posted here.',
    warnPhone:'This looks like a phone number or other personal contact.',
    warnEdit:'Edit the wording and you can post right away.',

    /* 👤 My profile (photo · nickname · one-line intro) */
    profileEdit:'Edit profile',
    profilePhoto:'Profile photo',
    profilePhotoPick:'Choose photo',
    profilePhotoReset:'Back to the default photo',
    profileNickL:'Nickname',
    profileNickPh:'Up to 20 characters',
    profileBioL:'One-line intro',
    profileBioPh:'A line about you, up to 80 characters',
    profileHint:'Your photo, nickname and line show on your diaries and replies. Saved on this device.',
    profileNeedNick:'Please write a nickname ✨',
    profileSaved:'Profile saved 🎊',
    profilePhotoBad:'Could not read that photo',

    /* the language menu's "follow the phone" item, and the two storage warnings */
    langAuto:'Device language', storageFullMedia:'Storage is full \u2014 delete a photo', storageFullShort:'Storage is full',
  },
  ko: {
    tagline:'케미(Kemi)들과 함께하는 K-컬쳐 일상',
    meRole:'케미(Kemi) · K-컬쳐 다이어리스트',
    home:'홈', search:'검색', post:'글쓰기', mydiary:'내 다이어리',
    todayBanner:'오늘의 K-컬쳐 다이어리', transPending:'글로벌 팬 번역이 곧 추가될 글이에요',
    translate:'번역 보기', seeOriginal:'원문 보기', translatedBy:'글로벌 팬을 위한 번역',
    newPost:'새 다이어리', cancel:'취소', publish:'게시', posted:'게시했어요 \ud83c\udf8a',
    editPost:'다이어리 수정', save:'저장', savedPost:'수정했어요 \ud83c\udf8a', edited:'(수정됨)', edit:'수정',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'오늘 당신이 있는 곳은 어떤 하루인가요?', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'사진', media:'사진·영상', photoHint:`사진·영상 ${MAX_MEDIA}개까지 (영상 10초·15MB 이내)`, tooManyPhotos:`사진·영상은 ${MAX_MEDIA}개까지`,
    videoTooBig:'영상은 15MB까지 올릴 수 있어요', videoTooLong:'영상은 15초 이내로 올려 주세요', videoBad:'영상을 불러오지 못했어요', photoBad:'사진을 불러오지 못했어요',
    translating:'번역 중…', translateFail:'번역을 불러오지 못했어요 · 다시 눌러 주세요', translateSame:'이미 이 언어로 쓰인 글이에요',
    composeHint:'게시물은 이 기기에 저장돼요.',
    stickerTitle:'\ud83c\udf38 단청 스티커 (무료)', stickerHint:'다이어리 1개에 1개 \u00b7 다시 누르면 해제',
    comment:'댓글', commentPlaceholder:'케미들과 다정하게 이야기 나눠요\u2026', send:'보내기',
    like:'좋아요', repost:'리포스트', share:'공유', copyLink:'링크 복사', copied:'링크를 복사했어요 \ud83d\udd17',
    sharedTo:'공유했어요 \ud83d\ude4c', shareFail:'공유할 수 없어요 \ud83d\ude22',
    reposted:'리포스트했어요 \ud83c\udf8a', unreposted:'리포스트를 취소했어요',
    deleted:'삭제했어요', confirmDelete:'이 다이어리를 삭제할까요?',
    myPosts:'내 다이어리', myLikes:'좋아요',
    myTitle:'내 다이어리', searchTitle:'검색', searchPlaceholder:'본문이나 #태그 검색',
    trending:'단청 태그', popTags:'인기 태그', results:'검색 결과', clearFilter:'전체 보기',
    searchingFor:'표시 중', emptyFeed:'아직 다이어리가 없어요.', emptySearch:'검색 결과가 없어요.',
    emptyMine:'첫 다이어리를 써보세요!', emptyLikes:'아직 좋아요한 다이어리가 없어요.',
    emptyHomeTitle:'첫 장은 비워 두었어요',
    emptyHomeSub:'전 세계 케미(Kemi)들이 K-컬쳐와 각자의 하루를 나누는 하얀 스레드. 오늘의 K-컬쳐 다이어리로 첫 장을 열어 주세요.',
    emptyHomeCta:'첫 다이어리 쓰기',
    posts:'다이어리', likes:'좋아요', followed:'케미로 함께하는 중 \ud83d\udc9b', unfollowed:'팔로우',
    offline:'오프라인 \u2014 저장된 다이어리를 보여드려요', updated:'피드를 새로 불러왔어요',
    deleteComment:'삭제',
    dateLocale:'ko-KR', needText:'내용을 먼저 써주세요 \u2728',
    shop:'모모 샵', shopSub:'츤데레 모모가 케미들에게만 파는 샵',
    shopLine:'케미들, 시키고 잊어버려! 나중에 선물처럼 갈 거야! 🎁',
    shopAdd:'+ 상품 올리기', shopShelf:'모모의 진열대',
    shopNew:'새 상품', shopEdit:'상품 수정',
    shopNameL:'상품명', shopNamePh:'예: 히알루론 세럼 50ml',
    shopPriceL:'가격', shopPricePh:'$18 · 24,000원',
    shopLinkL:'구매 링크', shopLinkPh:'https://...',
    shopNoteL:'모모의 츤데레 한마디',
    shopNotePh:'예) 야, 엄마 설거지 한 판 하고 사 😠',
    shopHint:'상품은 이 기기에 저장돼요. 사진은 1장.',
    shopPhoto:'상품 사진', shopOpen:'구경하기', shopNoLink:'링크 없음',
    shopEmpty:'아직 진열대가 비어 있어요', shopEmptySub:'모모가 직접 고른 상품만 올라가요. 첫 상품을 올려 주세요.',
    shopSaved:'상품을 올렸어요 🛍️', shopUpdated:'상품을 수정했어요 🛍️',
    shopDeleted:'상품을 내렸어요', shopConfirmDelete:'이 상품을 진열대에서 내릴까요?',
    shopNeedName:'상품명을 먼저 적어 주세요 ✨', shopLinkBad:'링크는 https:// 로 시작해야 해요',
    shopPhotoBad:'사진을 불러오지 못했어요',

    /* 💘 K-스타 케미 궁합 */
    matchInviteTitle:'💘 K-스타 케미 궁합',
    matchInviteSub:'내 띠 × 최애 띠로 보는 재미 궁합',
    matchTitle:'K-스타 케미 궁합',
    matchLead:'최애 K-스타의 이름과 생일만 넣으면, 두 사람의 띠로 코미가 케미를 읽어 줘요.',
    starNameL:'최애 K-스타', starNamePh:'예) BTS 정국',
    starBdayL:'최애 스타 생년월일', myBdayL:'내 생년월일',
    matchGo:'궁합 보기 ✨',
    matchNeedName:'최애 스타 이름을 먼저 알려 주세요 ✨',
    matchNeedDate:'두 사람의 생년월일을 모두 넣어 주세요',
    matchBadDate:'없는 날짜예요 · 월과 일을 확인해 주세요', matchYear:'연도는 4자리로 넣어 주세요 (예: 1997)',
    matchScoreL:'케미 지수', matchMyZodiac:'내 띠', matchStarZodiac:'최애 띠',
    matchColorL:'오늘의 행운 오방색',
    matchShare:'다이어리에 자랑하기', matchFilled:'본문과 태그를 채웠어요 · 마음대로 고쳐서 올려 주세요 🎊',
    matchKeyring:'곧 모모 샵에서 내 띠 × 최애 띠 자개 키링도 만날 수 있어요 🔑',
    matchFine:'재미로 보는 궁합이에요 · 실제 띠는 음력 설 기준',
    matchBody:'💘 K-스타 케미 궁합 💘\n최애 {star} {szemoji} {sz} × 나 {mzemoji} {mz}\n케미 지수 {pct}% · {rel}\n오늘의 행운 오방색 {color}\n{line}',
    rel_h6:'육합(六合) · 찰떡궁합', rel_trine:'삼합(三合) · 함께면 힘이 나요',
    rel_same:'같은 띠 · 거울을 보는 사이', rel_fine:'무난한 사이 · 천천히 가까워져요',
    rel_clash:'상충(相沖) · 부딪히면서 끌려요',
    col_blue:'청(靑) · 파랑', col_red:'적(赤) · 빨강', col_yellow:'황(黃) · 노랑', col_white:'백(白) · 하양', col_black:'흑(黑) · 검정',

    /* 📜 케미 약속 (커뮤니티 가이드라인) — 홈 피드가 아니라 내 다이어리 안에 */
    close:'닫기',
    promiseBtn:'케미 약속',
    promiseBtnSub:'다정한 케미를 위한 다섯 가지 약속',
    promiseTitle:'📜 케미 약속',
    promiseSub:'K-컬처와 내 일상을 다 함께 다정하게 나누기 위한 다섯 가지 약속이에요.',
    promiseFoot:'약속을 어긴 글은 경고 안내 뒤에 게시되지 않아요.',
    p1t:'서로 존중하기', p1d:'욕설·비방·혐오 표현은 쓰지 않아요.',
    p2t:'광고·스팸 금지', p2d:'무단 광고나 스팸, 수상한 링크는 올리지 않아요.',
    p3t:'사진·저작권 존중', p3d:'다른 사람의 사진이나 작품을 허락 없이 가져오지 않아요.',
    p4t:'개인정보 지키기', p4d:'전화번호·주소·계좌 같은 개인정보는 남기지 않아요.',
    p5t:'다정하게 나누기', p5d:'K-컬처와 나의 하루를 다정한 마음으로 나눠요.',
    warnTitle:'잠깐, 케미 약속을 확인해 주세요',
    warnWord:'욕설·비방·도박·성인·스팸으로 보이는 표현이 들어 있어요.',
    warnLink:'외부 링크나 스팸 주소는 여기에 올릴 수 없어요.',
    warnPhone:'전화번호 같은 개인 연락처가 들어 있어요.',
    warnEdit:'표현을 고치면 바로 게시할 수 있어요.',

    /* 👤 내 프로필 (사진·닉네임·한 줄 소개) */
    profileEdit:'프로필 편집',
    profilePhoto:'프로필 사진',
    profilePhotoPick:'사진 선택',
    profilePhotoReset:'기본 사진으로 되돌리기',
    profileNickL:'닉네임',
    profileNickPh:'20자까지 쓸 수 있어요',
    profileBioL:'한 줄 자기소개',
    profileBioPh:'나를 소개하는 한 줄, 80자까지',
    profileHint:'사진·닉네임·자기소개는 내 다이어리와 댓글에 함께 보여요. 이 기기에 저장돼요.',
    profileNeedNick:'닉네임을 먼저 적어 주세요 ✨',
    profileSaved:'프로필을 저장했어요 🎊',
    profilePhotoBad:'사진을 불러오지 못했어요',
    langAuto:'기기 언어', storageFullMedia:'저장 공간이 부족해요 — 사진을 지워주세요', storageFullShort:'저장 공간이 부족해요',
  },
  ja: {
    tagline:'KemiとつながるK-カルチャーの毎日',
    meRole:'Kemi · K-カルチャーダイアリスト',
    home:'ホーム', search:'検索', post:'投稿', mydiary:'マイダイアリー',
    todayBanner:'今日のK-カルチャーダイアリー', transPending:'世界のファン向けの翻訳は準備中です',
    translate:'翻訳を見る', seeOriginal:'原文を見る', translatedBy:'グローバルファン向けの翻訳',
    newPost:'新しいダイアリー', cancel:'キャンセル', publish:'投稿', posted:'投稿しました \ud83c\udf8a',
    editPost:'ダイアリーを編集', save:'保存', savedPost:'更新しました \ud83c\udf8a', edited:'(編集済み)', edit:'編集',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'今日、あなたの街はどんな一日ですか？', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'写真', media:'写真・動画', photoHint:`写真・動画は${MAX_MEDIA}件まで（動画は10秒・15MB以内）`, tooManyPhotos:`写真・動画は${MAX_MEDIA}件まで`,
    videoTooBig:'動画は15MBまでです', videoTooLong:'動画は15秒以内にしてください', videoBad:'動画を読み込めませんでした', photoBad:'写真を読み込めませんでした',
    translating:'翻訳中…', translateFail:'翻訳できませんでした · もう一度押してください', translateSame:'この投稿はすでにこの言語です',
    composeHint:'投稿はこの端末に保存されます。',
    stickerTitle:'\ud83c\udf38 丹青（タンチョン）ステッカー（無料）', stickerHint:'1ダイアリーに1枚 \u00b7 もう一度押すと外れます',
    comment:'返信', commentPlaceholder:'Kemiとやさしくおしゃべりしよう\u2026', send:'送信',
    like:'いいね', repost:'リポスト', share:'シェア', copyLink:'リンクをコピー', copied:'リンクをコピーしました \ud83d\udd17',
    sharedTo:'シェアしました \ud83d\ude4c', shareFail:'シェアできません \ud83d\ude22',
    reposted:'リポストしました \ud83c\udf8a', unreposted:'リポストを取り消しました',
    deleted:'削除しました', confirmDelete:'このダイアリーを削除しますか？',
    myPosts:'マイダイアリー', myLikes:'いいね',
    myTitle:'マイダイアリー', searchTitle:'検索', searchPlaceholder:'本文や #タグを検索',
    trending:'単青（タンチョン）タグ', popTags:'人気タグ', results:'検索結果', clearFilter:'すべて表示',
    searchingFor:'表示中', emptyFeed:'まだダイアリーがありません。', emptySearch:'見つかりません。',
    emptyMine:'最初のダイアリーを書いてみましょう！', emptyLikes:'いいねしたダイアリーはまだありません。',
    emptyHomeTitle:'最初のページはあなたの番です',
    emptyHomeSub:'世界中のKemiがK-カルチャーとそれぞれの毎日を分かち合う白いスレッド。今日のK-カルチャーダイアリーで最初のページを開いてみましょう。',
    emptyHomeCta:'最初のダイアリーを書く',
    posts:'ダイアリー', likes:'いいね', followed:'Kemiとして参加中 \ud83d\udc9b', unfollowed:'フォロー',
    offline:'オフライン \u2014 保存済みのダイアリーを表示中', updated:'フィードを更新しました',
    deleteComment:'削除',
    dateLocale:'ja-JP', needText:'まず本文を書いてください \u2728',
    shop:'MOMOショップ', shopSub:'ツンデレなMOMOがKemiにだけ売るショップ',
    shopLine:'Kemiのみんな、頼んだら忘れてて！あとでプレゼントみたいに届くから！ 🎁',
    shopAdd:'＋商品を追加', shopShelf:'MOMOの棚',
    shopNew:'新しい商品', shopEdit:'商品を編集',
    shopNameL:'商品名', shopNamePh:'例：ヒアルロン酸セラム 50ml',
    shopPriceL:'価格', shopPricePh:'¥2,600 · 24,000ウォン',
    shopLinkL:'購入リンク', shopLinkPh:'https://...',
    shopNoteL:'MOMOのツンデレ一言',
    shopNotePh:'例）お母さんのお皿洗いをしてから買って 😠',
    shopHint:'商品はこの端末に保存されます。写真は1枚。',
    shopPhoto:'商品写真', shopOpen:'見に行く', shopNoLink:'リンクなし',
    shopEmpty:'棚はまだ空です', shopEmptySub:'MOMOが自分で選んだ商品だけが並びます。最初の商品を追加してください。',
    shopSaved:'商品を追加しました 🛍️', shopUpdated:'商品を更新しました 🛍️',
    shopDeleted:'商品を削除しました', shopConfirmDelete:'この商品を棚から外しますか？',
    shopNeedName:'先に商品名を入力してください ✨', shopLinkBad:'リンクは https:// で始めてください',
    shopPhotoBad:'写真を読み込めませんでした',

    /* 💘 Kスター相性占い */
    matchInviteTitle:'💘 Kスター相性占い',
    matchInviteSub:'自分の干支×推しの干支で見るお楽しみ相性',
    matchTitle:'Kスター相性占い',
    matchLead:'推しの名前と誕生日を入れるだけで、二人の干支からKOMIがケミ度を読みます。',
    starNameL:'推しのKスター', starNamePh:'例）BTS ジョングク',
    starBdayL:'推しの誕生日', myBdayL:'自分の誕生日',
    matchGo:'相性を見る ✨',
    matchNeedName:'先に推しの名前を教えてください ✨',
    matchNeedDate:'二人の誕生日を両方入れてください',
    matchBadDate:'存在しない日付です · 月と日を確認してください', matchYear:'年は4桁で入れてください（例：1997）',
    matchScoreL:'ケミ指数', matchMyZodiac:'自分の干支', matchStarZodiac:'推しの干支',
    matchColorL:'今日のラッキー五行色',
    matchShare:'ダイアリーに自慢する', matchFilled:'本文とタグを入れました · 自由に直して投稿してください 🎊',
    matchKeyring:'もうすぐMOMOショップに、自分の干支×推しの干支の貝殻キーホルダーが登場 🔑',
    matchFine:'お楽しみの相性占いです · 実際の干支は旧正月基準',
    matchBody:'💘 Kスター相性占い 💘\n推し {star} {szemoji} {sz} × 私 {mzemoji} {mz}\nケミ指数 {pct}% · {rel}\n今日のラッキー五行色 {color}\n{line}',
    rel_h6:'六合 · 自然な相性', rel_trine:'三合 · 一緒だと力が出る',
    rel_same:'同じ干支 · 鏡を見ているような仲', rel_fine:'ふつうの相性 · ゆっくり近づく',
    rel_clash:'相沖 · ぶつかりながら惹かれ合う',
    col_blue:'青 · ブルー', col_red:'赤 · レッド', col_yellow:'黄 · イエロー', col_white:'白 · ホワイト', col_black:'黒 · ブラック',

    /* 📜 ケミの約束（コミュニティガイドライン） */
    close:'閉じる',
    promiseBtn:'ケミの約束',
    promiseBtnSub:'やさしいケミのための5つの約束',
    promiseTitle:'📜 ケミの約束',
    promiseSub:'K-カルチャーと自分の日常を、みんなでやさしく分かち合うための5つの約束です。',
    promiseFoot:'約束に反する投稿は、警告のあと掲載されません。',
    p1t:'お互いを尊重する', p1d:'罵り・中傷・ヘイト表現は使いません。',
    p2t:'広告・スパム禁止', p2d:'無断の宣伝やスパム、怪しいリンクは載せません。',
    p3t:'写真・著作権を守る', p3d:'他人の写真や作品を許可なく使うことはしません。',
    p4t:'個人情報を守る', p4d:'電話番号・住所・口座などの個人情報は書きません。',
    p5t:'やさしく分かち合う', p5d:'K-カルチャーと自分の一日をやさしく共有します。',
    warnTitle:'少し待って、ケミの約束を確認してください',
    warnWord:'罵り・中傷・ギャンブル・成人・スパムと見られる表現が入っています。',
    warnLink:'外部リンクやスパムのURLはここには投稿できません。',
    warnPhone:'電話番号などの個人の連絡先が入っています。',
    warnEdit:'表現を直せばすぐに投稿できます。',

    /* 👤 マイプロフィール（写真・ニックネーム・ひとこと紹介） */
    profileEdit:'プロフィール編集',
    profilePhoto:'プロフィール写真',
    profilePhotoPick:'写真を選ぶ',
    profilePhotoReset:'デフォルトの写真に戻す',
    profileNickL:'ニックネーム',
    profileNickPh:'20文字まで',
    profileBioL:'ひとこと紹介',
    profileBioPh:'あなたを紹介するひとこと（80文字まで）',
    profileHint:'写真・ニックネーム・紹介は、マイダイアリーと返信に表示されます。この端末に保存されます。',
    profileNeedNick:'先にニックネームを入れてください ✨',
    profileSaved:'プロフィールを保存しました 🎊',
    profilePhotoBad:'写真を読み込めませんでした',
    langAuto:'端末の言語', storageFullMedia:'保存容量がいっぱいです — 写真を削除してください', storageFullShort:'保存容量がいっぱいです',
  },
  zh: {
    tagline:'和Kemi一起分享的K-文化日常',
    meRole:'Kemi · K-文化日记作者',
    home:'首页', search:'搜索', post:'发布', mydiary:'我的日记',
    todayBanner:'今日的K-文化日记', transPending:'面向全球粉丝的翻译即将上线',
    translate:'查看翻译', seeOriginal:'查看原文', translatedBy:'为全球粉丝提供的翻译',
    newPost:'新的日记', cancel:'取消', publish:'发布', posted:'已发布 \ud83c\udf8a',
    editPost:'编辑日记', save:'保存', savedPost:'已更新 \ud83c\udf8a', edited:'(已编辑)', edit:'编辑',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'今天你所在的城市是什么样的呢？', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'照片', media:'照片·视频', photoHint:`最多${MAX_MEDIA}张照片或视频（视频10秒·15MB以内）`, tooManyPhotos:`最多${MAX_MEDIA}张照片或视频`,
    videoTooBig:'视频最大15MB', videoTooLong:'请上传15秒以内的视频', videoBad:'无法读取该视频', photoBad:'无法读取该照片',
    translating:'正在翻译…', translateFail:'翻译失败 · 请再点一次', translateSame:'这篇已经是该语言了',
    composeHint:'帖子保存在这台设备上。',
    stickerTitle:'\ud83c\udf38 丹青贴纸（免费）', stickerHint:'每篇日记一张 \u00b7 再点一次取消',
    comment:'评论', commentPlaceholder:'和Kemi温柔地聊一聊\u2026', send:'发送',
    like:'点赞', repost:'转发', share:'分享', copyLink:'复制链接', copied:'链接已复制 \ud83d\udd17',
    sharedTo:'已分享 \ud83d\ude4c', shareFail:'无法分享 \ud83d\ude22',
    reposted:'已转发 \ud83c\udf8a', unreposted:'已取消转发',
    deleted:'已删除', confirmDelete:'要删除这篇日记吗？',
    myPosts:'我的日记', myLikes:'点赞',
    myTitle:'我的日记', searchTitle:'搜索', searchPlaceholder:'搜索正文或 #标签',
    trending:'丹青标签', popTags:'热门标签', results:'搜索结果', clearFilter:'显示全部',
    searchingFor:'正在显示', emptyFeed:'还没有日记。', emptySearch:'没有找到内容。',
    emptyMine:'来写第一篇日记吧！', emptyLikes:'还没有点赞的日记。',
    emptyHomeTitle:'第一页留给你',
    emptyHomeSub:'全世界Kemi分享K-文化和各自日常的白色话题串。写下今天的K-文化日记，开启第一页吧。',
    emptyHomeCta:'写第一篇日记',
    posts:'日记', likes:'点赞', followed:'作为Kemi一起同行 \ud83d\udc9b', unfollowed:'关注',
    offline:'离线中 \u2014 显示已保存的日记', updated:'信息流已更新',
    deleteComment:'删除',
    dateLocale:'zh-CN', needText:'请先输入内容 \u2728',
    shop:'MOMO小店', shopSub:'傲娇的MOMO只卖给Kemi的小店',
    shopLine:'Kemi们，下单就忘掉吧！过阵子它会像礼物一样送到手上的！ 🎁',
    shopAdd:'＋添加商品', shopShelf:'MOMO的货架',
    shopNew:'新商品', shopEdit:'编辑商品',
    shopNameL:'商品名称', shopNamePh:'例：玻尿酸精华 50ml',
    shopPriceL:'价格', shopPricePh:'$18 · 24,000韩元',
    shopLinkL:'购买链接', shopLinkPh:'https://...',
    shopNoteL:'MOMO的傲娇金句',
    shopNotePh:'例）先帮妈妈洗完碗再买 😠',
    shopHint:'商品保存在这台设备上。照片一张。',
    shopPhoto:'商品照片', shopOpen:'去看看', shopNoLink:'没有链接',
    shopEmpty:'货架还空着', shopEmptySub:'这里只放MOMO亲自挑选的商品。来添加第一件吧。',
    shopSaved:'商品已添加 🛍️', shopUpdated:'商品已更新 🛍️',
    shopDeleted:'商品已删除', shopConfirmDelete:'要把这件商品下架吗？',
    shopNeedName:'请先填写商品名称 ✨', shopLinkBad:'链接必须以 https:// 开头',
    shopPhotoBad:'无法读取这张照片',

    /* 💘 K-明星缘分测试 */
    matchInviteTitle:'💘 K-明星缘分测试',
    matchInviteSub:'我的生肖 × 本命生肖，好玩看一看',
    matchTitle:'K-明星缘分测试',
    matchLead:'填上本命的名字和生日，KOMI 就用两人的生肖算出你们的 Kemi 缘分。',
    starNameL:'我的本命 K-明星', starNamePh:'例如：BTS 柾国',
    starBdayL:'本命生日', myBdayL:'我的生日',
    matchGo:'看看我们的缘分 ✨',
    matchNeedName:'先告诉我本命的名字吧 ✨',
    matchNeedDate:'请把两个生日都填上',
    matchBadDate:'这一天不存在 · 请检查月份和日期', matchYear:'年份请填四位（例如 1997）',
    matchScoreL:'Kemi 指数', matchMyZodiac:'我的生肖', matchStarZodiac:'本命生肖',
    matchColorL:'今日幸运五方色',
    matchShare:'去日记里炫耀', matchFilled:'正文和标签已填好 · 随便改一改再发布吧 🎊',
    matchKeyring:'很快在 MOMO 小店也能见到「我的生肖 × 本命生肖」螺钿钥匙扣 🔑',
    matchFine:'好玩而已 · 真正的生肖以农历新年为准',
    matchBody:'💘 K-明星缘分测试 💘\n本命 {star} {szemoji} {sz} × 我 {mzemoji} {mz}\nKemi 指数 {pct}% · {rel}\n今日幸运五方色 {color}\n{line}',
    rel_h6:'六合 · 天生一对', rel_trine:'三合 · 一起更有力',
    rel_same:'同一生肖 · 像照镜子', rel_fine:'平顺 · 慢慢靠近',
    rel_clash:'相冲 · 越撞越吸引',
    col_blue:'青 · 蓝', col_red:'赤 · 红', col_yellow:'黄', col_white:'白', col_black:'黑',

    /* 📜 Kemi 约定（社区指南） */
    close:'关闭',
    promiseBtn:'Kemi 约定',
    promiseBtnSub:'为了温柔的Kemi，五个约定',
    promiseTitle:'📜 Kemi 约定',
    promiseSub:'为了和大家一起温柔地分享K-文化和自己的日常，我们做五个约定。',
    promiseFoot:'违反约定的内容，在提醒之后不会被发布。',
    p1t:'互相尊重', p1d:'不使用辱骂、诽谤、仇恨表达。',
    p2t:'禁止广告与垃圾信息', p2d:'不发布擅自广告、垃圾信息或可疑链接。',
    p3t:'尊重照片与版权', p3d:'不擅自使用他人的照片或作品。',
    p4t:'保护个人信息', p4d:'不留下电话号码、住址、账号等个人信息。',
    p5t:'温柔地分享', p5d:'温柔地分享K-文化和自己的一天。',
    warnTitle:'等一下，请先看看Kemi约定',
    warnWord:'这里似乎有辱骂、诽谤、赌博、成人或垃圾信息的表达。',
    warnLink:'不能在这里发布外部链接或垃圾网址。',
    warnPhone:'这里含有电话号码等个人联系方式。',
    warnEdit:'修改表达后就能马上发布。',

    /* 👤 我的个人资料（照片·昵称·一句话介绍） */
    profileEdit:'编辑个人资料',
    profilePhoto:'头像照片',
    profilePhotoPick:'选择照片',
    profilePhotoReset:'恢复默认照片',
    profileNickL:'昵称',
    profileNickPh:'最多20个字',
    profileBioL:'一句话介绍',
    profileBioPh:'介绍自己的一句话，最多80个字',
    profileHint:'照片、昵称和介绍会显示在你的日记和评论中。只保存在这台设备上。',
    profileNeedNick:'请先填写昵称 ✨',
    profileSaved:'个人资料已保存 🎊',
    profilePhotoBad:'无法读取这张照片',
    langAuto:'设备语言', storageFullMedia:'存储空间不足 — 请删除一些照片', storageFullShort:'存储空间不足',
  },
  es: {
    tagline:'Cultura K y tu d\u00eda a d\u00eda con Kemi',
    meRole:'Kemi · diarista de cultura K',
    home:'Inicio', search:'Buscar', post:'Publicar', mydiary:'Mi diario',
    todayBanner:'Diario K-culture de hoy', transPending:'Pronto habr\u00e1 traducci\u00f3n para fans del mundo',
    translate:'Traducir', seeOriginal:'Ver original', translatedBy:'Traducido para fans del mundo',
    newPost:'Nuevo diario', cancel:'Cancelar', publish:'Publicar', posted:'Publicado \ud83c\udf8a',
    editPost:'Editar diario', save:'Guardar', savedPost:'Actualizado \ud83c\udf8a', edited:'(editado)', edit:'Editar',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'\u00bfC\u00f3mo es tu d\u00eda hoy desde donde est\u00e1s?', tagPlaceholder:'#MyCity #DailyVibes',
    photo:'Foto', media:'Foto·V\u00eddeo', photoHint:`Hasta ${MAX_MEDIA} fotos o vídeos (vídeo: 10s · 15MB)`, tooManyPhotos:`Hasta ${MAX_MEDIA} fotos o vídeos`,
    videoTooBig:'V\u00eddeos de hasta 15MB', videoTooLong:'Sube un vídeo de 15 segundos o menos', videoBad:'No se pudo a\u00f1adir el v\u00eddeo', photoBad:'No se pudo leer la foto',
    translating:'Traduciendo…', translateFail:'No se pudo traducir \u2014 toca para reintentar', translateSame:'Esta publicaci\u00f3n ya est\u00e1 en este idioma',
    composeHint:'Tu publicaci\u00f3n se guarda en este dispositivo.',
    stickerTitle:'\ud83c\udf38 Sticker Dancheong (Gratis)', stickerHint:'Uno por diario \u00b7 toca de nuevo para quitarlo',
    comment:'Responder', commentPlaceholder:'Responde con cari\u00f1o a los Kemi\u2026', send:'Enviar',
    like:'Me gusta', repost:'Repostear', share:'Compartir', copyLink:'Copiar enlace', copied:'Enlace copiado \ud83d\udd17',
    sharedTo:'Compartido \ud83d\ude4c', shareFail:'No se pudo compartir \ud83d\ude22',
    reposted:'Reposteado \ud83c\udf8a', unreposted:'Repost eliminado',
    deleted:'Eliminado', confirmDelete:'\u00bfEliminar este diario?',
    myPosts:'Mis diarios', myLikes:'Me gusta',
    myTitle:'Mi diario', searchTitle:'Buscar', searchPlaceholder:'Busca texto o #etiqueta',
    trending:'Etiquetas dancheong', popTags:'Etiquetas populares', results:'Resultados', clearFilter:'Mostrar todo',
    searchingFor:'Mostrando', emptyFeed:'A\u00fan no hay diarios.', emptySearch:'Sin resultados.',
    emptyMine:'\u00a1Escribe el primer diario!', emptyLikes:'A\u00fan no hay diarios con me gusta.',
    emptyHomeTitle:'La primera p\u00e1gina es tuya',
    emptyHomeSub:'Un hilo blanco donde los Kemi de todo el mundo comparten la cultura K y su d\u00eda a d\u00eda. Escribe tu primer diario K-culture.',
    emptyHomeCta:'Escribir el primer diario',
    posts:'Diarios', likes:'Me gusta', followed:'Juntos como Kemi \ud83d\udc9b', unfollowed:'Seguir',
    offline:'Sin conexi\u00f3n \u2014 mostrando diarios guardados', updated:'Feed actualizado',
    deleteComment:'Eliminar',
    dateLocale:'es-ES', needText:'Escribe algo primero \u2728',
    shop:'Tienda MOMO', shopSub:'La tienda tsundere donde MOMO solo vende a los Kemi',
    shopLine:'Kemi, ¡pídelo y olvídate! ¡Te llegará después como un regalo sorpresa! 🎁',
    shopAdd:'＋ Añadir producto', shopShelf:'El estante de MOMO',
    shopNew:'Nuevo producto', shopEdit:'Editar producto',
    shopNameL:'Producto', shopNamePh:'Ej.: Sérum de ácido hialurónico 50ml',
    shopPriceL:'Precio', shopPricePh:'$18 · 24.000₩',
    shopLinkL:'Enlace de compra', shopLinkPh:'https://...',
    shopNoteL:'La frase tsundere de MOMO',
    shopNotePh:'Ej.: Lava los platos y luego lo compras 😠',
    shopHint:'Los productos se guardan en este dispositivo. Una foto.',
    shopPhoto:'Foto del producto', shopOpen:'Ver tienda', shopNoLink:'Sin enlace',
    shopEmpty:'El estante aún está vacío', shopEmptySub:'Aquí solo van los productos que MOMO elige. Añade el primero.',
    shopSaved:'Producto añadido 🛍️', shopUpdated:'Producto actualizado 🛍️',
    shopDeleted:'Producto eliminado', shopConfirmDelete:'¿Quitar este producto del estante?',
    shopNeedName:'Primero ponle un nombre al producto ✨', shopLinkBad:'El enlace debe empezar por https://',
    shopPhotoBad:'No se pudo leer la foto',

    /* 💘 Kemi Match con tu K-Star */
    matchInviteTitle:'💘 Kemi Match con tu K-Star',
    matchInviteSub:'Tu signo × el de tu bias, solo por diversión',
    matchTitle:'Kemi Match con tu K-Star',
    matchLead:'Escribe el nombre y el cumpleaños de tu bias: KOMI lee sus dos signos y te dice el Kemi que hay entre ustedes.',
    starNameL:'Mi K-star favorito', starNamePh:'ej. BTS Jungkook',
    starBdayL:'Cumpleaños del star', myBdayL:'Mi cumpleaños',
    matchGo:'Ver nuestro Kemi ✨',
    matchNeedName:'Primero dime el nombre de tu bias ✨',
    matchNeedDate:'Completa los dos cumpleaños',
    matchBadDate:'Esa fecha no existe · revisa el mes y el día', matchYear:'El año va con cuatro cifras (ej. 1997)',
    matchScoreL:'Puntuación Kemi', matchMyZodiac:'Mi signo', matchStarZodiac:'Signo del bias',
    matchColorL:'Obangsaek de la suerte hoy',
    matchShare:'Presumir en mi diario', matchFilled:'Ya llené el texto y las etiquetas · edítalo a tu gusto y publica 🎊',
    matchKeyring:'Pronto en la tienda MOMO: llavero de nácar con tu signo × el de tu bias 🔑',
    matchFine:'Solo por diversión · el año zodiacal real sigue el Año Nuevo lunar',
    matchBody:'💘 Kemi Match con tu K-Star 💘\nMi bias {star} {szemoji} {sz} × yo {mzemoji} {mz}\nPuntuación Kemi {pct}% · {rel}\nObangsaek de la suerte hoy: {color}\n{line}',
    rel_h6:'Seis Armonías · pareja natural', rel_trine:'Tres Armonías · juntos más fuertes',
    rel_same:'Mismo signo · como mirarse al espejo', rel_fine:'Tranquila · se acerca despacio',
    rel_clash:'Signos opuestos · saltan chispas',
    col_blue:'Azul (Cheong)', col_red:'Rojo (Jeok)', col_yellow:'Amarillo (Hwang)', col_white:'Blanco (Baek)', col_black:'Negro (Heuk)',

    /* 📜 Promesa Kemi (normas de la comunidad) */
    close:'Cerrar',
    promiseBtn:'Promesa Kemi',
    promiseBtnSub:'Cinco promesas para una Kemi amable',
    promiseTitle:'📜 Promesa Kemi',
    promiseSub:'Cinco promesas para compartir la cultura K y nuestro día a día con cariño, entre todos.',
    promiseFoot:'Una publicación que las rompa no se publica tras el aviso.',
    p1t:'Respetarnos', p1d:'Sin insultos, descalificaciones ni discurso de odio.',
    p2t:'Sin anuncios ni spam', p2d:'Nada de publicidad no pedida, spam ni enlaces sospechosos.',
    p3t:'Respetar fotos y derechos', p3d:'No tomes fotos ni obras de otras personas sin permiso.',
    p4t:'Proteger tus datos', p4d:'Sin teléfonos, direcciones ni datos bancarios.',
    p5t:'Compartir con cariño', p5d:'Comparte la cultura K y tu día con cariño.',
    warnTitle:'Un momento: revisa la Promesa Kemi',
    warnWord:'Esto parece insulto, desprecio, apuestas, contenido adulto o spam.',
    warnLink:'Aquí no se pueden publicar enlaces externos ni de spam.',
    warnPhone:'Esto incluye un teléfono u otro contacto personal.',
    warnEdit:'Corrige el texto y podrás publicar enseguida.',

    /* 👤 Mi perfil (foto · apodo · presentación en una línea) */
    profileEdit:'Editar perfil',
    profilePhoto:'Foto de perfil',
    profilePhotoPick:'Elegir foto',
    profilePhotoReset:'Volver a la foto por defecto',
    profileNickL:'Apodo',
    profileNickPh:'Hasta 20 caracteres',
    profileBioL:'Presentación en una línea',
    profileBioPh:'Una línea sobre ti, hasta 80 caracteres',
    profileHint:'La foto, el apodo y la línea aparecen en tus diarios y respuestas. Se guardan en este dispositivo.',
    profileNeedNick:'Primero escribe un apodo ✨',
    profileSaved:'Perfil guardado 🎊',
    profilePhotoBad:'No se pudo leer la foto',
    langAuto:'Idioma del dispositivo', storageFullMedia:'Espacio lleno — borra alguna foto', storageFullShort:'Espacio lleno',
  },
};

/* Eleven more languages arrive with i18n-world.js. Each is laid over the
   English table, so a key added here later still reads as English rather than
   as a raw key name; any other code a phone reports is translated at runtime
   (see "a language the app does not carry" below). */
const WORLD = (typeof window !== 'undefined' && window.KOMI_WORLD_I18N) || {};
Object.keys(WORLD).forEach(code => { T[code] = Object.assign({}, T.en, WORLD[code]); });
const BUNDLED_LANGS = Object.keys(T);   /* languages the app carries itself */

/* ---------- K-star Kemi match ----------
   Fun-only compatibility between the visitor's zodiac sign and their bias's,
   read through the Korean twelve zodiac animals (12지신). The score, the lucky
   obangsaek colour and the line are all derived from the two birthdays, so the
   same pair always gets the same reading. */
const ZODIAC = [
  { emoji:'🐭', en:'Rat',     ko:'쥐',     ja:'ねずみ',   zh:'鼠', es:'Rata' },
  { emoji:'🐮', en:'Ox',      ko:'소',     ja:'うし',     zh:'牛', es:'Buey' },
  { emoji:'🐯', en:'Tiger',   ko:'호랑이', ja:'とら',     zh:'虎', es:'Tigre' },
  { emoji:'🐰', en:'Rabbit',  ko:'토끼',   ja:'うさぎ',   zh:'兔', es:'Conejo' },
  { emoji:'🐲', en:'Dragon',  ko:'용',     ja:'たつ',     zh:'龙', es:'Dragón' },
  { emoji:'🐍', en:'Snake',   ko:'뱀',     ja:'へび',     zh:'蛇', es:'Serpiente' },
  { emoji:'🐴', en:'Horse',   ko:'말',     ja:'うま',     zh:'马', es:'Caballo' },
  { emoji:'🐑', en:'Goat',    ko:'양',     ja:'ひつじ',   zh:'羊', es:'Cabra' },
  { emoji:'🐵', en:'Monkey',  ko:'원숭이', ja:'さる',     zh:'猴', es:'Mono' },
  { emoji:'🐔', en:'Rooster', ko:'닭',     ja:'とり',     zh:'鸡', es:'Gallo' },
  { emoji:'🐶', en:'Dog',     ko:'개',     ja:'いぬ',     zh:'狗', es:'Perro' },
  { emoji:'🐷', en:'Pig',     ko:'돼지',   ja:'いのしし', zh:'猪', es:'Cerdo' },
];

/* the five traditional colours (오방색), in the dancheong palette of the app */
const OBANG = [
  { key:'blue',   hex:'#4B7F9F', emoji:'🔵' },
  { key:'red',    hex:'#E05A47', emoji:'🔴' },
  { key:'yellow', hex:'#D9B44A', emoji:'🟡' },
  { key:'white',  hex:'#EFEAE0', emoji:'⚪' },
  { key:'black',  hex:'#2F3033', emoji:'⚫' },
];

/* KOMI's one-liner per relation, two variants so a pair is not always identical.
   {star} is the name the visitor typed. */
const KOMI_LINES = {
  en: {
    h6: [
      'KOMI says: {star} and you were paired up at birth! Go press that heart for your bias today 💘',
      'KOMI smells destiny here. Just thinking of {star} brightens your day — write that feeling down 🐾',
    ],
    trine: [
      'KOMI says: {star} and you bring out each other\u2019s strengths. Together, every stage shines brighter ✨',
      'They say three makes it perfect, but you two already sparkle. Leave a cheering line today 💛',
    ],
    same: [
      '{star} and you share a sign, so you read each other like a mirror. Find one taste you both love today ✨',
      'Same-sign pairs get each other without a word. Today, cheer {star}\u2019s stage twice as loud 🎀',
    ],
    fine: [
      'KOMI says: you two warm up slowly \u2014 and slow bonds stay warm longer 🌱',
      'You and {star} are still getting to know each other. Open the first hello with today\u2019s diary 🐶',
    ],
    clash: [
      'KOMI says: you clash and click at the same time \u2014 no wonder {star} stays on your mind 😆',
      '{star} and you sit on opposite sides, which is exactly why you notice each other. One spoonful of courage today 💗',
    ],
  },
  ko: {
    h6: [
      '코미의 판정: {star_wa} 나는 태어날 때부터 짝으로 정해진 사이! 오늘은 최애에게 하트 한 번 눌러 줄까요? 💘',
      '코미가 봐도 이건 운명이에요. {star} 생각만 해도 하루가 반짝이니, 그 마음을 다이어리에 남겨 두세요 🐾',
    ],
    trine: [
      '코미의 판정: {star_wa} 나는 서로의 힘을 키워 주는 사이! 함께면 어떤 무대도 더 빛나요 ✨',
      '셋이 모이면 최고라는데, 우리 둘만으로도 충분히 반짝여요. 오늘 응원 한 줄 남겨 볼까요? 💛',
    ],
    same: [
      '{star_wa} 나는 같은 띠! 거울을 보는 것처럼 마음이 통하니, 오늘은 같은 취향 하나를 찾아보면 재밌어요 ✨',
      '코미의 판정: 닮은 띠끼리는 말 안 해도 통하는 사이예요. 오늘 {star}의 무대도 함께 응원해요 🎀',
    ],
    fine: [
      '코미의 판정: {star_wa} 나는 천천히 가까워지는 사이! 한 걸음씩 마음을 나누면 더 오래 갈 거예요 🌱',
      '{star_wa} 나는 아직 서로 알아 가는 중이에요. 오늘의 다이어리로 첫 인사를 열어 볼까요? 🐶',
    ],
    clash: [
      '코미의 판정: 부딪히면서 끌리는 사이! 티격태격해도 {star} 생각이 나는 건 어쩔 수 없나 봐요 😆',
      '{star_wa} 나는 정반대라서 더 눈에 밟히는 사이예요. 오늘은 용기 내서 애정 한 스푼 남겨 볼까요? 💗',
    ],
  },
  ja: {
    h6: [
      'KOMIの判定：{star}とあなたは生まれた時から運命のペア！今日は推しにハートを押してみて 💘',
      'KOMIが見てもこれは運命。{star}を思い出すだけで一日がきらめくなら、その気持ちを書き残して 🐾',
    ],
    trine: [
      'KOMIの判定：{star}とあなたは互いの力を引き出す仲！二人ならどんなステージも輝くよ ✨',
      '三つ揃えば最強と言われるけれど、二人でも十分きらめける。今日は応援の一言を残してみて 💛',
    ],
    same: [
      '{star}とあなたは同じ干支！鏡を見るように心が通じるので、今日は同じ趣味を探してみて ✨',
      'KOMIの判定：似た干支同士は言葉がなくても通じ合う仲。今日は{star}のステージを一緒に応援しよう 🎀',
    ],
    fine: [
      'KOMIの判定：{star}とあなたはゆっくり近づいていく仲。一歩ずつなら長く続くよ 🌱',
      '{star}とあなたはまだお互いを知っていく途中。今日のダイアリーで最初のあいさつを始めてみて 🐶',
    ],
    clash: [
      'KOMIの判定：ぶつかりながら惹かれ合う仲！ケンカしても{star}が気になるのは仕方ないね 😆',
      '{star}とあなたは正反対だからこそ目で追ってしまう仲。今日は勇気を出して愛をひとさじ 💗',
    ],
  },
  zh: {
    h6: [
      'KOMI 的判定：{star}和你天生就是一对！今天就为你的本命点个心动吧 💘',
      'KOMI 看这也是缘分。只要想到 {star} 一天就发光，把这份心情写下来吧 🐾',
    ],
    trine: [
      'KOMI 的判定：{star}和你是互相给力的组合！在一起任何舞台都更闪亮 ✨',
      '常说三个更厉害，但你们两个人就够闪耀。今天留下一句应援吧 💛',
    ],
    same: [
      '{star}和你是同一个生肖！像照镜子一样心有灵犀，今天找一个共同爱好吧 ✨',
      'KOMI 的判定：同生肖之间不用说也懂。今天一起为 {star} 的舞台应援吧 🎀',
    ],
    fine: [
      'KOMI 的判定：{star}和你是慢慢靠近的关系，慢一点的缘分更长久 🌱',
      '你和 {star} 还在互相了解中。用今天的日记打开第一句话吧 🐶',
    ],
    clash: [
      'KOMI 的判定：越撞越吸引的一对！就算拌嘴也忍不住想 {star} 吧 😆',
      '{star}和你是正相反才更在意的关系。今天勇敢地送上一勺爱吧 💗',
    ],
  },
  es: {
    h6: [
      'Veredicto de KOMI: ¡{star} y tú nacieron para estar juntos! Hoy toca dejarle un corazón a tu bias 💘',
      'KOMI ve destino aquí. Si pensar en {star} te ilumina el día, escríbelo en tu diario 🐾',
    ],
    trine: [
      'Veredicto de KOMI: {star} y tú se dan fuerza. Juntos, cualquier escenario brilla más ✨',
      'Dicen que tres es mejor, ¡pero ustedes dos ya brillan! Deja hoy una línea de ánimo 💛',
    ],
    same: [
      '¡{star} y tú tienen el mismo signo! Como mirarse al espejo: busca hoy un gusto en común ✨',
      'Veredicto de KOMI: los signos iguales se entienden sin hablar. ¡Hoy animamos el escenario de {star} juntos 🎀',
    ],
    fine: [
      'Veredicto de KOMI: se acercan poco a poco, y lo lento dura más 🌱',
      '{star} y tú aún se están conociendo. Abre el primer hola con el diario de hoy 🐶',
    ],
    clash: [
      'Veredicto de KOMI: chocan y se atraen a la vez, no puedes dejar de pensar en {star} 😆',
      'Los opuestos llaman más la atención. Hoy, atrévete con una cucharada de cariño 💗',
    ],
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

/* A saved value only reaches the screen when its scheme is safe. A link is a real
   web address or nothing; a picture or clip is one of this app's files, an object
   URL, or an inline image/video. javascript:, data:text/html and vbscript: never
   get through, even when they sit in localStorage. */
const safeHref = (s) => (/^https?:\/\//i.test(String(s == null ? '' : s).trim()) ? String(s).trim() : '');
function safeSrc(s){
  const v = String(s == null ? '' : s).trim();
  if (!v) return '';
  if (/^(?:https?:\/\/|blob:|data:(?:image|video)\/(?:png|jpe?g|gif|webp|avif|bmp|svg\+xml|mp4|webm|quicktime|3gpp))/i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return '';   /* any other scheme: refused */
  return v;                                        /* a relative path */
}

/* A photo must be a raster picture: an SVG can carry script, so it is refused at
   the picker (a photo is re-encoded to JPEG anyway before it is kept). */
const isRasterImage = (type) => /^image\//i.test(String(type || '')) && !/svg|xml/i.test(String(type || ''));

const uid = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);

/* ---------- which language the visitor reads ----------
   Order of precedence: ?lang= (handy for checking a language), then the
   language she picked for herself, then the language her own phone is in. The
   phone's language is never written down, so a visitor who never touched the
   switcher keeps following her device when she changes it. */
function baseLang(x){
  const c = String(x || '').trim().toLowerCase().replace(/_/g, '-');
  const p = c.split('-')[0];
  if (!/^[a-z]{2,3}$/.test(p)) return '';
  /* a phone set to Traditional Chinese gets its own translation, not the
     Simplified table */
  if (p === 'zh' && /hant|tw|hk|mo/i.test(c)) return 'zh-TW';
  return p;
}

function deviceLang(){
  const list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
  for (let i = 0; i < list.length; i++) { const c = baseLang(list[i]); if (c) return c; }
  return 'en';
}

function pickedLang(){ return baseLang(localStorage.getItem(LANG_KEY) || ''); }

function urlLang(){
  const m = /[?&]lang=([A-Za-z_-]+)/.exec(location.search);
  return m ? baseLang(m[1]) : '';
}

/* a language picked by hand replaces the one a ?lang= link asked for */
function clearUrlLang(){
  if (!urlLang()) return;
  const rest = location.search.replace(/^\?/, '').split('&').filter(p => p && !/^lang=/i.test(p));
  const url = location.pathname + (rest.length ? '?' + rest.join('&') : '') + location.hash;
  try { history.replaceState(null, '', url); } catch (e) {}
}

function getLang(){ return urlLang() || pickedLang() || deviceLang(); }

function isRTL(code){ return RTL.indexOf(String(code || '').split('-')[0]) >= 0; }

function dateLocale(code){
  const c = code || getLang();
  return LOCALES[c] || LOCALES[String(c).split('-')[0]] || c;
}

function t(key){
  const L = T[getLang()];
  if (L && key in L) return L[key];
  return (T.en[key] != null) ? T.en[key] : key;
}

/* "3분 전", "5m" — the five languages written by hand keep their own short
   wording; every other language asks Intl, which knows its words and word
   order ("vor 5 Min.", "منذ ٥ دقائق"). */
const TIME_HAND = { ko:1, ja:1, zh:1, es:1 };
function timeAgo(ts){
  const d = Date.now() - ts;
  const L = getLang();
  if (!TIME_HAND[L]) {
    if (L === 'en') {
      if (d < MIN) return 'now';
      const m0 = Math.floor(d / MIN);
      if (m0 < 60) return m0 + 'm';
      const h0 = Math.floor(m0 / 60);
      if (h0 < 24) return h0 + 'h';
      return Math.floor(h0 / 24) + 'd';
    }
    try {
      const rtf = new Intl.RelativeTimeFormat(dateLocale(L), { numeric: 'auto', style: 'short' });
      if (d < MIN) return rtf.format(0, 'second');
      const mi = Math.floor(d / MIN);
      if (mi < 60) return rtf.format(-mi, 'minute');
      const ho = Math.floor(mi / 60);
      if (ho < 24) return rtf.format(-ho, 'hour');
      return rtf.format(-Math.floor(ho / 24), 'day');
    } catch (e) { /* an old browser: the plain English form reads everywhere */
      if (d < MIN) return 'now';
      const m2 = Math.floor(d / MIN);
      if (m2 < 60) return m2 + 'm';
      const h2 = Math.floor(m2 / 60);
      if (h2 < 24) return h2 + 'h';
      return Math.floor(h2 / 24) + 'd';
    }
  }
  if (d < MIN) return L === 'ko' ? '\ubc29\uae08' : L === 'zh' ? '\u521a\u521a' : L === 'ja' ? '\u305f\u3063\u305f\u4eca' : 'ahora';
  const m = Math.floor(d / MIN);
  if (m < 60) return L === 'ko' ? m + '\ubd84 \uc804' : L === 'zh' ? m + '\u5206\u949f\u524d' : L === 'ja' ? m + '\u5206\u524d' : 'hace ' + m + ' min';
  const h = Math.floor(m / 60);
  if (h < 24) return L === 'ko' ? h + '\uc2dc\uac04 \uc804' : L === 'zh' ? h + '\u5c0f\u65f6\u524d' : L === 'ja' ? h + '\u6642\u9593\u524d' : 'hace ' + h + ' h';
  const day = Math.floor(h / 24);
  return L === 'ko' ? day + '\uc77c \uc804' : L === 'zh' ? day + '\u5929\u524d' : L === 'ja' ? day + '\u65e5\u524d' : 'hace ' + day + ' d';
}

function fullDate(ts){
  try { return new Date(ts).toLocaleDateString(dateLocale(), { year:'numeric', month:'long', day:'numeric', weekday:'long' }); }
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
      me: { nick: "KOMI's Unnie", handle: '@me', following: false, bio: '', avatar: null },
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
  if (typeof d.me.handle !== 'string' || !d.me.handle) d.me.handle = '@me';
  if (typeof d.me.following !== 'boolean') d.me.following = false;
  /* the profile card: a one-line intro and a stored photo (a small JPEG data URL) */
  if (typeof d.me.nick !== 'string' || !d.me.nick) d.me.nick = "KOMI's Unnie";
  if (typeof d.me.bio !== 'string') d.me.bio = '';
  if (d.me.avatar !== null && typeof d.me.avatar !== 'string') d.me.avatar = null;
  state = d;
}

function save(d){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); }
  catch(e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      toast(t('storageFullMedia'));
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

/* ---------- 📜 Kemi Promise & the first-pass filter ----------
   The five promises are a sheet inside My Diary, never on the feed. Every diary,
   edit and reply is checked here before it is saved: swearing, insults, hate,
   gambling, adult and ad wording, outside/spam links, and contact details. The
   MOMO Shop sheet keeps its own product-link field out of this check — there a
   shop link is the point, not spam. BAN is the single place to tune the words. */
const BAN = {
  /* Korean — profanity · insults · hate · gambling · adult · ad/spam */
  ko: [
    '씨발','시발','씹새','씹년','개새끼','개자식','병신','지랄','좆같','좆밥','니애미','느금마','엠창','창녀','갈보','뒈져','한남충','한녀충','김치녀','틀딱','맘충','짱깨','쪽바리',
    '도박','토토사이트','스포츠토토','사설토토','바카라','카지노','먹튀검증','꽁머니','배팅사이트','보증업체',
    '야동','야설','포르노','성인영상','성인동영상','성인사이트','조건만남','원조교제','오피쓰','오피녀','출장마사지','자위행위','섹스',
    '광고문의','홍보문의','텔레그램문의','카톡문의','고수익','수익보장','재택알바','부업알바','리딩방','주식리딩','코인리딩','다단계','불법대출','무직자대출','대출광고','폰테크','작업대출','소액결제현금화',
  ],
  ja: [
    '死ね','殺す','クソ','ブス','キチガイ','シネ','エロ','アダルト','ポルノ','売春','援助交際','パパ活','出会い系','ギャンブル','カジノ','スパム',
  ],
  zh: [
    '操你','傻逼','妈的','他妈的','贱人','去死','婊子','尼玛','色情','成人视频','裸聊','约炮','卖淫','赌博','赌场','博彩','六合彩','加微信','刷单','兼职日结',
  ],
};

/* Latin-script words are matched whole, so "disputa" is not read as "puta". */
const BAN_LATIN = [
  'fuck','fucking','fucked','fucker','motherfucker','shit','bullshit','bitch','bastard','asshole','cunt',
  'nigger','faggot','retard','retarded','whore','slut','dick pic','escort service',
  'porn','porno','pornhub','onlyfans','nudes','viagra',
  'casino','gambling','betting site','sports betting','bet365','1xbet',
  'payday loan','cash advance',
  'mierda','puta','puto','perra','cabron','cabrón','pendejo','coño','joder','chinga','verga','zorra','maricón','culiao','pornografía','desnudo','apuestas',
];

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BAN_LATIN_RE = new RegExp('(?:^|[^\\p{L}])(' + BAN_LATIN.map(escRe).join('|') + ')(?![\\p{L}])', 'iu');
const BAN_CJK = BAN.ko.concat(BAN.ja, BAN.zh);
/* words that only look like a ban word inside a longer, harmless one */
const BENIGN_RE = /시발점/g;

const LINK_RE = /(?:https?:\/\/|www\.|\bt\.me\/|bit\.ly|tinyurl|open\.kakao\.com|linktr\.ee|discord\.gg|forms\.gle|bit\.do|is\.gd|cutt\.ly|rb\.gy|naver\.me|han\.gl|band\.us)/i;
const DOMAIN_RE = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|co|me|ly|gl|gg|tv|kr|jp|cn|cc|xyz|shop|store|site|link|app|biz|info|top|vip|bet|win|club|online)\b/i;
const PHONE_RES = [
  /\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b/,          /* 010-1234-5678 */
  /\b0[2-6]\d?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/,          /* 02-123-4567 */
  /\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/, /* +82 10 ... */
  /\b\d{3}[-.\s]\d{3,4}[-.\s]\d{4}\b/,                  /* 123-456-7890 */
];
const ACCOUNT_RE = /(?:계좌|口座|账号|帳號|cuenta|account\s*(?:number|no\.?))[^\d\n]{0,10}\d[\d\s-]{6,}/i;

/* null when the text may go up, otherwise { kind: 'word' | 'link' | 'phone' } */
function checkKemi(text){
  const raw = String(text == null ? '' : text);
  if (!raw.trim()) return null;
  if (LINK_RE.test(raw) || DOMAIN_RE.test(raw)) return { kind: 'link' };
  if (PHONE_RES.some(re => re.test(raw)) || ACCOUNT_RE.test(raw)) return { kind: 'phone' };
  /* separators out, so "씨 발" cannot slip past the list */
  const flat = raw.replace(BENIGN_RE, '').replace(/[\s\u00b7._\-*~!?/\\|:;,()'"\[\]]+/g, '').toLowerCase();
  if (BAN_CJK.some(w => flat.indexOf(w) >= 0)) return { kind: 'word' };
  if (BAN_LATIN_RE.test(raw)) return { kind: 'word' };
  return null;
}

const PROMISE_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5'];
let composeWarnKind = null;   /* the warning on screen, so a language switch can redraw it */

function renderPromiseSheet(){
  const list = $('#promiseList');
  if (!list) return;
  list.innerHTML = PROMISE_KEYS.map((k, i) => (
    '<li class="promise-item">'
    + '<span class="promise-n" style="--dc:' + DC[i % DC.length] + '" aria-hidden="true">' + (i + 1) + '</span>'
    + '<div class="promise-copy"><b>' + esc(t(k + 't')) + '</b><p>' + esc(t(k + 'd')) + '</p></div>'
    + '</li>'
  )).join('');
}

function openPromiseSheet(){
  const scrim = $('#scrim'), sheet = $('#promiseSheet');
  if (!sheet) return;
  renderPromiseSheet();
  scrim.hidden = false; sheet.hidden = false;
  requestAnimationFrame(() => { scrim.classList.add('is-open'); sheet.classList.add('is-open'); });
}

/* closing keeps whatever sheet sat underneath (a compose sheet, say) open */
function closePromiseSheet(){
  const sheet = $('#promiseSheet');
  if (!sheet || sheet.hidden) return;
  sheet.classList.remove('is-open');
  setTimeout(() => {
    sheet.hidden = true;
    const under = ['#composeSheet', '#shopSheet', '#matchSheet', '#profileSheet'].some(sel => $(sel) && !$(sel).hidden);
    if (!under) { const scrim = $('#scrim'); scrim.classList.remove('is-open'); scrim.hidden = true; }
  }, 230);
}

function warnHTML(kind){  const why = kind === 'link' ? t('warnLink') : kind === 'phone' ? t('warnPhone') : t('warnWord');
  return '<div class="kemi-warn-head"><span class="kemi-warn-ico" aria-hidden="true">🛡️</span><b>' + esc(t('warnTitle')) + '</b></div>'
    + '<p class="kemi-warn-why">' + esc(why) + '</p>'
    + '<p class="kemi-warn-fix">' + esc(t('warnEdit')) + '</p>'
    + '<button class="kemi-warn-cta" type="button" data-kemi-promise="1">📜 ' + esc(t('promiseBtn')) + '</button>';
}

function showComposeWarn(kind){
  const el = $('#composeWarn');
  if (!el) return;
  composeWarnKind = kind;
  el.innerHTML = warnHTML(kind);
  el.hidden = false;
  const body = el.closest('.sheet-body');
  if (body) body.scrollTop = 0;
}
function hideComposeWarn(){
  composeWarnKind = null;
  const el = $('#composeWarn');
  if (el) { el.hidden = true; el.innerHTML = ''; }
}

function showCommentWarn(form, kind){
  clearCommentWarn(form);
  const box = document.createElement('div');
  box.className = 'kemi-warn kemi-warn-inline';
  box.setAttribute('role', 'alert');
  box.innerHTML = warnHTML(kind);
  form.insertAdjacentElement('afterend', box);
  box.scrollIntoView({ block: 'nearest' });
  toast(t('warnTitle'));
}
function clearCommentWarn(form){
  const box = form && form.parentNode;
  if (!box) return;
  $$('.kemi-warn-inline', box).forEach(n => n.remove());
}

/* ---------- 👤 my profile ----------
   The visitor's own face on this thread: a photo, a nickname and a one-line
   intro. They live in komidiary.v1 (me.avatar / me.nick / me.bio) and the photo
   is cropped square and re-encoded to a 256px JPEG first, so the stored copy
   stays a few dozen KB in localStorage. A diary or a reply she wrote reads the
   photo from here, so one save reaches all of them. */
const PROFILE_PX = 256;                                  /* the stored photo's side */
const NICK_MAX = 20;
const BIO_MAX = 80;
let profileDraftAvatar = null;   /* data URL on screen; null = the default KOMI photo */
let profileWarnKind = null;

/* Centre-cropped square, scaled to 256×256 and encoded as JPEG. */
async function squareAvatarDataURL(file){
  const src = await readAsDataURL(file);
  const img = await loadImage(src);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const side = Math.max(1, Math.min(w, h));
  const sx = Math.max(0, (w - side) / 2);
  const sy = Math.max(0, (h - side) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = PROFILE_PX; canvas.height = PROFILE_PX;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PROFILE_PX, PROFILE_PX);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, PROFILE_PX, PROFILE_PX);
  let blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.86));
  if (blob && blob.size > 60 * 1024) blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.62));
  if (!blob) return null;
  return await readAsDataURL(blob);
}

function setProfilePhotoPreview(url){
  const img = $('#profilePhotoImg');
  if (img) img.src = url || ME_AVATAR;
}

function syncProfileLabels(){
  const n = $('#profileNickInput'), b = $('#profileBioInput'), btn = $('#profilePhotoBtn');
  if (n) n.placeholder = t('profileNickPh');
  if (b) b.placeholder = t('profileBioPh');
  if (btn) btn.setAttribute('aria-label', t('profilePhoto'));
}

function syncProfileCounters(){
  const n = $('#profileNickInput'), b = $('#profileBioInput');
  const nc = $('#profileNickCount'), bc = $('#profileBioCount');
  if (n && nc) nc.textContent = String(n.value.length);
  if (b && bc) bc.textContent = String(b.value.length);
}

function showProfileWarn(kind){
  const el = $('#profileWarn');
  if (!el) return;
  profileWarnKind = kind;
  el.innerHTML = warnHTML(kind);
  el.hidden = false;
  const body = el.closest('.sheet-body');
  if (body) body.scrollTop = 0;
}

function hideProfileWarn(){
  profileWarnKind = null;
  const el = $('#profileWarn');
  if (el) { el.hidden = true; el.innerHTML = ''; }
}

function openProfileSheet(){
  profileDraftAvatar = (state.me && typeof state.me.avatar === 'string' && state.me.avatar) ? state.me.avatar : null;
  hideProfileWarn();
  syncProfileLabels();
  const n = $('#profileNickInput'), b = $('#profileBioInput'), pi = $('#profilePhotoInput');
  if (n) n.value = state.me.nick || '';
  if (b) b.value = state.me.bio || '';
  if (pi) pi.value = '';
  setProfilePhotoPreview(profileDraftAvatar);
  syncProfileCounters();
  openSheet($('#profileSheet'));
}

async function onProfilePhotoPick(file){
  if (!file) return;
  if (!isRasterImage(file.type)) { toast(t('profilePhotoBad')); return; }
  try {
    const dataUrl = await squareAvatarDataURL(file);
    if (!dataUrl) throw new Error('encode');
    profileDraftAvatar = dataUrl;
    setProfilePhotoPreview(dataUrl);
  } catch (e) {
    toast(t('profilePhotoBad'));
  }
}

/* Saving the profile rewrites her nickname on the diaries and replies she
already wrote, and the photo is read live from the profile, so the feed and
her own view change together. */
function saveProfile(){
  const nickEl = $('#profileNickInput'), bioEl = $('#profileBioInput');
  if (!nickEl || !bioEl) return;
  const nick = (nickEl.value || '').trim().slice(0, NICK_MAX);
  const bio = (bioEl.value || '').trim().slice(0, BIO_MAX);
  if (!nick) { toast(t('profileNeedNick')); nickEl.focus(); return; }
  const bad = checkKemi(nick + '\n' + bio);
  if (bad) { showProfileWarn(bad.kind); return; }
  hideProfileWarn();
  const oldNick = (state.me && state.me.nick) ? state.me.nick : '';
  state.me.nick = nick;
  state.me.bio = bio;
  state.me.avatar = profileDraftAvatar || null;
  const handle = state.me.handle;
  state.diaries.forEach(p => {
    if (p.mine) p.nick = nick;
    (p.comments || []).forEach(c => {
      if (!c) return;
      if ((c.handle && c.handle === handle) || (oldNick && c.nick === oldNick)) c.nick = nick;
    });
  });
  save(state);
  closeSheet($('#profileSheet'));
  render();
  toast(t('profileSaved'));
}

/* ---------- compose ----------
   The same sheet writes a new diary and edits one already written: editPostId
   holds the post being edited (null when composing), and in edit mode the
   media already attached come back into the draft strip as editable items. */
let draftMedia = [];   /* { kind, blob, url, id? } — id when the item is already stored */
let editPostId = null; /* post id while editing, null while composing */
let draftSticker = null; /* 1..5 while a dancheong sticker is chosen in the sheet */

/* The free sticker tray: five round dancheong stickers, tap to choose one,
   tap the chosen one again to take it off. */
function renderStickerTray(){
  const row = $('#stickerRow');
  if (!row) return;
  row.innerHTML = STICKERS.map(n => (
    '<button type="button" class="sticker-opt' + (draftSticker === n ? ' is-on' : '') + '"'
    + ' data-sticker="' + n + '" aria-pressed="' + (draftSticker === n ? 'true' : 'false') + '"'
    + ' aria-label="Dancheong sticker ' + n + '">'
    + '<img src="' + stickerSrc(n) + '" alt="" width="44" height="44" loading="lazy"></button>'
  )).join('');
}

function toggleDraftSticker(n){
  const v = validSticker(n);
  draftSticker = (v && draftSticker !== v) ? v : null;
  renderStickerTray();
}

function clearDraftMedia(){
  draftMedia.forEach(m => { if (!m.id) { try { URL.revokeObjectURL(m.url); } catch (e) {} } });
  draftMedia = [];
  $('#mediaInput').value = '';
  renderDraftMedia();
}

function openCompose(prefill){
  editPostId = null;
  draftSticker = null;
  hideComposeWarn();
  const seedBody = prefill && prefill.body ? String(prefill.body).slice(0, 500) : '';
  const seedTags = prefill && prefill.tags ? String(prefill.tags) : '';
  $('#nickInput').value = state.me && state.me.nick ? state.me.nick : "KOMI's Unnie";
  $('#bodyInput').value = seedBody;
  $('#tagInput').value = seedTags;
  $('#bodyCount').textContent = String(seedBody.length);
  clearDraftMedia();
  renderStickerTray();
  syncComposeMode();
  openSheet($('#composeSheet'));
  setTimeout(() => { const b = $('#bodyInput'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); b.scrollTop = 0; } }, 260);
}

/* Title and submit label follow the mode, in the current language. */
function syncComposeMode(){
  const editing = !!editPostId;
  const title = $('#composeTitle'), submit = $('#composeSubmit');
  if (title) title.textContent = t(editing ? 'editPost' : 'newPost');
  if (submit) submit.textContent = t(editing ? 'save' : 'publish');
}

function openEditPost(p){
  if (!p) return;
  editPostId = p.id;
  hideComposeWarn();
  draftSticker = validSticker(p.sticker) || null;   /* the sticker comes back chosen */
  $('#nickInput').value = p.nick || (state.me && state.me.nick) || "KOMI's Unnie";
  $('#bodyInput').value = p.body || '';
  $('#tagInput').value = (p.tags || []).map(x => '#' + x).join(' ');
  $('#bodyCount').textContent = String(($('#bodyInput').value || '').length);
  clearDraftMedia();
  renderStickerTray();
  syncComposeMode();
  openSheet($('#composeSheet'));
  loadDraftFromPost(p);
  setTimeout(() => { const b = $('#bodyInput'); if (b && !draftMedia.length) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } }, 260);
}

/* Put a post's existing attachments into the draft strip so they can be kept,
   removed or added to — all inside the same 4-slot limit. */
async function loadDraftFromPost(p){
  const wanted = [];
  (Array.isArray(p.media) ? p.media : []).slice(0, MAX_MEDIA).forEach(m => { if (m && m.id) wanted.push({ id: m.id, kind: m.kind || 'image', data: m.data || null }); });
  if (!wanted.length && Array.isArray(p.photos)) {
    p.photos.slice(0, MAX_MEDIA).forEach((src, i) => { if (typeof src === 'string') wanted.push({ id: null, kind: 'image', data: src }); });
  }
  for (const w of wanted) {
    let blob = null, kind = w.kind;
    try {
      if (w.id) {
        const rec = await mediaGet(w.id);
        if (rec && rec.blob) { blob = rec.blob; kind = rec.kind || kind; }
      }
      if (!blob && w.data) blob = await (await fetch(w.data)).blob();
    } catch (e) { blob = null; }
    if (!blob) {
      const hit = w.id ? mediaURLs.get(w.id) : null;
      if (hit && hit.url) { draftMedia.push({ kind: hit.kind || kind, blob: null, url: hit.url, id: w.id }); continue; }
      continue;
    }
    draftMedia.push({ kind, blob, url: URL.createObjectURL(blob), id: w.id || null });
  }
  if (editPostId !== p.id) return;   /* the sheet moved on to another post */
  renderDraftMedia();
}

/* Keep only the characters among a raw value: up to 8 unique lower-case tags. */
function parseTags(raw){
  return String(raw || '').split(/[\s,]+/).map(s => s.replace(/^#+/, '').trim().toLowerCase())
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
}

function renderDraftMedia(){
  const strip = $('#photoStrip');
  if (!strip) return;
  strip.hidden = draftMedia.length === 0;
  strip.innerHTML = draftMedia.map((m, i) => (
    '<div class="photo-thumb' + (m.kind === 'video' ? ' is-video' : '') + '">'
    + (m.kind === 'video'
        ? '<video src="' + escAttr(safeSrc(m.url)) + '" muted playsinline preload="metadata"></video><span class="thumb-play" aria-hidden="true">\u25b6</span>'
        : '<img src="' + escAttr(safeSrc(m.url)) + '" alt="">')
    + '<button type="button" class="rm" data-i="' + i + '" aria-label="Remove">\u2715</button></div>'
  )).join('');
}

/* Read a clip's length before it is attached: a <video> element reports it from
   its metadata alone, without decoding the whole file. 0 means "not known" and
   never blocks the file. */
function videoSeconds(file){
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let url = '', settled = false, timer = 0;
    const finish = (secs) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      v.removeAttribute('src');
      try { v.load(); } catch (e) {}
      if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
      resolve(secs);
    };
    const read = () => {
      const d = v.duration;
      if (typeof d === 'number' && isFinite(d) && d > 0) finish(d);
    };
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.addEventListener('loadedmetadata', read);
    v.addEventListener('durationchange', read);
    v.addEventListener('error', () => finish(0));
    timer = setTimeout(() => finish(0), 5000);   /* a codec we cannot read must not hang the sheet */
    url = URL.createObjectURL(file);
    v.src = url;
    try { v.load(); } catch (e) { finish(0); }
  });
}

async function addMediaFiles(files){
  for (const f of Array.from(files || [])) {
    if (draftMedia.length >= MAX_MEDIA) { toast(t('tooManyPhotos')); break; }
    const isImage = isRasterImage(f.type);
    const isVideo = /^video\//.test(f.type || '');
    if (!isImage && !isVideo) continue;
    if (isVideo && f.size > MAX_VIDEO_BYTES) { toast(t('videoTooBig')); continue; }
    try {
      if (isImage) {
        const blob = await downscaleImageBlob(f);
        if (!blob) throw new Error('encode');
        draftMedia.push({ kind: 'image', blob, url: URL.createObjectURL(blob) });
      } else {
        const secs = await videoSeconds(f);
        if (secs > MAX_VIDEO_SECONDS + VIDEO_SECONDS_SLACK) { toast(t('videoTooLong')); continue; }
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
    if (m.id) { refs.push({ id: m.id, kind: m.kind }); continue; }   /* already stored, keep as is */
    if (!m.blob) continue;
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
  const bad = checkKemi(nick + '\n' + body + '\n' + ($('#tagInput').value || ''));
  if (bad) { showComposeWarn(bad.kind); return; }
  hideComposeWarn();
  const tags = parseTags($('#tagInput').value);
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
  const st = validSticker(draftSticker);
  if (st) p.sticker = st;
  state.diaries.unshift(p);
  state.me.nick = nick;
  save(state);
  draftMedia = [];
  editPostId = null;
  closeSheet($('#composeSheet'));
  toast(t('posted'));
  if (state.filterTag && !p.tags.includes(state.filterTag)) state.filterTag = null;
  go('home', true);
}

/* Save the diary being edited: text, tags, nickname and media change; the post's
   identity, likes, reposts, replies and writing time stay. */
async function submitEdit(){
  const p = findPost(editPostId);
  if (!p) { editPostId = null; closeSheet($('#composeSheet')); return; }
  const nick = ($('#nickInput').value || '').trim() || p.nick || "KOMI's Unnie";
  const body = ($('#bodyInput').value || '').trim();
  if (!body) { toast(t('needText')); return; }
  const bad = checkKemi(nick + '\n' + body + '\n' + ($('#tagInput').value || ''));
  if (bad) { showComposeWarn(bad.kind); return; }
  hideComposeWarn();
  const tags = parseTags($('#tagInput').value);
  const btn = $('#composeSubmit');
  if (btn) btn.disabled = true;
  const kept = new Set(draftMedia.filter(m => m.id).map(m => m.id));
  const dropped = (Array.isArray(p.media) ? p.media : []).filter(m => m && m.id && !kept.has(m.id));
  let media = [];
  try { media = await storeDraftMedia(draftMedia); } catch (e) { media = p.media || []; }
  if (btn) btn.disabled = false;
  const inlinePhotos = media.filter(m => m.data).map(m => m.data);
  p.nick = nick;
  p.body = body;
  p.tags = tags;
  p.media = media.filter(m => !m.data);
  if (inlinePhotos.length) p.photos = inlinePhotos; else delete p.photos;
  const st = validSticker(draftSticker);
  if (st) p.sticker = st; else delete p.sticker;
  p.editedAt = Date.now();
  /* the old text must not answer "Translate" any more */
  p.translations = {};
  delete trState[p.id];
  Array.from(trCache.keys()).forEach(k => { if (k.indexOf(p.id + '|') === 0) trCache.delete(k); });
  /* attachments taken off in the editor are gone for good */
  dropped.forEach(m => { mediaDel(m.id); mediaURLs.delete(m.id); });
  state.me.nick = nick;
  save(state);
  draftMedia = [];
  editPostId = null;
  closeSheet($('#composeSheet'));
  toast(t('savedPost'));
  if (state.filterTag && !p.tags.includes(state.filterTag)) state.filterTag = null;
  render();
}

function onComposeSubmit(){ if (editPostId) submitEdit(); else submitPost(); }

/* ---------- K-star Kemi match ----------
   The visitor's sign against their bias's sign. Everything on the card comes
   from the two birthdays alone, so the same pair reads the same on any day
   (the one exception is the lucky colour, which turns over each day). */
let matchState = null;   /* { star, sy, sm, sd, my, mm, md } of the reading on screen */

const zodiacIndex = (year) => ((Number(year) - 1900) % 12 + 12) % 12;
function zodiacName(i){
  const z = ZODIAC[i] || ZODIAC[0];
  const L = getLang();
  /* a language written into this file has its own animal names; one that came
     in translated carries them as z0…z11 */
  const own = T[L] && T[L]['z' + i];
  return z[L] || own || z.en;
}
function zodiacLabel(i){ const n = zodiacName(i); return getLang() === 'ko' ? n + '띠' : n; }

/* 육합 (six harmonies), 삼합 (three harmonies), 같은 띠, 충 (opposite) */
const H6_PAIRS  = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
const T3_GROUPS = [[0,4,8],[2,6,10],[1,5,9],[3,7,11]];

function zodiacRelation(a, b){
  if (a === b) return 'same';
  if ((a - b + 12) % 12 === 6) return 'clash';
  if (H6_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 'h6';
  if (T3_GROUPS.some(g => g.indexOf(a) >= 0 && g.indexOf(b) >= 0)) return 'trine';
  return 'fine';
}

function birthdayValid(y, m, d){
  if (!y || !m || !d) return false;
  if (y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function matchSeed(s){
  return Math.abs(s.sy * 7919 + s.sm * 337 + s.sd * 53 + s.my * 104729 + s.mm * 211 + s.md * 29);
}

function matchReading(s){
  const me = zodiacIndex(s.my), star = zodiacIndex(s.sy);
  const rel = zodiacRelation(me, star);
  const seed = matchSeed(s);
  const base = { h6: 96, same: 93, trine: 90, fine: 84, clash: 78 }[rel] || 84;
  const day = new Date();
  const dayNo = day.getFullYear() * 37 + (day.getMonth() + 1) * 11 + day.getDate();
  return {
    me, star, rel, seed,
    score: Math.max(78, Math.min(99, base + (seed % 4))),
    color: OBANG[Math.abs(seed + dayNo * 13) % OBANG.length],
  };
}

/* A name typed by the visitor takes the right Korean particle: 정국과 / 제니와 */
function koParticle(word, withBatchim, without){
  const str = String(word || '').trim();
  if (!str) return without;
  const ch = str.charAt(str.length - 1);
  const code = ch.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) return ((code - 0xAC00) % 28) ? withBatchim : without;
  if (/[aeiouyw]/i.test(ch)) return without;
  return withBatchim;
}

function fillTokens(tpl, map){
  return String(tpl == null ? '' : tpl).replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(map, k) ? String(map[k]) : m));
}

function komiLine(rel, seed, star){
  const L = getLang();
  const hand = KOMI_LINES[L];
  const pool = (hand && hand[rel])
    || (T[L] && T[L]['kl_' + rel + '_0'] != null && T[L]['kl_' + rel + '_1'] != null ? [T[L]['kl_' + rel + '_0'], T[L]['kl_' + rel + '_1']] : null)
    || KOMI_LINES.en[rel] || KOMI_LINES.en.fine;
  return fillTokens(pool[seed % pool.length], { star, star_wa: star + koParticle(star, '과', '와') });
}

/* Month names come from the browser's locale, so every language reads right.
   Rebuilt only when the language changes, so a half-filled sheet is not reset. */
let bdayBuiltFor = null;
function buildBdayOptions(force){
  const loc = dateLocale();
  if (!force && bdayBuiltFor === loc) return;
  let mf = null;
  try { mf = new Intl.DateTimeFormat(loc, { month: 'short' }); } catch (e) { mf = null; }
  const months = [];
  for (let m = 1; m <= 12; m++) months.push(mf ? mf.format(new Date(2021, m - 1, 1)) : String(m));
  $$('#matchSheet .bday-m').forEach(sel => {
    const cur = sel.value || '1';
    sel.innerHTML = months.map((lab, i) => '<option value="' + (i + 1) + '">' + esc(lab) + '</option>').join('');
    sel.value = cur;
  });
  $$('#matchSheet .bday-d').forEach(sel => {
    const cur = sel.value || '1';
    if (sel.options.length) { sel.value = cur; return; }
    sel.innerHTML = Array.from({ length: 31 }, (_, i) => '<option value="' + (i + 1) + '">' + (i + 1) + '</option>').join('');
    sel.value = cur;
  });
  bdayBuiltFor = loc;
}

function syncMatchLabels(){
  const inp = $('#starNameInput');
  if (inp) inp.placeholder = t('starNamePh');
}

function matchInviteHTML(){
  return '<div class="match-invite">'
    + '<button class="match-invite-btn" type="button" data-match-open="1">'
    + '<span class="mi-ico" aria-hidden="true">💘</span>'
    + '<span class="mi-copy"><b>' + esc(t('matchInviteTitle')) + '</b><span>' + esc(t('matchInviteSub')) + '</span></span>'
    + '<span class="mi-go" aria-hidden="true">›</span>'
    + '</button></div>';
}

function matchResultHTML(s){
  const r = matchReading(s);
  const line = komiLine(r.rel, r.seed, s.star);
  return (
    '<div class="mr-star">💘 <b>' + esc(s.star) + '</b></div>'
    + '<div class="mr-top">'
    +   '<div class="mr-score"><b>' + r.score + '</b><i>%</i></div>'
    +   '<div class="mr-rel"><span>' + esc(t('matchScoreL')) + '</span><b>' + esc(t('rel_' + r.rel)) + '</b></div>'
    + '</div>'
    + '<div class="mr-zodiacs">'
    +   '<div class="mr-zod"><span>' + esc(t('matchMyZodiac')) + '</span><b>' + ZODIAC[r.me].emoji + ' ' + esc(zodiacLabel(r.me)) + '</b></div>'
    +   '<div class="mr-x" aria-hidden="true">×</div>'
    +   '<div class="mr-zod"><span>' + esc(t('matchStarZodiac')) + '</span><b>' + ZODIAC[r.star].emoji + ' ' + esc(zodiacLabel(r.star)) + '</b></div>'
    + '</div>'
    + '<div class="mr-color">'
    +   '<span class="mr-swatch" style="background:' + r.color.hex + '"></span>'
    +   '<span class="mr-color-copy"><span>' + esc(t('matchColorL')) + '</span><b>' + r.color.emoji + ' ' + esc(t('col_' + r.color.key)) + '</b></span>'
    + '</div>'
    + '<p class="mr-line"><img class="mr-komi" src="./img/komi-avatar.jpg" alt="" width="26" height="26"><span>' + esc(line) + '</span></p>'
    + '<button class="pill primary mr-share" type="button" data-match-share="1">' + esc(t('matchShare')) + '</button>'
    + '<p class="mr-keyring">' + esc(t('matchKeyring')) + '</p>'
  );
}

function renderMatch(){
  const box = $('#matchResult');
  if (!box) return;
  if (!matchState) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = matchResultHTML(matchState);
  box.hidden = false;
}

function openMatchSheet(){
  buildBdayOptions();
  syncMatchLabels();
  renderMatch();
  openSheet($('#matchSheet'));
}

function onMatchGo(){
  const star = ($('#starNameInput').value || '').trim();
  const sy = parseInt($('#starYear').value, 10), sm = parseInt($('#starMonth').value, 10), sd = parseInt($('#starDay').value, 10);
  const my = parseInt($('#myYear').value, 10), mm = parseInt($('#myMonth').value, 10), md = parseInt($('#myDay').value, 10);
  if (!star) { toast(t('matchNeedName')); $('#starNameInput').focus(); return; }
  if (!sy || !my) { toast(t('matchNeedDate')); if (!sy) $('#starYear').focus(); else $('#myYear').focus(); return; }
  const thisYear = new Date().getFullYear();
  if (sy < 1900 || sy > thisYear || my < 1900 || my > thisYear) { toast(t('matchYear')); return; }
  if (!birthdayValid(sy, sm, sd) || !birthdayValid(my, mm, md)) { toast(t('matchBadDate')); return; }
  matchState = { star, sy, sm, sd, my, mm, md };
  renderMatch();
  const box = $('#matchResult');
  if (box) setTimeout(() => { try { box.scrollIntoView({ block: 'nearest' }); } catch (e) {} }, 40);
}

/* The result travels to the compose sheet as a finished diary the visitor can
   rewrite before posting; the two tags ride along in the tag field. */
function bragOnDiary(){
  if (!matchState) return;
  const s = matchState;
  const r = matchReading(s);
  const line = komiLine(r.rel, r.seed, s.star);
  const body = fillTokens(t('matchBody'), {
    star: s.star,
    szemoji: ZODIAC[r.star].emoji, sz: zodiacLabel(r.star),
    mzemoji: ZODIAC[r.me].emoji, mz: zodiacLabel(r.me),
    pct: r.score, rel: t('rel_' + r.rel),
    color: r.color.emoji + ' ' + t('col_' + r.color.key),
    line,
  });
  closeSheet($('#matchSheet'));
  setTimeout(() => { openCompose({ body, tags: '#KemiMatch #KOMIDiary' }); toast(t('matchFilled')); }, 300);
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
  setTimeout(() => {
    scrim.hidden = true; sheet.hidden = true;
    /* a cancelled edit must not leave its previews behind */
    if (sheet === $('#composeSheet')) { editPostId = null; draftSticker = null; clearDraftMedia(); renderStickerTray(); syncComposeMode(); }
    if (sheet === $('#shopSheet')) { shopEditId = null; clearShopDraftPhoto(); syncSheetTitle(); }
    /* a profile edit that is left unsaved changes nothing */
    if (sheet === $('#profileSheet')) { profileDraftAvatar = null; hideProfileWarn(); }
  }, 230);
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

function langName(code){
  const hit = LANGS.filter(l => l.code === code)[0];
  return hit ? hit.label : String(code || 'en').toUpperCase();
}

function renderLangUI(){
  const code = getLang();
  const picked = pickedLang();
  /* the badge shows the language on screen, whatever chose it */
  $('#langCode').textContent = code.split('-')[0].toUpperCase().slice(0, 3);
  const onAuto = !picked && !urlLang();
  $$('#langMenu .lang-item').forEach(b => {
    const on = b.dataset.code === 'auto' ? onAuto : (!onAuto && b.dataset.code === code);
    b.setAttribute('aria-selected', String(on));
  });
  const autoLabel = $('#langMenu [data-code="auto"] .lang-label');
  if (autoLabel) autoLabel.textContent = t('langAuto') + ' · ' + langName(deviceLang());
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  syncComposeMode();
  syncSheetTitle();
  buildBdayOptions();
  syncMatchLabels();
  syncProfileLabels();
  renderPromiseSheet();
  if (composeWarnKind && $('#composeWarn') && !$('#composeWarn').hidden) showComposeWarn(composeWarnKind);
  if (profileWarnKind && $('#profileWarn') && !$('#profileWarn').hidden) showProfileWarn(profileWarnKind);
  if (matchState) renderMatch();
  /* the compose row and the profile carry the same face */
  const composeAva = $('#composeAvatar');
  if (composeAva) composeAva.src = profileAvatarSrc();
  $('#nickInput').placeholder = t('nickPlaceholder');
  $('#bodyInput').placeholder = t('bodyPlaceholder');
  $('#tagInput').placeholder = t('tagPlaceholder');
  [['#shopNameInput', 'shopNamePh'], ['#shopPriceInput', 'shopPricePh'], ['#shopLinkInput', 'shopLinkPh'], ['#shopNoteInput', 'shopNotePh']]
    .forEach(pair => { const el = $(pair[0]); if (el) el.placeholder = t(pair[1]); });
  document.documentElement.lang = code;
  document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
}

const ICO = {
  heart: (cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.3 4.9 13a4.9 4.9 0 0 1 0-6.9 4.7 4.7 0 0 1 6.8 0l.3.3.3-.3a4.7 4.7 0 0 1 6.8 0 4.9 4.9 0 0 1 0 6.9Z"/></svg>',
  bubble: '<svg class="ico" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.8a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.3-.6L4 21l1.6-4.3a8 8 0 0 1-1.1-4.9A8.4 8.4 0 0 1 13 3.5a8.4 8.4 0 0 1 8 8.3Z"/></svg>',
  repeat: (cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 21 6.5l-4 4"/><path d="M21 6.5H8a4 4 0 0 0-4 4v1"/><path d="M7 21.5l-4-4 4-4"/><path d="M3 17.5h13a4 4 0 0 0 4-4v-1"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2.5 11 13"/><path d="M21.5 2.5 15 21.5l-4-8.5-8.5-4Z"/></svg>',
  globe: '<svg class="globe" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg>',
  pencil: '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4.2L19.1 9.1a2.35 2.35 0 0 0-3.3-3.3L4.9 16.7Z"/><path d="M14.4 7.2l2.4 2.4"/></svg>',
  trash: '<svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9 7V4.5h6V7"/></svg>',
};

/* The writer is the user herself: a diary she wrote, a comment she left, or the
   comment form's own profile. Posts saved before this change carry avatar: null,
   so her identity is also read from the @me handle. */
const ME_AVATAR = './img/komi-avatar.jpg';

function isMeWriter(p){
  if (!p) return false;
  if (p.mine || p.me) return true;
  const handle = state && state.me ? state.me.handle : '@me';
  return !!p.handle && p.handle === handle;
}

function profileAvatarSrc(){
  const own = (state && state.me && typeof state.me.avatar === 'string' && state.me.avatar) ? safeSrc(state.me.avatar) : '';
  return own || ME_AVATAR;
}

function avatarHTML(p, size){
  const cls = 'avatar-' + size;
  /* her own photo comes from the profile, so a new profile photo reaches every
     diary and reply she wrote without touching each of them */
  const src = safeSrc(isMeWriter(p) ? profileAvatarSrc() : (p.avatar || ''));
  if (src) return '<img class="avatar ' + cls + '" src="' + escAttr(src) + '" alt="" width="' + size + '" height="' + size + '">';
  const letter = (p.nick || '?').trim().charAt(0).toUpperCase();
  return '<span class="avatar-fallback ' + cls + '" aria-hidden="true">' + esc(letter) + '</span>';
}

function tagChipHTML(tag, i, count, label){
  const c = DC[i % DC.length];
  const n = count ? '<b class="chip-n">' + esc(count) + '</b>' : '';
  return '<button type="button" class="chip dc-chip" data-tag="' + escAttr(tag) + '" style="--dc: ' + c + '">#' + esc(label || tag) + n + '</button>';
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
    const src = safeSrc(it.url);
    if (it.kind === 'video') {
      inner += src
        ? '<video class="ph-video" src="' + escAttr(src) + '" controls playsinline webkit-playsinline preload="metadata" data-video="' + i + '"></video>'
        : '<div class="ph-skel ph-video-skel"><span>\u25b6</span></div>';
    } else {
      inner += src
        ? '<img src="' + escAttr(src) + '" alt="" loading="lazy" data-photo="' + i + '">'
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

/* ---------- a language the app does not carry ----------
   The first visit in, say, Dutch sends the whole interface through Google's
   public translate endpoint in a handful of batches, then keeps the result on
   the device (komi_ui_i18n_nl). Every visit after that opens in Dutch with no
   request at all, and an offline revisit still reads right. If the endpoint
   refuses, the visitor simply keeps reading English. */
const UI_CACHE = 'komi_ui_i18n_';
const UI_CACHE_VER = 2;
const UI_KEEP = { shopLinkPh:1, shopPricePh:1, tagPlaceholder:1, dateLocale:1 };  /* the same words in every language */
/* a {token} and the app's own names travel through the translator untouched */
const PH_RE = /\{[a-zA-Z][a-zA-Z0-9_]*\}|MOMO Shop|K-Star Kemi Match|KOMI's K-Culture Diary|K-Star|K-Culture|KOMI|MOMO|Kemi|Dancheong|Obangsaek/g;
const PUA_RE = /[\uE000-\uE0FF]/g;
let uiDictLoading = {};

/* English a translator reads wrongly on its own ("bias" came back as
   prejudice in French, "tsundere" as a literal): a plainer sentence goes out,
   and the English on screen stays as it was. */
const UI_MT_SRC = {
  matchInviteSub: 'Your zodiac sign \u00d7 your favorite star\u2019s zodiac sign, just for fun',
  matchStarZodiac: 'My favorite star\u2019s sign',
  matchKeyring: 'Soon in MOMO Shop: an abalone keyring of your sign \u00d7 your favorite star\u2019s sign \ud83d\udd11',
  matchBody: '\ud83d\udc98 K-Star Kemi Match \ud83d\udc98\nMy favorite star {star} {szemoji} {sz} \u00d7 me {mzemoji} {mz}\nKemi score {pct}% \u00b7 {rel}\nToday\u2019s lucky Obangsaek: {color}\n{line}',
  matchLead: 'Type your favorite star\u2019s name and birthday \u2014 KOMI reads your two zodiac signs and tells you the Kemi between you.',
  shopSub: 'The cheeky shop where Momo sells only to Kemi',
  shopNoteL: 'Momo\u2019s cheeky line',
};

function uiSource(key){ return UI_MT_SRC[key] || T.en[key] || ''; }

function uiCacheRead(code){
  try {
    const raw = localStorage.getItem(UI_CACHE + code);
    if (!raw) return null;
    const box = JSON.parse(raw);
    if (!box || box.v !== UI_CACHE_VER || !box.d || typeof box.d !== 'object') return null;
    return box.d;
  } catch (e) { return null; }
}

function uiCacheWrite(code, dict){
  try { localStorage.setItem(UI_CACHE + code, JSON.stringify({ v: UI_CACHE_VER, d: dict })); }
  catch (e) { /* a full device simply asks again next time */ }
}

/* a {token} has to survive the translator untouched, so it travels as a
   private-use character, which every language passes through as it is. The
   app's own names go the same way: MOMO Shop is not a "MOMO-winkel". */
function phProtect(line){
  const box = [];
  const text = String(line).replace(PH_RE, (m) => { box.push(m); return String.fromCharCode(0xE000 + box.length - 1); });
  return { text, box };
}
function phRestore(line, box){
  return String(line).replace(PUA_RE, (c) => { const i = c.charCodeAt(0) - 0xE000; return box[i] != null ? box[i] : ''; });
}

async function uiTranslateBatch(texts, target){
  const res = await fetch('https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=' + encodeURIComponent(target), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: texts.map(x => 'q=' + encodeURIComponent(x)).join('&'),
  });
  if (!res.ok) throw new Error('ui-mt ' + res.status);
  const j = await res.json();
  if (!Array.isArray(j) || j.length !== texts.length) throw new Error('ui-mt shape');
  return j.map(x => (typeof x === 'string') ? x : (Array.isArray(x) ? String(x[0] || '') : ''));
}

async function uiTranslateDict(code){
  const jobs = [];
  Object.keys(T.en).forEach(key => {
    if (UI_KEEP[key]) return;
    uiSource(key).split('\n').forEach((line, i) => {
      if (line.trim()) jobs.push(Object.assign({ key, line: i }, phProtect(line)));
    });
  });
  /* one batch per ~1,200 characters: each request stays quick, and a failure
     costs only that batch */
  const batches = [];
  let cur = [], size = 0;
  jobs.forEach(job => {
    if (cur.length && size + job.text.length > 1200) { batches.push(cur); cur = []; size = 0; }
    cur.push(job); size += job.text.length + 8;
  });
  if (cur.length) batches.push(cur);

  const got = {};
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    let out = null;
    try { out = await uiTranslateBatch(batch.map(j => j.text), code); } catch (e) { out = null; }
    if (!out) continue;                    /* that batch keeps its English */
    batch.forEach((job, i) => {
      if (!got[job.key]) got[job.key] = {};
      got[job.key][job.line] = phRestore(out[i] || '', job.box);
    });
  }

  const dict = {};
  Object.keys(got).forEach(key => {
    const lines = uiSource(key).split('\n');
    const filled = lines.map((line, i) => got[key][i] || '');
    if (lines.every((line, i) => !line.trim() || filled[i].trim())) dict[key] = filled.join('\n');
  });
  return dict;
}

/* Words for the language on screen, if they are not here yet. Resolves with
   the table when something was fetched, null when nothing had to be done. */
function ensureLangDict(){
  const code = getLang();
  if (BUNDLED_LANGS.indexOf(code) >= 0 || T[code]) return Promise.resolve(null);
  if (uiDictLoading[code]) return uiDictLoading[code];
  const cached = uiCacheRead(code);
  if (cached) { T[code] = Object.assign({}, T.en, cached); return Promise.resolve(T[code]); }
  uiDictLoading[code] = uiTranslateDict(code).then(dict => {
    delete uiDictLoading[code];
    if (!dict || !Object.keys(dict).length) return null;   /* the visitor keeps reading English */
    T[code] = Object.assign({}, T.en, dict);
    uiCacheWrite(code, dict);
    return T[code];
  }).catch(() => { delete uiDictLoading[code]; return null; });
  return uiDictLoading[code];
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

/* ---------- MOMO Shop ----------
   Momo's own shelf: the shop where the tsundere Momo sells to Kemi. Products
   are the user's — no sample rows are seeded, so the shelf starts empty. Text
   lives in localStorage (komidiary.shop.v1); the single product photo lives in
   IndexedDB with the diaries' media, so a phone photo never fills the quota. */
const SHOP_KEY = 'komidiary.shop.v1';
let shop = { v: 1, products: [] };
let shopEditId = null;          /* product id while editing, null for a new one */
let shopDraftPhoto = null;      /* { blob, url } for a newly picked photo */
let shopKeepPhotoId = null;     /* media id of the photo the product already has */
let shopPhotoRemoved = false;   /* the kept photo was removed in the sheet */
let shopTr = {};                /* productId -> { lang, status:'loading'|'done'|'error', text, same } */
const shopTrCache = new Map();  /* productId|lang -> translated line */
let shopMediaBusy = false;

function loadShop(){
  let d = null;
  try { d = JSON.parse(localStorage.getItem(SHOP_KEY) || 'null'); } catch (e) { d = null; }
  if (!d || !Array.isArray(d.products)) d = { v: 1, products: [] };
  d.products = d.products.filter(p => p && typeof p.id === 'string').map(p => ({
    id: p.id,
    name: String(p.name || ''),
    price: String(p.price || ''),
    link: normalizeShopLink(p.link),
    note: String(p.note || ''),
    mediaId: p.mediaId || null,
    ts: Number(p.ts) || Date.now(),
  }));
  shop = d;
}

/* A shop link is kept only when it is a web address: a bare domain gets https://,
   anything else is dropped, so no javascript: link is ever stored. */
function normalizeShopLink(raw){
  const v = String(raw == null ? '' : raw).trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return '';
  if (/^[\w-]+(\.[\w-]+)+(?:[/?#]|$)/.test(v)) return 'https://' + v;
  return '';
}

function saveShopStore(){
  try { localStorage.setItem(SHOP_KEY, JSON.stringify(shop)); }
  catch (e) { toast(t('storageFullShort')); }
}

function findProduct(id){ return shop.products.find(p => p.id === id) || null; }

/* A product photo resolves like a diary's: the id in localStorage, the blob in
   IndexedDB, this session's object URL in the shared media map. */
async function resolveShopMedia(){
  if (shopMediaBusy) return;
  shopMediaBusy = true;
  let changed = false;
  for (const p of shop.products) {
    if (!p.mediaId || mediaURLs.has(p.mediaId)) continue;
    try {
      const rec = await mediaGet(p.mediaId);
      if (rec && rec.blob) {
        mediaURLs.set(p.mediaId, { url: URL.createObjectURL(rec.blob), kind: rec.kind || 'image' });
        changed = true;
      }
    } catch (e) { /* a missing blob just leaves the Momo placeholder */ }
  }
  shopMediaBusy = false;
  if (changed && currentView === 'shop') renderMain();
}

function shopHeroHTML(){
  return '<section class="shop-hero">'
    + '<div class="shop-hero-frame"><img class="shop-hero-img" src="./img/momo-shop-banner.jpg" alt="MOMO Shop"></div>'
    + '<div class="shop-hero-body">'
    +   '<div class="shop-hero-id">'
    +     '<img class="shop-hero-ava" src="./img/momo-avatar.jpg" alt="" width="42" height="42">'
    +     '<div class="shop-hero-meta"><b class="shop-hero-name">' + esc(t('shop')) + '</b>'
    +       '<span class="shop-hero-role">' + esc(t('shopSub')) + '</span></div>'
    +   '</div>'
    +   '<p class="shop-hero-line">' + esc(t('shopLine')) + '</p>'
    +   '<button type="button" class="pill primary shop-add" data-shop-add="1">' + esc(t('shopAdd')) + '</button>'
    + '</div></section>';
}

function shopTranslateRow(p){
  if (!p.note) return '';
  const lang = getLang();
  const st = (shopTr[p.id] && shopTr[p.id].lang === lang) ? shopTr[p.id] : null;
  const isOpen = !!(st && st.status === 'done');
  let label = t('translate');
  if (st && st.status === 'loading') label = t('translating');
  else if (isOpen) label = t('seeOriginal');
  let body = '';
  if (isOpen) {
    body = '<div class="shop-tr-body">' + esc(st.text)
      + '<span class="shop-tr-meta">' + esc(st.same ? t('translateSame') : t('translatedBy')) + '</span></div>';
  } else if (st && st.status === 'error') {
    body = '<div class="shop-tr-meta">' + esc(t('translateFail')) + '</div>';
  }
  return '<div class="shop-tr"><button type="button" class="translate-btn shop-tr-btn'
    + (st && st.status === 'loading' ? ' is-loading' : '') + '" data-shop-translate="' + escAttr(p.id) + '">'
    + ICO.globe + '<span>' + esc(label) + '</span></button>' + body + '</div>';
}

async function startShopTranslate(p, lang){
  const cur = shopTr[p.id];
  if (cur && cur.lang === lang) {
    if (cur.status === 'done') { delete shopTr[p.id]; render(); return; }
    if (cur.status === 'loading') return;
  }
  const key = p.id + '|' + lang;
  if (shopTrCache.has(key)) {
    shopTr[p.id] = Object.assign({ lang, status: 'done' }, shopTrCache.get(key));
    render();
    return;
  }
  shopTr[p.id] = { lang, status: 'loading' };
  render();
  try {
    const out = await translateText(p.note, TR_TARGET[lang] || lang);
    const entry = { text: out.text, src: out.src || null, same: sameLang(out.src, lang) };
    shopTrCache.set(key, entry);
    shopTr[p.id] = Object.assign({ lang, status: 'done' }, entry);
  } catch (e) {
    shopTr[p.id] = { lang, status: 'error' };
  }
  if (currentView === 'shop') render();
}

function shopProductHTML(p){
  const hit = p.mediaId ? mediaURLs.get(p.mediaId) : null;
  const photoUrl = safeSrc(hit && hit.url);
  const photo = photoUrl
    ? '<img class="shop-card-img" src="' + escAttr(photoUrl) + '" alt="" loading="lazy" data-shop-view="' + escAttr(p.id) + '">'
    : '<div class="shop-card-noimg"><img src="./img/momo-avatar.jpg" alt="" width="56" height="56"></div>';
  const price = p.price ? '<div class="shop-card-price">' + esc(p.price) + '</div>' : '';
  const say = p.note
    ? '<div class="shop-say">'
      + '<img class="shop-say-ava" src="./img/momo-avatar.jpg" alt="" width="32" height="32">'
      + '<div class="shop-bubble"><p class="shop-bubble-text">' + esc(p.note) + '</p>' + shopTranslateRow(p) + '</div>'
      + '</div>'
    : '';
  const href = safeHref(p.link);
  const open = href
    ? '<a class="pill shop-open" href="' + escAttr(href) + '" target="_blank" rel="noopener noreferrer">' + esc(t('shopOpen')) + '</a>'
    : '<span class="pill shop-open is-off">' + esc(t('shopNoLink')) + '</span>';
  return '<article class="shop-card" data-shop-id="' + escAttr(p.id) + '">'
    + photo
    + '<div class="shop-card-body">'
    +   '<h3 class="shop-card-name">' + esc(p.name) + '</h3>'
    +   price + say
    +   '<div class="shop-card-foot">' + open
    +     '<span class="shop-tools">'
    +       '<button type="button" class="act" data-shop-edit="' + escAttr(p.id) + '" aria-label="' + escAttr(t('edit')) + '" title="' + escAttr(t('edit')) + '">' + ICO.pencil + '</button>'
    +       '<button type="button" class="act" data-shop-del="' + escAttr(p.id) + '" aria-label="' + escAttr(t('deleteComment')) + '" title="' + escAttr(t('deleteComment')) + '">' + ICO.trash + '</button>'
    +     '</span>'
    +   '</div>'
    + '</div></article>';
}

function shopEmptyHTML(){
  return '<div class="shop-empty">'
    + '<img class="shop-empty-ava" src="./img/momo-avatar.jpg" alt="" width="76" height="76">'
    + '<b>' + esc(t('shopEmpty')) + '</b>'
    + '<p>' + esc(t('shopEmptySub')) + '</p>'
    + '</div>';
}

function renderShop(){
  const items = shop.products.slice().sort((a, b) => b.ts - a.ts);
  $('#main').innerHTML =
    '<div class="feed-head-pad"></div>'
    + shopHeroHTML()
    + (items.length
      ? '<div class="shop-shelf-head"><b>' + esc(t('shopShelf')) + '</b><span>' + items.length + '</span></div>'
        + items.map(shopProductHTML).join('')
      : shopEmptyHTML());
}

/* ---------- shop sheet ---------- */
function syncSheetTitle(){
  const title = $('#shopTitle');
  if (!title) return;
  title.textContent = t(shopEditId ? 'shopEdit' : 'shopNew');
}

function setShopPhotoPreview(url){
  const thumb = $('#shopPhotoThumb'), img = $('#shopPhotoImg'), add = $('#shopPhotoBtn');
  if (!thumb || !img || !add) return;
  if (url) { img.src = url; thumb.hidden = false; add.hidden = true; }
  else { img.removeAttribute('src'); thumb.hidden = true; add.hidden = false; }
}

function clearShopDraftPhoto(){
  if (shopDraftPhoto && shopDraftPhoto.url) { try { URL.revokeObjectURL(shopDraftPhoto.url); } catch (e) {} }
  shopDraftPhoto = null;
  shopPhotoRemoved = false;
  shopKeepPhotoId = null;
  setShopPhotoPreview(null);
  const inp = $('#shopPhotoInput'); if (inp) inp.value = '';
}

async function previewShopMedia(mediaId){
  try {
    const rec = await mediaGet(mediaId);
    if (!rec || !rec.blob || shopKeepPhotoId !== mediaId) return;
    let url = (mediaURLs.get(mediaId) || {}).url;
    if (!url) {
      url = URL.createObjectURL(rec.blob);
      mediaURLs.set(mediaId, { url, kind: rec.kind || 'image' });
    }
    setShopPhotoPreview(url);
  } catch (e) { /* keep the add tile */ }
}

function openShopSheet(p){
  shopEditId = p ? p.id : null;
  shopKeepPhotoId = p ? (p.mediaId || null) : null;
  shopDraftPhoto = null;
  shopPhotoRemoved = false;
  setShopPhotoPreview(null);
  $('#shopNameInput').value = p ? p.name : '';
  $('#shopPriceInput').value = p ? p.price : '';
  $('#shopLinkInput').value = p ? p.link : '';
  $('#shopNoteInput').value = p ? p.note : '';
  const inp = $('#shopPhotoInput'); if (inp) inp.value = '';
  if (shopKeepPhotoId) {
    const hit = mediaURLs.get(shopKeepPhotoId);
    if (hit && hit.url) setShopPhotoPreview(hit.url); else previewShopMedia(shopKeepPhotoId);
  }
  syncSheetTitle();
  openSheet($('#shopSheet'));
  setTimeout(() => { if (!$('#shopSheet').hidden) $('#shopNameInput').focus(); }, 260);
}

async function onShopPhotoPick(file){
  if (!file) return;
  if (!isRasterImage(file.type)) { toast(t('shopPhotoBad')); return; }
  try {
    const blob = await downscaleImageBlob(file);
    if (shopDraftPhoto && shopDraftPhoto.url) { try { URL.revokeObjectURL(shopDraftPhoto.url); } catch (e) {} }
    shopDraftPhoto = { blob, url: URL.createObjectURL(blob) };
    shopPhotoRemoved = false;
    setShopPhotoPreview(shopDraftPhoto.url);
  } catch (e) { toast(t('shopPhotoBad')); }
}

function removeShopPhoto(){
  if (shopDraftPhoto && shopDraftPhoto.url) { try { URL.revokeObjectURL(shopDraftPhoto.url); } catch (e) {} }
  shopDraftPhoto = null;
  if (shopKeepPhotoId) shopPhotoRemoved = true;
  setShopPhotoPreview(null);
  const inp = $('#shopPhotoInput'); if (inp) inp.value = '';
}

async function submitShop(){
  const name = ($('#shopNameInput').value || '').trim();
  const price = ($('#shopPriceInput').value || '').trim();
  let link = ($('#shopLinkInput').value || '').trim();
  const note = ($('#shopNoteInput').value || '').trim();
  if (!name) { toast(t('shopNeedName')); $('#shopNameInput').focus(); return; }
  if (link) {
    link = normalizeShopLink(link);
    if (!link) { toast(t('shopLinkBad')); $('#shopLinkInput').focus(); return; }
  }
  const btn = $('#shopSubmit');
  if (btn) btn.disabled = true;
  try {
    const editing = shopEditId ? findProduct(shopEditId) : null;
    let mediaId = editing ? (editing.mediaId || null) : null;
    let dropMediaId = null;
    if (shopDraftPhoto) {
      const id = newMediaId();
      await mediaPut(id, shopDraftPhoto.blob, 'image');
      mediaURLs.set(id, { url: shopDraftPhoto.url, kind: 'image' });  /* the card keeps this URL */
      shopDraftPhoto = null;
      if (mediaId && mediaId !== id) dropMediaId = mediaId;
      mediaId = id;
    } else if (shopPhotoRemoved) {
      if (mediaId) dropMediaId = mediaId;
      mediaId = null;
    }
    if (editing) {
      editing.name = name; editing.price = price; editing.link = link;
      editing.note = note; editing.mediaId = mediaId;
      /* an edited line must not keep the translation of the old one */
      delete shopTr[editing.id];
      Array.from(shopTrCache.keys()).forEach(k => { if (k.indexOf(editing.id + '|') === 0) shopTrCache.delete(k); });
    } else {
      shop.products.push({ id: 'p' + uid(), name, price, link, note, mediaId, ts: Date.now() });
    }
    saveShopStore();
    if (dropMediaId) {
      try { await mediaDel(dropMediaId); } catch (e) {}
      const old = mediaURLs.get(dropMediaId);
      if (old && old.url) { try { URL.revokeObjectURL(old.url); } catch (e) {} }
      mediaURLs.delete(dropMediaId);
    }
    closeSheet($('#shopSheet'));
    toast(t(editing ? 'shopUpdated' : 'shopSaved'));
    if (currentView === 'shop') render(); else go('shop');
  } catch (e) {
    toast(t('shopPhotoBad'));
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function removeShopProduct(id){
  const p = findProduct(id);
  if (!p) return;
  if (!confirm(t('shopConfirmDelete'))) return;
  shop.products = shop.products.filter(x => x.id !== id);
  saveShopStore();
  delete shopTr[id];
  Array.from(shopTrCache.keys()).forEach(k => { if (k.indexOf(id + '|') === 0) shopTrCache.delete(k); });
  if (p.mediaId) {
    try { await mediaDel(p.mediaId); } catch (e) {}
    const hit = mediaURLs.get(p.mediaId);
    if (hit && hit.url) { try { URL.revokeObjectURL(hit.url); } catch (e) {} }
    mediaURLs.delete(p.mediaId);
  }
  render();
  toast(t('shopDeleted'));
}

function postStickerHTML(p){
  const n = validSticker(p && p.sticker);
  if (!n) return '';
  return '<img class="post-sticker" src="' + stickerSrc(n) + '" alt="" width="44" height="44" loading="lazy">';
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
    +       '<span class="byline-time" data-ts="' + escAttr(p.ts) + '">' + timeAgo(p.ts) + '</span>'
    +       (p.editedAt ? '<span class="edited-mark">' + esc(t('edited')) + '</span>' : '')
    +       followBtn
    +     '</div>'
    +     '<p class="post-body">' + esc(p.body) + '</p>'
    +     (tags ? '<div class="post-tags">' + tags + '</div>' : '')
    +   '</div>'
    +   postStickerHTML(p)
    + '</div>'
    + mediaHTML(p)
    + translateRowHTML(p)
    + '<div class="post-actions">'
    +   '<button type="button" class="act' + (p.liked ? ' is-liked' : '') + '" data-act="like" aria-pressed="' + (p.liked ? 'true' : 'false') + '">' + ICO.heart() + '<span class="cnt">' + (p.likes || '') + '</span></button>'
    +   '<button type="button" class="act" data-act="comment">' + ICO.bubble + '<span class="cnt">' + (p.comments.length || '') + '</span></button>'
    +   '<button type="button" class="act' + (p.reposted ? ' is-reposted' : '') + '" data-act="repost" aria-pressed="' + (p.reposted ? 'true' : 'false') + '">' + ICO.repeat() + '<span class="cnt">' + (p.reposts || '') + '</span></button>'
    +   '<button type="button" class="act" data-act="share">' + ICO.send + '</button>'
    +   (p.mine ? '<span class="post-tools">'
    +   '<button type="button" class="act" data-act="edit" aria-label="' + escAttr(t('edit')) + '" title="' + escAttr(t('edit')) + '"><svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4.2L19.1 9.1a2.35 2.35 0 0 0-3.3-3.3L4.9 16.7Z"/><path d="M14.4 7.2l2.4 2.4"/></svg></button>'
    +   '<button type="button" class="act" data-act="delete" aria-label="Delete"><svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9 7V4.5h6V7"/></svg></button>'
    +   '</span>' : '')
    + '</div>'
    + '<div class="comments" hidden>'
    +   commentsHTML(p)
    +   '<form class="comment-form" data-cform="' + escAttr(p.id) + '">'
    +     avatarHTML({ nick: state.me.nick, handle: state.me.handle, mine: true }, 28)
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

  if (v === 'shop') { renderShop(); return; }

  if (v === 'home') {
    const posts = visiblePosts();
    main.innerHTML =
      '<div class="feed-head-pad"></div>'
      + matchInviteHTML()
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
      + (tags.length && tags[0].fallback ? '' : '<div class="tag-cloud-head">' + esc(t('popTags')) + '</div>')
      + '<div class="tag-cloud">' + tags.map((tg, i) => tagChipHTML(tg.tag, i, tg.count, tg.label)).join('') + '</div>'
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
    const bio = (state.me.bio || '').trim();
    main.innerHTML =
      '<div class="view-head"><h2 class="view-title">' + esc(t('myTitle')) + '</h2></div>'
      /* her own profile card: photo, nickname, one-line intro and the edit door */
      + '<section class="me-card">'
      +   '<div class="me-card-top">'
      +     '<img class="me-card-ava" src="' + escAttr(profileAvatarSrc()) + '" alt="" width="72" height="72">'
      +     '<div class="me-card-body">'
      +       '<b class="me-card-name">' + esc(state.me.nick) + '</b>'
      +       '<span class="me-card-role">' + esc(t('meRole')) + '</span>'
      +       (bio ? '<p class="me-card-bio">' + esc(bio) + '</p>' : '')
      +     '</div>'
      +   '</div>'
      +   '<button class="pill me-card-edit" type="button" data-profile-edit="1">'
      +     ICO.pencil + '<span>' + esc(t('profileEdit')) + '</span></button>'
      + '</section>'
      /* the community guidelines sit here, in the profile area, not on the feed */
      + '<button type="button" class="promise-row" data-kemi-promise="1" aria-haspopup="dialog">'
      +   '<span class="promise-row-ico" aria-hidden="true">📜</span>'
      +   '<span class="promise-row-copy"><b>' + esc(t('promiseBtn')) + '</b><span>' + esc(t('promiseBtnSub')) + '</span></span>'
      +   '<span class="promise-row-go" aria-hidden="true">\u203a</span>'
      + '</button>'
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

/* Popular tags: counted from the diaries actually written, most used first.
   A tag's last use breaks a tie, so the cloud stays warm instead of alphabetical.
   Only while no tag has been written at all does the recommended set stand in. */
function topTags(){
  const m = new Map();
  state.diaries.forEach(p => {
    (p.tags || []).forEach(tg => {
      if (!tg) return;
      const e = m.get(tg) || { tag: tg, count: 0, last: 0 };
      e.count += 1;
      if ((p.ts || 0) > e.last) e.last = p.ts || 0;
      m.set(tg, e);
    });
  });
  if (!m.size) return DEFAULT_TAGS.map(tg => ({ tag: tg.toLowerCase(), label: tg, count: 0, fallback: true }));
  return Array.from(m.values())
    .sort((a, b) => (b.count - a.count) || (b.last - a.last) || a.tag.localeCompare(b.tag))
    .slice(0, TOP_TAG_LIMIT);
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

  /* 👤 her own profile card in My Diary */
  const profileBtn = target.closest('[data-profile-edit]');
  if (profileBtn) { openProfileSheet(); return; }

  /* 📜 Kemi Promise — the button in My Diary and the link inside every warning */
  const promiseBtn = target.closest('[data-kemi-promise]');
  if (promiseBtn) { openPromiseSheet(); return; }

  /* the K-star Kemi match invite on top of the feed */
  const matchOpen = target.closest('[data-match-open]');
  if (matchOpen) { openMatchSheet(); return; }

  /* MOMO Shop first: its controls live inside the same main element */
  const shopAddBtn = target.closest('[data-shop-add]');
  if (shopAddBtn) { openShopSheet(null); return; }

  const shopEditBtn = target.closest('[data-shop-edit]');
  if (shopEditBtn) { const p = findProduct(shopEditBtn.dataset.shopEdit); if (p) openShopSheet(p); return; }

  const shopDelBtn = target.closest('[data-shop-del]');
  if (shopDelBtn) { removeShopProduct(shopDelBtn.dataset.shopDel); return; }

  const shopTrBtn = target.closest('[data-shop-translate]');
  if (shopTrBtn) { const p = findProduct(shopTrBtn.dataset.shopTranslate); if (p) startShopTranslate(p, getLang()); return; }

  const shopPhotoEl = target.closest('[data-shop-view]');
  if (shopPhotoEl) {
    const p = findProduct(shopPhotoEl.dataset.shopView);
    const hit = p && p.mediaId ? mediaURLs.get(p.mediaId) : null;
    if (hit && hit.url) openViewer(hit.url);
    return;
  }

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
    else if (act === 'edit') { openEditPost(p); }
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
  const bad = checkKemi(text);
  if (bad) { showCommentWarn(form, bad.kind); return; }
  clearCommentWarn(form);
  addComment(pid, text);
}

function openViewer(src){
  const url = safeSrc(src);
  if (!url) return;
  $('#viewerImg').src = url;
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
  const auto = '<button type="button" class="lang-item" role="option" data-code="auto" aria-selected="false">'
    + '<span class="lang-label">' + esc(t('langAuto')) + ' · ' + esc(langName(deviceLang())) + '</span>'
    + '<span class="tick" aria-hidden="true">\u2713</span></button>';
  $('#langMenu').innerHTML = auto + LANGS.map(l => (
    '<button type="button" class="lang-item" role="option" data-code="' + l.code + '" aria-selected="false">'
    + '<span class="lang-label" lang="' + l.code + '">' + esc(l.label) + '</span><span class="tick" aria-hidden="true">\u2713</span></button>'
  )).join('');
}

function bind(){
  $('#composeBtn').addEventListener('click', () => openCompose());
  $('#composeBtn2').addEventListener('click', () => openCompose());
  $('#composeCancel').addEventListener('click', () => closeSheet($('#composeSheet')));
  $('#scrim').addEventListener('click', () => {
    if (!$('#promiseSheet').hidden) { closePromiseSheet(); return; }
    if (!$('#composeSheet').hidden) closeSheet($('#composeSheet'));
    if (!$('#shopSheet').hidden) closeSheet($('#shopSheet'));
    if (!$('#matchSheet').hidden) closeSheet($('#matchSheet'));
    if (!$('#profileSheet').hidden) closeSheet($('#profileSheet'));
  });
  $('#composeSubmit').addEventListener('click', onComposeSubmit);

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

  /* dancheong sticker tray: one sticker per diary, tap again to take it off */
  if ($('#stickerRow')) $('#stickerRow').addEventListener('click', (e) => {
    const opt = e.target.closest('[data-sticker]');
    if (opt) toggleDraftSticker(opt.dataset.sticker);
  });
  renderStickerTray();

  const langBtn = $('#langBtn'), langMenu = $('#langMenu');
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); langMenu.hidden = !langMenu.hidden; langBtn.setAttribute('aria-expanded', String(!langMenu.hidden)); });
  langMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.lang-item');
    if (!item) return;
    const code = item.dataset.code;
    /* "device language" forgets a pick made earlier and follows the phone again */
    clearUrlLang();
    if (code === 'auto') localStorage.removeItem(LANG_KEY);
    else localStorage.setItem(LANG_KEY, code);
    langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false');
    trState = {};          /* translations are per language: start fresh */
    shopTr = {};
    render();
    /* a language without a bundled file is translated now; the screen redraws
       in it as soon as the words arrive */
    ensureLangDict().then(dict => { if (dict) render(); });
  });
  document.addEventListener('click', (e) => {
    if (!langMenu.hidden && !e.target.closest('#lang')) { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); }
  });

  $$('.tab[data-view]').forEach(btn => btn.addEventListener('click', () => go(btn.dataset.view)));

  const main = $('#main');
  main.addEventListener('click', onMainClick);
  main.addEventListener('submit', onMainSubmit);
  main.addEventListener('input', (e) => {
    /* typing again clears a reply warning */
    if (!e.target.classList || !e.target.classList.contains('comment-input')) return;
    const form = e.target.closest('[data-cform]');
    if (form) clearCommentWarn(form);
  });
  main.addEventListener('click', (e) => {
    const metaBtn = e.target.closest('[data-metab]');
    if (metaBtn) { state.meTab = metaBtn.dataset.metab; save(state); render(); return; }
  });

  $('#viewer').addEventListener('click', closeViewer);
  $('#viewerClose').addEventListener('click', closeViewer);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#promiseSheet').hidden) { closePromiseSheet(); return; }
    closeViewer();
    if (!$('#composeSheet').hidden) closeSheet($('#composeSheet'));
    if (!$('#shopSheet').hidden) closeSheet($('#shopSheet'));
    if (!$('#matchSheet').hidden) closeSheet($('#matchSheet'));
    if (!$('#profileSheet').hidden) closeSheet($('#profileSheet'));
  });

  /* 📜 Kemi Promise sheet, and the warning banner that sends people to it */
  if ($('#promiseSheet')) $('#promiseClose').addEventListener('click', closePromiseSheet);
  if ($('#composeWarn')) $('#composeWarn').addEventListener('click', (e) => {
    if (e.target.closest('[data-kemi-promise]')) openPromiseSheet();
  });
  /* an edit to the wording clears the standing warning */
  ['#nickInput', '#bodyInput', '#tagInput'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener('input', hideComposeWarn);
  });

  /* K-star Kemi match sheet */
  if ($('#matchSheet')) {
    $('#matchClose').addEventListener('click', () => closeSheet($('#matchSheet')));
    $('#matchGo').addEventListener('click', onMatchGo);
    $('#matchResult').addEventListener('click', (e) => {
      if (e.target.closest('[data-match-share]')) bragOnDiary();
    });
    ['#starNameInput', '#starYear', '#myYear'].forEach(sel => {
      const el = $(sel);
      if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onMatchGo(); } });
    });
  }

  /* 👤 My profile sheet */
  if ($('#profileSheet')) {
    $('#profileCancel').addEventListener('click', () => closeSheet($('#profileSheet')));
    $('#profileSave').addEventListener('click', saveProfile);
    $('#profilePhotoBtn').addEventListener('click', () => { const i = $('#profilePhotoInput'); if (i) i.click(); });
    $('#profilePhotoPick').addEventListener('click', () => { const i = $('#profilePhotoInput'); if (i) i.click(); });
    $('#profilePhotoInput').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      onProfilePhotoPick(f);
      e.target.value = '';
    });
    /* back to KOMI's photo: the preview turns at once, Save makes it real */
    $('#profilePhotoReset').addEventListener('click', () => { profileDraftAvatar = null; setProfilePhotoPreview(null); });
    ['#profileNickInput', '#profileBioInput'].forEach(sel => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('input', () => { syncProfileCounters(); hideProfileWarn(); });
    });
    $('#profileWarn').addEventListener('click', (e) => {
      if (e.target.closest('[data-kemi-promise]')) openPromiseSheet();
    });
  }

  /* MOMO Shop sheet */
  if ($('#shopSheet')) {
    $('#shopCancel').addEventListener('click', () => closeSheet($('#shopSheet')));
    $('#shopSubmit').addEventListener('click', submitShop);
    $('#shopPhotoBtn').addEventListener('click', () => $('#shopPhotoInput').click());
    $('#shopPhotoInput').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      onShopPhotoPick(f);
    });
    $('#shopPhotoRm').addEventListener('click', removeShopPhoto);
  }

  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
}

function boot(){
  buildLangMenu();
  load();
  loadShop();
  bind();
  updateOnline();

  const dl = readDeepLink();
  if (dl) { deepLinkedId = dl; currentView = 'home'; render(); requestAnimationFrame(() => { const el = document.getElementById('p-' + dl); if (el) el.scrollIntoView({ block: 'center' }); }); }
  else render();

  /* a language no bundled file carries: its words arrive in a moment, and the
     screen is redrawn in them */
  ensureLangDict().then(dict => { if (dict) render(); });

  ensureMedia();
  resolveShopMedia();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
})();
