"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Search, Upload, X } from "lucide-react";

export type OptionGroup = {
  label: string;
  options: string[];
};

export type ProfileGeneralDraft = {
  fullName: string;
  businessName: string;
  avatarUrl: string;
  professionalTypes: string[];
  services: string[];
  projectTypes: string[];
  serviceAreas: string[];
  styleExpertise: string[];
  city: string;
  cities: string[];
  district: string;
  serviceRegions: string[];
  startingBudget: string;
  workingModels: string[];
  tags: string[];
};

export type GeneralErrors = Partial<Record<keyof ProfileGeneralDraft, string>>;

export const PROFESSIONAL_TYPE_OPTIONS = [
  "Mimar",
  "İç Mimar",
  "İç Dekoratör",
  "Peyzaj Mimarı",
  "Tasarım Ofisi",
  "Mimarlık Firması",
  "İç Mimarlık Ofisi",
  "İç Mimarlık Bürosu",
  "Mimari Tasarımcı",
  "Konsept Tasarımcı",
  "3D Görselleştirme Uzmanı",
  "Mimari Maket Hizmeti",
  "Grafik Tasarımcı",
  "Aydınlatma Tasarımcısı",
  "Tadilat Firması",
  "Ev Tadilatı Firması",
  "Anahtar Teslim Firma",
  "Banyo & Mutfak Uygulamacısı",
  "Usta / Uygulamacı",
  "Marangoz / Özel Mobilya",
  "Mobilya Üreticisi",
  "Mobilya İmalatçısı",
  "İnşaat Şirketi",
  "İnşaat Firması",
  "İnşaat Mühendisi",
  "İnşaat Danışmanı",
  "Yapı Denetçisi",
  "Peyzaj Uygulama Firması",
  "Mobilya Mağazası",
  "Mutfak Mobilyası Mağazası",
  "Yapı Malzemeleri Mağazası",
  "İnşaat Malzemesi Toptancısı",
  "Peyzaj Malzemeleri Satıcısı",
  "Malzeme / Ürün Tedarikçisi",
  "Alüminyum Pencere Sistemleri",
  "Kurumsal Ofis",
];

export const SERVICE_GROUPS: OptionGroup[] = [
  {
    label: "Tasarım Hizmetleri",
    options: [
      "İç Mimari Tasarım",
      "Mimari Proje",
      "Dekorasyon Danışmanlığı",
      "Konsept Tasarım",
      "3D Render / Görselleştirme",
      "Moodboard Hazırlama",
      "Mobilya Yerleşim Planı",
      "Renk & Malzeme Danışmanlığı",
      "Aydınlatma Planı",
      "Mimari Maket",
      "Grafik Tasarım / Sunum Tasarımı",
    ],
  },
  {
    label: "Uygulama Hizmetleri",
    options: [
      "Tadilat",
      "Renovasyon",
      "Anahtar Teslim Uygulama",
      "Mutfak Yenileme",
      "Banyo Yenileme",
      "Özel Mobilya Üretimi",
      "Mobilya Üretimi",
      "Mutfak Mobilyası Üretimi",
      "Marangozluk",
      "Boya / Duvar Uygulaması",
      "Zemin / Parke Uygulaması",
      "Seramik / Fayans Uygulaması",
      "Elektrik Uygulaması",
      "Tesisat Uygulaması",
      "Alüminyum Pencere Uygulaması",
    ],
  },
  {
    label: "Dış Mekan Hizmetleri",
    options: [
      "Peyzaj Tasarımı",
      "Bahçe Düzenleme",
      "Balkon / Teras Tasarımı",
      "Dış Cephe Tasarımı",
      "Havuz Tasarımı",
      "Kış Bahçesi",
    ],
  },
  {
    label: "Teknik & Danışmanlık",
    options: ["İnşaat Danışmanlığı", "Yapı Denetimi", "Teknik Proje Danışmanlığı"],
  },
  {
    label: "Tedarik",
    options: [
      "Yapı Malzemesi Tedariği",
      "İnşaat Malzemesi Tedariği",
      "Peyzaj Malzemesi Tedariği",
      "Mobilya Satışı",
    ],
  },
];

export const PROJECT_TYPE_OPTIONS = [
  "İç Mimari Proje",
  "Mimari Proje",
  "Dekorasyon",
  "Tadilat / Renovasyon",
  "Anahtar Teslim",
  "Mobilya Tasarımı",
  "3D Tasarım / Render",
  "Peyzaj / Bahçe",
  "Banyo Yenileme",
  "Mutfak Yenileme",
  "Ofis Tasarımı",
  "Mağaza / Ticari Alan Tasarımı",
  "Danışmanlık",
];

export const SERVICE_AREA_GROUPS: OptionGroup[] = [
  {
    label: "Konut Alanları",
    options: [
      "Salon",
      "Oturma Odası",
      "Mutfak",
      "Banyo",
      "Yatak Odası",
      "Çocuk Odası",
      "Bebek Odası",
      "Giyinme Odası",
      "Antre / Hol",
      "Koridor",
      "Çalışma Odası",
      "Ev Ofis",
      "Çamaşır Odası",
      "Kiler / Depolama",
    ],
  },
  {
    label: "Dış Mekan",
    options: ["Bahçe", "Balkon", "Teras", "Veranda", "Havuz", "Dış Cephe", "Garaj / Otopark", "Kış Bahçesi"],
  },
  {
    label: "Ticari Alanlar",
    options: ["Ofis", "Mağaza", "Kafe / Restoran", "Otel", "Klinik", "Güzellik Salonu", "Showroom", "Stüdyo"],
  },
];

export const STYLE_OPTIONS = [
  "Modern",
  "Minimalist",
  "Klasik",
  "Lüks",
  "İskandinav",
  "Rustik",
  "Endüstriyel",
  "Bohem",
  "Akdeniz",
  "Japandi",
  "Country",
  "Retro",
  "Eklektik",
  "Çağdaş",
  "Doğal / Organik",
  "Sahil / Coastal",
  "Geleneksel",
];

