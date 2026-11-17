import i18n from 'i18next';
import lvTranslation from './../src/locales/lv.json';
import enTranslation from './../src/locales/en.json';
import etTranslation from './../src/locales/et.json';
import ltTranslation from './../src/locales/lt.json';
import fiTranslation from './../src/locales/fi.json';
import dvTranslation from './../src/locales/sv.json';


export const initTranslations = (defaultLang: string) => {
  i18n
    .init({
      initImmediate: false, // setting initImediate to false, will load the resources synchronously
      fallbackLng: defaultLang,
      preload: ['en', 'lv', 'ru'],
      debug: false,
      ns: ['backend'],
      defaultNS: 'backend',
      resources: {
        lv: { backend: lvTranslation },
        en: { backend: enTranslation },
        et: { backend: etTranslation },
        lt: { backend: ltTranslation },
        fi: { backend: fiTranslation },
        sv: { backend: dvTranslation },
      },
      interpolation: {
        escapeValue: false,
      },
    }, (err, t) => {
      if (err) {
        console.log('Translation loading failed', err);
      }
    }
    );
}


