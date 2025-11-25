import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { type DreamEntryFormData, MOODS } from "~/src/types/dream";
import { toast } from "sonner";
import { getMaxDate, getTodayDate, getCurrentTime, getMaxTime, getTimezone } from "../../utils/dateFormatters";

interface DreamEntryFormProps {
  onSuccess?: () => void;
}

export function DreamEntryForm({ onSuccess }: DreamEntryFormProps) {
  const createDreamEntry = useMutation(api.dreams.createDreamEntry);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<DreamEntryFormData>({
    description: "",
    mood: "",
    sleepQuality: 3,
    priorNightActivities: "",
    dreamDate: getTodayDate(),
    dreamTime: getCurrentTime(),
    dreamTimeTimezone: getTimezone(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error("Please describe your dream");
      return;
    }

    if (!formData.mood.trim()) {
      toast.error("Please select your mood");
      return;
    }

    // Create a date object from the form inputs for validation
    // Note: We use the local browser time for this check
    const localDate = new Date(`${formData.dreamDate}T${formData.dreamTime}`);
    
    // Validate that date-time is not in the future
    const now = new Date();
    
    // ADDED: 1-minute buffer (60,000ms) to match server-side logic.
    // This prevents blocking "just now" entries due to slight clock mismatches.
    const buffer = 60 * 1000;

    if (localDate.getTime() > (now.getTime() + buffer)) {
      toast.error("Dream date and time cannot be in the future");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createDreamEntry(formData);
      toast.success("Dream entry saved!");
      
      // Reset form
      setFormData({
        description: "",
        mood: "",
        sleepQuality: 3,
        priorNightActivities: "",
        dreamDate: getTodayDate(),
        dreamTime: getCurrentTime(),
        dreamTimeTimezone: getTimezone(),
      });
      
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save dream entry:", error);
      // More descriptive error if it comes from the server
      const errorMessage = error instanceof Error ? error.message : "Failed to save dream entry";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof DreamEntryFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          type="date"
          label="Dream Date"
          value={formData.dreamDate}
          max={getMaxDate()}
          onChange={(e) => updateField("dreamDate", e.target.value)}
        />
        <Input
          type="time"
          label="Dream Time"
          value={formData.dreamTime}
          max={getMaxTime(formData.dreamDate)}
          onChange={(e) => updateField("dreamTime", e.target.value)}
          required
        />
        <Input
          type="text"
          label="Timezone"
          value={formData.dreamTimeTimezone}
          onChange={(e) => updateField("dreamTimeTimezone", e.target.value)}
          placeholder="e.g., +05:30"
          // It is often better to make this read-only so users don't break the format
          // readOnly 
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 -mt-4">
        You can add multiple dream entries for the same date. Perfect for catching up on missed days or recording multiple dreams from one night!
      </p>

      <Textarea
        label="Dream Description *"
        value={formData.description}
        onChange={(e) => updateField("description", e.target.value)}
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
              onClick={() => updateField('mood', mood)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.mood === mood
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
          Sleep Quality: {formData.sleepQuality}/5
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Poor</span>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.sleepQuality}
            onChange={(e) => updateField("sleepQuality", parseInt(e.target.value))}
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
        value={formData.priorNightActivities}
        onChange={(e) => updateField("priorNightActivities", e.target.value)}
        placeholder="What did you do before bed? (e.g., had alcohol, took a hot shower, read a book, watched TV...)"
        rows={3}
      />

      <Button
        type="submit"
        disabled={isSubmitting || !formData.description.trim() || !formData.mood}
        className="w-full"
      >
        {isSubmitting ? "Saving..." : "Save Dream Entry"}
      </Button>
    </form>
  );
}
