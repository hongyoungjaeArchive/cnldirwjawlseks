'use client'

import { useDropzone } from 'react-dropzone'
import { Upload, FileCode, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Language } from '@/lib/types'

interface FileUploadProps {
  onCodeLoaded: (code: string) => void
  language: Language
}

const acceptedExtensions: Record<Language, string[]> = {
  c: ['.c', '.h'],
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'],
}

export function FileUpload({ onCodeLoaded, language }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [loadedFile, setLoadedFile] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/plain': acceptedExtensions[language] },
    maxFiles: 1,
    maxSize: 500 * 1024,
    onDropAccepted: async (files) => {
      setError(null)
      const file = files[0]
      const text = await file.text()
      onCodeLoaded(text)
      setLoadedFile(file.name)
    },
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0]
      if (err?.code === 'file-too-large') {
        setError('파일 크기는 500KB 이하여야 합니다.')
      } else if (err?.code === 'file-invalid-type') {
        setError(`${language === 'c' ? '.c, .h' : '.cpp, .cc, .hpp'} 파일만 업로드 가능합니다.`)
      } else {
        setError('파일을 읽을 수 없습니다.')
      }
    },
  })

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-sky-400 bg-sky-50'
            : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50',
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm',
          isDragActive ? 'bg-sky-100' : 'bg-slate-100',
        )}>
          {loadedFile ? (
            <FileCode className="w-5 h-5 text-sky-500" />
          ) : (
            <Upload className={cn('w-5 h-5', isDragActive ? 'text-sky-500' : 'text-slate-600')} />
          )}
        </div>

        {loadedFile ? (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">{loadedFile}</p>
            <p className="text-xs text-slate-600 mt-0.5">파일이 로드되었습니다</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">
              {isDragActive ? '여기에 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {acceptedExtensions[language].join(', ')} · 최대 500KB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
    </div>
  )
}
