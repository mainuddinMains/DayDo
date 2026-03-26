/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Video, 
  Brush, 
  Utensils, 
  Check, 
  Bolt, 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  RefreshCw, 
  UserCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

type EntryType = 'calendar' | 'task' | 'break' | 'client' | 'focus';

interface TimelineEntry {
  id: string;
  time: string; // e.g., "08 AM"
  type: EntryType;
  title: string;
  category?: string;
  completed?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

const INITIAL_ENTRIES: TimelineEntry[] = [
  {
    id: '1',
    time: '08 AM',
    type: 'calendar',
    category: 'CALENDAR',
    title: 'Team Standup',
    icon: <Video className="w-4 h-4" />,
  },
  {
    id: '2',
    time: '09 AM',
    type: 'task',
    title: 'Submit Q1 Growth Report',
    completed: false,
  },
  {
    id: '3',
    time: '11 AM',
    type: 'client',
    category: 'CLIENT',
    title: 'Design Review: Synthesis Bio',
    icon: <Brush className="w-4 h-4" />,
  },
  {
    id: '4',
    time: '12 PM',
    type: 'break',
    title: 'Lunch break',
    icon: <Utensils className="w-4 h-4" />,
  },
  {
    id: '5',
    time: '01 PM',
    type: 'task',
    title: 'Pick up dry cleaning',
    completed: true,
  },
  {
    id: '6',
    time: '02 PM',
    type: 'task',
    title: 'Update DNA Sequence Visualizer',
    completed: false,
  },
  {
    id: '7',
    time: '04 PM',
    type: 'focus',
    category: 'FOCUS',
    title: 'Deep Work: API Integration',
    icon: <Bolt className="w-4 h-4" />,
  },
];

const HOURS = [
  '08 AM', '09 AM', '10 AM', '11 AM', '12 PM', 
  '01 PM', '02 PM', '03 PM', '04 PM', '05 PM'
];

export default function App() {
  const [entries, setEntries] = useState<TimelineEntry[]>(INITIAL_ENTRIES);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTask = (id: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, completed: !entry.completed } : entry
    ));
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Navigation Bar */}
      <header className={cn(
        "fixed top-0 w-full z-50 transition-all duration-200 border-b border-transparent",
        scrolled ? "ios-blur border-ios-separator/30 h-11" : "bg-white h-11"
      )}>
        <div className="h-full flex items-center justify-between px-4">
          <div className="w-20" />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: scrolled ? 1 : 0 }}
            className="text-[17px] font-semibold"
          >
            Tuesday, Feb 24
          </motion.div>
          <div className="w-20 flex justify-end">
            <button className="text-ios-blue active:opacity-50 transition-opacity">
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-11">
        {/* Large Title Section */}
        <section className="px-4 pt-4 pb-2 bg-white">
          <p className="text-ios-gray text-[13px] font-semibold uppercase tracking-tight">
            Tuesday, February 24
          </p>
          <h1 className="text-[34px] font-bold tracking-tight text-black mt-1">
            Today
          </h1>
        </section>

        {/* Timeline Container */}
        <div className="bg-white border-t border-b border-ios-separator/30 mt-4">
          {HOURS.map((hour) => {
            const entry = entries.find(e => e.time === hour);
            const isCurrentTime = hour === '02 PM'; // Mocking current time for the red line

            return (
              <div key={hour} className="flex items-stretch min-h-[64px] relative group">
                {/* Current Time Indicator */}
                {isCurrentTime && (
                  <div className="absolute top-4 left-16 right-0 h-px bg-ios-error z-10">
                    <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-ios-error" />
                  </div>
                )}

                {/* Time Label */}
                <div className="w-16 flex flex-col items-center pt-3 text-[11px] font-medium text-ios-gray shrink-0">
                  {hour}
                </div>

                {/* Content Area */}
                <div className="flex-1 py-2 pr-4 border-t border-ios-separator/20 flex items-center">
                  {entry ? (
                    <TimelineEntryComponent entry={entry} onToggle={() => toggleTask(entry.id)} />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 ios-blur border-t border-ios-separator/30 pb-safe">
        <div className="flex justify-around items-center h-12 pt-1.5">
          <TabItem icon={<CalendarIcon size={24} />} label="Timeline" active />
          <TabItem icon={<LayoutGrid size={24} />} label="Categories" />
          <TabItem icon={<RefreshCw size={24} />} label="Sync" />
          <TabItem 
            icon={
              <div className="w-6 h-6 rounded-full overflow-hidden bg-ios-separator/30 ring-1 ring-ios-separator/20">
                <img 
                  alt="User" 
                  src="https://picsum.photos/seed/user/100/100" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            } 
            label="Account" 
          />
        </div>
        {/* Home Indicator Area */}
        <div className="h-5 flex items-center justify-center">
          <div className="w-32 h-1.5 bg-black/10 rounded-full" />
        </div>
      </nav>
    </div>
  );
}

function TimelineEntryComponent({ entry, onToggle }: { entry: TimelineEntry; onToggle: () => void }) {
  if (entry.type === 'task') {
    return (
      <div 
        className="flex items-center gap-3 w-full cursor-pointer py-1"
        onClick={onToggle}
      >
        <div className={cn(
          "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
          entry.completed 
            ? "bg-ios-blue border-ios-blue" 
            : "border-ios-separator bg-white"
        )}>
          {entry.completed && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
        <span className={cn(
          "text-[17px] transition-all duration-200",
          entry.completed ? "text-ios-gray line-through decoration-ios-gray/50" : "text-black"
        )}>
          {entry.title}
        </span>
      </div>
    );
  }

  if (entry.type === 'break') {
    return (
      <div className="flex items-center gap-2 text-ios-gray">
        {entry.icon}
        <span className="text-[14px] italic">{entry.title}</span>
      </div>
    );
  }

  // Styled blocks (Calendar, Client, Focus)
  const styles = {
    calendar: "bg-ios-blue/10 border-ios-blue text-ios-blue",
    client: "bg-emerald-50 border-emerald-500 text-emerald-600",
    focus: "bg-indigo-900 border-indigo-500 text-white",
  };

  const categoryStyles = {
    calendar: "text-ios-blue",
    client: "text-emerald-600",
    focus: "text-indigo-300",
  };

  return (
    <div className={cn(
      "w-full border-l-4 rounded-r-lg p-3 transition-transform active:scale-[0.98]",
      styles[entry.type as keyof typeof styles]
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            categoryStyles[entry.type as keyof typeof categoryStyles]
          )}>
            {entry.category}
          </p>
          <h3 className="font-semibold text-[15px] leading-tight mt-0.5">
            {entry.title}
          </h3>
        </div>
        <div className={cn(
          "opacity-80",
          categoryStyles[entry.type as keyof typeof categoryStyles]
        )}>
          {entry.icon}
        </div>
      </div>
    </div>
  );
}

function TabItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={cn(
      "flex flex-col items-center gap-0.5 transition-colors",
      active ? "text-ios-blue" : "text-ios-gray"
    )}>
      <div className={cn(active && "fill-current")}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
