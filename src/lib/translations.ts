export type Language = 'en' | 'ar' | 'ur' | 'bn'

export interface Translation {
  [key: string]: {
    [key in Language]: string
  }
}

export const translations: Translation = {
  // Kiosk UI
  'kiosk.title': {
    en: 'Queue Management System',
    ar: 'نظام إدارة الطوابير',
    ur: 'قطار کا انتظامی نظام',
    bn: 'সারি ব্যবস্থাপনা সিস্টেম'
  },
  'kiosk.subtitle': {
    en: 'Please select a service to get your ticket',
    ar: 'يرجى تحديد الخدمة للحصول على تذكرتك',
    ur: 'ٹکٹ حاصل کرنے کے لیے براہ کرم سروس کا انتخاب کریں',
    bn: 'আপনার টিকিট পেতে অনুগ্রহ করে একটি পরিষেবা নির্বাচন করুন'
  },
  'kiosk.select_language': {
    en: 'Select Language / اختر اللغة / زبان منتخب کریں / ভাষা নির্বাচন করুন',
    ar: 'اختر اللغة',
    ur: 'زبان منتخب کریں',
    bn: 'ভাষা নির্বাচন করুন'
  },
  'kiosk.issuing_ticket': {
    en: 'Issuing your ticket...',
    ar: 'جاري إصدار تذكرتك...',
    ur: 'آپ کا ٹکٹ جاری ہو رہا ہے...',
    bn: 'আপনার টিকিট ইস্যু করা হচ্ছে...'
  },
  'kiosk.please_wait': {
    en: 'Please wait while we generate your ticket for',
    ar: 'يرجى الانتظار بينما نقوم بإنشاء تذكرتك لـ',
    ur: 'ہم آپ کے لیے ٹکٹ تیار کرتے وقت براہ کرم انتظار کریں',
    bn: 'আমরা আপনার জন্য টিকিট তৈরি করার সময় অনুগ্রহ করে অপেক্ষা করুন'
  },
  'kiosk.ticket_issued': {
    en: 'Ticket Issued Successfully!',
    ar: 'تم إصدار التذكرة بنجاح!',
    ur: 'ٹکٹ کامیابی سے جاری ہو گیا!',
    bn: 'টিকিট সফলভাবে জারি করা হয়েছে!'
  },
  'kiosk.take_ticket': {
    en: 'Please take your ticket and wait for your number to be called',
    ar: 'يرجى أخذ تذكرتك والانتظار حتى يتم استدعاء رقمك',
    ur: 'براہ کرم اپنا ٹکٹ لیں اور اپنے نمبر کی بلانے کا انتظار کریں',
    bn: 'অনুগ্রহ করে আপনার টিকিট নিন এবং আপনার নম্বর ডাকা হওয়া পর্যন্ত অপেক্ষা করুন'
  },
  'kiosk.print_ticket': {
    en: 'Print Ticket',
    ar: 'طباعة التذكرة',
    ur: 'ٹکٹ پرنٹ کریں',
    bn: 'টিকিট প্রিন্ট করুন'
  },
  'kiosk.preparing_print': {
    en: 'Preparing Print...',
    ar: 'جاري التحضير للطباعة...',
    ur: 'پرنٹ تیار ہو رہا ہے...',
    bn: 'প্রিন্ট প্রস্তুত করা হচ্ছে...'
  },
  'kiosk.get_another': {
    en: 'Get Another Ticket',
    ar: 'الحصول على تذكرة أخرى',
    ur: 'دوسرا ٹکٹ حاصل کریں',
    bn: 'আরেকটি টিকিট নিন'
  },
  'kiosk.current': {
    en: 'Current',
    ar: 'الحالي',
    ur: 'موجودہ',
    bn: 'বর্তমান'
  },
  'kiosk.click_to_get': {
    en: 'Click to get your ticket',
    ar: 'انقر للحصول على تذكرتك',
    ur: 'اپنا ٹکٹ حاصل کرنے کے لیے کلک کریں',
    bn: 'আপনার টিকিট পেতে ক্লিক করুন'
  },
  'kiosk.back_to_home': {
    en: 'Back to Home',
    ar: 'العودة إلى الرئيسية',
    ur: 'ہوم پر واپس جائیں',
    bn: 'হোমে ফিরে যান'
  },

  // Service names (examples - these should be managed in the database)
  'service.customer_service': {
    en: 'Customer Service',
    ar: 'خدمة العملاء',
    ur: 'کسٹمر سروس',
    bn: 'গ্রাহক পরিষেবা'
  },
  'service.technical_support': {
    en: 'Technical Support',
    ar: 'الدعم الفني',
    ur: 'ٹیکنیکل سپورٹ',
    bn: 'প্রযুক্তিগত সহায়তা'
  },
  'service.billing': {
    en: 'Billing & Payments',
    ar: 'الفواتير والمدفوعات',
    ur: 'بلنگ اور ادائیگیاں',
    bn: 'বিলিং এবং পেমেন্ট'
  },
  'service.consultation': {
    en: 'Consultation',
    ar: 'استشارة',
    ur: 'مشاورت',
    bn: 'পরামর্শ'
  },
  'service.information': {
    en: 'Information Desk',
    ar: 'مكتب المعلومات',
    ur: 'انفارمیشن ڈیسک',
    bn: 'তথ্য ডেস্ক'
  },

  // Ticket printing
  'ticket.service': {
    en: 'Service',
    ar: 'الخدمة',
    ur: 'سروس',
    bn: 'পরিষেবা'
  },
  'ticket.ticket': {
    en: 'Ticket',
    ar: 'التذكرة',
    ur: 'ٹکٹ',
    bn: 'টিকিট'
  },
  'ticket.date': {
    en: 'Date',
    ar: 'التاريخ',
    ur: 'تاریخ',
    bn: 'তারিখ'
  },
  'ticket.time': {
    en: 'Time',
    ar: 'الوقت',
    ur: 'وقت',
    bn: 'সময়'
  },
  'ticket.wait_message': {
    en: 'Please wait for your number',
    ar: 'يرجى الانتظار لرقمك',
    ur: 'براہ کرم اپنے نمبر کا انتظار کریں',
    bn: 'অনুগ্রহ করে আপনার নম্বরের জন্য অপেক্ষা করুন'
  },
  'ticket.thank_you': {
    en: 'Thank you for your patience',
    ar: 'شكرا لصبركم',
    ur: 'آپ کے صبر کا شکریہ',
    bn: 'আপনার ধৈর্যের জন্য ধন্যবাদ'
  }
}

export const getTranslation = (key: string, language: Language = 'en'): string => {
  return translations[key]?.[language] || translations[key]?.['en'] || key
}

export const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية' },
  { code: 'ur' as Language, name: 'Urdu', nativeName: 'اردو' },
  { code: 'bn' as Language, name: 'Bengali', nativeName: 'বাংলা' }
]

export const getLanguageDirection = (language: Language): 'ltr' | 'rtl' => {
  return language === 'ar' || language === 'ur' ? 'rtl' : 'ltr'
}