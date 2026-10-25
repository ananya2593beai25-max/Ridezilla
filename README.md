# Ridezilla

Ridezilla is an electric ride booking web app for Punjab, Chandigarh and Panchkula. A rider picks a pickup and a drop-off on a map, chooses an e-bike, e-rickshaw or electric car that seats the group, and sees the fare per kilometre and the CO₂ the trip saves compared with a petrol vehicle. An admin panel assigns vehicles and drivers, and a driver panel runs the ride.

Course: Front End Engineering-II (25CSE0203), BE-CSE (AIML), Batch 2025, 3rd semester, Chitkara University.
Built with Vite, React, React Router, Context API, Redux Toolkit and React Hook Form.

## Why we made it

Most ride apps show a fare and a pickup time. They do not show what the ride does to the air. We wanted one where the CO₂ saved is on every screen, so choosing an electric vehicle feels like a visible gain and not just a cheaper or slower option.

We also wanted a project big enough to need every topic of the course. A ride booking product has several kinds of users with different screens (client, admin, driver), data that many pages share (bookings, fleet, drivers), many forms, and rules that must hold across screens (one vehicle cannot be on two rides). That gave real reasons to use nested routes, Context, Redux Toolkit and form handling instead of adding them for show.

The area is limited to Punjab, Chandigarh and Panchkula on purpose. It is where we live and can check the places ourselves, and the tricity of Chandigarh, Mohali and Panchkula is dense enough for short e-bike and e-rickshaw trips.

## What it covers

The app has three parts in one codebase, each on its own routes and with its own login.

| Part | Route | Who uses it |
|---|---|---|
| Client site | `/` | Riders: search, book, track, see CO₂ saved, raise complaints |
| Admin panel | `/admin` | The operator: drivers, fleet, rates, requests, assignment, complaints |
| Driver panel | `/driver` | Drivers: the assigned vehicle and ride, start and end with a code |

Not covered: online payment (the fare is paid in the vehicle, by cash or UPI), live driver tracking on the map, a real server and database (see "Where data is stored"), and areas outside the served region.

## Features

### Rider

- Type a pickup and drop-off (place search through OpenStreetMap), click the map, or use the current location. Places outside Punjab, Chandigarh and Panchkula are refused.
- Pick the number of passengers (up to 6), the date and the time. Only vehicles with enough seats are shown.
- Road distance and time come from a routing service. If it is down, the app falls back to a straight line times 1.3 and says the ride is estimated.
- Each vehicle card shows the per-km rate, the fare, the pickup time and the CO₂ saved against a petrol car. The list can be filtered by type and sorted by CO₂ saved, price or pickup time.
- Registration and login. Booking and the dashboard need a login and send you back where you were after it.
- After booking, the home page shows the active ride in place of the search form. Once an admin assigns a vehicle, the rider sees the model, number plate, colour, driver name and phone.
- Start and end codes: when the driver reaches the pickup the rider generates a 4 digit code and tells it to the driver, and does the same at the end. The time between the two codes is logged as the journey time.
- Driver tracking on the map: a car marker drives to the pickup, then along the route to the drop-off, with a line saying how far away it is. This is a simulation (see "Driver tracking" below).
- A rider can cancel until the ride starts.
- Account page with a Change Password form. On the login page, Forgot password sends a request to the admin (see "Forgot password" below).
- Dashboard with total CO₂ saved, rides taken, a monthly chart, an eco level, vehicle mix and a petrol versus electric comparison.
- Support: raise a complaint (optionally linked to a ride) and chat with the admin. A resolved chat closes and either side can reopen it.

### Admin

- Overview with pending requests, rides in progress, free drivers, free vehicles and open complaints.
- Requests table with status filter and search. A click on any part of a row opens the request.
- Assign a free vehicle of the right type and a free driver. Reject a request with a reason the rider can read. Mark a ride completed if the driver forgot.
- Drivers: register a driver (name, mobile, 15 character licence, email), search, filter, disable, enable, remove. The admin never sees a driver password (see "Driver passwords").
- Fleet: add vehicles with category, model, plate, colour, state and city. Search and filter by category, state, city and status. Send a vehicle to maintenance and bring it back. A starter fleet of 29 vehicles in 8 cities is added on first run so the page has data.
- Pricing: set the per-km rate, minimum fare, average speed and longest ride of each vehicle type, with a plain explanation of what the minimum fare does. New searches use the new rate, rides already booked keep their fare.
- Customers: the riders with an account, with search and a Reset requested filter. Make a temporary password for a rider who asked, and copy the login details to send them.
- Support inbox with filters and unread counts.

