declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type Icon = FC<IconProps>;
  export const Mail: Icon;
  export const Lock: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const Chrome: Icon;
  export const LogOut: Icon;
  export const Calculator: Icon;
  export const Star: Icon;
  export const Folder: Icon;
  export const Hash: Icon;
  export const Calendar: Icon;
  export const Bookmark: Icon;
  export const ChevronRight: Icon;
  export const ChevronDown: Icon;
  export const Filter: Icon;
  export const Loader: Icon;
  export const X: Icon;
  export const Download: Icon;
  export const FileText: Icon;
  export const Upload: Icon;
  export const Send: Icon;
  export const MessageSquare: Icon;
  export const Trash2: Icon;
  export const Search: Icon;
  export const Plus: Icon;
  export const BookOpen: Icon;
  export const LayoutGrid: Icon;
  export const List: Icon;
  export const FolderPlus: Icon;
  export const ChevronLeft: Icon;
  export const User: Icon;
  export const LayoutTemplate: Icon;
}