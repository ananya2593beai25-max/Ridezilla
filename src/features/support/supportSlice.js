// Redux Toolkit slice for complaints (tickets) and the chat messages inside them.
// One ticket is one conversation between a client and the admin.

import { createEntityAdapter, createSlice, createSelector } from "@reduxjs/toolkit";
import { readJSON, makeId } from "../../lib/storage";
import { STORAGE } from "../../lib/config";

const ticketsAdapter = createEntityAdapter({ sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt) });
const messagesAdapter = createEntityAdapter({ sortComparer: (a, b) => a.createdAt.localeCompare(b.createdAt) });

const supportSlice = createSlice({
  name: "support",
  initialState: {
    tickets: readJSON(STORAGE.tickets, ticketsAdapter.getInitialState()),
    messages: readJSON(STORAGE.messages, messagesAdapter.getInitialState()),
  },
  reducers: {
    ticketOpened: {
      // prepare builds the ticket and its first message, so the id and times are made once, outside the reducer.
      prepare({ user, subject, category, bookingId, text }) {
        const now = new Date().toISOString();
        const ticket = {
          id: makeId("tkt"),
          clientId: user.id,
          clientName: user.name,
          bookingId: bookingId || null,
          subject: subject.trim(),
          category,
          status: "open", // open | in_progress | resolved
          createdAt: now,
          updatedAt: now,
        };
        const message = {
          id: makeId("msg"),
          ticketId: ticket.id,
          senderRole: "client",
          senderName: user.name,
          text: text.trim(),
          createdAt: now,
          readByClient: true,
          readByAdmin: false,
        };
        return { payload: { ticket, message } };
      },
      reducer(state, action) {
        ticketsAdapter.addOne(state.tickets, action.payload.ticket);
        messagesAdapter.addOne(state.messages, action.payload.message);
      },
    },

    messageSent: {
      prepare({ ticketId, role, name, text }) {
        return {
          payload: {
            id: makeId("msg"),
            ticketId,
            senderRole: role, // client | admin | system
            senderName: name,
            text: text.trim(),
            createdAt: new Date().toISOString(),
            readByClient: role === "client" || role === "system" ? true : false,
            readByAdmin: role === "admin" || role === "system" ? true : false,
          },
        };
      },
      reducer(state, action) {
        const message = action.payload;
        messagesAdapter.addOne(state.messages, message);
        const ticket = state.tickets.entities[message.ticketId];
        if (!ticket) return;
        ticket.updatedAt = message.createdAt;
        // An admin reply starts the work. A client reply on a resolved ticket reopens it.
        if (message.senderRole === "admin" && ticket.status === "open") ticket.status = "in_progress";
        if (message.senderRole === "client" && ticket.status === "resolved") ticket.status = "open";
      },
    },

    ticketStatusSet(state, action) {
      const { id, status } = action.payload;
      const ticket = state.tickets.entities[id];
      if (ticket) {
        ticket.status = status;
        ticket.updatedAt = new Date().toISOString();
      }
    },

    // The person who opens a thread has read everything the other side wrote.
    threadRead(state, action) {
      const { ticketId, role } = action.payload;
      const flag = role === "admin" ? "readByAdmin" : "readByClient";
      Object.values(state.messages.entities).forEach((m) => {
        if (m.ticketId === ticketId && !m[flag]) m[flag] = true;
      });
    },

    hydrateTickets: (state, action) => {
      state.tickets = action.payload;
    },
    hydrateMessages: (state, action) => {
      state.messages = action.payload;
    },
  },
});

export const { ticketOpened, messageSent, ticketStatusSet, threadRead, hydrateTickets, hydrateMessages } = supportSlice.actions;
export default supportSlice.reducer;

/* ---------- Selectors ---------- */

const ticketSelectors = ticketsAdapter.getSelectors((state) => state.support.tickets);
const messageSelectors = messagesAdapter.getSelectors((state) => state.support.messages);

export const selectAllTickets = ticketSelectors.selectAll;
export const selectTicketById = ticketSelectors.selectById;
export const selectAllMessages = messageSelectors.selectAll;

export const selectTicketsForClient = createSelector([selectAllTickets, (_, clientId) => clientId], (tickets, clientId) =>
  tickets.filter((t) => t.clientId === clientId)
);

export const selectMessagesForTicket = createSelector([selectAllMessages, (_, ticketId) => ticketId], (messages, ticketId) =>
  messages.filter((m) => m.ticketId === ticketId)
);

/** Number of unread messages per ticket id, for one side of the chat ("client" or "admin"). */
export const selectUnreadByTicket = createSelector([selectAllMessages, (_, role) => role], (messages, role) => {
  const flag = role === "admin" ? "readByAdmin" : "readByClient";
  const counts = {};
  messages.forEach((m) => {
    if (!m[flag]) counts[m.ticketId] = (counts[m.ticketId] || 0) + 1;
  });
  return counts;
});
