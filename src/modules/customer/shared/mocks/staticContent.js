/**
 * Copy for the static/legal pages.
 *
 * Keyed by route slug so one page component renders all of them; replace this
 * object with a CMS fetch and the pages themselves need no changes.
 */
export const STATIC_PAGES = {
  about: {
    title: 'About MEDIQ',
    subtitle: 'A licensed online pharmacy built around pharmacist-verified care.',
    sections: [
      {
        heading: 'What we do',
        body: 'MEDIQ delivers genuine medicines, wellness products and home diagnostics across India. Every order is checked by a registered pharmacist before it is dispatched, and prescription medicines are dispensed only against a valid prescription.',
      },
      {
        heading: 'How we source',
        body: 'We buy directly from manufacturers and authorised distributors. Every batch is tracked with its expiry and licence details, and cold-chain items travel in temperature-controlled packaging.',
      },
      {
        heading: 'Our licences',
        body: 'Drug licence KA-B01-123456 · FSSAI 11223344556677. Our diagnostic partners are NABL accredited, and payments run over 256-bit SSL.',
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use and protect your health and account data.',
    sections: [
      {
        heading: 'What we collect',
        body: 'Account details (name, email, phone), delivery addresses, order history, prescriptions you upload and payment metadata. We do not store full card numbers — those stay with our payment processor.',
      },
      {
        heading: 'How we use it',
        body: 'To dispense and deliver your orders, to let a pharmacist verify prescriptions, to run refill reminders you have opted into, and to meet the record-keeping the law requires of a licensed pharmacy.',
      },
      {
        heading: 'Who we share it with',
        body: 'Delivery partners receive only what is needed to reach you. Diagnostic partners receive test bookings. We do not sell personal or health data to advertisers.',
      },
      {
        heading: 'Your choices',
        body: 'You can view and edit your profile and addresses at any time, download your order history, and request deletion of your account. Prescription records may be retained where pharmacy regulations require it.',
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    subtitle: 'The agreement between you and MEDIQ when you use this service.',
    sections: [
      {
        heading: 'Using the service',
        body: 'You must be 18 or older to place an order. Keep your account credentials secure — orders placed from a signed-in session are treated as yours.',
      },
      {
        heading: 'Prescriptions',
        body: 'Prescription medicines are dispensed only against a valid, legible prescription from a registered practitioner. We may decline or hold an order pending pharmacist verification.',
      },
      {
        heading: 'Pricing and payment',
        body: 'Prices include applicable taxes unless stated otherwise. Delivery and packaging fees are shown on the bill before you pay. Offers may be withdrawn or changed at any time.',
      },
      {
        heading: 'Returns',
        body: 'Unopened, non-temperature-sensitive items can be returned within 7 days of delivery. For safety reasons we cannot accept returns of opened medicines, cold-chain products or personal-use items.',
      },
      {
        heading: 'Liability',
        body: 'MEDIQ is a dispensing pharmacy, not a substitute for medical advice. Always follow your practitioner’s guidance and read the leaflet supplied with your medicine.',
      },
    ],
  },
}

export const STATIC_PAGE_SLUGS = Object.keys(STATIC_PAGES)
