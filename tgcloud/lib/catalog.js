/**
 * Full service & country catalog for Numberland.
 * Includes popular quick-picks, full searchable directories, and fast lookup maps.
 */

export const POPULAR_SERVICE_CODES = [
  'tg', 'wa', 'go', 'dr', 'ig', 'tw',
  'fb', 'ds', 'mm', 'lf', 'am', 'ts',
];

export const SERVICE_EMOJIS = {
  tg: '✈️',
  wa: '💬',
  go: '🔍',
  dr: '🤖',
  ig: '📸',
  tw: '🐦',
  fb: '📘',
  ds: '🎮',
  mm: '🪟',
  lf: '🎵',
  am: '📦',
  ts: '💳',
  wx: '🍎',
  ub: '🚗',
  nv: '🎬',
  vi: '💜',
  wb: '🛍️',
  ot: '📱',
};

export const POPULAR_COUNTRY_IDS = [
  '187', '16', '36', '48', '43', '78',
  '6', '4', '22', '73', '15', '117',
];

// Compact [code, name] tuples for all supported services
const RAW_SERVICES = [["wp", "163СOM"], ["hn", "1688"], ["ahs", "1and1"], ["wj", "1хbet"], ["lh", "24betting"], ["erc", "2domains"], ["qi", "32red"], ["hk", "4FunLite"], ["exc", "51exchange"], ["ll", "888casino"], ["fw", "99acres"], ["ki", "99app"], ["qkb", "99Game"], ["amq", "99k Outlet"], ["acv", "A23"], ["gn", "A9A"], ["ags", "Abbott"], ["rh", "Ace2Three"], ["amf", "Acko"], ["ko", "AdaKami"], ["bq", "Adani"], ["an", "Adidas"], ["agw", "Adverts"], ["aip", "AfreecaTV"], ["sa", "AGIBANK"], ["ag", "Agoda"], ["cs", "AgriDevelop"], ["qu", "Agroinform"], ["uk", "Airbnb"], ["zl", "Airtel"], ["acy", "Airtime"], ["wv", "AIS"], ["jj", "Aitu"], ["rf", "Akudo"], ["tm", "Akulaku"], ["aav", "Alchemy"], ["bt", "Alfa"], ["bn", "Alfagift"], ["lp", "Algida"], ["ab", "Alibaba"], ["hx", "AliExpress"], ["hw", "Alipay/Alibaba/1688"], ["ajy", "All Access"], ["yn", "Allegro"], ["nh", "AlloBank"], ["al", "Altyn-i"], ["yo", "Amasia"], ["am", "Amazon"], ["afi", "Ame Digital"], ["aee", "Amway"], ["aha", "Angel One"], ["agh", "Anibis"], ["alg", "Ankama"], ["ot", "Any service"], ["pm", "AOL"], ["ml", "ApostaGanha"], ["wx", "Apple"], ["gk", "AptekaRU"], ["rq", "AptekiPlus"], ["aco", "AR Lens"], ["abt", "ArenaPlus"], ["amo", "Argent"], ["hs", "Asda"], ["ajp", "AsiaMiles"], ["afd", "Astra Otoshop"], ["aem", "AstraPay"], ["gr", "Astropay"], ["atb", "Atlasbus"], ["du", "AUBANK"], ["aup", "Aurora.plus"], ["kd", "Author24"], ["aej", "Autoru"], ["ajl", "av100pro"], ["av", "avito"], ["ff", "AVON"], ["aws", "AWS"], ["aaw", "Aya Bank"], ["azs", "Azsirbis"], ["avu", "B4U"], ["qv", "Badoo"], ["li", "Baidu"], ["agy", "Baihe"], ["agq", "Bajaj Finserv"], ["hl", "Band"], ["ajd", "Bankera"], ["nms", "banki.ru"], ["aev", "BankKaro"], ["bnk", "Bankoff"], ["vc", "Banqi"], ["afh", "Banrisul"], ["bzs", "Bazarstore"], ["cb", "Bazos"], ["alu", "BC Game"], ["adf", "BCA Syariah"], ["aar", "Bearwww"], ["aly", "Bebeclub"], ["acx", "beboo"], ["abd", "BeeBoo"], ["ov", "Beget"], ["ck", "BeReal"], ["ie", "bet365"], ["agl", "Betano"], ["vd", "Betfair"], ["aab", "BharatPe"], ["zn", "Biedronka"], ["zu", "BigC"], ["vcc", "BigCash"], ["bgl", "Biglion"], ["bl", "BIGO LIVE"], ["zs", "Bilibili"], ["ri", "BillMill"], ["uv", "BinBin"], ["qjd", "Bingo101"], ["ww", "BIP"], ["el", "Bisu"], ["qk", "Bit"], ["pt", "Bitaqaty"], ["lt", "BitClout"], ["ahx", "Bitrue"], ["ht", "Bitso"], ["bjp", "Bjp"], ["ua", "BlaBlaCar"], ["akq", "Blank Street"], ["fk", "BLIBLI"], ["bz", "Blizzard"], ["rw", "BLS-SPAIN"], ["qn", "Blued"], ["ajr", "boku"], ["tx", "Bolt"], ["acp", "BonusLink"], ["akg", "Book My Play"], ["bok", "Book24"], ["adr", "Boosty"], ["btl", "BotIm"], ["aax", "Boyaa"], ["aci", "BPJS"], ["abu", "BPJSTK"], ["jw", "Br777"], ["sy", "Brahma"], ["vo", "Brand20ua"], ["aiz", "Brevo"], ["ahm", "BRO"], ["bdb", "Broadblue"], ["vt", "Budget4me"], ["zt", "Budweiser"], ["bff", "Buff.163"], ["kh", "Bukalapak"], ["mo", "Bumble"], ["afc", "Bunda"], ["ahe", "Bunq"], ["ip", "Burger King"], ["adx", "BusyFly"], ["iu", "Bykea"], ["abi", "BytePlus"], ["aff", "C6 Bank"], ["adp", "Cabify"], ["uo", "CafeBazaar"], ["my", "CAIXA"], ["gw", "CallApp"], ["cpl", "Capitalist"], ["cpt", "Capture"], ["ls", "Careem"], ["gj", "Carousell"], ["it", "CashApp"], ["oy", "CashFly"], ["ii", "CashKaro"], ["ld", "Cashmine"], ["pc", "Casino/bet/gambling"], ["alz", "CasinoAndFriends"], ["wd", "CasinoPlus"], ["ho", "Cathay"], ["afa", "CDEK"], ["pq", "CDkeys"], ["ix", "Celcoin"], ["ai", "CELEBe"], ["td", "ChaingeFinance"], ["akn", "Chakra Rewards"], ["cha", "Chase"], ["dr", "ChatGPT"], ["acd", "CheckDomain"], ["chi", "Checkin"], ["chs", "Checkscan"], ["afk", "Chevron"], ["chb", "CHIBBIS"], ["ir", "Chispa"], ["adv", "Cian"], ["si", "Cita Previa"], ["az", "CityBase"], ["acu", "CityMall"], ["yf", "Citymobil"], ["acz", "Claude"], ["hf", "Cleartrip"], ["cle", "ClickEntregas"], ["fe", "CliQQ"], ["ael", "Cloud Manager"], ["jn", "CloudBet"], ["dd", "CloudChat"], ["et", "Clubhouse"], ["agm", "CMB"], ["ql", "CMTcuzdan"], ["abb", "Coca-Cola"], ["oe", "Codashop"], ["pn", "CoffeeLike"], ["ajo", "CoffeeTea"], ["cfx", "Cofix"], ["re", "Coinbase"], ["ne", "Coindcx"], ["xy2", "CoinFantasy"], ["vw", "CoinField"], ["ctt", "Coinut"], ["acg", "CollabAct"], ["zx", "CommunityGaming"], ["amn", "constitutioner"], ["jv", "Consultant"], ["eg", "ContactSys"], ["om", "Corona"], ["aby", "Couponscom"], ["yg", "CourseHero"], ["wc", "Craigslist"], ["ahg", "Credcesta"], ["ax", "CrefisaMais"], ["lu", "Crickpe"], ["sx", "Crowdtap"], ["ti", "cryptocom"], ["ahh", "Cumbuca"], ["aje", "CupidMedia"], ["abp", "D5BET"], ["akk", "Dagangan"], ["ahi", "Daki"], ["fr", "Dana"], ["aju", "Daya Auto"], ["tj", "dbrUA"], ["oc", "DealShare"], ["zk", "Deliveroo"], ["dt", "Delivery Club"], ["zz", "Dent"], ["xy", "Depop"], ["lx", "DewuPoison"], ["os", "Dhani"], ["xk", "DiDi"], ["zv", "Digikala"], ["ake", "DIKIDI"], ["ds", "Discord"], ["ame", "Discover Hong Kong"], ["ud", "Disney Hotstar"], ["dw", "Divar"], ["sd", "DoDo pizza"], ["akl", "DOKU"], ["dz", "Dominos Pizza"], ["agv", "DoneDeal"], ["ac", "Doordash"], ["bx", "Dosi"], ["dsm", "Dosmart"], ["sv", "Dostavista"], ["cj", "Dotz"], ["ak", "Douyu"], ["ve", "Dream11"], ["hz", "Drom"], ["fi", "Dundle"], ["le", "E bike Gewinnspiel"], ["adl", "EarnEasy"], ["akj", "Easycash"], ["rz", "EasyPay"], ["dh", "eBay"], ["te", "eFood"], ["epl", "El-plat"], ["uf", "Eneba"], ["aek", "EnerGO"], ["cba", "ENILIVE"], ["eng", "EnticeGames"], ["ah", "EscapeFromTarkov"], ["alq", "Etsy"], ["yj", "eWallet"], ["ba", "Expressmoney"], ["kr", "Eyecon"], ["db", "ezbuy"], ["rm", "Faberlic"], ["fb", "Facebook"], ["qz", "Faceit"], ["alc", "Facily"], ["fal", "Falla"], ["xn", "Familia"], ["xy1", "Fanball"], ["lm", "FarPost"], ["fss", "FARШ"], ["mr", "Fastmail"], ["ws", "Feeld"], ["akd", "Feels"], ["ait", "FeetFinder"], ["ug", "Fiqsy"], ["adm", "FitCredit"], ["cn", "fiverr"], ["fxp", "FixPrice"], ["ahy", "Fliff"], ["agn", "Flik"], ["tv", "Flink"], ["aew", "Flip"], ["xt", "Flipkart"], ["flo", "flor2u"], ["aeg", "Flowwow"], ["iy", "FoodHub"], ["abe", "Foodora"], ["nz", "Foodpanda"], ["kw", "Foody"], ["flc", "Foot Locker"], ["gu", "Fora"], ["ajg", "Fortumo"], ["xg", "FortunaSK"], ["amc", "Fortune Slots"], ["rk", "Fotka"], ["kq", "FotoCasa"], ["wz", "FoxFord"], ["kg", "FreeChargeApp"], ["gq", "Freelancer"], ["zb", "FreeNow"], ["nj", "FreshKarta"], ["fcl", "FriendsClub"], ["abz", "Friendtech"], ["adh", "Frizza"], ["mv", "Fruitz"], ["ahf", "Fugeelah"], ["ng", "FunPay"], ["aih", "Fups"], ["od", "FWDMAX"], ["aja", "G2A"], ["bk", "G2G"], ["ou", "Gabi"], ["xe", "GalaxyChat"], ["af", "GalaxyWin"], ["wn", "GameArena"], ["pa", "Gamekit"], ["ed", "Gamer"], ["afx", "Gamesofa"], ["gts", "Gamestheshop"], ["bc", "GCash"], ["cg", "Gemgala"], ["ajm", "Gener8"], ["ul", "Getir"], ["cz", "Getmega"], ["aiu", "GetNinjas"], ["ajs", "GetPlus"], ["ala", "GetResponse"], ["gt", "Gett"], ["qe", "GG"], ["nn", "Giftcloud"], ["jd", "GiraBank"], ["nk", "Gittigidiyor"], ["iz", "Global24"], ["gl", "GlobalTel"], ["hm", "Globus"], ["aq", "Glovo"], ["ams", "GlowRoad"], ["mq", "GMNG"], ["abk", "GMX"], ["ads", "GoChat"], ["ez", "GoerliFaucet"], ["bp", "GoFundMe"], ["ni", "Gojek"], ["aky", "GOMOFY"], ["lv", "Google Voice"], ["gy", "Google YT"], ["go", "Google,youtube,Gmail"], ["gch", "GoogleChat"], ["gms", "Googlemessenger"], ["gf", "GoogleVoice"], ["aeb", "GoPayz"], ["ajn", "Gopuff"], ["amk", "GORDAN"], ["afe", "GovBr"], ["abl", "gpnbonus"], ["jg", "Grab"], ["agd", "Grailed"], ["als", "Greggs"], ["aet", "Greywoods"], ["yw", "Grindr"], ["ln", "Grofers"], ["xs", "GroupMe"], ["grz", "Grozd"], ["alb", "Guiche Web"], ["gul", "Gulliver-ul"], ["akb", "Gurmanika"], ["ik", "GuruBets"], ["gh", "GyFTR"], ["ach", "Haleon"], ["rp", "hamrahaval"], ["sj", "HandyPick"], ["aks", "Hanya"], ["df", "Happn"], ["sp", "HappyFresh"], ["or", "HAPPYTUK"], ["au", "Haraj"], ["hdf", "HDFC ERGO"], ["agp", "hdfcbank"], ["gx", "Hepsiburadacom"], ["en", "Hermes"], ["vx", "HeyBox"], ["ss", "Hezzl"], ["yh", "hh"], ["rt", "hily"], ["vz", "Hinge"], ["aii", "Hinge Dating"], ["hyc", "Hiyachat"], ["hff", "Hoff"], ["ru", "HOP"], ["jl", "Hopi"], ["gi", "Hotline"], ["kp", "HQ Trivia"], ["un", "Humble bundle"], ["gv", "Humta"], ["hun", "Hunter"], ["pp", "Huya"], ["dq", "IceCasino"], ["amj", "ICNKR"], ["iq", "icq"], ["cx", "Icrypex"], ["kk", "Idealista"], ["pd", "iFood"], ["akp", "iHerb"], ["ib", "Immowelt"], ["im", "Imo"], ["iv", "Inboxlv"], ["tp", "IndiaGold"], ["zq", "IndiaPlays"], ["ajw", "INDOBA"], ["ju", "Indomaret"], ["rl", "inDriver"], ["xi", "InFund"], ["hy", "Ininal"], ["inp", "Innopay"], ["ig", "Instagram+Threads"], ["ino", "internetopros"], ["ajf", "iPanelOnline"], ["yv", "IPLwin"], ["agk", "Ipsos iSay"], ["es", "iQIYI"], ["il", "IQOS"], ["cf", "irancell"], ["us", "IRCTC"], ["ad", "Iti"], ["dm", "Iwplay"], ["lc", "IYC"], ["wt", "IZI"], ["ea", "JamesDelivery"], ["za", "JDcom"], ["jgd", "Jingdong"], ["aec", "JinJiang"], ["aay", "JioMart"], ["agz", "Jiva Petani"], ["hr", "JKF"], ["ic", "JoGo"], ["xx", "Joyride"], ["yx", "JTExpress"], ["hi", "JungleeRummy"], ["pu", "Justdating"], ["aig", "K11"], ["abx", "Kaching"], ["zo", "Kaggle"], ["ks", "Kakao Story"], ["kt", "KakaoTalk"], ["aed", "Kamatera"], ["de", "Karusel"], ["jz", "Kaya"], ["ol", "KazanExpress"], ["ajx", "Kemnaker RI"], ["bf", "Keybase"], ["ra", "KeyPay"], ["fz", "KFC"], ["adk", "Khatabook"], ["aid", "Kia"], ["afo", "KION"], ["uw", "Kirana"], ["afz", "Klarna"], ["klz", "kleinanzeigen"], ["kl", "kolesa.kz"], ["kpc", "kopilkaclub"], ["pv", "Koshelek"], ["rv", "Kotak811"], ["kyk", "Krasyar"], ["sq", "KuCoinPlay"], ["kb", "kufarby"], ["vp", "Kwai"], ["er", "Kwork"], ["vq", "LadyMaria"], ["fh", "Lalamove"], ["sb", "Lamoda"], ["dl", "Lazada"], ["bb", "LazyPay"], ["pi", "Lebocoin"], ["do", "Leboncoin"], ["rd", "Lenta"], ["pz", "Lidl"], ["lfp", "Lifepay"], ["oo", "LigaPro"], ["xf", "LightChat"], ["lkc", "LikeCentre"], ["jf", "Likee"], ["me", "Line messenger"], ["aka", "LinkAja"], ["tn", "LinkedIN"], ["ex", "Linode"], ["alh", "Lion Parcel"], ["lft", "Liveme"], ["eu", "LiveScore"], ["di", "Loanflix"], ["lcb", "localbitcoins"], ["su", "LOCO"], ["mk", "LongHu"], ["akm", "LOTTE Mart"], ["zi", "LoveLocal"], ["oj", "LoveRu"], ["lkb", "LuckyBike"], ["acc", "LuckyLand Slots"], ["qkc", "Ludo24"], ["dj", "LUKOIL-AZS"], ["ale", "Lydia"], ["tu", "Lyft"], ["gz", "LYKA"], ["afq", "MagaLu"], ["hq", "Magicbricks"], ["ade", "Magicpin"], ["up", "Magnolia"], ["ma", "Mail.ru"], ["lb", "Mailru Group"], ["fd", "Mamba, MeetMe"], ["oh", "MapleSEA"], ["bm", "MarketGuru"], ["hd", "MarketPapa"], ["agj", "Marktplaats"], ["agu", "Marlboro"], ["adg", "Marwadi"], ["mxd", "Maxidom"], ["ahl", "Maxim"], ["act", "Maxis"], ["afb", "Maybank"], ["ry", "McDonalds"], ["lg", "MediBuddy"], ["hp", "Meesho"], ["agx", "MeiQFashion"], ["agf", "Meitu"], ["acj", "Meituan"], ["uy", "Meliuz"], ["alp", "Mera Gaon"], ["cq", "Mercado"], ["abf", "Mercado Pago"], ["dg", "Mercari"], ["vy", "Meta"], ["bv", "Metro"], ["he", "Mewt"], ["mxc", "Mexc"], ["mc", "Michat"], ["mm", "Microsoft"], ["ey", "miloan"], ["op", "MIRATORG"], ["yr", "Miravia"], ["amh", "MitID"], ["bg", "MIXMART"], ["fo", "MobiKwik"], ["wk", "Mobile01"], ["aht", "MockGuru"], ["gm", "mocospace"], ["hc", "MOMO"], ["py", "Monese"], ["xp", "MonetaRu"], ["qo", "Moneylion"], ["qg", "MoneyPay"], ["qt", "MoneyСontrol"], ["ji", "Monobank"], ["bu", "MonobankIndia"], ["mop", "Mosopen"], ["ce", "mosru"], ["ajz", "MotionPay"], ["vr", "MotorkuX"], ["aix", "Move It"], ["mh", "Moydvor71"], ["mpr", "Mproxy"], ["lw", "MrGreen"], ["ej", "MrQ"], ["age", "MTR Mobile"], ["da", "MTS CashBack"], ["mul", "Multinet"], ["alm", "Muzz"], ["tk", "MVideo"], ["ha", "My11Circle"], ["fmm", "MyBeautyBonus"], ["afm", "myboost"], ["ur", "MyDailyCash"], ["qa", "MyFishka"], ["ae", "myGLO"], ["iw", "MyLavash"], ["fy", "Mylove"], ["mu", "MyMusicTaste"], ["nl", "Myntra"], ["ajq", "MyValue"], ["jm", "mzadqatar"], ["abn", "Namars"], ["je", "Nanovest"], ["na", "NationalLottery"], ["nv", "Naver"], ["sw", "NCsoft"], ["rn", "neftm"], ["aft", "Neocrypto"], ["aex", "Neon"], ["aij", "NEQUI"], ["aaq", "Netease"], ["nf", "Netflix"], ["aey", "Next"], ["ef", "Nextdoor"], ["ald", "Nice88"], ["px", "Nifty"], ["ew", "Nike"], ["kz", "NimoTV"], ["agi", "Njuškalo"], ["aiy", "nloto"], ["nmi", "NMI"], ["dv", "NoBroker"], ["tf", "Noon"], ["xo", "Notifire"], ["ms", "NovaPoshta"], ["nov", "Novex"], ["pg", "NRJ Music Awards"], ["zy", "Nttgame"], ["aaa", "Nubank"], ["alx", "NutriClub"], ["opl", "O-plati"], ["zm", "OfferUp"], ["uz", "OffGamers"], ["ogn", "Ogon"], ["vm", "OkCupid"], ["okk", "okk4.bet"], ["og", "Okko"], ["lr", "Okta"], ["ly", "Olacabs"], ["ns", "Oldubil"], ["akf", "Ollis"], ["sn", "OLX"], ["aj", "OneAset"], ["agg", "OneForma"], ["ue", "Onet"], ["ob", "Onlinerby"], ["zf", "OnTaxi"], ["ahd", "OpenPhone"], ["lo", "Oppo"], ["omd", "Orbimed"], ["qh", "Oriflame"], ["ost", "Ostin"], ["xh", "OVO"], ["aaz", "Ozan"], ["aic", "Ozan SuperApp"], ["sg", "OZON"], ["afw", "Packeta"], ["cw", "PaddyPower"], ["abg", "PagBank"], ["gg", "PagSmile"], ["dk", "Pairs"], ["akz", "Panvel"], ["zr", "Papara"], ["wo", "Parkplus"], ["dn", "Paxful"], ["qb", "Payberry"], ["akc", "Paybis"], ["xz", "paycell"], ["nc", "Payoneer"], ["ts", "PayPal"], ["jq", "Paysafecard"], ["tr", "Paysend"], ["ge", "Paytm"], ["yp", "Payzapp"], ["pcp", "PciPay"], ["at", "Perfluence"], ["fx", "PGbonus"], ["fc", "PharmEasy"], ["fp", "Phound"], ["ev", "Picpay"], ["zp", "Pinduoduo"], ["ro", "PingCode"], ["jh", "PingPong"], ["sz", "Pivko24"], ["ahp", "PizzaHut"], ["aer", "PlayerAuctions"], ["abs", "Playerzpot"], ["adc", "PlayOJO"], ["ch", "Pocket52"], ["aag", "Pockit"], ["pj", "Podeli"], ["pf", "pof.com"], ["pco", "Pokemon Center Online"], ["rg", "Porbet"], ["oz", "Poshmark"], ["adb", "PoshVine"], ["lq", "Potato"], ["fj", "Potato Chat"], ["dx", "Powerkredite"], ["aio", "Prakerja"], ["po", "premium.one"], ["akh", "Prenagen Club"], ["aiq", "Prime Opinion"], ["afs", "Privalia"], ["wu", "PrivetMir"], ["abr", "Privy"], ["aa", "Probo"], ["alo", "Profee"], ["rpp", "Profi"], ["cm", "Prom"], ["dp", "ProtonMail"], ["aga", "Publi24"], ["amm", "punjab citizen"], ["lk", "PurePlatfrom"], ["ny", "Pyro Music"], ["vf", "Q12 Trivia"], ["qw", "QIWl"], ["eq", "Qoo10"], ["zw", "Quack"], ["cc", "Quipp"], ["alr", "Qunar"], ["acr", "QwikCilver"], ["acn", "Radium"], ["rkn", "Rakuten"], ["tc", "Rambler"], ["aba", "Rappi"], ["acm", "Razer"], ["jp", "Rbt"], ["ajj", "Rebtel"], ["xu", "RecargaPay"], ["qf", "RedBook"], ["ci", "redBus"], ["co", "Rediffmail"], ["ow", "RegRu"], ["aln", "Remotasks"], ["ij", "Revolut"], ["zj", "ROBINHOOD"], ["aau", "RockeTreach"], ["afn", "roomster"], ["ga", "Roposo"], ["qm", "RosaKhutor"], ["rnf", "Rosneft"], ["aif", "Royal Canin"], ["ku", "RoyalWin"], ["km", "Rozetka"], ["mn", "RRSA"], ["rs", "RSSA"], ["rmb", "Rumble"], ["adj", "RummyCircle"], ["ec", "RummyCulture"], ["fl", "RummyLoot"], ["xb", "RummyOla"], ["so", "RummyWealth"], ["kv", "Rush"], ["ay", "Ruten"], ["ui", "RuTube"], ["ako", "Ryde"], ["shb", "Sahibinden"], ["gs", "SamsungShop"], ["lj", "Santander"], ["amg", "SBI Card"], ["qjk", "Sbmurban"], ["ais", "Schibsted"], ["ahq", "SEEDS"], ["alt", "Segari"], ["pw", "SellMonitor"], ["vv", "Seosprint"], ["ago", "Servify"], ["zg", "Setel"], ["adu", "Seznam"], ["ajv", "ShareParty"], ["rx", "Sheerid"], ["shn", "Shein"], ["vg", "ShellBox"], ["ka", "Shopee"], ["ze", "Shpock"], ["bw", "Signal"], ["fs", "Şikayet var"], ["alk", "Singcity"], ["np", "Siply"], ["qbs", "Sixer"], ["eo", "Sizeer"], ["afj", "SKCAPITAL"], ["wg", "Skout"], ["sk", "Skroutz"], ["rc", "Skype"], ["pb", "SkyTV"], ["aim", "Smartfren"], ["ado", "SmartyPig"], ["agb", "Smiles"], ["wm", "SMO71"], ["fu", "Snapchat"], ["ph", "SnappFood"], ["sf", "SneakersnStuff"], ["ia", "Socios"], ["abw", "Sokolov"], ["akx", "Sony LIV"], ["jy", "Sorare"], ["mx", "SoulApp"], ["ain", "SpaceWeb"], ["acb", "Spark Driver"], ["spp", "Spartanpoker"], ["ky", "SpatenOktoberfest"], ["va", "SportGully"], ["cd", "SpotHit"], ["alj", "Spotify"], ["nt", "Sravni"], ["la", "ssoidnet"], ["sr", "Starbucks"], ["stc", "Stars Coffee"], ["mt", "Steam"], ["sm", "Steam Knight"], ["jo", "SticPay"], ["ali", "StockyDodo"], ["vj", "Stormgain"], ["ahj", "Strato"], ["nu", "Stripe"], ["aiv", "Striving in the Lion City"], ["aca", "Sunlight"], ["acq", "Suntec"], ["ca", "SuperS"], ["ahv", "Surveybell"], ["gd", "Surveytime"], ["swg", "Swagbucks"], ["qji", "Swarail"], ["jx", "Swiggy"], ["hg", "Switips"], ["tq", "Swvl"], ["xc", "SynotTip"], ["tal", "Taala"], ["aw", "Taikang"], ["xw", "Taki"], ["ei", "Taksheel"], ["tlb", "Talabat"], ["aat", "TamTam"], ["xr", "Tango"], ["aei", "Tanoti"], ["wh", "TanTan"], ["tit", "Tanukifamily"], ["qd", "Taobao"], ["abc", "Taptap Send"], ["acs", "Tata CLiQ Palette"], ["ace", "Tata Neu"], ["uc", "Tatneft"], ["ami", "TEAMORU"], ["ih", "TeenPattiStarpro"], ["tg", "Telegram"], ["eh", "Telegram 2.0"], ["ep", "Temu"], ["qq", "Tencent QQ"], ["cr", "TenChat"], ["pla", "TestoviyPokunochnik"], ["aeu", "TheFork"], ["lz", "Things"], ["ahr", "This Fate"], ["nm", "Thisshop"], ["rb", "Tick"], ["gp", "Ticketmaster"], ["alv", "TIER"], ["aki", "tiketcom"], ["lf", "TikTok/Douyin"], ["oi", "Tind swipe app"], ["aap", "Tiptapp"], ["air", "TipTip"], ["acl", "Tiv"], ["xd", "Tokopedia"], ["ack", "Tomato"], ["uq", "TopDetal"], ["nr", "Tosla"], ["fm", "Touchance"], ["bs", "TradeUP"], ["gc", "TradingView"], ["mw", "Transfergo"], ["abj", "Trembet"], ["pr", "Trendyol"], ["tl", "Truecaller"], ["ada", "TRUTH SOCIAL"], ["jt", "TurkiyePetrolleri"], ["afy", "Tuul"], ["ee", "Twilio"], ["hb", "Twitch"], ["tw", "Twitter"], ["aho", "UangMe"], ["ub", "Uber"], ["ahb", "Ubisoft"], ["ubx", "UBOX"], ["cp", "Uklon"], ["hu", "Ukrnet"], ["afr", "Ultragaz"], ["qjz", "Unibit11"], ["hh", "Uplay"], ["abq", "Upwork"], ["agt", "Uralairlines"], ["of", "urent/jet/RuSharing"], ["bh", "Uteka"], ["ao", "UU163"], ["cl", "UWIN"], ["adq", "Uzum"], ["yy", "Venmo"], ["ajk", "Venteny"], ["amb", "Vercel"], ["amp", "VerifyKit"], ["kn", "Verse"], ["afp", "VFS GLOBAL"], ["vi", "Viber"], ["alw", "Vida"], ["fv", "Vidio"], ["agc", "VIMpay"], ["kc", "Vinted"], ["no", "Virgo"], ["kx", "Vivo"], ["vk", "Vkontakte"], ["oq", "Vlife"], ["sc", "Voggt"], ["voi", "VoiStock"], ["eb", "Voltz"], ["afl", "Vsesmart"], ["abh", "Vulkan Vegas"], ["wr", "Walmart"], ["cv", "WashXpress"], ["ajh", "WAUG"], ["abo", "WEBDE"], ["alf", "WEBULL"], ["wb", "WeChat"], ["amr", "Weex"], ["kf", "Weibo"], ["mf", "Weidian"], ["wlf", "WellF"], ["th", "WestStein"], ["ja", "Weverse"], ["wa", "Whatsapp"], ["qj", "Whoosh"], ["uu", "Wildberries"], ["adt", "willhaben"], ["akw", "WINDS"], ["wnl", "Winelab"], ["jb", "Wing Money"], ["ta", "Wink"], ["mp", "Winmasters"], ["qeg", "Winmatch"], ["acf", "Winter Loan"], ["qko", "Winzap"], ["vs", "WinzoGame"], ["bo", "Wise"], ["xv", "Wish"], ["wyc", "With IYC"], ["xl", "Wmaraci"], ["rr", "Wolt"], ["wmp", "Womply"], ["ar", "Wondermart"], ["won", "WonderTicket"], ["ama", "WooPlus"], ["qx", "WorldRemit"], ["bd", "X5ID"], ["fa", "XadrezFeliz"], ["aml", "Xbox"], ["yu", "Xiaomi"], ["nw", "Ximalaya"], ["xqq", "XQ"], ["akt", "xworldwallet"], ["aas", "XXGame"], ["vn", "Yaay"], ["mb", "Yahoo"], ["yl", "Yalla"], ["wy", "Yami"], ["ya", "Yandex"], ["wf", "YandexGo"], ["kj", "YAPPY"], ["yi", "Yemeksepeti"], ["dc", "YikYak"], ["agr", "Yonogames"], ["acw", "YouDo"], ["wl", "YouGotaGift"], ["gb", "YouStar"], ["uh", "Yubo"], ["adn", "Zach Bryan"], ["ye", "ZaleyCash"], ["mj", "Zalo"], ["ahw", "Zasilkovna"], ["ys", "ZCity"], ["ps", "Zdorov"], ["em", "ZéDelivery"], ["afg", "Zenvia"], ["adi", "Zepto"], ["qy", "Zhihu"], ["tt", "Ziglu"], ["zd", "Zilch"], ["zh", "Zoho"], ["mz", "Zolushka"], ["dy", "Zomato"], ["ail", "Zoo Game"], ["zon", "Zoon"], ["zub", "Zubi"], ["mi", "Zupee"], ["aik", "ZUS Coffee"], ["aeh", "Аптека Апрель"], ["st", "Ашан"], ["md", "Банки"], ["ajb", "Бери заряд"], ["ahk", "БлинБери"], ["ft", "Букмекерские"], ["aef", "Велобайк"], ["nb", "Верный"], ["bj", "Вита экспресс"], ["sh", "ВкусВилл"], ["br", "Вкусно и Точка"], ["afu", "ВсеИнструменты"], ["gzp", "Газпром"], ["js", "Голос"], ["ajt", "Город"], ["rj", "Детский мир"], ["afv", "Джилекс"], ["ux", "Домовой"], ["we", "ДругВокруг"], ["io", "ЗдравСити"], ["zyy", "Золотая Корона"], ["aes", "Золотое Яблоко"], ["yb", "Квартплата+"], ["fq", "Контур"], ["vb", "Кораблик"], ["ahz", "Кузбасс Онлайн"], ["ct", "КухняНаРайоне"], ["tz", "Лейка"], ["xm", "Лэтуаль"], ["mg", "Магнит"], ["qp", "Максавит"], ["aji", "МИГРАНТ СЕРВИС"], ["qs", "МирЗнакомств"], ["ok", "Одноклассники"], ["ty", "Окей"], ["yz", "Около"], ["vl", "Ортека"], ["pl", "Перекресток"], ["ptr", "Петрович"], ["ajc", "Почта России"], ["qc", "Праймериз 2020"], ["adw", "Профи"], ["ahn", "Рив Гош"], ["cy", "РСА"], ["uj", "СhampionСasino"], ["jr", "Самокат"], ["sl", "СберАптека"], ["xj", "СберМаркет"], ["be", "СберМегаМаркет"], ["sbt", "Сберчаевые"], ["ybb", "Система Город"], ["yk", "СпортМастер"], ["hj", "Столото"], ["sut", "Суточно"], ["aiw", "СушиВёсла"], ["wtt", "Твоё"], ["ady", "ТОКИО-CITY"], ["xa", "УлыбкаРадуги"], ["abm", "Утконос"], ["yq", "Фокстрот"], ["aie", "Фотострана"], ["abv", "Халва"], ["chc", "ЧитайГород"], ["adz", "Шоколадница"], ["vh", "Штолле"], ["ke", "Эльдорадо"], ["ut", "Энергобум"], ["ym", "Юла"], ["bi", "勇仕网络Ys4fun"], ["cu", "炙热星河"], ["yd", "米画师Mihuashi"]];

