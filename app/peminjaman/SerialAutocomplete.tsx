"use client";
import React, { useRef, useState } from "react";
import type { Item } from "@/lib/types";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Props: items (array of Item), onAddSerial (serial object)
interface SerialAutocompleteProps {
  items: Item[];
  onAddSerial: (serial: any) => void;
  disabledSerials: string[];
}

export default function SerialAutocomplete({ items, onAddSerial, disabledSerials }: SerialAutocompleteProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flat list of available serials
  const availableSerials = items
    .flatMap((item) => (item.items || []).map((serial) => ({
      ...serial,
      itemName: item.name,
      itemId: item.id,
      category: item.category,
      description: item.description,
    })))
    .filter((serial) => serial.status === 1 && !disabledSerials.includes(serial.rfidCode));

  // Filter by search (serial number or item name)
  const filtered = search.trim() === ""
    ? availableSerials
    : availableSerials.filter((s) => {
        const q = search.trim().toLowerCase();
        return (
          s.rfidCode.toLowerCase().includes(q) ||
          (s.itemName || "").toLowerCase().includes(q)
        );
      });

  // Keyboard navigation and selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setActiveIdx((idx) => Math.min(idx + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIdx((idx) => Math.max(idx - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (!open) {
        setOpen(true);
        return;
      }
      if (filtered.length === 0) {
        toast.error("Serial tidak ditemukan atau tidak tersedia.");
        return;
      }
      // Only add if exact match or user selects from list
      const exact = filtered.find(
        (s, idx) =>
          s.rfidCode.toLowerCase() === search.trim().toLowerCase() || idx === activeIdx
      );
      if (exact) {
        onAddSerial(exact);
        setSearch("");
        setActiveIdx(0);
        setTimeout(() => {
          if (inputRef.current) (inputRef.current as HTMLInputElement).focus();
        }, 10);
      } else {
        toast.error("Serial tidak ditemukan atau tidak tersedia.");
      }
      e.preventDefault();
    }
  };

  // Open popover on focus
  const handleFocus = () => setOpen(true);
  const handleBlur = () => setTimeout(() => setOpen(false), 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <Command shouldFilter={false} className="w-full">
            <CommandInput
              ref={inputRef}
              value={search}
              onValueChange={(val) => {
                setSearch(val);
                setActiveIdx(0);
                setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Scan atau cari serial number / nama barang..."
              className="h-9 text-sm bg-white dark:bg-gray-700 border dark:border-gray-600"
              autoFocus
            />
          </Command>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 max-h-60 overflow-auto z-50 min-w-[320px]">
        <Command shouldFilter={false} className="w-full">
          <CommandList className="max-h-52 overflow-auto">
            {filtered.length === 0 ? (
              <CommandEmpty>Serial tidak ditemukan.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((serial, idx) => (
                  <CommandItem
                    key={serial.rfidCode}
                    value={serial.rfidCode}
                    onSelect={() => {
                      onAddSerial(serial);
                      setSearch("");
                      setActiveIdx(0);
                      setTimeout(() => {
                        if (inputRef.current) (inputRef.current as HTMLInputElement).focus();
                      }, 10);
                    }}
                    ref={el => {
                      if (idx === activeIdx && el) el.scrollIntoView({ block: "nearest" });
                    }}
                    className={idx === activeIdx ? "bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-200" : ""}
                  >
                    <span className="font-medium">{serial.itemName}</span>
                    <span className="ml-2 text-xs text-gray-500">SN: {serial.rfidCode} | {serial.category}{serial.description ? ` | ${serial.description}` : ""}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}