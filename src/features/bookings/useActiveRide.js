// The signed-in client's current ride: the newest booking that is not yet completed, cancelled or rejected.
// A client can hold only one at a time, so the app shows it instead of the booking form.

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { makeSelectUserBookings } from "./bookingsSlice";
import { isActive } from "../../lib/bookingStatus";

export function useActiveRide() {
  const { user, isAuthenticated } = useAuth();
  const selectMine = useMemo(makeSelectUserBookings, []);
  const mine = useSelector((s) => selectMine(s, user?.id));

  return useMemo(() => (isAuthenticated ? mine.find(isActive) || null : null), [mine, isAuthenticated]);
}
