export const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
