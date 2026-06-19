"use client";

import React from "react";

/**
 * BcIcon — Reemplazo de lucide-react con SVGs inline.
 * Cero dependencia externa de iconos. ~8 KB vs 173 KB de lucide-react.
 * Patrón consistente con NavIcon de AppNavWrapper.tsx.
 */

export type BcIconName = keyof typeof ICON_PATHS;

interface BcIconProps {
  name: BcIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const BASE_ATTRS = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICON_PATHS: Record<string, Array<{ el: string; attrs: Record<string, string> }>> = {
  "Apple": [{"el":"path","attrs":{"d":"M12 6.528V3a1 1 0 0 1 1-1h0"}},{"el":"path","attrs":{"d":"M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21"}}],
  "AtSign": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"4"}},{"el":"path","attrs":{"d":"M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"}}],
  "Ban": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"10"}},{"el":"path","attrs":{"d":"M4.929 4.929 19.07 19.071"}}],
  "Banknote": [{"el":"rect","attrs":{"width":"20","height":"12","x":"2","y":"6","rx":"2"}},{"el":"circle","attrs":{"cx":"12","cy":"12","r":"2"}},{"el":"path","attrs":{"d":"M6 12h.01M18 12h.01"}}],
  "Bell": [{"el":"path","attrs":{"d":"M10.268 21a2 2 0 0 0 3.464 0"}},{"el":"path","attrs":{"d":"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"}}],
  "BellOff": [{"el":"path","attrs":{"d":"M10.268 21a2 2 0 0 0 3.464 0"}},{"el":"path","attrs":{"d":"M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"}},{"el":"path","attrs":{"d":"m2 2 20 20"}},{"el":"path","attrs":{"d":"M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"}}],
  "Bookmark": [{"el":"path","attrs":{"d":"M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"}}],
  "Bot": [{"el":"path","attrs":{"d":"M12 8V4H8"}},{"el":"rect","attrs":{"width":"16","height":"12","x":"4","y":"8","rx":"2"}},{"el":"path","attrs":{"d":"M2 14h2"}},{"el":"path","attrs":{"d":"M20 14h2"}},{"el":"path","attrs":{"d":"M15 13v2"}},{"el":"path","attrs":{"d":"M9 13v2"}}],
  "Brain": [{"el":"path","attrs":{"d":"M12 18V5"}},{"el":"path","attrs":{"d":"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"}},{"el":"path","attrs":{"d":"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"}},{"el":"path","attrs":{"d":"M17.997 5.125a4 4 0 0 1 2.526 5.77"}},{"el":"path","attrs":{"d":"M18 18a4 4 0 0 0 2-7.464"}},{"el":"path","attrs":{"d":"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"}},{"el":"path","attrs":{"d":"M6 18a4 4 0 0 1-2-7.464"}},{"el":"path","attrs":{"d":"M6.003 5.125a4 4 0 0 0-2.526 5.77"}}],
  "Briefcase": [{"el":"path","attrs":{"d":"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"}},{"el":"rect","attrs":{"width":"20","height":"14","x":"2","y":"6","rx":"2"}}],
  "Building2": [{"el":"path","attrs":{"d":"M10 12h4"}},{"el":"path","attrs":{"d":"M10 8h4"}},{"el":"path","attrs":{"d":"M14 21v-3a2 2 0 0 0-4 0v3"}},{"el":"path","attrs":{"d":"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}},{"el":"path","attrs":{"d":"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"}}],
  "Cake": [{"el":"path","attrs":{"d":"M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"}},{"el":"path","attrs":{"d":"M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"}},{"el":"path","attrs":{"d":"M2 21h20"}},{"el":"path","attrs":{"d":"M7 8v3"}},{"el":"path","attrs":{"d":"M12 8v3"}},{"el":"path","attrs":{"d":"M17 8v3"}},{"el":"path","attrs":{"d":"M7 4h.01"}},{"el":"path","attrs":{"d":"M12 4h.01"}},{"el":"path","attrs":{"d":"M17 4h.01"}}],
  "Calendar": [{"el":"path","attrs":{"d":"M8 2v4"}},{"el":"path","attrs":{"d":"M16 2v4"}},{"el":"rect","attrs":{"width":"18","height":"18","x":"3","y":"4","rx":"2"}},{"el":"path","attrs":{"d":"M3 10h18"}}],
  "CalendarDays": [{"el":"path","attrs":{"d":"M8 2v4"}},{"el":"path","attrs":{"d":"M16 2v4"}},{"el":"rect","attrs":{"width":"18","height":"18","x":"3","y":"4","rx":"2"}},{"el":"path","attrs":{"d":"M3 10h18"}},{"el":"path","attrs":{"d":"M8 14h.01"}},{"el":"path","attrs":{"d":"M12 14h.01"}},{"el":"path","attrs":{"d":"M16 14h.01"}},{"el":"path","attrs":{"d":"M8 18h.01"}},{"el":"path","attrs":{"d":"M12 18h.01"}},{"el":"path","attrs":{"d":"M16 18h.01"}}],
  "Camera": [{"el":"path","attrs":{"d":"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"}},{"el":"circle","attrs":{"cx":"12","cy":"13","r":"3"}}],
  "Car": [{"el":"path","attrs":{"d":"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"}},{"el":"circle","attrs":{"cx":"7","cy":"17","r":"2"}},{"el":"path","attrs":{"d":"M9 17h6"}},{"el":"circle","attrs":{"cx":"17","cy":"17","r":"2"}}],
  "ChartColumn": [{"el":"path","attrs":{"d":"M3 3v16a2 2 0 0 0 2 2h16"}},{"el":"path","attrs":{"d":"M18 17V9"}},{"el":"path","attrs":{"d":"M13 17V5"}},{"el":"path","attrs":{"d":"M8 17v-3"}}],
  "Check": [{"el":"path","attrs":{"d":"M20 6 9 17l-5-5"}}],
  "CigaretteOff": [{"el":"path","attrs":{"d":"M12 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h13"}},{"el":"path","attrs":{"d":"M18 8c0-2.5-2-2.5-2-5"}},{"el":"path","attrs":{"d":"m2 2 20 20"}},{"el":"path","attrs":{"d":"M21 12a1 1 0 0 1 1 1v2a1 1 0 0 1-.5.866"}},{"el":"path","attrs":{"d":"M22 8c0-2.5-2-2.5-2-5"}},{"el":"path","attrs":{"d":"M7 12v4"}}],
  "ClipboardList": [{"el":"rect","attrs":{"width":"8","height":"4","x":"8","y":"2","rx":"1","ry":"1"}},{"el":"path","attrs":{"d":"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"}},{"el":"path","attrs":{"d":"M12 11h4"}},{"el":"path","attrs":{"d":"M12 16h4"}},{"el":"path","attrs":{"d":"M8 11h.01"}},{"el":"path","attrs":{"d":"M8 16h.01"}}],
  "Clock": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"10"}},{"el":"path","attrs":{"d":"M12 6v6l4 2"}}],
  "Compass": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"10"}},{"el":"path","attrs":{"d":"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"}}],
  "CreditCard": [{"el":"rect","attrs":{"width":"20","height":"14","x":"2","y":"5","rx":"2"}},{"el":"line","attrs":{"x1":"2","x2":"22","y1":"10","y2":"10"}}],
  "DollarSign": [{"el":"line","attrs":{"x1":"12","x2":"12","y1":"2","y2":"22"}},{"el":"path","attrs":{"d":"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"}}],
  "Download": [{"el":"path","attrs":{"d":"M12 15V3"}},{"el":"path","attrs":{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}},{"el":"path","attrs":{"d":"m7 10 5 5 5-5"}}],
  "Egg": [{"el":"path","attrs":{"d":"M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12"}}],
  "Eye": [{"el":"path","attrs":{"d":"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"}},{"el":"circle","attrs":{"cx":"12","cy":"12","r":"3"}}],
  "FileText": [{"el":"path","attrs":{"d":"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"}},{"el":"path","attrs":{"d":"M14 2v5a1 1 0 0 0 1 1h5"}},{"el":"path","attrs":{"d":"M10 9H8"}},{"el":"path","attrs":{"d":"M16 13H8"}},{"el":"path","attrs":{"d":"M16 17H8"}}],
  "Flame": [{"el":"path","attrs":{"d":"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"}}],
  "FolderOpen": [{"el":"path","attrs":{"d":"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"}}],
  "Frown": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"10"}},{"el":"path","attrs":{"d":"M16 16s-1.5-2-4-2-4 2-4 2"}},{"el":"line","attrs":{"x1":"9","x2":"9.01","y1":"9","y2":"9"}},{"el":"line","attrs":{"x1":"15","x2":"15.01","y1":"9","y2":"9"}}],
  "Gem": [{"el":"path","attrs":{"d":"M10.5 3 8 9l4 13 4-13-2.5-6"}},{"el":"path","attrs":{"d":"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"}},{"el":"path","attrs":{"d":"M2 9h20"}}],
  "Globe": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"10"}},{"el":"path","attrs":{"d":"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"}},{"el":"path","attrs":{"d":"M2 12h20"}}],
  "GraduationCap": [{"el":"path","attrs":{"d":"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"}},{"el":"path","attrs":{"d":"M22 10v6"}},{"el":"path","attrs":{"d":"M6 12.5V16a6 3 0 0 0 12 0v-3.5"}}],
  "Image": [{"el":"rect","attrs":{"width":"18","height":"18","x":"3","y":"3","rx":"2","ry":"2"}},{"el":"circle","attrs":{"cx":"9","cy":"9","r":"2"}},{"el":"path","attrs":{"d":"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"}}],
  "Inbox": [{"el":"polyline","attrs":{"points":"22 12 16 12 14 15 10 15 8 12 2 12"}},{"el":"path","attrs":{"d":"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"}}],
  "Info": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"10"}},{"el":"path","attrs":{"d":"M12 16v-4"}},{"el":"path","attrs":{"d":"M12 8h.01"}}],
  "Lightbulb": [{"el":"path","attrs":{"d":"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"}},{"el":"path","attrs":{"d":"M9 18h6"}},{"el":"path","attrs":{"d":"M10 22h4"}}],
  "Lock": [{"el":"rect","attrs":{"width":"18","height":"11","x":"3","y":"11","rx":"2","ry":"2"}},{"el":"path","attrs":{"d":"M7 11V7a5 5 0 0 1 10 0v4"}}],
  "LogIn": [{"el":"path","attrs":{"d":"m10 17 5-5-5-5"}},{"el":"path","attrs":{"d":"M15 12H3"}},{"el":"path","attrs":{"d":"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"}}],
  "Mail": [{"el":"path","attrs":{"d":"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"}},{"el":"rect","attrs":{"x":"2","y":"4","width":"20","height":"16","rx":"2"}}],
  "MapPin": [{"el":"path","attrs":{"d":"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"}},{"el":"circle","attrs":{"cx":"12","cy":"10","r":"3"}}],
  "MessageCircle": [{"el":"path","attrs":{"d":"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"}}],
  "MessageSquare": [{"el":"path","attrs":{"d":"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"}}],
  "Mic": [{"el":"path","attrs":{"d":"M12 19v3"}},{"el":"path","attrs":{"d":"M19 10v2a7 7 0 0 1-14 0v-2"}},{"el":"rect","attrs":{"x":"9","y":"2","width":"6","height":"13","rx":"3"}}],
  "Paperclip": [{"el":"path","attrs":{"d":"m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"}}],
  "PartyPopper": [{"el":"path","attrs":{"d":"M5.8 11.3 2 22l10.7-3.79"}},{"el":"path","attrs":{"d":"M4 3h.01"}},{"el":"path","attrs":{"d":"M22 8h.01"}},{"el":"path","attrs":{"d":"M15 2h.01"}},{"el":"path","attrs":{"d":"M22 20h.01"}},{"el":"path","attrs":{"d":"m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"}},{"el":"path","attrs":{"d":"m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"}},{"el":"path","attrs":{"d":"m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"}},{"el":"path","attrs":{"d":"M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"}}],
  "PenLine": [{"el":"path","attrs":{"d":"M13 21h8"}},{"el":"path","attrs":{"d":"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"}}],
  "Pencil": [{"el":"path","attrs":{"d":"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"}},{"el":"path","attrs":{"d":"m15 5 4 4"}}],
  "Phone": [{"el":"path","attrs":{"d":"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"}}],
  "Pin": [{"el":"path","attrs":{"d":"M12 17v5"}},{"el":"path","attrs":{"d":"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"}}],
  "Plane": [{"el":"path","attrs":{"d":"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"}}],
  "RefreshCw": [{"el":"path","attrs":{"d":"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}},{"el":"path","attrs":{"d":"M21 3v5h-5"}},{"el":"path","attrs":{"d":"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}},{"el":"path","attrs":{"d":"M8 16H3v5"}}],
  "Rocket": [{"el":"path","attrs":{"d":"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"}},{"el":"path","attrs":{"d":"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"}},{"el":"path","attrs":{"d":"M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"}},{"el":"path","attrs":{"d":"M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"}}],
  "Save": [{"el":"path","attrs":{"d":"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"}},{"el":"path","attrs":{"d":"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"}},{"el":"path","attrs":{"d":"M7 3v4a1 1 0 0 0 1 1h7"}}],
  "Search": [{"el":"path","attrs":{"d":"m21 21-4.34-4.34"}},{"el":"circle","attrs":{"cx":"11","cy":"11","r":"8"}}],
  "Send": [{"el":"path","attrs":{"d":"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}},{"el":"path","attrs":{"d":"m21.854 2.147-10.94 10.939"}}],
  "ShieldCheck": [{"el":"path","attrs":{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}},{"el":"path","attrs":{"d":"m9 12 2 2 4-4"}}],
  "Smartphone": [{"el":"rect","attrs":{"width":"14","height":"20","x":"5","y":"2","rx":"2","ry":"2"}},{"el":"path","attrs":{"d":"M12 18h.01"}}],
  "Sparkles": [{"el":"path","attrs":{"d":"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"}},{"el":"path","attrs":{"d":"M20 2v4"}},{"el":"path","attrs":{"d":"M22 4h-4"}},{"el":"circle","attrs":{"cx":"4","cy":"20","r":"2"}}],
  "Sprout": [{"el":"path","attrs":{"d":"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"}},{"el":"path","attrs":{"d":"M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"}},{"el":"path","attrs":{"d":"M5 21h14"}}],
  "Star": [{"el":"path","attrs":{"d":"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"}}],
  "Target": [{"el":"circle","attrs":{"cx":"12","cy":"12","r":"10"}},{"el":"circle","attrs":{"cx":"12","cy":"12","r":"6"}},{"el":"circle","attrs":{"cx":"12","cy":"12","r":"2"}}],
  "ThumbsDown": [{"el":"path","attrs":{"d":"M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"}},{"el":"path","attrs":{"d":"M17 14V2"}}],
  "ThumbsUp": [{"el":"path","attrs":{"d":"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"}},{"el":"path","attrs":{"d":"M7 10v12"}}],
  "Trash2": [{"el":"path","attrs":{"d":"M10 11v6"}},{"el":"path","attrs":{"d":"M14 11v6"}},{"el":"path","attrs":{"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"}},{"el":"path","attrs":{"d":"M3 6h18"}},{"el":"path","attrs":{"d":"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}}],
  "Trophy": [{"el":"path","attrs":{"d":"M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"}},{"el":"path","attrs":{"d":"M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"}},{"el":"path","attrs":{"d":"M18 9h1.5a1 1 0 0 0 0-5H18"}},{"el":"path","attrs":{"d":"M4 22h16"}},{"el":"path","attrs":{"d":"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"}},{"el":"path","attrs":{"d":"M6 9H4.5a1 1 0 0 1 0-5H6"}}],
  "Upload": [{"el":"path","attrs":{"d":"M12 3v12"}},{"el":"path","attrs":{"d":"m17 8-5-5-5 5"}},{"el":"path","attrs":{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}}],
  "User": [{"el":"path","attrs":{"d":"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"}},{"el":"circle","attrs":{"cx":"12","cy":"7","r":"4"}}],
  "Users": [{"el":"path","attrs":{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}},{"el":"path","attrs":{"d":"M16 3.128a4 4 0 0 1 0 7.744"}},{"el":"path","attrs":{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}},{"el":"circle","attrs":{"cx":"9","cy":"7","r":"4"}}],
  "Volume2": [{"el":"path","attrs":{"d":"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"}},{"el":"path","attrs":{"d":"M16 9a5 5 0 0 1 0 6"}},{"el":"path","attrs":{"d":"M19.364 18.364a9 9 0 0 0 0-12.728"}}],
  "Wrench": [{"el":"path","attrs":{"d":"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"}}],
  "X": [{"el":"path","attrs":{"d":"M18 6 6 18"}},{"el":"path","attrs":{"d":"m6 6 12 12"}}],
  "Zap": [{"el":"path","attrs":{"d":"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"}}],
};

export default function BcIcon({ name, size = 24, className, strokeWidth = 2 }: BcIconProps) {
  const paths = ICON_PATHS[name];
  if (!paths) return null;

  return (
    <svg
      {...BASE_ATTRS}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
    >
      {paths.map(({ el, attrs }, i) =>
        React.createElement(el, { ...attrs, key: i })
      )}
    </svg>
  );
}

// Named exports for tree-shaking convenience
export function BcApple(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Apple" {...props} />;
}
export function BcAtSign(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="AtSign" {...props} />;
}
export function BcBan(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Ban" {...props} />;
}
export function BcBanknote(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Banknote" {...props} />;
}
export function BcBell(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Bell" {...props} />;
}
export function BcBellOff(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="BellOff" {...props} />;
}
export function BcBookmark(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Bookmark" {...props} />;
}
export function BcBot(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Bot" {...props} />;
}
export function BcBrain(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Brain" {...props} />;
}
export function BcBriefcase(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Briefcase" {...props} />;
}
export function BcBuilding2(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Building2" {...props} />;
}
export function BcCake(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Cake" {...props} />;
}
export function BcCalendar(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Calendar" {...props} />;
}
export function BcCalendarDays(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="CalendarDays" {...props} />;
}
export function BcCamera(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Camera" {...props} />;
}
export function BcCar(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Car" {...props} />;
}
export function BcChartColumn(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="ChartColumn" {...props} />;
}
export function BcCheck(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Check" {...props} />;
}
export function BcCigaretteOff(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="CigaretteOff" {...props} />;
}
export function BcClipboardList(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="ClipboardList" {...props} />;
}
export function BcClock(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Clock" {...props} />;
}
export function BcCompass(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Compass" {...props} />;
}
export function BcCreditCard(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="CreditCard" {...props} />;
}
export function BcDollarSign(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="DollarSign" {...props} />;
}
export function BcDownload(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Download" {...props} />;
}
export function BcEgg(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Egg" {...props} />;
}
export function BcEye(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Eye" {...props} />;
}
export function BcFileText(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="FileText" {...props} />;
}
export function BcFlame(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Flame" {...props} />;
}
export function BcFolderOpen(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="FolderOpen" {...props} />;
}
export function BcFrown(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Frown" {...props} />;
}
export function BcGem(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Gem" {...props} />;
}
export function BcGlobe(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Globe" {...props} />;
}
export function BcGraduationCap(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="GraduationCap" {...props} />;
}
export function BcImage(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Image" {...props} />;
}
export function BcInbox(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Inbox" {...props} />;
}
export function BcInfo(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Info" {...props} />;
}
export function BcLightbulb(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Lightbulb" {...props} />;
}
export function BcLock(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Lock" {...props} />;
}
export function BcLogIn(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="LogIn" {...props} />;
}
export function BcMail(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Mail" {...props} />;
}
export function BcMapPin(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="MapPin" {...props} />;
}
export function BcMessageCircle(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="MessageCircle" {...props} />;
}
export function BcMessageSquare(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="MessageSquare" {...props} />;
}
export function BcMic(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Mic" {...props} />;
}
export function BcPaperclip(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Paperclip" {...props} />;
}
export function BcPartyPopper(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="PartyPopper" {...props} />;
}
export function BcPenLine(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="PenLine" {...props} />;
}
export function BcPencil(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Pencil" {...props} />;
}
export function BcPhone(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Phone" {...props} />;
}
export function BcPin(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Pin" {...props} />;
}
export function BcPlane(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Plane" {...props} />;
}
export function BcRefreshCw(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="RefreshCw" {...props} />;
}
export function BcRocket(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Rocket" {...props} />;
}
export function BcSave(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Save" {...props} />;
}
export function BcSearch(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Search" {...props} />;
}
export function BcSend(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Send" {...props} />;
}
export function BcShieldCheck(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="ShieldCheck" {...props} />;
}
export function BcSmartphone(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Smartphone" {...props} />;
}
export function BcSparkles(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Sparkles" {...props} />;
}
export function BcSprout(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Sprout" {...props} />;
}
export function BcStar(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Star" {...props} />;
}
export function BcTarget(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Target" {...props} />;
}
export function BcThumbsDown(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="ThumbsDown" {...props} />;
}
export function BcThumbsUp(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="ThumbsUp" {...props} />;
}
export function BcTrash2(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Trash2" {...props} />;
}
export function BcTrophy(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Trophy" {...props} />;
}
export function BcUpload(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Upload" {...props} />;
}
export function BcUser(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="User" {...props} />;
}
export function BcUsers(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Users" {...props} />;
}
export function BcVolume2(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Volume2" {...props} />;
}
export function BcWrench(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Wrench" {...props} />;
}
export function BcX(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="X" {...props} />;
}
export function BcZap(props: Omit<BcIconProps, "name">) {
  return <BcIcon name="Zap" {...props} />;
}
