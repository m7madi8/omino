(function (global) {
  const O = global.OMINO;
  if (!O) return;

  function group(en, ar, cities) {
    return { en, ar, cities: cities.map(([e, a]) => ({ en: e, ar: a })) };
  }

  const places = {
    ps: {
      en: 'Palestine',
      ar: 'فلسطين',
      groups: [
        group('Jerusalem', 'القدس', [
          ['Jerusalem', 'القدس'],
          ['Abu Dis', 'أبو ديس'],
          ['Al-Eizariya', 'العيزرية'],
          ['Al-Ram', 'الرام'],
          ['Beit Hanina', 'بيت حنينا'],
          ['Shuafat', 'شعفاط'],
          ['Anata', 'عناتا'],
          ['Kafr Aqab', 'كفر عقب'],
          ['Hizma', 'حزما'],
          ['Jaba (Jerusalem)', 'جبع'],
          ['Qatanna', 'قطنة'],
          ['Biddu', 'بدو'],
          ['Bir Nabala', 'بير نبالا'],
          ['Beit Iksa', 'بيت إكسا'],
          ['Beit Surik', 'بيت سوريك'],
          ['Qalandiya', 'قلنديا'],
          ['Rafat', 'رافات'],
          ['Beit Anan', 'بيت عنان'],
          ['Beit Duqqu', 'بيت دقو'],
          ['Al-Qubeiba', 'القبيبة'],
          ['Al-Jib', 'الجيب'],
          ['Beit Ijza', 'بيت إجزا'],
          ['An-Nabi Samwil', 'النبي صموئيل']
        ]),
        group('Ramallah and Al-Bireh', 'رام الله والبيرة', [
          ['Ramallah', 'رام الله'],
          ['Al-Bireh', 'البيرة'],
          ['Beitunia', 'بيتونيا'],
          ['Birzeit', 'بيرزيت'],
          ['Silwad', 'سلواد'],
          ['Deir Dibwan', 'دير دبوان'],
          ['Ni\'lin', 'نعلين'],
          ['Bil\'in', 'بلعين'],
          ['Aboud', 'عابود'],
          ['Beit Liqya', 'بيت لقيا'],
          ['Beit Sira', 'بيت سيرا'],
          ['Turmus Ayya', 'ترمسعيا'],
          ['Sinjil', 'سنجل'],
          ['Al-Mazra\'a ash-Sharqiya', 'المزرعة الشرقية'],
          ['Al-Mazra\'a al-Qibliya', 'المزرعة القبلية'],
          ['Kobar', 'كوبر'],
          ['At-Tayba (Ramallah)', 'الطيبة'],
          ['Deir Abu Mash\'al', 'دير أبو مشعل'],
          ['Deir Ghassana', 'دير غسانة'],
          ['Beit Rima', 'بيت ريما'],
          ['Kafr Ein', 'كفر عين'],
          ['Atara', 'عطارة'],
          ['Abwein', 'عبوين'],
          ['Saffa', 'صفا'],
          ['Shuqba', 'شقبة'],
          ['Qibya', 'قبيا'],
          ['Kharbatha Bani Harith', 'خربثا بني حارث'],
          ['Beit Ur al-Fauqa', 'بيت عور الفوقا'],
          ['Beit Ur al-Tahta', 'بيت عور التحتا'],
          ['Budrus', 'بدرس'],
          ['Jifna', 'جفنا'],
          ['Ein Siniya', 'عين سينيا'],
          ['Abu Qash', 'أبو قش'],
          ['An-Nabi Salih', 'النبي صالح'],
          ['Qarawat Bani Zeid', 'قراوة بني زيد'],
          ['Kafr Malik', 'كفر مالك'],
          ['Rammun', 'رمون'],
          ['Deir Ibzi', 'دير إبزيع'],
          ['Ras Karkar', 'رأس كركر'],
          ['Ein Qiniya', 'عين قينيا'],
          ['Kafr Ni\'ma', 'كفر نعمة'],
          ['Deir Ammar', 'دير عمار'],
          ['Umm Safa', 'أم صفا'],
          ['Deir Jarir', 'دير جرير'],
          ['Beitillu', 'بيتللو'],
          ['Jamal', 'جمّالا'],
          ['Mazari\' an-Nubani', 'مزارع النوباني']
        ]),
        group('Nablus', 'نابلس', [
          ['Nablus', 'نابلس'],
          ['Huwara', 'حوارة'],
          ['Beita', 'بيتا'],
          ['Awarta', 'عورتا'],
          ['Asira ash-Shamaliya', 'عصيرة الشمالية'],
          ['Asira al-Qibliya', 'عصيرة القبلية'],
          ['Aqraba', 'عقربا'],
          ['Beit Furik', 'بيت فوريك'],
          ['Beit Iba', 'بيت إيبا'],
          ['Beit Wazan', 'بيت وزن'],
          ['Burqa (Nablus)', 'برقة'],
          ['Deir Sharaf', 'دير شرف'],
          ['Duma', 'دومة'],
          ['Einabus', 'عينابوس'],
          ['Jamma\'in', 'جماعين'],
          ['Jurish', 'جوريش'],
          ['Kafr Qallil', 'كفر قليل'],
          ['Madama', 'مادما'],
          ['Odala', 'أودلا'],
          ['Qabalan', 'قبلان'],
          ['Qaryut', 'قريوت'],
          ['Qusra', 'قصرة'],
          ['Rujeib', 'روجيب'],
          ['Salim', 'سالم'],
          ['Sarra', 'صرة'],
          ['Talfit', 'تلفيت'],
          ['Tell', 'تل'],
          ['Urif', 'عوريف'],
          ['Yanun', 'يانون'],
          ['Zawata', 'زواتا'],
          ['Beit Dajan', 'بيت دجن'],
          ['Azmut', 'عزموط'],
          ['Iraq Burin', 'عراق بورين'],
          ['Osarin', 'أوصارين']
        ]),
        group('Hebron', 'الخليل', [
          ['Hebron', 'الخليل'],
          ['Dura', 'دورا'],
          ['Yatta', 'يطا'],
          ['Halhul', 'حلحول'],
          ['Bani Na\'im', 'بني نعيم'],
          ['Adh-Dhahiriya', 'الظاهرية'],
          ['Tarqumiyah', 'ترقوميا'],
          ['Idhna', 'إذنا'],
          ['Beit Ummar', 'بيت أمر'],
          ['Beit Kahil', 'بيت كاحل'],
          ['Beit Awwa', 'بيت عوا'],
          ['Beit Ula', 'بيت أولا'],
          ['Sa\'ir', 'سعير'],
          ['Ash-Shuyukh', 'الشيوخ'],
          ['Surif', 'صوريف'],
          ['Taffuh', 'تفوح'],
          ['Kharas', 'خاراس'],
          ['Nuba', 'نوبا'],
          ['Deir Samit', 'دير سامت'],
          ['As-Samu', 'السموع'],
          ['Ar-Rihiya', 'الريحية'],
          ['Beit Einun', 'بيت عينون'],
          ['Hadab al-Fawwar', 'حدب الفوّار'],
          ['Al-Fawwar', 'الفوّار'],
          ['Al-Arrub', 'العرّوب'],
          ['Deir al-Asal al-Fauqa', 'دير العسل الفوقا'],
          ['Deir al-Asal at-Tahta', 'دير العسل التحتا'],
          ['Al-Kum', 'الكوم'],
          ['Al-Burj', 'البرج'],
          ['Karma', 'كرمة'],
          ['Ar-Ramadin', 'الرمادين']
        ]),
        group('Bethlehem', 'بيت لحم', [
          ['Bethlehem', 'بيت لحم'],
          ['Beit Jala', 'بيت جالا'],
          ['Beit Sahour', 'بيت ساحور'],
          ['Al-Khader', 'الخضر'],
          ['Ad-Doha', 'الدوحة'],
          ['Battir', 'بتير'],
          ['Husan', 'حوسان'],
          ['Nahalin', 'نحالين'],
          ['Za\'atara', 'زعترة'],
          ['Tuqu', 'تقوع'],
          ['Jannatah', 'جناتا'],
          ['Artas', 'أرطاس'],
          ['Al-Walaja', 'الولجة'],
          ['Wadi Fukin', 'وادي فوكين'],
          ['Jurat ash-Sham\'a', 'جورة الشمعة'],
          ['Marah Rabah', 'مراح رباح'],
          ['Ubeidiya', 'العبيدية'],
          ['Dar Salah', 'دار صلاح'],
          ['Hindaza', 'هندازة']
        ]),
        group('Jenin', 'جنين', [
          ['Jenin', 'جنين'],
          ['Qabatiya', 'قباطية'],
          ['Ya\'bad', 'يعبد'],
          ['Arraba', 'عرابة'],
          ['Jaba (Jenin)', 'جبع'],
          ['Silat al-Harithiya', 'سيلة الحارثية'],
          ['Silat ad-Dhahr', 'سيلة الظهر'],
          ['Zababdeh', 'الزبابدة'],
          ['Meithalun', 'ميثلون'],
          ['Sanur', 'صانور'],
          ['Burqin', 'برقين'],
          ['Kafr Dan', 'كفر دان'],
          ['Kafr Ra\'i', 'كفر راعي'],
          ['Ajja', 'عجّة'],
          ['Anza', 'عنزة'],
          ['Deir Abu Da\'if', 'دير أبو ضعيف'],
          ['Faqqua', 'فقوعة'],
          ['Fandaqumiya', 'الفندقومية'],
          ['Jalamah', 'الجلمة'],
          ['Jalqamus', 'الجلقموس'],
          ['Kafr Qud', 'كفر قود'],
          ['Misilyah', 'مسيلة'],
          ['Rummana', 'رمانة'],
          ['Siris', 'سيريس'],
          ['Tannin', 'تعنّك'],
          ['Al-Yamun', 'اليامون'],
          ['Bir al-Basha', 'بئر الباشا'],
          ['Kufeirit', 'كفيرت'],
          ['Nazlat ash-Sheikh Zeid', 'نزلة الشيخ زيد']
        ]),
        group('Tulkarm', 'طولكرم', [
          ['Tulkarm', 'طولكرم'],
          ['Anabta', 'عنبتا'],
          ['Bal\'a', 'بلعا'],
          ['Deir al-Ghusun', 'دير الغصون'],
          ['Qaffin', 'قفّين'],
          ['Attil', 'عتيل'],
          ['Baqa ash-Sharqiya', 'باقة الشرقية'],
          ['Illar', 'علار'],
          ['Kafr al-Labad', 'كفر اللبد'],
          ['Kafr Sur', 'كفر صور'],
          ['Kafr Zibad', 'كفر زيباد'],
          ['Nazlat Isa', 'نزلة عيسى'],
          ['Ramin', 'رامين'],
          ['Saffarin', 'سفّارين'],
          ['Shufa', 'شوفة'],
          ['Beit Lid', 'بيت ليد'],
          ['Kafr Abbush', 'كفر عبّوش'],
          ['Kafr Jammal', 'كفر جمّال'],
          ['Kafr Rumman', 'كفر رمّان'],
          ['Seida', 'صيدا'],
          ['Iktaba', 'إكتابا']
        ]),
        group('Qalqilya', 'قلقيلية', [
          ['Qalqilya', 'قلقيلية'],
          ['Azzun', 'عزّون'],
          ['Jayyus', 'جيّوس'],
          ['Kafr Thulth', 'كفر ثلث'],
          ['Habla', 'حبلة'],
          ['Jinsafut', 'جينصافوط'],
          ['Hajja', 'حجّة'],
          ['Isla', 'إسلا'],
          ['Kafr Laqif', 'كفر لاقف'],
          ['Kafr Qaddum', 'كفر قدوم'],
          ['Sanniriya', 'سنيريا'],
          ['Ras Atiya', 'رأس عطية'],
          ['An-Nabi Elyas', 'النبي إلياس'],
          ['Azzun Atma', 'عزون عتمة'],
          ['Beit Amin', 'بيت أمين']
        ]),
        group('Salfit', 'سلفيت', [
          ['Salfit', 'سلفيت'],
          ['Biddya', 'بديا'],
          ['Kafr ad-Dik', 'كفر الديك'],
          ['Bruqin', 'بروقين'],
          ['Deir Ballut', 'دير بلوط'],
          ['Farkha', 'فرخة'],
          ['Haris', 'حارس'],
          ['Iskaka', 'إسكاكا'],
          ['Kifl Haris', 'كفل حارس'],
          ['Marda', 'مردة'],
          ['Mas-ha', 'مسحة'],
          ['Qarawat Bani Hassan', 'قراوة بني حسان'],
          ['Qira', 'قيرة'],
          ['Yasuf', 'ياسوف'],
          ['Az-Zawiya', 'الزاوية'],
          ['Sarta', 'سرطة']
        ]),
        group('Jericho', 'أريحا', [
          ['Jericho', 'أريحا'],
          ['Al-Auja', 'العوجا'],
          ['Fasayil', 'فصايل'],
          ['An-Nuway\'imah', 'النويعمة'],
          ['Ein ad-Duyuk al-Fauqa', 'عين الديوك الفوقا'],
          ['Ein ad-Duyuk at-Tahta', 'عين الديوك التحتا'],
          ['Az-Zubeidat', 'الزبيدات'],
          ['Marj Na\'ja', 'مرج نعجة'],
          ['Marj al-Ghazal', 'مرج الغزل']
        ]),
        group('Tubas', 'طوباس', [
          ['Tubas', 'طوباس'],
          ['Tammun', 'طمون'],
          ['Aqaba', 'عقبة'],
          ['Tayasir', 'تياسير'],
          ['Bardala', 'بردلة'],
          ['Kardala', 'كردلة'],
          ['Ein al-Beida', 'عين البيضا'],
          ['Ath-Thaghra', 'الثغرة']
        ]),
        group('Gaza', 'غزة', [
          ['Gaza City', 'مدينة غزة'],
          ['Az-Zahra', 'الزهراء'],
          ['Al-Mughraqa', 'المغراقة'],
          ['Juhor ad-Dik', 'جحر الديك']
        ]),
        group('North Gaza', 'شمال غزة', [
          ['Jabalia', 'جباليا'],
          ['Beit Lahia', 'بيت لاهيا'],
          ['Beit Hanoun', 'بيت حانون']
        ]),
        group('Deir al-Balah', 'دير البلح', [
          ['Deir al-Balah', 'دير البلح'],
          ['Nuseirat', 'النصيرات'],
          ['Bureij', 'البريج'],
          ['Maghazi', 'المغازي'],
          ['Az-Zawayda', 'الزوايدة'],
          ['Wadi as-Salqa', 'وادي السلقا']
        ]),
        group('Khan Yunis', 'خان يونس', [
          ['Khan Yunis', 'خان يونس'],
          ['Abasan al-Kabira', 'عبسان الكبيرة'],
          ['Abasan al-Saghira', 'عبسان الصغيرة'],
          ['Bani Suheila', 'بني سهيلا'],
          ['Al-Qarara', 'القرارة'],
          ['Al-Fukhari', 'الفخاري'],
          ['Khuza\'a', 'خزاعة']
        ]),
        group('Rafah', 'رفح', [
          ['Rafah', 'رفح'],
          ['An-Naser', 'الناصر'],
          ['Shokat as-Sufi', 'شوكة الصوفي']
        ])
      ]
    },
    il: {
      en: 'Israel',
      ar: 'إسرائيل',
      groups: [
        group('North', 'الشمال', [
          ['Acre', 'عكا'],
          ['Afula', 'العفولة'],
          ['Arraba', 'عرابة'],
          ['Karmiel', 'كرميئيل'],
          ['Kiryat Shmona', 'كريات شمونة'],
          ['Ma\'alot-Tarshiha', 'معالوت ترشيحا'],
          ['Maghar', 'المغار'],
          ['Migdal HaEmek', 'مجدال هعيمق'],
          ['Nahariya', 'نهاريا'],
          ['Nazareth', 'الناصرة'],
          ['Nof HaGalil', 'نوف هجليل'],
          ['Safed', 'صفد'],
          ['Sakhnin', 'سخنين'],
          ['Shefa-Amr', 'شفاعمرو'],
          ['Tamra', 'طمرة'],
          ['Tiberias', 'طبريا'],
          ['Yokneam Illit', 'يوقنعم عيليت']
        ]),
        group('Haifa', 'حيفا', [
          ['Haifa', 'حيفا'],
          ['Hadera', 'الخضيرة'],
          ['Kiryat Ata', 'كريات آتا'],
          ['Kiryat Bialik', 'كريات بياليك'],
          ['Kiryat Motzkin', 'كريات موتسكين'],
          ['Kiryat Yam', 'كريات يام'],
          ['Nesher', 'نيشر'],
          ['Or Akiva', 'أور عكيفا'],
          ['Tirat Carmel', 'طيرة الكرمل'],
          ['Umm al-Fahm', 'أم الفحم'],
          ['Baqa al-Gharbiyye', 'باقة الغربية'],
          ['Jisr az-Zarqa', 'جسر الزرقاء']
        ]),
        group('Center', 'الوسط', [
          ['Hod HaSharon', 'هود هشارون'],
          ['Kafr Qasim', 'كفر قاسم'],
          ['Kfar Saba', 'كفار سابا'],
          ['Kfar Yona', 'كفار يونا'],
          ['Lod', 'اللد'],
          ['Modi\'in-Maccabim-Re\'ut', 'موديعين'],
          ['Modi\'in Illit', 'موديعين عيليت'],
          ['Ness Ziona', 'نس تسيونا'],
          ['Netanya', 'نتانيا'],
          ['Petah Tikva', 'بتاح تكفا'],
          ['Qalansawe', 'قلنسوة'],
          ['Ra\'anana', 'رعنانا'],
          ['Ramla', 'الرملة'],
          ['Rehovot', 'رحوفوت'],
          ['Rosh HaAyin', 'روش هعاين'],
          ['Tayibe', 'الطيبة'],
          ['Tira', 'الطيرة'],
          ['Yavne', 'يبنة'],
          ['Yehud-Monosson', 'يهود مونوسون'],
          ['El\'ad', 'إلعاد'],
          ['Giv\'at Shmuel', 'جفعات شموئيل'],
          ['Kiryat Ono', 'كريات أونو'],
          ['Harish', 'حريش']
        ]),
        group('Tel Aviv', 'تل أبيب', [
          ['Tel Aviv-Yafo', 'تل أبيب–يافا'],
          ['Bat Yam', 'بات يام'],
          ['Bnei Brak', 'بني براك'],
          ['Givatayim', 'جفعاتايم'],
          ['Herzliya', 'هرتسليا'],
          ['Holon', 'حولون'],
          ['Or Yehuda', 'أور يهودا'],
          ['Ramat Gan', 'رمات غان'],
          ['Ramat HaSharon', 'رمات هشارون'],
          ['Rishon LeZion', 'ريشون لتسيون']
        ]),
        group('Jerusalem', 'القدس', [
          ['Jerusalem', 'القدس']
        ]),
        group('South', 'الجنوب', [
          ['Arad', 'عرّاد'],
          ['Ashdod', 'أسدود'],
          ['Ashkelon', 'عسقلان'],
          ['Beersheba', 'بئر السبع'],
          ['Beit She\'an', 'بيسان'],
          ['Beit Shemesh', 'بيت شيمش'],
          ['Dimona', 'ديمونا'],
          ['Eilat', 'إيلات'],
          ['Kiryat Gat', 'كريات جات'],
          ['Kiryat Malakhi', 'كريات ملاخي'],
          ['Netivot', 'نتيفوت'],
          ['Ofakim', 'أوفاكيم'],
          ['Rahat', 'رهط'],
          ['Sderot', 'سديروت']
        ])
      ]
    }
  };

  function loc(item, lang) {
    return lang === 'ar' ? item.ar : item.en;
  }

  function findCity(country, value) {
    const pack = places[country];
    if (!pack) return null;
    for (let i = 0; i < pack.groups.length; i++) {
      const hit = pack.groups[i].cities.find((c) => c.en === value);
      if (hit) return hit;
    }
    return null;
  }

  function fillCountrySelect(select, lang, selected) {
    if (!select) return;
    const keep = selected || select.value || 'ps';
    select.innerHTML = '';
    Object.keys(places).forEach((code) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = loc(places[code], lang);
      select.appendChild(opt);
    });
    select.value = places[keep] ? keep : 'ps';
  }

  function fillCitySelect(select, country, lang, selected) {
    if (!select) return;
    const pack = places[country] || places.ps;
    const keep = selected || select.value || '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.disabled = true;
    ph.textContent = lang === 'ar' ? 'اختر المدينة' : 'Select city';
    select.innerHTML = '';
    select.appendChild(ph);
    pack.groups.forEach((g) => {
      const og = document.createElement('optgroup');
      og.label = loc(g, lang);
      g.cities.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.en;
        opt.textContent = loc(c, lang);
        og.appendChild(opt);
      });
      select.appendChild(og);
    });
    if (keep && findCity(country, keep)) select.value = keep;
    else select.value = '';
    ph.selected = !select.value;
  }

  function countryName(code, lang) {
    return places[code] ? loc(places[code], lang) : code;
  }

  function cityName(code, value, lang) {
    const hit = findCity(code, value);
    return hit ? loc(hit, lang) : value;
  }

  O.places = places;
  O.fillCountrySelect = fillCountrySelect;
  O.fillCitySelect = fillCitySelect;
  O.countryName = countryName;
  O.cityName = cityName;
})(window);
