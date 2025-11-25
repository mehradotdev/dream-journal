import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { type DreamEntry } from "~/src/types/dream";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
// IMPORT getTimezone HERE
import { formatTime, getMaxDate, getMaxTime, getCurrentTime, getTimezone } from "~/src/utils/dateFormatters";
import { getSleepQualityText, getSleepQualityColor } from "~/src/utils/sleepQuality";
import { toast } from "sonner";
import { MOODS } from "~/src/types/dream";

interface DreamEntryCardProps {
  entry: DreamEntry;
  entryNumber?: number;
}

export function DreamEntryCard({ entry, entryNumber }: DreamEntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = entry.description.length > 200;
  const updateDreamEntry = useMutation(api.dreams.updateDreamEntry);
  const deleteDreamEntry = useMutation(api.dreams.deleteDreamEntry);

  const [editData, setEditData] = useState({
    description: entry.description,
    mood: entry.mood,
    sleepQuality: entry.sleepQuality,
    priorNightActivities: entry.priorNightActivities,
    dreamDate: entry.dreamDate,
    dreamTime: entry.dreamTime || "",
    // Initialize with current timezone to ensure updates are calculated correctly
    dreamTimeTimezone: getTimezone(), 
  });

  const handleSave = async () => {
    if (!editData.description.trim() || !editData.mood.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate that date-time is not in the future
    if (editData.dreamTime) {
      // Use local date object for comparison (browser timezone)
      const dreamDateTime = new Date(`${editData.dreamDate}T${editData.dreamTime}`);
      const now = new Date();
      // Add buffer to frontend check too
      const buffer = 60 * 1000;
      
      if (dreamDateTime.getTime() > (now.getTime() + buffer)) {
        toast.error("Dream date and time cannot be in the future");
        return;
      }
    }

    try {
      await updateDreamEntry({
        id: entry._id,
        ...editData,
      });
      setIsEditing(false);
      toast.success("Dream entry updated!");
    } catch (error) {
      console.error("Failed to update dream entry:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update dream entry";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this dream entry?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDreamEntry({ id: entry._id });
      toast.success("Dream entry deleted");
    } catch (error) {
      console.error("Failed to delete dream entry:", error);
      toast.error("Failed to delete dream entry");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      description: entry.description,
      mood: entry.mood,
      sleepQuality: entry.sleepQuality,
      priorNightActivities: entry.priorNightActivities,
      dreamDate: entry.dreamDate,
      dreamTime: entry.dreamTime || "",
      dreamTimeTimezone: getTimezone(),
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow ml-4">
        <div className="p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Dream Date"
                value={editData.dreamDate}
                max={getMaxDate()}
                onChange={(e) => setEditData(prev => ({ ...prev, dreamDate: e.target.value }))}
              />
              <Input
                type="time"
                label="Dream Time"
                value={editData.dreamTime || getCurrentTime()}
                max={getMaxTime(editData.dreamDate)}
                onChange={(e) => setEditData(prev => ({ ...prev, dreamTime: e.target.value }))}
              />
            </div>

            <Textarea
              label="Dream Description *"
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your dream in as much detail as you remember..."
              rows={6}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mood Upon Waking *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setEditData(prev => ({ ...prev, mood }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      editData.mood === mood
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sleep Quality: {editData.sleepQuality}/5
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Poor</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={editData.sleepQuality}
                  onChange={(e) => setEditData(prev => ({ ...prev, sleepQuality: parseInt(e.target.value) }))}
                  className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">Excellent</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            <Textarea
              label="Prior Night Activities"
              value={editData.priorNightActivities}
              onChange={(e) => setEditData(prev => ({ ...prev, priorNightActivities: e.target.value }))}
              placeholder="What did you do before bed? (e.g., had alcohol, took a hot shower, read a book, watched TV...)"
              rows={3}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!editData.description.trim() || !editData.mood}
                className="flex-1"
              >
                Update Entry
              </Button>
              <Button type="button" onClick={handleCancel} variant="secondary">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // View Mode (Non-editing)
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow ml-4">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {entryNumber && (
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  Entry #{entryNumber}
                </span>
              )}
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {entry.dreamTime ? `${entry.dreamTime} • ` : ''}Added {formatTime(entry._creationTime)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {entry.mood}
              </span>
              <span className={`font-medium ${getSleepQualityColor(entry.sleepQuality)}`}>
                Sleep: {getSleepQualityText(entry.sleepQuality)} ({entry.sleepQuality}/5)
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              className="px-3 py-1 text-sm"
            >
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              disabled={isDeleting}
              className="px-3 py-1 text-sm"
            >
              {isDeleting ? "..." : "Delete"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dream Description</h4>
            <div className="text-slate-600 dark:text-slate-400">
              {isExpanded || !shouldTruncate ? (
                <div>
                  <p className="whitespace-pre-wrap">{entry.description}</p>
                  {shouldTruncate && (
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="text-blue-500 hover:text-blue-600 text-sm mt-2 font-medium"
                    >
                      Show less
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap">
                    {entry.description.substring(0, 200)}...
                  </p>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-blue-500 hover:text-blue-600 text-sm mt-2 font-medium"
                  >
                    Read more
                  </button>
                </div>
              )}
            </div>
          </div>

          {entry.priorNightActivities && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Prior Night Activities</h4>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {entry.priorNightActivities}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
