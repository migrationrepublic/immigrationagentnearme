"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calendar, Save, CheckCircle2, XCircle, Lock } from "lucide-react";
import { getAvailabilityForDateAction, updateAvailabilityAction } from "@/app/actions/admin";

const defaultSlots = [
  "09:00:00",
  "10:00:00",
  "11:00:00",
  "13:00:00",
  "14:00:00",
  "15:00:00",
  "16:00:00",
];

export default function ManageAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    // default to today in Melbourne time if possible, or just local today
    const tzDate = new Date().toLocaleString("en-US", { timeZone: "Australia/Melbourne" });
    const d = new Date(tzDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // slot time -> 'available' | 'blocked' | 'booked'
  const [slotStates, setSlotStates] = useState<Record<string, 'available' | 'blocked' | 'booked'>>({});

  useEffect(() => {
    async function loadDate() {
      setLoading(true);
      try {
        const { blockedTimes, bookedTimes } = await getAvailabilityForDateAction(selectedDate);
        
        const newStates: Record<string, 'available' | 'blocked' | 'booked'> = {};
        for (const slot of defaultSlots) {
          if (bookedTimes.includes(slot)) {
            newStates[slot] = 'booked';
          } else if (blockedTimes.includes(slot)) {
            newStates[slot] = 'blocked';
          } else {
            newStates[slot] = 'available';
          }
        }
        setSlotStates(newStates);
      } catch (e) {
        console.error("Failed to load availability", e);
        alert("Failed to load availability. Make sure you are an admin.");
      } finally {
        setLoading(false);
      }
    }
    loadDate();
  }, [selectedDate]);

  const toggleSlot = (time: string) => {
    if (slotStates[time] === 'booked') return; // Cannot toggle real bookings here

    setSlotStates((prev) => ({
      ...prev,
      [time]: prev[time] === 'available' ? 'blocked' : 'available',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const blockedSlotsToSave = Object.entries(slotStates)
        .filter(([_, state]) => state === 'blocked')
        .map(([time, _]) => time);

      await updateAvailabilityAction(selectedDate, blockedSlotsToSave);
      alert("Availability saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Error saving availability.");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Availability</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Block out dates or specific times when you cannot take consultations.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8">
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
          <div className="relative max-w-xs">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Time Slots for {selectedDate}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultSlots.map((time) => {
                const state = slotStates[time];
                
                let boxClass = "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 cursor-pointer hover:border-blue-400";
                let icon = <CheckCircle2 className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />;
                let textClass = "text-gray-700 dark:text-gray-300";
                let statusText = "Available";

                if (state === 'booked') {
                  boxClass = "border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 cursor-not-allowed opacity-80";
                  icon = <Lock className="w-5 h-5 text-blue-500" />;
                  textClass = "text-blue-700 dark:text-blue-400";
                  statusText = "Booked by Client";
                } else if (state === 'blocked') {
                  boxClass = "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 cursor-pointer hover:bg-red-100";
                  icon = <XCircle className="w-5 h-5 text-red-500" />;
                  textClass = "text-red-700 dark:text-red-400 font-medium";
                  statusText = "Unavailable";
                } else {
                  boxClass = "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 cursor-pointer hover:bg-green-100";
                  icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                  textClass = "text-green-700 dark:text-green-400 font-medium";
                }

                return (
                  <div
                    key={time}
                    onClick={() => toggleSlot(time)}
                    className={`group relative p-4 rounded-xl border-2 transition-all flex items-center justify-between ${boxClass}`}
                  >
                    <div>
                      <div className={`font-bold text-lg mb-1 ${textClass}`}>
                        {formatTime(time)}
                      </div>
                      <div className={`text-xs uppercase tracking-wider font-bold ${state === 'booked' ? 'text-blue-500' : state === 'blocked' ? 'text-red-500' : 'text-green-600'}`}>
                        {statusText}
                      </div>
                    </div>
                    <div>{icon}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Available (Click to block)</div>
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Unavailable (Click to unblock)</div>
              <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-500" /> Client Booked (Cannot change)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
