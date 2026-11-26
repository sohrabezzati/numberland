(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  function applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('nl_theme', t);
    } catch {}
    const sun = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    if (sun && moon) {
      sun.classList.toggle('hidden', t !== 'dark');
      moon.classList.toggle('hidden', t === 'dark');
    }
    if (tg && typeof tg.setHeaderColor === 'function') {
      try {
        tg.setHeaderColor(t === 'dark' ? '#0b1120' : '#f7f9fc');
      } catch {}
    }
  }

  const initialTheme = (() => {
    try {
      const saved = localStorage.getItem('nl_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'light';
  })();
  applyTheme(initialTheme);

  const LANGUAGES = [
    { code: 'en', badge: 'EN', native: 'English', flag: '🇬🇧', rtl: false },
    { code: 'fa', badge: 'فا', native: 'فارسی', flag: '🇮🇷', rtl: true },
    { code: 'ar', badge: 'عر', native: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'ru', badge: 'RU', native: 'Русский', flag: '🇷🇺', rtl: false },
    { code: 'tr', badge: 'TR', native: 'Türkçe', flag: '🇹🇷', rtl: false },
  ];

  const I18N = {
    en: {
      page_title: 'YekTap',
      page_tagline: 'Everything digital, in one tap.',
      wallet_title: 'My Wallet',
      wallet_tagline: 'Instant top-up & transaction history',
      hero_live_badge: 'Live • {c}+ Countries • {s}+ Services',
      hero_title: 'Virtual Numbers',
      hero_desc: 'One number, for your need; instant OTP delivery, live pricing & real-time stock.',
      tab_manual: 'Manual Buy',
      tab_smart: 'Smart Buy',
      tab_numbers: 'My Numbers',
      label_service: 'Service',
      label_country: 'Country',
      popular_services: 'Popular Services',
      operators_heading: 'Operators / Servers',
      metric_lowest: 'Lowest: {val}',
      metric_highest: 'Highest: {val}',
      metric_stock: 'Stock: {val}',
      direct_server: 'Direct Server',
      any_operator: 'Any Operator',
      tag_cheapest: 'Cheapest',
      tag_auto: 'Auto Select',
      tag_recommended: 'Top Route',
      tag_instant_otp: 'Instant OTP',
      in_stock_n: '{n} in stock',
      other_countries: 'Other available countries',
      btn_buy: 'Buy',
      offers_info_note: 'Prices and stock update in real time per service and country. Unused numbers with no SMS are automatically refunded to your wallet.',
      smart_title: 'Smart Number Finder',
      smart_sub: 'Pick a service and let YekTap rank the best live countries by price and availability.',
      all_services_btn: 'All Services',
      smart_best: 'Recommended',
      sort_price: 'Lowest price',
      sort_stock: 'Most stock',
      refresh: 'Refresh',
      select_service: 'Select Service',
      select_country: 'Select Country',
      search_services_ph: 'Search services (Telegram, WhatsApp, Google…)',
      search_countries_ph: 'Search 198 countries…',
      loading_live: 'Loading live price…',
      no_offers: 'No live numbers currently available for this service. Try another service or refresh.',
      no_countries: 'No countries matched your search.',
      no_services: 'No services matched your search.',
      numbers_sub: 'Tap any active number to receive or copy your instant SMS code',
      no_orders: 'No virtual numbers yet. Choose a service & country in Manual Buy or Smart Buy to get started.',
      available_balance: 'Available Balance',
      points_balance_label: 'Points Balance',
      total_deposited: 'Total Deposited',
      total_spent: 'Total Spent',
      hero_points_pill: 'Invite & Earn · {pts} pts',
      ref_card_title: 'Invite & Earn Points',
      ref_card_desc: 'Share your link with friends. Earn points on every new join and spend them on virtual numbers.',
      ref_reward_badge: '+{pts} pts / invite',
      ref_stat_points: 'Points',
      ref_stat_friends: 'Invited',
      ref_stat_rate: 'Rate',
      ref_share_btn: 'Share Invite Link',
      points_activity: 'Points Activity',
      no_points_tx: 'No points activity yet. Invite a friend to earn your first points.',
      cta_get_with_points: 'Pay with Points · {pts} pts',
      points_short_label: 'Points ({bal}/{req} pts) · Earn More',
      toast_copied_ref: 'Invite link copied',
      toast_cancelled_refund_pts: 'Cancelled · Refunded {pts} pts',
      toast_insufficient_pts: 'Not enough points yet',
      topup_step1: 'Add Funds to Wallet',
      topup_enter_amt: 'Enter the USD amount you want to add, then select a payment method.',
      amount_usd: 'Amount (USD)',
      choose_pay_method: 'Payment Method',
      stars_rate: '{rate} Stars = $1',
      recent_activity: 'Recent Activity',
      no_tx: 'No wallet transactions yet.',
      language_title: 'Language',
      confirm_activation: 'Confirm Activation',
      row_country: 'Country',
      row_service: 'Service',
      row_stock: 'In Stock',
      row_numbers: '{n} numbers',
      row_price: 'Price',
      row_balance: 'Your Balance',
      guarantee: 'Automatic instant refund to your wallet if no SMS arrives.',
      pts_unit: 'pts',
      vpn_tip_short: 'For faster OTP delivery, connect your VPN to {country} before requesting the code.',
      auto_checking_sms: 'Auto-checking for SMS every 5s · Sent to bot chat on arrival',
      cta_get_number: 'Get Number · {price}',
      cta_activating: 'Activating number…',
      wallet_short_label: 'Wallet — short {need}',
      pay_directly_label: 'Or pay exact service price directly',
      pay_order_id: 'Order ID',
      pay_exact_amount: 'Amount',
      pay_session_timer: 'Payment session: {min} minutes. Send before {time} (Kabul time).',
      pay_exact_warn: 'Send this exact amount, including every decimal digit. After expiry, do not pay; late transfers need support review.',
      pay_binance_hint: 'Send payment to this Binance Pay ID (UID):',
      pay_wallet_hint: 'Send payment to this {currency} ({network}) wallet address:',
      pay_network_only: 'Only send {currency} on the {network} network.',
      pay_tx_placeholder_binance: 'Paste your Binance Pay Order ID',
      pay_tx_placeholder_crypto: 'Paste your transaction ID (TxID)',
      pay_verify_btn: 'Verify Payment Automatically',
      pay_verifying: 'Verifying automatically…',
      pay_copy: 'Copy',
      status_ok: 'Code Received',
      status_complete: 'Completed',
      status_cancel: 'Cancelled',
      status_wait: 'Waiting for SMS',
      otp_tap_copy: 'SMS Code · Tap to copy',
      btn_check_sms: 'Check SMS',
      btn_copy: 'Copy #',
      btn_cancel: 'Cancel',
      toast_copied_otp: 'OTP code copied',
      toast_copied_phone: 'Phone number copied',
      toast_copied_pay: 'Payment details copied',
      toast_checking: 'Checking for SMS…',
      toast_waiting: 'Still waiting for SMS…',
      toast_code_received: 'Code received: {code}',
      toast_activated: 'Activated +{phone}',
      toast_insufficient: 'Insufficient wallet balance',
      toast_cancelled_refund: 'Cancelled · Refunded {amt}',
      toast_cancelled: 'Activation cancelled',
      toast_deposit_ok: 'Deposit #{id} submitted',
      toast_refreshed: 'Refreshed',
      toast_topup_ok: 'Top-up successful',
      admin_title: 'Admin Dashboard',
      admin_tagline: 'Platform stats & user wallets',
      admin_stats_title: 'Platform Overview',
      admin_users_title: 'Users & Wallets',
      admin_search_ph: 'Filter by Telegram User ID…',
      btn_prev_short: '‹ Prev',
      btn_next_short: 'Next ›',
      toast_copied_id: 'User ID copied',
    },
    fa: {
      page_title: 'یک‌تپ',
      page_tagline: 'همه‌چیز، با یک تپ.',
      wallet_title: 'کیف پول من',
      wallet_tagline: 'شارژ آنی و تاریخچه تراکنش‌ها',
      hero_live_badge: 'آنلاین • +{c} کشور • +{s} سرویس',
      hero_title: 'شماره‌های مجازی',
      hero_desc: 'یک شماره، برای نیاز تو؛ دریافت OTP سریع، قیمت و موجودی زنده.',
      tab_manual: 'خرید دستی',
      tab_smart: 'خرید هوشمند',
      tab_numbers: 'شماره‌های من',
      label_service: 'سرویس',
      label_country: 'کشور',
      popular_services: 'سرویس‌های محبوب',
      operators_heading: 'اپراتورها / سرورها',
      metric_lowest: 'کمترین: {val}',
      metric_highest: 'بیشترین: {val}',
      metric_stock: 'موجودی: {val}',
      direct_server: 'سرور مستقیم',
      any_operator: 'هر اپراتور',
      tag_cheapest: 'ارزان‌ترین',
      tag_auto: 'انتخاب خودکار',
      tag_recommended: 'پیشنهادی',
      tag_instant_otp: 'OTP فوری',
      in_stock_n: '{n} موجود',
      other_countries: 'سایر کشورهای موجود',
      btn_buy: 'خرید',
      offers_info_note: 'قیمت و موجودی برای هر سرویس و کشور لحظه‌ای تغییر می‌کند. در صورت عدم دریافت پیامک، مبلغ به صورت خودکار به کیف پول شما بازمی‌گردد.',
      smart_title: 'خرید هوشمند شماره مجازی',
      smart_sub: 'سرویس مورد نظر را انتخاب کنید تا بهترین کشورها بر اساس قیمت و موجودی زنده مرتب شوند.',
      all_services_btn: 'همه سرویس‌ها',
      smart_best: 'پیشنهادی',
      sort_price: 'ارزان‌ترین',
      sort_stock: 'بیشترین موجودی',
      refresh: 'بروزرسانی',
      select_service: 'انتخاب سرویس',
      select_country: 'انتخاب کشور',
      search_services_ph: 'جستجوی سرویس (Telegram، WhatsApp، Google…)',
      search_countries_ph: 'جستجو در ۱۹۸ کشور…',
      loading_live: 'در حال دریافت قیمت زنده…',
      no_offers: 'در حال حاضر شماره‌ای برای این سرویس موجود نیست. سرویس دیگری انتخاب کنید یا بروزرسانی بزنید.',
      no_countries: 'هیچ کشوری با جستجوی شما مطابقت نداشت.',
      no_services: 'هیچ سرویسی با جستجوی شما مطابقت نداشت.',
      numbers_sub: 'برای دریافت یا کپی کد پیامک روی شماره فعال ضربه بزنید',
      no_orders: 'هنوز شماره‌ای خریداری نکرده‌اید. از بخش خرید دستی یا خرید هوشمند شروع کنید.',
      available_balance: 'موجودی قابل استفاده',
      points_balance_label: 'موجودی امتیاز',
      total_deposited: 'کل واریزی‌ها',
      total_spent: 'کل خریدها',
      hero_points_pill: 'دعوت و امتیاز · {pts} امتیاز',
      ref_card_title: 'دعوت از دوستان و کسب امتیاز',
      ref_card_desc: 'لینک خود را با دوستان به اشتراک بگذارید. با عضویت هر نفر امتیاز بگیرید و شماره مجازی رایگان بخرید.',
      ref_reward_badge: '+{pts} امتیاز / دعوت',
      ref_stat_points: 'امتیاز',
      ref_stat_friends: 'دعوت‌ها',
      ref_stat_rate: 'نرخ تبدیل',
      ref_share_btn: 'اشتراک‌گذاری لینک دعوت',
      points_activity: 'تاریخچه امتیازها',
      no_points_tx: 'هنوز تراکنش امتیازی ندارید. لینک دعوتتان را ارسال کنید تا امتیاز بگیرید.',
      cta_get_with_points: 'پرداخت با امتیاز · {pts} امتیاز',
      points_short_label: 'امتیاز ({bal}/{req}) · کسب امتیاز بیشتر',
      toast_copied_ref: 'لینک دعوت کپی شد',
      toast_cancelled_refund_pts: 'لغو شد · {pts} امتیاز برگشت داده شد',
      toast_insufficient_pts: 'امتیاز شما کافی نیست',
      topup_step1: 'افزایش موجودی کیف پول',
      topup_enter_amt: 'مبلغ دلاری مورد نظر را وارد کنید، سپس روش پرداخت را انتخاب نمایید.',
      amount_usd: 'مبلغ (دلار USD)',
      choose_pay_method: 'روش پرداخت',
      stars_rate: '{rate} استارز = $1',
      recent_activity: 'تراکنش‌های اخیر',
      no_tx: 'هنوز تراکنشی ثبت نشده است.',
      language_title: 'انتخاب زبان',
      confirm_activation: 'تایید خرید شماره',
      row_country: 'کشور',
      row_service: 'سرویس',
      row_stock: 'موجودی',
      row_numbers: '{n} شماره',
      row_price: 'قیمت',
      row_balance: 'موجودی شما',
      guarantee: 'در صورت عدم دریافت پیامک، مبلغ به صورت خودکار به کیف پول شما بازمی‌گردد.',
      pts_unit: 'امتیاز',
      vpn_tip_short: 'برای دریافت سریع‌تر کد، قبل از درخواست پیامک VPN خود را روی کشور {country} قرار دهید.',
      auto_checking_sms: 'بررسی خودکار پیامک هر ۵ ثانیه · ارسال آنی در چت ربات',
      cta_get_number: 'دریافت شماره · {price}',
      cta_activating: 'در حال فعال‌سازی شماره…',
      wallet_short_label: 'کیف پول — کسری {need}',
      pay_directly_label: 'یا دقیقاً مبلغ همین سرویس را مستقیم پرداخت کنید',
      pay_order_id: 'شماره سفارش',
      pay_exact_amount: 'مبلغ دقیق',
      pay_session_timer: 'مهلت پرداخت: {min} دقیقه. ارسال قبل از {time} (به وقت کابل).',
      pay_exact_warn: 'لطفاً دقیقاً همین مبلغ را با تمام ارقام اعشار ارسال کنید. پس از پایان مهلت واریز نکنید.',
      pay_binance_hint: 'پرداخت را به این شناسه بایننس پی (UID) ارسال کنید:',
      pay_wallet_hint: 'پرداخت را به این آدرس کیف پول {currency} ({network}) ارسال کنید:',
      pay_network_only: 'فقط {currency} روی شبکه {network} ارسال کنید.',
      pay_tx_placeholder_binance: 'شناسه سفارش بایننس پی (Order ID) را وارد کنید',
      pay_tx_placeholder_crypto: 'شناسه تراکنش (TxID) را اینجا وارد کنید',
      pay_verify_btn: 'بررسی و تایید خودکار پرداخت',
      pay_verifying: 'در حال تایید خودکار…',
      pay_copy: 'کپی',
      status_ok: 'کد دریافت شد',
      status_complete: 'تکمیل شده',
      status_cancel: 'لغو شده',
      status_wait: 'در انتظار پیامک',
      otp_tap_copy: 'کد تایید · برای کپی ضربه بزنید',
      btn_check_sms: 'دریافت پیامک',
      btn_copy: 'کپی شماره',
      btn_cancel: 'لغو',
      toast_copied_otp: 'کد تایید کپی شد',
      toast_copied_phone: 'شماره تلفن کپی شد',
      toast_copied_pay: 'مشخصات واریز کپی شد',
      toast_checking: 'در حال بررسی پیامک…',
      toast_waiting: 'هنوز پیامکی نرسیده است…',
      toast_code_received: 'کد دریافت شد: {code}',
      toast_activated: 'شماره +{phone} فعال شد',
      toast_insufficient: 'موجودی کیف پول کافی نیست',
      toast_cancelled_refund: 'لغو شد · {amt} به کیف پول برگشت',
      toast_cancelled: 'سفارش لغو شد',
      toast_deposit_ok: 'درخواست واریز #{id} ثبت شد',
      toast_refreshed: 'بروزرسانی شد',
      toast_topup_ok: 'شارژ حساب با موفقیت انجام شد',
      admin_title: 'پنل مدیریت',
      admin_tagline: 'آمار فروش و کیف پول کاربران',
      admin_stats_title: 'آمار کلی سیستم',
      admin_users_title: 'کاربران و کیف پول‌ها',
      admin_search_ph: 'جستجو بر اساس شناسه کاربر (User ID)…',
      btn_prev_short: '‹ قبلی',
      btn_next_short: 'بعدی ›',
      toast_copied_id: 'شناسه کاربر کپی شد',
    },
    ar: {
      page_title: 'أرقام افتراضية',
      page_tagline: 'رقم واحد، لاحتياجك.',
      wallet_title: 'محفظتي',
      wallet_tagline: 'شحن فوري وسجل المعاملات',
      hero_live_badge: 'مباشر • +{c} دولة • +{s} خدمة',
      hero_title: 'الأرقام الافتراضية',
      hero_desc: 'رقم واحد لاحتياجك؛ استلام OTP فوري، أسعار ومخزون مباشر.',
      tab_manual: 'شراء يدوي',
      tab_smart: 'شراء ذكي',
      tab_numbers: 'أرقامي',
      label_service: 'الخدمة',
      label_country: 'الدولة',
      popular_services: 'الخدمات الشائعة',
      operators_heading: 'المشغلون / الخوادم',
      metric_lowest: 'الأقل: {val}',
      metric_highest: 'الأعلى: {val}',
      metric_stock: 'المتوفر: {val}',
      direct_server: 'خادم مباشر',
      any_operator: 'أي مشغل',
      tag_cheapest: 'الأرخص',
      tag_auto: 'اختيار تلقائي',
      tag_recommended: 'موصى به',
      tag_instant_otp: 'OTP فوري',
      in_stock_n: '{n} متاح',
      btn_buy: 'شراء',
      offers_info_note: 'تتغير الأسعار والمخزون لحظياً. يتم استرداد المبلغ تلقائياً إلى محفظتك إذا لم تصل رسالة SMS.',
      smart_title: 'البحث الذكي عن الأرقام',
      smart_sub: 'اختر خدمة وسنرتب لك أفضل الدول حسب السعر والتوفر المباشر.',
      all_services_btn: 'كل الخدمات',
      smart_best: 'الموصى بها',
      sort_price: 'الأقل سعراً',
      sort_stock: 'الأكثر توفراً',
      refresh: 'تحديث',
      select_service: 'اختر الخدمة',
      select_country: 'اختر الدولة',
      search_services_ph: 'ابحث عن خدمة (Telegram, WhatsApp…)',
      search_countries_ph: 'ابحث في 198 دولة…',
      loading_live: 'جاري جلب السعر المباشر…',
      no_offers: 'لا توجد أرقام متاحة حالياً لهذه الخدمة.',
      no_countries: 'لم يتم العثور على دول مطابقة.',
      no_services: 'لم يتم العثور على خدمات مطابقة.',
      numbers_sub: 'اضغط على أي رقم نشط لاستلام كود SMS',
      no_orders: 'لا توجد أرقام بعد. اختر خدمة ودولة للبدء.',
      available_balance: 'الرصيد المتاح',
      total_deposited: 'إجمالي الإيداعات',
      total_spent: 'إجمالي المصروفات',
      topup_step1: 'شحن المحفظة',
      topup_enter_amt: 'أدخل المبلغ بالدولار ثم اختر طريقة الدفع.',
      amount_usd: 'المبلغ (USD)',
      choose_pay_method: 'طريقة الدفع',
      stars_rate: '{rate} نجمة = $1',
      recent_activity: 'أحدث المعاملات',
      no_tx: 'لا توجد معاملات بعد.',
      language_title: 'اللغة',
      confirm_activation: 'تأكيد التفعيل',
      row_country: 'الدولة',
      row_service: 'الخدمة',
      row_stock: 'المتوفر',
      row_numbers: '{n} رقم',
      row_price: 'السعر',
      row_balance: 'رصيدك',
      guarantee: 'استرداد فوري وتلقائي إلى محفظتك إذا لم تصل الرسالة.',
      cta_get_number: 'احصل على الرقم · {price}',
      cta_activating: 'جاري تفعيل الرقم…',
      wallet_short_label: 'المحفظة — ينقص {need}',
      pay_directly_label: 'أو ادفع سعر الخدمة مباشرة',
      status_ok: 'تم استلام الكود',
      status_complete: 'مكتمل',
      status_cancel: 'ملغي',
      status_wait: 'بانتظار SMS',
      otp_tap_copy: 'كود التحقق · اضغط للنسخ',
      btn_check_sms: 'فحص SMS',
      btn_copy: 'نسخ الرقم',
      btn_cancel: 'إلغاء',
      toast_copied_otp: 'تم نسخ الكود',
      toast_copied_phone: 'تم نسخ الرقم',
      toast_copied_pay: 'تم نسخ بيانات الدفع',
      toast_checking: 'جاري فحص الرسائل…',
      toast_waiting: 'ما زال بانتظار الرسالة…',
      toast_code_received: 'وصل الكود: {code}',
      toast_activated: 'تم تفعيل +{phone}',
      toast_insufficient: 'الرصيد غير كافٍ',
      toast_cancelled_refund: 'تم الإلغاء · استرداد {amt}',
      toast_cancelled: 'تم إلغاء التفعيل',
      toast_deposit_ok: 'تم إرسال طلب الإيداع #{id}',
      toast_refreshed: 'تم التحديث',
      toast_topup_ok: 'تم الشحن بنجاح',
    },
    ru: {
      page_title: 'Виртуальные номера',
      page_tagline: 'Один номер для ваших задач.',
      wallet_title: 'Кошелёк',
      wallet_tagline: 'Мгновенное пополнение и история',
      hero_live_badge: 'Онлайн • {c}+ стран • {s}+ сервисов',
      hero_title: 'Виртуальные номера',
      hero_desc: 'Быстрый приём OTP, актуальные цены и наличие в реальном времени.',
      tab_manual: 'Ручной выбор',
      tab_smart: 'Умный выбор',
      tab_numbers: 'Мои номера',
      label_service: 'Сервис',
      label_country: 'Страна',
      popular_services: 'Популярные сервисы',
      operators_heading: 'Операторы / Серверы',
      metric_lowest: 'Мин: {val}',
      metric_highest: 'Макс: {val}',
      metric_stock: 'Доступно: {val}',
      direct_server: 'Прямой сервер',
      any_operator: 'Любой оператор',
      tag_cheapest: 'Дешевле всех',
      tag_auto: 'Автовыбор',
      tag_recommended: 'Лучший',
      tag_instant_otp: 'Быстрый OTP',
      in_stock_n: '{n} шт.',
      btn_buy: 'Купить',
      offers_info_note: 'Цены и наличие обновляются в реальном времени. Автовозврат на кошелёк, если SMS не придёт.',
      smart_title: 'Умный подбор номера',
      smart_sub: 'Выберите сервис — мы покажем лучшие страны по цене и наличию.',
      all_services_btn: 'Все сервисы',
      smart_best: 'Рекомендуемые',
      sort_price: 'Дешевле',
      sort_stock: 'Больше номеров',
      refresh: 'Обновить',
      select_service: 'Выберите сервис',
      select_country: 'Выберите страну',
      search_services_ph: 'Поиск сервиса (Telegram, WhatsApp…)',
      search_countries_ph: 'Поиск среди 198 стран…',
      loading_live: 'Загрузка цены…',
      no_offers: 'Нет доступных номеров для этого сервиса.',
      no_countries: 'Страны не найдены.',
      no_services: 'Сервисы не найдены.',
      numbers_sub: 'Нажмите на номер, чтобы получить SMS-код',
      no_orders: 'Номеров пока нет. Выберите сервис и страну, чтобы начать.',
      available_balance: 'Доступный баланс',
      total_deposited: 'Пополнено',
      total_spent: 'Потрачено',
      topup_step1: 'Пополнить кошелёк',
      topup_enter_amt: 'Введите сумму в USD и выберите способ оплаты.',
      amount_usd: 'Сумма (USD)',
      choose_pay_method: 'Способ оплаты',
      stars_rate: '{rate} Stars = $1',
      recent_activity: 'История операций',
      no_tx: 'Операций пока нет.',
      language_title: 'Язык',
      confirm_activation: 'Подтверждение',
      row_country: 'Страна',
      row_service: 'Сервис',
      row_stock: 'В наличии',
      row_numbers: '{n} номеров',
      row_price: 'Цена',
      row_balance: 'Ваш баланс',
      guarantee: 'Автоматический возврат на кошелёк, если SMS не придёт.',
      cta_get_number: 'Получить номер · {price}',
      cta_activating: 'Активация номера…',
      wallet_short_label: 'Кошелёк — не хватает {need}',
      pay_directly_label: 'Или оплатите точную стоимость напрямую',
      status_ok: 'Код получен',
      status_complete: 'Завершено',
      status_cancel: 'Отменено',
      status_wait: 'Ожидание SMS',
      otp_tap_copy: 'SMS-код · Нажмите для копирования',
      btn_check_sms: 'Проверить',
      btn_copy: 'Копировать',
      btn_cancel: 'Отмена',
      toast_copied_otp: 'Код скопирован',
      toast_copied_phone: 'Номер скопирован',
      toast_copied_pay: 'Реквизиты скопированы',
      toast_checking: 'Проверка SMS…',
      toast_waiting: 'Ожидание SMS…',
      toast_code_received: 'Код получен: {code}',
      toast_activated: 'Активирован +{phone}',
      toast_insufficient: 'Недостаточно средств',
      toast_cancelled_refund: 'Отменено · Возврат {amt}',
      toast_cancelled: 'Активация отменена',
      toast_deposit_ok: 'Заявка #{id} отправлена',
      toast_refreshed: 'Обновлено',
      toast_topup_ok: 'Баланс пополнен',
    },
    tr: {
      page_title: 'Sanal Numaralar',
      page_tagline: 'İhtiyacın için tek numara.',
      wallet_title: 'Cüzdanım',
      wallet_tagline: 'Anında bakiye yükleme ve geçmiş',
      hero_live_badge: 'Canlı • {c}+ Ülke • {s}+ Servis',
      hero_title: 'Sanal Numaralar',
      hero_desc: 'Hızlı OTP teslimatı, canlı fiyatlar ve anlık stok.',
      tab_manual: 'Manuel Alım',
      tab_smart: 'Akıllı Alım',
      tab_numbers: 'Numaralarım',
      label_service: 'Servis',
      label_country: 'Ülke',
      popular_services: 'Popüler Servisler',
      operators_heading: 'Operatörler / Sunucular',
      metric_lowest: 'En düşük: {val}',
      metric_highest: 'En yüksek: {val}',
      metric_stock: 'Stok: {val}',
      direct_server: 'Doğrudan Sunucu',
      any_operator: 'Herhangi Bir Operatör',
      tag_cheapest: 'En ucuz',
      tag_auto: 'Otomatik Seçim',
      tag_recommended: 'Önerilen',
      tag_instant_otp: 'Anında OTP',
      in_stock_n: '{n} mevcut',
      btn_buy: 'Satın Al',
      offers_info_note: 'Fiyatlar ve stok gerçek zamanlı güncellenir. SMS gelmezse tutar otomatik iade edilir.',
      smart_title: 'Akıllı Numara Bulucu',
      smart_sub: 'Bir servis seçin, en iyi canlı ülkeleri fiyat ve stoka göre sıralayalım.',
      all_services_btn: 'Tüm Servisler',
      smart_best: 'Önerilen',
      sort_price: 'En ucuz',
      sort_stock: 'En çok stok',
      refresh: 'Yenile',
      select_service: 'Servis Seçin',
      select_country: 'Ülke Seçin',
      search_services_ph: 'Servis ara (Telegram, WhatsApp…)',
      search_countries_ph: '198 ülkede ara…',
      loading_live: 'Canlı fiyat yükleniyor…',
      no_offers: 'Bu servis için şu anda uygun numara yok.',
      no_countries: 'Eşleşen ülke bulunamadı.',
      no_services: 'Eşleşen servis bulunamadı.',
      numbers_sub: 'SMS kodunu almak için aktif numaraya dokunun',
      no_orders: 'Henüz numaranız yok. Başlamak için bir servis seçin.',
      available_balance: 'Kullanılabilir Bakiye',
      total_deposited: 'Toplam Yükleme',
      total_spent: 'Toplam Harcama',
      topup_step1: 'Cüzdana Bakiye Ekle',
      topup_enter_amt: 'Eklemek istediğiniz USD tutarını girin ve ödeme yöntemi seçin.',
      amount_usd: 'Tutar (USD)',
      choose_pay_method: 'Ödeme Yöntemi',
      stars_rate: '{rate} Stars = $1',
      recent_activity: 'Son İşlemler',
      no_tx: 'Henüz işlem yok.',
      language_title: 'Dil',
      confirm_activation: 'Aktivasyonu Onayla',
      row_country: 'Ülke',
      row_service: 'Servis',
      row_stock: 'Stok',
      row_numbers: '{n} numara',
      row_price: 'Fiyat',
      row_balance: 'Bakiyeniz',
      guarantee: 'SMS gelmezse tutar anında cüzdanınıza otomatik iade edilir.',
      cta_get_number: 'Numara Al · {price}',
      cta_activating: 'Numara alınıyor…',
      wallet_short_label: 'Cüzdan — {need} eksik',
      pay_directly_label: 'Veya tam servis ücretini doğrudan ödeyin',
      status_ok: 'Kod Geldi',
      status_complete: 'Tamamlandı',
      status_cancel: 'İptal Edildi',
      status_wait: 'SMS Bekleniyor',
      otp_tap_copy: 'SMS Kodu · Kopyalamak için dokunun',
      btn_check_sms: 'SMS Kontrol',
      btn_copy: 'Kopyala',
      btn_cancel: 'İptal',
      toast_copied_otp: 'Kod kopyalandı',
      toast_copied_phone: 'Numara kopyalandı',
      toast_copied_pay: 'Ödeme bilgileri kopyalandı',
      toast_checking: 'SMS kontrol ediliyor…',
      toast_waiting: 'Hâlâ SMS bekleniyor…',
      toast_code_received: 'Kod geldi: {code}',
      toast_activated: '+{phone} aktif edildi',
      toast_insufficient: 'Yetersiz cüzdan bakiyesi',
      toast_cancelled_refund: 'İptal edildi · {amt} iade edildi',
      toast_cancelled: 'Aktivasyon iptal edildi',
      toast_deposit_ok: 'Yatırma #{id} gönderildi',
      toast_refreshed: 'Yenilendi',
      toast_topup_ok: 'Yükleme başarılı',
    },
  };

  const DEFAULT_POPULAR_SERVICES = [
    { code: 'tg', name: 'Telegram' },
    { code: 'wa', name: 'WhatsApp' },
    { code: 'go', name: 'Google' },
    { code: 'dr', name: 'ChatGPT' },
    { code: 'ig', name: 'Instagram' },
    { code: 'wx', name: 'Apple' },
    { code: 'ds', name: 'Discord' },
    { code: 'ts', name: 'PayPal' },
    { code: 'lf', name: 'TikTok' },
    { code: 'fb', name: 'Facebook' },
  ];

  const SERVICE_BRAND_ICONS = {
    tg: {
      bg: 'rgba(34, 158, 217, 0.14)',
      fg: '#229ED9',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21.9 4.6c.2-.9-.6-1.6-1.5-1.3L2.8 10.1c-1 .4-.9 1.8.1 2.1l4.4 1.4 1.7 5.4c.2.7 1.1.9 1.6.4l2.5-2.5 4.8 3.5c.8.6 1.9.1 2.1-.9L21.9 4.6zM9.2 13.4l8.8-5.6-6.9 6.7-.3 3.1-1.3-4.1-.3-.1z"/></svg>',
    },
    wa: {
      bg: 'rgba(37, 211, 102, 0.14)',
      fg: '#16A34A',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 20.5l1.5-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M9.5 9.2c.3-.6.7-.6 1-.2l.8 1.1c.2.3.1.7-.1 1l-.4.4c.5 1 1.3 1.8 2.3 2.3l.4-.4c.3-.2.7-.3 1-.1l1.1.8c.4.3.4.7-.2 1-.9.5-2 .5-3.2-.1-1.5-.8-2.9-2.2-3.7-3.7-.6-1.2-.6-2.3.1-3.1z"/></svg>',
    },
    go: {
      bg: 'rgba(66, 133, 244, 0.14)',
      fg: '#2563EB',
      svg: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12.2 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17 3.3 14.8 2.4 12.2 2.4 6.9 2.4 2.6 6.7 2.6 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6h-9z"/></svg>',
    },
    dr: {
      bg: 'rgba(16, 163, 127, 0.14)',
      fg: '#0D9488',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M4.2 7.5l5.2 3M14.6 13.5l5.2 3M19.8 7.5l-5.2 3M9.4 13.5l-5.2 3"/></svg>',
    },
    ig: {
      bg: 'rgba(225, 48, 108, 0.13)',
      fg: '#DB2777',
      svg: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    },
    wx: {
      bg: 'rgba(100, 116, 139, 0.14)',
      fg: 'var(--ink)',
      svg: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.5-.4 6.1 1 8.1.7 1 1.5 2.1 2.5 2 1 0 1.4-.6 2.6-.6 1.2 0 1.6.6 2.6.6 1.1 0 1.8-1 2.4-1.9.8-1.1 1.1-2.2 1.1-2.3-.1 0-1.9-.7-1.9-3.1zM14.6 6.2c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/></svg>',
    },
    ds: {
      bg: 'rgba(88, 101, 242, 0.14)',
      fg: '#4F46E5',
      svg: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/><path d="M18.9 5.9A15.4 15.4 0 0 0 15 4.7l-.5 1a14 14 0 0 0-5 0l-.5-1a15.4 15.4 0 0 0-3.9 1.2C2.6 9.6 2 13.2 2.3 16.8a15.6 15.6 0 0 0 4.7 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 10.4 0l.4.3a10 10 0 0 1-1.6.8l1 1.6a15.6 15.6 0 0 0 4.7-2.4c.4-4.1-.7-7.7-2.8-10.9z"/></svg>',
    },
    ts: {
      bg: 'rgba(0, 112, 186, 0.14)',
      fg: '#0284C7',
      svg: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19l2-14h6.5a3.5 3.5 0 0 1 0 7H10"/><path d="M10.5 19l1.3-9h5a3 3 0 0 1 0 6H12"/></svg>',
    },
    lf: {
      bg: 'rgba(15, 23, 42, 0.1)',
      fg: 'var(--ink)',
      svg: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>',
    },
    fb: {
      bg: 'rgba(24, 119, 242, 0.14)',
      fg: '#2563EB',
      svg: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.33-.04-1.56-.14-2.86-.14-2.72 0-4.64 1.66-4.64 4.7V9.5H7v4h3V22h4v-8.5z"/></svg>',
    },
    tw: {
      bg: 'rgba(15, 23, 42, 0.1)',
      fg: 'var(--ink)',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.2 3h3l-6.6 7.5L22.3 21h-6l-4.7-6.2L6.2 21h-3l7-8L2.8 3h6.2l4.3 5.6L18.2 3zm-1.1 16.2h1.7L7.9 4.7H6.1l11 14.5z"/></svg>',
    },
    mm: {
      bg: 'rgba(0, 164, 239, 0.14)',
      fg: '#0284C7',
      svg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="3" y="3" width="8.5" height="8.5" rx="1.2"/><rect x="12.5" y="3" width="8.5" height="8.5" rx="1.2"/><rect x="3" y="12.5" width="8.5" height="8.5" rx="1.2"/><rect x="12.5" y="12.5" width="8.5" height="8.5" rx="1.2"/></svg>',
    },
  };

  function getServiceBadge(name, code) {
    const key = String(code || '').toLowerCase();
    if (SERVICE_BRAND_ICONS[key]) {
      return SERVICE_BRAND_ICONS[key];
    }
    const m = monogramFor(name, code);
    return { bg: m.bg, fg: m.fg, text: m.letters };
  }

  const DEFAULT_POPULAR_COUNTRIES = [
    { id: '16', name: 'United Kingdom', flag: '🇬🇧' },
    { id: '187', name: 'United States', flag: '🇺🇸' },
    { id: '36', name: 'Canada', flag: '🇨🇦' },
    { id: '43', name: 'Germany', flag: '🇩🇪' },
    { id: '48', name: 'Netherlands', flag: '🇳🇱' },
    { id: '78', name: 'France', flag: '🇫🇷' },
    { id: '6', name: 'Indonesia', flag: '🇮🇩' },
    { id: '74', name: 'Afghanistan', flag: '🇦🇫' },
  ];

  const SERVICE_TINTS = [
    ['rgba(14,165,233,0.14)', '#0284c7'],
    ['rgba(16,185,129,0.14)', '#059669'],
    ['rgba(99,102,241,0.14)', '#4f46e5'],
    ['rgba(245,158,11,0.15)', '#d97706'],
    ['rgba(236,72,153,0.14)', '#db2777'],
    ['rgba(6,182,212,0.15)', '#0891b2'],
  ];

  function detectInitialLang() {
    try {
      const saved = localStorage.getItem('nl_lang');
      if (saved && I18N[saved]) return saved;
    } catch {}
    const tgLang = tg?.initDataUnsafe?.user?.language_code || navigator.language || 'en';
    const short = String(tgLang).toLowerCase().slice(0, 2);
    return I18N[short] ? short : 'en';
  }

  const savedServiceCode = (() => {
    try {
      return localStorage.getItem('nl_service_code') || 'tg';
    } catch {
      return 'tg';
    }
  })();

  const savedCountryId = (() => {
    try {
      return localStorage.getItem('nl_country_id') || '16';
    } catch {
      return '16';
    }
  })();

  const state = {
    lang: detectInitialLang(),
    isOwner: false,
    view: 'workspace', // 'workspace' | 'wallet' | 'admin'
    admin: {
      loading: false,
      stats: null,
      markupPercent: 20,
      gatewayBalance: null,
      usersPage: { users: [], total: 0, page: 0, totalPages: 1 },
      searchQuery: '',
    },
    activeTab: 'manual', // 'manual' | 'smart' | 'numbers'
    smartSort: 'best', // 'best' | 'cheapest' | 'stock'
    wallet: { balanceCents: 0, totalDepositedCents: 0, totalSpentCents: 0, pointsBalance: 0 },
    referral: {
      inviteLink: '',
      referralCount: 0,
      pointsBalance: 0,
      rewardPoints: 10,
      welcomePoints: 0,
      pointsPerUsd: 100,
      pointTransactions: [],
    },
    orders: [],
    transactions: [],
    services: DEFAULT_POPULAR_SERVICES,
    popularServices: DEFAULT_POPULAR_SERVICES,
    countries: DEFAULT_POPULAR_COUNTRIES,
    popularCountries: DEFAULT_POPULAR_COUNTRIES,
    catalogStats: { countriesCount: 198, servicesCount: 600 },
    selectedServiceCode: savedServiceCode,
    selectedService: DEFAULT_POPULAR_SERVICES.find((s) => s.code === savedServiceCode) || DEFAULT_POPULAR_SERVICES[0],
    selectedCountryId: savedCountryId,
    selectedCountry: DEFAULT_POPULAR_COUNTRIES.find((c) => c.id === savedCountryId) || DEFAULT_POPULAR_COUNTRIES[0],
    liveCountriesForService: [],
    loadingOffers: false,
    config: { markupPercent: 20, starsPerUsd: 50, payInfo: '' },
    pendingBuy: null,
  };

  function tr(key, vars) {
    const dict = I18N[state.lang] || I18N.en;
    let s = dict[key] ?? I18N.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v ?? ''));
      }
    }
    return s;
  }

  function haptic(style) {
    try {
      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(style || 'light');
      }
    } catch {}
  }

  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  function fmtCents(cents) {
    return '$' + (Number(cents || 0) / 100).toFixed(2);
  }

  function fmtPrice(val) {
    return Number.isFinite(Number(val)) ? '$' + Number(val).toFixed(2) : '—';
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function monogramFor(name, code) {
    const clean = String(name || code || 'SV').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    const letters =
      words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : clean.slice(0, 2).toUpperCase() || 'SV';
    let hash = 0;
    const key = String(code || name || 'sv');
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 997;
    const [bg, fg] = SERVICE_TINTS[hash % SERVICE_TINTS.length];
    return { letters, bg, fg };
  }

  function callEndpoint(name, input) {
    return new Promise((resolve, reject) => {
      if (!tg || !tg.Serverless || typeof tg.Serverless.call !== 'function') {
        reject(new Error('Open inside Telegram to connect.'));
        return;
      }
      tg.Serverless.call(name, input || {}, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  function updateHeaderCopy() {
    const isSubView = state.view === 'wallet' || state.view === 'admin';
    document.getElementById('header-back-btn').classList.toggle('hidden', !isSubView);
    document.getElementById('header-brand-mark').classList.toggle('hidden', isSubView);
    if (state.view === 'wallet') {
      document.getElementById('header-title').textContent = tr('wallet_title');
      document.getElementById('header-subtitle').textContent = tr('wallet_tagline');
    } else if (state.view === 'admin') {
      document.getElementById('header-title').textContent = tr('admin_title');
      document.getElementById('header-subtitle').textContent = tr('admin_tagline');
    } else {
      document.getElementById('header-title').textContent = tr('page_title');
      document.getElementById('header-subtitle').textContent = tr('page_tagline');
    }
  }

  function setView(viewName) {
    haptic('light');
    if (viewName === 'admin' && !state.isOwner) return;
    state.view = viewName === 'wallet' ? 'wallet' : viewName === 'admin' ? 'admin' : 'workspace';
    document.getElementById('workspace-view').classList.toggle('hidden', state.view !== 'workspace');
    document.getElementById('wallet-view').classList.toggle('hidden', state.view !== 'wallet');
    document.getElementById('admin-view').classList.toggle('hidden', state.view !== 'admin');
    updateHeaderCopy();
    if (state.view === 'wallet') {
      renderWallet();
    } else if (state.view === 'admin') {
      loadAdminOverview(state.admin.usersPage.page || 0);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchTab(tab) {
    haptic('light');
    state.activeTab = tab;
    if (state.view !== 'workspace') setView('workspace');

    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.seg-tab').forEach((b) => {
      const isAct = b.dataset.tab === tab;
      b.classList.toggle('active', isAct);
      b.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });

    const panel = document.getElementById('tab-' + tab);
    if (panel) panel.classList.add('active');

    if (tab === 'smart') {
      renderSmartBuy();
    } else if (tab === 'numbers') {
      renderOrders();
    }
  }

  function applyLanguageUI() {
    const meta = LANGUAGES.find((l) => l.code === state.lang) || LANGUAGES[0];
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
    document.getElementById('header-lang-code').textContent = meta.badge;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = tr(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = tr(el.dataset.i18nPlaceholder);
    });

    updateHeaderCopy();
    renderQuickServiceStrips();
    renderSelectors();
    renderOffersPanel();
    renderSmartBuy();
    renderOrders();
    renderWallet();
    if (state.isOwner && state.view === 'admin') {
      renderAdminView();
    }
  }

  // Language Picker Sheet
  function openLangSheet() {
    haptic('light');
    const wrap = document.getElementById('lang-sheet-list');
    wrap.innerHTML = '';
    LANGUAGES.forEach((l) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'picker-option';
      btn.innerHTML = `
        <span class="picker-option-left">
          <span style="font-size:20px;">${l.flag}</span>
          <span>${escHtml(l.native)}</span>
        </span>
        ${l.code === state.lang ? '<span class="picker-check">✓</span>' : ''}
      `;
      btn.addEventListener('click', () => selectLanguage(l.code));
      wrap.appendChild(btn);
    });
    document.getElementById('lang-sheet').classList.remove('hidden');
  }

  function closeLangSheet() {
    document.getElementById('lang-sheet').classList.add('hidden');
  }

  async function selectLanguage(code) {
    haptic('light');
    state.lang = I18N[code] ? code : 'en';
    try {
      localStorage.setItem('nl_lang', state.lang);
    } catch {}
    closeLangSheet();
    applyLanguageUI();
    try {
      await callEndpoint('setLanguage', { lang: state.lang });
    } catch {}
  }

  // Quick Popular Service Strips (Manual + Smart)
  function renderQuickServiceStrips() {
    const list = (state.popularServices && state.popularServices.length
      ? state.popularServices
      : DEFAULT_POPULAR_SERVICES
    ).slice(0, 10);

    ['quick-services-strip', 'smart-services-strip'].forEach((id) => {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      wrap.innerHTML = '';
      list.forEach((s) => {
        const badge = getServiceBadge(s.name, s.code);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-pill' + (s.code === state.selectedServiceCode ? ' active' : '');
        const shortName = s.name.split(',')[0].split('+')[0].trim();
        const icoHtml = badge.svg
          ? `<span class="pill-brand-ico" style="color:${badge.fg};">${badge.svg}</span>`
          : '';
        btn.innerHTML = `${icoHtml}<span>${escHtml(shortName)}</span>`;
        btn.addEventListener('click', () => selectService(s));
        wrap.appendChild(btn);
      });
    });
  }

  // Selector Triggers (Service + Country)
  function renderSelectors() {
    const svc = state.selectedService;
    const badge = getServiceBadge(svc.name, svc.code);
    const iconEl = document.getElementById('selected-service-icon');
    if (badge.svg) {
      iconEl.innerHTML = badge.svg;
    } else {
      iconEl.textContent = badge.text;
    }
    iconEl.style.background = badge.bg;
    iconEl.style.color = badge.fg;
    iconEl.style.borderColor = 'transparent';
    document.getElementById('selected-service-name').textContent = svc.name;
    document.getElementById('selected-service-sub').textContent = svc.code.toUpperCase();

    const ctry = state.selectedCountry;
    document.getElementById('selected-country-flag').textContent = ctry.flag || '🌍';
    document.getElementById('selected-country-name').textContent = ctry.name;

    const priceEl = document.getElementById('selected-country-price');
    if (state.loadingOffers) {
      priceEl.textContent = tr('loading_live');
    } else {
      const match = state.liveCountriesForService.find((c) => c.id === state.selectedCountryId);
      if (match && match.retailPrice !== null) {
        priceEl.textContent = `${fmtPrice(match.retailPrice)} · ${tr('in_stock_n', { n: Number(match.phones || 0).toLocaleString() })}`;
      } else {
        priceEl.textContent = tr('no_offers');
      }
    }

    const pairChip = document.getElementById('offers-selected-pair');
    if (pairChip) {
      const shortSvc = svc.name.split(',')[0].split('+')[0].trim();
      pairChip.textContent = `${shortSvc} · ${ctry.flag || ''} ${ctry.name}`;
    }
  }

  function renderOffersSkeleton(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.innerHTML = Array.from({ length: 3 })
      .map(
        () => `
      <div class="skeleton-card">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="sk-block" style="width:44px;height:44px;border-radius:50%;"></div>
          <div>
            <div class="sk-block" style="width:128px;height:14px;margin-bottom:7px;"></div>
            <div class="sk-block" style="width:165px;height:11px;"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:7px;">
          <div class="sk-block" style="width:52px;height:14px;"></div>
          <div class="sk-block" style="width:72px;height:30px;border-radius:999px;"></div>
        </div>
      </div>`
      )
      .join('');
  }

  // Operators / Servers Panel (Manual Buy)
  function renderOffersPanel() {
    const listEl = document.getElementById('offers-list');
    const countEl = document.getElementById('offers-count-badge');
    const lowEl = document.getElementById('metric-lowest');
    const highEl = document.getElementById('metric-highest');
    const stockEl = document.getElementById('metric-stock');

    if (state.loadingOffers) {
      countEl.textContent = '…';
      lowEl.textContent = tr('metric_lowest', { val: '…' });
      highEl.textContent = tr('metric_highest', { val: '…' });
      stockEl.textContent = tr('metric_stock', { val: '…' });
      renderOffersSkeleton('offers-list');
      return;
    }

    const live = state.liveCountriesForService.filter((c) => c.phones > 0 && c.retailPrice !== null);
    if (!live.length) {
      countEl.textContent = '0';
      lowEl.textContent = tr('metric_lowest', { val: '—' });
      highEl.textContent = tr('metric_highest', { val: '—' });
      stockEl.textContent = tr('metric_stock', { val: '0' });
      listEl.innerHTML = `<div class="empty-state">${escHtml(tr('no_offers'))}</div>`;
      return;
    }

    const selectedOffer = live.find((c) => c.id === state.selectedCountryId) || live[0];
    if (selectedOffer && selectedOffer.id !== state.selectedCountryId) {
      state.selectedCountryId = selectedOffer.id;
      state.selectedCountry = selectedOffer;
      renderSelectors();
    }

    const sortedByPrice = live.slice().sort((a, b) => a.retailPrice - b.retailPrice);
    const cheapestOffer = sortedByPrice[0];
    const highestOffer = sortedByPrice[sortedByPrice.length - 1];
    const totalStock = live.reduce((sum, c) => sum + Number(c.phones || 0), 0);

    lowEl.textContent = tr('metric_lowest', { val: fmtPrice(cheapestOffer.retailPrice) });
    highEl.textContent = tr('metric_highest', { val: fmtPrice(highestOffer.retailPrice) });
    stockEl.textContent = tr('metric_stock', { val: totalStock.toLocaleString() });

    // Build operator/route cards:
    // 1. Direct Server for Selected Country
    // 2. Any Operator / Auto-Select (Cheapest Global or Auto Route)
    // 3. Up to 4 Top Alternative Countries for fast comparison
    const alternatives = sortedByPrice
      .filter((c) => c.id !== selectedOffer.id && c.id !== cheapestOffer.id)
      .slice(0, 4);

    const cards = [
      {
        kind: 'direct',
        title: `${tr('direct_server')} · ${selectedOffer.name}`,
        country: selectedOffer,
        badge: selectedOffer.id === cheapestOffer.id ? tr('tag_cheapest') : tr('tag_instant_otp'),
        badgeClass: selectedOffer.id === cheapestOffer.id ? '' : 'green',
        featured: true,
      },
      {
        kind: 'auto',
        title: `${tr('any_operator')} (${cheapestOffer.flag} ${cheapestOffer.name})`,
        country: cheapestOffer,
        badge: tr('tag_auto'),
        badgeClass: '',
        featured: false,
      },
      ...alternatives.map((alt) => ({
        kind: 'alt',
        title: alt.name,
        country: alt,
        badge: tr('tag_instant_otp'),
        badgeClass: 'green',
        featured: false,
      })),
    ];

    countEl.textContent = String(live.length);
    listEl.innerHTML = '';

    const towerSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>`;
    const shuffleSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>`;

    cards.forEach((item, idx) => {
      if (item.kind === 'alt' && idx === 2) {
        const divider = document.createElement('div');
        divider.className = 'other-routes-label';
        divider.textContent = tr('other_countries');
        listEl.appendChild(divider);
      }
      const c = item.country;
      const card = document.createElement('div');
      card.className = 'offer-card' + (item.featured ? ' featured' : '');
      const iconHtml =
        item.kind === 'direct'
          ? towerSvg
          : item.kind === 'auto'
            ? shuffleSvg
            : `<span>${c.flag || '🌍'}</span>`;

      card.innerHTML = `
        <div class="offer-main">
          <div class="offer-icon">${iconHtml}</div>
          <div class="offer-info">
            <div class="offer-name-row">
              <span class="offer-name">${escHtml(item.title)}</span>
            </div>
            <div class="offer-meta">
              <span>${escHtml(tr('in_stock_n', { n: Number(c.phones || 0).toLocaleString() }))}</span>
              <span class="offer-tag ${item.badgeClass}">${escHtml(item.badge)}</span>
            </div>
          </div>
        </div>
        <div class="offer-action-col">
          <span class="offer-price">${fmtPrice(c.retailPrice)}</span>
          <button class="buy-pill-btn" type="button">${escHtml(tr('btn_buy'))}</button>
        </div>
      `;

      card.querySelector('.buy-pill-btn').addEventListener('click', () => {
        openConfirmBuySheet(state.selectedService, c);
      });
      listEl.appendChild(card);
    });
  }

  // Smart Buy Panel
  function renderSmartBuy() {
    const wrap = document.getElementById('smart-results-list');
    if (!wrap) return;

    if (state.loadingOffers) {
      renderOffersSkeleton('smart-results-list');
      return;
    }

    const live = state.liveCountriesForService
      .filter((c) => c.phones > 0 && c.retailPrice !== null)
      .slice();

    if (!live.length) {
      wrap.innerHTML = `<div class="empty-state">${escHtml(tr('no_offers'))}</div>`;
      return;
    }

    if (state.smartSort === 'cheapest') {
      live.sort((a, b) => a.retailPrice - b.retailPrice);
    } else if (state.smartSort === 'stock') {
      live.sort((a, b) => (b.phones || 0) - (a.phones || 0));
    } else {
      live.sort((a, b) => {
        if (a.popRank !== b.popRank) return a.popRank - b.popRank;
        return a.retailPrice - b.retailPrice;
      });
    }

    const top = live.slice(0, 15);
    wrap.innerHTML = '';

    top.forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = 'offer-card' + (idx === 0 ? ' featured' : '');
      const badge =
        idx === 0
          ? state.smartSort === 'cheapest'
            ? tr('tag_cheapest')
            : tr('tag_recommended')
          : tr('tag_instant_otp');

      card.innerHTML = `
        <div class="offer-main">
          <div class="offer-icon"><span>${c.flag || '🌍'}</span></div>
          <div class="offer-info">
            <div class="offer-name-row">
              <span class="offer-name">${escHtml(c.name)}</span>
            </div>
            <div class="offer-meta">
              <span>${escHtml(tr('in_stock_n', { n: Number(c.phones || 0).toLocaleString() }))}</span>
              <span class="offer-tag ${idx === 0 ? '' : 'green'}">${escHtml(badge)}</span>
            </div>
          </div>
        </div>
        <div class="offer-action-col">
          <span class="offer-price">${fmtPrice(c.retailPrice)}</span>
          <button class="buy-pill-btn" type="button">${escHtml(tr('btn_buy'))}</button>
        </div>
      `;

      card.querySelector('.buy-pill-btn').addEventListener('click', () => {
        openConfirmBuySheet(state.selectedService, c);
      });
      wrap.appendChild(card);
    });
  }

  async function loadServiceOffers(serviceCode, countryId) {
    state.loadingOffers = true;
    renderSelectors();
    renderOffersPanel();
    if (state.activeTab === 'smart') renderSmartBuy();

    try {
      const targetCountryId = countryId || state.selectedCountryId;
      const res = await callEndpoint('getServicePrices', {
        serviceCode,
        countryId: targetCountryId,
      });
      if (res.service) {
        state.selectedService = res.service;
      }
      state.liveCountriesForService = Array.isArray(res.countries) ? res.countries : [];

      // Keep selected country if available, otherwise pick first available
      const match = state.liveCountriesForService.find((c) => c.id === state.selectedCountryId);
      if (match) {
        state.selectedCountry = match;
      } else if (state.liveCountriesForService.length > 0) {
        state.selectedCountry = state.liveCountriesForService[0];
        state.selectedCountryId = state.selectedCountry.id;
      }
    } catch (err) {
      state.liveCountriesForService = [];
      showToast(err.message || 'Error loading live prices');
    } finally {
      state.loadingOffers = false;
      renderSelectors();
      renderOffersPanel();
      renderSmartBuy();
    }
  }

  function selectService(service) {
    haptic('light');
    state.selectedServiceCode = service.code;
    state.selectedService = service;
    try {
      localStorage.setItem('nl_service_code', service.code);
    } catch {}
    closeServiceSheet();
    renderQuickServiceStrips();
    loadServiceOffers(service.code, state.selectedCountryId);
  }

  function selectCountry(country) {
    haptic('light');
    state.selectedCountryId = country.id;
    state.selectedCountry = country;
    try {
      localStorage.setItem('nl_country_id', country.id);
    } catch {}
    closeCountrySheet();
    const alreadyLoaded = state.liveCountriesForService.some((c) => c.id === country.id);
    if (alreadyLoaded) {
      renderSelectors();
      renderOffersPanel();
    } else {
      loadServiceOffers(state.selectedServiceCode, country.id);
    }
  }

  // Service Picker Sheet
  function openServiceSheet() {
    haptic('light');
    document.getElementById('service-sheet').classList.remove('hidden');
    const input = document.getElementById('service-sheet-search');
    input.value = '';
    renderServiceSheetList('');
  }

  function closeServiceSheet() {
    document.getElementById('service-sheet').classList.add('hidden');
  }

  function renderServiceSheetList(query) {
    const wrap = document.getElementById('service-sheet-list');
    const q = String(query || '').trim().toLowerCase();
    const all = state.services.length ? state.services : state.popularServices;
    const popSet = new Set(state.popularServices.map((s) => s.code));

    let filtered = q
      ? all.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      : [
          ...state.popularServices,
          ...all.filter((s) => !popSet.has(s.code)),
        ];

    filtered = filtered.slice(0, 120);
    wrap.innerHTML = '';

    if (!filtered.length) {
      wrap.innerHTML = `<div class="empty-state">${escHtml(tr('no_services'))}</div>`;
      return;
    }

    filtered.forEach((s) => {
      const badge = getServiceBadge(s.name, s.code);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'picker-option';
      const active = s.code === state.selectedServiceCode;
      const avatarContent = badge.svg || escHtml(badge.text);
      row.innerHTML = `
        <span class="picker-option-left">
          <span class="service-avatar" style="width:34px;height:34px;border-radius:10px;background:${badge.bg};color:${badge.fg};border-color:transparent;">${avatarContent}</span>
          <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(s.name)}</span>
        </span>
        <span class="picker-option-right">
          <span class="picker-stock-sub">${escHtml(s.code.toUpperCase())}</span>
          ${active ? '<span class="picker-check">✓</span>' : ''}
        </span>
      `;
      row.addEventListener('click', () => selectService(s));
      wrap.appendChild(row);
    });
  }

  // Country Picker Sheet (Shows Live Price + Stock for Selected Service)
  function openCountrySheet() {
    haptic('light');
    document.getElementById('country-sheet').classList.remove('hidden');
    const input = document.getElementById('country-sheet-search');
    input.value = '';
    renderCountrySheetList('');
  }

  function closeCountrySheet() {
    document.getElementById('country-sheet').classList.add('hidden');
  }

  function renderCountrySheetList(query) {
    const wrap = document.getElementById('country-sheet-list');
    const q = String(query || '').trim().toLowerCase();
    const liveMap = new Map(state.liveCountriesForService.map((c) => [c.id, c]));
    const allBase = state.countries.length ? state.countries : state.popularCountries;
    const merged = [
      ...state.liveCountriesForService,
      ...allBase.filter((c) => !liveMap.has(c.id)),
    ];

    const filtered = q
      ? merged.filter((c) => c.name.toLowerCase().includes(q) || String(c.id) === q)
      : merged;

    wrap.innerHTML = '';
    if (!filtered.length) {
      wrap.innerHTML = `<div class="empty-state">${escHtml(tr('no_countries'))}</div>`;
      return;
    }

    filtered.forEach((c) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'picker-option';
      const active = c.id === state.selectedCountryId;
      row.innerHTML = `
        <span class="picker-option-left">
          <span style="font-size:22px;">${c.flag || '🌍'}</span>
          <span style="display:flex;flex-direction:column;">
            <span>${escHtml(c.name)}</span>
            ${
              c.phones !== undefined
                ? `<span class="picker-stock-sub">${escHtml(tr('in_stock_n', { n: Number(c.phones || 0).toLocaleString() }))}</span>`
                : ''
            }
          </span>
        </span>
        <span class="picker-option-right">
          ${c.retailPrice !== null && c.retailPrice !== undefined ? `<span class="picker-price-badge ltr-num">${fmtPrice(c.retailPrice)}</span>` : ''}
          ${active ? '<span class="picker-check">✓</span>' : ''}
        </span>
      `;
      row.addEventListener('click', () => selectCountry(c));
      wrap.appendChild(row);
    });
  }

  // Purchase Confirmation Sheet
  function openConfirmBuySheet(service, country) {
    haptic('light');
    state.pendingBuy = { service, country };
    const retailCents = Math.max(1, Math.round(Number(country.retailPrice || 0) * 100));
    const balCents = state.wallet.balanceCents || 0;
    const canAfford = balCents >= retailCents;
    const ptsRate = state.referral.pointsPerUsd || 100;
    const requiredPoints =
      country.requiredPoints || Math.max(1, Math.ceil((retailCents / 100) * ptsRate));
    const ptsBal = Number(state.wallet.pointsBalance ?? state.referral.pointsBalance ?? 0);
    const canAffordPoints = ptsBal >= requiredPoints;
    const rate = state.config.starsPerUsd || 50;
    const starsNeeded = Math.max(1, Math.round((retailCents / 100) * rate));

    const body = document.getElementById('buy-sheet-body');
    body.innerHTML = `
      <div class="confirm-summary">
        <div class="confirm-row">
          <span>${escHtml(tr('row_service'))}</span>
          <span>${escHtml(service.name)}</span>
        </div>
        <div class="confirm-row">
          <span>${escHtml(tr('row_country'))}</span>
          <span>${country.flag || '🌍'} ${escHtml(country.name)}</span>
        </div>
        <div class="confirm-row">
          <span>${escHtml(tr('row_stock'))}</span>
          <span>${escHtml(tr('row_numbers', { n: Number(country.phones || 0).toLocaleString() }))}</span>
        </div>
        <div class="confirm-row">
          <span>${escHtml(tr('row_price'))}</span>
          <span class="ltr-num" style="color:var(--sky-600);">${fmtCents(retailCents)}</span>
        </div>
        <div class="confirm-row">
          <span>${escHtml(tr('row_balance'))}</span>
          <span class="ltr-num" style="color:${canAfford ? 'var(--emerald)' : 'var(--danger)'};">${fmtCents(balCents)}</span>
        </div>
      </div>

      <div class="vpn-tip-box">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>${escHtml(tr('vpn_tip_short', { country: country.name }))}</span>
      </div>

      <div class="confirm-guarantee">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:var(--emerald);">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <span>${escHtml(tr('guarantee'))}</span>
      </div>

      <div class="method-stack">
        ${
          canAfford
            ? `<button id="confirm-buy-cta" class="method-btn primary-method" type="button">
                 <span>${escHtml(tr('cta_get_number', { price: fmtCents(retailCents) }))}</span>
                 <span style="font-size:12px;opacity:0.9;">Wallet</span>
               </button>`
            : `<button class="method-btn short-method" type="button" disabled>
                 <span>${escHtml(tr('wallet_short_label', { need: fmtCents(retailCents - balCents) }))}</span>
               </button>`
        }
        ${
          canAffordPoints
            ? `<button id="confirm-buy-points-cta" class="method-btn points-method" type="button">
                 <span>${escHtml(tr('cta_get_with_points', { pts: requiredPoints.toLocaleString() }))}</span>
                 <span style="font-size:12px;font-weight:700;">Points</span>
               </button>`
            : `<button id="earn-more-points-cta" class="method-btn" type="button">
                 <span>${escHtml(tr('points_short_label', { bal: ptsBal.toLocaleString(), req: requiredPoints.toLocaleString() }))}</span>
               </button>`
        }
        <div class="micro-label" style="margin:6px 0 2px;">${escHtml(tr('pay_directly_label'))}</div>
        <button class="method-btn" data-direct-pay="stars" type="button">
          <span class="method-left"><span class="method-dot" style="background:#f59e0b;"></span><span>Telegram Stars</span></span>
          <span class="method-sub">${starsNeeded} Stars · Instant</span>
        </button>
        <button class="method-btn" data-direct-pay="binance" type="button">
          <span class="method-left"><span class="method-dot" style="background:#eab308;"></span><span>Binance Pay</span></span>
          <span class="method-sub">${fmtCents(retailCents)}</span>
        </button>
        <button class="method-btn" data-direct-pay="usdt_bep20" type="button">
          <span class="method-left"><span class="method-dot" style="background:#10b981;"></span><span>USDT (BEP20)</span></span>
          <span class="method-sub">BSC</span>
        </button>
        <button class="method-btn" data-direct-pay="usdc_bep20" type="button">
          <span class="method-left"><span class="method-dot" style="background:#3b82f6;"></span><span>USDC (BEP20)</span></span>
          <span class="method-sub">BSC</span>
        </button>
      </div>
    `;

    const buyBtn = document.getElementById('confirm-buy-cta');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => executePurchase(service, country, buyBtn, 'wallet'));
    }

    const ptsBtn = document.getElementById('confirm-buy-points-cta');
    if (ptsBtn) {
      ptsBtn.addEventListener('click', () => executePurchase(service, country, ptsBtn, 'points'));
    }

    const earnBtn = document.getElementById('earn-more-points-cta');
    if (earnBtn) {
      earnBtn.addEventListener('click', () => {
        closeBuySheet();
        setView('wallet');
        const card = document.getElementById('referral-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    body.querySelectorAll('[data-direct-pay]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.directPay;
        closeBuySheet();
        if (method === 'stars') {
          startStarsTopUp(retailCents / 100, service.code, country.id);
        } else {
          startCryptoOrder(method, retailCents, service.code, country.id);
        }
      });
    });

    document.getElementById('buy-sheet').classList.remove('hidden');
  }

  function closeBuySheet() {
    document.getElementById('buy-sheet').classList.add('hidden');
    state.pendingBuy = null;
  }

  async function executePurchase(service, country, btnEl, paymentMethod = 'wallet') {
    haptic('medium');
    btnEl.disabled = true;
    const prevHtml = btnEl.innerHTML;
    btnEl.textContent = tr('cta_activating');

    try {
      const res = await callEndpoint('buyNumber', {
        serviceCode: service.code,
        countryId: country.id,
        paymentMethod,
      });
      state.wallet.balanceCents = res.balanceCents;
      if (res.pointsBalance !== undefined) {
        state.wallet.pointsBalance = res.pointsBalance;
        state.referral.pointsBalance = res.pointsBalance;
      }
      state.orders.unshift(res);
      closeBuySheet();
      renderWallet();
      renderOrders();
      showToast(tr('toast_activated', { phone: String(res.phoneNumber).replace(/^\+/, '') }));
      switchTab('numbers');
    } catch (err) {
      btnEl.disabled = false;
      btnEl.innerHTML = prevHtml;
      if (err.parameters && err.parameters.code === 'INSUFFICIENT_BALANCE') {
        closeBuySheet();
        showToast(tr('toast_insufficient'));
        setView('wallet');
      } else if (err.parameters && err.parameters.code === 'INSUFFICIENT_POINTS') {
        closeBuySheet();
        showToast(tr('toast_insufficient_pts'));
        setView('wallet');
      } else {
        showToast(err.message || 'Error');
      }
    }
  }

  // My Numbers / Orders
  function renderOrders() {
    const activeCount = state.orders.filter((o) => o.status !== 'CANCEL' && o.status !== 'COMPLETE').length;
    const badge = document.getElementById('numbers-tab-badge');
    if (badge) {
      badge.textContent = String(activeCount);
      badge.classList.toggle('hidden', activeCount === 0);
    }

    const wrap = document.getElementById('orders-list');
    wrap.innerHTML = '';
    if (!state.orders.length) {
      wrap.innerHTML = `<div class="empty-state">${escHtml(tr('no_orders'))}</div>`;
      return;
    }

    state.orders.forEach((o) => {
      const phone = '+' + String(o.phoneNumber || '').replace(/^\+/, '');
      const statusLabel =
        o.status === 'OK'
          ? tr('status_ok')
          : o.status === 'COMPLETE'
            ? tr('status_complete')
            : o.status === 'CANCEL'
              ? tr('status_cancel')
              : tr('status_wait');
      const pillClass =
        o.status === 'OK' || o.status === 'COMPLETE'
          ? 'ok'
          : o.status === 'CANCEL'
            ? 'cancel'
            : '';

      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <div class="order-head">
          <div>
            <div class="order-phone">${escHtml(phone)}</div>
            <div class="order-meta">
              ${o.countryFlag || '🌍'} ${escHtml(o.countryName || o.countryId)} · ${escHtml(o.serviceName || o.serviceCode)}
              ${
                o.paymentMethod === 'points' && o.pointsSpent
                  ? ' · ' + Number(o.pointsSpent).toLocaleString() + ' ' + tr('pts_unit')
                  : o.retailCents
                    ? ' · ' + fmtCents(o.retailCents)
                    : ''
              }
            </div>
          </div>
          <span class="status-pill ${pillClass}">${escHtml(statusLabel)}</span>
        </div>

        ${
          o.smsCode
            ? `<div class="otp-panel" data-copy-otp="${escHtml(o.smsCode)}">
                 <span class="otp-label">${escHtml(tr('otp_tap_copy'))}</span>
                 <span class="otp-value">${escHtml(o.smsCode)}</span>
               </div>`
            : ''
        }

        ${
          o.status === 'WAIT_CODE' || o.status === 'WAIT_RESEND'
            ? `<div class="vpn-tip-box" style="margin:10px 0 0;">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="12" cy="12" r="10" />
                   <line x1="2" y1="12" x2="22" y2="12" />
                   <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                 </svg>
                 <span>${escHtml(tr('vpn_tip_short', { country: o.countryName || o.countryId }))}</span>
               </div>
               <div class="auto-poll-bar">
                 <span class="poll-pulse"></span>
                 <span>${escHtml(tr('auto_checking_sms'))}</span>
               </div>`
            : ''
        }

        <div class="order-actions">
          <button class="action-btn primary" data-act="check" type="button">${escHtml(tr('btn_check_sms'))}</button>
          <button class="action-btn" data-act="copy" type="button">${escHtml(tr('btn_copy'))}</button>
          <button class="action-btn danger" data-act="cancel" type="button">${escHtml(tr('btn_cancel'))}</button>
        </div>
      `;

      const otpBox = card.querySelector('[data-copy-otp]');
      if (otpBox) {
        otpBox.addEventListener('click', () => {
          navigator.clipboard && navigator.clipboard.writeText(o.smsCode);
          haptic('light');
          showToast(tr('toast_copied_otp'));
        });
      }

      card.querySelector('[data-act="copy"]').addEventListener('click', () => {
        navigator.clipboard && navigator.clipboard.writeText(phone);
        haptic('light');
        showToast(tr('toast_copied_phone'));
      });

      card.querySelector('[data-act="check"]').addEventListener('click', async () => {
        haptic('light');
        showToast(tr('toast_checking'));
        try {
          const res = await callEndpoint('checkStatus', { activationId: o.activationId });
          o.status = res.state || o.status;
          if (res.code) {
            o.smsCode = res.code;
            showToast(tr('toast_code_received', { code: res.code }));
          } else {
            showToast(res.state === 'WAIT_CODE' ? tr('toast_waiting') : res.state);
          }
          renderOrders();
        } catch (err) {
          showToast(err.message || 'Error');
        }
      });

      card.querySelector('[data-act="cancel"]').addEventListener('click', async () => {
        haptic('medium');
        try {
          const res = await callEndpoint('setActivationStatus', {
            activationId: o.activationId,
            status: 8,
          });
          o.status = 'CANCEL';
          state.wallet.balanceCents = res.balanceCents;
          if (res.pointsBalance !== undefined) {
            state.wallet.pointsBalance = res.pointsBalance;
            state.referral.pointsBalance = res.pointsBalance;
          }
          renderWallet();
          renderOrders();
          showToast(
            res.refundedPoints > 0
              ? tr('toast_cancelled_refund_pts', { pts: Number(res.refundedPoints).toLocaleString() })
              : res.refundedCents > 0
                ? tr('toast_cancelled_refund', { amt: fmtCents(res.refundedCents) })
                : tr('toast_cancelled')
          );
        } catch (err) {
          showToast(err.message || 'Error');
        }
      });

      wrap.appendChild(card);
    });

    syncSmsAutoPoller();
  }

  let smsPollTimer = null;
  let smsPollInFlight = false;

  function getWaitingOrders() {
    const now = Date.now();
    return state.orders.filter((o) => {
      if (o.status !== 'WAIT_CODE' && o.status !== 'WAIT_RESEND') return false;
      if (o.createdAt) {
        const ts = new Date(o.createdAt).getTime();
        if (Number.isFinite(ts) && now - ts > 20 * 60 * 1000) return false;
      }
      return true;
    });
  }

  function syncSmsAutoPoller() {
    const waiting = getWaitingOrders();
    if (!waiting.length) {
      if (smsPollTimer) {
        clearInterval(smsPollTimer);
        smsPollTimer = null;
      }
      return;
    }
    if (smsPollTimer) return;
    smsPollTimer = setInterval(pollWaitingOrdersOnce, 5000);
  }

  async function pollWaitingOrdersOnce() {
    if (smsPollInFlight || document.hidden) return;
    const waiting = getWaitingOrders().slice(0, 3);
    if (!waiting.length) {
      syncSmsAutoPoller();
      return;
    }
    smsPollInFlight = true;
    let changed = false;
    try {
      for (const o of waiting) {
        try {
          const res = await callEndpoint('checkStatus', { activationId: o.activationId });
          if (res && res.state && res.state !== o.status) {
            o.status = res.state;
            changed = true;
          }
          if (res && res.code && res.code !== o.smsCode) {
            o.smsCode = res.code;
            changed = true;
            haptic('heavy');
            showToast(tr('toast_code_received', { code: res.code }));
          }
        } catch {
          // Ignore transient poll errors
        }
      }
    } finally {
      smsPollInFlight = false;
      if (changed) {
        renderOrders();
      } else {
        syncSmsAutoPoller();
      }
    }
  }

  // Wallet & Referral View
  function renderWallet() {
    const bal = fmtCents(state.wallet.balanceCents);
    const ptsBal = Number(state.wallet.pointsBalance ?? state.referral.pointsBalance ?? 0);
    document.getElementById('header-balance').textContent = bal;
    document.getElementById('wallet-balance').textContent = bal;
    document.getElementById('wallet-points-balance').textContent = `${ptsBal.toLocaleString()} ${tr('pts_unit')}`;
    document.getElementById('wallet-deposited').textContent = fmtCents(state.wallet.totalDepositedCents);
    document.getElementById('wallet-spent').textContent = fmtCents(state.wallet.totalSpentCents);

    const heroPtsEl = document.getElementById('hero-points-label');
    if (heroPtsEl) {
      heroPtsEl.textContent = tr('hero_points_pill', { pts: ptsBal.toLocaleString() });
    }

    // Referral card
    const ref = state.referral || {};
    const rewardBadge = document.getElementById('ref-reward-badge');
    if (rewardBadge) {
      rewardBadge.textContent = tr('ref_reward_badge', { pts: Number(ref.rewardPoints || 10).toLocaleString() });
    }
    const statPts = document.getElementById('ref-stat-points-val');
    if (statPts) statPts.textContent = ptsBal.toLocaleString();
    const statFriends = document.getElementById('ref-stat-friends-val');
    if (statFriends) statFriends.textContent = Number(ref.referralCount || 0).toLocaleString();
    const statRate = document.getElementById('ref-stat-rate-val');
    if (statRate) statRate.textContent = `${Number(ref.pointsPerUsd || 100)}/$1`;
    const linkEl = document.getElementById('ref-invite-link');
    if (linkEl) linkEl.textContent = ref.inviteLink || '—';

    // Points Activity list
    const ptsTxWrap = document.getElementById('points-tx-list');
    if (ptsTxWrap) {
      ptsTxWrap.innerHTML = '';
      const ptsList = Array.isArray(ref.pointTransactions) ? ref.pointTransactions : [];
      if (!ptsList.length) {
        ptsTxWrap.innerHTML = `<div class="empty-state">${escHtml(tr('no_points_tx'))}</div>`;
      } else {
        ptsList.forEach((ptx) => {
          const isPos = ptx.amountPoints >= 0;
          const row = document.createElement('div');
          row.className = 'tx-row';
          row.innerHTML = `
            <div>
              <div class="tx-note">${escHtml(ptx.note || ptx.type)}</div>
              <div class="tx-type">${escHtml(String(ptx.type || '').replaceAll('_', ' '))}</div>
            </div>
            <div class="tx-amt ${isPos ? 'pos' : 'neg'}">${isPos ? '+' : '-'}${Math.abs(Number(ptx.amountPoints || 0)).toLocaleString()} ${escHtml(tr('pts_unit'))}</div>
          `;
          ptsTxWrap.appendChild(row);
        });
      }
    }

    const rate = state.config.starsPerUsd || 50;
    document.getElementById('stars-rate-label').textContent = tr('stars_rate', { rate });

    const amtInput = document.getElementById('topup-custom-amount');
    const currentUsd = Math.max(1, Number(amtInput.value) || 10);

    const presetsEl = document.getElementById('wallet-amount-presets');
    presetsEl.innerHTML = '';
    [2, 5, 10, 25, 50, 100].forEach((usd) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'amt-chip' + (Math.abs(currentUsd - usd) < 0.001 ? ' active' : '');
      btn.textContent = `$${usd}`;
      btn.addEventListener('click', () => {
        haptic('light');
        amtInput.value = String(usd);
        renderWallet();
      });
      presetsEl.appendChild(btn);
    });

    const methodsWrap = document.getElementById('wallet-method-list');
    methodsWrap.innerHTML = '';
    const starsTotal = Math.max(1, Math.round(currentUsd * rate));
    const methodDefs = [
      { id: 'stars', label: 'Telegram Stars', color: '#f59e0b', sub: `${starsTotal} Stars · Instant` },
      { id: 'binance', label: 'Binance Pay', color: '#eab308', sub: 'UID · Auto-Verify' },
      { id: 'usdt_bep20', label: 'USDT (BEP20)', color: '#10b981', sub: 'BSC · QR + Auto-Verify' },
      { id: 'usdc_bep20', label: 'USDC (BEP20)', color: '#3b82f6', sub: 'BSC · QR + Auto-Verify' },
    ];

    methodDefs.forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'method-btn';
      btn.innerHTML = `
        <span class="method-left">
          <span class="method-dot" style="background:${m.color};"></span>
          <span>${escHtml(m.label)}</span>
        </span>
        <span class="method-sub">${escHtml(m.sub)}</span>
      `;
      btn.addEventListener('click', () => {
        const val = Number(amtInput.value);
        const cents = Math.round(val * 100);
        if (!Number.isFinite(val) || cents < 100) {
          showToast('Enter at least $1.00');
          return;
        }
        if (m.id === 'stars') {
          startStarsTopUp(cents / 100);
        } else {
          startCryptoOrder(m.id, cents);
        }
      });
      methodsWrap.appendChild(btn);
    });

    const txWrap = document.getElementById('tx-list');
    txWrap.innerHTML = '';
    if (!state.transactions.length) {
      txWrap.innerHTML = `<div class="empty-state">${escHtml(tr('no_tx'))}</div>`;
      return;
    }

    state.transactions.forEach((tx) => {
      const isPos = tx.amountCents >= 0;
      const row = document.createElement('div');
      row.className = 'tx-row';
      row.innerHTML = `
        <div>
          <div class="tx-note">${escHtml(tx.note || tx.type)}</div>
          <div class="tx-type">${escHtml(String(tx.type || '').replace('_', ' '))}</div>
        </div>
        <div class="tx-amt ${isPos ? 'pos' : 'neg'}">${isPos ? '+' : '-'}${fmtCents(Math.abs(tx.amountCents))}</div>
      `;
      txWrap.appendChild(row);
    });
  }

  function closePaySheet() {
    document.getElementById('pay-sheet').classList.add('hidden');
  }

  async function startCryptoOrder(method, amountCents, serviceCode, countryId) {
    haptic('medium');
    try {
      const order = await callEndpoint('createPaymentOrder', {
        method,
        amountCents,
        serviceCode: serviceCode || undefined,
        countryId: countryId || undefined,
      });
      openPaymentOrderSheet(order);
    } catch (err) {
      showToast(err.message || 'Could not create payment order');
    }
  }

  function openPaymentOrderSheet(order) {
    const isBinance = order.method === 'binance';
    const amtStr = (order.amountCents / 100).toFixed(2);
    document.getElementById('pay-sheet-title').textContent = order.title;

    const body = document.getElementById('pay-sheet-body');
    body.innerHTML = `
      <div class="confirm-summary">
        <div class="confirm-row">
          <span>${escHtml(tr('pay_order_id'))}</span>
          <span>#${order.orderId}</span>
        </div>
        <div class="confirm-row">
          <span>${escHtml(tr('pay_exact_amount'))}</span>
          <span class="ltr-num">${amtStr} ${escHtml(order.currency)}</span>
        </div>
      </div>

      ${
        !isBinance
          ? `<div class="session-notice">
               <strong>${escHtml(tr('pay_session_timer', { min: order.sessionMinutes, time: order.kabulDeadline }))}</strong><br/>
               ${escHtml(tr('pay_exact_warn'))}
             </div>`
          : ''
      }

      ${order.qrUrl ? `<div class="qr-frame"><img src="${order.qrUrl}" alt="Payment QR Code" /></div>` : ''}

      <div class="micro-label" style="margin-top:8px;">
        ${
          isBinance
            ? escHtml(tr('pay_binance_hint'))
            : escHtml(tr('pay_wallet_hint', { currency: order.currency, network: order.network }))
        }
      </div>

      <div class="copy-address-row">
        <span class="copy-address-text">${escHtml(order.address)}</span>
        <button id="copy-order-addr" class="copy-pill" type="button">${escHtml(tr('pay_copy'))}</button>
      </div>

      ${
        !isBinance
          ? `<div class="network-warn">${escHtml(tr('pay_network_only', { currency: order.currency, network: order.network }))}</div>`
          : ''
      }

      <form id="verify-order-form" class="clean-form" style="margin-top:12px;">
        <label class="input-label">
          <span>${isBinance ? 'Binance Pay Order ID' : 'Transaction ID (TxID)'}</span>
          <input id="verify-txid-input" type="text" placeholder="${escHtml(
            isBinance ? tr('pay_tx_placeholder_binance') : tr('pay_tx_placeholder_crypto')
          )}" required />
        </label>
        <button id="verify-order-btn" type="submit" class="primary-cta">${escHtml(tr('pay_verify_btn'))}</button>
      </form>
    `;

    document.getElementById('copy-order-addr').addEventListener('click', () => {
      navigator.clipboard && navigator.clipboard.writeText(order.address);
      haptic('light');
      showToast(tr('toast_copied_pay'));
    });

    document.getElementById('verify-order-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const txId = document.getElementById('verify-txid-input').value.trim();
      const btn = document.getElementById('verify-order-btn');
      if (!txId) return;
      btn.disabled = true;
      btn.textContent = tr('pay_verifying');
      try {
        const res = await callEndpoint('verifyPaymentOrder', { orderId: order.orderId, txId });
        if (res.status === 'approved') {
          if (res.balanceCents !== null && res.balanceCents !== undefined) {
            state.wallet.balanceCents = res.balanceCents;
          }
          if (res.activatedOrder) {
            state.orders.unshift(res.activatedOrder);
          }
          closePaySheet();
          renderWallet();
          renderOrders();
          showToast(
            res.activatedOrder
              ? tr('toast_activated', { phone: String(res.activatedOrder.phoneNumber).replace(/^\+/, '') })
              : tr('toast_topup_ok')
          );
          if (res.activatedOrder) {
            setView('workspace');
            switchTab('numbers');
          }
          setTimeout(bootstrap, 900);
        } else {
          closePaySheet();
          showToast(res.reason || tr('toast_deposit_ok', { id: order.orderId }));
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = tr('pay_verify_btn');
        showToast(err.message || 'Verification failed');
      }
    });

    document.getElementById('pay-sheet').classList.remove('hidden');
  }

  async function startStarsTopUp(amountUsd, serviceCode, countryId) {
    haptic('medium');
    try {
      const res = await callEndpoint('createStarsInvoice', {
        amountUsd,
        serviceCode: serviceCode || undefined,
        countryId: countryId || undefined,
      });
      if (tg && typeof tg.openInvoice === 'function') {
        tg.openInvoice(res.invoiceUrl, (status) => {
          if (status === 'paid') {
            showToast(tr('toast_topup_ok'));
            setTimeout(() => {
              bootstrap();
              if (serviceCode) {
                setView('workspace');
                switchTab('numbers');
              }
            }, 1300);
          }
        });
      } else {
        window.open(res.invoiceUrl, '_blank');
      }
    } catch (err) {
      showToast(err.message || 'Error');
    }
  }

  async function loadAdminOverview(page = 0) {
    if (!state.isOwner) return;
    state.admin.loading = true;
    renderAdminView();
    try {
      const res = await callEndpoint('getAdminOverview', { page, pageSize: 15 });
      state.admin.stats = res.stats || null;
      state.admin.markupPercent = res.markupPercent ?? 20;
      state.admin.gatewayBalance = res.gatewayBalance ?? null;
      state.admin.usersPage = res.usersPage || { users: [], total: 0, page: 0, totalPages: 1 };
    } catch (err) {
      showToast(err.message || 'Could not load admin overview');
    } finally {
      state.admin.loading = false;
      renderAdminView();
    }
  }

  function renderAdminView() {
    const kpiGrid = document.getElementById('admin-kpi-grid');
    const usersWrap = document.getElementById('admin-users-list');
    const countBadge = document.getElementById('admin-users-count');
    const pager = document.getElementById('admin-pagination');
    const pageLabel = document.getElementById('admin-page-label');
    const subEl = document.getElementById('admin-markup-sub');
    if (!kpiGrid || !usersWrap) return;

    const isFa = state.lang === 'fa';
    const ptsUnit = tr('pts_unit');

    if (state.admin.loading && !state.admin.stats) {
      kpiGrid.innerHTML = Array.from({ length: 6 })
        .map(() => `<div class="admin-kpi-card"><div class="sk-block" style="width:70px;height:11px;margin-bottom:6px;"></div><div class="sk-block" style="width:90px;height:20px;"></div></div>`)
        .join('');
      usersWrap.innerHTML = `<div class="empty-state">${isFa ? 'در حال بارگذاری…' : 'Loading…'}</div>`;
      return;
    }

    const s = state.admin.stats || {};
    const gwText = state.admin.gatewayBalance !== null ? `$${state.admin.gatewayBalance}` : '—';
    if (subEl) {
      subEl.textContent = isFa
        ? `حاشیه سود: +${state.admin.markupPercent}% · درگاه: ${gwText}`
        : `Markup: +${state.admin.markupPercent}% · Gateway: ${gwText}`;
    }

    const kpis = [
      {
        label: isFa ? 'موجودی درگاه' : 'Gateway Balance',
        val: gwText,
        sub: isFa ? 'درگاه اصلی' : 'Provider API',
      },
      {
        label: isFa ? 'مجموع موجودی دلاری' : 'User USD Held',
        val: fmtCents(s.totalUserBalancesCents || 0),
        sub: isFa ? `واریز: ${fmtCents(s.totalDepositedCents || 0)}` : `Dep: ${fmtCents(s.totalDepositedCents || 0)}`,
      },
      {
        label: isFa ? 'امتیاز کاربران' : 'User Points Held',
        val: `${Number(s.totalPointsBalance || 0).toLocaleString()} ${ptsUnit}`,
        sub: isFa ? `دعوت‌ها: ${Number(s.totalReferrals || 0).toLocaleString()}` : `Invites: ${Number(s.totalReferrals || 0).toLocaleString()}`,
      },
      {
        label: isFa ? 'درآمد ناخالص' : 'Gross Revenue',
        val: fmtCents(s.totalRevenueCents || 0),
        sub: isFa ? `هزینه: ${fmtCents(s.totalWholesaleCents || 0)}` : `Cost: ${fmtCents(s.totalWholesaleCents || 0)}`,
      },
      {
        label: isFa ? 'سود خالص' : 'Net Profit',
        val: fmtCents(s.totalCommissionCents || 0),
        sub: `+${state.admin.markupPercent}%`,
      },
      {
        label: isFa ? 'سفارش‌ها' : 'Orders',
        val: Number(s.totalOrders || 0).toLocaleString(),
        sub: isFa
          ? `${Number(s.activeOrders || 0)} فعال · ${Number(s.pointsOrders || 0)} امتیازی`
          : `${Number(s.activeOrders || 0)} active · ${Number(s.pointsOrders || 0)} pts`,
      },
    ];

    kpiGrid.innerHTML = kpis
      .map(
        (k) => `
      <div class="admin-kpi-card">
        <span class="admin-kpi-label">${escHtml(k.label)}</span>
        <span class="admin-kpi-val ltr-num">${escHtml(k.val)}</span>
        <span class="admin-kpi-sub">${escHtml(k.sub)}</span>
      </div>`
      )
      .join('');

    const up = state.admin.usersPage || { users: [], total: 0, page: 0, totalPages: 1 };
    if (countBadge) countBadge.textContent = String(up.total || 0);
    if (pager) {
      pager.classList.toggle('hidden', (up.totalPages || 1) <= 1);
      if (pageLabel) pageLabel.textContent = `${(up.page || 0) + 1}/${up.totalPages || 1}`;
      const prevBtn = document.getElementById('admin-prev-btn');
      const nextBtn = document.getElementById('admin-next-btn');
      if (prevBtn) prevBtn.disabled = (up.page || 0) <= 0;
      if (nextBtn) nextBtn.disabled = (up.page || 0) >= (up.totalPages || 1) - 1;
    }

    const q = String(state.admin.searchQuery || '').trim();
    const list = q
      ? (up.users || []).filter((u) => String(u.userId).includes(q))
      : up.users || [];

    usersWrap.innerHTML = '';
    if (!list.length) {
      usersWrap.innerHTML = `<div class="empty-state">${isFa ? 'کاربری یافت نشد.' : 'No users found.'}</div>`;
      return;
    }

    list.forEach((u) => {
      const row = document.createElement('div');
      row.className = 'admin-user-row';
      const roleTag =
        u.role === 'owner'
          ? `<span class="offer-tag">${isFa ? 'مالک' : 'Owner'}</span>`
          : u.role === 'blocked'
            ? `<span class="status-pill cancel">${isFa ? 'مسدود' : 'Blocked'}</span>`
            : '';

      const metaLine = isFa
        ? `واریز: ${fmtCents(u.totalDepositedCents)} · خرید: ${fmtCents(u.totalSpentCents)} · سفارش: ${u.orderCount} · دعوت: ${u.referralCount}`
        : `Dep: ${fmtCents(u.totalDepositedCents)} · Spent: ${fmtCents(u.totalSpentCents)} · Orders: ${u.orderCount} · Invites: ${u.referralCount}`;

      row.innerHTML = `
        <div style="min-width:0;">
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
            <button class="admin-user-id-btn ltr-num" type="button" data-copy-uid="${u.userId}">${u.userId}</button>
            ${roleTag}
          </div>
          <div class="admin-user-meta">${escHtml(metaLine)}</div>
        </div>
        <div class="admin-user-balances">
          <span class="admin-bal-usd ltr-num">${fmtCents(u.balanceCents)}</span>
          <span class="admin-bal-pts ltr-num">${Number(u.pointsBalance || 0).toLocaleString()} ${escHtml(ptsUnit)}</span>
        </div>
      `;

      row.querySelector('[data-copy-uid]').addEventListener('click', () => {
        navigator.clipboard && navigator.clipboard.writeText(String(u.userId));
        haptic('light');
        showToast(tr('toast_copied_id'));
      });
      usersWrap.appendChild(row);
    });
  }

  async function bootstrap() {
    applyLanguageUI();
    try {
      const data = await callEndpoint('getBootstrap', {});
      if (data.lang && I18N[data.lang]) {
        state.lang = data.lang;
        try {
          localStorage.setItem('nl_lang', state.lang);
        } catch {}
      }
      state.isOwner = Boolean(data.user && data.user.isOwner);
      const adminBtn = document.getElementById('header-admin-btn');
      if (adminBtn) adminBtn.classList.toggle('hidden', !state.isOwner);
      state.wallet = data.wallet || state.wallet;
      if (data.referral) {
        state.referral = { ...state.referral, ...data.referral };
      }
      state.orders = data.orders || [];
      state.transactions = data.transactions || [];
      state.config = data.config || state.config;
      state.catalogStats = data.catalogStats || state.catalogStats;

      if (Array.isArray(data.services) && data.services.length) {
        state.services = data.services;
      }
      if (Array.isArray(data.popularServices) && data.popularServices.length) {
        state.popularServices = data.popularServices;
      }
      if (Array.isArray(data.countries) && data.countries.length) {
        state.countries = data.countries;
      }
      if (Array.isArray(data.popularCountries) && data.popularCountries.length) {
        state.popularCountries = data.popularCountries;
      }

      const foundSvc = state.services.find((s) => s.code === state.selectedServiceCode);
      if (foundSvc) state.selectedService = foundSvc;
      const foundCtry = state.countries.find((c) => c.id === state.selectedCountryId);
      if (foundCtry) state.selectedCountry = foundCtry;

      applyLanguageUI();
      loadServiceOffers(state.selectedServiceCode);

      if (data.langSelected === false) {
        openLangSheet();
      }
    } catch (err) {
      showToast(err.message || 'Error');
    }
  }

  // Wire Event Listeners
  document.querySelectorAll('.seg-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('header-balance-btn').addEventListener('click', () => {
    setView(state.view === 'wallet' ? 'workspace' : 'wallet');
  });
  document.getElementById('header-back-btn').addEventListener('click', () => setView('workspace'));

  const headerAdminBtn = document.getElementById('header-admin-btn');
  if (headerAdminBtn) {
    headerAdminBtn.addEventListener('click', () => {
      setView(state.view === 'admin' ? 'workspace' : 'admin');
    });
  }
  const refreshAdminBtn = document.getElementById('refresh-admin-btn');
  if (refreshAdminBtn) {
    refreshAdminBtn.addEventListener('click', () => {
      haptic('light');
      loadAdminOverview(state.admin.usersPage.page || 0);
      showToast(tr('toast_refreshed'));
    });
  }
  const adminPrevBtn = document.getElementById('admin-prev-btn');
  if (adminPrevBtn) {
    adminPrevBtn.addEventListener('click', () => {
      const p = Math.max(0, (state.admin.usersPage.page || 0) - 1);
      loadAdminOverview(p);
    });
  }
  const adminNextBtn = document.getElementById('admin-next-btn');
  if (adminNextBtn) {
    adminNextBtn.addEventListener('click', () => {
      const p = Math.min((state.admin.usersPage.totalPages || 1) - 1, (state.admin.usersPage.page || 0) + 1);
      loadAdminOverview(p);
    });
  }
  const adminSearchInput = document.getElementById('admin-user-search');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', (e) => {
      state.admin.searchQuery = e.target.value;
      renderAdminView();
    });
  }

  const heroRefPill = document.getElementById('hero-referral-pill');
  if (heroRefPill) {
    heroRefPill.addEventListener('click', () => {
      setView('wallet');
      const card = document.getElementById('referral-card');
      if (card) setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    });
  }

  const copyRefBtn = document.getElementById('copy-ref-link-btn');
  if (copyRefBtn) {
    copyRefBtn.addEventListener('click', () => {
      const link = state.referral && state.referral.inviteLink;
      if (!link) return;
      navigator.clipboard && navigator.clipboard.writeText(link);
      haptic('light');
      showToast(tr('toast_copied_ref'));
    });
  }

  const shareRefBtn = document.getElementById('share-ref-link-btn');
  if (shareRefBtn) {
    shareRefBtn.addEventListener('click', () => {
      const link = state.referral && state.referral.inviteLink;
      if (!link) return;
      haptic('medium');
      const shareText =
        state.lang === 'fa'
          ? 'شماره مجازی و سرویس‌های دیجیتال آنی در یک‌تپ (YekTap)'
          : 'Instant virtual numbers & digital services on YekTap';
      const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;
      if (tg && typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    });
  }

  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    haptic('light');
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  document.getElementById('open-lang-sheet').addEventListener('click', openLangSheet);
  document.getElementById('close-lang-sheet').addEventListener('click', closeLangSheet);
  document.getElementById('lang-sheet').addEventListener('click', (e) => {
    if (e.target.id === 'lang-sheet') closeLangSheet();
  });

  document.getElementById('open-service-picker').addEventListener('click', openServiceSheet);
  document.getElementById('smart-pick-service-btn').addEventListener('click', openServiceSheet);
  document.getElementById('close-service-sheet').addEventListener('click', closeServiceSheet);
  document.getElementById('service-sheet').addEventListener('click', (e) => {
    if (e.target.id === 'service-sheet') closeServiceSheet();
  });
  document.getElementById('service-sheet-search').addEventListener('input', (e) => {
    renderServiceSheetList(e.target.value);
  });

  document.getElementById('open-country-picker').addEventListener('click', openCountrySheet);
  document.getElementById('close-country-sheet').addEventListener('click', closeCountrySheet);
  document.getElementById('country-sheet').addEventListener('click', (e) => {
    if (e.target.id === 'country-sheet') closeCountrySheet();
  });
  document.getElementById('country-sheet-search').addEventListener('input', (e) => {
    renderCountrySheetList(e.target.value);
  });

  document.getElementById('refresh-manual-btn').addEventListener('click', () => {
    haptic('light');
    loadServiceOffers(state.selectedServiceCode);
    showToast(tr('toast_refreshed'));
  });

  document.querySelectorAll('#smart-sort-strip .sort-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      haptic('light');
      document.querySelectorAll('#smart-sort-strip .sort-pill').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.smartSort = btn.dataset.smartSort;
      renderSmartBuy();
    });
  });

  document.getElementById('close-buy-sheet').addEventListener('click', closeBuySheet);
  document.getElementById('buy-sheet').addEventListener('click', (e) => {
    if (e.target.id === 'buy-sheet') closeBuySheet();
  });

  document.getElementById('close-pay-sheet').addEventListener('click', closePaySheet);
  document.getElementById('pay-sheet').addEventListener('click', (e) => {
    if (e.target.id === 'pay-sheet') closePaySheet();
  });

  document.getElementById('refresh-orders-btn').addEventListener('click', () => {
    haptic('light');
    bootstrap();
    showToast(tr('toast_refreshed'));
  });

  document.getElementById('topup-custom-amount').addEventListener('input', () => {
    renderWallet();
  });

  bootstrap();
})();
