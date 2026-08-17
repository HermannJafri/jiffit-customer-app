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

## Out of scope until specified

Customer self-reschedule. Marketing PWA.
