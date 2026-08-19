export const supportedLanguages = {
  en: { name: 'English', locale: 'en-NG', voiceLocale: 'en-NG' },
  yo: { name: 'Yoruba', locale: 'yo-NG', voiceLocale: 'yo-NG' },
  ig: { name: 'Igbo', locale: 'ig-NG', voiceLocale: 'ig-NG' },
  ha: { name: 'Hausa', locale: 'ha-NG', voiceLocale: 'ha-NG' },
  pcm: { name: 'Nigerian Pidgin', locale: 'pcm-NG', voiceLocale: 'en-NG' },
} as const

export type LanguageCode = keyof typeof supportedLanguages

export const defaultLanguage: LanguageCode = 'en'

export const uiCopy: Record<LanguageCode, {
  language: string
  healthAssistant: string
  poweredBy: string
  askHealth: string
  send: string
  listening: string
  stop: string
  readAloud: string
  stopReading: string
  voiceUnavailable: string
  voiceInputUnavailable: string
  disclaimer: string
  placeholder: string
  retryMessage: string
}> = {
  en: {
    language: 'Language', healthAssistant: 'Health Assistant', poweredBy: 'Record-aware AI',
    askHealth: 'Ask about your health...', send: 'Send', listening: 'Listening…', stop: 'Stop',
    readAloud: 'Read aloud', stopReading: 'Stop reading',
    voiceUnavailable: 'A voice for this language is not available on this device. You can still read the response.',
    voiceInputUnavailable: 'Voice input is not available in this browser. Please type your question.',
    disclaimer: 'This AI provides health information only and is not a substitute for medical advice. Consult a qualified clinician for medical decisions.',
    placeholder: 'Ask about your health...', retryMessage: 'I could not reach the health assistant. Please try again or contact a clinician if you need urgent help.',
  },
  yo: {
    language: 'Èdè', healthAssistant: 'Olùrànlọ́wọ́ Ìlera', poweredBy: 'AI tó mọ ìwé ìlera rẹ',
    askHealth: 'Béèrè nípa ìlera rẹ...', send: 'Fìránṣẹ́', listening: 'Ń gbọ́…', stop: 'Dúró',
    readAloud: 'Ka a sókè', stopReading: 'Dúró kíka',
    voiceUnavailable: 'Ohùn fún èdè yìí kò sí lórí ẹ̀rọ yìí. O ṣì lè ka ìdáhùn náà.',
    voiceInputUnavailable: 'Ìfàwọlé nípa ohùn kò sí nínú aṣàwákiri yìí. Jọ̀wọ́ tẹ ìbéèrè rẹ.',
    disclaimer: 'AI yìí ń pèsè ìmọ̀ nípa ìlera nìkan; kò lè rọ́pò ìmọ̀ràn dókítà. Kan sí oníṣègùn tó yẹ fún ìpinnu ìlera.',
    placeholder: 'Béèrè nípa ìlera rẹ...', retryMessage: 'A kò lè dé ọdọ olùrànlọ́wọ́ ìlera. Jọ̀wọ́ tún gbìyànjú, tàbí kan sí oníṣègùn fún ìrànlọ́wọ́ kánjú.',
  },
  ig: {
    language: 'Asụsụ', healthAssistant: 'Onye Enyemaka Ahụike', poweredBy: 'AI maara ndekọ ahụike gị',
    askHealth: 'Jụọ maka ahụike gị...', send: 'Zipụ', listening: 'Na-ege ntị…', stop: 'Kwụsị',
    readAloud: 'Gụọ ya n’olu', stopReading: 'Kwụsị ịgụ',
    voiceUnavailable: 'Olu maka asụsụ a adịghị na ngwaọrụ a. Ị ka nwere ike ịgụ azịza a.',
    voiceInputUnavailable: 'Ntinye olu adịghị na ihe nchọgharị a. Biko dee ajụjụ gị.',
    disclaimer: 'AI a na-enye naanị ozi ahụike; ọ bụghị nnọchi ndụmọdụ dọkịta. Kpọtụrụ dọkịta ruru eru maka mkpebi ahụike.',
    placeholder: 'Jụọ maka ahụike gị...', retryMessage: 'Enweghị m ike iru onye enyemaka ahụike. Biko nwaa ọzọ ma ọ bụ kpọtụrụ dọkịta ma ọ bụrụ na ịchọrọ enyemaka ngwa ngwa.',
  },
  ha: {
    language: 'Harshe', healthAssistant: 'Mataimakin Lafiya', poweredBy: 'AI mai sanin bayanan lafiyarka',
    askHealth: 'Tambayi game da lafiyarka...', send: 'Aika', listening: 'Ana sauraro…', stop: 'Tsaya',
    readAloud: 'Karanta da murya', stopReading: 'Tsaya karantawa',
    voiceUnavailable: 'Babu muryar wannan harshe a na’urarka. Har yanzu za ka iya karanta amsar.',
    voiceInputUnavailable: 'Ba a samun shigar da murya a wannan mai lilo. Da fatan za a rubuta tambayarka.',
    disclaimer: 'Wannan AI yana ba da bayanin lafiya kawai, ba ya maye gurbin shawarar likita. Tuntuɓi ƙwararren likita domin yanke shawarar lafiya.',
    placeholder: 'Tambayi game da lafiyarka...', retryMessage: 'Ba a iya samun mataimakin lafiya ba. Da fatan za a sake gwadawa ko a tuntubi likita idan kana bukatar taimakon gaggawa.',
  },
  pcm: {
    language: 'Language', healthAssistant: 'Health Assistant', poweredBy: 'AI wey sabi your health record',
    askHealth: 'Ask about your health...', send: 'Send am', listening: 'I dey listen…', stop: 'Stop',
    readAloud: 'Read am loud', stopReading: 'Stop reading',
    voiceUnavailable: 'Voice for this language no dey this device. You still fit read the answer.',
    voiceInputUnavailable: 'Voice input no dey this browser. Abeg type your question.',
    disclaimer: 'This AI na for health information only; e no replace doctor advice. Talk to qualified clinician before you make health decision.',
    placeholder: 'Ask about your health...', retryMessage: 'I no fit reach the health assistant now. Abeg try again, or contact clinician if na urgent matter.',
  },
}
