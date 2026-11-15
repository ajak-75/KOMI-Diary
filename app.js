/* KOMI's K-Culture Diary — app.js
   Vanilla JS thread-style feed. Data persists in localStorage (komidiary.v1).
   Dancheong palette accents: #4B7F9F #E05A47 #EB7A2D #6E946B #D9B44A */

(() => {
'use strict';

/* ---------- constants ---------- */
const STORE_KEY = 'komidiary.v1';
const LANG_KEY  = 'komidiary.lang';
const PAGE_URL  = 'https://ajak-75.github.io/KOMI-Diary/';
const MAX_PHOTOS = 4;
const MAX_EDGE   = 1280;
const JPEG_Q     = 0.82;

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
    todayBanner:'Today\u2019s K-Culture Diary',
    translate:'Translate', seeOriginal:'See original', translatedBy:'Translated for global fans',
    newPost:'New diary', cancel:'Cancel', publish:'Post', posted:'Posted \ud83c\udf8a',
    nickPlaceholder:"KOMI's Unnie", bodyPlaceholder:'What did Korea feel like today?',
    photo:'Photo', photoHint:`Up to ${MAX_PHOTOS} photos`, tooManyPhotos:`Up to ${MAX_PHOTOS} photos`,
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
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'오늘 한국은 어땠나요?',
    photo:'사진', photoHint:`사진 ${MAX_PHOTOS}장까지`, tooManyPhotos:`사진은 ${MAX_PHOTOS}장까지`,
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
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'今日の韓国はどうでしたか？',
    photo:'写真', photoHint:`写真は${MAX_PHOTOS}枚まで`, tooManyPhotos:`写真は${MAX_PHOTOS}枚まで`,
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
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'今天的韩国怎么样？',
    photo:'照片', photoHint:`最多${MAX_PHOTOS}张照片`, tooManyPhotos:`最多${MAX_PHOTOS}张照片`,
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
    posts:'日记', likes:'点赞', followed:'已关注 \ud83d\udc9b', unfollowed:'关注',
    offline:'离线中 \u2014 显示已保存的日记', updated:'信息流已更新',
    deleteComment:'删除',
    dateLocale:'zh-CN', needText:'请先输入内容 \u2728',
  },
  es: {
    tagline:'Corea de cada d\u00eda con KOMI',
    home:'Inicio', search:'Buscar', post:'Publicar', mydiary:'Mi diario',
    todayBanner:'Diario K-culture de hoy',
    translate:'Traducir', seeOriginal:'Ver original', translatedBy:'Traducido para fans del mundo',
    newPost:'Nuevo diario', cancel:'Cancelar', publish:'Publicar', posted:'Publicado \ud83c\udf8a',
    nickPlaceholder:'KOMI\u2019s Unnie', bodyPlaceholder:'\u00bfQu\u00e9 tal fue Corea hoy?',
    photo:'Foto', photoHint:`Hasta ${MAX_PHOTOS} fotos`, tooManyPhotos:`Hasta ${MAX_PHOTOS} fotos`,
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
    posts:'Diarios', likes:'Me gusta', followed:'Siguiendo a KOMI \ud83d\udc9b', unfollowed:'Seguir',
    offline:'Sin conexi\u00f3n \u2014 mostrando diarios guardados', updated:'Feed actualizado',
    deleteComment:'Eliminar',
    dateLocale:'es-ES', needText:'Escribe algo primero \u2728',
  },
};

/* ---------- sample content (multilingual) ---------- */
const HOUR = 3600 * 1000, MIN = 60 * 1000;

