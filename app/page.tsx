"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isWithinInterval,
  isBefore,
  isToday,
  startOfToday,
  differenceInDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check, CalendarDays, Zap, Keyboard, Lock, Unlock, Download, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Localized Indian Holidays ---
const INDIAN_HOLIDAYS: Record<string, string> = {
  "01-26": "Republic Day",
  "08-15": "Independence Day",
  "10-02": "Gandhi Jayanti",
  "12-25": "Christmas Day",
  "01-01": "New Year's Day",
  "03-25": "Holi (Approx)", 
  "11-01": "Diwali (Approx)",
  "09-07": "Ganesh Chaturthi (Approx)"
};

// --- Localized Indian Seasons (Using the cleaner images) ---
type Season = "winter" | "summer" | "monsoon" | "festive";

const INDIAN_SEASONAL_CONFIG: Record<Season, { img: string, primary: string, bg: string, text: string, ring: string }> = {
  winter: {
    img: "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?q=80&w=2000&auto=format&fit=crop",
    primary: "bg-sky-600", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200"
  },
  summer: {
    img: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2000&auto=format&fit=crop",
    primary: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200"
  },
  monsoon: {
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop",
    primary: "bg-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200"
  },
  festive: {
    img: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?q=80&w=2000&auto=format&fit=crop",
    primary: "bg-orange-600", bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200"
  }
};

