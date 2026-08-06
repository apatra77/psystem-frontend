import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { UploadCloud } from 'lucide-react'
import FieldShell from './FieldShell'
import { colors } from '@/app/themes/colors'

export default function FileField({ name, label, accept = 'image/*,application/pdf', hint, required, className }) {
  const { control, formState: { errors } } = useFormContext()
  const [fileName, setFileName] = useState('')
  const error = errors?.[name]?.message

  return (
    <FieldShell label={label} error={error} hint={hint} required={required} className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <label
            className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-[15px] cursor-pointer text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1.5px dashed ${error ? '#ff8a80' : colors.border}`,
            }}
          >
            <UploadCloud size={22} style={{ color: colors.accent }} />
            <span className="text-[13px] font-bold" style={{ color: colors.textBright }}>
              {fileName || 'Choose a file or drag it here'}
            </span>
            <span className="text-[11.5px]" style={{ color: colors.textDim }}>
              JPG, PNG or PDF · up to 5MB
            </span>
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setFileName(file?.name ?? '')
                field.onChange(file)
              }}
            />
          </label>
        )}
      />
    </FieldShell>
  )
}