const SAMPLES = [
  {
    nick: "KOMI's Unnie", handle: '@ajakstudio.lab', avatar: './img/komi-avatar.jpg', mine: true,
    body: "Annyeong! \uc548\ub155, \ucf54\ubbf8 \uc5b8\ub2c8\uc57c \ud83d\udc36\ud388\nKOMI's K-Culture Diary opens today \u2014 a little white thread where the world meets everyday Korea. First stop: Myeongdong street food with MOMO \ud83c\udf61\nFollow along, say annyeong in your language!",
    tags: ['koreadiary','myeongdong','kfood'],
    photos: ['./img/myeongdong.jpg'],
    translations: {
      ko: "\uc548\ub155! \uc548\ub155, \ucf54\ubbf8 \uc5b8\ub2c8\uc57c \ud83d\udc36\ud388\n\ucf54\ubbf8\uc758 K-\uceec\ucc98 \ub2e4\uc774\uc5b4\ub9ac\uac00 \uc624\ub298 \uc5f4\ub824\uc694 \u2014 \uc804 \uc138\uacc4\uc640 \ub9e4\uc77c\uc758 \ud55c\uad6d\ub9cc\ub098\ub294 \uc2ec\ud50c\ud55c \ud770 \uc2a4\ub808\ub4dc. \uccab \ubc29\ubb38\uc9c0\ub294 \ubaa8\ubaa8\uc640 \ud568\uaed8\ud558\ub294 \uba85\ub3d9 \ubd81\uc544\ubc25 \uac70\ub9ac \uc608\uc694 \ud83c\udf61\n\ub2e4\uc591\ud55c \uc5b8\uc5b4\ub85c \uc548\ub155\uc778\uc0ac \ubd80\ud0c1\ud574\uc694!",
      ja: "\u3053\u3093\u306b\u3061\u306f\uff01\u30b3\u30df\u306e\u304a\u59c9\u3055\u3093\u3067\u3059 \ud83d\udc36\ud388\nKOMI\u306eK-\u30ab\u30eb\u30c1\u30e3\u30fc\u30c0\u30a4\u30a2\u30ea\u30fc\u304c\u4eca\u65e5\u958b\u8a2d\uff01\u4e16\u754c\u3068\u6bce\u65e5\u306e\u97d3\u56fd\u3092\u3064\u306a\u3050\u3057\u3093\u3077\u308b\u306a\u767d\u3044\u30b9\u30ec\u30c3\u30c9\u3002\u6700\u521d\u306fMOMO\u3068\u884c\u304f\u660e\u6d1e\u5c4b\u53f0\u8857 \ud83c\udf61\n\u304a\u597d\u304d\u306a\u8a00\u8449\u3067\u30a2\u30f3\u30cb\u30e7\u30f3\u3057\u3066\u306d\uff01",
      zh: "\u5927\u5bb6\u597d\uff01\u6211\u662f\u79d1\u7c73\u59d0\u59d0 \ud83d\udc36\ud388\nKOMI\u7684K-\u6587\u5316\u65e5\u8bb0\u4eca\u5929\u5f00\u901a \u2014 \u8fde\u63a5\u4e16\u754c\u4e0e\u97e9\u56fd\u65e5\u5e38\u7684\u7b80\u7ea6\u767d\u8272\u5c0f\u5c4b\u3002\u7b2c\u4e00\u7ad9\u662f\u548cMOMO\u901b\u660e\u6d1e\u5c0f\u5403\u8857 \ud83c\udf61\n\u7528\u4f60\u7684\u8bed\u8a00\u6253\u58f0\u62db\u547c\u5427\uff01",
      es: "\u00a1Hola! Soy la Unnie de KOMI \ud83d\udc36\ud388\nHoy abre el Diario K-culture de KOMI \u2014 un hilo blanco y sencillo donde el mundo conoce la Corea de cada d\u00eda. Primera parada: el mercado callejero de Myeongdong con MOMO \ud83c\udf61\n\u00a1Saluda en tu idioma!",
    },
    likes: 127, reposts: 18, ago: 2 * HOUR, following: false,
    comments: [
      { nick:'Yuki \ud83c\uddef\ud83c\uddf5', handle:'@yuki_tokyo', text:'\u521d\u3081\u307e\u3057\u3066\u3001\u30b3\u30df\uff01\u65e5\u672c\u304b\u3089\u5fdc\u63f4\u3057\u3066\u307e\u3059\ud83d\udc95 \u307b\u3063\u3053\u713c\u304d\u7f8e\u5473\u3057\u305d\u3046\uff01', ago: 95 * MIN },
      { nick:'Emily \ud83c\uddfa\ud83c\uddf8', handle:'@em_in_nyc', text:'Omg the street food looks unreal \ud83e\udd64 KOMI diary is my new nightly read!', ago: 40 * MIN },
      { nick:'\u5c0f\u7f8e \ud83c\udde8\ud83c\uddf3', handle:'@xiaomei_bj', text:'\u597d\u559c\u6b22\u97e9\u56fd\u8857\u5934\u5c0f\u5403\uff01\u4e0b\u6b21\u53bb\u9996\u5c14\u4e00\u5b9a\u53bb\u660e\u6d1e \ud83c\udf5f', ago: 12 * MIN },
      { nick:'Luc\u00eda \ud83c\uddea\ud83c\uddF8', handle:'@lucia_mad', text:'\u00a1Annyeong desde Madrid! \u00bfCu\u00e1l es tu bungeoppang favorito, KOMI?', ago: 6 * MIN },
    ],
  },
  {
    nick: "KOMI's Unnie", handle: '@ajakstudio.lab', avatar: './img/komi-avatar.jpg', mine: true,
    body: "Bukchon Hanok Village in late autumn \ud83c\udf41\nPersimmons on the old walls, hot hotteok in my paws, MOMO pretending he is not cold. This is the Korea postcard never shows you \u2014 the quiet streets before the tour buses come. 7:30am. Go. Thank me later.",
    tags: ['bukchon','hanok','kplace'],
    photos: ['./img/bukchon.jpg'],
    translations: {
      ko: "\uac00\uc744 \ub05d\uc790\ub9ac \ubd81\ucd0c\ud55c\uc625\ub9c8\uc744 \ud83c\udf41\n\uc5b4\ub290 \ub2ec\uc778 \ub3c1\uc774\uc640, \ubcf4\uc628 \ud638\ub5d0\uc37d, \uccb1\uc7c0\uc774\ub77c\ub3c4 \uc544\ub2c8\ub77c\ub294 \ub4ef \ubaa8\ubaa8. \ud3ec\uc2a4\ud2b8\uce74\ub4dc\uac00 \uc548 \ubcf4\uc5ec\uc8fc\ub294 \ud55c\uad6d\uc774\uc5d0\uc694 \u2014 \uc8fc\ub9c9\uc6a9 \ubc84\uc2a4\uac00 \uc624\uae30 \uc804\uc758 \uc870\uc6a9\ud55c \uae38. \uc544\uce68 7\uc2dc 30\ubd84. \uadf8\ub0e5 \uac00\uc138\uc694.",
      ja: "\u79cb\u306e\u672b\u308a\u306e\u5317\u6751\u97d3\u5c4b\u6751 \ud83c\udf41\n\u53e4\u3044\u58c1\u306e\u67ff\u3001\u3042\u3063\u3064\u3042\u3064\u306e\u30db\u30c8\u30af\u3001\u5bd2\u304f\u306a\u3044\u3075\u308a\u306eMOMO\u3002\u30d0\u30b9\u304c\u6765\u308b\u524d\u306e\u9759\u304b\u306a\u8def\u5730\u5915\u65b9\u2014\u3053\u308c\u3053\u305d\u672c\u7269\u306e\u97d3\u56fd\u3002\u671d7\u664230\u5206\u3001\u305c\u3072\u884c\u3063\u3066\uff01",
      zh: "\u6df1\u79cb\u7684\u5317\u6751\u97e9\u5c4b\u6751 \ud83c\udf41\n\u8001\u5899\u4e0a\u7684\u67ff\u5b50\uff0c\u70ed\u4e4e\u4e4e\u7684\u7cd6\u997c\uff0c\u88c5\u4f5c\u4e0d\u51b7\u7684MOMO\u3002\u8fd9\u624d\u662f\u660e\u4fe1\u7247\u4e0d\u7ed9\u4f60\u770b\u7684\u97e9\u56fd \u2014 \u65c5\u6e38\u5927\u5df4\u8fd8\u6ca1\u6765\u65f6\u5b89\u9759\u7684\u80e1\u540c\u3002\u65e9\u4e0a7\u70b9\u534a\uff0c\u53bb\u5c31\u5bf9\u4e86\uff01",
      es: "Bukchon Hanok a finales de oto\u00f1o \ud83c\udf41\nCaquis en las paredes viejas, hotteok caliente en mis patas y MOMO fingiendo que no tiene fr\u00edo. \u00c9sta es la Corea que no sale en las postales \u2014 las calles tranquilas antes de los autobuses tur\u00edsticos. 7:30 de la ma\u00f1ana. Ve. Ya me agradecer\u00e1s.",
    },
    likes: 98, reposts: 11, ago: 26 * HOUR, following: false,
    comments: [
      { nick:'Hana \ud83c\uddf0\ud83c\uddf7', handle:'@hana_seoul', text:'\uadf8 \uc2dc\uac04\ub300 \uc870\uc6a9\ud560 \ub54c \uc870\uc548 \uc5f0\uc778\ub9ac\uc5d0\uc11c \uacf5\ubd80\ud558\ub358 \uc0dd\uac01 \ub098\ub124\uc6a4 \ud83c\udf49', ago: 20 * HOUR },
      { nick:'Tan \ud83c\uddf9\ud83c\udded', handle:'@tan_bkk', text:'Persimmon season is the best season \ud83e\udded adding Bukchon to my list!', ago: 9 * HOUR },
    ],
  },
  {
    nick: "KOMI's Unnie", handle: '@ajakstudio.lab', avatar: './img/komi-avatar.jpg', mine: true,
    body: "Gingko gold at Nami Island \ud83c\udf2a\nKOMI: sweet potato. MOMO: a whole paper bag of roasted chestnuts, refusing to share. Weekdate rule: one tree, one snack each, zero mercy. What is your autumn date move?",
    tags: ['namiisland','autumn','koreatrip'],
    photos: ['./img/nami.jpg'],
    translations: {
      ko: "\ub0a8\uc774\uc12c \uc740\ud589\ub098\ubb34 \uae08\uc0c9 \ud83c\udf2a\n\ucf54\ubbf8\ub294 \uace0\uad6c\ub9c8, \ubaa8\ubaa8\ub294 \uad7f\uac01\uc740 \uc740\ud565 \uc885\uc9c0\ubd81\uc774 \uc788\ub294 \uc911 \uacf5\uc720 \uac70\ubd80. \uc8fc\uac04 \ub370\uc774\ud2b8 \uadc0\uce59: \ud55c \ub098\ubb34\uc5d0 \uc5b5\uc838\uc694 \uc549\uc744\ub54c\ub2e4 \uc815\ub9d0 \ub9db\uc788\ub124\uc694. \uac00\uc744 \ub370\uc774\ud2b8 \uce78\uc9c0\ub294 \ubb34\uc5c7\uc778\uac00\uc694?",
      ja: "\u5357\u30a4\u30bb\u30fc\u5c9b\u306e\u30a4\u30c1\u30e7\u30a6\u306e\u9ec4\u91d1 \ud83c\udf2a\nKOMI\u306f\u713c\u304d\u828b\u3001MOMO\u306f\u713c\u304d\u6817\u306e\u8c46\u5168\u90e8\u6301\u3061\u5e30\u5bb6\u4e2d\u3002\u4e00\u672c\u306e\u6728\u306e\u4e0b\u3067\u30b9\u30ca\u30c3\u30af\u2014\u5206\u3051\u5408\u3044\u306f\u52d8\u76ee\u4e00\u676f\u3002\u79cb\u306e\u30c7\u30fc\u30c8\u5b9a\u756a\u306f\u4f55\uff1f",
      zh: "\u5357\u6021\u5c9b\u7684\u94f6\u674f\u91d1\u8272 \ud83c\udf2a\nKOMI\u62ff\u7740\u70e4\u7ea2\u85af\uff0cMOMO\u62b1\u7740\u6574\u888b\u7cd6\u7092\u677e\u5b50\u4e0d\u80af\u5206\u4eab\u3002\u4e00\u68f5\u6811\u4e0b\u5403\u70b9\u5fc3\u2014\u4e0d\u8bb2\u60c5\u9762\u3002\u4f60\u4eec\u90a3\u91cc\u79cb\u5929\u7ea6\u4f1a\u90fd\u53bb\u54ea\uff1f",
      es: "Oro de ginkgo en la isla de Nami \ud83c\udf2a\nKOMI con su boniato asado, MOMO con toda una bolsa de casta\u00f1as que no piensa compartir. Regla de la cita de oto\u00f1o: un \u00e1rbol, un snack cada uno, sin piedad. \u00bfCu\u00e1l es vuestro plan de oto\u00f1o?",
    },
    likes: 143, reposts: 22, ago: 50 * HOUR, following: false,
    comments: [
      { nick:'Minh \ud83c\uddfb\ud83c\uddf3', handle:'@minh_hn', text:'MOMO\u2019s side-eye while holding the whole bag \ud83d\ude02\ud83d\ude02 \u0111\u00e1ng y\u00eau qu\u00e1!', ago: 30 * HOUR },
      { nick:'Sarah \ud83c\udde6\ud83c\uddfa', handle:'@sarah_aus', text:'The golden ginkgo \ud83e\udee9 we went last November and it looked EXACTLY like this', ago: 14 * HOUR },
    ],
  },
  {
    nick: 'KOMI', handle: '@komi.diary', avatar: null, mine: false,
    body: "Woof. MOMO here. \ud83d\udc36\nKOMI hogs the mirror every morning (11 minutes, I counted). I let her, because one of us has to look like a K-drama lead. I look like the plot twist. Send snacks.",
    tags: ['momo','petsofkorea'],
    photos: [],
    translations: {
      ko: "\uba4d. \ubaa8\ubaa8\uc5d0\uc694. \ud83d\udc36\n\ucf54\ubbf8\uac00 \ub9e4\uc77c \uc544\uce68 \uac70\uc6b8 \uc55e\uc5d0\uc11c 11\ubd84\uc744 \ud638\uc9c1\ud574\uc694(\uc138\uc5b4 \ubd24\uc5b4\uc694). \uc6b0\ub9ac \uc911 \ud55c \ub179\uc740 K-\ub4dc\ub77c\ub9c8 \uc8fc\uc778\uacf5\uac19\uc744 \ud544\uc694\uac00 \uc788\ub2c8\uae4c\uc694. \ub09c \ubc18\uc804 \uc5ed\ud560\uc778 \uac83 \uac19\uc8e0. \uac04\uc2dd \ubcf4\ub0b4\uc8fc\uc138\uc694.",
      ja: "\u30ef\u30f3\u3002MOMO\u3067\u3059 \ud83d\udc36\nKOMI\u306f\u6bce\u671d\u955c\u306e\u524d\u306711\u5206\uff08\u8a08\u3063\u305f\uff09\u4f7f\u3063\u3066\u308b\u3002\u97d3\u30c9\u30e9\u306e\u4e3b\u5f79\u306b\u898b\u3048\u308b\u4eba\u304c\u5fc5\u8981\u3060\u304b\u3089\u307e\u3041\u3044\u3044\u3051\u3069\u3002\u4ffa\u306f\u5c55\u958b\u306e\u30c9\u30f3\u30c7\u30f3\u56de\u3002\u304a\u3084\u3064\u9001\u3063\u3066\u3002",
      zh: "\u65fa\u3002\u6211\u662fMOMO \ud83d\udc36\nKOMI\u6bcf\u5929\u65e9\u4e0a\u5360\u7740\u955c\u5b5011\u5206\u949f\uff08\u6211\u6570\u7684\uff09\u3002\u603b\u5f97\u6709\u4eba\u770b\u8d77\u6765\u50cf\u97e9\u5267\u4e3b\u89d2\uff0c\u6211\u5c31\u662f\u90a3\u4e2a\u53cd\u8f6c\u89d2\u8272\u3002\u96f6\u98df\u5feb\u5bc4\u8fc7\u6765\u3002",
      es: "Guau. Aqu\u00ed MOMO \ud83d\udc36\nKOMI se roba el espejo cada ma\u00f1ana (11 minutos, los cont\u00e9). La dejo, porque alguien tiene que parecer protagonista de K-drama. Yo parezco el giro del gui\u00f3n. Manden snacks.",
    },
    likes: 212, reposts: 31, ago: 74 * HOUR, following: false,
    comments: [
      { nick:'Kenji \ud83c\uddef\ud83c\uddf5', handle:'@kenji_osaka', text:'\u62d9\u8005\u3001\u677e\u5c4b\u306e\u3055\u3064\u307e\u3044\u304a\u9001\u308a\u3057\u307e\u3059\ud83c\udf65\u7d9a\u304d\u3082\u898b\u305f\u3044\uff01', ago: 60 * HOUR },
      { nick:'Zoe \ud83c\uddec\ud83c\udde7', handle:'@zoe_ldn', text:'\u201cI look like the plot twist\u201d \ud83d\ude02 MOMO you absolute icon', ago: 55 * HOUR },
    ],
  },
];

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

