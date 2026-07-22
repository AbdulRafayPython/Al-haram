# Sasta Travel Express — Mobile / Admin REST API

REST endpoints for the mobile app. **Reads are public**; **writes require an admin
login token**. Built as Next.js Route Handlers under `web/src/app/api/**`.

- **Base URL:** your deployed site, e.g. `https://sastatravel.com/api`
  (local dev: `http://localhost:3000/api`)
- **Content type:** `application/json` on every request that has a body
  (except the two image-upload endpoints, which are `multipart/form-data`).
- **CORS:** open (`Access-Control-Allow-Origin: *`); preflight `OPTIONS` is handled.

## Response envelope

Every response is JSON with an `ok` flag — check it first.

```jsonc
// success
{ "ok": true, "data": { ... }, "count": 10, "warnings": [ ... ] }
// failure
{ "ok": false, "error": "Human-readable message", "details": ["field error", ...] }
```

`count` appears on list endpoints. `warnings` appears on package create/update
(non-blocking notes). `details` appears on validation failures (HTTP 422).

| Status | Meaning |
|---|---|
| 200 / 201 | Success |
| 400 | Bad request (missing/invalid field, malformed JSON) |
| 401 | Missing or invalid token |
| 403 | Valid token but not an admin |
| 404 | Not found |
| 409 | Conflict (e.g. deleting a hotel still used by a package) |
| 422 | Validation failed — see `details[]` |

---

## Authentication

Single admin account (Supabase Auth). Flow: **log in → store the tokens → send the
access token on every write → refresh when it expires.**

### `POST /api/admin/login`
```json
{ "email": "admin@example.com", "password": "••••••" }
```
Returns:
```jsonc
{ "ok": true, "data": {
  "accessToken":  "eyJ...",     // send this as the Bearer token on writes
  "refreshToken": "xyz...",     // use to get a new access token
  "expiresIn": 3600,            // seconds
  "expiresAt": 1784731156,      // unix seconds
  "user": { "id": "...", "email": "...", "role": "admin" }
} }
```
A valid non-admin account is rejected with **403**. Wrong credentials → **401**.

### Sending the token
On every admin (write) request add the header:
```
Authorization: Bearer <accessToken>
```

### `POST /api/admin/refresh`
```json
{ "refreshToken": "xyz..." }
```
Returns a fresh `accessToken` + `refreshToken` (same shape as login). Call this when
a request returns 401 or shortly before `expiresAt`.

### `GET /api/admin/me`  *(Bearer)*
Confirms a stored token is still valid → `{ "ok": true, "data": { id, email, role } }`.
Good for a splash-screen check on app launch.

---

## Packages

### `GET /api/packages`
Public list. Query params (all optional):

| Param | Values | Notes |
|---|---|---|
| `status` | `published` (default) · `all` · `unpublished` | `all`/`unpublished` **require an admin Bearer token** |
| `city` | departure city code, e.g. `KHI` | |
| `airline` | exact airline name | |
| `featured` | `true` | only featured packages |

Returns `data: Package[]` (see shape below) + `count`.

### `GET /api/packages/:id`
Single package. Public for published ones; unpublished only with an admin token.

### `GET /api/packages/sample`
Returns the copy-paste **template** + field guide for create/update
(`{ sample, sampleRaw, fields }`). Handy to build your form from.

### `POST /api/packages/create`  *(admin)*
Body = the package JSON below (hotels / city / airline **by name**, resolved against
existing records). Optional `isPublished` (defaults to **true** — a new package is
live immediately unless you send `false`).

```jsonc
{
  "title": "Premium Umrah — Karachi",
  "departureCity": "Karachi",          // name or "Karachi (KHI)"
  "departureCityCode": "KHI",          // must match a city in GET /api/cities
  "airline": "Saudi Arabian Airlines", // must match GET /api/airlines
  "departureDate": "2026-08-22",       // YYYY-MM-DD
  "durationDays": 20,
  "makkahHotel": "Hilton Suites Makkah",           // must be a Makkah hotel
  "madinahHotel": "Anwar Al Madinah Movenpick",    // must be a Madinah hotel
  "makkahNights": 11,
  "madinahNights": 9,
  "roomTypes": ["Quad", "Triple", "Double"],       // any of Sharing/Quad/Triple/Double
  "prices": {                                       // a price (>0) for EVERY offered tier
    "quad": 285000, "triple": 320000, "double": 360000,
    "infant": 75000, "childNoBed": 120000           // infant/childNoBed optional
  },
  "baggage": "30KG",                                // optional
  "seatsTotal": 40, "seatsAvailable": 40,           // optional (default 40/40)
  "flight": {                                        // optional block; times are 24h HH:MM
    "route": "KHI → JED → KHI",
    "outboundNo": "SV-761", "inboundNo": "SV-762",
    "departureTime": "19:20", "arrivalTime": "00:20",
    "departureDate": "2026-08-22", "arrivalDate": "2026-09-12"
  },
  "packageCode": "BM-101480", "groupCode": "BM-101480", "featured": false,
  "isPublished": true
}
```
On success → `201` with the created package as `data`. Validation problems → `422`
with every issue listed in `details[]` (e.g. *"Unknown airline … use one of: …"*).