### Driver

- First login forces a new password. Profile has a Change Password form, and the login page has Forgot password.
- My Ride: the vehicle, the route on a map, the client's name and phone, and the fare to collect.
- Verify the start code at the pickup and the end code at the drop-off.
- Cancel an assigned ride, but a reason is required and the rider sees it.
- History of past rides with the time each journey took, and a profile with an available or off duty switch.

### Interface

Dark and light theme, responsive from 320px phones to very wide screens. Lists are tables on a laptop and cards on a phone. Forms open as popups that fill the screen on a phone. The right hand column stays in view while the left scrolls on the home, FAQ and booking pages.

## Tech stack

| Tool | Used for |
|---|---|
| Vite 8, React 19 | Build tool and UI |
| React Router 7 | Nested layout routes, lazy loaded pages, route guards |
| Context API | Login sessions and toast messages |
| Redux Toolkit, React Redux | Rides, vehicles, bookings, fleet, drivers, support |
| React Hook Form | All forms and their validation |
| Leaflet, React Leaflet | Map (OpenStreetMap tiles) |
| Nominatim | Place search and reverse lookup |
| OSRM | Road distance, time and route line |
| Web Crypto (PBKDF2) | Password hashing in the browser |

No API keys are needed.

## How it maps to the Evaluation II rubric

| Rubric item | Where to look |
|---|---|
| React navigation, layout and page structure | `src/App.jsx` has three route trees (client, admin, driver) with nested layout routes and lazy pages. Layouts: `components/AppLayout.jsx`, `features/admin/AdminLayout.jsx`, `features/driver/DriverLayout.jsx`. Guards: `ProtectedRoute.jsx`, `RoleRoute.jsx` |
| Context API and state architecture | `context/AuthContext.jsx` (one session per role) and `context/ToastContext.jsx`. The table below explains what goes in Context and what goes in Redux |
| Redux Toolkit | `app/store.js` and the slices in `features/ride`, `vehicles`, `bookings`, `fleet`, `drivers`, `support`. `createEntityAdapter` in fleet, drivers and support, `createAsyncThunk` in `features/bookings/rideLifecycle.js` and the register thunks, `createSelector` for filtered lists and unread counts |
| Form handling in React | React Hook Form in the search form, register, login, staff login, booking, new complaint, chat, driver and vehicle registration, rate editing, the code forms and the reason forms |

### Context or Redux

| State | Where | Why |
|---|---|---|
| Logged in user per role | Context (`AuthContext`) | Needed everywhere, changes rarely, no async flow to track |
| Toast message | Context (`ToastContext`) | Small, global, fire and forget |
| Ride being planned | Redux `ride` | Shared by Home, Rides and Booking, with an async route lookup |
| Vehicle catalogue and rate overrides | Redux `vehicles` | Loaded once, read by several pages |
| Bookings | Redux `bookings` | Read and changed by client, admin and driver screens |
| Fleet, drivers, complaints, messages | Redux `fleet`, `drivers`, `support` | Shared across all three panels with rules that must hold across them |
| Form fields | React Hook Form | Local to one form |
| Filters, sort, page number, open popups | `useState` in the page | Only that page needs them |

## Where data is stored

There is no server and no database. Everything is kept in the browser of whoever uses the app, and the app is meant to be shown from one browser.

### localStorage (stays after the browser closes)

| Key | What it holds | Written by |
|---|---|---|
| `ridezilla.users` | Accounts of all three roles. Password hashes, never plain passwords | `features/auth/authService.js` |
| `ridezilla.session`, `ridezilla.session.admin`, `ridezilla.session.driver` | Who is logged in, one key per role | `authService.js` |
| `ridezilla.bookings` | All bookings, with assignment, start and end codes, journey time | `bookings` slice |
| `ridezilla.fleet` | Vehicles | `fleet` slice |
| `ridezilla.drivers` | Driver profiles and status | `drivers` slice |
| `ridezilla.tickets`, `ridezilla.messages` | Complaints and chat messages | `support` slice |
| `ridezilla.rates` | Fare changes made by the admin | `vehicles` slice |
| `ridezilla.resetRequests` | Forgot password requests from riders and drivers, waiting for the admin | `passwordRequests` slice |
| `ridezilla.theme` | `light` or `dark`, the look chosen with the toggle | `lib/theme.js` |
| `ridezilla.fleetSeeded.v1`, `ridezilla.mockCleared.v1` | Flags so the starter fleet and the old sample data cleanup run only once | `api/bootstrap.js` |

