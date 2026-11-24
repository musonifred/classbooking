export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI";

export interface ClassRep {
  id: number;
  full_name: string;
  class_name: string;
  email: string;
  phone: string;
}

export interface Room {
  id: number;
  name: string;
  room_code: string;
  building: string;
  floor: string;
  capacity: number;
  is_lab: boolean;
  desktop_count: number;
  mouse_count: number;
  assigned_rep: number | null;
  assigned_rep_detail: ClassRep | null;
  is_occupied: boolean;
  occupied_by_class: string | null;
  occupied_until: string | null;
}

export interface BookingSlot {
  id: number;
  room: number;
  room_code: string;
  room_name: string;
  day_of_week: DayCode;
  start_time: string;
  end_time: string;
  occupying_class: string;
  occupying_rep: number | null;
  rep_name: string | null;
  course_title: string;
  is_released: boolean;
  is_expired: boolean;
}