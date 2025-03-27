import { format } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return format(new Date(dateString), 'yyyy-MM-dd');
};