/* ---------- data ---------- */
let state = null;

function load(){
  let d = null;
  try { d = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch(e) { d = null; }
  if (!d || !Array.isArray(d.diaries)) {
    d = {
      v: 1,
      me: { nick: "KOMI's Unnie", handle: '@me', following: false },
      diaries: SAMPLES.map((s, i) => ({
        id: 'seed' + i,
        nick: s.nick, handle: s.handle, avatar: s.avatar || null,
        body: s.body, tags: s.tags.slice(),
        photos: s.photos.slice(),
        translations: JSON.parse(JSON.stringify(s.translations)),
        mine: !!s.mine, verified: true,
        ts: Date.now() - s.ago,
        likes: s.likes, liked: false,
        reposts: s.reposts, reposted: false,
        comments: s.comments.map((c, j) => ({ id:'c' + i + '_' + j, nick:c.nick, handle:c.handle, text:c.text, ts: Date.now() - c.ago })),
      })),
      filterTag: null, searchQuery: '', meTab: 'mine',
    };
    save(d);
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

/* ---------- photo pipeline ---------- */
function readAsDataURL(file){
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}

function loadImage(src){
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}

async function downscaleDataURL(file){
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  let { width: w, height: h } = img;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
  let canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  let out = canvas.toDataURL('image/jpeg', JPEG_Q);
  if (out.length > 1.6e6) {
    let q = JPEG_Q, s = 1;
    while (out.length > 1.6e6 && q > 0.4) { q -= 0.12; out = canvas.toDataURL('image/jpeg', q); }
    while (out.length > 1.6e6 && s > 0.3) { s -= 0.15; const nw = Math.round(w*s), nh = Math.round(h*s);
      canvas = document.createElement('canvas'); canvas.width = nw; canvas.height = nh;
      canvas.getContext('2d').drawImage(img, 0, 0, nw, nh); out = canvas.toDataURL('image/jpeg', 0.7); }
  }
  return out;
}

/* ---------- compose ---------- */
let draftPhotos = [];

function openCompose(){
  $('#nickInput').value = state.me && state.me.nick ? state.me.nick : "KOMI's Unnie";
  $('#bodyInput').value = '';
  $('#tagInput').value = '';
  $('#bodyCount').textContent = '0';
  draftPhotos = [];
  $('#photoInput').value = '';
  renderDraftPhotos();
  openSheet($('#composeSheet'));
  setTimeout(() => $('#bodyInput').focus(), 260);
}

function renderDraftPhotos(){
  const strip = $('#photoStrip');
  strip.hidden = draftPhotos.length === 0;
  strip.innerHTML = draftPhotos.map((src, i) => (
    '<div class="photo-thumb"><img src="' + src + '" alt=""><button type="button" class="rm" data-i="' + i + '" aria-label="Remove">\u2715</button></div>'
  )).join('');
}

async function addPhotoFiles(files){
  for (const f of Array.from(files || [])) {
    if (!/^image\//.test(f.type)) continue;
    if (draftPhotos.length >= MAX_PHOTOS) { toast(t('tooManyPhotos')); break; }
    try { draftPhotos.push(await downscaleDataURL(f)); }
    catch(e) { toast(getLang()==='ko' ? '\uc0ac\uc9c4\uc744 \ubd88\ub7ec\uc62c \uc218 \uc5c6\uc5b4\uc694' : 'Could not read image'); }
  }
  renderDraftPhotos();
}

function submitPost(){
  const nick = ($('#nickInput').value || '').trim() || "KOMI's Unnie";
  const body = ($('#bodyInput').value || '').trim();
  if (!body) { toast(t('needText')); return; }
  const tags = ($('#tagInput').value || '').split(/[\s,]+/).map(s => s.replace(/^#+/, '').trim().toLowerCase())
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
  const p = {
    id: uid(), nick, handle: state.me.handle, avatar: null,
    body, tags, photos: draftPhotos.slice(), translations: {}, mine: true, verified: false,
    ts: Date.now(), likes: 0, liked: false, reposts: 0, reposted: false, comments: [],
  };
  state.diaries.unshift(p);
  state.me.nick = nick;
  save(state);
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
  renderLangUI();
  renderMain();
  markTabs();
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
  $('#tagInput').placeholder = '#myeongdong #kfood';
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

function photosHTML(p){
  if (!p.photos || !p.photos.length) return '';
  const n = Math.min(p.photos.length, 4);
  let inner = '';
  for (let i = 0; i < n; i++) {
    const last = (i === 3 && p.photos.length > 4);
    inner += last
      ? '<div class="ph-more" data-photo="' + i + '" style="background-image:url(\'' + p.photos[i] + '\')"><span>+' + (p.photos.length - 3) + '</span></div>'
      : '<img src="' + p.photos[i] + '" alt="" loading="lazy" data-photo="' + i + '">';
  }
  return '<div class="post-photos" data-n="' + n + '">' + inner + '</div>';
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

function postHTML(p){
  const tags = p.tags.map((tg, i) => tagChipHTML(tg, i)).join('');
  const tr = p.translations && p.translations[getLang()];
  const hasTr = !!(tr && tr !== p.body);
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
    + photosHTML(p)
    + (hasTr
        ? '<div class="translate-row"><button type="button" class="translate-btn" data-translate="' + escAttr(p.id) + '">'
          + ICO.globe + '<span>' + t('translate') + '</span></button></div>'
        : (p.mine ? '<div class="translate-row"><span class="translate-meta">HTTPS://ajak-75.github.io \u00b7 ' + t('translatedBy') + '</span></div>' : ''))
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

function renderMain(){
  const main = $('#main');
  const v = currentView;

  if (v === 'home') {
    main.innerHTML =
      '<div class="feed-head-pad"></div>'
      + todayBannerHTML()
      + visiblePosts().map(postHTML).join('');
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

  const translateBtn = target.closest('[data-translate]');
  if (translateBtn) {
    const post = findPostElFrom(translateBtn);
    const p = findPost(post.dataset.pid);
    if (!p) return;
    const tr = p.translations && p.translations[getLang()];
    if (!tr) return;
    const row = translateBtn.closest('.translate-row');
    const open = row.querySelector('.translate-body');
    if (open) {
      row.innerHTML = '<button type="button" class="translate-btn" data-translate="' + p.id + '">' + ICO.globe + '<span>' + t('translate') + '</span></button>';
    } else {
      row.innerHTML = '<button type="button" class="translate-btn" data-translate="' + p.id + '">' + ICO.globe + '<span>' + t('seeOriginal') + '</span></button>'
        + '<div class="translate-body">' + esc(tr) + '<div class="translate-meta">' + esc(t('translatedBy')) + '</div></div>';
    }
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
    const post = findPostElFrom(photoEl);
    const p = findPost(post.dataset.pid);
    const i = parseInt(photoEl.dataset.photo, 10) || 0;
    openViewer(p.photos[i]);
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
      const lang = getLang();
      if (confirm(t('confirmDelete'))) {
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

  $('#photoBtn').addEventListener('click', () => $('#photoInput').click());
  $('#photoInput').addEventListener('change', (e) => { addPhotoFiles(e.target.files); e.target.value = ''; });
  $('#photoStrip').addEventListener('click', (e) => {
    const rm = e.target.closest('.rm');
    if (rm) { draftPhotos.splice(parseInt(rm.dataset.i, 10), 1); renderDraftPhotos(); }
  });

  const langBtn = $('#langBtn'), langMenu = $('#langMenu');
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); langMenu.hidden = !langMenu.hidden; langBtn.setAttribute('aria-expanded', String(!langMenu.hidden)); });
  langMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.lang-item');
    if (!item) return;
    localStorage.setItem(LANG_KEY, item.dataset.code);
    langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false');
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

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
})();
