import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '~/convex/_generated/api';
import { type DreamEntry } from '~/src/types/dream';
import { useDreamEntries } from '~/src/hooks/useDreamEntries';
import { DreamEntryForm } from '~/src/components/dreams/DreamEntryForm';
import { DreamEntryList } from '~/src/components/dreams/DreamEntryList';
import { Button } from '~/src/components/ui/Button';

export function DreamJournal() {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DreamEntry | null>(null);
  const { dreamEntries, handleCreate, handleUpdate, handleDelete } = useDreamEntries();
  
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const canCreateEntries = loggedInUser?.emailVerificationTime ? true : false;

  const onCreateEntry = async (data: any) => {
    const success = await handleCreate(data);
    if (success) {
      setShowForm(false);
    }
    return success;
  };

  const onUpdateEntry = async (data: any) => {
    if (!editingEntry) return false;
    const success = await handleUpdate(editingEntry._id, data);
    if (success) {
      setEditingEntry(null);
    }
    return success;
  };

  const onDeleteEntry = async (id: DreamEntry['_id']) => {
    await handleDelete(id);
  };

  const handleEditEntry = (entry: DreamEntry) => {
    setEditingEntry(entry);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!showForm && !editingEntry && canCreateEntries && (
          <Button onClick={() => setShowForm(true)}>
            Add Dream Entry
          </Button>
        )}
        {!canCreateEntries && (
          <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-200">
              Please verify your email to start adding dream entries.
            </p>
          </div>
        )}
        {(showForm || editingEntry) && (
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        )}
      </div>

      {(showForm || editingEntry) && canCreateEntries && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-light text-slate-800 dark:text-slate-200 mb-6">
            {editingEntry ? 'Edit Dream Entry' : 'New Dream Entry'}
          </h2>
          <DreamEntryForm
            onSuccess={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
          />
        </div>
      )}

      <DreamEntryList
        entries={dreamEntries}
        onEdit={handleEditEntry}
        onDelete={onDeleteEntry}
        canEdit={canCreateEntries}
      />
    </div>
  );
}