export const TURKIYE_ILLERI = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Ankara",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Iğdır",
  "Isparta",
  "İstanbul",
  "İzmir",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kilis",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Şanlıurfa",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

const ILCELER_BY_IL: Record<string, string[]> = {
  "Adana": ["Aladağ","Ceyhan","Çukurova","Feke","İmamoğlu","Karaisalı","Karataş","Kozan","Pozantı","Saimbeyli","Sarıçam","Seyhan","Tufanbeyli","Yumurtalık","Yüreğir"],
  "Adıyaman": ["Besni","Çelikhan","Gerger","Gölbaşı","Kahta","Merkez","Samsat","Sincik","Tut"],
  "Afyonkarahisar": ["Başmakçı","Bayat","Bolvadin","Çay","Çobanlar","Dazkırı","Dinar","Emirdağ","Evciler","Hocalar","İhsaniye","İscehisar","Kızılören","Merkez","Sandıklı","Sinanpaşa","Sultandağı","Şuhut"],
  "Ağrı": ["Diyadin","Doğubayazıt","Eleşkirt","Hamur","Merkez","Patnos","Taşlıçay","Tutak"],
  "Amasya": ["Göynücek","Gümüşhacıköy","Hamamözü","Merkez","Merzifon","Suluova","Taşova"],
  "Ankara": ["Akyurt","Altındağ","Ayaş","Bala","Beypazarı","Çamlıdere","Çankaya","Çubuk","Elmadağ","Etimesgut","Evren","Gölbaşı","Güdül","Haymana","Kahramankazan","Kalecik","Keçiören","Kızılcahamam","Mamak","Nallıhan","Polatlı","Pursaklar","Sincan","Şereflikoçhisar","Yenimahalle"],
  "Antalya": ["Akseki","Aksu","Alanya","Demre","Döşemealtı","Elmalı","Finike","Gazipaşa","Gündoğmuş","İbradı","Kaş","Kemer","Kepez","Konyaaltı","Korkuteli","Kumluca","Manavgat","Muratpaşa","Serik"],
  "Artvin": ["Ardanuç","Arhavi","Borçka","Hopa","Kemalpaşa","Merkez","Murgul","Şavşat","Yusufeli"],
  "Aydın": ["Bozdoğan","Buharkent","Çine","Didim","Efeler","Germencik","İncirliova","Karacasu","Karpuzlu","Koçarlı","Köşk","Kuşadası","Kuyucak","Nazilli","Söke","Sultanhisar","Yenipazar"],
  "Balıkesir": ["Altıeylül","Ayvalık","Balya","Bandırma","Bigadiç","Burhaniye","Dursunbey","Edremit","Erdek","Gömeç","Gönen","Havran","İvrindi","Karesi","Kepsut","Manyas","Marmara","Savaştepe","Sındırgı","Susurluk"],
  "Bilecik": ["Bozüyük","Gölpazarı","İnhisar","Merkez","Osmaneli","Pazaryeri","Söğüt","Yenipazar"],
  "Bingöl": ["Adaklı","Genç","Karlıova","Kiğı","Merkez","Solhan","Yayladere","Yedisu"],
  "Bitlis": ["Adilcevaz","Ahlat","Güroymak","Hizan","Merkez","Mutki","Tatvan"],
  "Bolu": ["Dörtdivan","Gerede","Göynük","Kıbrıscık","Mengen","Merkez","Mudurnu","Seben","Yeniçağa"],
  "Burdur": ["Ağlasun","Altınyayla","Bucak","Çavdır","Çeltikçi","Gölhisar","Karamanlı","Kemer","Merkez","Tefenni","Yeşilova"],
  "Bursa": ["Büyükorhan","Gemlik","Gürsu","Harmancık","İnegöl","İznik","Karacabey","Keles","Kestel","Mudanya","Mustafakemalpaşa","Nilüfer","Orhaneli","Orhangazi","Osmangazi","Yenişehir","Yıldırım"],
  "Çanakkale": ["Ayvacık","Bayramiç","Biga","Bozcaada","Çan","Eceabat","Ezine","Gelibolu","Gökçeada","Lapseki","Merkez","Yenice"],
  "Çankırı": ["Atkaracalar","Bayramören","Çerkeş","Eldivan","Ilgaz","Kızılırmak","Korgun","Kurşunlu","Merkez","Orta","Şabanözü","Yapraklı"],
  "Çorum": ["Alaca","Bayat","Boğazkale","Dodurga","İskilip","Kargı","Laçin","Mecitözü","Merkez","Oğuzlar","Ortaköy","Osmancık","Sungurlu","Uğurludağ"],
  "Denizli": ["Acıpayam","Babadağ","Baklan","Bekilli","Beyağaç","Bozkurt","Buldan","Çal","Çameli","Çardak","Çivril","Güney","Honaz","Kale","Merkezefendi","Pamukkale","Sarayköy","Serinhisar","Tavas"],
  "Diyarbakır": ["Bağlar","Bismil","Çermik","Çınar","Çüngüş","Dicle","Eğil","Ergani","Hani","Hazro","Kayapınar","Kocaköy","Kulp","Lice","Silvan","Sur","Yenişehir"],
  "Edirne": ["Enez","Havsa","İpsala","Keşan","Lalapaşa","Meriç","Merkez","Süloğlu","Uzunköprü"],
  "Elazığ": ["Ağın","Alacakaya","Arıcak","Baskil","Karakoçan","Keban","Kovancılar","Maden","Merkez","Palu","Sivrice"],
  "Erzincan": ["Çayırlı","İliç","Kemah","Kemaliye","Merkez","Otlukbeli","Refahiye","Tercan","Üzümlü"],
  "Erzurum": ["Aşkale","Aziziye","Çat","Hınıs","Horasan","İspir","Karaçoban","Karayazı","Köprüköy","Narman","Oltu","Olur","Palandöken","Pasinler","Pazaryolu","Şenkaya","Tekman","Tortum","Uzundere","Yakutiye"],
  "Eskişehir": ["Alpu","Beylikova","Çifteler","Günyüzü","Han","İnönü","Mahmudiye","Mihalgazi","Mihalıççık","Odunpazarı","Sarıcakaya","Seyitgazi","Sivrihisar","Tepebaşı"],
  "Gaziantep": ["Araban","İslahiye","Karkamış","Nizip","Nurdağı","Oğuzeli","Şahinbey","Şehitkamil","Yavuzeli"],
  "Giresun": ["Alucra","Bulancak","Çamoluk","Çanakçı","Dereli","Doğankent","Espiye","Eynesil","Görele","Güce","Keşap","Merkez","Piraziz","Şebinkarahisar","Tirebolu","Yağlıdere"],
  "Gümüşhane": ["Kelkit","Köse","Kürtün","Merkez","Şiran","Torul"],
  "Hakkari": ["Çukurca","Derecik","Merkez","Şemdinli","Yüksekova"],
  "Hatay": ["Altınözü","Antakya","Arsuz","Belen","Defne","Dörtyol","Erzin","Hassa","İskenderun","Kırıkhan","Kumlu","Payas","Reyhanlı","Samandağ","Yayladağı"],
  "Isparta": ["Aksu","Atabey","Eğirdir","Gelendost","Gönen","Keçiborlu","Merkez","Senirkent","Sütçüler","Şarkikaraağaç","Uluborlu","Yalvaç","Yenişarbademli"],
  "Mersin": ["Akdeniz","Anamur","Aydıncık","Bozyazı","Çamlıyayla","Erdemli","Gülnar","Mezitli","Mut","Silifke","Tarsus","Toroslar","Yenişehir"],
  "İstanbul": ["Adalar","Arnavutköy","Ataşehir","Avcılar","Bağcılar","Bahçelievler","Bakırköy","Başakşehir","Bayrampaşa","Beşiktaş","Beykoz","Beylikdüzü","Beyoğlu","Büyükçekmece","Çatalca","Çekmeköy","Esenler","Esenyurt","Eyüpsultan","Fatih","Gaziosmanpaşa","Güngören","Kadıköy","Kağıthane","Kartal","Küçükçekmece","Maltepe","Pendik","Sancaktepe","Sarıyer","Silivri","Sultanbeyli","Sultangazi","Şile","Şişli","Tuzla","Ümraniye","Üsküdar","Zeytinburnu"],
  "İzmir": ["Aliağa","Balçova","Bayındır","Bayraklı","Bergama","Beydağ","Bornova","Buca","Çeşme","Çiğli","Dikili","Foça","Gaziemir","Güzelbahçe","Karabağlar","Karaburun","Karşıyaka","Kemalpaşa","Kınık","Kiraz","Konak","Menderes","Menemen","Narlıdere","Ödemiş","Seferihisar","Selçuk","Tire","Torbalı","Urla"],
  "Kars": ["Akyaka","Arpaçay","Digor","Kağızman","Merkez","Sarıkamış","Selim","Susuz"],
  "Kastamonu": ["Abana","Ağlı","Araç","Azdavay","Bozkurt","Cide","Çatalzeytin","Daday","Devrekani","Doğanyurt","Hanönü","İhsangazi","İnebolu","Küre","Merkez","Pınarbaşı","Seydiler","Şenpazar","Taşköprü","Tosya"],
  "Kayseri": ["Akkışla","Bünyan","Develi","Felahiye","Hacılar","İncesu","Kocasinan","Melikgazi","Özvatan","Pınarbaşı","Sarıoğlan","Sarız","Talas","Tomarza","Yahyalı","Yeşilhisar"],
  "Kırklareli": ["Babaeski","Demirköy","Kofçaz","Lüleburgaz","Merkez","Pehlivanköy","Pınarhisar","Vize"],
  "Kırşehir": ["Akçakent","Akpınar","Boztepe","Çiçekdağı","Kaman","Merkez","Mucur"],
  "Kocaeli": ["Başiskele","Çayırova","Darıca","Derince","Dilovası","Gebze","Gölcük","İzmit","Kandıra","Karamürsel","Kartepe","Körfez"],
  "Konya": ["Ahırlı","Akören","Akşehir","Altınekin","Beyşehir","Bozkır","Cihanbeyli","Çeltik","Çumra","Derbent","Derebucak","Doğanhisar","Emirgazi","Ereğli","Güneysınır","Hadim","Halkapınar","Hüyük","Ilgın","Kadınhanı","Karapınar","Karatay","Kulu","Meram","Sarayönü","Selçuklu","Seydişehir","Taşkent","Tuzlukçu","Yalıhüyük","Yunak"],
  "Kütahya": ["Altıntaş","Aslanapa","Çavdarhisar","Domaniç","Dumlupınar","Emet","Gediz","Hisarcık","Merkez","Pazarlar","Simav","Şaphane","Tavşanlı"],
  "Malatya": ["Akçadağ","Arapgir","Arguvan","Battalgazi","Darende","Doğanşehir","Doğanyol","Hekimhan","Kale","Kuluncak","Pütürge","Yazıhan","Yeşilyurt"],
  "Manisa": ["Ahmetli","Akhisar","Alaşehir","Demirci","Gölmarmara","Gördes","Kırkağaç","Köprübaşı","Kula","Salihli","Sarıgöl","Saruhanlı","Selendi","Soma","Şehzadeler","Turgutlu","Yunusemre"],
  "Kahramanmaraş": ["Afşin","Andırın","Çağlayancerit","Dulkadiroğlu","Ekinözü","Elbistan","Göksun","Nurhak","Onikişubat","Pazarcık","Türkoğlu"],
  "Mardin": ["Artuklu","Dargeçit","Derik","Kızıltepe","Mazıdağı","Midyat","Nusaybin","Ömerli","Savur","Yeşilli"],
  "Muğla": ["Bodrum","Dalaman","Datça","Fethiye","Kavaklıdere","Köyceğiz","Marmaris","Menteşe","Milas","Ortaca","Seydikemer","Ula","Yatağan"],
  "Muş": ["Bulanık","Hasköy","Korkut","Malazgirt","Merkez","Varto"],
  "Nevşehir": ["Acıgöl","Avanos","Derinkuyu","Gülşehir","Hacıbektaş","Kozaklı","Merkez","Ürgüp"],
  "Niğde": ["Altunhisar","Bor","Çamardı","Çiftlik","Merkez","Ulukışla"],
  "Ordu": ["Akkuş","Altınordu","Aybastı","Çamaş","Çatalpınar","Çaybaşı","Fatsa","Gölköy","Gülyalı","Gürgentepe","İkizce","Kabadüz","Kabataş","Korgan","Kumru","Mesudiye","Perşembe","Ulubey","Ünye"],
  "Rize": ["Ardeşen","Çamlıhemşin","Çayeli","Derepazarı","Fındıklı","Güneysu","Hemşin","İkizdere","İyidere","Kalkandere","Merkez","Pazar"],
  "Sakarya": ["Adapazarı","Akyazı","Arifiye","Erenler","Ferizli","Geyve","Hendek","Karapürçek","Karasu","Kaynarca","Kocaali","Pamukova","Sapanca","Serdivan","Söğütlü","Taraklı"],
  "Samsun": ["19 Mayıs","Alaçam","Asarcık","Atakum","Ayvacık","Bafra","Canik","Çarşamba","Havza","İlkadım","Kavak","Ladik","Salıpazarı","Tekkeköy","Terme","Vezirköprü","Yakakent"],
  "Siirt": ["Baykan","Eruh","Kurtalan","Merkez","Pervari","Şirvan","Tillo"],
  "Sinop": ["Ayancık","Boyabat","Dikmen","Durağan","Erfelek","Gerze","Merkez","Saraydüzü","Türkeli"],
  "Sivas": ["Akıncılar","Altınyayla","Divriği","Doğanşar","Gemerek","Gölova","Gürün","Hafik","İmranlı","Kangal","Koyulhisar","Merkez","Suşehri","Şarkışla","Ulaş","Yıldızeli","Zara"],
  "Tekirdağ": ["Çerkezköy","Çorlu","Ergene","Hayrabolu","Kapaklı","Malkara","Marmaraereğlisi","Muratlı","Saray","Süleymanpaşa","Şarköy"],
  "Tokat": ["Almus","Artova","Başçiftlik","Erbaa","Merkez","Niksar","Pazar","Reşadiye","Sulusaray","Turhal","Yeşilyurt","Zile"],
  "Trabzon": ["Akçaabat","Araklı","Arsin","Beşikdüzü","Çarşıbaşı","Çaykara","Dernekpazarı","Düzköy","Hayrat","Köprübaşı","Maçka","Of","Ortahisar","Sürmene","Şalpazarı","Tonya","Vakfıkebir","Yomra"],
  "Tunceli": ["Çemişgezek","Hozat","Mazgirt","Merkez","Nazımiye","Ovacık","Pertek","Pülümür"],
  "Şanlıurfa": ["Akçakale","Birecik","Bozova","Ceylanpınar","Eyyübiye","Halfeti","Haliliye","Harran","Hilvan","Karaköprü","Siverek","Suruç","Viranşehir"],
  "Uşak": ["Banaz","Eşme","Karahallı","Merkez","Sivaslı","Ulubey"],
  "Van": ["Bahçesaray","Başkale","Çaldıran","Çatak","Edremit","Erciş","Gevaş","Gürpınar","İpekyolu","Muradiye","Özalp","Saray","Tuşba"],
  "Yozgat": ["Akdağmadeni","Aydıncık","Boğazlıyan","Çandır","Çayıralan","Çekerek","Kadışehri","Merkez","Saraykent","Sarıkaya","Sorgun","Şefaatli","Yenifakılı","Yerköy"],
  "Zonguldak": ["Alaplı","Çaycuma","Devrek","Ereğli","Gökçebey","Kilimli","Kozlu","Merkez"],
  "Aksaray": ["Ağaçören","Eskil","Gülağaç","Güzelyurt","Merkez","Ortaköy","Sarıyahşi","Sultanhanı"],
  "Bayburt": ["Aydıntepe","Demirözü","Merkez"],
  "Karaman": ["Ayrancı","Başyayla","Ermenek","Kazımkarabekir","Merkez","Sarıveliler"],
  "Kırıkkale": ["Bahşılı","Balışeyh","Çelebi","Delice","Karakeçili","Keskin","Merkez","Sulakyurt","Yahşihan"],
  "Batman": ["Beşiri","Gercüş","Hasankeyf","Kozluk","Merkez","Sason"],
  "Şırnak": ["Beytüşşebap","Cizre","Güçlükonak","İdil","Merkez","Silopi","Uludere"],
  "Bartın": ["Amasra","Kurucaşile","Merkez","Ulus"],
  "Ardahan": ["Çıldır","Damal","Göle","Hanak","Merkez","Posof"],
  "Iğdır": ["Aralık","Karakoyunlu","Merkez","Tuzluca"],
  "Yalova": ["Altınova","Armutlu","Çınarcık","Çiftlikköy","Merkez","Termal"],
  "Karabük": ["Eflani","Eskipazar","Merkez","Ovacık","Safranbolu","Yenice"],
  "Kilis": ["Elbeyli","Merkez","Musabeyli","Polateli"],
  "Osmaniye": ["Bahçe","Düziçi","Hasanbeyli","Kadirli","Merkez","Sumbas","Toprakkale"],
  "Düzce": ["Akçakoca","Cumayeri","Çilimli","Gölyaka","Gümüşova","Kaynaşlı","Merkez","Yığılca"],
};