const getIndianSeason = (date: Date): Season => {
  const month = date.getMonth();
  if (month === 11 || month === 0 || month === 1) return "winter"; 
  if (month >= 2 && month <= 4) return "summer"; 
  if (month >= 5 && month <= 8) return "monsoon"; 
  return "festive"; 
};

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0); 
  const [selection, setSelection] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [blockPastDates, setBlockPastDates] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeTheme = INDIAN_SEASONAL_CONFIG[getIndianSeason(currentDate)];

  useEffect(() => {
    setIsMounted(true);
    const savedNotes = localStorage.getItem("calendar-notes-india");
    if (savedNotes) setNotes(savedNotes);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName.toLowerCase() === 'textarea') return;
      if (e.key === 't' || e.key === 'T') { setDirection(0); setCurrentDate(startOfToday()); }
      else if (e.key === 'ArrowRight') { setDirection(1); setCurrentDate(prev => addMonths(prev, 1)); }
      else if (e.key === 'ArrowLeft') { setDirection(-1); setCurrentDate(prev => subMonths(prev, 1)); }
      else if (e.key === 'Escape') setSelection({ start: null, end: null });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("calendar-notes-india", e.target.value);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600);
  };

  const exportData = () => {
    const rangeText = selection.start 
      ? `Selected Range: ${format(selection.start, "dd/MM/yyyy")} - ${selection.end ? format(selection.end, "dd/MM/yyyy") : "N/A"}`
      : "Selected Range: None";
    const fileContent = `=== Calendar Export ===\nGenerated: ${format(new Date(), "dd/MM/yyyy HH:mm")}\n\n${rangeText}\n\n=== Notes ===\n${notes || "No notes written."}`;
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calendar-export-${format(new Date(), "dd-MM-yyyy")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleMouseDown = (day: Date) => {
    if (blockPastDates && isBefore(day, startOfToday())) return;
    setIsDragging(true);
    setDragStart(day);
    setSelection({ start: day, end: null });
  };

  const handleMouseEnter = (day: Date) => {
    if (!isDragging || !dragStart) return;
    if (blockPastDates && isBefore(day, startOfToday())) return;
    if (isBefore(day, dragStart)) setSelection({ start: day, end: dragStart });
    else setSelection({ start: dragStart, end: day });
  };

  const changeMonth = (offset: number) => {
    setDirection(offset);
    setCurrentDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const getSelectedDaysCount = () => {
    if (!selection.start || !selection.end) return 0;
    return differenceInDays(selection.end, selection.start) + 1;
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 })
  };

  const renderDays = () => {
    const days = [];
    let startDateOfWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); 
    for (let i = 0; i < 7; i++) {
      const dayName = format(addDays(startDateOfWeek, i), "EEE").toUpperCase();
      const isWeekend = dayName === "SAT" || dayName === "SUN";
      days.push(
        <div key={i} className={`text-center text-[11px] font-bold tracking-widest mb-4 transition-colors duration-500 ${isWeekend ? activeTheme.text : 'text-gray-400'}`}>
          {dayName}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2 border-b border-gray-100 pb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); 
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, "d");
        const holidayKey = format(day, "MM-dd");
        
        const isStart = selection.start ? isSameDay(day, selection.start) : false;
        const isEnd = selection.end ? isSameDay(day, selection.end) : false;
        const isBetween = selection.start && selection.end && isWithinInterval(day, { start: selection.start, end: selection.end });
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isCurrentDay = isToday(day);
        const holidayName = INDIAN_HOLIDAYS[holidayKey];
        
        const isDisabled = blockPastDates && isBefore(day, startOfToday());

        let textColor = "text-gray-900";
        if (isDisabled) textColor = "text-gray-200 line-through decoration-gray-300";
        else if (!isCurrentMonth) textColor = "text-gray-300 font-light";
        
        if (isStart || isEnd) textColor = "text-white font-bold";
        else if (isBetween && !isDisabled) textColor = `${activeTheme.text} font-medium`;

        days.push(
          <div
            key={day.toString()}
            onMouseDown={() => handleMouseDown(cloneDay)}
            onMouseEnter={() => handleMouseEnter(cloneDay)}
            className={`relative h-16 flex flex-col justify-start pt-1 items-center group transition-opacity select-none ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}`}
          >
            {isStart && selection.end && <div className={`absolute right-0 w-1/2 h-10 top-1 z-0 transition-colors duration-500 ${activeTheme.bg}`} />}
            {isEnd && selection.start && <div className={`absolute left-0 w-1/2 h-10 top-1 z-0 transition-colors duration-500 ${activeTheme.bg}`} />}
            {isBetween && !isStart && !isEnd && <div className={`absolute w-full h-10 top-1 z-0 transition-colors duration-500 ${activeTheme.bg}`} />}

            <span
              className={`h-10 w-10 flex items-center justify-center rounded-full z-10 transition-all duration-300 text-sm
                ${isStart || isEnd ? `${activeTheme.primary} shadow-lg scale-105` : ""}
                ${!isStart && !isEnd && !isBetween && !isDisabled ? "hover:bg-gray-50 hover:scale-110" : ""}
                ${isCurrentDay && !isStart && !isEnd && !isBetween ? `bg-white ring-2 ${activeTheme.ring} ${activeTheme.text} font-bold shadow-sm` : ""}
                ${textColor}
              `}
            >
              {formattedDate}
            </span>

            {holidayName && !isDisabled && (
              <span className={`absolute bottom-1 w-[95%] text-center truncate text-[7.5px] sm:text-[8px] font-bold uppercase tracking-widest z-10 transition-colors duration-300
                ${isStart || isEnd ? "text-white/90" : `${activeTheme.text} opacity-90`}
              `}>
                {holidayName}
              </span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-y-1" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="select-none">{rows}</div>;
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#F3F4F6] p-4 md:p-10 flex items-center justify-center font-sans selection:bg-gray-200">
      
      <div className="flex flex-col w-full max-w-[850px] mx-auto bg-white border border-gray-200 shadow-2xl rounded-3xl overflow-hidden relative mt-4">
        
        <div className="absolute -top-3 left-0 w-full flex justify-evenly px-12 z-20">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1.5 h-6 bg-gradient-to-b from-gray-300 via-gray-100 to-gray-400 rounded-full border border-gray-300 shadow-sm" />
          ))}
        </div>

        <div className="relative h-64 sm:h-80 md:h-[400px] w-full bg-gray-900 overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 transition-opacity duration-1000">
             <img src={activeTheme.img} alt="Season" className="w-full h-full object-cover opacity-90 select-none pointer-events-none" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-8 left-8 sm:bottom-10 sm:left-12 text-white pointer-events-none">
            <p className="text-sm font-semibold text-white/70 tracking-[0.3em] uppercase mb-1 drop-shadow-sm transition-colors">{format(currentDate, "yyyy")}</p>
            <p className="text-5xl sm:text-7xl font-bold tracking-tight drop-shadow-md">{format(currentDate, "MMMM")}</p>
          </div>

          <div className="absolute bottom-8 right-8 sm:bottom-10 sm:right-12 flex items-center gap-2">
            <button onClick={() => { setDirection(0); setCurrentDate(startOfToday()); }} className="px-4 py-2.5 mr-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 font-semibold text-xs tracking-widest uppercase rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5">
              <CalendarDays size={14} /> Today
            </button>
            <button onClick={() => changeMonth(-1)} className="p-2.5 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
              <ChevronLeft size={20} strokeWidth={2.5}/>
            </button>
            <button onClick={() => changeMonth(1)} className="p-2.5 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
              <ChevronRight size={20} strokeWidth={2.5}/>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row p-8 sm:p-12 gap-10 bg-white">
          
          <div className="w-full md:w-[65%] flex flex-col">
            <div className="flex-grow">
              {renderDays()}
              <div className="relative overflow-hidden min-h-[350px]">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.div
                    key={currentDate.toString()}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                    className="absolute w-full"
                  >
                    {renderCells()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
            <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between shadow-inner transition-colors duration-500">
                 <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     Target Range
                     {getSelectedDaysCount() > 0 && (
                       <span className={`${activeTheme.bg} ${activeTheme.text} transition-colors duration-500 px-1.5 py-0.5 rounded text-[9px] font-bold`}>
                         {getSelectedDaysCount()} {getSelectedDaysCount() === 1 ? "Day" : "Days"}
                       </span>
                     )}
                   </span>
                   <div className="text-sm font-medium text-gray-900">
                     {selection.start ? (
                       <span className="flex items-center gap-2">
                         <span className={`${activeTheme.text} font-bold transition-colors duration-500`}>{format(selection.start, "d MMM yyyy")}</span> 
                         {selection.end && (
                           <>
                             <span className="text-gray-300">→</span> 
                             <span className={`${activeTheme.text} font-bold transition-colors duration-500`}>{format(selection.end, "d MMM yyyy")}</span>
                           </>
                         )}
                       </span>
                     ) : (
                       <span className="text-gray-400 italic text-xs font-light">Click and drag to select dates</span>
                     )}
                   </div>
                 </div>
                 
                 {selection.start && (
                   <button onClick={() => setSelection({start: null, end: null})} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear Selection">
                     <Trash2 size={16} />
                   </button>
                 )}
            </div>
          </div>

          <div className="w-full md:w-[35%] flex flex-col gap-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Constraints</span>
              <button onClick={() => { setBlockPastDates(!blockPastDates); if (!blockPastDates) setSelection({start: null, end: null}); }} className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${blockPastDates ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {blockPastDates ? <Lock size={14}/> : <Unlock size={14}/>}
                {blockPastDates ? 'Strict Booking Active' : 'Allow Past Dates'}
              </button>
            </div>

            <div className="flex-grow flex flex-col bg-gray-50 rounded-xl p-5 border border-gray-100 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Memos</h3>
                <div className="flex items-center gap-3">
                  {saveStatus === "saving" && <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest animate-pulse">Saving...</span>}
                  {saveStatus === "saved" && <span className={`text-[9px] font-semibold ${activeTheme.text} transition-colors duration-500 uppercase tracking-widest flex items-center gap-1`}><Check size={10} strokeWidth={3} /> Saved</span>}
                  
                  <button onClick={exportData} title="Export Notes & Range" className={`text-gray-400 hover:${activeTheme.text} transition-colors bg-white p-1 rounded border border-gray-200 shadow-sm hover:shadow`}>
                    <Download size={14} />
                  </button>
                </div>
              </div>
              
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Log your agenda here..."
                spellCheck="false"
                className="w-full flex-grow min-h-[150px] resize-none focus:outline-none bg-transparent text-gray-700 text-sm leading-relaxed placeholder:text-gray-400 custom-scrollbar"
              />
            </div>

            {/* Restored Useful Feature: Keyboard Shortcuts */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3">
                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Keyboard size={12}/> Shortcuts</h4>
                 <div className="flex flex-col gap-2 text-xs text-gray-500">
                    <span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-sm font-mono text-[10px] font-bold">T</kbd> Today</span></span>
                    <span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-sm font-mono text-[10px] font-bold">←</kbd> <kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-sm font-mono text-[10px] font-bold">→</kbd> Nav Month</span></span>
                    <span className="flex items-center justify-between"><span className="flex items-center gap-1.5"><kbd className="bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-sm font-mono text-[10px] font-bold">Esc</kbd> Clear Range</span></span>
                 </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}