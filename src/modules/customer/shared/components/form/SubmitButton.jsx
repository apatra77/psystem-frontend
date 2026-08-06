import { useFormContext } from 'react-hook-form'
import Button from '@/shared/ui/Button'

export default function SubmitButton({ children, ...rest }) {
  const { formState: { isSubmitting } } = useFormContext()
  return (
    <Button type="submit" loading={isSubmitting} {...rest}>
      {children}
    </Button>
  )
}