// Compact [id, name, flag] tuples for all supported countries
const RAW_COUNTRIES = [["74", "Afghanistan", "🇦🇫"], ["155", "Albania", "🇦🇱"], ["58", "Algeria", "🇩🇿"], ["76", "Angola", "🇦🇴"], ["181", "Anguilla", "🇦🇮"], ["169", "Antigua and Barbuda", "🇦🇬"], ["39", "Argentina", "🇦🇷"], ["148", "Armenia", "🇦🇲"], ["179", "Aruba", "🇦🇼"], ["175", "Australia", "🇦🇺"], ["50", "Austria", "🇦🇹"], ["35", "Azerbaijan", "🇦🇿"], ["122", "Bahamas", "🇧🇸"], ["145", "Bahrain", "🇧🇭"], ["60", "Bangladesh", "🇧🇩"], ["118", "Barbados", "🇧🇧"], ["51", "Belarus", "🇧🇾"], ["82", "Belgium", "🇧🇪"], ["124", "Belize", "🇧🇿"], ["120", "Benin", "🇧🇯"], ["195", "Bermuda", "🇧🇲"], ["158", "Bhutan", "🇧🇹"], ["92", "Bolivia", "🇧🇴"], ["108", "Bosnia and Herzegovina", "🇧🇦"], ["123", "Botswana", "🇧🇼"], ["73", "Brazil", "🇧🇷"], ["121", "Brunei Darussalam", "🇧🇳"], ["83", "Bulgaria", "🇧🇬"], ["152", "Burkina Faso", "🇧🇫"], ["119", "Burundi", "🇧🇮"], ["24", "Cambodia", "🇰🇭"], ["41", "Cameroon", "🇨🇲"], ["36", "Canada", "🇨🇦"], ["186", "Cape Verde", "🇨🇻"], ["170", "Cayman islands", "🇰🇾"], ["125", "Central African Republic", "🇨🇫"], ["42", "Chad", "🇹🇩"], ["151", "Chile", "🇨🇱"], ["3", "China", "🇨🇳"], ["33", "Colombia", "🇨🇴"], ["133", "Comoros", "🇰🇲"], ["150", "Congo", "🇨🇬"], ["18", "Congo (Dem. Republic)", "🇨🇩"], ["93", "Costa Rica", "🇨🇷"], ["27", "Cote d'Ivoire/Ivory Coast", "🇨🇮"], ["45", "Croatia", "🇭🇷"], ["113", "Cuba", "🇨🇺"], ["77", "Cyprus", "🇨🇾"], ["63", "Czech Republic", "🇨🇿"], ["172", "Denmark", "🇩🇰"], ["168", "Djibouti", "🇩🇯"], ["126", "Dominica", "🇩🇲"], ["109", "Dominican Republic", "🇩🇴"], ["105", "Ecuador", "🇪🇨"], ["21", "Egypt", "🇪🇬"], ["101", "El Salvador", "🇸🇻"], ["167", "Equatorial Guinea", "🇬🇶"], ["176", "Eritrea", "🇪🇷"], ["34", "Estonia", "🇪🇪"], ["71", "Ethiopia", "🇪🇹"], ["189", "Fiji", "🇫🇯"], ["163", "Finland", "🇫🇮"], ["78", "France", "🇫🇷"], ["162", "French Guiana", "🇬🇫"], ["154", "Gabon", "🇬🇦"], ["28", "Gambia", "🇬🇲"], ["128", "Georgia", "🇬🇪"], ["43", "Germany", "🇩🇪"], ["38", "Ghana", "🇬🇭"], ["129", "Greece", "🇬🇷"], ["127", "Grenada", "🇬🇩"], ["160", "Guadeloupe", "🇬🇵"], ["94", "Guatemala", "🇬🇹"], ["68", "Guinea", "🇬🇳"], ["130", "Guinea-Bissau", "🇬🇼"], ["131", "Guyana", "🇬🇾"], ["26", "Haiti", "🇭🇹"], ["88", "Honduras", "🇭🇳"], ["14", "Hong Kong", "🇭🇰"], ["84", "Hungary", "🇭🇺"], ["132", "Iceland", "🇮🇸"], ["22", "India", "🇮🇳"], ["6", "Indonesia", "🇮🇩"], ["57", "Iran", "🇮🇷"], ["47", "Iraq", "🇮🇶"], ["23", "Ireland", "🇮🇪"], ["13", "Israel", "🇮🇱"], ["86", "Italy", "🇮🇹"], ["103", "Jamaica", "🇯🇲"], ["182", "Japan", "🇯🇵"], ["116", "Jordan", "🇯🇴"], ["2", "Kazakhstan", "🇰🇿"], ["8", "Kenya", "🇰🇪"], ["190", "Korea", "🇰🇷"], ["100", "Kuwait", "🇰🇼"], ["11", "Kyrgyzstan", "🇰🇬"], ["25", "Lao People's", "🇱🇦"], ["49", "Latvia", "🇱🇻"], ["153", "Lebanon", "🇱🇧"], ["136", "Lesotho", "🇱🇸"], ["135", "Liberia", "🇱🇷"], ["102", "Libya", "🇱🇾"], ["44", "Lithuania", "🇱🇹"], ["165", "Luxembourg", "🇱🇺"], ["20", "Macau", "🇲🇴"], ["183", "Macedonia", "🇲🇰"], ["17", "Madagascar", "🇲🇬"], ["137", "Malawi", "🇲🇼"], ["7", "Malaysia", "🇲🇾"], ["159", "Maldives", "🇲🇻"], ["69", "Mali", "🇲🇱"], ["199", "Malta", "🇲🇹"], ["114", "Mauritania", "🇲🇷"], ["157", "Mauritius", "🇲🇺"], ["54", "Mexico", "🇲🇽"], ["85", "Moldova", "🇲🇩"], ["144", "Monaco", "🇲🇨"], ["72", "Mongolia", "🇲🇳"], ["171", "Montenegro", "🇲🇪"], ["180", "Montserrat", "🇲🇸"], ["37", "Morocco", "🇲🇦"], ["80", "Mozambique", "🇲🇿"], ["5", "Myanmar", "🇲🇲"], ["138", "Namibia", "🇳🇦"], ["81", "Nepal", "🇳🇵"], ["48", "Netherlands", "🇳🇱"], ["185", "New Caledonia", "🇳🇨"], ["67", "New Zealand", "🇳🇿"], ["90", "Nicaragua", "🇳🇮"], ["139", "Niger", "🇳🇪"], ["19", "Nigeria", "🇳🇬"], ["174", "Norway", "🇳🇴"], ["107", "Oman", "🇴🇲"], ["66", "Pakistan", "🇵🇰"], ["188", "Palestine", "🇵🇸"], ["112", "Panama", "🇵🇦"], ["79", "Papua New Guinea", "🇵🇬"], ["87", "Paraguay", "🇵🇾"], ["65", "Peru", "🇵🇪"], ["4", "Philippines", "🇵🇭"], ["15", "Poland", "🇵🇱"], ["117", "Portugal", "🇵🇹"], ["97", "Puerto Rico", "🇵🇷"], ["111", "Qatar", "🇶🇦"], ["146", "Reunion", "🇷🇪"], ["32", "Romania", "🇷🇴"], ["0", "Russian Federation", "🇷🇺"], ["140", "Rwanda", "🇷🇼"], ["134", "Saint Kitts and Nevis", "🇰🇳"], ["164", "Saint Lucia", "🇱🇨"], ["166", "Saint Vincent and the Grenadines", "🇻🇨"], ["198", "Samoa", "🇼🇸"], ["178", "Sao Tome and Principe", "🇸🇹"], ["53", "Saudi Arabia", "🇸🇦"], ["61", "Senegal", "🇸🇳"], ["29", "Serbia", "🇷🇸"], ["184", "Seychelles", "🇸🇨"], ["115", "Sierra Leone", "🇸🇱"], ["196", "Singapore", "🇸🇬"], ["141", "Slovakia", "🇸🇰"], ["59", "Slovenia", "🇸🇮"], ["193", "Solomon Islands", "🇸🇧"], ["149", "Somalia", "🇸🇴"], ["31", "South Africa", "🇿🇦"], ["177", "South Sudan", "🇸🇸"], ["56", "Spain", "🇪🇸"], ["64", "Sri Lanka", "🇱🇰"], ["98", "Sudan", "🇸🇩"], ["142", "Suriname", "🇸🇷"], ["106", "Swaziland", "🇸🇿"], ["46", "Sweden", "🇸🇪"], ["173", "Switzerland", "🇨🇭"], ["110", "Syrian Arab Republic", "🇸🇾"], ["55", "Taiwan", "🇹🇼"], ["143", "Tajikistan", "🇹🇯"], ["9", "Tanzania", "🇹🇿"], ["52", "Thailand", "🇹🇭"], ["91", "Timor-Leste", "🇹🇱"], ["99", "Togo", "🇹🇬"], ["197", "Tonga", "🇹🇴"], ["104", "Trinidad and Tobago", "🇹🇹"], ["89", "Tunisia", "🇹🇳"], ["62", "Turkey", "🇹🇷"], ["161", "Turkmenistan", "🇹🇲"], ["75", "Uganda", "🇺🇬"], ["1", "Ukraine", "🇺🇦"], ["95", "United Arab Emirates", "🇦🇪"], ["16", "United Kingdom", "🇬🇧"], ["12", "United States vip", "🌍"], ["156", "Uruguay", "🇺🇾"], ["40", "Uzbekistan", "🇺🇿"], ["70", "Venezuela", "🇻🇪"], ["10", "Viet nam", "🇻🇳"], ["30", "Yemen", "🇾🇪"], ["147", "Zambia", "🇿🇲"], ["96", "Zimbabwe", "🇿🇼"], ["201", "Gibraltar", "🌍"], ["187", "United States", "🇺🇸"]];