export function getDistrictOptions(city: string) {
  const trimmed = city.trim();
  if (!trimmed) return [];
  return ILCELER_BY_IL[trimmed] ?? ["Merkez"];
}

export const SERVICE_REGION_OPTIONS = [
  "Sadece bulunduğum şehir",
  "Bulunduğum şehir + çevre iller",
  "Türkiye geneli",
  "Online hizmet veriyorum",
  "Yurt dışı hizmet veriyorum",
];

export const STARTING_BUDGET_OPTIONS = [
  "₺0 - ₺25.000",
  "₺25.000 - ₺50.000",
  "₺50.000 - ₺100.000",
  "₺100.000 - ₺250.000",
  "₺250.000 - ₺500.000",
  "₺500.000 - ₺1.000.000",
  "₺1.000.000+",
  "Proje bazlı değişir",
];

export const WORKING_MODEL_OPTIONS = [
  "Ücretsiz Ön Görüşme",
  "Saatlik Danışmanlık",
  "Proje Bazlı Ücret",
  "m² Bazlı Ücret",
  "Paket Hizmet",
  "Anahtar Teslim",
  "Teklif Üzerinden",
];

export const TAG_OPTIONS = [
  "Küçük Alan Çözümü",
  "Depolama Çözümü",
  "Çocuk Dostu",
  "Evcil Hayvan Dostu",
  "Lüks Proje",
  "Bütçe Dostu",
  "Hızlı Teslimat",
  "Sürdürülebilir Tasarım",
  "Akıllı Ev",
  "Doğal Malzemeler",
  "Özel Üretim",
  "Premium Malzeme",
  "Kiralık Eve Uygun",
  "Aile Yaşamına Uygun",
  "Yatırım Amaçlı Tasarım",
  "Kurumsal Proje",
  "Teknik Danışmanlık",
  "Malzeme Tedariği",
  "Üretici Firma",
  "Mağaza / Showroom",
  "Maket Hizmeti",
  "Pencere Sistemleri",
];