### `POST /api/packages/update`  *(admin)* — partial
Send `id` plus **only the fields that change**. This is the "edit rates from the
phone" endpoint. We rebuild the package, merge your fields, and re-validate the
whole thing, so the result is always valid.

```jsonc
{ "id": "…", "prices": { "quad": 290000 } }   // change one price, others preserved
{ "id": "…", "seatsAvailable": 12 }           // update remaining seats
{ "id": "…", "isPublished": false }           // hide it
{ "id": "…", "flight": { "departureTime": "20:15" } }  // tweak one flight field
```
`prices` and `flight` merge one level deep (other tiers/legs are kept). Send
`"flight": null` to remove the flight block. Returns the full updated package.

### `POST /api/packages/publish`  *(admin)*
```json
{ "id": "…", "isPublished": true }
```
Show/hide on the public site without touching anything else.

### `POST /api/packages/delete`  *(admin)*
```json
{ "id": "…" }
```

**Package shape returned by GET / create / update:**
```jsonc
{
  "id": "…", "title": "…",
  "airline": "PIA", "airlineLogoUrl": "https://…/logo.webp",
  "departureCity": "Lahore (LHE)", "departureCityCode": "LHE",
  "durationDays": 19, "departureDate": "2026-08-01", "returnDate": "2026-08-20",
  "makkahHotel": { "id": "…", "name": "…", "city": "Makkah", "location": "…", "distance": "…" },
  "madinahHotel": { … } ,
  "makkahNights": 11, "madinahNights": 8,
  "roomTypes": ["Quad","Double"],
  "prices": { "sharing": null, "quad": 215000, "triple": null, "double": 280000, "infant": 50000, "childNoBed": 90000 },
  "pricePkr": 215000,                       // cheapest offered tier ("from" price)
  "baggage": "30KG",
  "seatsTotal": 30, "seatsAvailable": 12,
  "flight": { "route": "…", "outboundNo": "…", "inboundNo": "…", "departureTime": "19:20", "arrivalTime": "00:20", "departureDate": "…", "arrivalDate": "…" },
  "packageCode": "…", "groupCode": "…",
  "featured": false, "isPublished": true,
  "createdAt": "…", "updatedAt": "…"
}
```

---

## Hotels

### `GET /api/hotels`  *(public)*
Optional `?city=Makkah|Madinah`. Includes per-night SAR `rates`.

### `POST /api/hotels/create`  *(admin)*
```json
{ "name": "Hilton Suites Makkah", "city": "Makkah", "location": "Central Area",
  "distance": "300 METER", "rateSharing": 0, "rateDouble": 500, "rateTriple": 400, "rateQuad": 300 }
```
`city` must be `Makkah` or `Madinah`; `rateDouble/Triple/Quad` must be > 0;
`rateSharing` optional.

### `POST /api/hotels/update`  *(admin)* — partial
`{ "id": "…", ...fields }` — send only what changes.

### `POST /api/hotels/delete`  *(admin)*
`{ "id": "…" }` — **409** if a package still references the hotel.

### `POST /api/hotels/image`  *(admin, multipart/form-data)*
Fields: `hotelId` (required) + `file` (image) **or** `remove=true`.
```bash
curl -X POST https://sastatravel.com/api/hotels/image \
  -H "Authorization: Bearer <token>" \
  -F hotelId=<id> -F file=@hotel.jpg
```

---

## Airlines

### `GET /api/airlines`  *(public)*
`data: [{ id, name, logoUrl, isActive }]`.

### `POST /api/airlines/create`  *(admin)*
`{ "name": "AirBlue" }` — idempotent (re-adding returns the existing record).

### `POST /api/airlines/logo`  *(admin, multipart/form-data)*
Fields: `airlineId` (required) + `file` (image, auto-converted to WebP) **or**
`remove=true`.

---

## Cities

### `GET /api/cities`  *(public)*
`data: [{ id, code, name, isActive }]`.

### `POST /api/cities/create`  *(admin)*
`{ "name": "Karachi", "code": "KHI" }` — code ≤ 4 chars, idempotent on code.

### `POST /api/cities/update`  *(admin)*
`{ "id": "…", "name": "…", "code": "…" }` — **409** if the code is taken.

### `POST /api/cities/delete`  *(admin)*
`{ "id": "…" }` — only removes it from future pickers; existing packages keep their
city text.

---

## Leads (admin, read-only)

### `GET /api/bookings`  *(admin)*
`?limit=` (default 100, max 500). Booking requests from the public "Book Now" flow,
newest first, each with a nested `package` summary.

### `GET /api/contacts`  *(admin)*
`?limit=` (default 100, max 500). Contact-form submissions, newest first.

---

## Quick start (pseudo-code)

```js
// 1) log in once, keep the tokens
const { data } = await (await fetch(`${BASE}/api/admin/login`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
})).json();
const token = data.accessToken;

// 2) read packages (no token needed)
const list = await (await fetch(`${BASE}/api/packages`)).json();

// 3) change a rate (token needed)
await fetch(`${BASE}/api/packages/update`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
  body: JSON.stringify({ id: packageId, prices: { quad: 290000 } }),
});
```

> **Note:** `GET /api` returns a live directory of all endpoints — a good
> connectivity check from the app.
