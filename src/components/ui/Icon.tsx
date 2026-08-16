"use client";
import {
  Bolt, MapPin, Calendar, Receipt, Wallet, Ticket, Star, ChartBar,
  Smartphone, Camera, Plug, Search, Clipboard, Building2, Wrench,
  Users, Database, HeartHandshake, MessageSquare, Landmark, TrendingUp,
  Link2, KeyRound, Menu, LogOut, Sun, Moon, Bell, ChevronDown, X, Plus,
  Check, Minus, Clock, Shield, Gauge, Car, Radio, Settings, ChevronRight,
  Eye, EyeOff,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const map: Record<string, React.ComponentType<LucideProps>> = {
  bolt: Bolt, mappin: MapPin, calendar: Calendar, receipt: Receipt, wallet: Wallet,
  ticket: Ticket, star: Star, chart: ChartBar, smartphone: Smartphone, camera: Camera,
  plug: Plug, search: Search, clipboard: Clipboard, building: Building2, wrench: Wrench,
  users: Users, database: Database, handshake: HeartHandshake, message: MessageSquare,
  bank: Landmark, trending: TrendingUp, link: Link2, key: KeyRound, menu: Menu,
  logout: LogOut, sun: Sun, moon: Moon, bell: Bell, chevronDown: ChevronDown,
  x: X, plus: Plus, check: Check, minus: Minus, clock: Clock, shield: Shield,
  gauge: Gauge, car: Car, radio: Radio, settings: Settings, chevronRight: ChevronRight,
  eye: Eye, eyeOff: EyeOff,
};

export function Icon({
  name,
  size = "1.25em",
  strokeWidth = 1.8,
  className,
  ...rest
}: { name: string; size?: string | number; strokeWidth?: number } & LucideProps) {
  const Cmp = map[name.toLowerCase().replace(/[^a-z]/g, "")] || Bolt;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} {...rest} aria-hidden />;
}

/** Brand bolt mark, re-used across shells + landing. */
export function BoltMark({ className = "", ...rest }: LucideProps) {
  return <Bolt className={className} strokeWidth={2.2} fill="currentColor" {...rest} aria-hidden />;
}