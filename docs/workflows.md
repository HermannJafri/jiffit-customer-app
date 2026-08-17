# Customer app workflows

Expo + TypeScript rebuild of the Flutter customer app. Brand purple `#7C3AED`.

## Navigation (target)

Splash → Welcome → Phone → OTP → Location (if needed) → Tabs: Home, Bookings, Refer, Profile.

Catalog: category → group → service detail → cart → payment → success / Zoho WebView.

Account: wallet, addresses, packages, help/chat, ratings, legal.

## Booking

1. Location-scoped catalog
2. Address book
3. Slot pool (not a second slot API)
4. Cash or Zoho hosted checkout
5. Idempotent `POST /customer/me/bookings`
6. Pending Zoho recovery if the app is killed mid-checkout
7. Detail: cancel (rules), convert to cash, rate, invoice, live hero map

## Implemented in this rebuild

Splash → phone OTP → session persistence → Home catalog → service/variant → address book → capacity-pool slots → cash or Zoho checkout (mock pay if Zoho is unconfigured) → booking history/cancel.

`EXPO_PUBLIC_API_BASE_URL` defaults to `http://localhost:5000/api/v1`.

Live OTP/SMS: BLOCKED BY CREDENTIAL (dev OTP mode on the backend). Google Maps picker: BLOCKED BY CREDENTIAL (manual lat/lng on addresses).