### sessionStorage (gone when the tab closes)

| Key | What it holds |
|---|---|
| `ridezilla.ride` | The ride being planned (places, passengers, date, time), so a refresh does not lose it |
| `ridezilla.geo.*`, `ridezilla.rev.*` | Cached place search and reverse lookup results, to avoid repeat network calls |
| last position | The rider's last known location, so the map opens there |

### Files in the project

`public/data/vehicles.json` holds the vehicle catalogue (seats, rate per km, minimum fare, CO₂ per km). It is read with `fetch` and is the starting point for prices. The admin's changes are stored as overrides in `ridezilla.rates` and the file is not edited.

### Outside services

The app sends place searches to Nominatim, route requests to OSRM and map tile requests to OpenStreetMap. Pickup and drop-off coordinates go to them. Nothing else leaves the browser.

### How it is saved

Each Redux slice is written to localStorage whenever it changes (`app/store.js`). On start, the slices read their saved value back. When another tab changes a key, the browser's `storage` event fires and the store reloads that slice, so an admin tab and a client tab stay in step. Values that came from another tab are not written back, which stops two tabs from overwriting each other.

### What this means

- Data belongs to one browser. Another browser or device starts empty.
- Clearing site data deletes everything, including accounts.
- Anyone with the browser's developer tools can read and change the data. Role guards hide screens but do not protect data. A real product needs a server that checks the role on every request.
- The start and end codes are stored in plain text in `ridezilla.bookings`, for the same reason.
- The functions in `authService.js` and the thunks are shaped so a real API could replace them later.

## Booking lifecycle

```
requested --assign--> assigned --start code--> in_progress --end code--> completed
requested or assigned --cancel (rider)--> cancelled
assigned or in_progress --cancel (driver, reason required)--> cancelled
requested or assigned --reject (admin, reason required)--> rejected
```

| Step | Who | What happens |
|---|---|---|
| requested | Rider | Booking saved with no vehicle or driver |
| assigned | Admin | A free vehicle of the requested type and a free driver are picked, and both become busy. The rider now sees the vehicle and driver |
| in_progress | Driver | The rider generates a start code, the driver enters it, the start time is recorded |
| completed | Driver (admin can force it) | The rider generates an end code, the driver enters it, vehicle and driver are freed, and the journey time (end minus start) is saved |
| cancelled, rejected | Rider, driver or admin as shown above | Vehicle and driver are freed. The reason is shown to the rider |

All of these rules sit in one file, `features/bookings/rideLifecycle.js`, as Redux Toolkit thunks. The screens call the thunks and cannot skip a step.

### Driver passwords

Drivers cannot sign up. The admin registers them, and the admin never holds a password.

1. The admin enters name, mobile, licence and email. There is no password field.
2. A random temporary password is made and shown once, with a Copy Details button that copies the login page, email and password as a message to send. Only a hash is stored.
3. On the first login the driver must choose their own password (8 or more characters, a letter and a number) before any driver page opens. That password is also stored only as a hash.
4. If it is lost, the admin uses Share Login or Reset Password, which makes a new temporary password and invalidates the old one.

### Forgot password

There is no email service, so a forgotten password is handled by the admin:

1. On the login page the rider or driver taps Forgot password and enters their email. The page always says the same thing, whether or not the email has an account.
2. If it belongs to an active rider or driver, a request is saved (`passwordRequests` slice). The admin sees a Reset requested tag on the Customers or Drivers list and a count in the sidebar.
3. The admin presses Reset Password (a second click confirms), gets a temporary password shown once, and sends it with the Copy Details button.
4. The person logs in with it and is sent to a page to choose their own password before anything else opens (`ProtectedRoute` for riders, `DriverLayout` for drivers). The request is then closed.

Admin accounts have no request. The admin login page tells the admin to contact the IT team.

Admin login for testing: `admin@ridezilla.test` with `Admin@12345`, set in `src/lib/config.js`. It is the only account created automatically. Change it before showing the project to anyone.

## Driver tracking

The car marker on the rider's, driver's and admin's maps is simulated, because a real feed needs a server. `lib/simulation.js` works the position out from the clock and the times already saved on the booking:

- Assigned: the car starts as far from the pickup as the vehicle covers in its "minutes away" time (3 minutes at 45 km/h is 2.25 km) and drives to the pickup at the vehicle's average speed.
- In progress: the car follows the road route from the pickup to the drop-off and takes the booking's travel time, which is distance divided by average speed. A 68 km hatchback ride at 60 km/h takes about 68 minutes.
- It moves in real time. To make a demo faster, set `SIMULATION_SPEEDUP` in `lib/config.js` (10 makes everything ten times faster).

