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
  if (typeof d.me.handle !== 'string' || !d.me.handle) d.me.handle = '@me';
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

/* ---------- compose ----------
   The same sheet writes a new diary and edits one already written: editPostId
   holds the post being edited (null when composing), and in edit mode the
   media already attached come back into the draft strip as editable items. */
let draftMedia = [];   /* { kind, blob, url, id? } — id when the item is already stored */
let editPostId = null; /* post id while editing, null while composing */

function clearDraftMedia(){
  draftMedia.forEach(m => { if (!m.id) { try { URL.revokeObjectURL(m.url); } catch (e) {} } });
  draftMedia = [];
  $('#mediaInput').value = '';
  renderDraftMedia();
}

function openCompose(){
  editPostId = null;
  $('#nickInput').value = state.me && state.me.nick ? state.me.nick : "KOMI's Unnie";
  $('#bodyInput').value = '';
  $('#tagInput').value = '';
  $('#bodyCount').textContent = '0';
  clearDraftMedia();
  syncComposeMode();
  openSheet($('#composeSheet'));
  setTimeout(() => $('#bodyInput').focus(), 260);
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
  $('#nickInput').value = p.nick || (state.me && state.me.nick) || "KOMI's Unnie";
  $('#bodyInput').value = p.body || '';
  $('#tagInput').value = (p.tags || []).map(x => '#' + x).join(' ');
  $('#bodyCount').textContent = String(($('#bodyInput').value || '').length);
  clearDraftMedia();
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
        ? '<video src="' + escAttr(m.url) + '" muted playsinline preload="metadata"></video><span class="thumb-play" aria-hidden="true">\u25b6</span>'
        : '<img src="' + escAttr(m.url) + '" alt="">')
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
    if (sheet === $('#composeSheet')) { editPostId = null; clearDraftMedia(); syncComposeMode(); }
    if (sheet === $('#shopSheet')) { shopEditId = null; clearShopDraftPhoto(); syncSheetTitle(); }
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

function renderLangUI(){
  const code = getLang();
  $('#langCode').textContent = LANGS.some(l => l.code === code) ? code.toUpperCase() : 'EN';
  $$('#langMenu .lang-item').forEach(b => b.setAttribute('aria-selected', String(b.dataset.code === code)));
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  syncComposeMode();
  syncSheetTitle();
  $('#nickInput').placeholder = t('nickPlaceholder');
  $('#bodyInput').placeholder = t('bodyPlaceholder');
  $('#tagInput').placeholder = t('tagPlaceholder');
  [['#shopNameInput', 'shopNamePh'], ['#shopPriceInput', 'shopPricePh'], ['#shopLinkInput', 'shopLinkPh'], ['#shopNoteInput', 'shopNotePh']]
    .forEach(pair => { const el = $(pair[0]); if (el) el.placeholder = t(pair[1]); });
  document.documentElement.lang = code;
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

function avatarHTML(p, size){
  const cls = 'avatar-' + size;
  const src = p.avatar || (isMeWriter(p) ? ME_AVATAR : '');
  if (src) return '<img class="avatar ' + cls + '" src="' + escAttr(src) + '" alt="" width="' + size + '" height="' + size + '">';
  const letter = (p.nick || '?').trim().charAt(0).toUpperCase();
  return '<span class="avatar-fallback ' + cls + '" aria-hidden="true">' + esc(letter) + '</span>';
}

function tagChipHTML(tag, i, count, label){
  const c = DC[i % DC.length];
  const n = count ? '<b class="chip-n">' + count + '</b>' : '';
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
    link: String(p.link || ''),
    note: String(p.note || ''),
    mediaId: p.mediaId || null,
    ts: Number(p.ts) || Date.now(),
  }));
  shop = d;
}

function saveShopStore(){
  try { localStorage.setItem(SHOP_KEY, JSON.stringify(shop)); }
  catch (e) { toast(getLang() === 'ko' ? '저장 공간이 부족해요' : 'Storage is full'); }
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
  const photo = (hit && hit.url)
    ? '<img class="shop-card-img" src="' + escAttr(hit.url) + '" alt="" loading="lazy" data-shop-view="' + escAttr(p.id) + '">'
    : '<div class="shop-card-noimg"><img src="./img/momo-avatar.jpg" alt="" width="56" height="56"></div>';
  const price = p.price ? '<div class="shop-card-price">' + esc(p.price) + '</div>' : '';
  const say = p.note
    ? '<div class="shop-say">'
      + '<img class="shop-say-ava" src="./img/momo-avatar.jpg" alt="" width="32" height="32">'
      + '<div class="shop-bubble"><p class="shop-bubble-text">' + esc(p.note) + '</p>' + shopTranslateRow(p) + '</div>'
      + '</div>'
    : '';
  const open = p.link
    ? '<a class="pill shop-open" href="' + escAttr(p.link) + '" target="_blank" rel="noopener noreferrer">' + esc(t('shopOpen')) + '</a>'
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
  if (!/^image\//.test(file.type)) { toast(t('shopPhotoBad')); return; }
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
  if (link && !/^https?:\/\//i.test(link)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(link)) link = 'https://' + link;
    else { toast(t('shopLinkBad')); $('#shopLinkInput').focus(); return; }
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
    +       (p.editedAt ? '<span class="edited-mark">' + esc(t('edited')) + '</span>' : '')
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
    main.innerHTML =
      '<div class="view-head"><h2 class="view-title">' + esc(t('myTitle')) + '</h2>'
      + '<span class="view-sub">' + esc(state.me.nick) + ' <span class="me-role">\u00b7 ' + esc(t('meRole')) + '</span></span></div>'
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
  $('#scrim').addEventListener('click', () => {
    if (!$('#composeSheet').hidden) closeSheet($('#composeSheet'));
    if (!$('#shopSheet').hidden) closeSheet($('#shopSheet'));
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

  const langBtn = $('#langBtn'), langMenu = $('#langMenu');
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); langMenu.hidden = !langMenu.hidden; langBtn.setAttribute('aria-expanded', String(!langMenu.hidden)); });
  langMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.lang-item');
    if (!item) return;
    localStorage.setItem(LANG_KEY, item.dataset.code);
    langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false');
    trState = {};          /* translations are per language: start fresh */
    shopTr = {};
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
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeViewer();
    if (!$('#composeSheet').hidden) closeSheet($('#composeSheet'));
    if (!$('#shopSheet').hidden) closeSheet($('#shopSheet'));
  });

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

  ensureMedia();
  resolveShopMedia();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
})();