export const DEFAULT_GENERAL_DRAFT: ProfileGeneralDraft = {
  fullName: "",
  businessName: "",
  avatarUrl: "",
  professionalTypes: [],
  services: [],
  projectTypes: [],
  serviceAreas: [],
  styleExpertise: [],
  city: "",
  cities: [],
  district: "",
  serviceRegions: [],
  startingBudget: "",
  workingModels: [],
  tags: [],
};

const REQUIRED_FIELD_LABELS: Array<[keyof ProfileGeneralDraft, string]> = [
  ["fullName", "Tam Ad / Profil Adı"],
  ["professionalTypes", "Profesyonel Türü"],
  ["services", "Hizmetler"],
  ["projectTypes", "Proje Tipleri"],
  ["serviceAreas", "Hizmet Verilen Alanlar"],
  ["cities", "Şehir"],
  ["serviceRegions", "Hizmet Verilen Bölgeler"],
];

const FLAT_SERVICE_OPTIONS = SERVICE_GROUPS.flatMap((group) => group.options);
const FLAT_SERVICE_AREA_OPTIONS = SERVICE_AREA_GROUPS.flatMap((group) => group.options);

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("&", " ")
    .replaceAll("/", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function arrayFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|;/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function uniqueKnown(values: unknown, options: string[], fallbackMap: Record<string, string> = {}) {
  const byNormalized = new Map(options.map((option) => [normalizeText(option), option]));
  const result: string[] = [];
  for (const value of arrayFromUnknown(values)) {
    const normalized = normalizeText(value);
    const mapped = fallbackMap[normalized] ?? byNormalized.get(normalized);
    if (mapped && !result.includes(mapped)) result.push(mapped);
  }
  return result;
}

function containsAllToken(value: unknown) {
  return arrayFromUnknown(value).some((item) => normalizeText(item) === normalizeText("Tümü"));
}

function normalizeBulkAll(values: unknown, options: string[], fallbackMap: Record<string, string> = {}) {
  if (containsAllToken(values)) return [...options];
  return uniqueKnown(values, options, fallbackMap);
}

const PROFESSIONAL_LEGACY_MAP: Record<string, string> = {
  "ic mimar": "İç Mimar",
  mimar: "Mimar",
  "ic mimar mimar": "İç Mimar",
  "ic mimarlik burosu": "İç Mimarlık Bürosu",
  "ic mimarlik ofisi": "İç Mimarlık Ofisi",
  "insaat sirketi": "İnşaat Şirketi",
  "insaat firmasi": "İnşaat Firması",
  "mobilya ureticisi": "Mobilya Üreticisi",
  "mobilya imalatcisi": "Mobilya İmalatçısı",
  "peyzaj mimari": "Peyzaj Mimarı",
  "3d render": "3D Görselleştirme Uzmanı",
  "3d": "3D Görselleştirme Uzmanı",
  render: "3D Görselleştirme Uzmanı",
  uygulama: "Usta / Uygulamacı",
};

export function normalizeProfileGeneralInput(input: Partial<ProfileGeneralDraft> | Record<string, unknown>) {
  const raw = input as Record<string, unknown>;
  const rawCities = arrayFromUnknown(raw.cities).length ? raw.cities : raw.city;
  const cities = uniqueKnown(rawCities, TURKIYE_ILLERI);
  const city = cities[0] ?? "";
  const districts = cities.length === 1 ? getDistrictOptions(city) : [];
  const district = uniqueKnown(raw.district, districts)[0] ?? "";
  const legacySpecialty =
    typeof raw.legacySpecialty === "string"
      ? raw.legacySpecialty.replace(/\s*-\s*/g, ",").replace(/\s*\/\s*/g, ",")
      : raw.legacySpecialty;
  const professionalTypes = normalizeBulkAll(
    raw.professionalTypes ?? legacySpecialty,
    PROFESSIONAL_TYPE_OPTIONS,
    PROFESSIONAL_LEGACY_MAP
  );

  return {
    fullName: String(raw.fullName ?? raw.displayName ?? "").trim().slice(0, 80),
    businessName: String(raw.businessName ?? "").trim().slice(0, 100),
    avatarUrl: String(raw.avatarUrl ?? raw.profileImageUrl ?? "").trim(),
    professionalTypes,
    services: uniqueKnown(raw.services, FLAT_SERVICE_OPTIONS),
    projectTypes: uniqueKnown(raw.projectTypes, PROJECT_TYPE_OPTIONS),
    serviceAreas: normalizeBulkAll(raw.serviceAreas, FLAT_SERVICE_AREA_OPTIONS),
    styleExpertise: normalizeBulkAll(raw.styleExpertise, STYLE_OPTIONS),
    city,
    cities,
    district,
    serviceRegions: uniqueKnown(raw.serviceRegions, SERVICE_REGION_OPTIONS),
    startingBudget: uniqueKnown(raw.startingBudget, STARTING_BUDGET_OPTIONS)[0] ?? "",
    workingModels: uniqueKnown(raw.workingModels, WORKING_MODEL_OPTIONS),
    tags: uniqueKnown(raw.tags, TAG_OPTIONS).slice(0, 10),
  } satisfies ProfileGeneralDraft;
}

export function buildProfileGeneralPayload(draft: ProfileGeneralDraft) {
  const normalized = normalizeProfileGeneralInput(draft);
  return {
    displayName: normalized.fullName,
    businessName: normalized.businessName || undefined,
    profileImageUrl: normalized.avatarUrl || undefined,
    professionalTypes: normalized.professionalTypes,
    services: normalized.services,
    projectTypes: normalized.projectTypes,
    serviceAreas: normalized.serviceAreas,
    styleExpertise: normalized.styleExpertise,
    city: normalized.city,
    cities: normalized.cities,
    district: normalized.district || undefined,
    serviceRegions: normalized.serviceRegions,
    startingBudget: normalized.startingBudget || undefined,
    workingModels: normalized.workingModels,
    tags: normalized.tags,
  };
}

export function validateProfileGeneralDraft(draft: ProfileGeneralDraft): GeneralErrors {
  const next: GeneralErrors = {};
  const name = draft.fullName.trim();
  if (!name) next.fullName = "Tam ad / profil adı zorunlu.";
  else if (name.length < 2) next.fullName = "En az 2 karakter olmalı.";
  else if (name.length > 80) next.fullName = "En fazla 80 karakter olabilir.";
  if (draft.businessName.trim().length > 100) next.businessName = "En fazla 100 karakter olabilir.";
  if (draft.professionalTypes.length < 1) next.professionalTypes = "En az 1 profesyonel türü seç.";
  if (draft.services.length < 1) next.services = "En az 1 hizmet seç.";
  if (draft.projectTypes.length < 1) next.projectTypes = "En az 1 proje tipi seç.";
  if (draft.serviceAreas.length < 1) next.serviceAreas = "En az 1 hizmet alanı seç.";
  if (draft.cities.length < 1) next.cities = "En az 1 şehir seç.";
  if (draft.serviceRegions.length < 1) next.serviceRegions = "En az 1 hizmet bölgesi seç.";
  if (draft.tags.length > 10) next.tags = "En fazla 10 etiket seçebilirsin.";
  return next;
}

function getMissingRequiredLabels(draft: ProfileGeneralDraft) {
  return REQUIRED_FIELD_LABELS.filter(([key]) => {
    const value = draft[key];
    return Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();
  }).map(([, label]) => label);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function orderedKnownValues(values: string[], options: string[]) {
  const optionSet = new Set(options);
  return options.filter((option) => values.includes(option)).concat(values.filter((value) => !optionSet.has(value)));
}

function getPickerOptions(groups: OptionGroup[]) {
  return uniqueValues(groups.flatMap((group) => group.options));
}

function toggleValueSet(values: string[], options: string[], max?: number, onMax?: () => void) {
  const selectable = uniqueValues(options);
  if (!selectable.length) return values;

  const selectedSet = new Set(values);
  const allSelected = selectable.every((option) => selectedSet.has(option));
  if (allSelected) {
    return values.filter((value) => !selectable.includes(value));
  }

  const next = uniqueValues([...values, ...selectable]);
  if (max && next.length > max) {
    onMax?.();
    return values;
  }
  return next;
}

function toggleMulti(values: string[], value: string, options: { max?: number; onMax?: () => void } = {}) {
  const { max, onMax } = options;
  let next = [...values];
  if (next.includes(value)) {
    next = next.filter((item) => item !== value);
    return next;
  }
  if (max && next.length >= max) {
    onMax?.();
    return next;
  }
  return [...next, value];
}

function SelectedChips({ values }: { values: string[] }) {
  if (!values.length) return <span className="text-sm text-slate-400">Seçim yapılmadı</span>;
  const visible = values.slice(0, 3);
  const rest = values.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((value) => (
        <span key={value} className="rounded-full bg-[#0E5A3A] px-2.5 py-1 text-xs font-semibold text-white">
          {value}
        </span>
      ))}
      {rest > 0 ? <span className="rounded-full bg-[#0E5A3A] px-2.5 py-1 text-xs font-semibold text-white">+{rest}</span> : null}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-semibold text-slate-800">
      {children}
      {required ? <span className="ml-1 text-[#0E5A3A]">*</span> : null}
    </label>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-[#dbe3ea] bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  placeholder,
  required,
  maxLength,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-2 h-14 w-full rounded-[16px] border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0E5A3A] focus:ring-4 focus:ring-[#0E5A3A]/10 ${
          error ? "border-red-300" : "border-[#dbe3ea]"
        }`}
      />
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

type PickerConfig = {
  title: string;
  groups: OptionGroup[];
  selected: string[];
  mode: "single" | "multi";
  max?: number;
  bulkSelect?: boolean;
  groupSelectAll?: boolean;
  onApply: (values: string[]) => void;
};

function SelectionField({
  label,
  required,
  values,
  placeholder,
  error,
  onOpen,
}: {
  label: string;
  required?: boolean;
  values: string[];
  placeholder?: string;
  error?: string;
  onOpen: () => void;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <button
        type="button"
        onClick={onOpen}
        className={`mt-2 min-h-14 w-full rounded-[16px] border bg-white px-4 py-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.035)] transition hover:border-[#0E5A3A]/50 ${
          error ? "border-red-300" : "border-[#dbe3ea]"
        }`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 flex-1">
            {values.length ? <SelectedChips values={values} /> : <span className="text-sm text-slate-400">{placeholder ?? "Seç"}</span>}
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
        </span>
      </button>
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function PickerSheet({ config, onClose }: { config: PickerConfig; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const allOptions = useMemo(() => getPickerOptions(config.groups), [config.groups]);
  const [selected, setSelected] = useState(() => orderedKnownValues(config.selected, getPickerOptions(config.groups)));
  const [limitMessage, setLimitMessage] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

  const groups = useMemo(() => {
    if (!normalizedQuery) return config.groups;
    return config.groups
      .map((group) => {
        const groupMatches = group.label.toLocaleLowerCase("tr-TR").includes(normalizedQuery);
        return {
          ...group,
          options: groupMatches
            ? group.options
            : group.options.filter((option) => option.toLocaleLowerCase("tr-TR").includes(normalizedQuery)),
        };
      })
      .filter((group) => group.options.length > 0);
  }, [config.groups, normalizedQuery]);

  const allSelected = allOptions.length > 0 && allOptions.every((option) => selected.includes(option));

  const toggleSet = (options: string[]) => {
    setLimitMessage("");
    setSelected((current) => toggleValueSet(current, options, config.max, () => setLimitMessage(`En fazla ${config.max} seçim yapabilirsin.`)));
  };

  const toggle = (value: string) => {
    setLimitMessage("");
    if (config.mode === "single") {
      setSelected(selected[0] === value ? [] : [value]);
      return;
    }
    setSelected((current) =>
      toggleMulti(current, value, {
        max: config.max,
        onMax: () => setLimitMessage(`En fazla ${config.max} seçim yapabilirsin.`),
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-3 sm:items-center">
      <div className="max-h-[88vh] w-full max-w-xl overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:rounded-[28px]">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{config.title}</h3>
              <p className="mt-1 text-xs text-slate-500">Listeden seçim yap. Serbest metin kullanılmaz.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex h-12 items-center gap-2 rounded-2xl border border-[#dbe3ea] px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ara..." className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
          </div>
        </div>

        <div className="max-h-[48vh] overflow-y-auto p-4">
          {config.mode === "multi" && config.bulkSelect !== false ? (
            <button
              type="button"
              onClick={() => toggleSet(allOptions)}
              className={`mb-4 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
                allSelected
                  ? "border-[#0E5A3A] bg-[#0E5A3A] text-white"
                  : "border-[#dbe3ea] bg-white text-[#0E5A3A] hover:bg-[#0E5A3A]/[0.07]"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  allSelected ? "border-white bg-white text-[#0E5A3A]" : "border-[#0E5A3A] bg-white text-[#0E5A3A]"
                }`}
              >
                {allSelected ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span>{allSelected ? "Tümünü kaldır" : "Tümünü seç"}</span>
            </button>
          ) : null}

          {groups.length ? (
            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{group.label}</div>
                  <div className="overflow-hidden rounded-2xl border border-[#dbe3ea]">
                    {config.mode === "multi" && config.groupSelectAll && group.options.length > 0 ? (() => {
                      const fullGroupOptions = config.groups.find((item) => item.label === group.label)?.options ?? group.options;
                      const groupAllSelected = fullGroupOptions.every((option) => selected.includes(option));
                      return (
                        <button
                          type="button"
                          onClick={() => toggleSet(fullGroupOptions)}
                          className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left text-sm font-bold transition ${
                            groupAllSelected ? "bg-[#0E5A3A]/[0.07] text-[#0E5A3A]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              groupAllSelected ? "border-[#0E5A3A] bg-[#0E5A3A] text-white" : "border-slate-300 bg-white"
                            }`}
                          >
                            {groupAllSelected ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span>{group.label} Tümü</span>
                        </button>
                      );
                    })() : null}
                    {group.options.map((option, index) => {
                      const active = selected.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggle(option)}
                          className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition ${
                            active ? "bg-[#0E5A3A]/[0.07] text-[#0E5A3A]" : "bg-white text-slate-700 hover:bg-slate-50"
                          } ${index === group.options.length - 1 ? "" : "border-b border-slate-100"}`}
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              active ? "border-[#0E5A3A] bg-[#0E5A3A] text-white" : "border-slate-300 bg-white"
                            }`}
                          >
                            {active ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span className="font-medium">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Sonuç bulunamadı.</div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          {selected.length ? (
            <div className="mb-3">
              <SelectedChips values={orderedKnownValues(selected, allOptions)} />
            </div>
          ) : null}
          {limitMessage ? <p className="mb-3 text-xs font-medium text-red-600">{limitMessage}</p> : null}
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <button type="button" onClick={() => setSelected([])} className="h-12 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Temizle
            </button>
            <button
              type="button"
              onClick={() => {
                config.onApply(orderedKnownValues(selected, allOptions));
                onClose();
              }}
              className="h-12 rounded-2xl bg-[#0E5A3A] text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,90,58,0.22)]"
            >
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GeneralProfileForm({
  draft,
  errors,
  saving,
  onChange,
  onPickAvatar,
  onSave,
}: {
  draft: ProfileGeneralDraft;
  errors: GeneralErrors;
  saving: boolean;
  onChange: (patch: Partial<ProfileGeneralDraft>) => void;
  onPickAvatar: (file: File | null) => void;
  onSave: () => void;
}) {
  const [picker, setPicker] = useState<PickerConfig | null>(null);
  const primaryCity = draft.cities[0] ?? draft.city;
  const districtOptions = draft.cities.length === 1 ? getDistrictOptions(primaryCity) : [];
  const missingRequired = getMissingRequiredLabels(draft);

  const openPicker = (config: PickerConfig) => setPicker(config);
  const openMulti = (
    title: string,
    groups: OptionGroup[],
    selected: string[],
    onApply: (values: string[]) => void,
    options: Pick<PickerConfig, "max" | "bulkSelect" | "groupSelectAll"> = {}
  ) => openPicker({ title, groups, selected, mode: "multi", onApply, ...options });
  const openSingle = (title: string, options: string[], selected: string, onApply: (value: string) => void) =>
    openPicker({
      title,
      groups: [{ label: title.replace(" Seç", ""), options }],
      selected: selected ? [selected] : [],
      mode: "single",
      onApply: (values) => onApply(values[0] ?? ""),
    });

  return (
    <div className="space-y-5 pb-28 lg:pb-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Genel Bilgiler</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Profilinizin arama, filtreleme ve eşleşme sisteminde doğru görünmesi için bilgilerinizi listeden seçerek tamamlayın.
        </p>
      </div>

      {missingRequired.length ? (
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Profilinizin arama sonuçlarında doğru görünmesi için Genel Bilgiler alanındaki zorunlu seçimleri tamamlayın.</p>
          <p className="mt-1 text-xs leading-5">Eksik alanlar: {missingRequired.join(", ")}</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <SectionCard title="Profil Fotoğrafı / Logo">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-[#dbe3ea] bg-slate-50 text-xs font-semibold text-slate-400">
              {draft.avatarUrl ? <img src={draft.avatarUrl} alt="Profil Fotoğrafı" className="h-full w-full object-cover" /> : "Profil Fotoğrafı"}
            </div>
            <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#dbe3ea] bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:border-[#0E5A3A]/50">
              <Upload className="h-4 w-4" />
              Fotoğraf yükle
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => onPickAvatar(event.target.files?.[0] ?? null)} />
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">jpg, jpeg, png veya webp yükleyebilirsin.</p>
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Kimlik">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Tam Ad / Profil Adı" required value={draft.fullName} maxLength={80} placeholder="Ad Soyad veya profil adı" error={errors.fullName} onChange={(fullName) => onChange({ fullName })} />
              <TextField label="İşletme Adı" value={draft.businessName} maxLength={100} placeholder="İşletme adı" error={errors.businessName} onChange={(businessName) => onChange({ businessName })} />
            </div>
            <SelectionField label="Profesyonel Türü" required values={draft.professionalTypes} error={errors.professionalTypes} onOpen={() => openMulti("Profesyonel Türü Seç", [{ label: "Profesyonel Türü", options: PROFESSIONAL_TYPE_OPTIONS }], draft.professionalTypes, (professionalTypes) => onChange({ professionalTypes }))} />
          </SectionCard>

          <SectionCard title="Uzmanlık ve Hizmetler">
            <SelectionField label="Hizmetler" required values={draft.services} error={errors.services} onOpen={() => openMulti("Hizmet Seç", SERVICE_GROUPS, draft.services, (services) => onChange({ services }))} />
            <SelectionField label="Proje Tipleri" required values={draft.projectTypes} error={errors.projectTypes} onOpen={() => openMulti("Proje Tipi Seç", [{ label: "Proje Tipleri", options: PROJECT_TYPE_OPTIONS }], draft.projectTypes, (projectTypes) => onChange({ projectTypes }))} />
            <SelectionField label="Hizmet Verilen Alanlar" required values={draft.serviceAreas} error={errors.serviceAreas} onOpen={() => openMulti("Hizmet Verilen Alan Seç", SERVICE_AREA_GROUPS, draft.serviceAreas, (serviceAreas) => onChange({ serviceAreas }), { groupSelectAll: true })} />
            <SelectionField label="Stil Uzmanlıkları" values={draft.styleExpertise} error={errors.styleExpertise} onOpen={() => openMulti("Stil Uzmanlığı Seç", [{ label: "Stil Uzmanlıkları", options: STYLE_OPTIONS }], draft.styleExpertise, (styleExpertise) => onChange({ styleExpertise }))} />
          </SectionCard>

          <SectionCard title="Konum ve Çalışma Alanı">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectionField
                label="Şehir"
                required
                values={draft.cities}
                error={errors.cities ?? errors.city}
                onOpen={() =>
                  openMulti("Şehir Seç", [{ label: "Şehirler", options: TURKIYE_ILLERI }], draft.cities, (cities) => {
                    const city = cities[0] ?? "";
                    onChange({
                      cities,
                      city,
                      district: cities.length === 1 && getDistrictOptions(city).includes(draft.district) ? draft.district : "",
                    });
                  })
                }
              />
              {draft.cities.length === 1 ? (
                <SelectionField label="İlçe" values={draft.district ? [draft.district] : []} error={errors.district} onOpen={() => openSingle("İlçe Seç", districtOptions, draft.district, (district) => onChange({ district }))} />
              ) : null}
            </div>
            <SelectionField label="Hizmet Verilen Bölgeler" required values={draft.serviceRegions} error={errors.serviceRegions} onOpen={() => openMulti("Hizmet Bölgesi Seç", [{ label: "Bölgeler", options: SERVICE_REGION_OPTIONS }], draft.serviceRegions, (serviceRegions) => onChange({ serviceRegions }))} />
          </SectionCard>

          <SectionCard title="Bütçe ve Çalışma Modeli">
            <SelectionField label="Başlangıç Bütçesi" values={draft.startingBudget ? [draft.startingBudget] : []} error={errors.startingBudget} onOpen={() => openSingle("Başlangıç Bütçesi Seç", STARTING_BUDGET_OPTIONS, draft.startingBudget, (startingBudget) => onChange({ startingBudget }))} />
            <SelectionField label="Çalışma Modeli" values={draft.workingModels} error={errors.workingModels} onOpen={() => openMulti("Çalışma Modeli Seç", [{ label: "Çalışma Modeli", options: WORKING_MODEL_OPTIONS }], draft.workingModels, (workingModels) => onChange({ workingModels }))} />
          </SectionCard>

          <SectionCard title="Etiketler">
            <SelectionField label="Etiketler" values={draft.tags} error={errors.tags} onOpen={() => openMulti("Etiket Seç", [{ label: "Etiketler", options: TAG_OPTIONS }], draft.tags, (tags) => onChange({ tags }), { max: 10, bulkSelect: false })} />
          </SectionCard>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/[0.92] p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
        <div className="mx-auto flex max-w-6xl justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0E5A3A] px-6 text-sm font-bold text-white shadow-[0_18px_40px_rgba(14,90,58,0.22)] disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {picker ? <PickerSheet config={picker} onClose={() => setPicker(null)} /> : null}
    </div>
  );
}