const CLEAN_SERVICE_NAMES = {
  wa: 'WhatsApp',
  go: 'Google',
  ig: 'Instagram',
  lf: 'TikTok',
  tn: 'LinkedIn',
  tw: 'X (Twitter)',
  dr: 'ChatGPT',
  tg: 'Telegram',
};

const CLEAN_COUNTRY_NAMES = {
  '10': 'Vietnam',
  '0': 'Russia',
  '27': 'Ivory Coast',
  '110': 'Syria',
};

export const ALL_SERVICES = RAW_SERVICES.map(([code, name]) => ({
  code,
  name: CLEAN_SERVICE_NAMES[code.toLowerCase()] || name,
  emoji: '',
}));

export const ALL_COUNTRIES = RAW_COUNTRIES.map(([id, name, flag]) => ({
  id,
  name: CLEAN_COUNTRY_NAMES[id] || name,
  flag,
}));

export const SERVICE_BY_CODE = new Map(
  ALL_SERVICES.map((s) => [s.code.toLowerCase(), s])
);

export const COUNTRY_BY_ID = new Map(
  ALL_COUNTRIES.map((c) => [c.id, c])
);

export const POPULAR_SERVICES = POPULAR_SERVICE_CODES
  .map((code) => SERVICE_BY_CODE.get(code))
  .filter(Boolean);

