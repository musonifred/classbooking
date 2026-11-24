import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { BookingSlot, ClassRep, DayCode, Room } from "./types";

const API_BASE = "http://127.0.0.1:8000/api";

const DAYS: { code: DayCode; label: string }[] = [
  { code: "MON", label: "Monday" },
  { code: "TUE", label: "Tuesday" },
  { code: "WED", label: "Wednesday" },
  { code: "THU", label: "Thursday" },
  { code: "FRI", label: "Friday" },
];

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reps, setReps] = useState<ClassRep[]>([]);
  const [timetable, setTimetable] = useState<BookingSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayCode>("MON");
  const [message, setMessage] = useState<string>("");

  // Add Class Representative state
  const [repName, setRepName] = useState("");
  const [repClass, setRepClass] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPhone, setRepPhone] = useState("");

  // Add Room / Lab state
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [capacity, setCapacity] = useState<number>(40);
  const [isLab, setIsLab] = useState<boolean>(false);
  const [desktopCount, setDesktopCount] = useState<number>(0);
  const [mouseCount, setMouseCount] = useState<number>(0);
  const [assignedRepId, setAssignedRepId] = useState<string>("");

  // Book Room / Timetable Slot state
  const [bookingRoomId, setBookingRoomId] = useState<string>("");
  const [bookingDay, setBookingDay] = useState<DayCode>("MON");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [occupyingClass, setOccupyingClass] = useState("");
  const [bookingRepId, setBookingRepId] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState("");

  const fetchAllData = useCallback(async () => {
    try {
      const [roomsRes, repsRes, slotsRes] = await Promise.all([
        axios.get<Room[]>(`${API_BASE}/rooms/`),
        axios.get<ClassRep[]>(`${API_BASE}/reps/`),
        axios.get<BookingSlot[]>(`${API_BASE}/bookings/?day=${selectedDay}`),
      ]);
      setRooms(roomsRes.data);
      setReps(repsRes.data);
      setTimetable(slotsRes.data);
      if (roomsRes.data.length > 0 && !bookingRoomId) {
        setBookingRoomId(String(roomsRes.data[0].id));
      }
    } catch {
      setMessage("Could not load data from backend. Ensure Django server is running on port 8000.");
    }
  }, [selectedDay, bookingRoomId]);

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(fetchAllData, 30000);
    return () => clearInterval(timer);
  }, [fetchAllData]);

  const handleCreateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/reps/`, {
        full_name: repName,
        class_name: repClass,
        email: repEmail,
        phone: repPhone,
      });
      setRepName("");
      setRepClass("");
      setRepEmail("");
      setRepPhone("");
      setMessage("Class representative added.");
      fetchAllData();
    } catch {
      setMessage("Failed to add class representative. Check email uniqueness.");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/rooms/`, {
        room_code: roomCode,
        name: roomName,
        building,
        floor,
        capacity: Number(capacity),
        is_lab: isLab,
        desktop_count: isLab ? Number(desktopCount) : 0,
        mouse_count: isLab ? Number(mouseCount) : 0,
        assigned_rep: assignedRepId ? Number(assignedRepId) : null,
      });
      setRoomCode("");
      setRoomName("");
      setBuilding("");
      setFloor("");
      setCapacity(40);
      setIsLab(false);
      setDesktopCount(0);
      setMouseCount(0);
      setAssignedRepId("");
      setMessage("Class / Lab room added.");
      fetchAllData();
    } catch {
      setMessage("Failed to add room. Ensure room code is unique.");
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/bookings/`, {
        room: Number(bookingRoomId),
        day_of_week: bookingDay,
        start_time: startTime,
        end_time: endTime,
        occupying_class: occupyingClass,
        occupying_rep: bookingRepId ? Number(bookingRepId) : null,
        course_title: courseTitle,
      });
      setOccupyingClass("");
      setCourseTitle("");
      setSelectedDay(bookingDay);
      setMessage("Room booked and added to timetable.");
      fetchAllData();
    } catch {
      setMessage("Could not create booking. Check start/end times.");
    }
  };

  const handleReleaseSlot = async (slotId: number) => {
    try {
      await axios.post(`${API_BASE}/bookings/${slotId}/release/`);
      setMessage("Booking released. Room returns to green when no active slot remains.");
      fetchAllData();
    } catch {
      setMessage("Failed to release booking.");
    }
  };

  return (
    <div className="app-container">
      <header className="topbar">
        <div>
          <h1>UniRoom — Class & Lab Booking Portal</h1>
          <p>Green = Available now | Occupied rooms hide green and show which class holds them</p>
        </div>
        <div className="day-tabs">
          {DAYS.map((d) => (
            <button
              key={d.code}
              className={`day-btn ${selectedDay === d.code ? "active" : ""}`}
              onClick={() => setSelectedDay(d.code)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </header>

      {message && <div className="alert">{message}</div>}

      {/* Live Classrooms & Labs */}
      <section>
        <h2>Classrooms & Labs Status</h2>
        <div className="rooms-grid">
          {rooms.map((room) => {
            const occupied = room.is_occupied;
            return (
              <div
                key={room.id}
                className={`room-card ${occupied ? "occupied" : "available"}`}
              >
                <div>
                  <div className="room-header">
                    <div>
                      <span className="room-code">{room.room_code}</span>
                      <h3 className="room-title">{room.name}</h3>
                    </div>
                    <span className={`status-badge ${occupied ? "red" : "green"}`}>
                      {occupied ? "OCCUPIED" : "AVAILABLE"}
                    </span>
                  </div>

                  <ul className="meta-list" style={{ marginTop: 10 }}>
                    <li>
                      <strong>Location:</strong> {room.building}, Floor {room.floor}
                    </li>
                    <li>
                      <strong>Capacity:</strong> {room.capacity} students
                    </li>
                    <li>
                      <strong>Class Rep Admin:</strong>{" "}
                      {room.assigned_rep_detail
                        ? `${room.assigned_rep_detail.full_name} (${room.assigned_rep_detail.class_name})`
                        : "Unassigned"}
                    </li>
                  </ul>

                  {room.is_lab && (
                    <div className="lab-box" style={{ marginTop: 10 }}>
                      Computer Lab — Desktops: {room.desktop_count} | Mice: {room.mouse_count}
                    </div>
                  )}

                  {occupied && (
                    <div className="occupied-banner" style={{ marginTop: 10 }}>
                      Occupied by: <strong>{room.occupied_by_class}</strong>
                      {room.occupied_until ? ` until ${room.occupied_until}` : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Management Forms: Add Class Rep & Add Class/Lab */}
      <div className="grid-2">
        <form className="panel" onSubmit={handleCreateRep}>
          <h2>Add Class Representative (Admin)</h2>
          <div className="form-grid">
            <div className="field">
              <label>Full Name</label>
              <input value={repName} onChange={(e) => setRepName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Class / Cohort</label>
              <input
                placeholder="e.g. SE Year 2"
                value={repClass}
                onChange={(e) => setRepClass(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Save Class Representative
          </button>
        </form>

        <form className="panel" onSubmit={handleCreateRoom}>
          <h2>Add Classroom or Lab</h2>
          <div className="form-grid">
            <div className="field">
              <label>Room Code</label>
              <input
                placeholder="e.g. LAB-101"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Room Name</label>
              <input
                placeholder="e.g. Computing Lab 1"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Building</label>
              <input
                placeholder="e.g. Science Block"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Floor</label>
              <input
                placeholder="e.g. 2nd Floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Capacity</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>Class Rep Admin</label>
              <select
                value={assignedRepId}
                onChange={(e) => setAssignedRepId(e.target.value)}
              >
                <option value="">-- Select Rep --</option>
                {reps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} ({r.class_name})
                  </option>
                ))}
              </select>
            </div>
            <div className="checkbox-row">
              <input
                id="isLabCheck"
                type="checkbox"
                checked={isLab}
                onChange={(e) => setIsLab(e.target.checked)}
              />
              <label htmlFor="isLabCheck">Is a Computer Lab?</label>
            </div>
            {isLab && (
              <>
                <div className="field">
                  <label>Desktops Count</label>
                  <input
                    type="number"
                    min={0}
                    value={desktopCount}
                    onChange={(e) => setDesktopCount(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Mice Count</label>
                  <input
                    type="number"
                    min={0}
                    value={mouseCount}
                    onChange={(e) => setMouseCount(Number(e.target.value))}
                  />
                </div>
              </>
            )}
          </div>
          <button type="submit" className="btn-primary">
            Add Class / Lab
          </button>
        </form>
      </div>

      {/* Book Room / Add Timetable Slot */}
      <form className="panel" style={{ marginBottom: 28 }} onSubmit={handleCreateBooking}>
        <h2>Book Room & Assign Time Slot (Mon–Fri)</h2>
        <div className="form-grid">
          <div className="field">
            <label>Room</label>
            <select
              value={bookingRoomId}
              onChange={(e) => setBookingRoomId(e.target.value)}
              required
            >
              {rooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.room_code} - {rm.name} ({rm.is_lab ? "Lab" : "Class"})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Day</label>
            <select
              value={bookingDay}
              onChange={(e) => setBookingDay(e.target.value as DayCode)}
            >
              {DAYS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Occupying Class</label>
            <input
              placeholder="e.g. CS Year 3 A"
              value={occupyingClass}
              onChange={(e) => setOccupyingClass(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Booked By (Class Rep)</label>
            <select
              value={bookingRepId}
              onChange={(e) => setBookingRepId(e.target.value)}
            >
              <option value="">-- Select Rep --</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Course / Session</label>
            <input
              placeholder="e.g. Operating Systems"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary">
          Book Room
        </button>
      </form>

      {/* Fetched Timetable for Selected Day */}
      <section className="panel">
        <h2>
          Timetable — {DAYS.find((d) => d.code === selectedDay)?.label}
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Time</th>
                <th>Occupying Class</th>
                <th>Class Rep</th>
                <th>Course</th>
                <th>Slot Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {timetable.length === 0 ? (
                <tr>
                  <td colSpan={7}>No timetable slots scheduled for this day.</td>
                </tr>
              ) : (
                timetable.map((slot) => (
                  <tr key={slot.id}>
                    <td>
                      <strong>{slot.room_code}</strong> ({slot.room_name})
                    </td>
                    <td>
                      {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                    </td>
                    <td>{slot.occupying_class}</td>
                    <td>{slot.rep_name || "—"}</td>
                    <td>{slot.course_title || "—"}</td>
                    <td>
                      {slot.is_released || slot.is_expired ? (
                        <span className="pill-expired">Time Over / Released</span>
                      ) : (
                        <span className="pill-active">Scheduled</span>
                      )}
                    </td>
                    <td>
                      {!slot.is_released && !slot.is_expired && (
                        <button
                          className="btn-release"
                          onClick={() => handleReleaseSlot(slot.id)}
                        >
                          Release Early
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}