Nothing extra is stored, so every tab shows the same spot, and the map labels it "Simulated". A real version would send `navigator.geolocation.watchPosition()` from the driver's phone to a server every few seconds and push it to the rider.

## Fare and CO₂

```
fare  = max(minFare, ratePerKm × roadDistanceKm)
saved = distanceKm × (baselineGramsPerKm − vehicleGramsPerKm)
```

| Vehicle | Seats | Rate per km | Minimum fare | Average speed | Longest ride |
|---|---|---|---|---|---|
| E-Bike | 1 | ₹6 | ₹20 | 45 km/h | 20 km |
| E-Rickshaw | 3 | ₹9 | ₹30 | 35 km/h | 10 km |
| Electric Hatchback | 4 | ₹14 | ₹60 | 60 km/h | no limit |
| Electric SUV | 6 | ₹19 | ₹90 | 60 km/h | no limit |

Travel time is worked out from the distance and the vehicle's average speed (`travelMinutes` in `lib/calc.js`): a 30 km hatchback ride is 30 / 60 hours, which is 30 minutes. It is saved on the booking and shown to the rider, the driver and the admin, and the simulated driver uses it too. A vehicle whose longest ride is shorter than the trip shows as "Too far" and cannot be chosen (`withinRange`). The starting speeds and limits are in `public/data/vehicles.json`. The admin can change them on the Pricing page, together with the rate and minimum fare. An empty longest ride means no limit. The changes are saved as overrides in `ridezilla.rates`.

Example: a 5.2 km e-bike ride is 5.2 × 6 = ₹31.

### Emission figures (to complete before submission)

The CO₂ numbers in `public/data/vehicles.json` are illustrative estimates, not measured data. Replace them with sourced values and cite them here.

| Vehicle | g CO₂ per km used | Source |
|---|---|---|
| E-bike | 14 | _to add_ |
| E-rickshaw | 56 | _to add_ |
| Electric hatchback | 91 | _to add_ |
| Electric SUV | 140 | _to add_ |
| Petrol car (baseline) | 150 | _to add_ |
| Petrol SUV (baseline) | 210 | _to add_ |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

Needs Node 20 or newer and an internet connection for the map, place search and routing.

To see a full ride, open three tabs: the client site (register an account), `/admin/login` (register a driver at `/admin/drivers`, then assign a vehicle and the driver to the request), and `/driver/login` (log in with the temporary password and set a new one). Use the start and end codes from the client's booking page.

## Folder structure

```
src/
├── main.jsx                 prepares stored data, then loads mount.jsx
├── mount.jsx                providers: Redux, Router, Toast, Auth
├── App.jsx                  route table (client, admin, driver)
├── api/bootstrap.js         creates the admin account and the starter fleet, once
├── app/store.js             Redux store, saving to storage, cross-tab sync
├── context/                 AuthContext, ToastContext
├── components/              layouts, guards, header, footer, icons, filter bar, pagination, popups
├── pages/                   Home, Faq, NotFound
├── features/
│   ├── auth/                authService (three roles), Login, Register
│   ├── staff/               staff login, set password
│   ├── ride/                rideSlice, search form, place input, map, geocode, routing
│   ├── vehicles/            vehiclesSlice, rides page, vehicle card
│   ├── bookings/            bookingsSlice, rideLifecycle, booking pages, start and end codes
│   ├── fleet/ drivers/      fleetSlice (with starter fleet), driversSlice
│   ├── support/             supportSlice, ChatThread, SupportInbox
│   ├── admin/               layout, overview, requests, drivers, fleet, pricing, support
│   ├── driver/              layout, my ride, code form, history, profile
│   └── dashboard/           dashboard page, monthly chart, level ring, vehicle mix
├── hooks/                   useDebounce, usePagination
├── lib/                     config, calc, format, http, storage, stats, clipboard
└── styles/                  base, layout, components, pages, staff, responsive
public/data/vehicles.json    vehicle catalogue
```

## Limits and future work

- A server and database would replace localStorage, with real authentication and role checks on every request.
- The start and end codes should be created and checked on the server, and sent to the rider by SMS or push.
- Real driver location from the phone's GPS instead of the simulation.
- Online payment.
- Assignment suggestions by distance from the pickup, using the fleet's city.
- Sourced emission figures (see above).

## Team

| Member | Roll number |
|---|---|
| Ananya Gupta | 2510992593 |
| Mansi Gupta | 2510993695 |