export const POPULAR_COUNTRIES = POPULAR_COUNTRY_IDS
  .map((id) => COUNTRY_BY_ID.get(id))
  .filter(Boolean);

export function findService(code) {
  return SERVICE_BY_CODE.get(String(code || '').toLowerCase()) || null;
}

export function findCountry(id) {
  return COUNTRY_BY_ID.get(String(id || '')) || null;
}

export function findServiceName(code) {
  const item = findService(code);
  return item ? item.name : String(code).toUpperCase();
}

export function findCountryName(id) {
  const item = findCountry(id);
  return item ? `${item.flag} ${item.name}` : `Country #${String(id || '')}`;
}

export function searchServices(query, limit = 50) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return POPULAR_SERVICES;

  const exact = [];
  const starts = [];
  const contains = [];

  for (const s of ALL_SERVICES) {
    const code = s.code.toLowerCase();
    const name = s.name.toLowerCase();
    if (code === q || name === q) {
      exact.push(s);
    } else if (name.startsWith(q) || code.startsWith(q)) {
      starts.push(s);
    } else if (name.includes(q) || code.includes(q)) {
      contains.push(s);
    }
  }

  return [...exact, ...starts, ...contains].slice(0, limit);
}

export function searchCountries(query, limit = 50) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return POPULAR_COUNTRIES;

  const exact = [];
  const starts = [];
  const contains = [];

  for (const c of ALL_COUNTRIES) {
    const id = c.id.toLowerCase();
    const name = c.name.toLowerCase();
    if (id === q || name === q) {
      exact.push(c);
    } else if (name.startsWith(q)) {
      starts.push(c);
    } else if (name.includes(q) || id.includes(q)) {
      contains.push(c);
    }
  }

  return [...exact, ...starts, ...contains].slice(0, limit);
}
