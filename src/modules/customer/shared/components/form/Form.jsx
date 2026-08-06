import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

/**
 * Every form in the app goes through here:
 *   <Form schema={loginSchema} defaultValues={{...}} onSubmit={fn}>…</Form>
 * Fields inside read their state from context — no prop drilling of `register`.
 */
export default function Form({
  schema,
  defaultValues,
  onSubmit,
  mode = 'onTouched',
  className = '',
  children,
  formRef,
  ...rest
}) {
  const methods = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
    mode,
  })

  if (formRef) formRef.current = methods

  return (
    <FormProvider {...methods}>
      <form noValidate className={className} onSubmit={methods.handleSubmit((values) => onSubmit(values, methods))} {...rest}>
        {typeof children === 'function' ? children(methods) : children}
      </form>
    </FormProvider>
  )
}
