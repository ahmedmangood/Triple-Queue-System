'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Languages } from 'lucide-react'
import { Language, languages, getLanguageDirection } from '@/lib/translations'

interface LanguageSelectorProps {
  selectedLanguage: Language
  onLanguageSelect: (language: Language) => void
}

export default function LanguageSelector({ selectedLanguage, onLanguageSelect }: LanguageSelectorProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-center mb-4">
          <Languages className="h-6 w-6 mr-2 text-blue-600" />
          <h2 className="text-xl font-semibold text-center">
            Select Language / اختر اللغة / زبان منتخب کریں / ভাষা নির্বাচন করুন
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {languages.map((language) => (
            <Button
              key={language.code}
              variant={selectedLanguage === language.code ? "default" : "outline"}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                selectedLanguage === language.code ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
              onClick={() => onLanguageSelect(language.code)}
              dir={getLanguageDirection(language.code)}
            >
              <span className="text-lg font-bold">{language.nativeName}</span>
              <span className="text-xs opacity-75">{language.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}