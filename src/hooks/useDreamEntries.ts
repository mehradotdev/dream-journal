import { useQuery, useMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';
import { toast } from 'sonner';
import { type DreamFormData } from '~/src/types/dream';
import { type Id } from '~/convex/_generated/dataModel';

export function useDreamEntries() {
  const dreamEntries = useQuery(api.dreams.getDreamEntries) || [];
  const createDreamEntry = useMutation(api.dreams.createDreamEntry);
  const updateDreamEntry = useMutation(api.dreams.updateDreamEntry);
  const deleteDreamEntry = useMutation(api.dreams.deleteDreamEntry);

  const handleCreate = async (data: DreamFormData) => {
    try {
      await createDreamEntry(data);
      toast.success('Dream entry saved successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to save dream entry');
      return false;
    }
  };

  const handleUpdate = async (id: Id<"dreamEntries">, data: DreamFormData) => {
    try {
      await updateDreamEntry({ id, ...data });
      toast.success('Dream entry updated successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update dream entry');
      return false;
    }
  };

  const handleDelete = async (id: Id<"dreamEntries">) => {
    if (!confirm('Are you sure you want to delete this dream entry? This action cannot be undone.')) {
      return false;
    }
    
    try {
      await deleteDreamEntry({ id });
      toast.success('Dream entry deleted');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete dream entry');
      return false;
    }
  };

  return {
    dreamEntries,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
