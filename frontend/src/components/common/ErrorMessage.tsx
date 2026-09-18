import { Alert } from '@mantine/core'

type ErrorMessageProps = {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <Alert role="alert" color="red" variant="light" className="rounded-2xl text-sm">
      {message}
    </Alert>
  )
}
